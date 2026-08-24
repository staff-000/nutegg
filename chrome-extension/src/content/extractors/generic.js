// ============================================================
// NutEgg Extractor: Generic (fallback for any webpage)
// ============================================================
//
// Catches all pages that no other extractor matched. Extracts
// the main content area, metadata, and a reading time estimate.
//
// Depends on: utils.js (extractText, getMeta, truncate, estimateTime)

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
