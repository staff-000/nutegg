// ============================================================
// NutEgg Popup — Helper & Utility Functions
// ============================================================

/**
 * Consolidated Translation Function
 * Resolves translation via NutEggI18n if available; falls back to key interpolation.
 */
function t(key, params) {
  const i18n = (typeof globalThis !== "undefined" && globalThis.NutEggI18n) ||
               (typeof window !== "undefined" && window.NutEggI18n) ||
               null;
  if (i18n && typeof i18n.t === "function") {
    return i18n.t(key, params);
  }
  if (key === "versionMismatchFull" && params) {
    return `Version mismatch: Extension v${params.extVersion} vs Plugin v${params.pluginVersion}`;
  }
  if (params && typeof key === "string") {
    let str = key;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp("\\{" + k + "\\}", "g"), String(v));
    }
    return str;
  }
  return key;
}

if (typeof globalThis !== "undefined" && typeof globalThis.t !== "function") {
  globalThis.t = t;
}
if (typeof window !== "undefined" && typeof window.t !== "function") {
  window.t = t;
}

/**
 * Known video/audio media platform identifiers.
 * When new video sources (e.g. Bilibili, TikTok) are added, register them here.
 */
const VIDEO_MEDIA_SOURCES = new Set([
  "youtube",
  "bilibili",
  "tiktok",
  "vimeo",
  "douyin",
  "kuaishou",
]);

/**
 * Safely escape HTML characters for text nodes in HTML templates.
 */
function escapeHtml(str) {
  if (str == null) return "";
  if (typeof document !== "undefined" && document.createElement) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Convert human-readable text into a snake_case slug suitable for egg file names (supports Unicode).
 */
function slugify(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 60);
}

/**
 * Strip path and .md extension from an egg file name (e.g. "topics/deep-learning.md" -> "deep-learning").
 */
function cleanEggName(fileName) {
  if (!fileName) return "Egg";
  return fileName.split("/").pop().replace(/\.md$/i, "");
}

/**
 * Extract timestamp string like "12:34" or "1:05:30" from a reference string, or null if none.
 */
function extractTimestamp(str) {
  if (!str) return null;
  const m = String(str).match(/\b(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\b/);
  return m ? m[0] : null;
}

/**
 * "MM:SS" or "HH:MM:SS" or raw number -> total seconds.
 */
function timeToSeconds(time) {
  if (typeof time === "number") return time;
  if (!time || (typeof time !== "string" && typeof time !== "number")) return 0;
  const raw = String(time).trim();
  const ts = extractTimestamp(raw) || raw;
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(ts) || 0;
}

/**
 * Replace timestamps in text like "[12:34]" or "12:34" with clickable timestamp buttons.
 */
function linkifyTimestamps(escapedText) {
  if (!escapedText) return "";
  return escapedText.replace(
    /(\[|\()(\d{1,3}(?::\d{2}){1,2})(\]|\))|(?:^|(\s))(\d{1,3}(?::\d{2}){1,2})(?=[.,!?\s]|$)/g,
    (match, open, time1, close, space, time2) => {
      const time = time1 || time2;
      const leading = space || "";
      const title = escapeHtml(t("jumpToVideoTime", { time }) || `Jump to video ${time}`);
      return `${leading}<button type="button" class="source-pill source-timestamp inline-timestamp" data-time="${time}" title="${title}"><span class="source-icon">⏱️</span><span class="source-ref">${time}</span></button>`;
    }
  );
}

/**
 * Unwrap single root node(s) with children so that the mind map directly
 * displays the core branches at the root level instead of an unnecessary single root.
 */
function unwrapMindMapRoots(nodes) {
  let current = nodes;
  while (
    Array.isArray(current) &&
    current.length === 1 &&
    Array.isArray(current[0]?.children) &&
    current[0].children.length > 0
  ) {
    current = current[0].children;
  }
  return Array.isArray(current) ? current : [];
}

/**
 * Compile all Q&A seen so far into plaintext context for follow-up questions.
 */
function buildPriorQa(res = null, qaList = []) {
  const parts = [];
  if (res?.customQuestionAnswers?.length) {
    for (const qa of res.customQuestionAnswers) {
      if (qa.question && qa.answer) {
        parts.push(`Q: ${qa.question}\nA: ${qa.answer}`);
      }
    }
  }
  if (Array.isArray(qaList)) {
    for (const item of qaList) {
      if (item.question && item.answer) {
        parts.push(`Q: ${item.question}\nA: ${item.answer}`);
      }
    }
  }
  return parts.join("\n\n");
}

/**
 * ISO/date string -> short locale date (e.g. "Aug 10, 2026"); raw string on failure.
 */
function formatPublishedDate(raw) {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }
  } catch {}
  return String(raw);
}

