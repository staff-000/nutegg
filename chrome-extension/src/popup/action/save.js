// ============================================================
// NutEgg Popup Action — Save Action Handler
// ============================================================

class SaveAction {
  constructor(deps = {}) {
    this.session = deps.session;
    this.settings = deps.settings;
    this.tabStateManager = deps.tabStateManager;
    this.analysisService = deps.analysisService;
    this.envService = deps.envService;
    this.ui = deps.ui || {};
    this.getTabAction = deps.getTabAction || (() => null);
    this.getAnalyzeAction = deps.getAnalyzeAction || (() => null);
  }

  updateActionButtons() {
    this.ui.actionsUI?.render?.(this.session, this.settings);
  }

  handleSaveSuccessNotification({ response, newKnowledge: nk, isHatch: ih, result }) {
    const session = this.session;
    const ui = this.ui;
    ui.actionsUI?.renderHistory?.(session.captureHistory, session.currentNutId);
    const merged = response?.merged || [];
    const mergedNote = merged.length > 0
      ? ` 🧹 ${merged
          .map((m) => t("unprocessedMergedNote", { count: m.entries, egg: m.egg }))
          .join(", ")}`
      : "";
    const isStage1BoxVisible = session.isStage1(result) && ui.actionsUI?.isStage1ConfirmVisible?.();
    if (isStage1BoxVisible) {
      ui.bannersUI?.hideSuccess?.();
    } else {
      if (nk && nk.length > 0) {
        ui.bannersUI?.showSuccess?.(t("eggHatchedSuccess", { mergedNote }));
      } else if (ih) {
        ui.bannersUI?.showSuccess?.(t("eggHatchedNoKnowledge"));
      } else {
        ui.bannersUI?.showSuccess?.(t("nutCollectedVault"));
      }
    }
    this.updateActionButtons();
    this.envService?.fetchMetrics?.();
  }

  async handleCreateEgg(inline = false) {
    const session = this.session;
    const ui = this.ui;
    const analyzeAction = this.getAnalyzeAction();
    const pinnedTabId = session?.activeTabId;
    const { name, desc } = ui.eggsUI?.getNewEggInput?.() || {};
    const btn = inline ? ui.eggsUI?.eggsCreateBtn : ui.eggsUI?.createEggBtn;
    if (!name || btn?.disabled) return;
    ui.eggsUI?.setCreateButtonLoading?.(true);
    try {
      const response = await this.analysisService.createEgg(name, desc);
      if (response?.success) {
        if (session.activeTabId !== pinnedTabId) return;
        const pageHelper = typeof helper !== "undefined" ? helper : globalThis.helper;
        const eggFile = response.path ? response.path.split("/").pop() : (pageHelper?.slugify ? pageHelper.slugify(name) : name) + ".md";
        this.getTabAction()?.addCreatedEgg?.({ fileName: eggFile, description: desc || name });
        ui.eggsUI?.resetCreateForm?.();
        if (inline) {
          await analyzeAction?.handleAnalyze?.(true);
        } else {
          await analyzeAction?.handleAnalyze?.(true, [eggFile]);
        }
        return;
      }
      if (session.activeTabId === pinnedTabId) {
        const errText = response?.error || t("failedToCreateEgg");
        if (inline) {
          ui.eggsUI?.showError?.(`❌ ${errText}`);
        } else {
          ui.bannersUI?.showError?.(errText);
        }
      }
    } catch (err) {
      if (session.activeTabId === pinnedTabId) {
        const errText = err instanceof Error ? err.message : t("failedToCreateEgg");
        if (inline) {
          ui.eggsUI?.showError?.(`❌ ${errText}`);
        } else {
          ui.bannersUI?.showError?.(errText);
        }
      }
    } finally {
      if (session.activeTabId === pinnedTabId) {
        ui.eggsUI?.setCreateButtonLoading?.(false);
      }
    }
  }

