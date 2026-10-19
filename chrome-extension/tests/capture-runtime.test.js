const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createExtractorPage, flush } = require('./helpers/extractor-harness');
function page(t) {
  return createExtractorPage(t, {
    url: 'https://www.youtube.com/watch?v=one', registry: [],
    scripts: ['dist/page-identity.js', 'src/content/utils.js', 'src/content/dom-reader.js', 'src/content/content-script.js'],
  });
}

test('superseded captures cannot perform late DOM work or cancel a newer request', async t => {
  const { win, send } = page(t);
  let finishOld, finishNew;
  const oldWait = new Promise(resolve => { finishOld = resolve; });
  const newWait = new Promise(resolve => { finishNew = resolve; });
  const writes = [];
  win.EXTRACTORS.push({ name: 'test', detect: () => true, extract: async context => {
    await (context.requestId === 'old' ? oldWait : newWait);
    context.check();
    writes.push(context.requestId);
    return { url: win.location.href, content: context.requestId };
  } });
  const old = send({ action: 'extract-content', requestId: 'old' });
  await flush();
  const next = send({ action: 'extract-content', requestId: 'new' });
  assert.equal((await old).success, false);
  await flush();
  await send({ action: 'cancel-extraction', requestId: 'old' });
  finishOld(); finishNew();
  assert.equal((await next).content.content, 'new');
  assert.deepEqual(writes, ['new']);
});

test('duplicate messages share one in-flight extraction', async t => {
  const { win, send } = page(t);
  let calls = 0, finish;
  const work = new Promise(resolve => { finish = resolve; });
  win.EXTRACTORS.push({ name: 'test', detect: () => true, extract: async () => { calls++; await work; return { content: 'Captured' }; } });
  const a = send({ action: 'extract-content', requestId: 'same' });
  const b = send({ action: 'extract-content', requestId: 'same' });
  finish();
  assert.equal((await a).content.content, 'Captured');
  assert.equal((await b).content.content, 'Captured');
  assert.equal(calls, 1);
});

test('available captions are ready even while the page is still loading', async t => {
  const { win, send } = page(t);
  Object.defineProperty(win.document, 'readyState', { get: () => 'loading' });
  win.EXTRACTORS.push({ name: 'test', detect: () => true, extract: async () => ({
    content: 'Video transcript', transcriptAvailable: true,
  }) });
  const response = await send({ action: 'extract-content', requestId: 'ready-captions' });
  assert.equal(response.success, true);
  assert.equal(response.content.extractionStatus, 'ready');
});

for (const scenario of ['replies loading', 'article loading', 'empty article']) {
  test(`X article readiness uses its own body: ${scenario}`, async t => {
    const { dom, win, send } = page(t);
    dom.reconfigure({ url: 'https://x.com/zhaoh2357/status/2104855420317929968' });
    win.document.title = 'Article title / X';
    win.document.body.innerHTML = `<main>
      <div data-testid="twitterArticleReadView">
        <h1>Article title</h1>
        <div data-testid="twitterArticleRichTextView">
          ${scenario === 'empty article' ? '' : '<p>The complete article body is available here.</p>'}
          ${scenario === 'article loading' ? '<div role="progressbar"></div>' : ''}
        </div>
      </div>
      <section aria-label="Replies"><div role="progressbar"></div></section>
    </main>`;
    win.eval(fs.readFileSync(require.resolve('../src/content/extractors/twitter.js'), 'utf8'));
    win.EXTRACTORS.push({ name: 'twitter', detect: win.detectTwitter, extract: win.extractTwitter });
    const response = await send({ action: 'extract-content', requestId: scenario });
    assert.equal(response.success, true);
    assert.equal(response.content.extractionStatus, scenario === 'replies loading' ? 'ready' : 'not_ready');
    if (scenario !== 'empty article') assert.match(response.content.content, /complete article body/);
  });
}