/**
 * Classify supported platform URLs; fall back to "webpage".
 */
function detectPageTypeFromUrl(url) {
  if (!url) return "webpage";
  try {
    const host = new URL(url).hostname;
    if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
    for (const [domain, type] of [["bilibili.com", "bilibili"], ["douyin.com", "douyin"], ["weibo.com", "weibo"], ["weibo.cn", "weibo"], ["zhihu.com", "zhihu"]]) {
      if (host === domain || host.endsWith(`.${domain}`)) return type;
    }
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("twitter.com") || host === "x.com") return "twitter";
  } catch {}
  return "webpage";
}

/**
 * Accurately count words across Latin and CJK (Chinese, Japanese, Korean) languages.
 * CJK characters are counted individually (each ideograph carries semantic weight of a word),
 * while Latin/other alphanumeric words are counted by whitespace-separated tokens.
 */
function countWords(text) {
  if (!text || typeof text !== "string") return 0;
  const cjkMatches = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;
  const nonCjk = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g, " ");
  const latinWords = nonCjk.trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  return cjkCount + latinWords.length;
}

/**
 * Detects if extracted content has an unexpectedly low word count,
 * typically caused by extracting before client-side hydration or rendering finished.
 */
function isContentSuspiciouslyLow(wordCount, sourceType = "webpage") {
  if (typeof wordCount !== "number" || wordCount < 0) return false;
  const type = String(sourceType || "").toLowerCase();
  if (type === "twitter" || type === "weibo") {
    // Single tweets can be concise, but fewer than 5 words is suspicious
    return wordCount < 5;
  }
  if (isVideoMediaSource(type) || type === "video") {
    // Very short video text may be only metadata or an incomplete transcript.
    return wordCount < 200;
  }
  // Standard articles, documentation, blog posts, news, generic pages
  // Under 200 words may mean only headers/navigation or placeholders were extracted.
  return wordCount < 200;
}

/**
 * Standardize title, author, formatted published date, url, and word count from extracted content.
 */
function provenanceFromExtraction(content) {
  const target = content || (typeof session !== "undefined" ? session.extractedContent : null);
  if (!target) return { title: "", author: "", published: "", url: "", wordCount: 0 };
  const m = target.metadata || {};
  return {
    title: target.title || m.title || "",
    author: m.author || m.authorHandle || m.channelName || "",
    published: formatPublishedDate(m.publishedTime || m.date || ""),
    url: target.url || "",
    wordCount: countWords(target.content || ""),
  };
}

/**
 * Check if extension version and plugin version mismatch.
 */
function getVersionMismatchIssue(pluginVersion, extVersion) {
  const version = extVersion || (typeof chrome !== "undefined" && chrome.runtime?.getManifest?.()?.version);
  if (pluginVersion && version && pluginVersion !== version) {
    return t("versionMismatchFull", { extVersion: version, pluginVersion });
  }
  return null;
}

/**
 * Check whether the given extracted content or source string is a video/audio media source.
 */
function isVideoMediaSource(contentOrType) {
  if (!contentOrType) return false;
  if (typeof contentOrType === "string") {
    return VIDEO_MEDIA_SOURCES.has(contentOrType.toLowerCase());
  }
  if (contentOrType.mediaType === "article") return false;
  if (contentOrType.mediaType === "video" || contentOrType.isVideo) {
    return true;
  }
  const type = (contentOrType.sourceType || "").toLowerCase();
  return VIDEO_MEDIA_SOURCES.has(type);
}

/**
 * For spoken media sources (YouTube, Bilibili, TikTok, podcasts, etc.):
 * If a video has no transcript/captions, analysis would rely on title/description only,
 * which produces hallucinated or misleading answers — warn and refuse to process.
 */
function isTranscriptBlocked(extractedContent) {
  return !!extractedContent &&
    isVideoMediaSource(extractedContent) &&
    extractedContent.transcriptAvailable === false;
}

/** One extraction notice for both the tab warning and the fetched-content preview. */
function getExtractionWarning(content) {
  if (!content) return null;
  // A long description cannot substitute for a missing transcript.
  if (isTranscriptBlocked(content)) return t("transcriptBlockedWarning");
  if (['not_ready', 'transient'].includes(content.extractionStatus)) return t('captureRetryIncomplete');
  const words = countWords(content.content || "");
  const sourceType = isVideoMediaSource(content) ? "video" : content.sourceType;
  return isContentSuspiciouslyLow(words, sourceType)
    ? t("contentLowWarning", { count: words.toLocaleString() }) : null;
}

