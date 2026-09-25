const t = (key, params) => (typeof window !== "undefined" && window.NutEggI18n ? window.NutEggI18n.t(key, params) : key);

// DOM — Capture state
const serverStatus = document.getElementById("server-status");
const aiCreditPill = document.getElementById("ai-credit-pill");
const aiCreditText = document.getElementById("ai-credit-text");
const settingsBtn = document.getElementById("settings-btn");
const pageTitle = document.getElementById("page-title");
const pageUrl = document.getElementById("page-url");
const pageType = document.getElementById("page-type");
const pageAuthorEl = document.getElementById("page-author");
const pagePublishedEl = document.getElementById("page-published");
const refreshBtn = document.getElementById("refresh-btn");
const contentPreview = document.getElementById("content-preview");
const questionsToggle = document.getElementById("questions-toggle");
const questionsArea = document.getElementById("questions-area");
const customQuestionsEl = document.getElementById("custom-questions");
const analyzeBtn = document.getElementById("analyze-btn");
const analyzeBtnText = document.getElementById("analyze-btn-text");
const warningBanner = document.getElementById("warning-banner");
const warningMessage = document.getElementById("warning-message");
const errorBanner = document.getElementById("error-banner");
const errorMessage = document.getElementById("error-message");
const errorHint = document.getElementById("error-hint");
const duplicateBanner = document.getElementById("duplicate-banner");
const duplicateMessage = document.getElementById("duplicate-message");

// DOM — Results state
const captureState = document.getElementById("capture-state");
const resultsState = document.getElementById("results-state");
const resultPageInfo = document.getElementById("result-page-info");
const resultPageTitle = document.getElementById("result-page-title");
const resultPageAuthor = document.getElementById("result-page-author");
const resultPagePublished = document.getElementById("result-page-published");
const processedNote = document.getElementById("processed-note");
const processedMessage = document.getElementById("processed-message");
const reanalyzeBtn = document.getElementById("reanalyze-btn");
const historySelect = document.getElementById("history-select");
const titleVerdictSection = document.getElementById("title-verdict-section");
const verdictAnswer = document.getElementById("verdict-answer");
const coreSummarySection = document.getElementById("core-summary-section");
const coreSummaryEl = document.getElementById("core-summary");
const mindmapSection = document.getElementById("mindmap-section");
const mindmapTree = document.getElementById("mindmap-tree");
const chapterSection = document.getElementById("chapter-section");
const chapterList = document.getElementById("chapter-list");

// Content Analysis section selectors (Capture state & Re-analysis state)
const sectionsToggle = document.getElementById("sections-toggle");
const sectionsChevron = document.getElementById("sections-chevron");
const sectionsBody = document.getElementById("sections-body");
const sectionsBadge = document.getElementById("sections-badge");

const reanalyzeSectionsToggle = document.getElementById("reanalyze-sections-toggle");
const reanalyzeSectionsChevron = document.getElementById("reanalyze-sections-chevron");
const reanalyzeSectionsBody = document.getElementById("reanalyze-sections-body");
const reanalyzeSectionsBadge = document.getElementById("reanalyze-sections-badge");

const chipVerdict = document.getElementById("chip-verdict");
const chipSummary = document.getElementById("chip-summary");
const chipMindmap = document.getElementById("chip-mindmap");
const chipChapters = document.getElementById("chip-chapters");

const reanalyzeChipVerdict = document.getElementById("reanalyze-chip-verdict");
const reanalyzeChipSummary = document.getElementById("reanalyze-chip-summary");
const reanalyzeChipMindmap = document.getElementById("reanalyze-chip-mindmap");
const reanalyzeChipChapters = document.getElementById("reanalyze-chip-chapters");
const customQuestionsSection = document.getElementById("custom-questions-section");
const customQuestionsList = document.getElementById("custom-questions-list");
const followupInput = document.getElementById("followup-input");
const followupBtn = document.getElementById("followup-btn");
const eggKnowledgeSection = document.getElementById("egg-knowledge-section");
const eggKnowledgeHint = document.getElementById("egg-knowledge-hint");
const eggTabsBar = document.getElementById("egg-tabs-bar");
const eggKnowledgeContent = document.getElementById("egg-knowledge-content");
const verdictIcon = document.getElementById("verdict-icon");
const verdictText = document.getElementById("verdict-text");
const verdictBadge = document.getElementById("verdict-badge");
const verdictReason = document.getElementById("verdict-reason");
const noEggSection = document.getElementById("no-egg-section");
const newEggName = document.getElementById("new-egg-name");
const newEggDescription = document.getElementById("new-egg-description");
const createEggBtn = document.getElementById("create-egg-btn");
const eggsSection = document.getElementById("eggs-section");
const eggsToggle = document.getElementById("eggs-toggle");
const eggsToggleLabel = document.getElementById("eggs-toggle-label");
const eggsToggleChevron = document.getElementById("eggs-toggle-chevron");
const eggsExpanded = document.getElementById("eggs-expanded");
const eggsList = document.getElementById("eggs-list");
const reanalyzeEggsBtn = document.getElementById("reanalyze-eggs-btn");
const eggsErrorEl = document.getElementById("eggs-error");
const eggsCreateToggle = document.getElementById("eggs-create-toggle");
const eggsCreateForm = document.getElementById("eggs-create-form");
const eggsNewName = document.getElementById("eggs-new-name");
const eggsNewDesc = document.getElementById("eggs-new-desc");
const eggsCreateBtn = document.getElementById("eggs-create-btn");
const confirmBtn = document.getElementById("confirm-btn");
const collectNutBtn = document.getElementById("collect-nut-btn");
const discardBtn = document.getElementById("discard-btn");
const backBtn = document.getElementById("back-btn");
const successBanner = document.getElementById("success-banner");
const successMessage = document.getElementById("success-message");
const metricNuts = document.getElementById("metric-nuts");
const metricEggs = document.getElementById("metric-eggs");
const metricTime = document.getElementById("metric-time");
const captureEggsToggle = document.getElementById("capture-eggs-toggle");
const captureEggsLabel = document.getElementById("capture-eggs-label");
const captureEggsChevron = document.getElementById("capture-eggs-chevron");
const captureEggsArea = document.getElementById("capture-eggs-area");
const captureEggsList = document.getElementById("capture-eggs-list");
const obsidianPluginLink = document.getElementById("obsidian-plugin-link");

// Mode toggle & Stage 1 elements
const modeFastBtn = document.getElementById("mode-fast-btn");
const modeConfirmBtn = document.getElementById("mode-confirm-btn");
const verdictSection = document.getElementById("verdict-section");
const stage1ConfirmBox = document.getElementById("stage1-confirm-box");
const stage1ProceedBtn = document.getElementById("stage1-proceed-btn");
const stage1SkipBtn = document.getElementById("stage1-skip-btn");

// Standalone mode and guidance elements
const aiKeyMissingBanner = document.getElementById("ai-key-missing-banner");
const openSettingsKeyBtn = document.getElementById("open-settings-key-btn");
const chromeModeTipBanner = document.getElementById("chrome-mode-tip-banner");
const chromeResultBanner = document.getElementById("chrome-result-banner");
const chromeActionsCard = document.getElementById("chrome-actions-card");

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

/** Per-tab cache of extraction/analysis results. When the user switches away
 *  and back, the cached result is restored instead of re-extracting. */
const tabResultCache = new Map();

/** Per-tab extraction sequence numbers. Allows background tab extractions to complete
 *  and cache cleanly without being aborted when the active tab switches. */
const tabExtractSeq = new Map();

/** Set of tab IDs currently executing an extraction. */
const tabsExtracting = new Set();

// --- Init ---

