// ============================================================
// NutEgg Popup UI — Header & Status Component
// ============================================================

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
      this.versionTag.title = t("versionMismatchFull", { extVersion, pluginVersion });
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
    const obsidianMode = settings.connectionMode === 'obsidian';
    this.updateVersion(null, obsidianMode ? settings.obsidianPluginVersion : null);
    if (!obsidianMode) {
      this.updateServerStatus(settings.chromeAiConfigured ? 'chrome-ai' : 'chrome-no-key', null, settings.chromeAiProvider);
      return;
    }
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
      this.tooltipTitle.textContent = t("obsidianOnline");
      this.tooltipSub.textContent = version ? t("pluginVersionFull", { version }) : t("readyToCapture");
      this.serverStatus?.setAttribute("aria-label", t("obsidianOnlineAria", { version: version ? ` (v${version})` : "" }));
    } else if (state === "obsidian-no-key") {
      this.tooltip.className = "status-tooltip warning";
      this.tooltipTitle.textContent = t("obsidianOnlineNoKey");
      this.tooltipSub.textContent = t("addKeyInObsidian");
      this.serverStatus?.setAttribute("aria-label", t("obsidianNoKeyConfig"));
    } else if (state === "obsidian-mismatch") {
      this.tooltip.className = "status-tooltip warning";
      this.tooltipTitle.textContent = t("versionMismatch");
      this.tooltipSub.textContent = extra || t("updateNutEggPlugin");
      this.serverStatus?.setAttribute("aria-label", extra || t("versionMismatch"));
    } else if (state === "chrome-ai") {
      this.tooltip.className = "status-tooltip chrome-ai";
      this.tooltipTitle.textContent = t("readerReady");
      this.tooltipSub.textContent = t("readerIntroBody");
      this.serverStatus?.setAttribute("aria-label", t("readerReady"));
    } else if (state === "chrome-no-key") {
      this.tooltip.className = "status-tooltip warning";
      this.tooltipTitle.textContent = t("readerNeedsSetup");
      this.tooltipSub.textContent = t("readerSetupBody");
      this.serverStatus?.setAttribute("aria-label", t("readerNeedsSetup"));
    } else {
      this.tooltip.className = "status-tooltip offline";
      this.tooltipTitle.textContent = t("obsidianOffline");
      this.tooltipSub.textContent = t("obsidianOfflineStart");
      this.serverStatus?.setAttribute("aria-label", t("obsidianOfflineStart"));
    }
  }

  setCheckingServer() {
    if (this.tooltipTitle) this.tooltipTitle.textContent = t("checking");
    if (this.tooltipSub) this.tooltipSub.textContent = t("connectingToObsidian");
  }

  setCheckingCredit() {
    if (this.aiCreditText) this.aiCreditText.textContent = t("checking");
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
        : credit.provider === "deepseek"
        ? "DeepSeek"
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
      this.aiCreditPill.title = t("aiCreditTooltip");
      this.aiCreditPill.classList.remove("has-warning");
    } else {
      this.aiCreditText.textContent = providerName;
      this.aiCreditPill.title = credit.statusText || t("aiCreditTooltip");
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
