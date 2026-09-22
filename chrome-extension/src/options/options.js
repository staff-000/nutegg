// NutEgg Options Page

const {
  PROVIDER_CATALOG = {},
  checkCreditAI,
} = window.NutEggAI || {};

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
const aiEnableStandalone = document.getElementById("ai-enable-standalone");
const aiProviderSelect = document.getElementById("ai-provider-select");
const aiModelSelect = document.getElementById("ai-model-select");
const aiModelCustom = document.getElementById("ai-model-custom");
const aiLocalEndpointRow = document.getElementById("ai-local-endpoint-row");
const aiLocalEndpoint = document.getElementById("ai-local-endpoint");
const aiKeyInput = document.getElementById("ai-key-input");
const aiKeyToggle = document.getElementById("ai-key-toggle");
const aiKeyHint = document.getElementById("ai-key-hint");
const aiLangSelect = document.getElementById("ai-lang-select");
const aiSaveBtn = document.getElementById("ai-save-btn");
const aiTestBtn = document.getElementById("ai-test-btn");
const aiTestResult = document.getElementById("ai-test-result");
const aiPromptSelect = document.getElementById("ai-prompt-select");
const aiPromptTextarea = document.getElementById("ai-prompt-textarea");
const aiPromptResetBtn = document.getElementById("ai-prompt-reset-btn");

let savedPromptOverrides = {};
let activePromptKey = "contentAnalysis";