async function initPopup() {
  const versionTag = document.getElementById("version-tag");
  if (versionTag) {
    const version = chrome.runtime?.getManifest?.()?.version;
    if (version) versionTag.textContent = `NutEgg ${version}`;
  }

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

  modeFastBtn?.addEventListener("click", () => setAnalysisMode("fast"));
  modeConfirmBtn?.addEventListener("click", () => setAnalysisMode("confirm"));
  stage1ProceedBtn?.addEventListener("click", () => handleProceedStage2(null, true, false, activeTabId));
  stage1SkipBtn?.addEventListener("click", handleSaveRaw);

  analyzeBtn.addEventListener("click", () => {
    const notReady = getAnalyzeNotReadyReason();
    if (notReady) {
      showWarning(notReady);
      return;
    }
    handleAnalyze(true);
  });
  confirmBtn.addEventListener("click", handleConfirm);
  collectNutBtn.addEventListener("click", handleSaveRaw);
  discardBtn.addEventListener("click", handleDiscard);
  initCollapsibleSections();
  backBtn.addEventListener("click", async () => {
    showCaptureState();
    let currentTabUrl = "";
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTabUrl = tab?.url || "";
    } catch {}

    const urlMatches = extractedContent?.url && currentTabUrl &&
      extractedContent.url.split("#")[0] === currentTabUrl.split("#")[0];

    if (urlMatches && extractedContent?.content) {
      contentPreview.textContent = extractedContent.content;
      pageTitle.textContent = extractedContent.title || pageTitle.textContent;
      pageUrl.textContent = extractedContent.url || pageUrl.textContent;
      pageType.textContent = extractedContent.sourceType || pageType.textContent;
      showProvenance(extractedContent.metadata || {});
      updateAnalyzeButtonsState();
    } else {
      extractedContent = null;
      contentPreview.textContent = t("retrievingPageContent");
      await extractPageContent();
    }
  });
  settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
  const reportBugLink = document.getElementById("report-bug-link");
  reportBugLink?.addEventListener("click", (e) => {
    e.preventDefault();
    openGitHubBugReport();
  });
  const errorReportBug = document.getElementById("error-report-bug");
  errorReportBug?.addEventListener("click", (e) => {
    e.preventDefault();
    const errMsg = errorMessage?.textContent || "";
    openGitHubBugReport(errMsg);
  });
  if (aiCreditPill) {
    aiCreditPill.addEventListener("click", () => {
      if (aiCreditText) aiCreditText.textContent = t("checking");
      checkCreditStatus();
    });
  }
  const statusIndicatorWrap = document.getElementById("status-indicator-wrap");
  if (statusIndicatorWrap) {
    statusIndicatorWrap.addEventListener("click", () => {
      if (!serverOnline) {
        window.open("https://community.obsidian.md/plugins/nutegg", "_blank");
        return;
      }
      const title = document.getElementById("status-tooltip-title");
      const sub = document.getElementById("status-tooltip-sub");
      if (title) title.textContent = t("checking");
      if (sub) sub.textContent = t("connectingToObsidian");
      checkServerStatus();
    });
  }
  if (openSettingsKeyBtn) {
    openSettingsKeyBtn.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }
  if (aiKeyMissingBanner) {
    aiKeyMissingBanner.addEventListener("click", (e) => {
      if (e.target && (e.target.id === "open-settings-enable-ai-btn" || e.target.closest("#open-settings-enable-ai-btn"))) {
        chrome.tabs.create({ url: chrome.runtime.getURL("src/options/options.html?enableAi=1") });
        return;
      }
      if (e.target && (e.target.id === "open-settings-key-btn" || e.target.closest(".key-banner-link-btn"))) {
        chrome.runtime.openOptionsPage();
      }
    });
  }
  questionsToggle.addEventListener("click", () => {
    questionsArea.classList.toggle("hidden");
  });
  if (captureEggsToggle) {
    captureEggsToggle.addEventListener("click", () => {
      const isExpanded = !captureEggsArea.classList.toggle("hidden");
      captureEggsChevron.textContent = isExpanded ? "▾" : "▸";
    });
  }
  followupBtn.addEventListener("click", handleFollowUp);
  followupInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleFollowUp();
  });
  if (customQuestionsList) {
    customQuestionsList.addEventListener("click", handleSourcePillClick);
  }
  if (eggKnowledgeContent) {
    eggKnowledgeContent.addEventListener("click", handleSourcePillClick);
  }
  if (resultsState) {
    resultsState.addEventListener("click", handleSourcePillClick);
  }
  refreshBtn.addEventListener("click", handleRefresh);
  createEggBtn.addEventListener("click", handleCreateEgg);
  eggsCreateToggle.addEventListener("click", () => {
    const form = eggsCreateForm;
    const isHidden = form.classList.toggle("hidden");
    eggsCreateToggle.textContent = isHidden ? "➕ Create new egg" : "✕ Cancel";
  });
  eggsCreateBtn.addEventListener("click", handleCreateEggInline);
  reanalyzeEggsBtn.addEventListener("click", async () => {
    const pinnedTabId = activeTabId;
    const pinnedEggs = [...selectedEggs];
    if (pinnedEggs.length === 0 || reanalyzeEggsBtn.disabled) return;

    const hasContent = !!(extractedContent && extractedContent.content);
    if (!hasContent) {
      reanalyzeEggsBtn.disabled = true;
      const original = reanalyzeEggsBtn.textContent;
      reanalyzeEggsBtn.textContent = t("loadingContent");
      hideMessages();
      hideWarning();

      try {
        await extractPageContent(refreshSeq, pinnedTabId);
      } catch (err) {
        console.error("[NutEgg] Error extracting content on re-analyze eggs:", err);
      }

      if (activeTabId !== pinnedTabId) return;

      reanalyzeEggsBtn.disabled = false;
      reanalyzeEggsBtn.textContent = original;

      const nowHasContent = !!(extractedContent && extractedContent.content);
      if (!nowHasContent) {
        showError(t("couldNotRetrieveContent"));
        errorBanner.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
        return;
      }
    }

    if (activeTabId !== pinnedTabId) return;

    const notReady = getAnalyzeNotReadyReason();
    if (notReady) {
      showWarning(notReady);
      return;
    }
    reanalyzeEggsBtn.disabled = true;
    const original = reanalyzeEggsBtn.textContent;
    reanalyzeEggsBtn.textContent = `⏳ ${t("analyzing")}`;
    eggsErrorEl.classList.add("hidden");
    if (stage1ContentAnalysis) {
      await handleProceedStage2(pinnedEggs, false, false, pinnedTabId);
    } else {
      const error = await handleAnalyze(true, pinnedEggs, true);
      if (error && activeTabId === pinnedTabId) {
        eggsErrorEl.textContent = `❌ ${error}`;
        eggsErrorEl.classList.remove("hidden");
      }
    }
    if (activeTabId === pinnedTabId) {
      reanalyzeEggsBtn.disabled = false;
      reanalyzeEggsBtn.textContent = original;
    }
  });
  // Egg picker is collapsed by default — expand on demand
  eggsToggle.addEventListener("click", () => {
    const expanded = eggsExpanded.classList.toggle("hidden");
    eggsToggleChevron.textContent = expanded ? "▾" : "▸";
  });
  reanalyzeBtn.addEventListener("click", async () => {
    if (reanalyzeBtn.disabled) return;
    const pinnedTabId = activeTabId;

    const hasContent = !!(extractedContent && extractedContent.content);
    if (!hasContent) {
      reanalyzeBtn.disabled = true;
      reanalyzeBtn.textContent = t("loadingContent");
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
        errorBanner.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
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
  historySelect.addEventListener("change", () => {
    const idx = parseInt(historySelect.value, 10);
    if (captureHistory[idx]) showHistoryEntry(captureHistory[idx]);
  });

  // The side panel persists across tabs — refresh content when the user
  // switches to another tab or the active tab navigates to a new URL.
  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    if (activeTabId && activeTabId !== tabId && extractedContent) {
      const prevCache = tabResultCache.get(activeTabId) || {};
      tabResultCache.set(activeTabId, {
        ...prevCache,
        extractedContent,
        analysisResult,
        captureHistory: [...captureHistory],
        currentNutId,
        stage1Payload,
        stage1ContentAnalysis,
        eggHatched,
        nutCollected,
        followUpQa: [...followUpQa],
      });
    }
    activeTabId = tabId;
    // Check if we have cached results for this tab
    const cached = tabResultCache.get(tabId);
    if (cached && (cached.analysisResult || cached.status === "analyzing" || cached.status === "hatching" || cached.extractedContent)) {
      restoreFromTabCache(tabId, cached);
    } else if (tabsExtracting.has(tabId)) {
      // Tab is currently retrieving in the background — show retrieving state and let it finish
      contentPreview.textContent = t("retrievingPageContent");
      pageAuthorEl.textContent = "";
      pagePublishedEl.textContent = "";
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
        if (activeTabId && extractedContent) {
          const prevCache = tabResultCache.get(activeTabId) || {};
          tabResultCache.set(activeTabId, {
            ...prevCache,
            extractedContent,
            analysisResult,
            captureHistory: [...captureHistory],
            currentNutId,
            stage1Payload,
            stage1ContentAnalysis,
            eggHatched,
            nutCollected,
            followUpQa: [...followUpQa],
          });
        }
        activeTabId = tab.id;
        const cached = tabResultCache.get(tab.id);
        if (cached && (cached.analysisResult || cached.status === "analyzing" || cached.status === "hatching" || cached.extractedContent)) {
          restoreFromTabCache(tab.id, cached);
        } else if (tabsExtracting.has(tab.id)) {
          contentPreview.textContent = t("retrievingPageContent");
          pageAuthorEl.textContent = "";
          pagePublishedEl.textContent = "";
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
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      isActiveTab = activeTab?.id === tabId;
    } catch {}

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
      } else {
        // Background tab finished loading — extract in background if not already cached
        const cached = tabResultCache.get(tabId);
        if (!cached?.extractedContent && !cached?.analysisResult && !cached?.status && !tabsExtracting.has(tabId)) {
          extractPageContent(refreshSeq, tabId);
        }
      }
      return;
    }

    if (changeInfo.url) {
      // URL changed — invalidate its cache
      tabResultCache.delete(tabId);
      tabExtractSeq.delete(tabId);
      tabsExtracting.delete(tabId);
      if (isActiveTab) {
        refreshForCurrentTab();
      }
    }
  });

  // Clean up cache when tabs are closed
  chrome.tabs.onRemoved.addListener((tabId) => {
    tabResultCache.delete(tabId);
    tabExtractSeq.delete(tabId);
    tabsExtracting.delete(tabId);
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
  updateSectionChipsUI();

  // Accordion toggle listeners
  sectionsToggle?.addEventListener("click", () => {
    const isHidden = sectionsBody.classList.toggle("hidden");
    sectionsChevron.textContent = isHidden ? "▸" : "▾";
    sectionsToggle.setAttribute("aria-expanded", String(!isHidden));
  });

  reanalyzeSectionsToggle?.addEventListener("click", () => {
    const isHidden = reanalyzeSectionsBody.classList.toggle("hidden");
    reanalyzeSectionsChevron.textContent = isHidden ? "▸" : "▾";
    reanalyzeSectionsToggle.setAttribute("aria-expanded", String(!isHidden));
  });

  const allChips = [
    { el: chipVerdict, key: "titleVerdict" },
    { el: chipSummary, key: "coreSummary" },
    { el: chipMindmap, key: "mindMap" },
    { el: chipChapters, key: "chapterMap" },
    { el: reanalyzeChipVerdict, key: "titleVerdict" },
    { el: reanalyzeChipSummary, key: "coreSummary" },
    { el: reanalyzeChipMindmap, key: "mindMap" },
    { el: reanalyzeChipChapters, key: "chapterMap" },
  ];

  allChips.forEach(({ el, key }) => {
    if (!el) return;
    el.addEventListener("click", async () => {
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
    });
  });
}

/** Update chip visual states (active vs inactive) and active count badges */
function updateSectionChipsUI() {
  const map = [
    { el: chipVerdict, key: "titleVerdict" },
    { el: chipSummary, key: "coreSummary" },
    { el: chipMindmap, key: "mindMap" },
    { el: chipChapters, key: "chapterMap" },
    { el: reanalyzeChipVerdict, key: "titleVerdict" },
    { el: reanalyzeChipSummary, key: "coreSummary" },
    { el: reanalyzeChipMindmap, key: "mindMap" },
    { el: reanalyzeChipChapters, key: "chapterMap" },
  ];
  map.forEach(({ el, key }) => {
    if (!el) return;
    const active = enabledSections[key] !== false;
    if (active) {
      el.classList.add("active");
      el.classList.remove("inactive");
    } else {
      el.classList.remove("active");
      el.classList.add("inactive");
    }
  });

  // Calculate active count
  const total = 4;
  const activeCount = [
    enabledSections.titleVerdict !== false,
    enabledSections.coreSummary !== false,
    enabledSections.mindMap !== false,
    enabledSections.chapterMap !== false,
  ].filter(Boolean).length;

  const badgeText = `${activeCount}/${total}`;
  if (sectionsBadge) sectionsBadge.textContent = badgeText;
  if (reanalyzeSectionsBadge) reanalyzeSectionsBadge.textContent = badgeText;
}

let refreshSeq = 0;

/**
 * Re-run the capture flow for the currently active tab: reset state, check if
 * content has been captured before, and retrieve fresh content if needed.
 * `refreshSeq` guards against interleaved refreshes on rapid tab switches.
 */
async function refreshForCurrentTab(forceExtract = false) {
  const seq = ++refreshSeq;
  customQuestionsEl.value = "";
  followupInput.value = "";
  preSelectedEggs.clear();
  updateCaptureEggsLabel();
  isReanalyzing = false;
  processedNote.classList.add("hidden");
  historySelect.classList.add("hidden");
  historySelect.innerHTML = "";
  captureHistory = []; // fresh URL — old history doesn't apply
  extractedContent = null;
  contentPreview.textContent = t("loadingContent");
  pageAuthorEl.textContent = "";
  pagePublishedEl.textContent = "";
  currentTabLoading = false;
  updateAnalyzeButtonsState();
  showCaptureState();

  let tabUrl = "";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id != null) {
      activeTabId = tab.id;
      if (forceExtract) {
        tabResultCache.delete(tab.id);
      }
    }
    if (tab?.status === "loading") currentTabLoading = true;
    if (tab?.url) {
      tabUrl = tab.url;
      pageTitle.textContent = tab.title || t("loading");
      pageUrl.textContent = tab.url;
      pageType.textContent = detectPageTypeFromUrl(tab.url);
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
  await extractPageContent(seq);
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
  extractedContent = cached.extractedContent;
  analysisResult = cached.analysisResult;
  captureHistory = cached.captureHistory || [];
  currentNutId = cached.currentNutId || (cached.captureHistory?.[0]?.nutId ?? null);
  stage1Payload = cached.stage1Payload || stage1Payload;
  stage1ContentAnalysis = cached.stage1ContentAnalysis || stage1ContentAnalysis;
  followUpQa = cached.followUpQa ? [...cached.followUpQa] : [];
  if (followupInput) followupInput.value = "";
  currentTabLoading = false;

  // Update header and capture preview so capture state is ready if user switches back
  pageTitle.textContent = extractedContent?.title || "Untitled";
  pageUrl.textContent = extractedContent?.url || "";
  pageType.textContent = extractedContent?.sourceType || "";
  contentPreview.textContent = extractedContent?.content || t("noContentExtracted");
  showProvenance(extractedContent?.metadata || {});

  if (cached.status === "analyzing") {
    if (cached.analysisResult) {
      // Re-analysis in flight: keep showing results view with analyzing indicator
      showResultsState(cached.analysisResult, provenanceFromExtraction(extractedContent));
      if (reanalyzeBtn) {
        reanalyzeBtn.disabled = true;
        reanalyzeBtn.textContent = t("analyzing");
      }
      if (historySelect) historySelect.disabled = true;
      analyzeBtn.disabled = true;
      analyzeBtnText.textContent = t("analyzing");
      processedNote.classList.remove("hidden");
      processedMessage.textContent = t("analyzingContent");
    } else {
      showCaptureState();
      if (extractedContent) {
        contentPreview.textContent = extractedContent.content || t("noContentExtracted");
      }
      analyzeBtn.disabled = true;
      analyzeBtnText.textContent = t("analyzing");
    }
  } else if (cached.status === "hatching") {
    if (analysisResult) {
      showResultsState(analysisResult, provenanceFromExtraction(extractedContent));
    }
    if (stage1ProceedBtn) {
      stage1ProceedBtn.disabled = true;
      stage1ProceedBtn.textContent = t("hatchingEggWaiting");
    }
    if (reanalyzeBtn) {
      reanalyzeBtn.disabled = true;
      reanalyzeBtn.textContent = t("comparingKnowledge");
    }
    if (historySelect) historySelect.disabled = true;
    analyzeBtn.disabled = true;
    analyzeBtnText.textContent = t("analyzing");
  } else if (analysisResult) {
    if (cached.eggHatched) eggHatched = true;
    if (cached.nutCollected) nutCollected = true;
    showResultsState(analysisResult, provenanceFromExtraction(extractedContent));
    updateAnalyzeButtonsState();
    if (historySelect) historySelect.disabled = false;
    if (cached.eggHatched) updateActionButtons();
    if (captureHistory.length > 0) {
      const entry = (currentNutId != null && captureHistory.find((h) => String(h.nutId) === String(currentNutId))) || captureHistory[0];
      const when = new Date(entry.capturedAt).toLocaleString();
      const stateLabel = entry.saved === "saved"
        ? t("stateSaved") : entry.saved === "skip" ? t("stateCollected") : t("stateAnalyzed");
      if (cached.justReanalyzed) {
        processedMessage.textContent = t("reanalyzedFreshResult");
        delete cached.justReanalyzed;
      } else {
        processedMessage.textContent = t("capturedWhenStored", { when, state: stateLabel });
      }
      processedNote.classList.remove("hidden");
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
  const name = newEggName.value.trim();
  if (!name || createEggBtn.disabled) return;
  createEggBtn.disabled = true;
  createEggBtn.textContent = t("creatingEgg");
  try {
    const response = await chrome.runtime.sendMessage({
      action: "create-egg",
      name,
      description: newEggDescription.value.trim(),
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
    createEggBtn.disabled = false;
    createEggBtn.textContent = t("createEggBtn");
  }
}

/** 🐣 Create an egg from the inline form inside the egg picker. */
async function handleCreateEggInline() {
  const pinnedTabId = activeTabId;
  const name = eggsNewName.value.trim();
  if (!name || eggsCreateBtn.disabled) return;
  eggsCreateBtn.disabled = true;
  eggsCreateBtn.textContent = t("creatingEgg");
  try {
    const response = await chrome.runtime.sendMessage({
      action: "create-egg",
      name,
      description: eggsNewDesc.value.trim(),
    });
    if (response?.success) {
      if (activeTabId !== pinnedTabId) return;
      // Re-analyze with the new egg included
      await handleAnalyze(true);
      return;
    }
    if (activeTabId === pinnedTabId) {
      eggsErrorEl.textContent = `❌ ${response?.error || t("failedToCreateEgg")}`;
      eggsErrorEl.classList.remove("hidden");
    }
  } catch (err) {
    if (activeTabId === pinnedTabId) {
      eggsErrorEl.textContent = `❌ ${err instanceof Error ? err.message : t("failedToCreateEgg")}`;
      eggsErrorEl.classList.remove("hidden");
    }
  }
  if (activeTabId === pinnedTabId) {
    eggsCreateBtn.disabled = false;
    eggsCreateBtn.textContent = t("createEggBtn");
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
  if (!captureEggsList || !captureEggsToggle) return;
  if (allEggs.length === 0) {
    captureEggsToggle.classList.add("hidden");
    return;
  }
  captureEggsToggle.classList.remove("hidden");
  captureEggsList.innerHTML = allEggs
    .map((e) => {
      const checked = preSelectedEggs.has(e.fileName) ? "checked" : "";
      return `<label class="egg-row">
        <input type="checkbox" data-capture-egg="${escapeHtml(e.fileName)}" ${checked} />
        <span class="egg-row-name">${escapeHtml(e.fileName)}</span>
        <span class="egg-row-desc">${escapeHtml(e.description || e.topic || "")}</span>
      </label>`;
    })
    .join("");

  captureEggsList.querySelectorAll("input").forEach((cb) => {
    cb.addEventListener("change", (ev) => {
      const name = ev.target.dataset.captureEgg;
      if (ev.target.checked) preSelectedEggs.add(name);
      else preSelectedEggs.delete(name);
      updateCaptureEggsLabel();
    });
  });
  updateCaptureEggsLabel();
}

function updateCaptureEggsLabel() {
  if (!captureEggsLabel) return;
  if (preSelectedEggs.size === 0) {
    captureEggsLabel.textContent = t("autoDetect");
  } else if (preSelectedEggs.size === 1) {
    const egg = [...preSelectedEggs][0].split("/").pop();
    captureEggsLabel.textContent = `(${egg})`;
  } else {
    captureEggsLabel.textContent = t("countSelected", { count: preSelectedEggs.size });
  }
}

/**
 * Render the egg picker: the matched eggs are checked; changing any box
 * reveals the "Re-analyze with selected eggs" button.
 */
function renderEggsSection(matchedEggs) {
  // Include matched eggs that are missing from the index list (index drift)
  for (const m of matchedEggs) {
    if (!allEggs.some((e) => e.fileName === m)) {
      allEggs.push({ fileName: m, description: "", topic: "" });
    }
  }

  if (allEggs.length === 0) {
    eggsSection.classList.add("hidden");
    eggsList.innerHTML = "";
    return;
  }

  selectedEggs = new Set(matchedEggs);
  eggsSection.classList.remove("hidden");
  // Collapsed by default — the checklist only appears when asked for
  eggsExpanded.classList.add("hidden");
  eggsToggleChevron.textContent = "▸";
  eggsErrorEl.classList.add("hidden");
  eggsToggleLabel.textContent = matchedEggs.length > 0
    ? t("countMatched", { count: matchedEggs.length })
    : t("noneMatched");
  eggsList.innerHTML = allEggs
    .map((e) => {
      const checked = selectedEggs.has(e.fileName) ? "checked" : "";
      return `<label class="egg-row">
        <input type="checkbox" data-egg="${escapeHtml(e.fileName)}" ${checked} />
        <span class="egg-row-name">${escapeHtml(e.fileName)}</span>
        <span class="egg-row-desc">${escapeHtml(e.description || e.topic || "")}</span>
      </label>`;
    })
    .join("");
  eggsList.querySelectorAll("input").forEach((cb) => {
    cb.addEventListener("change", (ev) => {
      const name = ev.target.dataset.egg;
      if (ev.target.checked) selectedEggs.add(name);
      else selectedEggs.delete(name);
      if (analysisResult?.stage === "stage1") {
        reanalyzeEggsBtn?.classList.add("hidden");
      } else {
        reanalyzeEggsBtn?.classList.remove("hidden");
      }
      updateStage1ProceedBtn();
    });
  });
  reanalyzeEggsBtn.classList.add("hidden");

  // Reset inline create-egg form
  eggsCreateForm.classList.add("hidden");
  eggsCreateToggle.textContent = t("createNewEgg");
  eggsNewName.value = "";
  eggsNewDesc.value = "";
  eggsCreateBtn.disabled = false;
  eggsCreateBtn.textContent = t("createEggBtn");
}

function setAnalysisMode(mode) {
  analysisMode = mode;
  if (mode === "confirm") {
    modeConfirmBtn?.classList.add("active");
    modeFastBtn?.classList.remove("active");
  } else {
    modeFastBtn?.classList.add("active");
    modeConfirmBtn?.classList.remove("active");
  }
  chrome.storage?.local?.set?.({ analysisMode: mode });

  if (analysisResult?.stage === "stage1") {
    if (mode === "confirm") {
      stage1ConfirmBox?.classList.remove("hidden");
      verdictSection?.classList.add("hidden");
      eggKnowledgeSection?.classList.add("hidden");
      eggsExpanded?.classList.remove("hidden");
      if (eggsToggleChevron) eggsToggleChevron.textContent = "▾";
      updateStage1ProceedBtn();
      window.scrollTo(0, 0);
    } else {
      stage1ConfirmBox?.classList.add("hidden");
      verdictSection?.classList.remove("hidden");
    }
  }
}

function updateStage1ProceedBtn() {
  if (!stage1ProceedBtn) return;
  const count = selectedEggs.size;
  const confirmTextEl = document.getElementById("stage1-confirm-text");
  if (count === 0) {
    stage1ProceedBtn.disabled = true;
    stage1ProceedBtn.textContent = t("hatchEggSelectEgg");
    if (confirmTextEl) {
      if (allEggs.length === 0) {
        confirmTextEl.innerHTML = t("stage1NoEggsNotice");
      } else {
        confirmTextEl.innerHTML = t("stage1NoSelectedNotice");
      }
    }
  } else {
    stage1ProceedBtn.disabled = false;
    stage1ProceedBtn.textContent = count === 1 ? t("hatchEgg") : t("hatchEggCount", { count });
    if (confirmTextEl) {
      confirmTextEl.innerHTML = t("stage1SelectedNotice", { count });
    }
  }
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
      if (eggsExpanded) eggsExpanded.classList.remove("hidden");
      if (eggsToggleChevron) eggsToggleChevron.textContent = "▾";
      const eggSec = document.getElementById("eggs-section");
      if (eggSec) eggSec.scrollIntoView({ behavior: "smooth", block: "nearest" });
      showWarning(t("selectEggWarning"));
    }
    return;
  }

  if (isPinnedActive) {
    if (stage1ProceedBtn) {
      stage1ProceedBtn.disabled = true;
      stage1ProceedBtn.textContent = autoSave ? t("hatchingEggWaiting") : t("analyzing");
    }
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
    }

    const url = base?.url || content?.url || pageUrl?.textContent || "";
    const title = base?.title || content?.title || pageTitle?.textContent || "";
    const bodyContent = base?.content || content?.content || "";
    const sourceType = base?.sourceType || content?.sourceType || "generic";
    const metadata = base?.metadata || content?.metadata;
    const chapters = base?.chapters || content?.chapters;
    const questions = base?.questions || (customQuestionsEl?.value ? customQuestionsEl.value.split("\n").map((q) => q.trim()).filter(Boolean) : []);

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
        customQuestionAnswers: [],
      },
    };

    const response = await sendAnalyzeViaPort(payload);
    if (response?.error) {
      if (targetPinnedId) tabResultCache.delete(targetPinnedId);
      if (activeTabId === targetPinnedId) {
        showError(response.error, response.errorCode);
        if (stage1ProceedBtn) {
          stage1ProceedBtn.disabled = false;
          updateStage1ProceedBtn();
        }
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
        processedMessage.textContent = t("reanalyzedFreshResult");
        processedNote.classList.remove("hidden");
      }
    }
    if (!skipScroll) {
      setTimeout(() => {
        const target = eggKnowledgeSection && !eggKnowledgeSection.classList.contains("hidden")
          ? eggKnowledgeSection
          : verdictSection;
        if (target && !target.classList.contains("hidden")) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  } catch (err) {
    if (activeTabId === targetPinnedId) {
      showError(err instanceof Error ? err.message : t("hatchingFailed"));
      if (stage1ProceedBtn) {
        stage1ProceedBtn.disabled = false;
        updateStage1ProceedBtn();
      }
    }
  }
}

// --- Metrics ---

function applyMetrics(data) {
  if (!data) return;
  if (metricNuts && data.nuts != null) metricNuts.textContent = data.nuts;
  if (metricEggs && data.eggs != null) metricEggs.textContent = data.eggs;
  if (metricTime && data.timeSaved != null) metricTime.textContent = data.timeSaved;
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
  const versionTag = document.getElementById("version-tag");
  const extVersion = chrome.runtime?.getManifest?.()?.version;
  if (!versionTag || !extVersion) return;

  if (pluginVersion && pluginVersion !== extVersion) {
    versionTag.textContent = `NutEgg v${extVersion} (Obsidian v${pluginVersion})`;
    versionTag.title = t("versionMismatchFull", { extVersion, pluginVersion });
    versionTag.style.color = "#d97706";
  } else {
    versionTag.textContent = `NutEgg v${extVersion}`;
    versionTag.title = pluginVersion
      ? `NutEgg v${extVersion} (Obsidian plugin v${pluginVersion})`
      : `NutEgg v${extVersion}`;
    versionTag.style.color = "";
  }
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
    aiCreditPill?.classList.add("hidden");
    return;
  }
  try {
    const credit = await chrome.runtime.sendMessage({ action: "get-credit" });
    renderCreditPill(credit);
  } catch {
    aiCreditPill?.classList.add("hidden");
  }
}

function renderCreditPill(credit) {
  if (!credit || credit.error || !serverOnline) {
    aiCreditPill?.classList.add("hidden");
    return;
  }
  aiCreditPill?.classList.remove("hidden");

  const providerName =
    credit.source === "openrouter"
      ? "OpenRouter"
      : credit.provider === "anthropic"
      ? "Claude"
      : credit.provider === "kimi"
      ? "Kimi"
      : credit.provider === "gemini"
      ? "Gemini"
      : credit.provider === "openai"
      ? "OpenAI"
      : credit.provider === "local"
      ? (credit.model ? `Local (${credit.model})` : "Local LLM")
      : credit.providerLabel || credit.provider;

  if (credit.hasBalance && credit.balanceFormatted) {
    aiCreditText.textContent = `${providerName}: ${credit.balanceFormatted}`;
    aiCreditPill.title = t("aiCreditTooltip");
    aiCreditPill.classList.remove("has-warning");
  } else {
    aiCreditText.textContent = providerName;
    aiCreditPill.title = t("aiCreditTooltip");
    aiCreditPill.classList.remove("has-warning");
  }
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
    obsidianPluginLink?.classList.add("hidden");

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
      aiCreditPill?.classList.add("hidden");
    }

    obsidianPluginLink?.classList.remove("hidden");
    updateServerStatusIndicator();
  }

  updateCaptureBanners();
  updateAnalyzeButtonsState();
}

async function checkChromeCreditStatus() {
  try {
    const credit = await chrome.runtime.sendMessage({ action: "check-chrome-credit" });
    if (credit && !serverOnline) {
      aiCreditPill?.classList.remove("hidden");
      const providerLabel = credit.providerLabel || chromeAiProvider || "Chrome AI";
      if (credit.hasBalance && credit.balanceFormatted) {
        aiCreditText.textContent = credit.balanceFormatted;
        aiCreditPill.title = t("aiCreditTooltip");
      } else {
        aiCreditText.textContent = providerLabel;
        aiCreditPill.title = t("aiCreditTooltip");
      }
    }
  } catch {}
}

function updateCaptureBanners() {
  if (serverOnline) {
    aiKeyMissingBanner?.classList.add("hidden");
    chromeModeTipBanner?.classList.add("hidden");
    return;
  }

  // Obsidian is offline
  if (chromeAiConfigured) {
    aiKeyMissingBanner?.classList.add("hidden");
    chromeModeTipBanner?.classList.remove("hidden");
  } else {
    chromeModeTipBanner?.classList.add("hidden");
    if (aiKeyMissingBanner) {
      aiKeyMissingBanner.classList.remove("hidden");
      if (chromeAiEnabled) {
        aiKeyMissingBanner.innerHTML = `
          <span class="key-banner-icon">⚠️</span>
          <div class="key-banner-content">
            ${t("aiKeyRequiredChrome")}
            <div class="key-banner-actions">
              <button id="open-settings-key-btn" type="button" class="key-banner-link-btn">${escapeHtml(t("openSettingsKeyBtn"))}</button>
              <span>${escapeHtml(t("orStartObsidian"))} <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener" class="key-banner-link">Obsidian</a></span>
            </div>
          </div>
        `;
      } else {
        aiKeyMissingBanner.innerHTML = `
          <span class="key-banner-icon">⚪</span>
          <div class="key-banner-content">
            ${t("obsidianOfflineBanner")}
            <div class="key-banner-actions">
              <button id="open-settings-enable-ai-btn" type="button" class="key-banner-link-btn">${escapeHtml(t("enableChromeAiBtn"))}</button>
              <span>${escapeHtml(t("orStartObsidian"))} <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener" class="key-banner-link">Obsidian</a></span>
            </div>
          </div>
        `;
      }
    }
  }
}

function updateServerStatusIndicator() {
  if (serverOnline) {
    const mismatch = getVersionMismatchIssue(obsidianPluginVersion);
    if (mismatch) {
      serverStatus.className = "status-dot warning";
      updateServerStatusTooltip("obsidian-mismatch", obsidianPluginVersion, mismatch);
    } else if (!obsidianAiConfigured) {
      serverStatus.className = "status-dot warning";
      updateServerStatusTooltip("obsidian-no-key", obsidianPluginVersion);
    } else {
      serverStatus.className = "status-dot online";
      updateServerStatusTooltip("obsidian-online", obsidianPluginVersion);
    }
    return;
  }

  // Obsidian offline
  if (chromeAiConfigured) {
    serverStatus.className = "status-dot chrome-ai";
    updateServerStatusTooltip("chrome-ai", null, chromeAiProvider);
  } else if (chromeAiEnabled) {
    serverStatus.className = "status-dot warning";
    updateServerStatusTooltip("chrome-no-key", null, chromeAiProvider);
  } else {
    serverStatus.className = "status-dot offline";
    updateServerStatusTooltip("offline");
  }
}

function updateServerStatusTooltip(state, version = null, extra = null) {
  const tooltip = document.getElementById("server-status-tooltip");
  const title = document.getElementById("status-tooltip-title");
  const sub = document.getElementById("status-tooltip-sub");
  if (!tooltip || !title || !sub) return;

  if (state === "obsidian-online") {
    tooltip.className = "status-tooltip online";
    title.textContent = t("obsidianOnline");
    sub.textContent = version ? t("pluginVersionFull", { version }) : t("readyToCapture");
    serverStatus.setAttribute("aria-label", t("obsidianOnlineAria", { version: version ? ` (v${version})` : "" }));
  } else if (state === "obsidian-no-key") {
    tooltip.className = "status-tooltip warning";
    title.textContent = t("obsidianOnlineNoKey");
    sub.textContent = t("addKeyInObsidian");
    serverStatus.setAttribute("aria-label", t("obsidianNoKeyConfig"));
  } else if (state === "obsidian-mismatch") {
    tooltip.className = "status-tooltip warning";
    title.textContent = t("versionMismatch");
    sub.textContent = extra || t("updateNutEggPlugin");
    serverStatus.setAttribute("aria-label", extra || t("versionMismatch"));
  } else if (state === "chrome-ai") {
    tooltip.className = "status-tooltip chrome-ai";
    title.textContent = t("usingChromeAi");
    sub.textContent = t("usingChromeAiSub", { extra: extra || t("standalone") });
    serverStatus.setAttribute("aria-label", `${t("usingChromeAi")} (${extra || t("standalone")})`);
  } else if (state === "chrome-no-key") {
    tooltip.className = "status-tooltip warning";
    title.textContent = t("chromeAiNoKey");
    sub.textContent = t("addKeyInChrome");
    serverStatus.setAttribute("aria-label", t("chromeAiNoKeyConfig"));
  } else {
    tooltip.className = "status-tooltip offline";
    title.textContent = t("obsidianOffline");
    sub.textContent = t("startObsidianOrChromeAi");
    serverStatus.setAttribute("aria-label", t("obsidianOfflineStart"));
  }
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
  const currentTabStatus = tabResultCache.get(activeTabId)?.status;
  const isAnalyzing = currentTabStatus === "analyzing" || currentTabStatus === "hatching";

  if (isAnalyzing) {
    analyzeBtn.disabled = true;
    analyzeBtn.classList.remove("inactive");
    analyzeBtnText.textContent = t("analyzing");
    if (reanalyzeBtn) {
      reanalyzeBtn.disabled = true;
      reanalyzeBtn.classList.remove("inactive");
      reanalyzeBtn.textContent = t("analyzing");
    }
    return;
  }

  analyzeBtn.disabled = false;
  if (reanalyzeBtn) reanalyzeBtn.disabled = false;

  const notReady = getAnalyzeNotReadyReason();
  const hasContent = !!(extractedContent && extractedContent.content);

  if (notReady) {
    analyzeBtn.classList.add("inactive");

    if (isTranscriptBlocked()) {
      analyzeBtnText.textContent = t("transcriptUnavailable");
    } else if (currentTabLoading || extractionPending) {
      analyzeBtnText.textContent = t("loadingContent");
    } else {
      analyzeBtnText.textContent = t("analyzeBtn");
    }
    analyzeBtn.title = notReady;

    if (reanalyzeBtn) {
      if (!hasContent) {
        if (extractionPending) {
          reanalyzeBtn.disabled = true;
          reanalyzeBtn.classList.remove("inactive");
          reanalyzeBtn.textContent = t("loadingContent");
          reanalyzeBtn.title = t("retrievingPageContent");
        } else {
          reanalyzeBtn.disabled = false;
          reanalyzeBtn.classList.remove("inactive");
          reanalyzeBtn.textContent = t("loadAndReanalyze");
          reanalyzeBtn.title = t("loadAndReanalyzeTitle");
        }
      } else {
        reanalyzeBtn.disabled = false;
        reanalyzeBtn.classList.add("inactive");
        reanalyzeBtn.textContent = t("reanalyze");
        reanalyzeBtn.title = notReady;
      }
    }
  } else {
    analyzeBtn.classList.remove("inactive");
    analyzeBtnText.textContent = analysisResult ? t("analyzeAgain") : t("analyzeBtn");
    analyzeBtn.title = "";
    if (reanalyzeBtn) {
      reanalyzeBtn.disabled = false;
      reanalyzeBtn.classList.remove("inactive");
      reanalyzeBtn.title = "";
      reanalyzeBtn.textContent = t("reanalyze");
    }
  }
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
  }

  if (!tabId) {
    if (!targetTabId || targetTabId === activeTabId) pageTitle.textContent = t("unknownPage");
    return null;
  }

  const isBackground = tabId !== activeTabId;
  const isTargetActive = !isBackground;

  // For background tabs: ONLY extract if content is already loaded!
  if (isBackground && tabStatus !== "complete") {
    return null;
  }

  const tabSeq = (tabExtractSeq.get(tabId) || 0) + 1;
  tabExtractSeq.set(tabId, tabSeq);
  tabsExtracting.add(tabId);

  if (isTargetActive) {
    extractionFailed = false;
    lastLoadWasLoading = false;
    extractionPending = true;
    refreshBtn.disabled = false; // Always clickable to cancel and retry!
    contentPreview.textContent = t("retrievingPageContent");
    pageAuthorEl.textContent = "";
    pagePublishedEl.textContent = "";
    pageTitle.textContent = tabTitle || t("retrieving");
    pageUrl.textContent = tabUrl || "";
    pageType.textContent = detectPageTypeFromUrl(tabUrl || "");
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
          pageTitle.textContent = tabTitle || pageTitle.textContent;
          pageUrl.textContent = tabUrl || pageUrl.textContent;
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
        extractedContent: response.content,
      });

      // Update UI only if this tab is currently the active tab
      if (activeTabId === tabId) {
        extractedContent = response.content;
        currentTabLoading = false;
        pageTitle.textContent = response.content.title || tabTitle || "Untitled";
        pageType.textContent = response.content.sourceType || pageType.textContent;
        contentPreview.textContent = response.content.content || "(No content extracted)";
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
    tabsExtracting.delete(tabId);
    if (activeTabId === tabId && tabExtractSeq.get(tabId) === tabSeq) {
      extractionPending = false;
      refreshBtn.disabled = false;
      updateAnalyzeButtonsState();
    }
  }

  if (activeTabId === tabId && tabExtractSeq.get(tabId) === tabSeq) {
    if (extractionFailed && !extractedContent) {
      contentPreview.textContent = t("couldNotExtractContent");
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
      currentTabLoading = false;
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
  const author = metadata.author || metadata.channel || metadata.handle || "";
  pageAuthorEl.textContent = author ? `✍️ ${author}` : "";
  pagePublishedEl.textContent = metadata.published
    ? `📅 ${formatPublishedDate(metadata.published)}`
    : "";
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
  if (!prov?.title) {
    resultPageInfo.classList.add("hidden");
    return;
  }
  resultPageInfo.classList.remove("hidden");
  resultPageTitle.textContent = prov.title;
  resultPageAuthor.textContent = prov.author ? `✍️ ${prov.author}` : "";
  resultPagePublished.textContent = prov.publishedAt
    ? `📅 ${formatPublishedDate(prov.publishedAt)}`
    : "";
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
      port.onMessage.addListener((response) => {
        if (settled) return;
        settled = true;
        try { port.disconnect(); } catch {}
        resolve(response);
      });
      port.onDisconnect.addListener(() => {
        if (settled) return;
        settled = true;
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
      processedNote.classList.remove("hidden");
      processedMessage.textContent = t("analyzingContent");
      if (reanalyzeBtn) {
        reanalyzeBtn.disabled = true;
        reanalyzeBtn.textContent = t("analyzing");
      }
    }
    if (historySelect) historySelect.disabled = true;
    analyzeBtn.disabled = true;
    analyzeBtnText.textContent = t("analyzing");
  }

  try {
    const questions = customQuestionsEl.value
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

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
      tabResultCache.delete(pinnedTabId);
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
    const shouldRunStage2 = !isChromeMode && (isReanalyze || analysisMode === "fast");
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
        captureHistory: [...captureHistory],
        currentNutId: currentNutId || existingCache2.currentNutId,
      });

      if (activeTabId === pinnedTabId) {
        stage1Payload = payload;
        stage1ContentAnalysis = response;
        cachedProcessedSaved = null;
        followUpQa = [];
        followupInput.value = "";
        nutCollected = false;
        eggHatched = false;
        activeEggTab = null;
        analysisResult = response;

        showResultsState(response, provenanceFromExtraction(contentToAnalyze));

        if (isReanalyze) {
          processedNote.classList.remove("hidden");
          processedMessage.textContent = t("comparingAgainstSelected");
          if (reanalyzeBtn) {
            reanalyzeBtn.disabled = true;
            reanalyzeBtn.textContent = t("comparingKnowledge");
          }
        }

        if (eggsForStage2.length > 0) {
          if (!isReanalyze) {
            if (verdictSection) verdictSection.classList.remove("hidden");
            if (verdictBadge) verdictBadge.className = "verdict-badge";
            if (verdictIcon) verdictIcon.textContent = "⏳";
            if (verdictText) verdictText.textContent = t("comparingKnowledge");
            if (verdictReason) {
              verdictReason.textContent = t("comparingAgainstEggs", { count: eggsForStage2.length });
            }
          } else {
            if (verdictSection) verdictSection.classList.add("hidden");
          }
          if (stage1ConfirmBox) stage1ConfirmBox.classList.add("hidden");
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
          processedMessage.textContent = t("reanalyzedFreshResult");
          processedNote.classList.remove("hidden");
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
      if (stage1NutId) {
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
      const updatedHistory = freshHistory || (stage1Entry ? [stage1Entry, ...captureHistory] : captureHistory);

      tabResultCache.set(pinnedTabId, {
        status: "done",
        url: contentToAnalyze.url,
        extractedContent: contentToAnalyze,
        analysisResult: response,
        stage1Payload: { ...payload, nutId: stage1NutId },
        stage1ContentAnalysis: response,
        currentNutId: stage1NutId || currentNutId,
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
        followupInput.value = "";
        nutCollected = false;
        eggHatched = false;
        activeEggTab = null;
        analysisResult = response;
        showResultsState(response, provenanceFromExtraction(contentToAnalyze));
        if (isReanalyze || captureHistory.length > 0) {
          processedMessage.textContent = isReanalyze ? "Re-analyzed just now — showing fresh result." : "Analyzed (Stage 1) — choose eggs to hatch.";
          processedNote.classList.remove("hidden");
          renderHistorySelect(currentNutId);
        }
      }
    }

    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    tabResultCache.delete(pinnedTabId);
    if (activeTabId === pinnedTabId) {
      showError(message);
    }
    return message;
  } finally {
    isReanalyzing = false;
    if (activeTabId === pinnedTabId) {
      if (historySelect) historySelect.disabled = false;
      const activeCache = tabResultCache.get(activeTabId);
      if (!activeCache || (activeCache.status !== "analyzing" && activeCache.status !== "hatching")) {
        updateAnalyzeButtonsState();
      }
    }
  }
}

// --- Collapsible Results Sections ---

/** Initialize collapsible behavior for all result sections. */
function initCollapsibleSections() {
  document.querySelectorAll("#results-state .result-section").forEach((section) => {
    const header = section.querySelector(".section-header");
    const content = section.querySelector(".section-content");
    const chevron = section.querySelector(".section-chevron");
    if (!header || !content || !chevron) return;

    if (header.dataset.collapsibleInit) return;
    header.dataset.collapsibleInit = "true";

    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.setAttribute("aria-expanded", "true");
    header.setAttribute("title", "Click to collapse / expand section");

    const toggle = (e) => {
      if (e.target.closest("button, a, input, select, textarea")) return;
      const isCollapsed = content.classList.toggle("collapsed");
      chevron.classList.toggle("collapsed", isCollapsed);
      const svg = chevron.querySelector("svg");
      if (!svg) {
        chevron.textContent = isCollapsed ? "▸" : "▾";
      }
      header.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
    };

    header.addEventListener("click", toggle);
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(e);
      }
    });
  });
}

