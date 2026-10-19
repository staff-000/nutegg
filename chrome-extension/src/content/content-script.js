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
  { name: 'youtube', detect: window.detectYouTube, extract: window.extractYouTube, bodyReadiness: false, onError: 'continue' },
  { name: 'twitter', detect: window.detectTwitter, extract: window.extractTwitter, bodyReadiness: false, onError: 'continue' },
  { name: 'bilibili', detect: window.detectBilibili, extract: window.extractBilibili, bodyReadiness: false, onError: 'stop' },
  { name: 'douyin', detect: window.detectDouyin, extract: window.extractDouyin, bodyReadiness: false, onError: 'stop' },
  { name: 'weibo', detect: window.detectWeibo, extract: window.extractWeibo, bodyReadiness: false, onError: 'stop' },
  { name: 'zhihu', detect: window.detectZhihu, extract: window.extractZhihu, bodyReadiness: false, onError: 'stop' },
  { name: 'forum', detect: window.detectForum, extract: window.extractForum, bodyReadiness: false, onError: 'continue' },
  { name: 'tiktok', detect: window.detectTikTok, extract: window.extractTikTok, bodyReadiness: false, onError: 'continue' },
  { name: 'article', detect: window.detectArticle, extract: window.extractArticle, bodyReadiness: true, onError: 'continue' },
  // Generic must remain last: it always matches.
  { name: 'generic', detect: () => true, extract: window.extractGeneric, bodyReadiness: true, onError: 'continue' },
];
var EXTRACTORS = window.EXTRACTORS || BUILTIN_EXTRACTORS;
if (EXTRACTORS === BUILTIN_EXTRACTORS) {
  for (const ex of EXTRACTORS) ex._nuteggBuiltIn = true;
} else {
  // Refresh every built-in on reinjection, including registries from older releases.
  // Explicit fixture/custom entries remain intact. Never replace request/listener state.
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

// Listen for messages from popup/background (attached once per window)
if (!window.__nutegg_listener_attached) {
  window.__nutegg_listener_attached = true;
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
      // Seek the page's video to the given timestamp (seconds) — used by the
      // clickable Mind Map and Q&A timestamp pills in the popup.
      const video =
        document.querySelector('.html5-main-video') ||
        document.querySelector('video.video-stream') ||
        document.querySelector('video');
      if (video) {
        const secs = Number(message.seconds);
        if (!isNaN(secs)) {
          video.currentTime = secs;
          video.play?.().catch(() => {});
        }
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No video element found' });
      }
      return false;
    }

    if (message.action === 'nutegg-page-position') {
      const video =
        document.querySelector('#movie_player video') ||
        document.querySelector('ytd-watch-flexy video') ||
        document.querySelector('.html5-main-video') ||
        document.querySelector('video.video-stream') ||
        document.querySelector('.bpx-player-video-wrap video') ||
        document.querySelector('#bilibili-player video') ||
        document.querySelector('video');
      if (video && typeof video.currentTime === 'number' && !isNaN(video.currentTime)) {
        sendResponse({
          success: true,
          type: 'video',
          currentTime: video.currentTime,
          duration: isNaN(video.duration) ? 0 : video.duration,
          paused: Boolean(video.paused),
        });
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
  });
}

console.log('[NutEgg] Content script loaded on:', window.location.href);
