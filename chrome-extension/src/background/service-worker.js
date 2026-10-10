// NutEgg Background Service Worker

importScripts("../../dist/ai-core.js", "chinese-fetch.js");

const {
  PROVIDER_CATALOG,
  isSubscriptionProvider,
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
    "chromeAiAuthMethod",
    "chromeAiApiKey",
    "chromeAiModel",
    "chromeAiModelFamily",
    "chromeAiEndpoint",
    "chromeAiLocalEndpoint",
    "outputLanguage",
    "contentOutputLanguage",
    "chromeAiOutputLanguage",
    "chromeAiMaxTokens",
    "chunkWindowChars",
    "contentAnalysisMaxTokens",
    "chromeAiPromptOverrides",
  ]);
  stored.chunkWindowChars = Number.isSafeInteger(stored.chunkWindowChars) && stored.chunkWindowChars >= 1000 ? stored.chunkWindowChars : 30000;
  const maxTokens = stored.contentAnalysisMaxTokens ?? stored.chromeAiMaxTokens;
  stored.contentAnalysisMaxTokens = Number.isSafeInteger(maxTokens) && maxTokens >= 500 ? maxTokens : 16384;
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
  const migrated = NutEggAI.migrateAISettings(stored);
  if (JSON.stringify(migrated) !== JSON.stringify(stored)) await chrome.storage.local.set(migrated);
  return migrated;
}

function getObsidianAiConfig(settings) {
  let provider = settings.chromeAiProvider || "gemini";
  const authMethod = settings.chromeAiAuthMethod || "apiKey";
  if (authMethod === "subscription" && !NutEggAI.supportsSubscription(provider)) {
    provider = "gemini";
  }
  return {
    aiProvider: provider,
    aiAuthMethod: authMethod,
    aiApiKey: isSubscriptionProvider(settings) ? "" : settings.chromeAiApiKey || "",
    aiModel: (authMethod === "subscription" && !NutEggAI.supportsSubscription(settings.chromeAiProvider))
      ? (PROVIDER_CATALOG[provider]?.defaultModel || "")
      : (settings.chromeAiModel || PROVIDER_CATALOG[provider]?.defaultModel || ""),
    localEndpoint: settings.chromeAiEndpoint || settings.chromeAiLocalEndpoint || PROVIDER_CATALOG.local?.officialEndpoint || "http://127.0.0.1:11434/v1/chat/completions",
    localApiType: "openai",
    chunkWindowChars: settings.chunkWindowChars ?? 30000,
    contentAnalysisMaxTokens: settings.contentAnalysisMaxTokens ?? 16384,
  };
}

// Send only AI configuration; Obsidian keeps its own vault and server settings.
async function syncAiConfig(serverUrl = null, settings = null) {
  settings = settings || await loadChromeAiSettings();
  const response = await serverFetch(`${serverUrl || await getServerUrl()}/ai-config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(getObsidianAiConfig(settings)),
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error("Could not sync AI settings. Update the NutEgg Obsidian plugin and try again.");
  return { success: true };
}

chrome.storage.onChanged?.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.serverPort) serverPort = changes.serverPort.newValue || DEFAULT_PORT;
  const keys = ["connectionMode", "serverPort", "chromeAiAuthMethod", "chromeAiProvider", "chromeAiApiKey", "chromeAiModel", "chromeAiEndpoint", "chromeAiLocalEndpoint", "chunkWindowChars", "contentAnalysisMaxTokens"];
  if (keys.some(key => key in changes)) {
    void syncAiConfig().catch(() => {});
  }
});

function subscriptionModeError() {
  return { error: "AI connection requires Obsidian. Open Obsidian or configure a Chrome API connection.", errorCode: "subscription_requires_obsidian", mode: "chrome" };
}


async function serverFetch(url, options = {}) {
  const parsed = new URL(url);
  if (parsed.hostname !== '127.0.0.1') throw new Error('Invalid Obsidian endpoint');
  const key = `obsidianConnection:${parsed.origin}`;
  const stored = await chrome.storage.local.get([key]);
  const headers = { ...options.headers };
  // Extension GET requests can omit Origin. The server still checks any native
  // Origin and verifies the credential against this approved extension identity.
  headers['X-NutEgg-Extension-Origin'] = chrome.runtime.getURL('/').replace(/\/$/, '');
  if (parsed.pathname !== '/health') {
    if (!stored[key]) throw new Error('Connect NutEgg Chrome in Obsidian first.');
    headers.Authorization = `Bearer ${stored[key]}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 && parsed.pathname !== '/health') {
    const current = await chrome.storage.local.get([key]);
    if (current[key] === stored[key]) await chrome.storage.local.remove(key);
  }
  return response;
}

