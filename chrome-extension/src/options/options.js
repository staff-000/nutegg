// NutEgg Options Page

const {
  PROVIDER_CATALOG = {},
  checkCreditAI,
  isSubscriptionProvider = () => false,
} = window.NutEggAI || {};

const t = (key, params) => (window.NutEggI18n ? window.NutEggI18n.t(key, params) : key);

const DEFAULT_PORT = 27123;

// Server connection elements
const portInput = document.getElementById("port-input");
const portDisplay = document.getElementById("port-display");
const modeSelect = document.getElementById("mode-select");
const fastDesc = document.getElementById("fast-desc");
const confirmDesc = document.getElementById("confirm-desc");
const saveBtn = document.getElementById("save-btn");
const testBtn = document.getElementById("test-btn");
const testResult = document.getElementById("test-result");
const shortcutsLink = document.getElementById("shortcuts-link");

// AI configuration elements
const aiConfigSection = document.getElementById("ai-config-section");
const aiStatusBanner = document.getElementById("ai-status-banner");
const obsidianModeEnabled = document.getElementById("obsidian-mode-enabled");
const obsidianConfig = document.getElementById("obsidian-config");
const obsidianActiveCard = document.getElementById("obsidian-active-card");
const connectionModeBadge = document.getElementById("connection-mode-badge");
const connectionModeStatus = document.getElementById("connection-mode-status");
const chromeAdvancedSettings = document.getElementById("chrome-advanced-settings");
const aiAdvancedStatus = document.getElementById("ai-advanced-status");
const aiProviderSelect = document.getElementById("ai-provider-select");
const aiModelSelect = document.getElementById("ai-model-select");
const aiModelCustom = document.getElementById("ai-model-custom");
const aiLocalEndpointRow = document.getElementById("ai-local-endpoint-row");
const aiLocalEndpoint = document.getElementById("ai-local-endpoint");
const aiKeyInput = document.getElementById("ai-key-input");
const aiKeyToggle = document.getElementById("ai-key-toggle");
const chunkWindowInput = document.getElementById("chunk-window-chars");
const maxTokensInput = document.getElementById("max-completion-tokens");
const aiKeyHint = document.getElementById("ai-key-hint");
const outputLangSelect = document.getElementById("output-lang-select");
const aiSaveBtn = document.getElementById("ai-save-btn");
const aiTestBtn = document.getElementById("ai-test-btn");
const aiTestResult = document.getElementById("ai-test-result");
const aiPromptSelect = document.getElementById("ai-prompt-select");
const aiPromptTextarea = document.getElementById("ai-prompt-textarea");
const aiPromptResetBtn = document.getElementById("ai-prompt-reset-btn");

// Content Analysis sections elements
const sectionVerdictSummary = document.getElementById("section-verdict-summary");
const sectionMindmap = document.getElementById("section-mindmap");
const sectionKnowledge = document.getElementById("section-knowledge");
const sectionDiscussion = document.getElementById("section-discussion");
const sectionsSaveBtn = document.getElementById("sections-save-btn");
const sectionsStatus = document.getElementById("sections-status");
const uiDensitySelect = document.getElementById("ui-density-select");
const debugInfoEnabled = document.getElementById('debug-info-enabled');

const DEFAULT_SECTIONS = {
  titleVerdict: true,
  coreSummary: true,
  mindMap: true,
  discussion: false,
};

