// ============================================================
// NutEgg Popup UI — Capture View Component
// ============================================================

class CaptureViewComponent {
  constructor(root = document) {
    this.root = root;
    this.pageTitle = root.getElementById("page-title");
    this.pageUrl = root.getElementById("page-url");
    this.pageType = root.getElementById("page-type");
    this.pageAuthorEl = root.getElementById("page-author");
    this.pagePublishedEl = root.getElementById("page-published");
    this.pageWordCountEl = root.getElementById("page-word-count");
    this.pageCaptionSourceEl = root.getElementById("page-caption-source");
    this.contentPreview = root.getElementById("content-preview");
    this.refreshBtn = root.getElementById("refresh-btn");
    this.questionsToggle = root.getElementById("questions-toggle");
    this.questionsArea = root.getElementById("questions-area");
    this.customQuestionsEl = root.getElementById("custom-questions");
    this.captureScopeContainer = root.getElementById("capture-questions-scope");
    this.questionsScope = "within";
    this._bindScopeChips();
  }

  _bindScopeChips() {
    if (!this.captureScopeContainer) return;
    if (this.captureScopeContainer.tagName === "SELECT") {
      this.captureScopeContainer.addEventListener("change", (e) => {
        this.setQuestionsScope(e.target.value);
        if (typeof this.onScopeChange === "function") {
          this.onScopeChange(e.target.value);
        }
      });
    } else {
      this.captureScopeContainer.addEventListener("click", (e) => {
        const chip = e.target.closest(".scope-chip");
        if (!chip || !chip.dataset.scope) return;
        this.setQuestionsScope(chip.dataset.scope);
        if (typeof this.onScopeChange === "function") {
          this.onScopeChange(chip.dataset.scope);
        }
      });
    }
  }

  getQuestionsScope() {
    if (this.captureScopeContainer && this.captureScopeContainer.tagName === "SELECT") {
      return this.captureScopeContainer.value || this.questionsScope || "within";
    }
    return this.questionsScope || "within";
  }

  setQuestionsScope(scope) {
    this.questionsScope = scope === "beyond" ? "beyond" : "within";
    if (this.captureScopeContainer) {
      if (this.captureScopeContainer.tagName === "SELECT") {
        this.captureScopeContainer.value = this.questionsScope;
      }
      const chips = this.captureScopeContainer.querySelectorAll(".scope-chip");
      chips.forEach((c) => {
        c.classList.toggle("active", c.dataset.scope === this.questionsScope);
      });
    }
  }

  render(firstArg, options = {}) {
    const isSession = Boolean(
      firstArg &&
      (firstArg.extractedContent !== undefined || firstArg.currentTabLoading !== undefined || firstArg.isAnalyzing !== undefined)
    );
    const content = isSession ? firstArg.extractedContent : firstArg;
    const isSessionLoading = isSession && Boolean(firstArg.currentTabLoading);
    const isSessionAnalyzing = isSession && Boolean(firstArg.isAnalyzing);

    if (this.pageTitle) this.pageTitle.textContent = content?.title || options.defaultTitle || t("untitled");
    if (this.pageUrl) this.pageUrl.textContent = content?.url || options.defaultUrl || "";
    if (this.pageType) this.pageType.textContent = content?.sourceType || options.defaultType || "";

    if (isSessionLoading) {
      this.setPreviewText(t("retrievingPageContent"));
      this.clearAuthorAndPublished();
    } else {
      this.setPreviewContent(content, options.previewPlaceholder);
      this.showProvenance(content?.metadata || {}, content?.content);
    }

    if (isSession) {
      this.setRefreshDisabled(isSessionLoading || isSessionAnalyzing);
    }
  }

  showProvenance(metadata = {}, rawContent = "") {
    if (this.pageCaptionSourceEl) {
      const sourceKeys = {
        page_tracks: "captionSourcePageTracks",
        watch_page: "captionSourceWatchPage",
        innertube: "captionSourcePlayerApi",
        player_tracks: "captionSourceLivePlayer",
        transcript_panel: "captionSourceTranscriptPanel",
      };
      const key = Object.hasOwn(sourceKeys, metadata.caption_source) ? sourceKeys[metadata.caption_source] : null;
      this.pageCaptionSourceEl.textContent = key ? t("captionSourceTag", { source: t(key) }) : "";
      if (key) this.pageCaptionSourceEl.classList.remove("hidden");
      else this.pageCaptionSourceEl.classList.add("hidden");
    }
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
    if (this.pageWordCountEl) {
      const text = rawContent || metadata?.content || "";
      if (text) {
        const countWordsFn = typeof helper !== "undefined" && helper.countWords
          ? helper.countWords
          : (typeof globalThis !== "undefined" && globalThis.helper?.countWords) ||
            ((t) => (t ? t.trim().split(/\s+/).filter(Boolean).length : 0));
        const count = countWordsFn(text);
        this.pageWordCountEl.textContent = `📝 ${t("wordCount", { count: count.toLocaleString() })}`;
        this.pageWordCountEl.classList.remove("hidden");
      } else {
        this.pageWordCountEl.textContent = "";
        this.pageWordCountEl.classList.add("hidden");
      }
    }
  }

