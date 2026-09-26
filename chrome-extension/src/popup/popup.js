// Load UI & state modules in Node environment if required by tests
if (typeof require !== "undefined") {
  try {
    const helpers = require("./helpers.js");
    const tabState = require("./state/tab-state.js");
    const settingsState = require("./state/settings-state.js");
    const sessionState = require("./state/session-state.js");
    const pageExtractorService = require("./services/page-extractor.js");
    const analysisServiceModule = require("./services/analysis-service.js");
    const environmentServiceModule = require("./services/environment-service.js");
    const collapsibleUI = require("./ui/collapsible.js");
    const mindmapUI = require("./ui/mindmap.js");
    const chaptersUI = require("./ui/chapters.js");
    const qaUI = require("./ui/qa.js");
    const eggsUI = require("./ui/eggs.js");
    const headerUI = require("./ui/header.js");
    const bannersUI = require("./ui/banners.js");
    const captureViewUI = require("./ui/capture-view.js");
    const sectionChipsUI = require("./ui/section-chips.js");
    const verdictUI = require("./ui/verdict.js");
    const actionControlsUI = require("./ui/action-controls.js");
    const resultsViewUI = require("./ui/results-view.js");
    const metricsUI = require("./ui/metrics.js");
    Object.assign(
      globalThis,
      helpers,
      tabState,
      settingsState,
      sessionState,
      pageExtractorService,
      analysisServiceModule,
      environmentServiceModule,
      collapsibleUI,
      mindmapUI,
      chaptersUI,
      qaUI,
      eggsUI,
      headerUI,
      bannersUI,
      captureViewUI,
      sectionChipsUI,
      verdictUI,
      actionControlsUI,
      resultsViewUI,
      metricsUI
    );
  } catch { /* ignore in browser */ }
}

const t = (key, params) => (typeof window !== "undefined" && window.NutEggI18n ? window.NutEggI18n.t(key, params) : key);

const helper = globalThis.helper || globalThis.NutEggHelpers || (typeof require !== "undefined" ? require("./helpers.js").helper || require("./helpers.js") : {});

// ============================================================
// Services
// ============================================================
const pageExtractor = new (globalThis.NutEggServices?.PageExtractor || (typeof PageExtractor !== "undefined" ? PageExtractor : class {}))();
const analysisService = new (globalThis.NutEggServices?.AnalysisService || (typeof AnalysisService !== "undefined" ? AnalysisService : class {}))();

// ============================================================
// Modular UI Components
// ============================================================
const headerUI = new (globalThis.NutEggUI?.HeaderComponent || (typeof HeaderComponent !== "undefined" ? HeaderComponent : class {}))();
const bannersUI = new (globalThis.NutEggUI?.BannersComponent || (typeof BannersComponent !== "undefined" ? BannersComponent : class {}))();
const captureUI = new (globalThis.NutEggUI?.CaptureViewComponent || (typeof CaptureViewComponent !== "undefined" ? CaptureViewComponent : class {}))();
const resultsUI = new (globalThis.NutEggUI?.ResultsViewComponent || (typeof ResultsViewComponent !== "undefined" ? ResultsViewComponent : class {}))();
const sectionsUI = new (globalThis.NutEggUI?.SectionChipsComponent || (typeof SectionChipsComponent !== "undefined" ? SectionChipsComponent : class {}))();
const verdictUI = new (globalThis.NutEggUI?.VerdictComponent || (typeof VerdictComponent !== "undefined" ? VerdictComponent : class {}))();
const actionsUI = new (globalThis.NutEggUI?.ActionControlsComponent || (typeof ActionControlsComponent !== "undefined" ? ActionControlsComponent : class {}))();
const metricsUI = new (globalThis.NutEggUI?.MetricsComponent || (typeof MetricsComponent !== "undefined" ? MetricsComponent : class {}))();
const mindmapUI = new (globalThis.NutEggUI?.MindmapComponent || (typeof MindmapComponent !== "undefined" ? MindmapComponent : class {}))();
const chaptersUI = new (globalThis.NutEggUI?.ChaptersComponent || (typeof ChaptersComponent !== "undefined" ? ChaptersComponent : class {}))();
const qaUI = new (globalThis.NutEggUI?.QaComponent || (typeof QaComponent !== "undefined" ? QaComponent : class {}))();
const eggsUI = new (globalThis.NutEggUI?.EggsComponent || (typeof EggsComponent !== "undefined" ? EggsComponent : class {}))();

// ============================================================
// State Managers
// ============================================================
/** Per-tab state & cache manager. When the user switches away
 *  and back, the cached result is restored instead of re-extracting. */
const tabStateManager = typeof TabStateManager !== "undefined" ? new TabStateManager() : new (globalThis.NutEggTabState?.TabStateManager || Map)();
const tabResultCache = tabStateManager;

/** Persisted user preferences and environment/connection status. */
const settings = new (globalThis.NutEggState?.SettingsState || (typeof SettingsState !== "undefined" ? SettingsState : class {}))();

/** Environment & Server health service */
const envService = new (globalThis.NutEggServices?.EnvironmentService || (typeof EnvironmentService !== "undefined" ? EnvironmentService : class {}))({
  settings,
  headerUI,
  bannersUI,
  metricsUI,
  helper,
  t,
});

/** Active tab runtime session state (extracted content, analysis, egg selections). */
const session = new (globalThis.NutEggState?.SessionState || (typeof SessionState !== "undefined" ? SessionState : class {}))();

// ============================================================
// UI Render Coordinator
// ============================================================

/**
 * Declarative UI synchronization coordinator.
 * Renders header, banners, views, verdicts, actions, and eggs according to current session and settings state.
 */
function renderApp(sessionState = session, settingsState = settings) {
  headerUI.render(sessionState, settingsState);
  bannersUI.render(sessionState, settingsState);
  resultsUI.render(sessionState, settingsState);
  captureUI.render(sessionState, settingsState);
  verdictUI.render(sessionState, settingsState);
  actionsUI.render(sessionState, settingsState);
  eggsUI.render(sessionState, settingsState);
}

if (typeof globalThis !== "undefined") {
  globalThis.NutEggUI = globalThis.NutEggUI || {};
  globalThis.NutEggUI.renderApp = renderApp;
}

// --- Init ---

