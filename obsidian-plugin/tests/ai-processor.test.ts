import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AIProcessor, type EggContent } from "../src/ai-processor";
import { makeFakePlugin } from "./helpers";

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
