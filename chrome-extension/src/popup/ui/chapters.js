// ============================================================
// NutEgg Popup UI — Chapters Component
// ============================================================

function _chapterEscapeHtml(str) {
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

/** Extract timestamp string like "12:34" or "1:05:30" from a reference string, or null if none. */
function extractTimestamp(str) {
  if (!str) return null;
  const s = String(str).trim();
  // Check for patterns like [12:34], 12:34, 1:23:45, [1:23:45], 12:34 - 13:00, ⏱ 12:34
  const match = s.match(/(?:^|[^\d:])(\d{1,2}(?::\d{2}){1,2})(?:[^\d:]|$)/);
  return match ? match[1] : null;
}

/** "MM:SS" or "HH:MM:SS" → seconds. */
function timeToSeconds(time) {
  if (typeof time === "number" && !isNaN(time)) return Math.floor(time);
  if (!time) return 0;
  const ts = extractTimestamp(time) || String(time).trim();
  const parts = ts.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 0 || parts.some(isNaN)) {
    const directNum = parseInt(time, 10);
    return isNaN(directNum) ? 0 : directNum;
  }
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/** Render the chapter map section into DOM. */
function renderChapterMap({
  chapterSection = (typeof document !== "undefined" ? document.getElementById("chapter-section") : null),
  chapterList = (typeof document !== "undefined" ? document.getElementById("chapter-list") : null),
  chapterMap = [],
  enabled = true,
  isShortWithoutChapters = false,
  activeTabId = null,
  onSeek = null,
} = {}) {
  if (!chapterSection || !chapterList) return;

  const shouldShow =
    enabled !== false &&
    Array.isArray(chapterMap) &&
    chapterMap.length > 0 &&
    !isShortWithoutChapters;

  if (shouldShow) {
    chapterSection.classList.remove("hidden");
    chapterList.innerHTML = chapterMap
      .map((c) => {
        const clickable = c.time && activeTabId != null;
        const data = clickable ? ` data-seconds="${timeToSeconds(c.time)}"` : "";
        const timeLabel = c.time ? `<span class="chapter-time">⏱ ${_chapterEscapeHtml(c.time)}</span>` : "";
        const titleLabel = c.title ? `<span class="chapter-title">${_chapterEscapeHtml(c.title)}</span>` : "";
        const summaryLabel = c.summary ? `<span class="chapter-summary">${_chapterEscapeHtml(c.summary)}</span>` : "";
        return `<div class="chapter-row${clickable ? " chapter-clickable" : ""}"${data}>${timeLabel}${titleLabel}${summaryLabel}</div>`;
      })
      .join("");

    const seekHandler = onSeek || (typeof seekToChapter === "function" ? seekToChapter : null);
    if (seekHandler) {
      chapterList.querySelectorAll(".chapter-clickable").forEach((row) => {
        row.addEventListener("click", () =>
          seekHandler(parseInt(row.dataset.seconds, 10))
        );
      });
    }
  } else {
    chapterSection.classList.add("hidden");
    chapterList.innerHTML = "";
  }
}

class ChaptersComponent {
  constructor(root = document) {
    this.root = root;
    this.chapterSection = root.getElementById("chapter-section");
    this.chapterList = root.getElementById("chapter-list");
  }

  render(firstArg, ...rest) {
    if (firstArg && typeof firstArg === "object" && !Array.isArray(firstArg)) {
      return renderChapterMap({
        chapterSection: this.chapterSection,
        chapterList: this.chapterList,
        ...firstArg,
      });
    }
    return renderChapterMap(firstArg, ...rest);
  }
}

const _chapterScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_chapterScope.NutEggUI = _chapterScope.NutEggUI || {};
_chapterScope.NutEggUI.ChaptersComponent = ChaptersComponent;
_chapterScope.NutEggUI.extractTimestamp = extractTimestamp;
_chapterScope.NutEggUI.timeToSeconds = timeToSeconds;
_chapterScope.NutEggUI.renderChapterMap = renderChapterMap;
_chapterScope.ChaptersComponent = ChaptersComponent;
_chapterScope.extractTimestamp = extractTimestamp;
_chapterScope.timeToSeconds = timeToSeconds;
_chapterScope.renderChapterMap = renderChapterMap;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ChaptersComponent,
    extractTimestamp,
    timeToSeconds,
    renderChapterMap,
  };
}

