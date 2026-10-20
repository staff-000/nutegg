const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture, deferred } = require('./helpers/popup-fixture');
const { MemoryAnalysisStore } = require('./helpers/memory-analysis-store');
const { AnalysisJobManager } = require('../src/background/analysis-jobs');
const { AnalysisService } = require('../src/popup/services/analysis-service');
const { PopupOperations } = require('../src/popup/services/popup-operations');
const tick = () => new Promise(resolve => setImmediate(resolve));
async function until(check) { for (let i = 0; i < 1000; i++) { if (check()) return; await tick(); } throw new Error('Recovery did not settle'); }
function setup(t, mode = 'obsidian') {
  const store = new MemoryAnalysisStore(), session = {}, requests = [], gates = [], ports = [];
  const tabs = new Map([1, 2].map(id => [id, { id, windowId: 7, url: `https://tab${id}.test/` }]));
  const api = { storage: { session: { get: async () => structuredClone(session), set: async value => Object.assign(session, value) } },
    tabs: { get: async id => { if (!tabs.has(id)) throw new Error('Closed'); return tabs.get(id); }, query: async () => [...tabs.values()] },
    runtime: { getPlatformInfo: async () => ({}) } };
  const manager = new AnalysisJobManager({ store, chromeApi: api,
    pageKey: value => globalThis.NutEggAI.capturePageKey(value),
    getConfiguration: async () => ({ mode, revision: 'test', cacheAllowed: true }),
    execute: async (payload, progress, signal) => {
      requests.push({ payload, signal }); const gate = deferred(); gates.push(gate);
      progress({ type: 'partial', section: 'executionQueue', data: { state: 'running' } });
      progress({ type: 'partial', section: 'summary', data: { coreSummary: ['Working summary'] } });
      return gate.promise;
    } });
  function connect(owned) {
    let clientMessage, clientDisconnect, serverMessage, serverDisconnect, closed = false;
    const client = { onMessage: { addListener: fn => { clientMessage = fn; } }, onDisconnect: { addListener: fn => { clientDisconnect = fn; } },
      postMessage: value => { if (closed) throw new Error('Closed'); serverMessage(structuredClone(value)); },
      disconnect() { if (closed) return; closed = true; serverDisconnect(); clientDisconnect?.(); } };
    manager.attach({ onMessage: { addListener: fn => { serverMessage = fn; } }, onDisconnect: { addListener: fn => { serverDisconnect = fn; } },
      postMessage: value => { if (!closed) clientMessage?.(structuredClone(value)); } });
    owned.push(client); ports.push(client); return client;
  }
  function panel() {
    const base = fixture(), owned = [];
    const panelApi = { ...api, runtime: { ...api.runtime, connect: () => connect(owned) } };
    const service = new AnalysisService({ chrome: panelApi });
    const operations = new PopupOperations({ store: base.store, service, extractor: base.extractor, chromeApi: panelApi });
    return { ...base, operations, service, close: () => owned.forEach(p => p.disconnect()) };
  }
  t.after(async () => {
    ports.forEach(p => p.disconnect());
    for (const job of manager.jobs.values()) await manager.cancel(job.id);
    gates.forEach(gate => gate.resolve({ coreSummary: ['cleanup'], mode }));
    await until(() => !manager.live.size);
  });
  return { manager, requests, gates, panel, tabs };
}

