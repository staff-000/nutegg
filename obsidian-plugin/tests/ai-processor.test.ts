import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AIProcessor,
  MERGE_THRESHOLD,
  repairTruncatedJson,
  sanitizeJsonString,
  type EggContent,
} from "../src/ai-processor";
import { EggParser } from "../src/egg-parser";
import { makeFakePlugin, makeFakeVault } from "./helpers";

function egg(fileName: string, overrides: Partial<EggContent> = {}): EggContent {
  return {
    fileName,
    topic: "Test",
    scope: "scope",
    actionGuide: "1. Title Verdict: one sentence.",
    keyQuestions: ["Is this new?"],
    worthReadingIf: [],
    skipIf: ["Reject noise."],
    formattingRules: "Keep the tree.",
    knowledge: "- existing\n",
    unprocessed: "",
    ...overrides,
  };
}

const capture = {
  url: "https://example.com/post",
  title: "Test Title",
  content: "Some content.",
  sourceType: "article",
};

describe("AIProcessor.parseJson", () => {
  const p = new AIProcessor(makeFakePlugin() as any) as any;

  it("parses plain JSON", () => {
    assert.deepEqual(p.parseJson('{"a": 1}'), { a: 1 });
  });

  it("strips markdown fences", () => {
    assert.deepEqual(p.parseJson('```json\n{"b": 2}\n```'), { b: 2 });
  });

  it("extracts the outermost object from surrounding text", () => {
    assert.deepEqual(p.parseJson('Here it is: {"c": 3} thanks'), { c: 3 });
  });

  it("returns {} for unparseable responses", () => {
    assert.deepEqual(p.parseJson("no json here"), {});
  });
});

describe("AIProcessor.parseKeyAnswers", () => {
  const p = new AIProcessor(makeFakePlugin() as any) as any;

  it("filters to complete Q/A pairs and stringifies", () => {
    const out = p.parseKeyAnswers([
      { question: "q1", answer: "a1" },
      { question: "", answer: "a2" },
      { question: "q3" },
      "garbage",
    ]);
    assert.deepEqual(out, [{ question: "q1", answer: "a1" }]);
  });

  it("handles non-arrays", () => {
    assert.deepEqual(p.parseKeyAnswers(undefined), []);
    assert.deepEqual(p.parseKeyAnswers({}), []);
  });

  it("extracts and normalizes sources citations", () => {
    const out = p.parseKeyAnswers([
      {
        question: "How does it work?",
        answer: "By using attention.",
        sources: [
          { ref: " 12:34 ", quote: " attention is all you need " },
          { section: " Methodology ", quote: " we trained a transformer " },
          { ref: "" },
          null,
        ],
      },
      {
        question: "Not covered?",
        answer: "Not covered in this content",
        sources: [],
      },
    ]);

    assert.deepEqual(out, [
      {
        question: "How does it work?",
        answer: "By using attention.",
        sources: [
          { ref: "12:34", quote: "attention is all you need" },
          { ref: "Methodology", quote: "we trained a transformer" },
        ],
      },
      {
        question: "Not covered?",
        answer: "Not covered in this content",
      },
    ]);
  });
});