async function initPopup() {
  const version = chrome.runtime?.getManifest?.()?.version;
  if (version) headerUI.updateVersion(version);

  // Initialize i18n
  const i18n = typeof window !== "undefined" ? window.NutEggI18n : null;
  i18n?.initI18n();
  i18n?.applyI18n();

  // Restore analysis mode preference and cached metrics immediately (0ms paint)
  try {
    const stored = await settings.loadFromStorage();
    if (stored?.analysisMode === "confirm" || stored?.analysisMode === "fast") {
      setAnalysisMode(stored.analysisMode);
    }
    if (stored?.cachedMetrics) {
      metricsUI.render(stored.cachedMetrics);
    }
  } catch {}

  // Initialize Content Analysis section chips
  initSectionChips();

  // Fetch fresh metrics immediately in parallel without waiting for content extraction
  envService.fetchMetrics();

  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName === "local") {
      if (changes.analysisMode) {
        const newMode = changes.analysisMode.newValue;
        if (newMode === "confirm" || newMode === "fast") {
          setAnalysisMode(newMode);
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
        envService.checkServerStatus(() => {updateAnalyzeButtonsState();});
      }
    }
  });

  actionsUI.modeFastBtn?.addEventListener("click", () => setAnalysisMode("fast"));
  actionsUI.modeConfirmBtn?.addEventListener("click", () => setAnalysisMode("confirm"));
  actionsUI.stage1ProceedBtn?.addEventListener("click", () => handleProceedStage2(null, true, false, session.activeTabId));
  actionsUI.stage1SkipBtn?.addEventListener("click", handleSaveRaw);

  actionsUI.analyzeBtn.addEventListener("click", () => {
    const notReady = getAnalyzeNotReadyReason();
    if (notReady) {
      showWarning(notReady);
      return;
    }
    handleAnalyze(true);
  });
  actionsUI.confirmBtn.addEventListener("click", handleConfirm);
  actionsUI.collectNutBtn.addEventListener("click", handleSaveRaw);
  actionsUI.discardBtn.addEventListener("click", () => window.close());
  initCollapsibleSections();
  actionsUI.backBtn.addEventListener("click", async () => {
    showCaptureState();
    let currentTabUrl = "";
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTabUrl = tab?.url || "";
    } catch {}

    const urlMatches = session.extractedContent?.url && currentTabUrl &&
      session.extractedContent.url.split("#")[0] === currentTabUrl.split("#")[0];

    if (urlMatches && session.extractedContent?.content) {
      captureUI.setContent(session.extractedContent, {
        defaultTitle: captureUI.getPageTitle(),
        defaultType: captureUI.getPageType(),
      });
      captureUI.showProvenance(session.extractedContent.metadata || {});
      updateAnalyzeButtonsState();
    } else {
      session.extractedContent = null;
      captureUI.setLoading(t("retrievingPageContent"));
      await extractPageContent();
    }
  });
  headerUI.settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
  metricsUI.reportBugLink?.addEventListener("click", (e) => {
    e.preventDefault();
    openGitHubBugReport();
  });
  bannersUI.errorReportBug?.addEventListener("click", (e) => {
    e.preventDefault();
    const errMsg = bannersUI.errorMessage?.textContent || "";
    openGitHubBugReport(errMsg);
  });
  if (headerUI.aiCreditPill) {
    headerUI.aiCreditPill.addEventListener("click", () => {
      headerUI.setCheckingCredit();
      envService.checkCreditStatus();
    });
  }
  if (headerUI.statusIndicatorWrap) {
    headerUI.statusIndicatorWrap.addEventListener("click", () => {
      if (!settings.serverOnline) {
        window.open("https://community.obsidian.md/plugins/nutegg", "_blank");
        return;
      }
      headerUI.setCheckingServer();
      envService.checkCreditStatus();
    });
  }
  if (bannersUI.openSettingsKeyBtn) {
    bannersUI.openSettingsKeyBtn.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }
  if (bannersUI.aiKeyMissingBanner) {
    bannersUI.aiKeyMissingBanner.addEventListener("click", (e) => {
      if (e.target && (e.target.id === "open-settings-enable-ai-btn" || e.target.closest("#open-settings-enable-ai-btn"))) {
        chrome.tabs.create({ url: chrome.runtime.getURL("src/options/options.html?enableAi=1") });
        return;
      }
      if (e.target && (e.target.id === "open-settings-key-btn" || e.target.closest(".key-banner-link-btn"))) {
        chrome.runtime.openOptionsPage();
      }
    });
  }
  captureUI.questionsToggle.addEventListener("click", () => {
    captureUI.toggleQuestionsArea();
  });
  if (eggsUI.captureEggsToggle) {
    eggsUI.captureEggsToggle.addEventListener("click", () => {
      eggsUI.toggleCaptureEggs();
    });
  }
  qaUI.followupBtn.addEventListener("click", handleFollowUp);
  qaUI.followupInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleFollowUp();
  });
  if (qaUI.customQuestionsList) {
    qaUI.customQuestionsList.addEventListener("click", handleSourcePillClick);
  }
  if (eggsUI.eggKnowledgeContent) {
    eggsUI.eggKnowledgeContent.addEventListener("click", handleSourcePillClick);
  }
  if (resultsUI.resultsState) {
    resultsUI.resultsState.addEventListener("click", handleSourcePillClick);
  }
  captureUI.refreshBtn.addEventListener("click", () => refreshForCurrentTab(true));
  eggsUI.createEggBtn.addEventListener("click", () => handleCreateEgg(false));
  eggsUI.eggsCreateToggle.addEventListener("click", () => {
    eggsUI.toggleCreateForm();
  });
  eggsUI.eggsCreateBtn.addEventListener("click", () => handleCreateEgg(true));
  eggsUI.reanalyzeEggsBtn.addEventListener("click", async () => {
    const pinnedTabId = session.activeTabId;
    const pinnedEggs = [...session.selectedEggs];
    if (pinnedEggs.length === 0 || eggsUI.reanalyzeEggsBtn.disabled) return;

    const hasContent = !!(session.extractedContent && session.extractedContent.content);
    if (!hasContent) {
      const original = eggsUI.reanalyzeEggsBtn.textContent;
      eggsUI.setReanalyzeLoading(true, t("loadingContent"));
      bannersUI.hideMessages();
      hideWarning();

      try {
        await extractPageContent(session.refreshSeq, pinnedTabId);
      } catch (err) {
        console.error("[NutEgg] Error extracting content on re-analyze eggs:", err);
      }

      if (session.activeTabId !== pinnedTabId) return;

      eggsUI.setReanalyzeLoading(false, original);

      const nowHasContent = !!(session.extractedContent && session.extractedContent.content);
      if (!nowHasContent) {
        bannersUI.showError(t("couldNotRetrieveContent"));
        bannersUI.errorBanner.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
        return;
      }
    }

    if (session.activeTabId !== pinnedTabId) return;

    const notReady = getAnalyzeNotReadyReason();
    if (notReady) {
      showWarning(notReady);
      return;
    }
    const original = eggsUI.reanalyzeEggsBtn.textContent;
    eggsUI.setReanalyzeLoading(true, `⏳ ${t("analyzing")}`);
    eggsUI.clearError();
    if (session.stage1ContentAnalysis) {
      await handleProceedStage2(pinnedEggs, false, false, pinnedTabId);
    } else {
      const error = await handleAnalyze(true, pinnedEggs, true);
      if (error && session.activeTabId === pinnedTabId) {
        eggsUI.showError(`❌ ${error}`);
      }
    }
    if (session.activeTabId === pinnedTabId) {
      eggsUI.setReanalyzeLoading(false, original);
    }
  });
  // Egg picker is collapsed by default — expand on demand
  eggsUI.eggsToggle.addEventListener("click", () => {
    eggsUI.toggleEggsList();
  });
  actionsUI.reanalyzeBtn.addEventListener("click", async () => {
    if (actionsUI.reanalyzeBtn.disabled) return;
    const pinnedTabId = session.activeTabId;

    const hasContent = !!(session.extractedContent && session.extractedContent.content);
    if (!hasContent) {
      actionsUI.setReanalyzingState(t("loadingContent"));
      bannersUI.hideMessages();
      hideWarning();

      try {
        await extractPageContent(session.refreshSeq, pinnedTabId);
      } catch (err) {
        console.error("[NutEgg] Error extracting content on re-analyze:", err);
      }

      if (session.activeTabId !== pinnedTabId) return;

      const nowHasContent = !!(session.extractedContent && session.extractedContent.content);
      if (!nowHasContent) {
        updateAnalyzeButtonsState();
        bannersUI.showError(t("couldNotRetrieveContent"));
        bannersUI.errorBanner.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
        return;
      }
    }

    if (session.activeTabId !== pinnedTabId) return;

    const notReady = getAnalyzeNotReadyReason();
    if (notReady) {
      showWarning(notReady);
      return;
    }
    handleAnalyze(true, null, true);
  });
  actionsUI.historySelect.addEventListener("change", () => {
    const idx = parseInt(actionsUI.historySelect.value, 10);
    if (session.captureHistory[idx]) showHistoryEntry(session.captureHistory[idx]);
  });

  // The side panel persists across tabs — refresh content when the user
  // switches to another tab or the active tab navigates to a new URL.
  function getActiveTabSnapshot() {
    return session.snapshot({
      customQuestions: captureUI.getCustomQuestions(),
      analysisMode: settings.analysisMode,
    });
  }

  // The side panel persists across tabs — refresh content when the user
  // switches to another tab or the active tab navigates to a new URL.
  function saveActiveTabState(tabId) {
    if (!tabId) return;
    tabStateManager.saveActiveTabState(tabId, getActiveTabSnapshot());
  }

  // The side panel persists across tabs — refresh content when the user
  // switches to another tab or the active tab navigates to a new URL.
  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const { targetState } = tabStateManager.switchActiveTab(tabId, getActiveTabSnapshot());
    session.activeTabId = tabId;
    if (targetState && (targetState.analysisResult || targetState.status === "analyzing" || targetState.status === "hatching" || targetState.status === "error" || targetState.extractedContent)) {
      restoreFromTabCache(tabId, targetState);
    } else if (tabStateManager.isExtracting(tabId)) {
      // Tab is currently retrieving in the background — show retrieving state and let it finish
      captureUI.setLoading(t("retrievingPageContent"));
      updateAnalyzeButtonsState();
    } else {
      refreshForCurrentTab();
    }
  });

  // Reopen handling: browsers that keep the side-panel document alive while
  // the panel is closed don't re-fire DOMContentLoaded. Refresh on show —
  // but only when the displayed content belongs to a DIFFERENT tab. Plain
  // window focus loss/regain also fires visibilitychange, and that must NOT
  // reset the results the user was looking at.
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id != null && tab.id !== session.activeTabId) {
        const { targetState } = tabStateManager.switchActiveTab(tab.id, getActiveTabSnapshot());
        session.activeTabId = tab.id;
        if (targetState && (targetState.analysisResult || targetState.status === "analyzing" || targetState.status === "hatching" || targetState.status === "error" || targetState.extractedContent)) {
          restoreFromTabCache(tab.id, targetState);
        } else if (tabStateManager.isExtracting(tab.id)) {
          captureUI.setLoading(t("retrievingPageContent"));
          updateAnalyzeButtonsState();
        } else {
          refreshForCurrentTab();
        }
      }
    } catch {
      // tabs API unavailable — leave the current state alone
    }
  });

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    let isActiveTab = false;
    let activeUrl = null;
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      isActiveTab = activeTab?.id === tabId;
      if (isActiveTab) activeUrl = activeTab.url;
    } catch {}

    const newUrl = changeInfo.url || (isActiveTab ? activeUrl : null);
    const cached = tabResultCache.get(tabId);

    // URL changed — invalidate its cache immediately before checking loading status
    if ((newUrl && cached?.url && newUrl !== cached.url) || changeInfo.url) {
      tabStateManager.invalidateTab(tabId);
      if (isActiveTab) {
        refreshForCurrentTab();
        return;
      }
    }

    if (changeInfo.status === "loading") {
      if (isActiveTab) {
        session.currentTabLoading = true;
        updateAnalyzeButtonsState();
      }
      return;
    }

    // Page finished loading:
    if (changeInfo.status === "complete") {
      if (isActiveTab) {
        session.currentTabLoading = false;
        if (!session.extractedContent || session.lastLoadWasLoading || session.extractionFailed) {
          refreshForCurrentTab();
        } else {
          updateAnalyzeButtonsState();
        }
      }
      // Note: Do NOT auto-extract for unvisited background tabs to prevent race conditions and port exhaustion
      return;
    }
  });

  // Clean up cache when tabs are closed
  chrome.tabs.onRemoved.addListener((tabId) => {
    tabStateManager.invalidateTab(tabId);
  });

  await refreshForCurrentTab();
}

