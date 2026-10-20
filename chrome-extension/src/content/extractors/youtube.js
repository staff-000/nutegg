// ============================================================
// NutEgg Extractor: YouTube (video pages)
// ============================================================
//
// Detects youtube.com/watch pages and extracts title, channel,
// description, chapters, and captions/transcript.
//
// Depends on: utils.js (extractText, getMeta, truncate, estimateTime,
//   waitFor, extractBalanced, formatTime, parseTimestamp, fetchWithTimeout)

function detectYouTube() {
  const url = new URL(window.location.href);
  return /(^|\.)youtube\.com$/.test(url.hostname) && url.pathname === '/watch';
}

async function extractYouTube(context) {
  context?.check();
  const url = window.location.href;
  let meta = extractYouTubeMetadata(url);
  if (context)
    context.partial = {
      url,
      title: meta.title,
      sourceType: 'youtube',
      transcriptAvailable: false,
      content: `# ${meta.title}\n\n${meta.description || ''}`,
      metadata: { video_id: meta.videoId },
    };

  // Start captions before optional chapter work. Snapshot completion never delays
  // the successful script-track path; it can improve metadata/chapters if ready.
  const captionMetadata = {};
  const pendingCaptions = fetchYouTubeCaptions(captionMetadata, context);
  pendingCaptions.catch(() => {}); // Also observe rejection if optional DOM work aborts extraction.
  let chapters = [];
  try {
    chapters = extractChapters(context);
  } catch {
    context?.check();
  }
  const transcript = await pendingCaptions;
  context?.check();
  if (context?.youtubeSnapshot?.playerResponse) {
    meta = extractYouTubeMetadata(url, context.youtubeSnapshot.playerResponse);
  }
  const liveChapters = chaptersFromMarkersMap(context?.youtubeSnapshot?.markersMap);
  if (liveChapters.length) chapters = liveChapters;

  const parts = [`# ${meta.title}`];
  if (meta.channelName) parts.push(`**Channel:** ${meta.channelName}`);
  if (meta.viewCount) parts.push(`**Views:** ${meta.viewCount}`);
  if (meta.date) parts.push(`**Published:** ${meta.date}`);
  if (meta.videoId) parts.push(`**Video ID:** ${meta.videoId}`);

  if (meta.description) {
    parts.push(`\n## Description\n\n${meta.description}`);
  }
  if (chapters.length > 0) {
    parts.push(`\n## Chapters\n\n${chapters.map(c => `- ${c.time} — ${c.title}`).join('\n')}`);
  }
  if (transcript) {
    // 100k chars ≈ 2 hours of speech — only a sanity cap, so long videos
    // keep their full transcript (the AI trims its own prompt window).
    parts.push(`\n## Transcript\n\n${truncate(transcript, 100000)}`);
  } else {
    parts.push(`\n## Transcript\n\n*No transcript available for this video.*`);
  }

  const timeMinutes =
    meta.durationSeconds > 0 ? Math.ceil(meta.durationSeconds / 60) : estimateTime(parts.join(' '), 'youtube');

  const result = {
    url,
    title: meta.title,
    content: parts.join('\n'),
    sourceType: 'youtube',
    chapters,
    // False when captions could not be fetched — the popup refuses to
    // analyze, because description-only analysis would be misleading.
    transcriptAvailable: !!transcript,
    extractionStatus: transcript ? 'ready' : captionMetadata.caption_unavailable ? 'unavailable' : 'transient',
    metadata: {
      platform: 'YouTube',
      ...captionMetadata,
      ...(meta.channelName && { channel: meta.channelName }),
      ...(meta.date && { published: meta.date }),
      ...(meta.videoId && { video_id: meta.videoId }),
      time_estimate_minutes: timeMinutes,
    },
  };
  if (transcript.length > 100000)
    addCaptureCoverage(result, 'truncated', { originalCharacters: transcript.length, capturedCharacters: 100000 });
  return result;
}

/**
 * Extract YouTube metadata with layered fallbacks:
 *   Layer 1: ytInitialPlayerResponse (in-memory player response — most reliable)
 *   Layer 2: JSON-LD (schema.org VideoObject)
 *   Layer 3: Standard meta tags (itemprop, property, name)
 *   Layer 4: Current DOM elements (Polymer custom elements)
 */
function extractYouTubeMetadata(url, playerResponse) {
  const pr = playerResponse || readYtInitialPlayerResponse();
  const expectedVideoId = new URL(url).searchParams.get('v');
  const rawJsonLd = readJsonLd('VideoObject') || readJsonLd();
  const identifiesVideo = value => {
    try {
      const candidate = new URL(value);
      return candidate.searchParams.get('v') === expectedVideoId || candidate.pathname === `/embed/${expectedVideoId}`;
    } catch {
      return false;
    }
  };
  const jsonLd = [rawJsonLd?.url, rawJsonLd?.embedUrl, rawJsonLd?.contentUrl].some(identifiesVideo) ? rawJsonLd : null;
  const pageMeta = name => (identifiesVideo(getMeta('og:url')) ? getMeta(name) : '');
  const videoDetails = pr?.videoDetails || {};
  const microformat = pr?.microformat?.playerMicroformatRenderer || {};
  const videoId = new URL(url).searchParams.get('v') || videoDetails.videoId || '';

  // 1. Title
  const title =
    videoDetails.title ||
    microformat.title?.simpleText ||
    jsonLd?.name ||
    document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent?.trim() ||
    document.querySelector('h1 yt-formatted-string')?.textContent?.trim() ||
    pageMeta('title') ||
    pageMeta('og:title') ||
    pageMeta('name') ||
    document.title.replace(' - YouTube', '').trim();

  // 2. Channel / Author
  const channelName =
    videoDetails.author ||
    microformat.ownerChannelName ||
    (typeof jsonLd?.author === 'string' ? jsonLd.author : jsonLd?.author?.name) ||
    document.querySelector('#channel-name yt-formatted-string a')?.textContent?.trim() ||
    document.querySelector('ytd-channel-name yt-formatted-string a')?.textContent?.trim() ||
    document.querySelector('#owner-name a')?.textContent?.trim() ||
    document.querySelector('#upload-info ytd-channel-name a')?.textContent?.trim() ||
    pageMeta('author') ||
    '';

  // 3. Published Date
  let date =
    microformat.publishDate ||
    microformat.uploadDate ||
    jsonLd?.datePublished ||
    jsonLd?.uploadDate ||
    pageMeta('datePublished') ||
    pageMeta('uploadDate') ||
    pageMeta('date') ||
    document.querySelector('#info-strings yt-formatted-string')?.textContent?.trim() ||
    document.querySelector('#info yt-formatted-string.date')?.textContent?.trim() ||
    '';

  if (date) {
    // Normalize date strings that may have text prefixes (e.g. from DOM fallbacks)
    date = date.replace(/^(?:Streamed live on|Premiered on|Premiered)\s+/i, '').trim();
  }

  // 4. Description
  let description = videoDetails.shortDescription || microformat.description?.simpleText || jsonLd?.description || '';
  if (!description) {
    const descEl = document.querySelector('#description-inline-expander, ytd-expander#description');
    if (descEl) {
      const snippet = descEl.querySelector('yt-formatted-string, #snippet') || descEl.querySelector('[slot="content"]');
      if (snippet) description = snippet.textContent?.trim() || '';
    }
  }
  if (!description) description = pageMeta('og:description') || pageMeta('description');

  // 5. View Count
  let viewCount = '';
  if (videoDetails.viewCount) {
    const n = Number(videoDetails.viewCount);
    viewCount = isNaN(n) ? videoDetails.viewCount : n.toLocaleString();
  } else if (microformat.viewCount) {
    const n = Number(microformat.viewCount);
    viewCount = isNaN(n) ? microformat.viewCount : n.toLocaleString();
  } else if (jsonLd?.interactionCount) {
    viewCount = String(jsonLd.interactionCount);
  } else {
    viewCount =
      document.querySelector('ytd-video-view-count-renderer .view-count')?.textContent?.trim() ||
      document.querySelector('#info .view-count')?.textContent?.trim() ||
      '';
  }

  // 6. Duration in seconds
  let durationSeconds = parseInt(videoDetails.lengthSeconds, 10);
  if (isNaN(durationSeconds) || durationSeconds <= 0) {
    const video = document.querySelector('video');
    if (video && video.duration && !isNaN(video.duration)) {
      durationSeconds = Math.ceil(video.duration);
    }
  }

  return {
    videoId,
    title,
    channelName,
    date,
    description,
    viewCount,
    durationSeconds: durationSeconds || 0,
  };
}