describe("AIProcessor.parseMindMap", () => {
  const p = new AIProcessor(makeFakePlugin() as any) as any;

  it("handles non-arrays or empty inputs", () => {
    assert.deepEqual(p.parseMindMap(undefined), []);
    assert.deepEqual(p.parseMindMap(null), []);
    assert.deepEqual(p.parseMindMap({}), []);
    assert.deepEqual(p.parseMindMap("invalid"), []);
    assert.deepEqual(p.parseMindMap([]), []);
  });

  it("parses flat and hierarchical mind map nodes", () => {
    const raw = [
      {
        name: " Core Problem ",
        detail: " Batch latency is too high. ",
      },
      {
        title: " Architecture Design ",
        description: " Event-driven microservices. ",
        children: [
          {
            topic: " Ingestion Layer ",
            summary: " Kafka cluster for stream buffering. ",
          },
          {
            name: " Processing Nodes ",
            children: [
              {
                name: " Flink Workers ",
                detail: " Real-time stateful computation. ",
              },
            ],
          },
        ],
      },
      null,
      {},
      { invalid: "no name or title" },
    ];

    const out = p.parseMindMap(raw);
    assert.deepEqual(out, [
      {
        name: "Core Problem",
        detail: "Batch latency is too high.",
      },
      {
        name: "Architecture Design",
        detail: "Event-driven microservices.",
        children: [
          {
            name: "Ingestion Layer",
            detail: "Kafka cluster for stream buffering.",
          },
          {
            name: "Processing Nodes",
            children: [
              {
                name: "Flink Workers",
                detail: "Real-time stateful computation.",
              },
            ],
          },
        ],
      },
    ]);
  });

  it("parses flexible branch counts up to 3 levels deep per updated prompt", () => {
    const raw = [
      {
        name: "Branch 1",
        detail: "First main branch",
        children: [
          {
            name: "Branch 1.1",
            detail: "Second level detail",
            children: [
              {
                name: "Branch 1.1.1",
                detail: "Third level leaf node",
              },
            ],
          },
        ],
      },
      {
        name: "Branch 2",
        detail: "Second main branch without sub-branches",
      },
    ];
    const out = p.parseMindMap(raw);
    assert.equal(out.length, 2);
    assert.equal(out[0].name, "Branch 1");
    assert.equal(out[0].children?.length, 1);
    assert.equal(out[0].children?.[0].children?.length, 1);
    assert.equal(out[0].children?.[0].children?.[0].name, "Branch 1.1.1");
    assert.equal(out[1].name, "Branch 2");
    assert.equal(out[1].children, undefined);
  });

  it("prevents runaway recursion depth", () => {
    let deepNode: any = { name: "level 6" };
    for (let i = 5; i >= 0; i--) {
      deepNode = { name: `level ${i}`, children: [deepNode] };
    }
    const out = p.parseMindMap([deepNode]);
    assert.equal(out.length, 1);
    // depth > 5 is cut off
    let current = out[0];
    let depth = 0;
    while (current.children && current.children.length > 0) {
      depth++;
      current = current.children[0];
    }
    assert.ok(depth <= 5);
  });
});

