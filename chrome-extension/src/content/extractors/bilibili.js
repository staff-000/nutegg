// NutEgg bilibili extractor.
// Classic isolated-world script; see docs/content-extractor-contributing.md.
function bilibiliVideoId() {
  const url = new URL(window.location.href);
  const id = url.pathname.match(/\/video\/(BV[\w]+|av\d+)/i)?.[1] || url.searchParams.get('bvid') || '';
  return /^(BV\w+|av\d+)$/i.test(id) ? id : '';
}

function detectBilibili() {
  return chineseHost('bilibili.com') && !!bilibiliVideoId();
}

// All supplied identifiers must agree. An outgoing URL alone does not prove
// ownership of the returned player data (including legacy API responses).
function bilibiliInfoMatches(info, id) {
  if (!info || typeof info !== 'object') return false;
  return id.toLowerCase().startsWith('av') ? String(info.aid) === id.slice(2) : info.bvid === id;
}

function bilibiliPlayerOwnership(player, id, info, cid) {
  if (!player || typeof player !== 'object') return 'missing_identity';
  const bvid = info?.bvid || (!id.toLowerCase().startsWith('av') ? id : null);
  const aid = info?.aid || (id.toLowerCase().startsWith('av') ? id.slice(2) : null);
  if (player.bvid != null && bvid && player.bvid !== bvid) return 'video_mismatch';
  if (player.aid != null && aid && String(player.aid) !== String(aid)) return 'video_mismatch';
  if (player.cid == null || !((bvid && player.bvid === bvid) || (aid && String(player.aid) === String(aid))))
    return 'missing_identity';
  return String(player.cid) === String(cid) ? 'verified' : 'cid_mismatch';
}