// Self-contained: also executed in the page's MAIN world by the worker/nonce bridge.
function readYouTubePlayerSnapshot(expectedVideoId) {
  try {
    const url = new URL(location.href);
    if (
      !/(^|\.)youtube\.com$/.test(url.hostname) ||
      url.pathname !== '/watch' ||
      url.searchParams.get('v') !== expectedVideoId
    )
      return null;
    const player = document.querySelector('#movie_player');
    const live = player?.getPlayerResponse?.();
    const response =
      live?.videoDetails?.videoId === expectedVideoId
        ? live
        : window.ytInitialPlayerResponse?.videoDetails?.videoId === expectedVideoId
          ? window.ytInitialPlayerResponse
          : null;
    const details = response?.videoDetails;
    let tracks = response?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    // tracklist belongs to the live player, never the stale initial response.
    if (!tracks.length && live?.videoDetails?.videoId === expectedVideoId) {
      tracks = player?.getOption?.('captions', 'tracklist') || [];
    }
    const text = value => (typeof value === 'string' ? value.slice(0, 100000) : '');
    const config = name => window.ytcfg?.get?.(name);
    const client = config('INNERTUBE_CONTEXT')?.client || {};
    const markers = response?.playerOverlays?.playerOverlayRenderer?.decoratedPlayerBarRenderer;
    const markersMap =
      markers?.decoratedPlayerBarRenderer?.playerBar?.multiMarkersPlayerBarRenderer?.markersMap ||
      markers?.playerBar?.multiMarkersPlayerBarRenderer?.markersMap ||
      [];
    const micro = response?.microformat?.playerMicroformatRenderer;
    return {
      videoId: expectedVideoId,
      playerResponse: details
        ? {
            videoDetails: Object.fromEntries(
              ['videoId', 'title', 'author', 'shortDescription', 'viewCount', 'lengthSeconds'].map(key => [
                key,
                text(details[key]),
              ])
            ),
            microformat: {
              playerMicroformatRenderer: { publishDate: text(micro?.publishDate), uploadDate: text(micro?.uploadDate) },
            },
            playabilityStatus: { status: text(response?.playabilityStatus?.status) },
          }
        : null,
      tracks: Array.isArray(tracks)
        ? tracks.slice(0, 100).map(track => ({
            baseUrl: text(track.baseUrl || track.url).slice(0, 16384),
            languageCode: text(track.languageCode).slice(0, 50),
            kind: text(track.kind).slice(0, 50),
          }))
        : [],
      markersMap: (Array.isArray(markersMap) ? markersMap.slice(0, 10) : []).map(marker => ({
        value: {
          chapters: (Array.isArray(marker?.value?.chapters) ? marker.value.chapters.slice(0, 100) : []).flatMap(
            item => {
              const chapter = item?.chapterRenderer;
              const rawMillis = chapter?.timeRangeStartMillis;
              const millis =
                typeof rawMillis === 'number' || (typeof rawMillis === 'string' && /^\d+$/.test(rawMillis))
                  ? Number(rawMillis)
                  : NaN;
              const title =
                text(chapter?.title?.simpleText) ||
                (Array.isArray(chapter?.title?.runs) ? chapter.title.runs.map(run => text(run?.text)).join('') : '');
              return Number.isFinite(millis) && millis >= 0 && title
                ? [{ chapterRenderer: { timeRangeStartMillis: millis, title: { simpleText: title.slice(0, 500) } } }]
                : [];
            }
          ),
        },
      })),
      client: {
        clientName: text(client.clientName || config('INNERTUBE_CLIENT_NAME')),
        clientVersion: text(client.clientVersion || config('INNERTUBE_CLIENT_VERSION')),
        hl: text(client.hl || config('HL')),
        gl: text(client.gl || config('GL')),
      },
    };
  } catch {
    return null;
  }
}

// Called only by the worker; the same file supplies the serialized MAIN-world reader.
function handleYouTubePlayerSnapshotMessage(message, sender, sendResponse) {
  if (message.action !== 'youtube-player-snapshot') return false;
  try {
    const url = new URL(sender.url);
    if (
      sender.id !== chrome.runtime.id ||
      !sender.tab ||
      !sender.documentId ||
      sender.frameId !== 0 ||
      !/(^|\.)youtube\.com$/.test(url.hostname) ||
      url.protocol !== 'https:' ||
      url.pathname !== '/watch' ||
      url.searchParams.get('v') !== message.videoId
    )
      throw new Error('Invalid snapshot request');
    // documentIds prevents a delayed request from executing in a replacement document.
    const work = chrome.scripting.executeScript({
      target: { tabId: sender.tab.id, documentIds: [sender.documentId] },
      world: 'MAIN',
      func: readYouTubePlayerSnapshot,
      args: [message.videoId],
    });
    let timer;
    Promise.race([
      work,
      new Promise(resolve => {
        timer = setTimeout(() => resolve(null), 500);
      }),
    ])
      .then(results => sendResponse({ success: true, snapshot: results?.[0]?.result || null }))
      .catch(() => sendResponse({ success: false }))
      .finally(() => clearTimeout(timer));
  } catch {
    sendResponse({ success: false });
    return false;
  }
  return true;
}

