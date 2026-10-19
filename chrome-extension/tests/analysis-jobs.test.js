const test = require('node:test');
const assert = require('node:assert/strict');
const { AnalysisJobManager } = require('../src/background/analysis-jobs');
const { AnalysisJobStore } = require('../src/background/analysis-job-store');
const { deferred } = require('./helpers/extractor-harness');
const tick = () => new Promise(resolve => setImmediate(resolve));
async function until(check) { for (let i = 0; i < 300; i++) { if (check()) return; await tick(); } throw new Error('Fixture did not settle'); }
const { MemoryAnalysisStore: MemoryStore } = require('./helpers/memory-analysis-store');
function fixture(t, options = {}) {
  const store = options.store || new MemoryStore();
  const session = options.session || {}, tabs = new Map(), calls = [], gates = new Map();
  for (let id = 1; id <= 20; id++) tabs.set(id, { id, windowId: id === 20 ? 2 : 1, url: `https://example.org/page/${id}` });
  const api = { storage: { session: { get: async () => structuredClone(session), set: async value => Object.assign(session, structuredClone(value)) } },
    tabs: { get: async id => { if (!tabs.has(id)) throw new Error('Closed'); return tabs.get(id); } },
    runtime: { getPlatformInfo: async () => ({}) } };
  let configuration = { mode: 'obsidian', revision: 'one', cacheAllowed: true };
  const manager = new AnalysisJobManager({ store, chromeApi: api, pageKey: url => url.split('#section')[0],
    getConfiguration: async () => configuration,
    execute: async (payload, progress, signal) => {
      const gate = deferred(); gates.set(payload.title, gate); calls.push({ payload, progress, signal });
      progress({ type: 'partial', section: 'executionQueue', data: { state: options.waiting ? 'waiting' : 'running' } });
      return gate.promise;
    } });
  const submit = (id, extra = {}) => manager.submit({ jobId: `job-${id}`, tabId: id,
    payload: { stage: 1, title: String(id), url: tabs.get(id).url, content: 'Full source '.repeat(4000) }, ...extra });
  t.after(async () => {
    for (const job of manager.jobs.values()) if (['waiting', 'running'].includes(job.status)) await manager.cancel(job.id);
    for (const gate of gates.values()) gate.resolve({ coreSummary: ['Cleanup'] });
    await until(() => !manager.live.size);
  });
  return { manager, store, session, tabs, calls, gates, submit, api, configure: value => { configuration = value; } };
}
function port(manager) {
  let receive, disconnect;
  const events = [];
  manager.attach({ onMessage: { addListener: fn => { receive = fn; } }, onDisconnect: { addListener: fn => { disconnect = fn; } },
    postMessage: event => events.push(structuredClone(event)) });
  return { events, send: value => receive({ protocol: 2, ...value }), close: () => disconnect() };
}

test('twenty accepted jobs finish after every port closes; reopening does not execute again', async t => {
  const f = fixture(t), ports = [];
  for (let id = 1; id <= 20; id++) {
    const p = port(f.manager); ports.push(p);
    p.send({ action: 'analyze', jobId: `job-${id}`, tabId: id,
      payload: { title: String(id), url: f.tabs.get(id).url, content: 'Source' } });
  }
  await until(() => f.calls.length === 20);
  ports.forEach(p => p.close());
  assert.equal(f.calls.some(call => call.signal.aborted), false);
  for (let id = 20; id >= 1; id--) f.gates.get(String(id)).resolve({ coreSummary: [`Result ${id}`] });
  await until(() => !f.manager.live.size);
  assert.equal(f.store.records.filter(job => job.status === 'completed').length, 20);
  const observer = port(f.manager); observer.send({ action: 'subscribe', windowId: 1 });
  await until(() => observer.events.some(event => event.type === 'snapshot'));
  const snapshot = observer.events.find(event => event.type === 'snapshot');
  assert.equal(snapshot.jobs.length, 19);
  assert.equal(snapshot.jobs.every(job => job.detached && !job.payload && !job.result), true);
  assert.equal((await f.manager.detail('job-1')).result.coreSummary[0], 'Result 1');
  assert.equal(f.calls.length, 20);
  assert.equal(f.manager.heartbeat, null);
  observer.close();
});

