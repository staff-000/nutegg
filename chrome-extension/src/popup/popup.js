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

let extractedContent = null;
let serverOnline = false;
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

// --- Init ---

document.addEventListener("DOMContentLoaded", async () => {
  const versionTag = document.getElementById("version-tag");
  if (versionTag) {
    const version = chrome.runtime?.getManifest?.()?.version;
    if (version) versionTag.textContent = `NutEgg ${version}`;
  }

  // Restore analysis mode preference
  try {
    const stored = await new Promise((resolve) => {
      chrome.storage?.local?.get?.(["analysisMode"], resolve);
    });
    if (stored?.analysisMode === "confirm" || stored?.analysisMode === "fast") {
      setAnalysisMode(stored.analysisMode);
    }
  } catch {}

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
  stage1ProceedBtn?.addEventListener("click", () => handleProceedStage2(null, true));
  stage1SkipBtn?.addEventListener("click", handleSaveRaw);

  analyzeBtn.addEventListener("click", () => handleAnalyze(true));
  confirmBtn.addEventListener("click", handleConfirm);
  collectNutBtn.addEventListener("click", handleSaveRaw);
  discardBtn.addEventListener("click", handleDiscard);
  backBtn.addEventListener("click", () => {
    showCaptureState();
    if (!extractedContent) {
      extractPageContent();
    }
  });
  settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
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
    reanalyzeEggsBtn.disabled = true;
    const original = reanalyzeEggsBtn.textContent;
    reanalyzeEggsBtn.textContent = "⏳ Analyzing…";
    eggsErrorEl.classList.add("hidden");
    if (stage1ContentAnalysis) {
      await handleProceedStage2([...selectedEggs], false);
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
  reanalyzeBtn.addEventListener("click", () => handleAnalyze(true, null, true));
  historySelect.addEventListener("change", () => {
    const idx = parseInt(historySelect.value, 10);
    if (captureHistory[idx]) showHistoryEntry(captureHistory[idx]);
  });

  // The side panel persists across tabs — refresh content when the user
  // switches to another tab or the active tab navigates to a new URL.
  chrome.tabs.onActivated.addListener(() => refreshForCurrentTab());
  // Reopen handling: browsers that keep the side-panel document alive while
  // the panel is closed don't re-fire DOMContentLoaded. Refresh on show —
  // but only when the displayed content belongs to a DIFFERENT tab. Plain
  // window focus loss/regain also fires visibilitychange, and that must NOT
  // reset the results the user was looking at.
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id != null && tab.id !== activeTabId) refreshForCurrentTab();
    } catch {
      // tabs API unavailable — leave the current state alone
    }
  });
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    // Page finished loading: retry extraction when it ran mid-load or failed
    // (e.g. YouTube captions not ready yet).
    if (changeInfo.status === "complete") {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id === tabId && (lastLoadWasLoading || extractionFailed)) {
        refreshForCurrentTab();
      }
      return;
    }
    if (!changeInfo.url) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === tabId) refreshForCurrentTab();
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
  // Drop the previous tab's content too — if the new tab can't be extracted
  // (restricted page, PDF, ...), a stale url must not re-render old results
  // via loadHistoryIfAny or re-apply the old transcript warning.
  extractedContent = null;
  analyzeBtn.disabled = true;
  analyzeBtnText.textContent = "Analyze";

  let tabUrl = "";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id != null) activeTabId = tab.id;
    if (tab?.url) {
      tabUrl = tab.url;
      pageTitle.textContent = tab.title || "Loading...";
      pageUrl.textContent = tab.url;
      pageType.textContent = detectPageTypeFromUrl(tab.url);
    }
  } catch {}

  if (seq !== refreshSeq) return;

  await checkServerStatus();
  if (seq !== refreshSeq) return;

  // Check if this URL has been captured before — skip content retrieval if so!
  if (!forceExtract && serverOnline && tabUrl) {
    const captured = await loadHistoryIfAny(seq, tabUrl);
    if (seq !== refreshSeq) return;
    if (captured) {
      await checkConfigStatus();
      if (seq !== refreshSeq) return;
      await fetchMetrics();
      if (seq !== refreshSeq) return;
      await fetchEggs();
      return;
    }
  }

  // Not captured before (or force-refresh requested) — show capture state and retrieve content
  showCaptureState();
  await extractPageContent(seq);
  if (seq !== refreshSeq) return;

  if (serverOnline) {
    await checkConfigStatus();
    if (seq !== refreshSeq) return;
    await fetchMetrics();
    if (seq !== refreshSeq) return;
    await fetchEggs();
    if (seq !== refreshSeq) return;
    if (extractedContent && !isTranscriptBlocked()) {
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "Analyze";
    }
    // Fallback: check if the canonical/cleaned extracted URL has history
    if (extractedContent?.url && extractedContent.url !== tabUrl) {
      await loadHistoryIfAny(seq, extractedContent.url);
    }
  }
}