/** Only accept current-video, HTTPS YouTube caption tracks from page data. */
function validYouTubeTracks(tracks, videoId) {
  if (!Array.isArray(tracks)) return [];
  return tracks.slice(0, 100).filter(track => {
    try {
      const url = new URL(track?.baseUrl || track?.url);
      return (
        (!track.languageCode || typeof track.languageCode === 'string') &&
        (!track.kind || typeof track.kind === 'string') &&
        url.protocol === 'https:' &&
        /(^|\.)youtube\.com$/.test(url.hostname) &&
        url.pathname === '/api/timedtext' &&
        !url.username &&
        !url.password &&
        (!url.searchParams.get('v') || url.searchParams.get('v') === videoId)
      );
    } catch {
      return false;
    }
  });
}

function validYouTubeSnapshot(snapshot, videoId) {
  if (!snapshot || snapshot.videoId !== videoId) return null;
  const response = snapshot.playerResponse;
  if (response && response.videoDetails?.videoId !== videoId) return null;
  const details = response?.videoDetails;
  if (
    details &&
    ['videoId', 'title', 'author', 'shortDescription', 'viewCount', 'lengthSeconds'].some(
      key => details[key] != null && typeof details[key] !== 'string'
    )
  )
    return null;
  const micro = response?.microformat?.playerMicroformatRenderer;
  const safeText = value => (typeof value === 'string' ? value.slice(0, 100000) : '');
  const safeResponse = details
    ? {
        videoDetails: Object.fromEntries(
          ['videoId', 'title', 'author', 'shortDescription', 'viewCount', 'lengthSeconds'].map(key => [
            key,
            safeText(details[key]),
          ])
        ),
        microformat: {
          playerMicroformatRenderer: {
            publishDate: safeText(micro?.publishDate),
            uploadDate: safeText(micro?.uploadDate),
          },
        },
        playabilityStatus: { status: safeText(response?.playabilityStatus?.status) },
      }
    : null;
  const markersMap = (Array.isArray(snapshot.markersMap) ? snapshot.markersMap.slice(0, 10) : []).map(marker => ({
    value: {
      chapters: (Array.isArray(marker?.value?.chapters) ? marker.value.chapters.slice(0, 500) : []).flatMap(item => {
        const chapter = item?.chapterRenderer;
        const rawMillis = chapter?.timeRangeStartMillis;
        const millis =
          typeof rawMillis === 'number' || (typeof rawMillis === 'string' && /^\d+$/.test(rawMillis))
            ? Number(rawMillis)
            : NaN;
        const title =
          safeText(chapter?.title?.simpleText) ||
          (Array.isArray(chapter?.title?.runs) ? chapter.title.runs.map(run => safeText(run?.text)).join('') : '');
        return Number.isFinite(millis) && millis >= 0 && title
          ? [{ chapterRenderer: { timeRangeStartMillis: millis, title: { simpleText: title } } }]
          : [];
      }),
    },
  }));
  return {
    videoId,
    playerResponse: safeResponse,
    tracks: validYouTubeTracks(snapshot.tracks, videoId),
    markersMap,
    client: snapshot.client && typeof snapshot.client === 'object' ? snapshot.client : {},
  };
}

// Abort-aware timeout for messaging and short DOM waits. Cleans every listener.
function youtubeBounded(promise, ms, context, fallback = null) {
  return new Promise((resolve, reject) => {
    let timer;
    let settled = false;
    const finish = (value, error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      context?.signal?.removeEventListener('abort', abort);
      error ? reject(error) : resolve(value);
    };
    const abort = () => finish(null, context.signal.reason);
    try {
      context?.check();
    } catch (error) {
      Promise.resolve(promise).catch(() => {});
      reject(error);
      return;
    }
    context?.signal?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => finish(fallback), Math.max(1, Math.min(ms, (context?.deadline || Infinity) - Date.now())));
    Promise.resolve(promise).then(
      value => finish(value),
      error => finish(null, error)
    );
  });
}

async function queryYouTubePlayerSnapshot(context) {
  context?.check();
  const videoId = new URL(window.location.href).searchParams.get('v');
  const until = Math.min(Date.now() + 500, context?.deadline || Infinity);
  try {
    const response = await youtubeBounded(
      chrome.runtime.sendMessage({ action: 'youtube-player-snapshot', videoId }),
      250,
      context
    );
    context?.check();
    const snapshot = validYouTubeSnapshot(response?.snapshot, videoId);
    if (snapshot) return snapshot;
  } catch {
    context?.check();
  }
  if (typeof readYouTubePlayerSnapshot !== 'function' || Date.now() >= until) return null;
  return new Promise((resolve, reject) => {
    const eventId = 'nutegg_yt_snapshot_' + Math.random().toString(36).slice(2);
    let timer;
    let script;
    let settled = false;
    const finish = (value, error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener(eventId, handler);
      context?.signal?.removeEventListener('abort', abort);
      script?.remove();
      error ? reject(error) : resolve(value);
    };
    const handler = event => {
      try {
        context?.check();
        finish(validYouTubeSnapshot(event.detail, videoId));
      } catch (error) {
        finish(null, error);
      }
    };
    const abort = () => finish(null, context.signal.reason);
    try {
      context?.check();
      window.addEventListener(eventId, handler);
      context?.signal?.addEventListener('abort', abort, { once: true });
      timer = setTimeout(() => finish(null), Math.max(1, until - Date.now()));
      script = document.createElement('script');
      const nonce = document.querySelector('script[nonce]')?.nonce;
      if (nonce) script.nonce = nonce;
      script.textContent = `window.dispatchEvent(new CustomEvent(${JSON.stringify(eventId)}, {detail: (${readYouTubePlayerSnapshot.toString()})(${JSON.stringify(videoId)})}));`;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
    } catch {
      finish(null);
    }
  });
}

function youtubeRouteLog(route, started, outcome, context) {
  console.log('[NutEgg] Captions:', {
    route,
    elapsedMs: Date.now() - started,
    outcome,
    attempt: context?.attempt || 0,
  });
}

