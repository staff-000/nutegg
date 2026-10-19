const test = require('node:test');
const assert = require('node:assert/strict');
const { context } = require('./helpers/platform-fixtures');

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
