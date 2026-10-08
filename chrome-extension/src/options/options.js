// NutEgg Options Page

const {
  PROVIDER_CATALOG = {},
  checkCreditAI,
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
  const stored = await chrome.storage.local.get([
    "serverPort",
    "analysisMode",
    "enabledSections",
    "generateKnowledgeEntries",
    "uiDensity",
    "connectionMode",
    "chromeAiEnabled",
    "chromeAiProvider",
    "chromeAiApiKey",
    "chromeAiModel",
    "chromeAiLocalEndpoint",
    "chromeAiEndpoint",
    "outputLanguage",
    "chromeAiPromptOverrides",
    "debugInfo",
    "captureRetryCount",
    "captureRetryDelayMs",
  ]);
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

  const rawMode = stored.analysisMode || "full";
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

  // Chrome is ready to configure without probing for another application.
  initConnectionMode(stored);

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
  aiConfigSection.classList.toggle("hidden", usesObsidian);
  chromeAdvancedSettings.classList.toggle("hidden", usesObsidian);
  connectionModeBadge.textContent = t(usesObsidian ? "settingsObsidianMode" : "settingsChromeMode");
  connectionModeBadge.classList.toggle("obsidian", usesObsidian);
  const obsidianSettings = document.getElementById("obsidian-settings");
  if (obsidianSettings) obsidianSettings.open = usesObsidian;
}

async function setConnectionMode(mode) {
  await chrome.storage.local.set({ connectionMode: mode, chromeAiEnabled: true });
  renderConnectionMode(mode);
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
}

async function checkObsidianForAiBanner(port) {
  if (!aiStatusBanner || !obsidianModeEnabled.checked) return;
  aiStatusBanner.textContent = t("settingsObsidianChecking");
  aiStatusBanner.className = "connection-status";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: controller.signal });
    if (!obsidianModeEnabled.checked) return;
    aiStatusBanner.textContent = t(response.ok ? "settingsObsidianConnected" : "settingsObsidianWaiting");
    aiStatusBanner.classList.toggle("connected", response.ok);
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

  const selectedProvider = stored.chromeAiProvider || "gemini";
  aiProviderSelect.value = selectedProvider;

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

  aiProviderSelect.addEventListener("change", () => {
    const provId = aiProviderSelect.value;
    updateModelOptions(provId);
    updateProviderHints(provId);
  });

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

  const models = provider.models || [];
  const defaultModel = provider.defaultModel || models[0] || "";
  const activeModel = savedModel || defaultModel;

  aiModelSelect.innerHTML = "";

  for (const m of models) {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
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

  aiKeyInput.required = providerId !== "local";

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

  if (aiKeyHint) {
    if (providerId === "local") {
      aiKeyHint.textContent = t("aiKeyHintLocal");
    } else {
      aiKeyHint.textContent = t("aiKeyHintProvider", { provider: provider.label });
    }
  }

  if (aiKeyInput) {
    aiKeyInput.placeholder = provider.keyPlaceholder || t("settingsKeyLabel");
  }
}

function getAiFormSettings() {
  const model = aiModelSelect.value === "__custom__" ? aiModelCustom.value.trim() : aiModelSelect.value;
  const endpoint = aiLocalEndpoint.value.trim();
  return {
    chromeAiProvider: aiProviderSelect.value,
    chromeAiModel: model,
    chromeAiApiKey: aiKeyInput.value.trim(),
    chromeAiEndpoint: endpoint,
    chromeAiLocalEndpoint: endpoint,
  };
}

async function handleAiSave(advanced = false) {
  const settings = getAiFormSettings();
  if (settings.chromeAiProvider !== "local" && !settings.chromeAiApiKey) {
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
  aiSaveBtn.disabled = true;
  try {
    await chrome.storage.local.set({
      ...settings,
      connectionMode: "chrome",
      chromeAiEnabled: true,
      chromeAiPromptOverrides: savedPromptOverrides,
    });
    renderConnectionMode("chrome");
    showAiResult(t(advanced ? "aiSettingsSaved" : "settingsSetupSaved"), "ok", advanced);
  } catch (error) {
    showAiResult(t("aiError", { error: error.message }), "error", advanced);
  } finally {
    aiSaveBtn.disabled = false;
  }
}

async function handleAiTest() {
  const settings = getAiFormSettings();
  if (settings.chromeAiProvider !== "local" && !settings.chromeAiApiKey) {
    showAiResult(t("settingsKeyRequired"), "error", true);
    aiKeyInput.focus();
    return;
  }
  aiTestBtn.disabled = true;
  showAiResult(t("testingAiConnection"), "", true);
  try {
    const info = await checkCreditAI(settings);
    if (info.error) {
      showAiResult(t("aiConnectionFailed", { error: info.error, status: info.statusText }), "error", true);
    } else if (info.hasBalance) {
      showAiResult(t("aiConnectedBalance", { provider: info.providerLabel, balance: info.balanceFormatted }), "ok", true);
    } else {
      showAiResult(t("aiConnectedStatus", { provider: info.providerLabel, status: info.statusText }), "ok", true);
    }
  } catch (err) {
    showAiResult(t("aiError", { error: err.message }), "error", true);
  } finally {
    aiTestBtn.disabled = false;
  }
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
        const creditResp = await fetch(`http://127.0.0.1:${port}/credit`);
        if (creditResp.ok) {
          const credit = await creditResp.json();
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
    sectionKnowledge.checked = savedGenerateKnowledgeEntries !== false;
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
      generateKnowledgeEntries: sectionKnowledge ? sectionKnowledge.checked : true,
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
