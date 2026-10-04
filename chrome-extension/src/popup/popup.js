// ============================================================
// NutEgg Popup Controller
// ============================================================

// --- Translations & Helpers ---
const helper = typeof NutEggHelpers !== "undefined" ? NutEggHelpers : (typeof globalThis.NutEggHelpers !== "undefined" ? globalThis.NutEggHelpers : globalThis.helper || {});

// --- Core Services & State Management ---
const config = new (globalThis.NutEggServices?.ConfigService || (typeof ConfigService !== "undefined" ? ConfigService : class {}))();
const settings = new (globalThis.NutEggState?.SettingsState || (typeof SettingsState !== "undefined" ? SettingsState : class {}))();
const session = new (globalThis.NutEggState?.SessionState || (typeof SessionState !== "undefined" ? SessionState : class {}))();
const tabStateManager = new (globalThis.NutEggState?.TabStateManager || (typeof TabStateManager !== "undefined" ? TabStateManager : class {}))();

const pageExtractor = new (globalThis.NutEggServices?.PageExtractor || (typeof PageExtractor !== "undefined" ? PageExtractor : class {}))();
const analysisService = new (globalThis.NutEggServices?.AnalysisService || (typeof AnalysisService !== "undefined" ? AnalysisService : class {}))();

// --- UI Components ---
const headerUI = new (globalThis.NutEggUI?.HeaderComponent || (typeof HeaderComponent !== "undefined" ? HeaderComponent : class {}))();
const bannersUI = new (globalThis.NutEggUI?.BannersComponent || (typeof BannersComponent !== "undefined" ? BannersComponent : class {}))();
const captureUI = new (globalThis.NutEggUI?.CaptureViewComponent || (typeof CaptureViewComponent !== "undefined" ? CaptureViewComponent : class {}))();
const sectionsUI = new (globalThis.NutEggUI?.SectionChipsComponent || (typeof SectionChipsComponent !== "undefined" ? SectionChipsComponent : class {}))();
const verdictUI = new (globalThis.NutEggUI?.VerdictComponent || (typeof VerdictComponent !== "undefined" ? VerdictComponent : class {}))();
const actionsUI = new (globalThis.NutEggUI?.ActionControlsComponent || (typeof ActionControlsComponent !== "undefined" ? ActionControlsComponent : class {}))();
const resultsUI = new (globalThis.NutEggUI?.ResultsViewComponent || (typeof ResultsViewComponent !== "undefined" ? ResultsViewComponent : class {}))();
const metricsUI = new (globalThis.NutEggUI?.MetricsComponent || (typeof MetricsComponent !== "undefined" ? MetricsComponent : class {}))();
const mindmapUI = new (globalThis.NutEggUI?.MindmapComponent || (typeof MindmapComponent !== "undefined" ? MindmapComponent : class {}))();
const chaptersUI = new (globalThis.NutEggUI?.ChaptersComponent || (typeof ChaptersComponent !== "undefined" ? ChaptersComponent : class {}))();
const qaUI = new (globalThis.NutEggUI?.QaComponent || (typeof QaComponent !== "undefined" ? QaComponent : class {}))();
const eggsUI = new (globalThis.NutEggUI?.EggsComponent || (typeof EggsComponent !== "undefined" ? EggsComponent : class {}))();

const uiComponents = {
  headerUI,
  bannersUI,
  captureUI,
  sectionsUI,
  verdictUI,
  actionsUI,
  resultsUI,
  metricsUI,
  mindmapUI,
  chaptersUI,
  qaUI,
  eggsUI,
};

const envService = new (globalThis.NutEggServices?.EnvironmentService || (typeof EnvironmentService !== "undefined" ? EnvironmentService : class {}))({
  config,
  settings,
  session,
  headerUI,
  bannersUI,
  metricsUI,
  helper,
  t,
  onServerOffline: () => {
    headerUI.render(session, settings);
    analyzeAction?.updateAnalyzeButtonsState?.();
  },
  onServerOnline: (status) => {
    headerUI.render(session, settings);
    analyzeAction?.updateAnalyzeButtonsState?.();
  },
});

