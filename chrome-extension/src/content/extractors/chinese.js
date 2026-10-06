// Chinese platforms. Runs in Chrome's isolated world: read serialized page
// state, never rely on page JavaScript globals or evaluate inline scripts.
function chineseHost(domain) {
  const host = new URL(window.location.href).hostname;
  return host === domain || host.endsWith(`.${domain}`);
}
function bilibiliVideoId() {
  const url = new URL(window.location.href);
  const id = url.pathname.match(/\/video\/(BV[\w]+|av\d+)/i)?.[1] || url.searchParams.get('bvid') || '';
  return /^(BV\w+|av\d+)$/i.test(id) ? id : '';
}
function detectBilibili() { return chineseHost('bilibili.com') && !!bilibiliVideoId(); }
function detectDouyin() {
  const url = new URL(window.location.href);
  return chineseHost('douyin.com') && !!(url.pathname.match(/\/(?:video|note)\/\d+/) || url.searchParams.get('modal_id'));
}
function detectWeibo() {
  return chineseHost('weibo.com') || chineseHost('weibo.cn');
}
function detectZhihu() { return chineseHost('zhihu.com'); }

function chineseText(selector, root = document) {
  return root.querySelector(selector)?.textContent?.trim() || '';
}
function chineseHtmlText(html) {
  const el = document.createElement('div');
  el.innerHTML = html || '';
  el.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
  return extractText(el);
}
function chinesePageStates() {
  const states = [];
  for (const script of document.querySelectorAll('script')) {
    const text = script.textContent || '';
    try {
      if (['RENDER_DATA', 'js-initialData', '__NEXT_DATA__'].includes(script.id)) {
        states.push(JSON.parse(script.id === 'RENDER_DATA' ? decodeURIComponent(text) : text));
      } else {
        for (const marker of ['__INITIAL_STATE__', '_ROUTER_DATA', '__PLAYINFO__']) {
          const pos = text.indexOf(marker);
          if (pos >= 0) states.push(JSON.parse(extractBalanced(text, pos + marker.length)));
        }
      }
    } catch { /* A stale/partial hydration script must not break extraction. */ }
  }
  return states;
}
function chineseFind(value, predicate, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 20) return null;
  if (predicate(value)) return value;
  for (const child of Object.values(value)) {
    const found = chineseFind(child, predicate, depth + 1);
    if (found) return found;
  }
  return null;
}
async function chineseFetch(url, json = true) {
  // Privileged worker fetch avoids API/CDN CORS restrictions. Same-origin
  // requests stay in the tab to use the site's normal authenticated session.
  const target = new URL(url, window.location.href);
  if (target.origin === new URL(window.location.href).origin) {
    const response = await fetchWithTimeout(target.href, { credentials: 'include' }, 1800);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return json ? response.json() : response.text();
  }
  const result = await chrome.runtime.sendMessage({ action: 'chinese-content-fetch', url: target.href });
  if (!result?.success) throw new Error(result?.error || 'Content fetch failed');
  return json ? JSON.parse(result.text) : result.text;
}
function chineseIsAI(track) {
  return Number(track.ai_type || track.aiType) > 0 || (track.is_auto === true || track.is_auto === 1) || track.source === 'ai' || /^ai[-_]/i.test(track.lan || '');
}
function chineseSubtitleText(raw) {
  try {
    const data = JSON.parse(raw);
    const lines = data.body || data.utterances || data;
    if (!Array.isArray(lines)) return '';
    return lines.filter(line => line.content || line.text).map(line => {
      const seconds = line.from ?? (Number(line.start_time || 0) / 1000);
      return `[${formatTime(seconds)}] ${line.content || line.text}`;
    }).join('\n');
  } catch {
    // SRT / WebVTT: retain only timestamped cues, never HTML/error pages.
    return raw.split(/\r?\n\s*\r?\n/).map(block => {
      const lines = block.trim().split(/\r?\n/);
      const index = lines.findIndex(line => line.includes('-->'));
      if (index < 0) return '';
      const time = lines[index].split('-->')[0].trim().replace(',', '.').split(':').map(Number);
      if (time.some(n => !Number.isFinite(n))) return '';
      const seconds = time.reduce((total, n) => total * 60 + n, 0);
      const text = lines.slice(index + 1).join(' ').replace(/<[^>]*>/g, '').trim();
      return text ? `[${formatTime(seconds)}] ${text}` : '';
    }).filter(Boolean).join('\n');
  }
}
function chineseCaptionLanguage(track) {
  const language = String(track.lan || '').trim().replace(/^ai[-_]/i, '');
  if (language) return /^(?:zh|cmn|yue)(?:[-_]|$)/i.test(language);
  return /中文|汉语|漢語|chinese/i.test(track.lan_doc || '');
}
async function chineseSubtitles(tracks, { preferChineseAI = false } = {}) {
  // Prefer manual captions in any language, then Chinese AI, then other AI.
  // Stable sorting retains platform order among tracks with equal priority.
  const rank = track => !chineseIsAI(track) ? 0 : preferChineseAI && !chineseCaptionLanguage(track) ? 2 : 1;
  for (const track of [...tracks].sort((a, b) => rank(a) - rank(b))) {
    const url = track.subtitle_url || track.Url || track.url?.url_list?.[0] || track.url;
    if (typeof url !== 'string') continue;
    try {
      const text = chineseSubtitleText(await chineseFetch(url.startsWith('//') ? `https:${url}` : url, false));
      if (text) return { text, source: chineseIsAI(track) ? 'ai' : 'manual' };
    } catch { /* Try the next track in language/source preference order. */ }
  }
  return { text: '', source: '' };
}
function chineseVideoResult(platform, title, description, author, duration, transcript, extra = {}) {
  const content = [`# ${title}`, description && `## Description\n\n${description}`,
    transcript.text && `## Transcript\n\n${truncate(transcript.text, 100000)}`].filter(Boolean).join('\n\n');
  return { url: window.location.href, title, content, sourceType: platform,
    mediaType: 'video', transcriptAvailable: !!transcript.text,
    metadata: { platform, author, transcript_source: transcript.source,
      time_estimate_minutes: Math.max(1, Math.ceil((Number(duration) || 0) / 60)), ...extra } };
}

