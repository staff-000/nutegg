import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AIProcessor } from '../src/ai-processor';
import { parseEggFile } from '../../shared/src/egg-parser';
import { EggParser } from '../src/egg-parser';
import { PROMPTS } from '../src/prompt-templates';
import { makeFakePlugin, makeFakeVault } from './helpers';

const egg = () => parseEggFile('egg.md', `> [!abstract]- Instructions:
> **Scope:** Engineering
> **Action Guide:** Highlight failures.
> **Key Questions:**
> - When does it fail?
> **Worth Reading If:**
> - Detailed tradeoffs
> **Skip If:**
> - Promotion
> **Formatting Rules:** Q&A blocks

# Knowledge
SECRET_TREE
# Unprocessed
- SECRET_PENDING
`);
const capture = { title: 'Video', url: 'https://example.com', content: 'source', sourceType: 'video' };
const stage1 = { titleVerdict: 'TITLE_SIGNAL', coreSummary: ['SUMMARY_SIGNAL'], customQuestionAnswers: [] };
const response = (action = 'summary', entries = [{ content: 'Useful result' }]) => JSON.stringify({
  readAction: action, readVerdictReason: 'Reason', extractedEntries: entries, keyQuestionAnswers: [], readingSources: [{ ref: '12:34', quote: 'evidence' }],
});

