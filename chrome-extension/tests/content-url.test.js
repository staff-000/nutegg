const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const core = new Function(fs.readFileSync(require.resolve('../dist/ai-core.js'), 'utf8') + '\nreturn NutEggAI;')();

test('Bilibili video identity uses bvid across watch-later, playlist and video links', () => {
  const canonicalUrl = 'https://www.bilibili.com/video/BV1jc8e6vEKk';
  const expected = { platform: 'bilibili', id: 'BV1jc8e6vEKk', canonicalUrl };
  for (const url of [canonicalUrl + '/?spm_id_from=tracking&vd_source=tracking',
    'https://www.bilibili.com/list/watchlater/?bvid=BV1jc8e6vEKk&oid=117147766360158&watchlater_cfg=tracking',
    'https://www.bilibili.com/medialist/play/watchlater?bvid=BV1jc8e6vEKk',
    'https://m.bilibili.com/video/BV1jc8e6vEKk?p=1&t=30']) {
    assert.deepEqual(core.getVideoIdentity(url), expected);
    assert.equal(core.normalizeContentUrl(url), canonicalUrl);
  }
  assert.equal(core.normalizeContentUrl(canonicalUrl + '?p=2&spm_id_from=tracking'), canonicalUrl + '?p=2');
  assert.equal(core.normalizeContentUrl('https://player.bilibili.com/player.html?bvid=BV1jc8e6vEKk&page=2'), canonicalUrl + '?p=2');
});

test('YouTube variants share a video identity without conflating channels, playlists or lookalike domains', () => {
  const canonical = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  for (const url of [canonical + '&t=42&si=tracking&list=playlist', 'https://youtu.be/dQw4w9WgXcQ?si=tracking',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube.com/live/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ?start=10', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ']) {
    assert.equal(core.normalizeContentUrl(url), canonical);
  }
  for (const url of ['https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/playlist?list=PL123',
    'https://www.youtube.com/@channel/videos', 'https://www.bilibili.com/list/watchlater/',
    'https://www.bilibili.com/video/BV1jc8e6vEKkextra', 'https://example.test/?bvid=BV1jc8e6vEKk', 'not a URL']) {
    assert.equal(core.getVideoIdentity(url), null);
  }
});

test('discussion analysis reuses local cached labels across URL variants without new AI calls', async () => {
  for (const urls of [
    ['https://www.bilibili.com/list/watchlater/?bvid=BV1jc8e6vEKk', 'https://www.bilibili.com/video/BV1jc8e6vEKk/?spm_id_from=tracking'],
    ['https://youtu.be/dQw4w9WgXcQ?t=5', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=tracking'],
  ]) {
    let calls = 0;
    const processor = new core.AIProcessor({ settings: { aiProvider: 'openai', aiApiKey: 'test' },
      aiClient: { chat: async () => { calls++; return JSON.stringify({ topics: [{ id: 't', title: 'Experience', stances: { neutral: [0] } }] }); } } });
    const input = { title: 'Same video', content: 'Same captured text', sourceType: 'video',
      enabledSections: { titleVerdict: false, coreSummary: false, mindMap: false, discussion: true },
      discussion: { kind: 'comments', status: 'partial', items: [{ id: 'comment-a', text: 'Personal experience' }] } };
    const first = await processor.analyzeContent({ ...input, url: urls[0] });
    const second = await processor.analyzeContent({ ...input, url: urls[1] });
    assert.equal(calls, 1);
    assert.deepEqual(second.discussion, first.discussion);
    assert.deepEqual(second.discussion.topics[0].commentIds.neutral, ['comment-a']);
  }
});

test('cached video source jumps target the current URL variant but keep the guard for different parts', async () => {
  const { fixture } = require('./helpers/popup-fixture');
  const { InteractionAction } = require('../src/popup/action/interaction');
  const f = fixture();
  const current = 'https://www.bilibili.com/list/watchlater/?bvid=BV1jc8e6vEKk&oid=117147766360158';
  const captured = 'https://www.bilibili.com/video/BV1jc8e6vEKk/?spm_id_from=tracking';
  f.store.dispatch({ type: 'pageInfo', tabId: 1, url: current });
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry: { result: { mode: 'chrome' },
    capturePayload: { url: captured, content: 'Saved video transcript' } } });
  const requests = [];
  const action = new InteractionAction({ tabStateManager: f.store,
    pageExtractor: { scrollToSection: async (...args) => { requests.push(args); return true; } } });
  await action.scrollToSection('Discussion', '', 'bilibili:comment-a');
  assert.equal(requests[0][4], current);
  f.store.dispatch({ type: 'pageInfo', tabId: 1, url: current + '&p=2' });
  await action.scrollToSection('Discussion', '', 'bilibili:comment-a');
  assert.equal(requests[1][4], captured);
});
