const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture } = require('./helpers/popup-fixture');
const { analysisFailureNotice } = require('../src/popup/helpers');
const { BannersComponent } = require('../src/popup/ui/banners');
const options = { chromeMode: true, analysisMode: 'preview', outputLanguage: 'ja', questions: ['Original question'] };

test('retry uses original capture/options, submits once, and retains tab ownership', async () => {
  const f = fixture(); let fetches = 0;
  f.extractor.extractPage = async () => { fetches++; throw new Error('Must not fetch'); };
  const initial = f.operations.analyze(1, options);
  f.calls[0].resolve({ error: 'raw provider body secret-key', errorCode: 'timeout' }); await initial;
  assert.match(analysisFailureNotice(f.store.viewModel(1)).message, /timed out/);
  const originalPayload = structuredClone(f.calls[0].payload);
  f.store.dispatch({ type: 'draft', tabId: 1, values: { customQuestions: 'Changed', generateKnowledgeEntries: true } });
  const retry = f.operations.retryAnalysis(1);
  assert.equal((await f.operations.retryAnalysis(1)).busy, true);
  f.store.activateTab(2);
  assert.deepEqual(f.calls[1].payload, originalPayload);
  f.calls[1].resolve({ mode: 'chrome', coreSummary: ['Recovered'] }); await retry;
  assert.equal(fetches, 0); assert.equal(f.calls.length, 2);
  assert.equal(f.store.getTab(1).analysisResult.coreSummary[0], 'Recovered');
  assert.equal(f.store.getTab(2).analysisResult, null);
  assert.equal(analysisFailureNotice(f.store.viewModel(1)), null);
});

test('Stage 2 retries failed eggs, retaining successful eggs and original Stage 1', async () => {
  const f = fixture();
  f.store.dispatch({ type: 'draft', tabId: 1, values: { generateKnowledgeEntries: true } });
  const first = f.operations.analyze(1, { ...options, chromeMode: false, analysisMode: 'full', eggs: ['good.md', 'bad.md'] });
  f.calls[0].resolve({ nutId: 12, coreSummary: ['Stage 1'], matchedEggs: ['good.md', 'bad.md'] });
  await new Promise(resolve => setImmediate(resolve));
  const good = { egg: 'good.md', extractedEntries: [{ content: 'Keep me' }], keyQuestionAnswers: [] };
  const bad = { egg: 'bad.md', extractedEntries: [], keyQuestionAnswers: [], analysisFailures: [{ section: 'egg', code: 'rate_limited', part: 1 }] };
  f.calls[1].resolve({ eggResults: [good, bad] }); await first;
  assert.match(analysisFailureNotice(f.store.viewModel()).message, /partially completed/);
  const retry = f.operations.retryAnalysis(1);
  assert.equal(f.calls[2].payload.stage, 2);
  assert.deepEqual(f.calls[2].payload.eggs, ['bad.md']);
  assert.deepEqual(f.calls[2].payload.contentAnalysis.coreSummary, ['Stage 1']);
  f.calls[2].resolve({ eggResults: [{ ...bad, analysisFailures: undefined, extractedEntries: [{ content: 'Recovered' }] }] }); await retry;
  assert.equal(f.calls.length, 3);
  assert.equal(f.store.getTab(1).analysisResult.eggResults[0].extractedEntries[0].content, 'Keep me');
  assert.equal(analysisFailureNotice(f.store.viewModel()), null);
});

test('whole Stage 2 failure retries that stage without rerunning Stage 1', async () => {
  const f = fixture();
  const first = f.operations.analyze(1, { analysisMode: 'full', eggs: ['a.md'] });
  f.calls[0].resolve({ coreSummary: ['Stage 1'], matchedEggs: ['a.md'] });
  await new Promise(resolve => setImmediate(resolve));
  f.calls[1].resolve({ error: 'Server exploded', errorCode: 'server_error' }); await first;
  assert.equal(f.store.getTab(1).stage1ContentAnalysis.coreSummary[0], 'Stage 1');
  const retry = f.operations.retryAnalysis(1);
  assert.equal(f.calls[2].payload.stage, 2);
  f.calls[2].resolve({ eggResults: [] }); await retry;
  assert.equal(f.calls.length, 3);
});

test('navigation invalidates retries and rejects late results', async () => {
  const f = fixture(); const first = f.operations.analyze(1, options);
  f.calls[0].resolve({ error: 'Timeout', errorCode: 'timeout' }); await first;
  const retry = f.operations.retryAnalysis(1);
  f.store.invalidateTab(1, 'https://different.test');
  f.calls[1].resolve({ mode: 'chrome', coreSummary: ['Obsolete'] }); await retry;
  assert.equal(f.store.getTab(1).analysisResult, null);
  assert.equal(f.store.getTab(1).analysisRetry, null);
  await f.operations.retryAnalysis(1); assert.equal(f.calls.length, 2);
});