describe("AIProcessor.askFollowUp", () => {
  it("answers every question, filling in skipped ones", async () => {
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async () =>
          JSON.stringify({ answers: [{ question: "Q1?", answer: "A1" }] }),
      },
    });
    const out = await new AIProcessor(plugin as any).askFollowUp(
      capture,
      ["Q1?", "Q2?"],
      [{ question: "Prior?", answer: "Prior A" }]
    );
    assert.equal(out.length, 2);
    assert.equal(out[0].answer, "A1");
    assert.equal(out[1].answer, "No answer returned — please try again.");
  });

  it("no API key → placeholder answers", async () => {
    const plugin = makeFakePlugin({ settings: { aiApiKey: "" } });
    const out = await new AIProcessor(plugin as any).askFollowUp(
      capture,
      ["Q?"],
      []
    );
    assert.equal(out[0].answer, "No API key configured — cannot answer.");
  });

  it("empty question list → empty result, no AI call", async () => {
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: { chat: async () => (calls++, "{}") },
    });
    const out = await new AIProcessor(plugin as any).askFollowUp(capture, [], []);
    assert.deepEqual(out, []);
    assert.equal(calls, 0);
  });

  it("passes scope 'within' by default and retains grounding rule", async () => {
    let capturedPrompt = "";
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async (prompt: string) => {
          capturedPrompt = prompt;
          return JSON.stringify({ answers: [{ question: "Q1?", answer: "A1" }] });
        },
      },
    });
    const out = await new AIProcessor(plugin as any).askFollowUp(capture, ["Q1?"]);
    assert.equal(out[0].scope, "within");
    assert.ok(capturedPrompt.includes("- Grounding:"));
  });

  it("passes scope 'beyond' and completely removes grounding rule", async () => {
    let capturedPrompt = "";
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async (prompt: string) => {
          capturedPrompt = prompt;
          return JSON.stringify({ answers: [{ question: "Fact check?", answer: "Verified" }] });
        },
      },
    });
    const out = await new AIProcessor(plugin as any).askFollowUp(capture, ["Fact check?"], [], "beyond");
    assert.equal(out[0].scope, "beyond");
    assert.equal(capturedPrompt.includes("- Grounding:"), false);
    assert.ok(capturedPrompt.includes("Global Mode"));
    assert.ok(capturedPrompt.includes("- Output Language:"));
  });

  it("handles priorQa as a formatted string without throwing priorQa.map is not a function", async () => {
    let capturedPrompt = "";
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async (prompt: string) => {
          capturedPrompt = prompt;
          return JSON.stringify({ answers: [{ question: "Next question?", answer: "Answer" }] });
        },
      },
    });
    const stringPriorQa = "Q: Earlier question?\nA: Earlier answer.";
    const out = await new AIProcessor(plugin as any).askFollowUp(capture, ["Next question?"], stringPriorQa as any);
    assert.equal(out[0].answer, "Answer");
    assert.ok(capturedPrompt.includes("Q: Earlier question?"));
    assert.ok(capturedPrompt.includes("A: Earlier answer."));
  });

  it("handles priorQa as an array of objects correctly", async () => {
    let capturedPrompt = "";
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async (prompt: string) => {
          capturedPrompt = prompt;
          return JSON.stringify({ answers: [{ question: "Followup?", answer: "Followup Ans" }] });
        },
      },
    });
    const arrayPriorQa = [{ question: "What is X?", answer: "X is Y." }];
    const out = await new AIProcessor(plugin as any).askFollowUp(capture, ["Followup?"], arrayPriorQa);
    assert.equal(out[0].answer, "Followup Ans");
    assert.ok(capturedPrompt.includes("Q: What is X?"));
    assert.ok(capturedPrompt.includes("A: X is Y."));
  });
});