let savedPromptOverrides = {};
const aiAuthMethod = document.getElementById('ai-auth-method');
let aiProfiles = {};
let profileKey = '';
let subscriptionModels = {};
const subscriptionModelRefresh = {};
let subscriptionEnabled = false;
let subscriptionAccessKnown = false;
let subscriptionFeatureRequest = 0;
let activeSubscriptionModel = 'auto';
let healthProbe;
function probeHealth(port) {
  if (healthProbe?.port === port) return healthProbe.task;
  // Share parsed data, not a Response whose body can only be consumed once.
  const task = fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(2000) })
    .then(async response => ({ ok: response.ok, health: response.ok ? await response.json() : {} }))
    .finally(() => { if (healthProbe?.task === task) healthProbe = null; });
  healthProbe = { port, task }; return task;
}
let subscriptionRequest = 0;
let subscriptionTimer;
const subscriptionSelected = () => aiAuthMethod.value === 'subscription';
function rememberProfile() {
  if (!profileKey) return;
  aiProfiles[profileKey] = { model: aiModelSelect.value === '__custom__' ? aiModelCustom.value.trim() : aiModelSelect.value,
    apiKey: subscriptionSelected() ? '' : aiKeyInput.value, endpoint: aiLocalEndpoint.value };
}
function restoreProfile() {
  profileKey = `${aiProviderSelect.value}:${aiAuthMethod.value}`;
  const profile = aiProfiles[profileKey] || {};
  aiKeyInput.value = subscriptionSelected() ? '' : profile.apiKey || '';
  aiLocalEndpoint.value = profile.endpoint || '';
  updateModelOptions(aiProviderSelect.value, profile.model);
  updateProviderHints(aiProviderSelect.value);
  void refreshSubscription();
}
let lastKnownSubscriptionProvider = 'gemini';
let lastApiKeyProvider = null;
let lastSubscriptionState = null;
function syncSubscriptionToggle() {
  const toggle = document.getElementById('use-subscription-toggle');
  if (!toggle) return;
  toggle.checked = aiAuthMethod.value === 'subscription';
  toggle.disabled = !subscriptionEnabled;
}
function renderSubscriptionAccess() {
  if (subscriptionAccessKnown && !subscriptionEnabled && subscriptionSelected() && profileKey) {
    rememberProfile(); aiAuthMethod.value = 'apiKey'; restoreProfile();
  }
  const isSub = subscriptionSelected() && subscriptionEnabled;
  if (isSub) {
    if (aiTestResult) {
      aiTestResult.textContent = "";
      aiTestResult.className = "test-result hidden";
    }
    if (aiAdvancedStatus) {
      aiAdvancedStatus.textContent = "";
      aiAdvancedStatus.className = "test-result hidden";
    }
  }
  document.getElementById('ai-auth-row').hidden = !obsidianModeEnabled.checked || !subscriptionEnabled;
  const option = aiAuthMethod.querySelector('option[value="subscription"]');
  option.hidden = !subscriptionEnabled;
  option.disabled = !subscriptionEnabled;
  syncSubscriptionToggle();
  document.getElementById('subscription-card').hidden = !subscriptionEnabled || !subscriptionSelected();
  document.getElementById('ai-model-row').hidden = isSub;
  document.getElementById('ai-key-row').hidden = isSub;
  if (isSub) aiLocalEndpointRow.style.display = 'none';
  aiSaveBtn.hidden = subscriptionSelected();
  aiSaveBtn.classList.toggle('hidden', subscriptionSelected());
  aiTestBtn.hidden = subscriptionSelected();
  aiProviderSelect.disabled = isSub;
  const badge = document.getElementById('subscription-model-badge');
  if (badge && activeSubscriptionModel) badge.textContent = activeSubscriptionModel;
}
function subscriptionStatusText(info) {
  return t(info?.state === 'ready' ? 'aiConnectionReady' : info?.state === 'error' || info?.error ? 'aiConnectionUnavailable' : 'aiConnectionSetupNeeded');
}
async function refreshSubscriptionAccess() {
  const request = ++subscriptionFeatureRequest;
  if (!obsidianModeEnabled.checked) { subscriptionEnabled = false; subscriptionAccessKnown = true; renderSubscriptionAccess(); return; }
  try {
    const response = await probeHealth(Number(portInput.value) || DEFAULT_PORT);
    const health = response.health;
    if (request !== subscriptionFeatureRequest) return;
    const previous = subscriptionEnabled;
    subscriptionEnabled = health.subscriptionEnabled === true;
    subscriptionAccessKnown = true;
    renderSubscriptionAccess();
    if (previous !== subscriptionEnabled) void refreshSubscription();
  } catch { if (request === subscriptionFeatureRequest) { subscriptionEnabled = false; subscriptionAccessKnown = true; renderSubscriptionAccess(); } }
}
async function subscriptionControl(operation, extra = {}) {
  let provider = aiProviderSelect.value;
  if (!(window.NutEggAI?.supportsSubscription?.(provider))) {
    provider = lastKnownSubscriptionProvider || 'gemini';
  }
  return chrome.runtime.sendMessage({ action: 'subscription-control', operation, provider,
    model: activeSubscriptionModel || 'auto', ...extra });
}
async function refreshSubscription() {
  clearTimeout(subscriptionTimer);
  const request = ++subscriptionRequest;
  renderSubscriptionAccess();
  if (!subscriptionSelected() || !subscriptionEnabled || document.hidden) return;
  const provider = aiProviderSelect.value;
  try {
    const status = await subscriptionControl('status');
    if (request !== subscriptionRequest || provider !== aiProviderSelect.value || !subscriptionEnabled || !subscriptionSelected()) return;
    lastSubscriptionState = status?.state || 'error';
    const card = document.getElementById('subscription-card');
    const previousState = card.dataset.state;
    card.dataset.state = lastSubscriptionState;
    document.getElementById('subscription-status').textContent = subscriptionStatusText(status);
    if (status?.model) activeSubscriptionModel = status.model;
    const badge = document.getElementById('subscription-model-badge');
    if (badge) badge.textContent = activeSubscriptionModel || 'auto';
    if (['ready', 'unverified', 'login_required'].includes(status?.state) &&
        (previousState !== status.state || Date.now() - (subscriptionModelRefresh[provider] || 0) >= 60000)) {
      const result = await subscriptionControl('models');
      if (request !== subscriptionRequest || !subscriptionEnabled) return;
      if (result.models) {
        subscriptionModelRefresh[provider] = Date.now();
        const model = activeSubscriptionModel || getAiFormSettings().chromeAiModel;
        subscriptionModels[provider] = result.models;
        await chrome.storage.local.set({ subscriptionModels });
        updateModelOptions(provider, model);
        if (badge) badge.textContent = activeSubscriptionModel || model || 'auto';
      }
    }
    if (previousState !== lastSubscriptionState && obsidianModeEnabled.checked) {
      void checkObsidianForAiBanner(Number(portInput.value) || DEFAULT_PORT);
    }
  } catch {
    if (request === subscriptionRequest) {
      document.getElementById('subscription-card').dataset.state = 'error';
      document.getElementById('subscription-status').textContent = t('aiConnectionUnavailable');
    }
  } finally {
    // Refresh after the previous request finishes: CLI status checks may take
    // longer than a fixed polling interval. Never discard every slow result.
    if (request === subscriptionRequest && subscriptionEnabled && subscriptionSelected() && !document.hidden) {
      subscriptionTimer = setTimeout(() => { void refreshSubscription(); }, 5000);
    }
  }
}
async function connectChrome() {
  document.getElementById('ai-status-banner').textContent = t('checking');
  const result = await chrome.runtime.sendMessage({ action: 'connect-obsidian' });
  if (result?.error) showAiResult(result.error, 'error');
  else {
    await refreshSubscriptionAccess();
    await checkObsidianForAiBanner(Number(portInput.value) || DEFAULT_PORT);
  }
  await refreshSubscription();
}

let obsidianConfigRequest = 0;
let obsidianConfigTimer = null;
let activePromptKey = "contentAnalysis";

function updateModeDesc(mode) {
  if (mode === "preview" || mode === "confirm") {
    confirmDesc?.classList.add("active-desc");
    fastDesc?.classList.remove("active-desc");
  } else {
    fastDesc?.classList.add("active-desc");
    confirmDesc?.classList.remove("active-desc");
  }
}

