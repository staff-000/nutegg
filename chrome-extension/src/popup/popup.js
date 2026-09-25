// Load UI & state modules in Node environment if required by tests
if (typeof require !== "undefined") {
  try {
    const tabState = require("./state/tab-state.js");
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
      tabState,
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

let extractedContent = null;
let serverOnline = false;
let chromeAiEnabled = false;
let chromeAiConfigured = false;
let chromeAiProvider = "";
let chromeAiModel = "";
let obsidianAiConfigured = false;
let outputLanguage = "same-as-content";
let analysisResult = null;
let activeTabId = null;
let isReanalyzing = false;
/** How the shown result was saved previously: "saved" | "skip" | "analyzed" | null (fresh analysis). */
let cachedProcessedSaved = null;
/** Follow-up questions asked after the result was shown (this session). */
let followUpQa = [];
/** Save-state of the shown result this session. Hatch implies both. */
let nutCollected = false;
let eggHatched = false;
/** Capture history for the current URL (newest first) — URLs change over time. */
let captureHistory = [];
/** Row id of the capture currently shown / last analyzed. */
let currentNutId = null;
/** All eggs from _index.md (for the manual egg picker). */
let allEggs = [];
/** The user's checkbox selection in the egg picker. */
let selectedEggs = new Set();
/** Pre-selected eggs on the capture screen (before analyze). Empty = auto-detect. */
let preSelectedEggs = new Set();

const DEFAULT_ANALYSIS_SECTIONS = {
  titleVerdict: true,
  coreSummary: true,
  mindMap: true,
  chapterMap: true,
};
let enabledSections = { ...DEFAULT_ANALYSIS_SECTIONS };

/** Analysis mode: "fast" (1-click full) | "confirm" (confirm eggs after stage 1). */
let analysisMode = "fast";
let stage1Payload = null;
let stage1ContentAnalysis = null;
let activeEggTab = null;
let currentTabLoading = false;

/** Per-tab state & cache manager. When the user switches away
 *  and back, the cached result is restored instead of re-extracting. */
const tabStateManager = typeof TabStateManager !== "undefined" ? new TabStateManager() : new (globalThis.NutEggTabState?.TabStateManager || Map)();
const tabResultCache = tabStateManager;
const tabExtractSeq = tabStateManager.extractSeq || new Map();
const tabsExtracting = tabStateManager.extracting || new Set();

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
    const stored = await new Promise((resolve) => {
      chrome.storage?.local?.get?.(["analysisMode", "cachedMetrics", "enabledSections", "outputLanguage"], resolve);
    });
    if (stored?.analysisMode === "confirm" || stored?.analysisMode === "fast") {
      setAnalysisMode(stored.analysisMode);
    }
    if (stored?.cachedMetrics) {
      applyMetrics(stored.cachedMetrics);
    }
    if (stored?.enabledSections) {
      enabledSections = { ...DEFAULT_ANALYSIS_SECTIONS, ...stored.enabledSections };
    }
    if (stored?.outputLanguage) {
      outputLanguage = stored.outputLanguage;
    }
  } catch {}

  // Initialize Content Analysis section chips
  initSectionChips();

  // Fetch fresh metrics immediately in parallel without waiting for content extraction
  fetchMetrics();

  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName === "local") {
      if (changes.analysisMode) {
        const newMode = changes.analysisMode.newValue;
        if (newMode === "confirm" || newMode === "fast") {
          setAnalysisMode(newMode);
        }
      }
      if (changes.outputLanguage && changes.outputLanguage.newValue) {
        outputLanguage = changes.outputLanguage.newValue;
      }
      if (changes.enabledSections && changes.enabledSections.newValue) {
        enabledSections = { ...DEFAULT_ANALYSIS_SECTIONS, ...changes.enabledSections.newValue };
        updateSectionChipsUI();
        if (analysisResult) {
          showResultsState(analysisResult, provenanceFromExtraction(extractedContent));
        }
      }
      if (
        changes.serverPort ||
        changes.chromeAiEnabled ||
        changes.chromeAiApiKey ||
        changes.chromeAiProvider ||
        changes.chromeAiModel
      ) {
        checkServerStatus();
      }
    }
  });

  actionsUI.modeFastBtn?.addEventListener("click", () => setAnalysisMode("fast"));
  actionsUI.modeConfirmBtn?.addEventListener("click", () => setAnalysisMode("confirm"));
  actionsUI.stage1ProceedBtn?.addEventListener("click", () => handleProceedStage2(null, true, false, activeTabId));
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
  actionsUI.discardBtn.addEventListener("click", handleDiscard);
  initCollapsibleSections();
  actionsUI.backBtn.addEventListener("click", async () => {
    showCaptureState();
    let currentTabUrl = "";
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTabUrl = tab?.url || "";
    } catch {}

    const urlMatches = extractedContent?.url && currentTabUrl &&
      extractedContent.url.split("#")[0] === currentTabUrl.split("#")[0];

    if (urlMatches && extractedContent?.content) {
      captureUI.setContent(extractedContent, {
        defaultTitle: captureUI.getPageTitle(),
        defaultType: captureUI.getPageType(),
      });
      showProvenance(extractedContent.metadata || {});
      updateAnalyzeButtonsState();
    } else {
      extractedContent = null;
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
      checkCreditStatus();
    });
  }
  if (headerUI.statusIndicatorWrap) {
    headerUI.statusIndicatorWrap.addEventListener("click", () => {
      if (!serverOnline) {
        window.open("https://community.obsidian.md/plugins/nutegg", "_blank");
        return;
      }
      headerUI.setCheckingServer();
      checkServerStatus();
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
  captureUI.refreshBtn.addEventListener("click", handleRefresh);
  eggsUI.createEggBtn.addEventListener("click", handleCreateEgg);
  eggsUI.eggsCreateToggle.addEventListener("click", () => {
    eggsUI.toggleCreateForm();
  });
  eggsUI.eggsCreateBtn.addEventListener("click", handleCreateEggInline);
  eggsUI.reanalyzeEggsBtn.addEventListener("click", async () => {
    const pinnedTabId = activeTabId;
    const pinnedEggs = [...selectedEggs];
    if (pinnedEggs.length === 0 || eggsUI.reanalyzeEggsBtn.disabled) return;

    const hasContent = !!(extractedContent && extractedContent.content);
    if (!hasContent) {
      const original = eggsUI.reanalyzeEggsBtn.textContent;
      eggsUI.setReanalyzeLoading(true, t("loadingContent"));
      hideMessages();
      hideWarning();

      try {
        await extractPageContent(refreshSeq, pinnedTabId);
      } catch (err) {
        console.error("[NutEgg] Error extracting content on re-analyze eggs:", err);
      }

      if (activeTabId !== pinnedTabId) return;

      eggsUI.setReanalyzeLoading(false, original);

      const nowHasContent = !!(extractedContent && extractedContent.content);
      if (!nowHasContent) {
        showError(t("couldNotRetrieveContent"));
        bannersUI.errorBanner.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
        return;
      }
    }

    if (activeTabId !== pinnedTabId) return;

    const notReady = getAnalyzeNotReadyReason();
    if (notReady) {
      showWarning(notReady);
      return;
    }
    const original = eggsUI.reanalyzeEggsBtn.textContent;
    eggsUI.setReanalyzeLoading(true, `⏳ ${t("analyzing")}`);
    eggsUI.clearError();
    if (stage1ContentAnalysis) {
      await handleProceedStage2(pinnedEggs, false, false, pinnedTabId);
    } else {
      const error = await handleAnalyze(true, pinnedEggs, true);
      if (error && activeTabId === pinnedTabId) {
        eggsUI.showError(`❌ ${error}`);
      }
    }
    if (activeTabId === pinnedTabId) {
      eggsUI.setReanalyzeLoading(false, original);
    }
  });
  // Egg picker is collapsed by default — expand on demand
  eggsUI.eggsToggle.addEventListener("click", () => {
    eggsUI.toggleEggsList();
  });
  actionsUI.reanalyzeBtn.addEventListener("click", async () => {
    if (actionsUI.reanalyzeBtn.disabled) return;
    const pinnedTabId = activeTabId;

    const hasContent = !!(extractedContent && extractedContent.content);
    if (!hasContent) {
      actionsUI.setReanalyzingState(t("loadingContent"));
      hideMessages();
      hideWarning();

      try {
        await extractPageContent(refreshSeq, pinnedTabId);
      } catch (err) {
        console.error("[NutEgg] Error extracting content on re-analyze:", err);
      }

      if (activeTabId !== pinnedTabId) return;

      const nowHasContent = !!(extractedContent && extractedContent.content);
      if (!nowHasContent) {
        updateAnalyzeButtonsState();
        showError(t("couldNotRetrieveContent"));
        bannersUI.errorBanner.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
        return;
      }
    }

    if (activeTabId !== pinnedTabId) return;

    const notReady = getAnalyzeNotReadyReason();
    if (notReady) {
      showWarning(notReady);
      return;
    }
    handleAnalyze(true, null, true);
  });
  actionsUI.historySelect.addEventListener("change", () => {
    const idx = parseInt(actionsUI.historySelect.value, 10);
    if (captureHistory[idx]) showHistoryEntry(captureHistory[idx]);
  });

  // The side panel persists across tabs — refresh content when the user
  // switches to another tab or the active tab navigates to a new URL.
  function getActiveTabSnapshot() {
    return {
      extractedContent,
      analysisResult,
      captureHistory,
      currentNutId,
      stage1Payload,
      stage1ContentAnalysis,
      eggHatched,
      nutCollected,
      cachedProcessedSaved,
      followUpQa,
      selectedEggs,
      preSelectedEggs,
      customQuestions: captureUI.getCustomQuestions(),
      activeEggTab,
      analysisMode,
    };
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
    activeTabId = tabId;
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
      if (tab?.id != null && tab.id !== activeTabId) {
        const { targetState } = tabStateManager.switchActiveTab(tab.id, getActiveTabSnapshot());
        activeTabId = tab.id;
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
        currentTabLoading = true;
        updateAnalyzeButtonsState();
      }
      return;
    }

    // Page finished loading:
    if (changeInfo.status === "complete") {
      if (isActiveTab) {
        currentTabLoading = false;
        if (!extractedContent || lastLoadWasLoading || extractionFailed) {
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
      const currentVal = enabledSections[key] !== false;
      const activeCount = Object.values(enabledSections).filter(Boolean).length;
      if (currentVal && activeCount <= 1) {
        showWarning(t("atLeastOneSection"));
        return;
      }
      enabledSections[key] = !currentVal;
      updateSectionChipsUI();
      try {
        await chrome.storage?.local?.set?.({ enabledSections: { ...enabledSections } });
      } catch {}

      // If results are currently showing, update sections visibility dynamically
      if (analysisResult) {
        showResultsState(analysisResult, provenanceFromExtraction(extractedContent));
      }
    },
  });
  updateSectionChipsUI();
}

/** Update chip visual states (active vs inactive) and active count badges */
function updateSectionChipsUI() {
  sectionsUI.updateUI(enabledSections);
}

let refreshSeq = 0;

/**
 * Re-run the capture flow for the currently active tab: reset state, check if
 * content has been captured before, and retrieve fresh content if needed.
 * `refreshSeq` guards against interleaved refreshes on rapid tab switches.
 */
async function refreshForCurrentTab(forceExtract = false) {
  const seq = ++refreshSeq;
  captureUI.setCustomQuestions("");
  qaUI.clearFollowup();
  preSelectedEggs.clear();
  updateCaptureEggsLabel();
  isReanalyzing = false;
  actionsUI.hideProcessedNote();
  actionsUI.renderHistory([]);
  captureHistory = []; // fresh URL — old history doesn't apply
  extractedContent = null;
  analysisResult = null;
  currentNutId = null;
  stage1Payload = null;
  stage1ContentAnalysis = null;
  eggHatched = false;
  nutCollected = false;
  cachedProcessedSaved = null;
  followUpQa = [];
  activeEggTab = null;
  selectedEggs.clear();
  captureUI.setLoading(t("loadingContent"));
  currentTabLoading = false;
  updateAnalyzeButtonsState();
  showCaptureState();

  let tabUrl = "";
  let targetTabId = activeTabId;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id != null) {
      activeTabId = tab.id;
      targetTabId = tab.id;
      tabStateManager.setActiveTabId(tab.id);
      if (forceExtract) {
        tabStateManager.invalidateTab(tab.id);
      }
    }
    if (tab?.status === "loading") currentTabLoading = true;
    if (tab?.url) {
      tabUrl = tab.url;
      captureUI.setPageInfo({
        title: tab.title || t("loading"),
        url: tab.url,
        sourceType: detectPageTypeFromUrl(tab.url),
      });
    }
  } catch {}

  updateAnalyzeButtonsState();

  if (seq !== refreshSeq) return;

  await checkServerStatus();
  if (seq !== refreshSeq) return;

  // Kick off server tasks in parallel immediately without waiting for content extraction
  const serverTasks = serverOnline
    ? Promise.all([
        checkConfigStatus(),
        fetchMetrics(),
        fetchEggs(),
      ])
    : null;

  // Check if this URL has been captured before — skip content retrieval if so!
  if (!forceExtract && serverOnline && tabUrl) {
    const captured = await loadHistoryIfAny(seq, tabUrl);
    if (seq !== refreshSeq) return;
    if (captured) {
      if (serverTasks) await serverTasks;
      updateAnalyzeButtonsState();
      return;
    }
  }

  // Not captured before (or force-refresh requested) — show capture state and retrieve content
  showCaptureState();
  await extractPageContent(seq, targetTabId || activeTabId);
  if (seq !== refreshSeq) return;

  if (serverOnline) {
    if (serverTasks) await serverTasks;
    if (seq !== refreshSeq) return;
    updateAnalyzeButtonsState();
    // Fallback: check if the canonical/cleaned extracted URL has history
    if (extractedContent?.url && extractedContent.url !== tabUrl) {
      await loadHistoryIfAny(seq, extractedContent.url);
    }
  }
}

