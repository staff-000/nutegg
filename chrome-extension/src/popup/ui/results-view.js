// ============================================================
// NutEgg Popup UI — Results View Component
// ============================================================

class ResultsViewComponent {
  constructor(root = document) {
    this.root = root;
    this.captureState = root.getElementById("capture-state");
    this.resultsState = root.getElementById("results-state");
    this.resultPageInfo = root.getElementById("result-page-info");
    this.resultPageTitle = root.getElementById("result-page-title");
    this.resultPageAuthor = root.getElementById("result-page-author");
    this.resultPagePublished = root.getElementById("result-page-published");
    this.coreSummarySection = root.getElementById("core-summary-section");
    this.coreSummaryEl = root.getElementById("core-summary");
  }

  showResults() {
    this.captureState?.classList.add("hidden");
    this.resultsState?.classList.remove("hidden");
  }

  showCapture() {
    this.resultsState?.classList.add("hidden");
    this.captureState?.classList.remove("hidden");
  }

  renderProvenance(metadata = {}, title = "") {
    if (this.resultPageTitle) this.resultPageTitle.textContent = title;
    const author = metadata.author || metadata.channel || metadata.handle || "";
    if (this.resultPageAuthor) {
      this.resultPageAuthor.textContent = author ? `✍️ ${author}` : "";
    }
    if (this.resultPagePublished) {
      if (metadata.published) {
        const d = new Date(metadata.published);
        const formatted = isNaN(d.getTime())
          ? metadata.published
          : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
        this.resultPagePublished.textContent = `📅 ${formatted}`;
      } else {
        this.resultPagePublished.textContent = "";
      }
    } else if (this.resultPageAuthor && !author) {
      this.resultPageAuthor.textContent = "";
    }
  }

  renderCoreSummary(summary, enabled = true) {
    if (!this.coreSummarySection || !this.coreSummaryEl) return;
    if (summary && enabled) {
      this.coreSummarySection.classList.remove("hidden");
      this.coreSummaryEl.textContent = summary;
    } else {
      this.coreSummarySection.classList.add("hidden");
      this.coreSummaryEl.textContent = "";
    }
  }
}

const _resultsScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_resultsScope.NutEggUI = _resultsScope.NutEggUI || {};
_resultsScope.NutEggUI.ResultsViewComponent = ResultsViewComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ResultsViewComponent };
}

