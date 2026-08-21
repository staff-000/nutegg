// ============================================================
// NutEgg Content Script — Extendable Web Content Extractor
// ============================================================
//
// To add a new site extractor:
//   1. Add a detect function (returns true if the extractor applies)
//   2. Add an extract function (returns {url, title, content, sourceType, metadata?})
//   3. Register both in the EXTRACTORS array below
//
// Extractors are tried in order — first match wins.

// ============================================================
// Shared utilities
// ============================================================

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

// ============================================================
// Extractor: YouTube (video pages)
// ============================================================

function detectYouTube() {
  return window.location.href.includes("youtube.com/watch");
}

async function extractYouTube() {
  const url = window.location.href;

  const title =
    document.querySelector("h1.ytd-watch-metadata yt-formatted-string")?.textContent?.trim() ||
    document.querySelector("h1 yt-formatted-string")?.textContent?.trim() ||
    document.querySelector('meta[name="title"]')?.getAttribute("content")?.trim() ||
    document.title.replace(" - YouTube", "").trim();

  const channelName =
    document.querySelector("#channel-name yt-formatted-string a")?.textContent?.trim() ||
    document.querySelector("ytd-channel-name yt-formatted-string a")?.textContent?.trim() ||
    document.querySelector("#owner-name a")?.textContent?.trim() || "";

  // Description
  const descEl = document.querySelector("#description-inline-expander, ytd-expander#description");
  let description = "";
  if (descEl) {
    const snippet = descEl.querySelector("yt-formatted-string, #snippet") ||
      descEl.querySelector('[slot="content"]');
    if (snippet) description = snippet.textContent?.trim() || "";
  }
  if (!description) description = getMeta("og:description");

  // Stats
  const viewCount = document.querySelector("#info .view-count")?.textContent?.trim() || "";
  const date = document.querySelector("#info yt-formatted-string.date")?.textContent?.trim() ||
    getMeta("datePublished") || "";

  // Chapters (with timestamps, for the clickable Chapter Map)
  const chapters = await extractChapters();

  // Captions / transcript via YouTube timedtext API
  let transcript = "";
  try {
    transcript = await fetchYouTubeCaptions();
  } catch {
    // Captions not available — that's fine
  }

  const videoId = new URL(url).searchParams.get("v") || "";
  const parts = [`# ${title}`];
  if (channelName) parts.push(`**Channel:** ${channelName}`);
  if (viewCount) parts.push(`**Views:** ${viewCount}`);
  if (date) parts.push(`**Published:** ${date}`);
  if (videoId) parts.push(`**Video ID:** ${videoId}`);

  if (description) {
    parts.push(`\n## Description\n\n${description}`);
  }
  if (chapters.length > 0) {
    parts.push(`\n## Chapters\n\n${chapters.map((c) => `- ${c.time} — ${c.title}`).join("\n")}`);
  }
  if (transcript) {
    // 100k chars ≈ 2 hours of speech — only a sanity cap, so long videos
    // keep their full transcript (the AI trims its own prompt window).
    parts.push(`\n## Transcript\n\n${truncate(transcript, 100000)}`);
  } else {
    parts.push(`\n## Transcript\n\n*No transcript available for this video.*`);
  }

  return {
    url, title,
    content: parts.join("\n"),
    sourceType: "youtube",
    chapters,
    // False when captions could not be fetched — the popup refuses to
    // analyze, because description-only analysis would be misleading.
    transcriptAvailable: !!transcript,
    metadata: {
      platform: "YouTube",
      ...(channelName && { channel: channelName }),
      ...(date && { published: date }),
      ...(videoId && { video_id: videoId }),
      time_estimate_minutes: estimateTime(parts.join(" "), "youtube"),
    },
  };
}