async function extractBilibili() {
  const id = bilibiliVideoId();
  const url = new URL(window.location.href);
  const params = id.toLowerCase().startsWith('av') ? `aid=${id.slice(2)}` : `bvid=${id}`;
  let info = null;
  try { info = (await chineseFetch(`https://api.bilibili.com/x/web-interface/view?${params}`)).data; } catch {}
  if (!info) {
    for (const state of chinesePageStates()) {
      info = chineseFind(state, item => (item.bvid === id || `av${item.aid}` === id) && item.title && item.pages);
      if (info) break;
    }
  }
  // Explicit cid wins; otherwise p selects the current multipart video.
  const part = Math.max(1, Number(url.searchParams.get('p')) || 1);
  const page = info?.pages?.find(p => p.page === part);
  const requests = performance.getEntriesByType('resource').map(entry => entry.name).reverse();
  const currentPlayer = requests.map(name => { try { return new URL(name); } catch { return null; } }).find(u =>
    u?.hostname === 'api.bilibili.com' && /^\/x\/player\/(?:wbi\/)?v2$/.test(u.pathname) &&
    (u.searchParams.get('bvid') === (info?.bvid || id) || (info?.aid && u.searchParams.get('aid') === String(info.aid))) &&
    info?.pages?.some(p => String(p.cid) === u.searchParams.get('cid')));
  const cid = url.searchParams.get('cid') ||
    (!url.searchParams.has('p') && currentPlayer ? currentPlayer.searchParams.get('cid') : null) ||
    page?.cid || (part === 1 ? info?.cid : null);
  const selectedPage = info?.pages?.find(p => String(p.cid) === String(cid)) || page;
  let player = null;
  if (cid) {
    // Replay the site's signed request when available, only for this video/part.
    const signed = requests.find(name => {
      try {
        const u = new URL(name);
        return u.hostname === 'api.bilibili.com' && /^\/x\/player\/(?:wbi\/)?v2$/.test(u.pathname) &&
          u.searchParams.get('cid') === String(cid) &&
          (u.searchParams.get('bvid') === (info?.bvid || id) || u.searchParams.get('aid') === String(info?.aid));
      } catch { return false; }
    });
    for (const endpoint of [...new Set([signed, `https://api.bilibili.com/x/player/wbi/v2?${params}&cid=${cid}`].filter(Boolean))]) {
      try {
        const result = await chineseFetch(endpoint);
        if (result.code === 0) { player = result.data; break; }
      } catch {}
    }
  }
  const transcript = await chineseSubtitles(player?.subtitle?.subtitles || [], { preferChineseAI: true });
  const title = info?.title || chineseText('h1.video-title, .video-title') || getMeta('og:title') || document.title;
  const capture = chineseVideoResult('bilibili', title, info?.desc || chineseText('#v_desc, .basic-desc-info'),
    info?.owner?.name || chineseText('.up-name'), selectedPage?.duration || info?.duration, transcript,
    { video_id: info?.bvid || id, cid, part: selectedPage?.page || part, published: info?.pubdate ? new Date(info.pubdate * 1000).toISOString() : '' });
  capture.chapters = (player?.view_points || []).map(point => ({ time: formatTime(point.from), title: point.content }));
  return capture;
}

