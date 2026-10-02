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

  // --- Tab Status & Errors ---

  getStatus(tabId) {
    return this.cache.get(tabId)?.status || null;
  }

  setStatus(tabId, status, extra = {}) {
    if (!tabId) return;
    const existing = this.cache.get(tabId) || {};
    this.cache.set(tabId, { ...existing, ...extra, status });
  }

  setError(tabId, error, errorCode = null) {
    if (!tabId) return;
    const existing = this.cache.get(tabId) || {};
    this.cache.set(tabId, {
      ...existing,
      status: "error",
      error: typeof error === "string" ? error : (error?.message || "Unknown error"),
      errorCode: errorCode || error?.code || null,
    });
  }

  clearError(tabId) {
    if (!tabId) return;
    const existing = this.cache.get(tabId);
    if (existing) {
      delete existing.error;
      delete existing.errorCode;
      if (existing.status === "error") {
        existing.status = existing.analysisResult ? "done" : "idle";
      }
    }
  }

  getError(tabId) {
    const entry = this.cache.get(tabId);
    return entry?.error ? { message: entry.error, code: entry.errorCode } : null;
  }

  setWarning(tabId, warning) {
    if (!tabId) return;
    const existing = this.cache.get(tabId) || {};
    this.cache.set(tabId, {
      ...existing,
      warning: typeof warning === "string" ? warning : (warning?.message || null),
    });
  }

  clearWarning(tabId) {
    if (!tabId) return;
    const existing = this.cache.get(tabId);
    if (existing) {
      delete existing.warning;
    }
  }

  getWarning(tabId) {
    return this.cache.get(tabId)?.warning || null;
  }

  isAnalyzing(tabId) {
    const status = this.getStatus(tabId);
    return status === "analyzing" || status === "hatching";
  }

  // --- Tab Snapshot & Hydration ---

  /**
   * Save the active session state into the tab cache.
   * Performs smart non-destructive merging so transient null/empty values
   * during loading or tab switching do not wipe out valid cached analysis.
   */
  saveActiveTabState(tabId, state = {}) {
    if (!tabId) return null;
    const prev = this.cache.get(tabId) || {};

    // Smart non-destructive preservation for critical fields
    const extractedContent = state.extractedContent != null ? state.extractedContent : prev.extractedContent;
    const analysisResult = state.analysisResult != null ? state.analysisResult : prev.analysisResult;
    const stage1Payload = state.stage1Payload != null ? state.stage1Payload : prev.stage1Payload;
    const stage1ContentAnalysis = state.stage1ContentAnalysis != null ? state.stage1ContentAnalysis : prev.stage1ContentAnalysis;
    const currentNutId = state.currentNutId != null ? state.currentNutId : prev.currentNutId;
    const status = state.status || prev.status || (analysisResult ? "done" : (extractedContent ? "idle" : null));
    const warning = state.warning !== undefined ? state.warning : prev.warning;
    const error = state.error !== undefined ? state.error : prev.error;
    const errorCode = state.errorCode !== undefined ? state.errorCode : prev.errorCode;
    const duplicate = state.duplicate !== undefined ? state.duplicate : prev.duplicate;
    const extractionFailed = state.extractionFailed !== undefined ? state.extractionFailed : prev.extractionFailed;
    const enabledSections = state.enabledSections != null
      ? (typeof state.enabledSections === "object" ? { ...state.enabledSections } : state.enabledSections)
      : (prev.enabledSections ? { ...prev.enabledSections } : null);

    const entry = {
      ...prev,
      ...state,
      extractedContent,
      analysisResult,
      stage1Payload,
      stage1ContentAnalysis,
      currentNutId,
      status,
      warning: warning || null,
      error: error || null,
      errorCode: errorCode || null,
      duplicate: duplicate || null,
      extractionFailed: !!extractionFailed,
      enabledSections,
      selectedEggs: state.selectedEggs instanceof Set
        ? Array.from(state.selectedEggs)
        : (state.selectedEggs || prev.selectedEggs || []),
      preSelectedEggs: state.preSelectedEggs instanceof Set
        ? Array.from(state.preSelectedEggs)
        : (state.preSelectedEggs || prev.preSelectedEggs || []),
      captureHistory: Array.isArray(state.captureHistory) && state.captureHistory.length > 0
        ? [...state.captureHistory]
        : (prev.captureHistory || []),
      followUpQa: state.followUpQa
        ? [...state.followUpQa]
        : (prev.followUpQa || []),
      customQuestionsScope: state.customQuestionsScope || prev.customQuestionsScope || "within",
      followupScope: state.followupScope || prev.followupScope || "within",
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
      warning: cached.warning || null,
      error: cached.error || null,
      errorCode: cached.errorCode || null,
      duplicate: cached.duplicate || null,
      extractionFailed: !!cached.extractionFailed,
      enabledSections: cached.enabledSections ? { ...cached.enabledSections } : null,
      customQuestionsScope: cached.customQuestionsScope || "within",
      followupScope: cached.followupScope || "within",
      selectedEggs: new Set(cached.selectedEggs || (cached.analysisResult?.matchedEggs || [])),
      preSelectedEggs: new Set(cached.preSelectedEggs || []),
      captureHistory: cached.captureHistory ? [...cached.captureHistory] : [],
      followUpQa: cached.followUpQa ? [...cached.followUpQa] : [],
    };
  }

  /**
   * Atomically snapshot the departing tab and switch activeTabId to newTabId.
   * Returns { fromTabId, toTabId, targetState }.
   */
  switchActiveTab(toTabId, departingState = null) {
    const fromTabId = this.activeTabId;
    if (fromTabId && fromTabId !== toTabId && departingState) {
      this.saveActiveTabState(fromTabId, departingState);
    }
    this.setActiveTabId(toTabId);
    return {
      fromTabId,
      toTabId,
      targetState: toTabId ? this.restoreTabState(toTabId) : null,
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
_tabStateScope.NutEggState = _tabStateScope.NutEggState || {};
_tabStateScope.NutEggState.TabStateManager = TabStateManager;
_tabStateScope.TabStateManager = TabStateManager;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    TabStateManager,
  };
}