if (typeof module === "undefined" || !module.exports) {
  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPopup);
  } else {
    initPopup();
  }
}

/** Initialize expandable section selectors on capture screen & re-analysis screen */
function initSectionChips() {
  sectionsUI.init({
    onToggle: async (key) => {
      const ok = await settings.toggleSection(key);
      if (!ok) {
        showWarning(t("atLeastOneSection"));
        return;
      }
      sectionsUI.updateUI(settings.enabledSections);

      // If results are currently showing, update sections visibility dynamically
      if (session.analysisResult) {
        showResultsState(session.analysisResult, helper.provenanceFromExtraction(session.extractedContent));
      }
    },
  });
  sectionsUI.updateUI(settings.enabledSections);
}

/**
 * Re-run the capture flow for the currently active tab: reset state, check if
 * content has been captured before, and retrieve fresh content if needed.
 * `refreshSeq` guards against interleaved refreshes on rapid tab switches.
 */
async function refreshForCurrentTab(forceExtract = false) {
  const seq = session.nextRefreshSeq();
  captureUI.setCustomQuestions("");
  qaUI.clearFollowup();
  session.reset();
  eggsUI.updateCaptureLabel(session.preSelectedEggs);
  actionsUI.hideProcessedNote();
  actionsUI.renderHistory([]);
  captureUI.setLoading(t("loadingContent"));
  updateAnalyzeButtonsState();
  showCaptureState();

  let tabUrl = "";
  let targetTabId = session.activeTabId;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id != null) {
      session.activeTabId = tab.id;
      targetTabId = tab.id;
      tabStateManager.setActiveTabId(tab.id);
      if (forceExtract) {
        tabStateManager.invalidateTab(tab.id);
      }
    }
    if (tab?.status === "loading") {
      session.currentTabLoading = true;
      tabStateManager.setCurrentTabLoading(true);
    } else {
      session.currentTabLoading = false;
      tabStateManager.setCurrentTabLoading(false);
    }
    if (tab?.url) {
      tabUrl = tab.url;
      captureUI.setPageInfo({
        title: tab.title || t("loading"),
        url: tab.url,
        sourceType: helper.detectPageTypeFromUrl(tab.url),
      });
    }
  } catch {}

  updateAnalyzeButtonsState();

  if (seq !== session.refreshSeq) return;

  await envService.checkServerStatus(() => {updateAnalyzeButtonsState();});
  if (seq !== session.refreshSeq) return;

  // Kick off server tasks in parallel immediately without waiting for content extraction
  const serverTasks = settings.serverOnline
    ? Promise.all([
        envService.checkConfigStatus(),
        envService.fetchMetrics(),
        fetchEggs(),
      ])
    : null;

  // Check if this URL has been captured before — skip content retrieval if so!
  if (!forceExtract && settings.serverOnline && tabUrl) {
    const captured = await loadHistoryIfAny(seq, tabUrl);
    if (seq !== session.refreshSeq) return;
    if (captured) {
      if (serverTasks) await serverTasks;
      updateAnalyzeButtonsState();
      return;
    }
  }

  // Not captured before (or force-refresh requested) — show capture state and retrieve content
  showCaptureState();
  await extractPageContent(seq, targetTabId || session.activeTabId);
  if (seq !== session.refreshSeq) return;

  if (settings.serverOnline) {
    if (serverTasks) await serverTasks;
    if (seq !== session.refreshSeq) return;
    updateAnalyzeButtonsState();
    // Fallback: check if the canonical/cleaned extracted URL has history
    if (session.extractedContent?.url && session.extractedContent.url !== tabUrl) {
      await loadHistoryIfAny(seq, session.extractedContent.url);
    }
  }
}

