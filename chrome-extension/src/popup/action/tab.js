// ============================================================
// NutEgg Popup Action — Tab Action Handler
// ============================================================

function _tabT(key, params) {
  if (typeof t === "function") return t(key, params);
  if (typeof globalThis !== "undefined" && typeof globalThis.t === "function") return globalThis.t(key, params);
  return key;
}

class TabAction {
  constructor(deps = {}) {
    this.session = deps.session;
    this.settings = deps.settings;
    this.tabStateManager = deps.tabStateManager;
    this.pageExtractor = deps.pageExtractor;
    this.envService = deps.envService;
    this.ui = deps.ui || {};
    this.getHistoryAction = deps.getHistoryAction || (() => null);
    this.getAnalyzeAction = deps.getAnalyzeAction || (() => null);
    this.showCaptureState = deps.showCaptureState || (() => {});
    this.showResultsState = deps.showResultsState || (() => {});
  }

  getActiveTabSnapshot() {
    return this.session.snapshot({
      customQuestions: this.ui.captureUI?.getCustomQuestions?.() || "",
      analysisMode: this.settings?.analysisMode,
    });
  }

  saveActiveTabState(tabId) {
    if (!tabId || !this.tabStateManager) return;
    this.tabStateManager.saveActiveTabState(tabId, this.getActiveTabSnapshot());
  }

  async fetchEggs() {
    try {
      const response = await chrome.runtime.sendMessage({ action: "get-eggs" });
      const eggs = response?.eggs || [];
      if (this.session) this.session.allEggs = eggs;
      if (this.ui.eggsUI) {
        this.ui.eggsUI.renderCaptureList({
          allEggs: eggs,
          selectedEggs: this.session?.preSelectedEggs,
          onSelectChange: (selected) => {
            this.session.preSelectedEggs = selected;
            this.ui.eggsUI.updateCaptureLabel(selected);
          },
        });
      }
      return eggs;
    } catch {
      return [];
    }
  }

