const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture, deferred } = require('./helpers/popup-fixture');
const { TabAction } = require('../src/popup/action/tab');
function setup(t) {
  const f = fixture(); const old = global.chrome; global.chrome = f.api; t.after(() => { global.chrome = old; });
  const action = new TabAction({ tabStateManager: f.store, operations: f.operations,
    envService: { checkServerStatus: async () => {} }, settings: { isChromeMode: () => true } });
  return { ...f, action };
}

test('metadata-only cached results are cleared while captured content is reused', async t => {
  const f = setup(t); let captures = 0;
  f.store.invalidateTab(1, 'https://tab1.test');
  f.service.loadHistory = async () => [{ nutId: 42, content: 'Old cached source', title: 'Cached',
    result: { nutId: 42, stage: 'stage1', matchedEggs: ['a.md'], execution: { model: 'm' } } }];
  f.extractor.extractPage = async () => { captures++; return { url: 'https://tab1.test', content: 'Fresh source', title: 'Fresh' }; };
  await f.action.handleTabActivated({ tabId: 1 });
  assert.equal(f.store.getTab(1).currentView, 'capture');
  assert.equal(f.store.getTab(1).extractedContent.content, 'Old cached source');
  assert.equal(f.store.getTab(1).analysisResult, null, 'discard empty analysis metadata');
  assert.equal(f.store.getTab(1).captureHistory.length, 1);
  assert.equal(f.store.getTab(1).captureHistory[0].result, null);
  f.service.loadHistory = async () => [];
  await f.action.handleTabActivated({ tabId: 1 });
  assert.equal(captures, 0);
  assert.equal(f.calls.length, 0, 'fetching must not rerun AI');
});

for (const result of [
  { titleVerdict: 'A useful answer' }, { coreSummary: ['One useful point'] },
  { mindMap: [{ name: 'One useful node' }] }, { extractedEntries: [{ content: 'An insight' }] },
  { newKnowledge: [{ egg: 'a.md', content: 'A legacy insight' }] },
  { customQuestionAnswers: [{ question: 'Q', answer: 'An answer' }] },
  { discussion: { topics: [{ summary: 'A discussion insight' }] } },
  { eggResults: [{ egg: 'a.md', keyQuestionAnswers: [{ answer: 'Egg answer' }] }] },
  { readAction: 'skip', shouldReadReason: 'Already covered' },
]) test(`partial output keeps results visible: ${Object.keys(result)[0]}`, async t => {
  const f = setup(t); let captures = 0;
  f.store.invalidateTab(1, 'https://tab1.test');
  f.service.loadHistory = async () => [{ content: 'Cached source', title: 'Cached',
    capturePayload: { enabledSections: { discussion: true } }, result }];
  f.extractor.extractPage = async () => { captures++; return {}; };
  await f.action.handleTabActivated({ tabId: 1 });
  assert.equal(f.store.getTab(1).currentView, 'results');
  assert.equal(captures, 0);
});

test('failure notices and whitespace do not count as substantive output', () => {
  const f = fixture();
  for (const result of [{}, { titleVerdict: ' ', coreSummary: [' '], mindMap: [{}] },
    { titleVerdict: 'Could not generate a verdict.', analysisFailures: [{ code: 'timeout' }] },
    { eggResults: [{ egg: 'a.md', readAction: 'uncertain', readVerdict: null, readVerdictReason: 'Egg analysis unavailable or failed.' }] }]) {
    f.store.dispatch({ type: 'historySelected', tabId: 1, entry: { result } });
    assert.equal(f.store.getTab(1).currentView, 'capture');
    assert.equal(f.store.hasAnalysisContent(1), false);
    f.store.dispatch({ type: 'view', tabId: 1, view: 'results' });
    assert.equal(f.store.getTab(1).currentView, 'capture');
  }
});

