// NutEgg Popup Script — Two-state UI

// DOM — Capture state
const serverStatus = document.getElementById("server-status");
const modeToggleBtn = document.getElementById("mode-toggle-btn");
const settingsBtn = document.getElementById("settings-btn");
const pageTitle = document.getElementById("page-title");
const pageUrl = document.getElementById("page-url");
const pageType = document.getElementById("page-type");
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
let currentMode = "popup";
let activeTabId = null;
/** How the shown result was saved previously: "saved" | "skip" | "analyzed" | null (fresh analysis). */
let cachedProcessedSaved = null;
/** Follow-up questions asked after the result was shown (this session). */
let followUpQa = [];

// --- Init ---

document.addEventListener("DOMContentLoaded", async () => {
  // Load display mode
  const stored = await chrome.storage.local.get("displayMode");
  currentMode = stored.displayMode || "popup";
  updateModeButton();

  await checkServerStatus();
  await extractPageContent();

  if (serverOnline) {
    await checkConfigStatus();
    await fetchMetrics();
    if (extractedContent && !isTranscriptBlocked()) {
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "Analyze";
    }
  }

  analyzeBtn.addEventListener("click", handleAnalyze);
  confirmBtn.addEventListener("click", handleConfirm);
  saveRawBtn.addEventListener("click", handleSaveRaw);
  discardBtn.addEventListener("click", handleDiscard);
  backBtn.addEventListener("click", showCaptureState);
  settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
  modeToggleBtn.addEventListener("click", handleModeToggle);
  questionsToggle.addEventListener("click", () => {
    questionsArea.classList.toggle("hidden");
  });
  followupBtn.addEventListener("click", handleFollowUp);
  followupInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleFollowUp();
  });
});

// --- Mode toggle ---

function updateModeButton() {
  modeToggleBtn.title = currentMode === "sidebar"
    ? "Side panel mode — click to switch to popup"
    : "Popup mode — click to switch to side panel";
  modeToggleBtn.textContent = currentMode === "sidebar" ? "📌" : "📋";
}

async function handleModeToggle() {
  currentMode = currentMode === "sidebar" ? "popup" : "sidebar";
  await chrome.runtime.sendMessage({ action: "set-display-mode", mode: currentMode });
  updateModeButton();

  if (currentMode === "sidebar") {
    showWarning("Switched to side panel. Close this popup and click the extension icon again to open the side panel.");
  } else {
    hideWarning();
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

async function extractPageContent() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) { pageTitle.textContent = "Unknown Page"; return; }
    activeTabId = tab.id;

    pageTitle.textContent = tab.title || "Untitled";
    pageUrl.textContent = tab.url || "";
    pageType.textContent = detectPageTypeFromUrl(tab.url || "");

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "extract-content" });
      if (response?.success) {
        extractedContent = response.content;
        pageTitle.textContent = response.content.title || tab.title || "Untitled";
        pageType.textContent = response.content.sourceType || pageType.textContent;
      }
    } catch {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["src/content/content-script.js"],
      });
      try {
        const resp = await chrome.tabs.sendMessage(tab.id, { action: "extract-content" });
        if (resp?.success) {
          extractedContent = resp.content;
          pageTitle.textContent = resp.content.title || tab.title || "Untitled";
          pageType.textContent = resp.content.sourceType || pageType.textContent;
        }
      } catch { /* injection failed */ }
    }
  } catch { pageTitle.textContent = "Error loading page"; }
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

async function handleAnalyze() {
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
    };

    const response = await chrome.runtime.sendMessage({ action: "analyze", payload });

    if (response?.alreadyProcessed) {
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "Analyze";
      if (response.cachedResult) {
        // Replay the result from the last process
        cachedProcessedSaved = response.saved === "saved" || response.saved === "analyzed"
          ? response.saved
          : "skip";
        analysisResult = response.cachedResult;
        showResultsState(response.cachedResult);
        if (cachedProcessedSaved === "saved") {
          confirmBtn.classList.add("hidden");
        }
        processedMessage.textContent = response.alreadyProcessed;
        processedNote.classList.remove("hidden");
      } else {
        showDuplicate(response.alreadyProcessed);
      }
      return;
    }

    if (response?.error) {
      showError(response.error, response.errorCode);
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "Analyze";
      return;
    }

    cachedProcessedSaved = null;
    followUpQa = [];
    followupInput.value = "";
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
    confirmBtn.classList.remove("hidden");
  } else {
    deltaSection.classList.add("hidden");
    deltaList.innerHTML = "";
    confirmBtn.classList.add("hidden");
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

  // Save Raw is always visible
  saveRawBtn.classList.remove("hidden");
  successBanner.classList.add("hidden");
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
  analyzeBtnText.textContent = "Analyze";
  analysisResult = null;
  cachedProcessedSaved = null;
  followUpQa = [];
  followupInput.value = "";
  hideMessages();
}

// --- Confirm (add to knowledge base) ---

async function handleConfirm() {
  if (!analysisResult) return;
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Saving...";
  await doSave(analysisResult.newKnowledge || []);
  confirmBtn.disabled = false;
  confirmBtn.textContent = "Add to Egg";
}

// --- Save Raw (save content only, no knowledge additions) ---

async function handleSaveRaw() {
  if (!extractedContent) return;
  saveRawBtn.disabled = true;
  saveRawBtn.textContent = "Saving...";
  await doSave([]);
  saveRawBtn.disabled = false;
  saveRawBtn.textContent = "💾 Save Raw";
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
      // When replaying a cached result, the raw nut was already saved —
      // only apply the knowledge this time. "analyzed" means the nut was
      // processed but never saved, so the raw must still be saved.
      skipRaw: newKnowledge.length > 0 && cachedProcessedSaved !== null &&
        cachedProcessedSaved !== "analyzed",
    };

    const response = await chrome.runtime.sendMessage({ action: "confirm", payload });

    if (response?.success) {
      const msg = newKnowledge.length > 0
        ? "Added to egg files!"
        : "Raw content saved!";
      successMessage.textContent = msg;
      successBanner.classList.remove("hidden");
      confirmBtn.classList.add("hidden");
      saveRawBtn.classList.add("hidden");
      setTimeout(() => window.close(), 2000);
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
