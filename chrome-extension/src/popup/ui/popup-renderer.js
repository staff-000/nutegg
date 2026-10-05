// The only coordinator that presents tab state. Background events never render tab content.
class PopupRenderer {
  constructor({ store, settings, ui, root = document }) { Object.assign(this, { store, settings, ui, root }); this.keys = {}; this.tabId = null; }
  handle(event) {
    if (['viewed', 'receipt'].includes(event.type)) return;
    if (event.tabId != null && event.tabId !== this.store.activeTabId) return;
    this.render();
  }
  render() {
    const view = this.store.viewModel();
    const { ui, settings, root } = this;
    const changedTab = view.activeTabId !== this.tabId;
    if (changedTab) { this.keys = {}; this.tabId = view.activeTabId; ui.actionsUI.toggleEggAnalysisMenu(false); }
    const draft = values => this.store.dispatch({ type: 'draft', tabId: view.activeTabId, values });
    const keyed = (name, value, fn) => { const key = JSON.stringify(value); if (this.keys[name] !== key) { this.keys[name] = key; fn(); } };
    const value = (element, text) => { if (element && element.value !== text) element.value = text; };
    ui.headerUI.render(view, settings);
    ui.bannersUI.hideAll();
    ui.bannersUI.render(view, settings);
    if (view.error) ui.bannersUI.showError(view.error, view.errorCode);
    const warning = view.warning || this.store.environment?.issues?.join('\n');
    if (warning) ui.bannersUI.showWarning(warning); else ui.bannersUI.hideWarning();
    if (view.success) ui.bannersUI.showSuccess(view.success); else ui.bannersUI.hideSuccess();
    ui.sectionsUI.updateUI(view.enabledSections, view.generateKnowledgeEntries);
    ui.sectionsUI.renderPresentation(view.presentation);
    ui.resultsUI.render(view, settings);
    const isFunctional = settings.serverOnline || settings.chromeAiConfigured || !!view.analysisResult;
    const setupHub = root.getElementById?.('setup-hub');
    const captureState = root.getElementById?.('capture-state');
    if (setupHub) setupHub.classList.toggle('hidden', isFunctional);
    if (captureState) captureState.classList.toggle('not-functional', !isFunctional);
    keyed('discussion', [view.analysisResult?.discussion, view.enabledSections.discussion, view.extractedContent?.discussion, view.discussionPending, view.extractionPending, !!view.analysisResult], () => ui.discussionUI?.render(view));
    ui.actionsUI.render(view, settings);
    ui.verdictUI.render(view, settings);
    value(ui.captureUI.customQuestionsEl, view.customQuestions);
    value(ui.qaUI.followupInput, view.followupDraft);
    for (const input of [ui.eggsUI.eggsNewName, ui.eggsUI.newEggName]) value(input, view.newEggName);
    for (const input of [ui.eggsUI.eggsNewDesc, ui.eggsUI.newEggDescription]) value(input, view.newEggDescription);
    ui.captureUI.setQuestionsScope(view.customQuestionsScope);
    ui.qaUI.setScope(view.followupScope);
    ui.captureUI.questionsArea?.classList.toggle('hidden', !view.presentation.questionsExpanded);
    ui.captureUI.questionsToggle?.setAttribute('aria-expanded', String(view.presentation.questionsExpanded));
    const questionsChevron = ui.captureUI.questionsToggle?.querySelector('.questions-toggle-chevron');
    if (questionsChevron) questionsChevron.textContent = view.presentation.questionsExpanded ? '▾' : '▸';
    ui.captureUI.refreshBtn.disabled = view.busy || view.extractionPending;
    const content = view.extractedContent;
    keyed('capture', [content?.content, content?.title, content?.url, content?.sourceType, content?.metadata, content?.discussion?.items, content?.discussion?.truncated, view.errors.extraction, view.extractionPending, view.title, view.url], () => {
      ui.captureUI.setPageInfo({ title: content?.title || view.title || t('loading'), url: content?.url || view.url, sourceType: content?.sourceType || '' });
      ui.captureUI.clearProvenance();
      if (content) { ui.captureUI.setPreviewContent(content); ui.captureUI.showProvenance(content.metadata || {}, content.content); }
      else if (view.errors.extraction) ui.captureUI.setError(view.errors.extraction.message);
      else ui.captureUI.setLoading(t('retrievingPageContent'));
    });
    keyed('mindmap', [view.analysisResult?.mindMap, view.enabledSections.mindMap], () => ui.mindmapUI.render(view.analysisResult?.mindMap, view.enabledSections.mindMap !== false));
    keyed('qa', [view.resultRevision, view.followUpQa], () => ui.qaUI.render(view.analysisResult || {}, view.followUpQa));
    ui.qaUI.setFollowupLoading(view.busy);
    keyed('eggs', [view.resultRevision, view.operations.analysis, view.selectedEggs.size, [...view.selectedEggs], view.activeEggTab, view.allEggs, view.presentation.eggsExpanded, settings.serverOnline, settings.analysisMode], () => {
      ui.eggsUI.render(view, settings, { onSelectChange: eggs => draft({ selectedEggs: [...eggs] }), onTabChange: activeEggTab => draft({ activeEggTab }) });
    });
    keyed('captureEggs', [view.allEggs, [...view.preSelectedEggs]], () => ui.eggsUI.renderCaptureList({ allEggs: view.allEggs, preSelectedEggs: new Set(view.preSelectedEggs), onSelectChange: eggs => draft({ preSelectedEggs: [...eggs] }) }));
    ui.eggsUI.expandCaptureEggs(view.presentation.captureEggsExpanded);
    const eggSelectorVisible = !!view.analysisResult && !settings.isChromeMode(view.analysisResult);
    const emptyEggCatalog = !(view.allEggs.length || view.analysisResult?.matchedEggs?.length);
    const createFormOpen = eggSelectorVisible && (view.presentation.createFormOpen || emptyEggCatalog);
    ui.eggsUI.eggsCreateForm?.classList.toggle('hidden', !createFormOpen);
    ui.eggsUI.eggsCreateToggle?.classList.toggle('hidden', !eggSelectorVisible || createFormOpen);
    if (ui.eggsUI.eggsCreateToggle) ui.eggsUI.eggsCreateToggle.textContent = t('createNewEgg');
    ui.eggsUI.setCreateButtonLoading(!!view.operations.creation?.running);
    for (const button of [ui.eggsUI.eggsCreateBtn, ui.eggsUI.createEggBtn]) {
      if (button) { button.disabled = view.busy; button.title = ''; }
    }
    ui.eggsUI.clearError();
    if (settings.serverOnline && this.store.metrics) ui.metricsUI.render(this.store.metrics);
    ui.metricsUI.showPluginLink(!settings.serverOnline);
    const debugMode = settings.isChromeMode() ? 'chrome' : 'obsidian';
    const debugInfo = view.debugInfo?.mode === debugMode ? view.debugInfo : null;
    keyed('debug', [settings.debugInfo, debugMode, debugInfo], () => ui.metricsUI.renderDebug?.(debugInfo, settings.debugInfo));
    if (this.store.environment?.credit) ui.headerUI.renderCredit(this.store.environment.credit, settings.serverOnline);
    else ui.headerUI.hideCredit();
    keyed('collapse', [view.presentation.collapsible], () => {
      root.querySelectorAll?.('#results-state .result-section').forEach(section => {
        const collapsed = !!view.presentation.collapsible[section.id];
        section.querySelector('.section-content')?.classList.toggle('collapsed', collapsed);
        section.querySelector('.section-chevron')?.classList.toggle('collapsed', collapsed);
        const header = section.querySelector('.section-header');
        header?.setAttribute('aria-expanded', String(!collapsed));
        header?.setAttribute('role', 'button'); header?.setAttribute('tabindex', '0');
      });
    });
    if (changedTab && typeof window !== 'undefined') window.scrollTo(0, view.presentation.scroll);
    this.store.dispatch({ type: 'viewed', tabId: view.activeTabId, revision: view.resultRevision });
  }
}
globalThis.NutEggUI = globalThis.NutEggUI || {};
globalThis.NutEggUI.PopupRenderer = PopupRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { PopupRenderer };
