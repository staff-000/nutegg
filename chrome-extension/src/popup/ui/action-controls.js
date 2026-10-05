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
    this.eggAnalysisLabel = root.getElementById("egg-analysis-label");
    this.eggAnalysisMenu = root.getElementById("egg-analysis-menu");
    this.eggAnalysisOnlyBtn = root.getElementById("egg-analysis-only");
    this.eggAnalysisWithKnowledgeBtn = root.getElementById("egg-analysis-with-knowledge");
    this.generateKnowledgeEntries = true;
    this.stage1SkipBtn = root.getElementById("stage1-skip-btn");

    this.confirmBtn = root.getElementById("confirm-btn");
    this.confirmBtnWrap = root.getElementById("confirm-btn-wrap");
    this.collectNutBtn = root.getElementById("collect-nut-btn");
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

  updateEggAnalysisLabel(generateKnowledgeEntries = this.generateKnowledgeEntries) {
    this.generateKnowledgeEntries = generateKnowledgeEntries;
    if (this.eggAnalysisLabel) this.eggAnalysisLabel.textContent = t("eggAnalysis");
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
    if (mode === "confirm") {
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
      this.analyzeBtn.title = "";

      if (this.reanalyzeBtn) {
        this.reanalyzeBtn.disabled = false;
        this.reanalyzeBtn.classList.remove("inactive");
        this.reanalyzeBtn.title = "";
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
      if (this.eggAnalysisLabel) this.eggAnalysisLabel.textContent = t("analyzingEggs");
      return;
    }
    if (selectedCount === 0) {
      this.stage1ProceedBtn.disabled = true;
      if (this.eggAnalysisLabel) this.eggAnalysisLabel.textContent = t("eggAnalysisSelectEgg");
      if (this.stage1ConfirmText) {
        this.stage1ConfirmText.innerHTML = totalEggsCount === 0
          ? t("stage1NoEggsNotice")
          : t("stage1NoSelectedNotice");
      }
    } else {
      this.stage1ProceedBtn.disabled = false;
      this.updateEggAnalysisLabel();
      if (this.stage1ConfirmText) {
        this.stage1ConfirmText.innerHTML = t("stage1SelectedNotice", { count: selectedCount });
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
      this.collectNutBtn?.classList.add("hidden");
      return;
    }

    if (isStage1) {
      this.confirmBtn?.classList.add("hidden");
      if (nutCollected) {
        if (this.collectNutBtn) {
          this.collectNutBtn.disabled = true;
          this.collectNutBtn.textContent = t("nutCollected");
        }
        if (this.stage1SkipBtn) {
          this.stage1SkipBtn.disabled = true;
          this.stage1SkipBtn.textContent = t("nutCollected");
        }
        if (this.stage1ConfirmText) {
          this.stage1ConfirmText.innerHTML = t("stage1NutSavedNotice");
        }
        const confirmIconEl = this.root.querySelector?.(".stage1-confirm-icon");
        if (confirmIconEl) {
          confirmIconEl.textContent = "✅";
        }
        this.stage1ConfirmBox?.classList.add("stage1-saved");
      } else {
        if (this.collectNutBtn) {
          this.collectNutBtn.disabled = false;
          this.collectNutBtn.textContent = t("collectNutOnly");
        }
        if (this.stage1SkipBtn) {
          this.stage1SkipBtn.disabled = false;
          this.stage1SkipBtn.textContent = t("collectNutOnly");
        }
        this.stage1ConfirmBox?.classList.remove("stage1-saved");
      }
      return;
    }

    if (nutCollected) {
      if (this.collectNutBtn) {
        this.collectNutBtn.disabled = true;
        this.collectNutBtn.textContent = t("nutCollected");
      }
    } else {
      if (this.collectNutBtn) {
        this.collectNutBtn.disabled = false;
        this.collectNutBtn.textContent = t("collectNut");
      }
    }

    if (this.confirmBtn) {
      this.confirmBtn.classList.remove("hidden");
      if (eggHatched) {
        this.confirmBtn.disabled = true;
        this.confirmBtn.textContent = t("eggHatched");
        this.confirmBtn.title = "";
      } else if (hasDelta) {
        this.confirmBtn.disabled = false;
        this.confirmBtn.textContent = t("hatchEgg");
        this.confirmBtn.title = "";
      } else {
        this.confirmBtn.disabled = true;
        this.confirmBtn.textContent = t("hatchEgg");
        this.confirmBtn.title = t("noNewKnowledgeToAdd");
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
    const chromeMode = settings.isChromeMode(result);
    const stage1 = view.isStage1?.() || false;
    const busy = !!view.busy;
    const analyzing = !!view.isAnalyzing;
    const saving = !!view.savingToVault;
    const hatching = saving && view.operations.saving.phase === 'hatch';
    const collecting = saving && view.operations.saving.phase === 'collect';
    const ready = !view.currentTabLoading && !view.extractionPending;
    const blocked = globalThis.NutEggHelpers?.getAnalyzeNotReadyReason?.(view, settings);
    const analyzeDisabled = busy || !ready || !!blocked;
    const entries = (result?.newKnowledge?.length || 0) > 0;
    const operationLabel = saving ? t(hatching ? 'hatching' : 'collecting') : analyzing ? t(view.analyzingEggs ? 'analyzingEggs' : 'analyzing')
      : view.operations?.followup?.running ? t('askingBtn') : view.operations?.creation?.running ? t('creatingEgg') : t('analyzing');
    const hatchReason = view.eggHatched ? t('hatchAlreadySaved') : busy ? t('hatchWaitForOperation', { operation: operationLabel })
      : !entries ? t('noNewKnowledgeToAdd') : '';
    const hatchHidden = chromeMode || !result || stage1;
    const set = (element, disabled, text, hidden = false, title = '') => {
      if (!element) return;
      element.disabled = !!disabled; element.title = title;
      if (text != null) element.textContent = text;
      element.classList.toggle('hidden', !!hidden);
    };
    this.setMode(settings.analysisMode);
    if (busy || chromeMode || !result) this.toggleEggAnalysisMenu(false);
    this.updateEggAnalysisLabel(view.generateKnowledgeEntries);
    set(this.analyzeBtn, analyzeDisabled, null, false, blocked || '');
    this.analyzeBtn?.classList.toggle('inactive', analyzeDisabled);
    if (this.analyzeBtnText) this.analyzeBtnText.textContent = t(analyzing ? 'analyzing' : 'analyze');
    set(this.reanalyzeBtn, analyzeDisabled, t(analyzing ? 'analyzing' : 'reanalyze'), false, blocked || '');
    this.reanalyzeBtn?.classList.toggle('inactive', analyzeDisabled);
    set(this.reanalyzeRefreshBtn, busy || !ready, null);
    this.reanalyzeRefreshBtn?.classList.toggle('rotating', !!view.extractionPending);
    set(this.viewAnalysisBtn, !result, t('viewAnalysis'), !result);
    set(this.stage1ProceedBtn, busy || !view.selectedEggs?.size, null, chromeMode || !result);
    if (this.eggAnalysisLabel) this.eggAnalysisLabel.textContent = t(view.analyzingEggs ? 'analyzingEggs' : analyzing ? 'analyzing' : !view.selectedEggs?.size ? 'eggAnalysisSelectEgg' : 'eggAnalysis');
    set(this.eggAnalysisOnlyBtn, busy, `${view.generateKnowledgeEntries ? '' : '✓ '}${t('eggAnalysisOnly')}`);
    set(this.eggAnalysisWithKnowledgeBtn, busy, `${view.generateKnowledgeEntries ? '✓ ' : ''}${t('eggAnalysisWithKnowledge')}`);
    this.stage1ConfirmBox?.classList.toggle('hidden', chromeMode || !result);
    this.stage1ConfirmBox?.classList.toggle('stage1-saved', !!view.nutCollected);
    if (this.stage1ConfirmText) this.stage1ConfirmText.innerHTML = t(view.nutCollected ? 'stage1NutSavedNotice' : view.selectedEggs?.size ? 'stage1SelectedNotice' : view.allEggs?.length ? 'stage1NoSelectedNotice' : 'stage1NoEggsNotice', { count: view.selectedEggs?.size || 0 });
    const icon = this.root.querySelector?.('.stage1-confirm-icon');
    if (icon) icon.textContent = view.nutCollected ? '✅' : '🥚';
    set(this.confirmBtn, !!hatchReason, t(hatching ? 'hatching' : view.eggHatched ? 'eggHatched' : 'hatchEgg'), hatchHidden, hatchReason);
    if (this.confirmBtnWrap) {
      this.confirmBtnWrap.title = hatchReason;
      this.confirmBtnWrap.classList.toggle('hidden', !!hatchHidden);
    }
    set(this.collectNutBtn, busy || view.nutCollected, t(collecting ? 'collecting' : view.nutCollected ? 'nutCollected' : 'collectNut'), chromeMode || !result);
    set(this.stage1SkipBtn, busy || view.nutCollected, t(collecting ? 'collecting' : view.nutCollected ? 'nutCollected' : 'collectNutOnly'));
    set(this.historySelect, busy, null, (view.captureHistory?.length || 0) < 2);
    set(this.backBtn, false, t('back'));
    this.showProcessedNote(result ? t(analyzing ? 'analyzingContent' : 'analysisCompleteAdjust') : '');
    this.processedNote?.classList.toggle('hidden', !result);
    const key = JSON.stringify([view.currentNutId, view.captureHistory]);
    if (key !== this.historyKey) { this.historyKey = key; this.renderHistory(view.captureHistory || [], view.currentNutId); }
    if (this.historySelect) this.historySelect.disabled = busy;
  }

}

const _actionsScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_actionsScope.NutEggUI = _actionsScope.NutEggUI || {};
_actionsScope.NutEggUI.ActionControlsComponent = ActionControlsComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ActionControlsComponent };
}
