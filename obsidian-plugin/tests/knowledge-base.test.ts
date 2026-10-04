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

  it("saves numeric platform metadata from Bilibili and other Chinese extractors", async () => {
    const { kb, files } = makeKb();
    const fileName = await kb.saveRaw({
      ...base,
      sourceType: "bilibili",
      metadata: {
        platform: "bilibili", author: "视频作者", video_id: "BV1eVgA64EbW",
        cid: 117091965343752, part: 1, time_estimate_minutes: 12,
        image_count: 0, answer_count: 2, has_subtitles: false,
      },
    });
    const note = files.get(fileName)!;
    assert.ok(note.includes('cid: "117091965343752"'));
    assert.ok(note.includes('part: "1"'));
    assert.ok(note.includes('image_count: "0"'));
    assert.ok(note.includes('has_subtitles: "false"'));
    assert.ok(note.includes('answer_count: "2"'));
    assert.ok(note.includes('time_estimate_minutes: 12'));
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
      "a.md": "# Knowledge\n\n- existing a\n",
      "b.md": "# Knowledge\n\n- existing b\n",
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
    assert.ok(a.includes("# Unprocessed"));
    assert.ok(a.includes("- one"));
    assert.ok(a.includes("_author: Jane Doe_"));
    assert.ok(a.includes("_source: [Article Title](https://example.com/src)_"));
    assert.ok(b.includes("- two"));
    // Entries go to Unprocessed — the Knowledge tree is left alone
    assert.ok(!a.split("# Unprocessed")[0].includes("- one"));
  });

  it("removes playback timestamps and source quotes from hatched entries without changing originals or attribution", async () => {
    const { vault, files } = makeFakeVault({ "a.md": "# Knowledge\n\n# Unprocessed\n" });
    const kb = new KnowledgeBase({ app: { vault } } as any);
    const item = { egg: "a.md", content: "- **Advice** [12:34]\n  - Important answer (01:02:03–01:02:30).\n  - Another example 02:15.\n  - Linked example [03:20](https://example.com/video?t=200).\n  - Source location: 12:34 — Supporting evidence.\n  - Source location: 01:02:03\n  - Source location: paragraph 2 — Paragraph evidence.\n  - Source quote: Standalone evidence.\n  - Aspect ratio 16:9; wait 30 seconds.\n  - https://example.com/video?t=12:34" };
    const original = item.content;
    await kb.appendKnowledge([item], "Video", "https://example.com/video", "Author");
    const note = files.get("a.md")!;
    assert.ok(!note.includes("[12:34]"));
    assert.ok(!note.includes("01:02:03"));
    assert.ok(!note.includes("02:15"));
    assert.ok(!note.includes("?t=200"));
    assert.ok(!note.includes("Source location: 12:34"));
    for (const quote of ["Supporting evidence.", "Paragraph evidence.", "Standalone evidence.", "Source quote:"]) assert.ok(!note.includes(quote), quote);
    for (const text of ["Important answer", "Source location: paragraph 2", "16:9", "30 seconds", "https://example.com/video?t=12:34", "_author: Author_", "_source: [Video](https://example.com/video)_"]) assert.ok(note.includes(text), text);
    assert.equal(item.content, original);
  });

  it("omits the author line when unknown", async () => {
    const { vault, files } = makeFakeVault({ "a.md": "# Knowledge\n" });
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


describe("KnowledgeBase preserves original analysis", () => {
  it("stores and replaces results without changing captured content", async () => {
    const { kb, files } = makeKb();
    const original = { schemaVersion: 3, eggResults: [{ egg: "egg.md", extractedEntries: [{ content: "Distinct caveat", sources: [{ ref: "10:00" }] }] }] };
    const fileName = await kb.saveRaw({ url: "https://example.com", title: "Original", content: "Source text", sourceType: "article", processingResult: "unprocessed", analysis: original });
    assert.ok(files.get(fileName)!.includes(JSON.stringify(original, null, 2)));
    const updated = { ...original, readAction: "skip" };
    await kb.updateRawAnalysis(fileName, updated);
    const note = files.get(fileName)!;
    assert.ok(note.includes("Source text"));
    assert.ok(note.includes(JSON.stringify(updated, null, 2)));
    assert.equal(note.split("# NutEgg Analysis").length, 2);
  });
});