describe("AIProcessor.chunkContent", () => {
  const p = new AIProcessor(makeFakePlugin() as any) as any;

  it("returns one chunk for content under the limit", () => {
    const chunks = p.chunkContent("short", [{ time: "00:01", title: "C1" }]);
    assert.equal(chunks.length, 1);
    assert.deepEqual(chunks[0].chapters, [{ time: "00:01", title: "C1" }]);
  });

  it("splits plain text at paragraph boundaries", () => {
    const para = "x".repeat(10000);
    const content = [para, para, para, para].join("\n\n"); // 4 × 10k paras
    const chunks = p.chunkContent(content, []);
    assert.ok(chunks.length >= 2);
    assert.ok(chunks.every((c: any) => c.content.length <= 30000));
    assert.ok(chunks[0].content.includes(para));
  });

  it("hard-splits a single oversized paragraph", () => {
    const chunks = p.chunkContent("y".repeat(65000), []);
    assert.ok(chunks.length >= 3);
    assert.ok(chunks.every((c: any) => c.content.length <= 30000));
  });

  it("splits timestamped transcripts and keeps the preamble in part 1", () => {
    const lines = ["# Title", "", "**Channel:** X", ""];
    for (let m = 0; m < 50; m++) {
      // 50 minutes × 20 lines × ~45 chars ≈ 45k chars → must split
      for (let s = 0; s < 20; s++) {
        lines.push(`[${String(m).padStart(2, "0")}:${String(s * 3).padStart(2, "0")}] caption text line with words`);
      }
    }
    const content = lines.join("\n");
    const chunks = p.chunkContent(content, []);
    assert.ok(chunks.length >= 2, "long timestamped content must split");
    assert.ok(chunks[0].content.includes("# Title"), "preamble in part 1");
    assert.ok(chunks.every((c: any) => c.startTime !== ""));
    assert.ok(chunks.every((c: any) => c.content.length <= 30000 + 1000));
  });

  it("attaches chapters to the chunk covering their start time", () => {
    const lines = [];
    for (let m = 0; m < 50; m++) {
      for (let s = 0; s < 20; s++) {
        lines.push(`[${String(m).padStart(2, "0")}:${String(s * 3).padStart(2, "0")}] some caption text with words`);
      }
    }
    const chapters = [
      { time: "05:00", title: "Early" },
      // The chunk boundary lands around minute 40 — pick a chapter clearly
      // inside the second chunk's time range.
      { time: "48:00", title: "Late" },
    ];
    const chunks = p.chunkContent(lines.join("\n"), chapters);
    const early = chunks.find((c: any) => c.chapters.some((ch: any) => ch.title === "Early"));
    const late = chunks.find((c: any) => c.chapters.some((ch: any) => ch.title === "Late"));
    assert.ok(early, "Early chapter assigned to some chunk");
    assert.ok(late, "Late chapter assigned to some chunk");
    assert.notEqual(
      early?.startTime,
      late?.startTime,
      "chapters in different time ranges land in different chunks"
    );
    // Real chapters → no section grid
    assert.ok(chunks.every((c: any) => c.sections.length === 0));
  });

  it("gives videos WITHOUT chapters a 5-minute section grid per chunk", () => {
    const lines = [];
    for (let m = 0; m < 47; m++) {
      for (let s = 0; s < 20; s++) {
        lines.push(`[${String(m).padStart(2, "0")}:${String(s * 3).padStart(2, "0")}] some caption text with words`);
      }
    }
    const chunks = p.chunkContent(lines.join("\n"), []);
    const allSections = chunks.flatMap((c: any) => c.sections);
    assert.ok(allSections.length >= 8, "grid covers the whole video");
    assert.equal(allSections[0], "00:00");
    assert.ok(
      allSections.includes("40:00"),
      "sections continue past the first chunk boundary"
    );
    // No gaps: every 5 minutes from the first section
    for (let i = 1; i < allSections.length; i++) {
      assert.equal(
        p.toSeconds(allSections[i]) - p.toSeconds(allSections[i - 1]),
        300,
        `sections are a continuous 5-minute grid (${allSections[i - 1]} → ${allSections[i]})`
      );
    }
  });

  it("short timestamped videos get a grid too (single chunk)", () => {
    const lines = [];
    for (let m = 0; m < 8; m++) {
      lines.push(`[0${m}:00] short caption line here`);
    }
    const chunks = p.chunkContent(lines.join("\n"), []);
    assert.equal(chunks.length, 1);
    assert.deepEqual(chunks[0].sections, ["00:00", "05:00"]);
  });

  it("respects custom chunkWindowChars setting", () => {
    const customPlugin = makeFakePlugin({
      settings: { chunkWindowChars: 1500 },
    });
    const customP = new AIProcessor(customPlugin as any) as any;
    const text = "a".repeat(1000) + "\n\n" + "b".repeat(1000);
    const chunks = customP.chunkContent(text, []);
    assert.equal(chunks.length, 2);
  });

  it("respects custom sectionGridSeconds setting", () => {
    const customPlugin = makeFakePlugin({
      settings: { sectionGridSeconds: 120 },
    });
    const customP = new AIProcessor(customPlugin as any) as any;
    const lines = [];
    for (let m = 0; m < 6; m++) {
      lines.push(`[0${m}:00] caption text line`);
    }
    const chunks = customP.chunkContent(lines.join("\n"), []);
    assert.equal(chunks.length, 1);
    assert.deepEqual(chunks[0].sections, ["00:00", "02:00", "04:00"]);
  });
});

