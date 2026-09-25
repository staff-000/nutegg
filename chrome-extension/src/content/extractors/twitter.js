// ============================================================
// NutEgg Extractor: Twitter / X (Posts & Long-form Articles)
// ============================================================
//
// Detects twitter.com and x.com pages and extracts:
// 1. Long-form X Articles (via [data-testid="twitterArticleReadView"],
//    rich text views, headers, blockquotes, code blocks, lists)
// 2. Tweets with embedded article cards (automatically opens or extracts card)
// 3. Long-form posts with "Show more" button (automatically expands)
// 4. Standard tweets, threads, and quote tweets
//
// Depends on: utils.js (extractText, estimateTime, waitFor)

function detectTwitter() {
  const url = window.location.href;
  return url.includes("twitter.com") || url.includes("x.com");
}

async function extractTwitter() {
  const url = window.location.href;

  // 1. Wait briefly for X SPA to hydrate DOM if just loaded
  const hasTwitterContent = () => document.querySelector(
    '[data-testid="twitterArticleReadView"], [data-testid="twitterArticleRichTextView"], article[data-testid="tweet"], [data-testid="tweetText"], [data-testid="card.layoutLarge.detail"], a[href*="/article/"], [data-testid="primaryColumn"]'
  );
  if (!hasTwitterContent() && typeof waitFor === "function") {
    await waitFor(hasTwitterContent, 2500);
  }

  // 2. Check for X Article Reader View first (standalone or inside article route)
  const articleRoot = document.querySelector(
    '[data-testid="twitterArticleReadView"], [data-testid="twitterArticleRichTextView"], [data-testid="longformRichTextComponent"]'
  ) || (url.includes("/article/") ? document.querySelector("main") : null);

  if (articleRoot) {
    return extractXArticle(articleRoot, url);
  }

  // 3. If on a status page and an Article card/link exists, try clicking it to open article view
  const articleCardLink = document.querySelector(
    'a[href*="/article/"], [data-testid="card.layoutLarge.detail"] a, [data-testid="article-cover"], [data-testid="card.wrapper"] a[href*="/article/"]'
  );
  if (articleCardLink) {
    try {
      articleCardLink.click();
      if (typeof waitFor === "function") {
        const openedRoot = await waitFor(
          () => document.querySelector('[data-testid="twitterArticleReadView"], [data-testid="twitterArticleRichTextView"]'),
          1500
        );
        if (openedRoot) {
          return extractXArticle(openedRoot, window.location.href);
        }
      }
    } catch {
      // Ignore click error and continue with tweet extraction
    }
  }

  // 4. Expand all "Show more" buttons on truncated long-form posts
  const showMoreButtons = document.querySelectorAll('[data-testid="tweet-text-show-more-link"]');
  for (const btn of showMoreButtons) {
    try {
      btn.click();
    } catch {}
  }
  if (showMoreButtons.length > 0) {
    await new Promise((r) => setTimeout(r, 150));
  }

  // 5. Author info
  const { authorName, authorHandle } = extractAuthorInfo();
  const timestamp = document.querySelector("time")?.getAttribute("datetime") || "";

  // 6. Main tweet
  const mainTweet = document.querySelector('article[data-testid="tweet"]');
  let tweetContent = mainTweet ? extractMainTweet(mainTweet) : "";

  // Fallback: collect all visible tweet texts if main tweet didn't yield text
  if (!tweetContent) {
    const tweetTexts = document.querySelectorAll('[data-testid="tweetText"]');
    tweetContent = [...tweetTexts]
      .map((el) => el.textContent?.trim()).filter(Boolean)
      .join("\n\n---\n\n");
  }

  // Fallback: check primary column / main text
  if (!tweetContent) {
    const primaryCol = document.querySelector('[data-testid="primaryColumn"]');
    if (primaryCol && typeof extractText === "function") {
      tweetContent = extractText(primaryCol);
    }
  }

  // If there was an article card that couldn't be opened, extract its details into the content
  if (articleCardLink) {
    const cardContainer = (typeof articleCardLink.closest === "function" &&
      articleCardLink.closest('[data-testid="card.layoutLarge.detail"], [data-testid="card.wrapper"]')) || articleCardLink;
    const headingEl = cardContainer.querySelector(
      '[role="heading"], h2, h3, [data-testid*="title"], div[dir="auto"], span[dir="auto"]'
    ) || cardContainer.querySelector("div, span");
    const cardTitle = headingEl?.textContent?.trim() || "";
    const snippets = Array.from(cardContainer.querySelectorAll('div, span, p'))
      .map((el) => el.textContent?.trim())
      .filter((t) => t && t !== cardTitle && !t.includes("http") && t.length < 200);
    const cardSnippet = snippets[0] || "";
    const cardHref = articleCardLink.getAttribute("href") || "";
    const cardInfo = [
      cardTitle ? `\n\n### 📰 Article: ${cardTitle}` : "",
      cardSnippet ? `\n${cardSnippet}` : "",
      cardHref ? `\n🔗 ${cardHref.startsWith("http") ? cardHref : `https://x.com${cardHref}`}` : "",
    ].filter(Boolean).join("");
    if (cardInfo && !tweetContent.includes(cardTitle)) {
      tweetContent = (tweetContent ? `${tweetContent}\n\n---\n` : "") + cardInfo;
    }
  }

  // Fallback: use page title (twitter puts tweet text in title)
  if (!tweetContent) {
    tweetContent = document.title
      .replace(/^(.+?)\s*\/\s*X\s*$/, "$1")
      .replace(/^(.+?)\s*\/\s*Twitter\s*$/, "$1");
  }

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

  const title = authorName ? `Tweet by ${authorName}${authorHandle ? ` (${authorHandle})` : ""}` : `Tweet from ${url}`;
  return {
    url,
    title,
    content: `# ${title}\n\n${tweetContent || "Could not extract tweet content."}`,
    sourceType: "twitter",
    metadata: {
      platform: "Twitter/X",
      ...(authorName && { author: authorName }),
      ...(authorHandle && { handle: authorHandle }),
      ...(timestamp && { published: timestamp }),
      time_estimate_minutes: typeof estimateTime === "function" ? estimateTime(tweetContent, "twitter") : 2,
    },
  };
}

