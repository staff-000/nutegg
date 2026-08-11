// NutEgg Popup Script — Two-state UI

// DOM — Capture state
const serverStatus = document.getElementById("server-status");
const settingsBtn = document.getElementById("settings-btn");
const pageTitle = document.getElementById("page-title");
const pageUrl = document.getElementById("page-url");
const pageType = document.getElementById("page-type");
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
const summaryText = document.getElementById("summary-text");
const verdictIcon = document.getElementById("verdict-icon");
const verdictText = document.getElementById("verdict-text");
const verdictBadge = document.getElementById("verdict-badge");
const verdictReason = document.getElementById("verdict-reason");
const knowledgeSection = document.getElementById("knowledge-section");
const knowledgeList = document.getElementById("knowledge-list");
const confirmBtn = document.getElementById("confirm-btn");
const saveRawBtn = document.getElementById("save-raw-btn");
const discardBtn = document.getElementById("discard-btn");
const backBtn = document.getElementById("back-btn");
const successBanner = document.getElementById("success-banner");
const successMessage = document.getElementById("success-message");

let extractedContent = null;
let serverOnline = false;
let analysisResult = null;

// --- Init ---

document.addEventListener("DOMContentLoaded", async () => {
  await checkServerStatus();
  await extractPageContent();

  if (serverOnline) {
    await checkConfigStatus();
    if (extractedContent) {
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
});

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
}

function detectPageTypeFromUrl(url) {
  if (url.includes("twitter.com") || url.includes("x.com")) return "🐦 Twitter/X";
  if (url.includes("youtube.com/watch")) return "📺 YouTube";
  if (url.includes("youtube.com")) return "📺 YouTube";
  return "🌐 Webpage";
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

  analyzeBtn.disabled = true;
  analyzeBtnText.textContent = "Analyzing...";
  hideMessages();

  try {
    const payload = {
      url: extractedContent.url || "",
      title: extractedContent.title || "",
      content: extractedContent.content || "",
      sourceType: extractedContent.sourceType || "generic",
      metadata: extractedContent.metadata,
    };

    const response = await chrome.runtime.sendMessage({ action: "analyze", payload });

    if (response?.alreadyProcessed) {
      showDuplicate(response.alreadyProcessed);
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "Analyze";
      return;
    }

    if (response?.error) {
      showError(response.error, response.errorCode);
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "Analyze";
      return;
    }

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

  const lines = result.summary.split("\n").filter(Boolean);
  summaryText.innerHTML = lines.map((l) => `<p>${escapeHtml(l)}</p>`).join("");

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

  // New knowledge — show confirm button only when there's something to add
  if (result.newKnowledge && result.newKnowledge.length > 0) {
    knowledgeSection.classList.remove("hidden");
    knowledgeList.innerHTML = result.newKnowledge
      .map((k) => `
        <div class="knowledge-item">
          <div class="knowledge-egg">📄 ${escapeHtml(k.egg)} → #${escapeHtml(k.section)}</div>
          <div class="knowledge-content">${escapeHtml(k.content)}</div>
        </div>`)
      .join("");
    confirmBtn.classList.remove("hidden");
  } else {
    knowledgeSection.classList.add("hidden");
    confirmBtn.classList.add("hidden");
  }

  // Save Raw is always visible
  saveRawBtn.classList.remove("hidden");
  successBanner.classList.add("hidden");
}

function showCaptureState() {
  resultsState.classList.add("hidden");
  captureState.classList.remove("hidden");
  analyzeBtn.disabled = false;
  analyzeBtnText.textContent = "Analyze";
  analysisResult = null;
  hideMessages();
}

// --- Confirm (add to knowledge base) ---

async function handleConfirm() {
  if (!analysisResult) return;
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Saving...";
  await doSave(analysisResult.newKnowledge || []);
  confirmBtn.disabled = false;
  confirmBtn.textContent = "Add to Knowledge Base";
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
      newKnowledge,
    };

    const response = await chrome.runtime.sendMessage({ action: "confirm", payload });

    if (response?.success) {
      const msg = newKnowledge.length > 0
        ? "Saved to knowledge base!"
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
