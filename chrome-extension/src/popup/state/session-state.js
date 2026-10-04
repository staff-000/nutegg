// ============================================================
// NutEgg Popup State — Active Tab Session State
// ============================================================

/**
 * Manages the transient, active tab session state within the side panel,
 * including extracted content, analysis results, egg selection sets,
 * and current nut/capture tracking.
 */
class SessionState {
  constructor() {
    this.activeTabId = null;
    this.currentTabLoading = false;
    this.extractedContent = null;
    this.analysisResult = null;
    this.viewingContent = false;
    this.currentNutId = null;
    this.isReanalyzing = false;
    /** How the shown result was saved previously: "saved" | "skip" | "analyzed" | null */
    this.cachedProcessedSaved = null;
    /** Follow-up questions asked after the result was shown (this session) */
    this.followUpQa = [];
    /** Save-state of the shown result this session */
    this.nutCollected = false;
    this.eggHatched = false;
    /** Capture history for the current URL (newest first) */
    this.captureHistory = [];
    /** Stage 1 payload and analysis when in confirm mode */
    this.stage1Payload = null;
    this.stage1ContentAnalysis = null;
    /** All eggs from _index.md (for the manual egg picker) */
    this.allEggs = [];
    /** The user's checkbox selection in the egg picker */
    this.selectedEggs = new Set();
    /** Pre-selected eggs on the capture screen (before analyze) */
    this.preSelectedEggs = new Set();
    /** Active tab in the egg selection UI ("existing" | "new") */
    this.activeEggTab = null;
    /** Question scopes: "within" | "beyond" */
    this.customQuestionsScope = "within";
    this.followupScope = "within";
    /** Per-tab enabled analysis sections */
    this.enabledSections = null;
    this.generateKnowledgeEntries = true;

    // Operation sequence and transient flags
    this.refreshSeq = 0;
    this.lastLoadWasLoading = false;
    this.extractionFailed = false;
    this.extractionPending = false;
  }

  /**
   * Reset active tab session to empty initial values.
   */
  reset() {
    this.generateKnowledgeEntries = true;
    this.extractedContent = null;
    this.analysisResult = null;
    this.viewingContent = false;
    this.currentNutId = null;
    this.isReanalyzing = false;
    this.cachedProcessedSaved = null;
    this.followUpQa = [];
    this.nutCollected = false;
    this.eggHatched = false;
    this.captureHistory = [];
    this.stage1Payload = null;
    this.stage1ContentAnalysis = null;
    this.activeEggTab = null;
    this.customQuestionsScope = "within";
    this.followupScope = "within";
    this.selectedEggs.clear();
    this.preSelectedEggs.clear();
    this.lastLoadWasLoading = false;
    this.extractionFailed = false;
    this.extractionPending = false;
  }

  /**
   * Snapshot active tab session for tabStateManager.
   * @param {Object} [extra] - Additional context to include in snapshot (e.g. customQuestions, analysisMode).
   */
  snapshot(extra = {}) {
    return {
      generateKnowledgeEntries: this.generateKnowledgeEntries,
      extractedContent: this.extractedContent,
      analysisResult: this.analysisResult,
      viewingContent: this.viewingContent,
      captureHistory: [...this.captureHistory],
      currentNutId: this.currentNutId,
      stage1Payload: this.stage1Payload,
      stage1ContentAnalysis: this.stage1ContentAnalysis,
      eggHatched: this.eggHatched,
      nutCollected: this.nutCollected,
      cachedProcessedSaved: this.cachedProcessedSaved,
      followUpQa: [...this.followUpQa],
      selectedEggs: new Set(this.selectedEggs),
      preSelectedEggs: new Set(this.preSelectedEggs),
      activeEggTab: this.activeEggTab,
      customQuestionsScope: this.customQuestionsScope || "within",
      followupScope: this.followupScope || "within",
      enabledSections: this.enabledSections
        ? { ...this.enabledSections }
        : (extra.enabledSections ? { ...extra.enabledSections } : null),
      extractionFailed: !!this.extractionFailed,
      ...extra,
    };
  }

