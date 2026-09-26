// ============================================================
// NutEgg Popup Action — History Action Handler
// ============================================================

function _historyT(key, params) {
  if (typeof t === "function") return t(key, params);
  if (typeof globalThis !== "undefined" && typeof globalThis.t === "function") return globalThis.t(key, params);
  return key;
}

class HistoryAction {
  constructor(deps = {}) {
    this.session = deps.session;
    this.settings = deps.settings;
    this.tabStateManager = deps.tabStateManager;
    this.analysisService = deps.analysisService;
    this.ui = deps.ui || {};
    this.showResultsState = deps.showResultsState || (() => {});
    this.getSaveAction = deps.getSaveAction || (() => null);
  }

  async loadHistoryIfAny(seq = this.session?.refreshSeq, urlOverride = null) {
    const url = urlOverride || this.session?.extractedContent?.url;
    if (!this.settings?.serverOnline || !url) return false;
    try {
      const history = await this.analysisService.loadHistory(url);
      if (seq !== this.session?.refreshSeq) return false;
      if (history?.length) {
        this.session.captureHistory = history;
        this.showHistoryEntry(history[0]);
        this.ui.actionsUI?.setAnalyzeButtonLoading?.(false, _historyT("analyzeAgain"));
        return true;
      }
    } catch {}
    return false;
  }

  showHistoryEntry(entry) {
    const session = this.session;
    const ui = this.ui;
    const tabStateManager = this.tabStateManager;
    const pageHelper = typeof helper !== "undefined" ? helper : globalThis.helper;

    session.cachedProcessedSaved = entry.saved || "analyzed";
    session.nutCollected = session.cachedProcessedSaved === "saved" || session.cachedProcessedSaved === "skip";
    session.eggHatched = session.cachedProcessedSaved === "saved";
    session.currentNutId = entry.nutId ?? null;
    session.analysisResult = entry.result;

    if (entry.result?.stage === "stage1") {
      session.stage1ContentAnalysis = entry.result;
      session.stage1Payload = {
        url: entry.url || session.extractedContent?.url || ui.captureUI?.getPageUrl?.() || "",
        title: entry.title || session.extractedContent?.title || ui.captureUI?.getPageTitle?.() || "",
        content: entry.content || session.extractedContent?.content || "",
        sourceType: entry.sourceType || session.extractedContent?.sourceType || "generic",
        metadata: session.extractedContent?.metadata,
        nutId: entry.nutId,
      };
    } else {
      session.stage1ContentAnalysis = null;
      session.stage1Payload = null;
    }

    if (entry.content) {
      session.extractedContent = {
        url: entry.url || ui.captureUI?.getPageUrl?.() || "",
        title: entry.title || ui.captureUI?.getPageTitle?.() || "",
        content: entry.content,
        sourceType: entry.sourceType || "webpage",
        metadata: {
          ...(entry.author ? { author: entry.author } : {}),
          ...(entry.publishedAt ? { published: entry.publishedAt } : {}),
        },
      };
      ui.captureUI?.setPreviewText?.(entry.content);
    }

    if (session.activeTabId && tabStateManager) {
      const existing = tabStateManager.get(session.activeTabId) || {};
      tabStateManager.set(session.activeTabId, {
        ...existing,
        status: "done",
        extractedContent: existing.extractedContent || session.extractedContent,
        analysisResult: entry.result,
        currentNutId: entry.nutId,
        eggHatched: session.eggHatched,
        nutCollected: session.nutCollected,
        stage1Payload: (session.isStage1(entry.result) ? session.stage1Payload : null),
        stage1ContentAnalysis: (session.isStage1(entry.result) ? session.stage1ContentAnalysis : null),
      });
    }

    const live = pageHelper?.provenanceFromExtraction ? pageHelper.provenanceFromExtraction(session.extractedContent) : null;
    this.showResultsState(entry.result, {
      title: entry.title || live?.title || "",
      author: entry.author || live?.author || "",
      publishedAt: entry.publishedAt || live?.publishedAt || "",
    });

    this.getSaveAction()?.updateActionButtons?.();

    const when = new Date(entry.capturedAt).toLocaleString();
    const stateLabel = entry.saved === "saved"
      ? _historyT("stateSaved") : entry.saved === "skip" ? _historyT("stateCollected") : _historyT("stateAnalyzed");
    ui.actionsUI?.showProcessedNote?.(_historyT("capturedWhenStored", { when, state: stateLabel }));
    ui.actionsUI?.renderHistory?.(session.captureHistory, entry.nutId);
  }

  onHistorySelected(selectedIndex) {
    const idx = typeof selectedIndex === "number" ? selectedIndex : parseInt(selectedIndex, 10);
    const entry = this.session?.captureHistory?.[idx];
    if (entry) {
      this.showHistoryEntry(entry);
    }
  }
}

const _historyActionScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_historyActionScope.NutEggActions = _historyActionScope.NutEggActions || {};
_historyActionScope.NutEggActions.HistoryAction = HistoryAction;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { HistoryAction };
}

