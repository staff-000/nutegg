const { createPlatformContext: context } = require('./extractor-harness');
const regular = 'https://www.bilibili.com/video/BV1eVgA64EbW?spm_id_from=333.1245.0.0';

const later = 'https://www.bilibili.com/list/watchlater/?bvid=BV1eVgA64EbW&oid=117091965343752&watchlater_cfg=%7B%22viewed%22%3A0%7D';

function biliApi(calls, failManual = false) {
  return async raw => {
    calls.push(raw);
    const url = new URL(raw);
    if (url.pathname === '/x/web-interface/view') return { code: 0, data: {
      bvid: 'BV1eVgA64EbW', aid: 123, title: '中文视频', desc: '简介', owner: { name: '作者' },
      pages: [{ page: 1, cid: 111, duration: 90 }, { page: 2, cid: 222, duration: 120 }] } };
    if (url.hostname === 'api.bilibili.com') return { code: 0, data: { bvid: 'BV1eVgA64EbW', aid: 123, cid: Number(url.searchParams.get('cid')), subtitle: { subtitles: [
      { ai_type: 1, lan: 'ai-zh', subtitle_url: '//aisubtitle.hdslb.com/bfs/ai_subtitle/ai.json' },
      { ai_type: 0, lan: 'zh-CN', subtitle_url: '//subtitle.hdslb.com/bfs/subtitle/manual.json' },
    ] }, view_points: [{ from: 60, content: '第二章' }] } };
    if (url.pathname.endsWith('manual.json') && failManual) throw new Error('Unavailable');
    return { body: [{ from: 65, content: url.pathname.endsWith('manual.json') ? '人工字幕' : 'AI字幕' }] };
  };
}

function biliCaptionFixture(tracks, { failed = [], empty = [] } = {}) {
  const fetched = [];
  const ctx = context(regular, { api: async raw => {
    const url = new URL(raw);
    if (url.pathname === '/x/web-interface/view') return { code: 0, data: { bvid: 'BV1eVgA64EbW', title: 'Video', cid: 111 } };
    if (url.hostname === 'api.bilibili.com') return { code: 0, data: { bvid: 'BV1eVgA64EbW', cid: 111, subtitle: { subtitles: tracks } } };
    const name = url.pathname.split('/').pop();
    fetched.push(name);
    if (failed.includes(name)) throw new Error('Unavailable');
    return { body: empty.includes(name) ? [] : [{ from: 0, content: name }] };
  } });
  return { ctx, fetched };
}

const captionTrack = (name, lan, ai_type = 0) => ({ lan, ai_type, subtitle_url: `//subtitle.hdslb.com/bfs/subtitle/${name}.json` });

// Regression: correct request URLs must not lend their identity to a foreign response.
function ownedBiliFixture({ player, view, url = regular, globals = {}, resources = [] } = {}) {
  const calls = [];
  const info = { bvid: 'BV1eVgA64EbW', aid: 123, cid: 111, title: 'Investment video', desc: 'Original description', pages: [{ page: 1, cid: 111 }] };
  const track = { id: 77, lan: 'zh-CN', subtitle_url: '//subtitle.hdslb.com/bfs/subtitle/ownership.json?auth_key=secret' };
  const valid = { bvid: info.bvid, aid: 123, cid: 111, subtitle: { subtitles: [track] } };
  const ctx = context(url, { resources, globals, api: async raw => {
    const u = new URL(raw); calls.push(u);
    if (u.pathname === '/x/web-interface/view') return { code: 0, data: view === undefined ? info : view };
    if (u.hostname === 'api.bilibili.com') return { code: 0, data: typeof player === 'function' ? await player(u, valid) : player === undefined ? valid : player };
    return { body: [{ from: 0, content: 'Downloaded transcript' }] };
  } });
  return { ctx, calls, info, valid };
}

module.exports = { context, regular, later, biliApi, biliCaptionFixture, captionTrack, ownedBiliFixture };