/** Reset all result sections to expanded state. */
function resetCollapsibleSections() {
  document.querySelectorAll("#results-state .result-section").forEach((section) => {
    const header = section.querySelector(".section-header");
    const content = section.querySelector(".section-content");
    const chevron = section.querySelector(".section-chevron");
    if (content && chevron && header) {
      content.classList.remove("collapsed");
      chevron.classList.remove("collapsed");
      const svg = chevron.querySelector("svg");
      if (!svg) {
        chevron.textContent = "▾";
      }
      header.setAttribute("aria-expanded", "true");
    }
  });
}

// --- Show results ---

function showResultsState(result, provenance = null) {
  analysisResult = result;
  captureState.classList.add("hidden");
  resultsState.classList.remove("hidden");
  initCollapsibleSections();
  if (!isReanalyzing) {
    resetCollapsibleSections();
  }
  processedNote.classList.remove("hidden");
  if (!processedMessage.textContent) {
    const entry = (currentNutId != null && captureHistory.find((h) => String(h.nutId) === String(currentNutId))) || captureHistory[0];
    if (entry) {
      const when = new Date(entry.capturedAt).toLocaleString();
      const stateLabel = entry.saved === "saved"
        ? t("stateSaved") : entry.saved === "skip" ? t("stateCollected") : t("stateAnalyzed");
      processedMessage.textContent = t("capturedWhenStored", { when, state: stateLabel });
    } else {
      processedMessage.textContent = t("analysisCompleteAdjust");
    }
  }
  updateSectionChipsUI();
  if (!isReanalyzing) {
    updateAnalyzeButtonsState();
    if (historySelect) historySelect.disabled = false;
  }
  renderHistorySelect(currentNutId);
  renderResultProvenance(provenance);

  const isChromeMode = result.mode === "chrome" || (!serverOnline && !result.matchedEggs?.length);
  const isStage1 = result.stage === "stage1" || isChromeMode;

  if (isChromeMode) {
    chromeResultBanner?.classList.remove("hidden");
    chromeActionsCard?.classList.remove("hidden");
    stage1ConfirmBox?.classList.add("hidden");
    verdictSection?.classList.add("hidden");
    noEggSection?.classList.add("hidden");
    eggKnowledgeSection?.classList.add("hidden");
    confirmBtn?.classList.add("hidden");
    collectNutBtn?.classList.add("hidden");
  } else {
    chromeResultBanner?.classList.add("hidden");
    chromeActionsCard?.classList.add("hidden");
    collectNutBtn?.classList.remove("hidden");

    if (isStage1) {
      if (isReanalyzing) {
        stage1ConfirmBox?.classList.add("hidden");
        verdictSection?.classList.add("hidden");
      } else if (analysisMode === "fast") {
        stage1ConfirmBox?.classList.add("hidden");
        verdictSection?.classList.remove("hidden");
      } else {
        stage1ConfirmBox?.classList.remove("hidden");
        verdictSection?.classList.add("hidden");
      }
      confirmBtn?.classList.add("hidden");
    } else {
      stage1ConfirmBox?.classList.add("hidden");
      verdictSection?.classList.remove("hidden");
    }

    // No egg matched — offer to create one
    const noEgg = (result.matchedEggs || []).length === 0;
    if (noEgg) {
      noEggSection.classList.remove("hidden");
      newEggName.value = "";
      newEggDescription.value = "";
    } else {
      noEggSection.classList.add("hidden");
    }

    // Egg picker — sync the checklist with _index.md, then render it with
    // this result's matched eggs (user edits + re-analyze changes the match)
    fetchEggs().then(() => {
      renderEggsSection(result.matchedEggs || []);
      if (isStage1 && analysisMode === "confirm") {
        eggsExpanded?.classList.remove("hidden");
        if (eggsToggleChevron) eggsToggleChevron.textContent = "▾";
        updateStage1ProceedBtn();
        window.scrollTo(0, 0);
      }
    });
  }

  // Title Verdict
  const showVerdict = result.titleVerdict && enabledSections.titleVerdict !== false;
  if (showVerdict) {
    titleVerdictSection?.classList.remove("hidden");
    verdictAnswer.textContent = result.titleVerdict || "";
  } else {
    titleVerdictSection?.classList.add("hidden");
    verdictAnswer.textContent = "";
  }

  // Core Summary
  const showSummary =
    Array.isArray(result.coreSummary) &&
    result.coreSummary.length > 0 &&
    enabledSections.coreSummary !== false;
  if (showSummary) {
    coreSummarySection?.classList.remove("hidden");
    coreSummaryEl.innerHTML = (result.coreSummary || [])
      .map((b) => `<li>${escapeHtml(b)}</li>`)
      .join("");
  } else {
    coreSummarySection?.classList.add("hidden");
    coreSummaryEl.innerHTML = "";
  }

  // Mind Map — text-heavy concept tree for side panel
  const showMindmap =
    Array.isArray(result.mindMap) &&
    result.mindMap.length > 0 &&
    enabledSections.mindMap !== false;
  if (showMindmap) {
    mindmapSection?.classList.remove("hidden");
    renderMindMap(result.mindMap);
  } else {
    mindmapSection?.classList.add("hidden");
  }

  // Chapter Map — clickable when timestamps exist (video).
  // For short content without an original chapter map, don't show it:
  // - If isLongForm is false and no author chapters were provided, don't show it.
  // - If chapterMap has fewer than 2 entries and no author chapters were provided, don't show it.
  const hasAuthorChapters =
    (Array.isArray(extractedContent?.chapters) && extractedContent.chapters.length > 0) ||
    (Array.isArray(stage1Payload?.content?.chapters) && stage1Payload.content.chapters.length > 0) ||
    (Array.isArray(result?.chapters) && result.chapters.length > 0);

  const isShortWithoutChapters =
    (result.isLongForm === false || !result.chapterMap || result.chapterMap.length <= 1) &&
    !hasAuthorChapters;

  const shouldShowChapterMap =
    enabledSections.chapterMap !== false &&
    Array.isArray(result.chapterMap) &&
    result.chapterMap.length > 0 &&
    !isShortWithoutChapters;

  if (shouldShowChapterMap) {
    chapterSection.classList.remove("hidden");
    chapterList.innerHTML = result.chapterMap
      .map((c) => {
        const clickable = c.time && activeTabId != null;
        const data = clickable ? ` data-seconds="${timeToSeconds(c.time)}"` : "";
        const timeLabel = c.time ? `<span class="chapter-time">⏱ ${escapeHtml(c.time)}</span>` : "";
        const titleLabel = c.title ? `<span class="chapter-title">${escapeHtml(c.title)}</span>` : "";
        const summaryLabel = c.summary ? `<span class="chapter-summary">${escapeHtml(c.summary)}</span>` : "";
        return `<div class="chapter-row${clickable ? " chapter-clickable" : ""}"${data}>${timeLabel}${titleLabel}${summaryLabel}</div>`;
      })
      .join("");
    chapterList.querySelectorAll(".chapter-clickable").forEach((row) => {
      row.addEventListener("click", () =>
        seekToChapter(parseInt(row.dataset.seconds, 10))
      );
    });
  } else {
    chapterSection.classList.add("hidden");
    chapterList.innerHTML = "";
  }

  // Your Questions — initial answers + follow-ups asked this session
  renderCustomQuestions();

  // Egg Knowledge (Tabs + unified per-egg insights, Q&A, and tree)
  renderEggKnowledge(isStage1 ? [] : (result.eggResults || []));

  // Verdict
  if (isStage1) {
    if (analysisMode === "fast") {
      verdictSection?.classList.remove("hidden");
    } else {
      verdictSection?.classList.add("hidden");
    }
  } else {
    verdictSection?.classList.remove("hidden");
    if (result.shouldRead) {
      verdictIcon.textContent = "✅";
      verdictText.textContent = t("verdictWorthReading");
      verdictBadge.className = "verdict-badge verdict-yes";
    } else {
      verdictIcon.textContent = "⏭️";
      verdictText.textContent = t("verdictSkipIt");
      verdictBadge.className = "verdict-badge verdict-no";
    }
    verdictReason.textContent = result.shouldReadReason || "";
  }

  successBanner.classList.add("hidden");
  updateActionButtons();
}

