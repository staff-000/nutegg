// NutEgg Popup Script — Two-state UI

const DEFAULT_PORT = 27123;

// DOM elements — Capture state
const serverStatus = document.getElementById("server-status");
const portRow = document.getElementById("port-row");
const portInput = document.getElementById("port-input");
const portSaveBtn = document.getElementById("port-save-btn");
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

// DOM elements — Results state
const captureState = document.getElementById("capture-state");
const resultsState = document.getElementById("results-state");
const summaryText = document.getElementById("summary-text");
const verdictIcon = document.getElementById("verdict-icon");
const verdictText = document.getElementById("verdict-text");
const verdictReason = document.getElementById("verdict-reason");
const knowledgeSection = document.getElementById("knowledge-section");
const knowledgeList = document.getElementById("knowledge-list");
const confirmBtn = document.getElementById("confirm-btn");
const discardBtn = document.getElementById("discard-btn");
const backBtn = document.getElementById("back-btn");
const successBanner = document.getElementById("success-banner");
const successMessage = document.getElementById("success-message");

let extractedContent = null;
let serverOnline = false;
let analysisResult = null;
let currentPort = DEFAULT_PORT;

// --- Init ---

document.addEventListener("DOMContentLoaded", async () => {
  // Load saved port
  const stored = await chrome.storage.local.get("serverPort");
  if (stored.serverPort) currentPort = stored.serverPort;
  portInput.value = currentPort;

  await checkServerStatus();
  await extractPageContent();

  if (serverOnline) {
    portRow.classList.add("hidden");
    await checkConfigStatus();
    if (extractedContent) {
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "Analyze";
    }
  } else {
    // Show port input when offline so user can fix it
    portRow.classList.remove("hidden");
  }

  analyzeBtn.addEventListener("click", handleAnalyze);
  confirmBtn.addEventListener("click", handleConfirm);
  discardBtn.addEventListener("click", handleDiscard);
  backBtn.addEventListener("click", showCaptureState);
  portSaveBtn.addEventListener("click", handlePortChange);
  portInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handlePortChange();
  });
});

// --- Port change ---

async function handlePortChange() {
  const newPort = parseInt(portInput.value, 10);
  if (!newPort || newPort < 1 || newPort > 65535) return;

  currentPort = newPort;
  await chrome.runtime.sendMessage({ action: "set-port", port: newPort });

  // Retry connection with new port
  await checkServerStatus();
  if (serverOnline) {
    portRow.classList.add("hidden");
    if (extractedContent) {
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "Analyze";
    }
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
    // Can't reach server for config check — handled by server status dot
  }
}

// --- Server check ---

async function checkServerStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "check-server" });
    serverOnline = response?.online || false;

    // Auto-sync port from server response
    if (response?.port && response.port !== currentPort) {
      currentPort = response.port;
      portInput.value = currentPort;
    }
  } catch {
    serverOnline = false;
  }

  if (serverOnline) {
    serverStatus.className = "status-dot online";
    serverStatus.title = `Server online on port ${currentPort}`;
  } else {
    serverStatus.className = "status-dot offline";
    serverStatus.title = `Server offline — check port ${currentPort}`;
  }
}

// --- Content extraction ---