test('empty recovery snapshots preserve their existing source body', async t => {
  const f = setup(t); let captures = 0;
  f.operations.restoreForTab = async tabId => {
    f.store.dispatch({ type: 'historySelected', tabId, entry: { result: { nutId: 1 }, content: 'Recovered source' } });
    return true;
  };
  f.extractor.extractPage = async () => { captures++; return { url: 'https://tab1.test', content: 'Fresh' }; };
  f.service.loadHistory = async () => [];
  await f.action.handleTabActivated({ tabId: 1 });
  assert.equal(captures, 0);
  assert.equal(f.store.getTab(1).currentView, 'capture');
});

test('in-flight AI is preserved, and failed refreshes do not create retry loops', async t => {
  const f = setup(t); let captures = 0;
  const ctx = f.store.beginOperation(1, 'analysis');
  await f.action.refreshEmptyAnalysis(1);
  assert.equal(f.store.isOperationCurrent(ctx.token), true);
  f.store.commitOperation(ctx.token, { type: 'operationFailed', error: 'Timeout', code: 'timeout' });
  f.extractor.extractPage = async () => { captures++; throw new Error('Capture unavailable'); };
  await f.action.refreshEmptyAnalysis(1); await f.action.refreshEmptyAnalysis(1);
  assert.equal(captures, 0);
});

test('tab switching and navigation discard stale empty-result fetches', async t => {
  const f = setup(t), pending = deferred(); let captures = 0;
  f.service.loadHistory = () => pending.promise;
  f.store.invalidateTab(1, 'https://tab1.test');
  f.extractor.extractPage = async () => { captures++; return {}; };
  const load = f.action.handleTabActivated({ tabId: 1 });
  await new Promise(resolve => setImmediate(resolve));
  f.store.activateTab(2); f.store.invalidateTab(1, 'https://new.test');
  pending.resolve([{ result: {}, content: 'Old source' }]); await load;
  assert.equal(captures, 0);
  assert.equal(f.store.getTab(1).analysisResult, null);
});

test('hidden outputs alone do not select the results page', () => {
  const f = fixture();
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry: {
    capturePayload: { enabledSections: { titleVerdict: false, coreSummary: true, mindMap: true } },
    result: { titleVerdict: 'Hidden title', coreSummary: [], mindMap: [] },
  } });
  assert.equal(f.store.getTab(1).currentView, 'capture');
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry: { result: { mode: 'chrome', readAction: 'skip' } } });
  assert.equal(f.store.getTab(1).currentView, 'capture', 'Chrome does not display the vault reading verdict');
});

test('reload removes only the empty local snapshot and Analyze starts without its stale failure', async t => {
  const f = setup(t), removed = [];
  const result = { mode: 'chrome', analysisFailures: [{ section: 'summary', code: 'timeout' }] };
  f.store.invalidateTab(1, 'https://tab1.test');
  f.service.loadHistory = async () => [{ nutId: 42, url: 'https://tab1.test', content: 'Cached body', result }];
  f.service.sendMessage = async message => { removed.push(message); return { success: true }; };
  await f.action.handleTabActivated({ tabId: 1 });
  assert.equal(removed.length, 1);
  assert.equal(removed[0].action, 'discard-empty-analysis');
  assert.equal(removed[0].nutId, 42);
  assert.deepEqual(removed[0].result, result);
  assert.equal(f.store.getTab(1).analysisRetry, null);
  assert.equal(f.store.getTab(1).currentNutId, null);
  const ctx = f.store.beginOperation(1, 'analysis');
  f.store.commitOperation(ctx.token, { type: 'analysisRetryContext', payload: { content: 'Fresh' }, inputs: {} });
  assert.equal(globalThis.NutEggHelpers.analysisFailureNotice(f.store.viewModel()), null);
});

test('explicit refresh discards an empty failure, but keeps a useful partial analysis', async t => {
  const f = setup(t), removed = [];
  f.service.sendMessage = async message => { removed.push(message); return {}; };
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry: { nutId: 1, result: { analysisFailures: [{ code: 'timeout' }] } } });
  await f.action.refreshCaptureForCurrentTab();
  assert.equal(removed.length, 1);
  assert.equal(f.store.getTab(1).analysisResult, null);
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry: { nutId: 2,
    result: { coreSummary: ['Useful partial'], analysisFailures: [{ code: 'timeout' }] } } });
  await f.action.refreshCaptureForCurrentTab();
  assert.equal(removed.length, 1);
  assert.deepEqual(f.store.getTab(1).analysisResult.coreSummary, ['Useful partial']);
});

