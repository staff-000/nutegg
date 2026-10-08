// NutEgg Background Service Worker

importScripts("../../dist/ai-core.js", "chinese-fetch.js");

const {
  PROVIDER_CATALOG,
  checkCreditAI,
  analyzeContentStandalone,
  askFollowUpStandalone,
} = NutEggAI;

const DEFAULT_PORT = 27123;
let serverPort = DEFAULT_PORT;

let initPromise = null;
async function init() {
  const stored = await chrome.storage.local.get(["serverPort"]);
  if (stored.serverPort) serverPort = stored.serverPort;

  // Side panel only — clicking the extension icon opens the panel directly
  chrome.action.setPopup({ popup: "" });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => {}); // OK if sidePanel API not available
  console.log("[NutEgg] Port:", serverPort);
}

function ensureInit() {
  if (!initPromise) initPromise = init();
  return initPromise;
}
ensureInit();

async function getServerUrl() {
  await ensureInit();
  return `http://127.0.0.1:${serverPort}`;
}

async function getConnectionMode() {
  const stored = await chrome.storage.local.get(["connectionMode"]);
  return stored.connectionMode === "obsidian" ? "obsidian" : "chrome";
}

function obsidianOfflineError() {
  return {
    error: "Obsidian is not connected. Open Obsidian with NutEgg enabled, or switch to Chrome in Settings.",
    errorCode: "obsidian_offline",
    mode: "obsidian",
  };
}

function obsidianModeRequiredError() {
  return {
    error: "Enable Obsidian mode in Settings to save to your vault.",
    errorCode: "obsidian_mode_required",
    mode: "chrome",
  };
}

async function loadChromeAiSettings() {
  const stored = await chrome.storage.local.get([
    "chromeAiProvider",
    "chromeAiApiKey",
    "chromeAiModel",
    "chromeAiModelFamily",
    "chromeAiEndpoint",
    "chromeAiLocalEndpoint",
    "outputLanguage",
    "contentOutputLanguage",
    "chromeAiOutputLanguage",
    "chromeAiMaxTokens",
    "chromeAiPromptOverrides",
  ]);
  // Chrome AI is available by default; the legacy enable toggle is no longer required.
  stored.chromeAiEnabled = true;
  stored.chromeAiEndpoint = stored.chromeAiEndpoint || stored.chromeAiLocalEndpoint;
  const lang = stored.outputLanguage || stored.contentOutputLanguage || stored.chromeAiOutputLanguage || "same-as-content";
  stored.outputLanguage = lang;
  stored.contentOutputLanguage = lang;
  stored.chromeAiOutputLanguage = lang;
  if (stored.chromeAiPromptOverrides) {
    stored.promptOverrides = stored.chromeAiPromptOverrides;
  }
  return stored;
}

// --- Messages ---

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'get-debug-info') {
    const scope = NutEggAI.normalizeAIDebugScope(message.debugScope);
    if (!scope) { sendResponse({ unavailable: true, mode: message.mode }); return false; }
    if (message.mode === 'chrome') { sendResponse({ ...NutEggAI.getAIDebugInfo(scope), mode: 'chrome' }); return false; }
    (async () => {
      if (await getConnectionMode() !== 'obsidian') return { unavailable: true, mode: 'obsidian' };
      const response = await fetch(`${await getServerUrl()}/debug-info?scope=${encodeURIComponent(scope)}`, { signal: AbortSignal.timeout(2500), cache: 'no-store' });
      if (!response.ok) throw new Error('Debug info unavailable');
      return { ...await response.json(), mode: 'obsidian' };
    })().then(sendResponse).catch(() => sendResponse({ unavailable: true, mode: 'obsidian' }));
    return true;
  }
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

  if (message.action === "clear-chrome-cache") {
    clearChromeCache()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "get-chrome-cache-info") {
    getChromeCacheInfo()
      .then((info) => sendResponse(info))
      .catch(() => sendResponse({ count: 0, limit: 100 }));
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
      const provider = settings.chromeAiProvider || "gemini";
      const isLocal = provider === "local";
      const hasKey = isLocal ? true : Boolean(settings.chromeAiApiKey && settings.chromeAiApiKey.trim());
      sendResponse({
        enabled: true,
        configured: hasKey,
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

  if (message.action === "get-credit") {
    fetchCredit()
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: String(err), hasBalance: false }));
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
    chrome.storage.local.set({ serverPort }).then(() => {
      sendResponse({ success: true, port: serverPort });
    }).catch((err) => {
      sendResponse({ success: false, error: err?.message });
    });
    return true;
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

  let isConnected = true;
  port.onDisconnect.addListener(() => {
    isConnected = false;
  });

  port.onMessage.addListener(async (message) => {
    if (message.action === "ping") {
      // Heartbeat to keep service worker alive during long LLM calls (prevents MV3 30s idle termination)
      return;
    }
    if (message.action === "analyze") {
      try {
        const result = await handleAnalyze(message.payload);
        if (isConnected) {
          port.postMessage(result);
        }
      } catch (err) {
        if (isConnected) {
          try {
            port.postMessage({ error: err.message });
          } catch {}
        }
      }
    }
  });
});
// --- Server communication ---

