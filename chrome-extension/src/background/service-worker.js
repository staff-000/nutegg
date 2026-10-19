// NutEgg Background Service Worker

importScripts(
  '../../dist/page-identity.js',
  '../../dist/ai-core.js',
  'chinese-fetch.js',
  '../content/extractors/youtube.js',
  'execution-session.js',
  'analysis-job-store.js',
  'analysis-jobs.js'
);

const { PROVIDER_CATALOG, isSubscriptionProvider, checkCreditAI, analyzeContentStandalone, askFollowUpStandalone } =
  NutEggAI;

const DEFAULT_PORT = 27123;
let serverPort = DEFAULT_PORT;

let initPromise = null;
async function init() {
  await chrome.storage.local.setAccessLevel?.({ accessLevel: 'TRUSTED_CONTEXTS' });
  const stored = await chrome.storage.local.get(['serverPort']);
  if (stored.serverPort) serverPort = stored.serverPort;

  // Side panel only — clicking the extension icon opens the panel directly
  chrome.action.setPopup({ popup: '' });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {}); // OK if sidePanel API not available
  console.log('[NutEgg] Port:', serverPort);
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
  const stored = await chrome.storage.local.get(['connectionMode']);
  return stored.connectionMode === 'obsidian' ? 'obsidian' : 'chrome';
}

function obsidianOfflineError() {
  return {
    error: 'Obsidian is not connected. Open Obsidian with NutEgg enabled, or switch to Chrome in Settings.',
    errorCode: 'obsidian_offline',
    mode: 'obsidian',
  };
}

function obsidianModeRequiredError() {
  return {
    error: 'Enable Obsidian mode in Settings to save to your vault.',
    errorCode: 'obsidian_mode_required',
    mode: 'chrome',
  };
}

async function loadChromeAiSettings() {
  await ensureInit();
  await configurationUpdate;
  const stored = await chrome.storage.local.get([
    'chromeAiProvider',
    'chromeApiRevision',
    'chromeAiSource',
    'chromeAiAuthMethod',
    'chromeAiApiKey',
    'chromeAiModel',
    'chromeAiModelFamily',
    'chromeAiEndpoint',
    'localApiType',
    'outputLanguage',
    'contentOutputLanguage',
    'chromeAiOutputLanguage',
    'chromeAiMaxTokens',
    'chunkWindowChars',
    'contentAnalysisMaxTokens',
    'chromeAiPromptOverrides',
    'optimizeForConversation',
  ]);
  stored.chromeAiProvider ||= 'google';
  stored.chromeAiModel ||= PROVIDER_CATALOG[stored.chromeAiProvider]?.defaultModel || 'default';
  const validChunkWindow = Number.isSafeInteger(stored.chunkWindowChars) && stored.chunkWindowChars >= 1000;
  stored.chunkWindowChars = validChunkWindow ? stored.chunkWindowChars : 30000;
  const maxTokens = stored.contentAnalysisMaxTokens ?? stored.chromeAiMaxTokens;
  stored.contentAnalysisMaxTokens = Number.isSafeInteger(maxTokens) && maxTokens >= 500 ? maxTokens : 16384;
  // Chrome AI is available by default.
  stored.chromeAiEnabled = true;
  stored.optimizeForConversation = stored.optimizeForConversation !== false;
  const lang =
    stored.outputLanguage || stored.contentOutputLanguage || stored.chromeAiOutputLanguage || 'same-as-content';
  stored.outputLanguage = lang;
  stored.contentOutputLanguage = lang;
  stored.chromeAiOutputLanguage = lang;
  if (stored.chromeAiPromptOverrides) {
    stored.promptOverrides = stored.chromeAiPromptOverrides;
  }
  stored.chromeAiAuthMethod = 'apiKey';
  const migrated = NutEggAI.normalizeAISettings(stored);
  if (JSON.stringify(migrated) !== JSON.stringify(stored)) await chrome.storage.local.set(migrated);
  return migrated;
}

async function fetchObsidianAiConfig() {
  const state = await NutEggExecution.latest();
  const settings = await loadChromeAiSettings();
  const aiConfig =
    state.mode === 'chatgpt'
      ? { aiProvider: 'openai', aiModel: state.chatgpt?.model || '', aiAuthMethod: 'chatgpt' }
      : state.mode === 'subscription'
        ? { aiProvider: state.subscription.provider, aiModel: state.subscription.model, aiAuthMethod: 'subscription' }
        : { aiProvider: settings.chromeAiProvider, aiModel: settings.chromeAiModel, aiAuthMethod: 'apiKey' };
  return {
    success: true,
    aiConfig: {
      ...aiConfig,
      chunkWindowChars: settings.chunkWindowChars,
      contentAnalysisMaxTokens: settings.contentAnalysisMaxTokens,
    },
    matches: true,
    subscriptionEnabled: state.subscriptionAvailable,
    state,
  };
}

async function syncAiConfig() {
  if ((await getConnectionMode()) !== 'obsidian') return { success: true };
  return fetchObsidianAiConfig();
}

const standaloneControllers = new Set();
// HTTP/1 analysis streams must leave capacity for health, settings and cancellation.
const obsidianRequests = new Set();
const obsidianWaiters = [];
let obsidianActiveRequests = 0;
function cancelObsidianRequests() {
  for (const controller of obsidianRequests) controller.abort();
}
function acquireObsidianSlot(signal) {
  return new Promise((resolve, reject) => {
    const waiter = {
      start() {
        signal.removeEventListener('abort', abort);
        obsidianActiveRequests++;
        let released = false;
        resolve(() => {
          if (released) return;
          released = true;
          obsidianActiveRequests--;
          obsidianWaiters.shift()?.start();
        });
      },
    };
    const abort = () => {
      const index = obsidianWaiters.indexOf(waiter);
      if (index >= 0) obsidianWaiters.splice(index, 1);
      reject(signal.reason || new DOMException('Request cancelled', 'AbortError'));
    };
    if (signal.aborted) return abort();
    if (obsidianActiveRequests < 3) return waiter.start();
    signal.addEventListener('abort', abort, { once: true });
    obsidianWaiters.push(waiter);
  });
}
async function runObsidianRequest(task, signal, timeoutMs = 10 * 60 * 1000, onState) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  obsidianRequests.add(controller);
  // Queued jobs do not consume their execution budget, but cannot wait forever.
  let timer = setTimeout(
    () => controller.abort(new DOMException('Analysis queue timed out', 'TimeoutError')),
    30 * 60 * 1000
  );
  let release;
  try {
    if (!controller.signal.aborted) onState?.('waiting');
    release = await acquireObsidianSlot(controller.signal);
    clearTimeout(timer);
    timer = setTimeout(() => controller.abort(new DOMException('AI request timed out', 'TimeoutError')), timeoutMs);
    controller.signal.throwIfAborted();
    onState?.('running');
    const result = await task(controller);
    controller.signal.throwIfAborted();
    return result;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
    obsidianRequests.delete(controller);
    release?.();
  }
}
let configurationUpdate = Promise.resolve();
chrome.storage.onChanged?.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.chromeCacheTabLimit?.newValue === 0) void analysisJobs().clearChrome().catch(() => {});
  if (changes.obsidianExecutionState || changes.connectionMode || changes.serverPort || changes.chromeApiRevision)
    void analysisJobsInstance?.configurationChanged().catch(() => {});
  if (changes.serverPort) serverPort = changes.serverPort.newValue || DEFAULT_PORT;
  if (changes.connectionMode || changes.serverPort) {
    cancelObsidianRequests();
    NutEggExecution.close();
    if (changes.connectionMode?.newValue === 'obsidian') {
      void NutEggExecution.ensure().catch(() => {});
    }
  }
  const configKeys = [
    'chromeAiProvider',
    'chromeAiApiKey',
    'chromeAiModel',
    'chromeAiModelFamily',
    'chromeAiSource',
    'chromeAiEndpoint',
    'localApiType',
    'chromeApiRevision',
    'outputLanguage',
  ];
  if (configKeys.some(key => key in changes)) {
    cancelObsidianRequests();
    for (const controller of standaloneControllers) controller.abort();
    const revision = changes.chromeApiRevision?.newValue || crypto.randomUUID();
    if (!changes.chromeApiRevision) {
      configurationUpdate = chrome.storage.local.set({ chromeApiRevision: revision });
    }
    NutEggExecution.configurationChanged(revision);
  }
});

