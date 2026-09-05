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
const keyQuestionsSection = document.getElementById("keyquestions-section");
const keyQuestionsList = document.getElementById("keyquestions-list");
const deltaSection = document.getElementById("delta-section");
const deltaList = document.getElementById("delta-list");
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

let extractedContent = null;
let serverOnline = false;
let analysisResult = null;
let activeTabId = null;
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

// --- Init ---

document.addEventListener("DOMContentLoaded", async () => {
  const versionTag = document.getElementById("version-tag");
  if (versionTag) {
    const version = chrome.runtime?.getManifest?.()?.version;
    if (version) versionTag.textContent = `NutEgg v${version}`;
  }

  analyzeBtn.addEventListener("click", () => handleAnalyze(false));
  confirmBtn.addEventListener("click", handleConfirm);
  collectNutBtn.addEventListener("click", handleSaveRaw);
  discardBtn.addEventListener("click", handleDiscard);
  backBtn.addEventListener("click", showCaptureState);
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
    // The analysis runs in the background while the old results stay
    // visible — reflect that on the button so the UI doesn't look dead.
    reanalyzeEggsBtn.disabled = true;
    const original = reanalyzeEggsBtn.textContent;
    reanalyzeEggsBtn.textContent = "⏳ Re-analyzing…";
    eggsErrorEl.classList.add("hidden");
    const error = await handleAnalyze(true, [...selectedEggs]);
    reanalyzeEggsBtn.disabled = false;
    reanalyzeEggsBtn.textContent = original;
    if (error) {
      // The capture-state error banner is hidden in the results view —
      // surface the failure inline under the egg picker.
      eggsErrorEl.textContent = `❌ ${error}`;
      eggsErrorEl.classList.remove("hidden");
    }
  });
  // Egg picker is collapsed by default — expand on demand
  eggsToggle.addEventListener("click", () => {
    const expanded = eggsExpanded.classList.toggle("hidden");
    eggsToggleChevron.textContent = expanded ? "▾" : "▸";
  });
  reanalyzeBtn.addEventListener("click", () => handleAnalyze(true));
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
 * Re-run the capture flow for the currently active tab: reset state, extract
 * content, then show the cached result when the URL was processed before.
 * `refreshSeq` guards against interleaved refreshes on rapid tab switches.
 */
async function refreshForCurrentTab() {
  const seq = ++refreshSeq;
  customQuestionsEl.value = "";
  followupInput.value = "";
  preSelectedEggs.clear();
  updateCaptureEggsLabel();
  processedNote.classList.add("hidden");
  historySelect.classList.add("hidden");
  historySelect.innerHTML = "";
  captureHistory = []; // fresh URL — old history doesn't apply
  // Drop the previous tab's content too — if the new tab can't be extracted
  // (restricted page, PDF, ...), a stale url must not re-render old results
  // via loadHistoryIfAny or re-apply the old transcript warning.
  extractedContent = null;
  showCaptureState();
  analyzeBtn.disabled = true;
  analyzeBtnText.textContent = "Analyze";

  await checkServerStatus();
  if (seq !== refreshSeq) return;
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
    // If this URL was processed before, show the latest result immediately
    await loadHistoryIfAny(seq);
  }
}

