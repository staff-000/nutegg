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

test("AI Processor - follows chromeAiOutputLanguage setting", () => {
  const processorDefault = new AIProcessor({ settings: {} });
  const rulesDefault = processorDefault.getContentOutputRules();
  assert.ok(rulesDefault.includes("the same language as the captured content"));

  const processorZh = new AIProcessor({ settings: { chromeAiOutputLanguage: "Chinese" } });
  const rulesZh = processorZh.getContentOutputRules();
  assert.ok(rulesZh.includes("Chinese"));
  assert.ok(rulesZh.includes("translate into Chinese"));
});
