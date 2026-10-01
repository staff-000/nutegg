// ============================================================
// NutEgg Popup Services — Environment & Server Status Service
// ============================================================

/**
 * Manages checking Obsidian server connectivity, Chrome AI fallback status,
 * AI credit / token balance, version compatibility, and metrics sync.
 */
class EnvironmentService {
  constructor(options = {}) {
    this.settings = options.settings;
    this._headerUI = options.headerUI || null;
    this._bannersUI = options.bannersUI || null;
    this._metricsUI = options.metricsUI || null;
    this.helper = options.helper || globalThis.helper || {};
    this.t = options.t || ((key, params) => (typeof window !== "undefined" && window.NutEggI18n ? window.NutEggI18n.t(key, params) : key));
  }

  get headerUI() {
    return this._headerUI || (typeof headerUI !== "undefined" ? headerUI : null) || globalThis.headerUI;
  }
  set headerUI(val) {
    this._headerUI = val;
  }

  get bannersUI() {
    return this._bannersUI || (typeof bannersUI !== "undefined" ? bannersUI : null) || globalThis.bannersUI;
  }
  set bannersUI(val) {
    this._bannersUI = val;
  }

  get metricsUI() {
    return this._metricsUI || (typeof metricsUI !== "undefined" ? metricsUI : null) || globalThis.metricsUI;
  }
  set metricsUI(val) {
    this._metricsUI = val;
  }

  setUI(ui = {}) {
    if (ui.headerUI) this._headerUI = ui.headerUI;
    if (ui.bannersUI) this._bannersUI = ui.bannersUI;
    if (ui.metricsUI) this._metricsUI = ui.metricsUI;
  }

  /**
   * Fetches fresh metrics from Obsidian server and persists them to cache.
   */
  async fetchMetrics() {
    try {
      const response = await chrome.runtime.sendMessage({ action: "metrics" });
      if (response && (response.nuts != null || response.eggs != null)) {
        if (!this.settings?.serverOnline && response.nuts === 0 && response.eggs === 0) {
          return;
        }
        this.metricsUI?.render(response);
        chrome.storage?.local?.set?.({ cachedMetrics: response });
      }
    } catch {
      // server may not support /metrics yet
    }
  }

