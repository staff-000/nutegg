// ============================================================
// NutEgg Chrome Extension Q&A Timestamp Tests
// ============================================================

const test = require("node:test");
const assert = require("node:assert/strict");

// Mock browser globals needed by popup.js on initial load
global.document = {
  getElementById: () => ({
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => false },
    setAttribute: () => {},
    style: {},
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (tag) => ({
    tag,
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => false },
    setAttribute: () => {},
    appendChild: () => {},
    _text: "",
    get textContent() {
      return this._text;
    },
    set textContent(v) {
      this._text = v;
      this.innerHTML = String(v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },
    innerHTML: "",
  }),
  addEventListener: () => {},
};

global.chrome = {
  runtime: {
    getManifest: () => ({ version: "0.1.1" }),
    onMessage: { addListener: () => {} },
  },
  tabs: {
    query: async () => [{ id: 123 }],
    sendMessage: async () => {},
    onUpdated: { addListener: () => {} },
  },
  storage: {
    local: {
      get: async () => ({}),
      set: async () => {},
    },
  },
};

const {
  extractTimestamp,
  timeToSeconds,
  renderQaSources,
  linkifyTimestamps,
  unwrapMindMapRoots,
} = require("../src/popup/popup.js");

test("extractTimestamp - extracts standard MM:SS and HH:MM:SS", () => {
  assert.equal(extractTimestamp("12:34"), "12:34");
  assert.equal(extractTimestamp("01:23:45"), "01:23:45");
  assert.equal(extractTimestamp("1:05:30"), "1:05:30");
  assert.equal(extractTimestamp("0:15"), "0:15");
});

test("extractTimestamp - handles bracketed timestamps", () => {
  assert.equal(extractTimestamp("[12:34]"), "12:34");
  assert.equal(extractTimestamp("[01:23:45]"), "01:23:45");
  assert.equal(extractTimestamp("[1:05:30]"), "1:05:30");
  assert.equal(extractTimestamp("(12:34)"), "12:34");
});

test("extractTimestamp - handles timestamp ranges and leading text", () => {
  assert.equal(extractTimestamp("12:34 - 13:00"), "12:34");
  assert.equal(extractTimestamp("[12:34 - 13:00]"), "12:34");
  assert.equal(extractTimestamp("⏱️ 12:34"), "12:34");
  assert.equal(extractTimestamp("Chapter 2 (05:20)"), "05:20");
});

test("extractTimestamp - returns null for non-timestamp references", () => {
  assert.equal(extractTimestamp("Introduction"), null);
  assert.equal(extractTimestamp("Section 3.2"), null);
  assert.equal(extractTimestamp("Overview and Architecture"), null);
  assert.equal(extractTimestamp(""), null);
  assert.equal(extractTimestamp(null), null);
});

test("timeToSeconds - converts MM:SS, HH:MM:SS, and bracketed formats", () => {
  assert.equal(timeToSeconds("00:30"), 30);
  assert.equal(timeToSeconds("12:34"), 754);
  assert.equal(timeToSeconds("[12:34]"), 754);
  assert.equal(timeToSeconds("1:05:30"), 3930);
  assert.equal(timeToSeconds("[01:05:30]"), 3930);
  assert.equal(timeToSeconds("12:34 - 13:00"), 754);
  assert.equal(timeToSeconds(754), 754);
  assert.equal(timeToSeconds("754"), 754);
  assert.equal(timeToSeconds(""), 0);
  assert.equal(timeToSeconds(null), 0);
});

test("renderQaSources - formats timestamp sources with data-time and ⏱️", () => {
  const sources = [
    { ref: "[12:34]", quote: "This is when the model is loaded" },
    { ref: "1:05:30", quote: "Discussion on scaling" },
    { ref: "Section 2.1", quote: "Benchmark metrics" },
  ];

  const html = renderQaSources(sources);

  // Both [12:34] and 1:05:30 should be recognized as timestamps
  assert.ok(html.includes('data-time="12:34"'));
  assert.ok(html.includes('data-time="1:05:30"'));
  assert.ok(html.includes("source-pill source-timestamp"));
  assert.ok(html.includes("⏱️"));

  // Clean display for bracketed timestamp
  assert.ok(html.includes('>12:34<'));

  // Section heading should be recognized as section
  assert.ok(html.includes('data-heading="Section 2.1"'));
  assert.ok(html.includes("source-pill source-section"));
  assert.ok(html.includes("§"));
});

test("linkifyTimestamps - transforms timestamps inside text to clickable buttons", () => {
  const text = "As explained at [12:34], the system initializes before 15:45 starts.";
  const linkified = linkifyTimestamps(text);

  assert.ok(linkified.includes('data-time="12:34"'));
  assert.ok(linkified.includes('data-time="15:45"'));
  assert.ok(linkified.includes('inline-timestamp'));
  assert.ok(linkified.includes('source-pill source-timestamp'));
  assert.ok(linkified.includes('⏱️'));
});

test("linkifyTimestamps - preserves text without timestamps", () => {
  const text = "This is a plain answer with no timestamps mentioned.";
  const linkified = linkifyTimestamps(text);
  assert.equal(linkified, text);
});

test("unwrapMindMapRoots - unwraps single root node with children", () => {
  const treeWithSingleRoot = [
    {
      name: "Article Title (Single Root)",
      detail: "Overall summary",
      children: [
        { name: "Branch 1", detail: "Detail 1" },
        { name: "Branch 2", detail: "Detail 2" },
        { name: "Branch 3", detail: "Detail 3" },
      ],
    },
  ];

  const unwrapped = unwrapMindMapRoots(treeWithSingleRoot);
  assert.equal(unwrapped.length, 3);
  assert.equal(unwrapped[0].name, "Branch 1");
  assert.equal(unwrapped[1].name, "Branch 2");
  assert.equal(unwrapped[2].name, "Branch 3");
});

test("unwrapMindMapRoots - preserves multi-branch roots", () => {
  const multiRoots = [
    { name: "Branch 1", detail: "Detail 1" },
    { name: "Branch 2", detail: "Detail 2" },
  ];

  const result = unwrapMindMapRoots(multiRoots);
  assert.equal(result.length, 2);
  assert.equal(result[0].name, "Branch 1");
  assert.equal(result[1].name, "Branch 2");
});

test("unwrapMindMapRoots - handles single node without children", () => {
  const singleLeaf = [{ name: "Only Node", detail: "No children" }];
  const result = unwrapMindMapRoots(singleLeaf);
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Only Node");
});

test("unwrapMindMapRoots - unwraps nested single roots", () => {
  const nested = [
    {
      name: "Root 1",
      children: [
        {
          name: "Subroot 1.1",
          children: [
            { name: "Actual Topic A" },
            { name: "Actual Topic B" },
          ],
        },
      ],
    },
  ];

  const result = unwrapMindMapRoots(nested);
  assert.equal(result.length, 2);
  assert.equal(result[0].name, "Actual Topic A");
  assert.equal(result[1].name, "Actual Topic B");
});

