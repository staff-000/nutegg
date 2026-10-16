const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

const utilsCode = fs.readFileSync(path.resolve(__dirname, "../dist/page-identity.js"), "utf8") + fs.readFileSync(path.resolve(__dirname, "../src/content/dom-reader.js"), "utf8") + fs.readFileSync(
  path.resolve(__dirname, "../src/content/utils.js"),
  "utf8"
);
const articleCode = fs.readFileSync(
  path.resolve(__dirname, "../src/content/extractors/article.js"),
  "utf8"
);
const genericCode = fs.readFileSync(
  path.resolve(__dirname, "../src/content/extractors/generic.js"),
  "utf8"
);
const contentScriptCode = fs.readFileSync(
  path.resolve(__dirname, "../src/content/content-script.js"),
  "utf8"
);

function createContext(html, url) {
  const dom = new JSDOM(html, { url });
  const win = dom.window;
  const ctx = vm.createContext({
    window: win,
    document: win.document,
    URL,
    console,
    location: win.location,
    Node: win.Node,
  });
  vm.runInContext(utilsCode, ctx);
  vm.runInContext(articleCode, ctx);
  vm.runInContext(genericCode, ctx);
  return { dom, win, ctx };
}

test("detectArticle detects standard og:type article and semantic article tags", () => {
  const { ctx } = createContext(
    '<!DOCTYPE html><html><head><meta property="og:type" content="article"></head><body><main>Content</main></body></html>',
    "https://example.com/news/123"
  );
  assert.equal(ctx.detectArticle(), true);

  const { ctx: ctx2 } = createContext(
    '<!DOCTYPE html><html><head></head><body><article>Content</article></body></html>',
    "https://example.com/blog/123"
  );
  assert.equal(ctx2.detectArticle(), true);

  const { ctx: ctx3 } = createContext(
    '<!DOCTYPE html><html><head></head><body><div>Just random page</div></body></html>',
    "https://example.com/page"
  );
  assert.equal(ctx3.detectArticle(), false);
});

test("extractArticle handles AP News structure (.RichTextStoryBody, JSON-LD, metadata)", () => {
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <title>AP News Article Title | AP News</title>
      <meta property="og:type" content="article">
      <meta property="og:site_name" content="AP News">
      <meta property="article:published_time" content="2026-10-14T06:56:57Z">
      <script type="application/ld+json">
        {
          "@context": "http://schema.org",
          "@type": "NewsArticle",
          "headline": "Pope Leo spent a tranquil night in the hospital after surgery",
          "datePublished": "2026-10-14T06:56:57Z",
          "author": [
            { "@type": "Person", "name": "Nicole Winfield" },
            { "@type": "Person", "name": "Colleen Barry" }
          ]
        }
      </script>
    </head>
    <body>
      <main>
        <h1>Pope Leo spent a tranquil night in the hospital after surgery</h1>
        <div class="RichTextStoryBody RichTextBody">
          <p>ROME (AP) — Pope Leo spent a tranquil night in Rome's Gemelli hospital following surgery.</p>
          <p>The Vatican said more information would be provided later in the day.</p>
          <p>Doctors confirmed that the operation had been successful and he was resting comfortably.</p>
        </div>
      </main>
    </body>
  </html>`;

  const { ctx } = createContext(
    html,
    "https://apnews.com/article/vatican-pope-leo-surgery-lung-cancer-08a4aca4e5a6002a1cb9a4ca1ba372cc"
  );

  assert.equal(ctx.detectArticle(), true);
  const result = ctx.extractArticle();
  assert.ok(result);
  assert.equal(result.sourceType, "article");
  assert.equal(result.extractionStatus, "ready");
  assert.match(result.title, /Pope Leo/);
  assert.equal(result.metadata.author, "Nicole Winfield, Colleen Barry");
  assert.equal(result.metadata.published, "2026-10-14T06:56:57Z");
  assert.match(result.content, /ROME \(AP\)/);
  assert.match(result.content, /resting comfortably/);
});

test("extractArticle handles CNBC structure (.ArticleBody-articleBody, meta author)", () => {
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <title>Diesel squeeze to last until 2027 as Iran war disrupts supply: IEA</title>
      <meta property="og:type" content="article">
      <meta property="og:title" content="Diesel squeeze set to last well into 2027 as Iran war disrupts supply, IEA says">
      <meta property="og:site_name" content="CNBC">
      <meta name="author" content="Chloe Taylor">
      <meta property="article:published_time" content="2026-10-14T08:00:01+0000">
    </head>
    <body>
      <div role="main">
        <h1>Diesel squeeze set to last well into 2027 as Iran war disrupts supply, IEA says</h1>
        <div class="ArticleBody-articleBody" data-module="ArticleBody">
          <p>Constraints on the diesel market will extend well into next year, the International Energy Agency warned on Wednesday.</p>
          <p>In its October Oil Market Report, the IEA said supply would remain tight into the latter half of 2027.</p>
          <p>A counter-seasonal tightening in gasoil markets in the third quarter combined to drive up prices.</p>
        </div>
      </div>
    </body>
  </html>`;

  const { ctx } = createContext(
    html,
    "https://www.cnbc.com/2026/10/14/diesel-deal-oil-price-iea-report.html"
  );

  assert.equal(ctx.detectArticle(), true);
  const result = ctx.extractArticle();
  assert.ok(result);
  assert.equal(result.sourceType, "article");
  assert.equal(result.extractionStatus, "ready");
  assert.equal(result.title, "Diesel squeeze set to last well into 2027 as Iran war disrupts supply, IEA says");
  assert.equal(result.metadata.author, "Chloe Taylor");
  assert.equal(result.metadata.published, "2026-10-14T08:00:01+0000");
  assert.match(result.content, /Constraints on the diesel market/);
});

