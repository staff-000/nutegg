const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const core = new Function(fs.readFileSync(require.resolve('../dist/ai-core.js'), 'utf8') + '\nreturn NutEggAI;')();
const { fixture, deferred } = require('./helpers/popup-fixture');
const { SettingsState } = require('../src/popup/state/settings-state');
const { createMockRoot } = require('./helpers/mock-dom');
const { DiscussionComponent } = require('../src/popup/ui/discussion');
const { SectionChipsComponent } = require('../src/popup/ui/section-chips');
const { getAnalyzeNotReadyReason } = require('../src/popup/helpers');
const item = (id, authorId = id, count = 2, kind = 'likes') => ({ id, authorId, author: id, text: 'My experience provides a substantive argument', reaction: { kind, count } });
const capture = items => ({ kind: 'forum', status: 'partial', items, bodyLength: 5, autoEnable: true });
const topic = id => ({ id, title: 'Claim debated', claim: 'Proposition', summary: 'Experience and objections', agreeArguments: ['Experience'], disagreeArguments: ['Counterexample'], highlights: [{ commentId: 'a', summary: 'Practical example' }] });
const part = labels => ({ topics: [topic('t')], classifications: labels.map(([commentId, stance]) => ({ commentId, topicId: 't', stance })) });

test('legacy settings leave discussion off; discussion can be the only selected section', async () => {
  global.chrome = { storage: { local: { get: (_, callback) => callback({ enabledSections: { mindMap: false } }) } } };
  const settings = new SettingsState(); await settings.loadFromStorage();
  assert.equal(settings.enabledSections.discussion, false);
  const next = settings.getToggledSections('mindMap', { titleVerdict: false, coreSummary: false, mindMap: true, discussion: true });
  assert.equal(next.mindMap, false); assert.equal(next.discussion, true);
});

test('auto-on remains per-page; manual off survives re-extraction and remains nonblocking', () => {
  const { store } = fixture();
  let ctx = store.beginOperation(1, 'extraction');
  const content = { ...ctx.tab.extractedContent, discussion: capture([item('a')]) };
  store.commitOperation(ctx.token, { type: 'extracted', content });
  assert.equal(store.getTab(1).enabledSections.discussion, true);
  assert.notEqual(store.getTab(2).enabledSections.discussion, true);
  store.dispatch({ type: 'draft', tabId: 1, values: { discussionOverride: false, enabledSections: { ...store.getTab(1).enabledSections, discussion: false } } });
  ctx = store.beginOperation(1, 'extraction'); store.commitOperation(ctx.token, { type: 'extracted', content });
  assert.equal(store.getTab(1).enabledSections.discussion, false);
  assert.match(store.viewModel().warning, /little information/);
  assert.equal(getAnalyzeNotReadyReason(store.viewModel(), { serverOnline: true }), null);
});

test('metrics count original IDs, exclusive author positions, missing reactions and scores separately', () => {
  const d = capture([item('a', 'u', 10), item('b', 'u', 5), item('c', 'v', -3, 'score'), item('d', undefined, null)]);
  const result = core.buildDiscussionResult(d, [part([['a', 'agree'], ['a', 'agree'], ['b', 'disagree'], ['c', 'disagree'], ['d', 'neutral'], ['invented', 'agree']])]);
  const m = result.topics[0].metrics;
  assert.equal(m.agree.comments, 1); assert.equal(m.agree.likes, 10);
  assert.equal(m.disagree.comments, 2); assert.equal(m.disagree.score, -3); assert.equal(m.disagree.likes, 5);
  assert.equal(m.mixed.commenters, 1); assert.equal(m.disagree.commenters, 1);
  assert.equal(m.neutral.reactionsMissing, 1);
  assert.equal(result.topics[0].highlights[0].source.id, 'a');
  d.items[3].authorId = undefined;
  assert.equal(core.buildDiscussionResult(d, [part([['d', 'neutral']])]).topics[0].metrics.neutral.commenters, null);
});

test('normalization preserves same text from different authors, rejects invalid likes and unsafe URLs', () => {
  const d = core.normalizeDiscussion(capture([item('a'), item('b'), item('a'), { ...item('c'), url: 'javascript:alert(1)', reaction: { kind: 'likes', count: -4 } }]));
  assert.equal(d.items.length, 3); assert.equal(d.items[2].url, undefined); assert.equal(d.items[2].reaction.count, null);
});

