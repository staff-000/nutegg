// NutEgg Content Script — injected into every page
// Contains all extractors inline for no-build-step simplicity

// --- Page Type Detection ---

function detectPageType() {
  const url = window.location.href;
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("youtube.com/watch")) return "youtube";
  if (url.includes("youtube.com")) return "webpage";

  const articleMeta = document.querySelector('meta[property="og:type"][content="article"]');
  const hasArticleTag = document.querySelector("article");
  const hasSchemaArticle = document.querySelector('[itemtype*="Article"]');
  if (articleMeta || (hasArticleTag && hasSchemaArticle)) return "article";

  return "webpage";
}

// --- Generic Extractor ---

function extractGeneric() {
  const url = window.location.href;
  const title =
    document.title ||
    document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
    document.querySelector("h1")?.textContent?.trim() ||
    url;

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

  const truncated = mainContent.length > 15000
    ? mainContent.substring(0, 15000) + "\n\n[...content truncated]"
    : mainContent;

  const metadata = {};
  const description = document.querySelector('meta[name="description"]')?.getAttribute("content")
    || document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "";
  if (description) metadata.description = description;

  const author = document.querySelector('meta[name="author"]')?.getAttribute("content")
    || document.querySelector('meta[property="article:author"]')?.getAttribute("content") || "";
  if (author) metadata.author = author;

  const published = document.querySelector('meta[property="article:published_time"]')?.getAttribute("content") || "";
  if (published) metadata.published = published;

  const siteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute("content") || "";
  if (siteName) metadata.site = siteName;

  return {
    url, title,
    content: `# ${title}\n\n${truncated}`,
    sourceType: "webpage",
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

function extractText(element) {
  const clone = element.cloneNode(true);
  clone.querySelectorAll("script, style, noscript, svg, img, video, audio, iframe, nav, footer")
    .forEach((el) => el.remove());
  let text = clone.textContent || "";
  text = text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{3,}/g, "  ")
    .replace(/^\s+|\s+$/gm, "").trim();
  return text;
}

// --- Twitter/X Extractor ---

function extractTwitter() {
  const url = window.location.href;
  let tweetContent = "";

  const mainTweet = document.querySelector('article[data-testid="tweet"]');
  if (mainTweet) tweetContent = extractMainTweet(mainTweet);

  if (!tweetContent) {
    const tweetTexts = document.querySelectorAll('[data-testid="tweetText"]');
    if (tweetTexts.length > 0) {
      tweetContent = [...tweetTexts]
        .map((el) => el.textContent?.trim()).filter(Boolean)
        .join("\n\n---\n\n");
    }
  }

  if (!tweetContent) {
    const title = document.title.replace(/^(.+?)\s*\/\s*X\s*$/, "$1")
      .replace(/^(.+?)\s*\/\s*Twitter\s*$/, "$1");
    if (title) tweetContent = title;
  }

  const authorName = document.querySelector('[data-testid="User-Name"]')?.textContent?.trim() || "";
  const authorHandle = document.querySelector('[data-testid="User-Name"] a')?.textContent?.trim() || "";
  const timestamp = document.querySelector("time")?.getAttribute("datetime") || "";

  const metadata = { platform: "Twitter/X" };
  if (authorName) metadata.author = authorName;
  if (authorHandle) metadata.handle = authorHandle;
  if (timestamp) metadata.published = timestamp;

  // Thread detection
  const threadTweets = document.querySelectorAll('article[data-testid="tweet"]');
  if (threadTweets.length > 1) {
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
    metadata,
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
  if (images.length > 0) parts.push(`\n📷 ${images.length} image(s) attached`);
  const stats = tweetElement.querySelector('[role="group"]')?.textContent?.trim();
  if (stats) parts.push(`\n📊 ${stats}`);
  return parts.join("\n");
}

// --- YouTube Extractor ---

function extractYouTube() {
  const url = window.location.href;
  const title =
    document.querySelector("h1.ytd-watch-metadata yt-formatted-string")?.textContent?.trim() ||
    document.querySelector("h1 yt-formatted-string")?.textContent?.trim() ||
    document.querySelector("#title h1")?.textContent?.trim() ||
    document.querySelector('meta[name="title"]')?.getAttribute("content")?.trim() ||
    document.title.replace(" - YouTube", "").trim();

  const channelName =
    document.querySelector("#channel-name yt-formatted-string a")?.textContent?.trim() ||
    document.querySelector("ytd-channel-name yt-formatted-string a")?.textContent?.trim() ||
    document.querySelector("#owner-name a")?.textContent?.trim() || "";

  const descriptionEl = document.querySelector("#description-inline-expander, ytd-expander#description");
  let description = "";
  if (descriptionEl) {
    const snippet = descriptionEl.querySelector("yt-formatted-string, #snippet")
      || descriptionEl.querySelector('[slot="content"]');
    if (snippet) description = snippet.textContent?.trim() || "";
  }
  if (!description) {
    description = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
  }

  const viewCount = document.querySelector("#info .view-count")?.textContent?.trim() || "";
  const date = document.querySelector("#info yt-formatted-string.date")?.textContent?.trim()
    || document.querySelector('meta[itemprop="datePublished"]')?.getAttribute("content") || "";

  const chapters = [];
  document.querySelectorAll("ytd-macro-markers-list-item-renderer").forEach((el) => {
    const time = el.querySelector("#time")?.textContent?.trim();
    const chTitle = el.querySelector("h4")?.textContent?.trim();
    if (time && chTitle) chapters.push(`- ${time} — ${chTitle}`);
  });

  const parts = [`# ${title}`];
  if (channelName) parts.push(`\n**Channel:** ${channelName}`);
  if (viewCount) parts.push(`**Views:** ${viewCount}`);
  if (date) parts.push(`**Published:** ${date}`);
  parts.push(`\n## Description\n\n${description || "No description available."}`);
  if (chapters.length > 0) parts.push(`\n## Chapters\n\n${chapters.join("\n")}`);
  parts.push(`\n## Transcript\n\n*YouTube transcripts are not directly accessible. Use a transcript extension for full transcripts.*`);

  const metadata = { platform: "YouTube", video_url: url };
  if (channelName) metadata.channel = channelName;
  if (date) metadata.published = date;

  return { url, title, content: parts.join("\n"), sourceType: "youtube", metadata };
}

// --- Article Extractor ---

function extractArticle() {
  const url = window.location.href;
  const articleSelectors = ["article", '[role="article"]', ".post", ".article",
    '[itemtype*="Article"]', '[itemtype*="BlogPosting"]', ".blog-post", ".story"];

  let articleElement = null;
  for (const sel of articleSelectors) {
    articleElement = document.querySelector(sel);
    if (articleElement && (articleElement.textContent?.length || 0) > 200) break;
    articleElement = null;
  }
  if (!articleElement) return null;

  const title = document.querySelector('meta[property="og:title"]')?.getAttribute("content")
    || articleElement.querySelector("h1")?.textContent?.trim()
    || document.title;

  const author = document.querySelector('meta[name="author"]')?.getAttribute("content")
    || document.querySelector('meta[property="article:author"]')?.getAttribute("content")
    || articleElement.querySelector('[rel="author"], .author, .byline')?.textContent?.trim() || "";

  const publishedDate = document.querySelector('meta[property="article:published_time"]')?.getAttribute("content")
    || document.querySelector("time[datetime]")?.getAttribute("datetime")
    || document.querySelector("time")?.textContent?.trim() || "";

  const contentText = extractArticleText(articleElement);

  const headings = articleElement.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const headingStructure = [...headings]
    .filter((h) => h.textContent && h.textContent.trim().length > 0)
    .map((h) => {
      const level = parseInt(h.tagName[1]);
      const indent = "  ".repeat(Math.max(0, level - 2));
      return `${indent}- ${h.textContent.trim()}`;
    }).join("\n");

  const parts = [`# ${title}`];
  if (author) parts.push(`\n**Author:** ${author}`);
  if (publishedDate) parts.push(`**Published:** ${publishedDate}`);
  parts.push(`\n## Article Structure\n\n${headingStructure || "(No headings found)"}`);
  parts.push(`\n## Content\n\n${contentText}`);

  const metadata = {};
  if (author) metadata.author = author;
  if (publishedDate) metadata.published = publishedDate;
  const siteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute("content") || "";
  if (siteName) metadata.site = siteName;
  const wordCount = contentText.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 200);
  metadata.reading_time = minutes <= 1 ? "~1 minute" : `~${minutes} minutes`;

  return { url, title, content: parts.join("\n"), sourceType: "article",
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined };
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
  if (text.length > 12000) text = text.substring(0, 12000) + "\n\n[...content truncated]";
  return text;
}

// --- Main: Extract & communicate ---

function extractContent() {
  const pageType = detectPageType();
  switch (pageType) {
    case "twitter": return extractTwitter();
    case "youtube": return extractYouTube();
    case "article": return extractArticle() || extractGeneric();
    default: return extractGeneric();
  }
}

// Listen for messages from background/popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "extract-content") {
    try {
      const content = extractContent();
      sendResponse({ success: true, content });
    } catch (err) {
      sendResponse({ success: false, error: err instanceof Error ? err.message : "Extraction failed" });
    }
    return true;
  }
});

console.log("[NutEgg] Content script loaded on:", window.location.href);