/** Current player/page tracks, bounded parallel fresh discovery, then DOM fallback. */
async function fetchYouTubeCaptions(metadata = {}, context) {
  context?.check();
  delete metadata.caption_source;
  delete metadata.caption_unavailable;
  const videoId = new URL(window.location.href).searchParams.get('v');
  if (!videoId) return '';
  const started = Date.now();
  const attemptedUrls = new Map();
  const pr = readYtInitialPlayerResponse();
  if (['LOGIN_REQUIRED', 'UNPLAYABLE'].includes(pr?.playabilityStatus?.status)) {
    metadata.caption_unavailable = true;
    return '';
  }
  const pageTracks = findCaptionTracksInDom(videoId) || pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  const snapshotPromise = queryYouTubePlayerSnapshot(context)
    .then(snapshot => {
      context?.check();
      if (context) context.youtubeSnapshot = snapshot;
      return snapshot;
    })
    .catch(() => null);
  // Give ordinary downloads their existing ceiling while reserving fallback time.
  // The local phase always permits a normal 1.5-second ASR download.
  const attemptEnd = context?.deadline || Date.now() + 20000;
  const panelReserve = Math.min(2000, Math.max(0, attemptEnd - Date.now() - 2500));
  const networkDeadline = attemptEnd - panelReserve;
  let network = youtubeNetworkContext(context, Math.min(networkDeadline, Date.now() + 2500));
  const tryTracks = async (tracks, route) => {
    let result;
    try {
      network.context.check();
      result = await fetchTimedtext(validYouTubeTracks(tracks, videoId), network.context, attemptedUrls);
      network.context.check();
    } catch (error) {
      youtubeRouteLog(
        route,
        started,
        error.code === 'phase_timeout' || error.code === 'timeout' ? 'timeout' : 'cancelled',
        context
      );
      throw error;
    }
    youtubeRouteLog(route, started, result ? 'success' : 'empty', context);
    if (!result) throw new Error('No captions');
    return { text: result, route };
  };
  try {
    // Race local and live tracks. A stalled local URL must not hide a usable live
    // track, and a pending snapshot must not slow a successful local download.
    let winner;
    try {
      winner = await Promise.any([
        tryTracks(pageTracks, 'page_tracks'),
        snapshotPromise.then(snapshot => tryTracks(snapshot?.tracks, 'player_tracks')),
        // An already-open, verified transcript costs no clicks or downloads.
        // Keep manual tracks ahead of this ASR fast path.
        snapshotPromise.then(async snapshot => {
          if ([...(pageTracks || []), ...(snapshot?.tracks || [])].some(track => track.kind !== 'asr'))
            throw new Error('Prefer manual tracks');
          const text = await readTranscriptPanel(context, { existingOnly: true, waitMs: 500 });
          if (!text) throw new Error('No verified visible transcript');
          context?.check();
          return { text, route: 'transcript_panel' };
        }),
      ]);
    } catch {
      context?.check();
    }
    if (winner) {
      metadata.caption_source = winner.route;
      return winner.text;
    }
    network.dispose();
    const snapshot = await snapshotPromise;
    context?.check();
    if (['LOGIN_REQUIRED', 'UNPLAYABLE'].includes(snapshot?.playerResponse?.playabilityStatus?.status)) {
      metadata.caption_unavailable = true;
      return '';
    }
    network = youtubeNetworkContext(context, networkDeadline);
    // The limiter includes discovery AND downloads. The faster route can start
    // its caption request while the other discovery request is still pending.
    try {
      const discover = (route, promise) =>
        promise
          .catch(error => {
            youtubeRouteLog(route, started, 'failed', context);
            throw error;
          })
          .then(tracks => tryTracks(tracks, route));
      winner = await Promise.any([
        discover(
          'innertube',
          fetchInnertubePlayer(
            videoId,
            network.context,
            snapshot?.client?.clientVersion && snapshot?.client?.clientName
              ? snapshot.client
              : readYouTubeClientConfig()
          ).then(response => response?.captions?.playerCaptionsTracklistRenderer?.captionTracks)
        ),
        discover('watch_page', fetchYouTubeWatchTracks(videoId, network.context)),
      ]);
    } catch {
      context?.check();
    }
    if (winner) {
      metadata.caption_source = winner.route;
      return winner.text;
    }
    network.dispose();
    const transcript = await readTranscriptPanel(context);
    context?.check();
    youtubeRouteLog('transcript_panel', started, transcript ? 'success' : 'transient', context);
    if (transcript) metadata.caption_source = 'transcript_panel';
    return transcript;
  } finally {
    network.dispose();
  }
}

async function fetchYouTubeWatchTracks(videoId, context) {
  const origin = new URL(window.location.href).origin;
  const response = await youtubeFetchText(`${origin}/watch?v=${encodeURIComponent(videoId)}`, {}, 4000, context);
  if (!response.ok) return [];
  const marker = response.text.indexOf('ytInitialPlayerResponse');
  if (marker < 0) return [];
  const player = JSON.parse(extractBalanced(response.text, marker + 'ytInitialPlayerResponse'.length) || 'null');
  if (player?.videoDetails?.videoId !== videoId) return [];
  return validYouTubeTracks(player?.captions?.playerCaptionsTracklistRenderer?.captionTracks, videoId);
}

function youtubeFetchText(url, options, timeout, context) {
  return context?.fetchText
    ? context.fetchText(url, options, timeout)
    : captureFetchText(url, options, timeout, context);
}

function youtubeNetworkContext(parent, deadline = parent?.deadline) {
  const controller = new AbortController();
  const stop = () => controller.abort(parent?.signal?.reason);
  parent?.signal?.addEventListener('abort', stop, { once: true });
  const phaseDeadline = Math.min(deadline || Infinity, parent?.deadline || Infinity);
  const timer = Number.isFinite(phaseDeadline)
    ? setTimeout(
        () => controller.abort(Object.assign(new Error('Caption phase expired'), { code: 'phase_timeout' })),
        Math.max(1, phaseDeadline - Date.now())
      )
    : null;
  let active = 0;
  const queue = [];
  const context = {
    deadline: Math.min(deadline || Infinity, parent?.deadline || Infinity),
    attempt: parent?.attempt,
    signal: controller.signal,
    check() {
      parent?.check();
      if (controller.signal.aborted) throw controller.signal.reason;
      if (Date.now() >= context.deadline)
        throw Object.assign(new Error('Caption route deadline'), { code: 'phase_timeout' });
    },
    async fetchText(url, options, timeout) {
      context.check();
      if (active >= 2)
        await youtubeBounded(
          new Promise(resolve => queue.push(resolve)),
          Math.max(1, (context.deadline || Date.now() + 20000) - Date.now()),
          context
        );
      context.check();
      active++;
      try {
        return await captureFetchText(url, options, timeout, context);
      } finally {
        active--;
        queue.shift()?.();
      }
    },
  };
  return {
    context,
    dispose() {
      clearTimeout(timer);
      parent?.signal?.removeEventListener('abort', stop);
      controller.abort();
    },
  };
}

/**
 * Scan all <script> tags in the current page DOM for `"captionTracks"`.
 */
function findCaptionTracksInDom(videoId = new URL(window.location.href).searchParams.get('v')) {
  for (const script of document.querySelectorAll('script')) {
    const text = script.textContent || '';
    const marker = text.indexOf('ytInitialPlayerResponse');
    let scriptVideoId;
    if (marker >= 0) {
      try {
        const response = JSON.parse(extractBalanced(text, marker + 'ytInitialPlayerResponse'.length));
        scriptVideoId = response?.videoDetails?.videoId;
        if (response?.videoDetails?.videoId && response.videoDetails.videoId !== videoId) continue;
      } catch {}
    }
    const idx = text.indexOf('"captionTracks"');
    if (idx === -1) continue;
    const raw = extractBalanced(text, idx);
    if (raw) {
      try {
        const tracks = JSON.parse(raw);
        if (Array.isArray(tracks)) {
          const matching = tracks.filter(track => {
            try {
              const id = new URL(track.baseUrl || track.url).searchParams.get('v');
              return id === videoId || (!id && scriptVideoId === videoId);
            } catch {
              return false;
            }
          });
          if (matching.length) return matching;
        }
      } catch {}
    }
  }
  return null;
}