/** 🔄 Refresh button — no-op while a retrieval is already in flight. */
async function handleRefresh() {
  if (extractionPending) return; // still retrieving — do nothing
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

async function handleProceedStage2(eggsToCompare = null, autoSave = false, skipScroll = false) {
  const isExplicitEggs = Array.isArray(eggsToCompare);
  const targetEggs = isExplicitEggs ? eggsToCompare : [...selectedEggs];
  if (!isExplicitEggs && targetEggs.length === 0) {
    if (eggsExpanded) eggsExpanded.classList.remove("hidden");
    if (eggsToggleChevron) eggsToggleChevron.textContent = "▾";
    const eggSec = document.getElementById("eggs-section");
    if (eggSec) eggSec.scrollIntoView({ behavior: "smooth", block: "nearest" });
    showWarning("Please select or create at least one egg to hatch.");
    return;
  }

  if (stage1ProceedBtn) {
    stage1ProceedBtn.disabled = true;
    stage1ProceedBtn.textContent = autoSave ? "Hatching the egg…" : "Analyzing egg…";
  }
  hideMessages();

  try {
    const payload = {
      ...stage1Payload,
      stage: 2,
      eggs: targetEggs,
      contentAnalysis: stage1ContentAnalysis || {
        titleVerdict: analysisResult?.titleVerdict || "",
        coreSummary: analysisResult?.coreSummary || [],
        isLongForm: analysisResult?.isLongForm || false,
        chapterMap: analysisResult?.chapterMap || [],
        customQuestionAnswers: analysisResult?.customQuestionAnswers || [],
      },
    };

    const response = await chrome.runtime.sendMessage({ action: "analyze", payload });
    if (response?.error) {
      showError(response.error, response.errorCode);
      if (stage1ProceedBtn) {
        stage1ProceedBtn.disabled = false;
        updateStage1ProceedBtn();
      }
      return;
    }

    if (response.nutId) {
      currentNutId = response.nutId;
      cachedProcessedSaved = null;
      captureHistory = [
        {
          nutId: response.nutId,
          capturedAt: new Date().toISOString(),
          saved: "analyzed",
          result: response,
        },
        ...captureHistory,
      ];
    }

    response.stage = "stage2";
    showResultsState(response, provenanceFromExtraction());
    if (autoSave) {
      await doSave(response.newKnowledge || [], true);
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
    showError(err instanceof Error ? err.message : "Hatching failed");
    if (stage1ProceedBtn) {
      stage1ProceedBtn.disabled = false;
      updateStage1ProceedBtn();
    }
  }
}

// --- Metrics ---

async function fetchMetrics() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "metrics" });
    if (response) {
      metricNuts.textContent = response.nuts || 0;
      metricEggs.textContent = response.eggs || 0;
      metricTime.textContent = response.timeSaved || "0m";
    }
  } catch {
    // server may not support /metrics yet
  }
}

// --- Config & Credit status ---

