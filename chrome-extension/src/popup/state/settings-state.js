// ============================================================
// NutEgg Popup State — Settings & Environment State
// ============================================================

const DEFAULT_ANALYSIS_SECTIONS = {
  titleVerdict: true,
  coreSummary: true,
  mindMap: true,
};

/**
 * Manages user preferences (persisted in chrome.storage.local) and
 * dynamic environment/connection status (Obsidian server & Chrome AI).
 */
class SettingsState {
  constructor() {
    this.DEFAULT_ANALYSIS_SECTIONS = DEFAULT_ANALYSIS_SECTIONS;

    // User preferences
    this.analysisMode = "fast"; // "fast" | "confirm"
    this.outputLanguage = "same-as-content";
    this.enabledSections = { ...DEFAULT_ANALYSIS_SECTIONS };
    this.generateKnowledgeEntries = true;

    // Obsidian server status
    this.serverOnline = false;
    this.obsidianPluginVersion = null;
    this.obsidianAiConfigured = false;

    // Chrome AI status
    this.chromeAiEnabled = false;
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
          ["analysisMode", "cachedMetrics", "enabledSections", "outputLanguage", "generateKnowledgeEntries", "popupDiagnostics"],
          resolve
        );
      });
      if (stored?.analysisMode === "confirm" || stored?.analysisMode === "fast") {
        this.analysisMode = stored.analysisMode;
      }
      this.generateKnowledgeEntries = stored?.generateKnowledgeEntries !== false;
      if (stored?.enabledSections) {
        this.enabledSections = Object.fromEntries(Object.keys(DEFAULT_ANALYSIS_SECTIONS).map(key => [key, stored.enabledSections[key] !== false]));
      }
      if (stored?.outputLanguage) {
        this.outputLanguage = stored.outputLanguage;
      }
      return stored;
    } catch {
      return null;
    }
  }

  setAnalysisMode(mode, persist = true) {
    if (mode === "confirm" || mode === "fast") {
      this.analysisMode = mode;
      if (persist && typeof chrome !== "undefined" && chrome.storage?.local?.set) {
        chrome.storage.local.set({ analysisMode: mode });
      }
    }
  }

  setOutputLanguage(lang, persist = true) {
    if (typeof lang === "string") {
      this.outputLanguage = lang;
      if (persist && typeof chrome !== "undefined" && chrome.storage?.local?.set) {
        chrome.storage.local.set({ outputLanguage: lang });
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
      this.enabledSections = Object.fromEntries(Object.keys(DEFAULT_ANALYSIS_SECTIONS).map(key => [key, sections[key] !== false]));
      if (persist && typeof chrome !== "undefined" && chrome.storage?.local?.set) {
        chrome.storage.local.set({ enabledSections: { ...this.enabledSections } });
      }
    }
  }

  getToggledSections(key, sections = this.enabledSections) {
    const keys = key === "verdictSummary" ? ["titleVerdict", "coreSummary"] : [key];
    if (keys.some(k => !(k in DEFAULT_ANALYSIS_SECTIONS))) return null;
    const nextVal = !keys.every(k => sections[k] !== false);
    const next = { ...sections, ...Object.fromEntries(keys.map(k => [k, nextVal])) };
    return Object.keys(DEFAULT_ANALYSIS_SECTIONS).some(k => next[k] !== false) ? next : null;
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
   * Determine whether Chrome AI fallback mode is active for analysis or results.
   * Without a result, uses the global server connection status.
   */
  isChromeMode(resultOrMode, matchedEggsCount = 0) {
    const res = resultOrMode;
    const mode = typeof res === "string" ? res : res?.mode;
    if (mode === "chrome") return true;
    if (!this.serverOnline) {
      const eggsCount = matchedEggsCount || (Array.isArray(res?.matchedEggs) ? res.matchedEggs.length : 0);
      return !eggsCount;
    }
    return false;
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

