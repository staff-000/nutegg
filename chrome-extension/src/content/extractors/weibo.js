// NutEgg weibo extractor.
// Classic isolated-world script; see docs/content-extractor-contributing.md.
function detectWeibo() {
  return (
    (chineseHost('weibo.com') || chineseHost('weibo.cn')) &&
    /^\/(?:\d+|detail|status)\/[\w]+\/?$/.test(new URL(window.location.href).pathname)
  );
}

async function extractWeibo(context) {
  const url = new URL(window.location.href);
  const id = url.pathname.match(/^\/(?:\d+|detail|status)\/([\w]+)\/?$/)?.[1];
  let post = null;
  if (id) {
    try {
      if (chineseHost('weibo.com'))
        post = await chineseFetch(`${url.origin}/ajax/statuses/show?id=${encodeURIComponent(id)}`, true, context);
      else post = (await chineseFetch(`${url.origin}/statuses/show?id=${encodeURIComponent(id)}`, true, context)).data;
    } catch {}
  }
  let text = post?.text_raw || (post?.text ? chineseHtmlText(post.text) : '');
  if (post?.isLongText && post?.idstr) {
    try {
      const full = await chineseFetch(`${url.origin}/ajax/statuses/longtext?id=${post.idstr}`, true, context);
      if (full.data?.longTextContent) text = chineseHtmlText(full.data.longTextContent);
    } catch {}
  }
  const candidates = Array.from(document.querySelectorAll('.WB_feed_detail, article, .card'));
  const root =
    candidates.find(item => {
      const link = item.querySelector(`a[href*="/${id}"]`);
      return id && (item.getAttribute('mid') === id || item.getAttribute('data-mid') === id || link);
    }) || (id ? document.querySelector('.main-full, .WB_detail') : null);
  if (!text && root) text = chineseText('[class*="detail_wbtext"], .WB_text, .weibo-text, .txt', root);
  // Never fall back to the whole feed, recommendations, or comment thread.
  if (!text) throw new Error('Weibo post content is unavailable');
  const author =
    post?.user?.screen_name || (root && chineseText('[class*="head_name"], .WB_info, .m-text-cut', root)) || '';
  const title = `${author ? `${author}: ` : ''}${text.slice(0, 100)}`;
  const repost = post?.retweeted_status;
  return {
    url: url.href,
    title,
    sourceType: 'weibo',
    content: `# ${title}\n\n${text}${repost ? `\n\n## Reposted\n\n${repost.user?.screen_name || ''}\n\n${repost.text_raw || chineseHtmlText(repost.text)}` : ''}`,
    metadata: { platform: 'weibo', author, published: post?.created_at || '', post_id: post?.idstr || id },
  };
}
