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
  { name: "article", detect: detectArticle, extract: extractArticle },
  // Generic must be last — it always matches
  { name: "generic", detect: () => true, extract: extractGeneric },
];
window.EXTRACTORS = EXTRACTORS;

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

// Listen for messages from popup/background (attached once per window)
if (!window.__nutegg_listener_attached) {
  window.__nutegg_listener_attached = true;
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
      // clickable Chapter Map and Q&A timestamp pills in the popup.
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
      const heading = (message.heading || "").trim().toLowerCase();
      const quote = (message.quote || "").trim().toLowerCase();
      let matchedEl = null;

      if (heading) {
        const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading']");
        for (const h of headings) {
          const text = (h.textContent || "").trim().toLowerCase();
          if (text === heading || text.includes(heading) || heading.includes(text)) {
            matchedEl = h;
            break;
          }
        }
      }

      if (!matchedEl && quote && quote.length >= 8 && document.body) {
        const sample = quote.slice(0, 40);
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (node.textContent && node.textContent.toLowerCase().includes(sample)) {
            matchedEl = node.parentElement;
            break;
          }
        }
      }

      if (matchedEl) {
        matchedEl.scrollIntoView({ behavior: "smooth", block: "center" });
        const origTransition = matchedEl.style.transition;
        const origBg = matchedEl.style.backgroundColor;
        matchedEl.style.transition = "background-color 0.3s ease";
        matchedEl.style.backgroundColor = "rgba(255, 230, 0, 0.4)";
        setTimeout(() => {
          matchedEl.style.backgroundColor = origBg;
          setTimeout(() => { matchedEl.style.transition = origTransition; }, 300);
        }, 2000);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: "Section not found on page" });
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
}

console.log("[NutEgg] Content script loaded on:", window.location.href);