/**
 * Fetch video metadata via YouTube's public web client API.
 */
function readYouTubeClientConfig() {
  // Useful when MAIN-world scripting and the nonce bridge are blocked. Client
  // configuration is page-wide; return only public request fields, never tokens.
  for (const script of document.querySelectorAll('script')) {
    const text = script.textContent || '';
    const marker = text.indexOf('ytcfg.set(');
    if (marker < 0) continue;
    try {
      const config = JSON.parse(extractBalanced(text, marker + 'ytcfg.set('.length));
      const client = config.INNERTUBE_CONTEXT?.client || {};
      const fields = {
        clientName: client.clientName || config.INNERTUBE_CLIENT_NAME,
        clientVersion: client.clientVersion || config.INNERTUBE_CLIENT_VERSION,
        hl: client.hl || config.HL,
        gl: client.gl || config.GL,
      };
      if (typeof fields.clientName === 'string' && typeof fields.clientVersion === 'string') return fields;
    } catch {}
  }
  return {};
}

async function fetchInnertubePlayer(videoId, context, client = readYouTubeClientConfig()) {
  context?.check();
  if (
    !client ||
    typeof client.clientName !== 'string' ||
    typeof client.clientVersion !== 'string' ||
    !client.clientName ||
    !client.clientVersion ||
    client.clientVersion.length > 100 ||
    client.clientName.length > 30
  )
    return null;
  const origin = new URL(window.location.href).origin;
  const response = await youtubeFetchText(
    `${origin}/youtubei/v1/player?prettyPrint=false`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: client.clientName,
            clientVersion: client.clientVersion,
            ...(typeof client.hl === 'string' && client.hl.length <= 20 && { hl: client.hl }),
            ...(typeof client.gl === 'string' && client.gl.length <= 10 && { gl: client.gl }),
          },
        },
      }),
    },
    4000,
    context
  );
  if (!response.ok) return null;
  const player = JSON.parse(response.text);
  return player?.videoDetails?.videoId === videoId ? player : null;
}

/** "json3" / "srv3" / "default" label for a timedtext URL, for logs. */
function timedtextFormat(url) {
  if (url.includes('fmt=json3')) return 'json3';
  if (url.includes('fmt=srv3')) return 'srv3';
  return 'default';
}

/**
 * Pick caption tracks and fetch timedtext, trying all candidate tracks in order.
 * On signed URLs (containing sparams/signature), baseUrl is fetched first to avoid
 * breaking signature verification with query modifications.
 */
async function fetchTimedtext(tracks, context, attemptedUrls = new Map()) {
  context?.check();
  if (!Array.isArray(tracks) || tracks.length === 0) return '';

  // Prioritize candidate tracks:
  // 1. English human track (non-ASR)
  // 2. Original / non-ASR tracks in other languages
  // 3. English ASR
  // 4. Any other ASR tracks
  // 5. Fallback tracks
  const sortedTracks = [...tracks].sort((a, b) => {
    const aIsEn = (a.languageCode || '').toLowerCase().startsWith('en');
    const bIsEn = (b.languageCode || '').toLowerCase().startsWith('en');
    const aIsAsr = a.kind === 'asr';
    const bIsAsr = b.kind === 'asr';

    if (aIsEn && !aIsAsr && (!bIsEn || bIsAsr)) return -1;
    if (bIsEn && !bIsAsr && (!aIsEn || aIsAsr)) return 1;
    if (!aIsAsr && bIsAsr) return -1;
    if (aIsAsr && !bIsAsr) return 1;
    if (aIsEn && !bIsEn) return -1;
    if (!aIsEn && bIsEn) return 1;
    return 0;
  });

  // Limit candidate tracks to top 3 (avoids iterating through dozens of auto-translations)
  const candidateTracks = sortedTracks.slice(0, 3);

  for (const track of candidateTracks) {
    const rawUrl = track.baseUrl || track.url;
    if (!rawUrl) continue;

    const baseUrl = rawUrl.replace(/\\u0026/g, '&');
    const isSigned = baseUrl.includes('sparams=') || baseUrl.includes('signature=') || baseUrl.includes('sig=');

    // On signed URLs, tampering with query parameters like &fmt=json3 invalidates the signature.
    // Try baseUrl first!
    const urls = isSigned ? [baseUrl] : baseUrl.includes('fmt=') ? [baseUrl] : [baseUrl, `${baseUrl}&fmt=json3`];

    for (const url of urls) {
      try {
        context?.check();
        if (!attemptedUrls.has(url)) {
          attemptedUrls.set(
            url,
            youtubeFetchText(url, {}, 2500, context)
              .then(resp => (resp.ok ? parseYouTubeCaptionResponse(resp.text) : ''))
              .catch(() => {
                context?.check();
                return '';
              })
          );
        }
        const parsed = await attemptedUrls.get(url);
        context?.check();
        if (parsed) return parsed;
      } catch {
        context?.check();
      }
    }
  }

  return '';
}

/** Passive chapters only, using data that belongs to the current video. */
function extractChapters(context) {
  context?.check();
  // Layer 1: player response — the source the chapter ring renders from
  const pr = readYtInitialPlayerResponse();
  const markerPaths = [
    pr?.playerOverlays?.playerOverlayRenderer?.decoratedPlayerBarRenderer?.decoratedPlayerBarRenderer?.playerBar
      ?.multiMarkersPlayerBarRenderer?.markersMap,
    pr?.playerOverlays?.playerOverlayRenderer?.decoratedPlayerBarRenderer?.playerBar?.multiMarkersPlayerBarRenderer
      ?.markersMap,
  ];
  for (const markers of markerPaths) {
    const chapters = chaptersFromMarkersMap(markers);
    if (chapters.length > 0) {
      console.log(`[NutEgg] Chapters: ${chapters.length} from player response`);
      return chapters;
    }
  }

  const expected = new URL(window.location.href).searchParams.get('v');
  const initialData = readYtInitialData();
  if (initialData?.currentVideoEndpoint?.watchEndpoint?.videoId === expected) {
    const chapters = chaptersFromMacroMarkers(initialData);
    if (chapters.length) return chapters;
  }
  const ownedPanel = [
    ...document.querySelectorAll(
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-macro-markers-description-chapters"]'
    ),
  ].find(panel => panel.getAttribute('video-id') === expected);
  return ownedPanel ? readChapterListDom(ownedPanel) : [];
}

