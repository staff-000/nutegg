// NutEgg Popup Script — Two-state UI

// DOM — Capture state
const serverStatus = document.getElementById("server-status");
const settingsBtn = document.getElementById("settings-btn");
const pageTitle = document.getElementById("page-title");
const pageUrl = document.getElementById("page-url");
const pageType = document.getElementById("page-type");
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
const confirmBtn = document.getElementById("confirm-btn");
const saveRawBtn = document.getElementById("save-raw-btn");
const discardBtn = document.getElementById("discard-btn");
const backBtn = document.getElementById("back-btn");
const successBanner = document.getElementById("success-banner");
const successMessage = document.getElementById("success-message");
const metricNuts = document.getElementById("metric-nuts");
const metricEggs = document.getElementById("metric-eggs");
const metricTime = document.getElementById("metric-time");

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

// --- Init ---

document.addEventListener("DOMContentLoaded", async () => {
  analyzeBtn.addEventListener("click", () => handleAnalyze(false));
  confirmBtn.addEventListener("click", handleConfirm);
  saveRawBtn.addEventListener("click", handleSaveRaw);
  discardBtn.addEventListener("click", handleDiscard);
  backBtn.addEventListener("click", showCaptureState);
  settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
  questionsToggle.addEventListener("click", () => {
    questionsArea.classList.toggle("hidden");
  });
  followupBtn.addEventListener("click", handleFollowUp);
  followupInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleFollowUp();
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
  // the panel is closed don't re-fire DOMContentLoaded — refresh on show.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshForCurrentTab();
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
  processedNote.classList.add("hidden");
  historySelect.classList.add("hidden");
  historySelect.innerHTML = "";
  captureHistory = []; // fresh URL — old history doesn't apply
  showCaptureState();
  analyzeBtn.disabled = true;
  analyzeBtnText.textContent = "Analyze";

  await checkServerStatus();
  if (seq !== refreshSeq) return;
  await extractPageContent();
  if (seq !== refreshSeq) return;

  if (serverOnline) {
    await checkConfigStatus();
    if (seq !== refreshSeq) return;
    await fetchMetrics();
    if (seq !== refreshSeq) return;
    if (extractedContent && !isTranscriptBlocked()) {
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "Analyze";
    }
    // If this URL was processed before, show the latest result immediately
    await loadHistoryIfAny(seq);
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

// --- Config status ---

async function checkConfigStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "config-status" });
    if (response?.issues && response.issues.length > 0) {
      showWarning(response.issues.join(" "));
    } else {
      hideWarning();
    }
  } catch {
    // handled by server status dot
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
    serverStatus.title = "Obsidian server is online";
  } else {
    serverStatus.className = "status-dot offline";
    serverStatus.title = "Obsidian server is offline — start Obsidian with NutEgg";
  }
}

// --- Content extraction ---

/** True when extraction ran against a still-loading page (retry on complete). */
let lastLoadWasLoading = false;
/** True when extraction failed (restricted page, mid-load injection, ...). */
let extractionFailed = false;

async function extractPageContent() {
  extractionFailed = false;
  lastLoadWasLoading = false;
  contentPreview.textContent = "Loading content…";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) { pageTitle.textContent = "Unknown Page"; return; }
    activeTabId = tab.id;
    lastLoadWasLoading = tab.status === "loading";

    pageTitle.textContent = tab.title || "Untitled";
    pageUrl.textContent = tab.url || "";
    pageType.textContent = detectPageTypeFromUrl(tab.url || "");

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "extract-content" });
      if (response?.success) {
        extractedContent = response.content;
        pageTitle.textContent = response.content.title || tab.title || "Untitled";
        pageType.textContent = response.content.sourceType || pageType.textContent;
        contentPreview.textContent = response.content.content || "(No content extracted)";
      } else {
        extractionFailed = true;
      }
    } catch {
      // Content script not injected yet (page mid-load, or never injected)
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["src/content/content-script.js"],
        });
      } catch {
        // Restricted page (chrome://, Web Store, PDF viewer) — cannot inject
        extractionFailed = true;
      }
      if (!extractionFailed) {
        try {
          const resp = await chrome.tabs.sendMessage(tab.id, { action: "extract-content" });
          if (resp?.success) {
            extractedContent = resp.content;
            pageTitle.textContent = resp.content.title || tab.title || "Untitled";
            pageType.textContent = resp.content.sourceType || pageType.textContent;
            contentPreview.textContent = resp.content.content || "(No content extracted)";
          } else {
            extractionFailed = true;
          }
        } catch {
          extractionFailed = true;
        }
      }
    }
  } catch {
    // Unexpected (e.g. extension context invalidated by a reload) — keep the
    // page title rather than showing a misleading "Error loading page"
    extractionFailed = true;
  }
  if (extractionFailed && !extractedContent) {
    contentPreview.textContent = "(Could not extract content)";
    showWarning(
      "Could not extract content from this page — it may be restricted (chrome://, Web Store) or still loading. The panel will retry once the page finishes loading."
    );
  }
  applyTranscriptBlock();
}