describe("AIProcessor.completeChapterMap", () => {
  const p = new AIProcessor(makeFakePlugin() as any) as any;

  it("passes entries through when no section grid is provided", () => {
    const parsed = [{ time: "00:12", title: "X", summary: "s" }];
    assert.deepEqual(p.completeChapterMap(parsed, undefined), parsed);
  });

  it("keeps AI titles for matching sections and backfills the rest", () => {
    const parsed = [
      { time: "00:00", title: "Intro", summary: "a" },
      { time: "10:00", title: "Middle", summary: "c" },
    ];
    const out = p.completeChapterMap(parsed, [
      "00:00", "05:00", "10:00", "15:00",
    ]);
    assert.equal(out.length, 4, "one entry per section, guaranteed");
    assert.deepEqual(out[0], { time: "00:00", title: "Intro", summary: "a" });
    assert.deepEqual(out[1], { time: "05:00", title: "", summary: "" });
    assert.deepEqual(out[2], { time: "10:00", title: "Middle", summary: "c" });
    assert.deepEqual(out[3], { time: "15:00", title: "", summary: "" });
  });

  it("drops AI entries whose time is not on the grid", () => {
    const parsed = [
      { time: "00:04", title: "Off-grid", summary: "x" },
      { time: "05:00", title: "On-grid", summary: "y" },
    ];
    const out = p.completeChapterMap(parsed, ["00:00", "05:00"]);
    assert.deepEqual(out, [
      { time: "00:00", title: "", summary: "" },
      { time: "05:00", title: "On-grid", summary: "y" },
    ]);
  });
});

describe("repairTruncatedJson", () => {
  it("returns balanced json unchanged", () => {
    const input = '{"titleVerdict": "Hello", "coreSummary": ["A", "B"]}';
    assert.equal(repairTruncatedJson(input), input);
  });

  it("repairs JSON truncated inside an array string", () => {
    const input = '{"titleVerdict": "Done", "coreSummary": ["First", "Seco';
    const repaired = repairTruncatedJson(input);
    assert.ok(repaired);
    const parsed = JSON.parse(repaired!);
    assert.equal(parsed.titleVerdict, "Done");
    assert.deepEqual(parsed.coreSummary, ["First", "Seco"]);
  });

  it("repairs JSON truncated inside an object within an array", () => {
    const input = '{"titleVerdict": "V", "chapterMap": [{"time": "00:00", "title": "Intro", "summary": "One"}, {"time": "05:00", "title": "Part 2"';
    const repaired = repairTruncatedJson(input);
    assert.ok(repaired);
    const parsed = JSON.parse(repaired!);
    assert.equal(parsed.titleVerdict, "V");
    assert.equal(parsed.chapterMap.length, 2);
    assert.equal(parsed.chapterMap[0].title, "Intro");
    assert.equal(parsed.chapterMap[1].title, "Part 2");
  });

  it("repairs JSON truncated after a trailing comma", () => {
    const input = '{"titleVerdict": "V", "coreSummary": ["One"], ';
    const repaired = repairTruncatedJson(input);
    assert.ok(repaired);
    const parsed = JSON.parse(repaired!);
    assert.equal(parsed.titleVerdict, "V");
    assert.deepEqual(parsed.coreSummary, ["One"]);
  });

  it("repairs JSON truncated mid-key", () => {
    const input = '{"titleVerdict": "V", "coreSummary": ["One"], "chapter';
    const repaired = repairTruncatedJson(input);
    assert.ok(repaired);
    const parsed = JSON.parse(repaired!);
    assert.equal(parsed.titleVerdict, "V");
    assert.deepEqual(parsed.coreSummary, ["One"]);
  });
});

describe("sanitizeJsonString", () => {
  it("escapes raw newlines and tabs inside string literals", () => {
    const raw = '{"content": "- **Concept**: first line\n  - second line\twith tab\r\n  - third line"}';
    const sanitized = sanitizeJsonString(raw);
    const parsed = JSON.parse(sanitized);
    assert.equal(
      parsed.content,
      "- **Concept**: first line\n  - second line\twith tab\r\n  - third line"
    );
  });

  it("removes trailing commas before closing braces and brackets", () => {
    const raw = '{"a": 1, "b": [2, 3, ], }';
    const sanitized = sanitizeJsonString(raw);
    const parsed = JSON.parse(sanitized);
    assert.equal(parsed.a, 1);
    assert.deepEqual(parsed.b, [2, 3]);
  });
});

