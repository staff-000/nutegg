// NutEgg Popup Script — Two-state UI

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
const verdictAnswer = document.getElementById("verdict-answer");
const coreSummaryEl = document.getElementById("core-summary");
const mindmapSection = document.getElementById("mindmap-section");
const mindmapTree = document.getElementById("mindmap-tree");
const chapterSection = document.getElementById("chapter-section");
const chapterList = document.getElementById("chapter-list");
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

document.addEventListener("DOMContentLoaded", async () => {
  const versionTag = document.getElementById("version-tag");
  if (versionTag) {
    const version = chrome.runtime?.getManifest?.()?.version;
    if (version) versionTag.textContent = `NutEgg ${version}`;
  }

  // Restore analysis mode preference and cached metrics immediately (0ms paint)
  try {
    const stored = await new Promise((resolve) => {
      chrome.storage?.local?.get?.(["analysisMode", "cachedMetrics"], resolve);
    });
    if (stored?.analysisMode === "confirm" || stored?.analysisMode === "fast") {
      setAnalysisMode(stored.analysisMode);
    }
    if (stored?.cachedMetrics) {
      applyMetrics(stored.cachedMetrics);
    }
  } catch {}

  // Fetch fresh metrics immediately in parallel without waiting for content extraction
  fetchMetrics();

  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName === "local" && changes.analysisMode) {
      const newMode = changes.analysisMode.newValue;
      if (newMode === "confirm" || newMode === "fast") {
        setAnalysisMode(newMode);
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
      contentPreview.textContent = "Retrieving content…";
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
      if (aiCreditText) aiCreditText.textContent = "Checking...";
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
      if (title) title.textContent = "Checking...";
      if (sub) sub.textContent = "Connecting to Obsidian...";
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
  refreshBtn.addEventListener("click", handleRefresh);
  createEggBtn.addEventListener("click", handleCreateEgg);
  eggsCreateToggle.addEventListener("click", () => {
    const form = eggsCreateForm;
    const isHidden = form.classList.toggle("hidden");
    eggsCreateToggle.textContent = isHidden ? "➕ Create new egg" : "✕ Cancel";
  });
  eggsCreateBtn.addEventListener("click", handleCreateEggInline);
  reanalyzeEggsBtn.addEventListener("click", async () => {
    if (selectedEggs.size === 0 || reanalyzeEggsBtn.disabled) return;
    const notReady = getAnalyzeNotReadyReason();
    if (notReady) {
      showWarning(notReady);
      return;
    }
    reanalyzeEggsBtn.disabled = true;
    const original = reanalyzeEggsBtn.textContent;
    reanalyzeEggsBtn.textContent = "⏳ Analyzing…";
    eggsErrorEl.classList.add("hidden");
    if (stage1ContentAnalysis) {
      await handleProceedStage2([...selectedEggs], false, false, activeTabId);
    } else {
      const error = await handleAnalyze(true, [...selectedEggs], true);
      if (error) {
        eggsErrorEl.textContent = `❌ ${error}`;
        eggsErrorEl.classList.remove("hidden");
      }
    }
    reanalyzeEggsBtn.disabled = false;
    reanalyzeEggsBtn.textContent = original;
  });
  // Egg picker is collapsed by default — expand on demand
  eggsToggle.addEventListener("click", () => {
    const expanded = eggsExpanded.classList.toggle("hidden");
    eggsToggleChevron.textContent = expanded ? "▾" : "▸";
  });
  reanalyzeBtn.addEventListener("click", () => {
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
      });
    }
    activeTabId = tabId;
    // Check if we have cached results for this tab
    const cached = tabResultCache.get(tabId);
    if (cached && (cached.analysisResult || cached.status === "analyzing" || cached.status === "hatching" || cached.extractedContent)) {
      restoreFromTabCache(tabId, cached);
    } else if (tabsExtracting.has(tabId)) {
      // Tab is currently retrieving in the background — show retrieving state and let it finish
      contentPreview.textContent = "Retrieving content…";
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
          });
        }
        activeTabId = tab.id;
        const cached = tabResultCache.get(tab.id);
        if (cached && (cached.analysisResult || cached.status === "analyzing" || cached.status === "hatching" || cached.extractedContent)) {
          restoreFromTabCache(tab.id, cached);
        } else if (tabsExtracting.has(tab.id)) {
          contentPreview.textContent = "Retrieving content…";
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
});

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
  contentPreview.textContent = "Loading content…";
  pageAuthorEl.textContent = "";
  pagePublishedEl.textContent = "";
  currentTabLoading = false;
  updateAnalyzeButtonsState();

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
      pageTitle.textContent = tab.title || "Loading...";
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
  currentTabLoading = false;

  // Update header and capture preview so capture state is ready if user switches back
  pageTitle.textContent = extractedContent?.title || "Untitled";
  pageUrl.textContent = extractedContent?.url || "";
  pageType.textContent = extractedContent?.sourceType || "";
  contentPreview.textContent = extractedContent?.content || "(No content extracted)";
  showProvenance(extractedContent?.metadata || {});

  if (cached.status === "analyzing") {
    if (cached.analysisResult) {
      // Re-analysis in flight: keep showing results view with analyzing indicator
      showResultsState(cached.analysisResult, provenanceFromExtraction(extractedContent));
      if (reanalyzeBtn) {
        reanalyzeBtn.disabled = true;
        reanalyzeBtn.textContent = "Analyzing…";
      }
      if (historySelect) historySelect.disabled = true;
      analyzeBtn.disabled = true;
      analyzeBtnText.textContent = "Analyzing...";
      processedNote.classList.remove("hidden");
      processedMessage.textContent = "Analyzing content…";
    } else {
      showCaptureState();
      if (extractedContent) {
        contentPreview.textContent = extractedContent.content || "(No content extracted)";
      }
      analyzeBtn.disabled = true;
      analyzeBtnText.textContent = "Analyzing...";
    }
  } else if (cached.status === "hatching") {
    if (analysisResult) {
      showResultsState(analysisResult, provenanceFromExtraction(extractedContent));
    }
    if (stage1ProceedBtn) {
      stage1ProceedBtn.disabled = true;
      stage1ProceedBtn.textContent = "Hatching the egg…";
    }
    if (reanalyzeBtn) {
      reanalyzeBtn.disabled = true;
      reanalyzeBtn.textContent = "Comparing knowledge…";
    }
    if (historySelect) historySelect.disabled = true;
    analyzeBtn.disabled = true;
    analyzeBtnText.textContent = "Analyzing...";
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
        ? "saved" : entry.saved === "skip" ? "collected" : "analyzed";
      if (cached.justReanalyzed) {
        processedMessage.textContent = "Re-analyzed just now — showing fresh result.";
        delete cached.justReanalyzed;
      } else {
        processedMessage.textContent = `Captured ${when} (${stateLabel}) — showing stored result.`;
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
  const name = newEggName.value.trim();
  if (!name || createEggBtn.disabled) return;
  createEggBtn.disabled = true;
  createEggBtn.textContent = "Creating…";
  try {
    const response = await chrome.runtime.sendMessage({
      action: "create-egg",
      name,
      description: newEggDescription.value.trim(),
    });
    if (response?.success) {
      // Target the newly created egg explicitly
      const eggFile = response.path ? response.path.split("/").pop() : slugify(name) + ".md";
      await handleAnalyze(true, [eggFile]);
      return;
    }
    showError(response?.error || "Failed to create egg");
  } catch (err) {
    showError(err instanceof Error ? err.message : "Failed to create egg");
  }
  createEggBtn.disabled = false;
  createEggBtn.textContent = "Create Egg";
}

/** 🐣 Create an egg from the inline form inside the egg picker. */
async function handleCreateEggInline() {
  const name = eggsNewName.value.trim();
  if (!name || eggsCreateBtn.disabled) return;
  eggsCreateBtn.disabled = true;
  eggsCreateBtn.textContent = "Creating…";
  try {
    const response = await chrome.runtime.sendMessage({
      action: "create-egg",
      name,
      description: eggsNewDesc.value.trim(),
    });
    if (response?.success) {
      // Re-analyze with the new egg included
      await handleAnalyze(true);
      return;
    }
    eggsErrorEl.textContent = `❌ ${response?.error || "Failed to create egg"}`;
    eggsErrorEl.classList.remove("hidden");
  } catch (err) {
    eggsErrorEl.textContent = `❌ ${err instanceof Error ? err.message : "Failed to create egg"}`;
    eggsErrorEl.classList.remove("hidden");
  }
  eggsCreateBtn.disabled = false;
  eggsCreateBtn.textContent = "Create Egg";
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
    captureEggsLabel.textContent = "(Auto-detect)";
  } else if (preSelectedEggs.size === 1) {
    const egg = [...preSelectedEggs][0].split("/").pop();
    captureEggsLabel.textContent = `(${egg})`;
  } else {
    captureEggsLabel.textContent = `(${preSelectedEggs.size} selected)`;
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
    ? `— ${matchedEggs.length} matched`
    : "— none matched";
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
  eggsCreateToggle.textContent = "➕ Create new egg";
  eggsNewName.value = "";
  eggsNewDesc.value = "";
  eggsCreateBtn.disabled = false;
  eggsCreateBtn.textContent = "Create Egg";
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
    stage1ProceedBtn.textContent = "🐣 Hatch Egg (Select egg)";
    if (confirmTextEl) {
      if (allEggs.length === 0) {
        confirmTextEl.innerHTML = "<strong>No eggs in vault yet:</strong> Create an egg below to hatch into the vault, or collect the nut only.";
      } else {
        confirmTextEl.innerHTML = "<strong>No egg selected:</strong> Pick an egg below, create a new one, or collect the nut only.";
      }
    }
  } else {
    stage1ProceedBtn.disabled = false;
    stage1ProceedBtn.textContent = count === 1 ? "🐣 Hatch Egg" : `🐣 Hatch Egg (${count})`;
    if (confirmTextEl) {
      confirmTextEl.innerHTML = `<strong>Stage 1 Complete:</strong> ${count} egg${count === 1 ? "" : "s"} selected. Click below to hatch into the vault.`;
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
      showWarning("Please select or create at least one egg to hatch.");
    }
    return;
  }

  if (isPinnedActive) {
    if (stage1ProceedBtn) {
      stage1ProceedBtn.disabled = true;
      stage1ProceedBtn.textContent = autoSave ? "Hatching the egg…" : "Analyzing egg…";
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
        processedMessage.textContent = "Re-analyzed just now — showing fresh result.";
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
      showError(err instanceof Error ? err.message : "Hatching failed");
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
    versionTag.title = `Version mismatch: Chrome extension is v${extVersion}, but Obsidian plugin is v${pluginVersion}`;
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
    return `Version mismatch: Chrome extension is v${extVersion}, but Obsidian plugin is v${pluginVersion}. Please update both to the same version for full compatibility.`;
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
    aiCreditPill.title = `NutEgg AI (${credit.providerLabel}): ${credit.statusText} (Click to refresh)`;
    aiCreditPill.classList.remove("has-warning");
  } else {
    aiCreditText.textContent = providerName;
    aiCreditPill.title = `NutEgg AI: ${credit.statusText} (Click to refresh)`;
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
        aiCreditPill.title = `Chrome AI (${providerLabel}): ${credit.balanceFormatted} remaining (Click to test)`;
      } else {
        aiCreditText.textContent = providerLabel;
        aiCreditPill.title = `Chrome AI (${providerLabel}): ${credit.statusText || "Ready"} (Click to test)`;
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
            <strong>AI Key Required:</strong> Standalone Chrome AI is enabled, but no API key is configured.
            <div class="key-banner-actions">
              <button id="open-settings-key-btn" type="button" class="key-banner-link-btn">⚙️ Open Settings to Add Key</button>
              <span>or <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener" class="key-banner-link">start Obsidian</a></span>
            </div>
          </div>
        `;
      } else {
        aiKeyMissingBanner.innerHTML = `
          <span class="key-banner-icon">⚪</span>
          <div class="key-banner-content">
            <strong>Obsidian is offline:</strong> Start Obsidian to capture, or enable standalone Chrome AI in Settings.
            <div class="key-banner-actions">
              <button id="open-settings-enable-ai-btn" type="button" class="key-banner-link-btn">⚡ Enable Chrome AI</button>
              <span>or <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener" class="key-banner-link">start Obsidian</a></span>
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
    title.textContent = "Obsidian is online";
    sub.textContent = version ? `Plugin v${version} · Full Analysis` : "Ready to capture";
    serverStatus.setAttribute("aria-label", `Obsidian is online${version ? ` (v${version})` : ""}`);
  } else if (state === "obsidian-no-key") {
    tooltip.className = "status-tooltip warning";
    title.textContent = "Obsidian Online (No AI Key)";
    sub.textContent = "Add API key in Obsidian Settings → NutEgg";
    serverStatus.setAttribute("aria-label", "Obsidian is online but no AI API key is configured");
  } else if (state === "obsidian-mismatch") {
    tooltip.className = "status-tooltip warning";
    title.textContent = "Version Mismatch";
    sub.textContent = extra || "Update NutEgg plugin or extension";
    serverStatus.setAttribute("aria-label", extra || "Version mismatch");
  } else if (state === "chrome-ai") {
    tooltip.className = "status-tooltip chrome-ai";
    title.textContent = "Using Chrome AI";
    sub.textContent = `${extra || "Standalone"} · Stage 1 content analysis`;
    serverStatus.setAttribute("aria-label", `Using Chrome AI (${extra || "Standalone"})`);
  } else if (state === "chrome-no-key") {
    tooltip.className = "status-tooltip warning";
    title.textContent = "Chrome AI (No Key)";
    sub.textContent = "Add API key in Chrome Settings";
    serverStatus.setAttribute("aria-label", "Chrome AI is enabled but no API key is configured");
  } else {
    tooltip.className = "status-tooltip offline";
    title.textContent = "Obsidian is offline";
    sub.textContent = "Start Obsidian or enable Chrome AI in Settings";
    serverStatus.setAttribute("aria-label", "Obsidian is offline. Start Obsidian or enable Chrome AI");
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
  showWarning(
    "Couldn't fetch the video transcript — analysis would be based on the description only and could mislead you. NutEgg will not process this video."
  );
}

/** Returns a non-null string prompt if the page or content is not ready for analysis. */
function getAnalyzeNotReadyReason() {
  if (currentTabLoading) {
    return "The page is still loading. Please wait until it finishes loading before analyzing.";
  }
  if (extractionPending) {
    return "Retrieving page content… please wait a moment.";
  }
  if (!extractedContent || !extractedContent.content) {
    return "The page is still loading or content is not ready yet. Please wait until it finishes loading.";
  }
  if (isTranscriptBlocked()) {
    return "Video transcript is unavailable — NutEgg cannot analyze videos without transcripts.";
  }
  if (!serverOnline) {
    if (!chromeAiEnabled) {
      return "Obsidian is offline. Please start Obsidian or enable Chrome-only AI in Settings.";
    }
    if (!chromeAiConfigured) {
      return "Chrome-only AI is enabled, but no API key is configured. Please configure an API key in Settings or start Obsidian.";
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
    analyzeBtnText.textContent = "Analyzing...";
    if (reanalyzeBtn) {
      reanalyzeBtn.disabled = true;
      reanalyzeBtn.classList.remove("inactive");
      reanalyzeBtn.textContent = "Analyzing…";
    }
    return;
  }

  analyzeBtn.disabled = false;
  if (reanalyzeBtn) reanalyzeBtn.disabled = false;

  const notReady = getAnalyzeNotReadyReason();
  if (notReady) {
    analyzeBtn.classList.add("inactive");
    if (reanalyzeBtn) reanalyzeBtn.classList.add("inactive");

    if (isTranscriptBlocked()) {
      analyzeBtnText.textContent = "Transcript unavailable";
    } else if (currentTabLoading || extractionPending) {
      analyzeBtnText.textContent = "Loading content…";
    } else {
      analyzeBtnText.textContent = "Analyze";
    }
    analyzeBtn.title = notReady;
    if (reanalyzeBtn) reanalyzeBtn.title = notReady;
  } else {
    analyzeBtn.classList.remove("inactive");
    if (reanalyzeBtn) reanalyzeBtn.classList.remove("inactive");
    analyzeBtnText.textContent = analysisResult ? "🔄 Analyze Again" : "Analyze";
    analyzeBtn.title = "";
    if (reanalyzeBtn) {
      reanalyzeBtn.title = "";
      reanalyzeBtn.textContent = "🔄 Re-analyze";
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
    if (!targetTabId || targetTabId === activeTabId) pageTitle.textContent = "Unknown Page";
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
    contentPreview.textContent = "Retrieving content…";
    pageAuthorEl.textContent = "";
    pagePublishedEl.textContent = "";
    pageTitle.textContent = tabTitle || "Retrieving…";
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
      contentPreview.textContent = "(Could not extract content)";
      showWarning(
        "Could not extract content from this page — it may be restricted (chrome://, Web Store) or still loading. Click 🔄 to try again."
      );
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
    if (identity && identity.readyState === "complete" && identity.youtubeReady !== false) {
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
      processedMessage.textContent = "Analyzing content…";
      if (reanalyzeBtn) {
        reanalyzeBtn.disabled = true;
        reanalyzeBtn.textContent = "Analyzing…";
      }
    }
    if (historySelect) historySelect.disabled = true;
    analyzeBtn.disabled = true;
    analyzeBtnText.textContent = "Analyzing...";
  }

  try {
    const questions = customQuestionsEl.value
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

    // Check which eggs are selected on the page or pre-selected
    const targetEggs = eggsOverride ||
      (selectedEggs.size > 0 ? [...selectedEggs] : null) ||
      (analysisResult?.matchedEggs?.length > 0 ? analysisResult.matchedEggs : null) ||
      (captureHistory[0]?.result?.matchedEggs?.length > 0 ? captureHistory[0].result.matchedEggs : null) ||
      (preSelectedEggs.size > 0 ? [...preSelectedEggs] : null);

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
      ...(targetEggs && targetEggs.length > 0 ? { eggs: targetEggs } : {}),
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

    // In Chrome standalone mode, skip stage 2 egg comparison
    const isChromeMode = response?.mode === "chrome" || (!serverOnline && !response?.matchedEggs?.length);
    const shouldRunStage2 = !isChromeMode && (isReanalyze || analysisMode === "fast");
    const eggsForStage2 = (targetEggs && targetEggs.length > 0)
      ? targetEggs
      : (response.matchedEggs && response.matchedEggs.length > 0 ? response.matchedEggs : []);

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
          processedMessage.textContent = "Comparing against selected eggs…";
          if (reanalyzeBtn) {
            reanalyzeBtn.disabled = true;
            reanalyzeBtn.textContent = "Comparing knowledge…";
          }
        }

        if (eggsForStage2.length > 0) {
          if (!isReanalyze) {
            if (verdictSection) verdictSection.classList.remove("hidden");
            if (verdictBadge) verdictBadge.className = "verdict-badge";
            if (verdictIcon) verdictIcon.textContent = "⏳";
            if (verdictText) verdictText.textContent = "Comparing knowledge…";
            if (verdictReason) {
              verdictReason.textContent = `Comparing against ${eggsForStage2.length} egg(s)…`;
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
          processedMessage.textContent = "Re-analyzed just now — showing fresh result.";
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
    if (historySelect) historySelect.disabled = false;
    const activeCache = tabResultCache.get(activeTabId);
    if (!activeCache || (activeCache.status !== "analyzing" && activeCache.status !== "hatching")) {
      updateAnalyzeButtonsState();
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
  if (!isReanalyzing && captureHistory.length <= 1) {
    processedNote.classList.add("hidden");
  } else {
    processedNote.classList.remove("hidden");
    if (captureHistory.length > 1 && !processedMessage.textContent) {
      const entry = (currentNutId != null && captureHistory.find((h) => String(h.nutId) === String(currentNutId))) || captureHistory[0];
      if (entry) {
        const when = new Date(entry.capturedAt).toLocaleString();
        const stateLabel = entry.saved === "saved"
          ? "saved" : entry.saved === "skip" ? "collected" : "analyzed";
        processedMessage.textContent = `Captured ${when} (${stateLabel}) — showing stored result.`;
      }
    }
  }
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
  verdictAnswer.textContent = result.titleVerdict || "";

  // Core Summary
  coreSummaryEl.innerHTML = (result.coreSummary || [])
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join("");

  // Mind Map — text-heavy concept tree for side panel
  if (Array.isArray(result.mindMap) && result.mindMap.length > 0) {
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
      verdictText.textContent = "Worth reading";
      verdictBadge.className = "verdict-badge verdict-yes";
    } else {
      verdictIcon.textContent = "⏭️";
      verdictText.textContent = "Skip it";
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
    if (eggKnowledgeHint) eggKnowledgeHint.textContent = `(${eggResults.length} eggs matched)`;

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
      <button type="button" class="egg-tab-btn${isAllActive}" data-tab="all" title="View all eggs">
        <span class="egg-tab-name">📋 All</span>
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
            ⚠️ <strong>Rejected by this egg:</strong> ${escapeHtml(r.rejectReason || "Out of scope")}
          </div>`;
      } else if (newDeltas.length === 0 && redundantDeltas.length > 0) {
        statusNote = `
          <div class="egg-status-banner banner-covered">
            ✅ <strong>Fully covered:</strong> All concepts already exist in your knowledge tree.
          </div>`;
      } else if (newDeltas.length === 0 && qaItems.length === 0) {
        statusNote = `
          <div class="egg-status-banner banner-covered">
            ℹ️ No new knowledge entries extracted for this egg.
          </div>`;
      }

      let newHtml = "";
      if (newDeltas.length > 0) {
        newHtml = `
          <div class="knowledge-subsection">
            <div class="knowledge-subhead new-subhead">✨ New Insights (${newDeltas.length})</div>
            ${newDeltas
              .map(
                (d) => `
                <div class="delta-item is-new">
                  <div class="delta-header">
                    <span class="delta-badge badge-new">+ New Entry</span>
                    <span class="delta-parent">🐣 → Unprocessed${d.parent ? ` · suggested under: <strong>${escapeHtml(d.parent)}</strong>` : ""}</span>
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
            <div class="knowledge-subhead qa-subhead">💬 Key Questions for this Egg (${qaItems.length})</div>
            ${qaItems
              .map(
                (qa) => `
                <div class="qa-item">
                  <div class="qa-question">Q: ${escapeHtml(qa.question)}</div>
                  <div class="qa-answer">${escapeHtml(qa.answer)}</div>
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
              <span class="existing-tree-title">✅ Already Covered in Tree (${redundantDeltas.length})</span>
              <button type="button" class="covered-toggle">▸ View Covered</button>
            </div>
            <div class="covered-body hidden">
              ${redundantDeltas
                .map(
                  (d) => `
                  <div class="delta-item is-covered">
                    <div class="delta-header">
                      <span class="delta-badge badge-covered">Covered</span>
                      <span class="delta-parent">${d.existingParent ? `under: <strong>${escapeHtml(d.existingParent)}</strong>` : "Already known"}</span>
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
              <span class="existing-tree-title">📚 Current Knowledge in Egg</span>
              <button type="button" class="existing-tree-toggle">▸ View Tree</button>
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
        btn.textContent = isHidden ? "▸ View Covered" : "▾ Hide Covered";
      }
    });
  });

  // Wire tree toggles
  eggKnowledgeContent.querySelectorAll(".existing-tree-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const body = btn.closest(".existing-tree-container")?.querySelector(".existing-tree-body");
      if (body) {
        const isHidden = body.classList.toggle("hidden");
        btn.textContent = isHidden ? "▸ View Tree" : "▾ Hide Tree";
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
      collectNutBtn.textContent = "✅ Nut collected";
      if (stage1SkipBtn) {
        stage1SkipBtn.disabled = true;
        stage1SkipBtn.textContent = "✅ Nut Collected";
      }
      const confirmTextEl = document.getElementById("stage1-confirm-text");
      const confirmIconEl = document.querySelector(".stage1-confirm-icon");
      if (confirmTextEl) {
        confirmTextEl.innerHTML = "<strong>Nut collected to vault!</strong> Raw content saved. You can still hatch the egg below if you want.";
      }
      if (confirmIconEl) {
        confirmIconEl.textContent = "✅";
      }
      if (stage1ConfirmBox) {
        stage1ConfirmBox.classList.add("stage1-saved");
      }
    } else {
      collectNutBtn.disabled = false;
      collectNutBtn.textContent = "🌰 Collect Nut Only";
      if (stage1SkipBtn) {
        stage1SkipBtn.disabled = false;
        stage1SkipBtn.textContent = "🌰 Collect Nut Only";
      }
      if (stage1ConfirmBox) {
        stage1ConfirmBox.classList.remove("stage1-saved");
      }
    }
    return;
  }

  if (nutCollected) {
    collectNutBtn.disabled = true;
    collectNutBtn.textContent = "✅ Nut collected";
  } else {
    collectNutBtn.disabled = false;
    collectNutBtn.textContent = "🌰 Collect Nut";
  }

  const hasDelta = (analysisResult?.newKnowledge?.length || 0) > 0;
  if (eggHatched) {
    confirmBtn.classList.remove("hidden");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "✅ Egg hatched";
    confirmBtn.title = "";
  } else if (hasDelta) {
    confirmBtn.classList.remove("hidden");
    confirmBtn.disabled = false;
    confirmBtn.textContent = "🐣 Hatch Egg";
    confirmBtn.title = "";
  } else {
    // No novel delta — show the button but keep it unclickable
    confirmBtn.classList.remove("hidden");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "🐣 Hatch Egg";
    confirmBtn.title = "No new knowledge found to add";
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
      analyzeBtnText.textContent = "🔄 Analyze Again";
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
        const s = h.saved === "saved" ? "saved" : h.saved === "skip" ? "collected" : "analyzed";
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
        stage1Payload: (entry.result?.stage === "stage1" ? stage1Payload : existing.stage1Payload),
        stage1ContentAnalysis: (entry.result?.stage === "stage1" ? stage1ContentAnalysis : existing.stage1ContentAnalysis),
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
    ? "saved" : entry.saved === "skip" ? "collected" : "analyzed";
  processedMessage.textContent = `Captured ${when} (${stateLabel}) — showing stored result.`;
  processedNote.classList.remove("hidden");

  // Version selector when multiple captures exist
  renderHistorySelect(entry.nutId);
}

/** Render clickable source pills and supporting quotes for a Q&A answer. */
function renderQaSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return "";

  const validSources = sources.filter((s) => s && s.ref && String(s.ref).trim().length > 0);
  if (validSources.length === 0) return "";

  const items = validSources
    .map((s) => {
      const ref = String(s.ref).trim();
      const isTime = /^\d{1,2}(:\d{2}){1,2}$/.test(ref);
      const pillClass = isTime ? "source-pill source-timestamp" : "source-pill source-section";
      const icon = isTime ? "⏱️" : "§";
      const dataAttr = isTime
        ? `data-time="${escapeHtml(ref)}"`
        : `data-heading="${escapeHtml(ref)}"`;
      const quoteText = s.quote ? String(s.quote).trim() : "";
      const quoteAttr = quoteText ? ` data-quote="${escapeHtml(quoteText)}"` : "";
      const quoteTitle = quoteText
        ? ` title="${escapeHtml(quoteText)}"`
        : (isTime ? ` title="Jump to ${escapeHtml(ref)} in video"` : ` title="Scroll to section: ${escapeHtml(ref)}"`);

      const quoteHtml = quoteText
        ? `<span class="source-quote" title="${escapeHtml(quoteText)}">“${escapeHtml(quoteText)}”</span>`
        : "";

      return `
        <div class="qa-source-item">
          <button type="button" class="${pillClass}" ${dataAttr}${quoteAttr}${quoteTitle}>
            <span class="source-icon">${icon}</span>
            <span class="source-ref">${escapeHtml(ref)}</span>
          </button>
          ${quoteHtml}
        </div>`;
    })
    .join("");

  return items ? `<div class="qa-sources"><div class="qa-sources-label">📍 Sources:</div>${items}</div>` : "";
}

/** Render the Mind Map hierarchical concept tree. */
function renderMindMap(nodes) {
  if (!mindmapTree) return;
  mindmapTree.innerHTML = "";
  if (!Array.isArray(nodes) || nodes.length === 0) return;

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
      toggleBtn.setAttribute("aria-label", "Toggle branch");
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

  for (const node of nodes) {
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
    labelEl.textContent = all.length > 0 ? "💭 Questions & Answers" : "💭 Ask a Question";
  }

  if (followupInput) {
    followupInput.placeholder = all.length > 0
      ? "Ask a follow-up question about this content…"
      : "Ask a question about this content…";
  }

  if (all.length > 0) {
    customQuestionsList.innerHTML = all
      .map((qa) => `
        <div class="egg-group">
          <div class="qa-item">
            <div class="qa-question">Q: ${escapeHtml(qa.question)}</div>
            <div class="qa-answer">${escapeHtml(qa.answer)}</div>
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
  const q = followupInput.value.trim();
  if (!q || followupBtn.disabled) return;
  followupInput.value = "";
  followupBtn.disabled = true;
  followupBtn.textContent = "…";
  followUpQa.push({ question: q, answer: "…" });
  renderCustomQuestions();

  try {
    if (!extractedContent) {
      await extractPageContent();
    }
    const payload = {
      url: extractedContent?.url || analysisResult?.url || "",
      title: extractedContent?.title || analysisResult?.title || "",
      content: extractedContent?.content || "",
      sourceType: extractedContent?.sourceType || analysisResult?.sourceType || "generic",
      questions: [q],
      priorQa: buildPriorQa(),
    };
    const response = await chrome.runtime.sendMessage({ action: "ask", payload });

    const answers = response?.answers || [];
    const ansObj = answers[0];
    const answer = ansObj?.answer || response?.error || "No answer returned.";
    followUpQa[followUpQa.length - 1] = {
      question: q,
      answer,
      sources: ansObj?.sources,
    };
  } catch (err) {
    followUpQa[followUpQa.length - 1] = {
      question: q,
      answer: `Failed to get answer: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }

  followupBtn.disabled = false;
  followupBtn.textContent = "Ask";
  renderCustomQuestions();
}

/** All Q&A seen so far — context so follow-ups can refer back instead of repeating. */
function buildPriorQa() {
  const eggQa = (analysisResult?.eggResults || []).flatMap(
    (r) => r.keyQuestionAnswers || []
  );
  const customQa = analysisResult?.customQuestionAnswers || [];
  return [...eggQa, ...customQa, ...followUpQa.filter((qa) => qa.answer !== "…")];
}

/** Seek the active tab's video to a chapter timestamp. */
async function seekToChapter(seconds) {
  if (activeTabId == null) return;
  try {
    await chrome.tabs.sendMessage(activeTabId, { action: "nutegg-seek", seconds });
  } catch {
    // Content script not injected — inject and retry
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: [
          "src/content/utils.js",
          "src/content/extractors/youtube.js",
          "src/content/extractors/twitter.js",
          "src/content/extractors/article.js",
          "src/content/extractors/generic.js",
          "src/content/content-script.js",
        ],
      });
      await chrome.tabs.sendMessage(activeTabId, { action: "nutegg-seek", seconds });
    } catch { /* page doesn't allow injection */ }
  }
}

/** Scroll the active tab to a section heading or quote text. */
async function scrollToSection(heading, quote) {
  if (activeTabId == null) return;
  try {
    await chrome.tabs.sendMessage(activeTabId, { action: "nutegg-scroll-to", heading, quote });
  } catch {
    // Content script not injected — inject and retry
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: [
          "src/content/utils.js",
          "src/content/extractors/youtube.js",
          "src/content/extractors/twitter.js",
          "src/content/extractors/article.js",
          "src/content/extractors/generic.js",
          "src/content/content-script.js",
        ],
      });
      await chrome.tabs.sendMessage(activeTabId, { action: "nutegg-scroll-to", heading, quote });
    } catch { /* page doesn't allow injection */ }
  }
}

/** Handle click on source pills (timestamp seek or section scroll). */
function handleSourcePillClick(e) {
  const pill = e.target.closest(".source-pill");
  if (!pill) return;
  e.preventDefault();
  e.stopPropagation();

  if (pill.dataset.time) {
    seekToChapter(timeToSeconds(pill.dataset.time));
  } else if (pill.dataset.heading) {
    scrollToSection(pill.dataset.heading, pill.dataset.quote || "");
  }
}

/** "MM:SS" or "HH:MM:SS" → seconds. */
function timeToSeconds(time) {
  const parts = time.split(":").map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;
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
}

// --- Confirm (add to knowledge base) ---

async function handleConfirm() {
  if (!analysisResult || eggHatched || !(analysisResult.newKnowledge?.length)) return;
  if (!extractedContent) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Retrieving…";
    await extractPageContent();
  }
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Hatching...";
  await doSave(analysisResult.newKnowledge || [], true);
  updateActionButtons();
}

// --- Collect Nut (save content only, no knowledge additions) ---

async function handleSaveRaw() {
  if (nutCollected) return; // already collected — no duplicate work
  if (!extractedContent) {
    if (collectNutBtn) {
      collectNutBtn.disabled = true;
      collectNutBtn.textContent = "Retrieving…";
    }
    if (stage1SkipBtn) {
      stage1SkipBtn.disabled = true;
      stage1SkipBtn.textContent = "Retrieving…";
    }
    await extractPageContent();
  }
  if (!extractedContent) {
    showError("Could not extract page content to save.");
    updateActionButtons();
    return;
  }
  if (collectNutBtn) {
    collectNutBtn.disabled = true;
    collectNutBtn.textContent = "Collecting...";
  }
  if (stage1SkipBtn) {
    stage1SkipBtn.disabled = true;
    stage1SkipBtn.textContent = "Collecting...";
  }
  await doSave([], false);
  updateActionButtons();
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
  const content = overrideContent || (isTargetActive ? extractedContent : null);
  const result = overrideResult || (isTargetActive ? analysisResult : null);
  const nutId = overrideNutId ?? (isTargetActive ? currentNutId : null);

  try {
    if (!content && isTargetActive) {
      await extractPageContent();
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
              .map((m) => `${m.entries} unprocessed entries merged into ${m.egg}`)
              .join(", ")}`
          : "";
        const isStage1BoxVisible = result?.stage === "stage1" && stage1ConfirmBox && !stage1ConfirmBox.classList.contains("hidden");
        if (isStage1BoxVisible) {
          // In Stage 1, stage1-confirm-box updates in-place to show the saved state.
          // Hide successBanner so only one message is displayed.
          successBanner.classList.add("hidden");
        } else {
          if (newKnowledge.length > 0) {
            successMessage.textContent = `Egg hatched — knowledge added and nut collected!${mergedNote}`;
          } else if (isHatch) {
            successMessage.textContent = `Egg hatched — nut collected! (No new knowledge needed to add)`;
          } else {
            successMessage.textContent = "Nut collected to Obsidian vault!";
          }
          successBanner.classList.remove("hidden");
        }
        updateActionButtons();
        fetchMetrics();
      }
    } else {
      if (isTargetActive) {
        showError(response?.error || "Failed to save");
      }
    }
  } catch (err) {
    if (isTargetActive) {
      showError(err instanceof Error ? err.message : "Failed to save");
    }
  }
}

function handleDiscard() { window.close(); }

// --- Messages ---

function showError(msg, errorCode) {
  errorMessage.textContent = msg;
  errorBanner.classList.remove("hidden");
  const hints = {
    no_api_key: 'Open Obsidian Settings → NutEgg, enable <strong>Developer Mode</strong>, and add your API key.',
    auth_failed: 'Your API key was rejected. Double-check it in Obsidian Settings → NutEgg.',
    forbidden: 'Your account may not have access to this model, or needs a funded billing plan.',
    model_not_found: 'The model name may be incorrect. Go to Settings and try a different model.',
    rate_limited: 'Too many requests. Wait a moment before trying again.',
    quota_exceeded: 'Check your account balance or billing settings at your AI provider.',
    network_error: 'Cannot reach the AI service. Check your internet connection.',
    server_error: 'The AI service may be temporarily down. Try again in a minute.',
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