/**
 * Restore the UI from a cached tab result (extraction + analysis).
 * Called when the user switches back to a tab that was previously analyzed or in-flight.
 */
async function restoreFromTabCache(tabId, cached) {
  const seq = session.nextRefreshSeq();
  session.activeTabId = tabId;
  const restored = tabStateManager.restoreTabState(tabId) || cached;
  session.restore(restored);
  eggsUI.updateCaptureLabel(session.preSelectedEggs);
  captureUI.setCustomQuestions(restored.customQuestions || "");
  qaUI.clearFollowup();
  session.currentTabLoading = false;

  if (restored.analysisMode && typeof setAnalysisMode === "function") {
    setAnalysisMode(restored.analysisMode);
  }

  // Ensure capture preview is updated
  captureUI.render(session, settings);

  if (cached.status === "error" || cached.error) {
    if (session.analysisResult) {
      showResultsState(session.analysisResult, helper.provenanceFromExtraction(session.extractedContent));
    } else {
      showCaptureState();
      if (session.extractedContent) {
        captureUI.setPreviewText(session.extractedContent.content || t("noContentExtracted"));
      }
    }
    bannersUI.showError(cached.error, cached.errorCode);
  } else if (cached.status === "analyzing") {
    if (cached.analysisResult) {
      // Re-analysis in flight: keep showing results view with analyzing indicator
      showResultsState(cached.analysisResult, helper.provenanceFromExtraction(session.extractedContent));
      actionsUI.setReanalyzingState(t("analyzing"));
      actionsUI.setHistorySelectDisabled(true);
      actionsUI.setAnalyzeButtonLoading(true, t("analyzing"));
      actionsUI.showProcessedNote(t("analyzingContent"));
    } else {
      showCaptureState();
      if (session.extractedContent) {
        captureUI.setPreviewText(session.extractedContent.content || t("noContentExtracted"));
      }
      actionsUI.setAnalyzeButtonLoading(true, t("analyzing"));
    }
  } else if (cached.status === "hatching") {
    if (session.analysisResult) {
      showResultsState(session.analysisResult, helper.provenanceFromExtraction(session.extractedContent));
    }
    actionsUI.updateStage1ProceedBtn({ isProceeding: true, autoSave: true });
    actionsUI.setReanalyzingState(t("comparingKnowledge"));
    actionsUI.setHistorySelectDisabled(true);
    actionsUI.setAnalyzeButtonLoading(true, t("analyzing"));
    if (settings.analysisMode === "fast") {
      verdictUI.setComparing();
    }
  } else if (session.analysisResult) {
    session.eggHatched = !!cached.eggHatched;
    session.nutCollected = !!cached.nutCollected;
    showResultsState(session.analysisResult, helper.provenanceFromExtraction(session.extractedContent));
    actionsUI.setHistorySelectDisabled(false);
    if (session.isStage1() && settings.analysisMode === "confirm") {
      actionsUI.showStage1Confirm();
      verdictUI.hide();
      updateStage1ProceedBtn();
    }
    if (session.captureHistory.length > 0) {
      const entry = (session.currentNutId != null && session.captureHistory.find((h) => String(h.nutId) === String(session.currentNutId))) || session.captureHistory[0];
      const when = new Date(entry.capturedAt).toLocaleString();
      const stateLabel = entry.saved === "saved"
        ? t("stateSaved") : entry.saved === "skip" ? t("stateCollected") : t("stateAnalyzed");
      if (cached.justReanalyzed) {
        actionsUI.showProcessedNote(t("reanalyzedFreshResult"));
        delete cached.justReanalyzed;
      } else {
        actionsUI.showProcessedNote(t("capturedWhenStored", { when, state: stateLabel }));
      }
      actionsUI.renderHistory(session.captureHistory, session.currentNutId);
    }
  } else {
    showCaptureState();
    updateAnalyzeButtonsState();
  }

  // Refresh server status and eggs without resetting content
  await envService.checkServerStatus(() => {updateAnalyzeButtonsState();});
  if (settings.serverOnline) {
    await fetchEggs();
  }
}

/** 🐣 Create an egg from the create form, then re-analyze against it. */
async function handleCreateEgg(inline = false) {
  const pinnedTabId = session.activeTabId;
  const { name, desc } = eggsUI.getNewEggInput();
  const btn = inline ? eggsUI.eggsCreateBtn : eggsUI.createEggBtn;
  if (!name || btn?.disabled) return;
  eggsUI.setCreateButtonLoading(true);
  try {
    const response = await analysisService.createEgg(name, desc);
    if (response?.success) {
      if (session.activeTabId !== pinnedTabId) return;
      if (inline) {
        await handleAnalyze(true);
      } else {
        const eggFile = response.path ? response.path.split("/").pop() : helper.slugify(name) + ".md";
        await handleAnalyze(true, [eggFile]);
      }
      return;
    }
    if (session.activeTabId === pinnedTabId) {
      const errText = response?.error || t("failedToCreateEgg");
      if (inline) {
        eggsUI.showError(`❌ ${errText}`);
      } else {
        bannersUI.showError(errText);
      }
    }
  } catch (err) {
    if (session.activeTabId === pinnedTabId) {
      const errText = err instanceof Error ? err.message : t("failedToCreateEgg");
      if (inline) {
        eggsUI.showError(`❌ ${errText}`);
      } else {
        bannersUI.showError(errText);
      }
    }
  }
  if (session.activeTabId === pinnedTabId) {
    eggsUI.setCreateButtonLoading(false);
  }
}


/** Load the full egg list from _index.md for the manual picker. */
async function fetchEggs() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "get-eggs" });
    session.allEggs = response?.eggs || [];
  } catch {
    session.allEggs = [];
  }
  eggsUI.renderCaptureList({ allEggs: session.allEggs, preSelectedEggs: session.preSelectedEggs });
}