describe("AIProcessor.localizeEggTemplate", () => {
  it("returns stripped localized template and detected language when AI produces valid egg content", async () => {
    let sentPrompt = "";
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async (prompt: string) => {
          sentPrompt = prompt;
          return "```markdown\n---\ntopic: \"方法论\"\nstatus: \"active\"\nlast_updated: \"2026-09-12\"\nlanguage: \"Chinese\"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** 介绍做事的具体方法\n>\n> **Action Guide:**\n> 1. Title Verdict: 核心结论\n\n# Knowledge\n\n# Unprocessed\n```";
        },
      },
    });
    const templateInput = "---\ntopic: \"Unknown\"\nstatus: \"active\"\nlast_updated: \"2026-08-14\"\nlanguage: \"English\"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** T\n>\n> **Action Guide:**\n> 1. Title Verdict: T\n\n# Knowledge\n\n# Unprocessed";
    const out = await new AIProcessor(plugin as any).localizeEggTemplate(
      templateInput,
      "介绍做事的具体方法"
    );
    assert.ok(out);
    assert.equal(out.language, "Chinese");
    assert.ok(out.content.includes("language: \"Chinese\""));
    assert.ok(out.content.includes("**Scope:** 介绍做事的具体方法"));
    assert.ok(out.content.includes("**Action Guide:**"));
    assert.ok(out.content.includes("# Knowledge"));
    assert.ok(out.content.includes("# Unprocessed"));
    assert.ok(!out.content.includes("```"));
    assert.ok(sentPrompt.includes("介绍做事的具体方法"));
    assert.ok(sentPrompt.includes(templateInput));
  });

  it("returns null when AI output is invalid or missing required markers", async () => {
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async () => "Sorry, I cannot do that.",
      },
    });
    const out = await new AIProcessor(plugin as any).localizeEggTemplate(
      "bad template",
      "test"
    );
    assert.equal(out, null);
  });

  it("returns null when no API key is configured", async () => {
    const noKey = makeFakePlugin({ settings: { aiApiKey: "" } });
    const out = await new AIProcessor(noKey as any).localizeEggTemplate(
      "template",
      "desc"
    );
    assert.equal(out, null);
  });
});