test('unloaded, unavailable, empty and semantically empty discussion are distinct', () => {
  assert.equal(core.discussionBase().status, 'not_loaded');
  assert.equal(core.discussionBase({ ...capture([]), status: 'unavailable' }).status, 'unavailable');
  assert.equal(core.discussionBase({ ...capture([]), status: 'empty' }).status, 'no_meaningful');
  assert.equal(core.buildDiscussionResult(capture([item('a')]), [{ topics: [], classifications: [] }]).status, 'no_meaningful');
});

test('chunk topic merging deduplicates classifications and does not accept invented metrics', () => {
  const d = capture([item('a'), item('b')]);
  const result = core.buildDiscussionResult(d, [part([['a', 'agree']]), part([['b', 'disagree'], ['a', 'agree']])], {
    topics: [{ ...topic('merged'), mergeTopicIds: ['0:t', '1:t'], metrics: { agree: 100000 } }],
  });
  assert.equal(result.topics.length, 1); assert.equal(result.topics[0].metrics.agree.comments, 1);
  assert.equal(result.topics[0].metrics.disagree.comments, 1);
});

test('discussion-only pipeline and off mode do not pay for or expose disabled sources', async () => {
  const prompts = [];
  const processor = new core.AIProcessor({ settings: { aiProvider: 'openai', aiApiKey: 'test' }, aiClient: { chat: async prompt => { prompts.push(prompt); return JSON.stringify(part([['a', 'agree']])); } } });
  const input = { url: 'https://example.test', title: 'Title', content: 'Body', sourceType: 'forum', discussion: capture([item('a')]), enabledSections: { titleVerdict: false, coreSummary: false, mindMap: false, discussion: true } };
  const result = await processor.analyzeContent(input);
  assert.equal(result.discussion.status, 'ready'); assert.equal(prompts.length, 1);
  await processor.analyzeContent({ ...input, enabledSections: { ...input.enabledSections, discussion: false } });
  assert.equal(prompts.length, 1);
  assert.equal(core.discussionSourceText({ ...input, enabledSections: { discussion: false } }), '');
});

test('long discussion retains labels and parent context while aggregating topic drafts', async () => {
  const prompts = [], items = ['a', 'b', 'c'].map(id => ({ ...item(id), text: 'x'.repeat(6000), parentId: id === 'a' ? undefined : 'a' }));
  const processor = new core.AIProcessor({ settings: { aiProvider: 'openai', aiApiKey: 'test', chunkWindowChars: 1000 }, aiClient: { chat: async prompt => {
    prompts.push(prompt);
    if (prompt.startsWith('Merge discussion')) return JSON.stringify({ topics: [{ ...topic('m'), mergeTopicIds: ['0:t', '1:t', '2:t'] }] });
    const id = JSON.parse(prompt.match(/Discussion items to analyze: (.*)\n/)[1])[0].id;
    return JSON.stringify(part([[id, id === 'a' ? 'agree' : 'disagree']]));
  } } });
  const result = await processor.analyzeContent({ url: 'https://example.test', title: 'T', content: 'Short', sourceType: 'forum', discussion: capture(items), enabledSections: { titleVerdict: false, coreSummary: false, mindMap: false, discussion: true } });
  assert.equal(result.discussion.topics.length, 1); assert.equal(result.discussion.analyzedCount, 3);
  assert.equal(result.discussion.topics[0].metrics.disagree.comments, 2);
  assert.match(prompts[1], /Parent comments.*"id":"a"/);
});

test('loading updates cannot alter an analysis snapshot, saved source or another tab', async () => {
  const { store, operations, extractor, calls, service } = fixture();
  store.dispatch({ type: 'draft', tabId: 1, values: { enabledSections: { ...store.getTab(1).enabledSections, discussion: true } } });
  const waiting = deferred(); let publish;
  extractor.collectDiscussion = (_, options) => { publish = options.onUpdate; return waiting.promise; };
  const loading = operations.discussion(1);
  publish({ ...capture([item('a')]), url: 'https://tab1.test' }, true);
  const analysis = operations.analyze(1, { chromeMode: true });
  publish({ ...capture([item('a'), item('b')]), url: 'https://tab1.test' }, true);
  assert.equal(calls[0].payload.discussion.items.length, 1);
  assert.equal(store.getTab(2).extractedContent.discussion, undefined);
  calls[0].resolve({ mode: 'chrome', titleVerdict: 'Result', coreSummary: [] }); await analysis;
  let saved; service.sendMessage = async message => { saved = message.payload; return { success: true }; };
  await operations.save(1, false); assert.equal(saved.discussion.items.length, 1);
  store.invalidateTab(1, 'https://new.test');
  publish({ ...capture([item('c')]), url: 'https://tab1.test' }, false); waiting.resolve(null); await loading;
  assert.equal(store.getTab(1).extractedContent, null);
});

