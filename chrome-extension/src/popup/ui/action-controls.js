// ============================================================
// NutEgg Popup UI — Action Controls Component
// ============================================================

class ActionControlsComponent {
  constructor(root = document) {
    this.root = root;
    this.modeFastBtn = root.getElementById("mode-fast-btn");
    this.modeConfirmBtn = root.getElementById("mode-confirm-btn");
    this.analyzeBtn = root.getElementById("analyze-btn");
    this.viewAnalysisBtn = root.getElementById("view-analysis-btn");
    this.analyzeBtnText = root.getElementById("analyze-btn-text");
    this.reanalyzeBtn = root.getElementById("reanalyze-btn");
    this.reanalyzeRefreshBtn = root.getElementById("reanalyze-refresh-btn");
    this.historySelect = root.getElementById("history-select");
    this.processedNote = root.getElementById("processed-note");
    this.processedMessage = root.getElementById("processed-message");

    this.stage1ConfirmBox = root.getElementById("stage1-confirm-box");
    this.stage1ConfirmText = root.getElementById("stage1-confirm-text");
    this.stage1ProceedBtn = root.getElementById("stage1-proceed-btn");
    this.eggAnalysisSelector = root.getElementById("egg-analysis-selector") || root.querySelector?.(".egg-analysis-selector");
    this.eggAnalysisLabel = root.getElementById("egg-analysis-label");
    this.eggAnalysisMenu = root.getElementById("egg-analysis-menu");
    this.eggAnalysisOnlyBtn = root.getElementById("egg-analysis-only");
    this.eggAnalysisWithKnowledgeBtn = root.getElementById("egg-analysis-with-knowledge");
    this.generateKnowledgeEntries = false;
    this.stage1SkipBtn = root.getElementById("stage1-skip-btn");
    this.stage1SkipBtnWrap = root.getElementById("stage1-skip-btn-wrap");

    this.analyzeBtn = root.getElementById("analyze-btn");
    this.analyzeBtnWrap = root.getElementById("analyze-btn-wrap");
    this.reanalyzeBtn = root.getElementById("reanalyze-btn");
    this.reanalyzeBtnWrap = root.getElementById("reanalyze-btn-wrap");
    this.confirmBtn = root.getElementById("confirm-btn");
    this.confirmBtnWrap = root.getElementById("confirm-btn-wrap");
    this.collectNutBtn = root.getElementById("collect-nut-btn");
    this.collectNutBtnWrap = root.getElementById("collect-nut-btn-wrap");
    this.discardBtn = root.getElementById("discard-btn");
    this.backBtn = root.getElementById("back-btn");
  }

  async handleEggAnalysisClick(event, onAnalyze) {
    if (event.target.closest?.("[data-egg-analysis-arrow]")) {
      this.toggleEggAnalysisMenu();
      return;
    }
    this.toggleEggAnalysisMenu(false);
    return onAnalyze(this.generateKnowledgeEntries);
  }

  getEggAnalysisLabelText(generateKnowledgeEntries = this.generateKnowledgeEntries) {
    return `${t("eggAnalysis")}${generateKnowledgeEntries ? " 🍃" : ""}`;
  }

  updateEggAnalysisLabel(generateKnowledgeEntries = this.generateKnowledgeEntries) {
    this.generateKnowledgeEntries = generateKnowledgeEntries;
    if (this.eggAnalysisLabel) this.eggAnalysisLabel.textContent = this.getEggAnalysisLabelText(generateKnowledgeEntries);
    for (const [button, key, selected] of [
      [this.eggAnalysisOnlyBtn, "eggAnalysisOnly", !generateKnowledgeEntries],
      [this.eggAnalysisWithKnowledgeBtn, "eggAnalysisWithKnowledge", generateKnowledgeEntries],
    ]) {
      if (!button) continue;
      button.textContent = `${selected ? "✓ " : ""}${t(key)}`;
      button.setAttribute?.("aria-checked", String(selected));
    }
  }

