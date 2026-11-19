// Read-only ownership and media adapter shared by capture and passive classification.
// Never evaluate page scripts, start players, or inspect unrelated feed videos.
var NutEggSocial = (() => {
  function route(value = location.href) {
    const u = new URL(value), host = u.hostname.replace(/^www\./, '');
    let platform, id, kind;
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
      const m = u.pathname.match(/^\/@[^/]+\/(video|photo)\/(\d+)(?:\/|$)/);
      platform = 'tiktok'; id = m?.[2]; kind = m?.[1] === 'photo' ? 'photo' : 'video';
    } else if (host === 'douyin.com' || host.endsWith('.douyin.com')) {
      const m = u.pathname.match(/^\/(video|note)\/(\d+)(?:\/|$)/);
      platform = 'douyin'; id = m?.[2] || (/^\d+$/.test(u.searchParams.get('modal_id') || '') ? u.searchParams.get('modal_id') : null);
      kind = m?.[1] === 'note' ? 'photo' : m ? 'video' : null;
    } else if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
      const m = u.pathname.match(/^\/(p|reel|reels|tv)\/([\w-]+)(?:\/|$)/);
      platform = 'instagram'; id = m?.[2]; kind = m && m[1] !== 'p' ? 'video' : null;
    } else if (['threads.com', 'threads.net'].some(h => host === h || host.endsWith('.' + h))) {
      platform = 'threads'; id = u.pathname.match(/^\/@[^/]+\/post\/([\w-]+)(?:\/|$)/)?.[1];
    } else if (['x.com', 'twitter.com'].some(h => host === h || host.endsWith('.' + h))) {
      platform = 'twitter'; id = u.pathname.match(/^\/(?:[\w]+|i\/web)\/status\/(\d+)(?:\/|$)/)?.[1];
      if (!id) { id = u.pathname.match(/\/article\/(\d+)(?:\/|$)/)?.[1]; if (id) kind = 'text'; }
    }
    return platform ? { platform, id: id || null, kind: kind || null, url: u.href } : null;
  }
  const selectors = {
    twitter: 'article[data-testid="tweet"]',
    tiktok: '[data-e2e="browse-video"], [data-e2e="video-detail"], [data-e2e="video-item"], article',
    douyin: '[data-e2e="aweme-detail"], [data-e2e="feed-active-video"], [data-aweme-id], article',
    instagram: 'article, [role="dialog"]',
    threads: 'article, [role="article"], [data-post-id]',
  };
  function samePost(value, requested) {
    if (!value) return false;
    try { const r = route(new URL(value, location.href).href); return r?.platform === requested.platform && r.id === requested.id; }
    catch { return false; }
  }
  function ownedRoot(r) {
    if (!r?.id) return null;
    for (const node of document.querySelectorAll(selectors[r.platform])) {
      if (node.closest('[data-nutegg-ui]')) continue;
      if ([node.getAttribute('data-post-id'), node.getAttribute('data-aweme-id')].includes(r.id)) return node;
      if ([...node.querySelectorAll('a[href]')].some(a => samePost(a.href, r) &&
          a.closest(selectors[r.platform]) === node && (r.platform !== 'twitter' || a.querySelector('time')))) return node;
    }
    // Threads sometimes has div-only post markup. Anchor to its own timestamp permalink.
    if (r.platform === 'twitter' && r.kind === 'text') return document.querySelector('[data-testid="twitterArticleReadView"], [data-testid="twitterArticleRichTextView"]');
    if (r.platform === 'threads') for (const a of document.querySelectorAll('a[href]')) {
      if (!samePost(a.href, r) || !a.querySelector('time') || a.closest('[data-nutegg-ui]')) continue;
      let node = a.parentElement;
      for (let depth = 0; node && depth < 5; depth++, node = node.parentElement) {
        if (node.querySelector('[data-pressable-container], [data-post-text], [dir="auto"]')) return node;
      }
    }
    return null;
  }
  function pageObjects() {
    const values = [];
    let total = 0;
    for (const script of document.querySelectorAll('script')) {
      if (script.closest('[data-nutegg-ui]')) continue;
      const text = script.textContent || '';
      total += text.length;
      if (total > 5000000) break;
      if (script.type === 'application/json' || script.type === 'application/ld+json' ||
          ['SIGI_STATE', '__UNIVERSAL_DATA_FOR_REHYDRATION__', '__NEXT_DATA__', 'RENDER_DATA'].includes(script.id)) {
        try { values.push(JSON.parse(text)); } catch {
          if (script.id === 'RENDER_DATA') { try { values.push(JSON.parse(decodeURIComponent(text))); } catch {} }
        }
      } else {
        for (const marker of ['_ROUTER_DATA', '__INITIAL_STATE__']) {
          const pos = text.indexOf(marker);
          if (pos >= 0) { try { values.push(JSON.parse(extractBalanced(text, pos + marker.length))); } catch {} }
        }
      }
    }
    return values;
  }
  function findData(r) {
    let count = 0;
    const visit = (value, depth) => {
      if (depth > 24 || ++count > 20000 || !value) return null;
      if (typeof value === 'string' && /^\s*(?:[\[{]|%7B|%5B)/i.test(value)) {
        try { return visit(JSON.parse(value), depth + 1); } catch {
          try { return visit(JSON.parse(decodeURIComponent(value)), depth + 1); } catch { return null; }
        }
      }
      if (typeof value !== 'object') return null;
      const id = r.platform === 'douyin' ? value.aweme_id || value.awemeId :
        ['instagram', 'threads'].includes(r.platform) ? value.shortcode || value.code : value.id_str || value.id || value.rest_id;
      if (String(id || '') === r.id &&
          ['desc','text','text_raw','full_text','caption','video','imagePost','media_type','is_video','carousel_media','text_post_app_info','legacy'].some(k => value[k] != null))
        return value;
      if (value['@type'] && samePost(value.url || value.mainEntityOfPage?.['@id'] || '', r)) return value;
      for (const [key, child] of Object.entries(value)) {
        if (/quoted|retweeted|recommend|related/i.test(key)) continue;
        const found = visit(child, depth + 1); if (found) return found;
      }
      return null;
    };
    for (const value of pageObjects()) { const found = visit(value, 0); if (found) return found; }
    return null;
  }
  function ownNodes(root, selector, platform) {
    if (!root) return [];
    return [...root.querySelectorAll(selector)].filter(node => {
      if (node.closest('[data-nutegg-ui], [data-quoted-post], [data-testid="quoteTweet"]') ||
          (platform === 'twitter' && node.closest('div[role="link"]'))) return false;
      const enclosing = node.closest(selectors[platform]);
      return !enclosing || enclosing === root || !root.contains(enclosing);
    });
  }
  function seconds(value) {
    if (typeof value === 'string' && /^PT/i.test(value)) {
      const m = value.match(/^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/i);
      return m ? seconds(Number(m[1] || 0)*3600 + Number(m[2] || 0)*60 + Number(m[3] || 0)) : null;
    }
    const n = Number(value); return Number.isFinite(n) && n > 0 ? n : null;
  }
  function inspect() {
    const r = route(); if (!r) return null;
    if (!r.id) return { ...r, mediaKind: 'unknown', videoDurationSeconds: null, root: null, data: null };
    const root = ownedRoot(r), data = findData(r);
    const videos = ownNodes(root, 'video', r.platform);
    const items = data ? [data, ...(data.images || []), ...(data.carousel_media || []), ...(data.edge_sidecar_to_children?.edges || []).map(e => e.node), ...(data.extended_entities?.media || data.legacy?.extended_entities?.media || [])] : [];
    const durations = [], tracks = [];
    let hasVideo = r.kind === 'video' || videos.length > 0;
    for (const item of items) {
      const video = item.video;
      const isVideo = !!video || item.is_video === true || item.media_type === 2 || item.type === 'video' || item.type === 'animated_gif' || item['@type'] === 'VideoObject' || !!item.video_info;
      if (!isVideo) continue;
      hasVideo = true;
      let duration = r.platform === 'douyin' ? seconds(video?.duration / 1000) :
        seconds(item.video_duration || video?.duration || item.duration || item.video_info?.duration_millis / 1000);
      if (duration) durations.push(duration);
      tracks.push(...(video?.subtitleInfos || []), ...(video?.cla_info?.caption_infos || []), ...(video?.subtitle_infos || []));
      if (item.video_subtitles_uri) tracks.push({ url: item.video_subtitles_uri });
      for (const sticker of item.interaction_stickers || []) tracks.push(...(sticker.auto_video_caption_info?.auto_captions || []));
    }
    for (const video of videos) {
      const duration = seconds(video.duration);
      if (duration) durations.push(duration);
      for (const track of video.querySelectorAll('track[kind="captions"], track[kind="subtitles"]')) tracks.push({ url: track.src });
    }
    // An ID-bound payload explicitly describing photos/text is authoritative; a
    // stable owned text body with no media placeholder can establish a text post.
    const textSelector = {
      twitter: '[data-testid="tweetText"]', tiktok: '[data-e2e="browse-video-desc"], [data-e2e="video-desc"]',
      douyin: '[data-e2e="video-desc"]', instagram: 'h1, [data-caption]',
      threads: '[data-post-text], [data-pressable-container] [dir="auto"], [dir="auto"]',
    }[r.platform];
    const body = r.kind === 'text' ? root : ownNodes(root, textSelector, r.platform)[0];
    const caption = data?.caption?.text || data?.edge_media_to_caption?.edges?.[0]?.node?.text;
    const description = String(data?.desc || data?.text || data?.full_text || data?.legacy?.full_text || caption || data?.description || body?.textContent?.trim() || '');
    const authorData = data?.author || data?.owner || data?.user || data?.core?.user_results?.result?.legacy;
    const authorNode = ownNodes(root, '[rel="author"], [data-e2e="browse-username"], [data-e2e="video-author-uniqueid"], [data-author], header a', r.platform)[0];
    const author = (typeof authorData === 'string' ? authorData : authorData?.nickname || authorData?.full_name || authorData?.name || authorData?.screen_name || authorData?.username || authorData?.uniqueId) || root?.getAttribute('data-author') || authorNode?.textContent?.trim() || '';
    const pending = ownNodes(root, '[aria-busy="true"], [role="progressbar"], [data-testid="videoPlayer"], [data-testid="videoComponent"], [data-video-placeholder]', r.platform).length > 0;
    const established = (!!data && (r.kind === 'photo' || data.media_type === 1 || data.is_video === false || !!data.imagePost || !!data.images?.length || !!description)) || (description.trim() && root && !pending);
    const mediaKind = hasVideo ? 'video' : established ? (r.kind === 'photo' || data?.images?.length || data?.imagePost || ownNodes(root, 'img', r.platform).length ? 'photo' : 'text') : 'unknown';
    return { ...r, root, data, videos, tracks, description, author, mediaKind,
      videoDurationSeconds: hasVideo && durations.length && !data?.is_live && !data?.isLive &&
        !videos.some(video => video.duration === Infinity) ? Math.max(...durations) : null,
      published: data?.createTime || data?.create_time || data?.taken_at || data?.created_at || ownNodes(root, 'time', r.platform)[0]?.getAttribute('datetime') || '',
      imageCount: data?.images?.length || data?.imagePost?.images?.length || data?.carousel_media?.length || 0,
    };
  }
  function continuations(info) {
    const authorId = post => String(post?.user?.pk || post?.user?.id || post?.user?.username || post?.owner?.id || post?.owner?.username || '');
    const requestedAuthor = authorId(info.data);
    if (!requestedAuthor) return [];
    let visited = 0;
    const result = new Map();
    const walk = (value, depth) => {
      if (!value || typeof value !== 'object' || depth > 24 || ++visited > 20000) return;
      if (Array.isArray(value.thread_items)) {
        const posts = value.thread_items.map(item => item.post || item);
        const start = posts.findIndex(post => String(post.code || post.shortcode || '') === info.id);
        if (start >= 0) for (const post of posts.slice(start + 1)) {
          if (authorId(post) !== requestedAuthor) break;
          const text = post.caption?.text || '';
          const id = String(post.code || post.shortcode || '');
          if (id && text) result.set(id, text);
        }
      }
      for (const [key, child] of Object.entries(value)) {
        if (!/quoted|recommend|related/i.test(key)) walk(child, depth + 1);
      }
    };
    for (const value of pageObjects()) walk(value, 0);
    return [...result].map(([id, text]) => ({ id, text }));
  }
  async function transcript(info, context) {
    context?.check();
    for (const video of info.videos || []) for (const track of video.textTracks || []) {
      if (track.cues?.length) {
        const text = [...track.cues].map(cue => `[${formatTime(cue.startTime)}] ${cue.text}`).join('\n');
        if (text) { info.transcriptOriginalCharacters = text.length; return text.slice(0, 100000); }
      }
    }
    for (const track of info.tracks.slice(0, 8)) {
      context?.check();
      const raw = track.Url || track.url || track.subtitle_url;
      if (typeof raw !== 'string') continue;
      try {
        const url = new URL(raw, location.href);
        if (!['http:', 'https:'].includes(url.protocol)) continue;
        const response = await captureFetchText(url.href, { credentials: url.origin === location.origin ? 'include' : 'omit' }, 2500, context);
        context?.check();
        if (!response.ok) continue;
        let text = chineseSubtitleText(response.text);
        if (!text && /^\s*</.test(response.text)) {
          const xml = new DOMParser().parseFromString(response.text, 'application/xml');
          text = [...xml.querySelectorAll('text[start], p[begin]')].map(node => {
            const value = node.getAttribute('start') || node.getAttribute('begin');
            const time = value.includes(':') ? value.split(':').reduce((sum, n) => sum * 60 + Number(n), 0) : Number(value.replace(/s$/, ''));
            return Number.isFinite(time) ? `[${formatTime(time)}] ${node.textContent.trim()}` : '';
          }).filter(Boolean).join('\n');
        }
        if (text) { info.transcriptOriginalCharacters = text.length; return text.slice(0, 100000); }
      } catch { context?.check(); }
    }
    return '';
  }
  async function capture(context) {
    context?.check();
    let info = inspect();
    if (!info?.id) throw new Error('Unsupported social post');
    if ((!info.root && !info.data) || info.mediaKind === 'unknown') {
      await waitFor(() => { info = inspect(); return info?.mediaKind !== 'unknown' && (info.root || info.data); }, 1800, context);
      context?.check(); info = inspect();
    }
    const restricted = !info.root && !info.data && !!document.querySelector('input[type="password"], form[action*="login"], [data-login-required]');
    const text = info.mediaKind === 'video' ? await transcript(info, context) : '';
    context?.check();
    const title = info.description.slice(0, 160) || (info.author ? `${info.author} · ${info.platform}` : info.platform);
    const content = [`# ${title}`, info.description, text && `## Transcript\n\n${text}`].filter(Boolean).join('\n\n');
    const limit = info.mediaKind === 'video' ? 160000 : 60000;
    return { url: location.href, title, sourceType: info.platform,
      mediaType: info.mediaKind === 'video' ? 'video' : 'article',
      ...(info.mediaKind === 'video' ? { transcriptAvailable: !!text } : {}),
      extractionStatus: restricted ? 'unavailable' : info.mediaKind === 'unknown' || (!info.description && !text) ? 'not_ready' : 'ready',
      content: content.slice(0, limit),
      ...((content.length > limit || info.transcriptOriginalCharacters > 100000) ? { captureCoverage: { reasons: ['truncated'],
        originalCharacters: content.length + Math.max(0, (info.transcriptOriginalCharacters || 0) - text.length),
        capturedCharacters: Math.min(content.length, limit) } } : {}),
      ...(restricted ? { captureCoverage: { reasons: ['access_restricted'] } } : {}),
      metadata: { platform: info.platform, author: info.author, published: info.published,
        post_id: info.id, image_count: info.imageCount, video_duration_seconds: info.videoDurationSeconds,
        media_kind: info.mediaKind, transcript_source: text ? 'captions' : '' },
    };
  }
  return { route, inspect, capture, transcript, continuations, ownNodes, samePost };
})();