test('reopening restores full Stage 1 and waits for explicit Stage 2 without another Stage 1 call', async t => {
  const f = setup(t), original = f.panel(); await original.operations.initializeRecovery();
  const source = original.store.beginOperation(1, 'extraction');
  original.store.commitOperation(source.token, { type: 'extracted', content: { url: 'https://tab1.test/', title: 'Long',
    content: 'Source '.repeat(15000), outputLanguage: 'zh', sourceType: 'youtube', captureCoverage: { reasons: ['loading_timeout'] } } });
  const pending = original.operations.analyze(1, { analysisMode: 'full', eggs: ['a.md'], outputLanguage: 'zh' });
  await until(() => f.requests.length === 1);
  const sessionId = original.store.debugSessionId;
  original.close(); await pending;
  assert.equal(f.requests[0].signal.aborted, false);
  f.gates[0].resolve({ mode: 'obsidian', nutId: 9, coreSummary: ['Done'], matchedEggs: ['a.md'] });
  await until(() => !f.manager.live.size);
  const reopened = f.panel(); await reopened.operations.initializeRecovery(); await reopened.operations.restoreForTab(1);
  let tab = reopened.store.getTab(1);
  assert.equal(reopened.store.debugSessionId, sessionId);
  assert.equal(tab.stage1Payload.content.length, 105000);
  assert.equal(tab.analysisResult.coreSummary[0], 'Done');
  assert.equal(tab.backgroundJob.detached, true);
  assert.ok(tab.warning);
  assert.equal(f.requests.length, 1);
  const second = reopened.operations.eggs(1, { eggs: ['a.md'] });
  await until(() => f.requests.length === 2);
  assert.equal(f.requests[1].payload.stage, 2);
  assert.equal(f.requests[1].payload.content.length, 105000);
  assert.equal(f.requests[1].payload.outputLanguage, 'zh');
  reopened.close();
  await second;
  f.gates[1].resolve({ mode: 'obsidian', nutId: 9, eggResults: [{ egg: 'a.md', extractedEntries: [{ kind: 'insight', content: 'Saved egg entry' }], keyQuestionAnswers: [] }] });
  await until(() => !f.manager.live.size);
  const final = f.panel(); await final.operations.initializeRecovery(); await final.operations.restoreForTab(1);
  tab = final.store.getTab(1);
  assert.equal(tab.analysisResult.stage, 'stage2');
  assert.equal(tab.analysisResult.eggResults[0].extractedEntries[0].content, 'Saved egg entry');
  assert.equal(f.requests.length, 2);
});

test('an uninterrupted original panel retains automatic Stage 2 behavior', async t => {
  const f = setup(t), p = f.panel(); await p.operations.initializeRecovery();
  const pending = p.operations.analyze(1, { analysisMode: 'full', eggs: ['a.md'] });
  await until(() => f.requests.length === 1);
  f.gates[0].resolve({ mode: 'obsidian', nutId: 10, coreSummary: ['Done'], matchedEggs: ['a.md'] });
  await until(() => f.requests.length === 2);
  // Activation while automatic Stage 2 is pending cannot restore the old Stage 1 over it.
  assert.equal(await p.operations.restoreForTab(1), false);
  f.gates[1].resolve({ mode: 'obsidian', eggResults: [{ egg: 'a.md', extractedEntries: [], keyQuestionAnswers: [] }] });
  assert.equal((await pending).success, true);
  assert.equal(p.store.getTab(1).analysisResult.stage, 'stage2');
});

test('reopening during execution restores progress and independent unread completion', async t => {
  const f = setup(t, 'chrome'), p = f.panel(); await p.operations.initializeRecovery();
  const pending = p.operations.analyze(2, {}); await until(() => f.requests.length === 1);
  p.close(); await pending;
  const next = f.panel(); await next.operations.initializeRecovery();
  assert.equal(next.store.getAnalysisActivity().find(job => job.tabId === 2).running, true);
  next.store.activateTab(2); await next.operations.restoreForTab(2);
  assert.deepEqual(next.store.getTab(2).analysisResult.coreSummary, ['Working summary']);
  next.store.activateTab(1);
  f.gates[0].resolve({ mode: 'chrome', nutId: 'chrome_1', coreSummary: ['Finished'] });
  await until(() => !f.manager.live.size); await tick();
  assert.equal(next.store.getAnalysisActivity().find(job => job.tabId === 2).running, false);
  next.store.activateTab(2); await next.operations.restoreForTab(2);
  const revision = next.store.getTab(2).resultRevision;
  next.store.dispatch({ type: 'viewed', tabId: 2, revision });
  await until(() => [...f.manager.jobs.values()][0].viewed);
  assert.equal(f.requests.length, 1);
});

