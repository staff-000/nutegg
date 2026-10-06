const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PageExtractor } = require('../src/popup/services/page-extractor');
const flush = () => new Promise(resolve => setImmediate(resolve));
async function advance(t, ms) {
  for (let left = ms; left > 0; left -= 100) { t.mock.timers.tick(Math.min(100, left)); await flush(); }
}
function fixture(t, reply) {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 });
  const url = 'https://www.youtube.com/watch?v=one';
  const identity = { success: true, url, readyState: 'complete', videoId: 'one', captionTracksReady: false };
  const calls = [], cancelled = [];
  global.chrome = { tabs: {
    get: async () => ({ url }),
    sendMessage: async (tabId, message) => {
      if (message.action === 'page-identity') return { ...identity };
      if (message.action === 'cancel-extraction') { cancelled.push(message.requestId); return { success: true }; }
      calls.push({ tabId, ...message });
      return reply(calls.length, url);
    },
  } };
  const extractor = new PageExtractor();
  return { extractor, calls, cancelled, identity, url };
}
const partial = url => ({ success: true, content: { url, sourceType: 'youtube', content: 'Description', transcriptAvailable: false } });

test('defaults to three retries after the initial attempt and stops on the fourth successful capture', async t => {
  const f = fixture(t, (attempt, url) => attempt < 4 ? partial(url)
    : { success: true, content: { url, content: 'Captions', transcriptAvailable: true } });
  const progress = [];
  const pending = f.extractor.extractPage(42, { expectedUrl: f.url, onProgress: value => progress.push(value) });
  await flush(); assert.equal(f.calls.length, 1);
  await advance(t, 900); assert.equal(f.calls.length, 1);
  await advance(t, 2100);
  assert.equal((await pending).content, 'Captions');
  assert.equal(f.calls.length, 4);
  assert.deepEqual(progress.map(value => value.attempt), [1, 2, 3]);
  assert(f.calls.every(call => call.tabId === 42));
  assert.equal(new Set(f.calls.map(call => call.requestId)).size, 4);
});

test('retry count zero and already complete or unavailable captures do not wait', async t => {
  const f = fixture(t, (_, url) => partial(url));
  assert.equal((await f.extractor.extractPage(1, { retryCount: 0 })).transcriptAvailable, false);
  f.extractor.tryExtract = async () => ({ success: true, content: { url: f.url, content: 'Short but complete article' } });
  assert.equal((await f.extractor.extractPage(1)).content, 'Short but complete article');
  f.extractor.tryExtract = async () => ({ ...partial(f.url), content: { ...partial(f.url).content, extractionStatus: 'unavailable' } });
  assert.equal((await f.extractor.extractPage(1)).extractionStatus, 'unavailable');
  assert.equal(Date.now(), 1000);
});

test('configured delay starts after the page reports complete', async t => {
  const f = fixture(t, (attempt, url) => attempt === 1 ? partial(url) : { success: true, content: { url, transcriptAvailable: true } });
  f.identity.readyState = 'loading';
  const pending = f.extractor.extractPage(1, { retryCount: 1, retryDelayMs: 2000 });
  await flush(); await advance(t, 1000);
  assert.equal(f.calls.length, 1);
  f.identity.readyState = 'complete';
  await advance(t, 200); // Observe completion, then start the configured delay.
  await advance(t, 1900); assert.equal(f.calls.length, 1);
  await advance(t, 100);
  assert.equal((await pending).transcriptAvailable, true);
});

test('newly available caption tracks can trigger a retry before the fallback delay', async t => {
  const f = fixture(t, (attempt, url) => attempt === 1 ? partial(url) : { success: true, content: { url, transcriptAvailable: true } });
  const pending = f.extractor.extractPage(1, { retryDelayMs: 5000 });
  await flush(); f.identity.captionTracksReady = true;
  await advance(t, 200);
  assert.equal((await pending).transcriptAvailable, true);
  assert.equal(f.calls.length, 2);
});

test('navigation during a retry wait discards the earlier description', async t => {
  const f = fixture(t, (_, url) => partial(url));
  const pending = f.extractor.extractPage(1, { expectedUrl: f.url });
  await flush(); f.identity.url = 'https://www.youtube.com/watch?v=two';
  await advance(t, 200);
  assert.equal(await pending, null);
  assert.equal(f.calls.length, 1);
});

test('cancelling a slow capture cancels its own content request without reinjection', async t => {
  const f = fixture(t, () => new Promise(() => {}));
  f.extractor.injectContentScript = () => assert.fail('Must not inject over an active capture');
  let cancelled = false;
  const pending = f.extractor.extractPage(42, { isCancelled: () => cancelled });
  await flush(); cancelled = true;
  await advance(t, 100);
  assert.equal(await pending, null);
  assert.deepEqual(f.cancelled, [f.calls[0].requestId]);
});

test('the overall deadline bounds retry waits and keeps the last partial capture', async t => {
  const f = fixture(t, (_, url) => partial(url));
  const pending = f.extractor.extractPage(1, { retryCount: 10, retryDelayMs: 1000, timeoutMs: 2500 });
  await flush(); await advance(t, 2500);
  assert.equal((await pending).content, 'Description');
  assert.equal(f.calls.length, 3);
});

test('dynamic pages retry explicit not-ready content and preserve the configured limit', async t => {
  const f = fixture(t, (_, url) => ({ success: true, content: { url, content: 'Loading…', extractionStatus: 'not_ready' } }));
  const pending = f.extractor.extractPage(1, { retryCount: 2 });
  await flush(); await advance(t, 2000);
  assert.equal((await pending).content, 'Loading…');
  assert.equal(f.calls.length, 3);
});

test('Bilibili av URLs can validate captures returned under their canonical BV identifier', async t => {
  const f = fixture(t, () => ({ success: true, content: { url: 'https://www.bilibili.com/video/av123', transcriptAvailable: true,
    metadata: { requested_video_id: 'av123', video_id: 'BVcanonical', cid: 111 } } }));
  f.identity.url = 'https://www.bilibili.com/video/av123'; f.identity.videoId = 'av123'; f.identity.cid = '111';
  assert.equal((await f.extractor.extractPage(1)).transcriptAvailable, true);
});