function cleanEggName(fileName) {
  if (!fileName) return "Egg";
  return fileName.split("/").pop().replace(/\.md$/, "");
}

function renderEggKnowledge(eggResults = []) {
  if (!eggKnowledgeSection || !eggKnowledgeContent) return;

  if (eggResults.length === 0) {
    eggKnowledgeSection.classList.add("hidden");
    eggKnowledgeContent.innerHTML = "";
    if (eggTabsBar) eggTabsBar.innerHTML = "";
    return;
  }

  eggKnowledgeSection.classList.remove("hidden");

  // Determine active tab
  const eggNames = eggResults.map((r) => r.egg);
  if (!activeEggTab || (!eggNames.includes(activeEggTab) && activeEggTab !== "all")) {
    // Default to the first egg that has new deltas, or the first egg
    const eggWithDeltas = eggResults.find((r) => (r.novelDelta || []).length > 0);
    activeEggTab = eggWithDeltas ? eggWithDeltas.egg : eggResults[0].egg;
  }

  // Render Tabs (only if 2+ eggs)
  if (eggResults.length > 1) {
    eggTabsBar.classList.remove("hidden");
    if (eggKnowledgeHint) eggKnowledgeHint.textContent = t("eggsMatchedCount", { count: eggResults.length });

    const totalNewCount = eggResults.reduce((acc, r) => acc + (r.novelDelta?.length || 0), 0);

    const tabsHtml = eggResults
      .map((r) => {
        const newCount = (r.novelDelta || []).length;
        let badgeClass = "badge-tab-covered";
        let badgeText = "✓";
        if (r.rejected) {
          badgeClass = "badge-tab-reject";
          badgeText = "✕";
        } else if (newCount > 0) {
          badgeClass = "badge-tab-new";
          badgeText = `+${newCount}`;
        }

        const isActive = activeEggTab === r.egg ? " active" : "";
        return `
          <button type="button" class="egg-tab-btn${isActive}" data-tab="${escapeHtml(r.egg)}" title="${escapeHtml(r.egg)}">
            <span class="egg-tab-name">${escapeHtml(cleanEggName(r.egg))}</span>
            <span class="egg-tab-badge ${badgeClass}">${badgeText}</span>
          </button>`;
      })
      .join("");

    const isAllActive = activeEggTab === "all" ? " active" : "";
    const allBadgeText = totalNewCount > 0 ? `+${totalNewCount}` : "✓";
    const allBadgeClass = totalNewCount > 0 ? "badge-tab-new" : "badge-tab-covered";

    eggTabsBar.innerHTML =
      tabsHtml +
      `
      <button type="button" class="egg-tab-btn${isAllActive}" data-tab="all" title="${escapeHtml(t("viewAllEggs"))}">
        <span class="egg-tab-name">📋 ${escapeHtml(t("allEggsTab"))}</span>
        <span class="egg-tab-badge ${allBadgeClass}">${allBadgeText}</span>
      </button>`;

    // Tab click listeners
    eggTabsBar.querySelectorAll(".egg-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeEggTab = btn.dataset.tab;
        renderEggKnowledge(eggResults);
      });
    });
  } else {
    eggTabsBar.classList.add("hidden");
    eggTabsBar.innerHTML = "";
    if (eggKnowledgeHint) eggKnowledgeHint.textContent = `(${cleanEggName(eggResults[0]?.egg)})`;
    activeEggTab = eggResults[0]?.egg;
  }

  // Render Egg Cards
  eggKnowledgeContent.innerHTML = eggResults
    .map((r) => {
      const isVisible = activeEggTab === "all" || activeEggTab === r.egg;
      const hideClass = isVisible ? "" : " hidden";
      const newDeltas = r.novelDelta || [];
      const redundantDeltas = r.redundantEntries || [];
      const existingKnowledge = (r.existingKnowledge || "").trim();
      const qaItems = r.keyQuestionAnswers || [];

      let statusHeader = "";
      if (eggResults.length > 1 && activeEggTab === "all") {
        statusHeader = `
          <div class="egg-card-header">
            <span class="egg-card-title">📄 ${escapeHtml(cleanEggName(r.egg))}</span>
            <span class="egg-card-file">${escapeHtml(r.egg)}</span>
          </div>`;
      }

      let statusNote = "";
      if (r.rejected) {
        statusNote = `
          <div class="egg-status-banner banner-reject">
            ${t("rejectedByEgg", { reason: escapeHtml(r.rejectReason || t("outOfScope")) })}
          </div>`;
      } else if (newDeltas.length === 0 && redundantDeltas.length > 0) {
        statusNote = `
          <div class="egg-status-banner banner-covered">
            ${t("fullyCoveredNotice")}
          </div>`;
      } else if (newDeltas.length === 0 && qaItems.length === 0) {
        statusNote = `
          <div class="egg-status-banner banner-covered">
            ${t("noNewKnowledgeNotice")}
          </div>`;
      }

      let newHtml = "";
      if (newDeltas.length > 0) {
        newHtml = `
          <div class="knowledge-subsection">
            <div class="knowledge-subhead new-subhead">${t("newInsightsHeading", { count: newDeltas.length })}</div>
            ${newDeltas
              .map(
                (d) => `
                <div class="delta-item is-new">
                  <div class="delta-header">
                    <span class="delta-badge badge-new">${t("badgeNewEntry")}</span>
                    <span class="delta-parent">${d.parent ? t("unprocessedParent", { parent: escapeHtml(d.parent) }) : t("unprocessedOnly")}</span>
                  </div>
                  <div class="delta-content">${escapeHtml(d.content)}</div>
                </div>`
              )
              .join("")}
          </div>`;
      }

      let qaHtml = "";
      if (qaItems.length > 0) {
        qaHtml = `
          <div class="knowledge-subsection egg-qa-block">
            <div class="knowledge-subhead qa-subhead">${t("eggKeyQuestions", { count: qaItems.length })}</div>
            ${qaItems
              .map(
                (qa) => `
                <div class="qa-item">
                  <div class="qa-question">Q: ${escapeHtml(qa.question)}</div>
                  <div class="qa-answer">${linkifyTimestamps(escapeHtml(qa.answer))}</div>
                  ${renderQaSources(qa.sources)}
                </div>`
              )
              .join("")}
          </div>`;
      }

      let redundantHtml = "";
      if (redundantDeltas.length > 0) {
        redundantHtml = `
          <div class="existing-tree-container">
            <div class="existing-tree-header">
              <span class="existing-tree-title">${t("alreadyCoveredHeading", { count: redundantDeltas.length })}</span>
              <button type="button" class="covered-toggle">${t("viewCovered")}</button>
            </div>
            <div class="covered-body hidden">
              ${redundantDeltas
                .map(
                  (d) => `
                  <div class="delta-item is-covered">
                    <div class="delta-header">
                      <span class="delta-badge badge-covered">${t("badgeCovered")}</span>
                      <span class="delta-parent">${d.existingParent ? t("underParent", { parent: escapeHtml(d.existingParent) }) : t("alreadyKnown")}</span>
                    </div>
                    <div class="delta-content">${escapeHtml(d.content)}</div>
                  </div>`
                )
                .join("")}
            </div>
          </div>`;
      }

      let treeHtml = "";
      if (existingKnowledge) {
        treeHtml = `
          <div class="existing-tree-container">
            <div class="existing-tree-header">
              <span class="existing-tree-title">${t("currentKnowledgeInEgg")}</span>
              <button type="button" class="existing-tree-toggle">${t("viewTree")}</button>
            </div>
            <div class="existing-tree-body hidden">${escapeHtml(existingKnowledge)}</div>
          </div>`;
      }

      return `
        <div class="egg-card${hideClass}" data-egg="${escapeHtml(r.egg)}">
          ${statusHeader}
          ${statusNote}
          ${newHtml}
          ${qaHtml}
          ${redundantHtml}
          ${treeHtml}
        </div>`;
    })
    .join("");

  // Wire covered toggles
  eggKnowledgeContent.querySelectorAll(".covered-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const body = btn.closest(".existing-tree-container")?.querySelector(".covered-body");
      if (body) {
        const isHidden = body.classList.toggle("hidden");
        btn.textContent = isHidden ? t("viewCovered") : t("hideCovered");
      }
    });
  });

  // Wire tree toggles
  eggKnowledgeContent.querySelectorAll(".existing-tree-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const body = btn.closest(".existing-tree-container")?.querySelector(".existing-tree-body");
      if (body) {
        const isHidden = body.classList.toggle("hidden");
        btn.textContent = isHidden ? t("viewTree") : t("hideTree");
      }
    });
  });
}