describe("AIProcessor.maybeMergeEgg", () => {
  /** Egg file with `n` top-level entries in # Unprocessed. */
  function unprocessedEgg(n: number): string {
    const entries = Array.from(
      { length: n },
      (_, i) => `- entry ${i + 1}`
    ).join("\n");
    return `---\nlanguage: "English"\n---\n\n# Knowledge\n\n- existing\n\n# Unprocessed\n\n${entries}\n`;
  }

  function makeProcessor(
    files: Record<string, string>,
    overrides: any = {}
  ) {
    const store = makeFakeVault(files);
    const plugin = makeFakePlugin({ vault: store.vault, ...overrides });
    plugin.eggParser = new EggParser(plugin as any);
    return { p: new AIProcessor(plugin as any), files: store.files };
  }

  it("exports MERGE_THRESHOLD = 20", () => {
    assert.equal(MERGE_THRESHOLD, 20);
  });

  it("does nothing below the threshold (no AI call)", async () => {
    let calls = 0;
    const { p } = makeProcessor(
      { "egg.md": unprocessedEgg(19) },
      { aiClient: { chat: async () => (calls++, "{}") } }
    );
    const out = await p.maybeMergeEgg("egg.md");
    assert.equal(out, null);
    assert.equal(calls, 0);
  });

  it("merges 20 entries into the tree via one AI call", async () => {
    let seenPrompt = "";
    const { p, files } = makeProcessor(
      { "egg.md": unprocessedEgg(20) },
      {
        aiClient: {
          chat: async (prompt: string) => {
            seenPrompt = prompt;
            return JSON.stringify({
              knowledge: "- existing\n  - merged 1\n  - merged 2",
              unprocessed: "",
            });
          },
        },
      }
    );
    const out = await p.maybeMergeEgg("egg.md");
    assert.deepEqual(out, { egg: "egg.md", entries: 20 });
    const content = files.get("egg.md")!;
    assert.ok(
      content.includes("# Knowledge\n\n- existing\n  - merged 1\n  - merged 2"),
      "Knowledge tree replaced with the merged output"
    );
    assert.ok(!content.includes("- entry 1"), "Unprocessed entries consumed");
    // The prompt carries the tree + the entries to merge
    assert.ok(seenPrompt.includes("- existing"));
    assert.ok(seenPrompt.includes("- entry 20"));
  });

  it("leaves the egg untouched when the AI returns no knowledge", async () => {
    const { p, files } = makeProcessor(
      { "egg.md": unprocessedEgg(20) },
      { aiClient: { chat: async () => JSON.stringify({ unprocessed: "x" }) } }
    );
    const before = files.get("egg.md")!;
    const out = await p.maybeMergeEgg("egg.md");
    assert.equal(out, null);
    assert.equal(files.get("egg.md"), before);
  });

  it("skips the merge without an API key", async () => {
    let calls = 0;
    const { p } = makeProcessor(
      { "egg.md": unprocessedEgg(20) },
      {
        settings: { aiApiKey: "" },
        aiClient: { chat: async () => (calls++, "{}") },
      }
    );
    assert.equal(await p.maybeMergeEgg("egg.md"), null);
    assert.equal(calls, 0);
  });

  it("returns null for a missing egg file", async () => {
    const { p } = makeProcessor({});
    assert.equal(await p.maybeMergeEgg("nope.md"), null);
  });

  it("mergeEgg merges on demand even with few entries (e.g. 3 entries)", async () => {
    const { p, files } = makeProcessor(
      { "egg.md": unprocessedEgg(3) },
      {
        aiClient: {
          chat: async () =>
            JSON.stringify({
              knowledge: "- existing\n  - merged item",
              unprocessed: "",
            }),
        },
      }
    );
    const out = await p.mergeEgg("egg.md");
    assert.deepEqual(out, { egg: "egg.md", entries: 3 });
    const content = files.get("egg.md")!;
    assert.ok(content.includes("- merged item"));
    assert.ok(!content.includes("- entry 1"));
  });

  it("mergeEgg returns null when there are 0 unprocessed entries", async () => {
    let calls = 0;
    const { p } = makeProcessor(
      { "egg.md": unprocessedEgg(0) },
      { aiClient: { chat: async () => (calls++, "{}") } }
    );
    const out = await p.mergeEgg("egg.md");
    assert.equal(out, null);
    assert.equal(calls, 0);
  });
});

describe("AIProcessor prompt building helpers", () => {
  const p = new AIProcessor(makeFakePlugin() as any) as any;

  it("chaptersBlock builds the timestamped list or empty", () => {
    assert.equal(
      p.chaptersBlock([{ time: "00:10", title: "Intro" }]),
      "## Video Chapters (use these EXACT timestamps)\n- 00:10 — Intro"
    );
    assert.equal(p.chaptersBlock([]), "");
    assert.equal(p.chaptersBlock(undefined), "");
  });

  it("questionsBlock numbers questions under a heading or empty", () => {
    assert.equal(
      p.questionsBlock(["a", "b"], "Custom"),
      "## Custom\n1. a\n2. b"
    );
    assert.equal(p.questionsBlock([], "Custom"), "");
  });
});

