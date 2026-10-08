// ============================================================
// NutEgg Popup State — Settings & Environment State
// ============================================================

const DEFAULT_ANALYSIS_SECTIONS = {
  titleVerdict: true,
  coreSummary: true,
  mindMap: true,
  discussion: false,
};

/**
 * Manages user preferences (persisted in chrome.storage.local) and
 * dynamic environment/connection status (Obsidian server & Chrome AI).
 */
class SettingsState {
  constructor() {
    this.DEFAULT_ANALYSIS_SECTIONS = DEFAULT_ANALYSIS_SECTIONS;

    // User preferences
    this.connectionMode = "chrome"; // "chrome" | "obsidian"
    this.analysisMode = "full"; // "full" | "preview"
    this.outputLanguage = "same-as-content";
    this.enabledSections = { ...DEFAULT_ANALYSIS_SECTIONS };
    this.generateKnowledgeEntries = true;
    this.debugInfo = false;
    this.captureRetryCount = 3;
    this.captureRetryDelayMs = 3000;
    this.uiDensity = "compact"; // "compact" | "margin" | "ultra-compact" (also accepts "comfortable" as alias)
    this.chromeCacheTabLimit = 100;

    // Obsidian server status
    this.serverOnline = false;
    this.obsidianPluginVersion = null;
    this.obsidianAiConfigured = false;

    // Chrome AI status
    this.chromeAiEnabled = true;
    this.chromeAiConfigured = false;
    this.chromeAiProvider = "";
    this.chromeAiModel = "";
  }

  /**
   * Load stored settings from chrome.storage.local.
   */
  async loadFromStorage() {
    try {
      const stored = await new Promise((resolve) => {
        chrome.storage?.local?.get?.(
          ["connectionMode", "analysisMode", "cachedMetrics", "enabledSections", "outputLanguage", "generateKnowledgeEntries", "popupDiagnostics", "debugInfo", "captureRetryCount", "captureRetryDelayMs", "uiDensity", "chromeCacheTabLimit"],
          resolve
        );
      });
      this.setConnectionMode(stored?.connectionMode, false);
      if (stored?.analysisMode === "preview" || stored?.analysisMode === "full") {
        this.analysisMode = stored.analysisMode;
      } else if (stored?.analysisMode === "confirm") {
        this.analysisMode = "preview";
      } else if (stored?.analysisMode === "fast") {
        this.analysisMode = "full";
      }
      this.generateKnowledgeEntries = stored?.generateKnowledgeEntries !== false;
      this.debugInfo = stored?.debugInfo === true;
      if (stored?.uiDensity === "comfortable" || stored?.uiDensity === "margin" || stored?.uiDensity === "compact" || stored?.uiDensity === "ultra-compact") {
        this.uiDensity = stored.uiDensity === "comfortable" ? "margin" : stored.uiDensity;
      }
      if (typeof stored?.chromeCacheTabLimit === "number" && stored.chromeCacheTabLimit >= 0) {
        this.chromeCacheTabLimit = Math.min(1000, Math.round(stored.chromeCacheTabLimit));
      }
      this.setCaptureRetries(stored || {});
      if (stored?.enabledSections) {
        this.enabledSections = Object.fromEntries(Object.keys(DEFAULT_ANALYSIS_SECTIONS).map(key => [key, typeof stored.enabledSections[key] === "boolean" ? stored.enabledSections[key] : DEFAULT_ANALYSIS_SECTIONS[key]]));
      }
      if (stored?.outputLanguage) {
        this.outputLanguage = stored.outputLanguage;
      }
      return stored;
    } catch {
      return null;
    }
  }

  setConnectionMode(mode, persist = true) {
    this.connectionMode = mode === "obsidian" ? "obsidian" : "chrome";
    this.setServerStatus();
    this.setChromeAiStatus({ enabled: this.connectionMode === "chrome" });
    if (persist && typeof chrome !== "undefined") {
      chrome.storage?.local?.set?.({ connectionMode: this.connectionMode });
    }
  }

  setAnalysisMode(mode, persist = true) {
    const normalized = mode === "confirm" ? "preview" : mode === "fast" ? "full" : mode;
    if (normalized === "preview" || normalized === "full") {
      this.analysisMode = normalized;
      if (persist && typeof chrome !== "undefined" && chrome.storage?.local?.set) {
        chrome.storage.local.set({ analysisMode: normalized });
      }
    }
  }