/** 🔄 Refresh button — no-op while a retrieval is already in flight. */
async function handleRefresh() {
  if (extractionPending) return; // still retrieving — do nothing
  await refreshForCurrentTab();
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
      // The new egg now matches — re-analyze so its key questions and novel
      // delta show up (handleAnalyze re-renders everything on success)
      await handleAnalyze(true);
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

/** Title → snake_case egg name fallback. */
function slugify(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
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
      reanalyzeEggsBtn.classList.remove("hidden");
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
  } else {
    serverStatus.className = "status-dot offline";
    updateServerStatusTooltip(false);
    aiCreditPill?.classList.add("hidden");
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
    sub.textContent = "Start Obsidian with NutEgg";
    serverStatus.setAttribute("aria-label", "Obsidian is offline. Start Obsidian with NutEgg");
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
async function handleAnalyze(force = false, eggsOverride = null) {
  if (!serverOnline) {
    showError("Obsidian server is offline. Start Obsidian with NutEgg plugin.");
    return "Obsidian server is offline. Start Obsidian with NutEgg plugin.";
  }
  if (!extractedContent) {
    showError("Could not extract page content. Try refreshing.");
    return "Could not extract page content. Try refreshing.";
  }
  if (isTranscriptBlocked()) {
    applyTranscriptBlock();
    return "Video transcript unavailable — NutEgg will not process this video.";
  }

  analyzeBtn.disabled = true;
  analyzeBtnText.textContent = "Analyzing...";
  hideMessages();

  try {
    const questions = customQuestionsEl.value
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

    const targetEggs = eggsOverride || (preSelectedEggs.size > 0 ? [...preSelectedEggs] : null);
    const payload = {
      url: extractedContent.url || "",
      title: extractedContent.title || "",
      content: extractedContent.content || "",
      sourceType: extractedContent.sourceType || "generic",
      metadata: extractedContent.metadata,
      chapters: extractedContent.chapters || undefined,
      questions,
      force,
      ...(targetEggs ? { eggs: targetEggs } : {}),
    };

    if (force) {
      reanalyzeBtn.disabled = true;
      reanalyzeBtn.textContent = "Analyzing…";
    }
    const response = await chrome.runtime.sendMessage({ action: "analyze", payload });
    if (force) {
      reanalyzeBtn.disabled = false;
      reanalyzeBtn.textContent = "🔄 Re-analyze";
    }

    // This URL has cached captures — show the latest with its timestamp,
    // plus history browsing and a way to force a fresh analysis.
    if (response?.history) {
      captureHistory = response.history;
      showHistoryEntry(response.latest || response.history[0]);
      return null;
    }

    if (response?.error) {
      showError(response.error, response.errorCode);
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "Analyze";
      return response.error;
    }

    // Fresh analysis — a NEW capture row was created in the DB.
    // Keep it in captureHistory so Back shows "Analyze Again".
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
    currentNutId = response.nutId ?? null;
    followUpQa = [];
    followupInput.value = "";
    nutCollected = false;
    eggHatched = false;
    analysisResult = response;
    showResultsState(response, provenanceFromExtraction());
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    showError(message);
    analyzeBtn.disabled = false;
    analyzeBtnText.textContent = "Analyze";
    return message;
  }
}

// --- Show results ---

function showResultsState(result, provenance = null) {
  captureState.classList.add("hidden");
  resultsState.classList.remove("hidden");
  processedNote.classList.add("hidden");
  renderResultProvenance(provenance);

  // No egg matched — offer to create one (prefilled with the AI suggestion)
  const noEgg = (result.matchedEggs || []).length === 0;
  if (noEgg) {
    noEggSection.classList.remove("hidden");
    newEggName.value =
      result.suggestedEgg?.name || slugify(extractedContent?.title || "");
    newEggDescription.value = result.suggestedEgg?.description || "";
  } else {
    noEggSection.classList.add("hidden");
  }

  // Egg picker — sync the checklist with _index.md, then render it with
  // this result's matched eggs (user edits + re-analyze changes the match)
  fetchEggs().then(() => renderEggsSection(result.matchedEggs || []));

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

  // Key Questions — grouped per egg
  const qaGroups = (result.eggResults || []).filter(
    (r) => r.keyQuestionAnswers && r.keyQuestionAnswers.length > 0
  );
  if (qaGroups.length > 0) {
    keyQuestionsSection.classList.remove("hidden");
    keyQuestionsList.innerHTML = qaGroups
      .map((r) => `
        <div class="egg-group">
          <div class="knowledge-egg">📄 ${escapeHtml(r.egg)}</div>
          ${r.keyQuestionAnswers
            .map((qa) => `
              <div class="qa-item">
                <div class="qa-question">Q: ${escapeHtml(qa.question)}</div>
                <div class="qa-answer">${escapeHtml(qa.answer)}</div>
              </div>`)
            .join("")}
        </div>`)
      .join("");
  } else {
    keyQuestionsSection.classList.add("hidden");
    keyQuestionsList.innerHTML = "";
  }

  // Knowledge Entries (New Insights vs Existing Tree)
  const eggResults = result.eggResults || [];
  const hasAnyKnowledge = eggResults.some(
    (r) =>
      (r.novelDelta && r.novelDelta.length > 0) ||
      (r.redundantEntries && r.redundantEntries.length > 0) ||
      (r.existingKnowledge && r.existingKnowledge.trim().length > 0)
  );

  if (hasAnyKnowledge) {
    deltaSection.classList.remove("hidden");
    deltaList.innerHTML = eggResults
      .map((r) => {
        const newDeltas = r.novelDelta || [];
        const redundantDeltas = r.redundantEntries || [];
        const existingKnowledge = (r.existingKnowledge || "").trim();

        let newHtml = "";
        if (newDeltas.length > 0) {
          newHtml = `
            <div class="knowledge-subsection">
              <div class="knowledge-subhead new-subhead">✨ New Insights (${newDeltas.length})</div>
              ${newDeltas
                .map((d) => `
                  <div class="delta-item is-new">
                    <div class="delta-header">
                      <span class="delta-badge badge-new">+ New Entry</span>
                      <span class="delta-parent">🐣 → Unprocessed${d.parent ? ` · suggested under: <strong>${escapeHtml(d.parent)}</strong>` : ""}</span>
                    </div>
                    <div class="delta-content">${escapeHtml(d.content)}</div>
                  </div>`)
                .join("")}
            </div>`;
        }

        let redundantHtml = "";
        if (redundantDeltas.length > 0) {
          redundantHtml = `
            <div class="knowledge-subsection">
              <div class="knowledge-subhead covered-subhead">✅ Already in Tree (${redundantDeltas.length})</div>
              ${redundantDeltas
                .map((d) => `
                  <div class="delta-item is-covered">
                    <div class="delta-header">
                      <span class="delta-badge badge-covered">Covered</span>
                      <span class="delta-parent">${d.existingParent ? `under: <strong>${escapeHtml(d.existingParent)}</strong>` : "Already known"}</span>
                    </div>
                    <div class="delta-content">${escapeHtml(d.content)}</div>
                  </div>`)
                .join("")}
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
          <div class="egg-group">
            <div class="knowledge-egg">📄 ${escapeHtml(r.egg)}</div>
            ${newHtml}
            ${redundantHtml}
            ${treeHtml}
          </div>`;
      })
      .join("");

    // Wire tree toggle buttons
    deltaList.querySelectorAll(".existing-tree-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const body = btn.closest(".existing-tree-container")?.querySelector(".existing-tree-body");
        if (body) {
          const isHidden = body.classList.toggle("hidden");
          btn.textContent = isHidden ? "▸ View Tree" : "▾ Hide Tree";
        }
      });
    });
  } else {
    deltaSection.classList.add("hidden");
    deltaList.innerHTML = "";
  }

  // Verdict
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

  successBanner.classList.add("hidden");
  updateActionButtons();
}