/** Chapters from a multiMarkersPlayerBarRenderer markersMap array. */
function chaptersFromMarkersMap(markers) {
  if (!Array.isArray(markers)) return [];
  for (const m of markers) {
    const list = m?.value?.chapters;
    if (!Array.isArray(list) || list.length === 0) continue;
    const out = [];
    for (const c of list) {
      const ms = c?.chapterRenderer?.timeRangeStartMillis;
      const title =
        c?.chapterRenderer?.title?.simpleText || (c?.chapterRenderer?.title?.runs || []).map(x => x.text).join('');
      if (ms != null && title) out.push({ time: formatTime(ms / 1000), title: cleanChapterTitle(title) });
    }
    const deduped = dedupChapters(out);
    if (deduped.length > 0) return deduped;
  }
  return [];
}

/** Chapters from macroMarkersListItemRenderer objects anywhere in the data. */
function chaptersFromMacroMarkers(data) {
  const found = [];
  if (!data || typeof data !== 'object') return found;
  (function walk(node) {
    if (!node || typeof node !== 'object' || found.length >= 500) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if ('macroMarkersListItemRenderer' in node) {
      const r = node.macroMarkersListItemRenderer;
      const title = r?.title?.simpleText || (r?.title?.runs || []).map(x => x.text).join('');
      const timeDesc = r?.timeDescription?.simpleText || (r?.timeDescription?.runs || []).map(x => x.text).join('');
      if (title && timeDesc) {
        found.push({
          time: timeDesc,
          title: cleanChapterTitle(title),
        });
      }
      return;
    }
    for (const v of Object.values(node)) walk(v);
  })(data);
  return dedupChapters(found);
}

/** `ytd-macro-markers-list-item-renderer` items currently in the DOM. */
function readChapterListDom(root = document) {
  const chapters = [];
  root.querySelectorAll('ytd-macro-markers-list-item-renderer').forEach(el => {
    const time = el.querySelector('#time')?.textContent?.trim();
    // YouTube's h4 contains both #title and child yt-formatted-string or spans, which causes textContent to repeat if we query `h4` directly
    const titleEl = el.querySelector("h4 yt-formatted-string, h4 [id='title'], h4 #endpoint") || el.querySelector('h4');
    const rawTitle = titleEl?.textContent?.trim() || '';
    const title = cleanChapterTitle(rawTitle);
    if (time && title) chapters.push({ time, title });
  });
  return dedupChapters(chapters);
}

/** Clean chapter title: strip timestamps and eliminate duplicated repeated strings. */
function cleanChapterTitle(raw) {
  if (!raw) return '';
  let title = raw
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Strip leading timestamp if present: e.g. "0:00 - Intro", "[01:23] Intro", "0:00 Intro"
  title = title.replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*[-—–:]?\s*/, '').trim();

  // Check for duplicated halves:
  // Case A: "Introduction - Introduction"
  const midDash = title.split(/\s*[-—–]\s*/);
  if (midDash.length === 2 && midDash[0].trim() && midDash[0].trim() === midDash[1].trim()) {
    title = midDash[0].trim();
  } else {
    // Case B: "Introduction Introduction" (even split by words)
    const words = title.split(' ');
    if (words.length >= 2 && words.length % 2 === 0) {
      const half1 = words.slice(0, words.length / 2).join(' ');
      const half2 = words.slice(words.length / 2).join(' ');
      if (half1 === half2) {
        title = half1;
      }
    } else {
      // Case C: "IntroductionIntroduction" (no space, exact even string split)
      const len = title.length;
      if (len >= 4 && len % 2 === 0) {
        const half1 = title.slice(0, len / 2);
        const half2 = title.slice(len / 2);
        if (half1 === half2) {
          title = half1;
        }
      }
    }
  }

  return title.trim();
}

/** Deduplicate chapters array by timestamp and eliminate looped/duplicated sequences. */
function dedupChapters(chapters) {
  if (!Array.isArray(chapters) || chapters.length === 0) return [];
  const out = [];
  const seenTimes = new Set();
  let lastSeconds = -1;

  for (const c of chapters) {
    const time = (c.time || '').trim();
    const title = cleanChapterTitle(c.title || '');
    if (!time || !title) continue;

    const seconds = parseTimestamp(`[${time.replace(/^\[|\]$/g, '')}]`);
    // If the list starts repeating from an earlier time, or duplicate timestamp
    if (seenTimes.has(time) || (seconds >= 0 && seconds <= lastSeconds && seenTimes.size >= 2)) {
      if (seconds >= 0 && seconds < lastSeconds && seenTimes.size >= 2) break;
      continue;
    }

    seenTimes.add(time);
    if (seconds >= 0) lastSeconds = seconds;
    out.push({ time, title });
  }

  return out;
}

/**
 * Parse a top-level `var ytXxx = {...}` JSON object from the page's <script>
 * tags. Content scripts cannot see page globals (isolated world), but the
 * script tag text is regular DOM — extract with balanced-brace scanning.
 */
function readYtVar(name) {
  for (const script of document.querySelectorAll('script')) {
    const text = script.textContent || '';
    const marker = text.indexOf(name);
    if (marker === -1) continue;
    const eq = text.indexOf('=', marker);
    if (eq === -1) continue;
    const json = extractBalanced(text, eq + 1);
    if (!json) continue;
    try {
      return JSON.parse(json);
    } catch {
      // Try the next script tag
    }
  }
  return null;
}

/** The page's `ytInitialPlayerResponse` (captions, chapters, ...). */
function readYtInitialPlayerResponse() {
  const response = readYtVar('ytInitialPlayerResponse');
  const expected = new URL(window.location.href).searchParams.get('v');
  return response?.videoDetails?.videoId === expected ? response : null;
}

/** The page's `ytInitialData` (description chapter markers, ...). */
function readYtInitialData() {
  return readYtVar('ytInitialData');
}

/**
 * Open the "Show transcript" panel, read its segments, and close it again.
 * The last resort — works even when the player response and page HTML are
 * unavailable (consent walls, A/B layouts, ...).
 */
function youtubeTranscriptPanelOwner(panel, context, response) {
  const expected = new URL(window.location.href).searchParams.get('v');
  const watchVideo = panel?.closest('ytd-watch-flexy')?.getAttribute('video-id');
  if (watchVideo && watchVideo !== expected) return watchVideo;
  const explicit = panel?.getAttribute('video-id') || panel?.getAttribute('data-video-id');
  if (explicit) return explicit;
  const navigation = window.__nuteggNavigationState;
  try {
    const initial = new URL(navigation?.initialUrl);
    // On the original watch document, before any SPA navigation, a panel under
    // the matching watch renderer cannot be left over from a different video.
    // After navigation, unknown panels still require newly requested segments.
    if (
      navigation.generation === 0 &&
      initial.pathname === '/watch' &&
      initial.searchParams.get('v') === expected &&
      panel?.closest('ytd-watch-flexy')?.getAttribute('video-id') === expected &&
      // The original document and watch renderer establish ownership even when
      // MAIN-world access is blocked. A player snapshot is supplementary, not
      // a prerequisite for reading the DOM fallback it is meant to recover.
      (!response?.videoDetails?.videoId || response.videoDetails.videoId === expected)
    )
      return expected;
  } catch {}
  return '';
}

