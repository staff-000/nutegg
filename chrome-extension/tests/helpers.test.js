const test = require("node:test");
const assert = require("node:assert/strict");

const {
  helper,
  escapeHtml,
  slugify,
  cleanEggName,
  extractTimestamp,
  timeToSeconds,
  linkifyTimestamps,
  unwrapMindMapRoots,
  buildPriorQa,
  formatPublishedDate,
  detectPageTypeFromUrl,
  provenanceFromExtraction,
  countWords,
  isContentSuspiciouslyLow,
  getExtractionWarning,
  getVersionMismatchIssue,
  isVideoMediaSource,
  isTranscriptBlocked,
  getAnalyzeNotReadyReason,
  buildGitHubBugReportUrl,
  openGitHubBugReport,
} = require("../src/popup/helpers.js");

test("helper namespace object - allows calling methods directly on helper", () => {
  assert.equal(typeof helper, "object");
  assert.equal(typeof helper.unwrapMindMapRoots, "function");
  assert.equal(typeof helper.isTranscriptBlocked, "function");
  assert.equal(typeof helper.slugify, "function");
  assert.equal(typeof helper.cleanEggName, "function");
  assert.equal(typeof helper.escapeHtml, "function");

  // Verify calling via helper.unwrapMindMapRoots works identical
  const singleRoot = [{ name: "Root", children: [{ name: "Branch A" }] }];
  assert.deepEqual(helper.unwrapMindMapRoots(singleRoot), [{ name: "Branch A" }]);
});

test("escapeHtml - safely escapes HTML entities", () => {
  assert.equal(escapeHtml("<div>Hello & 'world' \"123\"</div>"), "&lt;div&gt;Hello &amp; &#039;world&#039; &quot;123&quot;&lt;/div&gt;");
  assert.equal(escapeHtml(""), "");
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
});

test("slugify - converts names into snake_case egg slugs", () => {
  assert.equal(slugify("Deep Learning 101!"), "deep_learning_101");
  assert.equal(slugify("  --TypeScript Best Practices--  "), "typescript_best_practices");
  assert.equal(slugify("人工智能 & 机器学习"), "人工智能_机器学习");
  assert.equal(slugify(""), "");
  assert.equal(slugify(null), "");
});

test("cleanEggName - strips path and .md extension", () => {
  assert.equal(cleanEggName("vault/subfolder/Machine Learning.md"), "Machine Learning");
  assert.equal(cleanEggName("deep-learning.MD"), "deep-learning");
  assert.equal(cleanEggName("simple-egg"), "simple-egg");
  assert.equal(cleanEggName(""), "Egg");
  assert.equal(cleanEggName(null), "Egg");
});

test("extractTimestamp - parses timestamps", () => {
  assert.equal(extractTimestamp("12:34"), "12:34");
  assert.equal(extractTimestamp("01:23:45"), "01:23:45");
  assert.equal(extractTimestamp("See [1:05:30] for details"), "1:05:30");
  assert.equal(extractTimestamp("No timestamp here"), null);
  assert.equal(extractTimestamp(""), null);
});

test("timeToSeconds - parses timestamps into seconds", () => {
  assert.equal(timeToSeconds("01:30"), 90);
  assert.equal(timeToSeconds("1:00:00"), 3600);
  assert.equal(timeToSeconds("01:02:03"), 3723);
  assert.equal(timeToSeconds(120), 120);
  assert.equal(timeToSeconds(""), 0);
  assert.equal(timeToSeconds(null), 0);
});

test("linkifyTimestamps - wraps timestamps in clickable buttons", () => {
  const input = "Key moment at 02:15 and later at 1:10:00.";
  const output = linkifyTimestamps(input);
  assert.match(output, /data-time="02:15"/);
  assert.match(output, /data-time="1:10:00"/);
});

test("unwrapMindMapRoots - flattens single root hierarchy", () => {
  const singleRoot = [{ name: "Root", children: [{ name: "Branch 1" }, { name: "Branch 2" }] }];
  assert.deepEqual(unwrapMindMapRoots(singleRoot), [{ name: "Branch 1" }, { name: "Branch 2" }]);

  const multiRoot = [{ name: "Root 1" }, { name: "Root 2" }];
  assert.deepEqual(unwrapMindMapRoots(multiRoot), multiRoot);

  assert.deepEqual(unwrapMindMapRoots([]), []);
  assert.deepEqual(unwrapMindMapRoots(null), []);
});

