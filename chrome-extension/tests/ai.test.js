// ============================================================
// NutEgg Chrome Extension AI Unit Tests (Testing ai-core.js bundle)
// ============================================================

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const bundlePath = path.join(__dirname, "../src/ai/ai-core.js");
const bundleCode = fs.readFileSync(bundlePath, "utf8");
const NutEggAI = new Function(bundleCode + "\nreturn NutEggAI;")();

const {
  renderPrompt,
  chunkContent,
  parseJson,
  PROVIDER_CATALOG,
  resolveConfig,
  AIProcessor,
} = NutEggAI;

test("AI Processor - renderPrompt", () => {
  const tpl = "Hello {{name}}, welcome to {{place}}! Unknown: {{missing}}";
  const rendered = renderPrompt(tpl, { name: "NutEgg", place: "Chrome" });
  assert.equal(rendered, "Hello NutEgg, welcome to Chrome! Unknown: ");
});

test("AI Processor - parseJson handles code fences", () => {
  const fenced = '```json\n{"titleVerdict": "Yes", "coreSummary": ["item 1"]}\n```';
  const parsed = parseJson(fenced);
  assert.deepEqual(parsed, { titleVerdict: "Yes", coreSummary: ["item 1"] });
});

test("AI Processor - parseJson handles unescaped control chars and trailing commas", () => {
  const malformed = '{\n  "titleVerdict": "Multi\nLine",\n  "coreSummary": ["item 1",],\n}';
  const parsed = parseJson(malformed);
  assert.ok(parsed);
  assert.equal(parsed.titleVerdict, "Multi\nLine");
  assert.equal(parsed.coreSummary.length, 1);
});

test("AI Processor - chunkContent handles short content", () => {
  const short = "This is a short article under threshold.";
  const chunks = chunkContent(short, []);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].content, short);
});

test("AI Processor - chunkContent splits timestamped transcripts", () => {
  const lines = [];
  for (let i = 0; i < 200; i++) {
    lines.push(`[${String(i).padStart(2, "0")}:00] Line of speech number ${i} with extra text to expand length.`);
  }
  const full = lines.join("\n");
  const chunks = chunkContent(full, [{ time: "05:00", title: "Chapter 1" }], 1000);
  assert.ok(chunks.length > 1);
  assert.equal(chunks[0].index, 0);
  assert.equal(chunks[chunks.length - 1].index, chunks.length - 1);
});

test("AI Client - PROVIDER_CATALOG completeness", () => {
  const expected = ["gemini", "openai", "anthropic", "deepseek", "openrouter", "kimi", "zhipu", "qwen", "local"];
  for (const id of expected) {
    assert.ok(PROVIDER_CATALOG[id], `Missing provider ${id}`);
    assert.ok(PROVIDER_CATALOG[id].officialEndpoint, `Missing endpoint for ${id}`);
  }
});

test("AI Client - resolveConfig default to Gemini / Anthropic", () => {
  const conf = resolveConfig({});
  assert.ok(conf.provider);
  assert.ok(conf.endpoint);
});

test("AI Client - resolveConfig OpenRouter", () => {
  const conf = resolveConfig({ chromeAiProvider: "openrouter", chromeAiApiKey: "sk-or-test" });
  assert.equal(conf.provider, "openrouter");
  assert.equal(conf.apiKey, "sk-or-test");
  assert.ok(conf.extraHeaders["HTTP-Referer"]);
});

test("AI Processor - AIProcessor class available in Chrome bundle", () => {
  assert.ok(AIProcessor);
  const processor = new AIProcessor({});
  assert.equal(typeof processor.analyzeContent, "function");
  assert.equal(typeof processor.analyzeEggs, "function");
  assert.equal(typeof processor.analyze, "function");
});

test("AI Processor - follows outputLanguage setting", () => {
  const processorDefault = new AIProcessor({ settings: {} });
  const rulesDefault = processorDefault.getContentOutputRules();
  assert.ok(rulesDefault.includes("the same language as the captured content"));

  const processorZh = new AIProcessor({ settings: { outputLanguage: "Chinese" } });
  const rulesZh = processorZh.getContentOutputRules();
  assert.ok(rulesZh.includes("Chinese"));
  assert.ok(rulesZh.includes("translate into Chinese"));

  // Payload outputLanguage overrides settings
  const rulesPayload = processorZh.getContentOutputRules({ outputLanguage: "Japanese" });
  assert.ok(rulesPayload.includes("Japanese"));
  assert.ok(rulesPayload.includes("translate into Japanese"));
});

