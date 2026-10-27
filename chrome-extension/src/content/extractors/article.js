// ============================================================
// NutEgg Extractor: Article (WeChat, Medium, Substack, blogs, news)
// ============================================================
//
// Detects article-like pages via og:type, <article> tags, and
// schema.org markup. Includes WeChat- and Medium-specific extraction.
//
// Depends on: utils.js (extractText, getMeta, truncate, estimateTime, readingTime)

function isWeChatArticle(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'mp.weixin.qq.com' && /^\/s(?:\/[A-Za-z0-9_-]+)?\/?$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

function detectArticle() {
  const url = window.location.href;

  // Explicit article sites
  if (isWeChatArticle(url)) return true;
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
  if (isWeChatArticle(url)) return extractWeChatArticle(url, context);
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

// WeChat does not consistently expose a semantic article element. Keep its
// body selection scoped so page controls and verification prompts aren't prose.
function findVisibleWeChatElement(selector) {
  return [...document.querySelectorAll(selector)].find(element => {
    for (let current = element; current; current = current.parentElement) {
      if (captureExcluded(current)) return false;
    }
    return true;
  });
}

function extractWeChatArticle(url, context) {
  context?.check();
  const text = selector => findVisibleWeChatElement(selector)?.textContent?.trim() || '';
  const title = text('#activity-name') || text('.rich_media_title') || getMeta('og:title') || document.title;
  const site = text('#js_name') || getMeta('og:site_name') || '';
  const author = text('#js_author_name') || text('#meta_content .rich_media_meta_text') || getMeta('author') || site;
  const published = text('#publish_time') || getMeta('article:published_time') || '';
  const articleEl = findVisibleWeChatElement('#js_content') || findVisibleWeChatElement('.rich_media_content');
  // An absent/hidden body must remain not_ready, rather than capturing the shell.
  const body = captureTextResult(articleEl, context);
  if (!body.text) {
    const gate = text('.weui-msg__text-area, .page_msg');
    if (/环境异常|完成验证|访问过于频繁|内容(?:已被|已|被).{0,6}删除|无法查看|访问受限/.test(gate)) {
      body.status = 'unavailable';
      body.blocked = true;
    }
  }

  const parts = [`# ${title}`];
  if (author) parts.push(`**Author:** ${author}`);
  if (published) parts.push(`**Published:** ${published}`);
  parts.push(`\n## Content\n\n${body.text}`);
  return applyTextCaptureResult(
    {
      url,
      title,
      content: parts.join('\n'),
      sourceType: 'article',
      metadata: {
        platform: 'WeChat',
        ...(author && { author }),
        ...(published && { published }),
        ...(site && { site }),
        reading_time: readingTime(body.text),
        time_estimate_minutes: estimateTime(body.text, 'article'),
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
