const test = require('node:test');
const assert = require('node:assert/strict');
const { EnvironmentService } = require('../src/popup/services/environment-service.js');
const { SettingsState } = require('../src/popup/state/settings-state.js');

// Exercise the readiness contract used by TabAction.refreshForCurrentTab:
// a pending balance endpoint must not hold up content extraction.
for (const online of [false, true]) {
  test(`${online ? 'Obsidian' : 'standalone'} startup becomes ready while balance is still pending`, async t => {
    const originalChrome = globalThis.chrome;
    t.after(() => { globalThis.chrome = originalChrome; });
    const calls = [];
    let resolveCredit;
    const credit = new Promise(resolve => { resolveCredit = resolve; });
    globalThis.chrome = { runtime: { sendMessage: async ({ action }) => {
      calls.push(action);
      if (action === 'check-server') return { online, version: '0.2.3' };
      if (action === 'config-status') return { issues: [] };
      if (action === 'check-chrome-ai') return { enabled: true, configured: true, provider: 'deepseek' };
      if (action === 'get-credit' || action === 'check-chrome-credit') return credit;
      throw new Error(`Unexpected request ${action}`);
    } } };
    const settings = new SettingsState();
    let statusReady = false;
    let renderedCredit = null;
    const env = new EnvironmentService({ settings, headerUI: {
      updateVersion() {}, updateServerStatus() {}, hideCredit() {},
      renderCredit(value) { renderedCredit = value; },
    } });
    const readiness = env.checkServerStatus(() => { statusReady = true; });
    // Flush local readiness messages without resolving the credit request.
    // Use a bounded race so a regression fails rather than hanging the suite.
    let timer;
    const ready = await Promise.race([
      readiness.then(() => true),
      new Promise(resolve => { timer = setTimeout(() => resolve(false), 100); }),
    ]);
    clearTimeout(timer);
    assert.equal(ready, true, 'Readiness must not wait for credit');
    assert.equal(statusReady, true);
    assert.equal(settings.serverOnline, online);
    assert.equal(online ? settings.obsidianAiConfigured : settings.chromeAiConfigured, true);
    assert.equal(renderedCredit, null);
    assert.ok(calls.includes(online ? 'get-credit' : 'check-chrome-credit'));
    // The eventual response still refreshes the credit pill.
    resolveCredit({ balanceFormatted: '¥10' });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(renderedCredit.balanceFormatted, '¥10');
  });
}

test('unconfigured standalone mode does not request credit', async t => {
  const originalChrome = globalThis.chrome;
  t.after(() => { globalThis.chrome = originalChrome; });
  const calls = [];
  globalThis.chrome = { runtime: { sendMessage: async ({ action }) => {
    calls.push(action);
    return action === 'check-server' ? { online: false } : { enabled: false, configured: false };
  } } };
  await new EnvironmentService({ settings: new SettingsState() }).checkServerStatus();
  assert.deepEqual(calls, ['check-server', 'check-chrome-ai']);
});


for (const cachedStyles of [false, true]) {
  test(`startup frame remains available while ${cachedStyles ? 'cached' : 'pending'} styles initialize`, () => {
    const fs = require('node:fs');
    const vm = require('node:vm');
    const stylesheet = {
      sheet: cachedStyles ? {} : null, media: 'print',
      addEventListener(type, listener) { if (type === 'load') this.onLoad = listener; else this.onError = listener; },
    };
    const app = { inert: true, busy: true, removeAttribute(name) { assert.equal(name, 'aria-busy'); this.busy = false; } };
    const classes = new Set(['booting']);
    const context = { document: {
      getElementById: id => id === 'popup-styles' ? stylesheet : id === 'popup-app' ? app : null,
      body: { classList: { remove: name => classes.delete(name) } },
    } };
    vm.runInNewContext(fs.readFileSync(require.resolve('../src/popup/startup-frame.js'), 'utf8'), context);
    assert.equal(stylesheet.media, cachedStyles ? 'all' : 'print');
    assert.equal(app.inert, true, 'Controls remain inactive until handlers are wired');
    assert.equal(classes.has('booting'), true, 'Static frame stays visible during initialization');
    context.NutEggStartup.finish();
    if (!cachedStyles) {
      assert.equal(app.inert, true, 'Keep the frame while styles are still pending');
      assert.equal(classes.has('booting'), true);
      stylesheet.onLoad();
    }
    assert.equal(stylesheet.media, 'all');
    assert.equal(app.inert, false);
    assert.equal(app.busy, false);
    assert.equal(classes.has('booting'), false);
  });
}
