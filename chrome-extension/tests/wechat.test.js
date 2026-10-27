const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createExtractorPage, captureScripts, flush } = require('./helpers/extractor-harness');

const url = 'https://mp.weixin.qq.com/s/fixture-article';

// Synthetic WeChat layout: no semantic article tag or generic body selector.
const article = `
  <h1 id="activity-name">测试文章</h1>
  <div id="meta_content"><span id="js_author_name">作者</span>
    <a id="js_name">公众号</a><em id="publish_time">2026年10月26日</em></div>
  <div id="js_content" class="rich_media_content">
    <section><p>第一段正文，应该被完整提取。</p>
      <h2>小标题</h2><p>第二段含有<strong>重点</strong>和<a href="/s/related">链接</a>。</p></section>
    <p hidden>隐藏广告</p><script>window.secret = 'script text';</script>
  </div>
  <div id="comments">不属于正文的留言</div>
  <footer>阅读原文 分享</footer>
  <div class="content" style="display:none">隐藏的通用容器</div>`;

test('WeChat capture selects its visible article body through the production registry', async t => {
  const page = createExtractorPage(t, { url, html: article });
  const result = await page.capture();
  assert.equal(result.success, true);
  const capture = result.content;
  assert.equal(capture.extractionStatus, 'ready');
  assert.equal(capture.sourceType, 'article');
  assert.equal(capture.title, '测试文章');
  assert.equal(capture.metadata.platform, 'WeChat');
  assert.equal(capture.metadata.author, '作者');
  assert.equal(capture.metadata.site, '公众号');
  assert.equal(capture.metadata.published, '2026年10月26日');
  assert.match(capture.content, /第一段正文/);
  assert.match(capture.content, /## 小标题/);
  assert.match(capture.content, /重点和\[链接\]\(https:\/\/mp.weixin.qq.com\/s\/related\)/);
  assert.doesNotMatch(capture.content, /隐藏广告|script text|留言|阅读原文|通用容器/);
  assert.equal(page.win.__nuteggCaptureState.diagnostics.at(-1).extractor, 'article');
  assert.equal(page.requests.length, 0);
});

test('WeChat detection is limited to its exact article host and paths', t => {
  const page = createExtractorPage(t);
  for (const candidate of [url, 'https://mp.weixin.qq.com/s?__biz=fixture&mid=123']) {
    page.navigate(candidate);
    assert.equal(page.win.detectArticle(), true, candidate);
  }
  for (const candidate of [
    'https://mp.weixin.qq.com/cgi-bin/home',
    'https://mp.weixin.qq.com/s/article/extra',
    'https://mp.weixin.qq.com.evil.test/s/article',
    'https://example.com/?url=https://mp.weixin.qq.com/s/article',
  ]) {
    page.navigate(candidate);
    assert.equal(page.win.detectArticle(), false, candidate);
  }
});

test('WeChat supports the alternate body class and metadata fallbacks', t => {
  const page = createExtractorPage(t, {
    url: 'https://mp.weixin.qq.com/s?__biz=fixture&mid=123',
    html: `<meta property="og:title" content="备用标题"><meta name="author" content="备用作者">
      <meta property="article:published_time" content="2026-10-26">
      <div class="rich_media_content"><p>短正文。</p></div>`,
  });
  const capture = page.win.extractArticle();
  assert.equal(capture.extractionStatus, 'ready');
  assert.equal(capture.title, '备用标题');
  assert.equal(capture.metadata.author, '备用作者');
  assert.equal(capture.metadata.published, '2026-10-26');
  assert.match(capture.content, /短正文/);
});

test('WeChat never treats the title, controls, or a hidden body as ready prose', t => {
  for (const body of [
    '',
    '<div id="js_content"></div>',
    '<div id="js_content" style="display:none"><p>隐藏正文</p></div>',
    '<div hidden><div id="js_content"><p>隐藏正文</p></div></div>',
    '<div aria-hidden="true"><div id="js_content"><p>隐藏正文</p></div></div>',
    '<div id="js_content">加载中…</div>',
  ]) {
    const page = createExtractorPage(t, {
      url, html: `<h1 id="activity-name">只有标题</h1>${body}<main>阅读原文 分享</main>`,
    });
    const capture = page.win.extractArticle();
    assert.equal(capture.extractionStatus, 'not_ready', body);
    assert.doesNotMatch(capture.content, /隐藏正文|阅读原文|分享/);
  }
});

test('WeChat capture waits for its body to hydrate and become visible', async t => {
  const page = createExtractorPage(t, {
    url, html: '<div id="shell"><div id="js_content" hidden>加载中…</div></div>',
  });
  const pending = page.capture();
  await page.hydrate('<div id="js_content"><p>延迟加载的完整正文。</p></div>', 100, '#shell');
  const result = await pending;
  assert.equal(result.content.extractionStatus, 'ready');
  assert.match(result.content.content, /延迟加载的完整正文/);
  assert.doesNotMatch(result.content.content, /加载中/);
});

test('WeChat missing body times out without falling back to the page shell', async t => {
  const page = createExtractorPage(t, { url, html: '<h1>文章标题</h1><main>阅读原文 分享</main>' });
  const result = await page.capture();
  assert.equal(result.content.extractionStatus, 'not_ready');
  assert.ok(result.content.captureCoverage.reasons.includes('loading_timeout'));
  assert.doesNotMatch(result.content.content, /阅读原文|分享/);
  assert.equal(page.win.__nuteggCaptureState.diagnostics.at(-1).extractor, 'article');
});

test('WeChat visible verification and deletion notices report restricted access', t => {
  for (const notice of ['环境异常，请完成验证后继续访问', '该内容已被发布者删除']) {
    const page = createExtractorPage(t, {
      url, html: `<div class="weui-msg__text-area">${notice}</div>`,
    });
    const capture = page.win.extractArticle();
    assert.equal(capture.extractionStatus, 'unavailable');
    assert.ok(capture.captureCoverage.reasons.includes('access_restricted'));
    assert.doesNotMatch(capture.content, /环境异常|发布者删除/);
  }
  const page = createExtractorPage(t, {
    url, html: '<div hidden><div class="page_msg">环境异常</div></div>',
  });
  assert.equal(page.win.extractArticle().extractionStatus, 'not_ready');
  page.win.document.body.innerHTML = '<div id="js_content"><p>本文讨论环境异常和完成验证提示。</p></div>' +
    '<div class="page_msg">环境异常</div>';
  assert.equal(page.win.extractArticle().extractionStatus, 'ready');
});

test('WeChat retains the shared article truncation limit and coverage', t => {
  const page = createExtractorPage(t, {
    url, html: `<div id="js_content"><p>${'文'.repeat(65000)}</p></div>`,
  });
  const capture = page.win.extractArticle();
  assert.equal(capture.extractionStatus, 'ready');
  assert.ok(capture.captureCoverage.reasons.includes('truncated'));
  assert.equal(capture.captureCoverage.originalCharacters, 65000);
  assert.equal(capture.captureCoverage.capturedCharacters, 60000);
});

test('WeChat capture works after content-script reinjection', async t => {
  const page = createExtractorPage(t, { url, html: article });
  const previous = page.win.EXTRACTORS.find(entry => entry.name === 'article').extract;
  for (const file of captureScripts()) page.load(file);
  assert.equal(page.listeners.length, 1);
  assert.notEqual(page.win.EXTRACTORS.find(entry => entry.name === 'article').extract, previous);
  const result = await page.capture();
  assert.equal(result.content.extractionStatus, 'ready');
  assert.equal(result.content.metadata.platform, 'WeChat');
  assert.match(result.content.content, /第一段正文/);
});

for (const action of ['cancel', 'navigate']) {
  test(`WeChat settling stops after ${action}`, async t => {
    const page = createExtractorPage(t, { url, html: '<div id="js_content"></div>' });
    const pending = page.capture({ requestId: 'waiting' });
    await flush();
    if (action === 'cancel') await page.cancel('waiting');
    else page.navigate('/s/next-article');
    const result = await pending;
    assert.equal(result.success, false);
    assert.equal(result.errorCode, action === 'cancel' ? 'cancelled' : 'stale');
  });
}
