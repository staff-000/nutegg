const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
let windows = [];
test.afterEach(() => { windows.forEach(window => window.close()); windows = []; });
function page(url, body) {
  const dom = new JSDOM(body, { url, runScripts: 'outside-only' });
  windows.push(dom.window);
  for (const file of ['utils', 'extractors/discussion', 'extractors/forum', 'extractors/tiktok', 'extractors/chinese']) dom.window.eval(fs.readFileSync(require.resolve(`../src/content/${file}.js`), 'utf8'));
  return { dom, win: dom.window, collector: dom.window.NutEggDiscussion };
}
const platforms = [
  ['youtube', 'https://www.youtube.com/watch?v=x', '<ytd-comments><ytd-comment-renderer comment-id="c1"><a id="author-text" href="/@alice">Alice</a><div id="content-text">An actual experience</div><span id="vote-count-middle">1.2K</span></ytd-comment-renderer></ytd-comments>', 1200],
  ['tiktok', 'https://www.tiktok.com/@creator/video/123', '<div data-e2e="comment-list"><div data-e2e="comment-item" data-comment-id="c1"><a href="/@alice">Alice</a><p data-e2e="comment-level-1">An actual experience</p><span data-e2e="comment-like-count">12</span></div></div>', 12],
  ['douyin', 'https://www.douyin.com/video/123', '<div data-e2e="comment-list"><div data-e2e="comment-item" data-comment-id="c1"><a href="/user/alice">Alice</a><p data-e2e="comment-content">我有不同的经验</p><span data-e2e="comment-like-count">2万</span></div></div>', 20000],
  ['zhihu', 'https://www.zhihu.com/question/123/answer/456', '<div class="CommentListV2"><div class="CommentItemV2" data-comment-id="c1"><a class="UserLink-link" href="/people/alice">Alice</a><p class="CommentItemV2-content">我有不同的经验</p><button class="CommentItemV2-likeBtn">赞同 12</button></div></div>', 12],
];

test('passive comment observation begins before a slow body capture and retains virtualized comments', async () => {
  const { win, collector } = page('https://www.youtube.com/watch?v=x', '<ytd-comments></ytd-comments>');
  let resolveBody;
  const body = new Promise(resolve => { resolveBody = resolve; });
  win.EXTRACTORS = [{ name: 'slow', detect: () => true, extract: () => body }];
  win.chrome = { runtime: { onMessage: { addListener() {} } } };
  win.eval(fs.readFileSync(require.resolve('../src/content/content-script.js'), 'utf8'));
  const pending = win.extractContent('early-capture');
  assert.equal(collector.snapshot().sessionId, 'early-capture');
  win.document.querySelector('ytd-comments').innerHTML = '<ytd-comment-renderer comment-id="early"><div id="content-text">An experience loaded while the transcript was fetching.</div></ytd-comment-renderer>';
  await new Promise(resolve => setTimeout(resolve, 310));
  win.document.querySelector('ytd-comments').innerHTML = '';
  resolveBody({ title: 'Video', content: 'Transcript', url: win.location.href });
  const capture = await pending;
  assert.equal(capture.discussion.items[0].id, 'youtube:early');
  assert.match(capture.discussion.items[0].text, /while the transcript/);
});

test('loaded long comments retain their full text within the total capture budget', () => {
  const longText = 'Detailed experience. '.repeat(1200);
  const { collector } = page('https://www.youtube.com/watch?v=x', `<ytd-comments><ytd-comment-renderer comment-id="long"><div id="content-text">${longText}</div></ytd-comment-renderer></ytd-comments>`);
  const capture = collector.snapshot();
  assert.equal(capture.items[0].text, longText.trim()); assert.equal(capture.truncated, false);
});
for (const [name, url, html, count] of platforms) test(`${name} adapter extracts loaded comments, identities and reactions`, () => {
  const { dom, collector } = page(url, html);
  const d = collector.snapshot(); assert.equal(d.items.length, 1); assert.equal(d.items[0].reaction.count, count);
  assert.equal(d.items[0].author, 'Alice');
  assert(d.items[0].authorId.includes('alice')); assert.equal(d.status, 'partial'); dom.window.close();
});

test('comment authors prefer the visible username over an earlier empty avatar link', () => {
  const { collector } = page('https://www.tiktok.com/@creator/video/123', '<div data-e2e="comment-list"><div data-e2e="comment-item" data-comment-id="c1"><a href="/@alice"><img alt="Avatar"></a><a href="/@alice"><span>Alice</span></a><p data-e2e="comment-level-1">An experience</p></div></div>');
  const item = collector.snapshot().items[0];
  assert.equal(item.author, 'Alice');
  assert.equal(item.authorId, 'https://www.tiktok.com/@alice');
});

