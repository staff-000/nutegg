const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const utilsCode = fs.readFileSync(
  path.resolve(__dirname, "../src/content/utils.js"),
  "utf8"
);
const twitterCode = fs.readFileSync(
  path.resolve(__dirname, "../src/content/extractors/twitter.js"),
  "utf8"
);

function createMockElement(tagName, attrs = {}, text = "", children = []) {
  const el = {
    tagName: tagName.toUpperCase(),
    attributes: { ...attrs },
    textContent: text,
    children: [...children],
    parentElement: null,
    getAttribute(name) {
      return this.attributes[name] || null;
    },
    setAttribute(name, val) {
      this.attributes[name] = val;
    },
    closest(selector) {
      let cur = this;
      while (cur) {
        if (cur.matches && cur.matches(selector)) return cur;
        cur = cur.parentElement;
      }
      return null;
    },
    matches(selector) {
      const parts = selector.split(",").map((s) => s.trim());
      return parts.some((part) => {
        if (part.startsWith(".")) {
          const cls = part.slice(1);
          return (this.attributes.class || "").split(/\s+/).includes(cls);
        }
        if (part.includes('[data-testid="')) {
          const tag = part.split("[")[0];
          const val = part.match(/\[data-testid="([^"]+)"\]/)?.[1];
          const tagMatches = !tag || this.tagName.toLowerCase() === tag.toLowerCase();
          return tagMatches && this.attributes["data-testid"] === val;
        }
        if (part.startsWith('a[href*="')) {
          const val = part.match(/a\[href\*="([^"]+)"\]/)?.[1];
          return this.tagName === "A" && (this.attributes.href || "").includes(val);
        }
        return this.tagName.toLowerCase() === part.toLowerCase();
      });
    },
    querySelector(selector) {
      const all = this.querySelectorAll(selector);
      return all[0] || null;
    },
    querySelectorAll(selector) {
      const results = [];
      const traverse = (node) => {
        for (const child of node.children) {
          if (child.matches && child.matches(selector)) {
            results.push(child);
          }
          traverse(child);
        }
      };
      traverse(this);
      return results;
    },
    contains(other) {
      let cur = other;
      while (cur) {
        if (cur === this) return true;
        cur = cur.parentElement;
      }
      return false;
    },
    click() {
      if (this._onClick) this._onClick();
    },
    cloneNode(deep) {
      return createMockElement(
        this.tagName,
        this.attributes,
        this.textContent,
        deep ? this.children.map((c) => c.cloneNode(deep)) : []
      );
    },
    remove() {
      if (this.parentElement) {
        this.parentElement.children = this.parentElement.children.filter((c) => c !== this);
      }
    },
  };

  for (const child of children) {
    child.parentElement = el;
  }
  return el;
}

function createTwitterContext(documentRoot, url = "https://x.com/thedankoe/status/2101361833940791607", title = "X") {
  const parsedUrl = new URL(url);
  const context = {
    window: {
      location: {
        href: url,
        pathname: parsedUrl.pathname,
      },
    },
    document: {
      title,
      querySelector: (sel) => documentRoot.querySelector(sel),
      querySelectorAll: (sel) => documentRoot.querySelectorAll(sel),
    },
    setTimeout,
    clearTimeout,
    Promise,
    console,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    Math,
  };
  context.window.document = context.document;
  vm.createContext(context);
  vm.runInContext(utilsCode, context);
  vm.runInContext(twitterCode, context);
  return context;
}

test("Twitter Extractor - detectTwitter identifies x.com and twitter.com", () => {
  const root = createMockElement("div");
  const ctx1 = createTwitterContext(root, "https://x.com/thedankoe/status/2101361833940791607");
  assert.equal(ctx1.detectTwitter(), true);

  const ctx2 = createTwitterContext(root, "https://twitter.com/user/status/12345");
  assert.equal(ctx2.detectTwitter(), true);

  const ctx3 = createTwitterContext(root, "https://example.com/article");
  assert.equal(ctx3.detectTwitter(), false);
});