describe("AIProcessor Output Language Rules", () => {
  it("content analysis follows outputLanguage setting or capture payload", () => {
    const pluginSame = makeFakePlugin({
      settings: { outputLanguage: "same-as-content" },
    });
    const pSame = new AIProcessor(pluginSame as any) as any;
    const ruleSame = pSame.getContentOutputRules();
    assert.ok(
      ruleSame.includes("the same language as the captured content"),
      `expected rule to specify same language as captured content, got: ${ruleSame}`
    );

    const pluginZh = makeFakePlugin({
      settings: { outputLanguage: "Chinese" },
    });
    const pZh = new AIProcessor(pluginZh as any) as any;
    const ruleZh = pZh.getContentOutputRules();
    assert.ok(
      ruleZh.includes("Chinese"),
      `expected rule to specify Chinese, got: ${ruleZh}`
    );

    // Payload outputLanguage overrides host settings
    const rulePayload = pZh.getContentOutputRules({ outputLanguage: "Spanish" } as any);
    assert.ok(
      rulePayload.includes("Spanish"),
      `expected payload outputLanguage to override host settings, got: ${rulePayload}`
    );
  });

  it("egg analysis follows the egg language property, falling back to outputLanguage setting or egg knowledge", () => {
    const plugin = makeFakePlugin({
      settings: { outputLanguage: "English" },
    });
    const p = new AIProcessor(plugin as any) as any;

    const eggWithLang = {
      fileName: "ml.md",
      language: "Chinese",
      indexDescription: "machine learning notes",
    };
    const ruleWithLang = p.getEggOutputRules(eggWithLang);
    assert.ok(
      ruleWithLang.includes("Chinese"),
      `expected egg rule to follow egg.language, got: ${ruleWithLang}`
    );

    const ruleWithStringLang = p.getEggOutputRules("Japanese");
    assert.ok(
      ruleWithStringLang.includes("Japanese"),
      `expected rule to use language directly, got: ${ruleWithStringLang}`
    );

    const eggWithoutLang = {
      fileName: "test.md",
      language: "",
      indexDescription: "machine learning notes",
    };
    const ruleWithSetting = p.getEggOutputRules(eggWithoutLang);
    assert.ok(
      ruleWithSetting.includes("English"),
      `expected fallback to outputLanguage setting when language is empty, got: ${ruleWithSetting}`
    );

    const pluginNoSetting = makeFakePlugin({
      settings: { outputLanguage: "same-as-content" },
    });
    const pNoSetting = new AIProcessor(pluginNoSetting as any) as any;
    const ruleNoSetting = pNoSetting.getEggOutputRules(eggWithoutLang);
    assert.ok(
      ruleNoSetting.includes("the same language as the captured content"),
      `expected fallback to egg knowledge when setting is same-as-content, got: ${ruleNoSetting}`
    );
  });

  it("analyzeAgainstEgg returns language without mutating the egg before Hatch", async () => {
    const { vault } = makeFakeVault({
      "nutegg/ml.md": `---\ntopic: "ML"\n---\n\n# Knowledge\n\n# Unprocessed\n`,
    });
    const plugin = makeFakePlugin({
      vault,
      settings: { outputLanguage: "same-as-content" },
    } as any);
    const p = new AIProcessor(plugin as any) as any;
    p.callAI = async (prompt: string) => {
      if (prompt.includes("Analyze this source according to the instructions")) {
        return JSON.stringify({
          language: "Chinese",
          keyQuestionAnswers: [],
          extractedEntries: [
            { kind: "insight", content: "- **深度学习**: 神经网络方法" },
          ],
        });
      }
      return JSON.stringify({
        extractedEntries: [{ parent: "", content: "- **深度学习**: 神经网络方法" }],
        redundantEntries: [],
        rejected: false,
        readVerdict: true,
      });
    };

    const egg = {
      fileName: "nutegg/ml.md",
      topic: "ML",
      language: "",
      scope: "",
      actionGuide: "",
      keyQuestions: [],
      worthReadingIf: [],
    skipIf: [],
      formattingRules: "",
      knowledge: "",
      unprocessed: "",
      indexDescription: "",
    };

    const result = await p.analyzeAgainstEgg(
      { title: "Test", url: "https://example.com", content: "Test content", sourceType: "article" },
      egg
    );

    assert.ok(result);
    assert.equal(result.language, "Chinese");
    assert.equal(egg.language, "");

    const fileContent = await vault.adapter.read("nutegg/ml.md");
    assert.ok(!fileContent.includes('language: "Chinese"'));
  });
});

