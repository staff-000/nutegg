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
      const injected = await this.withTimeout(
        chrome.scripting.executeScript({
          target: { tabId },
          files: this.contentScriptFiles,
        }),
        timeoutMs,
        null
      );
      return injected !== null;
    } catch {
      return false; // Restricted page (chrome://, Web Store, PDF viewer, etc.)
    }
  }

  /**
   * Extract page content via content script, injecting it first when needed.
   * Returns response object or null if unreachable / restricted.
   */
  async tryExtract(tabId, discussionSessionId, options = {}) {
    let extractionTimeout = 8000;
    try {
      const tab = await chrome.tabs.get(tabId);
      const host = new URL(tab.url).hostname;
      // Video extraction can require several API/subtitle requests.
      // Keep the ordinary-page failure budget at 8s rather than slowing all sites.
      if (["youtube.com", "bilibili.com", "douyin.com"].some(domain => host === domain || host.endsWith(`.${domain}`))) {
        extractionTimeout = 20000;
      }
    } catch {}
    extractionTimeout = Math.max(1, Math.min(extractionTimeout, (options.deadline || Infinity) - Date.now()));
    // Reserve a small transport margin so the content script can return its
    // partial capture on deadline expiry before the outer message times out.
    const message = { action: 'extract-content', discussionSessionId, requestId: options.requestId,
      deadline: options.deadline ? Math.max(Date.now() + 1, Math.min(options.deadline, Date.now() + extractionTimeout) - 100) : undefined,
      expectedUrl: options.expectedUrl };
    const timeout = { success: false, errorCode: 'timeout' };
    try {
      const response = await this.withTimeout(
        chrome.tabs.sendMessage(tabId, message),
        extractionTimeout,
        timeout
      );
      // A slow or failed extractor is not a missing content script. Reinjection
      // here could start a second capture while the original still runs.
      return response;
    } catch {
      // Content script not yet injected
    }

    if (Date.now() >= (options.deadline || Infinity)) return timeout;
    const injected = await this.injectContentScript(tabId, Math.max(1, Math.min(4000, (options.deadline || Infinity) - Date.now())));
    if (!injected) return null;

    try {
      return await this.withTimeout(
        chrome.tabs.sendMessage(tabId, message),
        Math.max(1, Math.min(extractionTimeout, (options.deadline || Infinity) - Date.now())),
        timeout
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
      return resp?.success ? resp : null;
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
        identity.bilibiliReady !== false &&
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
  async extractPage(tabId, { waitForSettle = false, isCancelled = () => false, onSettle = null, discussionSessionId,
    retryCount = 3, retryDelayMs = 1000, onProgress, expectedUrl, timeoutMs = 20000 } = {}) {
    retryCount = Number.isFinite(retryCount) ? Math.max(0, Math.min(10, Math.floor(retryCount))) : 3;
    retryDelayMs = Number.isFinite(retryDelayMs) ? Math.max(100, Math.min(10000, retryDelayMs)) : 1000;
    const deadline = Date.now() + timeoutMs;
    const requestPrefix = discussionSessionId || `capture:${Date.now()}:${Math.random()}`;
    const samePage = url => !expectedUrl || !url || url.split('#')[0] === expectedUrl.split('#')[0];
    if (waitForSettle) {
      const identity = await this.waitForPageSettle(tabId, isCancelled);
      if (isCancelled()) return null;
      if (typeof onSettle === "function") {
        onSettle(identity);
      }
    }

    let best = null;
    for (let attempt = 0; attempt <= retryCount && Date.now() < deadline; attempt++) {
      if (isCancelled()) return null;
      const requestId = `${requestPrefix}:${attempt}`;
      const response = await this.withCancellation(this.tryExtract(tabId, discussionSessionId, { deadline, requestId, expectedUrl }), isCancelled,
        () => this.cancelExtraction(tabId, requestId));
      if (isCancelled()) return null;
      if (response?.errorCode === 'stale') return null;
      if (response?.errorCode === 'timeout') {
        await this.cancelExtraction(tabId, requestId);
        break;
      }
      const after = await this.withTimeout(this.requestPageIdentity(tabId), Math.max(1, deadline - Date.now()));
      if (isCancelled()) return null;
      if (!samePage(after?.url) || !samePage(response?.content?.url)) return null;
      if (after?.url && response?.content?.url && after.url.split('#')[0] !== response.content.url.split('#')[0]) return null;
      const capturedVideoId = response?.content?.metadata?.requested_video_id || response?.content?.metadata?.video_id;
      if (after?.videoId && capturedVideoId && after.videoId !== capturedVideoId) return null;
      if (after?.cid && response?.content?.metadata?.cid && String(after.cid) !== String(response.content.metadata.cid)) return null;
      expectedUrl ||= after?.url || response?.content?.url;
      if (response?.success && response.content) {
        const content = response.content;
        best = content;
        const retryable = content.extractionStatus === 'not_ready' || content.extractionStatus === 'transient'
          || (content.transcriptAvailable === false && content.extractionStatus !== 'unavailable');
        if (!retryable) return content;
      }
      if (attempt === retryCount || Date.now() >= deadline) break;
      onProgress?.({ attempt: attempt + 1, retryCount, captions: best?.transcriptAvailable === false });
      if (!await this.waitForRetry(tabId, { deadline, retryDelayMs, isCancelled, samePage, initial: after })) return !isCancelled() && Date.now() >= deadline ? best : null;
    }
    return best;
  }

  async cancelExtraction(tabId, requestId) {
    try { await this.withTimeout(chrome.tabs.sendMessage(tabId, { action: 'cancel-extraction', requestId }), 500); } catch {}
  }

  withCancellation(promise, isCancelled, cancel) {
    let timer;
    const stopped = new Promise(resolve => {
      timer = setInterval(() => {
        if (isCancelled()) { void cancel(); resolve(null); }
      }, 100);
    });
    return Promise.race([promise, stopped]).finally(() => clearInterval(timer));
  }

  async waitForRetry(tabId, { deadline, retryDelayMs, isCancelled, samePage, initial }) {
    let completeAt = initial?.readyState === 'complete' ? Date.now() : null;
    const started = Date.now();
    while (Date.now() < deadline) {
      if (isCancelled()) return false;
      await new Promise(resolve => setTimeout(resolve, Math.min(200, Math.max(1, deadline - Date.now()))));
      if (isCancelled()) return false;
      const identity = await this.withTimeout(this.requestPageIdentity(tabId), Math.max(1, Math.min(2500, deadline - Date.now())));
      if (isCancelled() || !samePage(identity?.url)) return false;
      if (identity?.captionTracksReady && !initial?.captionTracksReady) return true;
      if (identity?.readyState === 'complete') completeAt ??= Date.now();
      if (completeAt !== null && Date.now() - completeAt >= retryDelayMs) return true;
      // Pages without a readable identity still get a bounded fallback retry.
      if (!identity && Date.now() - started >= retryDelayMs) return true;
    }
    return false;
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

  /**
   * Get current playback timestamp or scroll position from the tab.
   */
  async getPagePosition(tabId, targets = null) {
    if (tabId == null) return null;
    const message = { action: "nutegg-page-position", ...(targets ? { targets } : {}) };
    let response = null;
    try {
      response = await this.withTimeout(chrome.tabs.sendMessage(tabId, message), 1000);
    } catch {}
    if (response?.success) return response;
    const injected = await this.injectContentScript(tabId);
    if (!injected) return null;
    try {
      response = await this.withTimeout(chrome.tabs.sendMessage(tabId, message), 1000);
      return response?.success ? response : null;
    } catch {
      return null;
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