test('a parent never borrows its nested reply author, and captured names survive partial rerenders', () => {
  const { win, collector } = page('https://www.tiktok.com/@creator/video/123', '<div data-e2e="comment-list"><div data-e2e="comment-item" data-comment-id="parent"><a href="/@alice"></a><p data-e2e="comment-level-1">Parent experience</p><div data-e2e="comment-item" data-comment-id="reply"><a href="/@bob">Bob</a><p data-e2e="comment-level-2">Reply experience</p></div></div></div>');
  let items = collector.snapshot().items;
  assert.equal(items[0].author, undefined);
  assert.equal(items[0].authorId, 'https://www.tiktok.com/@alice');
  assert.equal(items[1].author, 'Bob');
  const author = win.document.querySelector('[data-comment-id="parent"] > a');
  author.textContent = 'Alice';
  items = collector.snapshot().items;
  assert.equal(items[0].author, 'Alice');
  author.remove();
  items = collector.snapshot().items;
  assert.equal(items[0].author, 'Alice');
  assert.equal(items[0].authorId, 'https://www.tiktok.com/@alice');
  assert.equal(items[1].author, 'Bob');
});

test('Reddit separates short original post, excludes recommendations and auto-enables long discussion', () => {
  const comments = [1, 2, 3].map(id => `<shreddit-comment thingid="t1_${id}" ${id === 2 ? 'parentid="t1_1"' : ''}><a slot="authorName" href="/user/u${id}">User ${id}</a><div slot="comment">${'Substantive experience. '.repeat(20)}</div><span slot="vote-count">-3</span></shreddit-comment>`).join('');
  const { dom, collector } = page('https://www.reddit.com/r/test/comments/post/title/', `<h1>Topic</h1><shreddit-post comment-count="100"><div slot="text-body">Short question</div></shreddit-post><shreddit-comment-tree>${comments}</shreddit-comment-tree><aside>Recommendations</aside>`);
  const c = collector.decorate({ title: 'Topic', content: 'Entire page with recommendations' });
  assert.equal(c.discussion.autoEnable, true); assert.equal(c.discussion.items.length, 3);
  assert.equal(c.discussion.items[1].parentId, 'reddit:t1_1'); assert.equal(c.discussion.items[0].reaction.kind, 'score');
  assert.doesNotMatch(c.content, /Recommendations|Substantive/); assert.match(c.content, /Short question/); dom.window.close();
});

test('Discourse and traditional forum adapters keep first post as body and later posts as discussion', () => {
  for (const html of [
    '<h1>Topic</h1><div id="topic"><div class="topic-post" id="post_1"><div class="cooked">Original</div></div><div class="topic-post" id="post_2"><div class="cooked">Reply experience</div></div></div>',
    '<h1>Topic</h1><article class="message" id="post_1"><div class="message-body"><div class="bbWrapper">Original</div></div></article><article class="message" id="post_2"><div class="message-body"><div class="bbWrapper">Reply experience</div></div></article>',
  ]) {
    const { dom, win, collector } = page('https://forum.test/topic/1', html);
    assert.equal(win.detectForum(), true);
    const c = collector.decorate(win.extractForum());
    assert.match(c.content, /Original/); assert.doesNotMatch(c.content, /Reply experience/);
    assert.equal(c.discussion.items.length, 1); assert.equal(c.discussion.items[0].text, 'Reply experience'); dom.window.close();
  }
});

test('Bilibili discovers loaded comment content in open shadow roots', () => {
  const { dom, win, collector } = page('https://www.bilibili.com/video/BV123', '<bili-comments></bili-comments>');
  const host = win.document.querySelector('bili-comments'); host.attachShadow({ mode: 'open' }).innerHTML = '<bili-comment-thread-renderer rpid="123"></bili-comment-thread-renderer>';
  const thread = host.shadowRoot.querySelector('bili-comment-thread-renderer'); thread.attachShadow({ mode: 'open' }).innerHTML = '<a id="user-name" href="https://space.bilibili.com/123">User</a><div id="content">Experience</div><div id="like"><span id="count">10</span></div>';
  const d = collector.snapshot(); assert.equal(d.items.length, 1); assert.equal(d.items[0].reaction.count, 10); dom.window.close();
});