  toggleEggAnalysisMenu(open) {
    const visible = open ?? this.eggAnalysisMenu?.classList.contains("hidden");
    if (visible) this.eggAnalysisMenu?.classList.remove("hidden");
    else this.eggAnalysisMenu?.classList.add("hidden");
    this.stage1ProceedBtn?.setAttribute?.("aria-expanded", String(Boolean(visible)));
  }

  setEggAnalysisLoading(isLoading, text = "") {
    this.toggleEggAnalysisMenu(false);
    if (this.eggAnalysisOnlyBtn) this.eggAnalysisOnlyBtn.disabled = Boolean(isLoading);
    if (this.eggAnalysisWithKnowledgeBtn) this.eggAnalysisWithKnowledgeBtn.disabled = Boolean(isLoading);
    if (this.stage1ProceedBtn) {
      this.stage1ProceedBtn.disabled = Boolean(isLoading);
      if (text && this.eggAnalysisLabel) this.eggAnalysisLabel.textContent = text;
      else this.updateEggAnalysisLabel();
    }

  }

  setMode(mode) {
    if (mode === "preview" || mode === "confirm") {
      this.modeConfirmBtn?.classList.add("active");
      this.modeFastBtn?.classList.remove("active");
    } else {
      this.modeFastBtn?.classList.add("active");
      this.modeConfirmBtn?.classList.remove("active");
    }
  }

  updateAnalyzeState({
    isAnalyzing = false,
    canAnalyze = true,
    notReadyReason = null,
    isTranscriptBlocked = false,
    currentTabLoading = false,
    extractionPending = false,
    hasContent = false,
    hasAnalysisResult = false,
  } = {}) {
    if (hasAnalysisResult) this.viewAnalysisBtn?.classList.remove("hidden");
    else this.viewAnalysisBtn?.classList.add("hidden");
    if (!this.analyzeBtn) return;

    if (isAnalyzing) {
      this.analyzeBtn.disabled = true;
      this.analyzeBtn.classList.remove("inactive");
      if (this.analyzeBtnText) this.analyzeBtnText.textContent = t("analyzing");
      this.analyzeBtn.title = t("analyzing");

      if (this.reanalyzeBtn) {
        this.reanalyzeBtn.disabled = true;
        this.reanalyzeBtn.classList.remove("inactive");
        this.reanalyzeBtn.textContent = t("analyzing");
        this.reanalyzeBtn.title = t("analyzing");
      }
      if (this.reanalyzeRefreshBtn) {
        this.reanalyzeRefreshBtn.disabled = true;
      }
      return;
    }

    this.analyzeBtn.disabled = false;
    if (this.reanalyzeBtn) this.reanalyzeBtn.disabled = false;
    if (this.reanalyzeRefreshBtn) {
      this.reanalyzeRefreshBtn.disabled = Boolean(currentTabLoading || extractionPending);
    }

    if (notReadyReason) {
      this.analyzeBtn.classList.add("inactive");

      if (isTranscriptBlocked) {
        if (this.analyzeBtnText) this.analyzeBtnText.textContent = t("transcriptUnavailable");
      } else if (currentTabLoading || extractionPending) {
        if (this.analyzeBtnText) this.analyzeBtnText.textContent = t("loadingContent");
      } else {
        if (this.analyzeBtnText) this.analyzeBtnText.textContent = t("analyze");
      }
      this.analyzeBtn.title = notReadyReason;

      if (this.reanalyzeBtn) {
        if (!hasContent) {
          if (extractionPending) {
            this.reanalyzeBtn.disabled = true;
            this.reanalyzeBtn.classList.remove("inactive");
            this.reanalyzeBtn.textContent = t("loadingContent");
            this.reanalyzeBtn.title = t("retrievingPageContent");
          } else {
            this.reanalyzeBtn.disabled = false;
            this.reanalyzeBtn.classList.remove("inactive");
            this.reanalyzeBtn.textContent = t("loadAndReanalyze");
            this.reanalyzeBtn.title = t("loadAndReanalyzeTitle");
          }
        } else {
          this.reanalyzeBtn.disabled = false;
          this.reanalyzeBtn.classList.add("inactive");
          this.reanalyzeBtn.textContent = t("reanalyze");
          this.reanalyzeBtn.title = notReadyReason;
        }
      }
    } else {
      this.analyzeBtn.classList.remove("inactive");
      if (this.analyzeBtnText) {
        this.analyzeBtnText.textContent = hasAnalysisResult ? t("analyzeAgain") : t("analyze");
      }
      this.analyzeBtn.title = t("readerIntroBody");

      if (this.reanalyzeBtn) {
        this.reanalyzeBtn.disabled = false;
        this.reanalyzeBtn.classList.remove("inactive");
        this.reanalyzeBtn.title = t("buttonReanalyzeHint");
        this.reanalyzeBtn.textContent = t("reanalyze");
      }
    }
  }

