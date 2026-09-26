// ============================================================
// NutEgg Popup UI — Verdict Component
// ============================================================

const _verdictT = (key, params) => {
  if (typeof t === "function") return t(key, params);
  if (typeof window !== "undefined" && window.NutEggI18n) return window.NutEggI18n.t(key, params);
  return key;
};

class VerdictComponent {
  constructor(root = document) {
    this.root = root;
    this.verdictSection = root.getElementById("verdict-section");
    this.titleVerdictSection = root.getElementById("title-verdict-section");
    this.verdictAnswer = root.getElementById("verdict-answer");
    this.verdictBadge = root.getElementById("verdict-badge");
    this.verdictIcon = root.getElementById("verdict-icon");
    this.verdictText = root.getElementById("verdict-text");
    this.verdictReason = root.getElementById("verdict-reason");
  }

  renderTitleVerdict(titleVerdict, enabled = true) {
    if (!this.titleVerdictSection || !this.verdictAnswer) return;
    if (titleVerdict && enabled) {
      this.titleVerdictSection.classList.remove("hidden");
      this.verdictAnswer.textContent = titleVerdict;
    } else {
      this.titleVerdictSection.classList.add("hidden");
      this.verdictAnswer.textContent = "";
    }
  }

  renderDecision(result) {
    if (!this.verdictSection) return;
    this.verdictSection.classList.remove("hidden");

    if (this.verdictIcon && this.verdictText && this.verdictBadge) {
      if (result.shouldRead) {
        this.verdictIcon.textContent = "✅";
        this.verdictText.textContent = _verdictT("verdictWorthReading");
        this.verdictBadge.className = "verdict-badge verdict-yes";
      } else {
        this.verdictIcon.textContent = "⏭️";
        this.verdictText.textContent = _verdictT("verdictSkipIt");
        this.verdictBadge.className = "verdict-badge verdict-no";
      }
    }

    if (this.verdictReason) {
      this.verdictReason.textContent = result.shouldReadReason || "";
    }
  }

  setComparing(count = 0) {
    if (!this.verdictSection) return;
    this.verdictSection.classList.remove("hidden");
    if (this.verdictBadge) this.verdictBadge.className = "verdict-badge";
    if (this.verdictIcon) this.verdictIcon.textContent = "⏳";
    if (this.verdictText) this.verdictText.textContent = _verdictT("comparingKnowledge");
    if (this.verdictReason) {
      this.verdictReason.textContent = count > 0 ? _verdictT("comparingAgainstEggs", { count }) : "";
    }
  }

  show() {
    this.verdictSection?.classList.remove("hidden");
  }

  hide() {
    this.verdictSection?.classList.add("hidden");
    this.titleVerdictSection?.classList.add("hidden");
  }

  reset() {
    this.hide();
    if (this.verdictAnswer) this.verdictAnswer.textContent = "";
    if (this.verdictText) this.verdictText.textContent = "";
    if (this.verdictReason) this.verdictReason.textContent = "";
    if (this.verdictIcon) this.verdictIcon.textContent = "";
    if (this.verdictBadge) this.verdictBadge.className = "verdict-badge";
  }

  render(session, settings) {
    const result = session?.analysisResult;
    if (!result) {
      this.hide();
      return;
    }

    const isChrome = settings ? settings.isChromeMode() : false;
    const isStage1 = session?.isStage1 ? session.isStage1(result) : (result.stage === "stage1" || result.mode === "chrome");
    const confirmMode = settings?.analysisMode === "confirm";

    if (isChrome || (isStage1 && confirmMode)) {
      this.hide();
      return;
    }

    // Title Verdict
    this.renderTitleVerdict(result.titleVerdict, settings?.enabledSections?.titleVerdict !== false);

    // Decision Verdict
    if (isStage1) {
      if (settings?.analysisMode === "fast") {
        this.show();
      } else {
        this.verdictSection?.classList.add("hidden");
      }
    } else if (result.shouldRead !== undefined) {
      this.show();
      this.renderDecision(result);
    } else {
      this.verdictSection?.classList.add("hidden");
    }
  }
}

const _verdictScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_verdictScope.NutEggUI = _verdictScope.NutEggUI || {};
_verdictScope.NutEggUI.VerdictComponent = VerdictComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { VerdictComponent };
}