/** Reflect nutCollected/eggHatched in the two action buttons. */
function updateActionButtons() {
  if (nutCollected) {
    collectNutBtn.disabled = true;
    collectNutBtn.textContent = "✅ Nut collected";
  } else {
    collectNutBtn.disabled = false;
    collectNutBtn.textContent = "🥜 Collect Nut";
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
    confirmBtn.textContent = "🥚 Hatch Egg";
    confirmBtn.title = "";
  } else {
    // No novel delta — show the button but keep it unclickable
    confirmBtn.classList.remove("hidden");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "🥚 Hatch Egg";
    confirmBtn.title = "No new knowledge found to add";
  }
}

/**
 * On popup open: if this URL has cached captures, show the latest result
 * without waiting for the user to click Analyze.
 */
async function loadHistoryIfAny(seq = refreshSeq) {
  if (!serverOnline || !extractedContent?.url) return;
  try {
    const response = await chrome.runtime.sendMessage({
      action: "history",
      url: extractedContent.url,
    });
    if (seq !== refreshSeq) return; // a newer tab refresh superseded this one
    if (response?.history?.length) {
      captureHistory = response.history;
      showHistoryEntry(response.latest || response.history[0]);
      analyzeBtnText.textContent = "🔄 Analyze Again";
    }
  } catch {
    // Server unreachable or no history — stay in capture state
  }
}

