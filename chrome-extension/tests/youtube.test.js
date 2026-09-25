// ============================================================
// NutEgg Chrome Extension YouTube Extractor Tests
// ============================================================

const test = require("node:test");
const assert = require("node:assert/strict");

// Provide globals needed by youtube.js
global.parseTimestamp = function (ts) {
  const parts = ts.slice(1, -1).split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return -1;
};

const {
  decodeHtmlEntities,
  dedupChapters,
} = require("../src/content/extractors/youtube.js");

test("decodeHtmlEntities - decodes HTML entities and non-BMP unicode (emojis)", () => {
  assert.equal(
    decodeHtmlEntities("&amp; &quot; &#39; &lt; &gt;"),
    "& \" ' < >"
  );
  // Decimal emoji 😀 (128512 / 0x1F600)
  assert.equal(decodeHtmlEntities("Hello &#128512; world"), "Hello 😀 world");
  // Hex emoji 🚀 (0x1F680)
  assert.equal(decodeHtmlEntities("Blast off &#x1F680;!"), "Blast off 🚀!");
  // Regular unicode
  assert.equal(decodeHtmlEntities("&#x2014;"), "—");
});

test("dedupChapters - removes duplicates and stops on loop restart", () => {
  const chapters = [
    { time: "0:00", title: "Intro" },
    { time: "01:30", title: "Chapter 1" },
    { time: "05:00", title: "Chapter 2" },
    // Loop restart to earlier time (e.g. 0:10 or 0:00)
    { time: "0:10", title: "Intro again" },
    { time: "01:30", title: "Chapter 1 again" },
  ];

  const deduped = dedupChapters(chapters);
  assert.equal(deduped.length, 3);
  assert.equal(deduped[0].title, "Intro");
  assert.equal(deduped[1].title, "Chapter 1");
  assert.equal(deduped[2].title, "Chapter 2");
});