function setAnalysisMode(mode) {
  settings.setAnalysisMode(mode);
  renderApp();

  if (session.isStage1() && mode === "confirm") {
    eggsUI.expandEggsList(true);
    updateStage1ProceedBtn();
    window.scrollTo(0, 0);
  }
}

function updateStage1ProceedBtn() {
  actionsUI.updateStage1ProceedBtn({
    selectedCount: session.selectedEggs.size,
    totalEggsCount: session.allEggs.length,
  });
}

async function handleProceedStage2(
  eggsToCompare = null,
  autoSave = false,
  skipScroll = false,
  pinnedTabId = null,
  contentAnalysis = null,
  basePayload = null,
  contentForProvenance = null
) {
  const targetPinnedId = pinnedTabId || session.activeTabId;
  const isPinnedActive = () => session.activeTabId === targetPinnedId;

  const res = await analysisService.proceedStage2({
    session,
    settings,
    tabStateManager,
    eggsToCompare,
    autoSave,
    skipScroll,
    pinnedTabId: targetPinnedId,
    contentAnalysis,
    basePayload,
    contentForProvenance,
    callbacks: {
      getQuestions: () => captureUI.getParsedQuestions(),
      onNoEggsSelected: () => {
        if (isPinnedActive()) {
          eggsUI.expandEggsList(true);
          if (eggsUI.eggsSection) eggsUI.eggsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
          showWarning(t("selectEggWarning"));
        }
      },
      onProceedStart: ({ autoSave: as }) => {
        if (isPinnedActive()) {
          actionsUI.updateStage1ProceedBtn({ isProceeding: true, autoSave: as });
          bannersUI.hideMessages();
        }
      },
      onProceedError: (error, code) => {
        if (isPinnedActive()) {
          bannersUI.showError(error, code);
          updateStage1ProceedBtn();
          if (settings.analysisMode === "confirm") {
            verdictUI.hide();
            actionsUI.showStage1Confirm();
          }
          updateAnalyzeButtonsState();
        }
      },
      onProceedComplete: ({ response, contentForProvenance: cfp, autoSave: as, skipScroll: ss }) => {
        if (isPinnedActive()) {
          showResultsState(response, helper.provenanceFromExtraction(cfp));
          if (as) {
            session.eggHatched = true;
            session.nutCollected = true;
            updateActionButtons();
            envService.fetchMetrics();
          }
          if (session.captureHistory.length > 0) {
            actionsUI.renderHistory(session.captureHistory, session.currentNutId);
            if (session.isReanalyzing) {
              actionsUI.showProcessedNote(t("reanalyzedFreshResult"));
            }
          }
          if (!ss) {
            setTimeout(() => {
              const target = eggsUI.eggKnowledgeSection && !eggsUI.eggKnowledgeSection.classList.contains("hidden")
                ? eggsUI.eggKnowledgeSection
                : verdictUI.verdictSection;
              if (target && !target.classList.contains("hidden")) {
                target.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }
            }, 100);
          }
        }
      },
      onSaveSuccess: (info) => {
        if (isPinnedActive()) {
          handleSaveSuccessNotification(info);
        }
      },
      onSaveError: (msg) => {
        if (isPinnedActive()) bannersUI.showError(msg);
      },
    },
  });

  return res.error || null;
}

function handleSaveSuccessNotification({ response, newKnowledge: nk, isHatch: ih, result }) {
  actionsUI.renderHistory(session.captureHistory, session.currentNutId);
  const merged = response?.merged || [];
  const mergedNote = merged.length > 0
    ? ` 🧹 ${merged
        .map((m) => t("unprocessedMergedNote", { count: m.entries, egg: m.egg }))
        .join(", ")}`
    : "";
  const isStage1BoxVisible = session.isStage1(result) && actionsUI.isStage1ConfirmVisible();
  if (isStage1BoxVisible) {
    bannersUI.hideSuccess();
  } else {
    if (nk.length > 0) {
      bannersUI.showSuccess(t("eggHatchedSuccess", { mergedNote }));
    } else if (ih) {
      bannersUI.showSuccess(t("eggHatchedNoKnowledge"));
    } else {
      bannersUI.showSuccess(t("nutCollectedVault"));
    }
  }
  updateActionButtons();
  envService.fetchMetrics();
}

// --- Button Readiness & State ---

/**
 * YouTube without a transcript: analysis would rely on the description only,
 * which produces misleading answers — warn and refuse to process.
 */
function isTranscriptBlocked() {
  return helper.isTranscriptBlocked(session.extractedContent);
}

function applyTranscriptBlock() {
  if (!isTranscriptBlocked()) return;
  updateAnalyzeButtonsState();
  showWarning(t("transcriptBlockedWarning"));
}

function getAnalyzeNotReadyReason() {
  return helper.getAnalyzeNotReadyReason(session, settings);
}

/** Updates analyze and re-analyze buttons' active / inactive visual state and labels. */
function updateAnalyzeButtonsState() {
  const isAnalyzing = tabStateManager.isAnalyzing(session.activeTabId);
  const notReady = getAnalyzeNotReadyReason();
  const hasContent = !!(session.extractedContent && session.extractedContent.content);

  actionsUI.updateAnalyzeState({
    isAnalyzing,
    notReadyReason: notReady,
    isTranscriptBlocked: isTranscriptBlocked(),
    currentTabLoading: session.currentTabLoading,
    extractionPending: session.extractionPending,
    hasContent,
    hasAnalysisResult: Boolean(session.analysisResult),
  });
}

// --- Content extraction ---

/**
 * Extract content from the active tab (or background tab when loaded).
 * Uses per-tab sequence numbers so background extractions finish and cache
 * cleanly without clobbering or being aborted by tab switches.
 */
