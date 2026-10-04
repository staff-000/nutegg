const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/i18n.js');
const { TabStateManager } = require('../src/popup/state/tab-state.js');
const { AnalysisActivityComponent } = require('../src/popup/ui/analysis-activity.js');
const { TabAction } = require('../src/popup/action/tab.js');
const { AnalysisService } = require('../src/popup/services/analysis-service.js');
const { SessionState } = require('../src/popup/state/session-state.js');
const { SettingsState } = require('../src/popup/state/settings-state.js');
globalThis.NutEggAI = new Function(require('node:fs').readFileSync(require.resolve('../dist/ai-core.js'), 'utf8') + '\nreturn NutEggAI;')();
function fixture(mode = 'confirm') {
  const manager = new TabStateManager(), session = new SessionState(), settings = new SettingsState(), service = new AnalysisService();
  session.activeTabId = 1; session.extractedContent = { title: 'One', url: 'https://one.test', content: 'Source' };
  settings.analysisMode = mode; settings.serverOnline = true; settings.isChromeMode = () => false;
  service.loadHistory = async () => null;
  return { manager, session, settings, service };
}
function element() {
  const classes = new Set(['hidden']);
  return { dataset: {}, children: [], attributes: {}, listeners: {},
    classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c),
      toggle: (c, force) => { const on = force ?? !classes.has(c); on ? classes.add(c) : classes.delete(c); return on; } },
    addEventListener(k, fn) { this.listeners[k] = fn; }, setAttribute(k, v) { this.attributes[k] = v; },
    appendChild(child) { this.children.push(child); }, replaceChildren() { this.children = []; }, contains: () => false };
}
function rootFixture() { const els = new Map(); return { getElementById: id => { if (!els.has(id)) els.set(id, element()); return els.get(id); }, createElement: element, addEventListener() {} }; }
test('running tabs, unread revisions, visibility, failures and invalidation', () => {
  const m = new TabStateManager(); let notifications = 0; m.subscribeActivity(() => notifications++);
  const a = m.beginAnalysis(1), b = m.beginAnalysis(2); assert.equal(m.getAnalysisActivity().length, 2);
  const result = {}; m.set(1, { analysisResult: result }); m.finishAnalysis(a);
  for (const extra of [{ visible: false }, { visible: true, viewingContent: true }, { visible: true, result: {} }]) {
    m.markVisibleAnalysis(1, { result, ...extra }); assert.equal(m.getAnalysisActivity().filter(e => !e.running).length, 1);
  }
  m.markVisibleAnalysis(1, { result, visible: true }); assert.deepEqual(m.getAnalysisActivity().map(e => e.tabId), [2]);
  const newer = m.beginAnalysis(1); m.finishAnalysis(a); assert.equal(m.activity.get(1).running, true);
  m.finishAnalysis(newer); m.finishAnalysis(b, false); assert.deepEqual(m.getAnalysisActivity().map(e => e.tabId), [1]);
  m.invalidateTab(1); m.finishAnalysis(newer); assert.deepEqual(m.getAnalysisActivity(), []); m.clear(); assert.ok(notifications >= 8);
});
test('fast Stage 1 and 2 share one running revision', async () => {
  const { manager: m, session, settings, service } = fixture('fast'); const states = [];
  m.subscribeActivity(() => states.push(m.getAnalysisActivity().map(e => ({ revision: e.revision, running: e.running }))));
  service.sendAnalyzeViaPort = async p => p.stage === 1 ? { matchedEggs: ['a.md'] } : { eggResults: [{ egg: 'a.md', readAction: 'full', extractedEntries: [] }], newKnowledge: [] };
  await service.analyze({ session, settings, tabStateManager: m });
  assert.equal(m.activityRevision, 1); assert.deepEqual(states, [[{ revision: 1, running: true }], [{ revision: 1, running: false }]]);
  assert.equal(m.get(1).analysisResult.stage, 'stage2');
});
test('confirmation and later Stage 2 notify separately; cached-only changes do not', async () => {
  const { manager: m, session, settings, service } = fixture();
  service.sendAnalyzeViaPort = async p => p.stage === 1 ? { matchedEggs: ['a.md'] } : { eggResults: [{ egg: 'a.md', readAction: 'full', extractedEntries: [] }], newKnowledge: [] };
  await service.analyze({ session, settings, tabStateManager: m }); assert.equal(m.activityRevision, 1); m.markAnalysisViewed(1);
  await service.proceedStage2({ session, settings, tabStateManager: m, eggsToCompare: ['a.md'] });
  assert.equal(m.activityRevision, 2); assert.equal(m.getAnalysisActivity().length, 1); m.markAnalysisViewed(1);
  service.sendAnalyzeViaPort = () => assert.fail('Cached selection called AI');
  await service.proceedStage2({ session, settings, tabStateManager: m, eggsToCompare: ['a.md'] });
  assert.equal(m.activityRevision, 2); assert.deepEqual(m.getAnalysisActivity(), []);
});
test('late results after close or navigation do not restore tab cache', async () => {
  for (const stage of [1, 2]) {
    const { manager: m, session, settings, service } = fixture(); let finish;
    service.sendAnalyzeViaPort = () => new Promise(resolve => { finish = resolve; });
    const opts = { session, settings, tabStateManager: m, callbacks: { onStage1Complete: () => assert.fail('Stale'), onProceedComplete: () => assert.fail('Stale') } };
    const promise = stage === 1 ? service.analyze(opts) : service.proceedStage2({ ...opts, eggsToCompare: ['a.md'] });
    m.invalidateTab(1); finish({ matchedEggs: [], eggResults: [], newKnowledge: [] });
    assert.equal((await promise).stale, true); assert.equal(m.has(1), false); assert.deepEqual(m.getAnalysisActivity(), []);
  }
});
test('indicator filters the window, sorts unread before running and safely renders titles', async () => {
  const m = new TabStateManager(); const a = m.beginAnalysis(1, { title: '<script>One</script>' }); m.finishAnalysis(a);
  const b = m.beginAnalysis(2, { title: 'Two' }); m.finishAnalysis(b); m.beginAnalysis(3, { title: 'Running' }); m.beginAnalysis(4);
  const ui = new AnalysisActivityComponent(rootFixture()); let selected;
  await ui.init({ manager: m, onSelect: id => { selected = id; }, tabs: { query: async () => [1, 2, 3].map(id => ({ id, windowId: 7 })) } });
  assert.equal(ui.button.textContent, '⏳ 1 running · ✅ 2 unread');
  const rows = ui.list.children.filter(e => e.dataset.activityTab); assert.deepEqual(rows.map(e => e.dataset.activityTab), ['1', '2', '3']);
  assert.equal(rows[0].textContent, '✅ <script>One</script>'); ui.toggle(true);
  ui.list.listeners.click({ target: { closest: () => rows[1] } }); assert.equal(selected, 2); assert.equal(ui.list.classList.contains('hidden'), true);
  m.clear(); await ui.refresh(); assert.equal(ui.container.classList.contains('hidden'), true);
});
test('navigation opens complete results, retains running progress, handles closed tabs', async () => {
  const prior = globalThis.chrome; const activated = [];
  globalThis.chrome = { tabs: { get: async id => { if (id === 3) throw Error('Closed'); return { id }; }, update: async id => activated.push(id) } };
  try {
    const m = new TabStateManager(); const a = m.beginAnalysis(1); m.finishAnalysis(a); m.beginAnalysis(2); m.beginAnalysis(3);
    const session = { activeTabId: 1, analysisResult: {} }; let viewed = 0;
    const action = new TabAction({ session, tabStateManager: m, getAnalyzeAction: () => ({ handleViewAnalysis: () => viewed++ }) });
    action.handleTabActivated = async ({ tabId }) => { session.activeTabId = tabId; };
    await action.openAnalysisActivity(1); assert.equal(viewed, 1); await action.openAnalysisActivity(2); assert.equal(viewed, 1);
    await action.openAnalysisActivity(3); assert.equal(m.activity.has(3), false); assert.deepEqual(activated, [1, 2]);
  } finally { globalThis.chrome = prior; }
});