test('recovery cannot recreate a closed tab or overwrite a newer page', async t => {
  const f = setup(t), p = f.panel(); await p.operations.initializeRecovery();
  const pending = p.operations.analyze(1, {}); await until(() => f.requests.length === 1);
  const metadata = f.manager.summary([...f.manager.jobs.values()][0]);
  p.close(); await pending;
  const next = f.panel(); await next.operations.initializeRecovery();
  f.tabs.delete(1); next.store.invalidateTab(1, '', true);
  await next.operations.handleBackgroundJob({ type: 'job', job: { ...metadata, revision: metadata.revision + 10 } });
  assert.equal(next.store.getTab(1), null);
});

test('tab startup waits for recovery before ordinary history or fetching', async () => {
  const { TabAction } = require('../src/popup/action/tab');
  const f = fixture(), gate = deferred(); let history = 0, extraction = 0;
  f.operations.recoveryReady = gate.promise;
  f.operations.restoreForTab = async () => true;
  f.operations.history = async () => { history++; };
  f.operations.extract = async () => { extraction++; };
  const action = new TabAction({ tabStateManager: f.store, operations: f.operations });
  const lease = f.store.activateTab(1);
  const pending = action.restoreOrExtract(lease, f.store.getTab(1), {});
  await tick(); assert.equal(history + extraction, 0);
  gate.resolve(); await pending;
  assert.equal(history + extraction, 0);
});

test('obsolete recovered progress and snapshots cannot overwrite a new route', async t => {
  const f = setup(t), p = f.panel(); await p.operations.initializeRecovery();
  const pending = p.operations.analyze(1, {}); await until(() => f.requests.length === 1);
  p.close(); await pending;
  const next = f.panel(); await next.operations.initializeRecovery(); await next.operations.restoreForTab(1);
  const old = [...f.manager.jobs.values()][0];
  f.tabs.set(1, { id: 1, windowId: 7, url: 'https://new.test/' }); next.store.invalidateTab(1, 'https://new.test/');
  await next.operations.handleBackgroundJob({ type: 'partial', jobId: old.id, revision: 999,
    section: 'summary', data: { coreSummary: ['Obsolete'] } });
  await next.operations.handleBackgroundJob({ type: 'job', job: { ...f.manager.summary(old), revision: 999 } });
  assert.equal(next.store.getTab(1).analysisResult, null);
});

test('late recovery cannot replace a history entry the user explicitly selected', async () => {
  const f = fixture(), gate = deferred();
  const job = { id: 'stored', owner: { tabId: 1, key: 'https://tab1.test/' }, stage: 1, status: 'completed',
    revision: 3, createdAt: 1, updatedAt: 2, payload: { url: 'https://tab1.test/', title: 'New', content: 'Source' },
    context: {}, result: { mode: 'obsidian', coreSummary: ['Newest'] } };
  f.operations.recoveryJobs.set(1, job);
  f.store.beginOperation(1, 'analysis');
  f.store.dispatch({ type: 'backgroundJobSummary', tabId: 1, pageGeneration: f.store.getTab(1).pageGeneration, job });
  f.service.getJob = () => gate.promise;
  const pending = f.operations.restoreForTab(1);
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry: { url: 'https://tab1.test/', content: 'Chosen',
    result: { coreSummary: ['User choice'] }, nutId: 'chosen' } });
  gate.resolve(job); assert.equal(await pending, false);
  assert.equal(f.store.getTab(1).analysisResult.coreSummary[0], 'User choice');
});

test('a recovered completed result exposes a local-save warning without rerunning', async () => {
  const f = fixture();
  const job = { id: 'unsaved', owner: { tabId: 1, key: 'https://tab1.test/' }, stage: 1, status: 'completed',
    revision: 4, createdAt: 1, updatedAt: 2, persistenceError: 'job_save_failed',
    payload: { url: 'https://tab1.test/', title: 'Saved in memory', content: 'Full source', debugScope: 'old-session:1:9' },
    result: { mode: 'chrome', nutId: 'memory', coreSummary: ['Usable'] }, context: {} };
  f.operations.recoveryJobs.set(1, job);
  f.store.beginOperation(1, 'analysis');
  f.store.dispatch({ type: 'backgroundJobSummary', tabId: 1, pageGeneration: f.store.getTab(1).pageGeneration, job });
  f.service.getJob = async () => job;
  await f.operations.restoreForTab(1);
  assert.ok(f.store.getTab(1).warning.includes(t('jobSaveFailed')));
  assert.equal(f.store.getTab(1).debugScope, 'old-session:1:9');
  assert.equal(f.calls.length, 0);
});