function subscriptionModeError() {
  return {
    error: 'Set up an AI API key in Chrome Settings.',
    errorCode: 'subscription_requires_obsidian',
    mode: 'chrome',
  };
}

async function serverFetch(url, options = {}) {
  const { executionController, ...fetchOptions } = options;
  options = fetchOptions;
  options.signal?.throwIfAborted();
  const parsed = new URL(url);
  if (parsed.hostname !== '127.0.0.1') throw new Error('Invalid Obsidian endpoint');
  if (parsed.pathname === '/health') return fetch(url, options);
  const health = await fetch(`${parsed.origin}/health`, { signal: AbortSignal.timeout(3000) }).then(r => r.json());
  const key = `obsidianConnection:${parsed.origin}:${health.instanceId}`;
  let stored = await chrome.storage.local.get([key]);
  const headers = { ...options.headers };
  // Extension GET requests can omit Origin. The server still checks any native
  // Origin and verifies the credential against this approved extension identity.
  headers['X-NutEgg-Extension-Origin'] = chrome.runtime.getURL('/').replace(/\/$/, '');
  const storedLang = (await chrome.storage.local.get(['outputLanguage'])).outputLanguage;
  if (storedLang) {
    headers['X-NutEgg-Output-Language'] = encodeURIComponent(storedLang);
  }
  if (parsed.pathname !== '/health') {
    if (!stored[key]) {
      try {
        await connectObsidian();
        stored = await chrome.storage.local.get([key]);
      } catch {}
    }
    if (!stored[key]) throw new Error('Connect NutEgg Chrome in Obsidian first.');
    headers.Authorization = `Bearer ${stored[key]}`;
  }
  let executionJobId;
  if (options.method === 'POST' && ['/analyze', '/ask', '/confirm', '/create-egg'].includes(parsed.pathname)) {
    const payload = JSON.parse(options.body || '{}');
    payload.execution = await NutEggExecution.register(await loadChromeAiSettings());
    executionJobId = payload.execution.jobId;
    NutEggExecution.bindTransport?.(executionJobId, executionController);
    options = { ...options, body: JSON.stringify(payload) };
  }
  let response;
  try {
    options.signal?.throwIfAborted();
    response = await fetch(url, { ...options, headers });
    if (!response.ok && executionJobId) NutEggExecution.cancel?.(executionJobId, true);
  } catch (error) {
    if (executionJobId) NutEggExecution.cancel?.(executionJobId, true);
    throw error;
  }
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
    if (!health.capabilities?.includes('execution-v3') || health.protocolVersion !== NutEggAI.EXECUTION_PROTOCOL)
      throw new Error('Update the NutEgg Obsidian plugin.');
    const key = `obsidianConnection:${serverUrl}:${health.instanceId}`;
    const saved = await chrome.storage.local.get([key]);
    if (saved[key]) {
      const origin = chrome.runtime.getURL('/').replace(/\/$/, '');
      const response = await fetch(`${serverUrl}/execution/state`, {
        headers: {
          'X-NutEgg-Extension-Origin': origin,
          Authorization: `Bearer ${saved[key]}`,
        },
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) return { success: true, instanceId: health.instanceId, credential: saved[key] };
      if (response.status !== 401) throw new Error('Could not read AI connection state.');
      await chrome.storage.local.remove(key);
    }
    const nonce = [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join('');
    const request = path =>
      fetch(`${serverUrl}/connection/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-NutEgg-Extension-Origin': chrome.runtime.getURL('/').replace(/\/$/, ''),
        },
        body: JSON.stringify({ nonce }),
        signal: AbortSignal.timeout(3000),
      }).then(async r => {
        if (!r.ok) throw new Error('Connection approval failed.');
        return r.json();
      });
    await request('start');
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      const result = await request('finish');
      if (result.state === 'approved') {
        await chrome.storage.local.set({ [key]: result.credential });
        return { success: true, instanceId: health.instanceId, credential: result.credential };
      }
      if (result.state === 'denied') throw new Error('Connection was not approved in Obsidian.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Connection approval timed out.');
  })().finally(() => (connectionRequest = null));
  return connectionRequest;
}

// --- Messages ---

const captureTabUrls = new Map();
let captureNavigationUpdate = Promise.resolve();
function invalidateAnalysisPage(tabId, url, reload = false) {
  if (analysisJobsInstance) return analysisJobsInstance.invalidate(tabId, url, reload);
  // A worker can wake for navigation before a panel opens. Persist only the
  // small generation map here; loading the recovery ledger remains lazy.
  const update = captureNavigationUpdate.catch(() => {}).then(async () => {
    const saved = await chrome.storage.session.get(['analysisPageEpochs']);
    const epochs = saved.analysisPageEpochs || {}, previous = epochs[tabId];
    const key = url ? NutEggPageIdentity.capturePageKey(url) : previous?.key;
    if (reload || !url || previous?.key !== key) {
      epochs[tabId] = { key, generation: (previous?.generation || 0) + 1 };
      await chrome.storage.session.set({ analysisPageEpochs: epochs });
    }
  });
  captureNavigationUpdate = update;
  return update;
}
chrome.tabs?.onUpdated?.addListener((tabId, change, tab) => {
  if (change.url || change.status === 'loading')
    void invalidateAnalysisPage(tabId, change.url || tab?.url, change.status === 'loading').catch(() => {});
  if (!change.url) return;
  const key = NutEggPageIdentity.capturePageKey(change.url);
  const previous = captureTabUrls.get(tabId);
  captureTabUrls.set(tabId, key);
  if (previous === key) return;
  chrome.tabs
    .sendMessage(tabId, { action: 'capture-navigation', previousKey: previous, key, observedAt: Date.now() })
    .catch(() => {});
});
chrome.tabs?.onRemoved?.addListener(tabId => {
  captureTabUrls.delete(tabId);
  void invalidateAnalysisPage(tabId).catch(() => {});
});

chrome.tabs?.onAttached?.addListener((tabId, info) => {
  void analysisJobsInstance?.move(tabId, info.newWindowId).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'youtube-player-snapshot')
    return handleYouTubePlayerSnapshotMessage(message, _sender, sendResponse);
  if (_sender?.id !== chrome.runtime.id || (_sender?.url && !_sender.url.startsWith(chrome.runtime.getURL('/')))) {
    sendResponse({ error: 'Privileged extension page required.', errorCode: 'forbidden' });
    return false;
  }
  if (message.action === 'set-execution-mode') {
    NutEggExecution.changeMode(message.mode)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  if (message.action === 'connect-obsidian') {
    NutEggExecution.ensure()
      .then(() => ({ success: true }))
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  if (message.action === 'chatgpt-control') {
    (async () => {
      if ((await getConnectionMode()) !== 'obsidian')
        throw new Error('ChatGPT sign-in requires Obsidian-connected mode.');
      if (!['status', 'signin', 'cancel', 'signout', 'models', 'model'].includes(message.operation))
        throw new Error('Invalid ChatGPT operation.');
      const current = await NutEggExecution.ensure();
      if ((await getConnectionMode()) !== 'obsidian')
        throw new Error('ChatGPT sign-in requires Obsidian-connected mode.');
      const response = await serverFetch(`${await getServerUrl()}/chatgpt/${message.operation}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: message.model,
          refresh: message.refresh === true,
          expectedConnectionRevision: message.expectedConnectionRevision ?? current.state.chatgpt?.revision,
        }),
        signal: AbortSignal.timeout(45000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ChatGPT operation failed.');
      return result;
    })()
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  if (message.action === 'subscription-control') {
    (async () => {
      const operations = ['status'];
      if (!operations.includes(message.operation) || !NutEggAI.supportsSubscription(message.provider)) {
        throw new Error('Invalid subscription operation');
      }
      const url = await getServerUrl();
      const health = await serverFetch(`${url}/health`, { signal: AbortSignal.timeout(3000) }).then(r => r.json());
      if (health.subscriptionEnabled !== true) {
        sendResponse({ state: 'disabled', error: 'AI connection unavailable.' });
        return;
      }
      if (!health.capabilities?.includes('subscription-v1')) {
        throw new Error('Update the NutEgg Obsidian plugin to use subscriptions.');
      }
      const response = await serverFetch(`${url}/subscription/${message.operation}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: message.provider, model: message.model, device: message.device }),
        signal: AbortSignal.timeout(message.operation === 'test' ? 190000 : 20000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Subscription operation failed.');
      return result;
    })()
      .then(sendResponse)
      .catch(error => sendResponse({ state: 'error', error: error.message, message: error.message }));
    return true;
  }
  if (message.action === 'get-obsidian-ai-config') {
    fetchObsidianAiConfig(null, message.settings)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  if (message.action === 'sync-obsidian-api') {
    (async () => {
      if ((await getConnectionMode()) !== 'obsidian') return { synced: false };
      const current = await NutEggExecution.ensure();
      const settings = await loadChromeAiSettings();
      if (current.state.mode !== 'apiKey') return { synced: false };
      if (settings.chromeAiProvider !== 'local' && !settings.chromeAiApiKey?.trim())
        throw new Error('An API key is required for this provider.');
      const serverUrl = await getServerUrl();
      const response = await serverFetch(`${serverUrl}/execution/native-api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          clientId: current.session.clientId,
          sessionId: current.session.sessionId,
          instanceId: current.state.instanceId,
          expectedRevision: current.state.revision,
          key: settings.chromeAiApiKey || '',
          config: {
            aiProvider: settings.chromeAiProvider,
            aiModel: settings.chromeAiModel,
            aiSource: settings.chromeAiSource,
            aiModelFamily: settings.chromeAiModelFamily,
            localApiType: settings.localApiType,
            ...(settings.chromeAiEndpoint ? { localEndpoint: settings.chromeAiEndpoint } : {}),
            chunkWindowChars: settings.chunkWindowChars,
            contentAnalysisMaxTokens: settings.contentAnalysisMaxTokens,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not sync Obsidian AI.');
      return result;
    })()
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  if (message.action === 'sync-ai-config') {
    syncAiConfig()
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message, errorCode: 'ai_config_sync_failed' }));
    return true;
  }
  if (message.action === 'get-debug-info') {
    const scope = NutEggAI.normalizeAIDebugScope(message.debugScope);
    if (!scope) {
      sendResponse({ unavailable: true, mode: message.mode });
      return false;
    }
    if (message.mode === 'chrome') {
      sendResponse({ ...NutEggAI.combineAIDebugInfo(NutEggAI.getAIDebugInfo(scope)), mode: 'chrome' });
      return false;
    }
    (async () => {
      if ((await getConnectionMode()) !== 'obsidian') return { unavailable: true, mode: 'obsidian' };
      const serverUrl = await getServerUrl();
      const response = await serverFetch(`${serverUrl}/debug-info?scope=${encodeURIComponent(scope)}`, {
        signal: AbortSignal.timeout(2500),
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Debug info unavailable');
      return {
        ...NutEggAI.combineAIDebugInfo(NutEggAI.getAIDebugInfo(scope), await response.json()),
        mode: 'obsidian',
      };
    })()
      .then(sendResponse)
      .catch(() => sendResponse({ unavailable: true, mode: 'obsidian' }));
    return true;
  }
  if (message.action === 'analyze') {
    handleAnalyze(message.payload)
      .then(r => sendResponse(r))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === 'confirm') {
    handleConfirm(message.payload)
      .then(r => sendResponse(r))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === 'ask') {
    handleAsk(message.payload)
      .then(r => sendResponse(r))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === 'create-egg') {
    handleCreateEgg(message)
      .then(r => sendResponse(r))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === 'get-eggs') {
    fetchEggs()
      .then(r => sendResponse(r))
      .catch(() => sendResponse({ eggs: [] }));
    return true;
  }

  if (message.action === 'history') {
    fetchHistory(message.url)
      .then(r => sendResponse(r))
      .catch(() => sendResponse({ history: [], latest: null }));
    return true;
  }

  if (message.action === 'clear-chrome-cache') {
    clearChromeCache()
      .then(() => getChromeCacheInfo())
      .then(info => sendResponse({ success: true, ...info }))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === 'set-chrome-cache-limit') {
    setChromeCacheLimit(message.limit)
      .then(info => sendResponse({ success: true, ...info }))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === 'get-chrome-cache-info') {
    getChromeCacheInfo()
      .then(info => sendResponse(info))
      .catch(() => sendResponse({ count: 0, limit: 100 }));
    return true;
  }

  if (message.action === 'check-server') {
    checkServer()
      .then(r => sendResponse(r))
      .catch(() => sendResponse({ online: false }));
    return true;
  }

  if (message.action === 'check-chrome-ai') {
    loadChromeAiSettings().then(async settings => {
      const stored = await chrome.storage.local.get(['connectionMode', 'obsidianExecutionState']);
      const effectiveMode = NutEggAI.selectEffectiveExecution(stored.connectionMode, stored.obsidianExecutionState);
      if (effectiveMode === 'chatgpt') {
        const status = stored.obsidianExecutionState.chatgpt;
        sendResponse({
          enabled: true,
          configured: status?.state === 'ready' && !!status?.model,
          provider: 'openai',
          authMethod: 'chatgpt',
          model: status?.model || '',
        });
        return;
      }
      if (effectiveMode === 'subscription') {
        const selected = stored.obsidianExecutionState.subscription;
        sendResponse({
          enabled: true,
          configured: false,
          provider: selected.provider,
          authMethod: 'subscription',
          model: selected.model,
        });
        return;
      }
      const provider = settings.chromeAiProvider || 'google';
      const isLocal = provider === 'local';
      const hasKey = isLocal ? true : Boolean(settings.chromeAiApiKey && settings.chromeAiApiKey.trim());
      const defaultModel = typeof PROVIDER_CATALOG !== 'undefined' ? PROVIDER_CATALOG[provider]?.defaultModel : '';
      sendResponse({
        enabled: true,
        configured: hasKey && !isSubscriptionProvider(settings),
        provider,
        authMethod: settings.chromeAiAuthMethod,
        model: settings.chromeAiModel || defaultModel || '',
      });
    });
    return true;
  }

  if (message.action === 'check-chrome-credit') {
    loadChromeAiSettings().then(settings => {
      if (isSubscriptionProvider(settings)) {
        sendResponse(subscriptionModeError());
        return;
      }
      checkCreditAI(settings)
        .then(credit => sendResponse(credit))
        .catch(err => sendResponse({ error: String(err), hasBalance: false, statusText: 'Credit check failed' }));
    });
    return true;
  }

  if (message.action === 'get-credit') {
    fetchCredit()
      .then(r => sendResponse(r))
      .catch(err => sendResponse({ error: String(err), hasBalance: false }));
    return true;
  }

  if (message.action === 'config-status') {
    checkConfigStatus()
      .then(r => sendResponse(r))
      .catch(() => sendResponse({ status: 'error', issues: ['Cannot reach server'] }));
    return true;
  }

  if (message.action === 'set-port') {
    serverPort = message.port || DEFAULT_PORT;
    chrome.storage.local
      .set({ serverPort })
      .then(() => {
        sendResponse({ success: true, port: serverPort });
      })
      .catch(err => {
        sendResponse({ success: false, error: err?.message });
      });
    return true;
  }

  if (message.action === 'metrics') {
    fetchMetrics()
      .then(r => sendResponse(r))
      .catch(() => sendResponse({ nuts: 0, eggs: 0, timeSaved: '0m' }));
    return true;
  }
});

// --- Background-owned analysis jobs ---
// Ports subscribe to durable jobs; disconnecting a view never cancels its work.
// The manager owns finite-work keep-alive, cancellation, and panel restoration.
let analysisJobsInstance;
async function getAnalysisConfiguration() {
  const saved = await chrome.storage.local.get(['connectionMode', 'chromeApiRevision', 'serverPort']);
  const mode = saved.connectionMode === 'obsidian' ? 'obsidian' : 'chrome';
  const execution = mode === 'obsidian' ? await NutEggExecution.latest() : null;
  return {
    mode, cacheGeneration: chromeCacheGeneration, revision: mode === 'obsidian' ? `${execution.instanceId}:${execution.revision}:${saved.chromeApiRevision || 'initial'}` : saved.chromeApiRevision || 'initial',
    serverPort: mode === 'obsidian' ? saved.serverPort || DEFAULT_PORT : null,
    cacheAllowed: mode !== 'chrome' || await getChromeCacheLimit() > 0,
  };
}
function analysisJobs() {
  if (!analysisJobsInstance) analysisJobsInstance = new AnalysisJobManager({
    store: new AnalysisJobStore(), chromeApi: chrome,
    beforeInitialize: () => captureNavigationUpdate,
    pageKey: value => NutEggPageIdentity.capturePageKey(value),
    sourceKey: value => normalizeCacheUrl(value),
    getConfiguration: getAnalysisConfiguration,
    execute: (payload, progress, signal, configuration) => handleAnalyze(payload, progress, signal, undefined, configuration.cacheGeneration),
  });
  return analysisJobsInstance;
}
chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'nutegg-analyze') return;
  if (port.sender?.id !== chrome.runtime.id || !port.sender?.url?.startsWith(chrome.runtime.getURL('/'))) {
    port.disconnect(); return;
  }
  analysisJobs().attach(port);
});
// --- Server communication ---