  setPreviewContent(content, placeholder) {
    if (content?.url !== this.previewUrl) {
      this.previewUrl = content?.url;
      if (this.contentPreview) this.contentPreview.scrollTop = 0;
    }
    const items = content?.discussion?.items || [];
    const comments = items.length ? '\n\n' + t('discussionPreview', { count: items.length }) + '\n'
      + items.map((item, index) => `${index + 1}. ${item.parentId ? '↳ ' : ''}👤 ${this.commentAuthor(item)}\n${item.text}`
        + (item.reaction?.count != null ? '\n' + t(item.reaction.kind === 'score' ? 'discussionScore' : 'discussionLikes', { count: item.reaction.count }) : '')).join('\n\n')
      + (content.discussion.truncated ? '\n\n' + t('discussionTruncated') : '') : '';
    const warning = globalThis.NutEggHelpers?.getExtractionWarning?.(content);
    this.setPreviewText((content?.content || placeholder || t('noContentExtracted')) + comments, warning);
  }

  commentAuthor(item) {
    if (typeof item.author === 'string' && item.author.trim()) return item.author.trim();
    // Older captures or avatar-only layouts may still expose a named profile URL.
    try {
      const profile = new URL(item.authorId);
      if (/^https?:$/.test(profile.protocol)) {
        const match = profile.pathname.match(/^\/(@[^/]+)(?:\/|$)|^\/(?:user|u|people)\/([^/]+)(?:\/|$)/);
        if (match) return decodeURIComponent(match[1] || match[2]);
      }
    } catch { /* No usable profile name. */ }
    return t('discussionUnknownAuthor');
  }

  setPreviewText(text, warning = null) {
    if (!this.contentPreview) return;
    this.contentPreview.classList.toggle('incomplete', !!warning);
    if (warning) text = `⚠️ ${warning}\n\n${text}`;
    // Bring a newly detected fetch problem into view after refreshing a scrolled preview.
    const scrollTop = warning && warning !== this.previewWarning ? 0 : this.contentPreview.scrollTop || 0;
    this.previewWarning = warning;
    const helpers = globalThis.NutEggHelpers;
    if (helpers?.escapeHtml && helpers?.linkifyTimestamps) {
      const escaped = helpers.escapeHtml(String(text ?? ""));
      const html = helpers.linkifyTimestamps(escaped);
      if (html !== escaped) {
        this.contentPreview.innerHTML = html;
        this.contentPreview.scrollTop = scrollTop;
        return;
      }
    }
    this.contentPreview.textContent = text;
    this.contentPreview.scrollTop = scrollTop;
  }

  clearProvenance() {
    if (this.pageCaptionSourceEl) {
      this.pageCaptionSourceEl.textContent = "";
      this.pageCaptionSourceEl.classList.add("hidden");
    }
    if (this.pageAuthorEl) this.pageAuthorEl.textContent = "";
    if (this.pagePublishedEl) this.pagePublishedEl.textContent = "";
    if (this.pageWordCountEl) {
      this.pageWordCountEl.textContent = "";
      this.pageWordCountEl.classList.add("hidden");
    }
  }

  clearAuthorAndPublished() {
    this.clearProvenance();
  }

  setLoading(text) {
    this.setPreviewText(text || t("retrievingPageContent"));
    this.clearAuthorAndPublished();
  }

  setError(message) {
    this.setPreviewText(message);
    this.clearAuthorAndPublished();
  }

  clear() {
    if (this.pageTitle) this.pageTitle.textContent = t("untitled");
    if (this.pageUrl) this.pageUrl.textContent = "";
    if (this.pageType) this.pageType.textContent = "";
    this.setPreviewText(t("noContentExtracted"));
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
