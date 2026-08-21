import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AIProcessor,
  MERGE_THRESHOLD,
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
    rejectionCriteria: ["Reject noise."],
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
});

describe("AIProcessor.mergeVerdict", () => {
  const p = new AIProcessor(makeFakePlugin() as any) as any;

  it("no eggs → read it, review summary", () => {
    const v = p.mergeVerdict([]);
    assert.equal(v.shouldRead, true);
    assert.ok(v.shouldReadReason.includes("No matching egg"));
  });

  it("all rejected → skip, with joined reject reasons", () => {
    const v = p.mergeVerdict([
      { rejected: true, rejectReason: "noise", readVerdict: false } as any,
      { rejected: true, rejectReason: "marketing", readVerdict: false } as any,
    ]);
    assert.equal(v.shouldRead, false);
    assert.ok(v.shouldReadReason.includes("noise"));
    assert.ok(v.shouldReadReason.includes("marketing"));
  });

  it("any readVerdict true → read", () => {
    const v = p.mergeVerdict([
      { rejected: false, readVerdict: false, readVerdictReason: "meh" } as any,
      { rejected: false, readVerdict: true, readVerdictReason: "novel" } as any,
    ]);
    assert.equal(v.shouldRead, true);
    assert.ok(v.shouldReadReason.includes("novel"));
  });

  it("none worth reading → skip with fallback reason", () => {
    const v = p.mergeVerdict([
      { rejected: false, readVerdict: false, readVerdictReason: "" } as any,
    ]);
    assert.equal(v.shouldRead, false);
    assert.ok(v.shouldReadReason.includes("No new knowledge"));
  });
});

describe("AIProcessor.analyze", () => {
  it("single egg: one combined call, all fields parsed", async () => {
    const responses = [
      JSON.stringify({
        titleVerdict: "Verdict.",
        coreSummary: ["b1", "b2", "b3", "b4"], // must be sliced to 3
        isLongForm: true,
        chapterMap: [
          { time: "00:10", title: "Ch1", summary: "s1" },
          { time: "", title: "", summary: "" }, // dropped by the filter
        ],
        keyQuestionAnswers: [{ question: "Is this new?", answer: "Yes" }],
        customQuestionAnswers: [{ question: "custom?", answer: "custom a" }],
        novelDelta: [
          { parent: "## X", content: "- new stuff" },
          { parent: "## Y", content: "" }, // dropped
        ],
        rejected: false,
        readVerdict: true,
        readVerdictReason: "has delta",
      }),
    ];
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: { chat: async () => responses[Math.min(calls++, responses.length - 1)] },
    });
    const result = await new AIProcessor(plugin as any).analyze(
      { ...capture, chapters: [{ time: "00:10", title: "Ch1" }], questions: ["custom?"] },
      [egg("one.md")]
    );
    assert.equal(calls, 1);
    assert.equal(result.titleVerdict, "Verdict.");
    assert.deepEqual(result.coreSummary, ["b1", "b2", "b3"]);
    assert.equal(result.chapterMap.length, 1);
    assert.equal(result.chapterMap[0].time, "00:10");
    assert.equal(result.customQuestionAnswers[0].answer, "custom a");
    assert.equal(result.eggResults.length, 1);
    assert.equal(result.eggResults[0].keyQuestionAnswers[0].answer, "Yes");
    assert.deepEqual(result.newKnowledge, [
      { egg: "one.md", parent: "## X", content: "- new stuff" },
    ]);
    assert.equal(result.shouldRead, true);
  });

  it("two eggs: one content call + one call per egg", async () => {
    const responses = [
      JSON.stringify({
        titleVerdict: "V.",
        coreSummary: [],
        isLongForm: false,
        chapterMap: [],
        customQuestionAnswers: [],
      }),
      JSON.stringify({
        keyQuestionAnswers: [{ question: "Is this new?", answer: "no" }],
        novelDelta: [],
        rejected: false,
        readVerdict: false,
        readVerdictReason: "redundant",
      }),
      JSON.stringify({
        keyQuestionAnswers: [],
        novelDelta: [{ parent: "", content: "- fresh" }],
        rejected: false,
        readVerdict: true,
        readVerdictReason: "new insight",
      }),
    ];
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: { chat: async () => responses[Math.min(calls++, responses.length - 1)] },
    });
    const result = await new AIProcessor(plugin as any).analyze(
      { ...capture },
      [egg("a.md"), egg("b.md")]
    );
    assert.equal(calls, 3);
    assert.equal(result.matchedEggs.length, 2);
    assert.equal(result.eggResults.length, 2);
    assert.equal(result.shouldRead, true);
    assert.deepEqual(result.newKnowledge, [
      { egg: "b.md", parent: "", content: "- fresh" },
    ]);
  });

  it("no API key → fallback result with unanswered questions", async () => {
    const plugin = makeFakePlugin({ settings: { aiApiKey: "" } });
    const result = await new AIProcessor(plugin as any).analyze(
      { ...capture, questions: ["Q?"] },
      []
    );
    assert.equal(result.shouldRead, true);
    assert.ok(result.shouldReadReason.includes("No API key"));
    assert.equal(result.customQuestionAnswers[0].answer, "No API key configured — cannot answer.");
    assert.deepEqual(result.newKnowledge, []);
  });

  it("typed AIError propagates out of the egg phase", async () => {
    const { AIError } = await import("../src/ai-client");
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async () => {
          throw new AIError("auth_failed", "Bad key", 401);
        },
      },
    });
    await assert.rejects(
      new AIProcessor(plugin as any).analyze({ ...capture }, [egg("a.md")]),
      (err: any) => err instanceof AIError && err.code === "auth_failed"
    );
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