/** Reflect nutCollected/eggHatched in the two action buttons. */
function updateActionButtons() {
  if (analysisResult?.mode === "chrome") {
    confirmBtn.classList.add("hidden");
    collectNutBtn.classList.add("hidden");
    chromeActionsCard?.classList.remove("hidden");
    return;
  }

  if (analysisResult?.stage === "stage1") {
    confirmBtn.classList.add("hidden");
    if (nutCollected) {
      collectNutBtn.disabled = true;
      collectNutBtn.textContent = t("nutCollected");
      if (stage1SkipBtn) {
        stage1SkipBtn.disabled = true;
        stage1SkipBtn.textContent = t("nutCollected");
      }
      const confirmTextEl = document.getElementById("stage1-confirm-text");
      const confirmIconEl = document.querySelector(".stage1-confirm-icon");
      if (confirmTextEl) {
        confirmTextEl.innerHTML = t("stage1NutSavedNotice");
      }
      if (confirmIconEl) {
        confirmIconEl.textContent = "✅";
      }
      if (stage1ConfirmBox) {
        stage1ConfirmBox.classList.add("stage1-saved");
      }
    } else {
      collectNutBtn.disabled = false;
      collectNutBtn.textContent = t("collectNutOnly");
      if (stage1SkipBtn) {
        stage1SkipBtn.disabled = false;
        stage1SkipBtn.textContent = t("collectNutOnly");
      }
      if (stage1ConfirmBox) {
        stage1ConfirmBox.classList.remove("stage1-saved");
      }
    }
    return;
  }

  if (nutCollected) {
    collectNutBtn.disabled = true;
    collectNutBtn.textContent = t("nutCollected");
  } else {
    collectNutBtn.disabled = false;
    collectNutBtn.textContent = t("collectNut");
  }

  const hasDelta = (analysisResult?.newKnowledge?.length || 0) > 0;
  if (eggHatched) {
    confirmBtn.classList.remove("hidden");
    confirmBtn.disabled = true;
    confirmBtn.textContent = t("eggHatched");
    confirmBtn.title = "";
  } else if (hasDelta) {
    confirmBtn.classList.remove("hidden");
    confirmBtn.disabled = false;
    confirmBtn.textContent = t("hatchEgg");
    confirmBtn.title = "";
  } else {
    // No novel delta — show the button but keep it unclickable
    confirmBtn.classList.remove("hidden");
    confirmBtn.disabled = true;
    confirmBtn.textContent = t("hatchEgg");
    confirmBtn.title = t("noNewKnowledgeToAdd");
  }
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
      analyzeBtnText.textContent = t("analyzeAgain");
      return true;
    }
  } catch {
    // Server unreachable or no history — stay in capture state
  }
  return false;
}

