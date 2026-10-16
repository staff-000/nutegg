// ============================================================
// NutEgg Extractor: Generic (fallback for any webpage)
// ============================================================
//
// Catches all pages that no other extractor matched. Extracts
// the main content area, metadata, and a reading time estimate.
//
// Depends on: utils.js (extractText, getMeta, truncate, estimateTime)

function extractGeneric(context) {
  const url = window.location.href;
  const title = document.title || getMeta('og:title') || document.querySelector('h1')?.textContent?.trim() || url;

  const container = findCaptureContainer(context);
  const body = captureTextResult(container, context);
  const mainContent = body.text;

  // Metadata
  const description = getMeta('description') || getMeta('og:description');
  const author = getMeta('author') || getMeta('article:author');
  const published =
    getMeta('article:published_time') ||
    getMeta('datePublished') ||
    getMeta('uploadDate') ||
    getMeta('pubdate') ||
    getMeta('date') ||
    getMeta('DC.date.issued');
  const siteName = getMeta('og:site_name');

  const metadata = {};
  if (description) metadata.description = description;
  if (author) metadata.author = author;
  if (published) metadata.published = published;
  if (siteName) metadata.site = siteName;

  metadata.time_estimate_minutes = estimateTime(mainContent, 'webpage');

  return applyTextCaptureResult(
    {
      url,
      title,
      content: `# ${title}\n\n${mainContent}`,
      sourceType: 'webpage',
      metadata,
    },
    body
  );
}
