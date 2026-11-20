const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const core = new Function(fs.readFileSync(require.resolve('../dist/ai-core.js'), 'utf8') + '\nreturn NutEggAI;')();
const rawKeys = ['contentAnalysis', 'verdictSummary', 'mindMapAnalysis', 'chromeKnowledge', 'eggAnalysis', 'followUp'];
const vars = {
  title: 'Title', url: 'https://example.com/post', captured_author: 'Author', source_type: 'article',
  part_note: '**Part:** 1 of 2', content: 'SOURCE_BODY_SENTINEL', shared_output_rules: 'SHARED_RULES_SENTINEL',
  questions: 'QUESTIONS_SENTINEL', prior_qa: 'PRIOR_QA_SENTINEL', chapters: 'CHAPTERS_SENTINEL',
  verdict_context: 'VERDICT_SENTINEL', conversation_hints: 'HINTS_SENTINEL',
  content_task_default: core.PROMPTS.contentTaskDefault, conversation_rules: '',
};

test('raw prompts share the source prefix through {{content}} while keeping policies inside output rules', () => {
  const sourceEnd = prompt => prompt.indexOf(vars.content) + vars.content.length;
  const prompts = rawKeys.map(key => core.renderPrompt(core.PROMPTS[key], vars));
  for (const prompt of prompts) {
    assert.equal(prompt.slice(0, sourceEnd(prompt)), prompts[0].slice(0, sourceEnd(prompts[0])));
    assert.ok(prompt.includes(vars.shared_output_rules), 'Shared output rules must appear in every raw-content prompt');
  }
  for (const key of rawKeys) {
    const original = core.renderPrompt(core.PROMPTS[key], vars);
    const different = core.renderPrompt(core.PROMPTS[key], { ...vars, shared_output_rules: 'OTHER_SCOPE_OR_LANGUAGE' });
    assert.equal(original.slice(0, sourceEnd(original)), different.slice(0, sourceEnd(different)));
  }
});

test('Stage 1 optional inputs stay next to task instructions without empty request headings', () => {
  for (const key of ['contentAnalysis', 'verdictSummary', 'mindMapAnalysis']) {
    const template = core.PROMPTS[key];
    const prompt = core.renderPrompt(template, vars);
    assert.ok(!prompt.includes('## Request Inputs'), key);
    for (const sentinel of ['QUESTIONS_SENTINEL', 'CHAPTERS_SENTINEL', 'VERDICT_SENTINEL', 'HINTS_SENTINEL']) {
      if (!prompt.includes(sentinel)) continue;
      assert.ok(prompt.indexOf(sentinel) > prompt.indexOf('## Task'), `${key}: ${sentinel}`);
      assert.ok(prompt.indexOf(sentinel) < prompt.indexOf('## Output Format'), `${key}: ${sentinel}`);
    }
    const empty = core.renderPrompt(template, { ...vars, questions: '', chapters: '', verdict_context: '', conversation_hints: '' });
    assert.ok(!empty.includes('## Request Inputs'), key);
    assert.ok(!empty.includes('Egg Key Question'), key);
    if (key !== 'mindMapAnalysis') assert.match(empty, /Answer equivalent user questions only once/);
  }
});

test('follow-up and aggregation keep static instructions before changing request inputs', () => {
  for (const key of ['followUp']) {
    const prompt = core.renderPrompt(core.PROMPTS[key], vars);
    const inputs = prompt.indexOf('## Request Inputs');
    assert.ok(prompt.indexOf('## Task') < inputs, key);
    assert.ok(prompt.indexOf('## Output Format') < inputs, key);
    assert.ok(prompt.indexOf('## Output Rules') < inputs, key);
    for (const sentinel of ['QUESTIONS_SENTINEL', 'PRIOR_QA_SENTINEL', 'CHAPTERS_SENTINEL', 'VERDICT_SENTINEL', 'HINTS_SENTINEL']) {
      if (prompt.includes(sentinel)) assert.ok(prompt.indexOf(sentinel) > inputs, `${key}: ${sentinel}`);
    }
  }
  for (const [key, data] of [
    ['aggregateContent', 'chunk_summaries'], ['aggregateDiscussion', 'drafts'],
    ['mergeUnprocessed', 'unprocessed_count'], ['localizeWorkflow', 'target_language'],
    ['localizeEgg', 'template'],
  ]) {
    const prompt = core.PROMPTS[key];
    assert.ok(prompt.indexOf('## Task') < prompt.indexOf(`{{${data}}}`) ||
      (key === 'aggregateDiscussion' && prompt.indexOf('Return only JSON:') < prompt.indexOf(`{{${data}}}`)), key);
  }
});

