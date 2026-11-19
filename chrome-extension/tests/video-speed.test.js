const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

const {
  CaptureViewComponent,
  VIDEO_SPEED_STOPS,
  rateToVideoSpeedIndex,
  videoSpeedIndexToRate,
  formatVideoSpeed,
  getVideoSpeedColors,
  applyVideoSpeedColors,
  isVideoView,
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
});