/**
 * Restore the UI from a cached tab result (extraction + analysis).
 * Called when the user switches back to a tab that was previously analyzed or in-flight.
 */
async function restoreFromTabCache(tabId, cached) {
  const seq = ++refreshSeq;
  activeTabId = tabId;
  const restored = tabStateManager.restoreTabState(tabId) || cached;
  extractedContent = restored.extractedContent || null;
  analysisResult = restored.analysisResult || null;
  captureHistory = restored.captureHistory || [];
  currentNutId = restored.currentNutId || (restored.captureHistory?.[0]?.nutId ?? null);
  stage1Payload = restored.stage1Payload || null;
  stage1ContentAnalysis = restored.stage1ContentAnalysis || null;
  followUpQa = restored.followUpQa ? [...restored.followUpQa] : [];
  eggHatched = !!restored.eggHatched;
  nutCollected = !!restored.nutCollected;
  cachedProcessedSaved = restored.cachedProcessedSaved || null;
  selectedEggs = restored.selectedEggs instanceof Set ? restored.selectedEggs : new Set(restored.selectedEggs || []);
  preSelectedEggs = restored.preSelectedEggs instanceof Set ? restored.preSelectedEggs : new Set(restored.preSelectedEggs || []);
  updateCaptureEggsLabel();
  captureUI.setCustomQuestions(restored.customQuestions || "");
  qaUI.clearFollowup();
  currentTabLoading = false;

  if (restored.analysisMode && typeof setAnalysisMode === "function") {
    setAnalysisMode(restored.analysisMode);
  }

  // Update header and capture preview so capture state is ready if user switches back
  if (extractedContent) {
    captureUI.setContent(extractedContent);
    showProvenance(extractedContent.metadata || {});
  } else {
    captureUI.clear();
  }

  if (cached.status === "error" || cached.error) {
    if (analysisResult) {
      showResultsState(analysisResult, provenanceFromExtraction(extractedContent));
    } else {
      showCaptureState();
      if (extractedContent) {
        captureUI.setPreviewText(extractedContent.content || t("noContentExtracted"));
      }
    }
    showError(cached.error, cached.errorCode);
    updateAnalyzeButtonsState();
  } else if (cached.status === "analyzing") {
    if (cached.analysisResult) {
      // Re-analysis in flight: keep showing results view with analyzing indicator
      showResultsState(cached.analysisResult, provenanceFromExtraction(extractedContent));
      actionsUI.setReanalyzingState(t("analyzing"));
      actionsUI.setHistorySelectDisabled(true);
      actionsUI.setAnalyzeButtonLoading(true, t("analyzing"));
      actionsUI.showProcessedNote(t("analyzingContent"));
    } else {
      showCaptureState();
      if (extractedContent) {
        captureUI.setPreviewText(extractedContent.content || t("noContentExtracted"));
      }
      actionsUI.setAnalyzeButtonLoading(true, t("analyzing"));
    }
  } else if (cached.status === "hatching") {
    if (analysisResult) {
      showResultsState(analysisResult, provenanceFromExtraction(extractedContent));
    }
    actionsUI.updateStage1ProceedBtn({ isProceeding: true, autoSave: true });
    actionsUI.setReanalyzingState(t("comparingKnowledge"));
    actionsUI.setHistorySelectDisabled(true);
    actionsUI.setAnalyzeButtonLoading(true, t("analyzing"));
    if (analysisMode === "fast") {
      verdictUI.setComparing();
    }
  } else if (analysisResult) {
    eggHatched = !!cached.eggHatched;
    nutCollected = !!cached.nutCollected;
    showResultsState(analysisResult, provenanceFromExtraction(extractedContent));
    updateAnalyzeButtonsState();
    actionsUI.setHistorySelectDisabled(false);
    updateActionButtons();
    if (analysisResult.stage === "stage1" && analysisMode === "confirm") {
      actionsUI.showStage1Confirm();
      verdictUI.hide();
      updateStage1ProceedBtn();
    }
    if (captureHistory.length > 0) {
      const entry = (currentNutId != null && captureHistory.find((h) => String(h.nutId) === String(currentNutId))) || captureHistory[0];
      const when = new Date(entry.capturedAt).toLocaleString();
      const stateLabel = entry.saved === "saved"
        ? t("stateSaved") : entry.saved === "skip" ? t("stateCollected") : t("stateAnalyzed");
      if (cached.justReanalyzed) {
        actionsUI.showProcessedNote(t("reanalyzedFreshResult"));
        delete cached.justReanalyzed;
      } else {
        actionsUI.showProcessedNote(t("capturedWhenStored", { when, state: stateLabel }));
      }
      renderHistorySelect(currentNutId);
    }
  } else {
    showCaptureState();
    updateAnalyzeButtonsState();
  }

  // Refresh server status and eggs without resetting content
  await checkServerStatus();
  if (serverOnline) {
    await fetchEggs();
  }
}

/** 🔄 Refresh button — cancels any in-flight retrieval on current tab and starts fresh. */
async function handleRefresh() {
  await refreshForCurrentTab(true);
}

/** 🐣 Create an egg from the no-match form, then re-analyze against it. */
async function handleCreateEgg() {
  const pinnedTabId = activeTabId;
  const { name, desc } = eggsUI.getNewEggInput();
  if (!name || eggsUI.createEggBtn?.disabled) return;
  eggsUI.setCreateButtonLoading(true);
  try {
    const response = await chrome.runtime.sendMessage({
      action: "create-egg",
      name,
      description: desc,
    });
    if (response?.success) {
      if (activeTabId !== pinnedTabId) return;
      // Target the newly created egg explicitly
      const eggFile = response.path ? response.path.split("/").pop() : slugify(name) + ".md";
      await handleAnalyze(true, [eggFile]);
      return;
    }
    if (activeTabId === pinnedTabId) {
      showError(response?.error || t("failedToCreateEgg"));
    }
  } catch (err) {
    if (activeTabId === pinnedTabId) {
      showError(err instanceof Error ? err.message : t("failedToCreateEgg"));
    }
  }
  if (activeTabId === pinnedTabId) {
    eggsUI.setCreateButtonLoading(false);
  }
}

