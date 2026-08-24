// ============================================================
// NutEgg Extractor: Article (Medium, Substack, blogs, news)
// ============================================================
//
// Detects article-like pages via og:type, <article> tags, and
// schema.org markup. Includes Medium-specific extraction.
//
// Depends on: utils.js (extractText, getMeta, truncate, estimateTime, readingTime)

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