// --- Action Handlers ---
const TabActionClass = globalThis.NutEggActions?.TabAction || (typeof TabAction !== "undefined" ? TabAction : class {});
const AnalyzeActionClass = globalThis.NutEggActions?.AnalyzeAction || (typeof AnalyzeAction !== "undefined" ? AnalyzeAction : class {});
const SaveActionClass = globalThis.NutEggActions?.SaveAction || (typeof SaveAction !== "undefined" ? SaveAction : class {});
const HistoryActionClass = globalThis.NutEggActions?.HistoryAction || (typeof HistoryAction !== "undefined" ? HistoryAction : class {});
const InteractionActionClass = globalThis.NutEggActions?.InteractionAction || (typeof InteractionAction !== "undefined" ? InteractionAction : class {});

const tabAction = new TabActionClass({
  session,
  settings,
  tabStateManager,
  pageExtractor,
  envService,
  ui: uiComponents,
  getHistoryAction: () => historyAction,
  getAnalyzeAction: () => analyzeAction,
  showCaptureState: () => showCaptureState(),
  showResultsState: (res, prov) => showResultsState(res, prov),
  renderApp: () => renderApp(),
});

const analyzeAction = new AnalyzeActionClass({
  session,
  settings,
  tabStateManager,
  analysisService,
  envService,
  ui: uiComponents,
  getTabAction: () => tabAction,
  getSaveAction: () => saveAction,
  showResultsState: (res, prov) => showResultsState(res, prov),
  renderApp: () => renderApp(),
});

const saveAction = new SaveActionClass({
  session,
  settings,
  tabStateManager,
  analysisService,
  envService,
  ui: uiComponents,
  getTabAction: () => tabAction,
  getAnalyzeAction: () => analyzeAction,
});

const historyAction = new HistoryActionClass({
  session,
  settings,
  tabStateManager,
  analysisService,
  ui: uiComponents,
  showResultsState: (res, prov) => showResultsState(res, prov),
  getSaveAction: () => saveAction,
});

const interactionAction = new InteractionActionClass({
  session,
  settings,
  tabStateManager,
  pageExtractor,
  analysisService,
  ui: uiComponents,
  getTabAction: () => tabAction,
});

// ============================================================
// UI Render Coordinator
// ============================================================

function renderApp(sessionState = session, settingsState = settings) {
  headerUI.render(sessionState, settingsState);
  bannersUI.render(sessionState, settingsState);
  resultsUI.render(sessionState, settingsState);
  captureUI.render(sessionState, settingsState);
  verdictUI.render(sessionState, settingsState);
  actionsUI.render(sessionState, settingsState);
  eggsUI.render(sessionState, settingsState);
}