test("AI Processor - respects promptOverrides in standalone settings", () => {
  const customTpl = "CUSTOM CONTENT ANALYSIS TEMPLATE {{title}}";
  const processor = new AIProcessor({
    settings: {
      chromeAiPromptOverrides: {
        contentAnalysis: customTpl,
      },
    },
  });
  assert.equal(processor.getPrompt("contentAnalysis"), customTpl);
});

test("AI Processor - updated mind map prompt instructions", () => {
  const { PROMPTS } = NutEggAI;
  assert.ok(PROMPTS.contentTaskDefault.includes("Mind Map"));
  assert.ok(PROMPTS.contentTaskDefault.includes("up to 3 levels deep"));
  assert.ok(PROMPTS.contentAnalysis.includes('"mindMap"'));
  assert.ok(PROMPTS.contentAnalysis.includes("up to 3 levels deep total"));
  assert.ok(PROMPTS.aggregateContent.includes('"mindMap"'));
  assert.ok(PROMPTS.aggregateContent.includes("synthesized concept tree for the entire work, up to 3 levels deep"));
});

test("AI Processor - parseMindMap in Chrome bundle handles up to 3 levels deep", () => {
  const processor = new AIProcessor({});
  const raw = [
    {
      name: "Root",
      detail: "Root concept",
      children: [
        {
          name: "Sub",
          detail: "Sub concept",
          children: [{ name: "Leaf", detail: "Leaf detail" }],
        },
      ],
    },
  ];
  const out = processor.parseMindMap(raw);
  assert.equal(out.length, 1);
  assert.equal(out[0].name, "Root");
  assert.equal(out[0].children[0].name, "Sub");
  assert.equal(out[0].children[0].children[0].name, "Leaf");
});

test("Analysis Sections - DEFAULT_ANALYSIS_SECTIONS has all sections enabled", () => {
  const { DEFAULT_ANALYSIS_SECTIONS } = NutEggAI;
  assert.ok(DEFAULT_ANALYSIS_SECTIONS);
  assert.equal(DEFAULT_ANALYSIS_SECTIONS.titleVerdict, true);
  assert.equal(DEFAULT_ANALYSIS_SECTIONS.coreSummary, true);
  assert.equal(DEFAULT_ANALYSIS_SECTIONS.mindMap, true);
  assert.equal(DEFAULT_ANALYSIS_SECTIONS.chapterMap, true);
});

test("Analysis Sections - pruneTaskContent prunes disabled tasks and renumbers", () => {
  const { pruneTaskContent, PROMPTS } = NutEggAI;
  const defaultTask = PROMPTS.contentTaskDefault;

  // All enabled
  const all = pruneTaskContent(defaultTask, { titleVerdict: true, coreSummary: true, mindMap: true, chapterMap: true });
  assert.ok(all.includes("1. Title Verdict:"));
  assert.ok(all.includes("2. Core Summary:"));
  assert.ok(all.includes("3. Chapter Map"));
  assert.ok(all.includes("4. Mind Map:"));

  // Mind map disabled
  const noMm = pruneTaskContent(defaultTask, { titleVerdict: true, coreSummary: true, mindMap: false, chapterMap: true });
  assert.ok(noMm.includes("1. Title Verdict:"));
  assert.ok(noMm.includes("2. Core Summary:"));
  assert.ok(noMm.includes("3. Chapter Map"));
  assert.ok(!noMm.includes("Mind Map"));

  // Mind map and Chapter map disabled
  const summaryOnly = pruneTaskContent(defaultTask, { titleVerdict: true, coreSummary: true, mindMap: false, chapterMap: false });
  assert.ok(summaryOnly.includes("1. Title Verdict:"));
  assert.ok(summaryOnly.includes("2. Core Summary:"));
  assert.ok(!summaryOnly.includes("Chapter Map"));
  assert.ok(!summaryOnly.includes("Mind Map"));
});

