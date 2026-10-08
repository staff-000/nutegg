const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TabStateManager } = require('../src/popup/state/tab-state.js');
const { fixture, seed } = require('./helpers/popup-fixture');
test('records and captured contexts cannot be mutated; activation does not merge old state', () => {
  const { store } = fixture();
  assert(Object.isFrozen(store.getTab(1)));
  const ctx = store.beginOperation(1, 'analysis', { eggs: ['a'] });
  assert.throws(() => ctx.inputs.eggs.push('b'));
  assert.throws(() => store.viewModel(1).selectedEggs.add('a'));
  store.activateTab(2); store.activateTab(1);
  assert.equal(store.getTab(1).operations.analysis.running, true);
});
test('explicit views and completion are atomic in active and background tabs', () => {
  const { store } = fixture();
  store.dispatch({ type: 'view', tabId: 1, view: 'results' });
  assert.equal(store.getTab(1).currentView, 'capture');
  const ctx = store.beginOperation(1, 'analysis'); store.activateTab(2);
  store.commitOperation(ctx.token, { type: 'analysisComplete', result: { titleVerdict: 'A' }, stage1: true });
  const tab = store.getTab(1);
  assert.equal(tab.currentView, 'results'); assert.equal(tab.operations.analysis.running, false);
  assert.equal(store.getAnalysisActivity().length, 1);
  store.dispatch({ type: 'viewed', tabId: 1, revision: tab.resultRevision });
  assert.equal(store.getAnalysisActivity().length, 1);
  store.activateTab(1); store.dispatch({ type: 'view', tabId: 1, view: 'capture' });
  store.dispatch({ type: 'viewed', tabId: 1, revision: tab.resultRevision });
  assert.equal(store.getAnalysisActivity().length, 1);
  store.dispatch({ type: 'view', tabId: 1, view: 'results' });
  store.dispatch({ type: 'visibility', visible: false });
  store.dispatch({ type: 'viewed', tabId: 1, revision: tab.resultRevision });
  assert.equal(store.getAnalysisActivity().length, 1);
  store.dispatch({ type: 'visibility', visible: true });
  store.dispatch({ type: 'viewed', tabId: 1, revision: tab.resultRevision });
  assert.equal(store.getAnalysisActivity().length, 0);
});
test('page generations are never reused after closure or returning to the same URL', () => {
  const { store } = fixture(); const ctx = store.beginOperation(1, 'analysis');
  for (const remove of [false, true]) {
    store.invalidateTab(1, 'https://tab1.test', remove); store.ensure(1, 'https://tab1.test');
    assert.equal(store.commitOperation(ctx.token, { type: 'operationFailed', error: 'old' }), false);
    assert.equal(store.getTab(1).errors.analysis, undefined);
  }
});
test('old completion/error/cleanup cannot clear a newer operation', () => {
  const { store } = fixture(); const a = store.beginOperation(1, 'extraction'); const b = store.beginOperation(1, 'extraction');
  for (const type of ['operationFinished', 'operationFailed', 'extracted']) assert.equal(store.commitOperation(a.token, { type, error: 'Old' }), false);
  assert.equal(store.isOperationCurrent(b.token), true);
});
test('diagnostics distinguish discarded generations, requests, and result dependencies', () => {
  const { store } = fixture(); store.diagnosticsEnabled = true;
  const a = store.beginOperation(1, 'extraction'); store.beginOperation(1, 'extraction');
  store.commitOperation(a.token, { type: 'operationFinished' });
  assert.equal(store.diagnostics.at(-1).reason, 'superseded-request');
  store.invalidateTab(1); store.commitOperation(a.token, { type: 'operationFailed', error: 'private error' });
  assert.equal(store.diagnostics.at(-1).reason, 'page-generation');
  const history = store.beginOperation(2, 'history', {}, ['selectionRevision']);
  seed(store, 2, { titleVerdict: 'New result' });
  store.commitOperation(history.token, { type: 'historyLoaded', history: [] });
  assert.equal(store.diagnostics.at(-1).reason, 'changed-dependency');
  assert(!JSON.stringify(store.diagnostics).includes('private error'));
});
test('dependencies invalidate history and follow-up without leaving loading flags behind', () => {
  const { store } = fixture();
  const history = store.beginOperation(1, 'history', {}, ['selectionRevision']);
  const analysis = store.beginOperation(1, 'analysis');
  store.commitOperation(analysis.token, { type: 'analysisComplete', result: { titleVerdict: 'New' }, stage1: true });
  assert.equal(store.getTab(1).operations.history.running, false);
  assert.equal(store.commitOperation(history.token, { type: 'historyLoaded', history: [{ result: {} }], select: true }), false);
});
test('operation flags are derived and conflicting work is blocked only on its own tab', () => {
  const { store } = fixture(); const ctx = store.beginOperation(1, 'analysis');
  store.commitOperation(ctx.token, { type: 'phase', phase: 'stage2' });
  assert.equal(store.viewModel(1).analyzingEggs, true); assert.equal(store.viewModel(2).analyzingEggs, false);
  assert.equal(store.beginOperation(1, 'saving'), null);
  assert(store.beginOperation(2, 'saving')); assert.equal(store.viewModel(2).savingToVault, true);
});
test('failure keeps the old successful result and view, without unread completion', () => {
  const { store } = fixture(); seed(store, 1, { titleVerdict: 'Old' });
  store.dispatch({ type: 'view', tabId: 1, view: 'capture' });
  const ctx = store.beginOperation(1, 'analysis');
  store.commitOperation(ctx.token, { type: 'operationFailed', error: 'Failed' });
  assert.equal(store.getTab(1).analysisResult.titleVerdict, 'Old'); assert.equal(store.getTab(1).currentView, 'capture');
  assert.equal(store.getAnalysisActivity().length, 0);
});
test('restoration does not rewrite global defaults; diagnostics omit input data and are bounded', () => {
  const { store } = fixture();
  store.dispatch({ type: 'draft', tabId: 1, values: { generateKnowledgeEntries: true } });
  store.activateTab(2); assert.equal(store.viewModel().generateKnowledgeEntries, false);
  store.activateTab(1); assert.equal(store.viewModel().generateKnowledgeEntries, true);
  store.diagnosticsEnabled = true;
  for (let i = 0; i < 210; i++) { const ctx = store.beginOperation(1, 'extraction', { secret: 'SECRET' }); store.commitOperation(ctx.token, { type: 'operationFinished' }); }
  assert.equal(store.diagnostics.length, 200); assert(!JSON.stringify(store.diagnostics).includes('SECRET'));
});
test('extraction errors do not clear analysis errors or warnings owned by other operations', () => {
  const { store } = fixture(); const a = store.beginOperation(1, 'analysis');
  store.commitOperation(a.token, { type: 'operationFailed', error: 'Analysis failed' });
  const x = store.beginOperation(1, 'extraction');
  store.commitOperation(x.token, { type: 'extracted', content: { content: 'New content' } });
  assert.equal(store.getTab(1).errors.analysis.message, 'Analysis failed');
});