async function checkConfigStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "config-status" });
    if (response?.issues && response.issues.length > 0) {
      showWarning(response.issues.join(" "));
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
  } catch {
    serverOnline = false;
  }

  if (serverOnline) {
    serverStatus.className = "status-dot online";
    updateServerStatusTooltip(true);
    checkCreditStatus();
    obsidianPluginLink?.classList.add("hidden");
  } else {
    serverStatus.className = "status-dot offline";
    updateServerStatusTooltip(false);
    aiCreditPill?.classList.add("hidden");
    obsidianPluginLink?.classList.remove("hidden");
  }
}

function updateServerStatusTooltip(isOnline) {
  const tooltip = document.getElementById("server-status-tooltip");
  const title = document.getElementById("status-tooltip-title");
  const sub = document.getElementById("status-tooltip-sub");
  if (!tooltip || !title || !sub) return;

  if (isOnline) {
    tooltip.className = "status-tooltip online";
    title.textContent = "Obsidian is online";
    sub.textContent = "Ready to capture";
    serverStatus.setAttribute("aria-label", "Obsidian is online");
  } else {
    tooltip.className = "status-tooltip offline";
    title.textContent = "Obsidian is offline";
    sub.textContent = "Click dot to install NutEgg plugin";
    serverStatus.setAttribute("aria-label", "Obsidian is offline. Click dot to install NutEgg plugin");
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
 * Extract content from the active tab. `seq` guards the UI: a superseded
 * attempt (newer tab refresh started meanwhile) must not write stale
 * content — or worse, its failure message — over the current attempt's
 * "retrieving" state.
 *
 * Two defenses against "early" snapshots:
 *   1. wait for the page to settle (document complete + YouTube shell
 *      rendered) before extracting,
 *   2. after extracting, verify the page's URL didn't change mid-flight
 *      (SPA navigation race) — retry once when it did.
 */
async function extractPageContent(seq = refreshSeq) {
  extractionFailed = false;
  lastLoadWasLoading = false;
  extractionPending = true;
  refreshBtn.disabled = true;
  contentPreview.textContent = "Retrieving content…";
  pageAuthorEl.textContent = "";
  pagePublishedEl.textContent = "";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (seq !== refreshSeq) return;
    if (!tab?.id) { pageTitle.textContent = "Unknown Page"; return; }
    activeTabId = tab.id;
    lastLoadWasLoading = tab.status === "loading";

    pageTitle.textContent = tab.title || "Retrieving…";
    pageUrl.textContent = tab.url || "";
    pageType.textContent = detectPageTypeFromUrl(tab.url || "");

    // 1. Let the page settle — an early snapshot of a half-rendered or
    // mid-navigation page is not the content the user wants.
    await waitForPageSettle(tab.id, seq);
    if (seq !== refreshSeq) return;

    // 2. Extract, then verify the page didn't navigate during the fetch
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await tryExtract(tab.id);
      if (seq !== refreshSeq) return;
      if (!response?.success) {
        extractionFailed = true;
        break;
      }
      const after = await requestPageIdentity(tab.id);
      if (seq !== refreshSeq) return;
      if (
        after?.url &&
        response.content?.url &&
        after.url !== response.content.url
      ) {
        // The page navigated while extraction ran — take a fresh snapshot
        console.warn("[NutEgg] Page navigated during extraction — retrying");
        continue;
      }
      extractedContent = response.content;
      pageTitle.textContent = response.content.title || tab.title || "Untitled";
      pageType.textContent = response.content.sourceType || pageType.textContent;
      contentPreview.textContent = response.content.content || "(No content extracted)";
      showProvenance(response.content.metadata || {});
      break;
    }
  } catch {
    // Unexpected (e.g. extension context invalidated by a reload) — keep the
    // page title rather than showing a misleading "Error loading page"
    extractionFailed = true;
  } finally {
    // Only the CURRENT attempt may flip the pending state — an older attempt
    // finishing late must not re-enable the button while a newer one runs.
    if (seq === refreshSeq) {
      extractionPending = false;
      refreshBtn.disabled = false;
    }
  }
  if (seq !== refreshSeq) return; // superseded — leave the UI alone
  if (extractionFailed && !extractedContent) {
    contentPreview.textContent = "(Could not extract content)";
    showWarning(
      "Could not extract content from this page — it may be restricted (chrome://, Web Store) or still loading. Click 🔄 to try again, or the panel retries once the page finishes loading."
    );
  }
  applyTranscriptBlock();
}

