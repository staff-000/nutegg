const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const videoSpeedShared = require(path.resolve(__dirname, '../src/content/video-speed-shared.js'));
const {
  isSupportedSpeedOverlayHost,
  findMountTarget,
  findPlayerContainer,
} = require(path.resolve(__dirname, '../src/content/video-speed-overlay.js'));

const {
  CaptureViewComponent,
  VIDEO_SPEED_STOPS,
  rateToVideoSpeedIndex,
  videoSpeedIndexToRate,
  formatVideoSpeed,
  getVideoSpeedColors,
  applyVideoSpeedColors,
  isVideoView,
  shouldShowPanelVideoSpeed,
} = require(path.resolve(__dirname, '../src/popup/ui/capture-view.js'));
const { ResultsViewComponent } = require(path.resolve(__dirname, '../src/popup/ui/results-view.js'));

// Load CaptureViewComponent helpers into globalThis.NutEggUI for ResultsViewComponent
globalThis.NutEggUI = globalThis.NutEggUI || {};
Object.assign(globalThis.NutEggUI, {
  CaptureViewComponent,
  VIDEO_SPEED_STOPS,
  rateToVideoSpeedIndex,
  videoSpeedIndexToRate,
  formatVideoSpeed,
  getVideoSpeedColors,
  applyVideoSpeedColors,
  isVideoView,
});

function loadPopupHtmlDom() {
  const html = fs.readFileSync(path.resolve(__dirname, '../src/popup/popup.html'), 'utf8');
  return new JSDOM(html, { url: 'chrome-extension://test-id/src/popup/popup.html' });
}