// Load saved settings
document.addEventListener("DOMContentLoaded", async () => {
  let stored = await chrome.storage.local.get([
    "serverPort",
    "analysisMode",
    "enabledSections",
    "generateKnowledgeEntries",
    "uiDensity",
    "connectionMode",
    "chromeAiEnabled",
    "chromeAiProvider",
    "chromeAiAuthMethod",
    "aiProfiles",
    "subscriptionModels",
    "chromeAiApiKey",
    "chromeAiModel",
    "chromeAiLocalEndpoint",
    "chromeAiEndpoint",
    "outputLanguage",
    "chromeAiPromptOverrides",
    "chunkWindowChars",
    "contentAnalysisMaxTokens",
    "chromeAiMaxTokens",
    "debugInfo",
    "captureRetryCount",
    "captureRetryDelayMs",
    "chromeCacheTabLimit",
    "chromeTabCache",
  ]);
  const migrated = (window.NutEggAI?.migrateAISettings || (value => value))(stored);
  if (JSON.stringify(migrated) !== JSON.stringify(stored)) await chrome.storage.local.set(migrated);
  stored = migrated;
  const captureSettings = new window.SettingsState();
  captureSettings.setCaptureRetries(stored);
  const retryCount = document.getElementById('capture-retry-count');
  const retryDelay = document.getElementById('capture-retry-delay');
  retryCount.value = captureSettings.captureRetryCount;
  retryDelay.value = captureSettings.captureRetryDelayMs / 1000;
  document.getElementById('capture-retry-save').addEventListener('click', async () => {
    if (!retryCount.reportValidity() || !retryDelay.reportValidity()) return;
    captureSettings.setCaptureRetries({ captureRetryCount: Number(retryCount.value), captureRetryDelayMs: Number(retryDelay.value) * 1000 });
    await chrome.storage.local.set({ captureRetryCount: captureSettings.captureRetryCount, captureRetryDelayMs: captureSettings.captureRetryDelayMs });
    const status = document.getElementById('capture-retry-status');
    status.textContent = t('captureRetrySaved');
    status.className = 'test-result ok';
    setTimeout(() => {
      status.classList.add('hidden');
    }, 2500);
  });
  savedPromptOverrides = stored.chromeAiPromptOverrides || {};
  if (debugInfoEnabled) {
    debugInfoEnabled.checked = stored.debugInfo === true;
    debugInfoEnabled.addEventListener('change', () => chrome.storage.local.set({ debugInfo: debugInfoEnabled.checked }));
  }

  // Initialize i18n following browser language
  window.NutEggI18n?.initI18n();
  window.NutEggI18n?.applyI18n();

  // 1. Server settings
  const port = stored.serverPort || DEFAULT_PORT;
  portInput.value = port;
  portDisplay.textContent = port;

  const rawMode = stored.analysisMode || "preview";
  const mode = rawMode === "confirm" ? "preview" : rawMode === "fast" ? "full" : rawMode;
  if (modeSelect) {
    modeSelect.value = mode;
    updateModeDesc(mode);
    modeSelect.addEventListener("change", async () => {
      updateModeDesc(modeSelect.value);
      await chrome.storage.local.set({ analysisMode: modeSelect.value });
      showResult(t("workflowModeUpdated"), "ok");
      setTimeout(() => { testResult.classList.add("hidden"); }, 2000);
    });
  }

  portInput.addEventListener("input", () => {
    portDisplay.textContent = portInput.value || DEFAULT_PORT;
  });

  saveBtn.addEventListener("click", handleSave);
  testBtn.addEventListener("click", handleTest);
  shortcutsLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });

  // 2. Content Analysis Sections initialization
  initSectionsSettings(stored.enabledSections, stored.generateKnowledgeEntries);

  if (uiDensitySelect) {
    const savedDensity = stored.uiDensity || "compact";
    uiDensitySelect.value = savedDensity === "comfortable" ? "margin" : savedDensity;
    uiDensitySelect.addEventListener("change", async () => {
      await chrome.storage.local.set({ uiDensity: uiDensitySelect.value });
      const status = document.getElementById("ui-density-status");
      if (status) {
        status.textContent = t("saved");
        status.className = "test-result ok";
        status.classList.remove("hidden");
        setTimeout(() => { status.classList.add("hidden"); }, 1500);
      }
    });
  }

  // 3. AI Settings initialization
  initAiSettings(stored);
  initChromeCacheSettings(stored);

  // Chrome is ready to configure without probing for another application.
  initConnectionMode(stored);
  renderSubscriptionAccess();
  if (obsidianModeEnabled.checked) await refreshSubscriptionAccess();
  for (const element of [aiProviderSelect, aiModelSelect, aiModelCustom, aiKeyInput, aiLocalEndpoint, chunkWindowInput, maxTokensInput]) {
    element.addEventListener("input", scheduleObsidianAiConfigCheck);
    element.addEventListener("change", scheduleObsidianAiConfigCheck);
  }
  setInterval(() => { if (obsidianModeEnabled.checked) { void refreshSubscriptionAccess(); void refreshObsidianAiConfig(); } }, 5000);

  // 4. Report bug button
  const reportBugBtn = document.getElementById("report-bug-btn");
  if (reportBugBtn) {
    reportBugBtn.addEventListener("click", () => {
      const manifest = chrome.runtime?.getManifest?.() || {};
      const version = manifest.version || "0.0.0";
      const body = [
        "### URL of the content",
        "[Enter the URL of the article, video, or webpage here]",
        "",
        "### Expected behavior",
        "<!-- A clear description of what you expected to happen -->",
        "",
        "",
        "### Observed behavior",
        "<!-- Describe what actually happened (e.g. error message, unexpected output, stuck on retrieving/analyzing) -->",
        "",
        "",
        "### Environment",
        `- NutEgg Extension Version: v${version}`,
        `- Browser: ${navigator.userAgent || "Chrome"}`,
      ].join("\n");

      const issueUrl = `https://github.com/staff-000/nutegg/issues/new?title=${encodeURIComponent("[Bug]: ")}&body=${encodeURIComponent(body)}`;
      window.open(issueUrl, "_blank");
    });
  }
});

