// Durable request recovery. No credentials, provider clients, or queue ownership live here.
class AnalysisJobStore {
  constructor({ indexedDB: factory = globalThis.indexedDB, maxBytes = 50 * 1024 * 1024,
    maxTerminal = 100, retentionMs = 24 * 60 * 60 * 1000, now = Date.now } = {}) {
    Object.assign(this, { factory, maxBytes, maxTerminal, retentionMs, now });
    this.queue = Promise.resolve();
  }
  open() {
    if (!this.opening) this.opening = new Promise((resolve, reject) => {
      if (!this.factory) return reject(Object.assign(new Error('Analysis recovery storage is unavailable'), { code: 'job_storage_unavailable' }));
      const request = this.factory.open('NutEggAnalysisJobs', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('jobs', { keyPath: 'id' });
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Analysis recovery storage is blocked'));
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); this.opening = null; };
        resolve(db);
      };
    }).catch(error => { this.opening = null; throw error; });
    return this.opening;
  }
  mutate(transform) {
    const task = this.queue.then(async () => {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('jobs', 'readwrite'), store = tx.objectStore('jobs');
        let result, failure;
        tx.oncomplete = () => resolve(result);
        tx.onerror = tx.onabort = () => reject(failure || tx.error || new Error('Could not save analysis recovery'));
        const request = store.getAll();
        request.onsuccess = () => {
          try {
            const previous = request.result;
            const changed = transform(previous.map(record => structuredClone(record)));
            result = changed.result;
            const next = this.trim(changed.records);
            const ids = new Set(next.map(record => record.id));
            for (const record of previous) if (!ids.has(record.id)) store.delete(record.id);
            for (const record of next) if (!changed.putIds || changed.putIds.has(record.id)) store.put(record);
          } catch (error) { failure = error; tx.abort(); }
        };
      });
    });
    this.queue = task.catch(() => {});
    return task;
  }
  trim(records) {
    const active = records.filter(record => ['waiting', 'running'].includes(record.status));
    const terminal = records.filter(record => !['waiting', 'running'].includes(record.status) &&
      this.now() - record.updatedAt < this.retentionMs).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, this.maxTerminal);
    const bytes = value => new TextEncoder().encode(JSON.stringify(value)).length;
    let size = bytes(active);
    if (size > this.maxBytes) throw Object.assign(new Error('Analysis recovery storage is full'), { code: 'job_storage_full' });
    const kept = [...active];
    for (const record of terminal) {
      const length = bytes(record) + (kept.length ? 1 : 0);
      if (size + length > this.maxBytes) continue;
      kept.push(record); size += length;
    }
    return kept;
  }
  list() { return this.mutate(records => ({ records, result: this.trim(records), putIds: new Set() })); }
  save(record) {
    return this.mutate(records => {
      const next = records.filter(value => value.id !== record.id).concat([record]);
      if (!this.trim(next).some(value => value.id === record.id))
        throw Object.assign(new Error('Analysis recovery storage is full'), { code: 'job_storage_full' });
      return { records: next, putIds: new Set([record.id]) };
    });
  }
  removeWhere(predicate) {
    return this.mutate(records => ({ records: records.filter(value => !predicate(value)), putIds: new Set() }));
  }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { AnalysisJobStore };