async function extractPageContent() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      pageTitle.textContent = "Unknown Page";
      return;
    }

    pageTitle.textContent = tab.title || "Untitled";
    pageUrl.textContent = tab.url || "";
    pageType.textContent = detectPageTypeFromUrl(tab.url || "");

    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "extract-content",
      });
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
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "extract-content",
        });
        if (response?.success) {
          extractedContent = response.content;
          pageTitle.textContent = response.content.title || tab.title || "Untitled";
          pageType.textContent = response.content.sourceType || pageType.textContent;
        }
      } catch {
        // Content script injection failed — use basic tab info
      }
    }
  } catch {
    pageTitle.textContent = "Error loading page";
  }
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
  hideError();

  try {
    const payload = {
      url: extractedContent.url || "",
      title: extractedContent.title || "",
      content: extractedContent.content || "",
      sourceType: extractedContent.sourceType || "generic",
      metadata: extractedContent.metadata,
    };

    const response = await chrome.runtime.sendMessage({
      action: "analyze",
      payload,
    });

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

  // Summary
  const summaryLines = result.summary.split("\n").filter(Boolean);
  summaryText.innerHTML = summaryLines
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

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

  // New knowledge
  if (result.newKnowledge && result.newKnowledge.length > 0) {
    knowledgeSection.classList.remove("hidden");
    knowledgeList.innerHTML = result.newKnowledge
      .map(
        (k) => `
        <div class="knowledge-item">
          <div class="knowledge-topic">📄 ${escapeHtml(k.topic)} → #${escapeHtml(k.section)}</div>
          <div class="knowledge-content">${escapeHtml(k.content)}</div>
        </div>`
      )
      .join("");
    confirmBtn.classList.remove("hidden");
  } else {
    knowledgeSection.classList.add("hidden");
    confirmBtn.classList.add("hidden");
  }

  successBanner.classList.add("hidden");
}

function showCaptureState() {
  resultsState.classList.add("hidden");
  captureState.classList.remove("hidden");
  analyzeBtn.disabled = false;
  analyzeBtnText.textContent = "Analyze";
  analysisResult = null;
  hideError();
}

// --- Confirm ---

async function handleConfirm() {
  if (!analysisResult) return;

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Saving...";

  try {
    const payload = {
      url: extractedContent.url || "",
      title: extractedContent.title || "",
      content: extractedContent.content || "",
      sourceType: extractedContent.sourceType || "generic",
      metadata: extractedContent.metadata,
      newKnowledge: analysisResult.newKnowledge || [],
    };

    const response = await chrome.runtime.sendMessage({
      action: "confirm",
      payload,
    });

    if (response?.success) {
      successMessage.textContent = "Saved to knowledge base!";
      successBanner.classList.remove("hidden");
      confirmBtn.classList.add("hidden");
      setTimeout(() => window.close(), 2000);
    } else {
      showError(response?.error || "Failed to save");
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Add to Knowledge Base";
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : "Failed to save");
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Add to Knowledge Base";
  }
}

// --- Discard ---

function handleDiscard() {
  window.close();
}

// --- Helpers ---

function showError(msg, errorCode) {
  errorMessage.textContent = msg;
  errorBanner.classList.remove("hidden");

  // Show a contextual hint based on error code
  const hints = {
    no_api_key:
      'Open Obsidian Settings → NutEgg, enable <strong>Developer Mode</strong>, and add your API key.',
    auth_failed:
      'Your API key was rejected. Double-check it in Obsidian Settings → NutEgg. Make sure there are no extra spaces.',
    forbidden:
      'Your account may not have access to this model, or needs a funded billing plan. Check your account at the provider\'s website.',
    model_not_found:
      'The model name may be incorrect or not available. Go to Obsidian Settings → NutEgg and try a different model.',
    rate_limited:
      'You\'re sending requests too quickly. Wait a moment before trying again.',
    quota_exceeded:
      'Check your account balance or billing settings at your AI provider.',
    network_error:
      'Cannot reach the AI service. Check your internet connection. If using a proxy or VPN, try disabling it.',
    server_error:
      'The AI service may be temporarily down. Try again in a minute.',
  };

  if (errorCode && hints[errorCode]) {
    errorHint.innerHTML = hints[errorCode];
    errorHint.classList.remove("hidden");
  } else {
    errorHint.classList.add("hidden");
  }
}

function hideError() {
  errorBanner.classList.add("hidden");
  errorHint.classList.add("hidden");
}

function showWarning(msg) {
  warningMessage.textContent = msg;
  warningBanner.classList.remove("hidden");
}

function hideWarning() {
  warningBanner.classList.add("hidden");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