function renderConnectionMode(mode) {
  const usesObsidian = mode === "obsidian";
  obsidianModeEnabled.checked = usesObsidian;
  obsidianModeEnabled.setAttribute("aria-expanded", String(usesObsidian));
  obsidianConfig.classList.toggle("hidden", !usesObsidian);
  obsidianActiveCard.classList.toggle("hidden", !usesObsidian);
  aiConfigSection.classList.remove("hidden");
  chromeAdvancedSettings.classList.remove("hidden");
  document.getElementById("chrome-cache-group").classList.toggle("hidden", usesObsidian);
  rememberProfile();
  aiAuthMethod.value = usesObsidian ? aiAuthMethod.value : 'apiKey';
  renderSubscriptionAccess();
  if (profileKey) restoreProfile();
  connectionModeBadge.textContent = t(usesObsidian ? "settingsObsidianMode" : "settingsChromeMode");
  connectionModeBadge.classList.toggle("obsidian", usesObsidian);
  const obsidianSettings = document.getElementById("obsidian-settings");
  if (obsidianSettings) obsidianSettings.open = usesObsidian;
}

async function setConnectionMode(mode) {
  await chrome.storage.local.set({ connectionMode: mode, chromeAiEnabled: true });
  renderConnectionMode(mode);
  void refreshSubscriptionAccess();
  connectionModeStatus.textContent = t(mode === "obsidian" ? "settingsObsidianSelected" : "settingsChromeSelected");
  connectionModeStatus.className = "test-result ok";
  if (mode === "obsidian") checkObsidianForAiBanner(Number(portInput.value) || DEFAULT_PORT);
}