  /**
   * Restore active tab session from cached state.
   */
  restore(restored = {}) {
    this.extractedContent = restored.extractedContent || null;
    this.analysisResult = restored.analysisResult || null;
    this.generateKnowledgeEntries = (restored.generateKnowledgeEntries ?? restored.analysisResult?.generateKnowledgeEntries) !== false;
    this.viewingContent = Boolean(this.analysisResult && restored.viewingContent);
    this.captureHistory = Array.isArray(restored.captureHistory) ? [...restored.captureHistory] : [];
    this.currentNutId = restored.currentNutId || (this.captureHistory[0]?.nutId ?? null);
    this.stage1Payload = restored.stage1Payload || null;
    this.stage1ContentAnalysis = restored.stage1ContentAnalysis || null;
    this.followUpQa = Array.isArray(restored.followUpQa) ? [...restored.followUpQa] : [];
    this.eggHatched = !!restored.eggHatched;
    this.nutCollected = !!restored.nutCollected;
    this.cachedProcessedSaved = restored.cachedProcessedSaved || null;
    this.activeEggTab = restored.activeEggTab || null;
    this.customQuestionsScope = restored.customQuestionsScope || "within";
    this.followupScope = restored.followupScope || "within";
    this.extractionFailed = !!restored.extractionFailed;
    this.enabledSections = restored.enabledSections ? { ...restored.enabledSections } : null;

    if (restored.selectedEggs instanceof Set) {
      this.selectedEggs = new Set(restored.selectedEggs);
    } else {
      this.selectedEggs = new Set(restored.selectedEggs || (restored.analysisResult?.matchedEggs || []));
    }

    if (restored.preSelectedEggs instanceof Set) {
      this.preSelectedEggs = new Set(restored.preSelectedEggs);
    } else {
      this.preSelectedEggs = new Set(restored.preSelectedEggs || []);
    }
  }

  nextRefreshSeq() {
    return ++this.refreshSeq;
  }

  // --- Egg Selection Helpers ---

  selectEgg(slug) {
    if (slug) this.selectedEggs.add(slug);
  }

  unselectEgg(slug) {
    if (slug) this.selectedEggs.delete(slug);
  }

  toggleEgg(slug) {
    if (!slug) return false;
    if (this.selectedEggs.has(slug)) {
      this.selectedEggs.delete(slug);
      return false;
    } else {
      this.selectedEggs.add(slug);
      return true;
    }
  }

  isEggSelected(slug) {
    return this.selectedEggs.has(slug);
  }

  clearSelectedEggs() {
    this.selectedEggs.clear();
  }

  preSelectEgg(slug) {
    if (slug) this.preSelectedEggs.add(slug);
  }

  unpreSelectEgg(slug) {
    if (slug) this.preSelectedEggs.delete(slug);
  }

  isEggPreSelected(slug) {
    return this.preSelectedEggs.has(slug);
  }

  clearPreSelectedEggs() {
    this.preSelectedEggs.clear();
  }

  addFollowUpQa(questionOrItem, answer, sources) {
    if (typeof questionOrItem === "object" && questionOrItem !== null) {
      this.followUpQa.push(questionOrItem);
    } else if (questionOrItem) {
      this.followUpQa.push({ question: questionOrItem, answer, sources });
    }
  }

  /**
   * Determine whether the active session result (or a passed result) represents Stage 1.
   * True if stage is explicitly "stage1", or if running in Chrome AI mode.
   * @param {Object} [result] - Optional result to check; defaults to this.analysisResult.
   * @returns {boolean}
   */
  isStage1(result = this.analysisResult) {
    const res = result || this.analysisResult;
    if (!res) return false;
    if (res.stage === "stage1" || res.mode === "chrome") return true;
    if (typeof settings !== "undefined" && settings.isChromeMode?.(res)) return true;
    return false;
  }
}

const _sessionScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_sessionScope.NutEggState = _sessionScope.NutEggState || {};
_sessionScope.NutEggState.SessionState = SessionState;
_sessionScope.SessionState = SessionState;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SessionState,
  };
}
