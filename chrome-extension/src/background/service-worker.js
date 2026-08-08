// NutEgg Background Service Worker

const OBSIDIAN_SERVER_URL = "http://127.0.0.1:27123";

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
});

// --- Server communication ---

async function handleAnalyze(payload) {
  const response = await fetch(`${OBSIDIAN_SERVER_URL}/analyze`, {
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
  const response = await fetch(`${OBSIDIAN_SERVER_URL}/confirm`, {
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
    const response = await fetch(`${OBSIDIAN_SERVER_URL}/config-status`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return await response.json();
  } catch {
    clearTimeout(timeout);
    return { status: "error", issues: ["Cannot reach server"] };
  }
}

async function checkServer() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${OBSIDIAN_SERVER_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return { online: response.ok };
  } catch {
    clearTimeout(timeout);
    return { online: false };
  }
}

console.log("[NutEgg] Background service worker started");