async function extractPageContent(seq = session.refreshSeq, targetTabId = null) {
  let tabId, tabTitle, tabUrl, tabStatus;
  if (targetTabId) {
    try {
      const tab = await chrome.tabs.get(targetTabId);
      tabId = tab.id;
      tabTitle = tab.title;
      tabUrl = tab.url;
      tabStatus = tab.status;
    } catch {
      return null; // Tab closed
    }
  } else {
    const currentActiveId = session.activeTabId;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        tabId = tab.id;
        tabTitle = tab.title;
        tabUrl = tab.url;
        tabStatus = tab.status;
      }
    } catch {
      return null;
    }
    if (currentActiveId && tabId !== currentActiveId) {
      return null;
    }
  }

  if (!tabId) {
    if (!targetTabId || targetTabId === session.activeTabId) captureUI.setPageInfo({ title: t("unknownPage") });
    return null;
  }

  const isBackground = tabId !== session.activeTabId;
  const isTargetActive = !isBackground;

  // For background tabs: ONLY extract if content is already loaded!
  if (isBackground && tabStatus !== "complete") {
    return null;
  }

  const tabSeq = tabStateManager.nextExtractSeq(tabId);
  tabStateManager.setExtracting(tabId, true);

  if (isTargetActive) {
    session.extractionFailed = false;
    session.lastLoadWasLoading = false;
    session.extractionPending = true;
    captureUI.setRefreshDisabled(false); // Always clickable to cancel and retry!
    captureUI.setLoading(t("retrievingPageContent"));
    captureUI.setPageInfo({
      title: tabTitle || t("retrieving"),
      url: tabUrl || "",
      sourceType: helper.detectPageTypeFromUrl(tabUrl || ""),
    });
    updateAnalyzeButtonsState();
  }

  const isCancelled = () => !tabStateManager.isExtractSeqCurrent(tabId, tabSeq);

  try {
    // If active tab is still loading, wait for it to complete or settle
    if (tabStatus === "loading" && isTargetActive) {
      session.lastLoadWasLoading = true;
      session.currentTabLoading = true;
      updateAnalyzeButtonsState();
      await pageExtractor.waitForTabComplete(tabId, 6000);
      if (isCancelled()) return null;
      try {
        const refreshedTab = await chrome.tabs.get(tabId);
        tabTitle = refreshedTab.title || tabTitle;
        tabUrl = refreshedTab.url || tabUrl;
        if (session.activeTabId === tabId) {
          captureUI.setPageInfo({
            title: tabTitle || captureUI.getPageTitle(),
            url: tabUrl || captureUI.getPageUrl(),
          });
        }
      } catch {}
      await pageExtractor.waitForPageSettle(tabId, isCancelled);
      if (isCancelled()) return null;
      if (session.activeTabId === tabId) {
        session.currentTabLoading = false;
      }
    }

    const content = await pageExtractor.extractPage(tabId, { isCancelled });
    if (isCancelled()) return null;

    if (!content) {
      if (session.activeTabId === tabId) session.extractionFailed = true;
    } else {
      // Cache extracted content for the tab
      const cached = tabResultCache.get(tabId) || {};
      tabResultCache.set(tabId, {
        ...cached,
        url: content.url || tabUrl || cached.url,
        extractedContent: content,
      });

      // Update UI only if this tab is currently the active tab
      if (session.activeTabId === tabId) {
        session.extractedContent = content;
        session.currentTabLoading = false;
        captureUI.setPageInfo({
          title: content.title || tabTitle || "Untitled",
          sourceType: content.sourceType || captureUI.getPageType(),
        });
        captureUI.setPreviewText(content.content || "(No content extracted)");
        captureUI.showProvenance(content.metadata || {});
        applyTranscriptBlock();
        updateAnalyzeButtonsState();
      }

      return content;
    }
  } catch (err) {
    if (session.activeTabId === tabId) {
      console.error("[NutEgg] Extraction error:", err);
      session.extractionFailed = true;
    }
  } finally {
    tabStateManager.setExtracting(tabId, false);
    if (session.activeTabId === tabId && tabStateManager.isExtractSeqCurrent(tabId, tabSeq)) {
      session.extractionPending = false;
      captureUI.setRefreshDisabled(false);
      updateAnalyzeButtonsState();
    }
  }

  if (session.activeTabId === tabId && tabStateManager.isExtractSeqCurrent(tabId, tabSeq)) {
    if (session.extractionFailed && !session.extractedContent) {
      captureUI.setError(t("couldNotExtractContent"));
      showWarning(t("couldNotExtractRestricted"));
    }
    applyTranscriptBlock();
    updateAnalyzeButtonsState();
  }
  return null;
}

// --- Analyze ---

/**
 * Run the analysis. Returns null on success (results rendered) or an error
 * message on failure — callers in the results view surface it inline, since
 * the capture-state error banner is hidden there.
 */
async function handleAnalyze(force = false, eggsOverride = null, isReanalyze = false) {
  const notReady = getAnalyzeNotReadyReason();
  if (notReady) {
    showWarning(notReady);
    return notReady;
  }

  const pinnedTabId = session.activeTabId;
  const contentToAnalyze = session.extractedContent;

  if (!contentToAnalyze || !contentToAnalyze.content) {
    const msg = "The page is still loading or content is not ready yet. Please wait until it finishes loading.";
    showWarning(msg);
    return msg;
  }

  if (isTranscriptBlocked()) {
    applyTranscriptBlock();
    return "Video transcript unavailable — NutEgg will not process this video.";
  }

  const isPinnedActive = () => session.activeTabId === pinnedTabId;

  const res = await analysisService.analyze({
    session,
    settings,
    tabStateManager,
    force,
    eggsOverride,
    isReanalyze,
    pinnedTabId,
    callbacks: {
      getQuestions: () => captureUI.getParsedQuestions(),
      onWarning: (msg) => {
        if (isPinnedActive()) showWarning(msg);
      },
      onError: (msg, code) => {
        if (isPinnedActive()) bannersUI.showError(msg, code);
      },
      onStart: ({ isReanalyze: ir }) => {
        if (isPinnedActive()) {
          bannersUI.hideMessages();
          if (ir) {
            actionsUI.showProcessedNote(t("analyzingContent"));
            actionsUI.setReanalyzingState(t("analyzing"));
          }
          actionsUI.setHistorySelectDisabled(true);
          actionsUI.setAnalyzeButtonLoading(true, t("analyzing"));
        }
      },
      onStage1Interim: ({ response, eggsForStage2, isReanalyze: ir, contentToAnalyze: cta }) => {
        if (isPinnedActive()) {
          showResultsState(response, helper.provenanceFromExtraction(cta));
          if (ir) {
            actionsUI.showProcessedNote(t("comparingAgainstSelected"));
            actionsUI.setReanalyzingState(t("comparingKnowledge"));
          }
          if (eggsForStage2.length > 0) {
            if (!ir) {
              verdictUI.setComparing(eggsForStage2.length);
            } else {
              verdictUI.hide();
            }
            actionsUI.hideStage1Confirm();
          }
        }
      },
      onStage1Complete: ({ response, contentToAnalyze: cta, isReanalyze: ir }) => {
        if (isPinnedActive()) {
          showResultsState(response, helper.provenanceFromExtraction(cta));
          if (ir || session.captureHistory.length > 0) {
            actionsUI.showProcessedNote(ir ? t("reanalyzedFreshResult") : t("stage1Complete"));
            actionsUI.renderHistory(session.captureHistory, session.currentNutId);
          }
        }
      },
      onFinally: () => {
        if (isPinnedActive()) {
          actionsUI.setHistorySelectDisabled(false);
          const activeCache = tabResultCache.get(session.activeTabId);
          if (!activeCache || (activeCache.status !== "analyzing" && activeCache.status !== "hatching")) {
            updateAnalyzeButtonsState();
          }
        }
      },
      onNoEggsSelected: () => {
        if (isPinnedActive()) {
          eggsUI.expandEggsList(true);
          if (eggsUI.eggsSection) eggsUI.eggsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
          showWarning(t("selectEggWarning"));
        }
      },
      onProceedStart: ({ autoSave: as }) => {
        if (isPinnedActive()) {
          actionsUI.updateStage1ProceedBtn({ isProceeding: true, autoSave: as });
          bannersUI.hideMessages();
        }
      },
      onProceedError: (error, code) => {
        if (isPinnedActive()) {
          bannersUI.showError(error, code);
          updateStage1ProceedBtn();
          if (settings.analysisMode === "confirm") {
            verdictUI.hide();
            actionsUI.showStage1Confirm();
          }
          updateAnalyzeButtonsState();
        }
      },
      onProceedComplete: ({ response, contentForProvenance: cfp, autoSave: as, skipScroll: ss }) => {
        if (isPinnedActive()) {
          showResultsState(response, helper.provenanceFromExtraction(cfp));
          if (as) {
            session.eggHatched = true;
            session.nutCollected = true;
            updateActionButtons();
            envService.fetchMetrics();
          }
          if (session.captureHistory.length > 0) {
            actionsUI.renderHistory(session.captureHistory, session.currentNutId);
            if (session.isReanalyzing) {
              actionsUI.showProcessedNote(t("reanalyzedFreshResult"));
            }
          }
          if (!ss) {
            setTimeout(() => {
              const target = eggsUI.eggKnowledgeSection && !eggsUI.eggKnowledgeSection.classList.contains("hidden")
                ? eggsUI.eggKnowledgeSection
                : verdictUI.verdictSection;
              if (target && !target.classList.contains("hidden")) {
                target.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }
            }, 100);
          }
        }
      },
      onSaveSuccess: (info) => {
        if (isPinnedActive()) {
          handleSaveSuccessNotification(info);
        }
      },
      onSaveError: (msg) => {
        if (isPinnedActive()) bannersUI.showError(msg);
      },
    },
  });

  return res.error || null;
}