test('close before acceptance preserves ownership and marks the completed job detached', async t => {
  const f = fixture(t), p = port(f.manager);
  p.send({ action: 'analyze', jobId: 'early', tabId: 1, payload: { title: 'early', url: f.tabs.get(1).url, content: 'Source' } });
  p.close();
  await until(() => f.calls.length === 1);
  f.gates.get('early').resolve({ coreSummary: ['Saved'] });
  await until(() => !f.manager.live.size);
  assert.equal((await f.manager.detail('early')).detached, true);
});

test('duplicate admission shares one execution; differing reuse is rejected', async t => {
  const f = fixture(t);
  const [a, b] = await Promise.all([f.submit(1), f.submit(1)]);
  assert.equal(a.id, b.id);
  await until(() => f.calls.length === 1);
  await assert.rejects(f.submit(1, { payload: { url: f.tabs.get(1).url, content: 'Different' } }), /different inputs/);
  assert.equal(f.store.records[0].payload.content.length > 30000, true);
});

test('explicit cancellation stops waiting work and ignores late provider completion', async t => {
  const f = fixture(t, { waiting: true }); await f.submit(1);
  await until(() => f.calls.length === 1);
  await f.manager.cancel('job-1');
  assert.equal(f.calls[0].signal.aborted, true);
  f.gates.get('1').resolve({ coreSummary: ['Late'] });
  await until(() => !f.manager.live.size);
  assert.equal(f.store.records[0].status, 'cancelled');
  assert.equal(f.store.records[0].result, undefined);
});

for (const scenario of ['away and back', 'reload', 'closed', 'configuration']) {
  test(`${scenario} cancels while detached, without reattaching a stale result`, async t => {
    const f = fixture(t); await f.submit(1); await until(() => f.calls.length === 1);
    if (scenario === 'configuration') {
      f.configure({ mode: 'chrome', revision: 'two', cacheAllowed: true }); await f.manager.configurationChanged();
    } else if (scenario === 'closed') { f.tabs.delete(1); await f.manager.invalidate(1); }
    else if (scenario === 'reload') await f.manager.invalidate(1, f.tabs.get(1).url, true);
    else { await f.manager.invalidate(1, 'https://example.org/new'); await f.manager.invalidate(1, f.tabs.get(1).url); }
    f.gates.get('1').resolve({ coreSummary: ['Obsolete'] });
    await until(() => !f.manager.live.size);
    assert.equal(f.calls[0].signal.aborted, true);
    assert.equal(f.store.records[0].result, undefined);
    if (scenario !== 'configuration') assert.equal(await f.manager.detail('job-1'), null);
  });
}

test('worker restart marks unfinished records interrupted and never resubmits', async t => {
  const f = fixture(t); await f.submit(1); await until(() => f.calls.length === 1);
  const saved = new MemoryStore(); saved.records = structuredClone(f.store.records);
  const next = fixture(t, { store: saved, session: f.session });
  const snapshot = await next.manager.snapshot(1);
  assert.equal(snapshot.jobs[0].status, 'interrupted'); assert.equal(next.calls.length, 0);
  assert.equal(next.manager.heartbeat, undefined);
});

test('different browser sessions cannot attach old tab IDs', async t => {
  const f = fixture(t); await f.submit(1); await until(() => f.calls.length === 1);
  const saved = new MemoryStore(); saved.records = structuredClone(f.store.records);
  const next = fixture(t, { store: saved });
  assert.equal((await next.manager.snapshot(1)).jobs.length, 0);
});

test('Stage 1 stays saved until explicit, atomically deduplicated Stage 2 submission', async t => {
  const f = fixture(t); await f.submit(1); await until(() => f.calls.length === 1);
  f.gates.get('1').resolve({ coreSummary: ['Stage one'], matchedEggs: ['a.md'], nutId: 10 });
  await until(() => !f.manager.live.size);
  assert.equal(f.calls.length, 1);
  const parent = await f.manager.detail('job-1');
  const message = id => ({ jobId: id, tabId: 1, context: { parentJobId: parent.id },
    payload: { ...parent.payload, title: 'second', stage: 2, contentAnalysis: parent.result,
      eggs: ['a.md'], selectedEggs: ['a.md'], cachedEggResults: [{ egg: 'b.md' }] } });
  const [a, b] = await Promise.all([f.manager.submit(message('second-a')), f.manager.submit(message('second-b'))]);
  assert.equal(a.id, b.id);
  await until(() => f.calls.length === 2);
  f.gates.get('second').resolve({ eggResults: [{ egg: 'a.md', extractedEntries: [] }] });
  await until(() => !f.manager.live.size);
  assert.equal((await f.manager.detail(a.id)).payload.content.length > 30000, true);
});

