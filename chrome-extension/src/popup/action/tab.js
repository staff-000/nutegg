class TabAction {
  constructor(deps) { Object.assign(this, deps); this.store = deps.tabStateManager; }
  async refreshForCurrentTab(forceExtract = false) {
    const tabId = this.store.activeTabId;
    if (tabId != null) {
      if (forceExtract) this.store.invalidateTab(tabId, this.store.getTab(tabId)?.url);
      return this.handleTabActivated({ tabId });
    }
    const epoch = this.store.activationEpoch;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (epoch !== this.store.activationEpoch || !tab) return;
    return this.handleTabActivated({ tabId: tab.id });
  }
  handleTabActivated({ tabId }) {
    this.store.ensure(tabId);
    const lease = this.store.activateTab(tabId);
    const record = this.store.getTab(tabId);
    return this.setup(lease, record);
  }
  async setup(lease, record) {
    try {
      const tab = await chrome.tabs.get(lease.tabId);
      if (!this.store.isActivationCurrent(lease)) return;
      this.store.dispatch({ type: 'pageInfo', tabId: lease.tabId, url: tab.url, title: tab.title, loading: tab.status === 'loading' });
      if (!record.extractedContent && !record.operations.extraction?.running) {
        await this.operations.extract(lease.tabId);
        if (!this.store.isActivationCurrent(lease)) return;
      }
      await this.envService.checkServerStatus();
      if (!this.store.isActivationCurrent(lease)) return;
      if (this.settings.serverOnline) {
        void this.operations.catalog();
        if (!record.analysisResult && !this.store.isBusy(lease.tabId)) await this.operations.history(lease.tabId, true, record.selectionRevision);
      }
    } catch (error) {
      if (this.store.isActivationCurrent(lease)) this.store.dispatch({ type: 'notice', tabId: lease.tabId, message: error.message });
    }
  }
  async handleVisibilityChange() {
    const visible = document.visibilityState === 'visible';
    this.store.dispatch({ type: 'visibility', visible });
    if (!visible) return;
    const epoch = this.store.activationEpoch;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (epoch !== this.store.activationEpoch || !tab) return;
    return this.handleTabActivated({ tabId: tab.id });
  }
  handleTabUpdated(tabId, changeInfo) {
    const existing = this.store.getTab(tabId);
    if (!existing) return;
    // A loading transition marks reload even without a URL change. URL changes
    // always invalidate immediately; no async Chrome lookup precedes this.
    if (changeInfo.url || (changeInfo.status === 'loading' && !existing.currentTabLoading)) {
      this.store.invalidateTab(tabId, changeInfo.url || existing.url);
      this.store.dispatch({ type: 'loading', tabId, loading: true });
    }
    if (changeInfo.status === 'complete') {
      this.store.dispatch({ type: 'loading', tabId, loading: false });
      if (tabId === this.store.activeTabId) return this.handleTabActivated({ tabId });
    }
  }
  handleTabRemoved(tabId) { this.store.invalidateTab(tabId, '', true); }
  async openAnalysisActivity(tabId) {
    const record = this.store.getTab(tabId);
    if (!record) return;
    const generation = record.pageGeneration;
    try { await chrome.tabs.update(tabId, { active: true }); }
    catch { this.store.invalidateTab(tabId, '', true); return; }
    // Guard belongs to the store; a closed or navigated page must stay invalid.
    if (this.store.getTab(tabId)?.pageGeneration !== generation) return;
    this.store.dispatch({ type: 'activitySelected', tabId });
    return this.handleTabActivated({ tabId });
  }
}
globalThis.NutEggActions = globalThis.NutEggActions || {};
globalThis.NutEggActions.TabAction = TabAction;
if (typeof module !== 'undefined' && module.exports) module.exports = { TabAction };
