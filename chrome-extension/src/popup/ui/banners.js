// ============================================================
// NutEgg Popup UI — Message Banners Component
// ============================================================

function _bannersEscapeHtml(str) {
  if (typeof escapeHtml === "function") return escapeHtml(str);
  if (typeof document !== "undefined" && document.createElement) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

class BannersComponent {
  constructor(root = document) {
    this.root = root;
    this.bindElements(root);
    this.initEvents();
  }

  bindElements(root = this.root || (typeof document !== "undefined" ? document : null)) {
    if (!root) return;
    const getEl = (id) => (root.getElementById ? root.getElementById(id) : root.querySelector ? root.querySelector(`#${id}`) : null) || (typeof document !== "undefined" ? document.getElementById(id) : null);

    this.warningBanner = getEl("warning-banner");
    this.warningMessage = getEl("warning-message");
    this.errorBanner = getEl("error-banner");
    this.errorMessage = getEl("error-message");
    this.errorHint = getEl("error-hint");
    this.duplicateBanner = getEl("duplicate-banner");
    this.duplicateMessage = getEl("duplicate-message");
    this.successBanner = getEl("success-banner");
    this.successMessage = getEl("success-message");
    this.aiKeyMissingBanner = getEl("ai-key-missing-banner");
    this.openSettingsKeyBtn = getEl("open-settings-key-btn");
    this.chromeModeTipBanner = getEl("chrome-mode-tip-banner");
    this.chromeResultBanner = getEl("chrome-result-banner");
    this.chromeActionsCard = getEl("chrome-actions-card");
    this.errorReportBug = getEl("error-report-bug");
    this.initEvents();
  }

  initEvents() {
    if (this.aiKeyMissingBanner && !this.aiKeyMissingBanner._hasBannerListener) {
      this.aiKeyMissingBanner._hasBannerListener = true;
      this.aiKeyMissingBanner.addEventListener("click", (e) => {
        const target = e.target;
        const isEnableBtn = target?.id === "open-settings-enable-ai-btn" || target?.closest?.("#open-settings-enable-ai-btn");
        const isKeyBtn = target?.id === "open-settings-key-btn" || target?.closest?.("#open-settings-key-btn");
        if (isEnableBtn || isKeyBtn) {
          e.preventDefault();
          const chromeObj = typeof chrome !== "undefined" ? chrome : (typeof globalThis !== "undefined" ? globalThis.chrome : null);
          if (isEnableBtn && chromeObj?.storage?.local?.set) {
            try {
              const res = chromeObj.storage.local.set({ chromeAiEnabled: true });
              if (res && typeof res.catch === "function") res.catch(() => {});
            } catch {}
          }
          if (chromeObj?.runtime?.openOptionsPage) {
            chromeObj.runtime.openOptionsPage();
          }
        }
      });
    }
  }

  showError(msg, errorCode = null) {
    this.currentErrorCode = errorCode;
    if (this.errorMessage) this.errorMessage.textContent = msg;
    if (this.errorBanner) this.errorBanner.classList.remove("hidden");

    if (this.errorHint) {
      const hints = {
        no_api_key: t("errorHintNoApiKey"),
        auth_failed: t("errorHintAuthFailed"),
        forbidden: t("errorHintForbidden"),
        model_not_found: t("errorHintModelNotFound"),
        rate_limited: t("errorHintRateLimited"),
        quota_exceeded: t("errorHintQuotaExceeded"),
        network_error: t("errorHintNetwork"),
        server_error: t("errorHintServerError"),
      };
      if (errorCode && hints[errorCode]) {
        this.errorHint.innerHTML = hints[errorCode];
        this.errorHint.classList.remove("hidden");
      } else {
        this.errorHint.classList.add("hidden");
      }
    }
  }

  showWarning(msg) {
    if (this.warningMessage) this.warningMessage.textContent = msg;
    if (this.warningBanner) this.warningBanner.classList.remove("hidden");
  }

  hideWarning() {
    if (this.warningBanner) this.warningBanner.classList.add("hidden");
    if (this.warningMessage) this.warningMessage.textContent = "";
  }

  showDuplicate(msg) {
    if (this.duplicateMessage) this.duplicateMessage.textContent = msg;
    if (this.duplicateBanner) this.duplicateBanner.classList.remove("hidden");
  }

  showSuccess(msg) {
    if (this.successMessage) this.successMessage.textContent = msg;
    if (this.successBanner) this.successBanner.classList.remove("hidden");
  }

  hideSuccess() {
    if (this.successBanner) this.successBanner.classList.add("hidden");
    if (this.successMessage) this.successMessage.textContent = "";
  }

  hideMessages() {
    this.hideWarning();
    if (this.errorBanner) this.errorBanner.classList.add("hidden");
    if (this.errorMessage) this.errorMessage.textContent = "";
    if (this.errorHint) this.errorHint.classList.add("hidden");
    if (this.duplicateBanner) this.duplicateBanner.classList.add("hidden");
    if (this.duplicateMessage) this.duplicateMessage.textContent = "";
    this.currentErrorCode = null;
  }

  hideAll() {
    this.hideMessages();
    this.hideSuccess();
  }

  getWarning() {
    if (this.warningBanner && !this.warningBanner.classList.contains("hidden")) {
      return this.warningMessage?.textContent || "";
    }
    return null;
  }

  getError() {
    if (this.errorBanner && !this.errorBanner.classList.contains("hidden")) {
      return this.errorMessage?.textContent || "";
    }
    return null;
  }

  getErrorCode() {
    if (this.errorBanner && !this.errorBanner.classList.contains("hidden")) {
      return this.currentErrorCode || null;
    }
    return null;
  }

  getDuplicate() {
    if (this.duplicateBanner && !this.duplicateBanner.classList.contains("hidden")) {
      return this.duplicateMessage?.textContent || "";
    }
    return null;
  }

  updateCaptureBanners({ serverOnline, chromeAiConfigured, chromeAiEnabled }) {
    if (serverOnline) {
      this.aiKeyMissingBanner?.classList.add("hidden");
      this.chromeModeTipBanner?.classList.add("hidden");
      return;
    }

    if (chromeAiConfigured) {
      this.aiKeyMissingBanner?.classList.add("hidden");
      this.chromeModeTipBanner?.classList.remove("hidden");
    } else {
      this.chromeModeTipBanner?.classList.add("hidden");
      if (this.aiKeyMissingBanner) {
        this.aiKeyMissingBanner.classList.remove("hidden");
        if (chromeAiEnabled) {
          this.aiKeyMissingBanner.innerHTML = `
            <span class="key-banner-icon">🔑</span>
            <div class="key-banner-content">
              ${t("aiKeyRequiredChrome")}
              <div class="key-banner-actions">
                <button id="open-settings-key-btn" type="button" class="key-banner-link-btn">${_bannersEscapeHtml(t("openSettingsKeyBtn"))}</button>
                <span>${_bannersEscapeHtml(t("orStartObsidian"))} <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener" class="key-banner-link">Obsidian</a></span>
              </div>
            </div>
          `;
        } else {
          this.aiKeyMissingBanner.innerHTML = `
            <span class="key-banner-icon">⚪</span>
            <div class="key-banner-content">
              ${t("obsidianOfflineBanner")}
              <div class="key-banner-actions">
                <button id="open-settings-enable-ai-btn" type="button" class="key-banner-link-btn">${_bannersEscapeHtml(t("enableChromeAiBtn"))}</button>
                <span>${_bannersEscapeHtml(t("orStartObsidian"))} <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener" class="key-banner-link">Obsidian</a></span>
              </div>
            </div>
          `;
        }
      }
    }
  }

  setChromeResultBanner(visible) {
    if (visible) this.chromeResultBanner?.classList.remove("hidden");
    else this.chromeResultBanner?.classList.add("hidden");
  }

  setChromeActionsCard(visible) {
    if (visible) this.chromeActionsCard?.classList.remove("hidden");
    else this.chromeActionsCard?.classList.add("hidden");
  }

  render(session, settings) {
    if (!settings) return;
    const hasResult = Boolean(session?.analysisResult);
    const isChrome = settings.isChromeMode();

    if (hasResult && isChrome) {
      this.setChromeResultBanner(true);
      this.setChromeActionsCard(true);
    } else {
      this.setChromeResultBanner(false);
      this.setChromeActionsCard(false);
    }

    if (!hasResult) {
      this.updateCaptureBanners({
        serverOnline: settings.serverOnline,
        chromeAiConfigured: settings.chromeAiConfigured,
        chromeAiEnabled: settings.chromeAiEnabled,
      });
    } else {
      this.aiKeyMissingBanner?.classList.add("hidden");
      this.chromeModeTipBanner?.classList.add("hidden");
    }
  }
}

const _bannersScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_bannersScope.NutEggUI = _bannersScope.NutEggUI || {};
_bannersScope.NutEggUI.BannersComponent = BannersComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BannersComponent };
}