test('navigation during local cache cleanup cannot fetch the replacement page', async t => {
  const f = setup(t), cleanup = deferred(); let captures = 0;
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry: { nutId: 1, result: {} } });
  f.service.sendMessage = async () => cleanup.promise;
  f.extractor.extractPage = async () => { captures++; return {}; };
  const refresh = f.action.refreshEmptyAnalysis(1);
  f.store.invalidateTab(1, 'https://replacement.test');
  cleanup.resolve({ success: true }); await refresh;
  assert.equal(captures, 0);
  assert.equal(f.store.getTab(1).analysisResult, null);
});

for (const trigger of ['tab return', 'load completion']) test(`${trigger} reuses captured captions without loading empty history or disabling Analyze`, async t => {
  const f = setup(t); let histories = 0, captures = 0;
  const capture = f.store.beginOperation(1, 'extraction');
  f.store.commitOperation(capture.token, { type: 'extracted', content: {
    url: 'https://tab1.test', content: '[00:01] Captions already captured', transcriptAvailable: true, sourceType: 'bilibili',
  } });
  f.service.loadHistory = async () => {
    histories++;
    return [{ nutId: 42, content: 'Old body', result: { analysisFailures: [{ code: 'timeout' }] } }];
  };
  f.extractor.extractPage = async () => { captures++; return { url: 'https://tab1.test', content: 'Fetched again' }; };
  const disabled = [];
  f.store.subscribe(() => {
    if (f.store.activeTabId === 1) disabled.push(!!globalThis.NutEggHelpers.getAnalyzeNotReadyReason(
      f.store.viewModel(), { connectionMode: 'obsidian', serverOnline: true }));
  });
  if (trigger === 'tab return') {
    f.store.activateTab(2);
    await f.action.handleTabActivated({ tabId: 1 });
  } else await f.action.handleTabUpdated(1, { status: 'complete' });
  assert.equal(histories, 0);
  assert.equal(captures, 0);
  assert.equal(disabled.includes(true), false);
  assert.match(f.store.getTab(1).extractedContent.content, /Captions already captured/);
});

test('capture-only cache entries reopen without fetching and restore transcript metadata', async t => {
  const f = setup(t); let captures = 0;
  f.store.invalidateTab(1, 'https://tab1.test');
  f.service.loadHistory = async () => [{ nutId: 42, result: null, content: '[00:01] Saved captions',
    capturePayload: { transcriptAvailable: true, metadata: { cid: '123' }, captureCoverage: { reasons: ['truncated'] } } }];
  f.extractor.extractPage = async () => { captures++; throw new Error('Unexpected refetch'); };
  await f.action.handleTabActivated({ tabId: 1 });
  const tab = f.store.getTab(1);
  assert.equal(tab.currentView, 'capture');
  assert.equal(tab.analysisResult, null);
  assert.equal(tab.currentNutId, null);
  assert.equal(tab.extractedContent.content, '[00:01] Saved captions');
  assert.equal(tab.extractedContent.transcriptAvailable, true);
  assert.equal(tab.extractedContent.metadata.cid, '123');
  assert.ok(tab.warning);
  assert.equal(captures, 0);
});

test('an empty analysis with no captured body still fetches content', async t => {
  const f = setup(t); let captures = 0;
  f.store.invalidateTab(1, 'https://tab1.test');
  f.service.loadHistory = async () => [{ result: { coreSummary: [], analysisFailures: [{ code: 'timeout' }] } }];
  f.extractor.extractPage = async () => { captures++; return { content: 'New body', url: 'https://tab1.test' }; };
  await f.action.handleTabActivated({ tabId: 1 });
  assert.equal(captures, 1);
  assert.equal(f.store.getTab(1).extractedContent.content, 'New body');
});
