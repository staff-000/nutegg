// ============================================================
// NutEgg Popup Action — Analyze Action Handler
// ============================================================

class AnalyzeAction {
  constructor(deps = {}) {
    this.session = deps.session;
    this.settings = deps.settings;
    this.tabStateManager = deps.tabStateManager;
    this.analysisService = deps.analysisService;
    this.envService = deps.envService;
    this.ui = deps.ui || {};
    this.getTabAction = deps.getTabAction || (() => null);
    this.getSaveAction = deps.getSaveAction || (() => null);
    this.showResultsState = deps.showResultsState || (() => {});
    this.renderApp = deps.renderApp || (() => {});
  }

  handleBackToContent() {
    if (!this.session?.analysisResult) return;
    this.session.viewingContent = true;
    this.ui.bannersUI?.hideAll?.();
    this.renderApp();
    this.persistNavigationState();
  }

  handleViewAnalysis() {
    const result = this.session?.analysisResult;
    if (!result) return;
    this.session.viewingContent = false;
    const pageHelper = globalThis.NutEggHelpers || globalThis.helper;
    this.showResultsState(result, pageHelper?.provenanceFromExtraction?.(this.session.extractedContent));
    this.persistNavigationState();
  }

  persistNavigationState() {
    const tabId = this.session?.activeTabId;
    if (tabId == null || !this.tabStateManager || !this.session?.snapshot) return;
    this.tabStateManager.set(tabId, {
      ...(this.tabStateManager.get(tabId) || {}),
      ...this.session.snapshot(),
    });
  }

  setAnalysisMode(mode) {
    if (!this.settings) return;
    this.settings.setAnalysisMode(mode);
    this.renderApp();

    if (this.session?.isStage1() && mode === "confirm") {
      this.ui.eggsUI?.expandEggsList?.(true);
      this.updateStage1ProceedBtn();
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    }
  }

  updateStage1ProceedBtn() {
    this.ui.actionsUI?.updateStage1ProceedBtn?.({
      selectedCount: this.session?.selectedEggs?.size || 0,
      totalEggsCount: this.session?.allEggs?.length || 0,
    });
  }

  isTranscriptBlocked() {
    const pageHelper = typeof helper !== "undefined" ? helper : globalThis.helper;
    return pageHelper?.isTranscriptBlocked ? pageHelper.isTranscriptBlocked(this.session?.extractedContent) : false;
  }

  applyTranscriptBlock() {
    if (!this.isTranscriptBlocked()) return;
    this.updateAnalyzeButtonsState();
    this.ui.bannersUI?.showWarning?.(t("transcriptBlockedWarning"));
  }

  getAnalyzeNotReadyReason() {
    const pageHelper = typeof helper !== "undefined" ? helper : globalThis.helper;
    return pageHelper?.getAnalyzeNotReadyReason ? pageHelper.getAnalyzeNotReadyReason(this.session, this.settings) : null;
  }

  updateAnalyzeButtonsState() {
    const isAnalyzing = this.tabStateManager ? this.tabStateManager.isAnalyzing(this.session?.activeTabId) : false;
    const notReady = this.getAnalyzeNotReadyReason();
    const hasContent = !!(this.session?.extractedContent && this.session.extractedContent.content);

    this.ui.actionsUI?.updateAnalyzeState?.({
      isAnalyzing,
      notReadyReason: notReady,
      isTranscriptBlocked: this.isTranscriptBlocked(),
      currentTabLoading: !!this.session?.currentTabLoading,
      extractionPending: !!this.session?.extractionPending,
      hasContent,
      hasAnalysisResult: Boolean(this.session?.analysisResult),
    });
  }

