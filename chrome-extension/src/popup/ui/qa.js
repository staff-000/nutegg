// ============================================================
// NutEgg Popup UI — Q&A Component
// ============================================================

const _qaT = (key, params) => {
  if (typeof t === "function") return t(key, params);
  if (typeof window !== "undefined" && window.NutEggI18n) return window.NutEggI18n.t(key, params);
  return key;
};

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
  if (typeof require !== "undefined") {
    try {
      return require("./chapters.js").extractTimestamp(str);
    } catch { /* ignore */ }
  }
  if (!str) return null;
  const match = String(str).trim().match(/(?:^|[^\d:])(\d{1,2}(?::\d{2}){1,2})(?:[^\d:]|$)/);
  return match ? match[1] : null;
}

function _qaTimeToSeconds(time) {
  if (typeof timeToSeconds === "function") return timeToSeconds(time);
  if (typeof require !== "undefined") {
    try {
      return require("./chapters.js").timeToSeconds(time);
    } catch { /* ignore */ }
  }
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
    /(\[|\()(\d{1,2}(?::\d{2}){1,2})(\]|\))|(?:^|(\s))(\d{1,2}(?::\d{2}){1,2})(?=[.,!?\s]|$)/g,
    (match, open, time1, close, space, time2) => {
      const time = time1 || time2;
      const leading = space || "";
      return `${leading}<button type="button" class="source-pill source-timestamp inline-timestamp" data-time="${time}" title="${_qaEscapeHtml(_qaT("jumpToVideoTime", { time }))}"><span class="source-icon">⏱️</span><span class="source-ref">${time}</span></button>`;
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
        : (isTime ? ` title="${_qaEscapeHtml(_qaT("jumpToVideoTime", { time: timestamp }))}"` : ` title="${_qaEscapeHtml(_qaT("scrollToSection", { ref }))}"`);

      const quoteHtml = quoteText
        ? `<span class="source-quote" title="${_qaEscapeHtml(quoteText)}">“${_qaEscapeHtml(quoteText)}”</span>`
        : "";

      const displayRef = isTime && /^\[\d{1,2}(?::\d{2}){1,2}\]$/.test(ref) ? timestamp : ref;

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

  return items ? `<div class="qa-sources"><div class="qa-sources-label">📍 ${_qaEscapeHtml(_qaT("qaSourcesLabel"))}:</div>${items}</div>` : "";
}

/** Render the "Your Questions" section: initial answers + follow-ups. */
function renderCustomQuestions(options = {}) {
  const sectionEl = options.customQuestionsSection || (typeof customQuestionsSection !== "undefined" ? customQuestionsSection : (typeof document !== "undefined" ? document.getElementById("custom-questions-section") : null));
  const listEl = options.customQuestionsList || (typeof customQuestionsList !== "undefined" ? customQuestionsList : (typeof document !== "undefined" ? document.getElementById("custom-questions-list") : null));
  const inputEl = options.followupInput || (typeof followupInput !== "undefined" ? followupInput : (typeof document !== "undefined" ? document.getElementById("followup-input") : null));

  const questions = options.questions !== undefined
    ? options.questions
    : (typeof analysisResult !== "undefined" ? analysisResult?.customQuestionAnswers : []) || [];
  const followUps = options.followUps !== undefined
    ? options.followUps
    : (typeof followUpQa !== "undefined" ? followUpQa : []) || [];

  const all = [...(questions || []), ...(followUps || [])];

  if (sectionEl) {
    sectionEl.classList.remove("hidden");
    const labelEl = sectionEl.querySelector(".section-label");
    if (labelEl) {
      labelEl.textContent = all.length > 0 ? _qaT("questionsAndAnswers") : _qaT("askAQuestion");
    }
  }

  if (inputEl) {
    inputEl.placeholder = _qaT("askQuestionPlaceholder");
  }

  if (listEl) {
    if (all.length > 0) {
      listEl.innerHTML = all
        .map((qa) => `
          <div class="egg-group">
            <div class="qa-item">
              <div class="qa-question">Q: ${_qaEscapeHtml(qa.question)}</div>
              <div class="qa-answer">${linkifyTimestamps(_qaEscapeHtml(qa.answer))}</div>
              ${renderQaSources(qa.sources)}
            </div>
          </div>`)
        .join("");
    } else {
      listEl.innerHTML = "";
    }
  }
}

/** All Q&A seen so far — context so follow-ups can refer back instead of repeating. */
function buildPriorQa(res, qaList) {
  const targetRes = res !== undefined ? res : (typeof analysisResult !== "undefined" ? analysisResult : null);
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

const _qaScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_qaScope.NutEggUI = _qaScope.NutEggUI || {};
_qaScope.NutEggUI.linkifyTimestamps = linkifyTimestamps;
_qaScope.NutEggUI.renderQaSources = renderQaSources;
_qaScope.NutEggUI.renderCustomQuestions = renderCustomQuestions;
_qaScope.NutEggUI.buildPriorQa = buildPriorQa;
_qaScope.NutEggUI.handleSourcePillClick = handleSourcePillClick;
_qaScope.linkifyTimestamps = linkifyTimestamps;
_qaScope.renderQaSources = renderQaSources;
_qaScope.renderCustomQuestions = renderCustomQuestions;
_qaScope.buildPriorQa = buildPriorQa;
_qaScope.handleSourcePillClick = handleSourcePillClick;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    linkifyTimestamps,
    renderQaSources,
    renderCustomQuestions,
    buildPriorQa,
    handleSourcePillClick,
  };
}