async function extractDouyin() {
  const url = new URL(window.location.href);
  const id = url.pathname.match(/\/(?:video|note)\/(\d+)/)?.[1] || url.searchParams.get('modal_id');
  let detail = null;
  for (const state of chinesePageStates()) {
    detail = chineseFind(state, item => String(item.aweme_id || item.awemeId) === id && (item.desc || item.video));
    if (detail) break;
  }
  if (!detail) {
    const request = performance.getEntriesByType('resource').map(entry => entry.name).reverse().find(name => {
      try {
        const u = new URL(name);
        return u.origin === url.origin && u.pathname === '/aweme/v1/web/aweme/detail/' && u.searchParams.get('aweme_id') === id;
      } catch { return false; }
    });
    try {
      detail = (await chineseFetch(request || `${url.origin}/aweme/v1/web/aweme/detail/?aweme_id=${id}&aid=6383`)).aweme_detail;
      if (String(detail?.aweme_id || detail?.awemeId) !== id) detail = null;
    } catch {}
  }
  const tracks = [...(detail?.video?.subtitleInfos || []), ...(detail?.video?.cla_info?.caption_infos || [])];
  for (const sticker of detail?.interaction_stickers || []) {
    tracks.push(...(sticker.auto_video_caption_info?.auto_captions || []).map(track => ({ ...track, source: 'ai' })));
  }
  const transcript = await chineseSubtitles(tracks);
  const description = detail?.desc || getMeta('og:description') || '';
  const title = description || getMeta('og:title') || document.title;
  if (detail?.images?.length || url.pathname.startsWith('/note/')) {
    return { url: url.href, title, content: `# ${title}\n\n${description}`, sourceType: 'douyin', mediaType: 'article',
      metadata: { platform: 'douyin', author: detail?.author?.nickname || '', image_count: detail?.images?.length || 0 } };
  }
  return chineseVideoResult('douyin', title, description, detail?.author?.nickname || '',
    (detail?.video?.duration || 0) / 1000, transcript, { video_id: id });
}

async function extractWeibo() {
  const url = new URL(window.location.href);
  const id = url.pathname.match(/^\/(?:\d+|detail|status)\/([\w]+)\/?$/)?.[1];
  let post = null;
  if (id) {
    try {
      if (chineseHost('weibo.com')) post = await chineseFetch(`${url.origin}/ajax/statuses/show?id=${encodeURIComponent(id)}`);
      else post = (await chineseFetch(`${url.origin}/statuses/show?id=${encodeURIComponent(id)}`)).data;
    } catch {}
  }
  let text = post?.text_raw || (post?.text ? chineseHtmlText(post.text) : '');
  if (post?.isLongText && post?.idstr) {
    try {
      const full = await chineseFetch(`${url.origin}/ajax/statuses/longtext?id=${post.idstr}`);
      if (full.data?.longTextContent) text = chineseHtmlText(full.data.longTextContent);
    } catch {}
  }
  const candidates = Array.from(document.querySelectorAll('.WB_feed_detail, article, .card'));
  const root = candidates.find(item => {
    const link = item.querySelector(`a[href*="/${id}"]`);
    return id && (item.getAttribute('mid') === id || item.getAttribute('data-mid') === id || link);
  }) || (id ? document.querySelector('.main-full, .WB_detail') : null);
  if (!text && root) text = chineseText('[class*="detail_wbtext"], .WB_text, .weibo-text, .txt', root);
  // Never fall back to the whole feed, recommendations, or comment thread.
  if (!text) throw new Error('Weibo post content is unavailable');
  const author = post?.user?.screen_name || (root && chineseText('[class*="head_name"], .WB_info, .m-text-cut', root)) || '';
  const title = `${author ? `${author}: ` : ''}${text.slice(0, 100)}`;
  const repost = post?.retweeted_status;
  return { url: url.href, title, sourceType: 'weibo',
    content: `# ${title}\n\n${text}${repost ? `\n\n## Reposted\n\n${repost.user?.screen_name || ''}\n\n${repost.text_raw || chineseHtmlText(repost.text)}` : ''}`,
    metadata: { platform: 'weibo', author, published: post?.created_at || '', post_id: post?.idstr || id } };
}