  async handleProceedStage2(
    eggsToCompare = null,
    autoSave = false,
    skipScroll = false,
    pinnedTabId = null,
    contentAnalysis = null,
    basePayload = null,
    contentForProvenance = null
  ) {
    const session = this.session;
    const settings = this.settings;
    const tabStateManager = this.tabStateManager;
    const ui = this.ui;
    const targetPinnedId = pinnedTabId || session.activeTabId;
    const isPinnedActive = () => session.activeTabId === targetPinnedId;
    const pageHelper = typeof helper !== "undefined" ? helper : globalThis.helper;

    const res = await this.analysisService.proceedStage2({
      session,
      settings,
      tabStateManager,
      eggsToCompare,
      autoSave,
      skipScroll,
      pinnedTabId: targetPinnedId,
      contentAnalysis,
      basePayload,
      contentForProvenance,
      callbacks: {
        getQuestions: () => ui.captureUI?.getParsedQuestions?.(),
        getQuestionsScope: () => ui.captureUI?.getQuestionsScope?.() || session.customQuestionsScope || "within",
        onNoEggsSelected: () => {
          if (isPinnedActive()) {
            ui.eggsUI?.expandEggsList?.(true);
            if (ui.eggsUI?.eggsSection) ui.eggsUI.eggsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
            ui.bannersUI?.showWarning?.(t("selectEggWarning"));
          }
        },
        onProceedStart: ({ autoSave: as }) => {
          if (isPinnedActive()) {
            ui.actionsUI?.updateStage1ProceedBtn?.({ isProceeding: true, autoSave: as });
            ui.bannersUI?.hideMessages?.();
            ui.eggsUI?.setKnowledgeVisible?.(false);
            ui.eggsUI?.setNoEggVisible?.(false);
          }
        },
        onProceedError: (error, code) => {
          if (isPinnedActive()) {
            ui.bannersUI?.showError?.(error, code);
            this.updateStage1ProceedBtn();
            if (settings.analysisMode === "confirm") {
              ui.verdictUI?.hide?.();
              ui.actionsUI?.showStage1Confirm?.();
            }
            this.updateAnalyzeButtonsState();
          }
        },
        onProceedComplete: ({ response, contentForProvenance: cfp, autoSave: as, skipScroll: ss }) => {
          if (isPinnedActive()) {
            this.showResultsState(response, pageHelper?.provenanceFromExtraction?.(cfp));
            if (as) {
              session.eggHatched = true;
              session.nutCollected = true;
              this.getSaveAction()?.updateActionButtons?.();
              this.envService?.fetchMetrics?.();
            }
            if (session.captureHistory.length > 0) {
              ui.actionsUI?.renderHistory?.(session.captureHistory, session.currentNutId);
              if (session.isReanalyzing) {
                ui.actionsUI?.showProcessedNote?.(t("reanalyzedFreshResult"));
              }
            }
            if (!ss) {
              setTimeout(() => {
                const target = ui.eggsUI?.eggKnowledgeSection && !ui.eggsUI.eggKnowledgeSection.classList.contains("hidden")
                  ? ui.eggsUI.eggKnowledgeSection
                  : ui.verdictUI?.verdictSection;
                if (target && !target.classList.contains("hidden")) {
                  target.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
              }, 100);
            }
          }
        },
        onSaveSuccess: (info) => {
          if (isPinnedActive()) {
            this.getSaveAction()?.handleSaveSuccessNotification?.(info);
          }
        },
        onSaveError: (msg) => {
          if (isPinnedActive()) ui.bannersUI?.showError?.(msg);
        },
      },
    });

    return res.error || null;
  }

  async handleAnalyze(force = false, eggsOverride = null, isReanalyze = false) {
    const session = this.session;
    const settings = this.settings;
    const tabStateManager = this.tabStateManager;
    const ui = this.ui;
    const pageHelper = typeof helper !== "undefined" ? helper : globalThis.helper;

    const notReady = this.getAnalyzeNotReadyReason();
    if (notReady) {
      ui.bannersUI?.showWarning?.(notReady);
      return notReady;
    }

    const pinnedTabId = session.activeTabId;
    const contentToAnalyze = session.extractedContent;

    if (!contentToAnalyze || !contentToAnalyze.content) {
      const msg = "The page is still loading or content is not ready yet. Please wait until it finishes loading.";
      ui.bannersUI?.showWarning?.(msg);
      return msg;
    }

    if (this.isTranscriptBlocked()) {
      this.applyTranscriptBlock();
      return "Video transcript unavailable — NutEgg will not process this video.";
    }

    const isPinnedActive = () => session.activeTabId === pinnedTabId;

    const res = await this.analysisService.analyze({
      session,
      settings,
      tabStateManager,
      force,
      eggsOverride,
      isReanalyze,
      pinnedTabId,
      callbacks: {
        getQuestions: () => ui.captureUI?.getParsedQuestions?.(),
        getQuestionsScope: () => ui.captureUI?.getQuestionsScope?.() || session.customQuestionsScope || "within",
        onWarning: (msg) => {
          if (isPinnedActive()) ui.bannersUI?.showWarning?.(msg);
        },
        onError: (msg, code) => {
          if (isPinnedActive()) ui.bannersUI?.showError?.(msg, code);
        },
        onStart: ({ isReanalyze: ir }) => {
          if (isPinnedActive()) {
            ui.bannersUI?.hideMessages?.();
            if (ir) {
              ui.actionsUI?.showProcessedNote?.(t("analyzingContent"));
              ui.actionsUI?.setReanalyzingState?.(t("analyzing"));
              ui.eggsUI?.setKnowledgeVisible?.(false);
              ui.eggsUI?.setNoEggVisible?.(false);
            }
            ui.actionsUI?.setHistorySelectDisabled?.(true);
            ui.actionsUI?.setAnalyzeButtonLoading?.(true, t("analyzing"));
          }
        },
        onStage1Interim: ({ response, eggsForStage2, isReanalyze: ir, contentToAnalyze: cta }) => {
          if (isPinnedActive()) {
            this.showResultsState(response, pageHelper?.provenanceFromExtraction?.(cta));
            if (ir) {
              ui.actionsUI?.showProcessedNote?.(t("comparingAgainstSelected"));
              ui.actionsUI?.setReanalyzingState?.(t("analyzingEggs"));
            }
            if (eggsForStage2.length > 0) {
              if (!ir) {
                ui.verdictUI?.setAnalyzing?.(eggsForStage2.length);
              } else {
                ui.verdictUI?.hide?.();
              }
              ui.actionsUI?.hideStage1Confirm?.();
            }
          }
        },
        onStage1Complete: ({ response, contentToAnalyze: cta, isReanalyze: ir }) => {
          if (isPinnedActive()) {
            this.showResultsState(response, pageHelper?.provenanceFromExtraction?.(cta));
            if (ir || session.captureHistory.length > 0) {
              ui.actionsUI?.showProcessedNote?.(ir ? t("reanalyzedFreshResult") : t("stage1Complete"));
              ui.actionsUI?.renderHistory?.(session.captureHistory, session.currentNutId);
            }
          }
        },
        onFinally: () => {
          if (isPinnedActive()) {
            ui.actionsUI?.setHistorySelectDisabled?.(false);
            const activeCache = tabStateManager ? tabStateManager.get(session.activeTabId) : null;
            if (!activeCache || (activeCache.status !== "analyzing" && activeCache.status !== "hatching")) {
              this.updateAnalyzeButtonsState();
            }
          }
        },
        onNoEggsSelected: () => {
          if (isPinnedActive()) {
            ui.eggsUI?.expandEggsList?.(true);
            if (ui.eggsUI?.eggsSection) ui.eggsUI.eggsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
            ui.bannersUI?.showWarning?.(t("selectEggWarning"));
          }
        },
        onProceedStart: ({ autoSave: as }) => {
          if (isPinnedActive()) {
            ui.actionsUI?.updateStage1ProceedBtn?.({ isProceeding: true, autoSave: as });
            ui.bannersUI?.hideMessages?.();
          }
        },
        onProceedError: (error, code) => {
          if (isPinnedActive()) {
            ui.bannersUI?.showError?.(error, code);
            this.updateStage1ProceedBtn();
            if (settings.analysisMode === "confirm") {
              ui.verdictUI?.hide?.();
              ui.actionsUI?.showStage1Confirm?.();
            }
            this.updateAnalyzeButtonsState();
          }
        },
        onProceedComplete: ({ response, contentForProvenance: cfp, autoSave: as, skipScroll: ss }) => {
          if (isPinnedActive()) {
            this.showResultsState(response, pageHelper?.provenanceFromExtraction?.(cfp));
            if (as) {
              session.eggHatched = true;
              session.nutCollected = true;
              this.getSaveAction()?.updateActionButtons?.();
              this.envService?.fetchMetrics?.();
            }
            if (session.captureHistory.length > 0) {
              ui.actionsUI?.renderHistory?.(session.captureHistory, session.currentNutId);
              if (session.isReanalyzing) {
                ui.actionsUI?.showProcessedNote?.(t("reanalyzedFreshResult"));
              }
            }
            if (!ss) {
              setTimeout(() => {
                const target = ui.eggsUI?.eggKnowledgeSection && !ui.eggsUI.eggKnowledgeSection.classList.contains("hidden")
                  ? ui.eggsUI.eggKnowledgeSection
                  : ui.verdictUI?.verdictSection;
                if (target && !target.classList.contains("hidden")) {
                  target.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
              }, 100);
            }
          }
        },
        onSaveSuccess: (info) => {
          if (isPinnedActive()) {
            this.getSaveAction()?.handleSaveSuccessNotification?.(info);
          }
        },
        onSaveError: (msg) => {
          if (isPinnedActive()) ui.bannersUI?.showError?.(msg);
        },
      },
    });

    return res.error || null;
  }

  async handleReanalyzeEggs() {
    if (this.ui.eggsUI?.reanalyzeEggsBtn?.disabled) return;
    if (this.ui.eggsUI?.reanalyzeEggsBtn) {
      this.ui.eggsUI.reanalyzeEggsBtn.disabled = true;
    }
    const pinnedTabId = this.session?.activeTabId;
    const pinnedEggs = Array.from(this.session?.selectedEggs || []);
    const capturedResults = this.session?.analysisResult?.eggAnalysisCache || this.session?.analysisResult?.eggResults || [];
    const allCaptured = pinnedEggs.every(egg => capturedResults.some(result => result.egg === egg));

    try {
      const hasContent = !!(this.session?.extractedContent && this.session.extractedContent.content);
      if (!hasContent && !allCaptured) {
        this.ui.eggsUI?.setReanalyzeLoading?.(true, t("loadingContent"));
        this.ui.bannersUI?.hideMessages?.();
        this.ui.bannersUI?.hideWarning?.();

        try {
          const tabAction = this.getTabAction?.();
          if (tabAction?.extractPageContent) {
            await tabAction.extractPageContent(this.session?.refreshSeq, pinnedTabId);
          }
        } catch (err) {
          console.error("[NutEgg] Error extracting content on re-analyze eggs:", err);
        }

        if (this.session?.activeTabId !== pinnedTabId) return;

        this.ui.eggsUI?.setReanalyzeLoading?.(false, t("reanalyzeEggsBtn"));

        const nowHasContent = !!(this.session?.extractedContent && this.session.extractedContent.content);
        if (!nowHasContent) {
          this.ui.bannersUI?.showError?.(t("couldNotRetrieveContent"));
          return;
        }
      }

      if (this.session?.activeTabId !== pinnedTabId) return;

      const notReady = allCaptured ? null : this.getAnalyzeNotReadyReason();
      if (notReady) {
        this.ui.bannersUI?.showWarning?.(notReady);
        return;
      }

      this.ui.eggsUI?.setReanalyzeLoading?.(true, `⏳ ${t("analyzing")}`);
      this.ui.eggsUI?.clearError?.();
      this.ui.eggsUI?.setKnowledgeVisible?.(false);
      this.ui.eggsUI?.setNoEggVisible?.(false);

      if (this.session) {
        this.session.isReanalyzing = true;
        if (!allCaptured) this.session.eggHatched = false;
        this.session.activeEggTab = null;
      }
      if (this.tabStateManager && pinnedTabId != null) {
        this.tabStateManager.set(pinnedTabId, {
          ...(this.tabStateManager.get(pinnedTabId) || {}),
          isReanalyzing: true,
          eggHatched: allCaptured ? this.session.eggHatched : false,
          activeEggTab: null,
        });
      }
      this.getSaveAction()?.updateActionButtons?.();

      // Changing eggs reuses the existing source analysis (including results
      // restored from history); only Stage 2 needs to run again.
      await this.handleProceedStage2(pinnedEggs, false, false, pinnedTabId);
    } finally {
      if (this.session?.activeTabId === pinnedTabId) {
        this.session.isReanalyzing = false;
      }
      if (this.tabStateManager && pinnedTabId != null) {
        const cached = this.tabStateManager.get(pinnedTabId);
        if (cached) this.tabStateManager.set(pinnedTabId, { ...cached, isReanalyzing: false });
      }
      if (this.session?.activeTabId === pinnedTabId) {
        this.ui.eggsUI?.setReanalyzeLoading?.(false, t("reanalyzeEggsBtn"));
      } else if (this.ui.eggsUI?.reanalyzeEggsBtn) {
        this.ui.eggsUI.reanalyzeEggsBtn.disabled = false;
      }
    }
  }
}

const _analyzeActionScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_analyzeActionScope.NutEggActions = _analyzeActionScope.NutEggActions || {};
_analyzeActionScope.NutEggActions.AnalyzeAction = AnalyzeAction;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { AnalyzeAction };
}
