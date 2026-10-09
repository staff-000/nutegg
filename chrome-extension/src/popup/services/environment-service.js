// Global environment requests are deduplicated and never mutate tab UI.
class EnvironmentService {
  constructor({ settings, store, chromeApi = chrome }) { this.settings = settings; this.settings.environmentChecked = false; this.store = store; this.chromeApi = chromeApi; this.task = null; this.version = 0; }
  checkServerStatus(force = false) {
    if (force) { this.version++; this.task = null; }
    if (this.task) return this.task;
    const version = ++this.version;
    if (!this.settings.environmentChecked) this.store.dispatch({ type: 'environment', value: { issues: [], credit: null } });
    const task = this.loadStatus(version).finally(() => { if (this.task === task) this.task = null; });
    this.task = task; return task;
  }
  async loadStatus(version) {
    const connectionMode = this.settings.connectionMode === 'obsidian' ? 'obsidian' : 'chrome';
    let status;
    if (connectionMode === 'obsidian') {
      try { status = await this.chromeApi.runtime.sendMessage({ action: 'check-server' }); } catch { status = { online: false }; }
      if (version !== this.version || this.settings.connectionMode !== 'obsidian') return;
    }
    if (connectionMode === 'chrome' || !status.online) {
      let ai = {};
      try { ai = await this.chromeApi.runtime.sendMessage({ action: 'check-chrome-ai' }); } catch {}
      if (version !== this.version || this.settings.connectionMode !== connectionMode) return;
      this.settings.setServerStatus();
      this.settings.setChromeAiStatus({ enabled: true, configured: !!ai.configured, provider: ai.provider, model: ai.model });
      this.settings.environmentChecked = true;
      this.store.dispatch({ type: 'environment', value: { issues: [], credit: null } });
      void this.fetchMetrics();
      if (ai.configured) void this.fetchCredit(version, false);
      return;
    }
    let config = {};
    try {
      if (status.online) config = await this.chromeApi.runtime.sendMessage({ action: 'config-status' });
    } catch (error) { config = { status: 'error', issues: [error.message || 'Cannot reach server'] }; }
    if (version !== this.version || this.settings.connectionMode !== 'obsidian') return;
    const issues = config?.issues || [];
    const error = status.error || (!config || config.status === 'error' ? issues.join('\n') || 'Cannot read Obsidian configuration' : null);
    this.settings.setServerStatus({ online: !!status.online, version: status.version, error, warning: issues.join('\n'), aiConfigured: !error && !issues.some(i => /no api key|not configured/i.test(i)) });
    this.settings.setChromeAiStatus();
    this.settings.environmentChecked = true;
    this.store.dispatch({ type: 'environment', value: { issues, credit: config?.credit || null } });
    if (status.online) {
      void this.fetchMetrics();
      void this.fetchCredit(version, true);
    }
  }
  async fetchCredit(version, online) {
    try {
      const credit = await this.chromeApi.runtime.sendMessage({ action: online ? 'get-credit' : 'check-chrome-credit' });
      if (version !== this.version || online !== (this.settings.connectionMode === 'obsidian' && this.settings.serverOnline)) return;
      this.settings.aiStatusError = credit?.error || (credit?.hasBalance && Number.isFinite(credit.remainingCredits) && credit.remainingCredits <= 0 ? globalThis.t('aiNoRemainingCredit') : null);
      this.store.dispatch({ type: 'environment', value: { ...this.store.environment, credit: { ...credit, isChromeAi: !online } } });
    } catch (error) {
      if (version !== this.version || online !== (this.settings.connectionMode === 'obsidian' && this.settings.serverOnline)) return;
      this.settings.aiStatusError = error.message || String(error);
      this.store.dispatch({ type: 'environment', value: { ...this.store.environment, credit: null } });
    }
  }
  async fetchMetrics() {
    const version = this.metricsVersion = (this.metricsVersion || 0) + 1;
    const mode = this.settings.connectionMode;
    try {
      const metrics = await this.chromeApi.runtime.sendMessage({ action: 'metrics' });
      if (metrics?.nuts == null || version !== this.metricsVersion || this.settings.connectionMode !== mode) return;
      this.store.dispatch({ type: 'metrics', value: metrics });
      void this.chromeApi.storage?.local?.set?.({ cachedMetrics: metrics });
    } catch {}
  }
}
globalThis.NutEggServices = globalThis.NutEggServices || {};
globalThis.NutEggServices.EnvironmentService = EnvironmentService;
if (typeof module !== 'undefined' && module.exports) module.exports = { EnvironmentService };