for (const scenario of ['replies loading', 'quoted post collapsed', 'post loading', 'empty post', 'collapsed post']) {
  test(`X post readiness ignores unrelated replies: ${scenario}`, async t => {
    const { dom, win, send } = page(t);
    dom.reconfigure({ url: 'https://x.com/author/status/123' });
    const fullText = 'A complete long post with all its substantive details. '.repeat(20) + 'Final qualification.';
    win.document.body.innerHTML = `<main><div role="link"><article data-testid="tweet">
      <a href="/author/status/123"><time>Today</time></a>
      <div data-testid="tweetText" ${scenario === 'post loading' ? 'aria-busy="true"' : ''}>${scenario === 'empty post' ? '' : fullText}</div>
      ${scenario === 'quoted post collapsed' ? '<div role="link"><div data-testid="tweetText">Quoted content</div><button data-testid="tweet-text-show-more-link">Show more</button></div>' : ''}
      ${scenario === 'collapsed post' ? '<button data-testid="tweet-text-show-more-link">Show more</button>' : ''}
      </article></div><section aria-label="Replies"><div role="progressbar"></div>
      <article data-testid="tweet"><a href="/reply/status/456"><time>Today</time></a>
      <div data-testid="tweetText">Unrelated reply</div><button data-testid="tweet-text-show-more-link">Show more</button></article></section></main>`;
    let replyClicks = 0;
    win.document.querySelector('section button').onclick = () => replyClicks++;
    win.eval(fs.readFileSync(require.resolve('../src/content/extractors/twitter.js'), 'utf8'));
    win.EXTRACTORS.push({ name: 'twitter', detect: win.detectTwitter, extract: win.extractTwitter });
    const response = await send({ action: 'extract-content', requestId: scenario });
    assert.equal(response.success, true);
    assert.equal(response.content.extractionStatus, ['replies loading', 'quoted post collapsed'].includes(scenario) ? 'ready' : 'not_ready');
    assert.equal(replyClicks, 0);
    assert.doesNotMatch(response.content.content, /Unrelated reply/);
    if (scenario !== 'empty post') assert.ok(response.content.content.includes(fullText));
  });
}

test('navigation invalidates a capture even before popup cancellation arrives', async t => {
  const { dom, win, send } = page(t);
  let finish;
  const work = new Promise(resolve => { finish = resolve; });
  win.EXTRACTORS.push({ name: 'test', detect: () => true, extract: async () => { await work; return { content: 'Old video' }; } });
  const pending = send({ action: 'extract-content', requestId: 'one' });
  await flush();
  dom.reconfigure({ url: 'https://www.youtube.com/watch?v=two' });
  finish();
  assert.equal((await pending).errorCode, 'stale');
});

test('a stalled response body is aborted by its fetch timeout', async t => {
  const { win } = page(t);
  let bodyAborted = false;
  win.fetch = async (_url, { signal }) => ({ ok: true, status: 200, text: () => new Promise((_, reject) => {
    signal.addEventListener('abort', () => { bodyAborted = true; reject(new Error('Aborted body')); }, { once: true });
  }) });
  await assert.rejects(win.captureFetchText('https://www.youtube.com/caption', {}, 10), /Aborted body/);
  assert.equal(bodyAborted, true);
});

test('deadline expiry can keep the description without reporting a successful transcript', async t => {
  const { win, send } = page(t);
  win.EXTRACTORS.push({ name: 'test', detect: () => true, extract: context => {
    context.partial = { url: win.location.href, content: 'Description', transcriptAvailable: false };
    return new Promise(() => {});
  } });
  const response = await send({ action: 'extract-content', requestId: 'slow', deadline: Date.now() + 20 });
  assert.equal(response.success, true);
  assert.equal(response.content.content, 'Description');
  assert.equal(response.content.transcriptAvailable, false);
});