/**
 * Fetch YouTube captions via the timedtext API (no auth required).
 *
 * Three layers, in order:
 *   1. `ytInitialPlayerResponse` parsed from the page's own <script> tag
 *      (page globals are NOT visible to the isolated content-script world,
 *      but the script tag's text is plain DOM).
 *   2. The watch-page HTML (same-origin fetch) — `captionTracks` extracted
 *      with balanced-bracket scanning, not a truncating regex.
 *   3. The on-page transcript panel ("Show transcript" → segments), which
 *      works even when the player response is missing (consent walls, ...).
 */
async function fetchYouTubeCaptions() {
  const videoId = new URL(window.location.href).searchParams.get("v");
  if (!videoId) return "";

  // Layer 1: ytInitialPlayerResponse from the page's <script> tag
  let tracks =
    readYtInitialPlayerResponse()?.captions?.playerCaptionsTracklistRenderer
      ?.captionTracks;
  if (tracks?.length) {
    const transcript = await fetchTimedtext(tracks);
    if (transcript) return transcript;
  }

  // Layer 2: watch-page HTML
  try {
    const resp = await fetch(
      `https://www.youtube.com/watch?v=${videoId}&gl=US&hl=en`
    );
    const html = await resp.text();
    const raw = extractBalanced(html, html.indexOf('"captionTracks"'));
    if (raw) {
      tracks = JSON.parse(raw);
      if (Array.isArray(tracks) && tracks.length > 0) {
        const transcript = await fetchTimedtext(tracks);
        if (transcript) return transcript;
      }
    }
  } catch {
    // Fall through to the transcript panel
  }

  // Layer 3: the on-page transcript panel
  return readTranscriptPanel();
}

/**
 * Pick the best caption track and fetch its timedtext XML.
 * English is preferred, then non-auto-generated, then whatever exists.
 */
async function fetchTimedtext(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) return "";
  const pick =
    tracks.find((t) => t.languageCode === "en" && t.kind !== "asr") ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks.find((t) => t.kind !== "asr") ||
    tracks[0];
  if (!pick?.baseUrl) return "";
  // baseUrl escapes & as & — normalize before fetching
  const url = pick.baseUrl.replace(/\\u0026/g, "&");
  const resp = await fetch(url);
  if (!resp.ok) return "";
  return parseYouTubeCaptionXML(await resp.text());
}

/**
 * Video chapters — four layers, in order:
 *   1. ytInitialPlayerResponse → multiMarkersPlayerBarRenderer (chapter ring)
 *   2. ytInitialData → macroMarkersListItemRenderer (description chapters)
 *   3. the chapter list already visible in the DOM
 *   4. open the on-page chapter panel, read its items, close it again
 * Each layer logs which one produced the list, for easy debugging.
 */
function extractChapters() {
  // Layer 1: player response — the source the chapter ring renders from
  const pr = readYtInitialPlayerResponse();
  const markerPaths = [
    pr?.playerOverlays?.playerOverlayRenderer?.decoratedPlayerBarRenderer
      ?.decoratedPlayerBarRenderer?.playerBar?.multiMarkersPlayerBarRenderer
      ?.markersMap,
    pr?.playerOverlays?.playerOverlayRenderer?.decoratedPlayerBarRenderer
      ?.playerBar?.multiMarkersPlayerBarRenderer?.markersMap,
  ];
  for (const markers of markerPaths) {
    const chapters = chaptersFromMarkersMap(markers);
    if (chapters.length > 0) {
      console.log(`[NutEgg] Chapters: ${chapters.length} from player response`);
      return chapters;
    }
  }

  // Layer 2: ytInitialData — macro markers (description chapter list)
  const initialData = readYtInitialData();
  const macroChapters = chaptersFromMacroMarkers(initialData);
  if (macroChapters.length > 0) {
    console.log(`[NutEgg] Chapters: ${macroChapters.length} from ytInitialData`);
    return macroChapters;
  }

  // Layer 3: chapter list already rendered in the DOM
  const domChapters = readChapterListDom();
  if (domChapters.length > 0) {
    console.log(`[NutEgg] Chapters: ${domChapters.length} from DOM list`);
    return domChapters;
  }

  // Layer 4: open the chapter panel, read, close (async — handled below)
  return readChapterPanel().then((chapters) => {
    if (chapters.length > 0) {
      console.log(`[NutEgg] Chapters: ${chapters.length} from chapter panel`);
    } else {
      console.log("[NutEgg] Chapters: none found (player response parsed:", pr !== null, ")");
    }
    return chapters;
  });
}

