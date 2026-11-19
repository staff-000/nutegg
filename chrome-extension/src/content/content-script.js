// NutEgg capture dispatcher. Classic scripts share the isolated-world global scope.
// Contributor contract and executable example: docs/content-extractor-contributing.md

/**
 * @typedef {Object} CaptureExtractor
 * @property {string} name Diagnostic identifier; specific routes precede generic.
 * @property {function(): boolean} detect Synchronous, read-only host/path detection.
 * @property {function(Object): (Object|null|Promise<Object|null>)} extract Receives this request's capture context.
 * @property {boolean} bodyReadiness Discover accessible roots and settle the serialized body.
 * @property {'continue'|'stop'} onError Whether ordinary failures may fall through. Ownership/cancellation always stop.
 */
var BUILTIN_EXTRACTORS = [
  {
    name: 'youtube',
    detect: window.detectYouTube,
    extract: window.extractYouTube,
    bodyReadiness: false,
    onError: 'continue',
  },
  {
    name: 'twitter',
    detect: window.detectTwitter,
    extract: window.extractTwitter,
    bodyReadiness: false,
    onError: 'continue',
  },
  {
    name: 'bilibili',
    detect: window.detectBilibili,
    extract: window.extractBilibili,
    bodyReadiness: false,
    onError: 'stop',
  },
  { name: 'douyin', detect: window.detectDouyin, extract: window.extractDouyin, bodyReadiness: false, onError: 'stop' },
  { name: 'weibo', detect: window.detectWeibo, extract: window.extractWeibo, bodyReadiness: false, onError: 'stop' },
  { name: 'zhihu', detect: window.detectZhihu, extract: window.extractZhihu, bodyReadiness: false, onError: 'stop' },
  {
    name: 'forum',
    detect: window.detectForum,
    extract: window.extractForum,
    bodyReadiness: false,
    onError: 'continue',
  },
  {
    name: 'tiktok',
    detect: window.detectTikTok,
    extract: window.extractTikTok,
    bodyReadiness: false,
    onError: 'stop',
  },
  { name: 'instagram', detect: window.detectInstagram, extract: window.extractInstagram, bodyReadiness: false, onError: 'stop' },
  { name: 'threads', detect: window.detectThreads, extract: window.extractThreads, bodyReadiness: false, onError: 'stop' },
  {
    name: 'article',
    detect: window.detectArticle,
    extract: window.extractArticle,
    bodyReadiness: true,
    onError: 'continue',
  },
  // Generic must remain last: it always matches.
  { name: 'generic', detect: () => true, extract: window.extractGeneric, bodyReadiness: true, onError: 'continue' },
];
var EXTRACTORS = window.EXTRACTORS || BUILTIN_EXTRACTORS;
if (EXTRACTORS === BUILTIN_EXTRACTORS) {
  for (const ex of EXTRACTORS) ex._nuteggBuiltIn = true;
} else {
  // Refresh every built-in on reinjection, including registries from older releases.
  // Explicit fixture/custom entries remain intact. Never replace request/listener state.
  if (EXTRACTORS.some(ex => ex._nuteggBuiltIn)) {
    for (const entry of BUILTIN_EXTRACTORS) {
      if (EXTRACTORS.some(ex => ex.name === entry.name)) continue;
      const fallback = EXTRACTORS.findIndex(ex => ex.name === 'article' || ex.name === 'generic');
      EXTRACTORS.splice(fallback < 0 ? EXTRACTORS.length : fallback, 0, { ...entry, _nuteggBuiltIn: true });
    }
  }
  for (const ex of EXTRACTORS) {
    const current = BUILTIN_EXTRACTORS.find(entry => entry.name === ex.name);
    if (typeof current?.extract === 'function' &&
        (ex._nuteggBuiltIn || ex.extract?.name === current.extract.name))
      Object.assign(ex, current, { _nuteggBuiltIn: true });
  }
}
window.EXTRACTORS = EXTRACTORS;

