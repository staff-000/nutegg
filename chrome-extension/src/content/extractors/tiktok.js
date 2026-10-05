function detectTikTok() { return /(^|\.)tiktok\.com$/.test(location.hostname) && /\/@[^/]+\/(video|photo)\/\d+/.test(location.pathname); }
function extractTikTok() {
  const title = document.querySelector('[data-e2e="browse-video-desc"], [data-e2e="video-desc"]')?.textContent?.trim() || getMeta('og:description') || document.title;
  const author = document.querySelector('[data-e2e="browse-username"], [data-e2e="video-author-uniqueid"]')?.textContent?.trim() || '';
  return { url: location.href, title, content: `# ${title}\n\n${author ? `**Author:** ${author}\n\n` : ''}${title}`,
    sourceType: 'tiktok', mediaType: /\/photo\//.test(location.pathname) ? 'article' : 'video', transcriptAvailable: false,
    metadata: { platform: 'TikTok', author } };
}
