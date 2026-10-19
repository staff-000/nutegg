const test = require('node:test');
const assert = require('node:assert/strict');
const { context, regular, later, captionTrack } = require('./helpers/platform-fixtures');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = name => fs.readFileSync(path.join(__dirname, '../src/', name), 'utf8');

test('routes user examples and rejects lookalike domains', () => {
  for (const url of [regular, later]) {
    const ctx = context(url);
    assert.equal(ctx.detectBilibili(), true);
    assert.equal(ctx.bilibiliVideoId(), 'BV1eVgA64EbW');
  }
  for (const url of ['https://weibo.com/1249424622/RkDm76MZJ?from=feed#comment', 'https://weibo.com/2014741911/R2KWzqf3A']) assert.equal(context(url).detectWeibo(), true);
  assert.equal(context('https://www.zhihu.com/question/1945573503303685016').detectZhihu(), true);
  assert.equal(context('https://www.douyin.com/video/123456789').detectDouyin(), true);
  assert.equal(context('https://www.douyin.com/?modal_id=123456789').detectDouyin(), true);
  assert.equal(context('https://bilibili.com.evil.test/video/BV123').detectBilibili(), false);
  assert.equal(context('https://example.com/?q=weibo.com').detectWeibo(), false);
});

test('cancellation during page-session fetch prevents a late worker fallback', async () => {
  let cancelled = false, calls = 0;
  const ctx = context(regular, { api: () => { calls++; return {}; }, globals: { fetch() {} } });
  ctx.captureFetchText = async () => { cancelled = true; throw new Error('Aborted'); };
  const capture = { check() { if (cancelled) throw new Error('cancelled'); } };
  await assert.rejects(ctx.chineseFetch('https://api.bilibili.com/x/player/v2?cid=111', true, capture), /cancelled/);
  assert.equal(calls, 0);
});

test('other platform captions retain manual-first selection', async () => {
  const ctx = context('https://www.douyin.com/video/123');
  const fetched = [];
  ctx.chineseFetch = async url => {
    fetched.push(url);
    return '{"body":[{"from":0,"content":"Caption"}]}';
  };
  const transcript = await ctx.chineseSubtitles([captionTrack('chinese-ai', 'ai-zh', 1), captionTrack('english', 'en')]);
  assert.equal(transcript.source, 'manual');
  assert.match(fetched[0], /english.json$/);
});

test('subtitle parser supports JSON utterances, SRT and VTT, rejects HTML', () => {
  const ctx = context(regular);
  assert.equal(ctx.chineseSubtitleText('{"utterances":[{"start_time":3000,"text":"你好"}]}'), '[00:03] 你好');
  assert.equal(ctx.chineseSubtitleText('1\n00:00:03,000 --> 00:00:04,000\n你好'), '[00:03] 你好');
  assert.equal(ctx.chineseSubtitleText('WEBVTT\n\n00:03.000 --> 00:04.000\n你好'), '[00:03] 你好');
  assert.equal(ctx.chineseSubtitleText('<html>Login</html>'), '');
});

test('worker bridge restricts fetches to platform origins and text endpoints', () => {
  const ctx = vm.createContext({ URL, chrome: { runtime: { onMessage: { addListener() {} } } } });
  vm.runInContext(code('background/chinese-fetch.js'), ctx);
  const sender = regular;
  assert.equal(ctx.chineseFetchAllowed('https://api.bilibili.com/x/player/wbi/v2?cid=1', sender), true);
  assert.equal(ctx.chineseFetchAllowed('https://aisubtitle.hdslb.com/bfs/ai_subtitle/prod/1.json', sender), true);
  for (const target of ['http://api.bilibili.com/x/player/v2', 'https://api.bilibili.com/x/member/account',
    'https://api.bilibili.com.evil.test/x/player/v2', 'https://127.0.0.1/subtitle', 'https://user:pass@api.bilibili.com/x/player/v2']) {
    assert.equal(ctx.chineseFetchAllowed(target, sender), false);
  }
  assert.equal(ctx.chineseFetchAllowed('https://api.bilibili.com/x/player/v2', 'https://example.com'), false);
});

test('manifest and reinjection load platform helpers before extractors and registry', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json'), 'utf8'));
  const { CONTENT_SCRIPT_FILES } = require('../src/popup/services/page-extractor.js');
  assert.deepEqual(CONTENT_SCRIPT_FILES, manifest.content_scripts[0].js);
  for (const platform of ['bilibili', 'douyin', 'weibo', 'zhihu']) {
    const helper = CONTENT_SCRIPT_FILES.indexOf('src/content/extractors/chinese-common.js');
    const extractor = CONTENT_SCRIPT_FILES.indexOf(`src/content/extractors/${platform}.js`);
    assert.ok(helper >= 0 && helper < extractor);
    assert.ok(extractor < CONTENT_SCRIPT_FILES.indexOf('src/content/content-script.js'));
  }
});


test('Bilibili API fetch uses the page session before the worker bridge', async () => {
  let options, workerCalls = 0;
  const ctx = context(regular, { api: () => { workerCalls++; return {}; }, globals: { fetch() {} } });
  ctx.captureFetchText = async (_url, value) => {
    options = value; return { ok: true, text: JSON.stringify({ code: 0, data: { subtitle: { subtitles: ['page-session'] } } }) };
  };
  const result = await ctx.chineseFetch('https://api.bilibili.com/x/player/v2?cid=111');
  assert.equal(options.credentials, 'include');
  assert.equal(result.data.subtitle.subtitles[0], 'page-session');
  assert.equal(workerCalls, 0);
});


test('Bilibili API fetch falls back to the worker after CORS or API rejection', async () => {
  for (const mode of ['cors', 'http', 'api', 'json']) {
    let calls = 0;
    const ctx = context(regular, { api: () => { calls++; return { code: 0, data: 'worker' }; }, globals: { fetch() {} } });
    ctx.captureFetchText = async () => {
      if (mode === 'cors') throw new Error('Failed to fetch');
      return { ok: mode !== 'http', text: mode === 'json' ? '<html>Error</html>' : JSON.stringify({ code: -352 }) };
    };
    assert.equal((await ctx.chineseFetch('https://api.bilibili.com/x/player/v2?cid=111')).data, 'worker');
    assert.equal(calls, 1);
  }
});


test('Bilibili caption download retains the worker fallback when page CORS blocks it', async () => {
  let calls = 0;
  const ctx = context(regular, { globals: { fetch() {} }, api: () => {
    calls++; return { body: [{ from: 0, content: 'Worker caption' }] };
  } });
  ctx.captureFetchText = async () => { throw new Error('CORS blocked'); };
  const transcript = await ctx.chineseSubtitles([{ subtitle_url: '//subtitle.hdslb.com/bfs/subtitle/manual.json' }]);
  assert.match(transcript.text, /Worker caption/);
  assert.equal(calls, 1);
});