test('admission persistence failure starts no AI work; subsequent writes can recover', async t => {
  const f = fixture(t); await f.manager.init(); f.store.fail = true;
  await assert.rejects(f.submit(1), /Disk unavailable/); assert.equal(f.calls.length, 0);
  f.store.fail = false; await f.submit(1); await until(() => f.calls.length === 1);
});

test('terminal persistence failure keeps the completed result in memory', async t => {
  const f = fixture(t); await f.submit(1); await until(() => f.calls.length === 1);
  await f.store.queue; f.store.fail = true;
  f.gates.get('1').resolve({ coreSummary: ['Usable result'] });
  await until(() => !f.manager.live.size);
  const job = await f.manager.detail('job-1');
  assert.equal(job.status, 'completed'); assert.equal(job.persistenceError, 'job_save_failed');
  assert.equal(f.manager.heartbeat, null); f.store.fail = false;
});

test('clearing Chrome recovery prevents old requests repopulating it', async t => {
  const f = fixture(t); f.configure({ mode: 'chrome', revision: 'one', cacheAllowed: true });
  await f.submit(1); await until(() => f.calls.length === 1);
  await f.manager.clearChrome();
  f.gates.get('1').resolve({ coreSummary: ['Late result'] }); await until(() => !f.manager.live.size);
  assert.equal(f.store.records.length, 0); assert.equal((await f.manager.snapshot(1)).jobs.length, 0);
});

test('disabled Chrome caching finishes without retaining detached results', async t => {
  const f = fixture(t); f.configure({ mode: 'chrome', revision: 'one', cacheAllowed: false });
  await f.submit(1); await until(() => f.calls.length === 1);
  f.gates.get('1').resolve({ coreSummary: ['Uncached'] }); await until(() => !f.manager.live.size);
  assert.equal(f.store.records.length, 0);
});

test('retention evicts only terminal records; full active budget rejects new admission', async () => {
  let now = 100;
  const store = new MemoryStore({ maxTerminal: 2, maxBytes: 2000, retentionMs: 100, now: () => now });
  for (let n = 0; n < 4; n++) await store.save({ id: String(n), status: 'completed', updatedAt: now++ });
  assert.equal(store.records.length, 2);
  await store.save({ id: 'active', status: 'running', updatedAt: now, content: 'x'.repeat(1500) });
  await assert.rejects(store.save({ id: 'other', status: 'waiting', updatedAt: now, content: 'x'.repeat(1500) }), /full/);
  now += 200;
  assert.deepEqual((await store.list()).map(job => job.id), ['active']);
});

test('viewed state persists; credentials are stripped before admission', async t => {
  const f = fixture(t);
  await f.submit(1, { payload: { title: 'clean', url: f.tabs.get(1).url, content: 'Source', headers: { Authorization: 'secret' }, apiKey: 'secret' } });
  await until(() => f.calls.length === 1);
  assert.doesNotMatch(JSON.stringify(f.store.records), /secret/);
  f.gates.get('clean').resolve({ coreSummary: ['Done'] }); await until(() => !f.manager.live.size);
  const p = port(f.manager); p.send({ action: 'viewed', jobId: 'job-1' });
  await until(() => f.store.records[0].viewed);
  assert.equal((await f.manager.snapshot(1)).jobs[0].viewed, true); p.close();
});

test('explicit cancellation before acceptance starts no provider request', async t => {
  const f = fixture(t), p = port(f.manager);
  p.send({ action: 'analyze', jobId: 'cancel-early', tabId: 1, payload: { title: 'early', url: f.tabs.get(1).url, content: 'Source' } });
  p.send({ action: 'cancel', jobId: 'cancel-early' });
  await until(() => p.events.some(event => event.errorCode === 'cancelled' || event.job?.status === 'cancelled'));
  assert.equal(f.calls.length, 0); assert.equal(f.manager.live.size, 0); p.close();
});

test('unknown analysis protocol returns an actionable update error without AI calls', async t => {
  const f = fixture(t), p = port(f.manager);
  p.send({ protocol: 1, action: 'analyze', jobId: 'old' });
  await until(() => p.events.length);
  assert.equal(p.events[0].errorCode, 'job_protocol_mismatch'); assert.equal(f.calls.length, 0); p.close();
});