async function readTranscriptPanel(context, { existingOnly = false, waitMs = 2000 } = {}) {
  const expected = new URL(window.location.href).searchParams.get('v');
  const panelSelector =
    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"], ytd-engagement-panel-section-list-renderer[panel-identifier="engagement-panel-searchable-transcript"]';
  const segmentSelector = 'ytd-transcript-segment-renderer, yt-transcript-segment-view-model';
  const segmentsIn = panel => {
    const rows = [...(panel?.querySelectorAll(segmentSelector) || [])];
    // Older layouts expose only buttons; current layouts wrap those buttons in
    // segment renderers. Never read both a row and its nested button.
    return rows.length ? rows : [...(panel?.querySelectorAll('ytd-transcript-segment-list-renderer [role="button"]') || [])];
  };
  const current = () =>
    (!context || context.isCurrent?.() !== false) &&
    new URL(window.location.href).searchParams.get('v') === expected &&
    (!context?.requestId ||
      !window.__nuteggCaptureState?.latest ||
      window.__nuteggCaptureState.latest === context.requestId ||
      window.__nuteggCaptureState.active?.id === context.requestId);
  const expanded = panel => panel?.getAttribute('visibility') === 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED';
  const getPanel = () => {
    const panels = [...document.querySelectorAll(panelSelector)];
    const matching = panels.filter(panel => {
      const explicit = panel.getAttribute('video-id') || panel.getAttribute('data-video-id');
      const watch = panel.closest('ytd-watch-flexy')?.getAttribute('video-id');
      return (!explicit || explicit === expected) && (!watch || watch === expected);
    });
    // YouTube can keep a hidden template beside its expanded transcript.
    return matching.find(expanded) || matching[0] || panels[0];
  };
  const until = Math.min(Date.now() + waitMs, context?.deadline || Infinity);
  const initialPanel = getPanel();
  const response = context?.youtubeSnapshot?.playerResponse || readYtInitialPlayerResponse();
  const owner = node => youtubeTranscriptPanelOwner(node, context, response);
  const wasExpanded = expanded(initialPanel);
  if (existingOnly && (!wasExpanded || owner(initialPanel) !== expected)) return '';
  const baselineNodes = new Set(segmentsIn(initialPanel));
  const fingerprint = panel =>
    segmentsIn(panel).map(el => el.textContent?.trim()).join('\n');
  const baselineText = fingerprint(initialPanel);
  const description = document.querySelector(
    '#description-inline-expander, ytd-expander#description, #description.ytd-watch-metadata'
  );
  const expandControl = description?.querySelector('#expand');
  const initiallyCollapsed =
    description?.hasAttribute('collapse') ||
    description?.getAttribute('aria-expanded') === 'false' ||
    (expandControl && (expandControl.offsetParent !== null || expandControl.offsetWidth > 0));
  let changedDescription = false,
    openedPanel = false,
    requested = false,
    userChanged = false;
  let ownedPanel = null;
  const userInteraction = event => {
    if (event.isTrusted && (description?.contains(event.target) || getPanel()?.contains(event.target)))
      userChanged = true;
  };
  document.addEventListener('click', userInteraction, true);
  const pause = ms => youtubeBounded(new Promise(() => {}), ms, context);
  const findButton = () =>
    description?.querySelector(
      'ytd-video-description-transcript-section-renderer button, ytd-transcript-section-renderer button'
    ) ||
    document.querySelector(
      'ytd-video-description-transcript-section-renderer button, ytd-transcript-section-renderer button'
    );
  try {
    context?.check();
    let button = findButton();
    // Only expand the video description, never search unrelated page actions.
    if (!button && initiallyCollapsed && description) {
      context?.check();
      const control = expandControl || description;
      control.click();
      changedDescription = true;
      const buttonUntil = Math.min(until, Date.now() + 400);
      while (!button && Date.now() < buttonUntil) {
        await pause(Math.min(50, buttonUntil - Date.now()));
        context?.check();
        button = findButton();
      }
    }
    let panel = getPanel();
    // A panel from another video is never a usable source.
    if (owner(panel) && owner(panel) !== expected) return '';
    if (owner(panel) !== expected || !expanded(panel)) {
      if (!button) return '';
      context?.check();
      button.click();
      requested = true;
    }
    let stableText = '',
      stableSince = 0;
    while (Date.now() < until) {
      context?.check();
      if (!current() || userChanged) return '';
      panel = getPanel();
      if (panel && !wasExpanded && expanded(panel)) {
        openedPanel = true;
        ownedPanel = panel;
      }
      if (owner(panel) && owner(panel) !== expected) return '';
      const segments = segmentsIn(panel);
      const text = fingerprint(panel);
      const fresh =
        requested &&
        segments.length > 0 &&
        (text !== baselineText || segments.every(segment => !baselineNodes.has(segment)));
      const owned = owner(panel) === expected || fresh;
      const loading = [
        ...(panel?.querySelectorAll('[aria-busy="true"], [role="progressbar"], tp-yt-paper-spinner[active]') || []),
      ].some(node => {
        for (let el = node; el && el !== panel; el = el.parentElement) {
          if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
          const style = window.getComputedStyle?.(el);
          if (style?.display === 'none' || style?.visibility === 'hidden') return false;
        }
        return true;
      });
      if (owned && expanded(panel) && text && !loading) {
        if (text !== stableText) {
          stableText = text;
          stableSince = Date.now();
        } else if (Date.now() - stableSince >= 300) {
          context?.check();
          return dedupTranscriptLines(
            segments
              .map(segment => {
                const time =
                  segment
                    .querySelector('.segment-start-offset, .segment-timestamp, [class*="timestamp"], [class*="Timestamp"]')
                    ?.textContent?.trim() || '';
                const textElement =
                  segment.querySelector(
                    '.segment-text, .ytwTranscriptSegmentViewModelText, yt-formatted-string, [class*="segment-text"]'
                  ) || segment;
                const line = decodeHtmlEntities(textElement.textContent?.trim() || '');
                return line ? (time ? `[${time}] ${line}` : line) : '';
              })
              .filter(Boolean)
          ).join('\n');
        }
      } else {
        stableText = '';
        stableSince = 0;
      }
      await pause(Math.min(100, Math.max(1, until - Date.now())));
    }
    return '';
  } catch {
    context?.check();
    return '';
  } finally {
    document.removeEventListener('click', userInteraction, true);
    // Cleanup may run after a timeout/cancel, but never in a newer navigation or
    // capture, or over a user interaction. Only controls owned by this task.
    if (current() && !userChanged) {
      if (openedPanel && ownedPanel?.isConnected && expanded(ownedPanel)) {
        ownedPanel.querySelector('#close-button')?.click();
      }
      if (changedDescription && description?.isConnected) {
        description.querySelector('#collapse')?.click();
      }
    }
  }
}

