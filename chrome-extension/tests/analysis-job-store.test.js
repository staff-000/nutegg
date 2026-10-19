const test = require('node:test');
const assert = require('node:assert/strict');
const { AnalysisJobStore } = require('../src/background/analysis-job-store');
// Deterministic IDB transaction fixture: writes commit together or abort together.
function indexedDBFixture() {
  const db = { records: new Map(), createObjectStore() {}, close() {}, transaction() {
    const pending = new Map(structuredClone([...db.records]));
    const tx = { abort() { tx.aborted = true; setImmediate(() => tx.onabort?.()); }, objectStore() { return {
      getAll() {
        const request = {};
        setImmediate(() => {
          request.result = structuredClone([...pending.values()]); request.onsuccess();
          setImmediate(() => { if (!tx.aborted) { db.records = pending; tx.oncomplete(); } });
        });
        return request;
      },
      put(value) { if (db.fail) throw new Error('Quota exceeded'); pending.set(value.id, structuredClone(value)); },
      delete(id) { pending.delete(id); },
    }; } };
    return tx;
  } };
  return { db, factory: { open() {
    const request = { result: db };
    setImmediate(() => { request.onupgradeneeded(); request.onsuccess(); });
    return request;
  } } };
}

test('IDB saves serialize concurrent requests and retain both full captures', async () => {
  const { factory } = indexedDBFixture(), store = new AnalysisJobStore({ indexedDB: factory });
  await Promise.all(Array.from({ length: 20 }, (_, n) => store.save({ id: String(n), status: 'waiting',
    updatedAt: Date.now(), payload: { content: 'Transcript '.repeat(10000) } })));
  const rows = await store.list();
  assert.equal(rows.length, 20); assert.equal(rows.every(row => row.payload.content.length === 110000), true);
});

test('failed IDB replacement rolls back and releases the queue', async () => {
  const { factory, db } = indexedDBFixture(), store = new AnalysisJobStore({ indexedDB: factory });
  await store.save({ id: 'one', status: 'waiting', updatedAt: Date.now() });
  db.fail = true;
  await assert.rejects(store.save({ id: 'one', status: 'completed', updatedAt: Date.now(), result: 'New' }), /Quota/);
  assert.equal(db.records.get('one').status, 'waiting');
  db.fail = false;
  await store.save({ id: 'two', status: 'waiting', updatedAt: Date.now() });
  assert.equal((await store.list()).length, 2);
});

test('IDB clearing is ordered after earlier saves and cannot erase connected records', async () => {
  const { factory } = indexedDBFixture(), store = new AnalysisJobStore({ indexedDB: factory });
  const save = store.save({ id: 'chrome', status: 'waiting', updatedAt: Date.now(), mode: 'chrome' });
  const clear = store.removeWhere(row => row.mode === 'chrome');
  const connected = store.save({ id: 'obsidian', status: 'waiting', updatedAt: Date.now(), mode: 'obsidian' });
  await Promise.all([save, clear, connected]);
  assert.deepEqual((await store.list()).map(row => row.id), ['obsidian']);
});

test('missing IndexedDB rejects admission with an actionable storage error', async () => {
  await assert.rejects(new AnalysisJobStore({ indexedDB: null }).list(), /storage is unavailable/);
});
