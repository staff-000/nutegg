// ============================================================
// NutEgg Chrome Extension AI Unit Tests
// ============================================================

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  renderPrompt,
  chunkContent,
  parseJson,
} = require("../src/ai/ai-processor.js");

const {
  PROVIDER_CATALOG,
  resolveConfig,
} = require("../src/ai/ai-client.js");

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
  assert.equal(chunks[0].index, 1);
  assert.equal(chunks[chunks.length - 1].index, chunks.length);
});

test("AI Client - PROVIDER_CATALOG completeness", () => {
  const expected = ["gemini", "openai", "anthropic", "deepseek", "openrouter", "kimi", "zhipu", "qwen", "local"];
  for (const id of expected) {
    assert.ok(PROVIDER_CATALOG[id], `Missing provider ${id}`);
    assert.ok(PROVIDER_CATALOG[id].officialEndpoint, `Missing endpoint for ${id}`);
  }
});

test("AI Client - resolveConfig default to Gemini", () => {
  const conf = resolveConfig({});
  assert.equal(conf.provider, "gemini");
  assert.ok(conf.endpoint.includes("googleapis.com"));
});

test("AI Client - resolveConfig OpenRouter", () => {
  const conf = resolveConfig({ chromeAiProvider: "openrouter", chromeAiApiKey: "sk-or-test" });
  assert.equal(conf.provider, "openrouter");
  assert.equal(conf.apiKey, "sk-or-test");
  assert.ok(conf.extraHeaders["HTTP-Referer"]);
});

