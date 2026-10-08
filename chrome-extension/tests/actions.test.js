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
  const f = fixture(); const settings = new SettingsState(); settings.setConnectionMode('obsidian', false); settings.setServerStatus({ online: true, aiConfigured: true }); settings.analysisMode = 'preview';
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

test('Create Egg sends the preferred-language description and never starts analysis', async () => {
  const f = actions(); let input;
  f.deps.ui.eggsUI = { getNewEggInput: () => ({ name: '方法论', desc: '收集解决问题的方法' }) };
  f.service.createEgg = async (name, desc) => { input = { name, desc }; return { success: true, path: 'nutegg/方法论.md' }; };
  await new SaveAction(f.deps).handleCreateEgg(true);
  assert.deepEqual(input, { name: '方法论', desc: '收集解决问题的方法' });
  assert.equal(f.calls.length, 0);
  assert.deepEqual(f.store.getTab(1).selectedEggs, ['nutegg/方法论.md']);
});
test('refreshCaptureForCurrentTab fetches content without redirecting to analysis view', async t => {
  const old = globalThis.chrome; t.after(() => { globalThis.chrome = old; });
  const f = actions();
  seed(f.store, 1, { titleVerdict: 'Existing analysis' });
  f.store.dispatch({ type: 'view', tabId: 1, view: 'capture' });
  assert.equal(f.store.getTab(1).currentView, 'capture');

  let extractedId = null;
  globalThis.chrome = { tabs: { get: async id => ({ id, url: 'https://tab1.test', title: 'Refreshed Page', status: 'complete' }) } };
  f.operations.extract = async id => { extractedId = id; return { url: 'https://tab1.test', content: 'Refreshed content' }; };

  await f.tab.refreshCaptureForCurrentTab();

  assert.equal(extractedId, 1);
  assert.equal(f.store.getTab(1).currentView, 'capture');
  assert.equal(f.store.getTab(1).title, 'Refreshed Page');
});


test('source jump feedback stays with the initiating tab and ignores a replaced page', async () => {
  const f = actions(), requests = [];
  const pageExtractor = { scrollToSection: (...args) => { const d = deferred(); requests.push({ args, ...d }); return d.promise; } };
  const action = new InteractionAction({ ...f.deps, pageExtractor });
  const jump = action.scrollToSection('Heading', 'Quote', 'zhihu:c1');
  f.store.activateTab(2);
  requests[0].resolve(false); await jump;
  assert.match(f.store.getTab(1).errors.navigation.message, /current page/);
  assert.equal(f.store.getTab(2).errors.navigation, undefined);
  f.store.activateTab(1);
  const obsolete = action.scrollToSection('Heading', 'Quote');
  f.store.invalidateTab(1, 'https://new.test');
  requests[1].resolve(false); await obsolete;
  assert.equal(f.store.getTab(1).errors.navigation, undefined);
});

test('refresh cannot recreate a closed tab after its Chrome lookup resolves', async t => {
  const old = globalThis.chrome; t.after(() => { globalThis.chrome = old; });
  const f = actions(), lookup = deferred();
  globalThis.chrome = { tabs: { get: () => lookup.promise } };
  const refresh = f.tab.refreshCaptureForCurrentTab();
  f.tab.handleTabRemoved(1); f.store.activateTab(2);
  lookup.resolve({ id: 1, url: 'https://tab1.test', status: 'complete' });
  await refresh;
  assert.equal(f.store.getTab(1), null);
});

test('cancelled refresh cannot hide the replacement page results or surface its old error', async t => {
  const old = globalThis.chrome; t.after(() => { globalThis.chrome = old; });
  for (const fail of [false, true]) {
    const f = actions(), extraction = deferred();
    globalThis.chrome = { tabs: { get: async () => ({ id: 1, url: 'https://tab1.test', status: 'complete' }) } };
    f.operations.extract = () => extraction.promise;
    const refresh = f.tab.refreshCaptureForCurrentTab();
    await new Promise(resolve => setImmediate(resolve));
    f.store.invalidateTab(1, 'https://new.test'); seed(f.store, 1, { titleVerdict: 'Replacement' });
    fail ? extraction.reject(new Error('Obsolete refresh error')) : extraction.resolve(null);
    await refresh;
    assert.equal(f.store.getTab(1).currentView, 'results');
    assert.deepEqual(f.store.getTab(1).errors, {});
  }
});