function initConnectionMode(stored) {
  const urlParams = new URLSearchParams(window.location.search);
  const forceChrome = ["1", "true"].includes(urlParams.get("enableAi"));
  renderConnectionMode(forceChrome ? "chrome" : stored.connectionMode);
  if (forceChrome) chrome.storage.local.set({ connectionMode: "chrome", chromeAiEnabled: true });
  obsidianModeEnabled.addEventListener("change", () => setConnectionMode(obsidianModeEnabled.checked ? "obsidian" : "chrome"));
  const obsidianSummary = document.querySelector("#obsidian-settings > summary");
  if (obsidianSummary) {
    obsidianSummary.addEventListener("click", (e) => {
      if (e.target !== obsidianModeEnabled) {
        e.preventDefault();
        obsidianModeEnabled.checked = !obsidianModeEnabled.checked;
        obsidianModeEnabled.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }
  document.getElementById("use-chrome-btn").addEventListener("click", async () => {
    await setConnectionMode("chrome");
    aiProviderSelect.focus();
  });
  if (obsidianModeEnabled.checked) checkObsidianForAiBanner(Number(portInput.value) || DEFAULT_PORT);
  else void chrome.runtime.sendMessage({ action: "sync-ai-config" }).catch(() => {});
}

function scheduleObsidianAiConfigCheck() {
  clearTimeout(obsidianConfigTimer);
  obsidianConfigRequest++;
  obsidianConfigTimer = setTimeout(() => { void refreshObsidianAiConfig(); }, 200);
}

async function refreshObsidianAiConfig() {
  if (typeof document === 'undefined' || !document || !obsidianModeEnabled?.checked) return;
  const request = ++obsidianConfigRequest;
  const row = document?.getElementById?.("obsidian-ai-config");
  try {
    const result = await chrome.runtime.sendMessage({ action: "get-obsidian-ai-config", settings: getAiFormSettings() });
    if (request !== obsidianConfigRequest || typeof document === 'undefined' || !document || !obsidianModeEnabled?.checked) return;
    if (result?.error || !result?.aiConfig) throw new Error(result?.error || "Unavailable");
    const config = result.aiConfig;
    if (config.aiAuthMethod === 'subscription') {
      activeSubscriptionModel = config.aiModel || 'auto';
      const badge = document?.getElementById?.('subscription-model-badge');
      if (badge) badge.textContent = activeSubscriptionModel;
      if (config.aiProvider) {
        lastKnownSubscriptionProvider = config.aiProvider;
      }
      if (subscriptionSelected()) {
        if (config.aiProvider && aiProviderSelect.value !== config.aiProvider) {
          aiProviderSelect.value = config.aiProvider;
        }
        await chrome.storage.local.set({
          chromeAiAuthMethod: 'subscription',
          chromeAiProvider: config.aiProvider || aiProviderSelect.value,
          chromeAiModel: activeSubscriptionModel,
        });
      }
    }
    const values = document?.getElementById?.("obsidian-ai-config-text");
    if (!values) return;
    values.replaceChildren();
    for (const [label, value] of [
      ["settingsProviderLabel", PROVIDER_CATALOG[config.aiProvider]?.label || config.aiProvider],
      ["subscriptionConnection", t(config.aiAuthMethod === "subscription" ? subscriptionEnabled ? "subscriptionLabel" : "aiConnectionUnavailable" : "settingsKeyLabel")],
      ["settingsModelLabel", config.aiModel],
      ["chunkWindowChars", config.chunkWindowChars],
      ["maxTokens", config.contentAnalysisMaxTokens],
    ]) {
      const chip = document.createElement("span");
      chip.className = "config-chip";
      chip.textContent = `${t(label)}: ${value}`;
      values.append(chip);
    }
    const matchStatus = document?.getElementById?.("obsidian-ai-match-status");
    if (subscriptionSelected() && subscriptionEnabled && lastSubscriptionState !== 'ready') {
      if (matchStatus) matchStatus.textContent = t("aiConnectionSetupNeeded");
      if (row) row.className = "connection-status obsidian-ai-config mismatched";
    } else {
      if (matchStatus) matchStatus.textContent = t(result.matches ? "settingsObsidianAiMatch" : "settingsObsidianAiMismatch");
      if (row) row.className = `connection-status obsidian-ai-config ${result.matches ? "matched" : "mismatched"}`;
    }
  } catch {
    if (request === obsidianConfigRequest && row) row.className = "connection-status obsidian-ai-config hidden";
  }
}

async function checkObsidianForAiBanner(port) {
  if (!aiStatusBanner || !obsidianModeEnabled.checked) return;
  aiStatusBanner.textContent = t("settingsObsidianChecking");
  aiStatusBanner.className = "connection-status";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await probeHealth(port);
    if (!obsidianModeEnabled.checked) return;
    if (subscriptionSelected() && subscriptionEnabled && lastSubscriptionState !== 'ready') {
      aiStatusBanner.textContent = t("aiConnectionSetupNeeded");
      aiStatusBanner.className = "connection-status error";
    } else {
      aiStatusBanner.textContent = t(response.ok ? "settingsObsidianConnected" : "settingsObsidianWaiting");
      aiStatusBanner.classList.toggle("connected", response.ok);
    }
    if (response.ok) {
      const result = await chrome.runtime.sendMessage({ action: "sync-ai-config" });
      if (result?.error && obsidianModeEnabled.checked) aiStatusBanner.textContent = t("aiError", { error: result.error });
      await refreshObsidianAiConfig();
    }
  } catch {
    if (obsidianModeEnabled.checked) aiStatusBanner.textContent = t("settingsObsidianWaiting");
  } finally {
    clearTimeout(timeout);
  }
}

function initAiSettings(stored) {
  if (!aiProviderSelect || typeof PROVIDER_CATALOG === "undefined") return;

  // Populate providers
  aiProviderSelect.innerHTML = "";
  for (const [id, info] of Object.entries(PROVIDER_CATALOG)) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = info.label;
    aiProviderSelect.appendChild(opt);
  }

  chunkWindowInput.value = stored.chunkWindowChars || 30000;
  maxTokensInput.value = stored.contentAnalysisMaxTokens || stored.chromeAiMaxTokens || 16384;
  aiProfiles = stored.aiProfiles || {};
  subscriptionModels = stored.subscriptionModels || {};
  activeSubscriptionModel = stored.chromeAiModel || 'auto';
  const subModelBadge = document.getElementById('subscription-model-badge');
  if (subModelBadge) subModelBadge.textContent = activeSubscriptionModel;
  aiAuthMethod.value = new URLSearchParams(window.location.search).has('setupApi') ? 'apiKey' : stored.chromeAiAuthMethod || 'apiKey';
  const selectedProvider = stored.chromeAiProvider || "gemini";
  aiProviderSelect.value = selectedProvider;
  if ((window.NutEggAI?.supportsSubscription || (() => false))(selectedProvider)) {
    lastKnownSubscriptionProvider = selectedProvider;
  }
  if (stored.chromeAiAuthMethod !== 'subscription') {
    lastApiKeyProvider = selectedProvider;
  }

  updateModelOptions(selectedProvider, stored.chromeAiModel);

  if (stored.chromeAiApiKey) {
    aiKeyInput.value = stored.chromeAiApiKey;
  }

  aiLocalEndpoint.value = stored.chromeAiEndpoint || stored.chromeAiLocalEndpoint || "";

  if (outputLangSelect) {
    outputLangSelect.value = stored.outputLanguage || "same-as-content";
    outputLangSelect.addEventListener("change", async () => {
      await chrome.storage.local.set({
        outputLanguage: outputLangSelect.value,
      });
    });
  }

  profileKey = `${selectedProvider}:${aiAuthMethod.value}`;
  rememberProfile();
  aiProviderSelect.addEventListener('change', () => {
    rememberProfile();
    if (aiAuthMethod.value === 'apiKey') {
      lastApiKeyProvider = aiProviderSelect.value;
    }
    if ((window.NutEggAI?.supportsSubscription || (() => false))(aiProviderSelect.value)) {
      lastKnownSubscriptionProvider = aiProviderSelect.value;
    }
    renderSubscriptionAccess();
    restoreProfile();
  });
  aiAuthMethod.addEventListener('change', async () => {
    const supportsSub = (window.NutEggAI?.supportsSubscription || (() => false));
    if (aiAuthMethod.value === 'subscription') {
      if (!supportsSub(aiProviderSelect.value)) {
        if (!lastApiKeyProvider) lastApiKeyProvider = aiProviderSelect.value;
        aiProviderSelect.value = lastKnownSubscriptionProvider || 'gemini';
      }
    } else if (aiAuthMethod.value === 'apiKey') {
      if (lastApiKeyProvider) {
        aiProviderSelect.value = lastApiKeyProvider;
      }
    }
    // The old profile's credential belongs to its previous connection method.
    const priorMethod = profileKey.split(':')[1];
    aiProfiles[profileKey] = { model: getAiFormSettings().chromeAiModel, apiKey: priorMethod === 'apiKey' ? aiKeyInput.value : '', endpoint: aiLocalEndpoint.value };
    restoreProfile();
    await chrome.storage.local.set({
      chromeAiAuthMethod: aiAuthMethod.value,
      chromeAiProvider: aiProviderSelect.value,
      chromeAiModel: getAiFormSettings().chromeAiModel,
    });
    if (obsidianModeEnabled.checked) {
      await chrome.runtime.sendMessage({ action: "sync-ai-config" });
      await refreshObsidianAiConfig();
    }
  });
  const useSubscriptionToggle = document.getElementById('use-subscription-toggle');
  if (useSubscriptionToggle) {
    useSubscriptionToggle.checked = aiAuthMethod.value === 'subscription';
    useSubscriptionToggle.addEventListener('change', () => {
      const willBeSub = useSubscriptionToggle.checked;
      const supportsSub = (window.NutEggAI?.supportsSubscription || (() => false));
      if (willBeSub) {
        if (!supportsSub(aiProviderSelect.value)) {
          lastApiKeyProvider = aiProviderSelect.value;
          aiProviderSelect.value = lastKnownSubscriptionProvider || 'gemini';
        }
        aiAuthMethod.value = 'subscription';
      } else {
        if (lastApiKeyProvider) {
          aiProviderSelect.value = lastApiKeyProvider;
        }
        aiAuthMethod.value = 'apiKey';
      }
      aiAuthMethod.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  document.getElementById('obsidian-connect-btn')?.addEventListener('click', connectChrome);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(subscriptionTimer); else void refreshSubscription(); });
  aiModelSelect.addEventListener("change", () => {
    if (aiModelSelect.value === "__custom__") {
      aiModelCustom.style.display = "block";
      aiModelCustom.focus();
    } else {
      aiModelCustom.style.display = "none";
    }
  });

  aiKeyToggle.addEventListener("click", () => {
    if (aiKeyInput.type === "password") {
      aiKeyInput.type = "text";
      aiKeyToggle.textContent = t("hideKeyBtn");
      aiKeyToggle.setAttribute("aria-pressed", "true");
    } else {
      aiKeyInput.type = "password";
      aiKeyToggle.textContent = t("showKeyBtn");
      aiKeyToggle.setAttribute("aria-pressed", "false");
    }
  });

  aiConfigSection.addEventListener("submit", event => {
    event.preventDefault();
    handleAiSave();
  });
  document.getElementById("ai-advanced-save-btn").addEventListener("click", () => handleAiSave(true));
  aiTestBtn.addEventListener("click", handleAiTest);

  if (aiPromptSelect && aiPromptTextarea) {
    loadPromptIntoTextarea(activePromptKey);

    aiPromptSelect.addEventListener("change", () => {
      saveActivePromptToState();
      activePromptKey = aiPromptSelect.value;
      loadPromptIntoTextarea(activePromptKey);
    });

    aiPromptTextarea.addEventListener("input", () => {
      saveActivePromptToState();
    });

    if (aiPromptResetBtn) {
      aiPromptResetBtn.addEventListener("click", () => {
        delete savedPromptOverrides[activePromptKey];
        loadPromptIntoTextarea(activePromptKey);
        chrome.storage.local.set({ chromeAiPromptOverrides: savedPromptOverrides });
        showAiResult(t("resetPromptDefault", { key: activePromptKey }), "ok", true);

      });
    }
  }

  updateProviderHints(selectedProvider);
}

function loadPromptIntoTextarea(key) {
  if (!aiPromptTextarea) return;
  const custom = savedPromptOverrides[key];
  if (typeof custom === "string" && custom.trim().length > 0) {
    aiPromptTextarea.value = custom;
  } else {
    const defaultTpl = window.NutEggAI?.PROMPTS?.[key] || "";
    aiPromptTextarea.value = defaultTpl;
  }
}

function saveActivePromptToState() {
  if (!aiPromptTextarea) return;
  const currentVal = aiPromptTextarea.value;
  const defaultVal = window.NutEggAI?.PROMPTS?.[activePromptKey] || "";
  if (currentVal.trim() === defaultVal.trim() || currentVal.trim().length === 0) {
    delete savedPromptOverrides[activePromptKey];
  } else {
    savedPromptOverrides[activePromptKey] = currentVal;
  }
}

function updateModelOptions(providerId, savedModel) {
  const provider = PROVIDER_CATALOG[providerId];
  if (!provider) return;

  const models = subscriptionSelected() ? subscriptionModels[providerId] || (providerId === 'anthropic' ? ['auto', 'sonnet', 'opus', 'haiku'] : ['auto']) : provider.models || [];
  const defaultModel = subscriptionSelected() ? 'auto' : provider.defaultModel || models[0] || '';
  const activeModel = savedModel || defaultModel;

  aiModelSelect.innerHTML = "";

  for (const m of models) {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m === 'auto' ? t('subscriptionAuto') : m;
    aiModelSelect.appendChild(opt);
  }

  // Custom option
  const customOpt = document.createElement("option");
  customOpt.value = "__custom__";
  customOpt.textContent = t("customModelTag");
  aiModelSelect.appendChild(customOpt);

  if (models.includes(activeModel)) {
    aiModelSelect.value = activeModel;
    aiModelCustom.style.display = "none";
  } else if (activeModel && activeModel !== "__custom__") {
    aiModelSelect.value = "__custom__";
    aiModelCustom.style.display = "block";
    aiModelCustom.value = activeModel;
  } else {
    aiModelSelect.value = defaultModel || "__custom__";
    aiModelCustom.style.display = defaultModel ? "none" : "block";
  }

  aiKeyInput.required = !subscriptionSelected() && providerId !== "local";

  // Local endpoint visibility
  if (providerId === "local") {
    aiLocalEndpointRow.style.display = "block";
  } else {
    aiLocalEndpointRow.style.display = "none";
  }
}

function updateProviderHints(providerId) {
  const provider = PROVIDER_CATALOG[providerId];
  if (!provider) return;
  document.getElementById('ai-key-row').hidden = subscriptionSelected();
  aiKeyInput.required = !subscriptionSelected() && providerId !== 'local';
  renderSubscriptionAccess();
  document.getElementById('ai-setup-help').open = false;
  aiKeyHint.textContent = providerId === 'local' ? t('aiKeyHintLocal') : t('aiKeyHintProvider', { provider: provider.label });
  aiKeyInput.placeholder = provider.keyPlaceholder || t('settingsKeyLabel');

}

function getAiFormSettings() {
  const model = aiModelSelect.value === "__custom__" ? aiModelCustom.value.trim() : aiModelSelect.value;
  const endpoint = aiLocalEndpoint.value.trim();
  return {
    chromeAiProvider: aiProviderSelect.value,
    chromeAiAuthMethod: aiAuthMethod.value,
    chromeAiModel: model,
    chromeAiApiKey: subscriptionSelected() ? '' : aiKeyInput.value.trim(),
    chromeAiEndpoint: subscriptionSelected() ? '' : endpoint,
    chromeAiLocalEndpoint: subscriptionSelected() ? '' : endpoint,
    chunkWindowChars: Number(chunkWindowInput.value),
    contentAnalysisMaxTokens: Number(maxTokensInput.value),
  };
}

async function handleAiSave(advanced = false) {
  if (!chunkWindowInput.reportValidity() || !maxTokensInput.reportValidity()) return;
  const settings = getAiFormSettings();
  if (subscriptionSelected() && !subscriptionEnabled) { showAiResult(t('aiConnectionUnavailable'), 'error', advanced); return; }
  if (!subscriptionSelected() && settings.chromeAiProvider !== "local" && !settings.chromeAiApiKey) {
    showAiResult(t("settingsKeyRequired"), "error", advanced);
    aiKeyInput.focus();
    return;
  }
  if (!settings.chromeAiModel) {
    showAiResult(t("settingsModelRequired"), "error", advanced);
    if (aiModelSelect.value === "__custom__") {
      aiModelCustom.focus();
    } else {
      aiModelSelect.focus();
    }
    return;
  }
  saveActivePromptToState();
  rememberProfile();
  aiSaveBtn.disabled = true;
  try {
    await chrome.storage.local.set({
      ...settings,
      aiProfiles,
      connectionMode: new URLSearchParams(window.location.search).has("setupApi") && !subscriptionSelected() ? "chrome" : obsidianModeEnabled.checked ? "obsidian" : "chrome",
      chromeAiEnabled: true,
      chromeAiPromptOverrides: savedPromptOverrides,
    });

    if (new URLSearchParams(window.location.search).has("setupApi") && !subscriptionSelected()) obsidianModeEnabled.checked = false;
    renderConnectionMode(obsidianModeEnabled.checked ? "obsidian" : "chrome");
    const result = await chrome.runtime.sendMessage({ action: "sync-ai-config" });
    await refreshObsidianAiConfig();
    if (obsidianModeEnabled.checked && result?.error) throw new Error(result.error);
    const savedMessage = t("settingsSavedShort");
    showAiResult(`${savedMessage} ${t("testingAiConnection")}`, "ok", advanced);
    try {
      const info = subscriptionSelected() ? await subscriptionControl('status') : await checkCreditAI(settings);
      showAiResult(`${savedMessage} ${subscriptionSelected() ? subscriptionStatusText(info) : formatAiCreditResult(info)}`, info.error || info.state === 'error' ? "error" : "ok", advanced);
    } catch (error) {
      showAiResult(`${savedMessage} ${t("aiError", { error: error.message })}`, "error", advanced);
    }
  } catch (error) {
    showAiResult(t("aiError", { error: error.message }), "error", advanced);
  } finally {
    aiSaveBtn.disabled = false;
  }
}

async function handleAiTest() {
  if (subscriptionSelected()) return;
  const settings = getAiFormSettings();
  if (!subscriptionSelected() && settings.chromeAiProvider !== "local" && !settings.chromeAiApiKey) {
    showAiResult(t("settingsKeyRequired"), "error", true);
    aiKeyInput.focus();
    return;
  }
  aiTestBtn.disabled = true;
  showAiResult(t("testingAiConnection"), "", true);
  try {
    const info = await checkCreditAI(settings);
    showAiResult(formatAiCreditResult(info), info.error ? "error" : "ok", true);
  } catch (err) {
    showAiResult(t("aiError", { error: err.message }), "error", true);
  } finally {
    aiTestBtn.disabled = false;
  }
}

function formatAiCreditResult(info) {
  if (info.error) return t("aiConnectionFailed", { error: info.error, status: info.statusText });
  if (info.hasBalance) return t("aiConnectedBalance", { provider: info.providerLabel, balance: info.balanceFormatted });
  return t("aiConnectedStatus", { provider: info.providerLabel, status: info.statusText });
}

function showAiResult(msg, type, advanced = false) {
  const result = advanced ? aiAdvancedStatus : aiTestResult;
  result.textContent = msg;
  result.className = `test-result ${type}`;
}

// Server save & test
async function handleSave() {
  const port = parseInt(portInput.value, 10);
  if (!portInput.reportValidity() || !Number.isInteger(Number(portInput.value)) || !port || port < 1 || port > 65535) {
    showResult(t("invalidPortNumber"), "error");
    return;
  }

  const mode = modeSelect ? modeSelect.value : "full";
  await chrome.storage.local.set({ serverPort: port, analysisMode: mode, generateKnowledgeEntries: sectionKnowledge.checked });
  // Notify background
  await chrome.runtime.sendMessage({ action: "set-port", port });
  showResult(t("serverPortSaved"), "ok");
  setTimeout(() => { testResult.classList.add("hidden"); }, 2000);
  checkObsidianForAiBanner(port);
}

async function handleTest() {
  const port = parseInt(portInput.value, 10);
  if (!portInput.reportValidity() || !Number.isInteger(Number(portInput.value)) || !port || port < 1 || port > 65535) {
    showResult(t("invalidPortNumber"), "error");
    return;
  }

  testResult.textContent = t("testingServer");
  testResult.className = "test-result";
  testResult.classList.remove("hidden");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const health = await response.json().catch(() => ({}));
      const extVersion = chrome.runtime?.getManifest?.()?.version;
      let versionWarn = "";
      if (health.version && extVersion && health.version !== extVersion) {
        versionWarn = t("versionMismatchShort", { pluginVersion: health.version, extVersion });
      }
      let creditInfo = "";
      try {
        const credit = await chrome.runtime.sendMessage({ action: "get-credit" });
        if (!credit.error) {
          if (credit.hasBalance && credit.balanceFormatted) {
            creditInfo = ` | 🪙 ${credit.providerLabel}: ${credit.balanceFormatted}`;
          } else if (credit.providerLabel) {
            const label = credit.source === "openrouter" ? "OpenRouter" : credit.providerLabel;
            creditInfo = ` | 🪙 ${label} (${credit.statusText})`;
          }
        }
      } catch {}
      showResult(`${t("connectedSuccessfully")}${versionWarn}${creditInfo}`, versionWarn ? "warning" : "ok");
      checkObsidianForAiBanner(port);
    } else {
      showResult(t("serverErrorResponse"), "error");
    }
  } catch {
    clearTimeout(timeout);
    showResult(t("cannotReachServer", { port }), "error");
    checkObsidianForAiBanner(port);
  }
}

