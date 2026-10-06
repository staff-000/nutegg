const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = name => fs.readFileSync(path.join(__dirname, '../src/', name), 'utf8');
function context(url, options = {}) {
  const document = { title: 'Page', querySelector: () => null, querySelectorAll: () => [], ...options.document };
  const ctx = vm.createContext({ URL, console, document, window: { location: { href: url } },
    performance: { getEntriesByType: () => options.resources || [] },
    chrome: { runtime: { sendMessage: async msg => ({ success: true, text: JSON.stringify(await options.api(msg.url)) }) } },
    ...options.globals });
  vm.runInContext(code('content/utils.js'), ctx);
  vm.runInContext(code('content/extractors/chinese.js'), ctx);
  return ctx;
}
const regular = 'https://www.bilibili.com/video/BV1eVgA64EbW?spm_id_from=333.1245.0.0';
const later = 'https://www.bilibili.com/list/watchlater/?bvid=BV1eVgA64EbW&oid=117091965343752&watchlater_cfg=%7B%22viewed%22%3A0%7D';
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
function biliApi(calls, failManual = false) {
  return async raw => {
    calls.push(raw);
    const url = new URL(raw);
    if (url.pathname === '/x/web-interface/view') return { code: 0, data: {
      bvid: 'BV1eVgA64EbW', aid: 123, title: '中文视频', desc: '简介', owner: { name: '作者' },
      pages: [{ page: 1, cid: 111, duration: 90 }, { page: 2, cid: 222, duration: 120 }] } };
    if (url.hostname === 'api.bilibili.com') return { code: 0, data: { subtitle: { subtitles: [
      { ai_type: 1, lan: 'ai-zh', subtitle_url: '//aisubtitle.hdslb.com/bfs/ai_subtitle/ai.json' },
      { ai_type: 0, lan: 'zh-CN', subtitle_url: '//subtitle.hdslb.com/bfs/subtitle/manual.json' },
    ] }, view_points: [{ from: 60, content: '第二章' }] } };
    if (url.pathname.endsWith('manual.json') && failManual) throw new Error('Unavailable');
    return { body: [{ from: 65, content: url.pathname.endsWith('manual.json') ? '人工字幕' : 'AI字幕' }] };
  };
}
test('Bilibili regular and watch-later captures prefer manual subtitles and retain source URL', async () => {
  for (const url of [regular, later]) {
    const calls = [];
    const capture = await context(url, { api: biliApi(calls) }).extractBilibili();
    assert.equal(capture.url, url);
    assert.equal(capture.sourceType, 'bilibili');
    assert.equal(capture.metadata.author, '作者');
    assert.equal(capture.metadata.cid, 111);
    assert.equal(capture.transcriptAvailable, true);
    assert.match(capture.content, /\[01:05\] 人工字幕/);
    assert.equal(capture.metadata.transcript_source, 'manual');
    assert.equal(calls.some(url => url.endsWith('ai.json')), false);
    assert.equal(capture.chapters[0].time, '01:00');
  }
});
test('Bilibili selects multipart cid and reuses matching signed player request', async () => {
  const calls = [];
  const signed = 'https://api.bilibili.com/x/player/wbi/v2?bvid=BV1eVgA64EbW&cid=222&w_rid=signature';
  const ctx = context(`${later}&p=2`, { api: biliApi(calls), resources: [
    { name: signed }, { name: signed.replace('222', '111') },
  ] });
  const capture = await ctx.extractBilibili();
  assert.equal(capture.metadata.cid, 222);
  assert.equal(calls[1], signed);
});
test('failed manual track falls back to AI', async () => {
  const capture = await context(later, { api: biliApi([], true) }).extractBilibili();
  assert.equal(capture.metadata.transcript_source, 'ai');
  assert.match(capture.content, /AI字幕/);
});

function biliCaptionFixture(tracks, { failed = [], empty = [] } = {}) {
  const fetched = [];
  const ctx = context(regular, { api: async raw => {
    const url = new URL(raw);
    if (url.pathname === '/x/web-interface/view') return { code: 0, data: { title: 'Video', cid: 111 } };
    if (url.hostname === 'api.bilibili.com') return { code: 0, data: { subtitle: { subtitles: tracks } } };
    const name = url.pathname.split('/').pop();
    fetched.push(name);
    if (failed.includes(name)) throw new Error('Unavailable');
    return { body: empty.includes(name) ? [] : [{ from: 0, content: name }] };
  } });
  return { ctx, fetched };
}
const captionTrack = (name, lan, ai_type = 0) => ({ lan, ai_type, subtitle_url: `//subtitle.hdslb.com/bfs/subtitle/${name}.json` });

test('Bilibili prefers manual captions in any language over Chinese AI captions', async () => {
  const { ctx, fetched } = biliCaptionFixture([
    captionTrack('english', 'en'), captionTrack('chinese-ai', 'ai-zh', 1),
  ]);
  const capture = await ctx.extractBilibili();
  assert.deepEqual(fetched, ['english.json']);
  assert.match(capture.content, /english.json/);
  assert.equal(capture.metadata.transcript_source, 'manual');
});

