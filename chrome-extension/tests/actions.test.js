const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixture, deferred, seed } = require('./helpers/popup-fixture');
const { TabAction } = require('../src/popup/action/tab.js');
const { AnalyzeAction } = require('../src/popup/action/analyze.js');
const { SaveAction } = require('../src/popup/action/save.js');
const { HistoryAction } = require('../src/popup/action/history.js');
const { InteractionAction } = require('../src/popup/action/interaction.js');
const { SettingsState } = require('../src/popup/state/settings-state.js');
function actions() {
  const f = fixture(); const settings = new SettingsState(); settings.setServerStatus({ online: true, aiConfigured: true }); settings.analysisMode = 'preview';
  const deps = { tabStateManager: f.store, operations: f.operations, settings, ui: { captureUI: { getParsedQuestions: () => ['Q'] }, qaUI: { getFollowupText: () => 'Question' } }, envService: { checkServerStatus: async () => {} } };
  return { ...f, settings, deps, analyze: new AnalyzeAction(deps), tab: new TabAction(deps) };
}
test('activation renders synchronously; A → B → C → A drops obsolete setup', async t => {
  const old = globalThis.chrome; t.after(() => { globalThis.chrome = old; });
  const f = actions(); seed(f.store, 3, { titleVerdict: 'C' });
  const lookups = []; const history = [];
  globalThis.chrome = { tabs: { get: id => { const d = deferred(); lookups.push({ id, ...d }); return d.promise; } } };
  f.operations.history = async id => history.push(id);
  const jobs = [1, 2, 3, 1].map(tabId => f.tab.handleTabActivated({ tabId }));
  assert.equal(f.store.activeTabId, 1); assert.equal(f.store.activationEpoch, 5);
  for (const d of lookups) d.resolve({ id: d.id, url: `https://tab${d.id}.test`, status: 'complete' });
  await Promise.all(jobs);
  assert.deepEqual(history, [1]);
});
test('URL changes and reloads invalidate background jobs immediately', () => {
  const f = actions(); const ctx = f.store.beginOperation(1, 'analysis'); f.store.activateTab(2);
  f.tab.handleTabUpdated(1, { url: 'https://new.test' }); assert.equal(f.store.isOperationCurrent(ctx.token), false);
  const generation = f.store.getTab(1).pageGeneration;
  f.tab.handleTabUpdated(1, { status: 'loading' }); assert.equal(f.store.getTab(1).pageGeneration, generation);
  f.store.dispatch({ type: 'loading', tabId: 1, loading: false }); f.tab.handleTabUpdated(1, { status: 'loading' });
  assert(f.store.getTab(1).pageGeneration > generation);
});
test('slow activation setup cannot load old history after analysis completes', async t => {
  const old = globalThis.chrome; t.after(() => { globalThis.chrome = old; });
  const f = actions(); const status = deferred();
  globalThis.chrome = { tabs: { get: async id => ({ id, url: `https://tab${id}.test`, status: 'complete' }) } };
  f.deps.envService.checkServerStatus = () => status.promise;
  let histories = 0; f.service.loadHistory = async () => { histories++; return [{ result: { titleVerdict: 'Old history' } }]; };
  const setup = f.tab.handleTabActivated({ tabId: 1 });
  await new Promise(resolve => setImmediate(resolve));
  const job = f.analyze.handleAnalyze(); f.calls[0].resolve({ titleVerdict: 'New analysis' }); await job;
  status.resolve(); await setup;
  assert.equal(histories, 0); assert.equal(f.store.getTab(1).analysisResult.titleVerdict, 'New analysis');
});
test('activity navigation uses results completed while Chrome activation was pending', async t => {
  const old = globalThis.chrome; t.after(() => { globalThis.chrome = old; });
  const f = actions(); const activated = deferred();
  globalThis.chrome = { tabs: { update: () => activated.promise, get: async id => ({ id, url: `https://tab${id}.test`, status: 'complete' }) } };
  const job = f.analyze.handleAnalyze(); f.store.activateTab(2);
  const navigation = f.tab.openAnalysisActivity(1);
  f.calls[0].resolve({ titleVerdict: 'Completed during activation' }); await job;
  activated.resolve(); await navigation;
  assert.equal(f.store.activeTabId, 1); assert.equal(f.store.getTab(1).currentView, 'results');
});
test('analysis actions capture their origin and preferences; Back/View only dispatch view changes', async () => {
  const f = actions(); seed(f.store, 1, { titleVerdict: 'Old' });
  f.analyze.setGenerateKnowledgeEntries(false);
  assert.equal(f.settings.generateKnowledgeEntries, false);
  const job = f.analyze.handleAnalyze(); f.store.activateTab(2);
  assert.equal(f.calls[0].payload.generateKnowledgeEntries, false); assert.equal(f.calls[0].payload.content, 'Content 1');
  f.calls[0].resolve({ titleVerdict: 'New' }); await job;
  f.store.activateTab(1); f.analyze.handleBackToContent(); assert.equal(f.store.getTab(1).currentView, 'capture');
  f.analyze.handleViewAnalysis(); assert.equal(f.store.getTab(1).currentView, 'results'); assert.equal(f.calls.length, 1);
});
test('egg-analysis actions reuse Stage 1 and never initiate Stage 1 requests', async () => {
  const f = actions(); seed(f.store, 1, { stage: 'stage1', titleVerdict: 'Base', matchedEggs: ['a.md'] });
  const job = f.analyze.handleEggAnalysis(false);
  assert.equal(f.calls[0].payload.stage, 2); assert.equal(f.calls[0].payload.contentAnalysis.titleVerdict, 'Base');
  f.calls[0].resolve({ eggResults: [{ egg: 'a.md', extractedEntries: [] }] }); await job;
});
test('history selection is explicit and disabled during conflicting work', () => {
  const f = actions(); const history = f.store.beginOperation(1, 'history');
  f.store.commitOperation(history.token, { type: 'historyLoaded', history: [{ nutId: 4, result: { titleVerdict: 'History' } }], select: false });
  const action = new HistoryAction(f.deps); action.onHistorySelected('0');
  assert.equal(f.store.getTab(1).analysisResult.titleVerdict, 'History');
  f.store.beginOperation(1, 'saving'); action.onHistorySelected('0');
  assert.equal(f.store.getTab(1).resultRevision, 1);
});
test('save and follow-up actions dispatch operations without touching controls', async () => {
  const f = actions(); seed(f.store, 1, { titleVerdict: 'Base' });
  f.service.sendMessage = async ({ action }) => action === 'confirm' ? { success: true } : { answers: [{ answer: 'A' }] };
  await new SaveAction(f.deps).handleSaveRaw(); assert.equal(f.store.getTab(1).nutCollected, true);
  await new InteractionAction(f.deps).handleFollowUp(); assert.equal(f.store.getTab(1).followUpQa[0].answer, 'A');
});