function detectPageTypeFromUrl(url) {
  if (url.includes("twitter.com") || url.includes("x.com")) return "🐦 Twitter/X";
  if (url.includes("youtube.com/watch")) return "📺 YouTube";
  if (url.includes("youtube.com")) return "📺 YouTube";
  return "🌐 Webpage";
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

async function handleAnalyze(force = false) {
  if (!serverOnline) {
    showError("Obsidian server is offline. Start Obsidian with NutEgg plugin.");
    return;
  }
  if (!extractedContent) {
    showError("Could not extract page content. Try refreshing.");
    return;
  }
  if (isTranscriptBlocked()) {
    applyTranscriptBlock();
    return;
  }

  analyzeBtn.disabled = true;
  analyzeBtnText.textContent = "Analyzing...";
  hideMessages();

  try {
    const questions = customQuestionsEl.value
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

    const payload = {
      url: extractedContent.url || "",
      title: extractedContent.title || "",
      content: extractedContent.content || "",
      sourceType: extractedContent.sourceType || "generic",
      metadata: extractedContent.metadata,
      chapters: extractedContent.chapters || undefined,
      questions,
      force,
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
      return;
    }

    if (response?.error) {
      showError(response.error, response.errorCode);
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "Analyze";
      return;
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
    showResultsState(response);
  } catch (err) {
    showError(err instanceof Error ? err.message : "Analysis failed");
    analyzeBtn.disabled = false;
    analyzeBtnText.textContent = "Analyze";
  }
}

// --- Show results ---

function showResultsState(result) {
  captureState.classList.add("hidden");
  resultsState.classList.remove("hidden");
  processedNote.classList.add("hidden");

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
        return `<div class="chapter-row${clickable ? " chapter-clickable" : ""}"${data}>${timeLabel}${titleLabel}<span class="chapter-summary">${escapeHtml(c.summary)}</span></div>`;
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

  // Novel Delta — show confirm button only when there's something to add
  const deltaGroups = (result.eggResults || []).filter(
    (r) => r.novelDelta && r.novelDelta.length > 0
  );
  if (deltaGroups.length > 0) {
    deltaSection.classList.remove("hidden");
    deltaList.innerHTML = deltaGroups
      .map((r) => `
        <div class="egg-group">
          <div class="knowledge-egg">📄 ${escapeHtml(r.egg)}</div>
          ${r.novelDelta
            .map((d) => `
              <div class="delta-item">
                ${d.parent ? `<div class="delta-parent">↳ under: ${escapeHtml(d.parent)}</div>` : ""}
                <div class="delta-content">${escapeHtml(d.content)}</div>
              </div>`)
            .join("")}
        </div>`)
      .join("");
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
    saveRawBtn.disabled = true;
    saveRawBtn.textContent = "✅ Nut collected";
  } else {
    saveRawBtn.disabled = false;
    saveRawBtn.textContent = "🥜 Collect Nut";
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
  showResultsState(entry.result);
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
        files: ["src/content/content-script.js"],
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
  saveRawBtn.disabled = true;
  saveRawBtn.textContent = "Collecting...";
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
      successMessage.textContent = newKnowledge.length > 0
        ? "Egg hatched — knowledge added and nut collected!"
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
