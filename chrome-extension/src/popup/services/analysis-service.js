// ============================================================
// NutEgg Popup Services — Analysis Service
// ============================================================

// Transport only. PopupOperations owns immutable request contexts and guarded commits.
class AnalysisService {
  constructor(options = {}) {
    this.chromeApi = options.chrome || (typeof chrome !== 'undefined' ? chrome : null);
  }

  /** One submitted stage. A port disconnect detaches; only an abort signal cancels. */
  sendAnalyzeViaPort(payload, onProgress, { signal, tabId, jobId = crypto.randomUUID(), context = {}, onJob } = {}) {
    const api = this.chromeApi;
    if (!api?.runtime?.connect) return Promise.reject(new Error('Chrome runtime.connect unavailable'));
    return new Promise((resolve, reject) => {
      let port, settled = false, detailRequested = false;
      const finish = (error, result) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', abort);
        try { port?.disconnect(); } catch {}
        error ? reject(error) : resolve(result);
      };
      const abort = () => {
        try { port?.postMessage({ protocol: 2, action: 'cancel', jobId }); } catch {}
        finish(Object.assign(new Error('Analysis cancelled'), { code: 'cancelled' }));
      };
      if (signal?.aborted) return finish(Object.assign(new Error('Analysis cancelled'), { code: 'cancelled' }));
      try {
        port = api.runtime.connect({ name: 'nutegg-analyze' });
        signal?.addEventListener('abort', abort, { once: true });
        port.onMessage.addListener(message => {
          if (settled) return;
          if (message?.type === 'accepted') { jobId = message.jobId; return; }
          if (message?.type === 'partial') { onProgress?.(message); return; }
          if (message?.type === 'job') {
            onJob?.(message.job);
            if (message.job.status === 'completed' && !detailRequested) {
              detailRequested = true;
              port.postMessage({ protocol: 2, action: 'detail', jobId, requestId: jobId });
            } else if (['failed', 'cancelled', 'interrupted'].includes(message.job.status))
              finish(null, { error: message.job.error || 'Analysis interrupted. Retry explicitly.', errorCode: message.job.errorCode || 'job_interrupted' });
            return;
          }
          if (message?.type === 'detail') {
            if (!message.job) return finish(new Error('Analysis result is no longer available'));
            onJob?.(message.job);
            return finish(null, message.job.result);
          }
          finish(null, message?.type === 'complete' ? message.result : message);
        });
        port.onDisconnect.addListener(() => finish(new Error(api.runtime.lastError?.message || 'Connection closed before response received')));
        port.postMessage({ protocol: 2, action: 'analyze', jobId, tabId, context, payload });
      } catch (error) { finish(error); }
    });
  }

  /** One observer for this panel/window. Snapshot + revisions close the subscribe race. */
  watchJobs(windowId, onEvent) {
    const api = this.chromeApi;
    return new Promise((resolve, reject) => {
      let ready = false;
      const port = this.jobPort = api.runtime.connect({ name: 'nutegg-analyze' });
      this.jobRequests = new Map();
      const timeout = setTimeout(() => { if (!ready) { ready = true; reject(new Error('Analysis recovery connection timed out')); port.disconnect(); } }, 10000);
      port.onMessage.addListener(event => {
        if (event.type === 'detail') {
          const request = this.jobRequests.get(event.requestId);
          if (request) { this.jobRequests.delete(event.requestId); clearTimeout(request.timer); request.resolve(event.job); }
        } else if (event.type === 'error' && event.requestId && this.jobRequests.has(event.requestId)) {
          const request = this.jobRequests.get(event.requestId); this.jobRequests.delete(event.requestId);
          clearTimeout(request.timer); request.reject(new Error(event.error));
        } else if (event.type === 'snapshot') {
          clearTimeout(timeout); ready = true; resolve(event);
        } else if (event.type === 'error' && !ready) {
          clearTimeout(timeout); ready = true; reject(new Error(event.error));
        } else onEvent(event);
      });
      port.onDisconnect.addListener(() => {
        clearTimeout(timeout);
        if (!ready) { ready = true; reject(new Error('Analysis recovery connection closed')); }
        else onEvent({ type: 'disconnected' });
        for (const request of this.jobRequests.values()) { clearTimeout(request.timer); request.reject(new Error('Analysis recovery connection closed')); }
        this.jobRequests.clear();
      });
      port.postMessage({ protocol: 2, action: 'subscribe', windowId });
    });
  }
  getJob(jobId) {
    return new Promise((resolve, reject) => {
      if (!this.jobPort) return reject(new Error('Analysis recovery is unavailable'));
      const requestId = crypto.randomUUID();
      const timer = setTimeout(() => { this.jobRequests.delete(requestId); reject(new Error('Analysis recovery lookup timed out')); }, 10000);
      this.jobRequests.set(requestId, { resolve, reject, timer });
      try { this.jobPort.postMessage({ protocol: 2, action: 'detail', jobId, requestId }); }
      catch (error) { clearTimeout(timer); this.jobRequests.delete(requestId); reject(error); }
    });
  }
  markJobViewed(jobId) {
    try { this.jobPort?.postMessage({ protocol: 2, action: 'viewed', jobId }); } catch {}
  }
  markJobSaved(jobId, nutId, hatch) {
    if (!jobId) return;
    try { this.jobPort?.postMessage({ protocol: 2, action: 'saved', jobId, nutId, hatch }); } catch {}
  }

  /**
   * Load history for a URL.
   */
  async loadHistory(url) {
    if (!url) return null;
    const resp = await this.sendMessage({ action: 'history', url });
    if (resp?.error) throw new Error(resp.error);
    return resp?.history?.length ? resp.history : null;
  }

  /**
   * Create a new egg in the Obsidian vault.
   */
  async createEgg(name, description) {
    try {
      const resp = await this.sendMessage({ action: 'create-egg', name, description });
      return resp;
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to create egg' };
    }
  }

  /** Safe message sender helper */
  sendMessage(message) {
    const api = this.chromeApi;
    if (!api || !api.runtime || !api.runtime.sendMessage) {
      return Promise.reject(new Error('Chrome runtime.sendMessage unavailable'));
    }
    return api.runtime.sendMessage(message);
  }
}

const _analysisScope = typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this;
_analysisScope.NutEggServices = _analysisScope.NutEggServices || {};
_analysisScope.NutEggServices.AnalysisService = AnalysisService;
_analysisScope.AnalysisService = AnalysisService;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AnalysisService,
  };
}