  showStage1Confirm() {
    this.stage1ConfirmBox?.classList.remove("hidden");
  }

  hideStage1Confirm() {
    this.stage1ConfirmBox?.classList.add("hidden");
  }

  updateStage1ProceedBtn({ selectedCount = 0, totalEggsCount = 0, autoSave = false, isProceeding = false } = {}) {
    if (!this.stage1ProceedBtn) return;
    if (isProceeding) {
      this.stage1ProceedBtn.disabled = true;
      const title = t("analysisRunningHint");
      this.stage1ProceedBtn.title = title;
      this.stage1ProceedBtn.setAttribute?.("data-tooltip", title);
      if (this.eggAnalysisSelector) {
        this.eggAnalysisSelector.title = title;
        this.eggAnalysisSelector.setAttribute?.("data-tooltip", title);
      }
      if (this.eggAnalysisLabel) this.eggAnalysisLabel.textContent = t("analyzingEggs");
      return;
    }
    if (selectedCount === 0) {
      this.stage1ProceedBtn.disabled = true;
      const title = t("selectEggToAnalyzeHint");
      this.stage1ProceedBtn.title = title;
      this.stage1ProceedBtn.setAttribute?.("data-tooltip", title);
      if (this.eggAnalysisSelector) {
        this.eggAnalysisSelector.title = title;
        this.eggAnalysisSelector.setAttribute?.("data-tooltip", title);
      }
      if (this.eggAnalysisLabel) this.eggAnalysisLabel.textContent = t("eggAnalysisSelectEgg");
      if (this.stage1ConfirmText) {
        this.stage1ConfirmText.textContent = totalEggsCount === 0
          ? t("stage1NoEggsNotice")
          : t("stage1NoSelectedNotice");
      }
    } else {
      this.stage1ProceedBtn.disabled = false;
      this.stage1ProceedBtn.title = t("targetEggsTooltip");
      this.stage1ProceedBtn.removeAttribute?.("data-tooltip");
      if (this.eggAnalysisSelector) {
        this.eggAnalysisSelector.title = t("targetEggsTooltip");
        this.eggAnalysisSelector.removeAttribute?.("data-tooltip");
      }
      this.updateEggAnalysisLabel();
      if (this.stage1ConfirmText) {
        this.stage1ConfirmText.textContent = t("stage1SelectedNotice", { count: selectedCount });
      }
    }
  }