test('discussion UI distinguishes not analyzed from empty and escapes sources and arguments', () => {
  const root = createMockRoot(), ui = new DiscussionComponent(root), view = { enabledSections: { discussion: true }, analysisResult: {}, extractedContent: {} };
  ui.render(view); assert.match(root.getElementById('discussion-result').textContent, /not been analyzed/);
  const result = core.buildDiscussionResult(capture([{ ...item('a'), author: '<script>', text: '<img src=x>', url: 'https://example.test/comment/a' }]), [part([['a', 'agree']])]);
  view.analysisResult.discussion = result; ui.render(view);
  assert(!root.getElementById('discussion-result').innerHTML.includes('<script>'));
  const html = root.getElementById('discussion-result').innerHTML;
  assert.doesNotMatch(html, /<a\b|<blockquote\b|&lt;img|example\.test/);
  assert.match(html, /Practical example/);
  view.analysisResult.discussion = { ...result, status: 'no_meaningful' }; ui.render(view);
  assert.match(root.getElementById('discussion-result').textContent, /No meaningful discussion/);
});

test('both Discussion chips default off and synchronize when enabled', () => {
  const root = createMockRoot(), ui = new SectionChipsComponent(root); let key;
  ui.init({ onToggle: k => { key = k; } }); ui.updateUI({ titleVerdict: true, coreSummary: true, mindMap: true });
  assert.equal(ui.chipDiscussion['aria-pressed'], 'false'); assert.equal(ui.sectionsBadge.textContent, '3/4');
  ui.chipDiscussion.click(); assert.equal(key, 'discussion');
  ui.updateUI({ titleVerdict: true, coreSummary: true, mindMap: true, discussion: true });
  assert.equal(ui.reanalyzeChipDiscussion['aria-pressed'], 'true'); assert.equal(ui.sectionsBadge.textContent, '4/4');
});

test('history replays the discussion selector and exact sources without changing defaults', () => {
  const { store } = fixture();
  const source = { ...store.getTab(1).extractedContent, metadata: { author: 'Original author', platform: 'forum' }, enabledSections: { discussion: true }, discussion: capture([item('a')]) };
  store.dispatch({ type: 'historySelected', tabId: 1, entry: { title: source.title, url: source.url, content: source.content, sourceType: source.sourceType, capturePayload: source, result: { titleVerdict: 'Historic result' }, nutId: 10 } });
  assert.equal(store.getTab(1).enabledSections.discussion, true);
  assert.equal(store.getTab(1).stage1Payload.discussion.items[0].id, 'a');
  assert.equal(store.getTab(1).extractedContent.metadata.platform, 'forum');
  assert.notEqual(store.defaults.enabledSections.discussion, true);
});

test('follow-up keeps a selected discussion excerpt even when the body is long', async () => {
  let prompt;
  const processor = new core.AIProcessor({ settings: { aiProvider: 'openai', aiApiKey: 'test', chunkWindowChars: 1000 }, aiClient: { chat: async value => { prompt = value; return JSON.stringify({ answers: [{ question: 'What did they experience?', answer: 'Reported experience' }] }); } } });
  await processor.askFollowUp({ url: 'https://example.test', title: 'Title', content: 'Body '.repeat(5000), sourceType: 'video', enabledSections: { discussion: true }, discussion: capture([item('a')]) }, ['What did they experience?']);
  assert.match(prompt, /My experience provides a substantive argument/);
});

test('discussion input is bounded by the total text budget as well as item count', () => {
  const d = core.normalizeDiscussion(capture(Array.from({ length: 100 }, (_, index) => ({ ...item(String(index)), text: 'x'.repeat(6000) }))));
  assert.equal(d.items.length, 25); assert.equal(d.truncated, true);
});

