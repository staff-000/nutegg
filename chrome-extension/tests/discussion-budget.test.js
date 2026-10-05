const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const core = new Function(fs.readFileSync(require.resolve('../dist/ai-core.js'), 'utf8') + '\nreturn NutEggAI;')();
const settings = { aiProvider: 'openai', aiApiKey: 'test' };
let sequence = 0;
const comment = (id, extra = {}) => ({ id, text: `Ordinary original ${id}`, author: `Private name ${id}`, authorId: `private-account-${id}`, url: `https://example.test/comments/${id}`, reaction: { kind: 'likes', count: 7 }, ...extra });
const input = items => ({ url: `https://example.test/budget-${++sequence}`, title: 'A useful forum', content: 'Author body', sourceType: 'forum',
  enabledSections: { titleVerdict: false, coreSummary: false, mindMap: false, discussion: true },
  discussion: { kind: 'forum', status: 'partial', items, totalCount: null } });
const rows = prompt => JSON.parse(prompt.match(/Discussion items to analyze: (.*)\n/)[1]);
function discussionReply(prompt) {
  const items = rows(prompt);
  return { topics: [{ id: 't', title: 'Practical trade-offs', claim: 'The method helps', summary: 'Experiences and limitations.',
    stances: { agree: items.filter(r => r[3].startsWith('Agree')).map(r => r[0]), disagree: items.filter(r => r[3].startsWith('Disagree')).map(r => r[0]), neutral: items.filter(r => !/^(Agree|Disagree)/.test(r[3])).map(r => r[0]) },
    highlights: items.slice(0, 2).map(r => ({ commentId: r[0], summary: 'Useful method with a concrete caveat.', ...(r[3].includes('SUPPLEMENT') ? { supplement: true } : {}) })) }] };
}
function mockHost(prompts, extra = {}) {
  return { settings: { ...settings, ...extra }, aiClient: { chat: async prompt => {
    prompts.push(prompt);
    if (prompt.includes('Discussion items to analyze:')) return JSON.stringify(discussionReply(prompt));
    if (prompt.startsWith('Merge discussion')) {
      const drafts = JSON.parse(prompt.match(/Drafts: (.*)\n/)[1]);
      return JSON.stringify({ topics: [{ ...drafts[0], highlights: drafts.flatMap(d => d.highlights).slice(0, 8), mergeTopicIds: drafts.map(d => d.id) }] });
    }
    if (prompt.includes('Stage 1 discussion') || prompt.includes('Analyzed discussion') && prompt.includes('extractedEntries')) {
      return JSON.stringify({ readAction: 'highlights', extractedEntries: [{ content: 'Commenter-reported useful method', sources: [{ ref: 'Comment', sourceId: 'detail' }] }], keyQuestionAnswers: [] });
    }
    return JSON.stringify({ titleVerdict: 'Useful discussion', coreSummary: ['Experiences and caveats'], mindMap: [{ title: 'Method', sources: [{ ref: 'Comment', sourceId: 'detail' }] }], customQuestionAnswers: [], answers: [{ question: 'How?', answer: 'Commenter-reported method', sources: [{ ref: 'Comment', sourceId: 'detail' }] }] });
  } } };
}

test('compact records hide identities and URLs while mapping thread ownership and reactions', () => {
  const items = [comment('parent'), comment('child', { parentId: 'parent', authorId: 'private-account-parent', reaction: { kind: 'score', count: -2 } }), comment('missing', { reaction: { kind: 'likes', count: null } })];
  const compact = core.compactDiscussionRecords(items);
  assert.deepEqual(compact.rows[1], [1, 0, 0, 'Ordinary original child', 's', -2]);
  assert.deepEqual(compact.rows[2].slice(4), [null, null]);
  assert.equal(compact.aliases.get(1), 'child');
  assert.doesNotMatch(JSON.stringify(compact.rows), /Private name|private-account|https:/);
});

test('grouped stance IDs preserve metrics, original sources and unknown reactions; reject context-only and invented IDs', () => {
  const items = [comment('parent'), comment('child', { parentId: 'parent' }), comment('minority', { reaction: { kind: 'likes', count: null } })];
  const compact = core.compactDiscussionRecords(items.slice(1), items);
  const raw = { topics: [{ id: 't', title: 'Trade-offs', stances: { agree: [1, 1, 0, 99], disagree: [2] }, highlights: [{ commentId: 1, summary: 'Helpful experience', supplement: true }, { commentId: 0, summary: 'Context must not count' }] }] };
  const part = core.unpackDiscussionPart(raw, items.slice(1), compact.aliases);
  const result = core.buildDiscussionResult({ kind: 'forum', status: 'partial', items }, [part]);
  const topic = result.topics[0];
  assert.equal(topic.metrics.agree.comments, 1); assert.equal(topic.metrics.agree.likes, 7);
  assert.equal(topic.metrics.disagree.comments, 1); assert.equal(topic.metrics.disagree.likesKnown, 0);
  assert.equal(topic.highlights.length, 1); assert.equal(topic.highlights[0].source.id, 'child');
  assert.equal(topic.highlights[0].supplement, true);
  assert.throws(() => core.unpackDiscussionPart({ topics: [{ stances: { agree: '1' } }] }, items, compact.aliases), /stance list/);
});