/** Show one cached capture (from history) with its capture timestamp. */
function showHistoryEntry(entry) {
  cachedProcessedSaved = entry.saved || "analyzed";
  nutCollected = cachedProcessedSaved === "saved" || cachedProcessedSaved === "skip";
  eggHatched = cachedProcessedSaved === "saved";
  currentNutId = entry.nutId ?? null;
  analysisResult = entry.result;
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
    const payload = {
      url: extractedContent.url || "",
      title: extractedContent.title || "",
      content: extractedContent.content || "",
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
  hideMessages();
}

// --- Confirm (add to knowledge base) ---

async function handleConfirm() {
  if (!analysisResult || eggHatched || !(analysisResult.newKnowledge?.length)) return;
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Hatching...";
  await doSave(analysisResult.newKnowledge || []);
  updateActionButtons();
}

// --- Collect Nut (save content only, no knowledge additions) ---

async function handleSaveRaw() {
  if (!extractedContent || nutCollected) return; // already collected — no duplicate work
  collectNutBtn.disabled = true;
  collectNutBtn.textContent = "Collecting...";
  await doSave([]);
  updateActionButtons();
}

async function doSave(newKnowledge) {
  try {
    const payload = {
      url: extractedContent.url || "",
      title: extractedContent.title || "",
      content: extractedContent.content || "",
      sourceType: extractedContent.sourceType || "generic",
      metadata: extractedContent.metadata,
      summary: analysisResult?.summary || "",
      matchedEggs: analysisResult?.matchedEggs || [],
      newKnowledge,
      analysis: analysisResult || undefined,
      nutId: currentNutId ?? undefined,
      // Hatching collects the nut too — skip the raw save only when the
      // nut was already collected (this session or a previous one).
      // "analyzed" means processed but never saved, so the raw must be saved.
      skipRaw: newKnowledge.length > 0 &&
        (nutCollected || (cachedProcessedSaved !== null && cachedProcessedSaved !== "analyzed")),
    };

    const response = await chrome.runtime.sendMessage({ action: "confirm", payload });

    if (response?.success) {
      if (newKnowledge.length > 0) {
        // Hatching the egg collects the nut as well
        eggHatched = true;
        nutCollected = true;
      } else {
        nutCollected = true;
      }
      // Keep the capture history entry in sync with the new save state
      const entry = captureHistory.find((h) => h.nutId === currentNutId);
      if (entry) entry.saved = newKnowledge.length > 0 ? "saved" : "skip";
      const merged = response?.merged || [];
      const mergedNote = merged.length > 0
        ? ` 🧹 ${merged
            .map((m) => `${m.entries} unprocessed entries merged into ${m.egg}`)
            .join(", ")}`
        : "";
      successMessage.textContent = newKnowledge.length > 0
        ? `Egg hatched — knowledge added and nut collected!${mergedNote}`
        : "Nut collected!";
      successBanner.classList.remove("hidden");
      updateActionButtons();
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
