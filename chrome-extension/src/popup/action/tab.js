class TabAction {
  constructor(deps) {
    Object.assign(this, deps);
    this.store = deps.tabStateManager;
  }
  async refreshCaptureForCurrentTab() {
    const tabId = this.store.activeTabId;
    if (tabId == null || this.store.isBusy(tabId)) return;
    const origin = this.store.getTab(tabId);
    if (!origin) return;
    const current = () => {
      const tab = this.store.getTab(tabId);
      return (
        tab?.pageGeneration === origin.pageGeneration &&
        tab.resultRevision === origin.resultRevision &&
        tab.intentRevision === origin.intentRevision &&
        !this.store.isBusy(tabId)
      );
    };
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!current()) return;
      this.store.dispatch({
        type: 'pageInfo',
        tabId,
        url: tab.url,
        title: tab.title,
        loading: tab.status === 'loading',
      });
      if (!this.store.hasAnalysisContent(tabId) && (origin.analysisResult || origin.errors.analysis)) {
        this.store.dispatch({ type: 'emptyAnalysisCaptureRequested', tabId,
          pageGeneration: origin.pageGeneration, resultRevision: origin.resultRevision, discard: true });
        await this.operations.discardEmptyAnalysis(origin);
        if (!current()) return;
      }
      const content = await this.operations.extract(tabId);
      if (content && current()) this.store.dispatch({ type: 'view', tabId, view: 'capture' });
    } catch (error) {
      if (current()) this.store.dispatch({ type: 'notice', tabId, message: error.message });
    }
  }
  async refreshForCurrentTab(forceExtract = false) {
    const tabId = this.store.activeTabId;
    if (tabId != null) {
      if (forceExtract) this.store.invalidateTab(tabId, this.store.getTab(tabId)?.url);
      return this.handleTabActivated({ tabId }, { forceExtract });
    }
    const epoch = this.store.activationEpoch;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (epoch !== this.store.activationEpoch || !tab) return;
    return this.handleTabActivated({ tabId: tab.id }, { forceExtract });
  }
  handleTabActivated({ tabId }, options = {}) {
    this.store.ensure(tabId);
    const lease = this.store.activateTab(tabId);
    const record = this.store.getTab(tabId);
    return this.setup(lease, record, options);
  }
  async setup(lease, record, options) {
    try {
      const tab = await chrome.tabs.get(lease.tabId);
      if (!this.store.isActivationCurrent(lease)) return;
      this.store.dispatch({
        type: 'pageInfo',
        tabId: lease.tabId,
        url: tab.url,
        title: tab.title,
        loading: tab.status === 'loading',
      });
      const statusPromise = this.envService.checkServerStatus();
      // Restore saved content before touching the page. History routes through
      // the worker using the saved mode and does not need connection readiness.
      await Promise.all([statusPromise, this.restoreOrExtract(lease, record, options)]);
      if (!this.store.isActivationCurrent(lease)) return;
      const isChrome = this.settings.isChromeMode();
      if (this.settings.serverOnline && !isChrome) void this.operations.catalog();
    } catch (error) {
      if (this.store.isActivationCurrent(lease))
        this.store.dispatch({ type: 'notice', tabId: lease.tabId, message: error.message });
    }
  }
  async restoreOrExtract(lease, record, options) {
    await this.operations.recoveryReady;
    if (!this.store.isActivationCurrent(lease)) return;
    if (!options.forceExtract && await this.operations.restoreForTab?.(lease.tabId)) {
      await this.refreshEmptyAnalysis(lease.tabId);
      return;
    }
    const current = this.store.getTab(lease.tabId);
    if (
      !options.forceExtract &&
      !current.analysisResult &&
      // A capture already restored for this page generation remains usable on
      // tab activation and load completion. Re-reading empty vault history here
      // would replace it and trigger another capture, briefly disabling Analyze.
      !current.extractedContent &&
      !current.operations.extraction?.running &&
      !this.store.isBusy(lease.tabId)
    ) {
      await this.operations.history(lease.tabId, true, record.selectionRevision);
    }
    if (!this.store.isActivationCurrent(lease) || this.store.isBusy(lease.tabId)) return;
    const restored = this.store.getTab(lease.tabId);
    // A user action during lookup takes precedence over automatic capture.
    if (restored.intentRevision !== record.intentRevision) return;
    if ((restored.analysisResult || restored.errors.analysis) && !this.store.hasAnalysisContent(lease.tabId)) {
      await this.refreshEmptyAnalysis(lease.tabId);
      return;
    }
    if (restored.operations.extraction?.running || !restored.extractedContent) {
      await this.operations.extract(lease.tabId, options);
    }
  }
  async refreshEmptyAnalysis(tabId) {
    const tab = this.store.getTab(tabId);
    if (!tab || tabId !== this.store.activeTabId || this.store.hasAnalysisContent(tabId) ||
      (!tab.analysisResult && !tab.errors.analysis) || this.store.isBusy(tabId) || tab.backgroundRecoveryPending ||
      tab.operations.extraction?.running || tab.emptyAnalysisRefreshRevision === tab.resultRevision) return;
    this.store.dispatch({ type: 'emptyAnalysisCaptureRequested', tabId,
      pageGeneration: tab.pageGeneration, resultRevision: tab.resultRevision, discard: !tab.analysisStartedHere });
    if (!tab.analysisStartedHere) await this.operations.discardEmptyAnalysis(tab);
    const current = this.store.getTab(tabId);
    if (tabId !== this.store.activeTabId || current?.pageGeneration !== tab.pageGeneration ||
      current.resultRevision !== tab.resultRevision || current.intentRevision !== tab.intentRevision || this.store.isBusy(tabId)) return;
    if (current.extractedContent?.content?.trim()) return;
    return this.operations.extract(tabId);
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
    const fragmentOnly =
      changeInfo.url &&
      globalThis.NutEggAI.capturePageKey(changeInfo.url) === globalThis.NutEggAI.capturePageKey(existing.url) &&
      changeInfo.status !== 'loading';
    if (fragmentOnly) {
      this.store.dispatch({
        type: 'pageInfo',
        tabId,
        url: changeInfo.url,
        title: existing.title,
        loading: existing.currentTabLoading,
      });
    }
    // Reloads and route changes invalidate immediately. Fragment jumps retain
    // the same source and results; route-only changes may have no completion event.
    if ((changeInfo.url && !fragmentOnly) || (changeInfo.status === 'loading' && !existing.currentTabLoading)) {
      this.store.invalidateTab(tabId, changeInfo.url || existing.url);
      this.store.dispatch({ type: 'loading', tabId, loading: changeInfo.status !== 'complete' });
      if (changeInfo.url && !changeInfo.status && tabId === this.store.activeTabId) {
        return this.handleTabActivated({ tabId }, { waitForSettle: true });
      }
    }
    if (changeInfo.status === 'complete') {
      this.store.dispatch({ type: 'loading', tabId, loading: false });
      if (tabId === this.store.activeTabId) return this.handleTabActivated({ tabId });
    }
  }
  handleTabRemoved(tabId) {
    this.store.invalidateTab(tabId, '', true);
  }
  async openAnalysisActivity(tabId) {
    const record = this.store.getTab(tabId);
    if (!record) return;
    const generation = record.pageGeneration;
    const epoch = this.store.activationEpoch;
    try {
      await chrome.tabs.update(tabId, { active: true });
    } catch {
      if (this.store.getTab(tabId)?.pageGeneration === generation) this.store.invalidateTab(tabId, '', true);
      return;
    }
    // Guard belongs to the store; a closed or navigated page must stay invalid.
    if (this.store.getTab(tabId)?.pageGeneration !== generation) return;
    if (this.store.activationEpoch !== epoch && this.store.activeTabId !== tabId) return;
    this.store.dispatch({ type: 'activitySelected', tabId });
    if (this.store.activeTabId !== tabId) return this.handleTabActivated({ tabId });
  }
}
globalThis.NutEggActions = globalThis.NutEggActions || {};
globalThis.NutEggActions.TabAction = TabAction;
if (typeof module !== 'undefined' && module.exports) module.exports = { TabAction };
