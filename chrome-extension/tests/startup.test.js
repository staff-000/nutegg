const test = require('node:test');
const assert = require('node:assert/strict');
const { EnvironmentService } = require('../src/popup/services/environment-service.js');
const { SettingsState } = require('../src/popup/state/settings-state.js');
const { TabStateManager } = require('../src/popup/state/tab-state.js');
const { deferred } = require('./helpers/popup-fixture');
for (const online of [true, false]) test(`readiness for online=${online} does not wait for balance`, async () => {
  const credit = deferred(); const calls = [];
  const chromeApi = { runtime: { sendMessage: async ({ action }) => {
    calls.push(action);
    if (action === 'check-server') return { online };
    if (action === 'config-status') return { issues: [] };
    if (action === 'check-chrome-ai') return { enabled: true, configured: true };
    if (action === 'get-credit' || action === 'check-chrome-credit') return credit.promise;
    return {};
  } } };
  const settings = new SettingsState(), store = new TabStateManager();
  const env = new EnvironmentService({ settings, store, chromeApi });
  await env.checkServerStatus();
  assert.equal(settings.serverOnline, online); assert.equal(store.environment.credit, null);
  assert(calls.includes(online ? 'get-credit' : 'check-chrome-credit'));
  credit.resolve({ balanceFormatted: '$10' }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(store.environment.credit.balanceFormatted, '$10');
});
test('environment requests are deduplicated, and superseded status/credit never commits', async () => {
  const a = deferred(), b = deferred(); let requests = 0;
  const store = new TabStateManager(), settings = new SettingsState();
  const env = new EnvironmentService({ store, settings, chromeApi: { runtime: { sendMessage: ({ action }) => {
    if (action === 'check-server') return ++requests === 1 ? a.promise : b.promise;
    return Promise.resolve(action === 'check-chrome-ai' ? { enabled: true, configured: true } : { issues: [] });
  } } } });
  const first = env.checkServerStatus(); assert.equal(first, env.checkServerStatus());
  const second = env.checkServerStatus(true); b.resolve({ online: false }); await second;
  a.resolve({ online: true }); await first; assert.equal(settings.serverOnline, false);
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

test('popup declares every script in dependency order and has no writable session', () => {
  const fs = require('node:fs'); const path = require('node:path');
  const htmlPath = require.resolve('../src/popup/popup.html'); const html = fs.readFileSync(htmlPath, 'utf8');
  const scripts = [...html.matchAll(/<script defer src="([^"]+)"/g)].map(match => match[1]);
  for (const script of scripts) assert(fs.existsSync(path.resolve(path.dirname(htmlPath), script)), script);
  assert(scripts.indexOf('../../dist/ai-core.js') < scripts.indexOf('services/popup-operations.js'));
  assert(scripts.indexOf('ui/popup-renderer.js') < scripts.indexOf('popup.js'));
  assert(!scripts.includes('state/session-state.js'));
});

test('the actual popup scripts wire Egg Analysis clicks, loading, responses and cached feedback', async t => {
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
  const { createMockRoot } = require('./helpers/mock-dom');
  const root = createMockRoot(); root.querySelectorAll = () => []; root.addEventListener = () => {}; root.visibilityState = 'visible';
  root.getElementById('analyze-btn').classList.add('inactive'); // Initial popup.html styling.
  const oldGet = root.getElementById.bind(root); root.getElementById = id => id === 'popup-styles' ? null : oldGet(id);
  const requests = [], ports = [];
  const api = { runtime: { getManifest: () => ({ version: '1' }), sendMessage: async ({ action }) => action === 'history' ? { history: [] } : action === 'config-status' ? { issues: [] } : { online: true }, connect: () => {
    const port = { onMessage: { addListener: fn => { port.respond = fn; } }, onDisconnect: { addListener() {} },
      postMessage: message => { if (message.action === 'analyze') requests.push(message); }, disconnect() {} };
    ports.push(port); return port;
  } },
    tabs: { query: async () => [{ id: 1, windowId: 7 }], get: async id => ({ id, title: 'Page', url: 'https://one.test', status: 'complete' }),
      onActivated: { addListener() {} }, onUpdated: { addListener() {} }, onRemoved: { addListener() {} }, onAttached: { addListener() {} }, onDetached: { addListener() {} } },
    storage: { local: { get: (keys, callback) => callback({}), set() {} }, onChanged: { addListener() {} } } };
  const intervals = new Set(); t.after(() => { for (const timer of intervals) clearInterval(timer); });
  const context = vm.createContext({ console, crypto: require('node:crypto').webcrypto, structuredClone, setTimeout, clearTimeout,
    setInterval: (...args) => { const timer = setInterval(...args); intervals.add(timer); return timer; }, clearInterval, document: root,
    chrome: api, navigator: { language: 'en' }, window: { addEventListener() {}, scrollTo() {}, scrollY: 0 }, module: { exports: {} } });
  vm.runInContext('Object.assign(globalThis, window); window = globalThis;', context);
  root.body = { classList: { remove() {} } };
  const popupPath = require.resolve('../src/popup/popup.html');
  const scripts = [...fs.readFileSync(popupPath, 'utf8').matchAll(/<script defer src="([^"]+)"/g)].map(match => match[1]);
  for (const script of scripts) vm.runInContext(fs.readFileSync(path.resolve(path.dirname(popupPath), script), 'utf8'), context, { filename: script });
  // Browser globals belong to window; the VM exposes them through globalThis too.
  // The real PageExtractor is replaced only at its transport boundary.
  vm.runInContext('pageExtractor.extractPage = async () => ({ title: "Page", url: "https://one.test", content: "Captured content" });', context);
  await context.module.exports.initPopup();
  assert.equal(context.module.exports.tabStateManager.getTab(1).extractedContent.content, 'Captured content');
  assert.equal(root.getElementById('capture-state').classList.contains('hidden'), false);
  assert.equal(root.getElementById('analyze-btn').disabled, false);
  assert.equal(root.getElementById('analyze-btn').classList.contains('inactive'), false);
  const store = context.module.exports.tabStateManager;
  store.dispatch({ type: 'historySelected', tabId: 1, entry: { nutId: 1, url: 'https://one.test', content: 'Captured content',
    result: { stage: 'stage1', mode: 'obsidian', matchedEggs: ['a.md'] } } });
  const button = root.getElementById('stage1-proceed-btn');
  assert.equal(button.disabled, false);
  button.click();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].payload.stage, 2);
  assert.equal(button.disabled, true);
  assert.equal(root.getElementById('egg-analysis-label').textContent, context.t('analyzingEggs'));
  ports[0].respond({ stage: 'stage2', mode: 'obsidian', eggResults: [{ egg: 'a.md', extractedEntries: [{ content: 'Click result' }], keyQuestionAnswers: [] }] });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(button.disabled, false);
  assert.equal(root.getElementById('egg-knowledge-section').classList.contains('hidden'), false);
  assert(root.getElementById('egg-knowledge-content').innerHTML.includes('Click result'));
  button.click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests.length, 1, 'Cached clicks must not repeat AI calls');
  assert.equal(root.getElementById('success-banner').classList.contains('hidden'), false);
  assert.equal(root.getElementById('success-message').textContent, context.t('cachedEggAnalysisShown'));
  store.dispatch({ type: 'draft', tabId: 1, values: { selectedEggs: ['b.md'] } });
  button.click();
  assert.equal(requests.length, 2); assert.equal(button.disabled, true);
  ports[1].respond({ error: 'Cannot reach Obsidian', errorCode: 'network_error' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(button.disabled, false);
  assert.equal(root.getElementById('error-banner').classList.contains('hidden'), false);
  assert.equal(root.getElementById('error-message').textContent, 'Cannot reach Obsidian');
  assert(root.getElementById('egg-knowledge-content').innerHTML.includes('Click result'));
  store.dispatch({ type: 'draft', tabId: 1, values: { selectedEggs: ['a.md'] } });
  button.click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests.length, 2);
  assert.equal(root.getElementById('error-banner').classList.contains('hidden'), true);
  assert.equal(root.getElementById('success-message').textContent, context.t('cachedEggAnalysisShown'));
  let created, saved;
  api.runtime.sendMessage = async message => {
    if (message.action === 'create-egg') { created = message; return { success: true, path: 'nutegg/new.md' }; }
    if (message.action === 'confirm') { saved = message.payload; return { success: true }; }
    return {};
  };
  root.getElementById('eggs-new-name').value = 'New';
  root.getElementById('eggs-new-desc').value = '知识范围';
  root.getElementById('eggs-create-btn').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(created.description, '知识范围');
  assert.equal(requests.length, 2, 'Creating an egg must not initiate an analysis request');
  assert.deepEqual([...store.getTab(1).selectedEggs], ['a.md', 'nutegg/new.md']);
  assert.equal(root.getElementById('confirm-btn').disabled, true);
  assert.equal(root.getElementById('confirm-btn').title, context.t('hatchAnalyzeSelectedEggs'));
  button.click();
  assert.equal(requests.length, 3);
  assert.deepEqual([...requests[2].payload.eggs], ['nutegg/new.md']);
  ports[2].respond({ stage: 'stage2', mode: 'obsidian', eggResults: [{ egg: 'nutegg/new.md', extractedEntries: [{ content: 'New egg insight' }], keyQuestionAnswers: [] }] });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(root.getElementById('confirm-btn').disabled, false);
  root.getElementById('confirm-btn').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(saved.newKnowledge.some(entry => entry.egg === 'nutegg/new.md'));
});