test('background completion stays unread; active visible completion clears immediately', async () => {
  for (const background of [false, true]) {
    const { manager: m, session, settings, service } = fixture(); let finish;
    service.sendAnalyzeViaPort = () => new Promise(resolve => { finish = resolve; });
    let displayed = 0;
    const pending = service.analyze({ session, settings, tabStateManager: m, callbacks: {
      onStage1Complete: ({ response }) => { displayed++; m.markVisibleAnalysis(session.activeTabId, { result: response, visible: true }); }
    } });
    assert.equal(m.getAnalysisActivity()[0].running, true);
    if (background) { session.activeTabId = 2; session.analysisResult = null; }
    finish({ matchedEggs: [], coreSummary: ['Done'] }); await pending;
    assert.equal(displayed, background ? 0 : 1);
    assert.equal(m.getAnalysisActivity().length, background ? 1 : 0);
    if (background) assert.equal(m.getAnalysisActivity()[0].running, false);
  }
});
test('failed requests stop running without unread results, including after a prior completion', async () => {
  const { manager: m, session, settings, service } = fixture();
  service.sendAnalyzeViaPort = async () => ({ matchedEggs: [] });
  await service.analyze({ session, settings, tabStateManager: m }); assert.equal(m.getAnalysisActivity().length, 1);
  service.sendAnalyzeViaPort = async () => ({ error: 'Offline' });
  await service.analyze({ session, settings, tabStateManager: m });
  assert.deepEqual(m.getAnalysisActivity(), []); assert.equal(m.get(1).status, 'error');
});

test('URL-change events invalidate immediately before asynchronous tab lookup', async () => {
  const prior = globalThis.chrome; let finishLookup;
  globalThis.chrome = { tabs: { query: () => new Promise(resolve => { finishLookup = resolve; }) } };
  try {
    const manager = new TabStateManager(); const token = manager.beginAnalysis(1);
    manager.set(1, { url: 'https://old.test' });
    const action = new TabAction({ tabStateManager: manager });
    const pending = action.handleTabUpdated(1, { url: 'https://new.test' });
    assert.equal(manager.isActivityCurrent(token), false); assert.equal(manager.has(1), false);
    finishLookup([]); await pending;
  } finally { globalThis.chrome = prior; }
});