// A Reddit default does not imply that its original post is short.
test('disabling discussion on a long Reddit body does not show the short-body warning', () => {
  const { store } = fixture();
  const ctx = store.beginOperation(1, 'extraction');
  store.commitOperation(ctx.token, { type: 'extracted', content: { ...ctx.tab.extractedContent, discussion: { ...capture([]), bodyLength: 1500 } } });
  store.dispatch({ type: 'draft', tabId: 1, values: { discussionOverride: false, enabledSections: { ...store.getTab(1).enabledSections, discussion: false } } });
  assert.doesNotMatch(store.viewModel().warning || '', /little information/);
});

test('compact discussion badges omit unavailable reactions, people and verbose topic details', () => {
  const root = createMockRoot(), ui = new DiscussionComponent(root);
  const result = core.buildDiscussionResult(capture([item('a', 'u', 12), item('b', 'v', null), item('c', 'w', 0)]), [part([['a', 'agree'], ['b', 'disagree'], ['c', 'neutral']])]);
  ui.render({ enabledSections: { discussion: true }, analysisResult: { discussion: result }, extractedContent: {} });
  const html = root.getElementById('discussion-result').innerHTML;
  assert.match(html, /Agree<\/strong> 💬 1 · ❤️ 12/);
  assert.match(html, /Disagree<\/strong> 💬 1<\/span>/);
  assert.match(html, /Neutral<\/strong> 💬 1 · ❤️ 0/);
  assert.doesNotMatch(html, /commenters|unavailable|Supporting arguments|Opposing arguments|Proposition|Experience and objections|entire audience/);
  assert.match(html, /Practical example/);
});

test('detail-rich supplements survive source validation and render alongside compact groups', () => {
  const root = createMockRoot(), ui = new DiscussionComponent(root);
  const draft = part([['a', 'agree'], ['b', 'neutral']]);
  draft.topics[0].highlights.push({ commentId: 'b', summary: 'A six-month trial found that adjusting the dose improved results, but only with consistent follow-up.', supplement: true });
  draft.topics[0].highlights.push({ commentId: 'invented', summary: 'Unsupported detail', supplement: true });
  const result = core.buildDiscussionResult(capture([item('a'), item('b')]), [draft]);
  assert.equal(result.topics[0].highlights[1].supplement, true);
  assert.equal(result.topics[0].highlights.length, 2);
  ui.render({ enabledSections: { discussion: true }, analysisResult: { discussion: result }, extractedContent: {} });
  const html = root.getElementById('discussion-result').innerHTML;
  assert.match(html, /discussion-highlights.*Practical example/);
  assert.match(html, /discussion-supplements.*Extra insights.*six-month trial/);
  assert.equal(html.match(/six-month trial/g).length, 1);
  assert.doesNotMatch(html, /Unsupported detail/);
});

test('discussion topics render arguments directly when highlights are empty and omit overall verdict', () => {
  const root = createMockRoot(), ui = new DiscussionComponent(root);
  const result = {
    status: 'ready',
    analyzedCount: 2,
    capturedCount: 2,
    topics: [{
      id: 't1',
      title: 'Performance Comparison',
      summary: 'Debating memory and CPU usage',
      agreeArguments: ['Lower CPU overhead in production'],
      disagreeArguments: ['Higher memory consumption in large datasets'],
      highlights: [],
      metrics: { agree: { comments: 1, likes: 0, likesKnown: 0, score: 0, scoresKnown: 0 } }
    }]
  };
  ui.render({ enabledSections: { discussion: true }, analysisResult: { discussion: result }, extractedContent: {} });
  const html = root.getElementById('discussion-result').innerHTML;
  assert.match(html, /Performance Comparison/);
  assert.match(html, /Lower CPU overhead in production/);
  assert.match(html, /Higher memory consumption in large datasets/);
  assert.doesNotMatch(html, /overallVerdict/i);
});

test('discussion prompt templates focus on distinct topics and arguments without overall verdict', () => {
  const processor = new core.AIProcessor({ settings: { aiProvider: 'openai', aiApiKey: 'test' } });
  const analysisPrompt = processor.getPrompt('discussionAnalysis');
  const aggregatePrompt = processor.getPrompt('aggregateDiscussion');
  assert.match(analysisPrompt, /distinct topics\/questions people are debating/);
  assert.match(analysisPrompt, /specific arguments and perspectives/);
  assert.match(aggregatePrompt, /Keep distinct topics, arguments, counter-arguments/);
  assert.doesNotMatch(analysisPrompt, /overallVerdict/);
  assert.doesNotMatch(aggregatePrompt, /overallVerdict/);
});