/** 🐣 Create an egg from the inline form inside the egg picker. */
async function handleCreateEggInline() {
  const pinnedTabId = activeTabId;
  const { name, desc } = eggsUI.getNewEggInput();
  if (!name || eggsUI.eggsCreateBtn?.disabled) return;
  eggsUI.setCreateButtonLoading(true);
  try {
    const response = await chrome.runtime.sendMessage({
      action: "create-egg",
      name,
      description: desc,
    });
    if (response?.success) {
      if (activeTabId !== pinnedTabId) return;
      // Re-analyze with the new egg included
      await handleAnalyze(true);
      return;
    }
    if (activeTabId === pinnedTabId) {
      eggsUI.showError(`❌ ${response?.error || t("failedToCreateEgg")}`);
    }
  } catch (err) {
    if (activeTabId === pinnedTabId) {
      eggsUI.showError(`❌ ${err instanceof Error ? err.message : t("failedToCreateEgg")}`);
    }
  }
  if (activeTabId === pinnedTabId) {
    eggsUI.setCreateButtonLoading(false);
  }
}

/** Title → snake_case egg name fallback (supports Unicode). */
function slugify(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

/** Load the full egg list from _index.md for the manual picker. */
async function fetchEggs() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "get-eggs" });
    allEggs = response?.eggs || [];
  } catch {
    allEggs = [];
  }
  renderCaptureEggsList();
}

/** Render target egg checklist on the capture screen (State 1). */
function renderCaptureEggsList() {
  const fn = globalThis.NutEggUI?.renderCaptureEggsList || globalThis.renderCaptureEggsList;
  if (fn) {
    fn({
      captureEggsList: eggsUI.captureEggsList,
      captureEggsToggle: eggsUI.captureEggsToggle,
      captureEggsLabel: eggsUI.captureEggsLabel,
      allEggs,
      preSelectedEggs,
      updateLabel: updateCaptureEggsLabel,
    });
  }
}

function updateCaptureEggsLabel() {
  const fn = globalThis.NutEggUI?.updateCaptureEggsLabel || globalThis.updateCaptureEggsLabel;
  if (fn) {
    fn({
      captureEggsLabel: eggsUI.captureEggsLabel,
      preSelectedEggs,
    });
  }
}

/**
 * Render the egg picker: the matched eggs are checked; changing any box
 * reveals the "Re-analyze with selected eggs" button.
 */
function renderEggsSection(matchedEggs) {
  const fn = globalThis.NutEggUI?.renderEggsSection || globalThis.renderEggsSection;
  if (fn) {
    fn(matchedEggs, {
      allEggs,
      selectedEggs,
      eggsSection: eggsUI.eggsSection,
      eggsList: eggsUI.eggsList,
      eggsExpanded: eggsUI.eggsExpanded,
      eggsToggleChevron: eggsUI.eggsToggleChevron,
      eggsErrorEl: eggsUI.eggsErrorEl,
      eggsToggleLabel: eggsUI.eggsToggleLabel,
      reanalyzeEggsBtn: eggsUI.reanalyzeEggsBtn,
      eggsCreateForm: eggsUI.eggsCreateForm,
      onSelectChange: () => updateStage1ProceedBtn(),
    });
  }

  // Reset inline create-egg form
  eggsUI.resetCreateForm();
}


function setAnalysisMode(mode) {
  analysisMode = mode;
  actionsUI.setMode(mode);
  chrome.storage?.local?.set?.({ analysisMode: mode });

  if (analysisResult?.stage === "stage1") {
    if (mode === "confirm") {
      actionsUI.showStage1Confirm();
      verdictUI.hide();
      eggsUI.setKnowledgeVisible(false);
      eggsUI.expandEggsList(true);
      updateStage1ProceedBtn();
      window.scrollTo(0, 0);
    } else {
      actionsUI.hideStage1Confirm();
      verdictUI.show();
    }
  }
}

function updateStage1ProceedBtn() {
  actionsUI.updateStage1ProceedBtn({
    selectedCount: selectedEggs.size,
    totalEggsCount: allEggs.length,
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
  const targetPinnedId = pinnedTabId || activeTabId;
  const isPinnedActive = activeTabId === targetPinnedId;

  const isExplicitEggs = Array.isArray(eggsToCompare);
  const targetEggs = isExplicitEggs ? eggsToCompare : [...selectedEggs];
  if (!isExplicitEggs && targetEggs.length === 0) {
    if (isPinnedActive) {
      eggsUI.expandEggsList(true);
      if (eggsUI.eggsSection) eggsUI.eggsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
      showWarning(t("selectEggWarning"));
    }
    return;
  }

  if (isPinnedActive) {
    actionsUI.updateStage1ProceedBtn({ isProceeding: true, autoSave });
    hideMessages();
  }

  try {
    const cached = targetPinnedId ? tabResultCache.get(targetPinnedId) : null;
    const base = basePayload || stage1Payload || cached?.stage1Payload;
    const content = contentForProvenance || extractedContent || cached?.extractedContent;
    const analysis = contentAnalysis || stage1ContentAnalysis || cached?.stage1ContentAnalysis || analysisResult;

    if (targetPinnedId) {
      const existing = tabResultCache.get(targetPinnedId) || {};
      tabResultCache.set(targetPinnedId, {
        ...existing,
        status: "hatching",
        stage1Payload: base,
        stage1ContentAnalysis: analysis,
      });
      if (isPinnedActive) {
        updateAnalyzeButtonsState();
      }
    }

    const url = base?.url || content?.url || captureUI.getPageUrl() || "";
    const title = base?.title || content?.title || captureUI.getPageTitle() || "";
    const bodyContent = base?.content || content?.content || "";
    const sourceType = base?.sourceType || content?.sourceType || "generic";
    const metadata = base?.metadata || content?.metadata;
    const chapters = base?.chapters || content?.chapters;
    const questions = base?.questions || captureUI.getParsedQuestions();

    const payload = {
      ...(base || {}),
      url,
      title,
      content: bodyContent,
      sourceType,
      metadata,
      chapters,
      questions,
      stage: 2,
      eggs: targetEggs,
      outputLanguage,
      nutId: base?.nutId || currentNutId || undefined,
      contentAnalysis: analysis || {
        titleVerdict: title,
        coreSummary: [],
        isLongForm: false,
        chapterMap: [],
        mindMap: [],
        customQuestionAnswers: [],
      },
    };

    const response = await sendAnalyzeViaPort(payload);
    if (response?.error) {
      if (targetPinnedId) {
        tabStateManager.setError(targetPinnedId, response.error, response.errorCode);
      }
      if (activeTabId === targetPinnedId) {
        showError(response.error, response.errorCode);
        updateStage1ProceedBtn();
        if (analysisMode === "confirm") {
          verdictUI.hide();
          actionsUI.showStage1Confirm();
        }
        updateAnalyzeButtonsState();
      }
      return;
    }

    response.stage = "stage2";
    const newNutId = response.nutId || null;

    if (autoSave) {
      await doSave(
        response.newKnowledge || [],
        true,
        content,
        response,
        newNutId,
        targetPinnedId
      );
    }

    let freshHistory = null;
    if (payload.url && serverOnline) {
      try {
        const histResp = await chrome.runtime.sendMessage({
          action: "history",
          url: payload.url,
        });
        if (histResp?.history?.length) {
          freshHistory = histResp.history;
        }
      } catch {
        // Fall back to constructed entry
      }
    }

    const newHistoryEntry = newNutId
      ? {
          nutId: newNutId,
          capturedAt: new Date().toISOString(),
          saved: (autoSave || (response.newKnowledge && response.newKnowledge.length > 0)) ? "saved" : "analyzed",
          result: response,
          url: payload.url || content?.url || "",
          title: payload.title || content?.title || "",
          content: payload.content || content?.content || "",
          sourceType: payload.sourceType || content?.sourceType || "webpage",
          author: payload.metadata?.author || "",
          publishedAt: payload.metadata?.published || "",
        }
      : null;

    if (targetPinnedId) {
      const existing = tabResultCache.get(targetPinnedId) || {};
      const updatedHistory = freshHistory || (newHistoryEntry
        ? [newHistoryEntry, ...(existing.captureHistory || [])]
        : existing.captureHistory || []);
      tabResultCache.set(targetPinnedId, {
        ...existing,
        status: "done",
        url: payload.url,
        extractedContent: contentForProvenance || existing.extractedContent || extractedContent,
        analysisResult: response,
        stage1Payload: base,
        stage1ContentAnalysis: analysis,
        eggHatched: autoSave ? true : (existing.eggHatched || false),
        nutCollected: autoSave ? true : (existing.nutCollected || false),
        currentNutId: newNutId || existing.currentNutId,
        captureHistory: updatedHistory,
        justReanalyzed: isReanalyzing || existing.isReanalyzing,
      });
    }

    // Only update active UI if the user is currently looking at the analyzed tab
    if (activeTabId !== targetPinnedId) {
      return;
    }

    if (newNutId) {
      currentNutId = newNutId;
      cachedProcessedSaved = null;
      captureHistory = freshHistory || (newHistoryEntry ? [newHistoryEntry, ...captureHistory] : captureHistory);
    } else if (freshHistory) {
      captureHistory = freshHistory;
    }

    showResultsState(response, provenanceFromExtraction(contentForProvenance));
    if (autoSave) {
      eggHatched = true;
      nutCollected = true;
      updateActionButtons();
      fetchMetrics();
    }
    if (captureHistory.length > 0) {
      renderHistorySelect(currentNutId);
      if (isReanalyzing) {
        actionsUI.showProcessedNote(t("reanalyzedFreshResult"));
      }
    }
    if (!skipScroll) {
      setTimeout(() => {
        const target = eggsUI.eggKnowledgeSection && !eggsUI.eggKnowledgeSection.classList.contains("hidden")
          ? eggsUI.eggKnowledgeSection
          : verdictUI.verdictSection;
        if (target && !target.classList.contains("hidden")) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : t("hatchingFailed");
    if (targetPinnedId) {
      tabStateManager.setError(targetPinnedId, errorMsg);
    }
    if (activeTabId === targetPinnedId) {
      showError(err instanceof Error ? err.message : t("hatchingFailed"));
      updateStage1ProceedBtn();
      if (analysisMode === "confirm") {
        verdictUI.hide();
        actionsUI.showStage1Confirm();
      }
      updateAnalyzeButtonsState();
    }
  }
}

// --- Metrics ---

function applyMetrics(data) {
  metricsUI.render(data);
}

async function fetchMetrics() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "metrics" });
    if (response && (response.nuts != null || response.eggs != null)) {
      applyMetrics(response);
      chrome.storage?.local?.set?.({ cachedMetrics: response });
    }
  } catch {
    // server may not support /metrics yet
  }
}

// --- Config & Credit status ---

let obsidianPluginVersion = null;

function updateVersionDisplay(pluginVersion) {
  headerUI.updateVersion(null, pluginVersion);
}

function getVersionMismatchIssue(pluginVersion) {
  const extVersion = chrome.runtime?.getManifest?.()?.version;
  if (pluginVersion && extVersion && pluginVersion !== extVersion) {
    return t("versionMismatchFull", { extVersion, pluginVersion });
  }
  return null;
}

async function checkConfigStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "config-status" });
    if (response?.version) {
      obsidianPluginVersion = response.version;
      updateVersionDisplay(obsidianPluginVersion);
    }

    const issues = Array.isArray(response?.issues) ? [...response.issues] : [];
    const mismatch = getVersionMismatchIssue(response?.version || obsidianPluginVersion);
    if (mismatch && !issues.some((i) => i.includes("Version mismatch"))) {
      issues.unshift(mismatch);
    }

    if (issues.length > 0) {
      showWarning(issues.join(" • "));
    } else {
      hideWarning();
    }
    if (response?.credit) {
      renderCreditPill(response.credit);
    }
  } catch {
    // handled by server status dot
  }
}