test("Analysis Sections - pruneSchemaFromTemplate prunes disabled schema keys", () => {
  const { pruneSchemaFromTemplate } = NutEggAI;
  const schemaText = `{
  "titleVerdict": "verdict",
  "coreSummary": ["point 1"],
  "mindMap": [{"name": "topic"}],
  "isLongForm": true,
  "chapterMap": [{"time": "00:00", "title": "intro"}],
  "customQuestionAnswers": []
}`;

  const noMm = { titleVerdict: true, coreSummary: true, mindMap: false, chapterMap: false };
  const pruned = pruneSchemaFromTemplate(schemaText, noMm);
  assert.ok(pruned.includes('"titleVerdict"'));
  assert.ok(pruned.includes('"coreSummary"'));
  assert.ok(!pruned.includes('"mindMap"'));
  assert.ok(!pruned.includes('"chapterMap"'));
  assert.ok(!pruned.includes('"isLongForm"'));
  assert.ok(pruned.includes('"customQuestionAnswers"'));
});

test("Analysis Sections - applyPrunedSections leaves prompt untouched when all enabled", () => {
  const { applyPrunedSections, PROMPTS, DEFAULT_ANALYSIS_SECTIONS } = NutEggAI;
  const tpl = PROMPTS.contentAnalysis;
  const pruned = applyPrunedSections(tpl, DEFAULT_ANALYSIS_SECTIONS, false);
  assert.equal(pruned, tpl);
});

test("Analysis Sections - applyPrunedSections prunes prompt when mindMap & chapterMap are false", () => {
  const { applyPrunedSections, PROMPTS } = NutEggAI;
  const tpl = PROMPTS.contentAnalysis;
  const pruned = applyPrunedSections(tpl, { titleVerdict: true, coreSummary: true, mindMap: false, chapterMap: false }, false);

  assert.ok(!pruned.includes('"mindMap"'));
  assert.ok(!pruned.includes('"chapterMap"'));
  assert.ok(!pruned.includes('"isLongForm"'));
  assert.ok(!pruned.includes("- mindMap:"));
  assert.ok(pruned.includes('"titleVerdict"'));
  assert.ok(pruned.includes('"coreSummary"'));
});

test("Analysis Sections - analyzeContent sends pruned prompt and handles response", async () => {
  let promptPassedToAI = "";
  const processor = new AIProcessor({
    settings: {
      chromeAiProvider: "openai",
      chromeAiApiKey: "test-key",
    },
  });

  // Mock callAI to inspect prompt and return minimal valid JSON
  processor.callAI = async (prompt) => {
    promptPassedToAI = prompt;
    return JSON.stringify({
      titleVerdict: "Direct answer.",
      coreSummary: ["Point 1", "Point 2"],
    });
  };

  const result = await processor.analyzeContent({
    url: "https://example.com/test",
    title: "Test Page",
    content: "Short content to analyze.",
    sourceType: "webpage",
    enabledSections: {
      titleVerdict: true,
      coreSummary: true,
      mindMap: false,
      chapterMap: false,
    },
  });

  // Prompt verified: no mindMap or chapterMap requested
  assert.ok(!promptPassedToAI.includes('"mindMap"'));
  assert.ok(!promptPassedToAI.includes('"chapterMap"'));
  assert.ok(!promptPassedToAI.includes("Mind Map:"));

  // Result verified: titleVerdict and coreSummary populated, disabled sections are empty
  assert.equal(result.titleVerdict, "Direct answer.");
  assert.deepEqual(result.coreSummary, ["Point 1", "Point 2"]);
  assert.deepEqual(result.mindMap, []);
  assert.deepEqual(result.chapterMap, []);
  assert.equal(result.isLongForm, false);
});