  updateActionButtons({
    isChromeMode = false,
    isStage1 = false,
    nutCollected = false,
    eggHatched = false,
    hasDelta = false,
  } = {}) {
    if (isChromeMode) {
      this.confirmBtn?.classList.add("hidden");
      this.confirmBtnWrap?.classList.add("hidden");
      this.collectNutBtn?.classList.add("hidden");
      this.collectNutBtnWrap?.classList.add("hidden");
      this.eggAnalysisSelector?.classList.add("hidden");
      return;
    }

    if (isStage1) {
      this.confirmBtn?.classList.add("hidden");
      this.confirmBtnWrap?.classList.add("hidden");
      this.eggAnalysisSelector?.classList.remove("hidden");
      const nutTitle = nutCollected ? t("nutAlreadySaved") : t("buttonCollectHint");
      if (this.collectNutBtn) {
        this.collectNutBtn.disabled = nutCollected;
        this.collectNutBtn.textContent = t(nutCollected ? "nutCollected" : "collectNutOnly");
        this.collectNutBtn.title = nutTitle;
        if (nutTitle) this.collectNutBtn.setAttribute?.("data-tooltip", nutTitle);
        else this.collectNutBtn.removeAttribute?.("data-tooltip");
      }
      if (this.collectNutBtnWrap) {
        this.collectNutBtnWrap.classList.remove("hidden");
        this.collectNutBtnWrap.title = nutTitle;
        if (nutTitle) this.collectNutBtnWrap.setAttribute?.("data-tooltip", nutTitle);
        else this.collectNutBtnWrap.removeAttribute?.("data-tooltip");
      }
      if (this.stage1SkipBtn) {
        this.stage1SkipBtn.disabled = nutCollected;
        this.stage1SkipBtn.textContent = t(nutCollected ? "nutCollected" : "collectNutOnly");
        this.stage1SkipBtn.title = nutTitle;
        if (nutTitle) this.stage1SkipBtn.setAttribute?.("data-tooltip", nutTitle);
        else this.stage1SkipBtn.removeAttribute?.("data-tooltip");
      }
      if (this.stage1SkipBtnWrap) {
        this.stage1SkipBtnWrap.title = nutTitle;
        if (nutTitle) this.stage1SkipBtnWrap.setAttribute?.("data-tooltip", nutTitle);
        else this.stage1SkipBtnWrap.removeAttribute?.("data-tooltip");
      }
      if (this.stage1ConfirmText) {
        this.stage1ConfirmText.textContent = nutCollected ? t("stage1NutSavedNotice") : t("stage1Complete");
      }
      const confirmIconEl = this.root.querySelector?.(".stage1-confirm-icon");
      if (confirmIconEl) {
        confirmIconEl.textContent = nutCollected ? "✅" : "ℹ️";
      }
      this.stage1ConfirmBox?.classList.toggle("stage1-saved", !!nutCollected);
      return;
    }

    this.eggAnalysisSelector?.classList.add("hidden");

    const nutTitle = nutCollected ? t("nutAlreadySaved") : t("buttonCollectHint");
    if (this.collectNutBtn) {
      this.collectNutBtn.disabled = nutCollected;
      this.collectNutBtn.textContent = t(nutCollected ? "nutCollected" : "collectNut");
      this.collectNutBtn.title = nutTitle;
      if (nutTitle) this.collectNutBtn.setAttribute?.("data-tooltip", nutTitle);
      else this.collectNutBtn.removeAttribute?.("data-tooltip");
    }
    if (this.collectNutBtnWrap) {
      this.collectNutBtnWrap.title = nutTitle;
      if (nutTitle) this.collectNutBtnWrap.setAttribute?.("data-tooltip", nutTitle);
      else this.collectNutBtnWrap.removeAttribute?.("data-tooltip");
    }

    if (this.confirmBtn) {
      this.confirmBtn.classList.remove("hidden");
      this.confirmBtnWrap?.classList.remove("hidden");
      const hatchTitle = eggHatched
        ? t("hatchAlreadySaved")
        : hasDelta
        ? t("buttonHatchHint")
        : t("noNewKnowledgeToAdd");

      if (eggHatched) {
        this.confirmBtn.disabled = true;
        this.confirmBtn.textContent = t("eggHatched");
        this.confirmBtn.title = hatchTitle;
      } else if (hasDelta) {
        this.confirmBtn.disabled = false;
        this.confirmBtn.textContent = t("hatchEgg");
        this.confirmBtn.title = t("buttonHatchHint");
      } else {
        this.confirmBtn.disabled = true;
        this.confirmBtn.textContent = t("hatchEgg");
        this.confirmBtn.title = hatchTitle;
      }
      if (hatchTitle) this.confirmBtn.setAttribute?.("data-tooltip", hatchTitle);
      else this.confirmBtn.removeAttribute?.("data-tooltip");
      if (this.confirmBtnWrap) {
        this.confirmBtnWrap.title = hatchTitle;
        if (hatchTitle) this.confirmBtnWrap.setAttribute?.("data-tooltip", hatchTitle);
        else this.confirmBtnWrap.removeAttribute?.("data-tooltip");
      }
    }
  }

