const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const { PageExtractor } = require("../src/popup/services/page-extractor.js");

describe("PageExtractor", () => {
  let extractor;

  beforeEach(() => {
    extractor = new PageExtractor();
  });

  describe("detectPageTypeFromUrl", () => {
    it("identifies Twitter/X URLs", () => {
      assert.equal(extractor.detectPageTypeFromUrl("https://twitter.com/user/status/123"), "🐦 Twitter/X");
      assert.equal(extractor.detectPageTypeFromUrl("https://x.com/user/status/123"), "🐦 Twitter/X");
    });

    it("identifies YouTube URLs", () => {
      assert.equal(extractor.detectPageTypeFromUrl("https://www.youtube.com/watch?v=abcd"), "📺 YouTube");
      assert.equal(extractor.detectPageTypeFromUrl("https://youtube.com/live/1234"), "📺 YouTube");
    });

    it("defaults to Webpage for generic URLs or empty string", () => {
      assert.equal(extractor.detectPageTypeFromUrl("https://example.com/article"), "🌐 Webpage");
      assert.equal(extractor.detectPageTypeFromUrl(""), "🌐 Webpage");
      assert.equal(extractor.detectPageTypeFromUrl(null), "🌐 Webpage");
    });
  });

  describe("provenanceFromExtraction", () => {
    it("extracts provenance from metadata", () => {
      const content = {
        title: "Test Title",
        metadata: {
          author: "Alice",
          published: "2026-09-01",
        },
      };
      const prov = extractor.provenanceFromExtraction(content);
      assert.deepEqual(prov, {
        title: "Test Title",
        author: "Alice",
        publishedAt: "2026-09-01",
      });
    });

    it("falls back to channel or handle in metadata", () => {
      const content1 = { title: "Video", metadata: { channel: "TechChannel" } };
      assert.equal(extractor.provenanceFromExtraction(content1).author, "TechChannel");

      const content2 = { title: "Post", metadata: { handle: "@alice" } };
      assert.equal(extractor.provenanceFromExtraction(content2).author, "@alice");
    });

    it("returns null for empty content", () => {
      assert.equal(extractor.provenanceFromExtraction(null), null);
      assert.equal(extractor.provenanceFromExtraction(undefined), null);
    });
  });

  describe("formatPublishedDate", () => {
    it("formats valid ISO dates", () => {
      const formatted = extractor.formatPublishedDate("2026-09-25T12:00:00Z");
      assert.ok(formatted.includes("2026"));
    });

    it("returns raw string for invalid date formats", () => {
      assert.equal(extractor.formatPublishedDate("not-a-date"), "not-a-date");
    });
  });

  describe("toSeconds", () => {
    it("converts MM:SS to seconds", () => {
      assert.equal(extractor.toSeconds("01:23"), 83);
    });

    it("converts HH:MM:SS to seconds", () => {
      assert.equal(extractor.toSeconds("01:02:03"), 3723);
    });

    it("handles bracketed timestamps", () => {
      assert.equal(extractor.toSeconds("[12:34]"), 754);
    });

    it("passes through number", () => {
      assert.equal(extractor.toSeconds(120), 120);
    });
  });

  describe("withTimeout", () => {
    it("resolves the inner promise if faster than timeout", async () => {
      const result = await extractor.withTimeout(Promise.resolve("ok"), 500, "fallback");
      assert.equal(result, "ok");
    });

    it("returns fallback if inner promise times out", async () => {
      const slow = new Promise((r) => setTimeout(() => r("slow"), 100));
      const result = await extractor.withTimeout(slow, 10, "fallback");
      assert.equal(result, "fallback");
    });
  });

  describe("waitForTabComplete", () => {
    it("resolves true immediately when tab.status is complete", async () => {
      globalThis.chrome = {
        tabs: {
          get: async () => ({ status: "complete" }),
        },
      };
      const complete = await extractor.waitForTabComplete(1, 500);
      assert.equal(complete, true);
    });

    it("waits for chrome.tabs.onUpdated when status is loading", async () => {
      let listenerRef;
      globalThis.chrome = {
        tabs: {
          get: async () => ({ status: "loading" }),
          onUpdated: {
            addListener: (fn) => { listenerRef = fn; },
            removeListener: () => { listenerRef = null; },
          },
        },
      };

      const promise = extractor.waitForTabComplete(1, 1000);
      setTimeout(() => {
        if (listenerRef) listenerRef(1, { status: "complete" });
      }, 20);

      const complete = await promise;
      assert.equal(complete, true);
    });
  });

  describe("seekToChapter & scrollToSection", () => {
    it("sends seek message and injects if needed", async () => {
      let injected = false;
      let sentMessage = null;
      globalThis.chrome = {
        tabs: {
          sendMessage: async (tabId, msg) => {
            if (!injected) throw new Error("not injected");
            sentMessage = msg;
            return { ok: true };
          },
        },
        scripting: {
          executeScript: async () => {
            injected = true;
            return [];
          },
        },
      };

      const ok = await extractor.seekToChapter(42, "01:30");
      assert.equal(ok, true);
      assert.equal(injected, true);
      assert.deepEqual(sentMessage, { action: "nutegg-seek", seconds: 90 });
    });

    it("sends scroll-to message", async () => {
      let sentMessage = null;
      globalThis.chrome = {
        tabs: {
          sendMessage: async (tabId, msg) => {
            sentMessage = msg;
            return { ok: true };
          },
        },
      };

      const ok = await extractor.scrollToSection(42, "Overview", "Quote here");
      assert.equal(ok, true);
      assert.deepEqual(sentMessage, {
        action: "nutegg-scroll-to",
        heading: "Overview",
        quote: "Quote here",
      });
    });
  });

  describe("tryExtract timeout budgets", () => {
    it("uses the longer budget only for Bilibili and Douyin, including reinjection", async () => {
      for (const [url, expected] of [
        ["https://example.com/article", 8000],
        ["https://www.youtube.com/watch?v=123", 8000],
        ["https://www.bilibili.com/list/watchlater/?bvid=BV123", 20000],
        ["https://www.douyin.com/video/123", 20000],
        ["https://douyin.com.evil.test/video/123", 8000],
      ]) {
        const timeouts = [];
        let attempt = 0;
        globalThis.chrome = { tabs: {
          get: async () => ({ url }),
          sendMessage: async () => ++attempt === 1 ? null : { success: true },
        } };
        const instance = new PageExtractor();
        instance.withTimeout = (promise, ms) => { timeouts.push(ms); return promise; };
        instance.injectContentScript = async () => true;
        assert.equal((await instance.tryExtract(1)).success, true);
        assert.deepEqual(timeouts, [expected, expected]);
      }
    });
  });

  describe("extractPage", () => {
    it("extracts page content successfully", async () => {
      globalThis.chrome = {
        tabs: {
          sendMessage: async (tabId, msg) => {
            if (msg.action === "extract-content") {
              return { success: true, content: { title: "Extracted Page", content: "Body text" } };
            }
            if (msg.action === "page-identity") {
              return { success: true, url: "https://example.com" };
            }
            return null;
          },
        },
      };

      const content = await extractor.extractPage(1);
      assert.equal(content.title, "Extracted Page");
      assert.equal(content.content, "Body text");
    });

    it("respects isCancelled flag", async () => {
      globalThis.chrome = {
        tabs: {
          sendMessage: async () => ({ success: true, content: {} }),
        },
      };

      const content = await extractor.extractPage(1, { isCancelled: () => true });
      assert.equal(content, null);
    });
  });
});

