const { TabStateManager } = require('../../src/popup/state/tab-state.js');
const { PopupOperations } = require('../../src/popup/services/popup-operations.js');
require('../../src/i18n.js');
require('../../src/popup/helpers.js');
globalThis.NutEggAI = new Function(require('node:fs').readFileSync(require.resolve('../../dist/ai-core.js'), 'utf8') + '\nreturn NutEggAI;')();
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
function seed(store, id, result = null) {
  store.ensure(id, `https://tab${id}.test`);
  const ctx = store.beginOperation(id, 'extraction');
  store.commitOperation(ctx.token, { type: 'extracted', content: { title: `Tab ${id}`, url: `https://tab${id}.test`, content: `Content ${id}`, sourceType: 'article' } });
  if (result) store.dispatch({ type: 'historySelected', tabId: id, entry: { result, nutId: id, saved: 'analyzed', url: `https://tab${id}.test`, content: `Content ${id}` } });
}
function fixture() {
  const store = new TabStateManager();
  store.dispatch({ type: 'defaults', defaults: { enabledSections: { titleVerdict: true, coreSummary: true, mindMap: true } } });
  seed(store, 1); seed(store, 2); store.activateTab(1);
  const calls = [];
  const service = { sendAnalyzeViaPort: payload => { const d = deferred(); calls.push({ payload, ...d }); return d.promise; },
    loadHistory: async () => [], sendMessage: async () => ({}), createEgg: async () => ({ success: true, path: 'new.md' }) };
  const extractor = { extractPage: async id => ({ title: `Tab ${id}`, content: 'Extracted', url: `https://tab${id}.test` }), waitForTabComplete: async () => {}, waitForPageSettle: async () => {} };
  const api = { tabs: { get: async id => ({ id, url: `https://tab${id}.test`, title: `Tab ${id}`, status: 'complete' }) } };
  const operations = new PopupOperations({ store, service, extractor, chromeApi: api });
  return { store, operations, service, calls, api, extractor };
}
// Mutable component input used only by presentation unit tests, never by production.
function testView() {
  const store = new TabStateManager(); store.ensure(1);
  return { ...structuredClone(store.getTab(1)), selectedEggs: new Set(), preSelectedEggs: new Set(), allEggs: [],
    enabledSections: null, busy: false, isAnalyzing: false, analyzingEggs: false, savingToVault: false,
    isStage1(result = this.analysisResult) { return result?.stage === 'stage1' || result?.mode === 'chrome'; } };
}
module.exports = { deferred, seed, fixture, testView };