async function handleAnalyze(payload) {
  if (await getConnectionMode() === "obsidian") {
    const server = await checkServer();
    if (!server.online) return obsidianOfflineError();
    try {
      const serverUrl = await getServerUrl();
      const response = await fetch(`${serverUrl}/analyze`, {
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

  const aiSettings = await loadChromeAiSettings();

  const provider = aiSettings.chromeAiProvider || "gemini";
  const isLocal = provider === "local";

  if (!isLocal && (!aiSettings.chromeAiApiKey || !aiSettings.chromeAiApiKey.trim())) {
    return {
      error: "Add your AI API key in Settings to start analyzing.",
      errorCode: "no_api_key",
      mode: "chrome",
    };
  }

  try {
    const result = await analyzeContentStandalone(payload, aiSettings);
    const finalResult = {
      ...result,
      nutId: result.nutId || `chrome_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      stage: "stage1",
      mode: "chrome",
      matchedEggs: [],
      allEggs: [],
    };
    await saveChromeCacheEntry(payload, finalResult);
    return finalResult;
  } catch (err) {
    return {
      error: err.message || "Chrome AI analysis failed",
      errorCode: err.code || "unknown",
      statusCode: err.statusCode || 500,
      mode: "chrome",
    };
  }
}

const DEFAULT_CHROME_CACHE_LIMIT = 100;

function normalizeCacheUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  try {
    const parsed = new URL(rawUrl);
    parsed.hash = "";
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return rawUrl.split("#")[0].replace(/\/+$/, "");
  }
}

async function getChromeCacheLimit() {
  const stored = await chrome.storage.local.get(["chromeCacheTabLimit"]);
  if (typeof stored.chromeCacheTabLimit === "number" && stored.chromeCacheTabLimit >= 0) {
    return Math.min(1000, Math.round(stored.chromeCacheTabLimit));
  }
  return DEFAULT_CHROME_CACHE_LIMIT;
}

async function getChromeCacheHistory(url) {
  const norm = normalizeCacheUrl(url);
  if (!norm) return { history: [], latest: null };
  const stored = await chrome.storage.local.get(["chromeTabCache"]);
  const cache = Array.isArray(stored.chromeTabCache) ? stored.chromeTabCache : [];
  const entry = cache.find((item) => normalizeCacheUrl(item.url) === norm);
  if (!entry) return { history: [], latest: null };
  return { history: [entry], latest: entry };
}

async function saveChromeCacheEntry(payload, result) {
  try {
    const limit = await getChromeCacheLimit();
    if (limit <= 0) return;
    const url = payload?.url;
    const norm = normalizeCacheUrl(url);
    if (!norm) return;

    const stored = await chrome.storage.local.get(["chromeTabCache"]);
    let cache = Array.isArray(stored.chromeTabCache) ? stored.chromeTabCache : [];

    cache = cache.filter((item) => normalizeCacheUrl(item.url) !== norm);

    const entry = {
      nutId: result.nutId || `chrome_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      url,
      title: payload.title || result.titleVerdict?.title || "",
      result,
      saved: null,
      sourceType: payload.sourceType || "generic",
      author: payload.author || payload.metadata?.author || "",
      publishedAt: payload.publishedAt || payload.metadata?.published || "",
      content: typeof payload.content === "string" ? payload.content.slice(0, 30000) : "",
      capturePayload: {
        url,
        title: payload.title,
        sourceType: payload.sourceType,
        enabledSections: payload.enabledSections,
        metadata: payload.metadata,
      },
      timestamp: Date.now(),
    };

    cache.unshift(entry);
    if (cache.length > limit) {
      cache = cache.slice(0, limit);
    }
    await chrome.storage.local.set({ chromeTabCache: cache });
  } catch (err) {
    console.warn?.("[NutEgg] Failed to save Chrome cache entry:", err);
  }
}

async function clearChromeCache() {
  await chrome.storage.local.set({ chromeTabCache: [] });
}

async function getChromeCacheInfo() {
  const stored = await chrome.storage.local.get(["chromeTabCache", "chromeCacheTabLimit"]);
  const cache = Array.isArray(stored.chromeTabCache) ? stored.chromeTabCache : [];
  const limit = typeof stored.chromeCacheTabLimit === "number" ? stored.chromeCacheTabLimit : DEFAULT_CHROME_CACHE_LIMIT;
  return { count: cache.length, limit };
}

async function handleConfirm(payload) {
  if (await getConnectionMode() !== "obsidian") return obsidianModeRequiredError();
  const serverUrl = await getServerUrl();
  const response = await fetch(`${serverUrl}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { error: data.error || `Server error (${response.status})` };
  }

  return data;
}

async function fetchHistory(url) {
  if (await getConnectionMode() !== "obsidian") {
    return await getChromeCacheHistory(url);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const serverUrl = await getServerUrl();
    const response = await fetch(
      `${serverUrl}/history?url=${encodeURIComponent(url)}`,
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
  if (await getConnectionMode() !== "obsidian") return obsidianModeRequiredError();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const serverUrl = await getServerUrl();
    const response = await fetch(`${serverUrl}/create-egg`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { error: data.error || `Server error (${response.status})` };
    }

    return data;
  } catch (err) {
    clearTimeout(timeout);
    return { error: err.name === "AbortError" ? "Request timed out" : (err.message || "Failed to connect to Obsidian") };
  }
}

async function fetchEggs() {
  if (await getConnectionMode() !== "obsidian") return { eggs: [] };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const serverUrl = await getServerUrl();
    const response = await fetch(`${serverUrl}/eggs`, {
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
  if (await getConnectionMode() === "obsidian") {
    const server = await checkServer();
    if (!server.online) return { ...obsidianOfflineError(), answers: [] };
    const serverUrl = await getServerUrl();
    const response = await fetch(`${serverUrl}/ask`, {
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

  const aiSettings = await loadChromeAiSettings();

  const provider = aiSettings.chromeAiProvider || "gemini";
  const isLocal = provider === "local";

  if (!isLocal && (!aiSettings.chromeAiApiKey || !aiSettings.chromeAiApiKey.trim())) {
    return {
      error: "Add your AI API key in Settings to ask a question.",
      errorCode: "no_api_key",
      answers: [],
    };
  }

  try {
    const question = (payload.questions && payload.questions[0]) || "";
    const scope = payload.scope || "within";
    const answer = await askFollowUpStandalone(payload, question, payload.priorQa || [], aiSettings, scope);
    return {
      answers: [{ question, answer, scope }],
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
  if (await getConnectionMode() !== "obsidian") return { status: "ok", issues: [], mode: "chrome" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const serverUrl = await getServerUrl();
    const response = await fetch(`${serverUrl}/config-status`, { signal: controller.signal });
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

async function fetchCredit() {
  if (await getConnectionMode() !== "obsidian") return checkCreditAI(await loadChromeAiSettings());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const serverUrl = await getServerUrl();
    const response = await fetch(`${serverUrl}/credit`, { signal: controller.signal });
    clearTimeout(timeout);
    return await response.json();
  } catch {
    clearTimeout(timeout);
    return { hasBalance: false, statusText: "Credit check failed" };
  }
}

async function fetchMetrics() {
  if (await getConnectionMode() !== "obsidian") return { nuts: 0, eggs: 0, timeSaved: "0m", timeSavedMinutes: 0 };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const serverUrl = await getServerUrl();
    const response = await fetch(`${serverUrl}/metrics`, { signal: controller.signal });
    clearTimeout(timeout);
    return await response.json();
  } catch {
    clearTimeout(timeout);
    return { nuts: 0, eggs: 0, timeSaved: "0m", timeSavedMinutes: 0 };
  }
}

async function checkServer() {
  if (await getConnectionMode() !== "obsidian") return { online: false, mode: "chrome" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const serverUrl = await getServerUrl();
    const response = await fetch(`${serverUrl}/health`, { signal: controller.signal });
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
