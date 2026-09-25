// ============================================================
// NutEgg Popup UI — Capture View Component
// ============================================================

const _captureT = (key, params) => {
  if (typeof t === "function") return t(key, params);
  if (typeof window !== "undefined" && window.NutEggI18n) return window.NutEggI18n.t(key, params);
  return key;
};

class CaptureViewComponent {
  constructor(root = document) {
    this.root = root;
    this.pageTitle = root.getElementById("page-title");
    this.pageUrl = root.getElementById("page-url");
    this.pageType = root.getElementById("page-type");
    this.pageAuthorEl = root.getElementById("page-author");
    this.pagePublishedEl = root.getElementById("page-published");
    this.contentPreview = root.getElementById("content-preview");
    this.refreshBtn = root.getElementById("refresh-btn");
    this.questionsToggle = root.getElementById("questions-toggle");
    this.questionsArea = root.getElementById("questions-area");
    this.customQuestionsEl = root.getElementById("custom-questions");
  }

  render(content, options = {}) {
    if (this.pageTitle) this.pageTitle.textContent = content?.title || options.defaultTitle || _captureT("untitled");
    if (this.pageUrl) this.pageUrl.textContent = content?.url || options.defaultUrl || "";
    if (this.pageType) this.pageType.textContent = content?.sourceType || options.defaultType || "";
    if (this.contentPreview) this.contentPreview.textContent = content?.content || options.previewPlaceholder || _captureT("noContentExtracted");
    this.showProvenance(content?.metadata || {});
  }

  showProvenance(metadata = {}) {
    const author = metadata.author || metadata.channel || metadata.handle || "";
    if (this.pageAuthorEl) {
      this.pageAuthorEl.textContent = author ? `✍️ ${author}` : "";
    }
    if (this.pagePublishedEl) {
      if (metadata.published) {
        const d = new Date(metadata.published);
        const formatted = isNaN(d.getTime())
          ? metadata.published
          : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
        this.pagePublishedEl.textContent = `📅 ${formatted}`;
      } else {
        this.pagePublishedEl.textContent = "";
      }
    }
  }

  setPreviewText(text) {
    if (this.contentPreview) {
      this.contentPreview.textContent = text;
    }
  }

  clearAuthorAndPublished() {
    if (this.pageAuthorEl) this.pageAuthorEl.textContent = "";
    if (this.pagePublishedEl) this.pagePublishedEl.textContent = "";
  }

  getCustomQuestions() {
    return this.customQuestionsEl?.value || "";
  }

  setCustomQuestions(value) {
    if (this.customQuestionsEl) {
      this.customQuestionsEl.value = value || "";
    }
  }

  getParsedQuestions() {
    const raw = this.getCustomQuestions();
    return raw ? raw.split("\n").map((q) => q.trim()).filter(Boolean) : [];
  }
}

const _captureScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_captureScope.NutEggUI = _captureScope.NutEggUI || {};
_captureScope.NutEggUI.CaptureViewComponent = CaptureViewComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CaptureViewComponent };
}

