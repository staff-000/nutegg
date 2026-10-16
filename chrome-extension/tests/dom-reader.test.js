const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
function page(t, html = '', url = 'https://example.test/article') {
  const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const w = dom.window;
  w.chrome = { runtime: { sendMessage: async () => ({}), onMessage: { addListener() {} } } };
  for (const file of [
    '../../dist/page-identity',
    'utils',
    'dom-reader',
    'extractors/article',
    'extractors/generic',
    'extractors/twitter',
  ])
    w.eval(fs.readFileSync(require.resolve(`../src/content/${file}.js`), 'utf8'));
  return w;
}
function context(t, w, ms = 5000) {
  const c = w.createCaptureContext({ deadline: Date.now() + ms });
  t.after(() => c.dispose());
  return c;
}
test('hostname and path detection reject unrelated URLs and lookalikes', t => {
  for (const url of [
    'https://www.netflix.com/title/123',
    'https://x.com.evil.test/a',
    'https://example.test/?url=https://x.com/a/status/1',
    'https://x.com/home',
  ]) {
    const w = page(t, '', url);
    assert.equal(w.detectTwitter(), false);
  }
  for (const url of [
    'https://x.com/a/status/1',
    'https://mobile.twitter.com/a/status/1',
    'https://x.com/i/article/123',
    'https://x.com/author/article/123',
  ])
    assert.equal(page(t, '', url).detectTwitter(), true);
  for (const url of ['https://medium.com.evil.test/a', 'https://example.test/?next=medium.com/a'])
    assert.equal(page(t, '', url).detectArticle(), false);
});
test('serializer preserves technical content and nested structures once', t => {
  const w = page(
    t,
    `<article><h2>Heading</h2><p>Read <a href="../guide">the guide</a><br>next line.</p><pre><code>function go() {\n  return 42;\n}</code></pre><blockquote><p>UNIQUE_QUOTE</p></blockquote><ol start="3"><li>Parent<ul><li>UNIQUE_CHILD</li></ul></li></ol><figure><img src="a"><figcaption>Figure caption</figcaption></figure><table><tr><th>Name</th><th>Value</th></tr><tr><td>Answer</td><td>42</td></tr></table><p hidden>HIDDEN</p><p style="display:none">INVISIBLE</p></article>`
  );
  const text = w.extractArticle().content;
  for (const value of [
    '## Heading',
    '[the guide](https://example.test/guide)',
    'function go() {\n  return 42;\n}',
    'Figure caption',
    '| Name | Value |',
    '| Answer | 42 |',
    '3. Parent',
  ])
    assert.ok(text.includes(value), value);
  for (const value of ['UNIQUE_QUOTE', 'UNIQUE_CHILD']) assert.equal(text.split(value).length - 1, 1);
  assert.doesNotMatch(text, /HIDDEN|INVISIBLE/);
});
test('merged tables emit row text and short articles remain usable', t => {
  const w = page(
    t,
    '<article><p>Short but complete.</p><table><tr><th colspan="2">Summary</th></tr><tr><td>A</td><td>B</td></tr></table></article>'
  );
  const r = w.extractArticle();
  assert.equal(r.extractionStatus, 'ready');
  assert.match(r.content, /Row 1: Summary/);
  assert.doesNotMatch(r.content, /\| ---/);
});
test('empty Medium and loading placeholders are retryable; access walls are explicit', t => {
  const w = page(t, '<title>Story</title><main></main>', 'https://medium.com/story');
  assert.equal(w.extractArticle().extractionStatus, 'not_ready');
  w.document.body.innerHTML = '<main>Loading…</main>';
  assert.equal(w.extractGeneric().extractionStatus, 'not_ready');
  w.document.body.innerHTML = '<main><p>Subscribe to continue.</p><div class="paywall">Sign in</div></main>';
  const r = w.extractGeneric();
  assert.equal(r.extractionStatus, 'unavailable');
  assert.deepEqual([...r.captureCoverage.reasons], ['access_restricted']);
});
test('bounded readiness waits for delayed hydration and ignores a comment loader', async t => {
  const w = page(t, '<main>Loading…</main>');
  const c = context(t, w);
  w.setTimeout(() => {
    w.document.querySelector('main').innerHTML =
      '<article><p>Complete story after hydration.</p></article><section id="comments"><div role="progressbar"></div></section>';
  }, 100);
  const r = await w.settleTextCapture(w.extractGeneric(c), w.extractGeneric, c);
  assert.equal(r.extractionStatus, 'ready');
  assert.match(r.content, /Complete story/);
  assert.doesNotMatch(r.content, /Loading/);
});
test('ongoing loaders return partial coverage; settling cancellation rejects promptly', async t => {
  const w = page(t, '<main><p>Intro.</p><div role="progressbar"></div></main>');
  const c = context(t, w);
  const r = await w.settleTextCapture(w.extractGeneric(c), w.extractGeneric, c);
  assert.equal(r.extractionStatus, 'not_ready');
  assert.ok(r.captureCoverage.reasons.includes('loading_timeout'));
  const next = context(t, w);
  const pending = w.settleTextCapture(w.extractGeneric(next), w.extractGeneric, next);
  next.abort();
  await assert.rejects(pending, e => e.code === 'cancelled');
});
test('open shadow roots and slots are serialized without duplication', async t => {
  const w = page(t, '<main><article-shell><p slot="body">SLOTTED_TEXT</p></article-shell></main>');
  const c = context(t, w);
  const host = w.document.querySelector('article-shell');
  host.attachShadow({ mode: 'open' }).innerHTML =
    '<article><h2>Shadow heading</h2><slot name="body"></slot><p>Shadow details.</p></article>';
  await w.discoverCaptureRoots(c);
  const r = w.extractGeneric(c);
  assert.match(r.content, /Shadow heading/);
  assert.equal(r.content.split('SLOTTED_TEXT').length - 1, 1);
});
test('same-origin iframe bodies are captured and document replacement is stale', async t => {
  const w = page(t, '<main><iframe></iframe></main>');
  const frame = w.document.querySelector('iframe');
  frame.contentDocument.body.innerHTML = '<article><h1>Embedded guide</h1><p>Important framed details.</p></article>';
  const c = context(t, w);
  await w.discoverCaptureRoots(c);
  assert.match(w.extractGeneric(c).content, /Important framed details/);
  frame.remove();
  assert.throws(
    () => w.extractGeneric(c),
    e => e.code === 'embedded_changed'
  );
});
test('inaccessible frames are skipped and traversal limits report partial coverage', async t => {
  const w = page(t, '<main><p>Main story.</p><iframe></iframe></main>');
  const frame = w.document.querySelector('iframe');
  Object.defineProperty(frame, 'contentDocument', {
    get() {
      throw new Error('SecurityError');
    },
  });
  const c = context(t, w);
  await w.discoverCaptureRoots(c);
  assert.match(w.extractGeneric(c).content, /Main story/);
  w.CAPTURE_DOM_LIMITS.nodes = 3;
  await w.discoverCaptureRoots(c);
  const r = w.extractGeneric(c);
  assert.ok(r.captureCoverage.reasons.includes('traversal_limit'));
});
test('truncation records original and captured lengths', t => {
  const w = page(t, '<article><p>' + 'A'.repeat(65000) + '</p></article>');
  const r = w.extractArticle();
  assert.deepEqual([...r.captureCoverage.reasons], ['truncated']);
  assert.equal(r.captureCoverage.originalCharacters, 65000);
  assert.equal(r.captureCoverage.capturedCharacters, 60000);
});
test('hash routes invalidate captures, including away-and-back, while section anchors survive', t => {
  const w = page(t, '<main>Body</main>', 'https://example.test/#/one');
  const c = context(t, w);
  w.history.pushState({}, '', '#/two');
  w.syncCaptureNavigation();
  w.history.pushState({}, '', '#/one');
  w.syncCaptureNavigation();
  assert.equal(c.isCurrent(), false);
  assert.throws(
    () => c.check(),
    e => e.code === 'stale'
  );
  w.history.replaceState({}, '', '/article#first');
  const next = context(t, w);
  w.history.replaceState({}, '', '#second');
  w.syncCaptureNavigation();
  assert.equal(next.isCurrent(), true);
});
test('X never clicks an article card and only expands the requested post', async t => {
  const w = page(
    t,
    '<article data-testid="tweet"><a href="/a/status/2"><time>now</time></a><button data-testid="tweet-text-show-more-link">Show more</button><div data-testid="tweetText">Wrong post</div></article><article data-testid="tweet"><a href="/a/status/1"><time>now</time></a><button data-testid="tweet-text-show-more-link">Show more</button><div data-testid="tweetText">Right post</div><a href="/i/article/99">An article</a></article>',
    'https://x.com/a/status/1'
  );
  let wrong = 0,
    right = 0,
    nav = 0;
  const posts = w.document.querySelectorAll('article');
  posts[0].querySelector('button').onclick = () => wrong++;
  posts[1].querySelector('button').onclick = () => right++;
  posts[1].querySelector('a[href*="article"]').onclick = () => nav++;
  const r = await w.extractTwitter(context(t, w));
  assert.equal(wrong, 0);
  assert.equal(right, 1);
  assert.equal(nav, 0);
  assert.match(r.content, /Right post/);
  assert.doesNotMatch(r.content, /Wrong post/);
});
test('X cancellation during hydration prevents later DOM interactions', async t => {
  const w = page(t, '', 'https://x.com/a/status/1');
  const c = context(t, w);
  let clicks = 0;
  const pending = w.extractTwitter(c);
  c.abort();
  w.document.body.innerHTML =
    '<article data-testid="tweet"><a href="/a/status/1"></a><button data-testid="tweet-text-show-more-link">Show more</button></article>';
  w.document.querySelector('button').onclick = () => clicks++;
  await assert.rejects(pending, e => e.code === 'cancelled');
  assert.equal(clicks, 0);
});

