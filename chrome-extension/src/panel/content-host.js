/* Runs only in the isolated top-level content-script world. */
(() => {
  if (window !== window.top || globalThis.__nuteggPanelHost) return;
  globalThis.__nuteggPanelHost = true;
  let pageLayout,
    host,
    frame,
    dragPreview,
    dragSession,
    applyHostSide,
    timer,
    maxTimer,
    lastUrl = location.href,
    settledKey = '',
    prefetchingKey = '',
    lastSignals,
    lastSettings,
    epoch = 0;
  const t = (key, params) => globalThis.NutEggI18n.t(key, params);
  globalThis.NutEggI18n.initI18n();
  const message = (action, extra = {}) =>
    chrome.runtime.sendMessage({ action, url: location.href, ...extra }).catch(() => null);
  function passiveSignals() {
    const meta = selector => document.querySelector(selector)?.getAttribute('content') || '';
    const url = new URL(location.href);
    const article =
      !!document.querySelector('article,[role="article"],[itemprop="articleBody"]') ||
      meta('meta[property="og:type"]') === 'article';
    const video =
      (!article && !!document.querySelector('video')) ||
      /(?:^|\.)(?:youtube\.com|youtu\.be|bilibili\.com|douyin\.com|tiktok\.com)$/.test(url.hostname);
    let body = '',
      ready = false,
      container = null;
    let videoMinutes = null;
    if (video) {
      const transcript = document.querySelector(
        'ytd-transcript-renderer #segments-container, [data-transcript], .transcript-content'
      );
      if (transcript) {
        const result = captureTextResult(transcript, null, 60000);
        body = result.text;
        ready = result.status === 'ready';
      } else {
        // Estimate reading/watching time from explicit player/meta duration when transcript DOM is closed.
        const videoEl = document.querySelector('video');
        let sec = videoEl && Number.isFinite(videoEl.duration) && videoEl.duration > 0 ? videoEl.duration : 0;
        if (!sec) {
          const iso = meta('meta[itemprop="duration"]');
          const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
          if (m) sec = (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0);
        }
        if (!sec) {
          const domDur = document.querySelector('.ytp-time-duration')?.textContent?.trim();
          const parts = domDur ? domDur.split(':').map(Number) : [];
          if (parts.length >= 2 && parts.every(Number.isFinite)) {
            sec = parts.reduce((acc, n) => acc * 60 + n, 0);
          }
        }
        if (sec > 0) {
          videoMinutes = Math.max(1, Math.ceil(sec / 60));
          ready = true;
        }
      }
    } else {
      container = findCaptureContainer();
      if (container) {
        const result = captureTextResult(container, null, 60000);
        body = result.text;
        ready = result.status === 'ready';
      }
    }
    const links = container
      ? [...container.querySelectorAll('a')].filter(link => !link.closest('[data-nutegg-ui]'))
      : [];
    const linkText = links.reduce((count, link) => count + (link.textContent?.length || 0), 0);
    const listing =
      !!document.querySelector('[role=feed]') ||
      Boolean(globalThis.NutEggRules?.isListingUrl?.(location.href)) ||
      (!article && !video && links.length > 8 && linkText / Math.max(1, body.length) > 0.45);
    const author =
      meta('meta[name="author"]') ||
      meta('meta[property="article:author"]') ||
      document
        .querySelector(
          '[itemprop="author"] [itemprop="name"], [rel="author"], ytd-video-owner-renderer #channel-name a, #owner #channel-name a'
        )
        ?.textContent?.trim() ||
      '';
    const contentAvailable = ready && (body.trim().length > 0 || videoMinutes != null) && !listing;
    return {
      url: location.href,
      author,
      contentAvailable,
      listing,
      minutes: contentAvailable ? (body.trim().length > 0 ? NutEggRules.readingMinutes(body) : videoMinutes) : null,
      searchText: [
        document.title,
        meta('meta[name="keywords"]'),
        meta('meta[name="description"]'),
        ...[...document.querySelectorAll('h1,h2,h3')]
          .filter(el => !el.closest('[data-nutegg-ui]'))
          .slice(0, 40)
          .map(el => el.textContent),
        body.slice(0, 30000),
      ]
        .join('\n')
        .slice(0, 40000),
    };
  }
  async function inspect() {
    clearTimeout(timer);
    clearTimeout(maxTimer);
    maxTimer = null;
    const current = ++epoch,
      url = location.href;
    try {
      lastSignals = passiveSignals();
      const response = await message('panel-signals', { signals: lastSignals });
      if (current !== epoch || url !== location.href) return;
      lastSettings = response?.settings || lastSettings;
      if (document.readyState === 'complete' && (lastSignals.contentAvailable || lastSignals.listing || response?.decision?.open)) {
        settledKey = NutEggPageIdentity.capturePageKey(url);
      }
      if (response?.shouldPrefetch && !host) {
        const key = response.key || NutEggPageIdentity.capturePageKey(url);
        if (prefetchingKey !== key && typeof runCaptureRequest === 'function') {
          prefetchingKey = key;
          try {
            const capture = await runCaptureRequest({
              action: 'extract-content',
              url,
              requestId: `prefetch:${current}:${Date.now()}`,
            });
            if (url !== location.href || host) return;
            const ok =
              !!capture?.content?.trim() &&
              capture.transcriptAvailable !== false &&
              !['not_ready', 'unavailable'].includes(capture.extractionStatus) &&
              !capture.captureCoverage?.reasons?.includes('access_restricted');
            if (ok) {
              await message('panel-prefetch-complete', { key, capture });
            }
          } catch {
            // Content fetch failed or timed out: keep panel closed!
          }
        }
      }
    } catch {
      /* A partially loaded page will be inspected again after settling. */
    }
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(inspect, 600);
    if (!maxTimer) maxTimer = setTimeout(inspect, 2000);
  }
  function remove() {
    dragPreview?.remove();
    dragPreview = null;
    dragSession = null;
    applyHostSide = null;
    pageLayout?.dispose();
    pageLayout = null;
    host?.remove();
    host = frame = null;
  }
  function show(messageData) {
    remove();
    lastSettings = messageData.settings;
    host = document.createElement('div');
    host.setAttribute('data-nutegg-ui', '');
    const shadow = host.attachShadow({ mode: 'closed' });
    let activeSide = messageData.settings.side === 'left' ? 'left' : 'right';
    const width = Math.min(messageData.settings.width, innerWidth);
    const style = document.createElement('style');
    style.textContent = `:host{all:initial;position:fixed!important;top:0!important;bottom:0!important;${activeSide}:0!important;width:min(${width}px,100vw)!important;z-index:2147483646!important;box-shadow:0 0 24px #0003;background:#fcfaf7}iframe{border:0;width:100%;height:100%;display:block} .grip{position:absolute;top:0;bottom:0;${activeSide === 'right' ? 'left' : 'right'}:0;width:6px;cursor:ew-resize;touch-action:none}`;
    shadow.append(style);
    frame = document.createElement('iframe');
    frame.title = 'NutEgg';
    frame.src = chrome.runtime.getURL('src/popup/popup.html') + '#panel=' + encodeURIComponent(messageData.grant);
    shadow.append(frame);
    const grip = document.createElement('div');
    grip.className = 'grip';
    grip.setAttribute('role', 'separator');
    grip.setAttribute('aria-label', t('panelResize'));
    grip.tabIndex = 0;
    let activeWidth = width;
    const hostStyle = () => style.sheet.cssRules[0].style;
    const gripStyle = () => style.sheet.cssRules[2].style;
    const dockTo = nextSide => {
      activeSide = nextSide === 'left' ? 'left' : 'right';
      hostStyle().removeProperty('left');
      hostStyle().removeProperty('right');
      hostStyle().setProperty(activeSide, '0', 'important');
      gripStyle().removeProperty('left');
      gripStyle().removeProperty('right');
      gripStyle().setProperty(activeSide === 'right' ? 'left' : 'right', '0');
      pageLayout?.setSide?.(activeSide);
    };
    applyHostSide = nextSide => {
      if (nextSide !== activeSide) dockTo(nextSide);
    };
    const resize = value => {
      activeWidth = Math.max(Math.min(280, innerWidth), Math.min(900, innerWidth, value));
      hostStyle().setProperty('width', `min(${activeWidth}px,100vw)`, 'important');
      pageLayout?.update(activeWidth);
    };
    grip.addEventListener('pointerdown', event => {
      grip.setPointerCapture(event.pointerId);
      event.preventDefault();
      frame.style.pointerEvents = 'none';
    });
    grip.addEventListener('pointermove', event => {
      if (grip.hasPointerCapture(event.pointerId))
        resize(activeSide === 'right' ? innerWidth - event.clientX : event.clientX);
    });
    const done = () => {
      if (frame) frame.style.pointerEvents = '';
      void message('panel-resize', { width: activeWidth });
    };
    grip.addEventListener('pointerup', done);
    grip.addEventListener('pointercancel', done);
    grip.addEventListener('keydown', event => {
      if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        resize(activeWidth + (event.key === 'ArrowLeft' ? -20 : 20) * (activeSide === 'left' ? 1 : -1));
        done();
      }
    });
    shadow.append(grip);
    document.documentElement.append(host);
    pageLayout = new NutEggPanelPageLayout(host, { side: activeSide, width, layoutMode: messageData.settings.layoutMode });
    dragSession = {
      start: () => {
        const startLeft = activeSide === 'right' ? Math.max(0, innerWidth - activeWidth) : 0;
        dragSession.startLeft = startLeft;
        dragSession.currentLeft = startLeft;
        dragPreview?.remove();
        dragPreview = document.createElement('div');
        dragPreview.setAttribute('data-nutegg-ui', '');
        dragPreview.style.cssText = `all:initial;position:fixed!important;top:0!important;bottom:0!important;${activeSide}:0!important;width:${activeWidth}px!important;background:rgba(168,87,24,0.1)!important;border:2px dashed rgba(168,87,24,0.45)!important;box-sizing:border-box!important;pointer-events:none!important;z-index:2147483645!important`;
        document.documentElement.append(dragPreview);
        hostStyle().removeProperty('right');
        hostStyle().setProperty('left', `${startLeft}px`, 'important');
      },
      move: dx => {
        if (dragSession.startLeft == null) dragSession.start();
        const currentLeft = Math.max(0, Math.min(innerWidth - activeWidth, dragSession.startLeft + dx));
        dragSession.currentLeft = currentLeft;
        hostStyle().setProperty('left', `${currentLeft}px`, 'important');
        const targetSide = currentLeft + activeWidth / 2 < innerWidth / 2 ? 'left' : 'right';
        if (dragPreview) {
          dragPreview.style.removeProperty('left');
          dragPreview.style.removeProperty('right');
          dragPreview.style.setProperty(targetSide, '0', 'important');
        }
      },
      end: (dx, cancel) => {
        const previousSide = activeSide;
        const currentLeft =
          dragSession.startLeft == null
            ? previousSide === 'right'
              ? Math.max(0, innerWidth - activeWidth)
              : 0
            : Math.max(0, Math.min(innerWidth - activeWidth, dragSession.startLeft + dx));
        dragPreview?.remove();
        dragPreview = null;
        dragSession.startLeft = null;
        const targetSide =
          cancel || Math.abs(dx) < 16 ? previousSide : currentLeft + activeWidth / 2 < innerWidth / 2 ? 'left' : 'right';
        dockTo(targetSide);
        if (targetSide !== previousSide) void message('panel-side', { side: targetSide });
      },
    };
    if (!messageData.automatic) {
      setTimeout(() => void inspect(), 250);
    }
  }
  globalThis.__nuteggPanelMessage = (data, sender, respond) => {
    if (sender.id !== chrome.runtime.id) return;
    if (data.action === 'nutegg-panel-show') {
      show(data);
      respond({ ok: true });
    }
    if (data.action === 'nutegg-panel-hide') {
      remove();
      respond({ ok: true });
    }
    if (data.action === 'capture-navigation') {
      settledKey = '';
      schedule();
    }
    return ['nutegg-panel-show', 'nutegg-panel-hide'].includes(data.action);
  };
  new MutationObserver(records => {
    let href = '';
    try {
      href = location.href;
    } catch {
      return;
    }
    if (host || settledKey === NutEggPageIdentity.capturePageKey(href)) return;
    if (
      records.some(
        record =>
          !record.target.closest?.('[data-nutegg-ui]') &&
          [...record.addedNodes, ...record.removedNodes].some(node => !node.hasAttribute?.('data-nutegg-ui'))
      )
    )
      schedule();
  }).observe(document.documentElement, { subtree: true, childList: true });
  setInterval(() => {
    if (lastUrl !== location.href) {
      const changed = NutEggPageIdentity.capturePageKey(lastUrl) !== NutEggPageIdentity.capturePageKey(location.href);
      lastUrl = location.href;
      epoch++;
      if (changed) {
        settledKey = '';
        prefetchingKey = '';
        remove();
      }
      schedule();
    }
  }, 750);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !host && settledKey !== NutEggPageIdentity.capturePageKey(location.href)) schedule();
  });
  window.addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow || !dragSession) return;
    const data = event.data;
    if (data?.action === 'nutegg-panel-drag-start') dragSession.start();
    if (data?.action === 'nutegg-panel-drag-move') dragSession.move(Number(data.dx) || 0);
    if (data?.action === 'nutegg-panel-drag-end') dragSession.end(Number(data.dx) || 0, !!data.cancel);
  });
  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes.panelSettings?.newValue || !pageLayout) return;
    const next = changes.panelSettings.newValue;
    lastSettings = next;
    if (next.side) applyHostSide?.(next.side);
    if (next.layoutMode) pageLayout.setLayoutMode?.(next.layoutMode);
  });
  schedule();
})();