/** A selected egg needs its own result before knowledge can be hatched into it. */
function selectedEggsNeedAnalysis(view) {
  const analyzed = new Set((view.analysisResult?.eggResults || []).map(result => result.egg.split('/').pop()));
  return [...(view.selectedEggs || [])].some(egg => !analyzed.has(egg.split('/').pop()));
}

/** Returns a prompt if the page or content is not ready for analysis. */
function getAnalyzeNotReadyReason(sessionState, settingsState) {
  if (!sessionState) return null;
  if (sessionState.currentTabLoading) {
    return t("pageStillLoading");
  }
  if (sessionState.extractionPending) {
    return t("retrievingContentWait");
  }
  if (!sessionState.extractedContent || !sessionState.extractedContent.content) {
    return t("pageOrContentNotReady");
  }
  if (isTranscriptBlocked(sessionState.extractedContent) && sessionState.enabledSections?.discussion !== true) {
    return t("transcriptUnavailableAnalyze");
  }
  if (settingsState && !settingsState.serverOnline) {
    if (!settingsState.chromeAiEnabled) {
      return t("obsidianOfflineStart");
    }
    if (!settingsState.chromeAiConfigured) {
      return t("chromeAiNoKeyConfig");
    }
  }
  return null;
}

/**
 * Builds the URL to create a new GitHub issue prefilled with bug report template.
 */
function buildGitHubBugReportUrl(errorContext = "", context = {}) {
  const contentUrl = context.url || "";
  const version = context.version || (typeof chrome !== "undefined" && chrome.runtime?.getManifest?.()?.version) || "0.0.0";
  const userAgent = context.userAgent || (typeof navigator !== "undefined" && navigator.userAgent) || "Chrome";
  const observed = errorContext
    ? `Encountered error: ${errorContext}`
    : "<!-- Describe what actually happened (e.g. error message, unexpected output, stuck on retrieving/analyzing) -->";

  const body = [
    "### URL of the content",
    contentUrl || "[Enter the URL of the article, video, or webpage here]",
    "",
    "### Expected behavior",
    "<!-- A clear description of what you expected to happen -->",
    "",
    "",
    "### Observed behavior",
    observed,
    "",
    "",
    "### Environment",
    `- NutEgg Extension Version: v${version}`,
    `- Browser: ${userAgent}`,
  ].join("\n");

  const title = errorContext ? `[Bug]: ${errorContext.slice(0, 60)}` : "[Bug]: ";
  return `https://github.com/staff-000/nutegg/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

/**
 * Redirect to GitHub issues prefilled with bug report template.
 */
function openGitHubBugReport(errorContext = "", context = {}) {
  const issueUrl = buildGitHubBugReportUrl(errorContext, context);
  if (typeof window !== "undefined" && window.open) {
    window.open(issueUrl, "_blank");
  }
  return issueUrl;
}

/**
 * Unified Helper Object
 * Enables calling helper methods via `helper.<methodName>` instead of polluting global scope.
 */
const NutEggHelpers = {
  t,
  escapeHtml,
  slugify,
  cleanEggName,
  extractTimestamp,
  timeToSeconds,
  linkifyTimestamps,
  unwrapMindMapRoots,
  buildPriorQa,
  formatPublishedDate,
  detectPageTypeFromUrl,
  provenanceFromExtraction,
  countWords,
  isContentSuspiciouslyLow,
  getExtractionWarning,
  getVersionMismatchIssue,
  isVideoMediaSource,
  isTranscriptBlocked,
  getAnalyzeNotReadyReason,
  selectedEggsNeedAnalysis,
  buildGitHubBugReportUrl,
  openGitHubBugReport,
};

// Browser global namespace attachment
if (typeof globalThis !== "undefined") {
  globalThis.NutEggHelpers = NutEggHelpers;
  globalThis.helper = NutEggHelpers;
  globalThis.t = globalThis.t || t;
  // Fallback for HTML templates frequently invoking escapeHtml
  globalThis.escapeHtml = escapeHtml;
  globalThis.detectPageTypeFromUrl = detectPageTypeFromUrl;
  globalThis.provenanceFromExtraction = provenanceFromExtraction;
}

// CommonJS export for Node test environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    NutEggHelpers,
    helper: NutEggHelpers,
    t,
    ...NutEggHelpers,
  };
}