test("Twitter Extractor - extracts X Article when twitterArticleReadView is present", async () => {
  const titleEl = createMockElement("div", { "data-testid": "twitter-article-title" }, "How to Launch Yourself into a Brand New Life");
  const userLink = createMockElement("a", { href: "/thedankoe" }, "Dan Koe");
  const userHandle = createMockElement("span", {}, "@thedankoe");
  const userNameEl = createMockElement("div", { "data-testid": "User-Name" }, "", [userLink, userHandle]);
  const timeEl = createMockElement("time", { datetime: "2026-09-20T10:00:00.000Z" }, "Sep 20, 2026");

  const h1 = createMockElement("div", { class: "longform-header-one" }, "1. Use Disgust as Fuel");
  const p1 = createMockElement("div", { class: "longform-unstyled" }, "When you are truly fed up with your current situation, you find the energy to change.");
  const h2 = createMockElement("div", { class: "longform-header-two" }, "2. Build the Input and Output System");
  const quote = createMockElement("div", { class: "longform-blockquote" }, "Don't just consume information; build a daily creation habit.");
  const li1 = createMockElement("div", { class: "longform-unordered-list-item" }, "Audit your daily inputs and habits");
  const li2 = createMockElement("div", { class: "longform-unordered-list-item" }, "Write and publish your thoughts daily");
  const code = createMockElement("div", { "data-testid": "markdown-code-block" }, "const habit = new DailySystem({ focus: 'creation', hours: 2 });");

  const richView = createMockElement("div", { "data-testid": "twitterArticleRichTextView" }, "", [
    h1, p1, h2, quote, li1, li2, code
  ]);

  const readView = createMockElement("div", { "data-testid": "twitterArticleReadView" }, "", [
    titleEl, userNameEl, timeEl, richView
  ]);

  const root = createMockElement("body", {}, "", [readView]);
  const ctx = createTwitterContext(root, "https://x.com/thedankoe/status/2101361833940791607");

  const result = await ctx.extractTwitter();

  assert.equal(result.sourceType, "twitter");
  assert.equal(result.metadata.isArticle, true);
  assert.equal(result.title, "How to Launch Yourself into a Brand New Life");
  assert.equal(result.metadata.published, "2026-09-20T10:00:00.000Z");

  assert.ok(result.content.includes("# How to Launch Yourself into a Brand New Life"));
  assert.ok(result.content.includes("## 1. Use Disgust as Fuel"));
  assert.ok(result.content.includes("When you are truly fed up with your current situation, you find the energy to change."));
  assert.ok(result.content.includes("### 2. Build the Input and Output System"));
  assert.ok(result.content.includes("> Don't just consume information; build a daily creation habit."));
  assert.ok(result.content.includes("- Audit your daily inputs and habits"));
  assert.ok(result.content.includes("- Write and publish your thoughts daily"));
  assert.ok(result.content.includes("const habit = new DailySystem({ focus: 'creation', hours: 2 });"));
});

test("Twitter Extractor - handles tweet with article card that opens reader view", async () => {
  const userNameEl = createMockElement("div", { "data-testid": "User-Name" }, "Dan Koe @thedankoe");
  const tweetText = createMockElement("div", { "data-testid": "tweetText" }, "My new long-form article is live:");
  const cardHeading = createMockElement("div", { class: "heading" }, "How to Launch Yourself into a Brand New Life");
  const cardSnippet = createMockElement("div", { class: "snippet" }, "A comprehensive guide on transforming your mind and daily habits.");
  const cardLink = createMockElement("a", {
    href: "/thedankoe/article/2101361833940791607",
    "data-testid": "card.layoutLarge.detail"
  }, "", [cardHeading, cardSnippet]);

  const tweet = createMockElement("article", { "data-testid": "tweet" }, "", [
    userNameEl, tweetText, cardLink
  ]);
  const root = createMockElement("body", {}, "", [tweet]);

  // When card is clicked, attach reader view
  cardLink._onClick = () => {
    const titleEl = createMockElement("div", { "data-testid": "twitter-article-title" }, "How to Launch Yourself into a Brand New Life");
    const articleRichText = createMockElement("div", { "data-testid": "twitterArticleRichTextView" }, "", [
      createMockElement("div", { class: "longform-unstyled" }, "This is the full article content expanded after clicking the article card.")
    ]);
    const readView = createMockElement("div", { "data-testid": "twitterArticleReadView" }, "", [
      titleEl, articleRichText
    ]);
    root.children.push(readView);
    readView.parentElement = root;
  };

  const ctx = createTwitterContext(root, "https://x.com/thedankoe/status/2101361833940791607");
  const result = await ctx.extractTwitter();

  assert.equal(result.sourceType, "twitter");
  assert.equal(result.metadata.isArticle, true);
  assert.equal(result.title, "How to Launch Yourself into a Brand New Life");
  assert.ok(result.content.includes("This is the full article content expanded after clicking the article card."));
});

