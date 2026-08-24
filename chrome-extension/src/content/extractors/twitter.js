// ============================================================
// NutEgg Extractor: Twitter / X
// ============================================================
//
// Detects twitter.com and x.com pages and extracts tweet text,
// author info, thread context, links, and stats.
//
// Depends on: utils.js (estimateTime)

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
