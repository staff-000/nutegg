// NutEgg Background Service Worker

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

// --- Server communication ---

async function handleAnalyze(payload) {
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
    };
  }

  return data;
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

async function handleAsk(payload) {
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
    return { online: response.ok, port: data.port };
  } catch {
    clearTimeout(timeout);
    return { online: false };
  }
}

console.log("[NutEgg] Background service worker started");