describe("AIProcessor.analyze (chunked)", () => {
  // ~65k chars → 3 parts; two eggs → 3 content + 1 aggregate + 2×(3+1) = 12 calls
  const longContent = "word ".repeat(13000); // 65k chars

  function chunkResponses() {
    const contentPart = (i: number) =>
      JSON.stringify({
        titleVerdict: `V${i}`,
        coreSummary: [`part${i}-b1`, `part${i}-b2`],
        isLongForm: true,
        chapterMap: [{ time: "00:00", title: `Ch${i}`, summary: `s${i}` }],
        customQuestionAnswers: [],
      });
    const eggPart = (i: number) =>
      JSON.stringify({
        keyQuestionAnswers: [],
        novelDelta: [{ parent: "", content: `- delta from part ${i}` }],
        rejected: false,
        readVerdict: true,
        readVerdictReason: "novel",
      });
    return [
      contentPart(1), contentPart(2), contentPart(3),
      JSON.stringify({
        titleVerdict: "Overall verdict.",
        coreSummary: ["all-1", "all-2"],
        customQuestionAnswers: [{ question: "Q?", answer: "A" }],
      }),
      eggPart(1), eggPart(2), eggPart(3),
      JSON.stringify({
        keyQuestionAnswers: [{ question: "Is this new?", answer: "Yes" }],
        rejected: false,
        readVerdict: true,
        readVerdictReason: "adds insight",
      }),
      eggPart(1), eggPart(2), eggPart(3),
      JSON.stringify({
        keyQuestionAnswers: [],
        rejected: true,
        rejectReason: "noise for this egg",
        readVerdict: false,
        readVerdictReason: "",
      }),
    ];
  }

  it("runs per-part calls + aggregates and merges the results", async () => {
    const responses = chunkResponses();
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async () => responses[Math.min(calls++, responses.length - 1)],
      },
    });
    const result = await new AIProcessor(plugin as any).analyze(
      { ...capture, content: longContent, questions: ["Q?"] },
      [egg("a.md"), egg("b.md")]
    );
    assert.equal(calls, 12);
    assert.equal(result.titleVerdict, "Overall verdict.");
    assert.deepEqual(result.coreSummary, ["all-1", "all-2"]);
    assert.equal(result.chapterMap.length, 3, "chapter maps unioned");
    assert.equal(result.customQuestionAnswers[0].answer, "A");
    assert.equal(result.eggResults.length, 2);
    // deltas are the union of per-part deltas, deduped
    assert.deepEqual(
      result.newKnowledge.map((k) => k.content).sort(),
      [
        "- delta from part 1",
        "- delta from part 2",
        "- delta from part 3",
        "- delta from part 1",
        "- delta from part 2",
        "- delta from part 3",
      ].sort()
    );
    // verdict from the aggregate egg calls
    assert.equal(result.eggResults[0].keyQuestionAnswers[0].answer, "Yes");
    assert.equal(result.eggResults[1].rejected, true);
    assert.equal(result.shouldRead, true, "one egg says read");
  });

  it("short content still uses the single-pass pipeline", async () => {
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async () => (calls++, "{}"),
      },
    });
    await new AIProcessor(plugin as any).analyze({ ...capture }, [egg("a.md")]);
    assert.equal(calls, 1, "no chunking below the limit");
  });
});

describe("AIProcessor.maybeMergeEgg", () => {
  /** Egg file with `n` top-level entries in ## Unprocessed. */
  function unprocessedEgg(n: number): string {
    const entries = Array.from(
      { length: n },
      (_, i) => `- entry ${i + 1}`
    ).join("\n");
    return `## Knowledge\n\n- existing\n\n## Unprocessed\n\n${entries}\n`;
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
      content.includes("## Knowledge\n\n- existing\n  - merged 1\n  - merged 2"),
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