  async refreshForCurrentTab(forceExtract = false) {
    const session = this.session;
    const settings = this.settings;
    const tabStateManager = this.tabStateManager;
    const ui = this.ui;
    const analyzeAction = this.getAnalyzeAction();
    const historyAction = this.getHistoryAction();

    const seq = session.nextRefreshSeq();
    ui.captureUI?.setCustomQuestions?.("");
    ui.qaUI?.clearFollowup?.();
    session.reset();
    ui.eggsUI?.updateCaptureLabel?.(session.preSelectedEggs);
    ui.actionsUI?.hideProcessedNote?.();
    ui.actionsUI?.renderHistory?.([]);
    ui.captureUI?.setLoading?.(_tabT("loadingContent"));
    analyzeAction?.updateAnalyzeButtonsState?.();
    this.showCaptureState();

    let tabUrl = "";
    let targetTabId = session.activeTabId;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id != null) {
        session.activeTabId = tab.id;
        targetTabId = tab.id;
        tabStateManager.setActiveTabId(tab.id);
        if (forceExtract) {
          tabStateManager.invalidateTab(tab.id);
        }
      }
      if (tab?.status === "loading") {
        session.currentTabLoading = true;
        tabStateManager.setCurrentTabLoading(true);
      } else {
        session.currentTabLoading = false;
        tabStateManager.setCurrentTabLoading(false);
      }
      if (tab?.url) {
        tabUrl = tab.url;
        const pageHelper = typeof helper !== "undefined" ? helper : globalThis.helper;
        ui.captureUI?.setPageInfo?.({
          title: tab.title || _tabT("loading"),
          url: tab.url,
          sourceType: pageHelper?.detectPageTypeFromUrl ? pageHelper.detectPageTypeFromUrl(tab.url) : "webpage",
        });
      }
    } catch {}

    analyzeAction?.updateAnalyzeButtonsState?.();
    if (seq !== session.refreshSeq) return;

    await this.envService?.checkServerStatus?.(() => {
      analyzeAction?.updateAnalyzeButtonsState?.();
    });
    if (seq !== session.refreshSeq) return;

    const serverTasks = settings?.serverOnline
      ? Promise.all([
          this.envService.checkConfigStatus(),
          this.envService.fetchMetrics(),
          this.fetchEggs(),
        ])
      : null;

    if (!forceExtract && settings?.serverOnline && tabUrl && historyAction) {
      const captured = await historyAction.loadHistoryIfAny(seq, tabUrl);
      if (seq !== session.refreshSeq) return;
      if (captured) {
        if (serverTasks) await serverTasks;
        analyzeAction?.updateAnalyzeButtonsState?.();
        return;
      }
    }

    this.showCaptureState();
    await this.extractPageContent(seq, targetTabId || session.activeTabId);
    if (seq !== session.refreshSeq) return;

    if (settings?.serverOnline) {
      if (serverTasks) await serverTasks;
      if (seq !== session.refreshSeq) return;
      analyzeAction?.updateAnalyzeButtonsState?.();
      if (session.extractedContent?.url && session.extractedContent.url !== tabUrl && historyAction) {
        await historyAction.loadHistoryIfAny(seq, session.extractedContent.url);
      }
    }
  }

  async extractPageContent(seq = this.session?.refreshSeq, targetTabId = null) {
    const session = this.session;
    const tabStateManager = this.tabStateManager;
    const ui = this.ui;
    const pageExtractor = this.pageExtractor;
    const analyzeAction = this.getAnalyzeAction();

    let tabId, tabTitle, tabUrl, tabStatus;
    if (targetTabId) {
      try {
        const tab = await chrome.tabs.get(targetTabId);
        tabId = tab.id;
        tabTitle = tab.title;
        tabUrl = tab.url;
        tabStatus = tab.status;
      } catch {
        return null;
      }
    } else {
      const currentActiveId = session.activeTabId;
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          tabId = tab.id;
          tabTitle = tab.title;
          tabUrl = tab.url;
          tabStatus = tab.status;
        }
      } catch {
        return null;
      }
      if (currentActiveId && tabId !== currentActiveId) {
        return null;
      }
    }

    if (!tabId) {
      if (!targetTabId || targetTabId === session.activeTabId) {
        ui.captureUI?.setPageInfo?.({ title: _tabT("unknownPage") });
      }
      return null;
    }

    const isBackground = tabId !== session.activeTabId;
    const isTargetActive = !isBackground;

    if (isBackground && tabStatus !== "complete") {
      return null;
    }

    const tabSeq = tabStateManager.nextExtractSeq(tabId);
    tabStateManager.setExtracting(tabId, true);

    if (isTargetActive) {
      session.extractionFailed = false;
      session.lastLoadWasLoading = false;
      session.extractionPending = true;
      ui.captureUI?.setRefreshDisabled?.(false);
      ui.captureUI?.setLoading?.(_tabT("retrievingPageContent"));
      const pageHelper = typeof helper !== "undefined" ? helper : globalThis.helper;
      ui.captureUI?.setPageInfo?.({
        title: tabTitle || _tabT("retrieving"),
        url: tabUrl || "",
        sourceType: pageHelper?.detectPageTypeFromUrl ? pageHelper.detectPageTypeFromUrl(tabUrl || "") : "webpage",
      });
      analyzeAction?.updateAnalyzeButtonsState?.();
    }

    const isCancelled = () => !tabStateManager.isExtractSeqCurrent(tabId, tabSeq);

    try {
      if (tabStatus === "loading" && isTargetActive) {
        session.lastLoadWasLoading = true;
        session.currentTabLoading = true;
        analyzeAction?.updateAnalyzeButtonsState?.();
        await pageExtractor.waitForTabComplete(tabId, 6000);
        if (isCancelled()) return null;
        try {
          const refreshedTab = await chrome.tabs.get(tabId);
          tabTitle = refreshedTab.title || tabTitle;
          tabUrl = refreshedTab.url || tabUrl;
          if (session.activeTabId === tabId) {
            ui.captureUI?.setPageInfo?.({
              title: tabTitle || ui.captureUI.getPageTitle(),
              url: tabUrl || ui.captureUI.getPageUrl(),
            });
          }
        } catch {}
        await pageExtractor.waitForPageSettle(tabId, isCancelled);
        if (isCancelled()) return null;
        if (session.activeTabId === tabId) {
          session.currentTabLoading = false;
        }
      }

      const content = await pageExtractor.extractPage(tabId, { isCancelled });
      if (isCancelled()) return null;

      if (!content) {
        if (session.activeTabId === tabId) session.extractionFailed = true;
      } else {
        const cached = tabStateManager.get(tabId) || {};
        tabStateManager.set(tabId, {
          ...cached,
          url: content.url || tabUrl || cached.url,
          extractedContent: content,
        });

        if (session.activeTabId === tabId) {
          session.extractedContent = content;
          session.currentTabLoading = false;
          ui.captureUI?.setPageInfo?.({
            title: content.title || tabTitle || "Untitled",
            sourceType: content.sourceType || ui.captureUI.getPageType(),
          });
          ui.captureUI?.setPreviewText?.(content.content || "(No content extracted)");
          ui.captureUI?.showProvenance?.(content.metadata || {});
          analyzeAction?.applyTranscriptBlock?.();
          analyzeAction?.updateAnalyzeButtonsState?.();
        }

        return content;
      }
    } catch (err) {
      if (session.activeTabId === tabId) {
        console.error("[NutEgg] Extraction error:", err);
        session.extractionFailed = true;
      }
    } finally {
      tabStateManager.setExtracting(tabId, false);
      if (session.activeTabId === tabId && tabStateManager.isExtractSeqCurrent(tabId, tabSeq)) {
        session.extractionPending = false;
        ui.captureUI?.setRefreshDisabled?.(false);
        analyzeAction?.updateAnalyzeButtonsState?.();
      }
    }

    if (session.activeTabId === tabId && tabStateManager.isExtractSeqCurrent(tabId, tabSeq)) {
      if (session.extractionFailed && !session.extractedContent) {
        ui.captureUI?.setError?.(_tabT("couldNotExtractContent"));
        ui.bannersUI?.showWarning?.(_tabT("couldNotExtractRestricted"));
      }
      analyzeAction?.applyTranscriptBlock?.();
      analyzeAction?.updateAnalyzeButtonsState?.();
    }
    return null;
  }

  async restoreFromTabCache(tabId, cached) {
    const session = this.session;
    const settings = this.settings;
    const tabStateManager = this.tabStateManager;
    const ui = this.ui;
    const analyzeAction = this.getAnalyzeAction();
    const pageHelper = typeof helper !== "undefined" ? helper : globalThis.helper;

    session.nextRefreshSeq();
    session.activeTabId = tabId;
    const restored = tabStateManager.restoreTabState(tabId) || cached;
    session.restore(restored);
    ui.eggsUI?.updateCaptureLabel?.(session.preSelectedEggs);
    ui.captureUI?.setCustomQuestions?.(restored.customQuestions || "");
    ui.qaUI?.clearFollowup?.();
    session.currentTabLoading = false;

    if (restored.analysisMode && analyzeAction?.setAnalysisMode) {
      analyzeAction.setAnalysisMode(restored.analysisMode);
    }

    ui.captureUI?.render?.(session, settings);

    if (cached.status === "error" || cached.error) {
      if (session.analysisResult) {
        this.showResultsState(session.analysisResult, pageHelper?.provenanceFromExtraction?.(session.extractedContent));
      } else {
        this.showCaptureState();
        if (session.extractedContent) {
          ui.captureUI?.setPreviewText?.(session.extractedContent.content || _tabT("noContentExtracted"));
        }
      }
      ui.bannersUI?.showError?.(cached.error, cached.errorCode);
    } else if (cached.status === "analyzing") {
      if (cached.analysisResult) {
        this.showResultsState(cached.analysisResult, pageHelper?.provenanceFromExtraction?.(session.extractedContent));
        ui.actionsUI?.setReanalyzingState?.(_tabT("analyzing"));
        ui.actionsUI?.setHistorySelectDisabled?.(true);
        ui.actionsUI?.setAnalyzeButtonLoading?.(true, _tabT("analyzing"));
        ui.actionsUI?.showProcessedNote?.(_tabT("analyzingContent"));
      } else {
        this.showCaptureState();
        if (session.extractedContent) {
          ui.captureUI?.setPreviewText?.(session.extractedContent.content || _tabT("noContentExtracted"));
        }
        ui.actionsUI?.setAnalyzeButtonLoading?.(true, _tabT("analyzing"));
      }
    } else if (cached.status === "hatching") {
      if (session.analysisResult) {
        this.showResultsState(session.analysisResult, pageHelper?.provenanceFromExtraction?.(session.extractedContent));
      }
      ui.actionsUI?.updateStage1ProceedBtn?.({ isProceeding: true, autoSave: true });
      ui.actionsUI?.setReanalyzingState?.(_tabT("comparingKnowledge"));
      ui.actionsUI?.setHistorySelectDisabled?.(true);
      ui.actionsUI?.setAnalyzeButtonLoading?.(true, _tabT("analyzing"));
      if (settings?.analysisMode === "fast") {
        ui.verdictUI?.setComparing?.();
      }
    } else if (session.analysisResult) {
      session.eggHatched = !!cached.eggHatched;
      session.nutCollected = !!cached.nutCollected;
      this.showResultsState(session.analysisResult, pageHelper?.provenanceFromExtraction?.(session.extractedContent));
      ui.actionsUI?.setHistorySelectDisabled?.(false);
      if (session.isStage1() && settings?.analysisMode === "confirm") {
        ui.actionsUI?.showStage1Confirm?.();
        ui.verdictUI?.hide?.();
        analyzeAction?.updateStage1ProceedBtn?.();
      }
      if (session.captureHistory.length > 0) {
        const entry = (session.currentNutId != null && session.captureHistory.find((h) => String(h.nutId) === String(session.currentNutId))) || session.captureHistory[0];
        const when = new Date(entry.capturedAt).toLocaleString();
        const stateLabel = entry.saved === "saved"
          ? _tabT("stateSaved") : entry.saved === "skip" ? _tabT("stateCollected") : _tabT("stateAnalyzed");
        if (cached.justReanalyzed) {
          ui.actionsUI?.showProcessedNote?.(_tabT("reanalyzedFreshResult"));
          delete cached.justReanalyzed;
        } else {
          ui.actionsUI?.showProcessedNote?.(_tabT("capturedWhenStored", { when, state: stateLabel }));
        }
        ui.actionsUI?.renderHistory?.(session.captureHistory, session.currentNutId);
      }
    } else {
      this.showCaptureState();
      analyzeAction?.updateAnalyzeButtonsState?.();
    }

    await this.envService?.checkServerStatus?.(() => {
      analyzeAction?.updateAnalyzeButtonsState?.();
    });
    if (settings?.serverOnline) {
      await this.fetchEggs();
    }
  }

  async handleTabActivated({ tabId }) {
    const snapshot = this.getActiveTabSnapshot();
    const { targetState } = this.tabStateManager.switchActiveTab(tabId, snapshot);
    this.session.activeTabId = tabId;
    if (targetState && (targetState.analysisResult || targetState.status === "analyzing" || targetState.status === "hatching" || targetState.status === "error" || targetState.extractedContent)) {
      this.restoreFromTabCache(tabId, targetState);
    } else if (this.tabStateManager.isExtracting(tabId)) {
      this.ui.captureUI?.setLoading?.(_tabT("retrievingPageContent"));
      this.getAnalyzeAction()?.updateAnalyzeButtonsState?.();
    } else {
      this.refreshForCurrentTab();
    }
  }

  async handleVisibilityChange() {
    if (document.visibilityState !== "visible") return;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id != null && tab.id !== this.session.activeTabId) {
        const snapshot = this.getActiveTabSnapshot();
        const { targetState } = this.tabStateManager.switchActiveTab(tab.id, snapshot);
        this.session.activeTabId = tab.id;
        if (targetState && (targetState.analysisResult || targetState.status === "analyzing" || targetState.status === "hatching" || targetState.status === "error" || targetState.extractedContent)) {
          this.restoreFromTabCache(tab.id, targetState);
        } else if (this.tabStateManager.isExtracting(tab.id)) {
          this.ui.captureUI?.setLoading?.(_tabT("retrievingPageContent"));
          this.getAnalyzeAction()?.updateAnalyzeButtonsState?.();
        } else {
          this.refreshForCurrentTab();
        }
      }
    } catch {}
  }

  async handleTabUpdated(tabId, changeInfo) {
    let isActiveTab = false;
    let activeUrl = null;
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      isActiveTab = activeTab?.id === tabId;
      if (isActiveTab) activeUrl = activeTab.url;
    } catch {}

    const newUrl = changeInfo.url || (isActiveTab ? activeUrl : null);
    const cached = this.tabStateManager.get(tabId);

    if ((newUrl && cached?.url && newUrl !== cached.url) || changeInfo.url) {
      this.tabStateManager.invalidateTab(tabId);
      if (isActiveTab) {
        this.refreshForCurrentTab();
        return;
      }
    }

    if (changeInfo.status === "loading") {
      if (isActiveTab) {
        this.session.currentTabLoading = true;
        this.getAnalyzeAction()?.updateAnalyzeButtonsState?.();
      }
      return;
    }

    if (changeInfo.status === "complete") {
      if (isActiveTab) {
        this.session.currentTabLoading = false;
        if (!this.session.extractedContent || this.session.lastLoadWasLoading || this.session.extractionFailed) {
          this.refreshForCurrentTab();
        } else {
          this.getAnalyzeAction()?.updateAnalyzeButtonsState?.();
        }
      }
    }
  }

  handleTabRemoved(tabId) {
    this.tabStateManager.invalidateTab(tabId);
  }
}

const _tabActionScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_tabActionScope.NutEggActions = _tabActionScope.NutEggActions || {};
_tabActionScope.NutEggActions.TabAction = TabAction;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TabAction };
}

