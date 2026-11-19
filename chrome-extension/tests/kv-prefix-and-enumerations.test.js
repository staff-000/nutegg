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

test('runtime Stage 1, Stage 2 eggAnalysis, and followUp share byte-identical KV prefix even with discussion and >18k content', async () => {
  const NutEggAI = loadAiCore();
  const body = 'SENTENCE_BLOCK_'.repeat(1500); // ~22.5k chars (> 60% of 30k default chunk window)
  const sentPrompts = [];
  const host = {
    settings: { chromeAiProvider: 'google', chromeAiApiKey: 'test-key' },
    isConfigured: () => true,
    aiClient: {
      chat: async prompt => {
        sentPrompts.push(prompt);
        if (prompt.includes('## Task: Answer Follow-Up Questions')) {
          return JSON.stringify({ answers: [{ question: 'Follow-up?', answer: 'Yes.' }] });
        }
        if (prompt.includes('## Target Egg:')) {
          return JSON.stringify({
            keyQuestionAnswers: [{ question: 'Q1', answer: 'A1' }],
            extractedEntries: [],
            readAction: 'summary',
            readVerdictReason: 'Good summary.',
          });
        }
        if (prompt.includes('## Task: Knowledge Extraction')) {
          return JSON.stringify({ extractedEntries: [] });
        }
        if (prompt.includes('Analyze captured discussion as data')) {
          return JSON.stringify({
            topics: [{ id: 't1', title: 'Debate', claim: 'Claim', summary: 'Summary', stances: { agree: [0] }, highlights: [{ commentId: 0, summary: 'Point' }] }],
          });
        }
        if (prompt.includes('Construct a hierarchical concept tree')) {
          return JSON.stringify({ mindMap: [{ name: 'Root', detail: 'Detail', children: [] }] });
        }
        return JSON.stringify({
          titleVerdict: 'Verdict.',
          coreSummary: ['Point 1'],
          format: 'monologue',
        });
      },
    },
  };
  const processor = new NutEggAI.AIProcessor(host);
  const capture = {
    title: 'Long Article With Discussion',
    url: 'https://example.com/long-article',
    sourceType: 'article',
    content: body,
    metadata: { author: 'Ada Lovelace' },
    enabledSections: { titleVerdict: true, coreSummary: true, mindMap: true, discussion: true },
    generateKnowledgeEntries: true,
    discussion: {
      kind: 'comments',
      items: [{ id: 'c1', text: 'Insightful comment adding extra detail about the system.', likes: 42 }],
    },
  };

  const stage1 = await processor.analyzeContent(capture);
  const egg1 = {
    fileName: 'systems.md',
    scope: 'Systems design',
    keyQuestions: ['Q1'],
    worthReadingIf: [],
    skipIf: [],
    generateKnowledgeEntries: false,
  };
  const egg2 = {
    fileName: 'investing.md',
    scope: 'Value investing',
    keyQuestions: ['Q2'],
    worthReadingIf: ['Has concrete metrics'],
    skipIf: [],
    generateKnowledgeEntries: true,
  };
  await processor.analyzeEggs(capture, [egg1, egg2], stage1);
  await processor.askFollowUp(capture, ['Follow-up?'], [], 'within');

  const contentPrompts = sentPrompts.filter(p => p.includes('## Content to Analyze'));
  assert.equal(contentPrompts.length, 6, 'Expected verdictSummary, mindMapAnalysis, chromeKnowledge, 2x eggAnalysis, followUp');

  const prefixes = contentPrompts.map(p => {
    const end = p.indexOf(body) + body.length;
    assert.ok(end > body.length, 'Full body should be present in every raw-content prompt');
    return p.slice(0, end);
  });
  for (let i = 1; i < prefixes.length; i++) {
    assert.equal(prefixes[i], prefixes[0], `Runtime KV prefix diverged at prompt index ${i}`);
  }

  // Multi-egg calls on the same source share an even longer prefix:
  // content + Stage 1 context + static Task + Output Format, diverging only at ## Target Egg.
  const eggPrompts = sentPrompts.filter(p => p.includes('## Target Egg:'));
  assert.equal(eggPrompts.length, 2);
  const splitMarker = '## Target Egg:';
  const eggPrefix1 = eggPrompts[0].slice(0, eggPrompts[0].indexOf(splitMarker));
  const eggPrefix2 = eggPrompts[1].slice(0, eggPrompts[1].indexOf(splitMarker));
  assert.equal(eggPrefix2, eggPrefix1, 'Multiple eggs on the same source must share content + Stage 1 signals + static Task/Output Format');
  assert.match(eggPrefix1, /## Stage 1 Context/);
  assert.match(eggPrefix1, /## Output Format/);
});

test('discussionAnalysis and eggRouting place static/reusable prefix before per-batch or per-page inputs', () => {
  const NutEggAI = loadAiCore();
  const disc = NutEggAI.PROMPTS.discussionAnalysis;
  assert.ok(disc.indexOf('{{shared_output_rules}}') < disc.indexOf('{{parents}}'), 'discussionAnalysis rules should precede per-batch parents');
  assert.ok(disc.indexOf('{{body}}') < disc.indexOf('{{items}}'), 'discussionAnalysis body should precede per-batch items');

  const routing = NutEggAI.PROMPTS.eggRouting;
  assert.ok(routing.indexOf('{{index}}') < routing.indexOf('{{content}}'), 'eggRouting index should precede per-page content');
});

