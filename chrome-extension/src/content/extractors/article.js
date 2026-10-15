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
  if (url.includes('medium.com')) return true;
  if (url.includes('substack.com')) return true;

  const articleMeta = document.querySelector('meta[property="og:type"][content="article"]');
  const articleTag = document.querySelector('article');
  const schemaArticle = document.querySelector('[itemtype*="Article"], [itemtype*="BlogPosting"]');

  return !!(articleMeta || articleTag || schemaArticle);
}

function findArticleElement() {
  // 1. High-confidence explicit article body selectors
  const explicitBodySelectors = [
    '[itemprop="articleBody"]',
    '.RichTextStoryBody',
    '.ArticleBody-articleBody',
    'div[data-module="ArticleBody"]',
    '.article-body',
    '.article__body',
    '.story-body',
    '.story__body',
    '[data-testid="article-body"]',
    '.caas-body',
    '.meteredContent',
    '.entry-content',
    '.post-body',
    '.post-content',
  ];

  for (const sel of explicitBodySelectors) {
    const el = document.querySelector(sel);
    if (el && (el.textContent?.length || 0) > 200) {
      return el;
    }
  }

  // 2. Structural container candidates: score multiple candidates by paragraph density & text volume
  // This prevents picking small hero banners, breaking news tickers, or teaser cards (<article>) over the actual story
  const containerSelectors = [
    'article',
    '[role="article"]',
    'main',
    '[role="main"]',
    '#main-content',
    '#content',
    '.article-content',
    '.article__content',
    '.main-article',
    '.post',
    '.article',
    '.blog-post',
    '.story',
  ];

  let bestEl = null;
  let bestScore = 0;

  for (const sel of containerSelectors) {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      // Exclude navigation, headers, footers, and sidebars
      if (el.closest('nav, header, footer, aside, .sidebar, bsp-nav, bsp-header, [role="navigation"], [role="banner"]'))
        continue;

      const pCount = el.querySelectorAll('p').length;
      const textLen = el.textContent?.trim().length || 0;
      if (textLen < 200) continue;

      // Score: heavily reward paragraphs to distinguish true article bodies from teaser cards/widgets
      const score = pCount * 500 + textLen;
      if (score > bestScore) {
        bestScore = score;
        bestEl = el;
      }
    }
  }

  return bestEl;
}

function extractArticle() {
  const url = window.location.href;
  const siteName = getMeta('og:site_name');

  // Site-specific extraction
  if (url.includes('medium.com')) return extractMedium(url, siteName);

  const articleEl = findArticleElement();
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

  const contentText = extractArticleText(articleEl);
  if (!contentText || contentText.length < 50) return null;

  const parts = [`# ${title}`];
  if (author) parts.push(`**Author:** ${author}`);
  if (published) parts.push(`**Published:** ${published}`);
  parts.push(`\n## Content\n\n${contentText}`);

  const site = siteName || jsonLd?.publisher?.name || '';

  return {
    url,
    title,
    content: parts.join('\n'),
    sourceType: 'article',
    extractionStatus: 'ready',
    metadata: {
      ...(author && { author }),
      ...(published && { published }),
      ...(site && { site }),
      reading_time: readingTime(contentText),
      time_estimate_minutes: estimateTime(contentText, 'article'),
    },
  };
}

/**
 * Medium-specific extraction (handles paywalled content better).
 */
function extractMedium(url, siteName) {
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

  let contentText = '';
  if (articleEl) {
    contentText = extractText(articleEl);
  } else {
    // Collect all paragraphs
    const paragraphs = document.querySelectorAll('article p, .section-inner p, [data-selectable-paragraph]');
    contentText = [...paragraphs]
      .map(p => p.textContent?.trim())
      .filter(Boolean)
      .join('\n\n');
  }

  const parts = [`# ${title}`];
  if (author) parts.push(`**Author:** ${author}`);
  if (published) parts.push(`**Published:** ${published}`);
  parts.push(`\n## Content\n\n${truncate(contentText, 60000)}`);

  return {
    url,
    title,
    content: parts.join('\n'),
    sourceType: 'article',
    extractionStatus: 'ready',
    metadata: {
      platform: 'Medium',
      ...(author && { author }),
      ...(published && { published }),
      reading_time: readingTime(contentText),
      time_estimate_minutes: estimateTime(contentText, 'article'),
    },
  };
}

function extractArticleText(article) {
  const clone = article.cloneNode(true);
  const removeSelectors = [
    'script',
    'style',
    'noscript',
    'iframe',
    '.advertisement',
    '.ads',
    '.social-share',
    '.share-buttons',
    '.related-posts',
    '.comments',
    '#comments',
    '.sidebar',
    'nav',
    '.nav',
    '.navigation',
    'bsp-nav',
    'bsp-header',
    'footer',
    '.FooterNavigation',
    '.Page-footer',
    'aside',
  ];
  removeSelectors.forEach(sel => {
    clone.querySelectorAll(sel).forEach(el => el.remove());
  });

  const blocks = clone.querySelectorAll('p, h2, h3, h4, blockquote, li');
  if (blocks.length >= 3) {
    const lines = [];
    blocks.forEach(el => {
      const t = el.textContent?.trim();
      if (!t) return;
      if (el.tagName === 'LI') {
        lines.push(`- ${t}`);
      } else if (el.tagName.startsWith('H')) {
        lines.push(`\n### ${t}\n`);
      } else if (el.tagName === 'BLOCKQUOTE') {
        lines.push(`> ${t}`);
      } else {
        lines.push(t);
      }
    });
    const text = lines
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (text.length >= 50) return truncate(text, 60000);
  }

  let text = clone.textContent || '';
  text = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{3,}/g, '  ')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
  return truncate(text, 60000);
}
