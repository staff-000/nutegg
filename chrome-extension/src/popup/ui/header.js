// ============================================================
// NutEgg Popup UI — Header & Status Component
// ============================================================

const _headerT = (key, params) => {
  if (typeof t === "function") return t(key, params);
  if (typeof window !== "undefined" && window.NutEggI18n) return window.NutEggI18n.t(key, params);
  return key;
};

class HeaderComponent {
  constructor(root = document) {
    this.root = root;
    this.serverStatus = root.getElementById("server-status");
    this.statusIndicatorWrap = root.getElementById("status-indicator-wrap");
    this.tooltip = root.getElementById("server-status-tooltip");
    this.tooltipTitle = root.getElementById("status-tooltip-title");
    this.tooltipSub = root.getElementById("status-tooltip-sub");
    this.aiCreditPill = root.getElementById("ai-credit-pill");
    this.aiCreditText = root.getElementById("ai-credit-text");
    this.settingsBtn = root.getElementById("settings-btn");
    this.versionTag = root.getElementById("version-tag");
  }

  updateVersion(extVersion, pluginVersion) {
    if (!this.versionTag) return;
    if (!extVersion) {
      extVersion = typeof chrome !== "undefined" ? chrome.runtime?.getManifest?.()?.version : null;
    }
    if (!extVersion) return;

    if (pluginVersion && pluginVersion !== extVersion) {
      this.versionTag.textContent = `NutEgg v${extVersion} (Obsidian v${pluginVersion})`;
      this.versionTag.title = _headerT("versionMismatchFull", { extVersion, pluginVersion });
      this.versionTag.style.color = "#d97706";
    } else {
      this.versionTag.textContent = `NutEgg v${extVersion}`;
      this.versionTag.title = pluginVersion
        ? `NutEgg v${extVersion} (Obsidian plugin v${pluginVersion})`
        : `NutEgg v${extVersion}`;
      this.versionTag.style.color = "";
    }
  }

  render(session, settings) {
    if (!settings) return;
    this.updateVersion(null, settings.obsidianPluginVersion);
    const extVersion = typeof chrome !== "undefined" ? chrome.runtime?.getManifest?.()?.version : null;
    const hasMismatch = settings.obsidianPluginVersion && extVersion && settings.obsidianPluginVersion !== extVersion;

    if (settings.serverOnline) {
      if (hasMismatch) {
        this.updateServerStatus("obsidian-mismatch", settings.obsidianPluginVersion);
      } else if (!settings.obsidianAiConfigured) {
        this.updateServerStatus("obsidian-no-key", settings.obsidianPluginVersion);
      } else {
        this.updateServerStatus("obsidian-online", settings.obsidianPluginVersion);
      }
    } else if (settings.chromeAiConfigured) {
      this.updateServerStatus("chrome-ai", null, settings.chromeAiProvider || "standalone");
    } else if (settings.chromeAiEnabled) {
      this.updateServerStatus("chrome-no-key", null, settings.chromeAiProvider);
    } else {
      this.updateServerStatus("offline");
    }
  }

