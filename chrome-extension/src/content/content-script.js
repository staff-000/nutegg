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

  // Chapters
  const chapters = [];
  document.querySelectorAll("ytd-macro-markers-list-item-renderer").forEach((el) => {
    const time = el.querySelector("#time")?.textContent?.trim();
    const chTitle = el.querySelector("h4")?.textContent?.trim();
    if (time && chTitle) chapters.push(`- ${time} — ${chTitle}`);
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
    parts.push(`\n## Chapters\n\n${chapters.join("\n")}`);
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
 */
async function fetchYouTubeCaptions() {
  const videoId = new URL(window.location.href).searchParams.get("v");
  if (!videoId) return "";

  // Try to get captions from ytInitialPlayerResponse
  try {
    const playerResponse = window.ytInitialPlayerResponse || {};
    const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (captions && captions.length > 0) {
      // Prefer English, then first available
      const track = captions.find((t) => t.languageCode === "en") || captions[0];
      if (track.baseUrl) {
        const resp = await fetch(track.baseUrl);
        const xml = await resp.text();
        return parseYouTubeCaptionXML(xml);
      }
    }
  } catch (e) {
    // Fall through to page scraping
  }

  // Fallback: try fetching from timedtext API
  try {
    const resp = await fetch(
      `https://www.youtube.com/watch?v=${videoId}&gl=US&hl=en`
    );
    const html = await resp.text();
    const match = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (match) {
      const tracks = JSON.parse(match[1]);
      if (tracks.length > 0) {
        const track = tracks.find((t) => t.languageCode === "en") || tracks[0];
        if (track.baseUrl) {
          const cr = await fetch(track.baseUrl);
          return parseYouTubeCaptionXML(await cr.text());
        }
      }
    }
  } catch {
    // No captions available
  }

  return "";
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
