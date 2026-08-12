// NutEgg Background Service Worker

const DEFAULT_PORT = 27123;
let serverPort = DEFAULT_PORT;
let displayMode = "popup"; // "popup" | "sidebar"

// --- Init ---

async function init() {
  const stored = await chrome.storage.local.get(["serverPort", "displayMode"]);
  if (stored.serverPort) serverPort = stored.serverPort;
  if (stored.displayMode) displayMode = stored.displayMode;
  applyDisplayMode();
  console.log("[NutEgg] Port:", serverPort, "Mode:", displayMode);
}
init();

function getServerUrl() {
  return `http://127.0.0.1:${serverPort}`;
}

// --- Display mode ---

function applyDisplayMode() {
  if (displayMode === "sidebar") {
    chrome.action.setPopup({ popup: "" });
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .catch(() => {}); // OK if sidePanel API not available
  } else {
    chrome.action.setPopup({ popup: "src/popup/popup.html" });
  }
}

chrome.action.onClicked.addListener((tab) => {
  if (displayMode === "sidebar") {
    // Side panel opens automatically via setPanelBehavior
  }
});

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

  if (message.action === "set-display-mode") {
    displayMode = message.mode || "popup";
    chrome.storage.local.set({ displayMode });
    applyDisplayMode();
    sendResponse({ success: true, mode: displayMode });
    return false;
  }

  if (message.action === "get-display-mode") {
    sendResponse({ mode: displayMode });
    return false;
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
