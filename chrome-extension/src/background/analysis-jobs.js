// Each accepted stage is a background-owned job. Ports are replaceable subscribers.
const ANALYSIS_JOB_PROTOCOL = 2;
const analysisJobActive = job => ['waiting', 'running'].includes(job.status);
function analysisJobClean(value) {
  if (Array.isArray(value)) return value.map(analysisJobClean);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) =>
    !/^(?:authorization|headers|api_?key|chromeAiApiKey|access_?token|refresh_?token|credentials)$/i.test(key)
  ).map(([key, child]) => [key, analysisJobClean(child)]));
}
function analysisJobSignature(value) {
  if (Array.isArray(value)) return '[' + value.map(analysisJobSignature).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ':' + analysisJobSignature(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
class AnalysisJobManager {
  constructor({ store, execute, chromeApi = chrome, getConfiguration, pageKey, sourceKey = pageKey,
    beforeInitialize = async () => {}, now = Date.now }) {
    Object.assign(this, { store, execute, api: chromeApi, getConfiguration, pageKey, sourceKey, beforeInitialize, now });
    this.jobs = new Map(); this.live = new Map(); this.subscribers = new Set();
    this.epochs = {}; this.windows = {}; this.chain = Promise.resolve(); this.cacheEpoch = 0; this.cancelledIds = new Map(); this.lastCreatedAt = 0;
  }
  exclusive(task) {
    const result = this.chain.then(task);
    this.chain = result.catch(() => {});
    return result;
  }
  init() {
    if (!this.initializing) this.initializing = (async () => {
      await this.beforeInitialize();
      const saved = await this.api.storage.session.get(['analysisBrowserSession', 'analysisPanelSessions', 'analysisPageEpochs']);
      this.sessionId = saved.analysisBrowserSession || crypto.randomUUID();
      this.windows = saved.analysisPanelSessions || {}; this.epochs = saved.analysisPageEpochs || {};
      await this.saveSession();
      for (const record of await this.store.list()) {
        if (analysisJobActive(record)) {
          record.status = 'interrupted'; record.revision++; record.updatedAt = this.now();
          record.errorCode = 'job_interrupted';
          await this.store.save(record);
        }
        this.jobs.set(record.id, record);
        this.lastCreatedAt = Math.max(this.lastCreatedAt, record.createdAt);
      }
    })().catch(error => { this.initializing = null; throw error; });
    return this.initializing;
  }
  saveSession() {
    return this.api.storage.session.set({ analysisBrowserSession: this.sessionId,
      analysisPanelSessions: this.windows, analysisPageEpochs: this.epochs });
  }
  async windowSession(windowId) {
    if (!this.windows[windowId]) {
      this.windows[windowId] = crypto.randomUUID(); await this.saveSession();
    }
    return this.windows[windowId];
  }
  async owner(tabId, expectedUrl) {
    const tab = await this.api.tabs.get(tabId);
    const key = this.pageKey(tab.url);
    if (expectedUrl && this.sourceKey(tab.url) !== this.sourceKey(expectedUrl)) throw Object.assign(new Error('Page changed'), { code: 'stale' });
    let epoch = this.epochs[tabId];
    if (!epoch || epoch.key !== key) {
      epoch = this.epochs[tabId] = { key, generation: (epoch?.generation || 0) + 1 };
      await this.saveSession();
    }
    return { tabId, windowId: tab.windowId, key, generation: epoch.generation, browserSession: this.sessionId };
  }
  async valid(job) {
    if (job.owner.browserSession !== this.sessionId) return false;
    try {
      const owner = await this.owner(job.owner.tabId);
      return owner.key === job.owner.key && owner.generation === job.owner.generation;
    } catch { return false; }
  }
  summary(job) {
    const { payload, context, result, signature, continuation, ...metadata } = job;
    return { ...metadata, debugScope: payload.debugScope, title: payload.title, sourceType: payload.sourceType };
  }
  notify(job, event = { type: 'job', job: this.summary(job) }) {
    for (const subscriber of this.subscribers) {
      if (subscriber.jobId === job.id || subscriber.windowId === job.owner.windowId) {
        try { subscriber.send({ ...event, jobId: job.id, revision: job.revision }); } catch {}
      }
    }
  }
  async persist(job) {
    if (job.discardRecovery) return;
    try {
      const { persistenceError, ...record } = job;
      await this.store.save(analysisJobClean(record)); delete job.persistenceError;
    }
    catch (error) {
      if (analysisJobActive(job)) throw Object.assign(error, { code: error.code || 'job_storage_failed' });
      job.persistenceError = 'job_save_failed';
    }
  }
  async digest(value) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(analysisJobSignature(value)));
    return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
  async submit(message) {
    await this.init();
    return this.exclusive(async () => {
      if (!message.jobId || !Number.isInteger(message.tabId) || !message.payload?.url || !message.payload?.content)
        throw new Error('Invalid analysis job');
      const payload = analysisJobClean(structuredClone(message.payload));
      const context = analysisJobClean(structuredClone(message.context || {}));
      const signature = await this.digest({ payload, context, tabId: message.tabId });
      const previous = this.jobs.get(message.jobId);
      if (previous) {
        if (previous.signature !== signature) throw new Error('Analysis job ID was reused with different inputs');
        if (!await this.valid(previous)) throw Object.assign(new Error('Page changed'), { code: 'stale' });
        return previous;
      }
      if (this.cancelledIds.has(message.jobId)) throw Object.assign(new Error('Analysis cancelled'), { code: 'cancelled' });
      const owner = await this.owner(message.tabId, payload.url);
      const configuration = await this.getConfiguration();
      const stage = Number(payload.stage) === 2 ? 2 : 1;
      let continuation;
      if (stage === 2 && configuration.mode !== 'obsidian') throw Object.assign(new Error('Egg analysis requires Obsidian-connected mode'), { code: 'obsidian_mode_required' });
      if (stage === 2 && context.parentJobId) {
        const parent = this.jobs.get(context.parentJobId);
        if (!parent || parent.status !== 'completed' || !await this.valid(parent) || parent.owner.tabId !== owner.tabId)
          throw Object.assign(new Error('Stage 1 is no longer available. Reopen its analysis.'), { code: 'stale' });
        const { debugScope, ...request } = payload;
        continuation = context.parentJobId + ':' + await this.digest({ request, configuration: this.configurationKey(configuration) });
        // An explicit retry is a new attempt, even when a prior partial result
        // completed with exactly the same inputs. Ordinary continuation stays deduplicated.
        if (context.retryOfJobId) continuation += ':' + message.jobId;
        const existing = [...this.jobs.values()].find(job => job.continuation === continuation && !['cancelled', 'failed', 'interrupted'].includes(job.status));
        if (existing) return existing;
      }
      if ([...this.jobs.values()].some(job => job.owner.tabId === owner.tabId && analysisJobActive(job)))
        throw Object.assign(new Error('This tab already has a submitted analysis'), { code: 'job_busy' });
      const panelSession = await this.windowSession(owner.windowId);
      const job = { id: message.jobId, revision: 1, stage, status: 'waiting', owner,
        payload, context, configuration, signature, continuation, panelSession,
        parentJobId: context.parentJobId, createdAt: this.lastCreatedAt = Math.max(this.now(), this.lastCreatedAt + 1), updatedAt: this.now(), viewed: false, detached: false,
        cacheEpoch: this.cacheEpoch };
      const parent = stage === 2 && this.jobs.get(context.parentJobId);
      if (parent?.saved && this.sameRecord(parent, job, payload.nutId)) job.saved = 'skip';
      await this.persist(job); // Admission must be durable before any AI call.
      this.jobs.set(job.id, job);
      if (this.cancelledIds.has(job.id)) {
        job.status = 'cancelled'; job.errorCode = 'cancelled'; job.revision++; await this.persist(job);
        return job;
      }
      this.live.set(job.id, { controller: new AbortController(), partials: new Map() });
      this.keepAlive();
      // Finish admission and attach the subscriber before starting asynchronous execution.
      queueMicrotask(() => { void this.run(job).catch(() => {}); });
      return job;
    });
  }
  keepAlive() {
    if (this.heartbeat || !this.live.size) return;
    this.heartbeat = setInterval(() => { void this.api.runtime.getPlatformInfo().catch(() => {}); }, 25000);
  }
  configurationKey(value) {
    const { cacheAllowed, cacheGeneration, ...execution } = value;
    return analysisJobSignature(execution);
  }
  async waitForExecution(task, signal) {
    let listener;
    try {
      signal.throwIfAborted();
      return await Promise.race([task, new Promise((_, reject) => {
        listener = () => reject(signal.reason || Object.assign(new Error('Analysis cancelled'), { code: 'cancelled' }));
        signal.addEventListener('abort', listener, { once: true });
      })]);
    } finally {
      if (listener) signal.removeEventListener('abort', listener);
      Promise.resolve(task).catch(() => {});
    }
  }
  async run(job) {
    const live = this.live.get(job.id);
    try {
      if (!await this.valid(job)) throw Object.assign(new Error('Page changed'), { code: 'stale' });
      if (this.configurationKey(await this.getConfiguration()) !== this.configurationKey(job.configuration))
        throw Object.assign(new Error('AI connection changed'), { code: 'execution_changed' });
      live.controller.signal.throwIfAborted();
      const result = await this.waitForExecution(this.execute(structuredClone(job.payload), event => {
        if (!analysisJobActive(job) || live.controller.signal.aborted) return;
        live.partials.set(`${event.section}:${event.data?.egg || ''}`, structuredClone(event));
        if (live.partials.size > 128) live.partials.delete(live.partials.keys().next().value);
        if (event.section === 'executionQueue') {
          job.status = event.data?.state === 'waiting' ? 'waiting' : 'running'; job.revision++; job.updatedAt = this.now();
          void this.persist(job).catch(error => this.cancel(job.id, 'job_storage_failed', error.message));
          this.notify(job);
        }
        this.notify(job, { type: 'partial', ...event, jobId: job.id, revision: job.revision });
      }, live.controller.signal, job.configuration), live.controller.signal);
      live.controller.signal.throwIfAborted();
      if (!await this.valid(job)) throw Object.assign(new Error('Page changed'), { code: 'stale' });
      if (result?.error) throw Object.assign(new Error(result.error), { code: result.errorCode || 'analysis_failed' });
      job.result = analysisJobClean(result); job.status = 'completed';
    } catch (error) {
      if (!['cancelled', 'interrupted'].includes(job.status)) {
        job.status = live.controller.signal.aborted || ['cancelled', 'stale', 'execution_changed'].includes(error.code) ? 'cancelled' : 'failed';
        job.errorCode = error.code || 'analysis_failed'; job.error = error.message;
        if (job.status === 'failed' && await this.valid(job)) {
          const partial = {};
          const fields = { summary: ['titleVerdict', 'coreSummary', 'customQuestionAnswers', 'conversation'],
            mindmap: ['mindMap', 'conversation'], knowledge: ['extractedEntries'], discussion: ['discussion'], matchedEggs: ['matchedEggs'] };
          for (const event of live.partials.values()) for (const field of Object.hasOwn(fields, event.section) ? fields[event.section] : [])
            if (event.data?.[field] !== undefined) partial[field] = analysisJobClean(event.data[field]);
          if (Object.keys(partial).length) job.result = { ...partial, stage: job.stage === 2 ? 'stage2' : 'stage1',
            mode: job.configuration.mode, analysisFailures: [{ section: 'analysis', code: job.errorCode }] };
        }
      }
    } finally {
      job.revision++; job.updatedAt = this.now();
      if (job.configuration.mode === 'chrome' && (!job.configuration.cacheAllowed || job.cacheEpoch !== this.cacheEpoch)) {
        job.discardRecovery = true;
        await this.store.removeWhere(record => record.id === job.id).catch(() => {});
      } else await this.persist(job);
      this.notify(job);
      this.live.delete(job.id);
      if (!this.live.size) { clearInterval(this.heartbeat); this.heartbeat = null; }
      if (job.discardRecovery && !this.hasSubscribers(job)) this.jobs.delete(job.id);
      await this.prune().catch(() => {});
    }
  }
  hasSubscribers(job) {
    return [...this.subscribers].some(value => value.jobId === job.id || value.windowId === job.owner.windowId);
  }
  async prune() {
    const ids = new Set((await this.store.list()).map(record => record.id));
    for (const job of this.jobs.values()) if (!analysisJobActive(job) && !ids.has(job.id) && !job.persistenceError &&
      !this.hasSubscribers(job)) this.jobs.delete(job.id);
  }
  async cancel(id, code = 'cancelled', error = 'Analysis cancelled') {
    this.cancelledIds.set(id, { code, error });
    if (this.cancelledIds.size > 1000) this.cancelledIds.delete(this.cancelledIds.keys().next().value);
    await this.init();
    const job = this.jobs.get(id);
    if (!job || !analysisJobActive(job)) return;
    job.status = 'cancelled'; job.errorCode = code; job.error = error; job.revision++; job.updatedAt = this.now();
    this.live.get(id)?.controller.abort(Object.assign(new Error(error), { code }));
    await this.persist(job); this.notify(job);
  }
  async invalidate(tabId, url, reload = false) {
    await this.init();
    const previous = this.epochs[tabId], key = url ? this.pageKey(url) : previous?.key;
    if (reload || !url || previous?.key !== key) {
      this.epochs[tabId] = { key, generation: (previous?.generation || 0) + 1 };
      const obsolete = [...this.jobs.values()].filter(job => job.owner.tabId === tabId &&
        job.owner.generation !== this.epochs[tabId].generation);
      await this.saveSession();
      await Promise.all(obsolete.map(job => this.cancel(job.id, 'stale', 'Page changed')));
    }
  }
  async move(tabId, windowId) {
    await this.init();
    for (const job of this.jobs.values()) if (job.owner.tabId === tabId) {
      job.owner.windowId = windowId; job.revision++;
      await this.persist(job); this.notify(job);
    }
  }
  async configurationChanged() {
    await this.init();
    const current = this.configurationKey(await this.getConfiguration());
    await Promise.all([...this.jobs.values()].filter(job => analysisJobActive(job) && this.configurationKey(job.configuration) !== current)
      .map(job => this.cancel(job.id, 'execution_changed', 'AI connection changed')));
  }
  sameRecord(candidate, job, nutId) {
    const candidateId = candidate.result?.nutId ?? candidate.payload.nutId;
    return nutId != null && candidateId != null && String(candidateId) === String(nutId) &&
      candidate.owner.browserSession === job.owner.browserSession && candidate.owner.tabId === job.owner.tabId &&
      candidate.owner.key === job.owner.key && candidate.owner.generation === job.owner.generation;
  }
  async markSaved(id, nutId, hatch) {
    await this.init();
    return this.exclusive(async () => {
      const job = this.jobs.get(id);
      if (!job || !this.sameRecord(job, job, nutId) || !await this.valid(job)) return;
      const parent = this.jobs.get(job.parentJobId);
      const records = [job, ...(parent && this.sameRecord(parent, job, nutId) ? [parent] : [])];
      for (const candidate of records) {
        // Hatch applies to this analysis's entries, not a sibling/reanalysis
        // that happens to update the same Obsidian record.
        candidate.saved = candidate.saved === 'saved' || candidate === job && hatch ? 'saved' : 'skip';
        candidate.revision++;
        await this.persist(candidate); this.notify(candidate);
      }
    });
  }
  async clearChrome() {
    await this.init(); this.cacheEpoch++;
    for (const job of this.jobs.values()) if (job.configuration.mode === 'chrome') {
      job.discardRecovery = true;
      if (!analysisJobActive(job) && !this.hasSubscribers(job)) this.jobs.delete(job.id);
    }
    await this.store.removeWhere(job => job.configuration.mode === 'chrome');
  }
  async snapshot(windowId) {
    await this.init();
    await this.prune();
    const jobs = [];
    for (const job of this.jobs.values()) {
      if (!await this.valid(job)) continue;
      const tab = await this.api.tabs.get(job.owner.tabId).catch(() => null);
      if (tab) job.owner.windowId = tab.windowId;
      if (tab?.windowId === windowId && (!job.discardRecovery || analysisJobActive(job) || this.hasSubscribers(job))) jobs.push(this.summary(job));
    }
    return { type: 'snapshot', protocol: ANALYSIS_JOB_PROTOCOL, sessionId: await this.windowSession(windowId), jobs };
  }
  async detail(id) {
    await this.init();
    const job = this.jobs.get(id);
    if (!job || !await this.valid(job)) return null;
    return structuredClone({ ...job, progress: [...(this.live.get(id)?.partials.values() || [])].map(event => ({ ...event, jobId: id, revision: job.revision })) });
  }
  attach(port) {
    const subscriber = { send: value => port.postMessage(value) };
    this.subscribers.add(subscriber);
    port.onDisconnect.addListener(() => {
      subscriber.closed = true;
      this.subscribers.delete(subscriber);
      if (subscriber.jobId) {
        const job = this.jobs.get(subscriber.jobId);
        if (job && analysisJobActive(job)) { job.detached = true; void this.persist(job).catch(() => {}); }
        else if (job?.discardRecovery && !this.hasSubscribers(job)) this.jobs.delete(job.id);
      }
      for (const job of this.jobs.values()) if (job.discardRecovery && !analysisJobActive(job) && !this.hasSubscribers(job)) this.jobs.delete(job.id);
    });
    port.onMessage.addListener(message => {
      if (message.action === 'ping') return;
      void (async () => {
        if (message.protocol !== ANALYSIS_JOB_PROTOCOL) throw Object.assign(new Error('Reload the NutEgg side panel to update analysis transport.'), { code: 'job_protocol_mismatch' });
        if (message.action === 'analyze') {
          const job = await this.submit(message);
          subscriber.jobId = job.id;
          if (subscriber.closed) {
            job.detached = true; await this.persist(job); return;
          }
          subscriber.send({ type: 'accepted', jobId: job.id, revision: job.revision });
          subscriber.send({ type: 'job', job: this.summary(job), jobId: job.id, revision: job.revision });
        } else if (message.action === 'subscribe') {
          subscriber.windowId = message.windowId;
          subscriber.send(await this.snapshot(message.windowId));
        } else if (message.action === 'detail') {
          subscriber.send({ type: 'detail', requestId: message.requestId, job: await this.detail(message.jobId) });
        } else if (message.action === 'cancel') await this.cancel(message.jobId);
        else if (message.action === 'saved') await this.markSaved(message.jobId, message.nutId, message.hatch === true);
        else if (message.action === 'viewed') {
          const job = this.jobs.get(message.jobId);
          if (job?.status === 'completed' && await this.valid(job)) { job.viewed = true; job.revision++; await this.persist(job); }
        } else throw new Error('Unknown analysis job operation');
      })().catch(error => { try { if (!subscriber.closed) subscriber.send({ type: 'error', error: error.message, errorCode: error.code, requestId: message.requestId }); } catch {} });
    });
  }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { AnalysisJobManager, ANALYSIS_JOB_PROTOCOL };
