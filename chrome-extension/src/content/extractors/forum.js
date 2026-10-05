function detectForum() { return /(^|\.)reddit\.com$/.test(location.hostname) && /\/comments\//.test(location.pathname) || !!document.querySelector('.topic-post .cooked, article.message .message-body, .postbody .content'); }
function extractForum() {
  const title = document.querySelector('shreddit-post [slot="title"], .thing.link .title, h1.fancy-title, h1.p-title-value, h1, h2.topic-title')?.textContent?.trim() || document.querySelector('shreddit-post')?.getAttribute('post-title') || document.title;
  return { url: location.href, title, content: `# ${title}`, sourceType: /(^|\.)reddit\.com$/.test(location.hostname) ? 'reddit' : 'forum', metadata: {} };
}