/** Chapters from a multiMarkersPlayerBarRenderer markersMap array. */
function chaptersFromMarkersMap(markers) {
  if (!Array.isArray(markers)) return [];
  for (const m of markers) {
    const list = m?.value?.chapters;
    if (!Array.isArray(list) || list.length === 0) continue;
    const out = [];
    for (const c of list) {
      const ms = c?.chapterRenderer?.timeRangeStartMillis;
      const title = c?.chapterRenderer?.title?.simpleText;
      if (ms != null && title) out.push({ time: formatTime(ms / 1000), title });
    }
    if (out.length > 0) return out;
  }
  return [];
}

/** Chapters from macroMarkersListItemRenderer objects anywhere in the data. */
function chaptersFromMacroMarkers(data) {
  const found = [];
  if (!data || typeof data !== "object") return found;
  (function walk(node) {
    if (!node || typeof node !== "object" || found.length >= 500) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if ("macroMarkersListItemRenderer" in node) {
      const r = node.macroMarkersListItemRenderer;
      const title =
        r?.title?.simpleText || (r?.title?.runs || []).map((x) => x.text).join("");
      const timeDesc =
        r?.timeDescription?.simpleText ||
        (r?.timeDescription?.runs || []).map((x) => x.text).join("");
      if (title && timeDesc) {
        // Titles embed the time ("0:00 Introduction") — strip it
        found.push({
          time: timeDesc,
          title: title.replace(/^\d{1,2}:\d{2}(?::\d{2})?\s*/, ""),
        });
      }
      return;
    }
    for (const v of Object.values(node)) walk(v);
  })(data);
  return found;
}

/** `ytd-macro-markers-list-item-renderer` items currently in the DOM. */
function readChapterListDom() {
  const chapters = [];
  document.querySelectorAll("ytd-macro-markers-list-item-renderer").forEach((el) => {
    const time = el.querySelector("#time")?.textContent?.trim();
    const title = el.querySelector("h4")?.textContent?.trim();
    if (time && title) chapters.push({ time, title });
  });
  return chapters;
}

/** Open the chapter-list panel (player chapter button), read it, close it. */
async function readChapterPanel() {
  try {
    const button = [...document.querySelectorAll("button")].find((b) => {
      const label = (b.getAttribute("aria-label") || "").toLowerCase();
      return label === "chapters" || label.includes("chapters");
    });
    if (button) button.click();

    const items = await waitFor(() => {
      const els = document.querySelectorAll("ytd-macro-markers-list-item-renderer");
      return els.length > 0 ? els : null;
    }, 3000);
    if (!items) return [];

    const chapters = readChapterListDom();

    const closeBtn = document.querySelector(
      "ytd-engagement-panel-title-header-renderer #close-button"
    );
    closeBtn?.click();

    return chapters;
  } catch {
    return [];
  }
}

/**
 * Parse a top-level `var ytXxx = {...}` JSON object from the page's <script>
 * tags. Content scripts cannot see page globals (isolated world), but the
 * script tag text is regular DOM — extract with balanced-brace scanning.
 */
function readYtVar(name) {
  for (const script of document.querySelectorAll("script")) {
    const text = script.textContent || "";
    const marker = text.indexOf(name);
    if (marker === -1) continue;
    const eq = text.indexOf("=", marker);
    if (eq === -1) continue;
    const json = extractBalanced(text, eq + 1);
    if (!json) continue;
    try {
      return JSON.parse(json);
    } catch {
      // Try the next script tag
    }
  }
  return null;
}

/** The page's `ytInitialPlayerResponse` (captions, chapters, ...). */
function readYtInitialPlayerResponse() {
  return readYtVar("ytInitialPlayerResponse");
}

