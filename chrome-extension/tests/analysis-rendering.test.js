const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { JSDOM, VirtualConsole } = require('jsdom');
async function popup(t, options = {}) {
  const popupPath = require.resolve('../src/popup/popup.html');
  const html = fs.readFileSync(popupPath, 'utf8'), requests = [], ports = [], errors = [];
  const console = new VirtualConsole(); console.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(html, { url: 'https://extension.test/src/popup/popup.html', runScripts: 'outside-only', virtualConsole: console });
  t.after(() => dom.window.close());
  const context = dom.getInternalVMContext();
  context.module = { exports: {} }; context.structuredClone = structuredClone;
  Object.defineProperty(dom.window, 'crypto', { value: require('node:crypto').webcrypto });
  context.scrollTo = () => {};
  const intervals = new Set(); t.after(() => intervals.forEach(clearInterval));
  context.setInterval = (...args) => { const timer = setInterval(...args); intervals.add(timer); return timer; };
  context.clearInterval = clearInterval;
  context.chrome = { runtime: { getManifest: () => ({ ...require('../manifest.json'), version: '1' }),
    sendMessage: async ({ action }) => action === 'history' ? { history: options.history || [] } : action === 'config-status' ? { issues: [] } : { online: true },
    connect: () => { const port = { onMessage: { addListener: fn => { port.respond = fn; } }, onDisconnect: { addListener() {} },
      postMessage: message => { if (message.action === 'analyze') requests.push(message);
        if (message.action === 'subscribe') queueMicrotask(() => port.respond({ type: 'snapshot', jobs: [], sessionId: 'dom-test' })); }, disconnect() {} };
      ports.push(port); return port; } },
    tabs: { query: async () => [{ id: 1, windowId: 7 }], get: async id => ({ id, title: 'Page', url: 'https://one.test', status: 'complete' }),
      onActivated: { addListener() {} }, onUpdated: { addListener() {} }, onRemoved: { addListener() {} }, onAttached: { addListener() {} }, onDetached: { addListener() {} } },
    storage: { local: { get: (_keys, callback) => callback({ connectionMode: 'obsidian', analysisMode: 'preview' }), set() {} }, onChanged: { addListener() {} } } };
  for (const [, script] of html.matchAll(/<script defer src="([^"]+)"/g))
    vm.runInContext(fs.readFileSync(path.resolve(path.dirname(popupPath), script), 'utf8'), context, { filename: script });
  context.testCaptures = 0;
  vm.runInContext('pageExtractor.extractPage = async () => { testCaptures++; return { title: "Page", url: "https://one.test", content: "Captured content" }; };', context);
  await context.module.exports.initPopup();
  return { root: dom.window.document, context, store: context.module.exports.tabStateManager, requests, ports, errors, captures: () => context.testCaptures };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('real popup DOM renders Analyze progress, partial failure, retry, and recovered sections', async t => {
  const f = await popup(t);
  f.root.getElementById('analyze-btn').click(); await tick();
  assert.equal(f.requests.length, 1);
  f.ports.at(-1).respond({ type: 'partial', section: 'summary', data: { coreSummary: ['Successful summary'], titleVerdict: 'A clear answer' } });
  await tick();
  assert.equal(f.root.getElementById('results-state').classList.contains('hidden'), false);
  assert.match(f.root.getElementById('core-summary').textContent, /Successful summary/);
  f.ports.at(-1).respond({ type: 'complete', result: { stage: 'stage1', coreSummary: ['Successful summary'], titleVerdict: 'A clear answer',
    analysisFailures: [{ section: 'mindmap', code: 'timeout' }], matchedEggs: [] } });
  await tick();
  assert.match(f.root.querySelector('#mindmap-section .ai-section-failure').textContent, /timed out/);
  f.root.querySelector('#mindmap-section [data-analysis-retry]').click(); await tick();
  assert.equal(f.requests.length, 2);
  f.ports.at(-1).respond({ type: 'complete', result: { coreSummary: ['Recovered summary'], titleVerdict: 'A clear answer',
    mindMap: [{ name: 'Recovered concept', children: [] }], matchedEggs: [] } });
  await tick();
  assert.match(f.root.getElementById('core-summary').textContent, /Recovered summary/);
  assert.match(f.root.getElementById('mindmap-tree').textContent, /Recovered concept/);
  assert.equal(f.root.querySelectorAll('.ai-section-failure').length, 0);
  assert.equal(f.errors.length, 0, f.errors.map(error => error.message).join('\n'));
});

test('results view tolerates a pending result and a terminal failure without blanking its shell', async t => {
  const f = await popup(t);
  const ui = vm.runInContext('ui.resultsUI', f.context);
  assert.doesNotThrow(() => ui.render({ currentView: 'results', analysisResult: null,
    extractedContent: { title: 'Captured source' }, enabledSections: {} }, {}));
  assert.match(f.root.getElementById('result-page-title').textContent, /Captured source/);
  f.root.getElementById('analyze-btn').click(); await tick();
  f.ports.at(-1).respond({ error: 'Provider could not finish', errorCode: 'server_error',
    partialResult: { titleVerdict: 'Saved partial answer', coreSummary: ['Saved partial content'] } });
  await tick();
  assert.match(f.root.getElementById('core-summary').textContent, /Saved partial content/);
  assert.match(f.root.getElementById('analysis-failure-message').textContent, /could not be completed/);
  assert.equal(f.errors.length, 0);
});

test('opening an empty cached result shows content-fetch and fetches once, without AI', async t => {
  const f = await popup(t, { history: [{ url: 'https://one.test', title: 'Cached', content: 'Cached body',
    result: { nutId: 1, matchedEggs: ['a.md'], coreSummary: [], mindMap: [], analysisFailures: [{ section: 'summary', code: 'timeout' }] } }] });
  await tick();
  assert.equal(f.root.getElementById('capture-state').classList.contains('hidden'), false);
  assert.equal(f.root.getElementById('results-state').classList.contains('hidden'), true);
  assert.equal(f.root.getElementById('view-analysis-btn').classList.contains('hidden'), true);
  assert.equal(f.root.getElementById('analysis-failure-banner').classList.contains('hidden'), true);
  assert.equal(f.captures(), 1);
  assert.equal(f.requests.length, 0);
});

test('opening a partially populated cached result keeps results and skips fetching', async t => {
  const f = await popup(t, { history: [{ url: 'https://one.test', title: 'Cached', content: 'Cached body',
    result: { coreSummary: ['Keep this partial summary'], analysisFailures: [{ section: 'mindmap', code: 'timeout' }] } }] });
  await tick();
  assert.equal(f.root.getElementById('results-state').classList.contains('hidden'), false);
  assert.match(f.root.getElementById('core-summary').textContent, /Keep this partial summary/);
  assert.equal(f.root.getElementById('analysis-failure-banner').classList.contains('hidden'), false);
  assert.equal(f.captures(), 0);
  assert.equal(f.requests.length, 0);
});

test('live empty completion switches to content-fetch and refreshes without reanalysis', async t => {
  const f = await popup(t);
  assert.equal(f.captures(), 1);
  f.root.getElementById('analyze-btn').click(); await tick();
  f.ports.at(-1).respond({ type: 'complete', result: { stage: 'stage1', coreSummary: [], matchedEggs: [] } });
  await tick();
  assert.equal(f.root.getElementById('capture-state').classList.contains('hidden'), false);
  assert.equal(f.root.getElementById('results-state').classList.contains('hidden'), true);
  assert.equal(f.captures(), 2);
  assert.equal(f.requests.length, 1);
  assert.equal(f.errors.length, 0);
});

test('fresh analysis failures show in capture, but refreshing the page hides restored failures', async t => {
  const f = await popup(t);
  f.root.getElementById('analyze-btn').click(); await tick();
  f.ports.at(-1).respond({ error: 'AI timed out', errorCode: 'timeout' }); await tick();
  assert.equal(f.store.getTab(1).currentView, 'capture');
  assert.equal(f.root.getElementById('analysis-failure-banner').classList.contains('hidden'), false);
  assert.match(f.root.getElementById('analysis-failure-message').textContent, /timed out/);
  f.store.invalidateTab(1, 'https://one.test');
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry: { title: 'Cached', url: 'https://one.test', content: 'Cached body',
    result: { analysisFailures: [{ section: 'summary', code: 'timeout' }] } } });
  await tick();
  assert.equal(f.store.getTab(1).analysisStartedHere, false);
  assert.equal(f.root.getElementById('analysis-failure-banner').classList.contains('hidden'), true);
  assert.equal(f.store.getTab(1).analysisResult, null, 'discard the empty cached failure');
  f.root.getElementById('analyze-btn').click(); await tick();
  assert.equal(f.root.getElementById('analysis-failure-banner').classList.contains('hidden'), true, 'old error must not reappear on Analyze');
  f.ports.at(-1).respond({ error: 'New AI timeout', errorCode: 'timeout' }); await tick();
  assert.equal(f.root.getElementById('analysis-failure-banner').classList.contains('hidden'), false, 'a genuinely new failure remains visible');
});