async function checkCreditStatus() {
  if (!serverOnline) {
    headerUI.hideCredit();
    return;
  }
  try {
    const credit = await chrome.runtime.sendMessage({ action: "get-credit" });
    renderCreditPill(credit);
  } catch {
    headerUI.hideCredit();
  }
}

function renderCreditPill(credit) {
  headerUI.renderCredit(credit, serverOnline);
}

// --- Server check ---

async function checkServerStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "check-server" });
    serverOnline = response?.online || false;
    obsidianPluginVersion = response?.version || null;
  } catch {
    serverOnline = false;
    obsidianPluginVersion = null;
  }

  updateVersionDisplay(obsidianPluginVersion);

  if (serverOnline) {
    // Check Obsidian AI config status
    try {
      const config = await chrome.runtime.sendMessage({ action: "config-status" });
      const issues = config?.issues || [];
      obsidianAiConfigured = !issues.some((i) =>
        i.toLowerCase().includes("no api key") ||
        i.toLowerCase().includes("not configured")
      );
    } catch {
      obsidianAiConfigured = true;
    }

    checkCreditStatus();
    metricsUI.showPluginLink(false);

    const mismatch = getVersionMismatchIssue(obsidianPluginVersion);
    if (mismatch) {
      showWarning(mismatch);
    } else {
      updateServerStatusIndicator();
    }
  } else {
    // Check Chrome AI config status
    try {
      const chromeAi = await chrome.runtime.sendMessage({ action: "check-chrome-ai" });
      chromeAiEnabled = chromeAi?.enabled || false;
      chromeAiConfigured = chromeAi?.configured || false;
      chromeAiProvider = chromeAi?.provider || "";
      chromeAiModel = chromeAi?.model || "";
    } catch {
      chromeAiEnabled = false;
      chromeAiConfigured = false;
    }

    if (chromeAiConfigured) {
      checkChromeCreditStatus();
    } else {
      headerUI.hideCredit();
    }

    metricsUI.showPluginLink(true);
    updateServerStatusIndicator();
  }

  updateCaptureBanners();
  updateAnalyzeButtonsState();
}

async function checkChromeCreditStatus() {
  try {
    const credit = await chrome.runtime.sendMessage({ action: "check-chrome-credit" });
    if (credit && !serverOnline) {
      credit.isChromeAi = true;
      headerUI.renderCredit(credit, false);
    }
  } catch {}
}

function updateCaptureBanners() {
  bannersUI.updateCaptureBanners({ serverOnline, chromeAiConfigured, chromeAiEnabled });
}

function updateServerStatusIndicator() {
  if (serverOnline) {
    const mismatch = getVersionMismatchIssue(obsidianPluginVersion);
    if (mismatch) {
      updateServerStatusTooltip("obsidian-mismatch", obsidianPluginVersion, mismatch);
    } else if (!obsidianAiConfigured) {
      updateServerStatusTooltip("obsidian-no-key", obsidianPluginVersion);
    } else {
      updateServerStatusTooltip("obsidian-online", obsidianPluginVersion);
    }
    return;
  }

  // Obsidian offline
  if (chromeAiConfigured) {
    updateServerStatusTooltip("chrome-ai", null, chromeAiProvider);
  } else if (chromeAiEnabled) {
    updateServerStatusTooltip("chrome-no-key", null, chromeAiProvider);
  } else {
    updateServerStatusTooltip("offline");
  }
}

function updateServerStatusTooltip(state, version = null, extra = null) {
  headerUI.updateServerStatus(state, version, extra);
}

// --- Button Readiness & State ---

/**
 * YouTube without a transcript: analysis would rely on the description only,
 * which produces misleading answers — warn and refuse to process.
 */
function isTranscriptBlocked() {
  return !!extractedContent &&
    extractedContent.sourceType === "youtube" &&
    extractedContent.transcriptAvailable === false;
}

function applyTranscriptBlock() {
  if (!isTranscriptBlocked()) return;
  updateAnalyzeButtonsState();
  showWarning(t("transcriptBlockedWarning"));
}

/** Returns a non-null string prompt if the page or content is not ready for analysis. */
function getAnalyzeNotReadyReason() {
  if (currentTabLoading) {
    return t("pageStillLoading");
  }
  if (extractionPending) {
    return t("retrievingContentWait");
  }
  if (!extractedContent || !extractedContent.content) {
    return t("pageOrContentNotReady");
  }
  if (isTranscriptBlocked()) {
    return t("transcriptUnavailableAnalyze");
  }
  if (!serverOnline) {
    if (!chromeAiEnabled) {
      return t("obsidianOfflineStart");
    }
    if (!chromeAiConfigured) {
      return t("chromeAiNoKeyConfig");
    }
  }
  return null;
}

/** Updates analyze and re-analyze buttons' active / inactive visual state and labels. */
function updateAnalyzeButtonsState() {
  const isAnalyzing = tabStateManager.isAnalyzing(activeTabId);
  const notReady = getAnalyzeNotReadyReason();
  const hasContent = !!(extractedContent && extractedContent.content);

  actionsUI.updateAnalyzeState({
    isAnalyzing,
    notReadyReason: notReady,
    isTranscriptBlocked: isTranscriptBlocked(),
    currentTabLoading,
    extractionPending,
    hasContent,
    hasAnalysisResult: Boolean(analysisResult),
  });
}

// --- Content extraction ---

/** True when extraction ran against a still-loading page (retry on complete). */
let lastLoadWasLoading = false;
/** True when extraction failed (restricted page, mid-load injection, ...). */
let extractionFailed = false;
/** True while an extraction attempt is in flight — the refresh button no-ops. */
let extractionPending = false;

/**
 * Extract content from the active tab (or background tab when loaded).
 * Uses per-tab sequence numbers so background extractions finish and cache
 * cleanly without clobbering or being aborted by tab switches.
 */
async function extractPageContent(seq = refreshSeq, targetTabId = null) {
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
    const currentActiveId = activeTabId;
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
    if (!targetTabId || targetTabId === activeTabId) captureUI.setPageInfo({ title: t("unknownPage") });
    return null;
  }

  const isBackground = tabId !== activeTabId;
  const isTargetActive = !isBackground;

  // For background tabs: ONLY extract if content is already loaded!
  if (isBackground && tabStatus !== "complete") {
    return null;
  }

  const tabSeq = tabStateManager.nextExtractSeq(tabId);
  tabStateManager.setExtracting(tabId, true);

  if (isTargetActive) {
    extractionFailed = false;
    lastLoadWasLoading = false;
    extractionPending = true;
    captureUI.setRefreshDisabled(false); // Always clickable to cancel and retry!
    captureUI.setLoading(t("retrievingPageContent"));
    captureUI.setPageInfo({
      title: tabTitle || t("retrieving"),
      url: tabUrl || "",
      sourceType: detectPageTypeFromUrl(tabUrl || ""),
    });
    updateAnalyzeButtonsState();
  }

  try {
    // If active tab is still loading, wait for it to complete or settle
    if (tabStatus === "loading" && isTargetActive) {
      lastLoadWasLoading = true;
      currentTabLoading = true;
      updateAnalyzeButtonsState();
      await waitForTabComplete(tabId, 6000);
      if (tabExtractSeq.get(tabId) !== tabSeq) return null;
      try {
        const refreshedTab = await chrome.tabs.get(tabId);
        tabTitle = refreshedTab.title || tabTitle;
        tabUrl = refreshedTab.url || tabUrl;
        if (activeTabId === tabId) {
          captureUI.setPageInfo({
            title: tabTitle || captureUI.getPageTitle(),
            url: tabUrl || captureUI.getPageUrl(),
          });
        }
      } catch {}
      await waitForPageSettle(tabId, tabSeq);
      if (tabExtractSeq.get(tabId) !== tabSeq) return null;
    }

    // Extract content (loaded pages jump straight here for instant retrieval)
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await tryExtract(tabId);
      if (tabExtractSeq.get(tabId) !== tabSeq) return null;

      if (!response?.success) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 400));
          if (tabExtractSeq.get(tabId) !== tabSeq) return null;
          continue;
        }
        if (activeTabId === tabId) extractionFailed = true;
        break;
      }

      const after = await requestPageIdentity(tabId);
      if (tabExtractSeq.get(tabId) !== tabSeq) return null;
      if (
        after?.url &&
        response.content?.url &&
        after.url !== response.content.url
      ) {
        console.warn("[NutEgg] Page navigated during extraction — retrying");
        continue;
      }

      // Cache extracted content for the tab
      const cached = tabResultCache.get(tabId) || {};
      tabResultCache.set(tabId, {
        ...cached,
        url: response.content?.url || tabUrl || cached.url,
        extractedContent: response.content,
      });

      // Update UI only if this tab is currently the active tab
      if (activeTabId === tabId) {
        extractedContent = response.content;
        currentTabLoading = false;
        captureUI.setPageInfo({
          title: response.content.title || tabTitle || "Untitled",
          sourceType: response.content.sourceType || captureUI.getPageType(),
        });
        captureUI.setPreviewText(response.content.content || "(No content extracted)");
        showProvenance(response.content.metadata || {});
        applyTranscriptBlock();
        updateAnalyzeButtonsState();
      }

      return response.content;
    }
  } catch (err) {
    if (activeTabId === tabId) {
      console.error("[NutEgg] Extraction error:", err);
      extractionFailed = true;
    }
  } finally {
    tabStateManager.setExtracting(tabId, false);
    if (activeTabId === tabId && tabStateManager.isExtractSeqCurrent(tabId, tabSeq)) {
      extractionPending = false;
      captureUI.setRefreshDisabled(false);
      updateAnalyzeButtonsState();
    }
  }

  if (activeTabId === tabId && tabStateManager.isExtractSeqCurrent(tabId, tabSeq)) {
    if (extractionFailed && !extractedContent) {
      captureUI.setError(t("couldNotExtractContent"));
      showWarning(t("couldNotExtractRestricted"));
    }
    applyTranscriptBlock();
    updateAnalyzeButtonsState();
  }
  return null;
}

