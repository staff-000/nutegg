const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const flush = () => new Promise(resolve => setImmediate(resolve));
function page(t) {
  const dom = new JSDOM('<main></main>', { url: 'https://www.youtube.com/watch?v=one', runScripts: 'outside-only' });
  const win = dom.window;
  let listener;
  win.chrome = { runtime: { sendMessage: async () => ({ success: true }), onMessage: { addListener: fn => { listener = fn; } } } };
  win.EXTRACTORS = [];
  for (const file of ['utils', 'content-script']) win.eval(fs.readFileSync(require.resolve(`../src/content/${file}.js`), 'utf8'));
  t.after(() => dom.window.close());
  return { dom, win, send: message => new Promise(resolve => listener(message, {}, resolve)) };
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