test('finite job lifetime uses one 25-second heartbeat and removes it after completion', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const f = fixture(t); let heartbeats = 0;
  f.api.runtime.getPlatformInfo = async () => { heartbeats++; };
  await f.submit(1); await f.submit(2); await until(() => f.calls.length === 2);
  t.mock.timers.tick(25000); assert.equal(heartbeats, 1);
  f.gates.get('1').resolve({ coreSummary: ['Done'] }); f.gates.get('2').resolve({ coreSummary: ['Done'] });
  await until(() => !f.manager.live.size);
  t.mock.timers.tick(50000); assert.equal(heartbeats, 1);
});

test('Chrome-only mode never interprets a Stage 2 continuation as another standalone analysis', async t => {
  const f = fixture(t); f.configure({ mode: 'chrome', revision: 'one', cacheAllowed: true });
  await assert.rejects(f.submit(1, { payload: { title: 'No egg route', url: f.tabs.get(1).url, content: 'Source', stage: 2 } }),
    error => error.code === 'obsidian_mode_required');
  assert.equal(f.calls.length, 0);
});

test('cancellation releases the heartbeat even if a provider ignores its abort signal', async t => {
  const f = fixture(t); await f.submit(1); await until(() => f.calls.length === 1);
  await f.manager.cancel('job-1');
  await until(() => !f.manager.live.size);
  assert.equal(f.manager.heartbeat, null);
  assert.equal((await f.manager.detail('job-1')).status, 'cancelled');
  f.gates.get('1').resolve({ coreSummary: ['Too late'] }); await tick();
  assert.equal((await f.manager.detail('job-1')).result, undefined);
});

test('moving a live job to another window changes subscriptions, not execution', async t => {
  const f = fixture(t); await f.submit(1); await until(() => f.calls.length === 1);
  f.tabs.get(1).windowId = 2; await f.manager.move(1, 2);
  assert.equal((await f.manager.snapshot(1)).jobs.length, 0);
  assert.equal((await f.manager.snapshot(2)).jobs.length, 1);
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0].signal.aborted, false);
});

test('ordinary anchors preserve a job, while application hash routes invalidate it', async t => {
  const f = fixture(t); await f.submit(1); await until(() => f.calls.length === 1);
  await f.manager.invalidate(1, f.tabs.get(1).url + '#section-one');
  assert.equal(f.calls[0].signal.aborted, false);
  await f.manager.invalidate(1, f.tabs.get(1).url + '#/another-route');
  await f.manager.invalidate(1, f.tabs.get(1).url);
  assert.equal(f.calls[0].signal.aborted, true);
  assert.equal(await f.manager.detail('job-1'), null);
});

test('provider-side payload mutation cannot rewrite the admitted capture', async t => {
  const f = fixture(t); await f.submit(1); await until(() => f.calls.length === 1);
  f.calls[0].payload.content = 'Provider mutated input';
  assert.notEqual((await f.manager.detail('job-1')).payload.content, 'Provider mutated input');
});

test('save receipts validate record identity, survive continuation and cannot downgrade Hatch', async t => {
  const f = fixture(t); await f.submit(1); await until(() => f.calls.length === 1);
  f.gates.get('1').resolve({ coreSummary: ['Stage 1'], nutId: 9 });
  await until(() => !f.manager.live.size);
  await f.manager.markSaved('job-1', 99, true);
  assert.equal((await f.manager.detail('job-1')).saved, undefined);
  await f.manager.markSaved('job-1', 9, false);
  const child = await f.manager.submit({ jobId: 'child', tabId: 1, context: { parentJobId: 'job-1' },
    payload: { stage: 2, title: 'child', url: f.tabs.get(1).url, content: 'Source', nutId: 9 } });
  assert.equal(child.saved, 'skip');
  await until(() => f.calls.length === 2);
  f.gates.get('child').resolve({ nutId: 9, eggResults: [] }); await until(() => !f.manager.live.size);
  await f.manager.markSaved(child.id, 9, true); await f.manager.markSaved('job-1', 9, false);
  assert.equal((await f.manager.detail('job-1')).saved, 'skip');
  assert.equal((await f.manager.detail(child.id)).saved, 'saved');
  const fresh = await f.manager.submit({ jobId: 'fresh-analysis', tabId: 1,
    payload: { stage: 1, title: 'fresh', url: f.tabs.get(1).url, content: 'Changed source', nutId: 9 } });
  assert.equal(fresh.saved, undefined, 'reanalysis must not inherit an earlier Hatch');
});