describe('Lightweight Stage 2', () => {
  it('makes one call, includes instructions/signals, never existing notes; summary output is hatchable', async () => {
    const prompts: string[] = [];
    const processor = new AIProcessor(makeFakePlugin({ aiClient: { chat: async (prompt: string) => { prompts.push(prompt); return response(); } } }) as any);
    const result = await processor.analyzeEggs(capture, [egg()], stage1);
    assert.equal(prompts.length, 1);
    for (const text of ['Highlight failures.', 'Detailed tradeoffs', 'Promotion', 'TITLE_SIGNAL', 'SUMMARY_SIGNAL']) assert.ok(prompts[0].includes(text));
    assert.ok(!prompts[0].includes('SECRET_TREE'));
    assert.ok(!prompts[0].includes('SECRET_PENDING'));
    assert.equal(result.readAction, 'summary');
    assert.equal(result.shouldRead, false);
    assert.equal(result.newKnowledge.length, 1);
    assert.equal('parent' in result.newKnowledge[0], false);
    assert.equal('novelDelta' in result.eggResults[0], false);
    assert.equal(result.schemaVersion, 3);
    assert.equal('eggCompare' in PROMPTS, false);
  });
  it('omits disabled Stage 1 signals', async () => {
    let prompt = '';
    const processor = new AIProcessor(makeFakePlugin({ aiClient: { chat: async (p: string) => { prompt = p; return response(); } } }) as any);
    await processor.analyzeEggs({ ...capture, enabledSections: { titleVerdict: false, coreSummary: false } }, [egg()], stage1);
    assert.ok(!prompt.includes('TITLE_SIGNAL'));
    assert.ok(!prompt.includes('SUMMARY_SIGNAL'));
  });
  it('saves Q&A-only skip results but not unsupported translated answers', async () => {
    const processor = new AIProcessor(makeFakePlugin({ aiClient: { chat: async () => JSON.stringify({
      readAction: 'skip', extractedEntries: [], keyQuestionAnswers: [
        { question: 'Q', answer: 'Useful answer', answered: true, sources: [{ ref: '12:34' }] },
        { question: 'Other', answer: '未提及', answered: false },
      ],
    }) } }) as any);
    const result = await processor.analyzeEggs(capture, [egg()], stage1);
    assert.equal(result.shouldRead, false);
    assert.equal(result.newKnowledge.length, 1);
    assert.match(result.newKnowledge[0].content, /Useful answer/);
    assert.match(result.newKnowledge[0].content, /12:34/);
  });
  for (const [action, verdict] of [['full', true], ['highlights', true], ['summary', false], ['skip', false], ['uncertain', null], ['invalid', null]] as const) {
    it(`maps ${action} to ${verdict}`, async () => {
      const processor = new AIProcessor(makeFakePlugin({ aiClient: { chat: async () => response(action) } }) as any);
      const result = await processor.analyzeEggs(capture, [egg()], stage1);
      assert.equal(result.shouldRead, verdict);
    });
  }
  it('missing recommendations stay uncertain and no matches show no personalized recommendation', async () => {
    const processor = new AIProcessor(makeFakePlugin({ aiClient: { chat: async () => '{}' } }) as any);
    assert.equal((await processor.analyzeEggs(capture, [egg()], stage1)).shouldRead, null);
    const none = await processor.analyzeEggs(capture, [], stage1);
    assert.equal(none.readAction, undefined);
    assert.equal(none.shouldRead, null);
  });
  it('uses deterministic multi-egg precedence', async () => {
    const processor = new AIProcessor(makeFakePlugin() as any) as any;
    const results = (actions: string[]) => actions.map((readAction, i) => ({ egg: `${i}.md`, readAction, readVerdictReason: 'reason', readingSources: [] }));
    for (const [actions, expected] of [[['skip','summary'], 'summary'], [['summary','uncertain'], 'uncertain'], [['uncertain','highlights'], 'highlights'], [['highlights','full'], 'full']] as const) {
      assert.equal(processor.mergeVerdict(results([...actions])).readAction, expected);
    }
  });
  it('slim aggregate sees drafts/coverage, not bodies/tree; same-label fragments survive', async () => {
    const prompts: string[] = [];
    const processor = new AIProcessor(makeFakePlugin({ settings: { aiApiKey: "test-key", chunkWindowChars: 100 }, aiClient: { chat: async (prompt: string) => {
      prompts.push(prompt);
      if (prompt.startsWith('Consolidate answers')) return JSON.stringify({ readAction: 'highlights', keyQuestionAnswers: [{ question: 'When does it fail?', answer: 'Combined answer', sources: [{ ref: '02:00' }] }] });
      return JSON.stringify({ readAction: 'summary', extractedEntries: [{ content: '- **Same concept** PART_BODY_MARKER ' + prompts.length }], keyQuestionAnswers: [{ question: 'When does it fail?', answer: 'ANSWER_DRAFT', sources: [{ ref: '02:00' }] }] });
    } } }) as any);
    const result = await processor.analyzeEggs({ ...capture, content: 'word '.repeat(70) }, [egg()], stage1);
    const aggregate = prompts.find(p => p.startsWith('Consolidate answers'))!;
    assert.ok(aggregate.includes('ANSWER_DRAFT'));
    for (const secret of ['PART_BODY_MARKER', 'SECRET_TREE', 'SECRET_PENDING']) assert.ok(!aggregate.includes(secret));
    assert.equal(result.eggResults[0].extractedEntries.length, prompts.length - 1);
    assert.equal(result.eggResults[0].keyQuestionAnswers[0].answer, 'Combined answer');
  });
  it('partial chunk failure preserves successful entries and overrides a confident aggregate', async () => {
    let part = 0;
    const processor = new AIProcessor(makeFakePlugin({ settings: { aiApiKey: 'test-key', chunkWindowChars: 1000 }, aiClient: { chat: async (prompt: string) => {
      if (prompt.startsWith('Consolidate answers')) return JSON.stringify({ readAction: 'full', keyQuestionAnswers: [] });
      if (++part === 2) throw new Error('Chunk unavailable');
      return response('full');
    } } }) as any);
    const result = await processor.analyzeEggs({ ...capture, content: 'source '.repeat(400) }, [egg()], stage1);
    assert.equal(result.readAction, 'uncertain');
    assert.equal(result.shouldRead, null);
    assert.ok(result.newKnowledge.length > 0);
    assert.match(result.shouldReadReason, /incomplete/);
  });
  it('aggregate failure retains labeled answers and fragments with uncertainty', async () => {
    const processor = new AIProcessor(makeFakePlugin({ settings: { aiApiKey: "test-key", chunkWindowChars: 100 }, aiClient: { chat: async (prompt: string) => {
      if (prompt.startsWith('Consolidate')) throw new Error('Unavailable');
      return JSON.stringify({ readAction: 'full', extractedEntries: [{ content: 'fragment' }], keyQuestionAnswers: [{ question: 'Q', answer: 'Answer' }] });
    } } }) as any);
    const result = await processor.analyzeEggs({ ...capture, content: 'word '.repeat(50) }, [egg()], stage1);
    assert.equal(result.shouldRead, null);
    assert.ok(result.eggResults[0].extractedEntries.length > 1);
    assert.match(result.eggResults[0].keyQuestionAnswers[0].question, /Part 1/);
  });
});

