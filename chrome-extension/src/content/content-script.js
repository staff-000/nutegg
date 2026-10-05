// ============================================================
// NutEgg Content Script — Extendable Web Content Extractor
// ============================================================
//
// This file is the main entry point. Individual extractors live
// in separate files under extractors/ and are loaded before this
// file via manifest.json (they share the same global scope).
//
// To add a new site extractor:
//   1. Create a new file in src/content/extractors/ (e.g. reddit.js)
//   2. Define a detect function (returns true if the extractor applies)
//   3. Define an extract function (returns {url, title, content, sourceType, metadata?})
//   4. Register both in the EXTRACTORS array below
//   5. Add the file path to manifest.json content_scripts.js (before content-script.js)
//      and to the executeScript calls in popup.js
//
// Extractors are tried in order — first match wins.
// Shared utilities are in utils.js (loaded first).

// ============================================================
// Extractor registry — add new extractors here
// ============================================================

var EXTRACTORS = window.EXTRACTORS || [
  { name: "youtube", detect: detectYouTube, extract: extractYouTube },
  { name: "twitter", detect: detectTwitter, extract: extractTwitter },
  { name: "bilibili", detect: detectBilibili, extract: extractBilibili },
  { name: "douyin", detect: detectDouyin, extract: extractDouyin },
  { name: "weibo", detect: detectWeibo, extract: extractWeibo },
  { name: "zhihu", detect: detectZhihu, extract: extractZhihu },
  { name: "forum", detect: detectForum, extract: extractForum },
  { name: "tiktok", detect: detectTikTok, extract: extractTikTok },
  { name: "article", detect: detectArticle, extract: extractArticle },
  // Generic must be last — it always matches
  { name: "generic", detect: () => true, extract: extractGeneric },
];
window.EXTRACTORS = EXTRACTORS;

// ============================================================
// Main entry point
// ============================================================

async function extractContent() {
  for (const ex of EXTRACTORS) {
    try {
      if (ex.detect()) {
        console.log(`[NutEgg] Using extractor: ${ex.name}`);
        const capture = await ex.extract();
        return window.NutEggDiscussion ? window.NutEggDiscussion.decorate(capture) : capture;
      }
    } catch (e) {
      console.warn(`[NutEgg] Extractor "${ex.name}" failed:`, e);
      // Site-specific failure must not silently capture a login wall or feed.
      if (["bilibili", "douyin", "weibo", "zhihu"].includes(ex.name)) throw e;
    }
  }
  // Ultimate fallback
  console.warn("[NutEgg] All extractors failed, using generic");
  return await extractGeneric();
}

// Listen for messages from popup/background (attached once per window)
if (!window.__nutegg_listener_attached) {
  window.__nutegg_listener_attached = true;
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action?.startsWith('discussion-') && window.NutEggDiscussion) {
      try {
        const collector = window.NutEggDiscussion;
        const discussion = message.action === 'discussion-start' ? collector.start(message.sessionId, message.load)
          : message.action === 'discussion-stop' ? (collector.stop(message.sessionId), null)
          : message.action === 'discussion-step' ? collector.step(message.sessionId) : collector.snapshot();
        sendResponse({ success: true, discussion, url: location.href });
      } catch (error) { sendResponse({ success: false, error: String(error) }); }
      return false;
    }
    if (message.action === "page-identity") {
      // Cheap page-state check (no transcript fetching) — the popup uses it to
      // wait for the page to settle and to detect SPA navigation races.
      const isTwitter = window.location.href.includes("twitter.com") || window.location.href.includes("x.com");
      const twitterReady = !isTwitter || !!document.querySelector(
        'article[data-testid="tweet"], [data-testid="twitterArticleReadView"], [data-testid="twitterArticleRichTextView"], [data-testid="tweetText"], [data-testid="card.layoutLarge.detail"], [data-testid="primaryColumn"] [role="region"], [data-testid="error-detail"]'
      );
      sendResponse({
        success: true,
        url: window.location.href,
        title: document.title,
        readyState: document.readyState,
        twitterReady,
        // YouTube: the watch page shell has rendered (not the loading skeleton)
        youtubeReady: !window.location.href.includes("youtube.com/watch") ||
          !!document.querySelector("ytd-watch-flexy"),
      });
      return false;
    }

    if (message.action === "nutegg-seek") {
      // Seek the page's video to the given timestamp (seconds) — used by the
      // clickable Mind Map and Q&A timestamp pills in the popup.
      const video =
        document.querySelector(".html5-main-video") ||
        document.querySelector("video.video-stream") ||
        document.querySelector("video");
      if (video) {
        const secs = Number(message.seconds);
        if (!isNaN(secs)) {
          video.currentTime = secs;
          video.play?.().catch(() => {});
        }
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: "No video element found" });
      }
      return false;
    }

    if (message.action === "nutegg-scroll-to") {
      Promise.resolve().then(() => window.NutEggSources.jump(message))
        .then(sendResponse).catch(() => sendResponse({ success: false, reason: 'not_found' }));
      return true;
    }

    if (message.action === "extract-content") {
      extractContent()
        .then((content) => sendResponse({ success: true, content }))
        .catch((err) =>
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : "Extraction failed",
          })
        );
      return true; // Keep channel open for async
    }
  });
}

console.log("[NutEgg] Content script loaded on:", window.location.href);