test('losing the recovery connection releases restored loading flags without resubmitting', async t => {
  const f = setup(t), first = f.panel(); await first.operations.initializeRecovery();
  const pending = first.operations.analyze(1, {}); await until(() => f.requests.length === 1);
  first.close(); await pending;
  const next = f.panel(); await next.operations.initializeRecovery(); await next.operations.restoreForTab(1);
  next.service.jobPort.disconnect(); await tick();
  assert.equal(next.store.getTab(1).operations.analysis.running, false);
  assert.equal(next.store.getTab(1).errors.analysis.code, 'job_connection_lost');
  assert.equal(f.requests[0].signal.aborted, false);
  assert.equal(f.requests.length, 1);
});

for (const scenario of ['disabled cache', 'cleared cache']) {
  test(`a reopened panel still receives a running job's result with ${scenario}`, async t => {
    const f = setup(t, 'chrome');
    if (scenario === 'disabled cache') f.manager.getConfiguration = async () => ({ mode: 'chrome', revision: 'test', cacheAllowed: false });
    const first = f.panel(); await first.operations.initializeRecovery();
    const pending = first.operations.analyze(1, {}); await until(() => f.requests.length === 1);
    if (scenario === 'cleared cache') await f.manager.clearChrome();
    first.close(); await pending;
    const next = f.panel(); await next.operations.initializeRecovery(); await next.operations.restoreForTab(1);
    assert.equal(next.store.getTab(1).operations.analysis.running, true);
    f.gates[0].resolve({ mode: 'chrome', nutId: 'temporary', coreSummary: ['Visible result'] });
    await until(() => next.store.getTab(1).analysisResult?.coreSummary?.[0] === 'Visible result');
    assert.equal(f.requests.length, 1);
    next.close();
    await until(() => !f.manager.live.size);
    assert.equal((await f.manager.snapshot(7)).jobs.length, 0);
  });
}

test('tab reactivation preserves follow-ups, egg selections and save state after local completion', async t => {
  const f = setup(t), p = f.panel(); await p.operations.initializeRecovery();
  const pending = p.operations.analyze(1, {}); await until(() => f.requests.length === 1);
  f.gates[0].resolve({ mode: 'obsidian', nutId: 9, coreSummary: ['Done'], matchedEggs: ['a.md'] });
  await pending; await until(() => !f.manager.live.size);
  const save = p.store.beginOperation(1, 'saving', {}, ['resultRevision']);
  p.store.commitOperation(save.token, { type: 'saved', hatch: true, message: 'Saved' });
  p.store.dispatch({ type: 'draft', tabId: 1, values: { selectedEggs: ['b.md'] } });
  const answer = deferred(); p.service.sendMessage = () => answer.promise;
  const followup = p.operations.followup(1, 'Keep this question');
  p.store.activateTab(2); p.store.activateTab(1); await p.operations.restoreForTab(1);
  await f.manager.markSaved(p.store.getTab(1).backgroundJob.id, 9, true);
  await tick(); // New terminal metadata must not replay the old analysis either.
  answer.resolve({ answers: [{ answer: 'Keep this answer' }] }); await followup;
  const tab = p.store.getTab(1);
  assert.equal(tab.eggHatched, true); assert.equal(tab.nutCollected, true);
  assert.deepEqual(tab.selectedEggs, ['b.md']);
  assert.equal(tab.followUpQa[0]?.answer, 'Keep this answer');
  assert.equal(f.requests.length, 1);
});