/** Render or update the version history select dropdown. */
function renderHistorySelect(selectedNutId = currentNutId) {
  if (!historySelect) return;
  if (captureHistory.length > 1) {
    const hasMatch = selectedNutId != null && captureHistory.some((h) => String(h.nutId) === String(selectedNutId));
    historySelect.classList.remove("hidden");
    historySelect.innerHTML = captureHistory
      .map((h, i) => {
        const d = new Date(h.capturedAt).toLocaleString();
        const s = h.saved === "saved" ? t("stateSaved") : h.saved === "skip" ? t("stateCollected") : t("stateAnalyzed");
        const selected = (hasMatch ? String(h.nutId) === String(selectedNutId) : i === 0) ? " selected" : "";
        return `<option value="${i}"${selected}>${d} — ${s}</option>`;
      })
      .join("");
  } else {
    historySelect.classList.add("hidden");
    historySelect.innerHTML = "";
  }
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
      url: entry.url || extractedContent?.url || pageUrl.textContent || "",
      title: entry.title || extractedContent?.title || pageTitle.textContent || "",
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
      url: entry.url || pageUrl.textContent || "",
      title: entry.title || pageTitle.textContent || "",
      content: entry.content,
      sourceType: entry.sourceType || "webpage",
      metadata: {
        ...(entry.author ? { author: entry.author } : {}),
        ...(entry.publishedAt ? { published: entry.publishedAt } : {}),
      },
    };
    contentPreview.textContent = entry.content;
  }

  if (activeTabId) {
    const existing = tabResultCache.get(activeTabId);
    if (existing) {
      tabResultCache.set(activeTabId, {
        ...existing,
        extractedContent: existing.extractedContent || extractedContent,
        analysisResult: entry.result,
        currentNutId: entry.nutId,
        eggHatched,
        nutCollected,
        stage1Payload: (entry.result?.stage === "stage1" ? stage1Payload : null),
        stage1ContentAnalysis: (entry.result?.stage === "stage1" ? stage1ContentAnalysis : null),
      });
    }
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
  processedMessage.textContent = t("capturedWhenStored", { when, state: stateLabel });
  processedNote.classList.remove("hidden");

  // Version selector when multiple captures exist
  renderHistorySelect(entry.nutId);
}