test('unchanged discussion is reused across processor instances without new AI calls', async () => {
  const prompts = [], page = input([comment('a')]), original = JSON.stringify(page);
  const first = await new core.AIProcessor(mockHost(prompts)).analyzeContent(page);
  const second = await new core.AIProcessor(mockHost(prompts)).analyzeContent({ ...page, discussion: { ...page.discussion, status: 'complete', totalCount: 1 } });
  assert.equal(prompts.length, 1); assert.deepEqual(second.discussion.topics, first.discussion.topics);
  assert.equal(second.discussion.coverage, 'complete'); assert.equal(second.discussion.totalCount, 1);
  assert.equal(JSON.stringify(page), original);
});

test('appending comments analyzes only the delta, preserving minority positions and merging without double counts', async () => {
  const prompts = [], page = input([comment('a', { text: 'Agree, this helped' })]), processor = new core.AIProcessor(mockHost(prompts));
  await processor.analyzeContent(page);
  page.discussion.items.push(comment('b', { text: 'Disagree, a concrete failure', parentId: 'a' }));
  const result = await processor.analyzeContent(page);
  assert.equal(prompts.length, 3); assert.equal(rows(prompts[1]).length, 1); assert.equal(rows(prompts[1])[0][0], 1);
  assert.equal(JSON.parse(prompts[1].match(/Parent comments .*: (.*)\n/)[1])[0][0], 0);
  assert.equal(result.discussion.topics[0].metrics.agree.comments, 1);
  assert.equal(result.discussion.topics[0].metrics.disagree.comments, 1);
  await processor.analyzeContent(page); assert.equal(prompts.length, 3);
});

test('cached labels use the latest original source snapshots, and different pages stay isolated', async () => {
  const prompts = [], page = input([comment('a'), comment('b')]), processor = new core.AIProcessor(mockHost(prompts));
  await processor.analyzeContent(page);
  page.discussion.items.reverse();
  page.discussion.items[1].url = 'https://example.test/updated-source';
  const result = await processor.analyzeContent(page);
  assert.equal(prompts.length, 1);
  assert.equal(result.discussion.topics[0].highlights[0].source.url, 'https://example.test/updated-source');
  await processor.analyzeContent({ ...page, url: 'https://another.test/same-text' });
  assert.equal(prompts.length, 2);
});

test('editing, removing, and reaction changes invalidate affected cached batches', async () => {
  const prompts = [], page = input([comment('a'), comment('b')]), processor = new core.AIProcessor(mockHost(prompts));
  await processor.analyzeContent(page);
  page.discussion.items[0].text = 'Disagree after new evidence';
  let result = await processor.analyzeContent(page); assert.equal(prompts.length, 2); assert.equal(result.discussion.topics[0].metrics.disagree.comments, 1);
  page.discussion.items[0].reaction.count = 20;
  result = await processor.analyzeContent(page); assert.equal(prompts.length, 3); assert.equal(result.discussion.topics[0].metrics.disagree.likes, 20);
  page.discussion.items = page.discussion.items.slice(1);
  result = await processor.analyzeContent(page); assert.equal(prompts.length, 4); assert.equal(result.discussion.topics[0].metrics.disagree.comments, 0);
  assert.equal(result.discussion.analyzedCount, 1);
});

test('parent edits invalidate cached replies in separate batches, while unrelated chunks survive', async () => {
  const prompts = [], page = input([comment('a', { text: 'Agree ' + 'x'.repeat(5900) })]), processor = new core.AIProcessor(mockHost(prompts, { chunkWindowChars: 1000 }));
  await processor.analyzeContent(page);
  page.discussion.items.push(comment('b', { parentId: 'a', text: 'Disagree ' + 'x'.repeat(5900) }), comment('c', { text: 'Neutral ' + 'x'.repeat(5900) }));
  await processor.analyzeContent(page); const previous = prompts.length;
  page.discussion.items[0].text = 'Disagree ' + 'x'.repeat(5900);
  const result = await processor.analyzeContent(page);
  assert.equal(prompts.length - previous, 3); // Parent, reply, compact aggregation; unrelated chunk reused.
  assert.deepEqual(prompts.slice(previous).filter(p => p.includes('Discussion items to analyze:')).flatMap(p => rows(p).map(r => r[0])), [0, 1]);
  assert.equal(result.discussion.topics[0].metrics.disagree.comments, 2);
});