  async handleConfirm() {
    const session = this.session;
    const ui = this.ui;
    const tabAction = this.getTabAction();
    const pinnedTabId = session.activeTabId;
    const cached = pinnedTabId && this.tabStateManager ? this.tabStateManager.get(pinnedTabId) : null;
    const targetResult = session.analysisResult || cached?.analysisResult;
    let targetContent = session.extractedContent || cached?.extractedContent;
    const targetNutId = session.currentNutId || cached?.currentNutId;

    if (!targetResult || session.eggHatched || !(targetResult.newKnowledge?.length)) return;
    if (!targetContent) {
      if (session.activeTabId === pinnedTabId) {
        ui.actionsUI?.setConfirmButtonLoading?.(true, t("retrieving"));
      }
      targetContent = await tabAction?.extractPageContent?.(session.refreshSeq, pinnedTabId);
    }
    if (session.activeTabId === pinnedTabId) {
      ui.actionsUI?.setConfirmButtonLoading?.(true, t("hatching"));
    }
    await this.doSave(targetResult.newKnowledge || [], true, targetContent, targetResult, targetNutId, pinnedTabId);
    if (session.activeTabId === pinnedTabId) {
      this.updateActionButtons();
    }
  }

  async handleSaveRaw() {
    const session = this.session;
    const ui = this.ui;
    const tabAction = this.getTabAction();
    const pinnedTabId = session.activeTabId;
    const cached = pinnedTabId && this.tabStateManager ? this.tabStateManager.get(pinnedTabId) : null;
    const targetResult = session.analysisResult || cached?.analysisResult;
    let targetContent = session.extractedContent || cached?.extractedContent;
    const targetNutId = session.currentNutId || cached?.currentNutId;

    if (session.nutCollected) return;
    if (!targetContent) {
      if (session.activeTabId === pinnedTabId) {
        ui.actionsUI?.setCollectNutLoading?.(true, t("retrieving"));
      }
      targetContent = await tabAction?.extractPageContent?.(session.refreshSeq, pinnedTabId);
    }
    if (!targetContent) {
      if (session.activeTabId === pinnedTabId) {
        ui.bannersUI?.showError?.(t("couldNotExtractToSave"));
        this.updateActionButtons();
      }
      return;
    }
    if (session.activeTabId === pinnedTabId) {
      ui.actionsUI?.setCollectNutLoading?.(true, t("collecting"));
    }
    await this.doSave([], false, targetContent, targetResult, targetNutId, pinnedTabId);
    if (session.activeTabId === pinnedTabId) {
      this.updateActionButtons();
    }
  }

  async doSave(
    newKnowledge,
    isHatch = false,
    overrideContent = null,
    overrideResult = null,
    overrideNutId = null,
    targetPinnedId = null
  ) {
    const session = this.session;
    const settings = this.settings;
    const tabStateManager = this.tabStateManager;
    const ui = this.ui;
    const tabAction = this.getTabAction();
    const targetId = targetPinnedId || session.activeTabId;
    const isTargetActive = () => session.activeTabId === targetId;

    return this.analysisService.saveKnowledge({
      session,
      settings,
      tabStateManager,
      newKnowledge,
      isHatch,
      overrideContent,
      overrideResult,
      overrideNutId,
      targetPinnedId: targetId,
      extractFallback: (id) => tabAction ? tabAction.extractPageContent(session.refreshSeq, id) : null,
      callbacks: {
        onSaveSuccess: (info) => {
          if (isTargetActive()) {
            this.handleSaveSuccessNotification(info);
          }
        },
        onSaveError: (msg) => {
          if (isTargetActive()) ui.bannersUI?.showError?.(msg);
        },
      },
    });
  }
}

const _saveActionScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_saveActionScope.NutEggActions = _saveActionScope.NutEggActions || {};
_saveActionScope.NutEggActions.SaveAction = SaveAction;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SaveAction };
}