function extractXArticle(root, url) {
  // Title extraction
  const titleEl = document.querySelector(
    '[data-testid="twitter-article-title"], h1.longform-header-one, h1.longform-header-one-narrow, h1[role="heading"]'
  ) || root.querySelector("h1, h2");

  let title = titleEl?.textContent?.trim() || "";
  if (!title) {
    // Fallback: extract title from document.title: "Title / X" or "Author on X: Title / X"
    title = document.title
      .replace(/\s*\/\s*(?:X|Twitter)$/i, "")
      .replace(/^.*?\son\s+(?:X|Twitter):\s*["“]?/i, "")
      .replace(/["”]?$/, "")
      .trim();
  }
  if (!title) title = `X Article from ${url}`;

  // Author extraction
  const { authorName, authorHandle } = extractAuthorInfo();

  // Published time
  const timeEl = root.querySelector("time") || document.querySelector("time");
  const timestamp = timeEl?.getAttribute("datetime") || timeEl?.textContent?.trim() || "";

  // Body extraction
  const articleBody = extractXArticleBody(root, title);

  // Images
  const images = Array.from(root.querySelectorAll('img[src*="pbs.twimg.com/media"], [data-testid="tweetPhoto"] img'))
    .map((img) => img.src)
    .filter((src, idx, arr) => src && arr.indexOf(src) === idx);

  const parts = [`# ${title}`];
  const metaParts = [];
  if (authorName || authorHandle) {
    metaParts.push(`**Author:** ${authorName} ${authorHandle ? `(${authorHandle})` : ""}`.trim());
  }
  if (timestamp) {
    metaParts.push(`**Published:** ${timestamp}`);
  }
  metaParts.push(`**Platform:** Twitter/X Article`);
  if (metaParts.length > 0) {
    parts.push(metaParts.join(" | "));
  }

  if (articleBody) {
    parts.push(`\n${articleBody}`);
  } else {
    parts.push(`\nCould not extract article body.`);
  }

  if (images.length > 0) {
    parts.push(`\n📷 ${images.length} image(s) in article`);
  }

  const fullContent = parts.join("\n");

  return {
    url,
    title,
    content: fullContent,
    sourceType: "twitter",
    metadata: {
      platform: "Twitter/X",
      isArticle: true,
      ...(authorName && { author: authorName }),
      ...(authorHandle && { handle: authorHandle }),
      ...(timestamp && { published: timestamp }),
      time_estimate_minutes: typeof estimateTime === "function" ? estimateTime(fullContent, "article") : 5,
    },
  };
}

function extractXArticleBody(root, articleTitle) {
  const richContainer = root.querySelector(
    '[data-testid="twitterArticleRichTextView"], [data-testid="longformRichTextComponent"], .public-DraftEditor-content'
  ) || root;

  const blockSelector = [
    ".longform-header-one",
    ".longform-header-one-narrow",
    ".longform-header-two",
    ".longform-header-two-narrow",
    ".longform-unstyled",
    ".longform-unstyled-narrow",
    ".longform-blockquote",
    ".longform-blockquote-narrow",
    ".longform-unordered-list-item",
    ".longform-unordered-list-item-narrow",
    ".longform-ordered-list-item",
    ".longform-ordered-list-item-narrow",
    'section[data-block="true"]',
    '[data-testid="markdown-code-block"]',
    "h1", "h2", "h3", "h4", "p", "blockquote", "li", "pre"
  ].join(", ");

  const rawElements = Array.from(richContainer.querySelectorAll(blockSelector));

  // Filter out elements that are descendants of another matched element to avoid duplicate nested text
  const elements = rawElements.filter((el) => {
    if (!el || !el.textContent?.trim()) return false;
    // Don't include the main title element
    if (articleTitle && el.textContent.trim().toLowerCase() === articleTitle.trim().toLowerCase()) {
      return false;
    }
    // Exclude avatars, nav, headers, action buttons
    if (el.closest('[data-testid="User-Name"], [data-testid="UserAvatar-Container"], nav, header, [role="button"], [role="group"]')) {
      return false;
    }
    // Skip if another matched element contains this one
    return !rawElements.some((other) => other !== el && other.contains(el));
  });

  const lines = [];
  const seenTexts = new Set();

  for (const el of elements) {
    const text = el.textContent?.trim();
    if (!text || seenTexts.has(text)) continue;
    seenTexts.add(text);

    if (el.matches('.longform-header-one, .longform-header-one-narrow, h1, h2')) {
      lines.push(`\n## ${text}\n`);
    } else if (el.matches('.longform-header-two, .longform-header-two-narrow, h3, h4')) {
      lines.push(`\n### ${text}\n`);
    } else if (el.matches('.longform-blockquote, .longform-blockquote-narrow, blockquote')) {
      const quoted = text.split("\n").map((l) => `> ${l}`).join("\n");
      lines.push(`\n${quoted}\n`);
    } else if (
      el.matches('.longform-unordered-list-item, .longform-unordered-list-item-narrow') ||
      (el.tagName === 'LI' && el.parentElement?.tagName === 'UL')
    ) {
      lines.push(`- ${text}`);
    } else if (
      el.matches('.longform-ordered-list-item, .longform-ordered-list-item-narrow') ||
      (el.tagName === 'LI' && el.parentElement?.tagName === 'OL')
    ) {
      lines.push(`1. ${text}`);
    } else if (el.matches('[data-testid="markdown-code-block"], pre')) {
      lines.push(`\n\`\`\`\n${text}\n\`\`\`\n`);
    } else {
      lines.push(`\n${text}\n`);
    }
  }

  let content = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (content) {
    return content;
  }

  // Fallback: extractText on container
  try {
    if (typeof extractText === "function" && typeof richContainer.cloneNode === "function") {
      return extractText(richContainer);
    }
  } catch {}
  return (richContainer.textContent || "").trim();
}

function extractAuthorInfo() {
  let authorName = "";
  let authorHandle = "";

  const userNameEl = document.querySelector('[data-testid="User-Name"]');
  if (userNameEl) {
    const textTokens = (userNameEl.textContent || "")
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    authorHandle = textTokens.find((t) => t.startsWith("@")) || "";
    authorName = textTokens.find((t) => t !== authorHandle && !t.startsWith("@")) || "";
    if (!authorHandle) {
      const handleLink = userNameEl.querySelector('a[href^="/"]');
      if (handleLink) {
        const href = handleLink.getAttribute("href") || "";
        const m = href.match(/^\/([A-Za-z0-9_]{1,15})/);
        if (m) authorHandle = `@${m[1]}`;
      }
    }
  }

  // Fallback: extract handle from URL: x.com/<handle>/status/... or /article/...
  if (!authorHandle) {
    const urlMatch = window.location.pathname.match(/^\/([A-Za-z0-9_]{1,15})(?:\/status|\/article|$)/);
    if (urlMatch && !["home", "explore", "notifications", "messages", "i", "search"].includes(urlMatch[1].toLowerCase())) {
      authorHandle = `@${urlMatch[1]}`;
      if (!authorName) authorName = urlMatch[1];
    }
  }

  return { authorName, authorHandle };
}

function extractMainTweet(tweetElement) {
  const parts = [];
  const author = tweetElement.querySelector('[data-testid="User-Name"]')?.textContent?.trim();
  if (author) parts.push(`**Author:** ${author}`);

  const text = tweetElement.querySelector('[data-testid="tweetText"]')?.textContent?.trim();
  if (text) parts.push(`\n${text}`);

  // Quoted tweet handling
  const quoteTweet = tweetElement.querySelector('div[role="link"] [data-testid="tweetText"]');
  if (quoteTweet && quoteTweet.textContent?.trim() !== text) {
    const quoteAuthor = quoteTweet.closest('div[role="link"]')?.querySelector('[data-testid="User-Name"]')?.textContent?.trim();
    parts.push(`\n> **Quoted Tweet${quoteAuthor ? ` (${quoteAuthor})` : ""}:**\n> ${quoteTweet.textContent.trim().replace(/\n/g, "\n> ")}`);
  }

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
