// ============================================================
// NutEgg Content Script — Shared Utilities
// ============================================================
//
// Utility functions used by multiple extractors. Loaded first
// via manifest.json so all extractors can reference them.

/**
 * fetch() with an abort timeout. Some endpoints (e.g. YouTube's timedtext
 * API for certain signed URLs) stall without answering — extraction must
 * never hang on them. Rejects with an AbortError on timeout.
 */
function fetchWithTimeout(url, opts = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

function extractText(element) {
  const clone = element.cloneNode(true);
  clone.querySelectorAll("script, style, noscript, svg, img, video, audio, iframe, nav, footer")
    .forEach((el) => el.remove());
  let text = clone.textContent || "";
  return text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{3,}/g, "  ")
    .replace(/^\s+|\s+$/gm, "").trim();
}

function getMeta(name) {
  return document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.getAttribute("content")?.trim() || "";
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return text.substring(0, max) + "\n\n[...truncated]";
}

function estimateTime(text, sourceType) {
  if (sourceType === "youtube") {
    // Try to get actual video duration
    const video = document.querySelector("video");
    if (video && video.duration) return Math.ceil(video.duration / 60);
    // Fallback: estimate from description + transcript word count
    const words = text.split(/\s+/).length;
    return Math.max(2, Math.ceil(words / 150)); // ~150 wpm for video content
  }
  if (sourceType === "twitter") {
    const tweetCount = document.querySelectorAll('article[data-testid="tweet"]').length;
    return Math.max(1, tweetCount * 2); // ~2 min per tweet in a thread
  }
  // Generic/article: word count based
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200)); // ~200 wpm reading speed
}

function readingTime(text) {
  const mins = Math.ceil(text.split(/\s+/).length / 200);
  return mins <= 1 ? "~1 min" : `~${mins} min`;
}

/** Poll until `getter` returns a truthy value (or null after `timeoutMs`). */
function waitFor(getter, timeoutMs) {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const tick = () => {
      const value = getter();
      if (value) return resolve(value);
      if (Date.now() > deadline) return resolve(null);
      setTimeout(tick, 200);
    };
    tick();
  });
}

/**
 * Extract a balanced JSON object/array starting at the first `{` or `[` at
 * or after `from`. String-aware, so braces/brackets inside string values
 * don't break the scan. Returns "" when unbalanced (truncated input).
 */
function extractBalanced(text, from) {
  const brace = text.indexOf("{", from);
  const bracket = text.indexOf("[", from);
  let start, open, close;
  if (brace === -1 && bracket === -1) return "";
  if (brace !== -1 && (bracket === -1 || brace < bracket)) {
    start = brace; open = "{"; close = "}";
  } else {
    start = bracket; open = "["; close = "]";
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return "";
}

/** Seconds → "MM:SS" or "H:MM:SS". */
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "[MM:SS]" / "[H:MM:SS]" → seconds, or -1. */
function parseTimestamp(ts) {
  const parts = ts.slice(1, -1).split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return -1;
}