test("extractArticle extracts itemprop='articleBody' and formats Markdown paragraphs", () => {
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta property="og:type" content="article">
      <title>Schema Article</title>
    </head>
    <body>
      <h1>Article Headline</h1>
      <div itemprop="articleBody">
        <h2>Subheading 1</h2>
        <p>First paragraph with informative details.</p>
        <blockquote>Key quote from an expert.</blockquote>
        <p>Second paragraph explaining the findings.</p>
        <ul>
          <li>Point A</li>
          <li>Point B</li>
        </ul>
      </div>
    </body>
  </html>`;

  const { ctx } = createContext(html, "https://example.com/article/1");
  const result = ctx.extractArticle();
  assert.ok(result);
  assert.equal(result.extractionStatus, "ready");
  assert.match(result.content, /## Subheading 1/);
  assert.match(result.content, /> Key quote from an expert/);
  assert.match(result.content, /- Point A/);
});

test("content-script extractContent gracefully handles null returned from an extractor", async () => {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head><meta property="og:type" content="article"></head><body><div id="content"><p>' +
      "Word ".repeat(250) +
      "</p></div></body></html>",
    { url: "https://example.com/null-test", runScripts: "outside-only" }
  );
  const win = dom.window;
  let listener;
  win.chrome = {
    runtime: {
      sendMessage: async () => ({ success: true }),
      onMessage: { addListener: (fn) => { listener = fn; } },
    },
  };
  win.EXTRACTORS = [
    { name: "failing-article", detect: () => true, extract: () => null },
    { name: "generic", detect: () => true, extract: () => ({ content: "Generic Content", extractionStatus: "ready" }) },
  ];

  win.eval(utilsCode);
  win.eval(contentScriptCode);

  const res = await new Promise((resolve) =>
    listener({ action: "extract-content", requestId: "test-null" }, {}, resolve)
  );

  assert.equal(res.success, true);
  assert.equal(res.content.content, "Generic Content");
  assert.equal(res.content.extractionStatus, "ready");
});

test("extractArticle ignores teaser cards/tickers and chooses full article body even if teasers appear first in DOM", () => {
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta property="og:type" content="article">
      <title>Article with Hero Teaser</title>
    </head>
    <body>
      <!-- Breaking news ticker or ad teaser inserted at top of DOM -->
      <article class="breaking-news-ticker">
        <h3>Breaking Update</h3>
        <p>Short breaking news teaser about a related event with about thirty words of brief text.</p>
      </article>

      <!-- Sidebar teaser -->
      <aside>
        <article class="sidebar-item">
          <p>Another small teaser card in sidebar.</p>
        </article>
      </aside>

      <!-- Main article body -->
      <main class="Page-main">
        <h1>Full Feature Story</h1>
        <div class="RichTextStoryBody">
          <p>First in-depth paragraph of the comprehensive article explaining all background information.</p>
          <p>Second detailed paragraph continuing the reporting with extensive facts and citations.</p>
          <p>Third paragraph providing conclusive analysis and statements from primary sources.</p>
        </div>
      </main>
    </body>
  </html>`;

  const { ctx } = createContext(html, "https://example.com/news/feature");
  const result = ctx.extractArticle();
  assert.ok(result);
  assert.equal(result.extractionStatus, "ready");
  assert.match(result.content, /First in-depth paragraph/);
  assert.match(result.content, /Third paragraph providing conclusive analysis/);
  assert.doesNotMatch(result.content, /Breaking news ticker/);
});