/** Safe promise timeout wrapper. */
function withTimeout(promise, ms, fallback = null) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Wait for a tab to finish loading (status === "complete").
 * Works for both active and background tabs via chrome.tabs.onUpdated.
 */
async function waitForTabComplete(tabId, timeoutMs = 8000) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === "complete") return true;
  } catch {
    return false;
  }

  return new Promise((resolve) => {
    let timer;
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve(true);
      }
    };
    timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(false);
    }, timeoutMs);
    chrome.tabs.onUpdated.addListener(listener);
  });
}

/**
 * Extract via the content script, injecting it first when needed.
 * Returns the message response or null (restricted page / unreachable).
 */
async function tryExtract(tabId) {
  try {
    const response = await withTimeout(
      chrome.tabs.sendMessage(tabId, { action: "extract-content" }),
      8000,
      null
    );
    if (response?.success) return response;
  } catch {
    // Content script not injected yet (page mid-load, or never injected)
  }
  try {
    await withTimeout(
      chrome.scripting.executeScript({
        target: { tabId },
        files: [
          "src/content/utils.js",
          "src/content/extractors/youtube.js",
          "src/content/extractors/twitter.js",
          "src/content/extractors/article.js",
          "src/content/extractors/generic.js",
          "src/content/content-script.js",
        ],
      }),
      4000,
      null
    );
  } catch {
    return null; // Restricted page (chrome://, Web Store, PDF viewer)
  }
  try {
    return await withTimeout(
      chrome.tabs.sendMessage(tabId, { action: "extract-content" }),
      8000,
      null
    );
  } catch {
    return null;
  }
}

/** Cheap page-state check (no transcript fetching). Null when unreachable. */
async function requestPageIdentity(tabId) {
  try {
    const resp = await withTimeout(
      chrome.tabs.sendMessage(tabId, { action: "page-identity" }),
      2500,
      null
    );
    if (resp?.success) return resp;
  } catch {}
  try {
    await withTimeout(
      chrome.scripting.executeScript({
        target: { tabId },
        files: [
          "src/content/utils.js",
          "src/content/extractors/youtube.js",
          "src/content/extractors/twitter.js",
          "src/content/extractors/article.js",
          "src/content/extractors/generic.js",
          "src/content/content-script.js",
        ],
      }),
      3000,
      null
    );
    const resp = await withTimeout(
      chrome.tabs.sendMessage(tabId, { action: "page-identity" }),
      2500,
      null
    );
    return resp?.success ? resp : null;
  } catch {
    return null;
  }
}

/**
 * Poll page-identity until the page settles (document complete, and for
 * YouTube the watch shell rendered), bounded to ~8s. Returns null when the
 * content script is unreachable — extraction proceeds and reports failure itself.
 */
async function waitForPageSettle(tabId, seq) {
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    if (tabExtractSeq.get(tabId) !== seq) return null;
    const identity = await requestPageIdentity(tabId);
    if (
      identity &&
      identity.readyState === "complete" &&
      identity.youtubeReady !== false &&
      identity.twitterReady !== false
    ) {
      if (tabId === activeTabId) {
        currentTabLoading = false;
      }
      return identity;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return null; // timed out — extract anyway (the failure path will report)
}

function detectPageTypeFromUrl(url) {
  if (url.includes("twitter.com") || url.includes("x.com")) return "🐦 Twitter/X";
  if (url.includes("youtube.com/watch")) return "📺 YouTube";
  if (url.includes("youtube.com")) return "📺 YouTube";
  return "🌐 Webpage";
}

/** Show the author + published date extracted from the page itself. */
function showProvenance(metadata) {
  captureUI.showProvenance(metadata);
}

/** ISO/date string → short locale date (e.g. "Aug 10, 2026"); raw on failure. */
function formatPublishedDate(raw) {
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Provenance of the extracted page (fresh analyses). */
function provenanceFromExtraction(content = extractedContent) {
  if (!content) return null;
  const m = content.metadata || {};
  return {
    title: content.title || "",
    author: m.author || m.channel || m.handle || "",
    publishedAt: m.published || "",
  };
}

/** Title/author/publish-time card at the top of the results view. */
function renderResultProvenance(prov) {
  resultsUI.renderProvenance(prov);
}

// --- Analyze ---

/**
 * Send an analyze request via a long-lived port connection instead of a
 * one-shot `sendMessage`. The open port prevents Chrome from terminating
 * the service worker during extended LLM calls (>30s).
 */
function sendAnalyzeViaPort(payload) {
  return new Promise((resolve, reject) => {
    try {
      let settled = false;
      const port = chrome.runtime.connect({ name: "nutegg-analyze" });
      const heartbeat = setInterval(() => {
        if (!settled && port) {
          try {
            port.postMessage({ action: "ping" });
          } catch {
            clearInterval(heartbeat);
          }
        } else {
          clearInterval(heartbeat);
        }
      }, 10000);

      port.onMessage.addListener((response) => {
        if (settled) return;
        settled = true;
        clearInterval(heartbeat);
        try { port.disconnect(); } catch {}
        resolve(response);
      });
      port.onDisconnect.addListener(() => {
        if (settled) return;
        settled = true;
        clearInterval(heartbeat);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          reject(new Error("Connection closed before response received"));
        }
      });
      port.postMessage({ action: "analyze", payload });
    } catch (err) {
      reject(err);
    }
  });
}

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

  const pinnedTabId = activeTabId;
  const contentToAnalyze = extractedContent;

  if (!contentToAnalyze || !contentToAnalyze.content) {
    const msg = "The page is still loading or content is not ready yet. Please wait until it finishes loading.";
    showWarning(msg);
    return msg;
  }

  if (isTranscriptBlocked()) {
    applyTranscriptBlock();
    return "Video transcript unavailable — NutEgg will not process this video.";
  }

  isReanalyzing = isReanalyze;
  if (activeTabId === pinnedTabId) {
    hideMessages();
    if (isReanalyze) {
      actionsUI.showProcessedNote(t("analyzingContent"));
      actionsUI.setReanalyzingState(t("analyzing"));
    }
    actionsUI.setHistorySelectDisabled(true);
    actionsUI.setAnalyzeButtonLoading(true, t("analyzing"));
  }

  try {
    const questions = captureUI.getParsedQuestions();

    // Check which eggs are selected on the page or pre-selected
    let targetEggs;
    if (isReanalyze) {
      // In re-analyze mode, do not auto-select eggs: strictly preserve the user's explicit selection
      targetEggs = eggsOverride !== null && eggsOverride !== undefined
        ? eggsOverride
        : [...selectedEggs];
    } else {
      targetEggs = eggsOverride ||
        (selectedEggs.size > 0 ? [...selectedEggs] : null) ||
        (analysisResult?.matchedEggs?.length > 0 ? analysisResult.matchedEggs : null) ||
        (captureHistory[0]?.result?.matchedEggs?.length > 0 ? captureHistory[0].result.matchedEggs : null) ||
        (preSelectedEggs.size > 0 ? [...preSelectedEggs] : null);
    }

    const payload = {
      url: contentToAnalyze.url || "",
      title: contentToAnalyze.title || "",
      content: contentToAnalyze.content || "",
      sourceType: contentToAnalyze.sourceType || "generic",
      metadata: contentToAnalyze.metadata,
      chapters: contentToAnalyze.chapters || undefined,
      questions,
      force: true,
      stage: 1,
      enabledSections: { ...enabledSections },
      outputLanguage,
      ...(Array.isArray(targetEggs) ? { eggs: targetEggs } : {}),
    };

    // Cache the analyzing state so if user switches back while in progress, it shows analyzing
    const existingCache = tabResultCache.get(pinnedTabId) || {};
    tabResultCache.set(pinnedTabId, {
      ...existingCache,
      status: "analyzing",
      url: contentToAnalyze.url,
      extractedContent: contentToAnalyze,
      stage1Payload: payload,
      isReanalyzing: isReanalyze,
      analysisResult: isReanalyze ? (analysisResult || existingCache.analysisResult) : null,
      captureHistory: [...captureHistory],
      currentNutId: currentNutId || existingCache.currentNutId,
    });

    const response = await sendAnalyzeViaPort(payload);

    if (response?.error) {
      tabStateManager.setError(pinnedTabId, response.error, response.errorCode);
      if (activeTabId === pinnedTabId) {
        showError(response.error, response.errorCode);
      }
      return response.error;
    }

    if (isReanalyze && Array.isArray(targetEggs)) {
      response.matchedEggs = [...targetEggs];
    }

    // In Chrome standalone mode, skip stage 2 egg comparison
    const isChromeMode = response?.mode === "chrome" || (!serverOnline && !response?.matchedEggs?.length);
    const isExplicitEggReanalyze = isReanalyze && Array.isArray(eggsOverride) && eggsOverride.length > 0;
    const shouldRunStage2 = !isChromeMode && (analysisMode === "fast" || isExplicitEggReanalyze);
    const eggsForStage2 = isReanalyze
      ? (Array.isArray(targetEggs) ? targetEggs : [])
      : ((targetEggs && targetEggs.length > 0)
          ? targetEggs
          : (response.matchedEggs && response.matchedEggs.length > 0 ? response.matchedEggs : []));

    if (shouldRunStage2) {
      const existingCache2 = tabResultCache.get(pinnedTabId) || {};
      tabResultCache.set(pinnedTabId, {
        ...existingCache2,
        status: eggsForStage2.length > 0 ? "analyzing" : "done",
        url: contentToAnalyze.url,
        extractedContent: contentToAnalyze,
        analysisResult: response,
        stage1Payload: payload,
        stage1ContentAnalysis: response,
        isReanalyzing: isReanalyze,
        captureHistory: [...(activeTabId === pinnedTabId ? captureHistory : (existingCache2.captureHistory || []))],
        currentNutId: (activeTabId === pinnedTabId ? currentNutId : null) || existingCache2.currentNutId,
      });

      if (activeTabId === pinnedTabId) {
        stage1Payload = payload;
        stage1ContentAnalysis = response;
        cachedProcessedSaved = null;
        followUpQa = [];
        qaUI.clearFollowup();
        nutCollected = false;
        eggHatched = false;
        activeEggTab = null;
        analysisResult = response;

        showResultsState(response, provenanceFromExtraction(contentToAnalyze));

        if (isReanalyze) {
          actionsUI.showProcessedNote(t("comparingAgainstSelected"));
          actionsUI.setReanalyzingState(t("comparingKnowledge"));
        }

        if (eggsForStage2.length > 0) {
          if (!isReanalyze) {
            verdictUI.setComparing(eggsForStage2.length);
          } else {
            verdictUI.hide();
          }
          actionsUI.hideStage1Confirm();
        }
      }

      if (eggsForStage2.length > 0) {
        await handleProceedStage2(
          eggsForStage2,
          false,
          isReanalyze,
          pinnedTabId,
          response,
          payload,
          contentToAnalyze
        );
      }

      if (activeTabId === pinnedTabId) {
        if (isReanalyze || captureHistory.length > 0) {
          actionsUI.showProcessedNote(t("reanalyzedFreshResult"));
          renderHistorySelect(currentNutId);
        }
      }
    } else {
      if (analysisMode === "confirm") {
        response.stage = "stage1";
        delete response.eggResults;
        delete response.shouldRead;
        delete response.shouldReadReason;
        delete response.newKnowledge;
      }
      const stage1NutId = response.nutId || null;
      if (activeTabId === pinnedTabId && stage1NutId) {
        currentNutId = stage1NutId;
      }
      let freshHistory = null;
      if (contentToAnalyze.url && serverOnline) {
        try {
          const histResp = await chrome.runtime.sendMessage({
            action: "history",
            url: contentToAnalyze.url,
          });
          if (histResp?.history?.length) {
            freshHistory = histResp.history;
          }
        } catch {}
      }
      const stage1Entry = stage1NutId
        ? {
            nutId: stage1NutId,
            capturedAt: new Date().toISOString(),
            saved: "analyzed",
            result: response,
            url: contentToAnalyze.url,
            title: contentToAnalyze.title,
            content: contentToAnalyze.content,
            sourceType: contentToAnalyze.sourceType,
            author: contentToAnalyze.metadata?.author || "",
            publishedAt: contentToAnalyze.metadata?.published || "",
          }
        : null;
      const cachedBefore = tabResultCache.get(pinnedTabId) || {};
      const priorHistory = activeTabId === pinnedTabId ? captureHistory : (cachedBefore.captureHistory || []);
      const updatedHistory = freshHistory || (stage1Entry ? [stage1Entry, ...priorHistory] : priorHistory);

      tabResultCache.set(pinnedTabId, {
        status: "done",
        url: contentToAnalyze.url,
        extractedContent: contentToAnalyze,
        analysisResult: response,
        stage1Payload: { ...payload, nutId: stage1NutId },
        stage1ContentAnalysis: response,
        currentNutId: stage1NutId || (activeTabId === pinnedTabId ? currentNutId : cachedBefore.currentNutId),
        captureHistory: updatedHistory,
        justReanalyzed: isReanalyze,
      });
      if (activeTabId === pinnedTabId) {
        stage1Payload = { ...payload, nutId: stage1NutId };
        stage1ContentAnalysis = response;
        currentNutId = stage1NutId || currentNutId;
        captureHistory = updatedHistory;
        cachedProcessedSaved = null;
        followUpQa = [];
        qaUI.clearFollowup();
        nutCollected = false;
        eggHatched = false;
        activeEggTab = null;
        analysisResult = response;
        showResultsState(response, provenanceFromExtraction(contentToAnalyze));
        if (isReanalyze || captureHistory.length > 0) {
          actionsUI.showProcessedNote(isReanalyze ? t("reanalyzedFreshResult") : t("stage1Complete"));
          renderHistorySelect(currentNutId);
        }
      }
    }

    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    tabStateManager.setError(pinnedTabId, message);
    if (activeTabId === pinnedTabId) {
      showError(message);
    }
    return message;
  } finally {
    if (activeTabId === pinnedTabId) {
      isReanalyzing = false;
      actionsUI.setHistorySelectDisabled(false);
      const activeCache = tabResultCache.get(activeTabId);
      if (!activeCache || (activeCache.status !== "analyzing" && activeCache.status !== "hatching")) {
        updateAnalyzeButtonsState();
      }
    }
  }
}

