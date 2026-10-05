// On-page discussion adapters. No next-page navigation or private comment API crawling.
(function (scope) {
  const MAX_ITEMS = 300, MAX_CHARS = 150000;
  const adapters = {
    reddit: { kind: 'forum', root: 'shreddit-post, .thing.link', container: 'shreddit-comment-tree, .commentarea', item: 'shreddit-comment, .thing.comment', text: '[slot="comment"], .md', author: '[slot="authorName"], a[href*="/user/"], a.author', reaction: '[slot="vote-count"], .score, faceplate-number', reactionKind: 'score' },
    youtube: { container: 'ytd-comments, #comments', item: 'ytd-comment-view-model, ytd-comment-renderer', text: '[id="content-text"]', author: '[id="author-text"]', reaction: '[id="vote-count-middle"]', open: '#comments' },
    tiktok: { container: '[data-e2e="comment-list"], [class*="DivCommentListContainer"]', item: '[data-e2e="comment-item"], [class*="DivCommentItemContainer"]', text: '[data-e2e="comment-level-1"], [data-e2e="comment-level-2"], [class*="PCommentText"]', author: 'a[href*="/@"]', reaction: '[data-e2e="comment-like-count"], [class*="SpanCount"]', open: '[data-e2e="comment-icon"], [data-e2e="browse-comment"]' },
    douyin: { container: '[data-e2e="comment-list"], [class*="comment-list"], [class*="commentList"]', item: '[data-e2e="comment-item"], [data-comment-id], [class*="comment-item"], [class*="commentItem"]', text: '[data-e2e="comment-content"], [class*="comment-content"], [class*="commentContent"]', author: 'a[href*="/user/"]', reaction: '[data-e2e="comment-like-count"], [class*="like-count"]', open: '[data-e2e="comment-icon"], [data-e2e="video-comment"]' },
    bilibili: { container: 'bili-comments, .bili-comments, .reply-list', item: 'bili-comment-thread-renderer, bili-comment-renderer, bili-comment-reply-renderer, .reply-item, .sub-reply-item', text: '#contents, #content, .reply-content, .sub-reply-content', author: '#user-name a, #user-name, .user-name, .sub-user-name, a[href*="space.bilibili.com"]', reaction: '#like #count, #like .count, #like, .reply-like .text, .like .text', open: '.video-toolbar-left .video-toolbar-item-comment, .video-toolbar-item-comment' },
    zhihu: { container: '.Comments-container, .CommentListV2, .CommentList', item: '.CommentItemV2, .CommentItem', text: '.CommentItemV2-content, .CommentItem-content', author: '.UserLink-link, a[href*="/people/"]', reaction: '.CommentItemV2-likeBtn, .CommentItem-likeBtn', open: 'button.ContentItem-action' },
    discourse: { kind: 'forum', container: '#topic, .topic-post', item: '.topic-post', text: '.cooked', author: '.names a, a.username', reaction: '.like-count' },
    forum: { kind: 'forum', container: '.block-body, #page-body, .posts', item: 'article.message, .post[id], .postbody', text: '.message-body .bbWrapper, .content', author: '.message-name a, .username, .author a', reaction: '.reactionsBar-link' },
    generic: { container: '#comments, .comments, [itemprop="comment"]', item: '[itemprop="comment"], .comment[id], [data-comment-id]', text: '[itemprop="text"], .comment-content, .comment-body', author: '[itemprop="author"], .comment-author a', reaction: '.like-count' },
  };
  let observedRoots = new Set();
  let page = '', selected = null, records = new Map(), observers = [], expiry, debounce, capped = false, activeSession = null;
  let elementIds = new WeakMap(), sourceElements = new Map();
  const text = el => (el?.innerText || el?.textContent || '').replace(/\s+/g, ' ').trim();
  const hostIs = (host, domain) => host === domain || host.endsWith('.' + domain);
  function adapter() {
    const host = location.hostname.toLowerCase();
    for (const site of ['reddit', 'youtube', 'tiktok', 'douyin', 'bilibili', 'zhihu']) if (hostIs(host, site + '.com')) return site === 'zhihu' && /\/question\//.test(location.pathname) && !/\/answer\//.test(location.pathname)
      ? { name: site, ...adapters[site], kind: 'forum', item: '.AnswerItem, .CommentItemV2, .CommentItem', text: '.RichContent-inner .RichText, .CommentItemV2-content, .CommentItem-content', author: '.AuthorInfo-name a, .UserLink-link', reaction: '.VoteButton--up, .CommentItemV2-likeBtn' }
      : { name: site, ...adapters[site] };
    if (document.querySelector('.topic-post .cooked, #discourse-root')) return { name: 'discourse', ...adapters.discourse };
    if (document.querySelector('article.message, .postbody')) return { name: 'forum', ...adapters.forum };
    return { name: 'generic', ...adapters.generic };
  }
  function reset() {
    const url = location.href.split('#')[0];
    if (page !== url) { stop(); page = url; records = new Map(); elementIds = new WeakMap(); sourceElements = new Map(); capped = false; selected = adapter(); }
    selected ||= adapter();
  }
  function query(root, selectors) { try { return root.querySelector(selectors); } catch { return null; } }
  function all(root, selectors) { try { return Array.from(root.querySelectorAll(selectors)); } catch { return []; } }
  function roots() {
    const out = [document], seen = new Set(out);
    // Each Bilibili comment has several component roots (text, author, toolbar).
    // Seed the comment container so a large video page cannot hide it behind a node cap.
    if (['bilibili', 'reddit'].includes(selected.name)) {
      const add = root => { if (root && !seen.has(root) && out.length < 2048) { seen.add(root); out.push(root); } };
      all(document, selected.container).forEach(el => add(el.shadowRoot));
      for (let i = 0; i < out.length && out.length < 2048; i++) {
        for (const el of all(out[i], '*')) add(el.shadowRoot);
      }
    }
    return out;
  }
  // Search within one comment, without borrowing text/likes from nested replies.
  function commentQuery(el, selectors) {
    const queue = [el], seen = new Set();
    for (let i = 0; i < queue.length && i < 64; i++) {
      const root = queue[i]; if (seen.has(root)) continue; seen.add(root);
      const match = all(root, selectors).find(node => {
        const owner = node.parentElement?.closest(selected.item);
        return !owner || owner === el;
      });
      if (match) return match;
      if (root.shadowRoot) queue.push(root.shadowRoot);
      for (const child of all(root, '*')) {
        const owner = child.closest(selected.item);
        if (child.shadowRoot && (!owner || owner === el)) queue.push(child.shadowRoot);
      }
    }
    return null;
  }
  function commentText(body) {
    const parts = [];
    function visit(node) {
      if (node.nodeType === 3) { parts.push(node.textContent); return; }
      if (node.matches?.('button, script, style, ' + selected.item)) return;
      if (node.matches?.('img')) { parts.push(node.getAttribute('alt') || ''); return; }
      const children = node.shadowRoot ? node.shadowRoot.childNodes : node.childNodes;
      for (const child of children || []) visit(child);
      if (node.matches?.('p, div, br, li')) parts.push(' ');
    }
    visit(body);
    return parts.join('').replace(/\s+/g, ' ').trim();
  }
  function composedParent(el) { return el.parentElement || el.getRootNode?.().host || null; }
  function parentComment(el) {
    for (let node = composedParent(el); node; node = composedParent(node)) {
      if (!node.matches?.(selected.item)) continue;
      // A Bilibili thread wraps its main comment and its replies. Resolve the
      // wrapper to the main comment instead of counting it as a second comment.
      if (node.matches('bili-comment-thread-renderer')) {
        const main = node.shadowRoot && query(node.shadowRoot, 'bili-comment-renderer');
        return main === el ? null : main || node;
      }
      return node;
    }
    return null;
  }
  function number(value) {
    const raw = String(value || '').replace(/[\s\u00a0]/g, '');
    const match = raw.match(/(-?\d+(?:[.,]\d+)*)\s*([kKmM万萬亿億]?)/);
    if (!match) return { count: null, approximate: false };
    const factor = { k: 1000, m: 1000000, '万': 10000, '萬': 10000, '亿': 100000000, '億': 100000000 }[match[2].toLowerCase()] || 1;
    let digits = match[1];
    if (factor !== 1 && /^-?\d+,\d{1,2}$/.test(digits)) digits = digits.replace(',', '.');
    else digits = digits.replace(/,/g, '');
    const locale = document.documentElement?.lang || (typeof navigator !== 'undefined' ? navigator.language : '');
    if (factor === 1 && (/^[^.]+(?:\.\d{3}){2,}$/.test(digits) || /^(de|es|pt|it)/i.test(locale) && /^-?\d{1,3}(?:\.\d{3})+$/.test(digits))) digits = digits.replace(/\./g, '');
    return { count: Math.round(Number(digits) * factor), approximate: factor !== 1 };
  }
  function stableHash(value) { let hash = 2166136261; for (const c of value) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619); return (hash >>> 0).toString(36); }
  function identity(el) {
    if (el.matches?.('.AnswerItem')) { try { const id = JSON.parse(el.getAttribute('data-zop')).itemId; if (id) return 'answer-' + id; } catch {} }
    return el.getAttribute?.('rpid') || el.getAttribute?.('data-rpid') || el.getAttribute?.('thingid') || el.getAttribute?.('comment-id') || el.getAttribute?.('data-comment-id') || el.getAttribute?.('data-id') || (/^(?:comment|post|t1)[-_]/.test(el.id || '') ? el.id : undefined); }
  function scan() {
    reset();
    if (activeSession) watch();
    let chars = [...records.values()].reduce((n, item) => n + item.text.length, 0);
    for (const root of roots()) for (const el of all(root, selected.item)) {
      if (selected.name === 'forum' && el.matches('.postbody') && el.parentElement?.closest('article.message, .post[id]')) continue;
      // Forum's first post is the body, not a second discussion item.
      if (selected.kind === 'forum' && !['reddit', 'zhihu'].includes(selected.name) && el === all(document, selected.item)[0]) continue;
      if (el.matches('bili-comment-thread-renderer') && el.shadowRoot && query(el.shadowRoot, 'bili-comment-renderer')) continue;
      // On a question page, only attribute comments whose answer is identifiable.
      // An unrelated/global floating panel must not become the last answer's replies.
      let answerOwner = null;
      if (selected.name === 'zhihu' && selected.kind === 'forum' && !el.matches('.AnswerItem')) {
        answerOwner = el.closest('.AnswerItem');
        const ownerId = el.closest('[data-answer-id]')?.getAttribute('data-answer-id');
        if (!answerOwner && ownerId) answerOwner = all(document, '.AnswerItem').find(answer => identity(answer) === 'answer-' + ownerId);
        if (!answerOwner) continue;
      }
      const body = commentQuery(el, selected.text);
      if (!body) continue;
      const content = commentText(body);
      if (!content) continue;
      const authorEl = commentQuery(el, selected.author);
      const author = text(authorEl), href = authorEl?.href || (authorEl && query(authorEl, 'a[href]')?.href);
      const rawId = identity(el);
      // A stable DOM ID is preferred. A structural location disambiguates identical anonymous texts.
      const id = selected.name + ':' + (rawId || stableHash(`${href || author}|${content}|${href || author ? '' : all(root, selected.item).indexOf(el)}`));
      elementIds.set(el, id);
      const thread = el.closest?.('ytd-comment-thread-renderer');
      const threadTop = thread && query(thread, selected.item);
      const parent = parentComment(el) || (threadTop !== el ? threadTop : null) || answerOwner;
      const parentId = el.getAttribute?.('parentid') || el.getAttribute?.('parent-id') || el.getAttribute?.('data-parent-id') || (parent && (identity(parent) || elementIds.get(parent)?.slice(selected.name.length + 1)));
      const vote = commentQuery(el, selected.reaction);
      const parsed = number(vote?.getAttribute?.('number') || vote?.getAttribute?.('score') || vote?.getAttribute?.('aria-label') || text(vote));
      if (!records.has(id) && records.size >= MAX_ITEMS) { capped = true; continue; }
      const allowance = Math.min(6000, MAX_CHARS - chars + (records.get(id)?.text.length || 0));
      if (allowance <= 0) { capped = true; continue; }
      const boundedText = content.slice(0, allowance);
      chars += boundedText.length - (records.get(id)?.text.length || 0);
      capped ||= content.length > allowance;
      let url = query(el, 'a[href*="comment"], a[href*="#post"], a[href*="/answer/"]')?.href;
      if (!url && selected.name === 'reddit' && rawId) url = page.replace(/\/$/, '') + '/' + rawId.replace(/^t1_/, '') + '/';
      if (!url && selected.name === 'youtube' && rawId) { const u = new URL(page); u.searchParams.set('lc', rawId); url = u.href; }
      if (!url && el.id) url = page + '#' + el.id;
      sourceElements.set(id, el);
      records.set(id, { id, parentId: parentId ? selected.name + ':' + parentId : undefined, author: author || undefined,
        authorId: href || undefined, text: boundedText, url,
        reaction: { kind: selected.reactionKind || 'likes', ...parsed } });
    }
    return [...records.values()];
  }
  function snapshot() {
    const items = scan();
    const visible = roots().some(root => query(root, selected.container));
    const empty = roots().some(root => query(root, '[data-e2e="comment-empty"], ytd-message-renderer #message'));
    const emptyText = empty ? roots().map(root => text(query(root, '[data-e2e="comment-empty"], ytd-message-renderer #message'))).join(' ') : '';
    const explicitlyEmpty = /no comments|还没有评论|暂无评论|没有评论/i.test(emptyText);
    const disabled = /comments are turned off|评论已关闭/i.test(emptyText);
    const post = query(document, 'shreddit-post');
    const totalCount = selected.name === 'reddit' ? number(post?.getAttribute('comment-count')).count : null;
    return { kind: selected.kind || 'comments', status: items.length ? 'partial' : disabled || (!visible && selected.name === 'generic') ? 'unavailable' : explicitlyEmpty ? 'empty' : 'not_loaded',
      reason: disabled ? 'disabled' : !visible && selected.name === 'generic' ? 'unsupported' : undefined,
      items, totalCount: explicitlyEmpty ? 0 : totalCount, truncated: capped, capturedAt: new Date().toISOString(), sessionId: activeSession, url: page };
  }
  function stop(sessionId) {
    if (sessionId && activeSession !== sessionId) return;
    observers.forEach(observer => observer.disconnect()); observers = []; observedRoots.clear();
    clearTimeout(expiry); clearTimeout(debounce); activeSession = null;
  }
  function watch() {
    if (typeof MutationObserver !== 'undefined') for (const root of roots()) {
      if (observedRoots.has(root)) continue;
      observedRoots.add(root);
      const observer = new MutationObserver(() => { clearTimeout(debounce); debounce = setTimeout(scan, 250); });
      observer.observe(query(root, selected.container) || root, { childList: true, subtree: true, characterData: true }); observers.push(observer);
    }
  }
  function start(sessionId, load = false) {
    reset(); stop(); activeSession = sessionId;
    if (load) {
      const target = query(document, selected.container) || query(document, selected.open || selected.container);
      if (target) {
        if (!query(document, selected.container) && selected.name !== 'zhihu') target.click?.();
        target.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      }
    }
    watch();
    expiry = setTimeout(() => stop(sessionId), 120000);
    return snapshot();
  }
  function step(sessionId) {
    reset(); if (sessionId !== activeSession) return snapshot();
    const container = query(document, selected.container);
    const target = container && (container.scrollHeight > container.clientHeight + 20 && getComputedStyle(container).overflowY !== 'visible' ? container : container.parentElement);
    if (target?.scrollHeight > target?.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(target).overflowY)) target.scrollBy?.(0, Math.min(600, target.clientHeight || 600));
    else if (container) window.scrollBy?.(0, 500);
    return snapshot();
  }
  function decorate(capture) {
    const captured = snapshot();
    const discussion = capture.discussion ? { ...captured, ...capture.discussion, items: [...new Map([...captured.items, ...capture.discussion.items].map(item => [item.id, item])).values()] } : captured;
    let body = capture.content;
    if (selected.kind === 'forum' && selected.name !== 'zhihu' && !capture.discussion) {
      const first = query(document, selected.root || selected.item);
      const bodyEl = selected.name === 'reddit' ? query(first || document, '[slot="text-body"], .usertext-body .md') : query(first || document, selected.text);
      body = `# ${capture.title}\n\n${text(bodyEl)}`;
    }
    const length = body.replace(/^#.*\n/, '').replace(/\s/g, '').length;
    const discussionLength = discussion.items.reduce((sum, item) => sum + item.text.replace(/\s/g, '').length, 0);
    discussion.bodyLength = length;
    discussion.autoEnable = (selected.name === 'reddit' && /\/comments\//.test(location.pathname))
      || (discussion.kind === 'forum' && length < 500 && ((discussion.items.length >= 3 && discussionLength >= Math.max(800, length * 3)) || discussion.totalCount >= 10));
    return { ...capture, content: body, discussion };
  }
  function findSource(id) {
    scan();
    const element = sourceElements.get(id);
    return { element: element?.isConnected ? element : null, item: records.get(id) };
  }
  scope.NutEggDiscussion = { snapshot, start, stop, step, decorate, number, findSource };
  if (typeof module !== 'undefined' && module.exports) module.exports = scope.NutEggDiscussion;
})(typeof window !== 'undefined' ? window : globalThis);
