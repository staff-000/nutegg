import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { IndexReader } from "../src/index-reader";
import { makeFakePlugin } from "./helpers";

function parse(content: string) {
  const reader = new IndexReader(makeFakePlugin() as any);
  return reader.parseIndexContent(content);
}

describe("IndexReader.parseIndexContent", () => {
  it("parses `* path: description` bullet lines", () => {
    const entries = parse("* nutegg/investment.md: investment strategies\n");
    assert.equal(entries.length, 1);
    assert.deepEqual(entries[0], {
      fileName: "nutegg/investment.md",
      description: "investment strategies",
    });
  });

  it("parses plain lines without bullets", () => {
    const entries = parse("nutegg/ai.md: AI and machine learning\n");
    assert.equal(entries[0].fileName, "nutegg/ai.md");
  });

  it("skips markdown headings, comments, and callout lines", () => {
    const entries = parse([
      "# NutEgg Egg Index",
      "> [!abstract]- Instructions:",
      "> - Add one line per egg file",
      "",
      "* nutegg/society.md: geopolitics",
    ].join("\n"));
    assert.deepEqual(
      entries.map((e) => e.fileName),
      ["nutegg/society.md"]
    );
  });

  it("strips `-` and `+` bullet prefixes too", () => {
    const entries = parse([
      "- nutegg/a.md: first",
      "+ nutegg/b.md: second",
    ].join("\n"));
    assert.deepEqual(
      entries.map((e) => e.fileName),
      ["nutegg/a.md", "nutegg/b.md"]
    );
  });

  it("ignores lines whose path doesn't end in .md", () => {
    const entries = parse("not-a-file.txt: description\n* nutegg/ok.md: fine\n");
    assert.equal(entries.length, 1);
  });

  it("handles descriptions containing colons", () => {
    const entries = parse("* nutegg/x.md: a: b: c\n");
    assert.equal(entries[0].description, "a: b: c");
  });

  it("returns empty list for empty content", () => {
    assert.deepEqual(parse(""), []);
  });
});

describe("IndexReader.parseMatchedEggs", () => {
  const reader = new IndexReader(makeFakePlugin() as any);
  const index = [
    { fileName: "nutegg/investment.md", description: "investment strategies" },
    { fileName: "nutegg/ai_ml.md", description: "artificial intelligence and machine learning" },
    { fileName: "nutegg/psychology.md", description: "mental models and psychology" },
  ];

  it("matches JSON array of full paths", () => {
    const res = reader.parseMatchedEggs('["nutegg/ai_ml.md"]', index);
    assert.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md"]);
  });

  it("matches JSON array of basenames", () => {
    const res = reader.parseMatchedEggs('["ai_ml.md"]', index);
    assert.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md"]);
  });

  it("matches markdown bullet list (- nutegg/ai_ml.md)", () => {
    const res = reader.parseMatchedEggs("- nutegg/ai_ml.md\n- nutegg/investment.md", index);
    assert.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md", "nutegg/investment.md"]);
  });

  it("matches markdown bullet list with basenames (* ai_ml.md)", () => {
    const res = reader.parseMatchedEggs("* ai_ml.md\n", index);
    assert.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md"]);
  });

  it("matches numbered list (1. nutegg/ai_ml.md)", () => {
    const res = reader.parseMatchedEggs("1. nutegg/ai_ml.md", index);
    assert.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md"]);
  });

  it("matches backticks (`nutegg/ai_ml.md`)", () => {
    const res = reader.parseMatchedEggs("`nutegg/ai_ml.md`", index);
    assert.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md"]);
  });

  it("matches conversational text mentioning the egg file", () => {
    const res = reader.parseMatchedEggs(
      "Based on the provided article, this content belongs to nutegg/ai_ml.md as it discusses neural networks.",
      index
    );
    assert.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md"]);
  });

  it("returns empty array for explicit 'none' or '[]'", () => {
    assert.deepEqual(reader.parseMatchedEggs("none", index), []);
    assert.deepEqual(reader.parseMatchedEggs("None.", index), []);
    assert.deepEqual(reader.parseMatchedEggs("[]", index), []);
    assert.deepEqual(reader.parseMatchedEggs("No match found", index), []);
  });
});
