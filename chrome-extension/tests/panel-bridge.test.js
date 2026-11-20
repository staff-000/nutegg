const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const { TabStateManager } = require('../src/popup/state/tab-state');
const { MetricsComponent } = require('../src/popup/ui/metrics');
async function fixture(t) {
  const dom = new JSDOM('<div class="popup-container"></div><div id="debug-info"></div>', {
    url: 'https://extension.test/panel',
    runScripts: 'outside-only',
  });
  t.after(() => dom.window.close());
  const win = dom.window,
    sent = [];
  win.chrome = {
    tabs: { query: async () => [{ id: 1 }], get: async () => ({ url: 'https://example.com/article' }) },
    storage: { session: { get: async () => ({}) } },
    runtime: {
      sendMessage: async message => {
        sent.push(message);
        return {
          settings: { migrationHint: true },
          decision: { minutes: null, contentAvailable: false, provenance: 'local' },
        };
      },
    },
  };
  for (const file of ['i18n.js', 'panel/rules.js', '../dist/page-identity.js', 'panel/panel-bridge.js'])
    win.eval(fs.readFileSync(require.resolve('../src/' + file), 'utf8'));
  const manager = new TabStateManager();
  manager.ensure(1, 'https://example.com/article');
  manager.activateTab(1);
  await win.NutEggPanel.ready;
  await win.NutEggPanel.mount({ manager });
  return { win, manager, sent };
}
test('capture refreshes reading metrics through tab state and classification is debug-only', async t => {
  const { win, manager, sent } = await fixture(t);
  assert.equal(manager.getTab(1).panelClassification.minutes, null);
  const extraction = manager.beginOperation(1, 'extraction');
  manager.commitOperation(extraction.token, {
    type: 'extracted',
    content: { content: 'word '.repeat(600), url: 'https://example.com/article' },
  });
  assert.equal(manager.getTab(1).panelClassification.minutes, 3);
  assert.equal(manager.getTab(1).panelClassification.contentAvailable, true);
  assert.equal(win.document.querySelector('.panel-classification'), null);
  assert.equal(win.document.querySelector('.panel-status').classList.contains('hidden'), true);
  assert.ok(sent.some(message => message.action === 'panel-capture-metrics' && message.minutes === 3));
  global.t = win.NutEggI18n.t;
  const metrics = new MetricsComponent(win.document);
  metrics.renderDebug(null, true, { view: manager.viewModel() });
  assert.match(
    win.document.getElementById('debug-info').textContent,
    /3 min read.*Main content available.*Fetched content/
  );
  metrics.renderDebug(null, false, { view: manager.viewModel() });
  assert.equal(win.document.getElementById('debug-info').textContent, '');
});
test('a description without a transcript does not become known reading time', async t => {
  const { win } = await fixture(t);
  const result = win.NutEggPanel.classifyCapture({ content: 'Description '.repeat(600), transcriptAvailable: false });
  assert.equal(result.minutes, null);
  assert.equal(result.contentAvailable, false);
});
test('compact header icon controls have localized popup hints and no extra mode bar', async t => {
  const { win, manager } = await fixture(t);
  assert.equal(win.document.querySelector('.panel-smart-rule-bar'), null);
  win.NutEggPanel.context = { tabId: 1, key: 'https://example.com/article', settings: {} };
  await win.NutEggPanel.mount({ manager });
  assert.equal(win.document.querySelector('.panel-mode-bar'), null);
  assert.ok(win.document.querySelector('.panel-smart-rule-bar'));
  const close = win.document.querySelector('.panel-close-button');
  assert.equal(close.getAttribute('data-hint'), 'Close NutEgg');
  assert.equal(close.getAttribute('aria-label'), 'Close NutEgg');
  assert.ok(win.document.querySelector('.panel-switch-icon-btn').getAttribute('data-hint'));
  assert.equal(win.document.querySelector('.panel-collapse-button'), null);
});

test('manual open shows ring icon immediately and switches to mute once auto-open rule matches', async t => {
  const { win, manager } = await fixture(t);
  let suggestionDecision = { open: false, ruleId: null };
  win.chrome.runtime.sendMessage = async message => {
    if (message.action === 'panel-get-suggestion') {
      return { hostname: 'example.com', automatic: false, decision: suggestionDecision };
    }
    if (message.action === 'panel-capture-metrics') {
      suggestionDecision = { open: true, ruleId: 'allow-example' };
      return { ok: true, decision: suggestionDecision };
    }
    return { settings: {}, decision: suggestionDecision };
  };
  win.NutEggPanel.context = { tabId: 1, key: 'https://example.com/article', automatic: false, settings: {} };
  await win.NutEggPanel.mount({ manager });
  const initialTrigger = win.document.querySelector('.smart-rule-trigger');
  assert.ok(initialTrigger);
  assert.equal(initialTrigger.classList.contains('is-active'), true);
  assert.equal(initialTrigger.classList.contains('is-muted'), false);

  const extraction = manager.beginOperation(1, 'extraction');
  manager.commitOperation(extraction.token, {
    type: 'extracted',
    content: { content: 'word '.repeat(600), url: 'https://example.com/article', metadata: { author: 'Alice' } },
  });
  await new Promise(resolve => setTimeout(resolve, 10));
  const updatedTrigger = win.document.querySelector('.smart-rule-trigger');
  assert.ok(updatedTrigger);
  assert.equal(updatedTrigger.classList.contains('is-muted'), true);
  assert.equal(updatedTrigger.classList.contains('is-active'), false);
});

test('switching from native chrome panel to web panel closes the native window on success', async t => {
  const { win } = await fixture(t);
  let closed = 0;
  win.close = () => { closed++; };
  let switchResponse = { ok: true };
  win.chrome.runtime.sendMessage = async message => {
    if (message.action === 'panel-switch') return switchResponse;
    return {};
  };
  const switchBtn = win.document.querySelector('.panel-switch-icon-btn');
  switchBtn.click();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(closed, 1);

  switchResponse = { error: 'panelRestricted' };
  switchBtn.click();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(closed, 1);
  assert.equal(win.document.querySelector('.panel-status').classList.contains('hidden'), false);
});
