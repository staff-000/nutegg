// ============================================================
// NutEgg Popup UI — Q&A Component
// ============================================================

function _qaEscapeHtml(str) {
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

function _qaExtractTimestamp(str) {
  if (typeof extractTimestamp === "function") return extractTimestamp(str);
  if (!str) return null;
  const match = String(str).trim().match(/(?:^|[^\d:])(\d{1,3}(?::\d{2}){1,2})(?:[^\d:]|$)/);
  return match ? match[1] : null;
}

function _qaTimeToSeconds(time) {
  if (typeof timeToSeconds === "function") return timeToSeconds(time);
  if (typeof time === "number" && !isNaN(time)) return Math.floor(time);
  if (!time) return 0;
  const ts = _qaExtractTimestamp(time) || String(time).trim();
  const parts = ts.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 0 || parts.some(isNaN)) {
    const directNum = parseInt(time, 10);
    return isNaN(directNum) ? 0 : directNum;
  }
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/** Replace timestamps in text like "[12:34]" or "12:34" with clickable timestamp buttons. */
function linkifyTimestamps(escapedText) {
  if (!escapedText) return "";
  return escapedText.replace(
    /(\[|\()(\d{1,3}(?::\d{2}){1,2})(\]|\))|(?:^|(\s))(\d{1,3}(?::\d{2}){1,2})(?=[.,!?\s]|$)/g,
    (match, open, time1, close, space, time2) => {
      const time = time1 || time2;
      const leading = space || "";
      return `${leading}<button type="button" class="source-pill source-timestamp inline-timestamp" data-time="${time}" title="${_qaEscapeHtml(t("jumpToVideoTime", { time }))}"><span class="source-icon">⏱️</span><span class="source-ref">${time}</span></button>`;
    }
  );
}

/** Render clickable source pills and supporting quotes for a Q&A answer. */
function renderQaSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return "";

  const validSources = sources.filter((s) => s && s.ref && String(s.ref).trim().length > 0);
  if (validSources.length === 0) return "";

  const items = validSources
    .map((s) => {
      const ref = String(s.ref).trim();
      const timestamp = _qaExtractTimestamp(ref);
      const isTime = timestamp !== null;
      const pillClass = isTime ? "source-pill source-timestamp" : "source-pill source-section";
      const icon = isTime ? "⏱️" : "§";
      const dataAttr = isTime
        ? `data-time="${_qaEscapeHtml(timestamp)}"`
        : `data-heading="${_qaEscapeHtml(ref)}"`;
      const quoteText = s.quote ? String(s.quote).trim() : "";
      const quoteAttr = quoteText ? ` data-quote="${_qaEscapeHtml(quoteText)}"` : "";
      const quoteTitle = quoteText
        ? ` title="${_qaEscapeHtml(quoteText)}"`
        : (isTime ? ` title="${_qaEscapeHtml(t("jumpToVideoTime", { time: timestamp }))}"` : ` title="${_qaEscapeHtml(t("scrollToSection", { ref }))}"`);

      const quoteHtml = quoteText
        ? `<span class="source-quote" title="${_qaEscapeHtml(quoteText)}">“${_qaEscapeHtml(quoteText)}”</span>`
        : "";

      const displayRef = isTime && /^\[\d{1,3}(?::\d{2}){1,2}\]$/.test(ref) ? timestamp : ref;

      return `
        <div class="qa-source-item">
          <button type="button" class="${pillClass}" ${dataAttr}${quoteAttr}${quoteTitle}>
            <span class="source-icon">${icon}</span>
            <span class="source-ref">${_qaEscapeHtml(displayRef)}</span>
          </button>
          ${quoteHtml}
        </div>`;
    })
    .join("");

  return items ? `<div class="qa-sources"><div class="qa-sources-label">📍 ${_qaEscapeHtml(t("qaSourcesLabel"))}:</div>${items}</div>` : "";
}