// --- Collapsible Results Sections ---

/** Initialize collapsible behavior for all result sections in results-state. */
function initCollapsibleSections() {
  const fn = (globalThis.NutEggUI || (typeof window !== "undefined" && window.NutEggUI))?.initCollapsibleSections;
  if (fn && fn !== initCollapsibleSections) {
    fn();
  }
}

/** Reset all result sections to expanded state. */
function resetCollapsibleSections() {
  const fn = (globalThis.NutEggUI || (typeof window !== "undefined" && window.NutEggUI))?.resetCollapsibleSections;
  if (fn && fn !== resetCollapsibleSections) {
    fn();
  }
}

// --- Show results ---

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
  initCollapsibleSections();
  if (!session.isReanalyzing) {
    resetCollapsibleSections();
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
    updateAnalyzeButtonsState();
    actionsUI.setHistorySelectDisabled(false);
  }
  actionsUI.renderHistory(session.captureHistory, session.currentNutId);
  if (provenance) {
    resultsUI.renderProvenance(provenance);
  }

  // Declarative UI update
  renderApp();

  // If Obsidian online, fetch eggs to sync checklist with _index.md
  if (!settings.isChromeMode()) {
    fetchEggs().then(() => {
      eggsUI.renderSection(result.matchedEggs || [], {
        allEggs: session.allEggs,
        selectedEggs: session.selectedEggs,
        onSelectChange: () => updateStage1ProceedBtn(),
      });
      const matchedCount = (result?.matchedEggs || []).length;
      if (session.isStage1() && (settings.analysisMode === "confirm" || matchedCount === 0)) {
        eggsUI.expandEggsList(true);
        updateStage1ProceedBtn();
        actionsUI.stage1ConfirmBox?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  // Mind Map — text-heavy concept tree for side panel
  mindmapUI.render(result.mindMap, settings.enabledSections.mindMap !== false);

  // Chapter Map — clickable when timestamps exist (video).
  // For short content without an original chapter map, don't show it:
  // - If isLongForm is false and no author chapters were provided, don't show it.
  // - If chapterMap has fewer than 2 entries and no author chapters were provided, don't show it.
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
    onSeek: seekToChapter,
  });

  // Your Questions — initial answers + follow-ups asked this session
  qaUI.render(result, session.followUpQa);

  // Egg Knowledge (Tabs + unified per-egg insights, Q&A, and tree)
  eggsUI.renderKnowledge(session.isStage1() ? [] : (result.eggResults || []), {
    activeEggTab: session.activeEggTab,
    onTabChange: (newTab) => { session.activeEggTab = newTab; },
  });

  bannersUI.hideSuccess();
}

/** Reflect nutCollected/eggHatched in the two action buttons. */
function updateActionButtons() {
  actionsUI.render(session, settings);
  bannersUI.render(session, settings);
}

/**
 * On popup open: if this URL has cached captures, show the latest result
 * without waiting for the user to click Analyze.
 */
async function loadHistoryIfAny(seq = session.refreshSeq, urlOverride = null) {
  const url = urlOverride || session.extractedContent?.url;
  if (!settings.serverOnline || !url) return false;
  try {
    const history = await analysisService.loadHistory(url);
    if (seq !== session.refreshSeq) return false; // a newer tab refresh superseded this one
    if (history?.length) {
      session.captureHistory = history;
      showHistoryEntry(history[0]);
      actionsUI.setAnalyzeButtonLoading(false, t("analyzeAgain"));
      return true;
    }
  } catch {
    // Server unreachable or no history — stay in capture state
  }
  return false;
}

/** Show one cached capture (from history) with its capture timestamp. */
function showHistoryEntry(entry) {
  session.cachedProcessedSaved = entry.saved || "analyzed";
  session.nutCollected = session.cachedProcessedSaved === "saved" || session.cachedProcessedSaved === "skip";
  session.eggHatched = session.cachedProcessedSaved === "saved";
  session.currentNutId = entry.nutId ?? null;
  session.analysisResult = entry.result;

  if (entry.result?.stage === "stage1") {
    session.stage1ContentAnalysis = entry.result;
    session.stage1Payload = {
      url: entry.url || session.extractedContent?.url || captureUI.getPageUrl() || "",
      title: entry.title || session.extractedContent?.title || captureUI.getPageTitle() || "",
      content: entry.content || session.extractedContent?.content || "",
      sourceType: entry.sourceType || session.extractedContent?.sourceType || "generic",
      metadata: session.extractedContent?.metadata,
      nutId: entry.nutId,
    };
  } else {
    session.stage1ContentAnalysis = null;
    session.stage1Payload = null;
  }

  if (entry.content) {
    session.extractedContent = {
      url: entry.url || captureUI.getPageUrl() || "",
      title: entry.title || captureUI.getPageTitle() || "",
      content: entry.content,
      sourceType: entry.sourceType || "webpage",
      metadata: {
        ...(entry.author ? { author: entry.author } : {}),
        ...(entry.publishedAt ? { published: entry.publishedAt } : {}),
      },
    };
    captureUI.setPreviewText(entry.content);
  }

  if (session.activeTabId) {
    const existing = tabResultCache.get(session.activeTabId) || {};
    tabResultCache.set(session.activeTabId, {
      ...existing,
      status: "done",
      extractedContent: existing.extractedContent || session.extractedContent,
      analysisResult: entry.result,
      currentNutId: entry.nutId,
      eggHatched: session.eggHatched,
      nutCollected: session.nutCollected,
      stage1Payload: (session.isStage1(entry.result) ? session.stage1Payload : null),
      stage1ContentAnalysis: (session.isStage1(entry.result) ? session.stage1ContentAnalysis : null),
    });
  }

  // Stored provenance from the DB row, falling back to the live extraction
  const live = helper.provenanceFromExtraction();
  showResultsState(entry.result, {
    title: entry.title || live?.title || "",
    author: entry.author || live?.author || "",
    publishedAt: entry.publishedAt || live?.publishedAt || "",
  });
  updateActionButtons();

  const when = new Date(entry.capturedAt).toLocaleString();
  const stateLabel = entry.saved === "saved"
    ? t("stateSaved") : entry.saved === "skip" ? t("stateCollected") : t("stateAnalyzed");
  actionsUI.showProcessedNote(t("capturedWhenStored", { when, state: stateLabel }));

  // Version selector when multiple captures exist
  actionsUI.renderHistory(session.captureHistory, entry.nutId);
}

/** Ask a follow-up question against the already-analyzed content. */
async function handleFollowUp() {
  const pinnedTabId = session.activeTabId;
  const q = qaUI.getFollowupText();
  if (!q || qaUI.followupBtn?.disabled) return;
  qaUI.clearFollowup();
  qaUI.setFollowupLoading(true);
  qaUI.render(session.analysisResult, session.followUpQa);

  await analysisService.askFollowUp({
    session,
    settings,
    tabStateManager,
    question: q,
    pinnedTabId,
    extractFallback: (id) => extractPageContent(session.refreshSeq, id),
    buildPriorQa: (res, qaList) => helper.buildPriorQa(res, qaList),
  });

  if (session.activeTabId === pinnedTabId) {
    qaUI.setFollowupLoading(false);
    qaUI.render(session.analysisResult, session.followUpQa);
  }
}

/** Seek the active tab's video to a chapter timestamp. */
async function seekToChapter(seconds) {
  let tabId = session.activeTabId;
  if (!tabId) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = tab?.id;
    } catch { /* ignore */ }
  }
  return pageExtractor.seekToChapter(tabId, seconds);
}

