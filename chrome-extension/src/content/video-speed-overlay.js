// NutEgg On-Page Video Speed Slider Overlay (YouTube, Bilibili, and optional All Videos)
(function initNutEggVideoSpeedOverlay(globalScope) {
  'use strict';

  const HOST_ID = 'nutegg-video-speed-overlay';

  function isYouTubeHost(hostname) {
    const h = String(hostname || '').toLowerCase();
    return h === 'youtube.com' || h.endsWith('.youtube.com');
  }

  function isBilibiliHost(hostname) {
    const h = String(hostname || '').toLowerCase();
    return h === 'bilibili.com' || h.endsWith('.bilibili.com');
  }

  function isSupportedSpeedOverlayHost(hostname) {
    return isYouTubeHost(hostname) || isBilibiliHost(hostname);
  }

  function findActiveVideo(container = typeof document !== 'undefined' ? document : null) {
    if (!container) return null;
    if (
      typeof document !== 'undefined' &&
      container === document &&
      typeof globalScope.__nuteggPlaybackPlayer === 'function'
    ) {
      const player = globalScope.__nuteggPlaybackPlayer();
      if (player) return player;
    }
    const videos = Array.from(container.querySelectorAll('video'));
    if (videos.length === 0) return null;
    return (
      videos.find(v => v.readyState > 0 && !v.paused && (v.currentSrc || v.src)) ||
      videos.find(v => v.readyState > 0 && (v.currentSrc || v.src)) ||
      videos.find(v => !v.paused) ||
      videos.find(v => Boolean(v.currentSrc || v.src)) ||
      videos[0]
    );
  }

  function firstMatchingElement(doc, selectors) {
    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) return element;
    }
    return null;
  }

  /**
   * `inlineMode`:
   * - 'inline'   : append the slider inside the inline container (safe for non-hydrating DOM, e.g. YouTube).
   * - 'anchored' : never touch the site's DOM; mount on <html> and follow the container's geometry.
   *                Required for SSR/Vue-hydrated sites (Bilibili), where any foreign node inside the app
   *                root causes a hydration mismatch that re-renders the app and wipes #biliMainHeader.
   */
  function resolveInlineOrOverlay(doc, isFullscreen, { platform, playerSelectors, inlineSelectors, inlineMode = 'inline' }) {
    const playerBox = firstMatchingElement(doc, playerSelectors);
    const video = findActiveVideo(playerBox || doc);
    if (!video) return null;
    if (!isFullscreen) {
      const inlineEl = firstMatchingElement(doc, inlineSelectors);
      if (inlineEl) return { container: inlineEl, mode: inlineMode, platform, video };
      // Anchored sites must not get nodes inside their app root before the user enters fullscreen.
      if (inlineMode === 'anchored') return null;
    }
    const fallback = playerBox || video.parentElement;
    return fallback ? { container: fallback, mode: 'overlay', platform, video } : null;
  }

  const SPEED_OVERLAY_STRATEGIES = [
    {
      id: 'bilibili',
      match: ({ hostname }) => isBilibiliHost(hostname),
      resolve: ({ doc, isFullscreen }) =>
        resolveInlineOrOverlay(doc, isFullscreen, {
          platform: 'bilibili',
          playerSelectors: ['.bpx-player-video-area', '#bilibili-player'],
          inlineSelectors: ['.video-info-detail-content', '.video-info-detail'],
          inlineMode: 'anchored',
        }),
    },
    {
      id: 'youtube',
      match: ({ hostname }) => isYouTubeHost(hostname),
      resolve: ({ doc, isFullscreen }) =>
        resolveInlineOrOverlay(doc, isFullscreen, {
          platform: 'youtube',
          playerSelectors: ['#movie_player'],
          inlineSelectors: ['#above-the-fold #title', 'ytd-watch-metadata #title'],
        }),
    },
    {
      id: 'generic',
      match: ({ allSitesEnabled }) => allSitesEnabled === true,
      resolve: ({ doc }) => {
        const video = findActiveVideo(doc);
        if (!video) return null;
        if (video.readyState === 0 && !video.currentSrc && !video.src) return null;
        const playerWrapper = video.closest?.(
          '[data-testid="videoPlayer"], [data-testid="videoComponent"], .video-js, .plyr, .jwplayer'
        );
        const container =
          playerWrapper ||
          (video.parentElement && video.parentElement.tagName !== 'HTML' ? video.parentElement : null) ||
          doc.body;
        return container ? { container, mode: 'overlay', platform: 'generic', video } : null;
      },
    },
  ];

  function resolveSpeedOverlayTarget(
    doc = typeof document !== 'undefined' ? document : null,
    hostname = globalScope.location?.hostname || '',
    allSitesEnabled = false,
    strategies = SPEED_OVERLAY_STRATEGIES
  ) {
    if (!doc) return null;
    const context = { doc, hostname, isFullscreen: Boolean(doc.fullscreenElement), allSitesEnabled };
    for (const strategy of strategies) {
      if (!strategy?.match?.(context)) continue;
      // The first matching strategy owns the host. Never fall through to 'generic' when a
      // site strategy declines to mount (e.g. Bilibili must not get nodes inside #app).
      return strategy.resolve?.(context) || null;
    }
    return null;
  }

  function findMountTarget(doc = document, hostname = globalScope.location?.hostname || '', allSitesEnabled = false) {
    return resolveSpeedOverlayTarget(doc, hostname, allSitesEnabled);
  }

  // Kept for backward compatibility in unit tests
  function findPlayerContainer(doc = document) {
    const target = findMountTarget(doc, globalScope.location?.hostname || '', true);
    return target?.container || null;
  }

  const exported = {
    HOST_ID,
    isYouTubeHost,
    isBilibiliHost,
    isSupportedSpeedOverlayHost,
    SPEED_OVERLAY_STRATEGIES,
    resolveSpeedOverlayTarget,
    findMountTarget,
    findPlayerContainer,
    findActiveVideo,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
  globalScope.NutEggVideoSpeedOverlay = exported;

  if (typeof window === 'undefined' || typeof document === 'undefined' || !globalScope.chrome?.runtime?.sendMessage) {
    return;
  }

  const speedUtils = globalScope.NutEggVideoSpeed;
  if (!speedUtils) return;

  let settings = {
    videoSpeedEnabled: true,
    videoSpeedOnPageEnabled: true,
    videoSpeedAllSitesEnabled: false,
    preferredVideoSpeed: null,
  };

  let hostEl = null;
  let shadowRoot = null;
  let pillEl = null;
  let nuteggBtn = null;
  let badgeBtn = null;
  let badgeTextEl = null;
  let sliderEl = null;
  let tooltipHostEl = null;
  let tooltipEl = null;
  let currentContainer = null;
  let currentMode = null;
  let currentVideo = null;
  let dragging = false;
  let flashTimer = null;
  let observer = null;
  let syncTimer = null;
  const boundVideos = new WeakSet();

  function getHintText(key, fallback) {
    try {
      const translate = globalScope.NutEggI18n?.t || globalScope.t;
      const msg = typeof translate === 'function' ? translate(key) : '';
      if (msg && msg !== key) return msg;
    } catch {}
    return fallback;
  }

  function ensureTooltipHost() {
    if (!tooltipHostEl) {
      tooltipHostEl = document.createElement('div');
      tooltipHostEl.id = `${HOST_ID}-tooltip`;
      tooltipHostEl.style.cssText =
        'position:fixed;inset:0;z-index:2147483647;pointer-events:none;overflow:visible;';
      const tipShadow = tooltipHostEl.attachShadow({ mode: 'open' });
      const tipStyle = document.createElement('style');
      tipStyle.textContent = `
        :host {
          all: initial;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .tooltip {
          position: fixed;
          top: 0;
          left: 0;
          padding: 6px 9px;
          border-radius: 8px;
          background: #49372a;
          color: #fffaf3;
          font-size: 11px;
          line-height: 1.35;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(48, 35, 24, 0.25);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.12s ease;
          z-index: 2147483647;
        }
        .tooltip[hidden] {
          display: none;
        }
      `;
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'tooltip';
      tooltipEl.setAttribute('role', 'tooltip');
      tooltipEl.hidden = true;
      tipShadow.append(tipStyle, tooltipEl);
    }
    const rootTarget = document.fullscreenElement || document.documentElement || document.body;
    if (rootTarget && tooltipHostEl.parentElement !== rootTarget) {
      rootTarget.appendChild(tooltipHostEl);
    }
  }

  function showTooltipFor(targetEl, text) {
    if (!targetEl || dragging) return;
    ensureTooltipHost();
    if (!tooltipEl) return;
    tooltipEl.textContent = text;
    tooltipEl.hidden = false;
    tooltipEl.style.opacity = '1';
    const rect = targetEl.getBoundingClientRect?.();
    const pillRect = pillEl?.getBoundingClientRect?.() || rect;
    if (!rect || (rect.width === 0 && rect.height === 0)) return;
    const tipWidth = tooltipEl.offsetWidth || 160;
    const tipHeight = tooltipEl.offsetHeight || 26;
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 720;
    const anchorTop = pillRect ? pillRect.top : rect.top;
    const anchorBottom = pillRect ? pillRect.bottom : rect.bottom;
    const expectedLeft = Math.max(8, Math.min(rect.left + rect.width / 2 - tipWidth / 2, vw - tipWidth - 8));
    const expectedTop =
      anchorBottom + tipHeight + 12 <= vh ? anchorBottom + 6 : Math.max(8, anchorTop - tipHeight - 6);
    tooltipEl.style.left = `${Math.round(expectedLeft)}px`;
    tooltipEl.style.top = `${Math.round(expectedTop)}px`;
  }

  function hideTooltip() {
    if (!tooltipEl) return;
    tooltipEl.hidden = true;
    tooltipEl.style.opacity = '0';
  }

  function buildOverlayDom() {
    if (hostEl) return;
    hostEl = document.createElement('div');
    hostEl.id = HOST_ID;

    // Prevent clicks/drags on the speed pill from pausing/fullscreening the player
    for (const evtName of ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'dblclick', 'touchstart']) {
      hostEl.addEventListener(evtName, e => e.stopPropagation(), false);
    }

    shadowRoot = hostEl.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .wrap {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .pill {
        --speed-accent: #16a34a;
        --speed-text: #15803d;
        --speed-bg: rgba(255, 252, 247, 0.94);
        --speed-border: rgba(22, 163, 74, 0.42);
        --speed-progress: 11.1%;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 5px;
        width: 152px;
        padding: 3px 7px 3px 5px;
        border-radius: 999px;
        background: var(--speed-bg);
        border: 1px solid var(--speed-border);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
        backdrop-filter: blur(6px);
        opacity: 1;
        transition: opacity 0.16s ease, border-color 0.15s ease;
        box-sizing: border-box;
      }
      :host([data-mode="overlay"]) .pill {
        opacity: 0.48;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
      }
      :host([data-mode="overlay"]) .wrap:hover .pill,
      :host([data-mode="overlay"]) .wrap:focus-within .pill,
      .pill[data-flash="true"],
      .pill[data-dragging="true"] {
        opacity: 1;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        flex-shrink: 0;
        border: 0;
        background: transparent;
        color: var(--speed-text);
        font-size: 11px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        padding: 0;
        cursor: pointer;
        white-space: nowrap;
        line-height: 1.2;
      }
      .badge:hover {
        filter: brightness(0.82);
      }
      .nutegg-open-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        padding: 0;
        border: 0;
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        flex-shrink: 0;
        transition: transform 0.12s ease;
      }
      .nutegg-open-btn:hover {
        transform: scale(1.12);
      }
      .nutegg-open-btn img {
        width: 14px;
        height: 14px;
        display: block;
        border-radius: 3px;
      }
      .rate-text {
        display: inline-block;
        width: 4.4ch;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .slider {
        -webkit-appearance: none;
        appearance: none;
        flex: 0 0 64px;
        width: 64px;
        height: 5px;
        margin: 0;
        padding: 0;
        cursor: pointer;
        border-radius: 999px;
        border: 1px solid rgba(0, 0, 0, 0.14);
        background: linear-gradient(
          to right,
          var(--speed-accent) 0%,
          var(--speed-accent) var(--speed-progress),
          #ffffff var(--speed-progress),
          #ffffff 100%
        );
      }
      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: var(--speed-accent);
        border: 1.5px solid #ffffff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);
        cursor: pointer;
      }
      .tooltip {
        position: fixed;
        top: 0;
        left: 0;
        padding: 6px 9px;
        border-radius: 8px;
        background: #49372a;
        color: #fffaf3;
        font-size: 11px;
        line-height: 1.35;
        white-space: nowrap;
        box-shadow: 0 4px 14px rgba(48, 35, 24, 0.25);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.12s ease;
        z-index: 2147483647;
      }
      .tooltip[hidden] {
        display: none;
      }
    `;

    const wrap = document.createElement('div');
    wrap.className = 'wrap';

    pillEl = document.createElement('div');
    pillEl.className = 'pill';

    nuteggBtn = document.createElement('button');
    nuteggBtn.type = 'button';
    nuteggBtn.className = 'nutegg-open-btn';
    nuteggBtn.setAttribute('aria-label', getHintText('openNutEggPanelHint', 'Open NutEgg side panel'));
    const nuteggImg = document.createElement('img');
    nuteggImg.src = chrome.runtime.getURL?.('icons/icon32.png') || '';
    nuteggImg.alt = '';
    nuteggBtn.appendChild(nuteggImg);
    nuteggBtn.addEventListener('click', () => {
      // background.js rejects host messages whose url does not match the tab ('stale').
      chrome.runtime?.sendMessage?.({ action: 'panel-host-open', url: globalScope.location?.href }).catch?.(() => {});
    });

    badgeBtn = document.createElement('button');
    badgeBtn.type = 'button';
    badgeBtn.className = 'badge';
    badgeBtn.setAttribute('aria-label', getHintText('videoSpeedResetHint', 'Reset speed to 1x'));

    const iconSpan = document.createElement('span');
    iconSpan.textContent = '⏩';
    badgeTextEl = document.createElement('span');
    badgeTextEl.className = 'rate-text';
    badgeTextEl.textContent = '1x';
    badgeBtn.append(iconSpan, badgeTextEl);

    sliderEl = document.createElement('input');
    sliderEl.type = 'range';
    sliderEl.className = 'slider';
    sliderEl.min = '0';
    sliderEl.max = String(speedUtils.VIDEO_SPEED_STOPS.length - 1);
    sliderEl.step = '1';
    sliderEl.value = '3';
    sliderEl.setAttribute('aria-label', getHintText('videoSpeedLabel', 'Video playback speed'));

    const bindHint = (el, key, fallback) => {
      const show = () => showTooltipFor(el, getHintText(key, fallback));
      el.addEventListener('pointerenter', show);
      el.addEventListener('mouseenter', show);
      el.addEventListener('focus', show);
      el.addEventListener('pointerleave', hideTooltip);
      el.addEventListener('mouseleave', hideTooltip);
      el.addEventListener('blur', hideTooltip);
    };
    bindHint(nuteggBtn, 'openNutEggPanelHint', 'Open NutEgg side panel');
    bindHint(badgeBtn, 'videoSpeedResetHint', 'Reset speed to 1x');
    bindHint(sliderEl, 'videoSpeedSliderHint', 'Adjust speed · + / - (±0.25x) · Shift+2..5 (2x–5x)');

    const applyFromSlider = () => {
      const rate = speedUtils.videoSpeedIndexToRate(sliderEl.value);
      setVideoRate(rate);
    };

    sliderEl.addEventListener('pointerdown', () => {
      dragging = true;
      pillEl.dataset.dragging = 'true';
      hideTooltip();
    });
    sliderEl.addEventListener('pointerup', () => {
      dragging = false;
      delete pillEl.dataset.dragging;
    });
    sliderEl.addEventListener('blur', () => {
      dragging = false;
      delete pillEl.dataset.dragging;
    });
    sliderEl.addEventListener('input', applyFromSlider);
    sliderEl.addEventListener('change', () => {
      dragging = false;
      delete pillEl.dataset.dragging;
      applyFromSlider();
    });

    badgeBtn.addEventListener('click', () => {
      setVideoRate(1);
    });

    pillEl.append(nuteggBtn, badgeBtn, sliderEl);
    wrap.append(pillEl);
    shadowRoot.append(style, wrap);
  }

  function applyHostPlacement(container, mode, platform) {
    hostEl.dataset.mode = mode;
    if (mode === 'anchored') {
      // Lives on <html>, outside the site's app root; positioned by positionAnchoredHost().
      // z-index stays below typical sticky site headers (Bilibili's bar uses 1002).
      hostEl.style.cssText =
        'position:absolute;top:0;left:0;display:inline-flex;align-items:center;z-index:1000;pointer-events:auto;visibility:hidden;';
      return;
    }
    if (mode === 'inline') {
      hostEl.style.cssText =
        'position:relative;display:inline-flex;align-items:center;margin-left:auto;flex-shrink:0;z-index:20;pointer-events:auto;';
      const computed = globalScope.getComputedStyle?.(container);
      if (platform === 'youtube' && computed && !computed.display.includes('flex')) {
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'space-between';
        container.style.gap = '12px';
      } else if (platform === 'bilibili' && computed && !computed.display.includes('flex')) {
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.flexWrap = 'wrap';
        container.style.gap = '8px';
      }
    } else {
      hostEl.style.cssText = 'position:absolute;top:12px;right:12px;z-index:2147483640;pointer-events:auto;';
      const computed = globalScope.getComputedStyle?.(container);
      if (computed?.position === 'static') {
        container.style.position = 'relative';
      }
    }
  }

  function renderRate(rate) {
    if (!pillEl || !badgeTextEl || !sliderEl) return;
    const valid = Number.isFinite(Number(rate)) && Number(rate) > 0 ? Number(rate) : 1;
    badgeTextEl.textContent = speedUtils.formatVideoSpeed(valid);
    speedUtils.applyVideoSpeedColors(pillEl, valid);
    if (!dragging) {
      const idx = String(speedUtils.rateToVideoSpeedIndex(valid));
      if (sliderEl.value !== idx) sliderEl.value = idx;
    }
  }

  function flashPill() {
    if (!pillEl) return;
    pillEl.dataset.flash = 'true';
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      if (pillEl) delete pillEl.dataset.flash;
    }, 1200);
  }

  function persistPreferredRate(rate) {
    settings.preferredVideoSpeed = rate;
    chrome.runtime?.sendMessage?.({ action: 'set-preferred-video-speed', rate }).catch?.(() => {});
  }

  function setVideoRate(rate) {
    const rounded = Math.round(Number(rate) * 100) / 100;
    if (!Number.isFinite(rounded) || rounded < 0.25 || rounded > 16) return;
    renderRate(rounded);
    const video = currentVideo || findActiveVideo(document);
    if (video) {
      try {
        video.playbackRate = rounded;
        if (globalScope.NutEggPageIdentity?.playbackPageKey) {
          window.__nuteggAppliedSpeedKey = `${globalScope.NutEggPageIdentity.playbackPageKey(location.href)}|${video.currentSrc || video.src || ''}`;
        }
      } catch {}
    }
    persistPreferredRate(rounded);
  }

  function bindVideoEvents(video) {
    if (!video) return;
    currentVideo = video;
    const videoKey = globalScope.NutEggPageIdentity?.playbackPageKey
      ? `${globalScope.NutEggPageIdentity.playbackPageKey(location.href)}|${video.currentSrc || video.src || ''}`
      : `${location.href}|${video.currentSrc || video.src || ''}`;

    if (
      window.__nuteggAppliedSpeedKey !== videoKey &&
      video.playbackRate === 1 &&
      Number.isFinite(settings.preferredVideoSpeed) &&
      settings.preferredVideoSpeed >= 0.25 &&
      settings.preferredVideoSpeed <= 16
    ) {
      window.__nuteggAppliedSpeedKey = videoKey;
      try {
        video.playbackRate = settings.preferredVideoSpeed;
      } catch {}
    }

    if (!boundVideos.has(video)) {
      boundVideos.add(video);
      video.addEventListener('ratechange', () => {
        if (video !== currentVideo) return;
        const nextRate = Number(video.playbackRate);
        if (Number.isFinite(nextRate) && nextRate > 0) {
          renderRate(nextRate);
        }
      });
    }
    renderRate(video.playbackRate);
  }

  function mountOrSync() {
    if (settings.videoSpeedEnabled === false || settings.videoSpeedOnPageEnabled === false) {
      unmountOverlay();
      return;
    }
    const target = findMountTarget(document, window.location.hostname, settings.videoSpeedAllSitesEnabled === true);
    if (!target) {
      unmountOverlay();
      return;
    }
    buildOverlayDom();
    const mountParent = target.mode === 'anchored' ? document.documentElement : target.container;
    if (currentContainer !== target.container || currentMode !== target.mode || hostEl.parentElement !== mountParent) {
      currentContainer = target.container;
      currentMode = target.mode;
      applyHostPlacement(target.container, target.mode, target.platform);
      mountParent.appendChild(hostEl);
    }
    if (target.mode === 'anchored') startAnchorTracking();
    else stopAnchorTracking();
    bindVideoEvents(target.video);
  }

  let anchorFrame = null;
  let anchorResizeObserver = null;
  let anchorListenersBound = false;
  let anchorKey = '';
  function positionAnchoredHost() {
    if (!hostEl || currentMode !== 'anchored' || !currentContainer) return;
    const rect = currentContainer.isConnected ? currentContainer.getBoundingClientRect() : null;
    const width = hostEl.offsetWidth;
    const height = hostEl.offsetHeight;
    const visible = Boolean(rect && rect.width > 0 && rect.height > 0 && width > 0);
    const left = visible ? Math.round(rect.right + (window.scrollX || 0) - width) : 0;
    const top = visible ? Math.round(rect.top + (window.scrollY || 0) + (rect.height - height) / 2) : 0;
    const key = `${visible}:${left}:${top}`;
    if (key === anchorKey) return;
    anchorKey = key;
    hostEl.style.left = `${left}px`;
    hostEl.style.top = `${top}px`;
    hostEl.style.visibility = visible ? 'visible' : 'hidden';
  }
  function scheduleAnchorPosition() {
    if (currentMode !== 'anchored' || anchorFrame != null) return;
    anchorFrame = requestAnimationFrame(() => {
      anchorFrame = null;
      positionAnchoredHost();
    });
  }
  function startAnchorTracking() {
    anchorKey = '';
    positionAnchoredHost();
    if (!anchorListenersBound) {
      anchorListenersBound = true;
      window.addEventListener('resize', scheduleAnchorPosition, { passive: true });
      window.addEventListener('scroll', scheduleAnchorPosition, { passive: true, capture: true });
    }
    if (typeof ResizeObserver === 'function' && !anchorResizeObserver) {
      anchorResizeObserver = new ResizeObserver(scheduleAnchorPosition);
    }
    if (anchorResizeObserver) {
      anchorResizeObserver.disconnect();
      if (currentContainer) anchorResizeObserver.observe(currentContainer);
      if (hostEl) anchorResizeObserver.observe(hostEl);
    }
    scheduleAnchorPosition();
  }
  function stopAnchorTracking() {
    if (anchorFrame != null) cancelAnimationFrame(anchorFrame);
    anchorFrame = null;
    anchorKey = '';
    anchorResizeObserver?.disconnect();
    if (anchorListenersBound) {
      anchorListenersBound = false;
      window.removeEventListener('resize', scheduleAnchorPosition);
      window.removeEventListener('scroll', scheduleAnchorPosition, { capture: true });
    }
  }

  function unmountOverlay() {
    stopAnchorTracking();
    if (hostEl && hostEl.parentElement) {
      hostEl.remove();
    }
    if (tooltipHostEl && tooltipHostEl.parentElement) {
      tooltipHostEl.remove();
    }
    hideTooltip();
    currentContainer = null;
    currentMode = null;
    currentVideo = null;
  }

  function scheduleSync() {
    if (syncTimer) return;
    syncTimer = setTimeout(() => {
      syncTimer = null;
      mountOrSync();
    }, 150);
  }

  function applySettings(next) {
    settings = {
      videoSpeedEnabled: next?.videoSpeedEnabled !== false,
      videoSpeedOnPageEnabled: next?.videoSpeedOnPageEnabled !== false,
      videoSpeedAllSitesEnabled: next?.videoSpeedAllSitesEnabled === true,
      preferredVideoSpeed:
        typeof next?.preferredVideoSpeed === 'number' && Number.isFinite(next.preferredVideoSpeed)
          ? next.preferredVideoSpeed
          : null,
    };
    window.__nuteggVideoSpeedEnabled = settings.videoSpeedEnabled;
    const overlayActive =
      settings.videoSpeedEnabled &&
      settings.videoSpeedOnPageEnabled &&
      (isSupportedSpeedOverlayHost(window.location.hostname) || settings.videoSpeedAllSitesEnabled);
    if (overlayActive) {
      if (!observer && document.body) {
        observer = new MutationObserver(() => scheduleSync());
        observer.observe(document.body, { childList: true, subtree: true });
      }
      mountOrSync();
    } else {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      unmountOverlay();
    }
  }

  chrome.runtime
    .sendMessage({ action: 'get-video-speed-settings' })
    .then(res => applySettings(res?.settings || {}))
    .catch(() => applySettings({}));

  window.addEventListener('nutegg:speed-settings-updated', e => {
    applySettings(e?.detail || {});
  });

  window.addEventListener('nutegg:speed-changed', e => {
    const rate = Number(e?.detail?.rate);
    if (Number.isFinite(rate) && rate > 0) {
      renderRate(rate);
      flashPill();
    }
  });

  document.addEventListener('fullscreenchange', scheduleSync);
  window.addEventListener('yt-navigate-finish', scheduleSync);
  window.addEventListener('popstate', scheduleSync);
  window.addEventListener('hashchange', scheduleSync);
})(typeof globalThis !== 'undefined' ? globalThis : this);