/** Render the "Your Questions" section: initial answers + follow-ups. */
function _renderCustomQuestions(options = {}) {
  const sectionEl = options.customQuestionsSection || (typeof customQuestionsSection !== "undefined" ? customQuestionsSection : (typeof document !== "undefined" ? document.getElementById("custom-questions-section") : null));
  const listEl = options.customQuestionsList || (typeof customQuestionsList !== "undefined" ? customQuestionsList : (typeof document !== "undefined" ? document.getElementById("custom-questions-list") : null));
  const inputEl = options.followupInput || (typeof followupInput !== "undefined" ? followupInput : (typeof document !== "undefined" ? document.getElementById("followup-input") : null));

  const questions = options.questions || [];
  const followUps = options.followUps || [];

  const all = [...(questions || []), ...(followUps || [])];

  if (sectionEl) {
    sectionEl.classList.remove("hidden");
    const labelEl = sectionEl.querySelector(".section-label");
    if (labelEl) {
      labelEl.textContent = all.length > 0 ? t("questionsAndAnswers") : t("askAQuestion");
    }
  }

  if (inputEl) {
    const activeScope = options.scope || "within";
    inputEl.placeholder = activeScope === "beyond"
      ? (t("followupBeyondPlaceholder") || t("askQuestionPlaceholder"))
      : t("askQuestionPlaceholder");
  }

  if (listEl) {
    if (all.length > 0) {
      listEl.innerHTML = all
        .map((qa) => {
          const isBeyond = qa.scope === "beyond";
          const badgeClass = isBeyond ? "qa-scope-badge qa-scope-beyond" : "qa-scope-badge qa-scope-within";
          const badgeIcon = isBeyond ? "🌐" : "📄";
          const badgeText = isBeyond ? t("scopeBeyond") : t("scopeWithin");
          const badgeTitle = isBeyond ? t("scopeBeyondTooltip") : t("scopeWithinTooltip");
          const scopeBadge = `<span class="${badgeClass}" title="${_qaEscapeHtml(badgeTitle)}">${badgeIcon} ${_qaEscapeHtml(badgeText)}</span>`;
          return `
          <div class="egg-group">
            <div class="qa-item">
              <div class="qa-question">Q: ${_qaEscapeHtml(qa.question)}${scopeBadge}</div>
              <div class="qa-answer">${linkifyTimestamps(_qaEscapeHtml(qa.answer))}</div>
              ${renderQaSources(qa.sources)}
            </div>
          </div>`;
        })
        .join("");
    } else {
      listEl.innerHTML = "";
    }
  }
}

/** All Q&A seen so far — context so follow-ups can refer back instead of repeating. */
function buildPriorQa(res, qaList) {
  const targetRes = res || null;
  const targetQaList = qaList !== undefined ? qaList : (typeof followUpQa !== "undefined" ? followUpQa : []);
  const eggQa = (targetRes?.eggResults || []).flatMap(
    (r) => r.keyQuestionAnswers || []
  );
  const customQa = targetRes?.customQuestionAnswers || [];
  return [...eggQa, ...customQa, ...(targetQaList || []).filter((qa) => qa.answer !== "…")];
}

/** Handle click on source pills (timestamp seek or section scroll). */
function handleSourcePillClick(e, { onSeek, onScroll } = {}) {
  const pill = e.target.closest(".source-pill");
  if (!pill) return;
  e.preventDefault();
  e.stopPropagation();

  const timeVal = pill.dataset.time || _qaExtractTimestamp(pill.dataset.heading);
  if (timeVal) {
    const seekHandler = onSeek || (typeof seekToChapter === "function" ? seekToChapter : null);
    if (seekHandler) seekHandler(_qaTimeToSeconds(timeVal));
  } else if (pill.dataset.heading) {
    const scrollHandler = onScroll || (typeof scrollToSection === "function" ? scrollToSection : null);
    if (scrollHandler) scrollHandler(pill.dataset.heading, pill.dataset.quote || "");
  }
}

class QaComponent {
  constructor(root = document) {
    this.root = root;
    this.customQuestionsSection = root.getElementById("custom-questions-section");
    this.customQuestionsList = root.getElementById("custom-questions-list");
    this.followupInput = root.getElementById("followup-input");
    this.followupBtn = root.getElementById("followup-btn");
    this.followupScopeContainer = root.getElementById("followup-scope");
    this.followupScope = "within";
    this._bindScopeChips();
  }

