class AnalyzeAction {
  constructor(deps) { Object.assign(this, deps); this.store = deps.tabStateManager; }
  handleBackToContent() { this.store.dispatch({ type: 'view', tabId: this.store.activeTabId, view: 'capture' }); }
  handleViewAnalysis() { this.store.dispatch({ type: 'view', tabId: this.store.activeTabId, view: 'results' }); }
  setGenerateKnowledgeEntries(enabled) {
    this.settings.setGenerateKnowledgeEntries(enabled);
    this.store.dispatch({ type: 'defaults', defaults: this.settingsDefaults() });
    this.store.dispatch({ type: 'draft', tabId: this.store.activeTabId, values: { generateKnowledgeEntries: enabled } });
  }
  settingsDefaults() { return { enabledSections: this.settings.enabledSections, generateKnowledgeEntries: this.settings.generateKnowledgeEntries }; }
  setAnalysisMode(mode) { this.settings.setAnalysisMode(mode); this.store.emit({ type: 'settings' }); }
  getAnalyzeNotReadyReason() {
    const view = this.store.viewModel();
    if (view.busy) return t('analyzing');
    return globalThis.NutEggHelpers?.getAnalyzeNotReadyReason?.(view, this.settings) || null;
  }
  requestOptions(eggs) {
    return { eggs, outputLanguage: this.settings.outputLanguage, analysisMode: this.settings.analysisMode,
      chromeMode: this.settings.isChromeMode(), questions: this.ui.captureUI?.getParsedQuestions?.() || [] };
  }
  handleAnalyze(force = true, eggsOverride = null, isReanalyze = false) {
    const tabId = this.store.activeTabId;
    const tab = this.store.getTab(tabId);
    const reason = this.getAnalyzeNotReadyReason();
    if (reason) { this.store.dispatch({ type: 'notice', tabId, message: reason }); return Promise.resolve({ error: reason }); }
    if (isReanalyze) {
      return (async () => {
        if (this.operations?.extract) {
          const extracted = await this.operations.extract(tabId);
          if (!extracted) return { error: this.store.getTab(tabId)?.errors?.extraction || t('couldNotExtractContent') };
        }
        const currentTab = this.store.getTab(tabId) || tab;
        const eggs = eggsOverride || (currentTab.selectedEggs || (currentTab.preSelectedEggs?.length ? currentTab.preSelectedEggs : undefined));
        return this.operations.analyze(tabId, { ...this.requestOptions(eggs), reanalyze: true });
      })();
    }
    const eggs = eggsOverride || (tab.preSelectedEggs?.length ? tab.preSelectedEggs : undefined);
    return this.operations.analyze(tabId, { ...this.requestOptions(eggs), reanalyze: isReanalyze });
  }
  handleEggAnalysis(include) { this.setGenerateKnowledgeEntries(include); return this.handleReanalyzeEggs(); }
  handleReanalyzeEggs() {
    const tabId = this.store.activeTabId;
    return this.operations.eggs(tabId, this.requestOptions(this.store.getTab(tabId)?.selectedEggs));
  }
}
globalThis.NutEggActions = globalThis.NutEggActions || {};
globalThis.NutEggActions.AnalyzeAction = AnalyzeAction;
if (typeof module !== 'undefined' && module.exports) module.exports = { AnalyzeAction };
