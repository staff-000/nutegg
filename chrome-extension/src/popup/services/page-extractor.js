// ============================================================
// NutEgg Popup Services — Page Extractor & Tab Driver
// ============================================================

const CONTENT_SCRIPT_FILES = [
  "src/content/utils.js",
  "src/content/extractors/youtube.js",
  "src/content/extractors/twitter.js",
  "src/content/extractors/chinese.js",
  "src/content/extractors/discussion.js",
  "src/content/extractors/forum.js",
  "src/content/extractors/tiktok.js",
  "src/content/extractors/article.js",
  "src/content/extractors/generic.js",
  "src/content/source-navigation.js",
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

  async collectDiscussion(tabId, { sessionId, load = false, onUpdate, isCancelled = () => false }) {
    let last = null, completed = false;
    try {
      for (let step = 0; step < 10; step++) {
        if (isCancelled()) return null;
        const response = await this.withTimeout(chrome.tabs.sendMessage(tabId, {
          action: step === 0 ? 'discussion-start' : load && step <= 3 ? 'discussion-step' : 'discussion-snapshot', sessionId, load,
        }), 3000);
        if (isCancelled()) return null;
        if (!response?.success || !response.discussion) throw new Error('Discussion capture unavailable');
        if (response.discussion.sessionId !== sessionId) return null;
        last = response.discussion;
        onUpdate?.(last, step < 9 && !['empty', 'unavailable', 'complete'].includes(last.status));
        if (['empty', 'unavailable', 'complete'].includes(last.status) || last.truncated) { completed = true; return last; }
        if (step < 9) await new Promise(resolve => setTimeout(resolve, 1000));
      }
      completed = true; return last;
    } finally {
      // Collection remains available for manual scrolling for two minutes in the page.
      // Cancellation (off/navigation) disconnects immediately without touching a newer session.
      if (!completed) await this.stopDiscussion(tabId, sessionId);
    }
  }
  async stopDiscussion(tabId, sessionId) {
    try { await chrome.tabs.sendMessage(tabId, { action: 'discussion-stop', sessionId }); } catch {}
  }

  /** Safe promise timeout wrapper. */
  withTimeout(promise, ms, fallback = null) {
    let timer;
    const timeoutPromise = new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    });
    // Suppress unhandled rejection if promise rejects after timeout has fired
    if (promise && typeof promise.catch === "function") {
      promise.catch(() => {});
    }
    const guardedPromise = Promise.resolve(promise).finally(() => {
      clearTimeout(timer);
    });
    return Promise.race([guardedPromise, timeoutPromise]);
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
  async tryExtract(tabId, discussionSessionId) {
    let extractionTimeout = 8000;
    try {
      const tab = await chrome.tabs.get(tabId);
      const host = new URL(tab.url).hostname;
      // Chinese video extraction can require several API/subtitle requests.
      // Keep the ordinary-page failure budget at 8s rather than slowing all sites.
      if (["bilibili.com", "douyin.com"].some(domain => host === domain || host.endsWith(`.${domain}`))) {
        extractionTimeout = 20000;
      }
    } catch {}
    try {
      const response = await this.withTimeout(
        chrome.tabs.sendMessage(tabId, { action: "extract-content", discussionSessionId }),
        extractionTimeout,
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
        chrome.tabs.sendMessage(tabId, { action: "extract-content", discussionSessionId }),
        extractionTimeout,
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
  async extractPage(tabId, { waitForSettle = false, isCancelled = () => false, onSettle = null, discussionSessionId } = {}) {
    if (waitForSettle) {
      const identity = await this.waitForPageSettle(tabId, isCancelled);
      if (isCancelled()) return null;
      if (typeof onSettle === "function") {
        onSettle(identity);
      }
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await this.tryExtract(tabId, discussionSessionId);
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
    try {
      const host = new URL(url).hostname;
      for (const [domain, label] of [['bilibili.com', '📺 Bilibili'], ['douyin.com', '📺 Douyin'], ['weibo.com', '📝 Weibo'], ['weibo.cn', '📝 Weibo'], ['zhihu.com', '📝 Zhihu']]) {
        if (host === domain || host.endsWith(`.${domain}`)) return label;
      }
    } catch {}
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
  async scrollToSection(tabId, heading, quote, sourceId, expectedUrl) {
    if (tabId == null) return false;
    const message = { action: "nutegg-scroll-to", heading, quote,
      ...(sourceId ? { sourceId } : {}), ...(expectedUrl ? { expectedUrl } : {}) };
    try {
      const response = await chrome.tabs.sendMessage(tabId, message);
      return response?.success === true || response?.ok === true;
    } catch {
      const injected = await this.injectContentScript(tabId);
      if (!injected) return false;
      try {
        const response = await chrome.tabs.sendMessage(tabId, message);
        return response?.success === true || response?.ok === true;
      } catch { return false; }
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