function hasKnowledgeSelected(payload) {
  return Boolean(
    payload?.generateKnowledgeEntries === true ||
    payload?.enabledSections?.generateKnowledgeEntries === true ||
    payload?.enabledSections?.knowledge === true
  );
}

function hasKnowledgeGenerated(result) {
  if (!result || typeof result !== 'object') return false;
  if (Array.isArray(result.extractedEntries) && result.extractedEntries.length > 0) return true;
  if (Array.isArray(result.newKnowledge) && result.newKnowledge.length > 0) return true;
  if (Array.isArray(result.eggResults)) {
    const hasEggEntries = result.eggResults.some(
      e => Array.isArray(e?.extractedEntries) && e.extractedEntries.length > 0
    );
    if (hasEggEntries) return true;
  }
  return false;
}

function isKnowledgeSelectedAndGenerated(payload, result) {
  return hasKnowledgeSelected(payload) && hasKnowledgeGenerated(result);
}

async function handleAnalyze(payload, onProgress, signal, requestController, admittedCacheGeneration = chromeCacheGeneration) {
  const cacheGeneration = admittedCacheGeneration;
  if ((await getConnectionMode()) === 'obsidian') {
    if (!requestController) {
      try {
        return await runObsidianRequest(
          controller => handleAnalyze(payload, onProgress, controller.signal, controller, cacheGeneration),
          signal,
          undefined,
          state => onProgress?.({ type: 'partial', section: 'executionQueue', data: { state } })
        );
      } catch (error) {
        return {
          error: error.message || 'Analysis cancelled',
          errorCode:
            error.name === 'TimeoutError' ? 'timeout' : error.name === 'AbortError' ? 'cancelled' : 'network_error',
          mode: 'obsidian',
        };
      }
    }
    signal.throwIfAborted();
    const server = await checkServer();
    if (!server.online) return obsidianOfflineError();
    if (server.error) return { ...server, mode: 'obsidian' };
    try {
      const serverUrl = await getServerUrl();
      const response = await serverFetch(`${serverUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/x-ndjson, application/json',
        },
        body: JSON.stringify({ ...payload, stream: true }),
        signal,
        executionController: requestController,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        return {
          error: data.error || `Server error (${response.status})`,
          errorCode: data.errorCode || 'unknown',
          statusCode: data.statusCode || response.status,
          mode: 'obsidian',
        };
      }

      if (response.headers?.get?.('content-type')?.includes('application/x-ndjson') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let finalResult = null;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              try {
                const event = JSON.parse(trimmed);
                if (event.type === 'partial') {
                  onProgress?.(event);
                } else if (event.type === 'error') {
                  finalResult = { error: event.error, errorCode: event.errorCode || 'server_error' };
                } else if (event.type === 'complete') {
                  finalResult = event.result;
                }
              } catch {}
            }
          }
          if (buffer.trim()) {
            try {
              const event = JSON.parse(buffer.trim());
              if (event.type === 'complete') finalResult = event.result;
              else if (event.type === 'error')
                finalResult = { error: event.error, errorCode: event.errorCode || 'server_error' };
            } catch {}
          }
          if (!finalResult) throw new Error('AI execution interrupted. Retry explicitly.');
          signal.throwIfAborted();
          const result = { ...finalResult, mode: 'obsidian' };
          if (isKnowledgeSelectedAndGenerated(payload, result)) {
            await recordChromeEggMetric();
          }
          return result;
        } finally {
          await reader.cancel().catch(() => {});
          reader.releaseLock();
        }
      }

      const data = await response.json();
      const result = { ...data, mode: 'obsidian' };
      if (isKnowledgeSelectedAndGenerated(payload, result)) {
        await recordChromeEggMetric();
      }
      return result;
    } catch (err) {
      return {
        error: signal.aborted ? signal.reason?.message || 'Analysis cancelled' : err.message,
        errorCode: signal.aborted
          ? signal.reason?.name === 'TimeoutError'
            ? 'timeout'
            : 'cancelled'
          : 'network_error',
        mode: 'obsidian',
      };
    }
  }

  onProgress?.({ type: 'partial', section: 'executionQueue', data: { state: 'running' } });
  return handleAnalyzeChrome(payload, onProgress, cacheGeneration, signal);
}

async function handleAnalyzeChrome(payload, onProgress, cacheGeneration = chromeCacheGeneration, signal) {
  const aiSettings = await loadChromeAiSettings();

  if (isSubscriptionProvider(aiSettings)) return subscriptionModeError();
  const provider = aiSettings.chromeAiProvider || 'google';
  const isLocal = provider === 'local';

  if (!isLocal && (!aiSettings.chromeAiApiKey || !aiSettings.chromeAiApiKey.trim())) {
    return {
      error: 'Add your AI API key in Settings to start analyzing.',
      errorCode: 'no_api_key',
      mode: 'chrome',
    };
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  standaloneControllers.add(controller);
  try {
    const result = await analyzeContentStandalone(payload, aiSettings, onProgress, controller.signal);
    controller.signal.throwIfAborted();
    const finalResult = {
      ...result,
      execution: {
        jobId: crypto.randomUUID(),
        origin: 'chrome',
        configurationRevision: Date.now().toString(),
        authMethod: 'apiKey',
        provider: aiSettings.chromeAiProvider,
        model: aiSettings.chromeAiModel,
      },
      nutId: result.nutId || `chrome_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      stage: 'stage1',
      mode: 'chrome',
      matchedEggs: [],
      allEggs: [],
      extractedEntries: result.extractedEntries || [],
      generateKnowledgeEntries: payload.generateKnowledgeEntries === true,
    };
    if (result.extractedEntries?.length) {
      finalResult.eggResults = [
        {
          egg: 'Knowledge',
          generateKnowledgeEntries: true,
          keyQuestionAnswers: [],
          extractedEntries: result.extractedEntries,
          readAction: 'highlights',
          readVerdict: true,
          readVerdictReason: '',
          readingSources: [],
        },
      ];
      finalResult.newKnowledge = result.extractedEntries.map(e => ({
        egg: 'Knowledge',
        content: e.content,
      }));
    }
    await recordChromeAnalysisMetrics(payload, finalResult);
    await saveChromeCacheEntry(payload, finalResult, cacheGeneration, controller.signal);
    return finalResult;
  } catch (err) {
    return {
      error: err.message || 'Chrome AI analysis failed',
      errorCode: err.code || 'unknown',
      statusCode: err.statusCode || 500,
      mode: 'chrome',
    };
  } finally {
    signal?.removeEventListener('abort', abort);
    standaloneControllers.delete(controller);
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

// Storage updates are read-modify-write transactions within this worker.
// Keep the tail fulfilled so one storage failure cannot poison later work.
let chromeCacheQueue = Promise.resolve();
let chromeCacheGeneration = 0;
function withChromeCacheLock(operation) {
  const result = chromeCacheQueue.then(operation);
  chromeCacheQueue = result.catch(() => {});
  return result;
}
function loadChromeCache() {
  return withChromeCacheLock(loadChromeCacheUnlocked);
}
async function loadChromeCacheUnlocked() {
  const stored = await chrome.storage.local.get(['chromeTabCache']);
  const existing = Array.isArray(stored.chromeTabCache) ? stored.chromeTabCache : [];
  const cache = trimChromeCache(existing, await getChromeCacheLimit());
  if (cache.length !== existing.length) await chrome.storage.local.set({ chromeTabCache: cache });
  return cache;
}

function extractVideoIdentity(rawUrl, metadata = null) {
  if (typeof NutEggAI !== 'undefined' && typeof NutEggAI.getVideoIdentity === 'function') {
    try {
      const vid = NutEggAI.getVideoIdentity(rawUrl);
      if (vid) return vid;
    } catch {}
  }
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.toLowerCase();
    const segments = u.pathname.split('/').filter(Boolean);

    // YouTube
    const youtubeHosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];
    let ytId = null;
    if (youtubeHosts.includes(host)) {
      if (segments[0] === 'watch') ytId = u.searchParams.get('v');
      else if (['shorts', 'live', 'embed', 'v'].includes(segments[0])) ytId = segments[1];
    } else if (host === 'youtu.be' || host === 'www.youtu.be') {
      ytId = segments[0];
    } else if (['youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host) && segments[0] === 'embed') {
      ytId = segments[1];
    }
    if (ytId && /^[A-Za-z0-9_-]{11}$/.test(ytId)) {
      return { platform: 'youtube', id: ytId, canonicalUrl: `https://www.youtube.com/watch?v=${ytId}` };
    }

    // Bilibili
    const bilibiliHosts = ['bilibili.com', 'www.bilibili.com', 'm.bilibili.com', 'player.bilibili.com'];
    if (bilibiliHosts.some(h => host === h || host.endsWith('.' + h))) {
      let bvid = segments[0] === 'video' ? segments[1] : u.searchParams.get('bvid');
      if (!bvid && u.searchParams.get('aid')) bvid = `av${u.searchParams.get('aid')}`;
      if (!bvid && segments[0] === 'video' && /^av\d+$/i.test(segments[1])) bvid = segments[1];
      if (bvid) {
        const cleanBvid = bvid.split('?')[0].split('/')[0];
        const part = Number(
          u.searchParams.get('p') || (host === 'player.bilibili.com' ? u.searchParams.get('page') : null) || 1
        );
        const partSuffix = Number.isSafeInteger(part) && part > 1 ? `?p=${part}` : '';
        return {
          platform: 'bilibili',
          id: cleanBvid,
          canonicalUrl: `https://www.bilibili.com/video/${cleanBvid}${partSuffix}`,
        };
      }
    }
  } catch {}

  if (metadata?.video_id && (metadata.platform === 'youtube' || metadata.platform === 'bilibili')) {
    const id = metadata.video_id;
    const platform = metadata.platform;
    const part = Number(metadata.part || 1);
    const canonicalUrl =
      platform === 'youtube'
        ? `https://www.youtube.com/watch?v=${id}`
        : `https://www.bilibili.com/video/${id}${Number.isSafeInteger(part) && part > 1 ? `?p=${part}` : ''}`;
    return { platform, id, canonicalUrl };
  }

  return null;
}

function normalizeCacheUrl(rawUrl, metadata = null) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const video = extractVideoIdentity(rawUrl, metadata);
  if (video) return video.canonicalUrl;

  if (typeof NutEggAI !== 'undefined' && typeof NutEggAI.normalizeContentUrl === 'function') {
    try {
      return NutEggAI.normalizeContentUrl(rawUrl);
    } catch {}
  }

  try {
    const u = new URL(rawUrl);
    if (!NutEggPageIdentity.isApplicationHash(u.hash)) u.hash = '';
    const twitterHosts = ['twitter.com', 'www.twitter.com', 'mobile.twitter.com', 'x.com', 'www.x.com'];
    if (twitterHosts.includes(u.hostname.toLowerCase())) {
      u.hostname = 'x.com';
      if (/\/status\/\d+/.test(u.pathname)) {
        u.search = '';
        return u.toString().replace(/\/$/, '');
      }
    }
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'ref',
      'source',
      'fbclid',
      'gclid',
      'si',
      'pp',
      'feature',
      'spm',
      'vd_source',
      'spm_id_from',
    ];
    for (const param of trackingParams) {
      u.searchParams.delete(param);
    }
    u.searchParams.sort();
    let pathname = u.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      u.pathname = pathname.slice(0, -1);
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return rawUrl.split('#')[0].replace(/\/+$/, '');
  }
}

