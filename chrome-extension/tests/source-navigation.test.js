const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
function page(t, html, url = 'https://example.test/article') {
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  t.after(() => dom.window.close());
  const win = dom.window, scrolled = [];
  win.HTMLElement.prototype.scrollIntoView = function() { scrolled.push(this); };
  for (const file of ['extractors/discussion', 'source-navigation']) win.eval(fs.readFileSync(require.resolve(`../src/content/${file}.js`), 'utf8'));
  return { win, nav: win.NutEggSources, scrolled };
}
test('text jumps prefer exact supporting passages over broad headings and handle inline markup', async t => {
  const { win, nav, scrolled } = page(t, '<article><h2>Overview</h2><p>Introductory material</p><p id="target">Distinctive <strong>evidence</strong>\n spanning <em>inline elements</em>.</p></article>');
  assert.equal((await nav.jump({ heading: 'Overview', quote: 'Distinctive evidence spanning inline elements.', expectedUrl: win.location.href })).success, true);
  assert.equal(scrolled[0].id, 'target');
  assert.match(scrolled[0].style.outline, /2px/);
});
test('ambiguous or missing quotes never silently jump to a heading or another answer', async t => {
  const { nav, scrolled } = page(t, '<h2>Overview</h2><article><p>Identical answer repeated here</p></article><article><p>Identical answer repeated here</p></article>');
  assert.equal((await nav.jump({ heading: 'Overview', quote: 'Identical answer repeated here' })).reason, 'ambiguous');
  assert.equal((await nav.jump({ heading: 'Overview', quote: 'Missing source excerpt' })).success, false);
  assert.equal(scrolled.length, 0);
});
test('hidden duplicate text is ignored and line breaks normalize for matching', async t => {
  const { nav, scrolled } = page(t, '<p hidden>Evidence across two lines</p><p id="visible">Evidence across<br>two lines</p>');
  assert.equal((await nav.jump({ quote: 'Evidence across two lines' })).success, true);
  assert.equal(scrolled[0].id, 'visible');
});
test('an expected page URL prevents old references scrolling a different page', async t => {
  const { nav, scrolled } = page(t, '<h2>Overview</h2>');
  assert.equal((await nav.jump({ heading: 'Overview', expectedUrl: 'https://example.test/other' })).reason, 'page_changed');
  assert.equal(scrolled.length, 0);
});
test('Zhihu IDs distinguish identical comments under different answers and survive refresh', async t => {
  const html = [1, 2].map(id => `<div class="AnswerItem" data-zop='{"itemId":"${id}"}'><div class="RichContent-inner"><div class="RichText">Answer ${id}</div></div><div class="CommentItemV2" data-comment-id="c${id}" id="comment-${id}"><p class="CommentItemV2-content">Same comment text in both answers</p></div></div>`).join('');
  const { win, nav, scrolled } = page(t, html, 'https://www.zhihu.com/question/123');
  assert.equal((await nav.jump({ sourceId: 'zhihu:c2' })).success, true);
  assert.equal(scrolled[0].id, 'comment-2');
  win.document.getElementById('comment-2').remove();
  assert.equal((await nav.jump({ sourceId: 'zhihu:c2', quote: 'Same comment text in both answers' })).reason, 'not_loaded');
  assert.equal(scrolled.length, 1);
});
test('Bilibili source jumps resolve comments inside nested open shadow roots', async t => {
  const { win, nav, scrolled } = page(t, '<bili-comments></bili-comments>', 'https://www.bilibili.com/video/BV123/');
  const container = win.document.querySelector('bili-comments').attachShadow({ mode: 'open' });
  container.innerHTML = '<bili-comment-thread-renderer></bili-comment-thread-renderer>';
  const thread = container.querySelector('bili-comment-thread-renderer').attachShadow({ mode: 'open' });
  thread.innerHTML = '<bili-comment-renderer rpid="123"></bili-comment-renderer>';
  const comment = thread.querySelector('bili-comment-renderer');
  comment.attachShadow({ mode: 'open' }).innerHTML = '<div id="content"><bili-rich-text></bili-rich-text></div>';
  comment.shadowRoot.querySelector('bili-rich-text').attachShadow({ mode: 'open' }).innerHTML = '<p id="contents">Concrete experience from a commenter</p>';
  assert.equal((await nav.jump({ sourceId: 'bilibili:123' })).success, true);
  assert.equal(scrolled[0], comment);
});

test('content-script messaging keeps the response channel open and reports the real jump result', async t => {
  const { win, scrolled } = page(t, '<p id="evidence">Evidence supporting the statement</p>');
  for (const name of ['YouTube', 'Twitter', 'Bilibili', 'Douyin', 'Weibo', 'Zhihu', 'Forum', 'TikTok', 'Article', 'Generic']) {
    win['detect' + name] = () => false;
    win['extract' + name] = async () => ({});
  }
  let listener;
  win.chrome = { runtime: { onMessage: { addListener: fn => { listener = fn; } } } };
  win.eval(fs.readFileSync(require.resolve('../src/content/content-script.js'), 'utf8'));
  const response = await new Promise(resolve => {
    const asyncResponse = listener({ action: 'nutegg-scroll-to', quote: 'Evidence supporting the statement', expectedUrl: win.location.href }, {}, resolve);
    assert.equal(asyncResponse, true);
  });
  assert.equal(response.success, true);
  assert.equal(scrolled[0].id, 'evidence');
});
