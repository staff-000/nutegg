// NutEgg chinese-common extractor helpers.
// Classic isolated-world script; see docs/content-extractor-contributing.md.
// Chinese platforms. Runs in Chrome's isolated world: read serialized page
// state, never rely on page JavaScript globals or evaluate inline scripts.
function chineseHost(domain) {
  const host = new URL(window.location.href).hostname;
  return host === domain || host.endsWith(`.${domain}`);
}

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
    } catch {
      /* A stale/partial hydration script must not break extraction. */
    }
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

async function chineseFetch(url, json = true, context) {
  context?.check();
  // Try the tab's normal credentialed API request before extension-origin
  // fetching. Keep the worker bridge as the CORS/CDN fallback.
  const target = new URL(url, window.location.href);
  const pageOrigin = new URL(window.location.href).origin;
  const biliApi =
    chineseHost('bilibili.com') &&
    target.origin === 'https://api.bilibili.com' &&
    ['/x/web-interface/view', '/x/player/wbi/v2', '/x/player/v2'].includes(target.pathname);
  const biliCaption =
    chineseHost('bilibili.com') &&
    target.protocol === 'https:' &&
    (target.hostname === 'hdslb.com' || target.hostname.endsWith('.hdslb.com')) &&
    /\/bfs\/(?:ai_subtitle|subtitle)\//.test(target.pathname);
  if ((biliApi || biliCaption) && typeof fetch === 'function') {
    try {
      const response = await captureFetchText(
        target.href,
        { credentials: biliApi ? 'include' : 'omit' },
        2500,
        context
      );
      if (response.ok) {
        const value = json ? JSON.parse(response.text) : response.text;
        if (!json || value.code === 0) return value;
      }
    } catch {
      /* CORS/network failures can still use the allowlisted bridge. */
    }
    context?.check();
  }
  if (target.origin === pageOrigin) {
    const response = await captureFetchText(target.href, { credentials: 'include' }, 4000, context);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return json ? JSON.parse(response.text) : response.text;
  }
  const pending = chrome.runtime.sendMessage({
    action: 'chinese-content-fetch',
    url: target.href,
    requestId: context?.requestId,
    deadline: context?.deadline,
  });
  const result = await (context ? context.wait(pending) : pending);
  context?.check();
  if (!result?.success) throw new Error(result?.error || 'Content fetch failed');
  return json ? JSON.parse(result.text) : result.text;
}

function chineseIsAI(track) {
  return (
    Number(track.ai_type || track.aiType) > 0 ||
    track.is_auto === true ||
    track.is_auto === 1 ||
    track.source === 'ai' ||
    /^ai[-_]/i.test(track.lan || '')
  );
}

function chineseSubtitleText(raw) {
  try {
    const data = JSON.parse(raw);
    const lines = data.body || data.utterances || data;
    if (!Array.isArray(lines)) return '';
    return lines
      .filter(line => line.content || line.text)
      .map(line => {
        const seconds = line.from ?? Number(line.start_time || 0) / 1000;
        return `[${formatTime(seconds)}] ${line.content || line.text}`;
      })
      .join('\n');
  } catch {
    // SRT / WebVTT: retain only timestamped cues, never HTML/error pages.
    return raw
      .split(/\r?\n\s*\r?\n/)
      .map(block => {
        const lines = block.trim().split(/\r?\n/);
        const index = lines.findIndex(line => line.includes('-->'));
        if (index < 0) return '';
        const time = lines[index].split('-->')[0].trim().replace(',', '.').split(':').map(Number);
        if (time.some(n => !Number.isFinite(n))) return '';
        const seconds = time.reduce((total, n) => total * 60 + n, 0);
        const text = lines
          .slice(index + 1)
          .join(' ')
          .replace(/<[^>]*>/g, '')
          .trim();
        return text ? `[${formatTime(seconds)}] ${text}` : '';
      })
      .filter(Boolean)
      .join('\n');
  }
}

function chineseCaptionLanguage(track) {
  const language = String(track.lan || '')
    .trim()
    .replace(/^ai[-_]/i, '');
  if (language) return /^(?:zh|cmn|yue)(?:[-_]|$)/i.test(language);
  return /中文|汉语|漢語|chinese/i.test(track.lan_doc || '');
}

async function chineseSubtitles(tracks, { preferChineseAI = false, context } = {}) {
  // Prefer manual captions in any language, then Chinese AI, then other AI.
  // Stable sorting retains platform order among tracks with equal priority.
  const rank = track => (!chineseIsAI(track) ? 0 : preferChineseAI && !chineseCaptionLanguage(track) ? 2 : 1);
  for (const track of tracks.filter(track => track && typeof track === 'object').sort((a, b) => rank(a) - rank(b))) {
    context?.check();
    const url = track.subtitle_url || track.Url || track.url?.url_list?.[0] || track.url;
    if (typeof url !== 'string') continue;
    try {
      const text = chineseSubtitleText(await chineseFetch(url.startsWith('//') ? `https:${url}` : url, false, context));
      context?.check();
      if (text) return { text, source: chineseIsAI(track) ? 'ai' : 'manual', track };
    } catch (error) {
      context?.check();
      console.warn('[NutEgg] Subtitle download failed');
    }
  }
  return { text: '', source: '' };
}

function chineseVideoResult(platform, title, description, author, duration, transcript, extra = {}) {
  const content = [
    `# ${title}`,
    description && `## Description\n\n${description}`,
    transcript.text && `## Transcript\n\n${truncate(transcript.text, 100000)}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  const result = {
    url: window.location.href,
    title,
    content,
    sourceType: platform,
    mediaType: 'video',
    transcriptAvailable: !!transcript.text,
    metadata: {
      platform,
      author,
      transcript_source: transcript.source,
      time_estimate_minutes: Math.max(1, Math.ceil((Number(duration) || 0) / 60)),
      ...extra,
    },
  };
  if (transcript.text.length > 100000)
    addCaptureCoverage(result, 'truncated', { originalCharacters: transcript.text.length, capturedCharacters: 100000 });
  return result;
}