  setCaptureRetries(values = {}) {
    const bounded = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value)
      ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
    this.captureRetryCount = bounded(values.captureRetryCount ?? this.captureRetryCount, 3, 0, 10);
    this.captureRetryDelayMs = bounded(values.captureRetryDelayMs ?? this.captureRetryDelayMs, 3000, 100, 10000);
  }

  setOutputLanguage(lang, persist = true) {
    if (typeof lang === "string") {
      this.outputLanguage = lang;
      if (persist && typeof chrome !== "undefined" && chrome.storage?.local?.set) {
        chrome.storage.local.set({ outputLanguage: lang });
      }
    }
  }

  setUiDensity(density, persist = true) {
    if (density === "comfortable" || density === "margin" || density === "compact" || density === "ultra-compact") {
      this.uiDensity = density === "comfortable" ? "margin" : density;
      if (persist && typeof chrome !== "undefined" && chrome.storage?.local?.set) {
        chrome.storage.local.set({ uiDensity: this.uiDensity });
      }
    }
  }

  setChromeCacheTabLimit(limit, persist = true) {
    if (typeof limit === "number" && limit >= 0) {
      this.chromeCacheTabLimit = Math.min(1000, Math.round(limit));
      if (persist && typeof chrome !== "undefined" && chrome.storage?.local?.set) {
        chrome.storage.local.set({ chromeCacheTabLimit: this.chromeCacheTabLimit });
      }
    }
  }

  setGenerateKnowledgeEntries(enabled, persist = true) {
    this.generateKnowledgeEntries = enabled !== false;
    if (persist && typeof chrome !== "undefined") {
      chrome.storage?.local?.set?.({ generateKnowledgeEntries: this.generateKnowledgeEntries });
    }
  }

  setEnabledSections(sections, persist = false) {
    if (sections && typeof sections === "object") {
      this.enabledSections = Object.fromEntries(Object.keys(DEFAULT_ANALYSIS_SECTIONS).map(key => [key, typeof sections[key] === "boolean" ? sections[key] : DEFAULT_ANALYSIS_SECTIONS[key]]));
      if (persist && typeof chrome !== "undefined" && chrome.storage?.local?.set) {
        chrome.storage.local.set({ enabledSections: { ...this.enabledSections } });
      }
    }
  }

  getToggledSections(key, sections = this.enabledSections) {
    const keys = key === "verdictSummary" ? ["titleVerdict", "coreSummary"] : [key];
    if (keys.some(k => !(k in DEFAULT_ANALYSIS_SECTIONS))) return null;
    const nextVal = !keys.every(k => (sections[k] ?? DEFAULT_ANALYSIS_SECTIONS[k]) === true);
    const next = { ...sections, ...Object.fromEntries(keys.map(k => [k, nextVal])) };
    return Object.keys(DEFAULT_ANALYSIS_SECTIONS).some(k => (next[k] ?? DEFAULT_ANALYSIS_SECTIONS[k]) === true) ? next : null;
  }

  async toggleSection(key, persist = true) {
    const next = this.getToggledSections(key);
    if (!next) return false;
    this.enabledSections = next;
    if (persist && typeof chrome !== "undefined" && chrome.storage?.local?.set) {
      await chrome.storage.local.set({ enabledSections: { ...this.enabledSections } });
    }
    return true;
  }

  setServerStatus({ online = false, version = null, aiConfigured = false } = {}) {
    this.serverOnline = !!online;
    this.obsidianPluginVersion = version;
    this.obsidianAiConfigured = !!aiConfigured;
  }

  setChromeAiStatus({ enabled = false, configured = false, provider = "", model = "" } = {}) {
    this.chromeAiEnabled = !!enabled;
    this.chromeAiConfigured = !!configured;
    this.chromeAiProvider = provider || "";
    this.chromeAiModel = model || "";
  }

  /**
   * Existing results retain their backend; new analysis uses the selected mode.
   */
  isChromeMode(resultOrMode, matchedEggsCount = 0) {
    const res = resultOrMode;
    const mode = typeof res === "string" ? res : res?.mode;
    if (mode === "chrome") return true;
    if (mode === "obsidian") return false;
    return this.connectionMode !== "obsidian";
  }
}

const _settingsScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_settingsScope.NutEggState = _settingsScope.NutEggState || {};
_settingsScope.NutEggState.SettingsState = SettingsState;
_settingsScope.NutEggState.DEFAULT_ANALYSIS_SECTIONS = DEFAULT_ANALYSIS_SECTIONS;
_settingsScope.SettingsState = SettingsState;
_settingsScope.DEFAULT_ANALYSIS_SECTIONS = DEFAULT_ANALYSIS_SECTIONS;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SettingsState,
    DEFAULT_ANALYSIS_SECTIONS,
  };
}