/** The page's `ytInitialData` (description chapter markers, ...). */
function readYtInitialData() {
  return readYtVar("ytInitialData");
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

/**
 * Open the "Show transcript" panel, read its segments, and close it again.
 * The last resort — works even when the player response and page HTML are
 * unavailable (consent walls, A/B layouts, ...).
 */
async function readTranscriptPanel() {
  try {
    let button = document.querySelector(
      "ytd-video-description-transcript-section-renderer button"
    );
    if (!button) {
      button = [...document.querySelectorAll("button")].find((b) => {
        const label = (b.getAttribute("aria-label") || "").toLowerCase();
        const text = (b.textContent || "").trim().toLowerCase();
        return label.includes("transcript") || text === "show transcript";
      });
    }
    if (button) button.click();

    const segments = await waitFor(() => {
      const els = document.querySelectorAll("ytd-transcript-segment-renderer");
      return els.length > 0 ? els : null;
    }, 3000);
    if (!segments) return "";

    const lines = [...segments]
      .map((s) => {
        const t = s.querySelector(".segment-timestamp")?.textContent?.trim() || "";
        const text = s.querySelector(".segment-text, yt-formatted-string")?.textContent?.trim() || "";
        return text ? (t ? `[${t}] ${text}` : text) : "";
      })
      .filter(Boolean);

    // Restore the panel state when we opened it
    const closeBtn = document.querySelector(
      "ytd-engagement-panel-title-header-renderer #close-button"
    );
    closeBtn?.click();

    return dedupTranscriptLines(lines).join("\n");
  } catch {
    return "";
  }
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

function parseYouTubeCaptionXML(xml) {
  const raw = [];
  const regex = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const startAttr = (match[1].match(/\bstart="([\d.]+)"/) || [])[1];
    const start = startAttr !== undefined ? parseFloat(startAttr) : NaN;
    const text = match[2]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (!text) continue;
    // One line per caption with its timestamp — powers the chapter-aware
    // chunking and the clickable chapter map.
    raw.push(Number.isFinite(start) ? `[${formatTime(start)}] ${text}` : text);
  }
  const out = dedupTranscriptLines(raw);
  if (out.length < raw.length) {
    console.log(
      `[NutEgg] Captions: ${raw.length} raw segments → ${out.length} after dedup (YouTube duplication)`
    );
  }
  return out.join("\n");
}

/**
 * Remove repeated caption lines. YouTube serves duplicated caption spans for
 * long videos — sometimes with identical timestamps, sometimes as a verbatim
 * second copy of the whole track (different or missing start times). Rules:
 *   - drop any line whose text was already seen (normalized)
 *   - drop any line that doesn't advance the timeline
 *   - once several consecutive lines repeat, treat the REST of the track as
 *     a duplicate copy and stop (keeps legit repeated phrases intact)
 */
function dedupTranscriptLines(lines) {
  const out = [];
  const seen = new Set();
  let lastStart = -1;
  let repeatedRun = 0;

  for (const line of lines) {
    const timeMatch = line.trim().match(/^\[(\d{1,2}:)?(\d{1,2}):(\d{2})\]/);
    const start = timeMatch ? parseTimestamp(timeMatch[0]) : -1;
    const text = line.replace(/^\[[^\]]*\]\s*/, "").trim();
    const key = text.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "");

    const isRepeat = (key && seen.has(key)) || (start >= 0 && start <= lastStart);
    if (isRepeat) {
      repeatedRun++;
      if (repeatedRun >= 3) break; // the rest is a duplicate copy of the track
      continue; // skip this duplicated line, keep scanning
    }
    repeatedRun = 0;
    if (key) seen.add(key);
    if (start >= 0) lastStart = start;
    out.push(line);
  }
  return out;
}

