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

  updateStage1ProceedBtn({ selectedCount = 0, totalEggsCount = 0 } = {}) {
    if (!this.stage1ProceedBtn) return;
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

  updateActionButtons({ eggHatched = false, nutCollected = false, hasNewKnowledge = false, isHatch = false } = {}) {
    if (this.confirmBtn) {
      if (eggHatched) {
        this.confirmBtn.disabled = true;
        this.confirmBtn.textContent = _actionsT("eggHatchedStatus");
        this.confirmBtn.classList.add("confirmed");
      } else if (!hasNewKnowledge) {
        this.confirmBtn.disabled = true;
        this.confirmBtn.textContent = _actionsT("noNewKnowledge");
        this.confirmBtn.classList.remove("confirmed");
      } else {
        this.confirmBtn.disabled = false;
        this.confirmBtn.textContent = _actionsT("hatchEgg");
        this.confirmBtn.classList.remove("confirmed");
      }
    }

    if (this.collectNutBtn) {
      if (nutCollected) {
        this.collectNutBtn.disabled = true;
        this.collectNutBtn.textContent = isHatch ? _actionsT("eggHatchedStatus") : _actionsT("nutCollectedStatus");
        this.collectNutBtn.classList.add("collected");
      } else {
        this.collectNutBtn.disabled = false;
        this.collectNutBtn.textContent = _actionsT("collectNut");
        this.collectNutBtn.classList.remove("collected");
      }
    }
  }
}

const _actionsScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_actionsScope.NutEggUI = _actionsScope.NutEggUI || {};
_actionsScope.NutEggUI.ActionControlsComponent = ActionControlsComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ActionControlsComponent };
}