  _bindScopeChips() {
    if (!this.followupScopeContainer) return;
    if (this.followupScopeContainer.tagName === "SELECT") {
      this.followupScopeContainer.addEventListener("change", (e) => {
        this.setScope(e.target.value);
        if (typeof this.onScopeChange === "function") {
          this.onScopeChange(e.target.value);
        }
      });
    } else {
      this.followupScopeContainer.addEventListener("click", (e) => {
        const chip = e.target.closest(".scope-chip");
        if (!chip || !chip.dataset.scope) return;
        this.setScope(chip.dataset.scope);
        if (typeof this.onScopeChange === "function") {
          this.onScopeChange(chip.dataset.scope);
        }
      });
    }
  }

  getScope() {
    if (this.followupScopeContainer && this.followupScopeContainer.tagName === "SELECT") {
      return this.followupScopeContainer.value || this.followupScope || "within";
    }
    return this.followupScope || "within";
  }

  setScope(scope) {
    this.followupScope = scope === "beyond" ? "beyond" : "within";
    if (this.followupScopeContainer) {
      if (this.followupScopeContainer.tagName === "SELECT") {
        this.followupScopeContainer.value = this.followupScope;
      }
      const chips = this.followupScopeContainer.querySelectorAll(".scope-chip");
      chips.forEach((c) => {
        c.classList.toggle("active", c.dataset.scope === this.followupScope);
      });
    }
    if (this.followupInput) {
      this.followupInput.placeholder = this.followupScope === "beyond"
        ? (t("followupBeyondPlaceholder") || t("askQuestionPlaceholder"))
        : t("askQuestionPlaceholder");
    }
  }

  buildPriorQa(res, qaList) {
    return buildPriorQa(res, qaList);
  }

  render(firstArg, secondArg) {
    if (firstArg && typeof firstArg === "object" && (firstArg.customQuestionsSection || firstArg.customQuestionsList)) {
      return _renderCustomQuestions({
        customQuestionsSection: this.customQuestionsSection,
        customQuestionsList: this.customQuestionsList,
        followupInput: this.followupInput,
        scope: this.followupScope,
        ...firstArg,
      });
    }

    let questions = [];
    let followUps = Array.isArray(secondArg) ? secondArg : [];
    if (firstArg && typeof firstArg === "object") {
      if (Array.isArray(firstArg.questions)) {
        questions = firstArg.questions;
        followUps = firstArg.followUps || secondArg || [];
      } else if (firstArg.analysisResult) {
        questions = firstArg.analysisResult.customQuestionAnswers || [];
        followUps = firstArg.followUpQa || secondArg || [];
      } else if (firstArg.customQuestionAnswers) {
        questions = firstArg.customQuestionAnswers || [];
        followUps = secondArg || [];
      } else if (Array.isArray(firstArg)) {
        questions = firstArg;
        followUps = secondArg || [];
      }
    }
    return _renderCustomQuestions({
      customQuestionsSection: this.customQuestionsSection,
      customQuestionsList: this.customQuestionsList,
      followupInput: this.followupInput,
      scope: this.followupScope,
      questions,
      followUps,
    });
  }

  getFollowupText() {
    return this.followupInput?.value?.trim() || "";
  }

  clearFollowup() {
    if (this.followupInput) this.followupInput.value = "";
  }

  setFollowupLoading(isLoading) {
    if (this.followupBtn) this.followupBtn.disabled = isLoading;
    if (this.followupInput) this.followupInput.disabled = isLoading;
  }

  showQuestions() {
    this.customQuestionsSection?.classList.remove("hidden");
  }

  hideQuestions() {
    this.customQuestionsSection?.classList.add("hidden");
  }
}

const _qaScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_qaScope.NutEggUI = _qaScope.NutEggUI || {};
_qaScope.NutEggUI.QaComponent = QaComponent;
_qaScope.NutEggUI.renderQaSources = renderQaSources;
_qaScope.NutEggUI.handleSourcePillClick = handleSourcePillClick;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    QaComponent,
    renderQaSources,
  };
}