  /**
   * Checks Obsidian AI configuration status and version mismatches.
   */
  async checkConfigStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: "config-status" });
      if (response?.version) {
        this.settings.obsidianPluginVersion = response.version;
        this.headerUI?.updateVersion(null, this.settings.obsidianPluginVersion);
      }

      const issues = Array.isArray(response?.issues) ? [...response.issues] : [];
      const mismatch = this.helper.getVersionMismatchIssue
        ? this.helper.getVersionMismatchIssue(response?.version || this.settings.obsidianPluginVersion)
        : null;
      if (mismatch && !issues.some((i) => i.includes("Version mismatch"))) {
        issues.unshift(mismatch);
      }

      if (issues.length > 0) {
        this.bannersUI?.showWarning(issues.join(" • "));
      } else {
        this.bannersUI?.hideWarning();
      }
      if (response?.credit) {
        this.headerUI?.renderCredit(response.credit, this.settings.serverOnline);
      }
    } catch {
      // handled by server status dot
    }
  }

  /**
   * Checks credit status for Obsidian server.
   */
  async checkCreditStatus() {
    if (!this.settings?.serverOnline) {
      this.headerUI?.hideCredit();
      return;
    }
    try {
      const credit = await chrome.runtime.sendMessage({ action: "get-credit" });
      this.headerUI?.renderCredit(credit, this.settings.serverOnline);
    } catch {
      this.headerUI?.hideCredit();
    }
  }

  /**
   * Checks credit status for Chrome AI mode.
   */
  async checkChromeCreditStatus() {
    try {
      const credit = await chrome.runtime.sendMessage({ action: "check-chrome-credit" });
      if (credit && !this.settings?.serverOnline) {
        credit.isChromeAi = true;
        this.headerUI?.renderCredit(credit, false);
      }
    } catch {
      this.headerUI?.hideCredit();
    }
  }

  /**
   * Updates the server status indicator dot and tooltip in the header.
   */
  updateServerStatusIndicator() {
    if (!this.settings || !this.headerUI) return;

    if (this.settings.serverOnline) {
      const mismatch = this.helper.getVersionMismatchIssue
        ? this.helper.getVersionMismatchIssue(this.settings.obsidianPluginVersion)
        : null;
      if (mismatch) {
        this.headerUI.updateServerStatus("obsidian-mismatch", this.settings.obsidianPluginVersion, mismatch);
      } else if (!this.settings.obsidianAiConfigured) {
        this.headerUI.updateServerStatus("obsidian-no-key", this.settings.obsidianPluginVersion);
      } else {
        this.headerUI.updateServerStatus("obsidian-online", this.settings.obsidianPluginVersion);
      }
      return;
    }

    // Obsidian offline
    if (this.settings.chromeAiConfigured) {
      this.headerUI.updateServerStatus("chrome-ai", null, this.settings.chromeAiProvider);
    } else if (this.settings.chromeAiEnabled) {
      this.headerUI.updateServerStatus("chrome-no-key", null, this.settings.chromeAiProvider);
    } else {
      this.headerUI.updateServerStatus("offline");
    }
  }

  /**
   * Updates offline / key missing capture banners according to environment state.
   */
  updateCaptureBanners() {
    if (!this.settings || !this.bannersUI) return;
    this.bannersUI.updateCaptureBanners({
      serverOnline: this.settings.serverOnline,
      chromeAiEnabled: this.settings.chromeAiEnabled,
      chromeAiConfigured: this.settings.chromeAiConfigured,
      obsidianAiConfigured: this.settings.obsidianAiConfigured,
    });
  }

  /**
   * Queries server connection, determines Obsidian vs Chrome AI mode, and updates UI status.
   */
  async checkServerStatus(onStatusUpdated) {
    let online = false;
    let version = null;
    try {
      const response = await chrome.runtime.sendMessage({ action: "check-server" });
      online = response?.online || false;
      version = response?.version || null;
    } catch {
      online = false;
      version = null;
    }

    this.settings.setServerStatus({ online, version, aiConfigured: this.settings.obsidianAiConfigured });
    this.headerUI?.updateVersion(null, this.settings.obsidianPluginVersion);

    if (this.settings.serverOnline) {
      try {
        const config = await chrome.runtime.sendMessage({ action: "config-status" });
        const issues = config?.issues || [];
        const aiConfigured = !issues.some((i) =>
          i.toLowerCase().includes("no api key") ||
          i.toLowerCase().includes("not configured")
        );
        this.settings.setServerStatus({ online: true, version, aiConfigured });
      } catch {
        this.settings.setServerStatus({ online: true, version, aiConfigured: true });
      }

      await this.checkCreditStatus();
      this.metricsUI?.showPluginLink(false);

      const mismatch = this.helper.getVersionMismatchIssue
        ? this.helper.getVersionMismatchIssue(this.settings.obsidianPluginVersion)
        : null;
      if (mismatch) {
        this.bannersUI?.showWarning(mismatch);
      } else {
        this.updateServerStatusIndicator();
      }
    } else {
      try {
        const chromeAi = await chrome.runtime.sendMessage({ action: "check-chrome-ai" });
        this.settings.setChromeAiStatus({
          enabled: chromeAi?.enabled || false,
          configured: chromeAi?.configured || false,
          provider: chromeAi?.provider || "",
          model: chromeAi?.model || "",
        });
      } catch {
        this.settings.setChromeAiStatus({ enabled: false, configured: false });
      }

      if (this.settings.chromeAiConfigured) {
        await this.checkChromeCreditStatus();
      } else {
        this.headerUI?.hideCredit();
      }

      this.metricsUI?.showPluginLink(true);
      this.updateServerStatusIndicator();
    }

    this.updateCaptureBanners();
    if (typeof onStatusUpdated === "function") {
      onStatusUpdated();
    }
  }
}

// Browser global namespace attachment
if (typeof globalThis !== "undefined") {
  globalThis.NutEggServices = globalThis.NutEggServices || {};
  globalThis.NutEggServices.EnvironmentService = EnvironmentService;
}

// CommonJS export for Node test environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = { EnvironmentService };
}