function showResultsState(result, provenance = null) {
  const pinnedTabId = session.activeTabId;
  session.analysisResult = result;
  session.viewingContent = false;
  if (provenance) session.provenance = provenance;

  // Populate allEggs from result if session has none
  if (Array.isArray(result?.allEggs) && result.allEggs.length > 0) {
    const currentEggs = session.allEggs || [];
    const normalized = result.allEggs.map((name) => ({
      fileName: typeof name === "string" ? name : name?.fileName,
      description: "",
      topic: "",
    }));
    for (const n of normalized) {
      if (n.fileName && !currentEggs.some((e) => e.fileName === n.fileName)) {
        currentEggs.push(n);
      }
    }
    session.allEggs = currentEggs;
  }

  // Initialize selected eggs from matched eggs if empty
  if (session.selectedEggs.size === 0 && Array.isArray(result?.matchedEggs) && result.matchedEggs.length > 0) {
    result.matchedEggs.forEach((egg) => {
      const name = typeof egg === "string" ? egg : egg?.fileName;
      if (name) session.selectedEggs.add(name);
    });
  }

  resultsUI.showResults();
  globalThis.NutEggUI?.initCollapsibleSections?.();
  if (!session.isReanalyzing) {
    globalThis.NutEggUI?.resetCollapsibleSections?.();
  }
  if (!actionsUI.getProcessedMessage()) {
    const entry = (session.currentNutId != null && session.captureHistory.find((h) => String(h.nutId) === String(session.currentNutId))) || session.captureHistory[0];
    if (entry) {
      const when = new Date(entry.capturedAt).toLocaleString();
      const stateLabel = entry.saved === "saved"
        ? t("stateSaved") : entry.saved === "skip" ? t("stateCollected") : t("stateAnalyzed");
      actionsUI.showProcessedNote(t("capturedWhenStored", { when, state: stateLabel }));
    } else {
      actionsUI.showProcessedNote(t("analysisCompleteAdjust"));
    }
  } else {
    actionsUI.showProcessedNote(actionsUI.getProcessedMessage());
  }
  const effectiveSections = session.enabledSections || settings.enabledSections;
  sectionsUI.updateUI(effectiveSections);
  if (!session.isReanalyzing) {
    analyzeAction.updateAnalyzeButtonsState();
    actionsUI.setHistorySelectDisabled(false);
  }
  actionsUI.renderHistory(session.captureHistory, session.currentNutId);
  if (provenance) {
    resultsUI.renderProvenance(provenance);
  }

  renderApp();

  const eggResults = session.isStage1() ? [] : (result.eggResults || []);


  if (!settings.isChromeMode()) {
    tabAction.fetchEggs().then(() => {
      if (pinnedTabId && session.activeTabId !== pinnedTabId) return;
      eggsUI.renderSection(result.matchedEggs || [], {
        allEggs: session.allEggs,
        selectedEggs: session.selectedEggs,
        onSelectChange: () => analyzeAction.updateStage1ProceedBtn(),
      });
      const matchedCount = (result?.matchedEggs || []).length;
      if (session.isStage1() && (settings.analysisMode === "confirm" || matchedCount === 0)) {
        eggsUI.expandEggsList(true);
        analyzeAction.updateStage1ProceedBtn();
        actionsUI.stage1ConfirmBox?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  verdictUI.renderTitleVerdict(result.titleVerdict, effectiveSections?.titleVerdict !== false);
  mindmapUI.render(result.mindMap, effectiveSections?.mindMap !== false);

  const hasAuthorChapters =
    (Array.isArray(session.extractedContent?.chapters) && session.extractedContent.chapters.length > 0) ||
    (Array.isArray(session.stage1Payload?.chapters) && session.stage1Payload.chapters.length > 0) ||
    (Array.isArray(session.stage1Payload?.content?.chapters) && session.stage1Payload.content.chapters.length > 0) ||
    (Array.isArray(result?.chapters) && result.chapters.length > 0);

  const isShortWithoutChapters =
    (result.isLongForm === false || !result.chapterMap || result.chapterMap.length <= 1) &&
    !hasAuthorChapters;

  chaptersUI.render({
    chapterMap: result.chapterMap,
    enabled: effectiveSections?.chapterMap !== false,
    isShortWithoutChapters,
    activeTabId: session.activeTabId,
    onSeek: (seconds) => interactionAction.seekToChapter(seconds),
  });

  qaUI.setScope(session.followupScope || "within");
  qaUI.render(result, session.followUpQa);

  eggsUI.renderKnowledge(eggResults, {
    activeEggTab: session.activeEggTab,
    onTabChange: (newTab) => { session.activeEggTab = newTab; },
  });

  bannersUI.hideAll();
}

function showCaptureState() {
  session.viewingContent = false;
  session.analysisResult = null;
  session.cachedProcessedSaved = null;
  session.followUpQa = [];
  qaUI.clearFollowup();
  session.nutCollected = false;
  session.eggHatched = false;
  session.currentNutId = null;
  session.activeEggTab = null;
  globalThis.NutEggUI?.resetCollapsibleSections?.();
  bannersUI.hideAll();
  const effectiveSections = session.enabledSections || settings.enabledSections;
  sectionsUI.updateUI(effectiveSections);
  captureUI.setQuestionsScope(session.customQuestionsScope || "within");
  renderApp();
}

// ============================================================
// Initialization & Event Wiring
// ============================================================

async function initPopup() {
  // Give the static frame a paint before settings and initialization work.
  if (typeof requestAnimationFrame === "function") {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }
  eggsUI.bindElements();
  eggsUI.resetCreateForm();
  const version = chrome.runtime?.getManifest?.()?.version;
  if (version) headerUI.updateVersion(version);

  envService?.setUI?.({ headerUI, bannersUI, metricsUI });

  const i18n = typeof window !== "undefined" ? window.NutEggI18n : null;
  i18n?.initI18n();
  i18n?.applyI18n();

  try {
    const stored = await settings.loadFromStorage();
    if (stored?.analysisMode === "confirm" || stored?.analysisMode === "fast") {
      analyzeAction.setAnalysisMode(stored.analysisMode);
    }
    if (stored?.cachedMetrics) {
      metricsUI.render(stored.cachedMetrics);
    }
  } catch {}

  const toggleActiveTabSection = async (key) => {
    if (!session.enabledSections) {
      session.enabledSections = { ...(settings.enabledSections || globalThis.NutEggState?.DEFAULT_ANALYSIS_SECTIONS || {}) };
    }
    const currentVal = session.enabledSections[key] !== false;
    const activeCount = Object.values(session.enabledSections).filter(Boolean).length;
    if (currentVal && activeCount <= 1) {
      bannersUI.showWarning(t("atLeastOneSection"));
      return false;
    }
    session.enabledSections[key] = !currentVal;
    settings.setEnabledSections(session.enabledSections, true);
    if (session.activeTabId) {
      tabStateManager.saveActiveTabState(session.activeTabId, {
        enabledSections: { ...session.enabledSections },
      });
    }
    sectionsUI.updateUI(session.enabledSections);
    if (session.analysisResult && !session.viewingContent) {
      showResultsState(session.analysisResult, helper.provenanceFromExtraction(session.extractedContent));
    }
    return true;
  };

  sectionsUI.init({
    chipVerdict: document.getElementById("chip-verdict"),
    chipSummary: document.getElementById("chip-summary"),
    chipMindmap: document.getElementById("chip-mindmap"),
    chipChapters: document.getElementById("chip-chapters"),
    chipReVerdict: document.getElementById("reanalyze-chip-verdict"),
    chipReSummary: document.getElementById("reanalyze-chip-summary"),
    chipReMindmap: document.getElementById("reanalyze-chip-mindmap"),
    chipReChapters: document.getElementById("reanalyze-chip-chapters"),
    reanalyzeAccordion: document.getElementById("reanalyze-sections-accordion"),
    reanalyzeToggleBtn: document.getElementById("reanalyze-sections-toggle"),
    reanalyzeSectionsBody: document.getElementById("reanalyze-sections-body"),
    onToggle: toggleActiveTabSection,
    onSectionToggle: toggleActiveTabSection,
  });
  sectionsUI.updateUI(session.enabledSections || settings.enabledSections);

  envService.fetchMetrics();

  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName === "local") {
      if (changes.analysisMode) {
        const newMode = changes.analysisMode.newValue;
        if (newMode === "confirm" || newMode === "fast") {
          analyzeAction.setAnalysisMode(newMode);
        }
      }
      if (changes.outputLanguage && changes.outputLanguage.newValue) {
        settings.setOutputLanguage(changes.outputLanguage.newValue, false);
      }
      if (changes.enabledSections && changes.enabledSections.newValue) {
        settings.setEnabledSections(changes.enabledSections.newValue);
        if (!session.enabledSections) {
          session.enabledSections = { ...settings.enabledSections };
        }
        const effectiveSections = session.enabledSections || settings.enabledSections;
        sectionsUI.updateUI(effectiveSections);
        if (session.analysisResult && !session.viewingContent) {
          showResultsState(session.analysisResult, helper.provenanceFromExtraction(session.extractedContent));
        }
      }
      if (
        changes.serverPort ||
        changes.chromeAiEnabled ||
        changes.chromeAiApiKey ||
        changes.chromeAiProvider ||
        changes.chromeAiModel
      ) {
        envService.checkServerStatus(() => {
          analyzeAction.updateAnalyzeButtonsState();
        });
      }
    }
  });

  actionsUI.modeFastBtn?.addEventListener("click", () => analyzeAction.setAnalysisMode("fast"));
  actionsUI.modeConfirmBtn?.addEventListener("click", () => analyzeAction.setAnalysisMode("confirm"));
  actionsUI.stage1ProceedBtn?.addEventListener("click", () => analyzeAction.handleProceedStage2(null, true, false, session.activeTabId));
  actionsUI.stage1SkipBtn?.addEventListener("click", () => saveAction.handleSaveRaw());

  actionsUI.analyzeBtn?.addEventListener("click", () => {
    const notReady = analyzeAction.getAnalyzeNotReadyReason();
    if (notReady) {
      bannersUI.showWarning(notReady);
      envService.updateServerStatusIndicator();
      return;
    }
    analyzeAction.handleAnalyze(true);
  });
  actionsUI.confirmBtn?.addEventListener("click", () => saveAction.handleConfirm());
  actionsUI.collectNutBtn?.addEventListener("click", () => saveAction.handleSaveRaw());
  actionsUI.discardBtn?.addEventListener("click", () => window.close());
  globalThis.NutEggUI?.initCollapsibleSections?.();
  actionsUI.backBtn?.addEventListener("click", () => analyzeAction.handleBackToContent());
  actionsUI.viewAnalysisBtn?.addEventListener("click", () => analyzeAction.handleViewAnalysis());

  actionsUI.reanalyzeBtn?.addEventListener("click", async () => {
    const hasContent = !!(session.extractedContent && session.extractedContent.content);
    if (!hasContent) {
      actionsUI.setReanalyzeRefreshLoading(true);
      actionsUI.setReanalyzingState(t("loadingContent"));
      try {
        await tabAction.refreshForCurrentTab(true);
        bannersUI.hideWarning();
        bannersUI.hideMessages();
      } finally {
        actionsUI.setReanalyzeRefreshLoading(false);
      }
      if (!session.extractedContent || !session.extractedContent.content) {
        bannersUI.showWarning(analyzeAction.getAnalyzeNotReadyReason() || t("couldNotRetrieveContent"));
        actionsUI.setAnalyzeButtonLoading(false, t("reanalyze"));
        return;
      }
    }
    const notReady = analyzeAction.getAnalyzeNotReadyReason();
    if (notReady) {
      bannersUI.showWarning(notReady);
      envService.updateServerStatusIndicator();
      return;
    }
    analyzeAction.handleAnalyze(true, null, true);
  });

  actionsUI.reanalyzeRefreshBtn?.addEventListener("click", async () => {
    actionsUI.setReanalyzeRefreshLoading(true);
    try {
      await tabAction.refreshForCurrentTab(true);
      bannersUI.hideWarning();
      bannersUI.hideMessages();
    } catch (err) {
      bannersUI.showError(err instanceof Error ? err.message : t("couldNotRetrieveContent"));
    } finally {
      actionsUI.setReanalyzeRefreshLoading(false);
    }
  });

  actionsUI.historySelect?.addEventListener("change", () => {
    historyAction.onHistorySelected(actionsUI.historySelect.value);
  });

  captureUI.refreshBtn?.addEventListener("click", () => {
    tabAction.refreshForCurrentTab(true);
  });

  qaUI.followupBtn?.addEventListener("click", () => interactionAction.handleFollowUp());
  qaUI.followupInput?.addEventListener("keydown", (e) => {
    // Avoid plain Enter to prevent accidental submissions (e.g. IME confirmation or typing mistakes).
    // Require Cmd+Enter, Ctrl+Enter, or Shift+Enter.
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      interactionAction.handleFollowUp();
    }
  });
  qaUI.onScopeChange = (scope) => {
    session.followupScope = scope;
  };
  captureUI.onScopeChange = (scope) => {
    session.customQuestionsScope = scope;
  };

  headerUI.serverStatus?.addEventListener("click", () => {
    if (chrome.runtime?.openOptionsPage) chrome.runtime.openOptionsPage();
  });
  headerUI.statusIndicatorWrap?.addEventListener("click", () => {
    if (chrome.runtime?.openOptionsPage) chrome.runtime.openOptionsPage();
  });
  headerUI.settingsBtn?.addEventListener("click", () => {
    if (chrome.runtime?.openOptionsPage) chrome.runtime.openOptionsPage();
  });
  headerUI.aiCreditPill?.addEventListener("click", () => {
    if (chrome.runtime?.openOptionsPage) chrome.runtime.openOptionsPage();
  });

  captureUI.questionsToggle?.addEventListener("click", () => {
    captureUI.toggleQuestionsArea();
  });

  eggsUI.eggsToggle?.addEventListener("click", () => {
    eggsUI.toggleEggsList();
  });
  eggsUI.eggsCreateToggle?.addEventListener("click", () => {
    eggsUI.toggleCreateForm();
  });
  eggsUI.eggsCreateCancelBtn?.addEventListener("click", () => {
    eggsUI.toggleCreateForm(false);
  });
  eggsUI.createEggBtn?.addEventListener("click", () => saveAction.handleCreateEgg(false));
  eggsUI.eggsCreateBtn?.addEventListener("click", () => saveAction.handleCreateEgg(true));
  eggsUI.reanalyzeEggsBtn?.addEventListener("click", () => {
    analyzeAction.handleReanalyzeEggs();
  });
  eggsUI.reanalyzeEggsRefreshBtn?.addEventListener("click", async () => {
    eggsUI.setReanalyzeEggsRefreshLoading(true);
    try {
      await tabAction.refreshForCurrentTab(true);
      bannersUI.hideWarning();
      bannersUI.hideMessages();
    } catch (err) {
      bannersUI.showError(err instanceof Error ? err.message : t("couldNotRetrieveContent"));
    } finally {
      eggsUI.setReanalyzeEggsRefreshLoading(false);
    }
  });

  const reportBugLink = document.getElementById("report-bug-link");
  reportBugLink?.addEventListener("click", (e) => {
    e.preventDefault();
    interactionAction.openGitHubBugReport();
  });

  bannersUI.errorBanner?.addEventListener("click", (e) => {
    const target = e.target;
    if (target?.id === "error-report-bug-link" || target?.closest?.("#error-report-bug-link")) {
      e.preventDefault();
      interactionAction.openGitHubBugReport(bannersUI.errorBanner.textContent || "");
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target?.classList?.contains("source-pill") || e.target?.closest?.(".source-pill")) {
      interactionAction.handleSourcePillClick(e);
    }
  });

  // Tab Events
  chrome.tabs?.onActivated?.addListener((info) => tabAction.handleTabActivated(info));
  document.addEventListener("visibilitychange", () => tabAction.handleVisibilityChange());
  chrome.tabs?.onUpdated?.addListener((tabId, changeInfo) => tabAction.handleTabUpdated(tabId, changeInfo));
  chrome.tabs?.onRemoved?.addListener((tabId) => tabAction.handleTabRemoved(tabId));

  // Controls are now wired; keep the frame visible during server checks/extraction.
  globalThis.NutEggStartup?.finish();
  await tabAction.refreshForCurrentTab();
}

if (typeof module === "undefined" || !module.exports) {
  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPopup);
  } else {
    initPopup();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    initPopup,
    renderApp,
    showResultsState,
    showCaptureState,
  };
}