test('Bilibili preserves platform order among manual captions regardless of language', async () => {
  const { ctx, fetched } = biliCaptionFixture([
    captionTrack('english', 'en'), captionTrack('chinese-ai', 'ai-zh', 1),
    captionTrack('traditional', 'zh-Hant'), captionTrack('simplified', 'zh-CN'),
  ]);
  const capture = await ctx.extractBilibili();
  assert.deepEqual(fetched, ['english.json']);
  assert.equal(capture.metadata.transcript_source, 'manual');
});

test('Bilibili exhausts manual captions, then Chinese AI, before other-language AI', async () => {
  const tracks = [captionTrack('english-ai', 'ai-en', 1), captionTrack('english-manual', 'en'), captionTrack('chinese-ai', 'ai-zh', 1), captionTrack('chinese-manual', 'zh-CN')];
  const availableManual = biliCaptionFixture(tracks, { failed: ['english-manual.json'] });
  assert.equal((await availableManual.ctx.extractBilibili()).metadata.transcript_source, 'manual');
  assert.deepEqual(availableManual.fetched, ['english-manual.json', 'chinese-manual.json']);
  const availableAI = biliCaptionFixture(tracks, { failed: ['english-manual.json', 'chinese-manual.json'] });
  assert.equal((await availableAI.ctx.extractBilibili()).metadata.transcript_source, 'ai');
  assert.deepEqual(availableAI.fetched, ['english-manual.json', 'chinese-manual.json', 'chinese-ai.json']);
  const unavailableChinese = biliCaptionFixture(tracks, { failed: ['english-manual.json', 'chinese-manual.json'], empty: ['chinese-ai.json'] });
  const capture = await unavailableChinese.ctx.extractBilibili();
  assert.deepEqual(unavailableChinese.fetched, ['english-manual.json', 'chinese-manual.json', 'chinese-ai.json', 'english-ai.json']);
  assert.match(capture.content, /english-ai.json/);
  assert.equal(capture.transcriptAvailable, true);
});

test('Bilibili selects manual foreign captions when no Chinese version is listed', async () => {
  const { ctx, fetched } = biliCaptionFixture([
    captionTrack('english-ai', 'ai-en', 1), captionTrack('japanese', 'ja'),
  ]);
  const capture = await ctx.extractBilibili();
  assert.deepEqual(fetched, ['japanese.json']);
  assert.equal(capture.metadata.transcript_source, 'manual');
});