test('known reasons, unknown-safe fallback, settings actions, neutral cancellation', async () => {
  for (const code of ['timeout', 'network_error', 'rate_limited', 'quota_exceeded', 'auth_failed', 'model_not_found', 'server_error', 'unexpected']) {
    const notice = analysisFailureNotice({ errors: { analysis: { code, message: 'https://signed.url/?key=secret' } } });
    assert.ok(notice.message); assert.doesNotMatch(notice.message, /secret|signed.url/);
    assert.equal(notice.settings, ['quota_exceeded', 'auth_failed', 'model_not_found'].includes(code));
  }
  const f = fixture(); const first = f.operations.analyze(1, options);
  f.calls[0].resolve({ error: 'User cancelled', errorCode: 'cancelled' }); await first;
  assert.equal(f.store.getTab(1).errors.analysis, undefined);
  assert.equal(f.store.getTab(1).analysisCancelled, true);
  assert.equal(analysisFailureNotice(f.store.viewModel()).neutral, true);
});

test('failure controls show reasons, disable while busy, hide after success', () => {
  const elements = new Map();
  const root = { getElementById(id) { if (!elements.has(id)) elements.set(id, {
    classList: { values: new Set(), toggle(key, on) { on ? this.values.add(key) : this.values.delete(key); }, add() {}, remove() {} },
    addEventListener() {}, textContent: '',
  }); return elements.get(id); } };
  const ui = new BannersComponent(root);
  const view = { pageGeneration: 5, analysisRetry: { pageGeneration: 5 }, errors: { analysis: { code: 'auth_failed' } }, busy: true };
  ui.renderAnalysisFailure(view);
  assert.match(root.getElementById('analysis-failure-message').textContent, /Authorization/);
  assert.equal(root.getElementById('analysis-retry-btn').disabled, true);
  assert.equal(root.getElementById('analysis-settings-btn').classList.values.has('hidden'), false);
  ui.renderAnalysisFailure({ ...view, busy: false });
  assert.equal(root.getElementById('analysis-retry-btn').disabled, false);
  ui.renderAnalysisFailure({ errors: {} });
  assert.equal(root.getElementById('analysis-failure-banner').classList.values.has('hidden'), true);
});

test('shared processor reports partial Stage 1 failures without provider text', async () => {
  const p = new NutEggAI.AIProcessor({ settings: {}, isConfigured: () => true });
  p.analyzeBodySection = async (_capture, sections) => {
    if (sections.mindMap) throw Object.assign(new Error('secret API payload'), { code: 'timeout' });
    return { coreSummary: ['Successful summary'], customQuestionAnswers: [] };
  };
  const result = await p.analyzeContent({ title: 'Test', content: 'Body', url: 'https://example.test',
    sourceType: 'article', optimizeForConversation: false });
  assert.deepEqual(result.coreSummary, ['Successful summary']);
  assert.deepEqual(result.analysisFailures, [{ section: 'mindmap', code: 'timeout' }]);
  assert.doesNotMatch(JSON.stringify(result), /secret/);
});

test('knowledge chunk failure preserves successful entries and identifies failed coverage', async () => {
  const p = new NutEggAI.AIProcessor({ settings: {}, isConfigured: () => true });
  p.chunkContent = () => [{ content: 'First', index: 0, total: 2 }, { content: 'Second', index: 1, total: 2 }];
  p.callAI = async prompt => {
    if (prompt.includes('Second')) throw Object.assign(new Error('secret'), { code: 'rate_limited' });
    return JSON.stringify({ extractedEntries: [{ content: 'Keep this', kind: 'insight' }] });
  };
  const failures = [];
  const entries = await p.extractChromeKnowledge({ title: 'T', content: 'Original', url: 'https://example.test', sourceType: 'article' },
    (error, part) => failures.push({ code: error.code, part }));
  assert.equal(entries[0].content, 'Keep this');
  assert.deepEqual(failures, [{ code: 'rate_limited', part: 2 }]);
});

test('shared egg failures retain successful eggs and distinguish an empty successful result', async () => {
  const p = new NutEggAI.AIProcessor({ settings: {}, isConfigured: () => true });
  p.callAI = async prompt => {
    if (prompt.includes('bad.md')) throw Object.assign(new Error('secret'), { code: 'auth_failed' });
    return JSON.stringify({ extractedEntries: [], keyQuestionAnswers: [], readAction: 'skip', readVerdictReason: 'No relevant insights' });
  };
  const egg = fileName => ({ fileName, topic: fileName, scope: '', actionGuide: '', keyQuestions: [], worthReadingIf: [],
    skipIf: [], knowledge: '', unprocessed: '', formattingRules: '' });
  const result = await p.analyzeEggs({ title: 'T', content: 'Body', url: 'https://example.test', sourceType: 'article' },
    [egg('good.md'), egg('bad.md')], { titleVerdict: '', coreSummary: [], customQuestionAnswers: [] });
  assert.equal(result.eggResults[0].analysisFailures, undefined);
  assert.deepEqual(result.eggResults[1].analysisFailures, [{ section: 'egg', code: 'auth_failed', part: 1 }]);
});