test('Zhihu question answers are captured as discussion, including answers loaded after initial capture', async () => {
  const { dom, win, collector } = page('https://www.zhihu.com/question/123', '<h1 class="QuestionHeader-title">Question</h1><div class="QuestionRichText">Details</div><div class="AnswerItem" data-zop=\'{"itemId":"456"}\'><a class="UserLink-link" href="/people/user">User</a><div class="RichContent-inner"><div class="RichText">Answer experience</div></div></div>');
  const c = collector.decorate(await win.extractZhihu());
  assert.match(c.content, /Details/); assert.doesNotMatch(c.content, /Answer experience/);
  assert.equal(c.discussion.kind, 'forum'); assert.equal(c.discussion.items.length, 1);
  win.document.querySelector('.AnswerItem').insertAdjacentHTML('afterend', '<div class="AnswerItem" data-zop=\'{"itemId":"789"}\'><div class="RichContent-inner"><div class="RichText">Newly loaded answer</div></div></div>');
  assert.equal(collector.snapshot().items.length, 2); dom.window.close();
});

test('observer retains comments removed by virtualization, deduplicates reloads, and resets on navigation', async () => {
  const { dom, win, collector } = page(platforms[0][1], platforms[0][2]);
  collector.start('one');
  const list = win.document.querySelector('ytd-comments');
  list.insertAdjacentHTML('beforeend', '<ytd-comment-renderer comment-id="c2"><div id="content-text">Later comment</div></ytd-comment-renderer>');
  await new Promise(resolve => setTimeout(resolve, 300)); list.lastElementChild.remove();
  assert.equal(collector.snapshot().items.length, 2);
  assert.equal(collector.snapshot().items.length, 2);
  dom.reconfigure({ url: 'https://www.youtube.com/watch?v=new' }); list.innerHTML = '';
  assert.equal(collector.snapshot().items.length, 0); assert.equal(collector.snapshot().status, 'not_loaded'); collector.stop(); win.close();
});

test('same text from distinct authors is preserved and unknown reactions remain unknown', () => {
  const html = ['alice', 'bob'].map(author => `<div data-e2e="comment-item"><a href="/@${author}">${author}</a><p data-e2e="comment-level-1">Identical text</p><span data-e2e="comment-like-count">Like</span></div>`).join('');
  const { dom, collector } = page(platforms[1][1], `<div data-e2e="comment-list">${html}</div>`);
  const d = collector.snapshot(); assert.equal(d.items.length, 2); assert.equal(d.items[0].reaction.count, null); dom.window.close();
});

test('unloaded comments are not declared empty, explicit empty and disabled messages are distinguished', () => {
  const { dom, win, collector } = page(platforms[0][1], '<ytd-comments></ytd-comments>');
  assert.equal(collector.snapshot().status, 'not_loaded');
  win.document.querySelector('ytd-comments').innerHTML = '<ytd-message-renderer><div id="message">No comments yet</div></ytd-message-renderer>';
  assert.equal(collector.snapshot().status, 'empty');
  win.document.querySelector('#message').textContent = 'Comments are turned off';
  assert.equal(collector.snapshot().status, 'unavailable'); assert.equal(collector.snapshot().reason, 'disabled'); dom.window.close();
});

test('new Bilibili shadow roots discovered after capture starts are observed before virtualization removes them', async () => {
  const { dom, win, collector } = page('https://www.bilibili.com/video/BV123', '<bili-comments></bili-comments>');
  collector.start('shadow');
  const host = win.document.querySelector('bili-comments');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<bili-comment-thread-renderer rpid="1"></bili-comment-thread-renderer>';
  const thread = shadow.querySelector('bili-comment-thread-renderer'); thread.attachShadow({ mode: 'open' }).innerHTML = '<div id="content">Initial</div>';
  collector.snapshot(); // Poll discovers newly created roots and starts watching them.
  const later = win.document.createElement('bili-comment-thread-renderer'); later.setAttribute('rpid', '2'); later.innerHTML = '<div id="content">Later experience</div>'; shadow.appendChild(later);
  await new Promise(resolve => setTimeout(resolve, 300)); shadow.lastElementChild.remove();
  assert.equal(collector.snapshot().items.length, 2); dom.window.close();
});

test('reaction counts support decimal-comma suffixes and localized thousands separators', () => {
  const { dom, win, collector } = page(platforms[0][1], '');
  assert.equal(collector.number('1,2 K').count, 1200);
  assert.equal(collector.number('1,234').count, 1234);
  assert.equal(collector.number('2.5万').count, 25000);
  win.document.documentElement.lang = 'de';
  assert.equal(collector.number('1.234').count, 1234);
  dom.window.close();
});

