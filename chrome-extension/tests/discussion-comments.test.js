const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { fixture } = require('./helpers/popup-fixture');
const { DiscussionComponent } = require('../src/popup/ui/discussion');
const { InteractionAction } = require('../src/popup/action/interaction');
const core = globalThis.NutEggAI;
const stances = ['agree', 'disagree', 'mixed', 'unclear', 'neutral'];
const capture = items => ({ kind: 'comments', status: 'partial', items });
const part = classifications => ({ topics: [{ id: 't', title: 'Experiences' }], classifications });
const label = (commentId, stance) => ({ commentId, topicId: 't', stance });

test('local source IDs exactly match counted stances after merging chunks and conflicting labels', () => {
  const d = capture([{ id: 'a', text: 'First experience' }, { id: 'b', text: 'Counterexample' }]);
  const result = core.buildDiscussionResult(d, [part([label('a', 'agree'), label('a', 'agree'), label('invented', 'neutral')]),
    part([label('a', 'disagree'), label('b', 'disagree')])], { topics: [{ title: 'Experiences', mergeTopicIds: ['0:t', '1:t'] }] });
  const topic = result.topics[0];
  assert.deepEqual(topic.commentIds.mixed, ['a']);
  assert.deepEqual(topic.commentIds.disagree, ['b']);
  assert.deepEqual(topic.commentIds.agree, []);
  for (const stance of stances) assert.equal(topic.commentIds[stance].length, topic.metrics[stance].comments);
  // Keeping local IDs changes neither the prompt context nor its length.
  const input = { discussion: d, enabledSections: { discussion: true } };
  const withoutIds = structuredClone(result);
  delete withoutIds.topics[0].commentIds;
  assert.equal(core.discussionSummaryText(input, result), core.discussionSummaryText(input, withoutIds));
  assert.equal(core.discussionEvidenceText(input, result), core.discussionEvidenceText(input, withoutIds));
});

test('each stance badge toggles escaped original quotes locally and preserves keyboard focus', () => {
  const f = fixture();
  const dom = new JSDOM('<section id="discussion-section"><div id="discussion-result"></div></section>');
  const root = dom.window.document, ui = new DiscussionComponent(root);
  const items = stances.map((stance, index) => ({ id: stance, author: `Author ${index} <script>`,
    text: `${stance} original <img src=x onerror=alert(1)>\n${'Detailed experience. '.repeat(80)}`,
    ...(index === 1 ? {} : { reaction: { kind: 'likes', count: index } }) }));
  const d = capture(items), result = core.buildDiscussionResult(d, [part(stances.map(stance => label(stance, stance)))]);
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry: { result: { mode: 'chrome', discussion: result },
    capturePayload: { discussion: d, enabledSections: { discussion: true } } } });
  const action = new InteractionAction({ tabStateManager: f.store });
  ui.init({ onToggle: (id, stance) => action.toggleDiscussionComments(id, stance) });
  f.store.subscribe(() => ui.render(f.store.viewModel()));
  ui.render(f.store.viewModel());
  assert.equal(root.querySelectorAll('blockquote').length, 0);
  for (const [index, stance] of stances.entries()) {
    const badge = () => root.querySelector(`[data-discussion-stance="${stance}"]`);
    badge().querySelector('strong').click();
    const quote = root.querySelector('blockquote');
    assert.equal(quote.textContent, items[index].text);
    assert.equal(root.querySelectorAll('blockquote').length, 1);
    assert.equal(badge().getAttribute('aria-expanded'), 'true');
    assert.equal(root.activeElement, badge());
    assert.equal(root.querySelectorAll('script, img, a').length, 0);
    const panel = root.getElementById(badge().getAttribute('aria-controls'));
    assert.equal(panel.classList.contains('hidden'), false);
    assert.equal(panel.querySelector('.discussion-original-meta span')?.textContent,
      index === 1 ? undefined : `${index} likes`);
  }
  root.querySelector('[data-discussion-stance="neutral"]').click();
  assert.equal(root.querySelectorAll('blockquote').length, 0);
  assert.equal(f.calls.length, 0);
  assert.equal(f.store.isBusy(1), false);
  dom.window.close();
});

test('drill-down uses the analyzed snapshot and explains missing originals without guessing', () => {
  const dom = new JSDOM('<section id="discussion-section"><div id="discussion-result"></div></section>');
  const root = dom.window.document, ui = new DiscussionComponent(root);
  const d = capture([{ id: 'a', text: 'Saved original' }, { id: 'b', text: 'Second original' }]);
  const result = core.buildDiscussionResult(d, [part([label('a', 'agree'), label('b', 'agree')])]);
  const view = { enabledSections: { discussion: true }, analysisResult: { discussion: result },
    stage1Payload: { discussion: capture([d.items[0]]) },
    extractedContent: { discussion: capture([{ id: 'a', text: 'Edited later' }, { id: 'b', text: 'New page comment' }]) },
    presentation: { discussionComments: { 'topic-1': 'agree' } } };
  ui.render(view);
  assert.equal(root.querySelector('blockquote').textContent, 'Saved original');
  assert.match(root.querySelector('.discussion-originals-missing').textContent, /1 comments/);
  assert.doesNotMatch(root.body.textContent, /Edited later|New page comment/);
  delete result.topics[0].commentIds;
  ui.render(view);
  assert.equal(root.querySelectorAll('blockquote').length, 0);
  assert.equal(root.querySelector('.discussion-metric').getAttribute('aria-expanded'), 'true');
  assert.match(root.querySelector('.discussion-comments-panel').textContent, /no saved comment groups/);
  dom.window.close();
});
