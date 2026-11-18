const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadAiCore() {
  const code = fs.readFileSync(path.join(__dirname, '../dist/ai-core.js'), 'utf8');
  const sandbox = { window: {}, globalThis: {}, structuredClone, URL, console };
  vm.runInNewContext(code, sandbox);
  return sandbox.NutEggAI || sandbox.globalThis.NutEggAI || sandbox.window.NutEggAI;
}

test('KV cache prefix through {{content}} is byte-for-byte identical across all 6 content prompts', () => {
  const NutEggAI = loadAiCore();
  const sampleContent = 'UNIQUE_BODY_CONTENT_LINE_1\nUNIQUE_BODY_CONTENT_LINE_2';
  const vars = {
    title: '6 Ways to Build Better Systems',
    url: 'https://example.com/6-ways',
    captured_author: 'Jane Doe',
    source_type: 'article',
    part_note: '',
    content: sampleContent,
    questions: '## User Questions\n1. Why?',
    chapters: '',
    verdict_context: '',
    conversation_hints: '',
    conversation_rules: '',
    content_task_default: NutEggAI.PROMPTS.contentTaskDefault,
    shared_output_rules: '- Output Language: English',
    prior_qa: '',
    egg_file: 'systems.md',
    egg_instructions: 'Scope: systems',
    stage1_signals: 'Summary: systems',
    entry_generation: 'Enabled',
  };

  const keys = [
    'contentAnalysis',
    'verdictSummary',
    'mindMapAnalysis',
    'chromeKnowledge',
    'followUp',
    'eggAnalysis',
  ];

  const prefixes = keys.map(key => {
    const rendered = NutEggAI.renderPrompt(NutEggAI.PROMPTS[key], vars);
    const contentEnd = rendered.indexOf(sampleContent) + sampleContent.length;
    assert.ok(contentEnd > sampleContent.length, `Content missing in ${key}`);
    return { key, prefix: rendered.slice(0, contentEnd) };
  });

  const baseline = prefixes[0].prefix;
  for (const { key, prefix } of prefixes.slice(1)) {
    assert.equal(prefix, baseline, `KV cache prefix diverged for ${key}`);
  }
});

test('normalizeConversationMindMap does not cap root topics at 8 or child questions at 6', () => {
  const NutEggAI = loadAiCore();
  const children = Array.from({ length: 10 }, (_, i) => ({
    kind: 'question',
    name: `${i + 1}. Question ${i + 1}`,
    detail: `Answer ${i + 1}`,
  }));
  const nodes = Array.from({ length: 12 }, (_, i) => ({
    kind: 'topic',
    name: `${i + 1}. Topic ${i + 1}`,
    detail: `Detail ${i + 1}`,
    children: i === 0 ? children : [{ kind: 'question', name: 'Q', detail: 'A' }],
  }));

  const res = NutEggAI.normalizeConversationMindMap(nodes, {
    format: 'interview',
    confidence: 'high',
    participants: [
      { id: 'p1', label: 'Host', role: 'host', named: false },
      { id: 'p2', label: 'Guest', role: 'guest', named: false },
    ],
  });

  assert.equal(res.mindMap.length, 12);
  assert.equal(res.mindMap[0].children.length, 10);
});

test('enumeration numbering rules are present in mindmap prompts', () => {
  const NutEggAI = loadAiCore();
  assert.match(NutEggAI.PROMPTS.contentTaskDefault, /enumeration|numbered list/i);
  assert.match(NutEggAI.PROMPTS.mindMapAnalysis, /Enumerations & Ordered Lists/i);
  assert.match(NutEggAI.PROMPTS.aggregateContent, /enumerations/i);
});