test("Twitter Extractor - extracts article card info when reader view cannot open", async () => {
  const userNameEl = createMockElement("div", { "data-testid": "User-Name" }, "Dan Koe @thedankoe");
  const tweetText = createMockElement("div", { "data-testid": "tweetText" }, "New article out now!");
  const cardHeading = createMockElement("div", {}, "How to Launch Yourself into a Brand New Life");
  const cardSnippet = createMockElement("div", {}, "Stop staying stuck in loops. Build a new life in 6 months.");
  const cardLink = createMockElement("a", {
    href: "/thedankoe/article/2101361833940791607",
    "data-testid": "card.layoutLarge.detail"
  }, "", [cardHeading, cardSnippet]);

  const tweet = createMockElement("article", { "data-testid": "tweet" }, "", [
    userNameEl, tweetText, cardLink
  ]);
  const root = createMockElement("body", {}, "", [tweet]);

  const ctx = createTwitterContext(root, "https://x.com/thedankoe/status/2101361833940791607");
  const result = await ctx.extractTwitter();

  assert.equal(result.sourceType, "twitter");
  assert.ok(result.content.includes("New article out now!"));
  assert.ok(result.content.includes("### 📰 Article: How to Launch Yourself into a Brand New Life"));
  assert.ok(result.content.includes("Stop staying stuck in loops. Build a new life in 6 months."));
  assert.ok(result.content.includes("https://x.com/thedankoe/article/2101361833940791607"));
});

test("Twitter Extractor - expands 'Show more' button on long tweets", async () => {
  const userNameEl = createMockElement("div", { "data-testid": "User-Name" }, "Dan Koe @thedankoe");
  const tweetText = createMockElement("div", { "data-testid": "tweetText" }, "Short intro text...");
  const btn = createMockElement("button", { "data-testid": "tweet-text-show-more-link" }, "Show more");

  const tweet = createMockElement("article", { "data-testid": "tweet" }, "", [
    userNameEl, tweetText, btn
  ]);
  const root = createMockElement("body", {}, "", [tweet]);

  btn._onClick = () => {
    tweetText.textContent = "Short intro text expanded into the full long-form post with all details!";
    btn.remove();
  };

  const ctx = createTwitterContext(root, "https://x.com/thedankoe/status/2101361833940791607");
  const result = await ctx.extractTwitter();

  assert.ok(result.content.includes("Short intro text expanded into the full long-form post with all details!"));
});

test("Twitter Extractor - derives author handle from URL when not in DOM", async () => {
  const titleEl = createMockElement("div", { "data-testid": "twitter-article-title" }, "How to Launch Yourself into a Brand New Life");
  const richText = createMockElement("div", { "data-testid": "twitterArticleRichTextView" }, "", [
    createMockElement("div", { class: "longform-unstyled" }, "Article body content testing.")
  ]);
  const readView = createMockElement("div", { "data-testid": "twitterArticleReadView" }, "", [
    titleEl, richText
  ]);
  const root = createMockElement("body", {}, "", [readView]);

  const ctx = createTwitterContext(root, "https://x.com/thedankoe/status/2101361833940791607");
  const result = await ctx.extractTwitter();

  assert.equal(result.metadata.handle, "@thedankoe");
  assert.equal(result.metadata.author, "thedankoe");
});