/** All routes, including the final generic fallback, share ownership and readiness checks. */
async function executeCaptureExtractor(ex, context) {
  context?.check();
  const started = Date.now();
  if (context && ex.bodyReadiness) await discoverCaptureRoots(context);
  context?.check();
  let capture = await ex.extract(context);
  context?.check();
  if (capture && context) context.partial = capture;
  if (capture && ex.bodyReadiness) capture = await settleTextCapture(capture, ex.extract, context);
  context?.check();
  if (context)
    (context.diagnostics ||= []).push({
      extractor: ex.name, attempt: context.attempt, elapsed: Date.now() - started,
      outcome: capture?.extractionStatus || 'empty', coverage: capture?.captureCoverage?.reasons || [],
    });
  if (!capture) return null;
  if (capture.transcriptAvailable === false) capture.extractionStatus ||= 'transient';
  else if (capture.transcriptAvailable === true) capture.extractionStatus = 'ready';
  else if (
    capture.extractionStatus !== 'unavailable' &&
    (!capture.content?.trim() ||
      (capture.extractionStatus !== 'ready' &&
        (document.readyState !== 'complete' ||
          document.querySelector('main[aria-busy="true"], article[aria-busy="true"], main [role="progressbar"]'))))
  ) capture.extractionStatus = 'not_ready';
  return window.NutEggDiscussion ? window.NutEggDiscussion.decorate(capture) : capture;
}

async function extractContent(discussionSessionId, context) {
  context?.check();
  try {
    window.NutEggDiscussion?.start(discussionSessionId || `capture:${Date.now()}`, false);
  } catch (error) {
    console.warn('[NutEgg] Passive discussion capture unavailable:', error);
  }
  for (const registered of EXTRACTORS) {
    // Reinjection cannot replace the functions/policy of an already admitted invocation.
    const ex = { ...registered };
    try {
      context?.check();
      if (!ex.detect()) continue;
      console.log(`[NutEgg] Using extractor: ${ex.name}`);
      const capture = await executeCaptureExtractor(ex, context);
      if (capture) return capture;
    } catch (error) {
      context?.check();
      if (error.name === 'AbortError' || ['cancelled', 'stale', 'timeout', 'embedded_changed'].includes(error.code)) throw error;
      console.warn(`[NutEgg] Extractor "${ex.name}" failed:`, error);
      if (ex.onError === 'stop') throw error;
    }
  }
  console.warn('[NutEgg] All extractors failed, using generic');
  return executeCaptureExtractor({
    name: 'generic', extract: extractGeneric, bodyReadiness: true, onError: 'stop',
  }, context);
}

async function runCaptureRequest(message) {
  const state = (window.__nuteggCaptureState ||= { active: null, latest: null });
  const requestId = message.requestId || `capture:${Date.now()}:${Math.random()}`;
  if (state.active?.id === requestId) return state.active.promise;
  state.latest = requestId;
  if (state.active) {
    state.active.context.abort();
    await state.active.promise.catch(() => {});
  }
  if (state.latest !== requestId) throw Object.assign(new Error('Superseded capture'), { code: 'stale' });
  const context = createCaptureContext({ ...message, requestId });
  const job = { id: requestId, context };
  state.active = job;
  job.promise = context
    .wait(Promise.resolve().then(() => extractContent(message.discussionSessionId, context)))
    .catch(error => {
      if (error.code === 'timeout' && context.partial && context.isCurrent()) {
        return addCaptureCoverage({ ...context.partial, extractionStatus: 'transient' }, 'loading_timeout');
      }
      throw error;
    })
    .finally(() => {
      if (context.diagnostics?.length)
        state.diagnostics = [...(state.diagnostics || []), ...context.diagnostics].slice(-100);
      context.dispose();
      if (state.active === job) state.active = null;
    });
  return job.promise;
}

// Playback commands share a document-owned player and navigation identity.
function nuteggPlaybackIdentity() {
  syncCaptureNavigation();
  window.__nuteggDocumentId ||= globalThis.crypto?.randomUUID?.() || `${Date.now()}:${Math.random()}`;
  return {
    documentId: window.__nuteggDocumentId,
    pageKey: NutEggPageIdentity.playbackPageKey(location.href),
    generation: window.__nuteggNavigationState?.generation,
    url: location.href,
  };
}
function collectShadowVideos(root, results, visited) {
  if (!root || visited.has(root)) return;
  visited.add(root);
  if (typeof root.querySelectorAll === 'function') {
    for (const v of root.querySelectorAll('video')) {
      if (!results.includes(v)) results.push(v);
    }
    for (const el of root.querySelectorAll('*')) {
      if (el.shadowRoot) collectShadowVideos(el.shadowRoot, results, visited);
    }
  }
}

