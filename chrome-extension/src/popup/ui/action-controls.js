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

  render(session, settings) {
    this.updateEggAnalysisLabel(session?.generateKnowledgeEntries !== false);
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
        this.showStage1Confirm();
        this.setConfirmButtonVisible(!isStage1);
      }

      this.updateActionButtons({
        isChromeMode: isChrome,
        isStage1,
        nutCollected: Boolean(session?.nutCollected),
        eggHatched: Boolean(session?.eggHatched),
        hasDelta: Boolean(result?.eggResults?.some(egg => egg.extractedEntries?.length)),
      });

      if (!isChrome) {
        this.updateStage1ProceedBtn({
          selectedCount: session?.selectedEggs?.size || 0,
          totalEggsCount: session?.allEggs?.length || 0,
          isProceeding: Boolean(session?.isAnalyzing || session?.isReanalyzing),
        });
        if (this.stage1SkipBtn) {
          this.stage1SkipBtn.disabled = Boolean(session?.nutCollected);
          this.stage1SkipBtn.textContent = t(session?.nutCollected ? "nutCollected" : "collectNutOnly");
        }
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

