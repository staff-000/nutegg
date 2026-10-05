// Global environment requests are deduplicated and never mutate tab UI.
class EnvironmentService {
  constructor({ settings, store, chromeApi = chrome }) { this.settings = settings; this.store = store; this.chromeApi = chromeApi; this.task = null; this.version = 0; }
  checkServerStatus(force = false) {
    if (force) { this.version++; this.task = null; }
    if (this.task) return this.task;
    const version = ++this.version;
    const task = this.loadStatus(version).finally(() => { if (this.task === task) this.task = null; });
    this.task = task; return task;
  }
  async loadStatus(version) {
    let status;
    try { status = await this.chromeApi.runtime.sendMessage({ action: 'check-server' }); } catch { status = { online: false }; }
    if (version !== this.version) return;
    let config = {}, ai = {};
    try {
      if (status.online) config = await this.chromeApi.runtime.sendMessage({ action: 'config-status' });
      else ai = await this.chromeApi.runtime.sendMessage({ action: 'check-chrome-ai' });
    } catch {}
    if (version !== this.version) return;
    const issues = config.issues || [];
    this.settings.setServerStatus({ online: !!status.online, version: status.version, aiConfigured: !issues.some(i => /no api key|not configured/i.test(i)) });
    this.settings.setChromeAiStatus({ enabled: !!ai.enabled, configured: !!ai.configured, provider: ai.provider || '', model: ai.model || '' });
    this.store.dispatch({ type: 'environment', value: { issues, credit: config.credit || null } });
    void this.fetchMetrics();
    if (status.online || ai.configured) void this.fetchCredit(version, !!status.online);
  }
  async fetchCredit(version, online) {
    try {
      const credit = await this.chromeApi.runtime.sendMessage({ action: online ? 'get-credit' : 'check-chrome-credit' });
      if (version !== this.version) return;
      this.store.dispatch({ type: 'environment', value: { ...this.store.environment, credit: { ...credit, isChromeAi: !online } } });
    } catch {}
  }
  async fetchMetrics() {
    const version = this.metricsVersion = (this.metricsVersion || 0) + 1;
    try {
      const metrics = await this.chromeApi.runtime.sendMessage({ action: 'metrics' });
      if (metrics?.nuts == null || version !== this.metricsVersion) return;
      this.store.dispatch({ type: 'metrics', value: metrics });
      void this.chromeApi.storage?.local?.set?.({ cachedMetrics: metrics });
    } catch {}
  }
}
globalThis.NutEggServices = globalThis.NutEggServices || {};
globalThis.NutEggServices.EnvironmentService = EnvironmentService;
if (typeof module !== 'undefined' && module.exports) module.exports = { EnvironmentService };