  updateServerStatus(state, version = null, extra = null) {
    if (this.serverStatus) {
      if (state === "obsidian-online") {
        this.serverStatus.className = "status-dot online";
      } else if (state === "obsidian-mismatch" || state === "obsidian-no-key" || state === "chrome-no-key") {
        this.serverStatus.className = "status-dot warning";
      } else if (state === "chrome-ai") {
        this.serverStatus.className = "status-dot chrome-ai";
      } else {
        this.serverStatus.className = "status-dot offline";
      }
    }

    if (!this.tooltip || !this.tooltipTitle || !this.tooltipSub) return;

    if (state === "obsidian-online") {
      this.tooltip.className = "status-tooltip online";
      this.tooltipTitle.textContent = _headerT("obsidianOnline");
      this.tooltipSub.textContent = version ? _headerT("pluginVersionFull", { version }) : _headerT("readyToCapture");
      this.serverStatus?.setAttribute("aria-label", _headerT("obsidianOnlineAria", { version: version ? ` (v${version})` : "" }));
    } else if (state === "obsidian-no-key") {
      this.tooltip.className = "status-tooltip warning";
      this.tooltipTitle.textContent = _headerT("obsidianOnlineNoKey");
      this.tooltipSub.textContent = _headerT("addKeyInObsidian");
      this.serverStatus?.setAttribute("aria-label", _headerT("obsidianNoKeyConfig"));
    } else if (state === "obsidian-mismatch") {
      this.tooltip.className = "status-tooltip warning";
      this.tooltipTitle.textContent = _headerT("versionMismatch");
      this.tooltipSub.textContent = extra || _headerT("updateNutEggPlugin");
      this.serverStatus?.setAttribute("aria-label", extra || _headerT("versionMismatch"));
    } else if (state === "chrome-ai") {
      this.tooltip.className = "status-tooltip chrome-ai";
      this.tooltipTitle.textContent = _headerT("usingChromeAi");
      this.tooltipSub.textContent = _headerT("usingChromeAiSub", { extra: extra || _headerT("standalone") });
      this.serverStatus?.setAttribute("aria-label", `${_headerT("usingChromeAi")} (${extra || _headerT("standalone")})`);
    } else if (state === "chrome-no-key") {
      this.tooltip.className = "status-tooltip warning";
      this.tooltipTitle.textContent = _headerT("chromeAiNoKey");
      this.tooltipSub.textContent = _headerT("addKeyInChrome");
      this.serverStatus?.setAttribute("aria-label", _headerT("chromeAiNoKeyConfig"));
    } else {
      this.tooltip.className = "status-tooltip offline";
      this.tooltipTitle.textContent = _headerT("obsidianOffline");
      this.tooltipSub.textContent = _headerT("startObsidianOrChromeAi");
      this.serverStatus?.setAttribute("aria-label", _headerT("obsidianOfflineStart"));
    }
  }

  setCheckingServer() {
    if (this.tooltipTitle) this.tooltipTitle.textContent = _headerT("checking");
    if (this.tooltipSub) this.tooltipSub.textContent = _headerT("connectingToObsidian");
  }

  setCheckingCredit() {
    if (this.aiCreditText) this.aiCreditText.textContent = _headerT("checking");
  }

  renderCredit(credit, serverOnline) {
    if (!this.aiCreditPill || !this.aiCreditText) return;

    if (!credit || credit.error || (!serverOnline && !credit.isChromeAi)) {
      this.aiCreditPill.classList.add("hidden");
      return;
    }

    this.aiCreditPill.classList.remove("hidden");

    const providerName =
      credit.source === "openrouter"
        ? "OpenRouter"
        : credit.provider === "anthropic"
        ? "Claude"
        : credit.provider === "kimi"
        ? "Kimi"
        : credit.provider === "gemini"
        ? "Gemini"
        : credit.provider === "openai"
        ? "OpenAI"
        : credit.provider === "local"
        ? (credit.model ? `Local (${credit.model})` : "Local LLM")
        : credit.providerLabel || credit.provider || "AI";

    if (credit.hasBalance && credit.balanceFormatted) {
      this.aiCreditText.textContent = `${providerName}: ${credit.balanceFormatted}`;
      this.aiCreditPill.title = _headerT("aiCreditTooltip");
      this.aiCreditPill.classList.remove("has-warning");
    } else {
      this.aiCreditText.textContent = providerName;
      this.aiCreditPill.title = credit.statusText || _headerT("aiCreditTooltip");
      if (credit.hasBalance === false && !credit.isUnlimited) {
        this.aiCreditPill.classList.add("has-warning");
      } else {
        this.aiCreditPill.classList.remove("has-warning");
      }
    }
  }

  hideCredit() {
    this.aiCreditPill?.classList.add("hidden");
  }
}

const _headerScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_headerScope.NutEggUI = _headerScope.NutEggUI || {};
_headerScope.NutEggUI.HeaderComponent = HeaderComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { HeaderComponent };
}