test('model, language, body context and workflow changes cannot reuse incompatible analyses', async () => {
  const prompts = [], page = input([comment('a')]);
  await new core.AIProcessor(mockHost(prompts)).analyzeContent(page);
  await new core.AIProcessor(mockHost(prompts, { aiModel: 'another-model' })).analyzeContent(page);
  await new core.AIProcessor(mockHost(prompts)).analyzeContent({ ...page, outputLanguage: 'Chinese' });
  await new core.AIProcessor(mockHost(prompts)).analyzeContent({ ...page, content: 'Changed author claim' });
  const template = new core.AIProcessor(mockHost([])).getPrompt('discussionAnalysis');
  await new core.AIProcessor(mockHost(prompts, { promptOverrides: { discussionAnalysis: template + '\nAdditional instruction.' } })).analyzeContent(page);
  assert.equal(prompts.length, 5);
});

test('failed classification is retried and expired cache is discarded', async () => {
  const prompts = [], page = input([comment('a')]), host = mockHost(prompts), processor = new core.AIProcessor(host);
  const good = host.aiClient.chat; let attempts = 0;
  host.aiClient.chat = async prompt => ++attempts === 1 ? '{"topics":[{"stances":null}]}' : good(prompt);
  await assert.rejects(processor.analyzeContent(page), /stance groups/);
  await processor.analyzeContent(page); assert.equal(attempts, 2);
  const now = Date.now; Date.now = () => now() + 16 * 60 * 1000;
  try { await processor.analyzeContent(page); assert.equal(attempts, 3); } finally { Date.now = now; }
});

test('forum body, knowledge extraction and follow-up reuse summaries plus selected original supplements', async () => {
  const prompts = [], page = input([comment('ordinary', { text: 'Agree ORDINARY-RAW-DETAIL' }), comment('detail', { text: 'SUPPLEMENT detailed procedure: DETAIL-RAW-EVIDENCE with a caveat' })]);
  page.enabledSections.mindMap = true;
  const original = JSON.stringify(page), processor = new core.AIProcessor(mockHost(prompts));
  const result = await processor.analyzeContent(page);
  assert.equal(prompts.length, 2);
  assert.match(prompts[0], /ORDINARY-RAW-DETAIL/); assert.doesNotMatch(prompts[1], /ORDINARY-RAW-DETAIL|Private name|private-account|comments\/ordinary/);
  assert.match(prompts[1], /DETAIL-RAW-EVIDENCE/); assert.match(prompts[1], /"sourceId":"detail"/);
  assert.equal(result.mindMap[0].sources[0].sourceId, 'detail');
  const extracted = await processor.analyzeEggs(page, [{ fileName: 'Methods.md', instructions: 'Extract useful methods', keyQuestions: [], worthReadingIf: [], skipIf: [], content: '' }], result);
  assert.doesNotMatch(prompts[2], /ORDINARY-RAW-DETAIL/); assert.match(prompts[2], /DETAIL-RAW-EVIDENCE/);
  assert.equal(extracted.eggResults[0].extractedEntries[0].sources[0].sourceId, 'detail');
  await new core.AIProcessor(mockHost(prompts)).askFollowUp(page, ['How?']);
  assert.doesNotMatch(prompts[3], /ORDINARY-RAW-DETAIL/); assert.match(prompts[3], /DETAIL-RAW-EVIDENCE/);
  assert.equal(JSON.stringify(page), original);
  assert.equal(result.discussion.topics[0].highlights[1].source.text, page.discussion.items[1].text);
});

test('supplement evidence is bounded and off mode exposes neither summaries nor cached originals', () => {
  const page = input(Array.from({ length: 5 }, (_, i) => comment(String(i), { text: 'x'.repeat(6000) })));
  const draft = { topics: [{ id: 't', title: 'Detailed methods', stances: { neutral: [0, 1, 2, 3, 4] }, highlights: page.discussion.items.map((_, i) => ({ commentId: i, summary: 'Detail', supplement: true })) }] };
  const compact = core.compactDiscussionRecords(page.discussion.items), analysis = core.buildDiscussionResult(page.discussion, [core.unpackDiscussionPart(draft, page.discussion.items, compact.aliases)]);
  const evidence = core.discussionEvidenceText(page, analysis);
  assert.equal(JSON.parse(evidence.split('\n').at(-1)).reduce((n, item) => n + item.text.length, 0), 8000);
  assert.match(evidence, /"excerpt":true/);
  assert.equal(analysis.topics[0].highlights[0].source.text.length, 6000);
  const off = { ...page, enabledSections: { discussion: false } };
  assert.equal(core.discussionSummaryText(off, analysis), ''); assert.equal(core.discussionEvidenceText(off, analysis), '');
});
