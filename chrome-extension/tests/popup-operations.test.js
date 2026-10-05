const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixture, deferred, seed } = require('./helpers/popup-fixture');
const options = { analysisMode: 'confirm', outputLanguage: 'same-as-content', chromeMode: false };
const answer = egg => ({ egg, readAction: 'full', readVerdict: true, extractedEntries: [{ content: `Knowledge ${egg}` }], keyQuestionAnswers: [] });
for (const order of [[0, 1], [1, 0]]) test(`concurrent analysis completes independently in order ${order}`, async () => {
  const { store, operations, calls } = fixture();
  const a = operations.analyze(1, options); store.activateTab(2);
  const b = operations.analyze(2, options); store.activateTab(1);
  for (const i of order) calls[i].resolve({ titleVerdict: `Result ${i + 1}`, matchedEggs: [], nutId: i + 1 });
  await Promise.all([a, b]);
  for (const id of [1, 2, 1]) { store.activateTab(id); assert.equal(store.viewModel().analysisResult.titleVerdict, `Result ${id}`); assert.equal(store.viewModel().currentView, 'results'); }
  assert.equal(store.getAnalysisActivity().length, 2);
});
test('fast Stage 1 → Stage 2 is continuous, reuses captured settings and opens background results', async () => {
  const { store, operations, calls } = fixture();
  const job = operations.analyze(1, { ...options, analysisMode: 'fast' });
  store.activateTab(2); store.dispatch({ type: 'draft', tabId: 1, values: { generateKnowledgeEntries: false } });
  calls[0].resolve({ stage: 'stage1', titleVerdict: 'Stage 1', matchedEggs: ['a.md'] });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(store.getAnalysisActivity().length, 1); assert.equal(store.getAnalysisActivity()[0].running, true);
  assert.equal(calls[1].payload.generateKnowledgeEntries, true);
  assert.equal(store.viewModel(1).analyzingEggs, true);
  calls[1].resolve({ eggResults: [answer('a.md')] }); await job;
  assert.equal(store.viewModel(1).currentView, 'results'); assert.equal(store.viewModel(1).analyzingEggs, false);
  assert.equal(store.getTab(1).analysisResult.stage, 'stage2');
  assert.equal(store.viewModel(1).isStage1(), false);
});
test('confirmation and Stage 2 finish separately; incremental selection preserves prior eggs', async () => {
  const { store, operations, calls } = fixture();
  const a = operations.analyze(1, options); calls[0].resolve({ titleVerdict: 'First', matchedEggs: ['a.md'] }); await a;
  const firstRevision = store.getTab(1).completion.revision;
  const b = operations.eggs(1, { ...options, eggs: ['a.md'] }); calls[1].resolve({ eggResults: [answer('a.md')] }); await b;
  assert.equal(store.getTab(1).analysisResult.stage, 'stage2');
  assert(store.getTab(1).completion.revision > firstRevision);
  const c = operations.eggs(1, { ...options, eggs: ['a.md', 'b.md'] });
  assert.deepEqual(calls[2].payload.eggs, ['b.md']); calls[2].resolve({ eggResults: [answer('b.md')] }); await c;
  const completion = store.getTab(1).completion;
  const cached = await operations.eggs(1, { ...options, eggs: ['a.md'] });
  assert.equal(calls.length, 3); assert.deepEqual(store.getTab(1).completion, completion);
  assert.equal(store.getTab(1).analysisResult.eggAnalysisCache.length, 2);
  assert.equal(cached.result.stage, 'stage2');
  assert.equal(store.getTab(1).analysisResult.stage, 'stage2');
  assert.equal(store.getTab(1).stage1ContentAnalysis.stage, 'stage1');
});
test('Stage 2 uses its response mode and cached selection cannot restore a Chrome Stage 1 marker', async () => {
  const { store, operations, calls } = fixture();
  seed(store, 1, { stage: 'stage1', mode: 'chrome', titleVerdict: 'Chrome summary' });
  const job = operations.eggs(1, { ...options, eggs: ['a.md'] });
  calls[0].resolve({ stage: 'stage2', mode: 'obsidian', eggResults: [answer('a.md')] }); await job;
  assert.equal(store.viewModel(1).isStage1(), false);
  await operations.eggs(1, { ...options, eggs: ['a.md'] });
  assert.equal(store.getTab(1).analysisResult.mode, 'obsidian');
  assert.equal(store.viewModel(1).isStage1(), false);
  assert.equal(calls.length, 1);
});
test('cached analysis failures report an error without a new job or losing prior results', async t => {
  const { store, operations } = fixture();
  seed(store, 1, { stage: 'stage2', matchedEggs: ['a.md'], eggResults: [answer('a.md')] });
  const previous = store.getTab(1).analysisResult;
  const ai = globalThis.NutEggAI; t.after(() => { globalThis.NutEggAI = ai; });
  globalThis.NutEggAI = { composeEggResults() { throw new Error('Cannot compose cached results'); } };
  const result = await operations.eggs(1, { ...options, eggs: ['a.md'] });
  assert.equal(result.error, 'Cannot compose cached results');
  assert.equal(store.viewModel(1).error, result.error);
  assert.deepEqual(store.getTab(1).analysisResult, previous);
  assert.equal(store.isBusy(1), false); assert.equal(store.getAnalysisActivity().length, 0);
});
test('knowledge-off selection retains cached entries and new requests honor the captured choice', async () => {
  const { store, operations, calls } = fixture();
  seed(store, 1, { stage: 'stage1', titleVerdict: 'Base' });
  store.dispatch({ type: 'draft', tabId: 1, values: { generateKnowledgeEntries: false } });
  const job = operations.eggs(1, { ...options, eggs: ['a.md'] });
  assert.equal(calls[0].payload.generateKnowledgeEntries, false);
  calls[0].resolve({ eggResults: [{ ...answer('a.md'), generateKnowledgeEntries: false, extractedEntries: [] }] }); await job;
  await operations.eggs(1, { ...options, eggs: ['a.md'] }); assert.equal(calls.length, 1);
  store.dispatch({ type: 'draft', tabId: 1, values: { generateKnowledgeEntries: true } });
  const rerun = operations.eggs(1, { ...options, eggs: ['a.md'] });
  calls[1].resolve({ eggResults: [answer('a.md')] }); await rerun;
  store.dispatch({ type: 'draft', tabId: 1, values: { generateKnowledgeEntries: false } });
  await operations.eggs(1, { ...options, eggs: ['a.md'] });
  assert.equal(store.getTab(1).analysisResult.eggResults[0].extractedEntries.length, 1);
});
for (const stage of ['stage1', 'stage2']) test(`navigation discards late ${stage} success and failure`, async () => {
  for (const reject of [false, true]) {
    const { store, operations, calls } = fixture(); seed(store, 1, { stage: 'stage1' });
    const job = stage === 'stage1' ? operations.analyze(1, options) : operations.eggs(1, { ...options, eggs: ['a.md'] });
    store.invalidateTab(1, 'https://new.test');
    reject ? calls[0].reject(new Error('OLD')) : calls[0].resolve({ titleVerdict: 'OLD', eggResults: [answer('a.md')] });
    await job;
    assert.equal(store.getTab(1).analysisResult, null); assert.deepEqual(store.getTab(1).errors, {});
  }
});
test('old history cannot replace analysis completed while it was loading', async () => {
  const { store, operations, service, calls } = fixture(); const d = deferred(); service.loadHistory = () => d.promise;
  const history = operations.history(1); const analysis = operations.analyze(1, options);
  calls[0].resolve({ titleVerdict: 'New' }); await analysis;
  d.resolve([{ result: { titleVerdict: 'Old' } }]); await history;
  assert.equal(store.getTab(1).analysisResult.titleVerdict, 'New'); assert.equal(store.getTab(1).operations.history.running, false);
});
test('history restores usable content after extraction fails, then Egg Analysis uses it', async () => {
  const { store, operations, service, extractor, calls } = fixture();
  store.invalidateTab(1, 'https://tab1.test'); extractor.extractPage = async () => null;
  await operations.extract(1);
  assert.equal(store.viewModel(1).error, t('couldNotExtractContent'));
  service.loadHistory = async () => [{ nutId: 17, title: 'Restored page', url: 'https://tab1.test', content: 'Restored body',
    result: { stage: 'stage1', matchedEggs: ['a.md'] } }];
  await operations.history(1);
  assert.equal(store.viewModel(1).error, null);
  const job = operations.eggs(1, { ...options, eggs: ['a.md'] });
  assert.equal(calls[0].payload.content, 'Restored body'); assert.equal(calls[0].payload.nutId, 17);
  calls[0].resolve({ mode: 'obsidian', eggResults: [answer('a.md')] }); await job;
  assert.equal(store.getTab(1).analysisResult.stage, 'stage2');
});
test('Egg Analysis falls back from an empty Stage 1 snapshot to its captured fetched content', async () => {
  const { store, operations, calls } = fixture();
  store.invalidateTab(1, 'https://tab1.test');
  store.dispatch({ type: 'historySelected', tabId: 1, entry: { nutId: 42, url: 'https://tab1.test', result: { stage: 'stage1', matchedEggs: ['a.md'] } } });
  const extraction = store.beginOperation(1, 'extraction');
  store.commitOperation(extraction.token, { type: 'extracted', content: { title: 'Fetched page', url: 'https://tab1.test', content: 'Available content' } });
  assert.equal(store.getTab(1).stage1Payload.content, '');
  const job = operations.eggs(1, { ...options, eggs: ['a.md'] }); store.activateTab(2);
  assert.equal(calls[0].payload.content, 'Available content'); assert.equal(calls[0].payload.nutId, 42);
  calls[0].resolve({ mode: 'obsidian', eggResults: [answer('a.md')] }); await job;
  assert.equal(store.getTab(1).analysisResult.stage, 'stage2');
});
test('late extraction failure cannot overwrite content restored from history', async () => {
  const { store, operations, extractor } = fixture(); const d = deferred();
  extractor.extractPage = () => d.promise;
  const job = operations.extract(1); await new Promise(resolve => setImmediate(resolve));
  store.dispatch({ type: 'historySelected', tabId: 1, entry: { nutId: 1, content: 'History body', result: { stage: 'stage1' } } });
  d.resolve(null); await job;
  assert.equal(store.getTab(1).extractedContent.content, 'History body');
  assert.equal(store.viewModel(1).error, null);
  assert.equal(store.viewModel(1).extractionPending, false);
});
test('late extraction cannot resurrect a closed or refreshed page', async () => {
  const { store, operations, extractor } = fixture(); const d = deferred(); extractor.extractPage = () => d.promise;
  const extraction = operations.extract(1); await new Promise(resolve => setImmediate(resolve));
  store.invalidateTab(1, '', true); d.resolve({ content: 'Old', url: 'https://tab1.test' }); await extraction;
  assert.equal(store.getTab(1), null);
});
test('follow-up snapshot belongs to the originating result and exact question', async () => {
  const { store, operations, service } = fixture(); const d = deferred(); seed(store, 1, { titleVerdict: 'A' });
  let message; service.sendMessage = m => { message = m; return d.promise; };
  const job = operations.followup(1, 'Question', { outputLanguage: 'zh-CN' }); store.activateTab(2);
  assert.equal(message.payload.content, 'Content 1'); assert.equal(message.payload.outputLanguage, 'zh-CN');
  d.resolve({ answers: [{ answer: 'Answer' }] }); await job;
  assert.equal(store.getTab(1).followUpQa[0].answer, 'Answer'); assert.equal(store.getTab(2).followUpQa.length, 0);
});
test('follow-up navigation discards responses and errors without recreating the page', async () => {
  const { store, operations, service } = fixture(); const d = deferred(); service.sendMessage = () => d.promise;
  const job = operations.followup(1, 'Question'); store.invalidateTab(1, '', true);
  d.resolve({ answers: [{ answer: 'Old' }] }); await job; assert.equal(store.getTab(1), null);
});
test('Hatch uses captured result, retains a receipt after navigation, and never recreates the old tab', async () => {
  const { store, operations, service } = fixture(); const d = deferred(); let payload;
  seed(store, 1, { eggResults: [answer('a.md')], newKnowledge: [{ egg: 'a.md', content: 'Insight' }] });
  service.sendMessage = message => { payload = message.payload; return d.promise; };
  const job = operations.save(1, true); store.invalidateTab(1, '', true);
  d.resolve({ success: true }); await job;
  assert.equal(payload.newKnowledge[0].content, 'Insight'); assert.equal(store.getTab(1), null);
  assert.equal(store.receipts.length, 1); assert.equal(store.receipts[0].success, true);
});
test('successful saving is separate from Stage 2 and attaches only to its result', async () => {
  const { store, operations, service } = fixture(); seed(store, 1, { titleVerdict: 'A' });
  const d = deferred(); service.sendMessage = () => d.promise; const job = operations.save(1, false);
  assert.equal(store.viewModel(1).savingToVault, true); assert.equal(store.viewModel(1).analyzingEggs, false);
  store.activateTab(2); d.resolve({ success: true }); await job;
  assert.equal(store.getTab(1).nutCollected, true); assert.equal(store.getTab(2).nutCollected, false);
});
test('Hatch accepts question-only knowledge and rejects an empty save payload even with displayed entries', async () => {
  const { store, operations, calls, service } = fixture();
  seed(store, 1, { stage: 'stage1', matchedEggs: ['ama.md'] });
  const job = operations.eggs(1, { ...options, eggs: ['ama.md'] });
  calls[0].resolve({ eggResults: [{ egg: 'ama.md', extractedEntries: [], keyQuestionAnswers: [
    { question: 'What matters?', answer: 'The important answer.', answered: true },
  ] }] }); await job;
  const knowledge = store.getTab(1).analysisResult.newKnowledge;
  assert.equal(knowledge.length, 1);
  let payload; let saves = 0;
  service.sendMessage = async message => { saves++; payload = message.payload; return { success: true }; };
  const saved = await operations.save(1, true);
  assert.equal(saved.success, true); assert.deepEqual(payload.newKnowledge, knowledge);
  assert.equal(store.getTab(1).eggHatched, true);
  seed(store, 2, { stage: 'stage2', eggResults: [answer('a.md')], newKnowledge: [] });
  const empty = await operations.save(2, true);
  assert.equal(empty.error, t('noNewKnowledgeToAdd')); assert.equal(saves, 1);
});
test('disconnected saving records an unknown receipt without reviving a closed tab', async () => {
  const { store, operations, service } = fixture(); seed(store, 1, { titleVerdict: 'Result' });
  const d = deferred(); service.sendMessage = () => d.promise;
  const job = operations.save(1, false); store.invalidateTab(1, '', true);
  d.reject(new Error('Disconnected')); await job;
  assert.equal(store.getTab(1), null); assert.equal(store.receipts[0].outcome, 'unknown');
});
test('creation updates the global catalog and continues only on its captured page', async () => {
  const { store, operations, service, calls } = fixture(); const d = deferred(); service.createEgg = () => d.promise;
  const job = operations.create(1, { ...options, name: 'New', desc: 'Desc' }); store.activateTab(2);
  d.resolve({ success: true, path: 'new.md' }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(store.catalog[0].fileName, 'new.md'); assert.equal(calls[0].payload.url, 'https://tab1.test');
  calls[0].resolve({ titleVerdict: 'A' }); await job; assert.equal(store.getTab(2).analysisResult, null);
});
test('creation after navigation still updates catalog but does not analyze the replacement page', async () => {
  const { store, operations, service, calls } = fixture(); const d = deferred(); service.createEgg = () => d.promise;
  const job = operations.create(1, { ...options, name: 'New' }); store.invalidateTab(1, 'https://new.test');
  d.resolve({ success: true, path: 'new.md' }); await job;
  assert.equal(store.catalog[0].fileName, 'new.md'); assert.equal(calls.length, 0);
});
test('creation supersedes a pending catalog response; identical fetches share one request', async () => {
  const { store, operations, service } = fixture(); const d = deferred(); let count = 0; service.sendMessage = () => { count++; return d.promise; };
  const a = operations.catalog(), b = operations.catalog();
  store.dispatch({ type: 'eggCreated', egg: { fileName: 'new.md' } }); d.resolve({ eggs: [] }); await Promise.all([a, b]);
  assert.equal(count, 1); assert.equal(store.catalog[0].fileName, 'new.md');
});