function updateModeDesc(mode) {
  if (mode === "confirm") {
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
    "chromeAiEnabled",
    "chromeAiProvider",
    "chromeAiApiKey",
    "chromeAiModel",
    "chromeAiLocalEndpoint",
    "chromeAiOutputLanguage",
    "chromeAiPromptOverrides",
  ]);
  savedPromptOverrides = stored.chromeAiPromptOverrides || {};

  // 1. Server settings
  const port = stored.serverPort || DEFAULT_PORT;
  portInput.value = port;
  portDisplay.textContent = port;

  const mode = stored.analysisMode || "fast";
  if (modeSelect) {
    modeSelect.value = mode;
    updateModeDesc(mode);
    modeSelect.addEventListener("change", async () => {
      updateModeDesc(modeSelect.value);
      await chrome.storage.local.set({ analysisMode: modeSelect.value });
      showResult("Workflow mode updated.", "ok");
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

  // 2. AI Settings initialization
  initAiSettings(stored);

  // 3. Check Obsidian connection status for the AI banner
  checkObsidianForAiBanner(port);

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

async function checkObsidianForAiBanner(port) {
  if (!aiStatusBanner) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  const isEnabled = aiEnableStandalone ? aiEnableStandalone.checked : false;

  try {
    const resp = await fetch(`http://127.0.0.1:${port}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (resp.ok) {
      aiStatusBanner.className = "ai-status-banner obsidian-online";
      aiStatusBanner.innerHTML = "🟢 <strong>Obsidian is currently connected.</strong> NutEgg uses Obsidian's AI configuration and vault knowledge tree by default." + (isEnabled ? " The settings below will act as your fallback when Obsidian is closed." : "");
      return;
    }
  } catch {}

  aiStatusBanner.className = "ai-status-banner obsidian-offline";
  if (isEnabled) {
    aiStatusBanner.innerHTML = "🟠 <strong>Obsidian is currently offline.</strong> NutEgg will run in standalone mode using the AI configuration below for fast content verdicts and summaries.";
  } else {
    aiStatusBanner.innerHTML = "⚪ <strong>Obsidian is currently offline.</strong> Standalone Chrome AI is turned off. Start Obsidian to capture, or enable the option below.";
  }
}

function initAiSettings(stored) {
  if (!aiProviderSelect || typeof PROVIDER_CATALOG === "undefined") return;

  const urlParams = new URLSearchParams(window.location.search);
  const forceEnableAi = urlParams.get("enableAi") === "1" || urlParams.get("enableAi") === "true";

  // Standalone mode toggle
  const isEnabled = forceEnableAi || Boolean(stored.chromeAiEnabled);
  if (aiEnableStandalone) {
    aiEnableStandalone.checked = isEnabled;
    if (isEnabled) {
      aiConfigSection?.classList.remove("hidden");
      if (forceEnableAi) {
        chrome.storage.local.set({ chromeAiEnabled: true });
        setTimeout(() => {
          aiConfigSection?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    } else {
      aiConfigSection?.classList.add("hidden");
    }

    aiEnableStandalone.addEventListener("change", async () => {
      const checked = aiEnableStandalone.checked;
      if (checked) {
        aiConfigSection?.classList.remove("hidden");
        aiConfigSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        aiConfigSection?.classList.add("hidden");
      }
      await chrome.storage.local.set({ chromeAiEnabled: checked });
      checkObsidianForAiBanner(stored.serverPort || DEFAULT_PORT);
    });
  }

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

  if (stored.chromeAiLocalEndpoint) {
    aiLocalEndpoint.value = stored.chromeAiLocalEndpoint;
  }

  const savedLang = stored.chromeAiOutputLanguage || stored.contentOutputLanguage;
  if (savedLang && aiLangSelect) {
    aiLangSelect.value = savedLang;
  }

  if (aiLangSelect) {
    aiLangSelect.addEventListener("change", async () => {
      await chrome.storage.local.set({
        chromeAiOutputLanguage: aiLangSelect.value,
        contentOutputLanguage: aiLangSelect.value,
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
      aiKeyToggle.textContent = "Hide";
    } else {
      aiKeyInput.type = "password";
      aiKeyToggle.textContent = "Show";
    }
  });

  aiSaveBtn.addEventListener("click", handleAiSave);
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
        showAiResult(`Reset ${activePromptKey} prompt to default.`, "ok");
        setTimeout(() => {
          aiTestResult.classList.add("hidden");
        }, 2000);
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
  customOpt.textContent = "Custom model tag...";
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
      aiKeyHint.textContent = "Optional for local LLMs (Ollama, LM Studio). Leave blank if auth is disabled.";
    } else {
      aiKeyHint.textContent = `Enter your ${provider.label} API key. Stored locally in your browser.`;
    }
  }

  if (aiKeyInput) {
    aiKeyInput.placeholder = provider.keyPlaceholder || "API Key";
  }
}

async function handleAiSave() {
  const providerId = aiProviderSelect.value;
  let model = aiModelSelect.value;
  if (model === "__custom__") {
    model = aiModelCustom.value.trim();
  }

  const apiKey = aiKeyInput.value.trim();
  const localEndpoint = aiLocalEndpoint ? aiLocalEndpoint.value.trim() : "";
  const outputLanguage = aiLangSelect ? aiLangSelect.value : "same-as-content";

  saveActivePromptToState();
  const isEnabled = aiEnableStandalone ? aiEnableStandalone.checked : false;
  await chrome.storage.local.set({
    chromeAiEnabled: isEnabled,
    chromeAiProvider: providerId,
    chromeAiModel: model,
    chromeAiApiKey: apiKey,
    chromeAiLocalEndpoint: localEndpoint,
    chromeAiOutputLanguage: outputLanguage,
    contentOutputLanguage: outputLanguage,
    chromeAiPromptOverrides: savedPromptOverrides,
  });

  showAiResult("AI Settings saved successfully.", "ok");
  setTimeout(() => {
    aiTestResult.classList.add("hidden");
  }, 3000);
}

async function handleAiTest() {
  aiTestResult.textContent = "Testing AI connection...";
  aiTestResult.className = "test-result";
  aiTestResult.classList.remove("hidden");

  const providerId = aiProviderSelect.value;
  let model = aiModelSelect.value;
  if (model === "__custom__") {
    model = aiModelCustom.value.trim();
  }
  const apiKey = aiKeyInput.value.trim();
  const localEndpoint = aiLocalEndpoint ? aiLocalEndpoint.value.trim() : "";

  const tempSettings = {
    chromeAiProvider: providerId,
    chromeAiModel: model,
    chromeAiApiKey: apiKey,
    chromeAiLocalEndpoint: localEndpoint,
  };

  try {
    const info = await checkCreditAI(tempSettings);
    if (info.error) {
      showAiResult(`❌ Connection failed: ${info.error} (${info.statusText})`, "error");
    } else if (info.hasBalance) {
      showAiResult(`✅ Connected: ${info.providerLabel} · Balance: ${info.balanceFormatted}`, "ok");
    } else {
      showAiResult(`✅ Connected: ${info.providerLabel} · Status: ${info.statusText}`, "ok");
    }
  } catch (err) {
    showAiResult(`❌ AI Error: ${err.message}`, "error");
  }
}

function showAiResult(msg, type) {
  aiTestResult.textContent = msg;
  aiTestResult.className = `test-result ${type}`;
  aiTestResult.classList.remove("hidden");
}

// Server save & test
async function handleSave() {
  const port = parseInt(portInput.value, 10);
  if (!port || port < 1 || port > 65535) {
    showResult("Invalid port number.", "error");
    return;
  }

  const mode = modeSelect ? modeSelect.value : "fast";
  await chrome.storage.local.set({ serverPort: port, analysisMode: mode });
  // Notify background
  await chrome.runtime.sendMessage({ action: "set-port", port });
  showResult("Saved.", "ok");
  setTimeout(() => { testResult.classList.add("hidden"); }, 2000);
  checkObsidianForAiBanner(port);
}

async function handleTest() {
  const port = parseInt(portInput.value, 10);
  if (!port || port < 1 || port > 65535) {
    showResult("Invalid port.", "error");
    return;
  }

  testResult.textContent = "Testing...";
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
        versionWarn = ` ⚠️ Version mismatch: Plugin is v${health.version}, Extension is v${extVersion}.`;
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
      showResult(`✅ Connected successfully.${versionWarn}${creditInfo}`, versionWarn ? "warning" : "ok");
      checkObsidianForAiBanner(port);
    } else {
      showResult("❌ Server responded with error.", "error");
    }
  } catch {
    clearTimeout(timeout);
    showResult(`❌ Cannot reach server on port ${port}. Start Obsidian with NutEgg.`, "error");
    checkObsidianForAiBanner(port);
  }
}

function showResult(msg, type) {
  testResult.textContent = msg;
  testResult.className = `test-result ${type}`;
  testResult.classList.remove("hidden");
}