test('Reddit threads auto-enable discussion for long bodies and before comments load', () => {
  const { collector } = page('https://www.reddit.com/r/test/comments/post/title/', `<shreddit-post><div slot="text-body">${'Long original post. '.repeat(100)}</div></shreddit-post>`);
  const c = collector.decorate({ title: 'Topic', content: 'Fallback' });
  assert(c.discussion.bodyLength > 500);
  assert.equal(c.discussion.autoEnable, true);
  assert.equal(c.discussion.status, 'not_loaded');
});

test('Bilibili extracts nested text, user and toolbar components once, with reply ownership', () => {
  const { win, collector } = page('https://www.bilibili.com/video/BV1tCaV6AENJ/', '<bili-comments></bili-comments>');
  function shadow(host, html) { host.attachShadow({ mode: 'open' }).innerHTML = html; return host.shadowRoot; }
  const feed = shadow(win.document.querySelector('bili-comments'), '<div id="feed"><bili-comment-thread-renderer rpid="123"></bili-comment-thread-renderer></div>');
  const thread = shadow(feed.querySelector('bili-comment-thread-renderer'), '<bili-comment-renderer rpid="123"></bili-comment-renderer><bili-comment-replies-renderer></bili-comment-replies-renderer>');
  function fill(host, name, uid, content, likes) {
    const root = shadow(host, '<bili-comment-user-info></bili-comment-user-info><div id="content"><bili-rich-text></bili-rich-text></div><bili-comment-action-buttons-renderer></bili-comment-action-buttons-renderer>');
    shadow(root.querySelector('bili-comment-user-info'), `<div id="info"><div id="user-name"><a href="https://space.bilibili.com/${uid}">${name}</a></div></div>`);
    shadow(root.querySelector('bili-rich-text'), `<div id="contents"><span>${content}</span></div><style>not comment text</style>`);
    shadow(root.querySelector('bili-comment-action-buttons-renderer'), `<div id="like"><span id="count">${likes}</span></div>`);
  }
  fill(thread.querySelector('bili-comment-renderer'), 'Main author', '11', 'First-hand experience', '1.2万');
  const replies = shadow(thread.querySelector('bili-comment-replies-renderer'), '<bili-comment-reply-renderer rpid="456"></bili-comment-reply-renderer>');
  fill(replies.querySelector('bili-comment-reply-renderer'), 'Reply author', '22', 'Different experience', '15');
  let d = collector.snapshot();
  assert.equal(d.items.length, 2);
  assert.equal(d.items[0].text, 'First-hand experience');
  assert.equal(d.items[0].author, 'Main author');
  assert.equal(d.items[0].authorId, 'https://space.bilibili.com/11');
  assert.equal(d.items[0].reaction.count, 12000);
  assert.equal(d.items[1].text, 'Different experience');
  assert.equal(d.items[1].parentId, 'bilibili:123');
  assert.equal(d.items[1].reaction.count, 15);
  assert.equal(collector.snapshot().items.length, 2);
});

test('Zhihu keeps three answer discussions separate, including nested replies and identified external panels', () => {
  const answers = [1, 2, 3].map(id => `<div class="AnswerItem" data-zop='{"itemId":"${id}"}'><a class="UserLink-link" href="/people/answer${id}">Author ${id}</a><div class="RichContent-inner"><div class="RichText">Answer ${id} argument</div></div><div class="CommentListV2"><div class="CommentItemV2" data-comment-id="c${id}"><a class="UserLink-link" href="/people/comment${id}">Commenter ${id}</a><p class="CommentItemV2-content">Response to answer ${id}</p>${id === 2 ? '<div class="CommentItemV2" data-comment-id="reply"><p class="CommentItemV2-content">Reply to commenter 2</p></div>' : ''}</div></div></div>`).join('');
  const { collector } = page('https://www.zhihu.com/question/123', answers + '<div class="CommentListV2" data-answer-id="3"><div class="CommentItemV2" data-comment-id="external"><p class="CommentItemV2-content">Identified panel for answer 3</p></div></div><div class="CommentListV2"><div class="CommentItemV2" data-comment-id="unknown"><p class="CommentItemV2-content">Unidentified floating panel</p></div></div>');
  const items = new Map(collector.snapshot().items.map(item => [item.id, item]));
  for (const id of [1, 2, 3]) {
    assert.equal(items.get(`zhihu:c${id}`).parentId, `zhihu:answer-${id}`);
    assert.equal(items.get(`zhihu:answer-${id}`).text, `Answer ${id} argument`);
    assert.equal(items.get(`zhihu:c${id}`).text, `Response to answer ${id}`);
  }
  assert.equal(items.get('zhihu:reply').parentId, 'zhihu:c2');
  assert.equal(items.get('zhihu:external').parentId, 'zhihu:answer-3');
  assert.equal(items.has('zhihu:unknown'), false);
});