function showResult(msg, type) {
  testResult.textContent = msg;
  testResult.className = `test-result ${type}`;
  testResult.classList.remove("hidden");
}

function initSectionsSettings(savedSections, savedGenerateKnowledgeEntries) {
  const sections = { ...DEFAULT_SECTIONS, ...(savedSections || {}) };
  if (sectionVerdictSummary) sectionVerdictSummary.checked = sections.titleVerdict !== false && sections.coreSummary !== false;
  if (sectionMindmap) sectionMindmap.checked = sections.mindMap !== false;
  if (sectionKnowledge) {
    sectionKnowledge.checked = savedGenerateKnowledgeEntries === true;
    sectionKnowledge.addEventListener("change", () => chrome.storage.local.set({ generateKnowledgeEntries: sectionKnowledge.checked }));
  }
  if (sectionDiscussion) sectionDiscussion.checked = sections.discussion === true;

  const contentCheckboxes = [
    sectionVerdictSummary,
    sectionMindmap,
    sectionDiscussion,
  ].filter(Boolean);

  function getActiveContentCount() {
    return contentCheckboxes.filter((cb) => cb.checked).length;
  }

  contentCheckboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      if (getActiveContentCount() === 0) {
        cb.checked = true;
        showSectionStatus(t("atLeastOneSection"), "error");
        setTimeout(() => {
          sectionsStatus?.classList.add("hidden");
        }, 2500);
      }
    });
  });

  sectionsSaveBtn?.addEventListener("click", async () => {
    if (getActiveContentCount() === 0) {
      showSectionStatus(t("atLeastOneSection"), "error");
      return;
    }
    const newConfig = {
      titleVerdict: sectionVerdictSummary ? sectionVerdictSummary.checked : true,
      coreSummary: sectionVerdictSummary ? sectionVerdictSummary.checked : true,
      mindMap: sectionMindmap ? sectionMindmap.checked : true,
      discussion: sectionDiscussion ? sectionDiscussion.checked : false,
    };
    await chrome.storage.local.set({
      enabledSections: newConfig,
      generateKnowledgeEntries: sectionKnowledge ? sectionKnowledge.checked : false,
      outputLanguage: outputLangSelect ? outputLangSelect.value : "same-as-content",
      uiDensity: uiDensitySelect ? uiDensitySelect.value : "compact",
    });
    showSectionStatus(t("sectionPreferencesSaved"), "ok");
    setTimeout(() => {
      sectionsStatus?.classList.add("hidden");
    }, 2500);
  });
}