// --- Collapsible Results Sections ---

/** Initialize collapsible behavior for all result sections in results-state. */
function initCollapsibleSections() {
  (globalThis.NutEggUI?.initCollapsibleSections || globalThis.initCollapsibleSections)?.();
}

/** Reset all result sections to expanded state. */
function resetCollapsibleSections() {
  (globalThis.NutEggUI?.resetCollapsibleSections || globalThis.resetCollapsibleSections)?.();
}

// --- Show results ---

function showResultsState(result, provenance = null) {
  analysisResult = result;
  resultsUI.showResults();
  initCollapsibleSections();
  if (!isReanalyzing) {
    resetCollapsibleSections();
  }
  if (!actionsUI.getProcessedMessage()) {
    const entry = (currentNutId != null && captureHistory.find((h) => String(h.nutId) === String(currentNutId))) || captureHistory[0];
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
  updateSectionChipsUI();
  if (!isReanalyzing) {
    updateAnalyzeButtonsState();
    actionsUI.setHistorySelectDisabled(false);
  }
  renderHistorySelect(currentNutId);
  renderResultProvenance(provenance);

  const isChromeMode = result.mode === "chrome" || (!serverOnline && !result.matchedEggs?.length);
  const isStage1 = result.stage === "stage1" || isChromeMode;

  if (isChromeMode) {
    bannersUI.setChromeResultBanner(true);
    bannersUI.setChromeActionsCard(true);
    actionsUI.hideStage1Confirm();
    verdictUI.hide();
    eggsUI.setNoEggVisible(false);
    eggsUI.setKnowledgeVisible(false);
    actionsUI.setConfirmButtonVisible(false);
    actionsUI.setCollectNutButtonVisible(false);
  } else {
    bannersUI.setChromeResultBanner(false);
    bannersUI.setChromeActionsCard(false);
    actionsUI.setCollectNutButtonVisible(true);

    if (isStage1) {
      if (analysisMode === "confirm") {
        actionsUI.showStage1Confirm();
        verdictUI.hide();
      } else {
        actionsUI.hideStage1Confirm();
        verdictUI.show();
      }
      actionsUI.setConfirmButtonVisible(false);
    } else {
      actionsUI.hideStage1Confirm();
      verdictUI.show();
    }

    // No egg matched — offer to create one
    const noEgg = (result.matchedEggs || []).length === 0;
    eggsUI.setNoEggVisible(noEgg);

    // Egg picker — sync the checklist with _index.md, then render it with
    // this result's matched eggs (user edits + re-analyze changes the match)
    fetchEggs().then(() => {
      renderEggsSection(result.matchedEggs || []);
      if (isStage1 && analysisMode === "confirm") {
        eggsUI.expandEggsList(true);
        updateStage1ProceedBtn();
        window.scrollTo(0, 0);
      }
    });
  }

  // Title Verdict
  verdictUI.renderTitleVerdict(result.titleVerdict, enabledSections.titleVerdict !== false);

  // Core Summary
  resultsUI.renderCoreSummary(result.coreSummary, enabledSections.coreSummary !== false);

  // Mind Map — text-heavy concept tree for side panel
  mindmapUI.render(result.mindMap, enabledSections.mindMap !== false);

  // Chapter Map — clickable when timestamps exist (video).
  // For short content without an original chapter map, don't show it:
  // - If isLongForm is false and no author chapters were provided, don't show it.
  // - If chapterMap has fewer than 2 entries and no author chapters were provided, don't show it.
  const hasAuthorChapters =
    (Array.isArray(extractedContent?.chapters) && extractedContent.chapters.length > 0) ||
    (Array.isArray(stage1Payload?.chapters) && stage1Payload.chapters.length > 0) ||
    (Array.isArray(stage1Payload?.content?.chapters) && stage1Payload.content.chapters.length > 0) ||
    (Array.isArray(result?.chapters) && result.chapters.length > 0);

  const isShortWithoutChapters =
    (result.isLongForm === false || !result.chapterMap || result.chapterMap.length <= 1) &&
    !hasAuthorChapters;

  chaptersUI.render({
    chapterMap: result.chapterMap,
    enabled: enabledSections.chapterMap !== false,
    isShortWithoutChapters,
    activeTabId,
    onSeek: seekToChapter,
  });

  // Your Questions — initial answers + follow-ups asked this session
  renderCustomQuestions();

  // Egg Knowledge (Tabs + unified per-egg insights, Q&A, and tree)
  renderEggKnowledge(isStage1 ? [] : (result.eggResults || []));

  // Verdict
  if (isStage1) {
    if (analysisMode === "fast") {
      verdictUI.show();
    } else {
      verdictUI.hide();
    }
  } else {
    verdictUI.renderDecision(result);
  }

  bannersUI.hideSuccess();
  updateActionButtons();
}

function cleanEggName(fileName) {
  return (globalThis.NutEggUI?.cleanEggName || globalThis.cleanEggName || ((f) => f ? f.split("/").pop().replace(/\.md$/, "") : "Egg"))(fileName);
}

function renderEggKnowledge(eggResults = []) {
  const fn = globalThis.NutEggUI?.renderEggKnowledge || globalThis.renderEggKnowledge;
  if (fn) {
    fn(eggResults, {
      eggKnowledgeSection: eggsUI.eggKnowledgeSection,
      eggKnowledgeContent: eggsUI.eggKnowledgeContent,
      eggTabsBar: eggsUI.eggTabsBar,
      eggKnowledgeHint: eggsUI.eggKnowledgeHint,
      activeEggTab,
      onTabChange: (newTab) => { activeEggTab = newTab; },
    });
  }
}

/** Reflect nutCollected/eggHatched in the two action buttons. */
function updateActionButtons() {
  if (analysisResult?.mode === "chrome") {
    actionsUI.updateActionButtons({ isChromeMode: true });
    bannersUI.setChromeActionsCard(true);
    return;
  }
  bannersUI.setChromeActionsCard(false);

  actionsUI.updateActionButtons({
    isStage1: analysisResult?.stage === "stage1",
    nutCollected,
    eggHatched,
    hasDelta: (analysisResult?.newKnowledge?.length || 0) > 0,
  });
}

/**
 * On popup open: if this URL has cached captures, show the latest result
 * without waiting for the user to click Analyze.
 */
async function loadHistoryIfAny(seq = refreshSeq, urlOverride = null) {
  const url = urlOverride || extractedContent?.url;
  if (!serverOnline || !url) return false;
  try {
    const response = await chrome.runtime.sendMessage({
      action: "history",
      url,
    });
    if (seq !== refreshSeq) return false; // a newer tab refresh superseded this one
    if (response?.history?.length) {
      captureHistory = response.history;
      showHistoryEntry(response.latest || response.history[0]);
      actionsUI.setAnalyzeButtonLoading(false, t("analyzeAgain"));
      return true;
    }
  } catch {
    // Server unreachable or no history — stay in capture state
  }
  return false;
}

/** Render or update the version history select dropdown. */
function renderHistorySelect(selectedNutId = currentNutId) {
  actionsUI.renderHistory(captureHistory, selectedNutId);
}

/** Show one cached capture (from history) with its capture timestamp. */
function showHistoryEntry(entry) {
  cachedProcessedSaved = entry.saved || "analyzed";
  nutCollected = cachedProcessedSaved === "saved" || cachedProcessedSaved === "skip";
  eggHatched = cachedProcessedSaved === "saved";
  currentNutId = entry.nutId ?? null;
  analysisResult = entry.result;

  if (entry.result?.stage === "stage1") {
    stage1ContentAnalysis = entry.result;
    stage1Payload = {
      url: entry.url || extractedContent?.url || captureUI.getPageUrl() || "",
      title: entry.title || extractedContent?.title || captureUI.getPageTitle() || "",
      content: entry.content || extractedContent?.content || "",
      sourceType: entry.sourceType || extractedContent?.sourceType || "generic",
      metadata: extractedContent?.metadata,
      nutId: entry.nutId,
    };
  } else {
    stage1ContentAnalysis = null;
    stage1Payload = null;
  }

  if (entry.content) {
    extractedContent = {
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

  if (activeTabId) {
    const existing = tabResultCache.get(activeTabId) || {};
    tabResultCache.set(activeTabId, {
      ...existing,
      status: "done",
      extractedContent: existing.extractedContent || extractedContent,
      analysisResult: entry.result,
      currentNutId: entry.nutId,
      eggHatched,
      nutCollected,
      stage1Payload: (entry.result?.stage === "stage1" ? stage1Payload : null),
      stage1ContentAnalysis: (entry.result?.stage === "stage1" ? stage1ContentAnalysis : null),
    });
  }

  // Stored provenance from the DB row, falling back to the live extraction
  const live = provenanceFromExtraction();
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
  renderHistorySelect(entry.nutId);
}

/** Extract timestamp string like "12:34" or "1:05:30" from a reference string, or null if none. */
function extractTimestamp(str) {
  return (globalThis.NutEggUI?.extractTimestamp || globalThis.extractTimestamp)(str);
}

/** Replace timestamps in text like "[12:34]" or "12:34" with clickable timestamp buttons. */
function linkifyTimestamps(escapedText) {
  return (globalThis.NutEggUI?.linkifyTimestamps || globalThis.linkifyTimestamps)(escapedText);
}

/** Render clickable source pills and supporting quotes for a Q&A answer. */
function renderQaSources(sources) {
  return (globalThis.NutEggUI?.renderQaSources || globalThis.renderQaSources)(sources);
}

/**
 * Unwrap single root node(s) with children so that the mind map directly
 * displays the core branches at the root level instead of an unnecessary single root.
 */
function unwrapMindMapRoots(nodes) {
  return (globalThis.NutEggUI?.unwrapMindMapRoots || globalThis.unwrapMindMapRoots)(nodes);
}

/** Render the Mind Map hierarchical concept tree. */
function renderMindMap(nodes) {
  const fn = globalThis.NutEggUI?.renderMindMap || globalThis.renderMindMap;
  if (fn) {
    fn(nodes, mindmapUI.mindmapTree);
  }
}

/** Render the "Your Questions" section: initial answers + follow-ups. */
function renderCustomQuestions() {
  const fn = globalThis.NutEggUI?.renderCustomQuestions || globalThis.renderCustomQuestions;
  if (fn) {
    fn({
      customQuestionsSection: qaUI.customQuestionsSection,
      customQuestionsList: qaUI.customQuestionsList,
      followupInput: qaUI.followupInput,
      questions: analysisResult?.customQuestionAnswers,
      followUps: followUpQa,
    });
  }
}

/** Ask a follow-up question against the already-analyzed content. */
async function handleFollowUp() {
  const pinnedTabId = activeTabId;
  const q = qaUI.getFollowupText();
  if (!q || qaUI.followupBtn?.disabled) return;
  qaUI.clearFollowup();
  qaUI.setFollowupLoading(true);

  const cached = pinnedTabId ? tabResultCache.get(pinnedTabId) : null;
  let content = extractedContent || cached?.extractedContent;
  const result = analysisResult || cached?.analysisResult;

  followUpQa.push({ question: q, answer: "…" });
  if (pinnedTabId) {
    const existingCache = tabResultCache.get(pinnedTabId) || {};
    tabResultCache.set(pinnedTabId, {
      ...existingCache,
      followUpQa: [...followUpQa],
    });
  }
  renderCustomQuestions();

  try {
    if (!content) {
      content = await extractPageContent(refreshSeq, pinnedTabId);
    }
    const payload = {
      url: content?.url || result?.url || "",
      title: content?.title || result?.title || "",
      content: content?.content || "",
      sourceType: content?.sourceType || result?.sourceType || "generic",
      questions: [q],
      priorQa: buildPriorQa(result, followUpQa),
      outputLanguage,
    };
    const response = await chrome.runtime.sendMessage({ action: "ask", payload });

    const answers = response?.answers || [];
    const ansObj = answers[0];
    const answer = ansObj?.answer || response?.error || t("noAnswerReturned");
    const answeredEntry = {
      question: q,
      answer,
      sources: ansObj?.sources,
    };

    if (pinnedTabId) {
      const c = tabResultCache.get(pinnedTabId) || {};
      const currentQa = c.followUpQa ? [...c.followUpQa] : [...followUpQa];
      const lastIdx = currentQa.length - 1;
      if (lastIdx >= 0 && currentQa[lastIdx].question === q && currentQa[lastIdx].answer === "…") {
        currentQa[lastIdx] = answeredEntry;
      } else {
        currentQa.push(answeredEntry);
      }
      c.followUpQa = currentQa;
      tabResultCache.set(pinnedTabId, c);
    }

    if (activeTabId === pinnedTabId) {
      followUpQa[followUpQa.length - 1] = answeredEntry;
    }
  } catch (err) {
    const errorEntry = {
      question: q,
      answer: t("failedToGetAnswer", { error: err instanceof Error ? err.message : "unknown error" }),
    };
    if (pinnedTabId) {
      const c = tabResultCache.get(pinnedTabId) || {};
      const currentQa = c.followUpQa ? [...c.followUpQa] : [...followUpQa];
      const lastIdx = currentQa.length - 1;
      if (lastIdx >= 0 && currentQa[lastIdx].question === q && currentQa[lastIdx].answer === "…") {
        currentQa[lastIdx] = errorEntry;
      } else {
        currentQa.push(errorEntry);
      }
      c.followUpQa = currentQa;
      tabResultCache.set(pinnedTabId, c);
    }
    if (activeTabId === pinnedTabId) {
      followUpQa[followUpQa.length - 1] = errorEntry;
    }
  }

  if (activeTabId === pinnedTabId) {
    qaUI.setFollowupLoading(false);
    renderCustomQuestions();
  }
}

/** All Q&A seen so far — context so follow-ups can refer back instead of repeating. */
function buildPriorQa(res = analysisResult, qaList = followUpQa) {
  return (globalThis.NutEggUI?.buildPriorQa || globalThis.buildPriorQa)(res, qaList);
}

/** Seek the active tab's video to a chapter timestamp. */
async function seekToChapter(seconds) {
  let tabId = activeTabId;
  if (!tabId) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = tab?.id;
    } catch { /* ignore */ }
  }
  if (tabId == null) return;
  const secs = typeof seconds === "number" ? seconds : timeToSeconds(seconds);
  try {
    await chrome.tabs.sendMessage(tabId, { action: "nutegg-seek", seconds: secs });
  } catch {
    // Content script not injected — inject and retry
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [
          "src/content/utils.js",
          "src/content/extractors/youtube.js",
          "src/content/extractors/twitter.js",
          "src/content/extractors/article.js",
          "src/content/extractors/generic.js",
          "src/content/content-script.js",
        ],
      });
      await chrome.tabs.sendMessage(tabId, { action: "nutegg-seek", seconds: secs });
    } catch { /* page doesn't allow injection */ }
  }
}

