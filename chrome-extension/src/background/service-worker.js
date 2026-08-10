// NutEgg Background Service Worker

const DEFAULT_PORT = 27123;
let serverPort = DEFAULT_PORT;

// Load saved port on startup
chrome.storage.local.get("serverPort").then((data) => {
  if (data.serverPort) serverPort = data.serverPort;
  console.log("[NutEgg] Using port:", serverPort);
});

function getServerUrl() {
  return `http://127.0.0.1:${serverPort}`;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "analyze") {
    handleAnalyze(message.payload)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "confirm") {
    handleConfirm(message.payload)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "check-server") {
    checkServer()
      .then((result) => sendResponse(result))
      .catch(() => sendResponse({ online: false }));
    return true;
  }

  if (message.action === "config-status") {
    checkConfigStatus()
      .then((result) => sendResponse(result))
      .catch(() => sendResponse({ status: "error", issues: ["Cannot reach server"] }));
    return true;
  }

  if (message.action === "set-port") {
    serverPort = message.port || DEFAULT_PORT;
    chrome.storage.local.set({ serverPort });
    sendResponse({ success: true, port: serverPort });
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
    const response = await fetch(`${getServerUrl()}/config-status`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json();
    // Sync port from server if different
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
    const response = await fetch(`${getServerUrl()}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json();
    // Auto-sync port from server response
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
