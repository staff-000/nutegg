const test = require('node:test');
const assert = require('node:assert/strict');
const { context, regular, later, biliApi, biliCaptionFixture, captionTrack, ownedBiliFixture } = require('./helpers/platform-fixtures');

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

test('Bilibili does not trust legacy-only tracks when WBI has no usable captions', async () => {
  for (const wbi of [{ code: 0, data: {} }, { code: 0, data: { bvid: 'BV1wqpi6PE19', aid: 117414893257199, cid: 42616031534, subtitle: { subtitles: [] } } }, { code: -352 }]) {
    const calls = [];
    const ctx = context('https://www.bilibili.com/video/BV1wqpi6PE19/', { api: async raw => {
      const url = new URL(raw); calls.push(url.pathname);
      if (url.pathname === '/x/web-interface/view') return { code: 0, data: {
        bvid: 'BV1wqpi6PE19', aid: 117414893257199, cid: 42616031534, title: 'Video',
      } };
      if (url.pathname === '/x/player/wbi/v2') return wbi;
      if (url.pathname === '/x/player/v2') return { code: 0, data: { bvid: 'BV1wqpi6PE19', aid: 117414893257199, cid: 42616031534, subtitle: { subtitles: [
        { lan: 'ai-zh', ai_type: 1, subtitle_url: '//aisubtitle.hdslb.com/bfs/ai_subtitle/test.json' },
      ] } } };
      return { body: [{ from: 0, content: 'Recovered Chinese captions' }] };
    } });
    const capture = await ctx.extractBilibili();
    assert.equal(capture.transcriptAvailable, false);
    assert.doesNotMatch(capture.content, /Recovered Chinese captions/);
    assert.equal(capture.metadata.cid, 42616031534);
    assert(!calls.includes('/x/player/v2'));
  }
});

test('Bilibili retains the current player cid when metadata and serialized state are missing', async () => {
  const calls = [], api = biliApi(calls);
  const signed = 'https://api.bilibili.com/x/player/wbi/v2?bvid=BV1eVgA64EbW&cid=222&w_rid=signature';
  const ctx = context(later, { resources: [{ name: signed }], api: raw => {
    if (new URL(raw).pathname === '/x/web-interface/view') throw new Error('Metadata unavailable');
    return api(raw);
  } });
  const capture = await ctx.extractBilibili();
  assert.equal(capture.metadata.cid, '222');
  assert.equal(capture.transcriptAvailable, true);
  assert.equal(calls[0], signed);
});

test('Bilibili ignores signed requests for other videos and parts when recovering captions', async () => {
  const calls = [], api = biliApi(calls);
  const ctx = context(`${later}&p=2`, { resources: [
    { name: 'https://api.bilibili.com/x/player/wbi/v2?bvid=BVother&cid=222&w_rid=wrong-video' },
    { name: 'https://api.bilibili.com/x/player/wbi/v2?bvid=BV1eVgA64EbW&cid=111&w_rid=wrong-part' },
  ], api });
  const capture = await ctx.extractBilibili();
  assert.equal(capture.metadata.cid, 222);
  assert.equal(capture.transcriptAvailable, true);
  assert(!calls.some(url => /wrong-video|wrong-part/.test(url)));
});

test('Bilibili downloads extensionless signed captions through the page before a failing worker', async () => {
  const requests = [], calls = [];
  const captionUrl = '//aisubtitle.hdslb.com/bfs/ai_subtitle/prod/current-caption?auth_key=test-signature';
  const api = biliApi(calls);
  const ctx = context(regular, { globals: { fetch() {} }, api: raw => {
    if (new URL(raw).hostname.endsWith('hdslb.com')) throw new Error('Background CDN fetch failed');
    return api(raw);
  } });
  ctx.captureFetchText = async (raw, options) => {
    const url = new URL(raw); requests.push({ url, options });
    if (url.pathname === '/x/web-interface/view') return { ok: true, text: JSON.stringify(await api(raw)) };
    if (url.hostname === 'api.bilibili.com') return { ok: true, text: JSON.stringify({ code: 0, data: { bvid: 'BV1eVgA64EbW', aid: 123, cid: 111, subtitle: { subtitles: [
      { subtitle_url: captionUrl, lan: 'ai-zh', ai_type: 0 },
    ] } } }) };
    return { ok: true, text: JSON.stringify({ body: [{ from: 11, content: '实际的中文字幕内容' }] }) };
  };
  const capture = await ctx.extractBilibili();
  assert.equal(capture.transcriptAvailable, true);
  assert.match(capture.content, /\[00:11\] 实际的中文字幕内容/);
  assert.equal(capture.metadata.transcript_source, 'ai');
  const request = requests.find(({ url }) => url.hostname.endsWith('hdslb.com'));
  assert.equal(request.url.searchParams.get('auth_key'), 'test-signature');
  assert.equal(request.options.credentials, 'omit');
  assert.equal(calls.length, 1, 'Only the mocked metadata lookup is used; no worker fetch is needed');
});

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