/** Scroll the active tab to a section heading or quote text. */
async function scrollToSection(heading, quote) {
  let tabId = activeTabId;
  if (!tabId) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = tab?.id;
    } catch { /* ignore */ }
  }
  if (tabId == null) return;
  try {
    await chrome.tabs.sendMessage(tabId, { action: "nutegg-scroll-to", heading, quote });
  } catch {
    // Content script not injected — inject and retry
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [
          "src/content/utils.js",
          "src/content/extractors/youtube.js",
          "src/content/extractors/twitter.js",
          "src/content/extractors/article.js",
          "src/content/extractors/generic.js",
          "src/content/content-script.js",
        ],
      });
      await chrome.tabs.sendMessage(tabId, { action: "nutegg-scroll-to", heading, quote });
    } catch { /* page doesn't allow injection */ }
  }
}

/** Handle click on source pills (timestamp seek or section scroll). */
function handleSourcePillClick(e) {
  const fn = globalThis.NutEggUI?.handleSourcePillClick || globalThis.handleSourcePillClick;
  if (fn) {
    fn(e, {
      onSeek: seekToChapter,
      onScroll: scrollToSection,
    });
  }
}

/** "MM:SS" or "HH:MM:SS" → seconds. */
function timeToSeconds(time) {
  return (globalThis.NutEggUI?.timeToSeconds || globalThis.timeToSeconds)(time);
}

