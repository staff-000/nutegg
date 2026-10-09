// Popup composition and event wiring. Tab state belongs exclusively to the store.
const settings = new globalThis.NutEggState.SettingsState();
const tabStateManager = new globalThis.NutEggState.TabStateManager();
tabStateManager.settings = settings;
const pageExtractor = new globalThis.NutEggServices.PageExtractor();
const analysisService = new globalThis.NutEggServices.AnalysisService();
const operations = new globalThis.NutEggServices.PopupOperations({ store: tabStateManager, service: analysisService, extractor: pageExtractor });
const envService = new globalThis.NutEggServices.EnvironmentService({ settings, store: tabStateManager });
const ui = Object.fromEntries([
  ['headerUI', 'HeaderComponent'], ['bannersUI', 'BannersComponent'], ['captureUI', 'CaptureViewComponent'],
  ['sectionsUI', 'SectionChipsComponent'], ['verdictUI', 'VerdictComponent'], ['actionsUI', 'ActionControlsComponent'],
  ['resultsUI', 'ResultsViewComponent'], ['metricsUI', 'MetricsComponent'], ['mindmapUI', 'MindmapComponent'],
  ['discussionUI', 'DiscussionComponent'], ['qaUI', 'QaComponent'], ['eggsUI', 'EggsComponent'],
].map(([name, type]) => [name, new globalThis.NutEggUI[type]() ]));
const renderer = new globalThis.NutEggUI.PopupRenderer({ store: tabStateManager, settings, ui });
const activityUI = new globalThis.NutEggUI.AnalysisActivityComponent();
const deps = { tabStateManager, settings, operations, envService, pageExtractor, ui };
const tabAction = new globalThis.NutEggActions.TabAction(deps);
const analyzeAction = new globalThis.NutEggActions.AnalyzeAction(deps);
const saveAction = new globalThis.NutEggActions.SaveAction(deps);
const historyAction = new globalThis.NutEggActions.HistoryAction(deps);
const interactionAction = new globalThis.NutEggActions.InteractionAction(deps);
const activeDraft = values => tabStateManager.dispatch({ type: 'draft', tabId: tabStateManager.activeTabId, values });
const presentation = values => activeDraft({ presentation: { ...tabStateManager.getTab(tabStateManager.activeTabId)?.presentation, ...values } });
const click = (element, fn) => element?.addEventListener('click', fn);