/**
 * Extract via the content script, injecting it first when needed.
 * Returns the message response or null (restricted page / unreachable).
 */
async function tryExtract(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: "extract-content" });
    if (response?.success) return response;
  } catch {
    // Content script not injected yet (page mid-load, or never injected)
  }
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
  } catch {
    return null; // Restricted page (chrome://, Web Store, PDF viewer)
  }
  try {
    return await chrome.tabs.sendMessage(tabId, { action: "extract-content" });
  } catch {
    return null;
  }
}

/** Cheap page-state check (no transcript fetching). Null when unreachable. */
async function requestPageIdentity(tabId) {
  try {
    const resp = await chrome.tabs.sendMessage(tabId, { action: "page-identity" });
    return resp?.success ? resp : null;
  } catch {
    return null;
  }
}

/**
 * Poll page-identity until the page settles (document complete, and for
 * YouTube the watch shell rendered), bounded to ~8s. Returns null when the
 * content script is unreachable — extraction proceeds and reports failure
 * itself.
 */
async function waitForPageSettle(tabId, seq) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (seq !== refreshSeq) return null;
    const identity = await requestPageIdentity(tabId);
    if (!identity) return null;
    if (identity.readyState === "complete" && identity.youtubeReady !== false) {
      return identity;
    }
    await new Promise((r) => setTimeout(r, 400));
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