function nuteggPlaybackPlayer() {
  if (typeof NutEggSocial !== 'undefined' && NutEggSocial.route()?.id) {
    const socialVideo = NutEggSocial.inspect()?.videos?.[0] || null;
    if (socialVideo) return socialVideo;
  }
  const selectors = [
    '#movie_player video, ytd-watch-flexy video',
    '.bpx-player-video-wrap video, #bilibili-player video',
    'video.html5-main-video, video.video-stream',
    'video',
  ];
  const candidates = [];
  for (const sel of selectors) {
    for (const el of document.querySelectorAll(sel)) {
      if (!candidates.includes(el)) candidates.push(el);
    }
    // Keep the main player ahead of unrelated previews, even while paused.
    if (candidates.length) break;
  }
  if (candidates.length === 0) {
    collectShadowVideos(document, candidates, new Set());
  }
  if (candidates.length === 0) return null;
  return (
    candidates.find(v => v.readyState > 0 && !v.paused && (v.currentSrc || v.src)) ||
    candidates.find(v => v.readyState > 0 && (v.currentSrc || v.src)) ||
    candidates.find(v => !v.paused) ||
    candidates.find(v => Boolean(v.currentSrc || v.src)) ||
    candidates[0]
  );
}
globalThis.__nuteggPlaybackPlayer = nuteggPlaybackPlayer;
function nuteggPlaybackOwned(message) {
  const identity = nuteggPlaybackIdentity();
  return (
    (!message.expectedUrl || NutEggPageIdentity.playbackPageKey(message.expectedUrl) === identity.pageKey) &&
    (!message.documentId || message.documentId === identity.documentId) &&
    (message.generation == null || message.generation === identity.generation)
  );
}
function nuteggApplyPlaybackRate(video, rate) {
  const rounded = Math.round(rate * 100) / 100;
  video.playbackRate = rounded;
  if (Math.abs(video.playbackRate - rounded) > 0.01) throw new Error('rate_failed');
  window.__nuteggAppliedSpeedKey = `${NutEggPageIdentity.playbackPageKey(location.href)}|${video.currentSrc || video.src || ''}`;
}
function nuteggSpeedPresetFromEvent(event) {
  if (!event.shiftKey) return null;
  const codeMap = { Digit2: 2, Digit3: 3, Digit4: 4, Digit5: 5 };
  if (codeMap[event.code]) return codeMap[event.code];
  const keyMap = { 2: 2, '@': 2, 3: 3, '#': 3, 4: 4, $: 4, 5: 5, '%': 5 };
  return keyMap[event.key] || null;
}