test("buildPriorQa - formats custom Q&A and follow-ups", () => {
  const res = {
    customQuestionAnswers: [
      { question: "What is X?", answer: "X is great." },
    ],
  };
  const followUps = [
    { question: "Why?", answer: "Because of Y." },
  ];
  const prior = buildPriorQa(res, followUps);
  assert.equal(prior, "Q: What is X?\nA: X is great.\n\nQ: Why?\nA: Because of Y.");
});

test("detectPageTypeFromUrl - classifies YouTube, Bilibili, TikTok, Twitter, and Webpage", () => {
  assert.equal(detectPageTypeFromUrl("https://www.youtube.com/watch?v=123"), "youtube");
  assert.equal(detectPageTypeFromUrl("https://youtu.be/123"), "youtube");
  assert.equal(detectPageTypeFromUrl("https://www.bilibili.com/video/BV123"), "bilibili");
  assert.equal(detectPageTypeFromUrl("https://www.tiktok.com/@user/video/123"), "tiktok");
  assert.equal(detectPageTypeFromUrl("https://twitter.com/user/status/123"), "twitter");
  assert.equal(detectPageTypeFromUrl("https://x.com/user/status/123"), "twitter");
  assert.equal(detectPageTypeFromUrl("https://example.com/blog"), "webpage");
  assert.equal(detectPageTypeFromUrl(""), "webpage");
  assert.equal(detectPageTypeFromUrl(null), "webpage");
});

test("provenanceFromExtraction - standardizes metadata", () => {
  const content = {
    title: "Awesome Article",
    url: "https://example.com/post",
    metadata: {
      author: "Jane Doe",
      publishedTime: "2026-09-01T12:00:00Z",
    },
  };
  const prov = provenanceFromExtraction(content);
  assert.equal(prov.title, "Awesome Article");
  assert.equal(prov.author, "Jane Doe");
  assert.equal(prov.url, "https://example.com/post");
  assert.ok(prov.published.length > 0);
});

test("getVersionMismatchIssue - detects version disparity", () => {
  assert.equal(getVersionMismatchIssue("1.2.0", "1.2.0"), null);
  const mismatch = getVersionMismatchIssue("1.1.0", "1.2.0");
  assert.ok(mismatch && mismatch.includes("1.1.0"));
});

test("isVideoMediaSource & isTranscriptBlocked - supports YouTube, Bilibili, TikTok, and general media", () => {
  // isVideoMediaSource
  assert.equal(isVideoMediaSource("youtube"), true);
  assert.equal(isVideoMediaSource("bilibili"), true);
  assert.equal(isVideoMediaSource("tiktok"), true);
  assert.equal(isVideoMediaSource("webpage"), false);
  assert.equal(isVideoMediaSource({ sourceType: "bilibili" }), true);
  assert.equal(isVideoMediaSource({ mediaType: "video" }), true);
  assert.equal(isVideoMediaSource(null), false);

  // isTranscriptBlocked on YouTube
  assert.equal(isTranscriptBlocked({ sourceType: "youtube", transcriptAvailable: false }), true);
  assert.equal(isTranscriptBlocked({ sourceType: "youtube", transcriptAvailable: true }), false);

  // isTranscriptBlocked on Bilibili & TikTok
  assert.equal(isTranscriptBlocked({ sourceType: "bilibili", transcriptAvailable: false }), true);
  assert.equal(isTranscriptBlocked({ sourceType: "bilibili", transcriptAvailable: true }), false);
  assert.equal(isTranscriptBlocked({ sourceType: "tiktok", transcriptAvailable: false }), true);
  assert.equal(isTranscriptBlocked({ mediaType: "video", transcriptAvailable: false }), true);

  // Non-video content is never blocked
  assert.equal(isTranscriptBlocked({ sourceType: "webpage" }), false);
  assert.equal(isTranscriptBlocked(null), false);
});

test("getAnalyzeNotReadyReason - reports appropriate readiness blocks", () => {
  assert.equal(getAnalyzeNotReadyReason({ currentTabLoading: true }, {}), "pageStillLoading");
  assert.equal(getAnalyzeNotReadyReason({ extractionPending: true }, {}), "retrievingContentWait");
  assert.equal(getAnalyzeNotReadyReason({ extractedContent: null }, {}), "pageOrContentNotReady");
  assert.equal(
    getAnalyzeNotReadyReason(
      { extractedContent: { sourceType: "youtube", transcriptAvailable: false, content: "desc" } },
      {}
    ),
    "transcriptUnavailableAnalyze"
  );
  assert.equal(
    getAnalyzeNotReadyReason(
      { extractedContent: { sourceType: "bilibili", transcriptAvailable: false, content: "desc" } },
      {}
    ),
    "transcriptUnavailableAnalyze"
  );
  assert.equal(
    getAnalyzeNotReadyReason(
      { extractedContent: { content: "text" } },
      { serverOnline: false, chromeAiEnabled: false }
    ),
    "obsidianOfflineStart"
  );
  assert.equal(
    getAnalyzeNotReadyReason(
      { extractedContent: { content: "text" } },
      { serverOnline: true }
    ),
    null
  );
});