describe('Video Speed Adjuster', () => {
  it('panel speed shortcuts preserve message input, rich editors, shadow fields, and IME composition', () => {
    const { InteractionAction } = require('../src/popup/action/interaction.js');
    const dom = new JSDOM('<input><textarea></textarea><div contenteditable="true"><span>Message</span></div><div role="textbox"><span>Editor</span></div>');
    const doc = dom.window.document;
    const host = doc.createElement('div'); doc.body.append(host);
    host.attachShadow({ mode: 'open' }).innerHTML = '<input>';
    const action = new InteractionAction({ tabStateManager: { viewModel: () => ({ playbackPosition: { type: 'video' } }) } });
    const changes = [];
    action.adjustPlaybackRate = delta => changes.push(delta);
    doc.addEventListener('keydown', event => action.handlePlaybackSpeedShortcut(event));
    const targets = [...doc.querySelectorAll('input,textarea,[contenteditable] span,[role="textbox"] span'), host.shadowRoot.querySelector('input')];
    for (const target of targets) {
      for (const key of ['+', '-', '=', '_']) {
        assert.equal(target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true })), true);
      }
    }
    doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: '+', isComposing: true }));
    assert.deepEqual(changes, []);
    doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: '+', cancelable: true }));
    doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: '-', cancelable: true }));
    assert.deepEqual(changes, [0.25, -0.25]);
    dom.window.close();
  });

  it('supports piecewise 0.25x to 16x speed stops and formatting', () => {
    assert.equal(VIDEO_SPEED_STOPS[0], 0.25);
    assert.equal(VIDEO_SPEED_STOPS[VIDEO_SPEED_STOPS.length - 1], 16);
    assert.equal(videoSpeedIndexToRate(rateToVideoSpeedIndex(1)), 1);
    assert.equal(videoSpeedIndexToRate(rateToVideoSpeedIndex(2.5)), 2.5);
    assert.equal(videoSpeedIndexToRate(rateToVideoSpeedIndex(16)), 16);
    assert.equal(formatVideoSpeed(1), '1x');
    assert.equal(formatVideoSpeed(1.25), '1.25x');
    assert.equal(formatVideoSpeed(16), '16x');
  });

  it('detects video views and hides on non-video pages', () => {
    assert.equal(isVideoView({ url: 'https://example.com/article' }), false);
    assert.equal(isVideoView({ extractedContent: { sourceType: 'article', url: 'https://example.com/post' } }), false);
    assert.equal(isVideoView({ playbackPosition: { type: 'video', playbackRate: 1.5 } }), true);
    assert.equal(isVideoView({ extractedContent: { isVideo: true, sourceType: 'youtube' } }), true);
    assert.equal(isVideoView({ extractedContent: { mediaType: 'video', sourceType: 'bilibili' } }), true);
  });

  it('renders, drags up to 16x, and resets to 1x in CaptureViewComponent and ResultsViewComponent', () => {
    const dom = loadPopupHtmlDom();
    const doc = dom.window.document;
    const capture = new CaptureViewComponent(doc);
    const results = new ResultsViewComponent(doc);

    // Non-video view keeps controls hidden
    const articleView = { extractedContent: { sourceType: 'article', url: 'https://example.com/a' } };
    capture.updateVideoSpeed(articleView, 2);
    results.updateVideoSpeed(articleView, 2);
    assert.equal(doc.getElementById('capture-video-speed').classList.contains('hidden'), true);
    assert.equal(doc.getElementById('result-video-speed').classList.contains('hidden'), true);

    const pendingVideo = { extractedContent: { isVideo: true, sourceType: 'bilibili' } };
    capture.updateVideoSpeed(pendingVideo, 1.5);
    results.updateVideoSpeed(pendingVideo, 1.5);
    assert.equal(doc.getElementById('capture-video-speed-text').textContent, '—');
    assert.equal(doc.getElementById('result-video-speed-text').textContent, '—');

    // Video view shows preferred/live speed
    const videoView = {
      playbackPosition: { type: 'video', currentTime: 10, duration: 100, playbackRate: 2.5 },
      extractedContent: { isVideo: true, sourceType: 'youtube' },
    };
    capture.updateVideoSpeed(videoView, 1.5);
    results.updateVideoSpeed(videoView, 1.5);
    assert.equal(doc.getElementById('capture-video-speed').classList.contains('hidden'), false);
    assert.equal(doc.getElementById('result-video-speed').classList.contains('hidden'), false);
    assert.equal(doc.getElementById('capture-video-speed-text').textContent, '2.5x');
    assert.equal(doc.getElementById('result-video-speed-text').textContent, '2.5x');

    // Drag slider to max (16x)
    const captureChanges = [];
    const resultChanges = [];
    capture.onSpeedChange = r => captureChanges.push(r);
    results.onSpeedChange = r => resultChanges.push(r);

    const cSlider = doc.getElementById('capture-video-speed-slider');
    cSlider.value = String(VIDEO_SPEED_STOPS.length - 1);
    cSlider.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    assert.equal(doc.getElementById('capture-video-speed-text').textContent, '16x');
    assert.deepEqual(captureChanges, [16]);

    // Click badge to reset to 1x
    doc.getElementById('result-video-speed-reset').click();
    assert.equal(doc.getElementById('result-video-speed-text').textContent, '1x');
    assert.deepEqual(resultChanges, [1]);
  });

  it('InteractionAction.setPlaybackRate persists preferredVideoSpeed and updates tabStateManager', async () => {
    globalThis.chrome = { storage: { local: { set: () => {} } } };
    const { SettingsState } = require(path.resolve(__dirname, '../src/popup/state/settings-state.js'));
    const { TabStateManager } = require(path.resolve(__dirname, '../src/popup/state/tab-state.js'));
    const InteractionAction = (() => {
      const code = fs.readFileSync(path.resolve(__dirname, '../src/popup/action/interaction.js'), 'utf8');
      const fn = new Function(`${code}\nreturn InteractionAction;`);
      return fn();
    })();

    const settings = new SettingsState();
    const store = new TabStateManager();
    store.activateTab(42);

    const calls = [];
    const pageExtractor = {
      setPlaybackRate: async (tabId, rate) => {
        calls.push({ tabId, rate });
        return { success: true, type: 'video', currentTime: 5, duration: 120, playbackRate: rate };
      },
      getPagePosition: async () => ({
        success: true,
        type: 'video',
        currentTime: 6,
        duration: 120,
        playbackRate: settings.preferredVideoSpeed,
      }),
    };

    const action = new InteractionAction({ tabStateManager: store, pageExtractor, settings, ui: {} });
    assert.equal(await action.setPlaybackRate(0.1), false);
    assert.equal(await action.setPlaybackRate(20), false);

    assert.equal(await action.setPlaybackRate(8), true);
    assert.equal(settings.preferredVideoSpeed, 8);
    assert.deepEqual(calls, [{ tabId: 42, rate: 8 }]);
    assert.equal(store.getTab(42).playbackPosition.playbackRate, 8);

    await action.adjustPlaybackRate(0.25);
    assert.equal(settings.preferredVideoSpeed, 8.25);
    await action.adjustPlaybackRate(-0.25);
    assert.equal(settings.preferredVideoSpeed, 8);
  });

  it('computes speed-based colors across purple (<1x), green-yellow (1x-3x), orange-red (5x-8x), and dark-red (8x+)', () => {
    const parseRgb = str => str.match(/\d+/g).map(Number);
    const sub1 = parseRgb(getVideoSpeedColors(0.5).accent); // purple: blue > green
    assert.ok(sub1[2] > sub1[1] && sub1[0] > sub1[1]);

    const at1 = parseRgb(getVideoSpeedColors(1).accent); // green: G > R and G > B
    assert.ok(at1[1] > at1[0] && at1[1] > at1[2]);

    const at3 = parseRgb(getVideoSpeedColors(3).accent); // yellow: R and G high, B low
    assert.ok(at3[0] > 180 && at3[1] > 120 && at3[2] < 30);

    const at5 = parseRgb(getVideoSpeedColors(5).accent); // orange: R > G > B
    assert.ok(at5[0] > at5[1] && at5[1] > at5[2]);

    const at8 = parseRgb(getVideoSpeedColors(8).accent); // red
    const at16 = parseRgb(getVideoSpeedColors(16).accent); // dark-red (darker R than 8x)
    assert.ok(at8[0] > 180 && at16[0] < at8[0] && at16[0] > at16[1]);
  });

  it('hides panel speed widget when videoSpeedEnabled is false and exposes hover shortcut tooltip on panel controls', () => {
    const dom = loadPopupHtmlDom();
    const doc = dom.window.document;
    const capture = new CaptureViewComponent(doc);
    const results = new ResultsViewComponent(doc);

    const videoView = {
      playbackPosition: { type: 'video', currentTime: 10, duration: 100, playbackRate: 1.5 },
      extractedContent: { isVideo: true, sourceType: 'youtube' },
    };

    capture.updateVideoSpeed(videoView, 1.5, false);
    results.updateVideoSpeed(videoView, 1.5, false);
    assert.equal(doc.getElementById('capture-video-speed').classList.contains('hidden'), true);
    assert.equal(doc.getElementById('result-video-speed').classList.contains('hidden'), true);

    assert.equal(doc.getElementById('capture-video-speed-reset').getAttribute('data-i18n-title'), 'videoSpeedResetHint');
    assert.equal(doc.getElementById('capture-video-speed-slider').getAttribute('data-i18n-title'), 'videoSpeedSliderHint');
    assert.equal(doc.getElementById('result-video-speed-reset').getAttribute('data-i18n-title'), 'videoSpeedResetHint');
    assert.equal(doc.getElementById('result-video-speed-slider').getAttribute('data-i18n-title'), 'videoSpeedSliderHint');
  });

  it('mounts Shadow DOM speed slider on YouTube and Bilibili players, shows shortcut tooltip, and respects settings toggles', async () => {
    assert.equal(isSupportedSpeedOverlayHost('www.youtube.com'), true);
    assert.equal(isSupportedSpeedOverlayHost('www.bilibili.com'), true);
    assert.equal(isSupportedSpeedOverlayHost('example.com'), false);

    const dom = new JSDOM(
      `<!DOCTYPE html><html><body>
        <div id="movie_player">
          <video src="https://example.com/video.mp4"></video>
        </div>
      </body></html>`,
      { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', runScripts: 'outside-only' }
    );
    const doc = dom.window.document;
    const video = doc.querySelector('video');
    Object.defineProperty(video, 'readyState', { value: 4, configurable: true });
    assert.equal(findPlayerContainer(doc)?.id, 'movie_player');

    const listeners = [];
    const sentMessages = [];
    const chromeMock = {
      runtime: {
        getURL: p => `chrome-extension://test-id/${p}`,
        sendMessage: async msg => {
          sentMessages.push(msg);
          if (msg.action === 'get-video-speed-settings') {
            return {
              settings: { videoSpeedEnabled: true, videoSpeedOnPageEnabled: true, preferredVideoSpeed: 1.5 },
            };
          }
          return { success: true };
        },
        onMessage: { addListener: fn => listeners.push(fn) },
      },
    };

    const sharedCode = fs.readFileSync(path.resolve(__dirname, '../src/content/video-speed-shared.js'), 'utf8');
    const overlayCode = fs.readFileSync(path.resolve(__dirname, '../src/content/video-speed-overlay.js'), 'utf8');
    const context = dom.getInternalVMContext();
    context.chrome = chromeMock;

    vm.runInContext(sharedCode, context);
    vm.runInContext(overlayCode, context);
    await new Promise(r => setTimeout(r, 20));

    const host = doc.getElementById('nutegg-video-speed-overlay');
    assert.ok(host && host.shadowRoot, 'On-page speed overlay should mount with Shadow DOM');
    assert.equal(video.playbackRate, 1.5, 'Should auto-apply preferredVideoSpeed on initial load');
    assert.equal(host.shadowRoot.querySelector('.rate-text').textContent, '1.5x');

    // Hovering each sub-control shows its specific fixed-position hint in the portaled tooltip host
    const openBtn = host.shadowRoot.querySelector('.nutegg-open-btn');
    const resetBtn = host.shadowRoot.querySelector('.badge');
    openBtn.dispatchEvent(new dom.window.Event('pointerenter'));
    const tipHost = doc.getElementById('nutegg-video-speed-overlay-tooltip');
    assert.ok(tipHost && tipHost.shadowRoot, 'Tooltip should be portaled to documentElement');
    const tip = tipHost.shadowRoot.querySelector('.tooltip');
    assert.match(tip.textContent, /Open NutEgg side panel/i);
    resetBtn.dispatchEvent(new dom.window.Event('pointerenter'));
    assert.match(tip.textContent, /Reset speed to 1x/i);
    host.shadowRoot.querySelector('.slider').dispatchEvent(new dom.window.Event('pointerenter'));
    assert.match(tip.textContent, /\+ \/ -/);

    // Click NutEgg icon button to open panel
    assert.ok(openBtn, 'NutEgg open button should be rendered on the left of the speed pill');
    assert.match(openBtn.querySelector('img')?.src || '', /icons\/icon32\.png$/);
    openBtn.click();
    assert.ok(sentMessages.some(m => m.action === 'panel-host-open'));

    // Drag slider to 16x
    const slider = host.shadowRoot.querySelector('.slider');
    slider.value = String(videoSpeedShared.VIDEO_SPEED_STOPS.length - 1);
    slider.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    assert.equal(video.playbackRate, 16);
    assert.equal(host.shadowRoot.querySelector('.rate-text').textContent, '16x');
    assert.ok(sentMessages.some(m => m.action === 'set-preferred-video-speed' && m.rate === 16));

    // Turn off on-page slider via live settings broadcast
    doc.defaultView.dispatchEvent(
      new doc.defaultView.CustomEvent('nutegg:speed-settings-updated', {
        detail: { videoSpeedEnabled: true, videoSpeedOnPageEnabled: false, preferredVideoSpeed: 16 },
      })
    );
    assert.equal(doc.getElementById('nutegg-video-speed-overlay'), null, 'Overlay should unmount when turned off');
  });

  it('mounts inline next to Bilibili .video-info-detail-content, YouTube #title, and top-right overlay on other sites when enabled', () => {
    const biliDom = new JSDOM(
      `<div class="video-info-detail-content"><span>views</span></div>
       <div class="bpx-player-video-area"><video src="https://example.com/v.mp4"></video></div>`,
      { url: 'https://www.bilibili.com/video/BV1xx411c7mD' }
    );
    const biliTarget = findMountTarget(biliDom.window.document, 'www.bilibili.com', false);
    assert.equal(biliTarget?.mode, 'inline');
    assert.equal(biliTarget?.container.className, 'video-info-detail-content');

    const ytDom = new JSDOM(
      `<div id="above-the-fold"><div id="title"><h1>Video Title</h1></div></div>
       <div id="movie_player"><video src="https://example.com/v.mp4"></video></div>`,
      { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
    );
    const ytTarget = findMountTarget(ytDom.window.document, 'www.youtube.com', false);
    assert.equal(ytTarget?.mode, 'inline');
    assert.equal(ytTarget?.container.id, 'title');

    const genericDom = new JSDOM(
      `<div id="player-box"><video src="https://example.com/v.mp4"></video></div>`,
      { url: 'https://vimeo.com/123456' }
    );
    assert.equal(findMountTarget(genericDom.window.document, 'vimeo.com', false), null);
    const genericTarget = findMountTarget(genericDom.window.document, 'vimeo.com', true);
    assert.equal(genericTarget?.mode, 'overlay');
    assert.equal(genericTarget?.container.id, 'player-box');

    const xDom = new JSDOM(
      `<div data-testid="videoPlayer"><div class="inner"><video src="https://video.twimg.com/v.mp4"></video></div><div class="overlay"></div></div>`,
      { url: 'https://x.com/user/status/123' }
    );
    const xTarget = findMountTarget(xDom.window.document, 'x.com', true);
    assert.equal(xTarget?.mode, 'overlay');
    assert.equal(xTarget?.container.getAttribute('data-testid'), 'videoPlayer');
  });

  it('hides panel speed slider when the slider is already shown on the main page', () => {
    const ytView = {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      extractedContent: { isVideo: true, sourceType: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    };
    const otherVideoView = {
      url: 'https://vimeo.com/123456',
      playbackPosition: { type: 'video', playbackRate: 1 },
    };
    assert.equal(
      shouldShowPanelVideoSpeed(ytView, { videoSpeedEnabled: true, videoSpeedOnPageEnabled: true, videoSpeedAllSitesEnabled: false }),
      false
    );
    assert.equal(
      shouldShowPanelVideoSpeed(ytView, { videoSpeedEnabled: true, videoSpeedOnPageEnabled: false, videoSpeedAllSitesEnabled: false }),
      true
    );
    assert.equal(
      shouldShowPanelVideoSpeed(otherVideoView, { videoSpeedEnabled: true, videoSpeedOnPageEnabled: true, videoSpeedAllSitesEnabled: false }),
      true
    );
    assert.equal(
      shouldShowPanelVideoSpeed(otherVideoView, { videoSpeedEnabled: true, videoSpeedOnPageEnabled: true, videoSpeedAllSitesEnabled: true }),
      false
    );
    assert.equal(
      shouldShowPanelVideoSpeed({ ...otherVideoView, playbackPosition: { type: 'video', onPageSpeedOverlay: true } }, { videoSpeedEnabled: true, videoSpeedOnPageEnabled: false }),
      false
    );
  });

  it('supports Shift+2/3/4/5 shortcuts for 2x/3x/4x/5x in panel InteractionAction', async () => {
    globalThis.chrome = { storage: { local: { set: () => {} } } };
    const { SettingsState } = require(path.resolve(__dirname, '../src/popup/state/settings-state.js'));
    const { TabStateManager } = require(path.resolve(__dirname, '../src/popup/state/tab-state.js'));
    const InteractionAction = (() => {
      const code = fs.readFileSync(path.resolve(__dirname, '../src/popup/action/interaction.js'), 'utf8');
      const fn = new Function(`${code}\nreturn InteractionAction;`);
      return fn();
    })();

    const settings = new SettingsState();
    const store = new TabStateManager();
    store.activateTab(42);
    store.dispatch({ type: 'playbackPosition', tabId: 42, pageGeneration: store.getTab(42).pageGeneration, position: { type: 'video', playbackRate: 1 } });

    const setCalls = [];
    const pageExtractor = {
      setPlaybackRate: async (_tabId, rate) => {
        setCalls.push(rate);
        return { success: true, type: 'video', playbackRate: rate };
      },
      getPagePosition: async () => null,
    };
    const action = new InteractionAction({ tabStateManager: store, pageExtractor, settings, ui: {} });

    const fire = (key, code) => {
      let prevented = false;
      action.handlePlaybackSpeedShortcut({
        key,
        code,
        shiftKey: true,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        defaultPrevented: false,
        isComposing: false,
        composedPath: () => [],
        preventDefault: () => {
          prevented = true;
        },
      });
      return prevented;
    };

    assert.equal(fire('@', 'Digit2'), true);
    assert.equal(fire('#', 'Digit3'), true);
    assert.equal(fire('$', 'Digit4'), true);
    assert.equal(fire('%', 'Digit5'), true);
    await new Promise(r => setTimeout(r, 10));
    assert.deepEqual(setCalls, [2, 3, 4, 5]);
  });
});