function showCaptureState() {
  resultsUI.showCapture();
  resetCollapsibleSections();
  if (extractedContent) {
    captureUI.setContent(extractedContent);
    showProvenance(extractedContent.metadata || {});
  }
  analysisResult = null;
  cachedProcessedSaved = null;
  followUpQa = [];
  qaUI.clearFollowup();
  nutCollected = false;
  eggHatched = false;
  currentNutId = null;
  activeEggTab = null;
  hideMessages();
  updateAnalyzeButtonsState();
  updateCaptureBanners();
  updateSectionChipsUI();
}

// --- Confirm (add to knowledge base) ---

async function handleConfirm() {
  const pinnedTabId = activeTabId;
  const cached = pinnedTabId ? tabResultCache.get(pinnedTabId) : null;
  const targetResult = analysisResult || cached?.analysisResult;
  let targetContent = extractedContent || cached?.extractedContent;
  const targetNutId = currentNutId || cached?.currentNutId;

  if (!targetResult || eggHatched || !(targetResult.newKnowledge?.length)) return;
  if (!targetContent) {
    if (activeTabId === pinnedTabId) {
      actionsUI.setConfirmButtonLoading(true, t("retrieving"));
    }
    targetContent = await extractPageContent(refreshSeq, pinnedTabId);
  }
  if (activeTabId === pinnedTabId) {
    actionsUI.setConfirmButtonLoading(true, t("hatching"));
  }
  await doSave(targetResult.newKnowledge || [], true, targetContent, targetResult, targetNutId, pinnedTabId);
  if (activeTabId === pinnedTabId) {
    updateActionButtons();
  }
}

// --- Collect Nut (save content only, no knowledge additions) ---

async function handleSaveRaw() {
  const pinnedTabId = activeTabId;
  const cached = pinnedTabId ? tabResultCache.get(pinnedTabId) : null;
  const targetResult = analysisResult || cached?.analysisResult;
  let targetContent = extractedContent || cached?.extractedContent;
  const targetNutId = currentNutId || cached?.currentNutId;

  if (nutCollected) return; // already collected — no duplicate work
  if (!targetContent) {
    if (activeTabId === pinnedTabId) {
      actionsUI.setCollectNutLoading(true, t("retrieving"));
    }
    targetContent = await extractPageContent(refreshSeq, pinnedTabId);
  }
  if (!targetContent) {
    if (activeTabId === pinnedTabId) {
      showError(t("couldNotExtractToSave"));
      updateActionButtons();
    }
    return;
  }
  if (activeTabId === pinnedTabId) {
    actionsUI.setCollectNutLoading(true, t("collecting"));
  }
  await doSave([], false, targetContent, targetResult, targetNutId, pinnedTabId);
  if (activeTabId === pinnedTabId) {
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
  const isTargetActive = !targetPinnedId || (activeTabId === targetPinnedId);
  let content = overrideContent || (isTargetActive ? extractedContent : null);
  const result = overrideResult || (isTargetActive ? analysisResult : null);
  const nutId = overrideNutId ?? (isTargetActive ? currentNutId : null);

  try {
    if (!content && isTargetActive) {
      content = await extractPageContent(refreshSeq, targetPinnedId || activeTabId);
    }
    const payload = {
      url: content?.url || result?.url || "",
      title: content?.title || result?.title || "",
      content: content?.content || "",
      sourceType: content?.sourceType || "generic",
      metadata: content?.metadata,
      summary: result?.summary || "",
      matchedEggs: result?.matchedEggs || [],
      newKnowledge,
      analysis: result || undefined,
      nutId: nutId ?? undefined,
      // Hatching collects the nut too — skip the raw save only when the
      // nut was already collected (this session or a previous one).
      // "analyzed" means processed but never saved, so the raw must be saved.
      skipRaw: (() => {
        const cachedForSave = targetPinnedId ? tabResultCache.get(targetPinnedId) : null;
        const isTargetNutCollected = isTargetActive ? nutCollected : !!cachedForSave?.nutCollected;
        const isTargetCachedSaved = isTargetActive ? cachedProcessedSaved : (cachedForSave?.cachedProcessedSaved ?? null);
        return (newKnowledge.length > 0 || isHatch) &&
          (isTargetNutCollected || (isTargetCachedSaved !== null && isTargetCachedSaved !== "analyzed"));
      })(),
    };

    const response = await chrome.runtime.sendMessage({ action: "confirm", payload });

    if (response?.success) {
      if (targetPinnedId) {
        const existing = tabResultCache.get(targetPinnedId) || {};
        existing.eggHatched = (newKnowledge.length > 0 || isHatch);
        existing.nutCollected = true;
        if (existing.captureHistory && nutId != null) {
          const ce = existing.captureHistory.find((h) => String(h.nutId) === String(nutId));
          if (ce) ce.saved = (newKnowledge.length > 0 || isHatch) ? "saved" : "skip";
        }
        tabResultCache.set(targetPinnedId, existing);
      }
      if (isTargetActive) {
        if (newKnowledge.length > 0 || isHatch) {
          // Hatching the egg collects the nut as well
          eggHatched = true;
          nutCollected = true;
        } else {
          nutCollected = true;
        }
        // Keep the capture history entry in sync with the new save state
        if (nutId != null) {
          const entry = captureHistory.find((h) => String(h.nutId) === String(nutId));
          if (entry) entry.saved = (newKnowledge.length > 0 || isHatch) ? "saved" : "skip";
        }
        renderHistorySelect(currentNutId);
        const merged = response?.merged || [];
        const mergedNote = merged.length > 0
          ? ` 🧹 ${merged
              .map((m) => t("unprocessedMergedNote", { count: m.entries, egg: m.egg }))
              .join(", ")}`
          : "";
        const isStage1BoxVisible = result?.stage === "stage1" && actionsUI.isStage1ConfirmVisible();
        if (isStage1BoxVisible) {
          // In Stage 1, stage1-confirm-box updates in-place to show the saved state.
          // Hide successBanner so only one message is displayed.
          bannersUI.hideSuccess();
        } else {
          if (newKnowledge.length > 0) {
            bannersUI.showSuccess(t("eggHatchedSuccess", { mergedNote }));
          } else if (isHatch) {
            bannersUI.showSuccess(t("eggHatchedNoKnowledge"));
          } else {
            bannersUI.showSuccess(t("nutCollectedVault"));
          }
        }
        updateActionButtons();
        fetchMetrics();
      }
    } else {
      if (isTargetActive) {
        showError(response?.error || t("failedToSave"));
      }
    }
  } catch (err) {
    if (isTargetActive) {
      showError(err instanceof Error ? err.message : t("failedToSave"));
    }
  }
}

function handleDiscard() { window.close(); }

// --- Messages ---

function showError(msg, errorCode) {
  bannersUI.showError(msg, errorCode);
}

function showDuplicate(msg) {
  bannersUI.showDuplicate(msg);
}

function hideMessages() {
  bannersUI.hideMessages();
}

function showWarning(msg) {
  bannersUI.showWarning(msg);
  updateServerStatusIndicator();
}
function hideWarning() {
  bannersUI.hideWarning();
  updateServerStatusIndicator();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/** Redirect to GitHub issues prefilled with bug report template. */
function openGitHubBugReport(errorContext = "") {
  let contentUrl = "";
  if (extractedContent?.url) {
    contentUrl = extractedContent.url;
  } else if (captureUI.getPageUrl() && captureUI.getPageUrl() !== "Loading...") {
    contentUrl = captureUI.getPageUrl();
  }

  const manifest = chrome.runtime?.getManifest?.() || {};
  const version = manifest.version || "0.0.0";
  const observed = errorContext
    ? `Encountered error: ${errorContext}`
    : "<!-- Describe what actually happened (e.g. error message, unexpected output, stuck on retrieving/analyzing) -->";

  const body = [
    "### URL of the content",
    contentUrl || "[Enter the URL of the article, video, or webpage here]",
    "",
    "### Expected behavior",
    "<!-- A clear description of what you expected to happen -->",
    "",
    "",
    "### Observed behavior",
    observed,
    "",
    "",
    "### Environment",
    `- NutEgg Extension Version: v${version}`,
    `- Browser: ${navigator.userAgent || "Chrome"}`,
  ].join("\n");

  const title = errorContext ? `[Bug]: ${errorContext.slice(0, 60)}` : "[Bug]: ";
  const issueUrl = `https://github.com/staff-000/nutegg/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  window.open(issueUrl, "_blank");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    extractTimestamp,
    linkifyTimestamps,
    renderQaSources,
    timeToSeconds,
    unwrapMindMapRoots,
    initCollapsibleSections,
    resetCollapsibleSections,
    renderMindMap: globalThis.NutEggUI?.renderMindMap || globalThis.renderMindMap || renderMindMap,
    renderChapterMap: globalThis.NutEggUI?.renderChapterMap || globalThis.renderChapterMap,
    renderCustomQuestions,
    buildPriorQa,
    handleSourcePillClick,
    cleanEggName,
    renderCaptureEggsList,
    updateCaptureEggsLabel,
    renderEggsSection,
    renderEggKnowledge,
    tabStateManager,
    tabResultCache,
  };
}