/** "[MM:SS]" / "[H:MM:SS]" → seconds, or -1. */
function parseTimestamp(ts) {
  const parts = ts.slice(1, -1).split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return -1;
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

// ============================================================
// Extractor: Twitter / X
// ============================================================

function detectTwitter() {
  const url = window.location.href;
  return url.includes("twitter.com") || url.includes("x.com");
}

function extractTwitter() {
  const url = window.location.href;

  // Main tweet
  const mainTweet = document.querySelector('article[data-testid="tweet"]');
  let tweetContent = mainTweet ? extractMainTweet(mainTweet) : "";

  // Fallback: collect all visible tweet texts
  if (!tweetContent) {
    const tweetTexts = document.querySelectorAll('[data-testid="tweetText"]');
    tweetContent = [...tweetTexts]
      .map((el) => el.textContent?.trim()).filter(Boolean)
      .join("\n\n---\n\n");
  }

  // Fallback: use page title (twitter puts tweet text in title)
  if (!tweetContent) {
    tweetContent = document.title
      .replace(/^(.+?)\s*\/\s*X\s*$/, "$1")
      .replace(/^(.+?)\s*\/\s*Twitter\s*$/, "$1");
  }

  // Author info
  const authorName = document.querySelector('[data-testid="User-Name"]')?.textContent?.trim() || "";
  const authorHandle = document.querySelector('[data-testid="User-Name"] a')?.textContent?.trim() || "";
  const timestamp = document.querySelector("time")?.getAttribute("datetime") || "";

  // Thread detection
  const threadTweets = document.querySelectorAll('article[data-testid="tweet"]');
  if (threadTweets.length > 1 && mainTweet) {
    const threadContent = [...threadTweets]
      .map((tweet, i) => {
        const text = tweet.querySelector('[data-testid="tweetText"]')?.textContent?.trim();
        const user = tweet.querySelector('[data-testid="User-Name"]')?.textContent?.trim();
        return text ? `${i + 1}. **${user || "..."}**: ${text}` : null;
      })
      .filter(Boolean).join("\n\n");
    if (threadContent) tweetContent = `## Thread (${threadTweets.length} tweets)\n\n${threadContent}`;
  }

  const title = authorName ? `Tweet by ${authorName}` : `Tweet from ${url}`;
  return {
    url, title,
    content: `# ${title}\n\n${tweetContent || "Could not extract tweet content."}`,
    sourceType: "twitter",
    metadata: {
      platform: "Twitter/X",
      ...(authorName && { author: authorName }),
      ...(authorHandle && { handle: authorHandle }),
      ...(timestamp && { published: timestamp }),
      time_estimate_minutes: estimateTime(tweetContent, "twitter"),
    },
  };
}

function extractMainTweet(tweetElement) {
  const parts = [];
  const author = tweetElement.querySelector('[data-testid="User-Name"]')?.textContent?.trim();
  if (author) parts.push(`**Author:** ${author}`);
  const text = tweetElement.querySelector('[data-testid="tweetText"]')?.textContent?.trim();
  if (text) parts.push(`\n${text}`);
  tweetElement.querySelectorAll('a[href*="http"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (href && !href.includes("twitter.com") && !href.includes("x.com")) {
      parts.push(`\n🔗 ${href}`);
    }
  });
  const images = tweetElement.querySelectorAll('img[src*="media"]');
  if (images.length > 0) parts.push(`\n📷 ${images.length} image(s)`);
  const stats = tweetElement.querySelector('[role="group"]')?.textContent?.trim();
  if (stats) parts.push(`\n📊 ${stats}`);
  return parts.join("\n");
}

// ============================================================
// Extractor: Article (Medium, Substack, blogs, news)
// ============================================================

function detectArticle() {
  const url = window.location.href;

  // Explicit article sites
  if (url.includes("medium.com")) return true;
  if (url.includes("substack.com")) return true;

  const articleMeta = document.querySelector('meta[property="og:type"][content="article"]');
  const articleTag = document.querySelector("article");
  const schemaArticle = document.querySelector('[itemtype*="Article"], [itemtype*="BlogPosting"]');

  return !!(articleMeta || (articleTag && schemaArticle));
}