test("Analysis Sections - preserves user-customized rules from template", () => {
  const { pruneRulesFromTemplate, applyPrunedSections } = NutEggAI;

  const customRules = [
    "- titleVerdict must be bold and decisive.",
    "- coreSummary: Exactly 4 bullets, include key metrics and numbers.",
    "- mindMap: Limit to 2 levels deep, start with emoji for each branch.",
    "- customUserRule: Always verify technical terms.",
  ].join("\n");

  // When mindMap is disabled, titleVerdict, coreSummary and customUserRule are preserved
  const prunedRules = pruneRulesFromTemplate(customRules, {
    titleVerdict: true,
    coreSummary: true,
    mindMap: false,
    chapterMap: false,
  });

  assert.ok(prunedRules.includes("- titleVerdict must be bold and decisive."));
  assert.ok(prunedRules.includes("- coreSummary: Exactly 4 bullets, include key metrics and numbers."));
  assert.ok(prunedRules.includes("- customUserRule: Always verify technical terms."));
  assert.ok(!prunedRules.includes("mindMap"));

  // Full template test
  const customTpl = `## Task
1. Title Verdict: Direct answer
2. Core Summary: User bullet rule
3. Mind Map: User tree rule

## Output Format
{
  "titleVerdict": "verdict",
  "coreSummary": ["item 1"],
  "mindMap": [{"name": "root"}],
  "customQuestionAnswers": []
}

## Output Rules
- titleVerdict must be concise.
- coreSummary: Custom user instruction: at most 5 bullets with stats.
- mindMap: Custom user instruction: max 2 levels.
- extraRule: Be friendly.
{{shared_output_rules}}`;

  const prunedTpl = applyPrunedSections(customTpl, {
    titleVerdict: true,
    coreSummary: true,
    mindMap: false,
    chapterMap: false,
  });

  // User's custom coreSummary rule and extraRule are preserved
  assert.ok(prunedTpl.includes("Custom user instruction: at most 5 bullets with stats."));
  assert.ok(prunedTpl.includes("- extraRule: Be friendly."));
  assert.ok(!prunedTpl.includes("Custom user instruction: max 2 levels."));
  assert.ok(!prunedTpl.includes('"mindMap"'));
});

test("Analysis Sections - preserves user-customized task wording from template", () => {
  const { pruneTaskContent } = NutEggAI;

  const userCustomTask = [
    "1. Title Verdict: In 1 punchy sentence, tell me the verdict.",
    "2. Core Summary: 5 detailed takeaways with bullet emojis.",
    "3. Mind Map: Text outline up to 2 tiers.",
  ].join("\n");

  const pruned = pruneTaskContent(userCustomTask, {
    titleVerdict: true,
    coreSummary: true,
    mindMap: false,
    chapterMap: false,
  });

  assert.equal(
    pruned,
    "1. Title Verdict: In 1 punchy sentence, tell me the verdict.\n2. Core Summary: 5 detailed takeaways with bullet emojis."
  );
});

test("Chunker - toSeconds handles bracketed and standard timestamps", () => {
  const { toSeconds } = NutEggAI;

  assert.equal(toSeconds("05:00"), 300);
  assert.equal(toSeconds("[05:00]"), 300);
  assert.equal(toSeconds("[01:23:45]"), 5025);
  assert.equal(toSeconds("01:23:45"), 5025);
  assert.equal(toSeconds("[ 02:30 ]"), 150);
  assert.equal(toSeconds("invalid"), 0);
  assert.equal(toSeconds(""), 0);
});

test("JSON Repair - parseJson does not execute arbitrary code", () => {
  const malicious = '{"status": process.exit ? "test" : "fail"}';
  const parsed = parseJson(malicious);
  assert.deepEqual(parsed, {});
});

test("Analysis Sections - applyPrunedSections prunes task even when ## Task is the last section", () => {
  const { applyPrunedSections } = NutEggAI;

  const tplTrailingTask = `## Instructions
Some preamble.

## Output Format
{
  "titleVerdict": "string",
  "mindMap": []
}

## Task
1. Title Verdict: Say yes or no.
2. Mind Map: Draw outline.`;

  const pruned = applyPrunedSections(tplTrailingTask, {
    titleVerdict: true,
    coreSummary: false,
    mindMap: false,
    chapterMap: false,
  });

  assert.ok(pruned.includes("1. Title Verdict: Say yes or no."));
  assert.ok(!pruned.includes("2. Mind Map"));
  assert.ok(!pruned.includes('"mindMap"'));
});