async function initPopup() {
  if (typeof requestAnimationFrame === 'function') await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  globalThis.NutEggI18n?.initI18n(); globalThis.NutEggI18n?.applyI18n();
  const stored = await settings.loadFromStorage();
  tabStateManager.dispatch({ type: 'defaults', defaults: analyzeAction.settingsDefaults() });
  if (stored?.cachedMetrics) tabStateManager.dispatch({ type: 'metrics', value: stored.cachedMetrics });
  tabStateManager.dispatch({ type: 'visibility', visible: document.visibilityState === 'visible' });
  tabStateManager.subscribe(event => renderer.handle(event));
  tabStateManager.subscribe(event => {
    if ((event.type === 'receipt' && event.receipt.success) || event.type === 'analysisComplete') {
      void envService.fetchMetrics();
    }
  });
  tabStateManager.diagnosticsEnabled = stored?.popupDiagnostics === true;
  void envService.checkServerStatus();
  void envService.fetchMetrics();
  // Useful for local debugging; contains IDs and transition metadata only.
  globalThis.NutEggPopupDiagnostics = () => tabStateManager.diagnostics.map(row => ({ ...row }));

  const toggleSection = key => {
    const view = tabStateManager.viewModel();
    if (key === 'generateKnowledgeEntries') { analyzeAction.setGenerateKnowledgeEntries(!view.generateKnowledgeEntries); return true; }
    const next = settings.getToggledSections(key, view.enabledSections);
    if (!next) { tabStateManager.dispatch({ type: 'notice', tabId: view.activeTabId, message: t('atLeastOneSection') }); return false; }
    if (key === 'discussion') {
      activeDraft({ enabledSections: next, discussionOverride: next.discussion });
      if (next.discussion) void operations.discussion(view.activeTabId); else operations.stopDiscussion(view.activeTabId);
      return true;
    }
    // Auto-enable is per-page and must not become a default on other pages.
    settings.setEnabledSections({ ...next, discussion: settings.enabledSections.discussion }, true);
    tabStateManager.dispatch({ type: 'defaults', defaults: analyzeAction.settingsDefaults() });
    activeDraft({ enabledSections: next }); return true;
  };
  ui.sectionsUI.init({ chipVerdictSummary: document.getElementById('chip-verdict-summary'), chipMindmap: document.getElementById('chip-mindmap'),
    reanalyzeChipVerdictSummary: document.getElementById('reanalyze-chip-verdict-summary'), chipReMindmap: document.getElementById('reanalyze-chip-mindmap'),
    reanalyzeAccordion: document.getElementById('reanalyze-sections-accordion'), reanalyzeToggleBtn: document.getElementById('reanalyze-sections-toggle'),
    reanalyzeSectionsBody: document.getElementById('reanalyze-sections-body'), onToggle: toggleSection,
    onExpand: key => presentation({ [key]: !tabStateManager.getTab(tabStateManager.activeTabId)?.presentation[key] }) });
  const { actionsUI: a, captureUI: c, qaUI: q, eggsUI: e, headerUI: h } = ui;
  ui.discussionUI.init({ onToggle: (topicId, stance) => interactionAction.toggleDiscussionComments(topicId, stance) });
  for (const prefix of ['discussion-capture', 'discussion-reanalyze']) {
    click(document.getElementById(prefix + '-load'), () => operations.discussion(tabStateManager.activeTabId, true));
    click(document.getElementById(prefix + '-refresh'), () => operations.discussion(tabStateManager.activeTabId));
  }
  click(a.modeFastBtn, () => analyzeAction.setAnalysisMode('full'));
  click(a.modeConfirmBtn, () => analyzeAction.setAnalysisMode('preview'));
  click(a.analyzeBtn, () => analyzeAction.handleAnalyze());
  click(a.reanalyzeBtn, () => analyzeAction.handleAnalyze(true, null, true));
  click(c.refreshBtn, () => tabAction.refreshCaptureForCurrentTab());
  click(a.stage1ProceedBtn, event => a.handleEggAnalysisClick(event, mode => analyzeAction.handleEggAnalysis(mode)));
  click(a.eggAnalysisOnlyBtn, () => {
    analyzeAction.setGenerateKnowledgeEntries(false);
    a.updateEggAnalysisLabel(false);
    a.toggleEggAnalysisMenu(false);
  });
  click(a.eggAnalysisWithKnowledgeBtn, () => {
    analyzeAction.setGenerateKnowledgeEntries(true);
    a.updateEggAnalysisLabel(true);
    a.toggleEggAnalysisMenu(false);
  });
  for (const button of [a.collectNutBtn, a.stage1SkipBtn]) click(button, () => saveAction.handleSaveRaw());
  click(a.confirmBtn, () => saveAction.handleConfirm());
  click(a.backBtn, () => analyzeAction.handleBackToContent());
  click(a.viewAnalysisBtn, () => analyzeAction.handleViewAnalysis());
  a.historySelect?.addEventListener('change', () => historyAction.onHistorySelected(a.historySelect.value));
  c.customQuestionsEl?.addEventListener('input', () => activeDraft({ customQuestions: c.customQuestionsEl.value }));
  q.followupInput?.addEventListener('input', () => activeDraft({ followupDraft: q.followupInput.value }));
  q.onScopeChange = scope => activeDraft({ followupScope: scope });
  c.onScopeChange = scope => activeDraft({ customQuestionsScope: scope });
  click(q.followupBtn, () => interactionAction.handleFollowUp());
  q.followupInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey || event.shiftKey)) { event.preventDefault(); interactionAction.handleFollowUp(); }
  });
  click(c.questionsToggle, () => presentation({ questionsExpanded: !tabStateManager.getTab(tabStateManager.activeTabId)?.presentation.questionsExpanded }));
  click(e.captureEggsToggle, () => presentation({ captureEggsExpanded: !tabStateManager.getTab(tabStateManager.activeTabId)?.presentation.captureEggsExpanded }));
  click(e.eggsToggle, () => presentation({ eggsExpanded: !tabStateManager.getTab(tabStateManager.activeTabId)?.presentation.eggsExpanded }));
  click(e.eggsCreateToggle, () => presentation({ createFormOpen: !tabStateManager.getTab(tabStateManager.activeTabId)?.presentation.createFormOpen }));
  click(e.eggsCreateCancelBtn, () => presentation({ createFormOpen: false }));
  for (const input of [e.eggsNewName, e.newEggName]) input?.addEventListener('input', () => activeDraft({ newEggName: input.value }));
  for (const input of [e.eggsNewDesc, e.newEggDescription]) input?.addEventListener('input', () => activeDraft({ newEggDescription: input.value }));
  click(e.createEggBtn, () => saveAction.handleCreateEgg(false));
  click(e.eggsCreateBtn, () => saveAction.handleCreateEgg(true));
  for (const button of [h.statusIndicatorWrap, h.settingsBtn, document.getElementById('setup-open-settings-btn')]) click(button, () => {
    chrome.runtime.openOptionsPage();
  });
  click(h.aiCreditPill, () => {
    h.setCheckingCredit();
    void envService.checkServerStatus(true);
  });
  h.statusIndicatorWrap?.addEventListener('keydown', event => {
    if (['Enter', ' '].includes(event.key)) { event.preventDefault(); chrome.runtime.openOptionsPage(); }
  });
  click(document.getElementById('report-bug-link'), event => { event.preventDefault(); interactionAction.openGitHubBugReport(); });
  click(document.getElementById('report-email-link'), event => { event.preventDefault(); interactionAction.openEmailBugReport(); });
  click(ui.bannersUI.errorReportBug, event => { event.preventDefault(); interactionAction.openGitHubBugReport(tabStateManager.viewModel().error || ''); });
  document.addEventListener('click', event => {
    const mailto = event.target.closest?.('a[href^="mailto:"]');
    if (mailto && typeof chrome !== 'undefined' && chrome.tabs?.create) {
      event.preventDefault();
      chrome.tabs.create({ url: mailto.href });
      return;
    }
    if (!event.target.closest?.('.egg-analysis-selector')) a.toggleEggAnalysisMenu(false);
    if (event.target.closest?.('.source-pill')) interactionAction.handleSourcePillClick(event);
    const header = event.target.closest?.('#results-state .section-header');
    if (header && !event.target.closest?.('button, a, input, select, textarea')) {
      const id = header.closest('.result-section').id;
      const state = tabStateManager.getTab(tabStateManager.activeTabId)?.presentation.collapsible || {};
      presentation({ collapsible: { ...state, [id]: !state[id] } });
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') a.toggleEggAnalysisMenu(false);
    const section = event.target.closest?.('#results-state .section-header');
    if (section && ['Enter', ' '].includes(event.key)) { event.preventDefault(); section.click(); }
  });
  window.addEventListener('scroll', () => {
    const record = tabStateManager.getTab(tabStateManager.activeTabId);
    if (record && record.presentation.scroll !== window.scrollY) presentation({ scroll: window.scrollY });
  }, { passive: true });
  chrome.storage?.onChanged?.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.connectionMode) settings.setConnectionMode(changes.connectionMode.newValue, false);
    if (changes.analysisMode) settings.setAnalysisMode(changes.analysisMode.newValue, false);
    if (changes.outputLanguage) settings.setOutputLanguage(changes.outputLanguage.newValue, false);
    if (changes.uiDensity) settings.setUiDensity(changes.uiDensity.newValue, false);
    if (changes.enabledSections) settings.setEnabledSections(changes.enabledSections.newValue);
    if (changes.generateKnowledgeEntries) settings.setGenerateKnowledgeEntries(changes.generateKnowledgeEntries.newValue, false);
    if (changes.debugInfo) { settings.debugInfo = changes.debugInfo.newValue === true; void operations.refreshDebugInfo(); }
    if (changes.captureRetryCount || changes.captureRetryDelayMs) settings.setCaptureRetries({
      captureRetryCount: changes.captureRetryCount ? changes.captureRetryCount.newValue ?? 3 : settings.captureRetryCount,
      captureRetryDelayMs: changes.captureRetryDelayMs ? changes.captureRetryDelayMs.newValue ?? 3000 : settings.captureRetryDelayMs,
    });
    tabStateManager.dispatch({ type: 'defaults', defaults: analyzeAction.settingsDefaults() });
    if (changes.popupDiagnostics) tabStateManager.diagnosticsEnabled = changes.popupDiagnostics.newValue === true;
    if (Object.keys(changes).some(key => key === 'connectionMode' || key === 'serverPort' || key.startsWith('chromeAi'))) void envService.checkServerStatus(true);
    tabStateManager.emit({ type: 'settings' });
  });
  await activityUI.init({ manager: tabStateManager, onSelect: id => tabAction.openAnalysisActivity(id) });
  tabStateManager.subscribe(event => {
    if (['activated', 'invalidated'].includes(event.type)) void operations.refreshDebugInfo();
  });
  void operations.refreshDebugInfo();
  setInterval(() => { void operations.refreshDebugInfo(); }, 1000);
  chrome.tabs.onActivated.addListener(info => {
    if (activityUI.windowId == null || activityUI.windowId === info.windowId) void tabAction.handleTabActivated(info);
  });
  chrome.tabs.onUpdated.addListener((id, changes) => tabAction.handleTabUpdated(id, changes));
  chrome.tabs.onRemoved.addListener(id => tabAction.handleTabRemoved(id));
  chrome.tabs.onAttached?.addListener(() => activityUI.refresh());
  chrome.tabs.onDetached?.addListener(() => activityUI.refresh());
  document.addEventListener('visibilitychange', () => tabAction.handleVisibilityChange());
  globalThis.NutEggStartup?.finish();
  await tabAction.refreshForCurrentTab();
}
if (typeof module !== 'undefined' && module.exports) module.exports = { initPopup, tabStateManager, renderer };
else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPopup);
else void initPopup();
