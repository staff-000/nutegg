const test = require('node:test');
const assert = require('node:assert/strict');
const { context } = require('./helpers/platform-fixtures');

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