function matchesCacheEntry(entry, targetUrl) {
  if (!entry || !targetUrl) return false;
  const route = value => {
    try {
      return NutEggPageIdentity.isApplicationHash(new URL(value).hash);
    } catch {
      return false;
    }
  };
  if (route(targetUrl) || route(entry.url) || route(entry.capturePayload?.url)) {
    const original = entry.capturePayload?.url || entry.url;
    return !!original && normalizeCacheUrl(original) === normalizeCacheUrl(targetUrl);
  }
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
  const entryVideo =
    entry.videoPlatform && entry.videoId
      ? { platform: entry.videoPlatform, id: entry.videoId }
      : extractVideoIdentity(entry.url, entry.capturePayload?.metadata);

  if (targetVideo && entryVideo) {
    if (targetVideo.platform === entryVideo.platform && targetVideo.id === entryVideo.id) {
      if (targetVideo.platform === 'bilibili') {
        return (entry.canonicalUrl || normalizeCacheUrl(entry.url)) === targetNorm;
      }
      return true;
    }
  }

  // 3. Fallback URL match
  if (entry.url && entry.url.split('#')[0] === targetUrl.split('#')[0]) {
    return true;
  }
  if (entry.capturePayload?.url && entry.capturePayload.url.split('#')[0] === targetUrl.split('#')[0]) {
    return true;
  }

  return false;
}