test('missing video transcript is explicitly blocked, not inferred from description', async () => {
  const ctx = context(later, { api: async raw => raw.includes('web-interface') ? {
    code: 0, data: { bvid: 'BV1eVgA64EbW', title: 'Video', desc: 'Description', cid: 111 },
  } : { code: 0, data: {} } });
  const capture = await ctx.extractBilibili();
  assert.equal(capture.transcriptAvailable, false);
  assert.equal(capture.mediaType, 'video');
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

test('Bilibili rejects conflicting or unverifiable player identities before any subtitle download', async () => {
  for (const patch of [{ bvid: 'BV13fg56xE21' }, { aid: 999 }, { cid: 999 },
    { cid: null }, { bvid: null, aid: null }, { bvid: null, aid: 999 }]) {
    const { ctx, calls } = ownedBiliFixture({ player: (_url, valid) => ({ ...valid, ...patch }) });
    const capture = await ctx.extractBilibili();
    assert.equal(capture.transcriptAvailable, false, JSON.stringify(patch));
    assert.match(capture.content, /Original description/);
    assert.equal(calls.filter(u => u.hostname.endsWith('hdslb.com')).length, 0);
    assert.equal(JSON.parse(capture.metadata.subtitle_provenance).outcome, 'rejected');
  }
});

test('Bilibili rejects foreign view metadata and an explicit CID from another video or part', async () => {
  const foreign = ownedBiliFixture({ view: { bvid: 'BV13fg56xE21', aid: 999, cid: 999, title: 'Foreign title' } });
  const capture = await foreign.ctx.extractBilibili();
  assert.doesNotMatch(capture.content, /Foreign title/);
  assert.equal(capture.transcriptAvailable, false);
  assert.equal(foreign.calls.length, 1);
  for (const url of [regular + '&cid=999', regular + '&p=1&cid=222']) {
    const { ctx, calls } = ownedBiliFixture({ url });
    assert.equal((await ctx.extractBilibili()).transcriptAvailable, false);
    assert.equal(calls.length, 1);
  }
});

test('Bilibili validates AV identity and permits either matching BVID or resolved AID', async () => {
  for (const patch of [{ bvid: null }, { aid: null }]) {
    const { ctx } = ownedBiliFixture({ url: 'https://www.bilibili.com/video/av123', player: (_url, valid) => ({ ...valid, ...patch }) });
    assert.equal((await ctx.extractBilibili()).transcriptAvailable, true);
  }
  const { ctx } = ownedBiliFixture({ url: 'https://www.bilibili.com/video/av999' });
  assert.equal((await ctx.extractBilibili()).transcriptAvailable, false);
});

test('Bilibili rejects a stale signed response then accepts an independently validated fallback', async () => {
  const signed = 'https://api.bilibili.com/x/player/wbi/v2?bvid=BV1eVgA64EbW&cid=111&w_rid=secret';
  const { ctx, calls } = ownedBiliFixture({ resources: [{ name: signed }], player: (url, valid) =>
    url.searchParams.has('w_rid') ? { ...valid, cid: 999 } : valid });
  const capture = await ctx.extractBilibili();
  assert.equal(capture.transcriptAvailable, true);
  const provenance = JSON.parse(capture.metadata.subtitle_provenance);
  assert.equal(provenance.route, 'wbi_player');
  assert.equal(provenance.validatedCid, '111');
  assert.equal(provenance.trackId, '77');
  assert.equal(provenance.language, 'zh-CN');
  assert.equal(provenance.classification, 'manual');
  assert.equal(provenance.rejected[0].reason, 'cid_mismatch');
  assert.doesNotMatch(JSON.stringify(provenance), /secret|auth_key|http|Downloaded transcript/);
  assert.equal(calls.filter(u => u.hostname.endsWith('hdslb.com')).length, 1);
});

test('Bilibili cannot merge a verified empty response with unidentified legacy captions', async () => {
  const { ctx, calls } = ownedBiliFixture({ player: (url, valid) => url.pathname.includes('wbi')
    ? { bvid: valid.bvid, aid: valid.aid, cid: valid.cid, subtitle: { subtitles: [] } }
    : { subtitle: valid.subtitle } });
  const capture = await ctx.extractBilibili();
  assert.equal(capture.transcriptAvailable, false);
  assert.equal(calls.filter(u => u.hostname.endsWith('hdslb.com')).length, 0);
  assert.equal(calls.some(u => u.pathname === '/x/player/v2'), false);
});

test('Bilibili empty subtitle responses keep the description without a transcript', async () => {
  const { ctx, calls } = ownedBiliFixture({ player: (_url, valid) => ({ ...valid, subtitle: { subtitles: [] } }) });
  const capture = await ctx.extractBilibili();
  assert.equal(capture.transcriptAvailable, false);
  assert.match(capture.content, /Original description/);
  assert.doesNotMatch(capture.content, /## Transcript/);
  assert.equal(calls.filter(u => u.hostname.endsWith('hdslb.com')).length, 0);
});

test('Bilibili discards a caption that finishes after cancellation or navigation', async () => {
  for (const code of ['cancelled', 'stale', 'timeout']) {
    const { ctx } = ownedBiliFixture(); let stopped = false;
    const original = ctx.chineseFetch;
    ctx.chineseFetch = async (...args) => { const value = await original(...args); if (args[0].includes('hdslb.com')) stopped = true; return value; };
    const captureContext = { wait: promise => promise, check() { if (stopped) throw Object.assign(new Error(code), { code }); } };
    await assert.rejects(ctx.extractBilibili(captureContext), error => error.code === code);
  }
});

test('Bilibili also rejects a foreign player response returned directly by the page-session fetch', async () => {
  const { ctx, calls } = ownedBiliFixture({ globals: { fetch() {} }, player: (_url, valid) => ({ ...valid, cid: 999 }) });
  ctx.captureFetchText = async raw => {
    const response = await ctx.chrome.runtime.sendMessage({ url: raw });
    return { ok: true, text: response.text };
  };
  const capture = await ctx.extractBilibili();
  assert.equal(capture.transcriptAvailable, false);
  assert.equal(calls.filter(u => u.hostname.endsWith('hdslb.com')).length, 0);
  assert.equal(JSON.parse(capture.metadata.subtitle_provenance).outcome, 'rejected');
});

test('reported no-caption regression: legacy tracks with matching IDs cannot override verified empty WBI', async () => {
  for (const signedPath of ['/x/player/wbi/v2', '/x/player/v2']) {
    const signed = `https://api.bilibili.com${signedPath}?bvid=BV1eVgA64EbW&cid=111&w_rid=secret`;
    const { ctx, calls } = ownedBiliFixture({ resources: [{ name: signed }], player: (url, valid) =>
      url.pathname === '/x/player/v2' ? valid : { ...valid, subtitle: { subtitles: [] } } });
    const capture = await ctx.extractBilibili();
    assert.equal(capture.transcriptAvailable, false);
    assert.match(capture.content, /Original description/);
    assert.doesNotMatch(capture.content, /Downloaded transcript|## Transcript/);
    assert.equal(calls.some(u => u.pathname === '/x/player/v2'), false, 'legacy discovery and replay are both excluded');
    assert.equal(calls.some(u => u.hostname.endsWith('hdslb.com')), false);
    const provenance = JSON.parse(capture.metadata.subtitle_provenance);
    assert.equal(provenance.policy, 'wbi_only');
    assert.equal(provenance.routes.every(route => route.tracks === 0), true);
  }
});