  showProcessedNote(msg) {
    if (this.processedMessage) this.processedMessage.textContent = msg;
    this.processedNote?.classList.remove("hidden");
  }

  hideProcessedNote() {
    this.processedNote?.classList.add("hidden");
    if (this.processedMessage) this.processedMessage.textContent = "";
  }

  getProcessedMessage() {
    return this.processedMessage?.textContent || "";
  }

  isStage1ConfirmVisible() {
    return Boolean(this.stage1ConfirmBox && !this.stage1ConfirmBox.classList.contains("hidden"));
  }

  renderHistory(captureHistory = [], selectedNutId = null) {
    if (!this.historySelect) return;
    if (Array.isArray(captureHistory) && captureHistory.length > 1) {
      const hasMatch = selectedNutId != null && captureHistory.some((h) => String(h.nutId) === String(selectedNutId));
      this.historySelect.classList.remove("hidden");
      this.historySelect.innerHTML = captureHistory
        .map((h, i) => {
          const d = new Date(h.capturedAt).toLocaleString();
          const s = h.saved === "saved" ? t("stateSaved") : h.saved === "skip" ? t("stateCollected") : t("stateAnalyzed");
          const selected = (hasMatch ? String(h.nutId) === String(selectedNutId) : i === 0) ? " selected" : "";
          return `<option value="${i}"${selected}>${d} — ${s}</option>`;
        })
        .join("");
    } else {
      this.historySelect.classList.add("hidden");
      this.historySelect.innerHTML = "";
    }
  }

  setReanalyzingState(text) {
    if (this.reanalyzeBtn) {
      this.reanalyzeBtn.disabled = true;
      this.reanalyzeBtn.textContent = text;
    }
  }

  setReanalyzeRefreshLoading(isLoading) {
    if (!this.reanalyzeRefreshBtn) return;
    this.reanalyzeRefreshBtn.disabled = Boolean(isLoading);
    if (isLoading) {
      this.reanalyzeRefreshBtn.classList.add("rotating");
    } else {
      this.reanalyzeRefreshBtn.classList.remove("rotating");
    }
  }

  setAnalyzeButtonLoading(isLoading, text) {
    if (this.analyzeBtn) this.analyzeBtn.disabled = Boolean(isLoading);
    if (this.analyzeBtnText && text) this.analyzeBtnText.textContent = text;
  }

  setHistorySelectDisabled(disabled) {
    if (this.historySelect) this.historySelect.disabled = Boolean(disabled);
  }

  setConfirmButtonVisible(visible) {
    if (visible) this.confirmBtn?.classList.remove("hidden");
    else this.confirmBtn?.classList.add("hidden");
  }

  setCollectNutButtonVisible(visible) {
    if (visible) this.collectNutBtn?.classList.remove("hidden");
    else this.collectNutBtn?.classList.add("hidden");
  }

  setConfirmButtonLoading(isLoading, text) {
    if (this.confirmBtn) {
      this.confirmBtn.disabled = Boolean(isLoading);
      if (text) this.confirmBtn.textContent = text;
    }
  }

  setCollectNutLoading(isLoading, text) {
    if (this.collectNutBtn) {
      this.collectNutBtn.disabled = Boolean(isLoading);
      if (text) this.collectNutBtn.textContent = text;
    }
    if (this.stage1SkipBtn) {
      this.stage1SkipBtn.disabled = Boolean(isLoading);
      if (text) this.stage1SkipBtn.textContent = text;
    }
  }

