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

const EXTRACTORS = [
  { name: "youtube", detect: detectYouTube, extract: extractYouTube },
  { name: "twitter", detect: detectTwitter, extract: extractTwitter },
  { name: "article", detect: detectArticle, extract: extractArticle },
  // Generic must be last — it always matches
  { name: "generic", detect: () => true, extract: extractGeneric },
];

// ============================================================
// Main entry point
// ============================================================

function extractContent() {
  for (const ex of EXTRACTORS) {
    try {
      if (ex.detect()) {
        console.log(`[NutEgg] Using extractor: ${ex.name}`);
        return ex.extract();
      }
    } catch (e) {
      console.warn(`[NutEgg] Extractor "${ex.name}" failed:`, e);
    }
  }
  // Ultimate fallback
  console.warn("[NutEgg] All extractors failed, using generic");
  return extractGeneric();
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "page-identity") {
    // Cheap page-state check (no transcript fetching) — the popup uses it to
    // wait for the page to settle and to detect SPA navigation races.
    sendResponse({
      success: true,
      url: window.location.href,
      title: document.title,
      readyState: document.readyState,
      // YouTube: the watch page shell has rendered (not the loading skeleton)
      youtubeReady: !window.location.href.includes("youtube.com/watch") ||
        !!document.querySelector("ytd-watch-flexy"),
    });
    return false;
  }

  if (message.action === "nutegg-seek") {
    // Seek the page's video to the given timestamp (seconds) — used by the
    // clickable Chapter Map in the popup.
    const video = document.querySelector("video");
    if (video) {
      video.currentTime = message.seconds;
      video.play?.();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "No video element found" });
    }
    return false;
  }

  if (message.action === "extract-content") {
    try {
      const result = extractContent();
      // If the result is a promise (e.g. YouTube with async caption fetch), await it
      if (result instanceof Promise) {
        result
          .then((content) => sendResponse({ success: true, content }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open for async
      }
      sendResponse({ success: true, content: result });
    } catch (err) {
      sendResponse({ success: false, error: err instanceof Error ? err.message : "Extraction failed" });
    }
    return true;
  }
});

console.log("[NutEgg] Content script loaded on:", window.location.href);