test('worker cancellation aborts only matching requests in the originating tab and document', async () => {
  const vm = require('node:vm');
  let listener;
  const signals = [];
  const context = vm.createContext({ URL, AbortController, setTimeout, clearTimeout, TextDecoder, Uint8Array,
    chrome: { runtime: { onMessage: { addListener: fn => { listener = fn; } } } },
    fetch: (_url, { signal }) => new Promise((_, reject) => {
      signals.push(signal);
      signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
    }),
  });
  vm.runInContext(fs.readFileSync(require.resolve('../src/background/chinese-fetch.js'), 'utf8'), context);
  const sender = { tab: { id: 1 }, frameId: 0, documentId: 'one', url: 'https://www.bilibili.com/video/BV123' };
  const request = { action: 'chinese-content-fetch', requestId: 'capture', url: 'https://api.bilibili.com/x/player/wbi/v2?cid=1' };
  const first = new Promise(resolve => listener(request, sender, resolve));
  const second = new Promise(resolve => listener(request, { ...sender, tab: { id: 2 } }, resolve));
  listener({ action: 'chinese-content-cancel', requestId: 'capture' }, { ...sender, documentId: 'other' }, () => {});
  assert.equal(signals[0].aborted, false);
  listener({ action: 'chinese-content-cancel', requestId: 'capture' }, sender, () => {});
  assert.equal(signals[0].aborted, true); assert.equal(signals[1].aborted, false);
  listener({ action: 'chinese-content-cancel', requestId: 'capture' }, { ...sender, tab: { id: 2 } }, () => {});
  assert.equal((await first).success, false); assert.equal((await second).success, false);
});

test('YouTube navigation generation invalidates an old capture even when the URL returns to the same video', async t => {
  const { win, send } = page(t);
  let finish;
  const pendingWork = new Promise(resolve => { finish = resolve; });
  let writes = 0;
  win.EXTRACTORS.push({ name: 'test', detect: () => true, extract: async context => {
    await pendingWork; context.check(); writes++; return { content: 'Obsolete transcript' };
  } });
  const pending = send({ action: 'extract-content', requestId: 'generation' });
  await flush();
  win.dispatchEvent(new win.Event('yt-navigate-start'));
  finish();
  assert.equal((await pending).errorCode, 'stale');
  assert.equal(writes, 0);
});

test('YouTube readiness notices live caption tracks without starting another extraction', async t => {
  const { win, send } = page(t);
  let calls = 0;
  win.queryYouTubePlayerSnapshot = async () => { calls++; return { videoId: 'one', tracks: [{ baseUrl: 'https://www.youtube.com/api/timedtext?v=one' }], playerResponse: {} }; };
  const identity = await send({ action: 'page-identity' });
  assert.equal(identity.captionTracksReady, true);
  assert.equal(identity.youtubeReady, true);
  assert.equal(calls, 1);
  assert.equal(win.__nuteggCaptureState, undefined);
});

test('a late readiness lookup cannot report old caption tracks after navigation', async t => {
  const { dom, win, send } = page(t);
  let finish;
  win.queryYouTubePlayerSnapshot = () => new Promise(resolve => { finish = resolve; });
  const pending = send({ action: 'page-identity' });
  dom.reconfigure({ url: 'https://www.youtube.com/watch?v=two' });
  finish({ tracks: [{ baseUrl: 'https://www.youtube.com/api/timedtext?v=one' }], playerResponse: {} });
  const identity = await pending;
  assert.equal(identity.videoId, 'two');
  assert.equal(identity.captionTracksReady, false);
  assert.equal(identity.youtubeReady, false);
});

test('late browser navigation notifications cannot cancel a newer capture', async t => {
  const {win,send}=page(t);let finish;
  win.EXTRACTORS.push({name:'test',detect:()=>true,extract:async()=>{await new Promise(resolve=>{finish=resolve;});return {content:'Current capture'};}});
  const pending=send({action:'extract-content',requestId:'newer'});await flush();
  const startedAt=win.__nuteggCaptureState.active.context.startedAt;
  await send({action:'capture-navigation',key:'https://www.youtube.com/watch?v=other',observedAt:startedAt-1});
  finish();assert.equal((await pending).success,true);
});