  render(view, settings) {
    const result = view.analysisResult;
    const chromeMode = settings.connectionMode !== 'obsidian' || settings.isChromeMode(result);
    const stage1 = view.isStage1?.() || false;
    const busy = !!view.busy;
    const analyzing = !!view.isAnalyzing;
    const saving = !!view.savingToVault;
    const hatching = saving && view.operations.saving.phase === 'hatch';
    const collecting = saving && view.operations.saving.phase === 'collect';
    const ready = !view.currentTabLoading && !view.extractionPending;
    const blocked = globalThis.NutEggHelpers?.getAnalyzeNotReadyReason?.(view, settings);
    const analyzeDisabled = busy || !ready || !!blocked;
    const analyzeReason = blocked || (busy ? t('analysisRunningHint') : !ready ? t('pageLoadingHint') : '');
    const entries = ((result?.newKnowledge?.length || 0) > 0) || ((result?.eggResults || []).some(r => (r.extractedEntries?.length || 0) > 0));
    const operationLabel = saving ? t(hatching ? 'hatching' : 'collecting') : analyzing ? t(view.analyzingEggs ? 'analyzingEggs' : 'analyzing')
      : view.operations?.followup?.running ? t('askingBtn') : view.operations?.creation?.running ? t('creatingEgg') : t('analyzing');
    const selectionNeedsAnalysis = globalThis.NutEggHelpers?.selectedEggsNeedAnalysis?.(view);
    const hatched = view.eggHatched && !selectionNeedsAnalysis;
    const hatchReason = hatched ? t('hatchAlreadySaved') : busy ? t('hatchWaitForOperation', { operation: operationLabel })
      : selectionNeedsAnalysis ? t('hatchAnalyzeSelectedEggs')
      : !entries ? t('noNewKnowledgeToAdd') : '';
    const needsEggAnalysis = stage1 || Boolean(selectionNeedsAnalysis) || !view.selectedEggs?.size;
    const hatchHidden = chromeMode || !result || needsEggAnalysis;
    const defaultHints = new Map([
      [this.analyzeBtn, 'readerIntroBody'], [this.reanalyzeBtn, 'buttonReanalyzeHint'],
      [this.reanalyzeRefreshBtn, 'refreshTooltip'], [this.viewAnalysisBtn, 'viewAnalysis'],
      [this.stage1ProceedBtn, 'targetEggsTooltip'], [this.eggAnalysisOnlyBtn, 'eggAnalysisOnly'],
      [this.eggAnalysisWithKnowledgeBtn, 'generateKnowledgeEntries'], [this.confirmBtn, 'buttonHatchHint'],
      [this.collectNutBtn, 'buttonCollectHint'], [this.stage1SkipBtn, 'buttonCollectHint'],
      [this.backBtn, 'buttonBackHint'],
    ]);
    const set = (element, disabled, text, hidden = false, title = '', wrap = null) => {
      if (!element) return;
      if (!title && defaultHints.has(element)) title = t(defaultHints.get(element));
      element.disabled = !!disabled; element.title = title;
      if (title) {
        element.setAttribute?.('data-tooltip', title);
      } else {
        element.removeAttribute?.('data-tooltip');
      }
      if (text != null) element.textContent = text;
      element.classList.toggle('hidden', !!hidden);
      if (wrap) {
        wrap.title = title;
        if (title) {
          wrap.setAttribute?.('data-tooltip', title);
        } else {
          wrap.removeAttribute?.('data-tooltip');
        }
        wrap.classList.toggle('hidden', !!hidden);
      }
    };
    this.setMode(settings.analysisMode);
    if (busy || chromeMode || !result) this.toggleEggAnalysisMenu(false);
    this.updateEggAnalysisLabel(view.generateKnowledgeEntries);
    set(this.analyzeBtn, analyzeDisabled, null, false, analyzeReason, this.analyzeBtnWrap);
    this.analyzeBtn?.classList.toggle('inactive', analyzeDisabled);
    if (this.analyzeBtnText) this.analyzeBtnText.textContent = t(analyzing ? 'analyzing' : 'analyze');
    set(this.reanalyzeBtn, analyzeDisabled, t(analyzing ? 'analyzing' : 'reanalyze'), false, analyzeReason, this.reanalyzeBtnWrap);
    this.reanalyzeBtn?.classList.toggle('inactive', analyzeDisabled);
    set(this.reanalyzeRefreshBtn, busy || !ready, null, false, busy ? t('operationInProgressHint') : !ready ? t('pageLoadingHint') : '');
    this.reanalyzeRefreshBtn?.classList.toggle('rotating', !!view.extractionPending);
    set(this.viewAnalysisBtn, !result, t('viewAnalysis'), !result);

    const stage1ProceedDisabled = busy || !view.selectedEggs?.size;
    const stage1ProceedReason = busy ? t('analysisRunningHint') : !view.selectedEggs?.size ? t('selectEggToAnalyzeHint') : '';
    const eggAnalysisHidden = chromeMode || !result || !needsEggAnalysis;
    set(this.stage1ProceedBtn, stage1ProceedDisabled, null, eggAnalysisHidden, stage1ProceedReason, this.eggAnalysisSelector);
    if (this.eggAnalysisLabel) {
      this.eggAnalysisLabel.textContent = view.analyzingEggs
        ? t('analyzingEggs')
        : analyzing
        ? t('analyzing')
        : !view.selectedEggs?.size
        ? t('eggAnalysisSelectEgg')
        : this.getEggAnalysisLabelText(view.generateKnowledgeEntries);
    }
    set(this.eggAnalysisOnlyBtn, busy, `${view.generateKnowledgeEntries ? '' : '✓ '}${t('eggAnalysisOnly')}`);
    set(this.eggAnalysisWithKnowledgeBtn, busy, `${view.generateKnowledgeEntries ? '✓ ' : ''}${t('eggAnalysisWithKnowledge')}`);
    const bannerHidden = chromeMode || !result || !needsEggAnalysis;
    this.stage1ConfirmBox?.classList.toggle('hidden', bannerHidden);
    this.stage1ConfirmBox?.classList.toggle('stage1-saved', !!view.nutCollected);
    if (this.stage1ConfirmText) {
      this.stage1ConfirmText.textContent = view.nutCollected
        ? t('stage1NutSavedNotice')
        : view.selectedEggs?.size
        ? t('stage1SelectedNotice', { count: view.selectedEggs?.size || 0 })
        : view.allEggs?.length
        ? t('stage1NoSelectedNotice')
        : t('stage1NoEggsNotice');
    }
    const icon = this.root.querySelector?.('.stage1-confirm-icon');
    if (icon) icon.textContent = view.nutCollected ? '✅' : 'ℹ️';
    set(this.confirmBtn, !!hatchReason, t(hatching ? 'hatching' : hatched ? 'eggHatched' : 'hatchEgg'), hatchHidden, hatchReason, this.confirmBtnWrap);

    const nutDisabled = busy || view.nutCollected;
    const nutReason = view.nutCollected ? t('nutAlreadySaved') : busy ? t('operationInProgressHint') : '';
    set(this.collectNutBtn, nutDisabled, t(collecting ? 'collecting' : view.nutCollected ? 'nutCollected' : needsEggAnalysis ? 'collectNutOnly' : 'collectNut'), chromeMode || !result, nutReason, this.collectNutBtnWrap);
    set(this.stage1SkipBtn, nutDisabled, t(collecting ? 'collecting' : view.nutCollected ? 'nutCollected' : 'collectNutOnly'), true, nutReason, this.stage1SkipBtnWrap);
    set(this.historySelect, busy, null, (view.captureHistory?.length || 0) < 2);
    set(this.backBtn, false, t('readerBack'));
    this.discardBtn?.classList.toggle('hidden', settings.connectionMode !== 'obsidian');
    this.showProcessedNote(result ? t(analyzing ? 'analyzingContent' : 'analysisCompleteAdjust') : '');
    this.processedNote?.classList.toggle('hidden', !result);
    const key = JSON.stringify([view.currentNutId, view.captureHistory]);
    if (key !== this.historyKey) { this.historyKey = key; this.renderHistory(view.captureHistory || [], view.currentNutId); }
    if (this.historySelect) this.historySelect.disabled = busy;
    if (settings.connectionMode !== 'obsidian') this.historySelect?.classList.add('hidden');
  }

}

const _actionsScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_actionsScope.NutEggUI = _actionsScope.NutEggUI || {};
_actionsScope.NutEggUI.ActionControlsComponent = ActionControlsComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ActionControlsComponent };
}
