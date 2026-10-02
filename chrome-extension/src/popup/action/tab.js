// ============================================================
// NutEgg Popup Action — Tab Action Handler
// ============================================================

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
    const currentSections = this.session?.enabledSections || this.settings?.enabledSections;
    return this.session.snapshot({
      enabledSections: currentSections ? { ...currentSections } : null,
      customQuestions: this.ui.captureUI?.getCustomQuestions?.() || "",
      customQuestionsScope: this.ui.captureUI?.getQuestionsScope?.() || this.session.customQuestionsScope || "within",
      followupScope: this.ui.qaUI?.getScope?.() || this.session.followupScope || "within",
      analysisMode: this.settings?.analysisMode,
      warning: this.ui.bannersUI?.getWarning?.() || null,
      error: this.ui.bannersUI?.getError?.() || null,
      errorCode: this.ui.bannersUI?.getErrorCode?.() || null,
      duplicate: this.ui.bannersUI?.getDuplicate?.() || null,
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
    ui.bannersUI?.hideAll?.();
    ui.captureUI?.setCustomQuestions?.("");
    ui.qaUI?.clearFollowup?.();
    session.reset();

    // Restore per-tab enabledSections or inherit last active/opened sections
    const currentTargetId = session.activeTabId;
    const existingTabState = currentTargetId ? tabStateManager.get(currentTargetId) : null;
    const initialSections = existingTabState?.enabledSections
      ? { ...existingTabState.enabledSections }
      : (settings?.enabledSections ? { ...settings.enabledSections } : null);
    if (initialSections) {
      session.enabledSections = { ...initialSections };
      settings?.setEnabledSections?.(initialSections, true);
      ui.sectionsUI?.updateUI?.(session.enabledSections);
      if (currentTargetId) {
        tabStateManager.saveActiveTabState(currentTargetId, { enabledSections: session.enabledSections });
      }
    }

    ui.eggsUI?.updateCaptureLabel?.(session.preSelectedEggs);
    ui.actionsUI?.hideProcessedNote?.();
    ui.actionsUI?.renderHistory?.([]);
    ui.captureUI?.setLoading?.(t("loadingContent"));
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
          title: tab.title || t("loading"),
          url: tab.url,
          sourceType: pageHelper?.detectPageTypeFromUrl ? pageHelper.detectPageTypeFromUrl(tab.url) : "webpage",
        });
      }

      // Restore per-tab enabledSections or inherit last active/opened sections
      const confirmedTabState = targetTabId ? tabStateManager.get(targetTabId) : null;
      const effectiveSections = confirmedTabState?.enabledSections
        ? { ...confirmedTabState.enabledSections }
        : (session.enabledSections || (settings?.enabledSections ? { ...settings.enabledSections } : null));
      if (effectiveSections) {
        session.enabledSections = { ...effectiveSections };
        settings?.setEnabledSections?.(effectiveSections, true);
        ui.sectionsUI?.updateUI?.(session.enabledSections);
        if (targetTabId) {
          tabStateManager.saveActiveTabState(targetTabId, { enabledSections: session.enabledSections });
        }
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
        ]).catch(() => {})
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
        ui.captureUI?.setPageInfo?.({ title: t("unknownPage") });
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
      ui.captureUI?.setLoading?.(t("retrievingPageContent"));
      const pageHelper = typeof helper !== "undefined" ? helper : globalThis.helper;
      ui.captureUI?.setPageInfo?.({
        title: tabTitle || t("retrieving"),
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
        const pageHelper = typeof helper !== "undefined" ? helper : globalThis.helper;
        const countWordsFn = pageHelper?.countWords || ((txt) => (txt ? txt.trim().split(/\s+/).filter(Boolean).length : 0));
        const words = countWordsFn(content.content);
        const isSuspicious = pageHelper?.isContentSuspiciouslyLow
          ? pageHelper.isContentSuspiciouslyLow(words, content.sourceType)
          : false;

        let warningMsg = null;
        if (isSuspicious) {
          warningMsg = t("contentLowWarning", { count: words.toLocaleString() });
          tabStateManager.setWarning(tabId, warningMsg);
        } else {
          tabStateManager.clearWarning(tabId);
        }
        tabStateManager.clearError(tabId);

        if (session.activeTabId === tabId) {
          ui.bannersUI?.hideAll?.();
          if (warningMsg) {
            ui.bannersUI?.showWarning?.(warningMsg);
          }
        }
        const cached = tabStateManager.get(tabId) || {};
        tabStateManager.set(tabId, {
          ...cached,
          url: content.url || tabUrl || cached.url,
          extractedContent: content,
          extractionFailed: false,
          warning: warningMsg,
          error: null,
        });

        if (session.activeTabId === tabId) {
          session.extractedContent = content;
          session.currentTabLoading = false;
          ui.captureUI?.setPageInfo?.({
            title: content.title || tabTitle || "Untitled",
            sourceType: content.sourceType || ui.captureUI.getPageType(),
          });
          ui.captureUI?.setPreviewText?.(content.content || "(No content extracted)");
          ui.captureUI?.showProvenance?.(content.metadata || {}, content.content);
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
        const warningMsg = t("couldNotExtractRestricted");
        ui.captureUI?.setError?.(t("couldNotExtractContent"));
        ui.bannersUI?.showWarning?.(warningMsg);
        tabStateManager.setWarning(tabId, warningMsg);
        const cached = tabStateManager.get(tabId) || {};
        tabStateManager.set(tabId, {
          ...cached,
          url: tabUrl || cached.url,
          extractionFailed: true,
          warning: warningMsg,
        });
      }
      if (session.extractedContent) {
        analyzeAction?.applyTranscriptBlock?.();
      }
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
    ui.bannersUI?.hideAll?.();
    ui.eggsUI?.updateCaptureLabel?.(session.preSelectedEggs);
    ui.captureUI?.setCustomQuestions?.(restored.customQuestions || "");
    ui.captureUI?.setQuestionsScope?.(restored.customQuestionsScope || "within");
    ui.qaUI?.setScope?.(restored.followupScope || "within");
    ui.qaUI?.clearFollowup?.();
    session.currentTabLoading = false;

    if (restored.analysisMode && analyzeAction?.setAnalysisMode) {
      analyzeAction.setAnalysisMode(restored.analysisMode);
    }

    const activeSections = restored.enabledSections
      ? { ...restored.enabledSections }
      : (settings?.enabledSections ? { ...settings.enabledSections } : null);
    if (activeSections) {
      session.enabledSections = { ...activeSections };
      settings?.setEnabledSections?.(activeSections, true);
      ui.sectionsUI?.updateUI?.(session.enabledSections);
    }

    ui.captureUI?.render?.(session, settings);

    if (cached.status === "error" || cached.error) {
      if (session.analysisResult) {
        this.showResultsState(session.analysisResult, pageHelper?.provenanceFromExtraction?.(session.extractedContent));
      } else {
        this.showCaptureState();
        if (session.extractedContent) {
          ui.captureUI?.setPreviewText?.(session.extractedContent.content || t("noContentExtracted"));
        } else if (cached.extractionFailed) {
          ui.captureUI?.setError?.(t("couldNotExtractContent"));
        }
      }
      ui.bannersUI?.showError?.(cached.error, cached.errorCode);
    } else if (cached.status === "analyzing") {
      if (cached.analysisResult) {
        this.showResultsState(cached.analysisResult, pageHelper?.provenanceFromExtraction?.(session.extractedContent));
        ui.actionsUI?.setReanalyzingState?.(t("analyzing"));
        ui.actionsUI?.setHistorySelectDisabled?.(true);
        ui.actionsUI?.setAnalyzeButtonLoading?.(true, t("analyzing"));
        ui.actionsUI?.showProcessedNote?.(t("analyzingContent"));
      } else {
        this.showCaptureState();
        if (session.extractedContent) {
          ui.captureUI?.setPreviewText?.(session.extractedContent.content || t("noContentExtracted"));
        }
        ui.actionsUI?.setAnalyzeButtonLoading?.(true, t("analyzing"));
      }
    } else if (cached.status === "hatching") {
      if (session.analysisResult) {
        this.showResultsState(session.analysisResult, pageHelper?.provenanceFromExtraction?.(session.extractedContent));
      }
      ui.actionsUI?.updateStage1ProceedBtn?.({ isProceeding: true, autoSave: true });
      ui.actionsUI?.setReanalyzingState?.(t("comparingKnowledge"));
      ui.actionsUI?.setHistorySelectDisabled?.(true);
      ui.actionsUI?.setAnalyzeButtonLoading?.(true, t("analyzing"));
      if (settings?.analysisMode === "fast") {
        ui.verdictUI?.setComparing?.();
      }
    } else if (session.analysisResult) {
      session.eggHatched = !!cached.eggHatched;
      session.nutCollected = !!cached.nutCollected;
      this.showResultsState(session.analysisResult, pageHelper?.provenanceFromExtraction?.(session.extractedContent));
      if (cached.warning) {
        ui.bannersUI?.showWarning?.(cached.warning);
      }
      if (cached.duplicate) {
        ui.bannersUI?.showDuplicate?.(cached.duplicate);
      }
      ui.actionsUI?.setHistorySelectDisabled?.(false);
      if (session.isStage1?.() && settings?.analysisMode === "confirm") {
        ui.actionsUI?.showStage1Confirm?.();
        ui.verdictUI?.hide?.();
        analyzeAction?.updateStage1ProceedBtn?.();
      }
      if (session.captureHistory?.length > 0) {
        const entry = (session.currentNutId != null && session.captureHistory.find((h) => String(h.nutId) === String(session.currentNutId))) || session.captureHistory[0];
        const when = new Date(entry.capturedAt).toLocaleString();
        const stateLabel = entry.saved === "saved"
          ? t("stateSaved") : entry.saved === "skip" ? t("stateCollected") : t("stateAnalyzed");
        if (cached.justReanalyzed) {
          ui.actionsUI?.showProcessedNote?.(t("reanalyzedFreshResult"));
          delete cached.justReanalyzed;
        } else {
          ui.actionsUI?.showProcessedNote?.(t("capturedWhenStored", { when, state: stateLabel }));
        }
        ui.actionsUI?.renderHistory?.(session.captureHistory, session.currentNutId);
      }
    } else {
      this.showCaptureState();
      if (session.extractedContent) {
        ui.captureUI?.setPreviewText?.(session.extractedContent.content || t("noContentExtracted"));
      } else if (cached.extractionFailed) {
        ui.captureUI?.setError?.(t("couldNotExtractContent"));
      }
      if (cached.warning) {
        ui.bannersUI?.showWarning?.(cached.warning);
      }
      if (cached.duplicate) {
        ui.bannersUI?.showDuplicate?.(cached.duplicate);
      }
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
    this.ui.bannersUI?.hideAll?.();

    if (targetState?.enabledSections) {
      this.session.enabledSections = { ...targetState.enabledSections };
      this.settings?.setEnabledSections?.(this.session.enabledSections, true);
      this.ui.sectionsUI?.updateUI?.(this.session.enabledSections);
    }

    if (targetState && (targetState.analysisResult || targetState.status === "analyzing" || targetState.status === "hatching" || targetState.status === "error" || targetState.error || targetState.extractedContent || targetState.warning || targetState.duplicate || targetState.extractionFailed)) {
      await this.restoreFromTabCache(tabId, targetState);
    } else if (this.tabStateManager.isExtracting(tabId)) {
      this.ui.captureUI?.setLoading?.(t("retrievingPageContent"));
      this.getAnalyzeAction()?.updateAnalyzeButtonsState?.();
    } else {
      await this.refreshForCurrentTab();
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
        this.ui.bannersUI?.hideAll?.();

        if (targetState?.enabledSections) {
          this.session.enabledSections = { ...targetState.enabledSections };
          this.settings?.setEnabledSections?.(this.session.enabledSections, true);
          this.ui.sectionsUI?.updateUI?.(this.session.enabledSections);
        }

        if (targetState && (targetState.analysisResult || targetState.status === "analyzing" || targetState.status === "hatching" || targetState.status === "error" || targetState.error || targetState.extractedContent || targetState.warning || targetState.duplicate || targetState.extractionFailed)) {
          await this.restoreFromTabCache(tab.id, targetState);
        } else if (this.tabStateManager.isExtracting(tab.id)) {
          this.ui.captureUI?.setLoading?.(t("retrievingPageContent"));
          this.getAnalyzeAction()?.updateAnalyzeButtonsState?.();
        } else {
          await this.refreshForCurrentTab();
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
        await this.refreshForCurrentTab();
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
          await this.refreshForCurrentTab();
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

