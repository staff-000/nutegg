// ============================================================
// NutEgg Popup UI — Action Controls Component
// ============================================================

const _actionsT = (key, params) => {
  if (typeof t === "function") return t(key, params);
  if (typeof window !== "undefined" && window.NutEggI18n) return window.NutEggI18n.t(key, params);
  return key;
};

class ActionControlsComponent {
  constructor(root = document) {
    this.root = root;
    this.modeFastBtn = root.getElementById("mode-fast-btn");
    this.modeConfirmBtn = root.getElementById("mode-confirm-btn");
    this.analyzeBtn = root.getElementById("analyze-btn");
    this.analyzeBtnText = root.getElementById("analyze-btn-text");
    this.reanalyzeBtn = root.getElementById("reanalyze-btn");
    this.historySelect = root.getElementById("history-select");
    this.processedNote = root.getElementById("processed-note");
    this.processedMessage = root.getElementById("processed-message");

    this.stage1ConfirmBox = root.getElementById("stage1-confirm-box");
    this.stage1ConfirmText = root.getElementById("stage1-confirm-text");
    this.stage1ProceedBtn = root.getElementById("stage1-proceed-btn");
    this.stage1SkipBtn = root.getElementById("stage1-skip-btn");

    this.confirmBtn = root.getElementById("confirm-btn");
    this.collectNutBtn = root.getElementById("collect-nut-btn");
    this.discardBtn = root.getElementById("discard-btn");
    this.backBtn = root.getElementById("back-btn");
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
    if (!this.analyzeBtn) return;

    if (isAnalyzing) {
      this.analyzeBtn.disabled = true;
      this.analyzeBtn.classList.remove("inactive");
      if (this.analyzeBtnText) this.analyzeBtnText.textContent = _actionsT("analyzing");
      this.analyzeBtn.title = _actionsT("analyzing");

      if (this.reanalyzeBtn) {
        this.reanalyzeBtn.disabled = true;
        this.reanalyzeBtn.classList.remove("inactive");
        this.reanalyzeBtn.textContent = _actionsT("analyzing");
        this.reanalyzeBtn.title = _actionsT("analyzing");
      }
      return;
    }

    this.analyzeBtn.disabled = false;
    if (this.reanalyzeBtn) this.reanalyzeBtn.disabled = false;

    if (notReadyReason) {
      this.analyzeBtn.classList.add("inactive");

      if (isTranscriptBlocked) {
        if (this.analyzeBtnText) this.analyzeBtnText.textContent = _actionsT("transcriptUnavailable");
      } else if (currentTabLoading || extractionPending) {
        if (this.analyzeBtnText) this.analyzeBtnText.textContent = _actionsT("loadingContent");
      } else {
        if (this.analyzeBtnText) this.analyzeBtnText.textContent = _actionsT("analyze");
      }
      this.analyzeBtn.title = notReadyReason;

      if (this.reanalyzeBtn) {
        if (!hasContent) {
          if (extractionPending) {
            this.reanalyzeBtn.disabled = true;
            this.reanalyzeBtn.classList.remove("inactive");
            this.reanalyzeBtn.textContent = _actionsT("loadingContent");
            this.reanalyzeBtn.title = _actionsT("retrievingPageContent");
          } else {
            this.reanalyzeBtn.disabled = false;
            this.reanalyzeBtn.classList.remove("inactive");
            this.reanalyzeBtn.textContent = _actionsT("loadAndReanalyze");
            this.reanalyzeBtn.title = _actionsT("loadAndReanalyzeTitle");
          }
        } else {
          this.reanalyzeBtn.disabled = false;
          this.reanalyzeBtn.classList.add("inactive");
          this.reanalyzeBtn.textContent = _actionsT("reanalyze");
          this.reanalyzeBtn.title = notReadyReason;
        }
      }
    } else {
      this.analyzeBtn.classList.remove("inactive");
      if (this.analyzeBtnText) {
        this.analyzeBtnText.textContent = hasAnalysisResult ? _actionsT("analyzeAgain") : _actionsT("analyze");
      }
      this.analyzeBtn.title = "";

      if (this.reanalyzeBtn) {
        this.reanalyzeBtn.disabled = false;
        this.reanalyzeBtn.classList.remove("inactive");
        this.reanalyzeBtn.title = "";
        this.reanalyzeBtn.textContent = _actionsT("reanalyze");
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
      this.stage1ProceedBtn.textContent = autoSave ? _actionsT("hatchingEggWaiting") : _actionsT("analyzing");
      return;
    }
    if (selectedCount === 0) {
      this.stage1ProceedBtn.disabled = true;
      this.stage1ProceedBtn.textContent = _actionsT("hatchEggSelectEgg");
      if (this.stage1ConfirmText) {
        this.stage1ConfirmText.innerHTML = totalEggsCount === 0
          ? _actionsT("stage1NoEggsNotice")
          : _actionsT("stage1NoSelectedNotice");
      }
    } else {
      this.stage1ProceedBtn.disabled = false;
      this.stage1ProceedBtn.textContent = selectedCount === 1 ? _actionsT("hatchEgg") : _actionsT("hatchEggCount", { count: selectedCount });
      if (this.stage1ConfirmText) {
        this.stage1ConfirmText.innerHTML = _actionsT("stage1SelectedNotice", { count: selectedCount });
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
          this.collectNutBtn.textContent = _actionsT("nutCollected");
        }
        if (this.stage1SkipBtn) {
          this.stage1SkipBtn.disabled = true;
          this.stage1SkipBtn.textContent = _actionsT("nutCollected");
        }
        if (this.stage1ConfirmText) {
          this.stage1ConfirmText.innerHTML = _actionsT("stage1NutSavedNotice");
        }
        const confirmIconEl = this.root.querySelector?.(".stage1-confirm-icon");
        if (confirmIconEl) {
          confirmIconEl.textContent = "✅";
        }
        this.stage1ConfirmBox?.classList.add("stage1-saved");
      } else {
        if (this.collectNutBtn) {
          this.collectNutBtn.disabled = false;
          this.collectNutBtn.textContent = _actionsT("collectNutOnly");
        }
        if (this.stage1SkipBtn) {
          this.stage1SkipBtn.disabled = false;
          this.stage1SkipBtn.textContent = _actionsT("collectNutOnly");
        }
        this.stage1ConfirmBox?.classList.remove("stage1-saved");
      }
      return;
    }

    if (nutCollected) {
      if (this.collectNutBtn) {
        this.collectNutBtn.disabled = true;
        this.collectNutBtn.textContent = _actionsT("nutCollected");
      }
    } else {
      if (this.collectNutBtn) {
        this.collectNutBtn.disabled = false;
        this.collectNutBtn.textContent = _actionsT("collectNut");
      }
    }

    if (this.confirmBtn) {
      this.confirmBtn.classList.remove("hidden");
      if (eggHatched) {
        this.confirmBtn.disabled = true;
        this.confirmBtn.textContent = _actionsT("eggHatched");
        this.confirmBtn.title = "";
      } else if (hasDelta) {
        this.confirmBtn.disabled = false;
        this.confirmBtn.textContent = _actionsT("hatchEgg");
        this.confirmBtn.title = "";
      } else {
        this.confirmBtn.disabled = true;
        this.confirmBtn.textContent = _actionsT("hatchEgg");
        this.confirmBtn.title = _actionsT("noNewKnowledgeToAdd");
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
          const s = h.saved === "saved" ? _actionsT("stateSaved") : h.saved === "skip" ? _actionsT("stateCollected") : _actionsT("stateAnalyzed");
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

  render(session, settings) {
    if (!settings && !session) return;
    if (settings?.analysisMode) {
      this.setMode(settings.analysisMode);
    }

    const result = session?.analysisResult;
    const isChrome = settings ? settings.isChromeMode() : false;
    const isStage1 = session?.isStage1 ? session.isStage1(result) : (result?.stage === "stage1" || result?.mode === "chrome");

    if (result) {
      if (isChrome) {
        this.hideStage1Confirm();
        this.setConfirmButtonVisible(false);
        this.setCollectNutButtonVisible(false);
      } else {
        this.setCollectNutButtonVisible(true);
        if (isStage1) {
          const matchedCount = (result?.matchedEggs || []).length;
          const shouldShowConfirm = settings?.analysisMode === "confirm" || matchedCount === 0;
          if (shouldShowConfirm) {
            this.showStage1Confirm();
          } else {
            this.hideStage1Confirm();
          }
          this.setConfirmButtonVisible(false);
        } else {
          this.hideStage1Confirm();
          this.setConfirmButtonVisible(true);
        }
      }

      const hasDelta = (result?.newKnowledge?.length || 0) > 0 || (result?.novelDelta?.length || 0) > 0;
      this.updateActionButtons({
        isChromeMode: isChrome,
        isStage1,
        nutCollected: Boolean(session?.nutCollected),
        eggHatched: Boolean(session?.eggHatched),
        hasDelta,
      });

      const matchedCount = (result?.matchedEggs || []).length;
      const shouldShowConfirm = isStage1 && (settings?.analysisMode === "confirm" || matchedCount === 0);
      if (shouldShowConfirm) {
        this.updateStage1ProceedBtn({
          selectedCount: session?.selectedEggs?.size || 0,
          totalEggsCount: session?.allEggs?.length || 0,
          isProceeding: Boolean(session?.isAnalyzing),
        });
      }
    } else {
      this.hideStage1Confirm();
      this.setConfirmButtonVisible(false);
      this.setCollectNutButtonVisible(false);
    }

    // Analyze buttons
    this.updateAnalyzeState({
      isAnalyzing: Boolean(session?.isAnalyzing),
      canAnalyze: session?.canAnalyze !== false,
      notReadyReason: session?.notReadyReason || null,
      isTranscriptBlocked: Boolean(session?.isTranscriptBlocked),
      currentTabLoading: Boolean(session?.currentTabLoading),
      extractionPending: Boolean(session?.extractionPending),
      hasContent: Boolean(session?.extractedContent?.content),
      hasAnalysisResult: Boolean(session?.analysisResult),
    });

    // History select
    if (session?.captureHistory) {
      this.renderHistory(session.captureHistory, session.currentNutId);
    }
  }
}

const _actionsScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_actionsScope.NutEggUI = _actionsScope.NutEggUI || {};
_actionsScope.NutEggUI.ActionControlsComponent = ActionControlsComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ActionControlsComponent };
}