function showSectionStatus(msg, type) {
  if (!sectionsStatus) return;
  sectionsStatus.textContent = msg;
  sectionsStatus.className = `test-result ${type}`;
  sectionsStatus.classList.remove("hidden");
}

function initChromeCacheSettings(stored) {
  const limitInput = document.getElementById("chrome-cache-limit-input");
  const saveBtn = document.getElementById("chrome-cache-save-btn");
  const clearBtn = document.getElementById("chrome-cache-clear-btn");
  const countDisplay = document.getElementById("chrome-cache-count");
  const statusDisplay = document.getElementById("chrome-cache-status");
  if (!limitInput) return;

  const initialLimit = (typeof stored?.chromeCacheTabLimit === "number" && stored.chromeCacheTabLimit >= 0)
    ? Math.min(1000, Math.round(stored.chromeCacheTabLimit))
    : 100;
  limitInput.value = initialLimit;

  const updateCountDisplay = (cache) => {
    if (countDisplay) {
      const count = Array.isArray(cache) ? cache.length : 0;
      countDisplay.textContent = t("cachedTabsCount", { count });
    }
  };

  updateCountDisplay(stored?.chromeTabCache);

  const saveLimit = async () => {
    const val = Math.min(1000, Math.max(0, Math.round(Number(limitInput.value) || 0)));
    limitInput.value = val;
    const current = await chrome.storage.local.get(["chromeTabCache"]);
    let cache = Array.isArray(current.chromeTabCache) ? current.chromeTabCache : [];
    if (cache.length > val) {
      cache = cache.slice(0, val);
      await chrome.storage.local.set({ chromeCacheTabLimit: val, chromeTabCache: cache });
    } else {
      await chrome.storage.local.set({ chromeCacheTabLimit: val });
    }
    updateCountDisplay(cache);
    if (statusDisplay) {
      statusDisplay.textContent = t("saved");
      statusDisplay.className = "test-result ok";
      statusDisplay.classList.remove("hidden");
      setTimeout(() => { statusDisplay.classList.add("hidden"); }, 2000);
    }
  };

  if (saveBtn) {
    saveBtn.addEventListener("click", saveLimit);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      await chrome.storage.local.set({ chromeTabCache: [] });
      updateCountDisplay([]);
      if (statusDisplay) {
        statusDisplay.textContent = t("cacheCleared");
        statusDisplay.className = "test-result ok";
        statusDisplay.classList.remove("hidden");
        setTimeout(() => { statusDisplay.classList.add("hidden"); }, 2000);
      }
    });
  }
}
