const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createExtractorPage, deferred, flush } = require('./helpers/extractor-harness');
const { PageExtractor } = require('../src/popup/services/page-extractor');
function setup(t, html = '<div id="movie_player"><video></video></div>') {
  const f = createExtractorPage(t, { url: 'https://www.youtube.com/watch?v=h6vY3g8LFeA&t=1037s', html });
  const old = global.chrome;
  let injected = 0;
  global.chrome = { tabs: { sendMessage: async (_, msg) => f.send(msg) }, scripting: {
    executeScript: async ({ files }) => { injected++; for (const file of files) f.load(file); return []; }
  } };
  t.after(() => { global.chrome = old; });
  return { ...f, extractor: new PageExtractor(), injections: () => injected };
}
function player(video, time = 1037) {
  for (const [key, value] of Object.entries({ readyState: 4, duration: 1226, currentTime: time, seeking: false }))
    Object.defineProperty(video, key, { configurable: true, writable: true, value });
  video.play = () => Promise.reject(new Error('autoplay denied'));
}
test('missing receiver recovers from production ordered injection and seeks cached video at 17:17 to 1:21', async t => {
  const f = setup(t); player(f.win.document.querySelector('video'));
  f.listeners.length = 0;
  const result = await f.extractor.seekToChapter(42, 81, { expectedUrl: 'https://www.youtube.com/watch?v=h6vY3g8LFeA' });
  assert.equal(result.currentTime, 81); assert.equal(f.injections(), 1);
  assert.equal(f.listeners.length, 1);
  assert.equal((await f.extractor.getPagePosition(42)).currentTime, 81);
  assert.equal(f.requests.length, 0);
});
test('repeated injection preserves active capture and one listener', async t => {
  const f = setup(t); const active = { id: 'active' }; f.win.__nuteggCaptureState = { active };
  const first = await f.send({ action: 'nutegg-handshake' });
  f.load('src/content/content-script.js'); f.load('src/content/content-script.js');
  assert.equal(f.listeners.length, 1); assert.equal(f.win.__nuteggCaptureState.active, active);
  assert.equal((await f.send({ action: 'nutegg-handshake' })).documentId, first.documentId);
  f.win.__nuteggCaptureState.active = null;
});
test('missing video on video page never becomes article scroll position', async t => {
  const f = setup(t, '<main>Page</main>');
  await assert.rejects(f.extractor.getPagePosition(42), { code: 'player_unavailable' });
});
test('seeking and tracking select main player instead of unrelated first video', async t => {
  const f = setup(t, '<video id="ad"></video><div id="movie_player"><video id="main"></video></div>');
  player(f.win.document.querySelector('#ad'), 1); player(f.win.document.querySelector('#main'));
  const pos = await f.extractor.seekToChapter(42, 90);
  assert.equal(pos.currentTime, 90); assert.equal(f.win.document.querySelector('#ad').currentTime, 1);
});
test('foreign video, invalid timestamps, and old document commands are rejected', async t => {
  const f = setup(t); player(f.win.document.querySelector('video'));
  await assert.rejects(f.extractor.seekToChapter(42, 81, { expectedUrl: 'https://www.youtube.com/watch?v=foreign' }), { code: 'stale' });
  for (const seconds of [-1, Infinity, NaN]) await assert.rejects(f.extractor.seekToChapter(42, seconds), { code: 'invalid_timestamp' });
  assert.equal((await f.send({ action: 'nutegg-seek', seconds: 81, documentId: 'old' })).errorCode, 'stale');
});
test('failed recovery is suppressed for polls but explicit seek can retry and errors retain details', async t => {
  const f = setup(t); f.listeners.length = 0;
  global.chrome.scripting.executeScript = async () => { throw new Error('Cannot access contents of url'); };
  await assert.rejects(f.extractor.getPagePosition(42), /Cannot access contents/);
  await assert.rejects(f.extractor.getPagePosition(42), { code: 'connection_unavailable' });
  player(f.win.document.querySelector('video'));
  global.chrome.scripting.executeScript = async () => { f.load('src/content/content-script.js'); return []; };
  assert.equal((await f.extractor.seekToChapter(42, 81)).currentTime, 81);
});
test('concurrent missing-receiver queries share recovery; successful injection without receiver is failure', async t => {
  const f = setup(t); f.listeners.length = 0;
  const pending = deferred(); let calls = 0;
  global.chrome.scripting.executeScript = async () => { calls++; await pending.promise; return []; };
  const a = f.extractor.getPagePosition(42), b = f.extractor.getPagePosition(42);
  await flush(); pending.resolve();
  const results = await Promise.allSettled([a,b]);
  assert.equal(calls, 1); assert(results.every(r => r.status === 'rejected'));
});
test('navigation cancels delayed player readiness without seeking replacement video', async t => {
  const f = setup(t); const identity = await f.send({ action: 'nutegg-handshake' });
  const job = f.send({ action: 'nutegg-seek', seconds: 81, ...identity, expectedUrl: identity.url });
  f.navigate('https://www.youtube.com/watch?v=other');
  assert.equal((await job).errorCode, 'stale');
});
test('incompatible listener is refreshed and unavailable player becomes ready within seek budget', async t => {
  const f = setup(t); f.listeners.length = 0;
  f.listeners.push((message, sender, reply) => { reply({ success: true, version: 0 }); return false; });
  // Simulate an owned previous NutEgg listener so reinjection removes it.
  f.win.__nuteggMessageListener = f.listeners[0];
  const video = f.win.document.querySelector('video');
  const work = f.extractor.seekToChapter(42, 81);
  setTimeout(() => player(video), 60);
  assert.equal((await work).currentTime, 81); assert.equal(f.injections(), 1);
});
test('nonmoving video times out and explicit unsuccessful responses are never reported as success', async t => {
  const f = setup(t); const video = f.win.document.querySelector('video'); player(video);
  Object.defineProperty(video, 'currentTime', { configurable: true, get: () => 1037, set: () => {} });
  await assert.rejects(f.extractor.seekToChapter(42, 81), { code: 'seek_timeout' });
});
test('article scroll position remains available and Bilibili parts retain separate identity', async t => {
  const f = setup(t, '<main>Article</main>'); f.navigate('https://example.com/article#section');
  assert.equal((await f.extractor.getPagePosition(42)).type, 'text');
  f.navigate('https://www.bilibili.com/video/BV13fg56xE21?p=2');
  await assert.rejects(f.extractor.getPagePosition(42, null, {
    expectedUrl: 'https://www.bilibili.com/watchlater/?bvid=BV13fg56xE21&p=1'
  }), { code: 'stale' });
});
test('new timestamp click cancels an older pending seek before readiness', async t => {
  const f = setup(t); const video = f.win.document.querySelector('video');
  const first = f.extractor.seekToChapter(42, 81);
  await flush();
  const second = f.extractor.seekToChapter(42, 240);
  const firstCheck = assert.rejects(first, { code: 'stale' });
  setTimeout(() => player(video), 80);
  await firstCheck; assert.equal((await second).currentTime, 240);
  assert.equal(video.currentTime, 240);
});
test('injection execution errors remain identifiable and stop repeated automatic recovery', async t => {
  const f = setup(t); f.listeners.length = 0; let injections = 0;
  global.chrome.scripting.executeScript = async () => { injections++; return [{ error: { message: 'Script initialization failed' } }]; };
  await assert.rejects(f.extractor.getPagePosition(42), { code: 'injection_failed', message: 'Script initialization failed' });
  await assert.rejects(f.extractor.getPagePosition(42), { code: 'connection_unavailable' });
  assert.equal(injections, 1);
});
test('hung handshake consumes at most the five-second connection budget and does not inject late', async t => {
  const f = setup(t); let injections = 0;
  global.chrome.tabs.sendMessage = () => new Promise(() => {});
  global.chrome.scripting.executeScript = async () => { injections++; return []; };
  const started = Date.now();
  await assert.rejects(f.extractor.getPagePosition(42), { code: 'connection_timeout' });
  assert(Date.now() - started < 5500); assert.equal(injections, 0);
});
test('rapid clicks share a delayed handshake without cancelling the latest request', async t => {
  const f = setup(t); player(f.win.document.querySelector('video'));
  const gate = deferred(); const original = global.chrome.tabs.sendMessage;
  global.chrome.tabs.sendMessage = async (tab, message) => {
    if (message.action === 'nutegg-handshake') await gate.promise;
    return original(tab, message);
  };
  const first = f.extractor.seekToChapter(42, 81);
  const firstCheck = assert.rejects(first, { code: 'stale' });
  const second = f.extractor.seekToChapter(42, 240);
  gate.resolve(); await firstCheck;
  assert.equal((await second).currentTime, 240);
});
test('tab activation cancellation stops pending readiness before a later DOM seek', async t => {
  const f = setup(t); const video = f.win.document.querySelector('video');
  const work = f.extractor.seekToChapter(42, 81);
  const check = assert.rejects(work, { code: 'stale' });
  await flush(); f.extractor.cancelPendingSeek(42);
  player(video); await check;
  assert.equal(video.currentTime, 1037);
});