test('Bilibili recognizes Chinese caption language variants and a label when the language code is absent', async () => {
  for (const lan of ['zh', 'ZH_CN', 'zh-Hans', 'zh-TW', 'ai-zh-CN', 'cmn', 'yue', '']) {
    const track = { ...captionTrack('chinese', lan, 1), ...(lan ? {} : { lan_doc: '中文（简体）' }) };
    const { ctx, fetched } = biliCaptionFixture([captionTrack('english-ai', 'ai-en', 1), track]);
    await ctx.extractBilibili();
    assert.deepEqual(fetched, ['chinese.json'], lan || 'language label');
  }
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
test('missing video transcript is explicitly blocked, not inferred from description', async () => {
  const ctx = context(later, { api: async raw => raw.includes('web-interface') ? {
    code: 0, data: { title: 'Video', desc: 'Description', cid: 111 },
  } : { code: 0, data: {} } });
  const capture = await ctx.extractBilibili();
  assert.equal(capture.transcriptAvailable, false);
  assert.equal(capture.mediaType, 'video');
});
test('subtitle parser supports JSON utterances, SRT and VTT, rejects HTML', () => {
  const ctx = context(regular);
  assert.equal(ctx.chineseSubtitleText('{"utterances":[{"start_time":3000,"text":"你好"}]}'), '[00:03] 你好');
  assert.equal(ctx.chineseSubtitleText('1\n00:00:03,000 --> 00:00:04,000\n你好'), '[00:03] 你好');
  assert.equal(ctx.chineseSubtitleText('WEBVTT\n\n00:03.000 --> 00:04.000\n你好'), '[00:03] 你好');
  assert.equal(ctx.chineseSubtitleText('<html>Login</html>'), '');
});
test('Douyin reads encoded hydration and ignores other video IDs', async () => {
  const state = { list: [{ aweme_id: '999', desc: 'Wrong' }, { aweme_id: '123', desc: '中文内容',
    author: { nickname: '作者' }, video: { duration: 30000, subtitleInfos: [{ Url: 'https://www.douyin.com/subtitle.vtt' }] } }] };
  const ctx = context('https://www.douyin.com/video/123', { document: {
    querySelectorAll: sel => sel === 'script' ? [{ id: 'RENDER_DATA', textContent: encodeURIComponent(JSON.stringify(state)) }] : [],
  } });
  ctx.chineseFetch = async () => 'WEBVTT\n\n00:03.000 --> 00:04.000\n完整字幕';
  const capture = await ctx.extractDouyin();
  assert.equal(capture.title, '中文内容');
  assert.equal(capture.transcriptAvailable, true);
  assert.match(capture.content, /完整字幕/);
  assert.doesNotMatch(capture.content, /Wrong/);
});
test('Weibo fetches full current post without comments or feed text', async () => {
  const calls = [];
  const ctx = context('https://weibo.com/2014741911/R2KWzqf3A?from=feed#comment');
  ctx.chineseFetch = async url => {
    calls.push(url);
    return { idstr: '123', text_raw: '全文微博', user: { screen_name: '作者' } };
  };
  const capture = await ctx.extractWeibo();
  assert.match(calls[0], /show\?id=R2KWzqf3A$/);
  assert.match(capture.content, /全文微博/);
  assert.equal(capture.metadata.author, '作者');
});
test('Weibo missing post fails instead of scraping a feed', async () => {
  const ctx = context('https://weibo.com/2014741911/R2KWzqf3A');
  ctx.chineseFetch = async () => { throw new Error('Login required'); };
  await assert.rejects(ctx.extractWeibo(), /unavailable/);
});
test('Zhihu captures question and loaded answers without sidebar content', async () => {
  const body = { textContent: '答案正文' };
  const answer = { querySelector: sel => sel.includes('.RichText') ? body : { textContent: '答主' }, getAttribute: () => '{"itemId":"321"}' };
  const ctx = context('https://www.zhihu.com/question/1945573503303685016', { document: {
    querySelector: sel => sel.startsWith('h1.') ? { textContent: '问题标题' } : sel === '.QuestionRichText' ? { textContent: '问题描述' } : null,
    querySelectorAll: sel => sel === '.AnswerItem' ? [answer] : [],
  } });
  ctx.extractText = el => el.textContent;
  const capture = await ctx.extractZhihu();
  assert.match(capture.content, /问题描述/);
  assert.doesNotMatch(capture.content, /答案正文/);
  assert.equal(capture.discussion.kind, "forum");
  assert.match(capture.discussion.items[0].text, /答案正文/);
  assert.equal(capture.metadata.answer_count, 1);
  assert.equal(capture.metadata.capture_scope, 'question_and_loaded_answers');
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
test('manifest and reinjection both load Chinese extractor before registry', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json'), 'utf8'));
  const { CONTENT_SCRIPT_FILES } = require('../src/popup/services/page-extractor.js');
  assert.deepEqual(CONTENT_SCRIPT_FILES, manifest.content_scripts[0].js);
  assert.ok(CONTENT_SCRIPT_FILES.indexOf('src/content/extractors/chinese.js') < CONTENT_SCRIPT_FILES.indexOf('src/content/content-script.js'));
});
test('watch-later without p follows the current player part', async () => {
  const ctx = context(later, { api: biliApi([]), resources: [
    { name: 'https://api.bilibili.com/x/player/wbi/v2?bvid=BV1eVgA64EbW&cid=111' },
    { name: 'https://api.bilibili.com/x/player/wbi/v2?bvid=BV1eVgA64EbW&cid=222' },
  ] });
  const capture = await ctx.extractBilibili();
  assert.equal(String(capture.metadata.cid), '222');
  assert.equal(capture.metadata.part, 2);
  assert.equal(capture.metadata.time_estimate_minutes, 2);
});
test('Zhihu answer permalink excludes sibling answers', async () => {
  const answer = id => ({ querySelector: sel => sel.includes('.RichText') ? { textContent: `Answer ${id}` } : null,
    getAttribute: () => JSON.stringify({ itemId: id }) });
  const ctx = context('https://www.zhihu.com/question/100/answer/321', { document: {
    querySelector: sel => sel.startsWith('h1.') ? { textContent: 'Question' } : null,
    querySelectorAll: sel => sel === '.AnswerItem' ? [answer('999'), answer('321')] : [],
  } });
  ctx.extractText = el => el.textContent;
  const capture = await ctx.extractZhihu();
  assert.match(capture.content, /Answer 321/);
  assert.doesNotMatch(capture.content, /Answer 999/);
  assert.equal(capture.metadata.answer_count, 1);
});
test('Douyin image posts can be analyzed as text while video posts require captions', async () => {
  const { isTranscriptBlocked, detectPageTypeFromUrl } = require('../src/popup/helpers.js');
  const ctx = context('https://www.douyin.com/note/123', { document: {
    querySelectorAll: sel => sel === 'script' ? [{ id: 'RENDER_DATA', textContent: encodeURIComponent(JSON.stringify({
      aweme_id: '123', desc: '图文内容', images: [{ uri: 'image' }],
    })) }] : [],
  } });
  const capture = await ctx.extractDouyin();
  assert.equal(capture.mediaType, 'article');
  assert.equal(isTranscriptBlocked(capture), false);
  assert.equal(isTranscriptBlocked({ sourceType: 'douyin', mediaType: 'video', transcriptAvailable: false }), true);
  assert.equal(detectPageTypeFromUrl('https://www.douyin.com/video/123'), 'douyin');
  assert.equal(detectPageTypeFromUrl('https://weibo.com/2014741911/R2KWzqf3A'), 'weibo');
  assert.equal(detectPageTypeFromUrl('https://www.zhihu.com/question/123'), 'zhihu');
});