async function getChromeCacheLimit() {
  const stored = await chrome.storage.local.get(['chromeCacheTabLimit']);
  if (typeof stored.chromeCacheTabLimit === 'number' && stored.chromeCacheTabLimit >= 0) {
    return Math.min(1000, Math.round(stored.chromeCacheTabLimit));
  }
  return DEFAULT_CHROME_CACHE_LIMIT;
}

async function getChromeCacheHistory(url) {
  if (!url) return { history: [], latest: null };
  const cache = await loadChromeCache();
  const entry = cache.find(item => matchesCacheEntry(item, url));
  if (!entry) return { history: [], latest: null };
  return { history: [entry], latest: entry };
}

async function saveChromeCacheEntry(payload, result, generation = chromeCacheGeneration, signal) {
  try {
    return await withChromeCacheLock(async () => {
      if (generation !== chromeCacheGeneration || signal?.aborted) return;
      const limit = await getChromeCacheLimit();
      if (limit <= 0) return;
      const url = payload?.url;
      if (!url) return;

      const norm = normalizeCacheUrl(url, payload?.metadata);
      const video = extractVideoIdentity(url, payload?.metadata);

      const stored = await chrome.storage.local.get(['chromeTabCache']);
      let cache = Array.isArray(stored.chromeTabCache) ? stored.chromeTabCache : [];

      // Remove existing entry for the same video or URL
      cache = cache.filter(item => !matchesCacheEntry(item, url));

      const entry = {
        nutId: result.nutId || `chrome_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        url,
        canonicalUrl: norm,
        videoId: video?.id || null,
        videoPlatform: video?.platform || null,
        title: payload.title || result.titleVerdict?.title || '',
        result,
        saved: null,
        sourceType: payload.sourceType || video?.platform || 'generic',
        author: payload.author || payload.metadata?.author || '',
        publishedAt: payload.publishedAt || payload.metadata?.published || '',
        content: typeof payload.content === 'string' ? payload.content.slice(0, 30000) : '',
        capturePayload: {
          url,
          title: payload.title,
          sourceType: payload.sourceType,
          enabledSections: payload.enabledSections,
          generateKnowledgeEntries: payload.generateKnowledgeEntries === true,
          metadata: payload.metadata,
          captureCoverage: NutEggAI.normalizeCaptureCoverage?.(payload.captureCoverage),
          transcriptAvailable: payload.transcriptAvailable,
          mediaType: payload.mediaType,
        },
        timestamp: Date.now(),
      };

      if (typeof payload.content === 'string' && payload.content.length > 30000) {
        entry.capturePayload.captureCoverage = {
          ...entry.capturePayload.captureCoverage,
          reasons: [...new Set([...(entry.capturePayload.captureCoverage?.reasons || []), 'truncated'])],
          originalCharacters: Math.max(
            entry.capturePayload.captureCoverage?.originalCharacters || 0,
            payload.content.length
          ),
          capturedCharacters: 30000,
        };
      }
      cache.unshift(entry);
      cache = trimChromeCache(cache, limit);
      if (generation !== chromeCacheGeneration || signal?.aborted) return;
      await chrome.storage.local.set({ chromeTabCache: cache });
    });
  } catch (err) {
    console.warn?.('[NutEgg] Failed to save Chrome cache entry:', err);
  }
}

function clearChromeCache() {
  chromeCacheGeneration++;
  const recovery = analysisJobs().clearChrome();
  return Promise.all([recovery, withChromeCacheLock(() => chrome.storage.local.set({ chromeTabCache: [] }))]);
}

async function setChromeCacheLimit(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return Promise.reject(new Error('Invalid cache limit'));
  const limit = Math.min(1000, Math.max(0, Math.round(value)));
  if (limit === 0) chromeCacheGeneration++;
  return withChromeCacheLock(async () => {
    const stored = await chrome.storage.local.get(['chromeTabCache']);
    const cache = trimChromeCache(Array.isArray(stored.chromeTabCache) ? stored.chromeTabCache : [], limit);
    await chrome.storage.local.set({ chromeCacheTabLimit: limit, chromeTabCache: cache });
    if (limit === 0) await analysisJobs().clearChrome();
    return { count: cache.length, limit };
  });
}

async function getChromeCacheInfo() {
  return withChromeCacheLock(async () => {
    const cache = await loadChromeCacheUnlocked();
    return { count: cache.length, limit: await getChromeCacheLimit() };
  });
}

async function handleConfirm(payload, controller) {
  if ((await getConnectionMode()) !== 'obsidian') return obsidianModeRequiredError();
  if (!controller) return runObsidianRequest(controller => handleConfirm(payload, controller));
  const serverUrl = await getServerUrl();
  const response = await serverFetch(`${serverUrl}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal,
    executionController: controller,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { error: data.error || `Server error (${response.status})`, errorCode: data.errorCode };
  }

  return data;
}

async function fetchHistory(url) {
  if ((await getConnectionMode()) !== 'obsidian') {
    return await getChromeCacheHistory(url);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const serverUrl = await getServerUrl();
    const response = await serverFetch(`${serverUrl}/history?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return await getChromeCacheHistory(url);
    return await response.json();
  } catch {
    clearTimeout(timeout);
    return await getChromeCacheHistory(url);
  }
}

async function handleCreateEgg({ name, description }, controller) {
  if ((await getConnectionMode()) !== 'obsidian') return obsidianModeRequiredError();
  if (!controller)
    return runObsidianRequest(controller => handleCreateEgg({ name, description }, controller), undefined, 190000);
  try {
    const serverUrl = await getServerUrl();
    const response = await serverFetch(`${serverUrl}/create-egg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
      signal: controller.signal,
      executionController: controller,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { error: data.error || `Server error (${response.status})` };
    }

    return data;
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'Request timed out' : err.message || 'Failed to connect to Obsidian' };
  }
}

async function fetchEggs() {
  if ((await getConnectionMode()) !== 'obsidian') return { eggs: [] };
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

async function handleAsk(payload, controller) {
  if ((await getConnectionMode()) === 'obsidian') {
    if (!controller) {
      try {
        return await runObsidianRequest(controller => handleAsk(payload, controller));
      } catch (error) {
        return {
          error: error.message,
          errorCode:
            error.name === 'TimeoutError'
              ? 'timeout'
              : error.name === 'AbortError'
                ? 'cancelled'
                : 'execution_interrupted',
          mode: 'obsidian',
          answers: [],
        };
      }
    }
    const server = await checkServer();
    if (!server.online) return obsidianOfflineError();
    if (server.error) return { ...server, mode: 'obsidian', answers: [] };
    try {
      const serverUrl = await getServerUrl();
      const response = await serverFetch(`${serverUrl}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
        executionController: controller,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `Server error (${response.status})`,
          errorCode: data.errorCode || 'unknown',
        };
      }

      return data;
    } catch (error) {
      return { error: error.message, errorCode: 'execution_interrupted', mode: 'obsidian', answers: [] };
    }
  }

  return handleAskChrome(payload);
}

async function handleAskChrome(payload) {
  const aiSettings = await loadChromeAiSettings();

  if (isSubscriptionProvider(aiSettings)) return subscriptionModeError();
  const provider = aiSettings.chromeAiProvider || 'google';
  const isLocal = provider === 'local';

  if (!isLocal && (!aiSettings.chromeAiApiKey || !aiSettings.chromeAiApiKey.trim())) {
    return {
      error: 'Add your AI API key in Settings to ask a question.',
      errorCode: 'no_api_key',
      answers: [],
    };
  }

  const controller = new AbortController();
  standaloneControllers.add(controller);
  try {
    const question = (payload.questions && payload.questions[0]) || '';
    const scope = payload.scope || 'within';
    const answer = await askFollowUpStandalone(
      payload,
      question,
      payload.priorQa || [],
      aiSettings,
      scope,
      controller.signal
    );
    return {
      answers: [{ question, answer, scope }],
      execution: {
        jobId: crypto.randomUUID(),
        origin: 'chrome',
        configurationRevision: Date.now().toString(),
        authMethod: 'apiKey',
        provider: aiSettings.chromeAiProvider,
        model: aiSettings.chromeAiModel,
      },
      mode: 'chrome',
    };
  } catch (err) {
    return {
      error: err.message || 'Failed to answer question',
      errorCode: err.code || 'unknown',
      answers: [],
    };
  } finally {
    standaloneControllers.delete(controller);
  }
}

async function checkConfigStatus() {
  if ((await getConnectionMode()) !== 'obsidian') return { status: 'ok', issues: [], mode: 'chrome' };
  const controller = new AbortController();
  let timeout;
  try {
    const serverUrl = await getServerUrl();
    await syncAiConfig(serverUrl);
    // Session setup has its own deadline. Start the configuration deadline
    // after it, and fetch account/CLI status separately through get-credit.
    timeout = setTimeout(() => controller.abort(), 3000);
    const response = await serverFetch(`${serverUrl}/config-status`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Obsidian configuration check failed (${response.status}).`);
    const data = await response.json();
    if (NutEggExecution.state?.mode === 'apiKey') {
      const settings = await loadChromeAiSettings();
      const configured = NutEggAI.isAIConfigured(settings);
      data.aiConfigured = configured;
      data.issues = (data.issues || []).filter(issue => !issue.startsWith('AI is not configured'));
      data.status = configured ? (data.issues.length ? 'warning' : 'ok') : 'error';
      if (!configured) {
        data.issues.unshift('Set up an AI API key in Chrome Settings.');
      }
    }
    if (data.port && data.port !== serverPort) {
      serverPort = data.port;
      chrome.storage.local.set({ serverPort: data.port });
    }
    return { ...data, state: NutEggExecution.state };
  } catch (error) {
    const isTimeout = controller.signal.aborted || error.name === 'TimeoutError';
    return {
      status: 'error',
      unavailable: true,
      issues: [
        isTimeout
          ? 'Obsidian configuration check timed out. Retry the connection check.'
          : error.message || 'Cannot read Obsidian configuration',
      ],
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchCredit() {
  const settings = await loadChromeAiSettings();
  if ((await getConnectionMode()) !== 'obsidian') return checkCreditAI(settings);
  try {
    const state = await NutEggExecution.latest();
    if (state.mode === 'apiKey') return checkCreditAI(settings);
    const serverUrl = await getServerUrl();
    const response = await serverFetch(`${serverUrl}/credit`, { signal: AbortSignal.timeout(20000) });
    return response.json();
  } catch (error) {
    return { hasBalance: false, statusText: error.message, error: error.message };
  }
}

function getReadingTimeMinutes(metadata, content) {
  const fromMeta = parseInt(metadata?.time_estimate_minutes || '0', 10);
  if (fromMeta > 0) return fromMeta;
  const words = typeof content === 'string' ? content.split(/\s+/).length || 0 : 0;
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
  const stored = await withChromeCacheLock(() => chrome.storage.local.get(['chromeMetrics', 'chromeTabCache']));
  if (stored.chromeMetrics && typeof stored.chromeMetrics.nuts === 'number') {
    const m = stored.chromeMetrics;
    const totalMinutes = Math.round(m.timeSavedMinutes || 0);
    if (!m.eggCounterVersion && Array.isArray(stored.chromeTabCache) && stored.chromeTabCache.length > 0) {
      let eggs = 0;
      for (const entry of stored.chromeTabCache) {
        if (isKnowledgeSelectedAndGenerated(entry.capturePayload, entry.result)) {
          eggs++;
        }
      }
      m.eggs = eggs;
      m.eggCounterVersion = 1;
      await chrome.storage.local.set({ chromeMetrics: m });
    }
    return {
      nuts: m.nuts || 0,
      eggs: m.eggs || 0,
      timeSavedMinutes: totalMinutes,
      timeSaved: formatTimeSaved(totalMinutes),
    };
  }
  const cache = Array.isArray(stored.chromeTabCache) ? stored.chromeTabCache : [];
  let timeSavedMinutes = 0;
  let eggs = 0;
  for (const entry of cache) {
    timeSavedMinutes += getReadingTimeMinutes(
      entry.capturePayload?.metadata,
      entry.content || entry.capturePayload?.content
    );
    if (isKnowledgeSelectedAndGenerated(entry.capturePayload, entry.result)) {
      eggs++;
    }
  }
  const initial = {
    nuts: cache.length,
    eggs,
    timeSavedMinutes: Math.round(timeSavedMinutes),
    eggCounterVersion: 1,
  };
  await chrome.storage.local.set({ chromeMetrics: initial });
  return {
    ...initial,
    timeSaved: formatTimeSaved(initial.timeSavedMinutes),
  };
}

async function recordChromeAnalysisMetrics(payload, result) {
  try {
    await queueChromeMetrics(async () => {
      const current = await readChromeMetrics();
      const minutes = getReadingTimeMinutes(payload?.metadata, payload?.content);
      const generatedKnowledge = isKnowledgeSelectedAndGenerated(payload, result);
      const updated = {
        nuts: (current.nuts || 0) + 1,
        eggs: (current.eggs || 0) + (generatedKnowledge ? 1 : 0),
        timeSavedMinutes: (current.timeSavedMinutes || 0) + minutes,
        eggCounterVersion: 1,
      };
      await chrome.storage.local.set({
        chromeMetrics: updated,
      });
    });
  } catch (err) {
    console.warn('[NutEgg] Failed to record Chrome metrics:', err);
  }
}

async function recordChromeEggMetric() {
  try {
    await queueChromeMetrics(async () => {
      const current = await readChromeMetrics();
      const updated = {
        ...current,
        eggs: (current.eggs || 0) + 1,
        eggCounterVersion: 1,
      };
      await chrome.storage.local.set({
        chromeMetrics: updated,
      });
    });
  } catch (err) {
    console.warn('[NutEgg] Failed to record Chrome egg metric:', err);
  }
}

let metricsFetchTask = null;
function fetchMetrics() {
  if (metricsFetchTask) return metricsFetchTask;
  const task = refreshCombinedMetrics().finally(() => {
    if (metricsFetchTask === task) metricsFetchTask = null;
  });
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
    const validMetrics = [snapshot.nuts, snapshot.eggs, snapshot.timeSavedMinutes].every(
      value => Number.isFinite(value) && value >= 0
    );
    if (!validMetrics) throw new Error('Invalid metrics');
    await chrome.storage.local.set({
      obsidianMetricsSnapshot: {
        nuts: snapshot.nuts,
        eggs: snapshot.eggs,
        timeSavedMinutes: Math.round(snapshot.timeSavedMinutes),
      },
    });
  } catch {
    /* Keep the last known vault snapshot while offline. */
  } finally {
    clearTimeout(timeout);
  }
  const local = await getChromeMetrics();
  const { obsidianMetricsSnapshot: vault = {} } = await chrome.storage.local.get(['obsidianMetricsSnapshot']);
  const number = value => (Number.isFinite(value) && value >= 0 ? value : 0);
  const total = {
    nuts: local.nuts + number(vault.nuts),
    eggs: number(local.eggs),
    timeSavedMinutes: local.timeSavedMinutes + number(vault.timeSavedMinutes),
  };
  const metrics = { ...total, timeSaved: formatTimeSaved(total.timeSavedMinutes) };
  await chrome.storage.local.set({ cachedMetrics: metrics });
  return metrics;
}

async function checkServer() {
  if ((await getConnectionMode()) !== 'obsidian') return { online: false, mode: 'chrome' };
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
      try {
        await syncAiConfig(await getServerUrl());
      } catch (error) {
        return { online: true, error: error.message, errorCode: 'ai_config_sync_failed' };
      }
    }
    return { online: response.ok, port: data.port, version: data.version, state: NutEggExecution.state };
  } catch {
    clearTimeout(timeout);
    // A live authenticated WebSocket is evidence of a connected vault. A delayed
    // HTTP health probe must not turn that into a request to pair the vault again.
    if (NutEggExecution.session) {
      return { online: true, degraded: true, state: NutEggExecution.state };
    }
    return { online: false };
  }
}

console.log('[NutEgg] Background service worker started');
