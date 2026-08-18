import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { KnowledgeBase } from "../src/knowledge-base";
import { makeFakeVault } from "./helpers";

function makeKb() {
  const { vault, files } = makeFakeVault();
  const kb = new KnowledgeBase({
    settings: { rawFolder: "nutegg/_raw" },
    app: { vault },
  } as any);
  return { kb, files };
}

describe("KnowledgeBase.saveRaw", () => {
  const base = {
    url: "https://example.com/post",
    title: "My Title!",
    content: "Hello world content here.",
    sourceType: "article",
    metadata: {
      published: "2026-08-10",
      author: "Jane Doe",
      time_estimate_minutes: "12",
      site: "Example",
    },
    matchedEggs: ["nutegg/investment.md", "nutegg/ai.md"],
    processingResult: "saved" as const,
  };

  it("writes a file with the timestamp-source-author-title naming", async () => {
    const { kb, files } = makeKb();
    const fileName = await kb.saveRaw({ ...base });
    assert.match(
      fileName,
      /^nutegg\/_raw\/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-article-Jane-Doe-My-Title!.md$/
    );
    assert.ok(files.has(fileName));
  });

  it("uses `unknown` for missing published/author", async () => {
    const { kb } = makeKb();
    const fileName = await kb.saveRaw({
      ...base,
      metadata: {},
      matchedEggs: [],
    });
    assert.ok(fileName.includes("-unknown-"));
  });

  it("includes all frontmatter properties", async () => {
    const { kb, files } = makeKb();
    const fileName = await kb.saveRaw({ ...base, summary: "Line one.\nLine two." });
    const content = files.get(fileName)!;
    assert.ok(content.includes('source_url: "https://example.com/post"'));
    assert.ok(content.includes("source_type: article"));
    assert.ok(content.includes('published_at: "2026-08-10"'));
    assert.ok(content.includes("saved_at:"));
    assert.ok(content.includes('author: "Jane Doe"'));
    assert.ok(content.includes("processing_result: saved"));
    assert.ok(content.includes("time_estimate_minutes: 12"));
    assert.ok(content.includes('summary: "Line one.\\nLine two."'));
    assert.ok(content.includes("egg_files:"));
    assert.ok(content.includes("  - nutegg/investment.md"));
    assert.ok(content.includes("tags: []"));
  });

  it("escapes quotes and backslashes in YAML strings", async () => {
    const { kb, files } = makeKb();
    const fileName = await kb.saveRaw({
      ...base,
      url: 'https://x.com/?q="a\\b"',
      metadata: {},
    });
    const content = files.get(fileName)!;
    assert.ok(content.includes('source_url: "https://x.com/?q=\\"a\\\\b\\""'));
  });

  it("passthrough metadata not covered by known keys", async () => {
    const { kb, files } = makeKb();
    const fileName = await kb.saveRaw({ ...base });
    const content = files.get(fileName)!;
    assert.ok(content.includes('site: "Example"'));
    assert.ok(!content.includes("published:"), "published handled as published_at");
  });

  it("falls back to word-count time estimate when metadata is missing", async () => {
    const { kb, files } = makeKb();
    const fileName = await kb.saveRaw({
      ...base,
      content: Array(600).fill("word").join(" "), // 600 words → 3 min
      metadata: {},
    });
    assert.ok(files.get(fileName)!.includes("time_estimate_minutes: 3"));
  });

  it("creates the raw folder when it doesn't exist", async () => {
    const { kb, files } = makeKb();
    await kb.saveRaw({ ...base });
    const fileName = [...files.keys()].find((k) => k.endsWith(".md"))!;
    assert.ok(fileName.startsWith("nutegg/_raw/"));
  });

  it("sanitizes dangerous filename characters", async () => {
    const { kb } = makeKb();
    const fileName = await kb.saveRaw({
      ...base,
      title: 'Bad:File<Name>*"#?',
      metadata: {},
    });
    assert.ok(!/[\\/:*?"<>|#^\[\]]/.test(fileName.split("/").pop()!));
    assert.ok(fileName.includes("BadFileName"));
  });
});

describe("KnowledgeBase.appendKnowledge", () => {
  it("appends each entry to the egg's Unprocessed section with author and source", async () => {
    const { vault, files } = makeFakeVault({
      "a.md": "## Knowledge\n\n- existing a\n",
      "b.md": "## Knowledge\n\n- existing b\n",
    });
    const kb = new KnowledgeBase({
      settings: { rawFolder: "nutegg/_raw" },
      app: { vault },
    } as any);
    await kb.appendKnowledge(
      [
        { egg: "a.md", parent: "existing a", content: "- one" },
        { egg: "b.md", content: "- two" },
      ],
      "Article Title",
      "https://example.com/src",
      "Jane Doe"
    );
    const a = files.get("a.md")!;
    const b = files.get("b.md")!;
    assert.ok(a.includes("## Unprocessed"));
    assert.ok(a.includes("- one"));
    assert.ok(a.includes("_author: Jane Doe_"));
    assert.ok(a.includes("_source: [Article Title](https://example.com/src)_"));
    assert.ok(b.includes("- two"));
    // Entries go to Unprocessed — the Knowledge tree is left alone
    assert.ok(!a.split("## Unprocessed")[0].includes("- one"));
  });

  it("omits the author line when unknown", async () => {
    const { vault, files } = makeFakeVault({ "a.md": "## Knowledge\n" });
    const kb = new KnowledgeBase({
      settings: { rawFolder: "nutegg/_raw" },
      app: { vault },
    } as any);
    await kb.appendKnowledge(
      [{ egg: "a.md", content: "- one" }],
      "Title",
      "https://example.com/src",
      ""
    );
    const a = files.get("a.md")!;
    assert.ok(!a.includes("_author:"));
    assert.ok(a.includes("_source: [Title](https://example.com/src)_"));
  });
});