async function extractZhihu() {
  const url = new URL(window.location.href);
  const answerId = url.pathname.match(/\/answer\/(\d+)/)?.[1];
  const title = chineseText('h1.QuestionHeader-title, h1.Post-Title') || getMeta('og:title') || document.title;
  const parts = [`# ${title}`];
  const question = document.querySelector('.QuestionRichText');
  if (question) parts.push(extractText(question));
  const states = chinesePageStates();
  let answers = Array.from(document.querySelectorAll('.AnswerItem'));
  if (answerId) answers = answers.filter(item => {
    try {
      return String(JSON.parse(item.getAttribute('data-zop') || '{}').itemId) === answerId ||
        !!item.querySelector(`a[href$="/answer/${answerId}"], meta[itemprop="url"][content$="/answer/${answerId}"]`);
    } catch { return false; }
  });
  let capturedAnswers = 0;
  const discussionAnswers = [];
  for (const answer of answers) {
    const body = answer.querySelector('.RichContent-inner .RichText, .RichText');
    if (!body) continue;
    const author = chineseText('.AuthorInfo-name', answer);
    let full = null;
    const itemId = (() => { try { return JSON.parse(answer.getAttribute('data-zop') || '{}').itemId; } catch { return null; } })();
    for (const state of states) {
      full = chineseFind(state, item => String(item.id) === String(itemId) && typeof item.content === 'string' && item.author);
      if (full) break;
    }
    const answerText = full ? chineseHtmlText(full.content) : extractText(body);
    if (answerId) parts.push(`## ${author || full?.author?.name || 'Answer'}\n\n${answerText}`);
    else discussionAnswers.push({ id: `zhihu:answer-${itemId || capturedAnswers}`, text: answerText,
      author: author || full?.author?.name || undefined,
      authorId: full?.author?.url_token ? `https://www.zhihu.com/people/${full.author.url_token}` : answer.querySelector('.AuthorInfo-name a, a.UserLink-link')?.href,
      url: itemId ? `https://www.zhihu.com/question/${url.pathname.match(/question\/(\d+)/)?.[1]}/answer/${itemId}` : undefined,
      reaction: { kind: 'likes', count: Number.isFinite(full?.voteup_count) ? full.voteup_count : null } });
    capturedAnswers++;
  }
  // A permalink can hydrate before its AnswerItem renders.
  if (answerId && !capturedAnswers) {
    for (const state of states) {
      const full = chineseFind(state, item => String(item.id) === answerId && typeof item.content === 'string' && item.author);
      if (full) {
        parts.push(`## ${full.author.name || 'Answer'}\n\n${chineseHtmlText(full.content)}`);
        capturedAnswers++;
        break;
      }
    }
  }
  const article = document.querySelector('.Post-RichTextContainer, .Post-RichText');
  if (article) parts.push(extractText(article));
  if ((answerId && !capturedAnswers) || (parts.length === 1 && !document.querySelector('h1.QuestionHeader-title'))) throw new Error('Zhihu content is unavailable');
  return { url: url.href, title, content: truncate(parts.join('\n\n'), 100000), sourceType: 'zhihu',
    ...(!answerId && !article ? { discussion: { kind: 'forum', status: discussionAnswers.length ? 'partial' : 'not_loaded', items: discussionAnswers } } : {}),
    metadata: { platform: 'zhihu', author: chineseText('.Post-Author .AuthorInfo-name'), answer_count: capturedAnswers,
      capture_scope: answerId ? 'answer' : article ? 'article' : 'question_and_loaded_answers' } };
}
