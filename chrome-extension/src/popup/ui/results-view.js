// ============================================================
// NutEgg Popup UI — Results View Component
// ============================================================

function _resultsEscapeHtml(str) {
  if (typeof escapeHtml === "function") return escapeHtml(str);
  if (typeof document !== "undefined" && document.createElement) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

class ResultsViewComponent {
  constructor(root = document) {
    this.root = root;
    this.captureState = root.getElementById("capture-state");
    this.resultsState = root.getElementById("results-state");
    this.resultPageInfo = root.getElementById("result-page-info");
    this.resultPageTitle = root.getElementById("result-page-title");
    this.resultPageAuthor = root.getElementById("result-page-author");
    this.resultPagePublished = root.getElementById("result-page-published");
    this.resultPageWordCount = root.getElementById("result-page-word-count");
    this.coreSummarySection = root.getElementById("core-summary-section");
    this.coreSummaryEl = root.getElementById("core-summary");
  }

  showResults() {
    this.captureState?.classList.add("hidden");
    this.resultsState?.classList.remove("hidden");
  }

  showCapture() {
    this.resultsState?.classList.add("hidden");
    this.resultPageInfo?.classList.add("hidden");
    this.captureState?.classList.remove("hidden");
  }

  renderProvenance(prov) {
    if (!this.resultPageInfo) return;
    if (!prov || !prov.title) {
      this.resultPageInfo.classList.add("hidden");
      if (this.resultPageWordCount) this.resultPageWordCount.textContent = "";
      return;
    }
    this.resultPageInfo.classList.remove("hidden");
    if (this.resultPageTitle) this.resultPageTitle.textContent = prov.title;
    if (this.resultPageAuthor) {
      this.resultPageAuthor.textContent = prov.author ? `✍️ ${prov.author}` : "";
    }
    if (this.resultPagePublished) {
      this.resultPagePublished.textContent = prov.publishedAt
        ? `📅 ${new Date(prov.publishedAt).toLocaleDateString()}`
        : "";
    }
    if (this.resultPageWordCount) {
      if (prov.wordCount != null && prov.wordCount > 0) {
        this.resultPageWordCount.textContent = `📝 ${t("wordCount", { count: prov.wordCount.toLocaleString() })}`;
        this.resultPageWordCount.classList.remove("hidden");
      } else {
        this.resultPageWordCount.textContent = "";
        this.resultPageWordCount.classList.add("hidden");
      }
    }
  }

  renderCoreSummary(summary, enabled = true) {
    if (!this.coreSummarySection || !this.coreSummaryEl) return;
    const hasBullets = Array.isArray(summary) && summary.length > 0;
    const hasString = typeof summary === "string" && summary.trim().length > 0;
    if ((hasBullets || hasString) && enabled !== false) {
      this.coreSummarySection.classList.remove("hidden");
      if (hasBullets) {
        this.coreSummaryEl.innerHTML = summary
          .map((b) => `<li>${_resultsEscapeHtml(b)}</li>`)
          .join("");
      } else {
        this.coreSummaryEl.textContent = summary;
      }
    } else {
      this.coreSummarySection.classList.add("hidden");
      this.coreSummaryEl.innerHTML = "";
    }
  }

  render(session, settings) {
    if (!session) return;
    const result = session.analysisResult;
    if (session.currentView === "results") {
      this.showResults();
      const prov = session.provenance || {
        title: session.extractedContent?.title || result.title,
        author: session.extractedContent?.metadata?.author || result.author,
        publishedAt: session.extractedContent?.metadata?.published || result.publishedAt,
      };
      this.renderProvenance(prov);
      const effectiveSections = session?.enabledSections || settings?.enabledSections;
      this.renderCoreSummary(result.coreSummary, effectiveSections?.coreSummary !== false);
    } else {
      this.showCapture();
    }
  }
}

const _resultsScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_resultsScope.NutEggUI = _resultsScope.NutEggUI || {};
_resultsScope.NutEggUI.ResultsViewComponent = ResultsViewComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ResultsViewComponent };
}