/** Extract timestamp string like "12:34" or "1:05:30" from a reference string, or null if none. */
function extractTimestamp(str) {
  if (!str) return null;
  const s = String(str).trim();
  // Check for patterns like [12:34], 12:34, 1:23:45, [1:23:45], 12:34 - 13:00, ⏱ 12:34
  const match = s.match(/(?:^|[^\d:])(\d{1,2}(?::\d{2}){1,2})(?:[^\d:]|$)/);
  return match ? match[1] : null;
}

/** Replace timestamps in text like "[12:34]" or "12:34" with clickable timestamp buttons. */
function linkifyTimestamps(escapedText) {
  if (!escapedText) return "";
  return escapedText.replace(
    /(\[|\()(\d{1,2}(?::\d{2}){1,2})(\]|\))|(?:^|(\s))(\d{1,2}(?::\d{2}){1,2})(?=[.,!?\s]|$)/g,
    (match, open, time1, close, space, time2) => {
      const time = time1 || time2;
      const leading = space || "";
      return `${leading}<button type="button" class="source-pill source-timestamp inline-timestamp" data-time="${time}" title="${escapeHtml(t("jumpToVideoTime", { time }))}"><span class="source-icon">⏱️</span><span class="source-ref">${time}</span></button>`;
    }
  );
}