for (const hatch of [false, true]) {
  test(`confirmed ${hatch ? 'Hatch' : 'collection'} remains saved after reopening`, async t => {
    const f = setup(t), p = f.panel(); await p.operations.initializeRecovery();
    const pending = p.operations.analyze(1, {}); await until(() => f.requests.length === 1);
    f.gates[0].resolve({ mode: 'obsidian', nutId: 9, coreSummary: ['Done'],
      newKnowledge: [{ egg: 'a.md', content: 'Insight' }], matchedEggs: [] });
    await pending; await until(() => !f.manager.live.size);
    if (hatch) {
      const eggs = p.operations.eggs(1, { eggs: ['a.md'] });
      await until(() => f.requests.length === 2);
      f.gates[1].resolve({ mode: 'obsidian', nutId: 9, eggResults: [{ egg: 'a.md', extractedEntries: [],
        keyQuestionAnswers: [{ question: 'Q', answer: 'Supported answer' }] }] });
      await eggs; await until(() => !f.manager.live.size);
    }
    // Use the real save orchestration; the fixture's backend only confirms the write.
    p.service.sendMessage = async () => ({ success: true });
    assert.equal((await p.operations.save(1, hatch)).success, true);
    p.close();
    const next = f.panel(); await next.operations.initializeRecovery(); await next.operations.restoreForTab(1);
    const tab = next.store.getTab(1);
    assert.equal(tab.nutCollected, true); assert.equal(tab.eggHatched, hatch);
    assert.equal(tab.captureHistory[0].saved, hatch ? 'saved' : 'skip');
    assert.equal(f.requests.length, hatch ? 2 : 1);
  });
}

for (const status of ['failed', 'cancelled', 'interrupted']) {
  test(`${status} Stage 2 preserves cached successes and retries only missing eggs`, async () => {
    const f = fixture();
    const cached = { egg: 'a.md', generateKnowledgeEntries: true,
      keyQuestionAnswers: [], extractedEntries: [{ kind: 'insight', content: 'Already succeeded' }],
      generation: { status: 'partial', processedParts: 1, totalParts: 2, failedParts: ['2'] } };
    const job = { id: 'stage2', stage: 2, status, revision: 5, createdAt: 1, updatedAt: 2,
      owner: { tabId: 1, key: 'https://tab1.test/' }, error: 'Stopped', errorCode: status,
      payload: { url: 'https://tab1.test/', title: 'Source', content: 'Full source', nutId: 7,
        contentAnalysis: { mode: 'obsidian', nutId: 7, coreSummary: ['Stage 1'], matchedEggs: ['a.md', 'b.md'] },
        eggs: ['b.md'], selectedEggs: ['a.md', 'b.md'], cachedEggResults: [cached], generateKnowledgeEntries: true }, context: {} };
    f.operations.recoveryJobs.set(1, job); f.store.beginOperation(1, 'analysis');
    f.store.dispatch({ type: 'backgroundJobSummary', tabId: 1, pageGeneration: f.store.getTab(1).pageGeneration, job });
    f.service.getJob = async () => job; await f.operations.restoreForTab(1);
    const tab = f.store.getTab(1);
    assert.deepEqual(tab.analysisResult.eggResults, [cached]);
    assert.deepEqual(tab.selectedEggs, ['a.md', 'b.md']);
    if (status === 'cancelled') {
      assert.equal(tab.errors.analysis, undefined);
      assert.equal(tab.analysisCancelled, true);
    } else assert.equal(tab.errors.analysis.message, 'Stopped');
    assert.equal(tab.completion, null, 'a usable partial result is not an unread success');
    const retry = f.operations.eggs(1, { eggs: ['a.md', 'b.md'] });
    assert.deepEqual(f.calls[0].payload.eggs, ['b.md']);
    f.calls[0].resolve({ mode: 'obsidian', nutId: 7, eggResults: [{ egg: 'b.md', extractedEntries: [], keyQuestionAnswers: [] }] });
    await retry;
    assert.deepEqual(f.store.getTab(1).analysisResult.eggResults.map(r => r.egg), ['a.md', 'b.md']);
  });
}

