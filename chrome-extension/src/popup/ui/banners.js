// ============================================================
// NutEgg Popup UI — Message Banners Component
// ============================================================

const _bannersT = (key, params) => {
  if (typeof t === "function") return t(key, params);
  if (typeof window !== "undefined" && window.NutEggI18n) return window.NutEggI18n.t(key, params);
  return key;
};

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
    this.warningBanner = root.getElementById("warning-banner");
    this.warningMessage = root.getElementById("warning-message");
    this.errorBanner = root.getElementById("error-banner");
    this.errorMessage = root.getElementById("error-message");
    this.errorHint = root.getElementById("error-hint");
    this.duplicateBanner = root.getElementById("duplicate-banner");
    this.duplicateMessage = root.getElementById("duplicate-message");
    this.successBanner = root.getElementById("success-banner");
    this.successMessage = root.getElementById("success-message");
    this.aiKeyMissingBanner = root.getElementById("ai-key-missing-banner");
    this.openSettingsKeyBtn = root.getElementById("open-settings-key-btn");
    this.chromeModeTipBanner = root.getElementById("chrome-mode-tip-banner");
    this.chromeResultBanner = root.getElementById("chrome-result-banner");
    this.chromeActionsCard = root.getElementById("chrome-actions-card");
    this.errorReportBug = root.getElementById("error-report-bug");
  }

  showError(msg, errorCode = null) {
    if (this.errorMessage) this.errorMessage.textContent = msg;
    if (this.errorBanner) this.errorBanner.classList.remove("hidden");

    if (this.errorHint) {
      const hints = {
        no_api_key: _bannersT("errorHintNoApiKey"),
        auth_failed: _bannersT("errorHintAuthFailed"),
        forbidden: _bannersT("errorHintForbidden"),
        model_not_found: _bannersT("errorHintModelNotFound"),
        rate_limited: _bannersT("errorHintRateLimited"),
        quota_exceeded: _bannersT("errorHintQuotaExceeded"),
        network_error: _bannersT("errorHintNetwork"),
        server_error: _bannersT("errorHintServerError"),
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
    if (this.errorBanner) this.errorBanner.classList.add("hidden");
    if (this.errorHint) this.errorHint.classList.add("hidden");
    if (this.duplicateBanner) this.duplicateBanner.classList.add("hidden");
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
              ${_bannersT("aiKeyRequiredChrome")}
              <div class="key-banner-actions">
                <button id="open-settings-key-btn" type="button" class="key-banner-link-btn">${_bannersEscapeHtml(_bannersT("openSettingsKeyBtn"))}</button>
                <span>${_bannersEscapeHtml(_bannersT("orStartObsidian"))} <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener" class="key-banner-link">Obsidian</a></span>
              </div>
            </div>
          `;
        } else {
          this.aiKeyMissingBanner.innerHTML = `
            <span class="key-banner-icon">⚪</span>
            <div class="key-banner-content">
              ${_bannersT("obsidianOfflineBanner")}
              <div class="key-banner-actions">
                <button id="open-settings-enable-ai-btn" type="button" class="key-banner-link-btn">${_bannersEscapeHtml(_bannersT("enableChromeAiBtn"))}</button>
                <span>${_bannersEscapeHtml(_bannersT("orStartObsidian"))} <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener" class="key-banner-link">Obsidian</a></span>
              </div>
            </div>
          `;
        }
      }
    }
  }
}

const _bannersScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_bannersScope.NutEggUI = _bannersScope.NutEggUI || {};
_bannersScope.NutEggUI.BannersComponent = BannersComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BannersComponent };
}
