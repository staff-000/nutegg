// ============================================================
// NutEgg Popup Services — Page Extractor & Tab Driver
// ============================================================

const CONTENT_SCRIPT_FILES = [
  "src/content/utils.js",
  "src/content/extractors/youtube.js",
  "src/content/extractors/twitter.js",
  "src/content/extractors/article.js",
  "src/content/extractors/generic.js",
  "src/content/content-script.js",
];

/**
 * Handles communication with the active or target tab's content script,
 * including dynamic injection, page settling checks, content extraction,
 * video timestamp seeking, and document scrolling.
 */
class PageExtractor {
  constructor(options = {}) {
    this.contentScriptFiles = options.contentScriptFiles || CONTENT_SCRIPT_FILES;
  }

  /** Safe promise timeout wrapper. */
  withTimeout(promise, ms, fallback = null) {
    return Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
  }

  /**
   * Inject content script files into the given tab if not already loaded.
   */
  async injectContentScript(tabId, timeoutMs = 4000) {
    try {
      await this.withTimeout(
        chrome.scripting.executeScript({
          target: { tabId },
          files: this.contentScriptFiles,
        }),
        timeoutMs,
        null
      );
      return true;
    } catch {
      return false; // Restricted page (chrome://, Web Store, PDF viewer, etc.)
    }
  }

  /**
   * Extract page content via content script, injecting it first when needed.
   * Returns response object or null if unreachable / restricted.
   */
  async tryExtract(tabId) {
    try {
      const response = await this.withTimeout(
        chrome.tabs.sendMessage(tabId, { action: "extract-content" }),
        8000,
        null
      );
      if (response?.success) return response;
    } catch {
      // Content script not yet injected
    }

    const injected = await this.injectContentScript(tabId, 4000);
    if (!injected) return null;

    try {
      return await this.withTimeout(
        chrome.tabs.sendMessage(tabId, { action: "extract-content" }),
        8000,
        null
      );
    } catch {
      return null;
    }
  }

  /**
   * Cheap page-state check (no transcript fetching). Null when unreachable.
   */
  async requestPageIdentity(tabId) {
    try {
      const resp = await this.withTimeout(
        chrome.tabs.sendMessage(tabId, { action: "page-identity" }),
        2500,
        null
      );
      if (resp?.success) return resp;
    } catch {}

    const injected = await this.injectContentScript(tabId, 3000);
    if (!injected) return null;

    try {
      const resp = await this.withTimeout(
        chrome.tabs.sendMessage(tabId, { action: "page-identity" }),
        2500,
        null
      );
      return resp?.success ? resp : null;
    } catch {
      return null;
    }
  }

  /**
   * Wait for a tab to finish loading (status === "complete").
   * Works for active and background tabs via chrome.tabs.onUpdated.
   */
  async waitForTabComplete(tabId, timeoutMs = 8000) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.status === "complete") return true;
    } catch {
      return false;
    }

    return new Promise((resolve) => {
      let timer;
      const listener = (updatedTabId, changeInfo) => {
        if (updatedTabId === tabId && changeInfo.status === "complete") {
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve(true);
        }
      };
      timer = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve(false);
      }, timeoutMs);
      chrome.tabs.onUpdated.addListener(listener);
    });
  }

  /**
   * Poll page-identity until the page settles (document complete, and for
   * YouTube the watch shell is rendered). Bounded to ~4s.
   */
  async waitForPageSettle(tabId, isCancelled = () => false, timeoutMs = 4000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (isCancelled()) return null;
      const identity = await this.requestPageIdentity(tabId);
      if (
        identity &&
        identity.readyState === "complete" &&
        identity.youtubeReady !== false &&
        identity.twitterReady !== false
      ) {
        return identity;
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    return null;
  }

  /**
   * High-level extraction driver: handles settling, extraction retries,
   * and post-extraction navigation verification.
   */
  async extractPage(tabId, { waitForSettle = false, isCancelled = () => false, onSettle = null } = {}) {
    if (waitForSettle) {
      const identity = await this.waitForPageSettle(tabId, isCancelled);
      if (isCancelled()) return null;
      if (typeof onSettle === "function") {
        onSettle(identity);
      }
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await this.tryExtract(tabId);
      if (isCancelled()) return null;

      if (!response?.success) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 400));
          if (isCancelled()) return null;
          continue;
        }
        return null;
      }

      const after = await this.requestPageIdentity(tabId);
      if (isCancelled()) return null;

      if (
        after?.url &&
        response.content?.url &&
        after.url !== response.content.url
      ) {
        console.warn("[NutEgg] Page navigated during extraction — retrying");
        continue;
      }

      return response.content;
    }
    return null;
  }

  /**
   * Detect human-readable page type from URL string.
   */
  detectPageTypeFromUrl(url = "") {
    if (!url) return "🌐 Webpage";
    if (url.includes("twitter.com") || url.includes("x.com")) return "🐦 Twitter/X";
    if (url.includes("youtube.com/watch") || url.includes("youtube.com")) return "📺 YouTube";
    return "🌐 Webpage";
  }

  /**
   * Extract provenance metadata from extracted page content.
   */
  provenanceFromExtraction(content) {
    if (!content) return null;
    const m = content.metadata || {};
    return {
      title: content.title || "",
      author: m.author || m.channel || m.handle || "",
      publishedAt: m.published || "",
    };
  }

  /**
   * ISO/date string → short locale date (e.g. "Aug 10, 2026"); raw on failure.
   */
  formatPublishedDate(raw) {
    const d = new Date(raw);
    return isNaN(d.getTime())
      ? raw
      : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  /**
   * Converts "MM:SS" or "HH:MM:SS" string or number to seconds.
   */
  toSeconds(time) {
    if (typeof time === "number") return time;
    if (!time || typeof time !== "string") return 0;
    const clean = time.replace(/[\[\]]/g, "").trim();
    const parts = clean.split(":").map(Number);
    if (parts.some(isNaN)) return 0;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }

  /**
   * Seek the tab's video player to a timestamp in seconds.
   */
  async seekToChapter(tabId, seconds) {
    if (tabId == null) return false;
    const secs = typeof seconds === "number" ? seconds : this.toSeconds(seconds);
    try {
      await chrome.tabs.sendMessage(tabId, { action: "nutegg-seek", seconds: secs });
      return true;
    } catch {
      const injected = await this.injectContentScript(tabId);
      if (!injected) return false;
      try {
        await chrome.tabs.sendMessage(tabId, { action: "nutegg-seek", seconds: secs });
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Scroll the tab to a section heading or quote text.
   */
  async scrollToSection(tabId, heading, quote) {
    if (tabId == null) return false;
    try {
      await chrome.tabs.sendMessage(tabId, { action: "nutegg-scroll-to", heading, quote });
      return true;
    } catch {
      const injected = await this.injectContentScript(tabId);
      if (!injected) return false;
      try {
        await chrome.tabs.sendMessage(tabId, { action: "nutegg-scroll-to", heading, quote });
        return true;
      } catch {
        return false;
      }
    }
  }
}

const _servicesScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_servicesScope.NutEggServices = _servicesScope.NutEggServices || {};
_servicesScope.NutEggServices.PageExtractor = PageExtractor;
_servicesScope.PageExtractor = PageExtractor;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    PageExtractor,
    CONTENT_SCRIPT_FILES,
  };
}