/** Provenance of the currently extracted page (fresh analyses). */
function provenanceFromExtraction() {
  if (!extractedContent) return null;
  const m = extractedContent.metadata || {};
  return {
    title: extractedContent.title || "",
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
  analyzeBtn.disabled = true;
  analyzeBtnText.textContent = "Transcript unavailable";
  showWarning(
    "Couldn't fetch the video transcript — analysis would be based on the description only and could mislead you. NutEgg will not process this video."
  );
}

// --- Analyze ---

/**
 * Run the analysis. Returns null on success (results rendered) or an error
 * message on failure — callers in the results view surface it inline, since
 * the capture-state error banner is hidden there.
 */
async function handleAnalyze(force = false, eggsOverride = null, isReanalyze = false) {
  if (!serverOnline) {
    showError("Obsidian server is offline. Start Obsidian with NutEgg plugin.");
    return "Obsidian server is offline. Start Obsidian with NutEgg plugin.";
  }

  isReanalyzing = isReanalyze;
  hideMessages();
  if (isReanalyze) {
    processedNote.classList.remove("hidden");
    processedMessage.textContent = "Retrieving page content…";
  }
  if (reanalyzeBtn) {
    reanalyzeBtn.disabled = true;
    reanalyzeBtn.textContent = "Retrieving…";
  }
  analyzeBtn.disabled = true;
  analyzeBtnText.textContent = "Retrieving…";

  try {
    if (force || !extractedContent) {
      await extractPageContent();
    }

    // Fallback: if extraction couldn't get content from the tab, check if we have stored content
    if (!extractedContent && captureHistory.length > 0) {
      const entry = captureHistory[0];
      if (entry?.content) {
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
      }
    }

    if (!extractedContent) {
      showError("Could not extract page content. Try refreshing.");
      return "Could not extract page content. Try refreshing.";
    }
    if (isTranscriptBlocked()) {
      applyTranscriptBlock();
      return "Video transcript unavailable — NutEgg will not process this video.";
    }

    if (isReanalyze) {
      processedNote.classList.remove("hidden");
      processedMessage.textContent = "Analyzing content…";
    }
    if (reanalyzeBtn) {
      reanalyzeBtn.disabled = true;
      reanalyzeBtn.textContent = "Analyzing…";
    }
    analyzeBtn.disabled = true;
    analyzeBtnText.textContent = "Analyzing...";

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
      url: extractedContent.url || "",
      title: extractedContent.title || "",
      content: extractedContent.content || "",
      sourceType: extractedContent.sourceType || "generic",
      metadata: extractedContent.metadata,
      chapters: extractedContent.chapters || undefined,
      questions,
      force: true,
      stage: 1,
      ...(targetEggs && targetEggs.length > 0 ? { eggs: targetEggs } : {}),
    };

    const response = await chrome.runtime.sendMessage({ action: "analyze", payload });

    if (response?.error) {
      showError(response.error, response.errorCode);
      return response.error;
    }

    stage1Payload = payload;
    stage1ContentAnalysis = response;

    cachedProcessedSaved = null;
    followUpQa = [];
    followupInput.value = "";
    nutCollected = false;
    eggHatched = false;
    activeEggTab = null;
    analysisResult = response;

    // For re-analyze (since eggs are already selected on the page) or fast mode, do both stage 1 and stage 2
    const shouldRunStage2 = isReanalyze || analysisMode === "fast";
    const eggsForStage2 = (targetEggs && targetEggs.length > 0)
      ? targetEggs
      : (response.matchedEggs && response.matchedEggs.length > 0 ? response.matchedEggs : []);

    if (shouldRunStage2) {
      // Immediately render Stage 1 (title verdict, summary, chapter map, matched eggs)
      showResultsState(response, provenanceFromExtraction());

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

        await handleProceedStage2(eggsForStage2, false, isReanalyze);
      }

      if (isReanalyze || captureHistory.length > 0) {
        processedMessage.textContent = "Re-analyzed just now — showing fresh result.";
        processedNote.classList.remove("hidden");
      }
    } else {
      if (analysisMode === "confirm") {
        response.stage = "stage1";
        delete response.eggResults;
        delete response.shouldRead;
        delete response.shouldReadReason;
        delete response.newKnowledge;
      }
      showResultsState(response, provenanceFromExtraction());
    }
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    showError(message);
    return message;
  } finally {
    isReanalyzing = false;
    if (reanalyzeBtn) {
      reanalyzeBtn.disabled = false;
      reanalyzeBtn.textContent = "🔄 Re-analyze";
    }
    analyzeBtn.disabled = false;
    analyzeBtnText.textContent = analysisResult ? "🔄 Analyze Again" : "Analyze";
  }
}

// --- Show results ---