test('healthy egg generation cannot hide a failed Stage 1 task from retry', async () => {
  const f = fixture();
  f.store.dispatch({ type: 'draft', tabId: 1, values: { generateKnowledgeEntries: true } });
  const first = f.operations.analyze(1, { analysisMode: 'full', eggs: ['a.md'], outputLanguage: 'ja' });
  f.calls[0].resolve({ coreSummary: ['Summary'], matchedEggs: ['a.md'], analysisFailures: [{ section: 'mindmap', code: 'timeout' }] });
  await new Promise(resolve => setImmediate(resolve));
  const healthy = { egg: 'a.md', extractedEntries: [{ content: 'Keep egg' }], keyQuestionAnswers: [] };
  f.calls[1].resolve({ eggResults: [healthy] }); await first;
  const retry = f.operations.retryAnalysis(1);
  assert.equal(f.calls[2].payload.stage, 1);
  assert.equal(f.calls[2].payload.outputLanguage, 'ja');
  f.calls[2].resolve({ coreSummary: ['Recovered'], matchedEggs: ['a.md'] }); await retry;
  assert.equal(f.store.getTab(1).analysisResult.eggAnalysisCache[0].extractedEntries[0].content, 'Keep egg');
  assert.equal(analysisFailureNotice(f.store.viewModel()), null);
});

test('retrying Stage 1 honors the original full-analysis workflow', async () => {
  const f = fixture();
  const first = f.operations.analyze(1, { analysisMode: 'full', eggs: ['a.md'] });
  f.calls[0].resolve({ error: 'Timeout', errorCode: 'timeout' }); await first;
  const retry = f.operations.retryAnalysis(1);
  f.calls[1].resolve({ coreSummary: ['Recovered Stage 1'], matchedEggs: ['a.md'] });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.calls[2].payload.stage, 2);
  f.calls[2].resolve({ eggResults: [{ egg: 'a.md', extractedEntries: [], keyQuestionAnswers: [] }] });
  await retry;
  assert.equal(f.store.getTab(1).analysisResult.stage, 'stage2');
  assert.equal(f.store.getTab(1).operations.analysis.running, false);
});

test('long-source chunk failure retains other parts without another AI request', async () => {
  const p = new NutEggAI.AIProcessor({ settings: {}, isConfigured: () => true });
  p.chunkContent = () => [{ content: 'First', index: 0, total: 2 }, { content: 'Second', index: 1, total: 2 }];
  let calls = 0;
  p.callContentChunk = async capture => {
    calls++;
    if (capture.content === 'Second') throw Object.assign(new Error('Timeout'), { code: 'timeout' });
    return { titleVerdict: 'First part', coreSummary: ['Keep the first part'], customQuestionAnswers: [], mindMap: [{ name: 'First concept' }] };
  };
  p.aggregateContent = () => { throw new Error('No extra call on partial chunks'); };
  const result = await p.analyzeContent({ title: 'Test', content: 'Long body', url: 'https://example.test', sourceType: 'article' });
  assert.equal(calls, 2);
  assert.deepEqual(result.coreSummary, ['Keep the first part']);
  assert.equal(result.mindMap[0].name, 'First concept');
  assert.equal(result.analysisFailures[0].part, 2);
  assert.equal(result.analysisFailures[0].code, 'timeout');
});

test('aggregation failure retains per-part content in source order', async () => {
  const p = new NutEggAI.AIProcessor({ settings: {}, isConfigured: () => true });
  p.chunkContent = () => [{ content: 'First', index: 0, total: 2 }, { content: 'Second', index: 1, total: 2 }];
  p.callContentChunk = async capture => ({ titleVerdict: capture.content, coreSummary: [capture.content], mindMap: [], customQuestionAnswers: [] });
  p.aggregateContent = async () => { throw Object.assign(new Error('Bad response'), { code: 'invalid_response' }); };
  const result = await p.analyzeContent({ title: 'Test', content: 'Long body', url: 'https://example.test', sourceType: 'article' });
  assert.deepEqual(result.coreSummary, ['First', 'Second']);
  assert.equal(result.analysisFailures[0].code, 'invalid_response');
});

test('empty AI responses are reported as unusable rather than successful empty analysis', async () => {
  const p = new NutEggAI.AIProcessor({ settings: {}, isConfigured: () => true });
  p.callAI = async () => '';
  await assert.rejects(p.analyzeContent({ title: 'T', content: 'Body', url: 'https://example.test', sourceType: 'article',
    enabledSections: { titleVerdict: true, coreSummary: true, mindMap: false } }), error => error.code === 'invalid_response');
});