/** Render clickable source pills and supporting quotes for a Q&A answer. */
function renderQaSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return "";

  const validSources = sources.filter((s) => s && s.ref && String(s.ref).trim().length > 0);
  if (validSources.length === 0) return "";

  const items = validSources
    .map((s) => {
      const ref = String(s.ref).trim();
      const timestamp = extractTimestamp(ref);
      const isTime = timestamp !== null;
      const pillClass = isTime ? "source-pill source-timestamp" : "source-pill source-section";
      const icon = isTime ? "⏱️" : "§";
      const dataAttr = isTime
        ? `data-time="${escapeHtml(timestamp)}"`
        : `data-heading="${escapeHtml(ref)}"`;
      const quoteText = s.quote ? String(s.quote).trim() : "";
      const quoteAttr = quoteText ? ` data-quote="${escapeHtml(quoteText)}"` : "";
      const quoteTitle = quoteText
        ? ` title="${escapeHtml(quoteText)}"`
        : (isTime ? ` title="${escapeHtml(t("jumpToVideoTime", { time: timestamp }))}"` : ` title="${escapeHtml(t("scrollToSection", { ref }))}"`);

      const quoteHtml = quoteText
        ? `<span class="source-quote" title="${escapeHtml(quoteText)}">“${escapeHtml(quoteText)}”</span>`
        : "";

      const displayRef = isTime && /^\[\d{1,2}(?::\d{2}){1,2}\]$/.test(ref) ? timestamp : ref;

      return `
        <div class="qa-source-item">
          <button type="button" class="${pillClass}" ${dataAttr}${quoteAttr}${quoteTitle}>
            <span class="source-icon">${icon}</span>
            <span class="source-ref">${escapeHtml(displayRef)}</span>
          </button>
          ${quoteHtml}
        </div>`;
    })
    .join("");

  return items ? `<div class="qa-sources"><div class="qa-sources-label">📍 ${escapeHtml(t("qaSourcesLabel"))}:</div>${items}</div>` : "";
}

/**
 * Unwrap single root node(s) with children so that the mind map directly
 * displays the core branches at the root level instead of an unnecessary single root.
 */
function unwrapMindMapRoots(nodes) {
  let current = nodes;
  while (
    Array.isArray(current) &&
    current.length === 1 &&
    Array.isArray(current[0].children) &&
    current[0].children.length > 0
  ) {
    current = current[0].children;
  }
  return current;
}

/** Render the Mind Map hierarchical concept tree. */
function renderMindMap(nodes) {
  if (!mindmapTree) return;
  mindmapTree.innerHTML = "";
  if (!Array.isArray(nodes) || nodes.length === 0) return;

  const displayNodes = unwrapMindMapRoots(nodes);
  if (!Array.isArray(displayNodes) || displayNodes.length === 0) return;

  function buildNode(node) {
    const nodeEl = document.createElement("div");
    nodeEl.className = "mindmap-node";

    const headerEl = document.createElement("div");
    headerEl.className = "mindmap-node-header";

    const hasChildren = Array.isArray(node.children) && node.children.length > 0;

    let toggleBtn = null;
    if (hasChildren) {
      toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "mindmap-toggle-btn";
      toggleBtn.setAttribute("aria-label", t("toggleBranch"));
      toggleBtn.innerHTML = `<span class="mindmap-toggle-icon">▾</span>`;
      headerEl.appendChild(toggleBtn);
    } else {
      const bullet = document.createElement("span");
      bullet.className = "mindmap-bullet";
      headerEl.appendChild(bullet);
    }

    const contentWrap = document.createElement("div");
    contentWrap.className = "mindmap-node-content";

    const nameEl = document.createElement("div");
    nameEl.className = "mindmap-node-name";
    nameEl.textContent = node.name || "";
    contentWrap.appendChild(nameEl);

    if (node.detail) {
      const detailEl = document.createElement("div");
      detailEl.className = "mindmap-node-detail";
      detailEl.textContent = node.detail;
      contentWrap.appendChild(detailEl);
    }

    headerEl.appendChild(contentWrap);
    nodeEl.appendChild(headerEl);

    if (hasChildren) {
      const childrenContainer = document.createElement("div");
      childrenContainer.className = "mindmap-children";
      for (const child of node.children) {
        childrenContainer.appendChild(buildNode(child));
      }
      nodeEl.appendChild(childrenContainer);

      const toggleBranch = (e) => {
        e.stopPropagation();
        const isCollapsed = childrenContainer.classList.toggle("collapsed");
        const icon = toggleBtn.querySelector(".mindmap-toggle-icon");
        if (icon) icon.textContent = isCollapsed ? "▸" : "▾";
      };

      toggleBtn.addEventListener("click", toggleBranch);
      nameEl.addEventListener("click", toggleBranch);
    }

    return nodeEl;
  }

  for (const node of displayNodes) {
    mindmapTree.appendChild(buildNode(node));
  }
}

/** Render the "Your Questions" section: initial answers + follow-ups. */
function renderCustomQuestions() {
  const all = [
    ...(analysisResult?.customQuestionAnswers || []),
    ...followUpQa,
  ];

  // Always keep questions section visible in results view so user can ask questions anytime
  customQuestionsSection.classList.remove("hidden");

  const labelEl = customQuestionsSection.querySelector(".section-label");
  if (labelEl) {
    labelEl.textContent = all.length > 0 ? t("questionsAndAnswers") : t("askAQuestion");
  }

  if (followupInput) {
    followupInput.placeholder = t("askQuestionPlaceholder");
  }

  if (all.length > 0) {
    customQuestionsList.innerHTML = all
      .map((qa) => `
        <div class="egg-group">
          <div class="qa-item">
            <div class="qa-question">Q: ${escapeHtml(qa.question)}</div>
            <div class="qa-answer">${linkifyTimestamps(escapeHtml(qa.answer))}</div>
            ${renderQaSources(qa.sources)}
          </div>
        </div>`)
      .join("");
  } else {
    customQuestionsList.innerHTML = "";
  }
}

/** Ask a follow-up question against the already-analyzed content. */
async function handleFollowUp() {
  const pinnedTabId = activeTabId;
  const q = followupInput.value.trim();
  if (!q || followupBtn.disabled) return;
  followupInput.value = "";
  followupBtn.disabled = true;
  followupBtn.textContent = "…";

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
    followupBtn.disabled = false;
    followupBtn.textContent = t("askBtn");
    renderCustomQuestions();
  }
}

/** All Q&A seen so far — context so follow-ups can refer back instead of repeating. */
function buildPriorQa(res = analysisResult, qaList = followUpQa) {
  const eggQa = (res?.eggResults || []).flatMap(
    (r) => r.keyQuestionAnswers || []
  );
  const customQa = res?.customQuestionAnswers || [];
  return [...eggQa, ...customQa, ...(qaList || []).filter((qa) => qa.answer !== "…")];
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
  const pill = e.target.closest(".source-pill");
  if (!pill) return;
  e.preventDefault();
  e.stopPropagation();

  const timeVal = pill.dataset.time || extractTimestamp(pill.dataset.heading);
  if (timeVal) {
    seekToChapter(timeToSeconds(timeVal));
  } else if (pill.dataset.heading) {
    scrollToSection(pill.dataset.heading, pill.dataset.quote || "");
  }
}

/** "MM:SS" or "HH:MM:SS" → seconds. */
function timeToSeconds(time) {
  if (typeof time === "number" && !isNaN(time)) return Math.floor(time);
  if (!time) return 0;
  const ts = extractTimestamp(time) || String(time).trim();
  const parts = ts.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 0 || parts.some(isNaN)) {
    const directNum = parseInt(time, 10);
    return isNaN(directNum) ? 0 : directNum;
  }
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

function showCaptureState() {
  resultsState.classList.add("hidden");
  resultPageInfo.classList.add("hidden");
  captureState.classList.remove("hidden");
  resetCollapsibleSections();
  if (extractedContent) {
    contentPreview.textContent = extractedContent.content || "(No content extracted)";
    if (extractedContent.title) pageTitle.textContent = extractedContent.title;
    if (extractedContent.url) pageUrl.textContent = extractedContent.url;
    if (extractedContent.sourceType) pageType.textContent = extractedContent.sourceType;
    showProvenance(extractedContent.metadata || {});
  }
  analysisResult = null;
  cachedProcessedSaved = null;
  followUpQa = [];
  followupInput.value = "";
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
      confirmBtn.disabled = true;
      confirmBtn.textContent = t("retrieving");
    }
    targetContent = await extractPageContent(refreshSeq, pinnedTabId);
  }
  if (activeTabId === pinnedTabId) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = t("hatching");
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
      if (collectNutBtn) {
        collectNutBtn.disabled = true;
        collectNutBtn.textContent = t("retrieving");
      }
      if (stage1SkipBtn) {
        stage1SkipBtn.disabled = true;
        stage1SkipBtn.textContent = t("retrieving");
      }
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
    if (collectNutBtn) {
      collectNutBtn.disabled = true;
      collectNutBtn.textContent = t("collecting");
    }
    if (stage1SkipBtn) {
      stage1SkipBtn.disabled = true;
      stage1SkipBtn.textContent = t("collecting");
    }
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
      skipRaw: (newKnowledge.length > 0 || isHatch) &&
        (nutCollected || (cachedProcessedSaved !== null && cachedProcessedSaved !== "analyzed")),
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
        const isStage1BoxVisible = result?.stage === "stage1" && stage1ConfirmBox && !stage1ConfirmBox.classList.contains("hidden");
        if (isStage1BoxVisible) {
          // In Stage 1, stage1-confirm-box updates in-place to show the saved state.
          // Hide successBanner so only one message is displayed.
          successBanner.classList.add("hidden");
        } else {
          if (newKnowledge.length > 0) {
            successMessage.textContent = t("eggHatchedSuccess", { mergedNote });
          } else if (isHatch) {
            successMessage.textContent = t("eggHatchedNoKnowledge");
          } else {
            successMessage.textContent = t("nutCollectedVault");
          }
          successBanner.classList.remove("hidden");
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
  errorMessage.textContent = msg;
  errorBanner.classList.remove("hidden");
  const hints = {
    no_api_key: t("errorHintNoApiKey"),
    auth_failed: t("errorHintAuthFailed"),
    forbidden: t("errorHintForbidden"),
    model_not_found: t("errorHintModelNotFound"),
    rate_limited: t("errorHintRateLimited"),
    quota_exceeded: t("errorHintQuotaExceeded"),
    network_error: t("errorHintNetwork"),
    server_error: t("errorHintServerError"),
  };
  if (errorCode && hints[errorCode]) {
    errorHint.innerHTML = hints[errorCode];
    errorHint.classList.remove("hidden");
  } else {
    errorHint.classList.add("hidden");
  }
}

function showDuplicate(msg) {
  duplicateMessage.textContent = msg;
  duplicateBanner.classList.remove("hidden");
}

function hideMessages() {
  errorBanner.classList.add("hidden");
  errorHint.classList.add("hidden");
  duplicateBanner.classList.add("hidden");
}

function showWarning(msg) {
  warningMessage.textContent = msg;
  warningBanner.classList.remove("hidden");
  updateServerStatusIndicator();
}
function hideWarning() {
  warningBanner.classList.add("hidden");
  warningMessage.textContent = "";
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
  } else if (pageUrl?.textContent && pageUrl.textContent !== "Loading...") {
    contentUrl = pageUrl.textContent;
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
  };
}
