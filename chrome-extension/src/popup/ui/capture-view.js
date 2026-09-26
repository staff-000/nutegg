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

  render(firstArg, options = {}) {
    const isSession = Boolean(
      firstArg &&
      (firstArg.extractedContent !== undefined || firstArg.currentTabLoading !== undefined || firstArg.isAnalyzing !== undefined)
    );
    const content = isSession ? firstArg.extractedContent : firstArg;
    const isSessionLoading = isSession && Boolean(firstArg.currentTabLoading);
    const isSessionAnalyzing = isSession && Boolean(firstArg.isAnalyzing);

    if (this.pageTitle) this.pageTitle.textContent = content?.title || options.defaultTitle || _captureT("untitled");
    if (this.pageUrl) this.pageUrl.textContent = content?.url || options.defaultUrl || "";
    if (this.pageType) this.pageType.textContent = content?.sourceType || options.defaultType || "";

    if (isSessionLoading) {
      if (this.contentPreview) this.contentPreview.textContent = _captureT("retrievingPageContent");
      this.clearAuthorAndPublished();
    } else {
      if (this.contentPreview) this.contentPreview.textContent = content?.content || options.previewPlaceholder || _captureT("noContentExtracted");
      this.showProvenance(content?.metadata || {});
    }

    if (isSession) {
      this.setRefreshDisabled(isSessionLoading || isSessionAnalyzing);
    }
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

  setLoading(text) {
    if (this.contentPreview) this.contentPreview.textContent = text || _captureT("retrievingPageContent");
    this.clearAuthorAndPublished();
  }

  setError(message) {
    if (this.contentPreview) this.contentPreview.textContent = message;
    this.clearAuthorAndPublished();
  }

  clear() {
    if (this.pageTitle) this.pageTitle.textContent = _captureT("untitled");
    if (this.pageUrl) this.pageUrl.textContent = "";
    if (this.pageType) this.pageType.textContent = "";
    if (this.contentPreview) this.contentPreview.textContent = _captureT("noContentExtracted");
    this.clearAuthorAndPublished();
  }

  setContent(content, options = {}) {
    this.render(content, options);
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

  setPageInfo({ title, url, sourceType } = {}) {
    if (title !== undefined && this.pageTitle) this.pageTitle.textContent = title;
    if (url !== undefined && this.pageUrl) this.pageUrl.textContent = url;
    if (sourceType !== undefined && this.pageType) this.pageType.textContent = sourceType;
  }

  getPageUrl() {
    return this.pageUrl?.textContent || "";
  }

  getPageTitle() {
    return this.pageTitle?.textContent || "";
  }

  getPageType() {
    return this.pageType?.textContent || "";
  }

  setRefreshDisabled(disabled) {
    if (this.refreshBtn) this.refreshBtn.disabled = Boolean(disabled);
  }

  toggleQuestionsArea() {
    this.questionsArea?.classList.toggle("hidden");
  }
}

const _captureScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_captureScope.NutEggUI = _captureScope.NutEggUI || {};
_captureScope.NutEggUI.CaptureViewComponent = CaptureViewComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CaptureViewComponent };
}

