// NutEgg Background Service Worker

importScripts("../ai/ai-core.js");

const {
  PROVIDER_CATALOG,
  checkCreditAI,
  analyzeContentStandalone,
  askFollowUpStandalone,
} = NutEggAI;

const DEFAULT_PORT = 27123;
let serverPort = DEFAULT_PORT;

// --- Init ---

async function init() {
  const stored = await chrome.storage.local.get(["serverPort"]);
  if (stored.serverPort) serverPort = stored.serverPort;

  // Side panel only — clicking the extension icon opens the panel directly
  chrome.action.setPopup({ popup: "" });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => {}); // OK if sidePanel API not available
  console.log("[NutEgg] Port:", serverPort);
}
init();

function getServerUrl() {
  return `http://127.0.0.1:${serverPort}`;
}

async function loadChromeAiSettings() {
  const stored = await chrome.storage.local.get([
    "chromeAiEnabled",
    "chromeAiProvider",
    "chromeAiApiKey",
    "chromeAiModel",
    "chromeAiModelFamily",
    "chromeAiLocalEndpoint",
    "chromeAiLocalType",
    "chromeAiOutputLanguage",
    "contentOutputLanguage",
    "chromeAiMaxTokens",
    "chromeAiPromptOverrides",
  ]);
  const lang = stored.contentOutputLanguage || stored.chromeAiOutputLanguage || "same-as-content";
  stored.contentOutputLanguage = lang;
  stored.chromeAiOutputLanguage = lang;
  if (stored.chromeAiPromptOverrides) {
    stored.promptOverrides = stored.chromeAiPromptOverrides;
  }
  return stored;
}

// --- Messages ---

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "analyze") {
    handleAnalyze(message.payload)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "confirm") {
    handleConfirm(message.payload)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "ask") {
    handleAsk(message.payload)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "create-egg") {
    handleCreateEgg(message)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "get-eggs") {
    fetchEggs()
      .then((r) => sendResponse(r))
      .catch(() => sendResponse({ eggs: [] }));
    return true;
  }

  if (message.action === "history") {
    fetchHistory(message.url)
      .then((r) => sendResponse(r))
      .catch(() => sendResponse({ history: [], latest: null }));
    return true;
  }

  if (message.action === "check-server") {
    checkServer()
      .then((r) => sendResponse(r))
      .catch(() => sendResponse({ online: false }));
    return true;
  }

  if (message.action === "check-chrome-ai") {
    loadChromeAiSettings().then((settings) => {
      const enabled = Boolean(settings.chromeAiEnabled);
      const provider = settings.chromeAiProvider || "gemini";
      const isLocal = provider === "local";
      const hasKey = isLocal ? true : Boolean(settings.chromeAiApiKey && settings.chromeAiApiKey.trim());
      sendResponse({
        enabled,
        configured: enabled && hasKey,
        provider,
        model: settings.chromeAiModel || (typeof PROVIDER_CATALOG !== "undefined" ? PROVIDER_CATALOG[provider]?.defaultModel : "") || "",
      });
    });
    return true;
  }

  if (message.action === "check-chrome-credit") {
    loadChromeAiSettings().then((settings) => {
      checkCreditAI(settings)
        .then((credit) => sendResponse(credit))
        .catch((err) => sendResponse({ error: String(err), hasBalance: false, statusText: "Credit check failed" }));
    });
    return true;
  }

  if (message.action === "config-status") {
    checkConfigStatus()
      .then((r) => sendResponse(r))
      .catch(() => sendResponse({ status: "error", issues: ["Cannot reach server"] }));
    return true;
  }

  if (message.action === "set-port") {
    serverPort = message.port || DEFAULT_PORT;
    chrome.storage.local.set({ serverPort });
    sendResponse({ success: true, port: serverPort });
    return false;
  }

  if (message.action === "metrics") {
    fetchMetrics()
      .then((r) => sendResponse(r))
      .catch(() => sendResponse({ nuts: 0, eggs: 0, timeSaved: "0m" }));
    return true;
  }
});

// --- Long-lived port for analyze ---
// The popup/side-panel opens a port for the analyze action. An open port keeps
// the service worker alive during long LLM calls (Chrome kills idle workers
// after ~30s). The port receives { action, payload } and posts back the result.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "nutegg-analyze") return;

  port.onMessage.addListener(async (message) => {
    if (message.action === "analyze") {
      try {
        const result = await handleAnalyze(message.payload);
        port.postMessage(result);
      } catch (err) {
        port.postMessage({ error: err.message });
      }
    }
  });
});
// --- Server communication ---