function extractArticle() {
  const url = window.location.href;
  const siteName = getMeta("og:site_name");

  // Site-specific extraction
  if (url.includes("medium.com")) return extractMedium(url, siteName);

  // Generic article extraction
  const articleSelectors = ["article", '[role="article"]', ".post", ".article",
    '[itemtype*="Article"]', '[itemtype*="BlogPosting"]', ".blog-post", ".story",
    ".post-content", ".article-content", ".entry-content"];

  let articleEl = null;
  for (const sel of articleSelectors) {
    articleEl = document.querySelector(sel);
    if (articleEl && (articleEl.textContent?.length || 0) > 200) break;
    articleEl = null;
  }
  if (!articleEl) return null;

  const title = getMeta("og:title") ||
    articleEl.querySelector("h1")?.textContent?.trim() ||
    document.title;

  const author = getMeta("author") || getMeta("article:author") ||
    articleEl.querySelector('[rel="author"], .author, .byline, [data-testid="authorName"]')?.textContent?.trim() || "";

  const published = getMeta("article:published_time") ||
    document.querySelector("time[datetime]")?.getAttribute("datetime") ||
    document.querySelector("time")?.textContent?.trim() || "";

  const contentText = extractArticleText(articleEl);

  // Extract headings for structure
  const headings = articleEl.querySelectorAll("h1, h2, h3");
  const headingStructure = [...headings]
    .filter((h) => h.textContent?.trim())
    .map((h) => `${"  ".repeat(Math.max(0, parseInt(h.tagName[1]) - 2))}- ${h.textContent.trim()}`)
    .join("\n");

  const parts = [`# ${title}`];
  if (author) parts.push(`**Author:** ${author}`);
  if (published) parts.push(`**Published:** ${published}`);
  if (headingStructure) parts.push(`\n## Structure\n\n${headingStructure}`);
  parts.push(`\n## Content\n\n${contentText}`);

  return {
    url, title,
    content: parts.join("\n"),
    sourceType: "article",
    metadata: {
      ...(author && { author }),
      ...(published && { published }),
      ...(siteName && { site: siteName }),
      reading_time: readingTime(contentText),
      time_estimate_minutes: estimateTime(contentText, "article"),
    },
  };
}

/**
 * Medium-specific extraction (handles paywalled content better).
 */
function extractMedium(url, siteName) {
  const title = document.querySelector("h1")?.textContent?.trim() ||
    getMeta("og:title") || document.title;

  const author = document.querySelector('[data-testid="authorName"], a[rel="author"]')?.textContent?.trim() ||
    getMeta("author") || "";

  const published = document.querySelector("time")?.getAttribute("datetime") ||
    getMeta("article:published_time") || "";

  // Medium stores article body in <article> or <section data-testid="article-body">
  const articleEl =
    document.querySelector('section[data-testid="article-body"]') ||
    document.querySelector("article") ||
    document.querySelector(".postArticle-content");

  let contentText = "";
  if (articleEl) {
    contentText = extractText(articleEl);
  } else {
    // Collect all paragraphs
    const paragraphs = document.querySelectorAll("article p, .section-inner p, [data-selectable-paragraph]");
    contentText = [...paragraphs].map((p) => p.textContent?.trim()).filter(Boolean).join("\n\n");
  }

  const parts = [`# ${title}`];
  if (author) parts.push(`**Author:** ${author}`);
  if (published) parts.push(`**Published:** ${published}`);
  parts.push(`\n## Content\n\n${truncate(contentText, 12000)}`);

  return {
    url, title,
    content: parts.join("\n"),
    sourceType: "article",
    metadata: {
      platform: "Medium",
      ...(author && { author }),
      ...(published && { published }),
      reading_time: readingTime(contentText),
      time_estimate_minutes: estimateTime(contentText, "article"),
    },
  };
}

