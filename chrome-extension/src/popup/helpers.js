// ============================================================
// NutEgg Popup — Helper & Utility Functions
// ============================================================

const t = (key, params) => {
  if (typeof window !== "undefined" && window.NutEggI18n) {
    return window.NutEggI18n.t(key, params);
  }
  if (key === "versionMismatchFull" && params) {
    return `Version mismatch: Extension v${params.extVersion} vs Plugin v${params.pluginVersion}`;
  }
  return key;
};

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
    /(\[|\()(\d{1,2}(?::\d{2}){1,2})(\]|\))|(?:^|(\s))(\d{1,2}(?::\d{2}){1,2})(?=[.,!?\s]|$)/g,
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
 * Classify a page URL as "youtube", "bilibili", "tiktok", "twitter", or "webpage".
 */
function detectPageTypeFromUrl(url) {
  if (!url) return "webpage";
  try {
    const host = new URL(url).hostname;
    if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
    if (host.includes("bilibili.com")) return "bilibili";
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("twitter.com") || host === "x.com") return "twitter";
  } catch {}
  return "webpage";
}

/**
 * Standardize title, author, formatted published date, and url from extracted content.
 */
function provenanceFromExtraction(content) {
  const target = content || (typeof session !== "undefined" ? session.extractedContent : null);
  if (!target) return { title: "", author: "", published: "", url: "" };
  const m = target.metadata || {};
  return {
    title: target.title || m.title || "",
    author: m.author || m.authorHandle || m.channelName || "",
    published: formatPublishedDate(m.publishedTime || m.date || ""),
    url: target.url || "",
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

/**
 * Returns a non-null string prompt if the page or content is not ready for analysis.
 */
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
  if (isTranscriptBlocked(sessionState.extractedContent)) {
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
const helper = {
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
  getVersionMismatchIssue,
  isVideoMediaSource,
  isTranscriptBlocked,
  getAnalyzeNotReadyReason,
  buildGitHubBugReportUrl,
  openGitHubBugReport,
};

// Browser global namespace attachment
if (typeof globalThis !== "undefined") {
  globalThis.helper = helper;
  globalThis.NutEggHelpers = helper;
  // Fallback for HTML templates frequently invoking escapeHtml
  globalThis.escapeHtml = escapeHtml;
}

// CommonJS export for Node test environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    helper,
    ...helper,
  };
}
