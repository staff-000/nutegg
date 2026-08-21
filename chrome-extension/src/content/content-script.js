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
  const chapters = [];
  document.querySelectorAll("ytd-macro-markers-list-item-renderer").forEach((el) => {
    const time = el.querySelector("#time")?.textContent?.trim();
    const chTitle = el.querySelector("h4")?.textContent?.trim();
    if (time && chTitle) chapters.push({ time, title: chTitle });
  });

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
    parts.push(`\n## Transcript\n\n${truncate(transcript, 10000)}`);
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
 * Parse the page's `ytInitialPlayerResponse` JSON from its <script> tag.
 * Content scripts cannot see page globals (isolated world), but the script
 * tag text is regular DOM — extract the object with balanced-brace scanning.
 */
function readYtInitialPlayerResponse() {
  for (const script of document.querySelectorAll("script")) {
    const text = script.textContent || "";
    const marker = text.indexOf("ytInitialPlayerResponse");
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

    return lines.join("\n");
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
  const texts = [];
  const regex = /<text[^>]*>(.*?)<\/text>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    // Strip HTML tags from caption text
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text) texts.push(text);
  }
  return texts.join(" ");
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