/** Scroll the active tab to a section heading or quote text. */
async function scrollToSection(heading, quote) {
  let tabId = session.activeTabId;
  if (!tabId) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = tab?.id;
    } catch { /* ignore */ }
  }
  return pageExtractor.scrollToSection(tabId, heading, quote);
}

/** Handle click on source pills (timestamp seek or section scroll). */
function handleSourcePillClick(e) {
  const fn = (globalThis.NutEggUI || (typeof window !== "undefined" && window.NutEggUI))?.handleSourcePillClick;
  if (fn && fn !== handleSourcePillClick) {
    fn(e, {
      onSeek: seekToChapter,
      onScroll: scrollToSection,
    });
  }
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
  resetCollapsibleSections();
  bannersUI.hideMessages();
  sectionsUI.updateUI(settings.enabledSections);
  renderApp();
}

// --- Confirm (add to knowledge base) ---

async function handleConfirm() {
  const pinnedTabId = session.activeTabId;
  const cached = pinnedTabId ? tabResultCache.get(pinnedTabId) : null;
  const targetResult = session.analysisResult || cached?.analysisResult;
  let targetContent = session.extractedContent || cached?.extractedContent;
  const targetNutId = session.currentNutId || cached?.currentNutId;

  if (!targetResult || session.eggHatched || !(targetResult.newKnowledge?.length)) return;
  if (!targetContent) {
    if (session.activeTabId === pinnedTabId) {
      actionsUI.setConfirmButtonLoading(true, t("retrieving"));
    }
    targetContent = await extractPageContent(session.refreshSeq, pinnedTabId);
  }
  if (session.activeTabId === pinnedTabId) {
    actionsUI.setConfirmButtonLoading(true, t("hatching"));
  }
  await doSave(targetResult.newKnowledge || [], true, targetContent, targetResult, targetNutId, pinnedTabId);
  if (session.activeTabId === pinnedTabId) {
    updateActionButtons();
  }
}

// --- Collect Nut (save content only, no knowledge additions) ---

async function handleSaveRaw() {
  const pinnedTabId = session.activeTabId;
  const cached = pinnedTabId ? tabResultCache.get(pinnedTabId) : null;
  const targetResult = session.analysisResult || cached?.analysisResult;
  let targetContent = session.extractedContent || cached?.extractedContent;
  const targetNutId = session.currentNutId || cached?.currentNutId;

  if (session.nutCollected) return; // already collected — no duplicate work
  if (!targetContent) {
    if (session.activeTabId === pinnedTabId) {
      actionsUI.setCollectNutLoading(true, t("retrieving"));
    }
    targetContent = await extractPageContent(session.refreshSeq, pinnedTabId);
  }
  if (!targetContent) {
    if (session.activeTabId === pinnedTabId) {
      bannersUI.showError(t("couldNotExtractToSave"));
      updateActionButtons();
    }
    return;
  }
  if (session.activeTabId === pinnedTabId) {
    actionsUI.setCollectNutLoading(true, t("collecting"));
  }
  await doSave([], false, targetContent, targetResult, targetNutId, pinnedTabId);
  if (session.activeTabId === pinnedTabId) {
    updateActionButtons();
  }
}

async function doSave(
  newKnowledge,
  isHatch = false,
  overrideContent = null,
  overrideResult = null,
  overrideNutId = null,
  targetPinnedId = null
) {
  const targetId = targetPinnedId || session.activeTabId;
  const isTargetActive = () => session.activeTabId === targetId;

  return analysisService.saveKnowledge({
    session,
    settings,
    tabStateManager,
    newKnowledge,
    isHatch,
    overrideContent,
    overrideResult,
    overrideNutId,
    targetPinnedId: targetId,
    extractFallback: (id) => extractPageContent(session.refreshSeq, id),
    callbacks: {
      onSaveSuccess: (info) => {
        if (isTargetActive()) {
          handleSaveSuccessNotification(info);
        }
      },
      onSaveError: (msg) => {
        if (isTargetActive()) bannersUI.showError(msg);
      },
    },
  });
}

// --- Messages ---

function showWarning(msg) {
  bannersUI.showWarning(msg);
  envService.updateServerStatusIndicator();
}
function hideWarning() {
  bannersUI.hideWarning();
  envService.updateServerStatusIndicator();
}

/** Redirect to GitHub issues prefilled with bug report template. */
function openGitHubBugReport(errorContext = "") {
  let contentUrl = "";
  if (session.extractedContent?.url) {
    contentUrl = session.extractedContent.url;
  } else if (captureUI.getPageUrl() && captureUI.getPageUrl() !== "Loading...") {
    contentUrl = captureUI.getPageUrl();
  }
  return helper.openGitHubBugReport(errorContext, { url: contentUrl });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    helper,
    extractTimestamp: helper.extractTimestamp,
    linkifyTimestamps: helper.linkifyTimestamps,
    timeToSeconds: helper.timeToSeconds,
    unwrapMindMapRoots: helper.unwrapMindMapRoots,
    initCollapsibleSections,
    resetCollapsibleSections,
    buildPriorQa: helper.buildPriorQa,
    handleSourcePillClick,
    cleanEggName: helper.cleanEggName,
    tabStateManager,
    tabResultCache,
    settings,
    session,
    analysisService,
    escapeHtml: helper.escapeHtml,
    slugify: helper.slugify,
    openGitHubBugReport,
    getVersionMismatchIssue: helper.getVersionMismatchIssue,
    isTranscriptBlocked,
    getAnalyzeNotReadyReason,
  };
}