/**
 * Parses caption responses from YouTube in JSON3, TTML / srv3, legacy XML, or WebVTT format.
 */
function parseYouTubeCaptionResponse(rawText) {
  if (!rawText || !rawText.trim()) return '';
  const trimmed = rawText.replace(/^\uFEFF/, '').trim();

  // 1. JSON (json3 format: events array with segs)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const data = JSON.parse(trimmed);
      const events = data.events;
      if (Array.isArray(events)) {
        const raw = [];
        for (const ev of events) {
          if (!ev.segs) continue;
          const text = decodeHtmlEntities(
            ev.segs
              .map(s => s.utf8 || '')
              .join('')
              .trim()
          );
          if (!text || text === '\n') continue;
          const startMs = ev.tStartMs;
          if (startMs != null && !isNaN(startMs)) {
            raw.push(`[${formatTime(startMs / 1000)}] ${text}`);
          } else {
            raw.push(text);
          }
        }
        const out = dedupTranscriptLines(raw);
        if (out.length > 0) return out.join('\n');
      }
    } catch {}
  }

  // 2. XML formats
  const raw = [];

  // Helper to extract clean text from inside an XML tag, replacing tags with spaces
  const cleanTagText = str =>
    decodeHtmlEntities(
      str
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );

  // Helper to parse time in seconds from various attribute formats:
  // e.g. t="12340" (ms), begin="00:01:23.456", begin="12.34s", start="12.34"
  const parseTimeSec = attrStr => {
    // 1. t="12340" (ms)
    const tMatch = attrStr.match(/\bt\s*=\s*["']?(\d+)["']?/i);
    if (tMatch) return parseInt(tMatch[1], 10) / 1000;

    // 2. start="12.34" or start='12.34' or start=12.34
    const startMatch = attrStr.match(/\bstart\s*=\s*["']?([\d.]+)["']?/i);
    if (startMatch) return parseFloat(startMatch[1]);

    // 3. begin="00:01:23.456" or begin="12.34s" or begin="12.34"
    const beginMatch = attrStr.match(/\bbegin\s*=\s*["']?([^"'\s>]+)["']?/i);
    if (beginMatch) {
      const val = beginMatch[1].replace(/s$/i, '');
      if (val.includes(':')) {
        const parts = val.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
      }
      const num = parseFloat(val);
      if (!isNaN(num)) return num;
    }
    return NaN;
  };

  // Format 2A: <text start="12.3">content</text>
  const textRegex = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let match;
  while ((match = textRegex.exec(trimmed)) !== null) {
    const sec = parseTimeSec(match[1]);
    const text = cleanTagText(match[2]);
    if (text) {
      raw.push(Number.isFinite(sec) ? `[${formatTime(sec)}] ${text}` : text);
    }
  }

  // Format 2B: <p t="12340" d="3000">content</p> or <p begin="...">content</p> (srv3 / TTML)
  if (raw.length === 0) {
    const pRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
    while ((match = pRegex.exec(trimmed)) !== null) {
      const sec = parseTimeSec(match[1]);
      const text = cleanTagText(match[2]);
      if (text) {
        raw.push(Number.isFinite(sec) ? `[${formatTime(sec)}] ${text}` : text);
      }
    }
  }

  // 3. WebVTT format
  if (raw.length === 0 && trimmed.includes('-->')) {
    const vttLines = trimmed.split(/\r?\n/);
    let currentTime = '';
    for (const line of vttLines) {
      const timeMatch = line.match(/^(\d{1,2}:)?(\d{2}):(\d{2})\.\d{3}\s*-->/);
      if (timeMatch) {
        currentTime = line
          .split('-->')[0]
          .trim()
          .replace(/\.\d{3}$/, '');
      } else if (line.trim() && !line.startsWith('WEBVTT') && !line.match(/^\d+$/) && currentTime) {
        const text = cleanTagText(line);
        if (text) {
          raw.push(`[${currentTime}] ${text}`);
        }
      }
    }
  }

  const out = dedupTranscriptLines(raw);
  return out.join('\n');
}

/** Decodes XML and HTML entity strings into plain unicode characters. */
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCodePoint(parseInt(dec, 10));
      } catch {
        return '';
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return '';
      }
    })
    .replace(/\s+/g, ' ');
}

/**
 * Remove repeated caption lines. YouTube serves duplicated caption spans for
 * long videos — sometimes with identical timestamps, sometimes as a verbatim
 * second copy of the whole track (different or missing start times). Rules:
 *   - drop any line whose text was already seen (normalized) — this also
 *     swallows a looped second copy of the track, line by line
 *   - drop any line where the timeline runs BACKWARDS (a looped copy
 *     restarting at 0:00)
 *   - drop lines whose whole text is just a timestamp ("0:01") — the ASR
 *     reading the on-screen timer / caption track markers
 *
 * Lines that share a whole-second timestamp are NOT duplicates — short
 * caption segments legitimately cluster inside one second (the timestamps
 * are quantized to whole seconds). Treating them as repeats truncated
 * transcripts mid-video (e.g. "stops at 00:38").
 */
function dedupTranscriptLines(lines) {
  const out = [];
  const recentSeen = new Map();
  let lastStart = -1;
  let dropped = 0;

  for (const line of lines) {
    const timeMatch = line.trim().match(/^\[(\d{1,2}:)?(\d{1,2}):(\d{2})\]/);
    const start = timeMatch ? parseTimestamp(timeMatch[0]) : -1;
    const text = line.replace(/^\[[^\]]*\]\s*/, '').trim();

    // Junk: the whole caption is a timestamp (on-screen timer read by the ASR)
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) {
      dropped++;
      continue;
    }

    // CJK-safe key: lowercase + collapsed whitespace only. (Stripping
    // non-Latin characters made every Chinese line's key empty, so the
    // text-dedup silently stopped working for non-English tracks.)
    const key = text.toLowerCase().replace(/\s+/g, ' ').trim();

    // Loop detection: timeline jumped backwards
    if (start >= 0 && start < lastStart) {
      dropped++;
      continue;
    }

    // Overlapping / duplicate cue detection within a 3-second window
    const lastSeenTime = key ? recentSeen.get(key) : undefined;
    const isOverlappingRepeat = key && lastSeenTime !== undefined && (start < 0 || Math.abs(start - lastSeenTime) <= 3);

    if (isOverlappingRepeat) {
      dropped++;
      continue;
    }

    if (key) {
      recentSeen.set(key, start);
      if (start >= 0 && recentSeen.size > 200) {
        for (const [k, t] of recentSeen) {
          if (start - t > 30) recentSeen.delete(k);
        }
      }
    }
    if (start >= 0) lastStart = start;
    out.push(line);
  }

  if (dropped > 0) {
    console.log(`[NutEgg] Captions: dedup dropped ${dropped} of ${lines.length} lines`);
  }
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    decodeHtmlEntities,
    dedupChapters,
    cleanChapterTitle,
  };
}