async function extractBilibili(context) {
  context?.check();
  const id = bilibiliVideoId();
  const url = new URL(window.location.href);
  const part = Math.max(1, Number(url.searchParams.get('p')) || 1);
  const params = id.toLowerCase().startsWith('av') ? `aid=${id.slice(2)}` : `bvid=${id}`;
  const provenance = {
    version: 1,
    policy: 'wbi_only',
    requestedVideoId: id,
    part,
    outcome: 'unavailable',
    rejected: [],
    routes: [],
  };
  let info = null;
  try {
    const response = await chineseFetch(`https://api.bilibili.com/x/web-interface/view?${params}`, true, context);
    if (response.code === 0 && bilibiliInfoMatches(response.data, id)) info = response.data;
    else provenance.rejected.push({ route: 'view', reason: 'video_mismatch' });
  } catch {}
  context?.check();
  if (!info) {
    for (const state of chinesePageStates()) {
      info = chineseFind(state, item => bilibiliInfoMatches(item, id) && item.title && Array.isArray(item.pages));
      if (info) break;
    }
  }
  const pages = Array.isArray(info?.pages) ? info.pages : [];
  const page = pages.find(p => p.page === part);
  const requestMatches = u => {
    if (u?.hostname !== 'api.bilibili.com' || !/^\/x\/player\/(?:wbi\/)?v2$/.test(u.pathname)) return false;
    const bvid = u.searchParams.get('bvid'),
      aid = u.searchParams.get('aid');
    if (bvid && bvid !== (info?.bvid || id)) return false;
    if (aid && aid !== String(info?.aid || (id.toLowerCase().startsWith('av') ? id.slice(2) : ''))) return false;
    return (
      !!(bvid || aid) &&
      /^\d+$/.test(u.searchParams.get('cid') || '') &&
      (!pages.length || pages.some(p => String(p.cid) === u.searchParams.get('cid')))
    );
  };
  const requests = performance
    .getEntriesByType('resource')
    .map(entry => {
      try {
        return new URL(entry.name);
      } catch {
        return null;
      }
    })
    .reverse()
    .filter(requestMatches);
  const explicitCid = url.searchParams.get('cid');
  const invalidCid =
    explicitCid &&
    (!/^\d+$/.test(explicitCid) ||
      (pages.length && !pages.some(p => String(p.cid) === explicitCid)) ||
      (url.searchParams.has('p') && page && String(page.cid) !== explicitCid));
  const cid = invalidCid
    ? null
    : explicitCid ||
      (!url.searchParams.has('p') ? requests[0]?.searchParams.get('cid') : null) ||
      page?.cid ||
      (part === 1 ? info?.cid : null);
  if (invalidCid) provenance.rejected.push({ route: 'selection', reason: 'cid_mismatch' });
  provenance.requestedCid = cid == null ? null : String(cid);
  const selectedPage = pages.find(p => String(p.cid) === String(cid)) || page;
  const metadata = () => ({
    video_id: info?.bvid || id,
    requested_video_id: id,
    cid,
    part: selectedPage?.page || part,
    published: info?.pubdate ? new Date(info.pubdate * 1000).toISOString() : '',
    // JSON keeps metadata compatible with existing string-valued consumers.
    subtitle_provenance: JSON.stringify(provenance),
  });
  if (context)
    context.partial = chineseVideoResult(
      'bilibili',
      info?.title || document.title,
      info?.desc || '',
      info?.owner?.name || '',
      selectedPage?.duration,
      { text: '', source: '' },
      metadata()
    );
  let player = null,
    route = null;
  if (cid) {
    // The legacy /x/player/v2 endpoint can echo correct IDs while returning
    // unrelated tracks when WBI reports none. Never use it as a caption source,
    // even if a matching legacy URL appears in the resource history.
    const signed = requests.find(u => u.pathname === '/x/player/wbi/v2' && u.searchParams.get('cid') === String(cid));
    const endpoints = [
      ...(signed ? [{ url: signed.href, route: 'signed_player' }] : []),
      { url: `https://api.bilibili.com/x/player/wbi/v2?${params}&cid=${cid}`, route: 'wbi_player' },
    ];
    const attempted = new Set();
    for (const endpoint of endpoints) {
      if (attempted.has(endpoint.url)) continue;
      attempted.add(endpoint.url);
      context?.check();
      try {
        const result = await chineseFetch(endpoint.url, true, context);
        context?.check();
        if (result.code !== 0) {
          provenance.routes.push({ route: endpoint.route, outcome: 'provider_error' });
          continue;
        }
        const ownership = bilibiliPlayerOwnership(result.data, id, info, cid);
        provenance.routes.push({
          route: endpoint.route,
          outcome: ownership,
          tracks: Array.isArray(result.data?.subtitle?.subtitles) ? result.data.subtitle.subtitles.length : 0,
        });
        if (ownership !== 'verified') {
          provenance.rejected.push({
            route: endpoint.route,
            reason: ownership,
            returnedBvid: /^BV[A-Za-z0-9]{10}$/.test(result.data?.bvid || '') ? result.data.bvid : null,
            returnedAid: /^\d{1,20}$/.test(String(result.data?.aid)) ? String(result.data.aid) : null,
            returnedCid: /^\d{1,20}$/.test(String(result.data?.cid)) ? String(result.data.cid) : null,
          });
          continue;
        }
        // Never merge identities or subtitle lists from separate responses.
        player = result.data;
        route = endpoint.route;
        if (Array.isArray(player.subtitle?.subtitles) && player.subtitle.subtitles.some(track => track?.subtitle_url))
          break;
      } catch {
        context?.check();
        provenance.routes.push({ route: endpoint.route, outcome: 'request_failed' });
      }
    }
  }
  context?.check();
  const transcript = await chineseSubtitles(
    Array.isArray(player?.subtitle?.subtitles) ? player.subtitle.subtitles : [],
    { preferChineseAI: true, context }
  );
  context?.check();
  provenance.outcome = player ? 'verified' : provenance.rejected.length ? 'rejected' : 'unavailable';
  if (player)
    Object.assign(provenance, {
      route,
      validatedBvid: player.bvid || null,
      validatedAid: player.aid == null ? null : String(player.aid),
      validatedCid: String(player.cid),
    });
  if (transcript.track)
    Object.assign(provenance, {
      trackId: /^\d{1,30}$/.test(String(transcript.track.id_str || transcript.track.id))
        ? String(transcript.track.id_str || transcript.track.id)
        : '',
      language: /^[a-zA-Z_-]{1,30}$/.test(transcript.track.lan || '') ? transcript.track.lan : '',
      classification: transcript.source,
    });
  const capture = chineseVideoResult(
    'bilibili',
    info?.title || chineseText('h1.video-title, .video-title') || getMeta('og:title') || document.title,
    info?.desc || chineseText('#v_desc, .basic-desc-info'),
    info?.owner?.name || chineseText('.up-name'),
    selectedPage?.duration || info?.duration,
    transcript,
    metadata()
  );
  capture.chapters = (Array.isArray(player?.view_points) ? player.view_points : []).map(point => ({
    time: formatTime(point.from),
    title: point.content,
  }));
  capture.extractionStatus = transcript.text ? 'ready' : !info || !cid || !player ? 'not_ready' : 'transient';
  return capture;
}