describe('Merge safety', () => {
  const original = '# Knowledge\n- Existing\n# Unprocessed\n- New\n';
  it('does not repair truncated JSON or modify notes', async () => {
    const { vault } = makeFakeVault({ 'egg.md': original });
    const plugin = makeFakePlugin({ vault, aiClient: { chat: async () => '{"knowledge":"- partial' } });
    plugin.app = { vault }; plugin.eggParser = new EggParser(plugin as any);
    assert.equal(await new AIProcessor(plugin as any).mergeEgg('egg.md'), null);
    assert.equal(await vault.adapter.read('egg.md'), original);
  });
  it('persists consolidated claims with every source, caveat and distinct framework from a mock merge', async () => {
    const existing = '- **Claim**\n  - Useful only with supervision.\n  _source: [A](https://a.example)_';
    const pending = '- **Claim**\n  - Counterexample: unsupervised use fails.\n  _source: [B](https://b.example)_\n- **Framework v1**\n  - Step one\n- **Framework v2**\n  - Different step';
    const merged = '- **Claim**\n  - Useful only with supervision.\n  - Counterexample: unsupervised use fails.\n  _source: [A](https://a.example)_\n  _source: [B](https://b.example)_\n- **Framework v1**\n  - Step one\n- **Framework v2**\n  - Different step';
    const { vault } = makeFakeVault({ 'egg.md': `> **Skip If:**\n> - Tutorials\n\n# Knowledge\n${existing}\n# Unprocessed\n${pending}\n` });
    const plugin = makeFakePlugin({ vault, aiClient: { chat: async (prompt: string) => {
      assert.ok(prompt.includes(existing)); assert.ok(prompt.includes(pending));
      assert.ok(prompt.includes('Retain ALL distinct author/source'));
      assert.ok(prompt.includes('different speakers, versions, dates or contexts'));
      assert.ok(!prompt.includes('Tutorials'));
      return JSON.stringify({ knowledge: merged, unprocessed: '' });
    } } });
    plugin.eggParser = new EggParser(plugin as any);
    await new AIProcessor(plugin as any).mergeEgg('egg.md');
    const note = await vault.adapter.read('egg.md');
    assert.equal((note.match(/\*\*Claim\*\*/g) || []).length, 1);
    for (const detail of ['https://a.example', 'https://b.example', 'Counterexample', 'supervision', 'Framework v1', 'Framework v2']) assert.ok(note.includes(detail));
  });
  it('scales output budget and serializes simultaneous merges of one egg', async () => {
    const { vault } = makeFakeVault({ 'egg.md': original });
    let calls = 0, budget = 0;
    const plugin = makeFakePlugin({ vault, aiClient: { chat: async (_: string, tokens: number) => {
      calls++; budget = tokens;
      return JSON.stringify({ knowledge: '- Existing\n- New', unprocessed: '' });
    } } });
    plugin.app = { vault }; plugin.eggParser = new EggParser(plugin as any);
    const processor = new AIProcessor(plugin as any);
    await Promise.all([processor.mergeEgg('egg.md'), processor.mergeEgg('egg.md')]);
    assert.equal(calls, 1);
    assert.ok(budget >= 4096);
  });
  it('defers oversized output without an AI call or changes', async () => {
    const { vault } = makeFakeVault({ 'egg.md': '# Knowledge\n' + '概念'.repeat(5000) + '\n# Unprocessed\n- New\n' });
    let calls = 0;
    const plugin = makeFakePlugin({ vault, settings: { aiApiKey: "test-key", mergeMaxTokens: 4096 }, aiClient: { chat: async () => { calls++; return '{}'; } } });
    const before = await vault.adapter.read('egg.md');
    plugin.app = { vault }; plugin.eggParser = new EggParser(plugin as any);
    assert.equal(await new AIProcessor(plugin as any).mergeEgg('egg.md'), null);
    assert.equal(calls, 0);
    assert.equal(await vault.adapter.read('egg.md'), before);
  });
  it('retries a stale snapshot and retains concurrently appended notes', async () => {
    const { vault } = makeFakeVault({ 'egg.md': original });
    let calls = 0;
    const plugin = makeFakePlugin({ vault, aiClient: { chat: async () => {
      if (++calls === 1) await vault.modify(vault.getAbstractFileByPath('egg.md')!, original + '- Concurrent\n');
      return JSON.stringify({ knowledge: '- Existing\n- New', unprocessed: '- Concurrent' });
    } } });
    plugin.app = { vault }; plugin.eggParser = new EggParser(plugin as any);
    await new AIProcessor(plugin as any).mergeEgg('egg.md');
    assert.equal(calls, 2);
    assert.match(await vault.adapter.read('egg.md'), /Concurrent/);
  });
});