// The page and extension iframe have separate keyboard event streams.
if (window.__nuteggSpeedShortcut) document.removeEventListener('keydown', window.__nuteggSpeedShortcut, true);
window.__nuteggSpeedShortcut = event => {
  if (window.__nuteggVideoSpeedEnabled === false) return;
  if (event.defaultPrevented || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.composedPath().some(node => node.isContentEditable ||
      node.matches?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="searchbox"],[role="combobox"],[role="spinbutton"]'))) return;
  const preset = nuteggSpeedPresetFromEvent(event);
  const delta = preset == null ? (['+', '='].includes(event.key) ? 0.25 : ['-', '_'].includes(event.key) ? -0.25 : 0) : 0;
  if (preset == null && !delta) return;
  const video = nuteggPlaybackPlayer();
  if (!video || !Number.isFinite(video.playbackRate)) return;
  if (video.readyState === 0 && !video.currentSrc && !video.src) return;
  try {
    const nextRate = preset != null ? preset : Math.min(16, Math.max(0.25, video.playbackRate + delta));
    nuteggApplyPlaybackRate(video, nextRate);
    window.dispatchEvent(new CustomEvent('nutegg:speed-changed', { detail: { rate: video.playbackRate } }));
    chrome.runtime?.sendMessage?.({ action: 'set-preferred-video-speed', rate: video.playbackRate }).catch?.(() => {});
    event.preventDefault();
    event.stopImmediatePropagation();
  } catch {}
};
document.addEventListener('keydown', window.__nuteggSpeedShortcut, true);
async function nuteggSeek(message) {
  const seconds = Number(message.seconds);
  if (!Number.isFinite(seconds) || seconds < 0)
    return { success: false, errorCode: 'invalid_timestamp' };
  const request = (window.__nuteggSeekSequence = (window.__nuteggSeekSequence || 0) + 1);
  const deadline = Date.now() + 2000;
  let video, assigned = false;
  while (Date.now() < deadline) {
    if (request !== window.__nuteggSeekSequence || !nuteggPlaybackOwned(message))
      return { success: false, errorCode: 'stale' };
    video = nuteggPlaybackPlayer();
    if (video && video.readyState > 0 && Number.isFinite(video.duration)) {
      if (seconds > video.duration) return { success: false, errorCode: 'invalid_timestamp' };
      if (!assigned) {
        try { video.currentTime = seconds; assigned = true; }
        catch { return { success: false, errorCode: 'seek_failed' }; }
      }
      if (!video.seeking && Math.abs(video.currentTime - seconds) <= 1) {
        try {
          video.play?.()?.catch?.(() => {});
        } catch {}
        return {
          success: true,
          type: 'video',
          currentTime: video.currentTime,
          duration: video.duration,
          playbackRate: Number.isFinite(video.playbackRate) ? video.playbackRate : 1,
          ...nuteggPlaybackIdentity(),
        };
      }
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  return { success: false, errorCode: video ? 'seek_timeout' : 'player_unavailable' };
}

// Listen for messages from popup/background (attached once per window)
{
  // Retain active capture state while replacing only our own previous listener.
  if (window.__nuteggMessageListener)
    chrome.runtime.onMessage.removeListener(window.__nuteggMessageListener);
  const listener = (message, _sender, sendResponse) => {
    if (globalThis.__nuteggPanelMessage?.(message, _sender, sendResponse)) return false;
    if (message.action === 'nutegg-speed-settings-updated') {
      window.dispatchEvent(new CustomEvent('nutegg:speed-settings-updated', { detail: message.settings || {} }));
      return false;
    }
    if (message.action === 'nutegg-handshake') {
      sendResponse({ success: true, version: 1, ...nuteggPlaybackIdentity(), capabilities: ['seek', 'position', 'playback-rate'] });
      return false;
    }
    if (
      ['nutegg-seek', 'nutegg-cancel-seek', 'nutegg-page-position', 'nutegg-set-playback-rate'].includes(
        message.action
      ) &&
      !nuteggPlaybackOwned(message)
    ) {
      sendResponse({ success: false, errorCode: 'stale' });
      return false;
    }
    if (message.action === 'nutegg-cancel-seek') {
      window.__nuteggSeekSequence = (window.__nuteggSeekSequence || 0) + 1;
      sendResponse({ success: true });
      return false;
    }
    if (message.action === 'capture-navigation') {
      const active = window.__nuteggCaptureState?.active?.context;
      if (
        active &&
        message.observedAt >= active.startedAt &&
        (!message.previousKey || message.previousKey === capturePageKey(active.url)) &&
        capturePageKey(active.url) !== message.key
      ) {
        window.__nuteggNavigationState.generation++;
        active.abort('stale');
      }
      sendResponse({ success: true });
      return false;
    }
    if (message.action === 'cancel-extraction') {
      const state = window.__nuteggCaptureState;
      if (state?.active?.id === message.requestId) state.active.context.abort();
      if (state?.latest === message.requestId) state.latest = null;
      sendResponse({ success: true });
      return false;
    }
    if (message.action?.startsWith('discussion-') && window.NutEggDiscussion) {
      try {
        const collector = window.NutEggDiscussion;
        const discussion =
          message.action === 'discussion-start'
            ? collector.start(message.sessionId, message.load)
            : message.action === 'discussion-stop'
              ? (collector.stop(message.sessionId), null)
              : message.action === 'discussion-step'
                ? collector.step(message.sessionId)
                : collector.snapshot();
        sendResponse({ success: true, discussion, url: location.href });
      } catch (error) {
        sendResponse({ success: false, error: String(error) });
      }
      return false;
    }
    if (message.action === 'page-identity') {
      const pageUrl = new URL(location.href);
      const isYouTube = /(^|\.)youtube\.com$/.test(pageUrl.hostname) && pageUrl.pathname === '/watch';
      const isBilibili = /(^|\.)bilibili\.com$/.test(pageUrl.hostname);
      let videoId,
        cid,
        captionTracksReady = false,
        playerReady = true;
      if (isYouTube) {
        videoId = pageUrl.searchParams.get('v');
        const player = typeof readYtInitialPlayerResponse === 'function' ? readYtInitialPlayerResponse() : null;
        captionTracksReady = !!player?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length;
        playerReady = !!player || !!document.querySelector('#movie_player video');
      } else if (isBilibili && typeof bilibiliVideoId === 'function') {
        videoId = bilibiliVideoId();
        const requests = performance.getEntriesByType('resource').map(entry => {
          try {
            return new URL(entry.name);
          } catch {
            return null;
          }
        });
        const player = requests
          .reverse()
          .find(
            url =>
              url?.hostname === 'api.bilibili.com' &&
              /^\/x\/player\/(?:wbi\/)?v2$/.test(url.pathname) &&
              (url.searchParams.get('bvid') === videoId || `av${url.searchParams.get('aid')}` === videoId)
          );
        cid =
          pageUrl.searchParams.get('cid') ||
          (!pageUrl.searchParams.has('p') ? player?.searchParams.get('cid') : undefined);
        playerReady = !!player || !!document.querySelector('video');
      }
      // Cheap page-state check (no transcript fetching) — the popup uses it to
      // wait for the page to settle and to detect SPA navigation races.
      const isTwitter =
        ['twitter.com', 'x.com'].some(domain => NutEggPageIdentity.hostMatches(location.href, domain)) &&
        /\/status\/|\/article\//.test(pageUrl.pathname);
      const twitterReady =
        !isTwitter ||
        !!document.querySelector(
          'article[data-testid="tweet"], [data-testid="twitterArticleReadView"], [data-testid="twitterArticleRichTextView"], [data-testid="tweetText"], [data-testid="card.layoutLarge.detail"], [data-testid="primaryColumn"] [role="region"], [data-testid="error-detail"]'
        );
      const identity = {
        success: true,
        url: window.location.href,
        title: document.title,
        readyState: document.readyState,
        videoId,
        cid,
        captionTracksReady,
        bilibiliReady: !isBilibili || playerReady,
        twitterReady,
        // YouTube: the watch page shell has rendered (not the loading skeleton)
        youtubeReady: !isYouTube || playerReady,
      };
      if (isYouTube && !captionTracksReady && typeof queryYouTubePlayerSnapshot === 'function') {
        // SPA player data can become ready without replacing initial script tags.
        // Read-only lookup: it must never start a second capture or move the UI.
        const context = createCaptureContext({ deadline: Date.now() + 500 });
        const publish = snapshot =>
          sendResponse({
            ...identity,
            url: window.location.href,
            videoId: new URL(window.location.href).searchParams.get('v'),
            captionTracksReady: context.isCurrent() && !!snapshot?.tracks?.length,
            youtubeReady: context.isCurrent() && (playerReady || !!snapshot?.playerResponse),
          });
        queryYouTubePlayerSnapshot(context)
          .then(publish, () => publish(null))
          .finally(() => context.dispose())
          .catch(() => {});
        return true;
      }
      sendResponse(identity);
      return false;
    }

    if (message.action === 'nutegg-seek') {
      nuteggSeek(message).then(sendResponse, () => sendResponse({ success: false, errorCode: 'seek_failed' }));
      return true;
    }

    if (message.action === 'nutegg-set-playback-rate') {
      const video = nuteggPlaybackPlayer();
      const rate = Number(message.rate);
      if (!video) {
        sendResponse({ success: false, errorCode: 'player_unavailable' });
        return false;
      }
      if (!Number.isFinite(rate) || rate < 0.25 || rate > 16) {
        sendResponse({ success: false, errorCode: 'invalid_rate' });
        return false;
      }
      try {
        const rounded = Math.round(rate * 100) / 100;
        nuteggApplyPlaybackRate(video, rounded);
        sendResponse({
          success: true,
          type: 'video',
          currentTime: Number.isFinite(video.currentTime) ? video.currentTime : 0,
          duration: isNaN(video.duration) ? 0 : video.duration,
          paused: Boolean(video.paused),
          playbackRate: Number.isFinite(video.playbackRate) ? video.playbackRate : rounded,
          ...nuteggPlaybackIdentity(),
        });
      } catch {
        sendResponse({ success: false, errorCode: 'rate_failed' });
      }
      return false;
    }

    if (message.action === 'nutegg-page-position') {
      const video = nuteggPlaybackPlayer();
      if (video && (video.readyState > 0 || Number.isFinite(video.currentTime))) {
        const videoKey = `${NutEggPageIdentity.playbackPageKey(location.href)}|${video.currentSrc || video.src || ''}`;
        if (window.__nuteggAppliedSpeedKey !== videoKey) {
          window.__nuteggAppliedSpeedKey = videoKey;
          const pref = Number(message.preferredRate);
          // Respect a speed already selected by the website or another control.
          // The saved preference only supplies the initial speed at normal playback.
          if (video.playbackRate === 1 && Number.isFinite(pref) && pref >= 0.25 && pref <= 16) {
            try {
              video.playbackRate = Math.round(pref * 100) / 100;
            } catch {}
          }
        }
        sendResponse({
          success: true,
          type: 'video',
          currentTime: Number.isFinite(video.currentTime) ? video.currentTime : 0,
          duration: isNaN(video.duration) ? 0 : video.duration,
          paused: Boolean(video.paused),
          playbackRate: Number.isFinite(video.playbackRate) ? video.playbackRate : 1,
          onPageSpeedOverlay: Boolean(document.getElementById('nutegg-video-speed-overlay')),
          ...nuteggPlaybackIdentity(),
        });
        return false;
      }

      if (window.detectYouTube?.() || window.detectBilibili?.()) {
        sendResponse({ success: false, errorCode: 'player_unavailable' });
        return false;
      }
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0);
      const clientHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      const maxScroll = Math.max(1, scrollHeight - clientHeight);
      const scrollRatio = Math.min(1, Math.max(0, scrollY / maxScroll));

      let targets = null;
      if (Array.isArray(message.targets) && window.NutEggSources?.resolve) {
        targets = message.targets.map(target => {
          try {
            const match = window.NutEggSources.resolve(target);
            if (match?.element) {
              const rect = match.element.getBoundingClientRect();
              const top = rect.top + scrollY;
              return {
                id: target.id,
                found: true,
                top,
                ratio: Math.min(1, Math.max(0, top / Math.max(1, scrollHeight))),
                inViewport: rect.top <= clientHeight && rect.bottom >= 0,
                passed: rect.top <= clientHeight * 0.35,
              };
            }
          } catch {}
          return { id: target.id, found: false };
        });
      }

      sendResponse({
        success: true,
        type: 'text',
        ...nuteggPlaybackIdentity(),
        scrollY,
        scrollHeight,
        clientHeight,
        scrollRatio,
        targets,
      });
      return false;
    }

    if (message.action === 'nutegg-scroll-to') {
      Promise.resolve()
        .then(() => window.NutEggSources.jump(message))
        .then(sendResponse)
        .catch(() => sendResponse({ success: false, reason: 'not_found' }));
      return true;
    }

    if (message.action === 'extract-content') {
      runCaptureRequest(message)
        .then(content => sendResponse({ success: true, content }))
        .catch(err =>
          sendResponse({
            success: false,
            errorCode: err.code,
            error: err instanceof Error ? err.message : 'Extraction failed',
          })
        );
      return true; // Keep channel open for async
    }
  };
  chrome.runtime.onMessage.addListener(listener);
  window.__nuteggMessageListener = listener;
  window.__nuteggListenerRecord = { version: 1, listener };
  window.__nutegg_listener_attached = true;
}

console.log('[NutEgg] Content script loaded on:', window.location.href);
