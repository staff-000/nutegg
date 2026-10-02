// ============================================================
// NutEgg Popup UI — Verdict Component
// ============================================================

class VerdictComponent {
  constructor(root = document) {
    this.root = root;
    this.bindElements(root);
  }

  bindElements(root = this.root || (typeof document !== "undefined" ? document : null)) {
    if (!root) return;
    const getEl = (id) => (root.getElementById ? root.getElementById(id) : root.querySelector ? root.querySelector(`#${id}`) : null) || (typeof document !== "undefined" ? document.getElementById(id) : null);

    this.verdictSection = getEl("verdict-section");
    this.titleVerdictSection = getEl("title-verdict-section");
    this.verdictAnswer = getEl("verdict-answer");
    this.verdictBadge = getEl("verdict-badge");
    this.verdictIcon = getEl("verdict-icon");
    this.verdictText = getEl("verdict-text");
    this.verdictReason = getEl("verdict-reason");
  }

  renderTitleVerdict(titleVerdict, enabled = true) {
    if (!this.titleVerdictSection && (this.root || typeof document !== "undefined")) {
      this.bindElements(this.root || document);
    }
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
    if (!this.verdictSection && (this.root || typeof document !== "undefined")) {
      this.bindElements(this.root || document);
    }
    if (!this.verdictSection) return;
    this.verdictSection.classList.remove("hidden");

    if (this.verdictIcon && this.verdictText && this.verdictBadge) {
      if (result.shouldRead) {
        this.verdictIcon.textContent = "✅";
        this.verdictText.textContent = t("verdictWorthReading");
        this.verdictBadge.className = "verdict-badge verdict-yes";
      } else {
        this.verdictIcon.textContent = "⏭️";
        this.verdictText.textContent = t("verdictSkipIt");
        this.verdictBadge.className = "verdict-badge verdict-no";
      }
    }

    if (this.verdictReason) {
      this.verdictReason.textContent = result.shouldReadReason || "";
    }
  }

  setComparing(count = 0) {
    if (!this.verdictSection && (this.root || typeof document !== "undefined")) {
      this.bindElements(this.root || document);
    }
    if (!this.verdictSection) return;
    this.verdictSection.classList.remove("hidden");
    if (this.verdictBadge) this.verdictBadge.className = "verdict-badge";
    if (this.verdictIcon) this.verdictIcon.textContent = "⏳";
    if (this.verdictText) this.verdictText.textContent = t("comparingKnowledge");
    if (this.verdictReason) {
      this.verdictReason.textContent = count > 0 ? t("comparingAgainstEggs", { count }) : "";
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

    // 1. Title Verdict: always rendered when present in result and enabled in settings
    const effectiveSections = session?.enabledSections || settings?.enabledSections;
    this.renderTitleVerdict(result.titleVerdict, effectiveSections?.titleVerdict !== false);

    // 2. Decision Verdict ("Should you read it?"):
    // Only available when matching/comparing against eggs in vault (Obsidian mode).
    // Not applicable in Chrome standalone mode or before eggs are confirmed in Stage 1 confirm mode.
    const isChrome = settings ? settings.isChromeMode(result) : false;
    const isStage1 = session?.isStage1 ? session.isStage1(result) : (result.stage === "stage1" || result.mode === "chrome");
    const confirmMode = settings?.analysisMode === "confirm";

    if (isChrome || (isStage1 && confirmMode)) {
      this.verdictSection?.classList.add("hidden");
      return;
    }

    if (result.shouldRead !== undefined) {
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

