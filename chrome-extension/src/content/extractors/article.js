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
  if (NutEggPageIdentity.hostMatches(url, 'medium.com')) return true;
  if (NutEggPageIdentity.hostMatches(url, 'substack.com')) return true;

  const articleMeta = document.querySelector('meta[property="og:type"][content="article"]');
  const articleTag = document.querySelector('article');
  const schemaArticle = document.querySelector('[itemtype*="Article"], [itemtype*="BlogPosting"]');

  return !!(articleMeta || articleTag || schemaArticle);
}

function findArticleElement(context) {
  return findCaptureContainer(context);
}

function extractArticle(context) {
  const url = window.location.href;
  const siteName = getMeta('og:site_name');

  // Site-specific extraction
  if (NutEggPageIdentity.hostMatches(url, 'medium.com')) return extractMedium(url, siteName, context);

  const articleEl = findArticleElement(context);
  if (!articleEl) return null;

  // JSON-LD metadata fallback
  const jsonLd =
    (typeof readJsonLd === 'function' &&
      (readJsonLd('NewsArticle') || readJsonLd('Article') || readJsonLd('BlogPosting') || readJsonLd())) ||
    null;

  const title =
    getMeta('og:title') ||
    jsonLd?.headline ||
    jsonLd?.name ||
    articleEl.querySelector('h1')?.textContent?.trim() ||
    document.querySelector('h1')?.textContent?.trim() ||
    document.title;

  let author = getMeta('author');
  if (!author && jsonLd?.author) {
    if (Array.isArray(jsonLd.author)) {
      author = jsonLd.author
        .map(a => (typeof a === 'string' ? a : a?.name))
        .filter(Boolean)
        .join(', ');
    } else if (typeof jsonLd.author === 'string') {
      author = jsonLd.author;
    } else if (jsonLd.author?.name) {
      author = jsonLd.author.name;
    }
  }
  if (!author) {
    const rawAuthor = getMeta('article:author');
    if (rawAuthor && !rawAuthor.startsWith('http://') && !rawAuthor.startsWith('https://')) {
      author = rawAuthor;
    }
  }
  if (!author) {
    author =
      articleEl
        .querySelector(
          '[rel="author"], .author, .byline, [data-testid="authorName"], [class*="byline"], [class*="Byline"]'
        )
        ?.textContent?.trim() || '';
    if (author) {
      author = author
        .replace(/^by\s+/i, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (author.length > 100) author = author.slice(0, 100);
    }
  }

  const published =
    getMeta('article:published_time') ||
    jsonLd?.datePublished ||
    getMeta('datePublished') ||
    document.querySelector('time[datetime]')?.getAttribute('datetime') ||
    document.querySelector('time')?.textContent?.trim() ||
    '';

  const body = captureTextResult(articleEl, context);
  const contentText = body.text;

  const parts = [`# ${title}`];
  if (author) parts.push(`**Author:** ${author}`);
  if (published) parts.push(`**Published:** ${published}`);
  parts.push(`\n## Content\n\n${contentText}`);

  const site = siteName || jsonLd?.publisher?.name || '';

  return applyTextCaptureResult(
    {
      url,
      title,
      content: parts.join('\n'),
      sourceType: 'article',
      metadata: {
        ...(author && { author }),
        ...(published && { published }),
        ...(site && { site }),
        reading_time: readingTime(contentText),
        time_estimate_minutes: estimateTime(contentText, 'article'),
      },
    },
    body
  );
}

/**
 * Medium-specific extraction (handles paywalled content better).
 */
function extractMedium(url, siteName, context) {
  const title = document.querySelector('h1')?.textContent?.trim() || getMeta('og:title') || document.title;

  const author =
    document.querySelector('[data-testid="authorName"], a[rel="author"]')?.textContent?.trim() ||
    getMeta('author') ||
    '';

  const published = document.querySelector('time')?.getAttribute('datetime') || getMeta('article:published_time') || '';

  // Medium stores article body in <article> or <section data-testid="article-body">
  const articleEl =
    document.querySelector('section[data-testid="article-body"]') ||
    document.querySelector('article') ||
    document.querySelector('.postArticle-content');

  const body = captureTextResult(articleEl || findCaptureContainer(context), context);
  const contentText = body.text;

  const parts = [`# ${title}`];
  if (author) parts.push(`**Author:** ${author}`);
  if (published) parts.push(`**Published:** ${published}`);
  parts.push(`\n## Content\n\n${contentText}`);

  return applyTextCaptureResult(
    {
      url,
      title,
      content: parts.join('\n'),
      sourceType: 'article',
      metadata: {
        platform: 'Medium',
        ...(author && { author }),
        ...(published && { published }),
        reading_time: readingTime(contentText),
        time_estimate_minutes: estimateTime(contentText, 'article'),
      },
    },
    body
  );
}

function extractArticleText(article, context) {
  return captureTextResult(article, context).text;
}