test('failed Stage 1 restores reason and original retry context without another fetch', async t => {
  const f = setup(t, 'chrome'), p = f.panel(); await p.operations.initializeRecovery();
  const pending = p.operations.analyze(1, { chromeMode: true, outputLanguage: 'ja', questions: ['Original'] });
  await until(() => f.requests.length === 1);
  const source = structuredClone(f.requests[0].payload);
  p.close(); await pending;
  f.gates[0].resolve({ error: 'Provider response', errorCode: 'rate_limited' });
  await until(() => !f.manager.live.size);
  const reopened = f.panel(); await reopened.operations.initializeRecovery(); await reopened.operations.restoreForTab(1);
  assert.equal(reopened.store.getTab(1).errors.analysis.code, 'rate_limited');
  assert.equal(reopened.store.getTab(1).analysisRetry.payload.outputLanguage, 'ja');
  reopened.extractor.extractPage = () => { throw new Error('Should not fetch'); };
  const retry = reopened.operations.retryAnalysis(1);
  assert.equal((await reopened.operations.retryAnalysis(1)).busy, true);
  await until(() => f.requests.length === 2);
  assert.deepEqual(f.requests[1].payload, source);
  f.gates[1].resolve({ mode: 'chrome', coreSummary: ['Recovered'] }); await retry;
  assert.equal(reopened.store.getTab(1).errors.analysis, undefined);
  assert.equal(reopened.store.getTab(1).analysisResult.coreSummary[0], 'Recovered');
});

test('restored partial Stage 2 retries as a new job even when inputs repeat', async t => {
  const f = setup(t), p = f.panel(); await p.operations.initializeRecovery();
  const pending = p.operations.analyze(1, { analysisMode: 'full', eggs: ['a.md'] });
  await until(() => f.requests.length === 1);
  f.gates[0].resolve({ mode: 'obsidian', nutId: 12, coreSummary: ['Stage 1'], matchedEggs: ['a.md'] });
  await until(() => f.requests.length === 2);
  const failedEgg = { egg: 'a.md', extractedEntries: [], keyQuestionAnswers: [], analysisFailures: [{ section: 'egg', code: 'timeout' }] };
  f.gates[1].resolve({ mode: 'obsidian', eggResults: [failedEgg] }); await pending;
  p.close();
  const reopened = f.panel(); await reopened.operations.initializeRecovery(); await reopened.operations.restoreForTab(1);
  assert.ok(reopened.store.getTab(1).analysisResult.eggResults[0].analysisFailures);
  for (let i = 2; i < 4; i++) {
    const retry = reopened.operations.retryAnalysis(1);
    await until(() => f.requests.length === i + 1);
    assert.equal(f.requests[i].payload.stage, 2);
    f.gates[i].resolve({ mode: 'obsidian', eggResults: [failedEgg] }); await retry;
  }
  assert.equal(f.requests.length, 4);
  assert.equal([...f.manager.jobs.values()].filter(job => job.stage === 1).length, 1);
});

test('failed requests durably preserve source and already streamed output for reopening', async t => {
  const f = setup(t, 'chrome'), p = f.panel(); await p.operations.initializeRecovery();
  const pending = p.operations.analyze(1, { chromeMode: true });
  await until(() => f.requests.length === 1);
  f.gates[0].resolve({ error: 'AI request timed out', errorCode: 'timeout' }); await pending;
  await until(() => !f.manager.live.size);
  const job = [...f.manager.jobs.values()][0];
  assert.equal(job.status, 'failed');
  assert.equal(job.payload.content, 'Content 1');
  assert.deepEqual(job.result.coreSummary, ['Working summary']);
  assert.equal(p.store.getTab(1).errors.analysis.code, 'timeout');
  assert.deepEqual(p.store.getTab(1).analysisResult.coreSummary, ['Working summary']);
  assert.equal(p.store.getTab(1).completion, null);
  p.close();
  const reopened = f.panel(); await reopened.operations.initializeRecovery(); await reopened.operations.restoreForTab(1);
  const tab = reopened.store.getTab(1);
  assert.equal(tab.extractedContent.content, 'Content 1');
  assert.deepEqual(tab.analysisResult.coreSummary, ['Working summary']);
  assert.equal(tab.errors.analysis.code, 'timeout');
  assert.equal(tab.completion, null);
  assert.equal(f.requests.length, 1);
});
