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
const envService = new (globalThis.NutEggServices?.EnvironmentService || (typeof EnvironmentService !== "undefined" ? EnvironmentService : class {}))({
  config,
  settings,
  session,
  t,
  onServerOffline: () => {
    headerUI.render(session, settings);
    analyzeAction.updateAnalyzeButtonsState();
  },
  onServerOnline: (status) => {
    headerUI.render(session, settings);
    analyzeAction.updateAnalyzeButtonsState();
  },
});

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
  session.analysisResult = result;
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
  sectionsUI.updateUI(settings.enabledSections);
  if (!session.isReanalyzing) {
    analyzeAction.updateAnalyzeButtonsState();
    actionsUI.setHistorySelectDisabled(false);
  }
  actionsUI.renderHistory(session.captureHistory, session.currentNutId);
  if (provenance) {
    resultsUI.renderProvenance(provenance);
  }

  renderApp();

  if (!settings.isChromeMode()) {
    tabAction.fetchEggs().then(() => {
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

  mindmapUI.render(result.mindMap, settings.enabledSections.mindMap !== false);

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
    enabled: settings.enabledSections.chapterMap !== false,
    isShortWithoutChapters,
    activeTabId: session.activeTabId,
    onSeek: (seconds) => interactionAction.seekToChapter(seconds),
  });

  qaUI.render(result, session.followUpQa);

  eggsUI.renderKnowledge(session.isStage1() ? [] : (result.eggResults || []), {
    activeEggTab: session.activeEggTab,
    onTabChange: (newTab) => { session.activeEggTab = newTab; },
  });

  bannersUI.hideSuccess();
}

function showCaptureState() {
  session.analysisResult = null;
  session.cachedProcessedSaved = null;
  session.followUpQa = [];
  qaUI.clearFollowup();
  session.nutCollected = false;
  session.eggHatched = false;
  session.currentNutId = null;
  session.activeEggTab = null;
  globalThis.NutEggUI?.resetCollapsibleSections?.();
  bannersUI.hideMessages();
  sectionsUI.updateUI(settings.enabledSections);
  renderApp();
}

// ============================================================
// Initialization & Event Wiring
// ============================================================

async function initPopup() {
  const version = chrome.runtime?.getManifest?.()?.version;
  if (version) headerUI.updateVersion(version);

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

  sectionsUI.init({
    chipSummary: document.getElementById("chip-summary"),
    chipMindmap: document.getElementById("chip-mindmap"),
    chipChapters: document.getElementById("chip-chapters"),
    chipReSummary: document.getElementById("reanalyze-chip-summary"),
    chipReMindmap: document.getElementById("reanalyze-chip-mindmap"),
    chipReChapters: document.getElementById("reanalyze-chip-chapters"),
    reanalyzeAccordion: document.getElementById("reanalyze-sections-accordion"),
    reanalyzeToggleBtn: document.getElementById("reanalyze-sections-toggle"),
    onSectionToggle: (section, enabled, newSections) => {
      settings.setEnabledSections(newSections);
      sectionsUI.updateUI(settings.enabledSections);
      if (session.analysisResult) {
        showResultsState(session.analysisResult, helper.provenanceFromExtraction(session.extractedContent));
      }
    },
  });
  sectionsUI.updateUI(settings.enabledSections);

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
        sectionsUI.updateUI(settings.enabledSections);
        if (session.analysisResult) {
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
  actionsUI.backBtn?.addEventListener("click", async () => {
    showCaptureState();
    let currentTabUrl = "";
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) currentTabUrl = tab.url;
    } catch {}
    const pageUrl = currentTabUrl || session.extractedContent?.url;
    const pageTitle = (pageUrl === currentTabUrl ? null : session.extractedContent?.title) || t("capturedPage");
    captureUI.setPageInfo({ title: pageTitle, url: pageUrl });
  });

  actionsUI.reanalyzeBtn?.addEventListener("click", () => {
    const notReady = analyzeAction.getAnalyzeNotReadyReason();
    if (notReady) {
      bannersUI.showWarning(notReady);
      envService.updateServerStatusIndicator();
      return;
    }
    analyzeAction.handleAnalyze(true, null, true);
  });

  actionsUI.historySelect?.addEventListener("change", () => {
    historyAction.onHistorySelected(actionsUI.historySelect.value);
  });

  captureUI.refreshBtn?.addEventListener("click", () => {
    tabAction.refreshForCurrentTab(true);
  });

  qaUI.followupBtn?.addEventListener("click", () => interactionAction.handleFollowUp());
  qaUI.followupInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      interactionAction.handleFollowUp();
    }
  });

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
  bannersUI.openSettingsKeyBtn?.addEventListener("click", () => {
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
  eggsUI.createEggBtn?.addEventListener("click", () => saveAction.handleCreateEgg(false));
  eggsUI.eggsCreateBtn?.addEventListener("click", () => saveAction.handleCreateEgg(true));
  eggsUI.reanalyzeEggsBtn?.addEventListener("click", () => {
    analyzeAction.handleReanalyzeEggs();
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
