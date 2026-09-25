// ============================================================
// NutEgg Popup State — Tab State Manager
// ============================================================

/**
 * Manages per-tab state caching, extraction sequence tracking, and
 * active tab hydration when switching tabs in the Chrome side panel.
 */
class TabStateManager {
  constructor() {
    /** @type {Map<number, any>} Per-tab cache of extraction/analysis results. */
    this.cache = new Map();
    /** @type {Map<number, number>} Per-tab extraction sequence numbers. */
    this.extractSeq = new Map();
    /** @type {Set<number>} Tab IDs currently executing an extraction. */
    this.extracting = new Set();
    /** @type {number | null} Currently active tab ID. */
    this.activeTabId = null;
    /** @type {boolean} True when the current active tab is loading. */
    this.currentTabLoading = false;
  }

  // --- Map-compatible interface for backward compatibility ---

  get(tabId) {
    return this.cache.get(tabId);
  }

  set(tabId, value) {
    this.cache.set(tabId, value);
    return this;
  }

  has(tabId) {
    return this.cache.has(tabId);
  }

  delete(tabId) {
    this.invalidateTab(tabId);
    return true;
  }

  clear() {
    this.cache.clear();
    this.extractSeq.clear();
    this.extracting.clear();
    this.activeTabId = null;
    this.currentTabLoading = false;
  }

  get size() {
    return this.cache.size;
  }

  // --- Active Tab State ---

  getActiveTabId() {
    return this.activeTabId;
  }

  setActiveTabId(tabId) {
    this.activeTabId = tabId != null ? Number(tabId) : null;
  }

  isCurrentTabLoading() {
    return this.currentTabLoading;
  }

  setCurrentTabLoading(isLoading) {
    this.currentTabLoading = !!isLoading;
  }

  // --- Extraction Sequences & Status ---

  nextExtractSeq(tabId) {
    const next = (this.extractSeq.get(tabId) || 0) + 1;
    this.extractSeq.set(tabId, next);
    return next;
  }

  getExtractSeq(tabId) {
    return this.extractSeq.get(tabId) || 0;
  }

  isExtractSeqCurrent(tabId, seq) {
    return this.extractSeq.get(tabId) === seq;
  }

  isExtracting(tabId) {
    return this.extracting.has(tabId);
  }

  setExtracting(tabId, isExtracting) {
    if (isExtracting) {
      this.extracting.add(tabId);
    } else {
      this.extracting.delete(tabId);
    }
  }

  // --- Tab Status ---

  getStatus(tabId) {
    return this.cache.get(tabId)?.status || null;
  }

  setStatus(tabId, status, extra = {}) {
    if (!tabId) return;
    const existing = this.cache.get(tabId) || {};
    this.cache.set(tabId, { ...existing, ...extra, status });
  }

  isAnalyzing(tabId) {
    const status = this.getStatus(tabId);
    return status === "analyzing" || status === "hatching";
  }

  // --- Tab Snapshot & Hydration ---

  /**
   * Save the active session state into the tab cache.
   * Handles converting Sets (selectedEggs, preSelectedEggs) to arrays.
   */
  saveActiveTabState(tabId, state = {}) {
    if (!tabId) return null;
    const prev = this.cache.get(tabId) || {};
    const entry = {
      ...prev,
      ...state,
      selectedEggs: state.selectedEggs instanceof Set
        ? Array.from(state.selectedEggs)
        : (state.selectedEggs || prev.selectedEggs || []),
      preSelectedEggs: state.preSelectedEggs instanceof Set
        ? Array.from(state.preSelectedEggs)
        : (state.preSelectedEggs || prev.preSelectedEggs || []),
      captureHistory: state.captureHistory
        ? [...state.captureHistory]
        : (prev.captureHistory || []),
      followUpQa: state.followUpQa
        ? [...state.followUpQa]
        : (prev.followUpQa || []),
    };
    this.cache.set(tabId, entry);
    return entry;
  }

  /**
   * Hydrate tab state from cache, reconstructing Sets.
   */
  restoreTabState(tabId) {
    if (!tabId) return null;
    const cached = this.cache.get(tabId);
    if (!cached) return null;
    return {
      ...cached,
      selectedEggs: new Set(cached.selectedEggs || (cached.analysisResult?.matchedEggs || [])),
      preSelectedEggs: new Set(cached.preSelectedEggs || []),
      captureHistory: cached.captureHistory ? [...cached.captureHistory] : [],
      followUpQa: cached.followUpQa ? [...cached.followUpQa] : [],
    };
  }

  /**
   * Invalidate a tab completely (called on URL navigation or tab close).
   */
  invalidateTab(tabId) {
    if (!tabId) return;
    this.cache.delete(tabId);
    this.extractSeq.delete(tabId);
    this.extracting.delete(tabId);
  }
}

const _tabStateScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_tabStateScope.NutEggTabState = {
  TabStateManager,
};
_tabStateScope.TabStateManager = TabStateManager;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    TabStateManager,
  };
}