test('surrounding page UI and scripts do not replace a usable short article', t => {
  const w = page(
    t,
    '<h1>Site title</h1><script>' +
      'irrelevant script code '.repeat(1000) +
      '</script><article><p>Short useful article.</p></article><pre>' +
      'Unrelated output '.repeat(300) +
      '</pre>'
  );
  const result = w.extractGeneric();
  assert.match(result.content, /Short useful article/);
  assert.doesNotMatch(result._bodyText, /irrelevant script|Unrelated output|Site title/);
});

test('hidden ancestor articles and inactive paywalls do not override the visible story', t => {
  const w = page(
    t,
    '<div style="display:none"><div class="RichTextStoryBody"><p>' +
      'Hidden template '.repeat(100) +
      '</p></div></div><article><p>Visible story.</p><div class="paywall" hidden>Subscribe to read.</div></article>'
  );
  const r = w.extractArticle();
  assert.match(r.content, /Visible story/);
  assert.doesNotMatch(r.content, /Hidden template|Subscribe/);
  assert.equal(r.extractionStatus, 'ready');
});

test('quoted status permalinks do not steal the requested post identity', async t => {
  const w = page(
    t,
    '<article data-testid="tweet"><a href="/a/status/2"><time>now</time></a><div role="link"><a href="/a/status/1"><time>then</time></a><div data-testid="tweetText">Quoted target</div></div><div data-testid="tweetText">Wrong main</div></article><article data-testid="tweet"><a href="/a/status/1"><time>now</time></a><div data-testid="tweetText">Actual requested post</div></article>',
    'https://x.com/a/status/1'
  );
  const r = await w.extractTwitter(context(t, w));
  assert.match(r.content, /Actual requested post/);
  assert.doesNotMatch(r.content, /Wrong main|Quoted target/);
});

test('code and table serialization excludes hidden controls without changing code whitespace', t => {
  const w = page(
    t,
    '<article><p>Example.</p><pre><code>  exact code\n    next line</code><button>Copy code</button><span hidden>Hidden code</span></pre><table><tr hidden><td>Hidden row</td></tr><tr><td>Visible</td><td hidden>Hidden cell</td></tr></table></article>'
  );
  const r = w.extractArticle();
  assert.match(r.content, /  exact code\n    next line/);
  assert.doesNotMatch(r.content, /Copy code|Hidden code|Hidden row|Hidden cell/);
});

test('unrelated iframe changes do not invalidate a captured main article', async t => {
  const w = page(t, '<article><p>Main article with substantive details.</p></article><iframe></iframe>');
  const c = context(t, w);
  await w.discoverCaptureRoots(c);
  const result = w.extractGeneric(c);
  assert.match(result.content, /Main article/);
  w.document.querySelector('iframe').remove();
  assert.doesNotThrow(() => c.check());
});
