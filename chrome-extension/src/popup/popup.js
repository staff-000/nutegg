// NutEgg Popup Script — Two-state UI

const OBSIDIAN_URL = "http://127.0.0.1:27123";

// DOM elements — Capture state
const serverStatus = document.getElementById("server-status");
const pageTitle = document.getElementById("page-title");
const pageUrl = document.getElementById("page-url");
const pageType = document.getElementById("page-type");
const analyzeBtn = document.getElementById("analyze-btn");
const analyzeBtnText = document.getElementById("analyze-btn-text");
const errorBanner = document.getElementById("error-banner");
const errorMessage = document.getElementById("error-message");

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

// --- Init ---

document.addEventListener("DOMContentLoaded", async () => {
  await checkServerStatus();
  await extractPageContent();

  if (serverOnline && extractedContent) {
    analyzeBtn.disabled = false;
    analyzeBtnText.textContent = "Analyze";
  }

  analyzeBtn.addEventListener("click", handleAnalyze);
  confirmBtn.addEventListener("click", handleConfirm);
  discardBtn.addEventListener("click", handleDiscard);
  backBtn.addEventListener("click", showCaptureState);
});

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
      showError(response.error);
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

function showError(msg) {
  errorMessage.textContent = msg;
  errorBanner.classList.remove("hidden");
}

function hideError() {
  errorBanner.classList.add("hidden");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