test('all section combinations prune only the actual schema and preserve policy and request slots', () => {
  for (const key of ['contentAnalysis', 'verdictSummary', 'mindMapAnalysis', 'aggregateContent']) {
    for (let bits = 0; bits < 8; bits++) {
      const sections = { titleVerdict: !!(bits & 1), coreSummary: !!(bits & 2), mindMap: !!(bits & 4) };
      const prompt = core.applyPrunedSections(core.PROMPTS[key], sections);
      const format = prompt.split('## Output Format')[1].split(/\n## /)[0];
      const schema = JSON.parse(format.match(/^\{\n[\s\S]*?^\}/m)[0]);
      for (const section of ['titleVerdict', 'coreSummary', 'mindMap']) {
        if (!sections[section]) assert.equal(Object.hasOwn(schema, section), false, `${key}: ${section}`);
      }
      assert.ok(prompt.includes('{{shared_output_rules}}'), key);
      assert.ok(prompt.includes('{{questions}}') || key === 'mindMapAnalysis', key);
      const rules = prompt.split('## Output Rules')[1]?.split(/\n## /)[0] || '';
      if (!sections.mindMap) assert.ok(!/^- mindMap\b/m.test(rules), key);
    }
  }
  const prose = 'For monologues use `{"format":"monologue"}`.';
  const custom = `## Task\n1. Title Verdict\n## Output Format\n${prose}\n{\n"titleVerdict":"a", "coreSummary":[], "mindMap":[], "custom":{"brace":"}"}\n}\nA custom example: {"keep":"me"}\n## Output Rules\n{{shared_output_rules}}`;
  const pruned = core.applyPrunedSections(custom, { titleVerdict: true, coreSummary: true, mindMap: false });
  assert.ok(pruned.includes(prose));
  assert.ok(pruned.includes('A custom example: {"keep":"me"}'));
  assert.ok(!pruned.includes('"mindMap"'));
});

test('localization source occurs once and literal source placeholders survive a single substitution pass', () => {
  const source = 'SOURCE_SENTINEL {{title}} {{content}} {{shared_output_rules}}';
  const prompt = core.renderPrompt(core.PROMPTS.localizeWorkflow, { content: source, target_language: 'French', filename: 'test.md' });
  assert.equal(prompt.split('SOURCE_SENTINEL').length - 1, 1);
  assert.ok(prompt.includes(source));
  assert.ok(prompt.includes('`shared_output_rules`'));
  assert.ok(prompt.includes('Keep all `{{...}}` placeholder tags'));
  assert.ok(prompt.indexOf('## STRICT Invariant Rules') < prompt.indexOf('French'));
  const a = core.renderPrompt(core.PROMPTS.localizeEgg, { template: 'EGG_SENTINEL', target_language: 'French', description: 'Systems' });
  const b = core.renderPrompt(core.PROMPTS.localizeEgg, { template: 'EGG_SENTINEL', target_language: 'Japanese', description: 'Finance' });
  const boundary = a.indexOf('EGG_SENTINEL') + 'EGG_SENTINEL'.length;
  assert.equal(a.slice(0, boundary), b.slice(0, boundary));
});

test('moved shared policies retain grounding modes, language overrides and customized prompts', () => {
  const processor = new core.AIProcessor({ settings: { outputLanguage: 'English', promptOverrides: { sharedOutputRules: core.PROMPTS.sharedOutputRules + '\n- Custom policy stays.' } } });
  const within = processor.getContentOutputRules({}, 'within');
  const beyond = processor.getContentOutputRules({}, 'beyond');
  assert.match(within, /ONLY source of truth/);
  assert.ok(!beyond.includes('ONLY source of truth'));
  assert.match(beyond, /Global Mode/);
  assert.match(beyond, /Custom policy stays/);
  const eggRules = processor.getEggOutputRules({ language: 'Chinese' }, '', { outputLanguage: 'Spanish' });
  assert.match(eggRules, /Chinese \(translate into Chinese/);
  assert.ok(!eggRules.includes('Spanish'));
  const rendered = core.renderPrompt(core.PROMPTS.eggAnalysis, { ...vars, shared_output_rules: eggRules, egg_instructions: 'Do not generate knowledge entries.', entry_generation: 'DISABLED' });
  assert.ok(rendered.indexOf('Do not generate knowledge entries.') > rendered.indexOf('## Target Egg:'));
  assert.match(rendered, /Set generateKnowledgeEntries=false/);
});