test('refresh does not invalidate an analysis started during the Chrome lookup', async t => {
  const old = globalThis.chrome; t.after(() => { globalThis.chrome = old; });
  const f = actions(), lookup = deferred();
  globalThis.chrome = { tabs: { get: () => lookup.promise } };
  const refresh = f.tab.refreshCaptureForCurrentTab();
  const analysis = f.analyze.handleAnalyze();
  lookup.resolve({ id: 1, url: 'https://tab1.test', status: 'complete' }); await refresh;
  assert.equal(f.store.getTab(1).operations.extraction.running, false);
  f.calls[0].resolve({ titleVerdict: 'New analysis' }); await analysis;
  assert.equal(f.store.getTab(1).analysisResult.titleVerdict, 'New analysis');
});

test('late activity activation cannot overwrite a subsequent user tab switch', async t => {
  const old = globalThis.chrome; t.after(() => { globalThis.chrome = old; });
  const f = actions(), activated = deferred();
  globalThis.chrome = { tabs: { update: () => activated.promise, get: async id => ({ id, url: `https://tab${id}.test`, status: 'complete' }) } };
  f.store.activateTab(2);
  const open = f.tab.openAnalysisActivity(1);
  await f.tab.handleTabActivated({ tabId: 1 });
  await f.tab.handleTabActivated({ tabId: 2 });
  activated.resolve(); await open;
  assert.equal(f.store.activeTabId, 2);
});

test('URL-only navigation extracts the new route after settling; fragments retain results', async t => {
  const old = globalThis.chrome; t.after(() => { globalThis.chrome = old; });
  const f = actions(); let extractions = 0, settlements = 0;
  globalThis.chrome = { tabs: { get: async id => ({ id, url: 'https://tab1.test/new-route', status: 'complete' }) } };
  f.extractor.waitForPageSettle = async () => { settlements++; };
  f.extractor.extractPage = async () => { extractions++; return { url: 'https://tab1.test/new-route', content: 'New route' }; };
  await f.tab.handleTabUpdated(1, { url: 'https://tab1.test/new-route' });
  assert.equal(extractions, 1); assert.equal(settlements, 1);
  assert.equal(f.store.getTab(1).extractedContent.content, 'New route');
  assert.equal(f.store.getTab(1).currentTabLoading, false);
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry: { result: { titleVerdict: 'Current result' } } });
  const generation = f.store.getTab(1).pageGeneration;
  await f.tab.handleTabUpdated(1, { url: 'https://tab1.test/new-route#section' });
  assert.equal(f.store.getTab(1).pageGeneration, generation);
  assert.equal(f.store.getTab(1).analysisResult.titleVerdict, 'Current result');
  assert.equal(extractions, 1);
});

test('A → B → A during extraction waits for the shared extraction before restoring history', async t => {
  const old = globalThis.chrome; t.after(() => { globalThis.chrome = old; });
  const f = actions(), extraction = deferred(); let extractions = 0, histories = 0;
  globalThis.chrome = { tabs: { get: async id => ({ id, url: `https://tab${id}.test`, status: 'complete' }) } };
  f.store.invalidateTab(1, 'https://tab1.test');
  f.extractor.extractPage = () => { extractions++; return extraction.promise; };
  f.service.loadHistory = async () => { histories++; return [{ nutId: 99, title: 'Saved capture', content: 'Old content', result: { titleVerdict: 'Saved history' } }]; };
  const first = f.tab.handleTabActivated({ tabId: 1 }); await new Promise(resolve => setImmediate(resolve));
  f.store.activateTab(2);
  const returning = f.tab.handleTabActivated({ tabId: 1 }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(histories, 0);
  extraction.resolve({ title: 'Fresh page', url: 'https://tab1.test', content: 'Fresh content' });
  await Promise.all([first, returning]);
  assert.equal(extractions, 1); assert.equal(histories, 1);
  assert.equal(f.store.getTab(1).analysisResult.titleVerdict, 'Saved history');
});