function showResultsState(result, provenance = null) {
  analysisResult = result;
  captureState.classList.add("hidden");
  resultsState.classList.remove("hidden");
  if (!isReanalyzing) {
    processedNote.classList.add("hidden");
  } else {
    processedNote.classList.remove("hidden");
  }
  renderResultProvenance(provenance);

  const isStage1 = result.stage === "stage1";

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

  // Title Verdict
  verdictAnswer.textContent = result.titleVerdict || "";

  // Core Summary
  coreSummaryEl.innerHTML = (result.coreSummary || [])
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join("");

  // Chapter Map — clickable when timestamps exist (video)
  if (result.chapterMap && result.chapterMap.length > 0) {
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

/** Show one cached capture (from history) with its capture timestamp. */
function showHistoryEntry(entry) {
  cachedProcessedSaved = entry.saved || "analyzed";
  nutCollected = cachedProcessedSaved === "saved" || cachedProcessedSaved === "skip";
  eggHatched = cachedProcessedSaved === "saved";
  currentNutId = entry.nutId ?? null;
  analysisResult = entry.result;

  if (entry.content && !extractedContent) {
    extractedContent = {
      url: entry.url || pageUrl.textContent || "",
      title: entry.title || "",
      content: entry.content,
      sourceType: entry.sourceType || "webpage",
      metadata: {
        ...(entry.author ? { author: entry.author } : {}),
        ...(entry.publishedAt ? { published: entry.publishedAt } : {}),
      },
    };
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
  if (captureHistory.length > 1) {
    historySelect.classList.remove("hidden");
    historySelect.innerHTML = captureHistory
      .map((h, i) => {
        const d = new Date(h.capturedAt).toLocaleString();
        const s = h.saved === "saved" ? "saved" : h.saved === "skip" ? "collected" : "analyzed";
        const selected = h.nutId === entry.nutId ? " selected" : "";
        return `<option value="${i}"${selected}>${d} — ${s}</option>`;
      })
      .join("");
  } else {
    historySelect.classList.add("hidden");
  }
}

/** Render the "Your Questions" section: initial answers + follow-ups. */
function renderCustomQuestions() {
  const all = [
    ...(analysisResult?.customQuestionAnswers || []),
    ...followUpQa,
  ];
  if (all.length > 0) {
    customQuestionsSection.classList.remove("hidden");
    customQuestionsList.innerHTML = all
      .map((qa) => `
        <div class="egg-group">
          <div class="qa-item">
            <div class="qa-question">Q: ${escapeHtml(qa.question)}</div>
            <div class="qa-answer">${escapeHtml(qa.answer)}</div>
          </div>
        </div>`)
      .join("");
  } else {
    customQuestionsSection.classList.add("hidden");
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
      sourceType: extractedContent.sourceType || "generic",
      questions: [q],
      priorQa: buildPriorQa(),
    };
    const response = await chrome.runtime.sendMessage({ action: "ask", payload });

    const answers = response?.answers || [];
    const answer = answers[0]?.answer || response?.error || "No answer returned.";
    followUpQa[followUpQa.length - 1] = { question: q, answer };
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
  analyzeBtn.disabled = false;
  // Label reflects that this URL was processed before
  analyzeBtnText.textContent = captureHistory.length > 0 ? "🔄 Analyze Again" : "Analyze";
  analysisResult = null;
  cachedProcessedSaved = null;
  followUpQa = [];
  followupInput.value = "";
  nutCollected = false;
  eggHatched = false;
  currentNutId = null;
  activeEggTab = null;
  hideMessages();
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

async function doSave(newKnowledge, isHatch = false) {
  try {
    if (!extractedContent) {
      await extractPageContent();
    }
    const payload = {
      url: extractedContent?.url || analysisResult?.url || "",
      title: extractedContent?.title || analysisResult?.title || "",
      content: extractedContent?.content || "",
      sourceType: extractedContent?.sourceType || "generic",
      metadata: extractedContent?.metadata,
      summary: analysisResult?.summary || "",
      matchedEggs: analysisResult?.matchedEggs || [],
      newKnowledge,
      analysis: analysisResult || undefined,
      nutId: currentNutId ?? undefined,
      // Hatching collects the nut too — skip the raw save only when the
      // nut was already collected (this session or a previous one).
      // "analyzed" means processed but never saved, so the raw must be saved.
      skipRaw: (newKnowledge.length > 0 || isHatch) &&
        (nutCollected || (cachedProcessedSaved !== null && cachedProcessedSaved !== "analyzed")),
    };

    const response = await chrome.runtime.sendMessage({ action: "confirm", payload });

    if (response?.success) {
      if (newKnowledge.length > 0 || isHatch) {
        // Hatching the egg collects the nut as well
        eggHatched = true;
        nutCollected = true;
      } else {
        nutCollected = true;
      }
      // Keep the capture history entry in sync with the new save state
      const entry = captureHistory.find((h) => h.nutId === currentNutId);
      if (entry) entry.saved = (newKnowledge.length > 0 || isHatch) ? "saved" : "skip";
      const merged = response?.merged || [];
      const mergedNote = merged.length > 0
        ? ` 🧹 ${merged
            .map((m) => `${m.entries} unprocessed entries merged into ${m.egg}`)
            .join(", ")}`
        : "";
      const isStage1BoxVisible = analysisResult?.stage === "stage1" && stage1ConfirmBox && !stage1ConfirmBox.classList.contains("hidden");
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
    } else {
      showError(response?.error || "Failed to save");
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : "Failed to save");
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
}
function hideWarning() { warningBanner.classList.add("hidden"); }

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