test("buildGitHubBugReportUrl & openGitHubBugReport - builds correct issue url", () => {
  const url = buildGitHubBugReportUrl("Unexpected 500 error", {
    url: "https://example.com/test",
    version: "1.0.5",
    userAgent: "Chrome/128",
  });
  assert.ok(url.startsWith("https://github.com/staff-000/nutegg/issues/new?title="));
  assert.ok(url.includes("Unexpected%20500%20error"));
  assert.ok(url.includes("https%3A%2F%2Fexample.com%2Ftest"));
  assert.ok(url.includes("1.0.5"));
});

test("countWords - accurately counts words across Latin, CJK, and mixed languages", () => {
  assert.equal(countWords(""), 0);
  assert.equal(countWords(null), 0);
  assert.equal(countWords(undefined), 0);
  assert.equal(countWords("   \n\t  "), 0);

  // Latin text
  assert.equal(countWords("Hello world"), 2);
  assert.equal(countWords("  This   is   a   test  sentence. "), 5);

  // CJK ideographs
  assert.equal(countWords("你好世界"), 4);
  assert.equal(countWords("自然语言处理与机器学习"), 11);

  // Mixed CJK and Latin
  assert.equal(countWords("Hello 世界! 123"), 4); // "Hello", "世", "界", "123"
  assert.equal(countWords("NutEgg 插件很好用"), 6); // "NutEgg", "插", "件", "很", "好", "用"
});

test("isContentSuspiciouslyLow - correctly detects suspiciously short extractions", () => {
  // Twitter: threshold 5
  assert.equal(isContentSuspiciouslyLow(0, "twitter"), true);
  assert.equal(isContentSuspiciouslyLow(4, "twitter"), true);
  assert.equal(isContentSuspiciouslyLow(5, "twitter"), false);
  assert.equal(isContentSuspiciouslyLow(20, "twitter"), false);

  // Articles, pages and all supported video/audio sources: threshold 200.
  for (const sourceType of ["youtube", "bilibili", "douyin", "tiktok", "podcast", "video", "article", "webpage", "generic"]) {
    assert.equal(isContentSuspiciouslyLow(50, sourceType), true, sourceType);
    assert.equal(isContentSuspiciouslyLow(199, sourceType), true, sourceType);
    assert.equal(isContentSuspiciouslyLow(200, sourceType), false, sourceType);
    assert.equal(isContentSuspiciouslyLow(500, sourceType), false, sourceType);
  }
});

test("getExtractionWarning - prioritizes missing transcripts independently of description length", () => {
  const longText = "word ".repeat(500);
  assert.equal(getExtractionWarning(null), null);
  assert.equal(getExtractionWarning({ sourceType: "article", content: "word ".repeat(199) }), "contentLowWarning");
  assert.equal(getExtractionWarning({ sourceType: "article", content: "word ".repeat(200) }), null);
  for (const content of [
    { sourceType: "youtube" }, { sourceType: "bilibili" }, { sourceType: "tiktok" }, { sourceType: "generic", mediaType: "video" },
  ]) {
    assert.equal(getExtractionWarning({ ...content, transcriptAvailable: false, content: longText }), "transcriptBlockedWarning");
    assert.equal(getExtractionWarning({ ...content, transcriptAvailable: false, content: "" }), "transcriptBlockedWarning");
    assert.equal(getExtractionWarning({ ...content, transcriptAvailable: true, content: longText }), null);
  }
  assert.equal(getExtractionWarning({ sourceType: "tiktok", mediaType: "article", transcriptAvailable: false, content: longText }), null);
});

test("provenanceFromExtraction - includes accurate wordCount", () => {
  const extraction = {
    title: "Test Page",
    url: "https://example.com/article",
    sourceType: "article",
    content: "One two three four five.",
    metadata: { author: "Bob", published: "2026-03-01" },
  };
  const prov = provenanceFromExtraction(extraction);
  assert.equal(prov.title, "Test Page");
  assert.equal(prov.url, "https://example.com/article");
  assert.equal(prov.author, "Bob");
  assert.equal(prov.wordCount, 5);
});