function extractArticleText(article) {
  const clone = article.cloneNode(true);
  const removeSelectors = ["script", "style", "noscript", "iframe", ".advertisement",
    ".ads", ".social-share", ".share-buttons", ".related-posts", ".comments",
    "#comments", ".sidebar", "nav", ".nav", ".navigation"];
  removeSelectors.forEach((sel) => {
    clone.querySelectorAll(sel).forEach((el) => el.remove());
  });
  let text = clone.textContent || "";
  text = text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{3,}/g, "  ")
    .replace(/^\s+|\s+$/gm, "").trim();
  return truncate(text, 12000);
}

// ============================================================
// Extractor: Generic (fallback for any webpage)
// ============================================================

function extractGeneric() {
  const url = window.location.href;
  const title = document.title ||
    getMeta("og:title") ||
    document.querySelector("h1")?.textContent?.trim() ||
    url;

  // Try common content containers
  const contentSelectors = [
    "main", "article", '[role="main"]', "#content", "#main-content",
    ".post-content", ".article-content", ".entry-content", ".content",
    "#article", ".main",
  ];

  let container = null;
  for (const sel of contentSelectors) {
    container = document.querySelector(sel);
    if (container && container.textContent && container.textContent.trim().length > 100) break;
  }

  let mainContent = "";
  if (container) {
    mainContent = extractText(container);
  } else {
    const body = document.body.cloneNode(true);
    const removeSelectors = ["nav", "header", "footer", "script", "style", "noscript",
      "iframe", ".sidebar", ".navigation", ".nav", ".menu", ".comments",
      "#comments", ".advertisement", ".ads", ".social-share"];
    removeSelectors.forEach((sel) => {
      body.querySelectorAll(sel).forEach((el) => el.remove());
    });
    mainContent = extractText(body);
  }

  // Metadata
  const description = getMeta("description") || getMeta("og:description");
  const author = getMeta("author") || getMeta("article:author");
  const published = getMeta("article:published_time");
  const siteName = getMeta("og:site_name");

  const metadata = {};
  if (description) metadata.description = description;
  if (author) metadata.author = author;
  if (published) metadata.published = published;
  if (siteName) metadata.site = siteName;

  metadata.time_estimate_minutes = estimateTime(mainContent, "webpage");

  return {
    url, title,
    content: `# ${title}\n\n${truncate(mainContent, 15000)}`,
    sourceType: "webpage",
    metadata,
  };
}

// ============================================================
// Extractor registry — add new extractors here
// ============================================================

const EXTRACTORS = [
  { name: "youtube", detect: detectYouTube, extract: extractYouTube },
  { name: "twitter", detect: detectTwitter, extract: extractTwitter },
  { name: "article", detect: detectArticle, extract: extractArticle },
  // Generic must be last — it always matches
  { name: "generic", detect: () => true, extract: extractGeneric },
];

// ============================================================
// Main entry point
// ============================================================

function extractContent() {
  for (const ex of EXTRACTORS) {
    try {
      if (ex.detect()) {
        console.log(`[NutEgg] Using extractor: ${ex.name}`);
        return ex.extract();
      }
    } catch (e) {
      console.warn(`[NutEgg] Extractor "${ex.name}" failed:`, e);
    }
  }
  // Ultimate fallback
  console.warn("[NutEgg] All extractors failed, using generic");
  return extractGeneric();
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "nutegg-seek") {
    // Seek the page's video to the given timestamp (seconds) — used by the
    // clickable Chapter Map in the popup.
    const video = document.querySelector("video");
    if (video) {
      video.currentTime = message.seconds;
      video.play?.();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "No video element found" });
    }
    return false;
  }

  if (message.action === "extract-content") {
    try {
      const result = extractContent();
      // If the result is a promise (e.g. YouTube with async caption fetch), await it
      if (result instanceof Promise) {
        result
          .then((content) => sendResponse({ success: true, content }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open for async
      }
      sendResponse({ success: true, content: result });
    } catch (err) {
      sendResponse({ success: false, error: err instanceof Error ? err.message : "Extraction failed" });
    }
    return true;
  }
});

console.log("[NutEgg] Content script loaded on:", window.location.href);