let connectionRequest = null;
async function connectObsidian() {
  if (connectionRequest) return connectionRequest;
  connectionRequest = (async () => {
    const serverUrl = await getServerUrl();
    const health = await fetch(`${serverUrl}/health`, { signal: AbortSignal.timeout(3000) }).then(r => r.json());
    if (!health.capabilities?.includes('connection-approval-v1')) throw new Error('Update the NutEgg Obsidian plugin.');
    const credentialKey = `obsidianConnection:${serverUrl}`;
    const stored = await chrome.storage.local.get([credentialKey]);
    if (stored[credentialKey]) {
      try {
        await syncAiConfig(serverUrl);
        return { success: true };
      } catch (error) {
        // Only an invalid credential requires approval again. Configuration
        // failures and offline requests must not rotate an approved connection.
        const current = await chrome.storage.local.get([credentialKey]);
        if (current[credentialKey]) throw error;
      }
    }
    const nonce = [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join('');
    const request = path => fetch(`${serverUrl}/connection/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-NutEgg-Extension-Origin': chrome.runtime.getURL('/').replace(/\/$/, '') }, body: JSON.stringify({ nonce }), signal: AbortSignal.timeout(3000),
    }).then(async r => { if (!r.ok) throw new Error('Connection approval failed.'); return r.json(); });
    await request('start');
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      const result = await request('finish');
      if (result.state === 'approved') {
        await chrome.storage.local.set({ [credentialKey]: result.credential });
        await syncAiConfig(serverUrl); return { success: true };
      }
      if (result.state === 'denied') throw new Error('Connection was not approved in Obsidian.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Connection approval timed out. Try again.');
  })().finally(() => { connectionRequest = null; });
  return connectionRequest;
}

// --- Messages ---

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'connect-obsidian') {
    connectObsidian().then(sendResponse).catch(error => sendResponse({ error: error.message })); return true;
  }
  if (message.action === 'subscription-control') {
    (async () => {
      const operations = ['status', 'models'];
      if (!operations.includes(message.operation) || !NutEggAI.supportsSubscription(message.provider)) throw new Error('Invalid subscription operation');
      const url = await getServerUrl();
      const health = await serverFetch(`${url}/health`, { signal: AbortSignal.timeout(3000) }).then(r => r.json());
      if (health.subscriptionEnabled !== true) { sendResponse({ state: 'disabled', error: 'AI connection unavailable.' }); return; }
      if (!health.capabilities?.includes('subscription-v1')) throw new Error('Update the NutEgg Obsidian plugin to use subscriptions.');
      const response = await serverFetch(`${url}/subscription/${message.operation}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: message.provider, model: message.model, device: message.device }),
        signal: AbortSignal.timeout(message.operation === 'test' ? 190000 : 20000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Subscription operation failed.');
      return result;
    })().then(sendResponse).catch(error => sendResponse({ state: 'error', error: error.message, message: error.message })); return true;
  }
  if (message.action === "get-obsidian-ai-config") {
    (async () => {
      const settings = message.settings || await loadChromeAiSettings();
      const response = await serverFetch(`${await getServerUrl()}/ai-config-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getObsidianAiConfig(settings)),
        signal: AbortSignal.timeout(2000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Could not read Obsidian AI settings. Update the NutEgg Obsidian plugin and try again.");
      return await response.json();
    })().then(sendResponse).catch(error => sendResponse({ error: error.message }));
    return true;
  }
  if (message.action === "sync-ai-config") {
    syncAiConfig().then(sendResponse).catch(err => sendResponse({ error: err.message, errorCode: "ai_config_sync_failed" }));
    return true;
  }
  if (message.action === 'get-debug-info') {
    const scope = NutEggAI.normalizeAIDebugScope(message.debugScope);
    if (!scope) { sendResponse({ unavailable: true, mode: message.mode }); return false; }
    if (message.mode === 'chrome') { sendResponse({ ...NutEggAI.getAIDebugInfo(scope), mode: 'chrome' }); return false; }
    (async () => {
      if (await getConnectionMode() !== 'obsidian') return { unavailable: true, mode: 'obsidian' };
      const response = await serverFetch(`${await getServerUrl()}/debug-info?scope=${encodeURIComponent(scope)}`, { signal: AbortSignal.timeout(2500), cache: 'no-store' });
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
      // Mirroring configuration is independent of where analysis runs.
      void syncAiConfig(null, settings).catch(() => {});
      const provider = settings.chromeAiProvider || "gemini";
      const isLocal = provider === "local";
      const hasKey = isLocal ? true : Boolean(settings.chromeAiApiKey && settings.chromeAiApiKey.trim());
      sendResponse({
        enabled: true,
        configured: hasKey && !isSubscriptionProvider(settings),
        provider,
        authMethod: settings.chromeAiAuthMethod,
        model: settings.chromeAiModel || (typeof PROVIDER_CATALOG !== "undefined" ? PROVIDER_CATALOG[provider]?.defaultModel : "") || "",
      });
    });
    return true;
  }

  if (message.action === "check-chrome-credit") {
    loadChromeAiSettings().then((settings) => {
      if (isSubscriptionProvider(settings)) { sendResponse(subscriptionModeError()); return; }
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
    if (!server.online) return payload.stage === 2 ? obsidianOfflineError() : handleAnalyzeChrome(payload);
    if (server.error) return { ...server, mode: "obsidian" };
    try {
      const serverUrl = await getServerUrl();
      const response = await serverFetch(`${serverUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (payload.stage !== 2 && [502, 503, 504].includes(response.status)) return handleAnalyzeChrome(payload);
        return {
          error: data.error || `Server error (${response.status})`,
          errorCode: data.errorCode || "unknown",
          statusCode: data.statusCode || response.status,
          mode: "obsidian",
        };
      }

      return { ...data, mode: "obsidian" };
    } catch (err) {
      if (payload.stage !== 2) return handleAnalyzeChrome(payload);
      return {
        error: `Failed to connect to Obsidian: ${err.message}`,
        errorCode: "network_error",
        mode: "obsidian",
      };
    }
  }

  return handleAnalyzeChrome(payload);
}

async function handleAnalyzeChrome(payload) {
  const aiSettings = await loadChromeAiSettings();

  if (isSubscriptionProvider(aiSettings)) return subscriptionModeError();
  const provider = aiSettings.chromeAiProvider || "gemini";
  const isLocal = provider === "local";
  if (isSubscriptionProvider(provider)) return subscriptionModeError();

  if (!isLocal && (!aiSettings.chromeAiApiKey || !aiSettings.chromeAiApiKey.trim())) {
    return {
      error: isSubscriptionProvider(provider)
        ? "Open Obsidian with NutEgg enabled to start analyzing."
        : "Add your AI API key in Settings to start analyzing.",
      errorCode: isSubscriptionProvider(provider) ? "pairing_token_missing" : "no_api_key",
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
    await recordChromeAnalysisMetrics(payload, finalResult);
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
const CHROME_CACHE_MAX_BYTES = 8 * 1024 * 1024;

// The newest entries come first. Include the storage key and JSON array overhead.
function trimChromeCache(cache, limit) {
  const encoder = new TextEncoder();
  let bytes = encoder.encode('chromeTabCache').length + 2;
  const kept = [];
  for (const entry of cache.slice(0, limit)) {
    const entryBytes = encoder.encode(JSON.stringify(entry)).length + (kept.length ? 1 : 0);
    if (bytes + entryBytes > CHROME_CACHE_MAX_BYTES) break;
    kept.push(entry);
    bytes += entryBytes;
  }
  return kept;
}

async function loadChromeCache() {
  const stored = await chrome.storage.local.get(["chromeTabCache"]);
  const existing = Array.isArray(stored.chromeTabCache) ? stored.chromeTabCache : [];
  const cache = trimChromeCache(existing, await getChromeCacheLimit());
  if (cache.length !== existing.length) await chrome.storage.local.set({ chromeTabCache: cache });
  return cache;
}

function extractVideoIdentity(rawUrl, metadata = null) {
  if (typeof NutEggAI !== "undefined" && typeof NutEggAI.getVideoIdentity === "function") {
    try {
      const vid = NutEggAI.getVideoIdentity(rawUrl);
      if (vid) return vid;
    } catch {}
  }
  if (!rawUrl || typeof rawUrl !== "string") return null;
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.toLowerCase();
    const segments = u.pathname.split("/").filter(Boolean);

    // YouTube
    const youtubeHosts = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"];
    let ytId = null;
    if (youtubeHosts.includes(host)) {
      if (segments[0] === "watch") ytId = u.searchParams.get("v");
      else if (["shorts", "live", "embed", "v"].includes(segments[0])) ytId = segments[1];
    } else if (host === "youtu.be" || host === "www.youtu.be") {
      ytId = segments[0];
    } else if (["youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host) && segments[0] === "embed") {
      ytId = segments[1];
    }
    if (ytId && /^[A-Za-z0-9_-]{11}$/.test(ytId)) {
      return { platform: "youtube", id: ytId, canonicalUrl: `https://www.youtube.com/watch?v=${ytId}` };
    }

    // Bilibili
    const bilibiliHosts = ["bilibili.com", "www.bilibili.com", "m.bilibili.com", "player.bilibili.com"];
    if (bilibiliHosts.some(h => host === h || host.endsWith("." + h))) {
      let bvid = segments[0] === "video" ? segments[1] : u.searchParams.get("bvid");
      if (!bvid && u.searchParams.get("aid")) bvid = `av${u.searchParams.get("aid")}`;
      if (!bvid && segments[0] === "video" && /^av\d+$/i.test(segments[1])) bvid = segments[1];
      if (bvid) {
        const cleanBvid = bvid.split("?")[0].split("/")[0];
        const part = Number(u.searchParams.get("p") || (host === "player.bilibili.com" ? u.searchParams.get("page") : null) || 1);
        const partSuffix = Number.isSafeInteger(part) && part > 1 ? `?p=${part}` : "";
        return {
          platform: "bilibili",
          id: cleanBvid,
          canonicalUrl: `https://www.bilibili.com/video/${cleanBvid}${partSuffix}`,
        };
      }
    }
  } catch {}

  if (metadata?.video_id && (metadata.platform === "youtube" || metadata.platform === "bilibili")) {
    const id = metadata.video_id;
    const platform = metadata.platform;
    const part = Number(metadata.part || 1);
    const canonicalUrl = platform === "youtube"
      ? `https://www.youtube.com/watch?v=${id}`
      : `https://www.bilibili.com/video/${id}${Number.isSafeInteger(part) && part > 1 ? `?p=${part}` : ""}`;
    return { platform, id, canonicalUrl };
  }

  return null;
}

function normalizeCacheUrl(rawUrl, metadata = null) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const video = extractVideoIdentity(rawUrl, metadata);
  if (video) return video.canonicalUrl;

  if (typeof NutEggAI !== "undefined" && typeof NutEggAI.normalizeContentUrl === "function") {
    try {
      return NutEggAI.normalizeContentUrl(rawUrl);
    } catch {}
  }

  try {
    const u = new URL(rawUrl);
    u.hash = "";
    if (["twitter.com", "www.twitter.com", "mobile.twitter.com", "x.com", "www.x.com"].includes(u.hostname.toLowerCase())) {
      u.hostname = "x.com";
      if (/\/status\/\d+/.test(u.pathname)) {
        u.search = "";
        return u.toString().replace(/\/$/, "");
      }
    }
    for (const param of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "source", "fbclid", "gclid", "si", "pp", "feature", "spm", "vd_source", "spm_id_from"]) {
      u.searchParams.delete(param);
    }
    u.searchParams.sort();
    let pathname = u.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      u.pathname = pathname.slice(0, -1);
    }
    return u.toString().replace(/\/$/, "");
  } catch {
    return rawUrl.split("#")[0].replace(/\/+$/, "");
  }
}

function matchesCacheEntry(entry, targetUrl) {
  if (!entry || !targetUrl) return false;
  const targetNorm = normalizeCacheUrl(targetUrl);
  const targetVideo = extractVideoIdentity(targetUrl);

  // 1. Direct canonical URL match
  if (entry.canonicalUrl && targetNorm && entry.canonicalUrl === targetNorm) {
    return true;
  }
  if (targetNorm && normalizeCacheUrl(entry.url) === targetNorm) {
    return true;
  }

  // 2. Video ID & platform match
  const entryVideo = (entry.videoPlatform && entry.videoId)
    ? { platform: entry.videoPlatform, id: entry.videoId }
    : extractVideoIdentity(entry.url, entry.capturePayload?.metadata);

  if (targetVideo && entryVideo) {
    if (targetVideo.platform === entryVideo.platform && targetVideo.id === entryVideo.id) {
      if (targetVideo.platform === "bilibili") {
        return (entry.canonicalUrl || normalizeCacheUrl(entry.url)) === targetNorm;
      }
      return true;
    }
  }

  // 3. Fallback URL match
  if (entry.url && entry.url.split("#")[0] === targetUrl.split("#")[0]) {
    return true;
  }
  if (entry.capturePayload?.url && entry.capturePayload.url.split("#")[0] === targetUrl.split("#")[0]) {
    return true;
  }

  return false;
}

async function getChromeCacheLimit() {
  const stored = await chrome.storage.local.get(["chromeCacheTabLimit"]);
  if (typeof stored.chromeCacheTabLimit === "number" && stored.chromeCacheTabLimit >= 0) {
    return Math.min(1000, Math.round(stored.chromeCacheTabLimit));
  }
  return DEFAULT_CHROME_CACHE_LIMIT;
}

async function getChromeCacheHistory(url) {
  if (!url) return { history: [], latest: null };
  const cache = await loadChromeCache();
  const entry = cache.find((item) => matchesCacheEntry(item, url));
  if (!entry) return { history: [], latest: null };
  return { history: [entry], latest: entry };
}

async function saveChromeCacheEntry(payload, result) {
  try {
    const limit = await getChromeCacheLimit();
    if (limit <= 0) return;
    const url = payload?.url;
    if (!url) return;

    const norm = normalizeCacheUrl(url, payload?.metadata);
    const video = extractVideoIdentity(url, payload?.metadata);

    const stored = await chrome.storage.local.get(["chromeTabCache"]);
    let cache = Array.isArray(stored.chromeTabCache) ? stored.chromeTabCache : [];

    // Remove existing entry for the same video or URL
    cache = cache.filter((item) => !matchesCacheEntry(item, url));

    const entry = {
      nutId: result.nutId || `chrome_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      url,
      canonicalUrl: norm,
      videoId: video?.id || null,
      videoPlatform: video?.platform || null,
      title: payload.title || result.titleVerdict?.title || "",
      result,
      saved: null,
      sourceType: payload.sourceType || video?.platform || "generic",
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
    cache = trimChromeCache(cache, limit);
    await chrome.storage.local.set({ chromeTabCache: cache });
  } catch (err) {
    console.warn?.("[NutEgg] Failed to save Chrome cache entry:", err);
  }
}

async function clearChromeCache() {
  await chrome.storage.local.set({ chromeTabCache: [] });
}

async function getChromeCacheInfo() {
  const cache = await loadChromeCache();
  const stored = await chrome.storage.local.get(["chromeTabCache", "chromeCacheTabLimit"]);
  const limit = typeof stored.chromeCacheTabLimit === "number" ? stored.chromeCacheTabLimit : DEFAULT_CHROME_CACHE_LIMIT;
  return { count: cache.length, limit };
}

async function handleConfirm(payload) {
  if (await getConnectionMode() !== "obsidian") return obsidianModeRequiredError();
  const serverUrl = await getServerUrl();
  const response = await serverFetch(`${serverUrl}/confirm`, {
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
    const response = await serverFetch(
      `${serverUrl}/history?url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!response.ok) return await getChromeCacheHistory(url);
    return await response.json();
  } catch {
    clearTimeout(timeout);
    return await getChromeCacheHistory(url);
  }
}

async function handleCreateEgg({ name, description }) {
  if (await getConnectionMode() !== "obsidian") return obsidianModeRequiredError();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const serverUrl = await getServerUrl();
    const response = await serverFetch(`${serverUrl}/create-egg`, {
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
    const response = await serverFetch(`${serverUrl}/eggs`, {
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
    if (!server.online) return handleAskChrome(payload);
    if (server.error) return { ...server, mode: "obsidian", answers: [] };
    try {
      const serverUrl = await getServerUrl();
      const response = await serverFetch(`${serverUrl}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if ([502, 503, 504].includes(response.status)) return handleAskChrome(payload);
        return {
          error: data.error || `Server error (${response.status})`,
          errorCode: data.errorCode || "unknown",
        };
      }

      return data;
    } catch {
      return handleAskChrome(payload);
    }
  }

  return handleAskChrome(payload);
}

async function handleAskChrome(payload) {
  const aiSettings = await loadChromeAiSettings();

  if (isSubscriptionProvider(aiSettings)) return subscriptionModeError();
  const provider = aiSettings.chromeAiProvider || "gemini";
  const isLocal = provider === "local";
  if (isSubscriptionProvider(provider)) return subscriptionModeError();

  if (!isLocal && (!aiSettings.chromeAiApiKey || !aiSettings.chromeAiApiKey.trim())) {
    return {
      error: isSubscriptionProvider(provider)
        ? "Open Obsidian with NutEgg enabled to ask a question."
        : "Add your AI API key in Settings to ask a question.",
      errorCode: isSubscriptionProvider(provider) ? "pairing_token_missing" : "no_api_key",
      answers: [],
    };
  }

  try {
    const question = (payload.questions && payload.questions[0]) || "";
    const scope = payload.scope || "within";
    const answer = await askFollowUpStandalone(payload, question, payload.priorQa || [], aiSettings, scope);
    return {
      answers: [{ question, answer, scope }],
      mode: "chrome",
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
  const timeout = setTimeout(() => controller.abort(), isSubscriptionProvider(await loadChromeAiSettings()) ? 20000 : 3000);
  try {
    const serverUrl = await getServerUrl();
    await syncAiConfig(serverUrl);
    const response = await serverFetch(`${serverUrl}/config-status`, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await response.json();
    if (data.port && data.port !== serverPort) {
      serverPort = data.port;
      chrome.storage.local.set({ serverPort: data.port });
    }
    return data;
  } catch (error) {
    clearTimeout(timeout);
    return { status: "error", issues: [error.message || "Cannot reach server"] };
  }
}

async function fetchCredit() {
  if (await getConnectionMode() !== "obsidian") {
    const settings = await loadChromeAiSettings();
    return isSubscriptionProvider(settings) ? subscriptionModeError() : checkCreditAI(settings);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), isSubscriptionProvider(await loadChromeAiSettings()) ? 20000 : 3000);
  try {
    const serverUrl = await getServerUrl();
    await syncAiConfig(serverUrl);
    const response = await serverFetch(`${serverUrl}/credit`, { signal: controller.signal });
    clearTimeout(timeout);
    return await response.json();
  } catch {
    clearTimeout(timeout);
    return { hasBalance: false, statusText: "Credit check failed" };
  }
}

function getReadingTimeMinutes(metadata, content) {
  const fromMeta = parseInt(metadata?.time_estimate_minutes || "0", 10);
  if (fromMeta > 0) return fromMeta;
  const words = typeof content === "string" ? (content.split(/\s+/).length || 0) : 0;
  return Math.max(1, Math.ceil(words / 200));
}

function formatTimeSaved(totalMinutes) {
  const mins = Math.round(totalMinutes || 0);
  const hours = Math.floor(mins / 60);
  const remainingMins = Math.round(mins % 60);
  return hours > 0 ? `${hours}h ${remainingMins}m` : `${remainingMins}m`;
}

let chromeMetricsQueue = Promise.resolve();
function queueChromeMetrics(task) {
  const result = chromeMetricsQueue.then(task);
  chromeMetricsQueue = result.catch(() => {});
  return result;
}

function getChromeMetrics() {
  return queueChromeMetrics(readChromeMetrics);
}

async function readChromeMetrics() {
  const stored = await chrome.storage.local.get(["chromeMetrics", "chromeTabCache"]);
  if (stored.chromeMetrics && typeof stored.chromeMetrics.nuts === "number") {
    const m = stored.chromeMetrics;
    const totalMinutes = Math.round(m.timeSavedMinutes || 0);
    return {
      nuts: m.nuts || 0,
      eggs: m.eggs || 0,
      timeSavedMinutes: totalMinutes,
      timeSaved: formatTimeSaved(totalMinutes),
    };
  }
  const cache = Array.isArray(stored.chromeTabCache) ? stored.chromeTabCache : [];
  let timeSavedMinutes = 0;
  for (const entry of cache) {
    timeSavedMinutes += getReadingTimeMinutes(entry.capturePayload?.metadata, entry.content || entry.capturePayload?.content);
  }
  const initial = {
    nuts: cache.length,
    eggs: cache.length,
    timeSavedMinutes: Math.round(timeSavedMinutes),
  };
  await chrome.storage.local.set({ chromeMetrics: initial });
  return {
    ...initial,
    timeSaved: formatTimeSaved(initial.timeSavedMinutes),
  };
}

async function recordChromeAnalysisMetrics(payload, _result) {
  try {
    await queueChromeMetrics(async () => {
      const current = await readChromeMetrics();
      const minutes = getReadingTimeMinutes(payload?.metadata, payload?.content);
      const updated = {
        nuts: (current.nuts || 0) + 1,
        eggs: (current.eggs || 0) + 1,
        timeSavedMinutes: (current.timeSavedMinutes || 0) + minutes,
      };
      await chrome.storage.local.set({
        chromeMetrics: updated,
      });
    });
  } catch (err) {
    console.warn("[NutEgg] Failed to record Chrome metrics:", err);
  }
}

let metricsFetchTask = null;
function fetchMetrics() {
  if (metricsFetchTask) return metricsFetchTask;
  const task = refreshCombinedMetrics().finally(() => { if (metricsFetchTask === task) metricsFetchTask = null; });
  metricsFetchTask = task;
  return task;
}

async function refreshCombinedMetrics() {
  // Read the vault snapshot in either mode. Replace it on refresh; never accumulate imports.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const serverUrl = await getServerUrl();
    const response = await serverFetch(`${serverUrl}/metrics`, { signal: controller.signal });
    if (!response.ok) throw new Error('Metrics unavailable');
    const snapshot = await response.json();
    if (![snapshot.nuts, snapshot.eggs, snapshot.timeSavedMinutes].every(value => Number.isFinite(value) && value >= 0)) throw new Error('Invalid metrics');
    await chrome.storage.local.set({ obsidianMetricsSnapshot: {
      nuts: snapshot.nuts, eggs: snapshot.eggs, timeSavedMinutes: Math.round(snapshot.timeSavedMinutes),
    } });
  } catch { /* Keep the last known vault snapshot while offline. */ }
  finally {
    clearTimeout(timeout);
  }
  const local = await getChromeMetrics();
  const { obsidianMetricsSnapshot: vault = {} } = await chrome.storage.local.get(['obsidianMetricsSnapshot']);
  const number = value => Number.isFinite(value) && value >= 0 ? value : 0;
  const total = {
    nuts: local.nuts + number(vault.nuts), eggs: local.eggs + number(vault.eggs),
    timeSavedMinutes: local.timeSavedMinutes + number(vault.timeSavedMinutes),
  };
  const metrics = { ...total, timeSaved: formatTimeSaved(total.timeSavedMinutes) };
  await chrome.storage.local.set({ cachedMetrics: metrics });
  return metrics;
}

async function checkServer() {
  if (await getConnectionMode() !== "obsidian") return { online: false, mode: "chrome" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const serverUrl = await getServerUrl();
    const response = await serverFetch(`${serverUrl}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await response.json();
    if (data.port && data.port !== serverPort) {
      serverPort = data.port;
      chrome.storage.local.set({ serverPort: data.port });
    }
    if (response.ok) {
      try { await syncAiConfig(await getServerUrl()); }
      catch (error) { return { online: true, error: error.message, errorCode: "ai_config_sync_failed" }; }
    }
    return { online: response.ok, port: data.port, version: data.version };
  } catch {
    clearTimeout(timeout);
    return { online: false };
  }
}

console.log("[NutEgg] Background service worker started");