async function handleAnalyze(payload) {
  const server = await checkServer();

  if (server.online) {
    try {
      const response = await fetch(`${getServerUrl()}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `Server error (${response.status})`,
          errorCode: data.errorCode || "unknown",
          statusCode: data.statusCode || response.status,
          mode: "obsidian",
        };
      }

      return { ...data, mode: "obsidian" };
    } catch (err) {
      return {
        error: `Failed to connect to Obsidian: ${err.message}`,
        errorCode: "network_error",
        mode: "obsidian",
      };
    }
  }

  // Obsidian is offline -> Fall back to Chrome Standalone AI
  const aiSettings = await loadChromeAiSettings();
  if (!aiSettings.chromeAiEnabled) {
    return {
      error: "Obsidian is offline and Chrome-only AI is disabled. Please start Obsidian or enable Chrome-only AI in Settings.",
      errorCode: "chrome_ai_disabled",
      mode: "offline",
    };
  }

  const provider = aiSettings.chromeAiProvider || "gemini";
  const isLocal = provider === "local";

  if (!isLocal && (!aiSettings.chromeAiApiKey || !aiSettings.chromeAiApiKey.trim())) {
    return {
      error: "Obsidian is offline and no AI key is configured in Chrome settings.",
      errorCode: "no_api_key",
      mode: "chrome",
    };
  }

  try {
    const result = await analyzeContentStandalone(payload, aiSettings);
    return {
      ...result,
      stage: "stage1",
      mode: "chrome",
      matchedEggs: [],
      allEggs: [],
    };
  } catch (err) {
    return {
      error: err.message || "Chrome AI analysis failed",
      errorCode: err.code || "unknown",
      statusCode: err.statusCode || 500,
      mode: "chrome",
    };
  }
}

async function handleConfirm(payload) {
  const response = await fetch(`${getServerUrl()}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    return { error: data.error || `Server error (${response.status})` };
  }

  return data;
}

async function fetchHistory(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(
      `${getServerUrl()}/history?url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    return await response.json();
  } catch {
    clearTimeout(timeout);
    return { history: [], latest: null };
  }
}

async function handleCreateEgg({ name, description }) {
  const response = await fetch(`${getServerUrl()}/create-egg`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { error: data.error || `Server error (${response.status})` };
  }

  return data;
}

async function fetchEggs() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`${getServerUrl()}/eggs`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return await response.json();
  } catch {
    clearTimeout(timeout);
    return { eggs: [] };
  }
}

async function handleAsk(payload) {
  const server = await checkServer();

  if (server.online) {
    const response = await fetch(`${getServerUrl()}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || `Server error (${response.status})`,
        errorCode: data.errorCode || "unknown",
      };
    }

    return data;
  }

  // Obsidian is offline -> Chrome AI
  const aiSettings = await loadChromeAiSettings();
  if (!aiSettings.chromeAiEnabled) {
    return {
      error: "Obsidian is offline and Chrome-only AI is disabled.",
      errorCode: "chrome_ai_disabled",
      answers: [],
    };
  }

  const provider = aiSettings.chromeAiProvider || "gemini";
  const isLocal = provider === "local";

  if (!isLocal && (!aiSettings.chromeAiApiKey || !aiSettings.chromeAiApiKey.trim())) {
    return {
      error: "Obsidian is offline and no AI key is configured in Chrome settings.",
      errorCode: "no_api_key",
      answers: [],
    };
  }

  try {
    const question = (payload.questions && payload.questions[0]) || "";
    const answer = await askFollowUpStandalone(payload, question, payload.priorQa || [], aiSettings);
    return {
      answers: [{ question, answer }],
    };
  } catch (err) {
    return {
      error: err.message || "Failed to answer question",
      errorCode: err.code || "unknown",
      answers: [],
    };
  }
}

async function checkConfigStatus() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`${getServerUrl()}/config-status`, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await response.json();
    if (data.port && data.port !== serverPort) {
      serverPort = data.port;
      chrome.storage.local.set({ serverPort: data.port });
    }
    return data;
  } catch {
    clearTimeout(timeout);
    return { status: "error", issues: ["Cannot reach server"] };
  }
}

async function fetchMetrics() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`${getServerUrl()}/metrics`, { signal: controller.signal });
    clearTimeout(timeout);
    return await response.json();
  } catch {
    clearTimeout(timeout);
    return { nuts: 0, eggs: 0, timeSaved: "0m", timeSavedMinutes: 0 };
  }
}

async function checkServer() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`${getServerUrl()}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await response.json();
    if (data.port && data.port !== serverPort) {
      serverPort = data.port;
      chrome.storage.local.set({ serverPort: data.port });
    }
    return { online: response.ok, port: data.port, version: data.version };
  } catch {
    clearTimeout(timeout);
    return { online: false };
  }
}

console.log("[NutEgg] Background service worker started");
