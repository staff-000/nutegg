// Shared Video Speed Scale, Formatting, and Color Gradient Helpers (0.25x - 16x)
(function initNutEggVideoSpeedShared(globalScope) {
  'use strict';

  const VIDEO_SPEED_STOPS = Object.freeze([
    0.25, 0.5, 0.75, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    15, 16,
  ]);

  function rateToVideoSpeedIndex(rate) {
    const num = Number(rate);
    if (!Number.isFinite(num) || num <= 0) return 3; // 1x
    let bestIdx = 3;
    let bestDiff = Infinity;
    for (let i = 0; i < VIDEO_SPEED_STOPS.length; i++) {
      const diff = Math.abs(VIDEO_SPEED_STOPS[i] - num);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  function videoSpeedIndexToRate(index) {
    const idx = Math.max(0, Math.min(VIDEO_SPEED_STOPS.length - 1, Math.round(Number(index) || 0)));
    return VIDEO_SPEED_STOPS[idx];
  }

  function formatVideoSpeed(rate) {
    const num = Number(rate);
    if (!Number.isFinite(num) || num <= 0) return '1x';
    return `${Number(num.toFixed(2))}x`;
  }

  function _lerpChannel(a, b, t) {
    return Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
  }

  function _lerpRgb(c1, c2, t) {
    return [_lerpChannel(c1[0], c2[0], t), _lerpChannel(c1[1], c2[1], t), _lerpChannel(c1[2], c2[2], t)];
  }

  function getVideoSpeedColors(rate) {
    const r = Number(rate);
    const v = Number.isFinite(r) && r > 0 ? r : 1;
    let rgb;
    if (v < 1) {
      const t = Math.max(0, Math.min(1, (v - 0.25) / 0.75));
      rgb = _lerpRgb([109, 40, 217], [147, 51, 234], t);
    } else if (v <= 3) {
      const t = (v - 1) / 2;
      rgb = _lerpRgb([22, 163, 74], [202, 138, 4], t);
    } else if (v <= 5) {
      const t = (v - 3) / 2;
      rgb = _lerpRgb([202, 138, 4], [234, 88, 12], t);
    } else if (v <= 8) {
      const t = (v - 5) / 3;
      rgb = _lerpRgb([234, 88, 12], [220, 38, 38], t);
    } else {
      const t = Math.min(1, (v - 8) / 8);
      rgb = _lerpRgb([220, 38, 38], [127, 29, 29], t);
    }
    const [R, G, B] = rgb;
    return {
      accent: `rgb(${R}, ${G}, ${B})`,
      text: `rgb(${Math.max(0, R - 20)}, ${Math.max(0, G - 20)}, ${Math.max(0, B - 20)})`,
      bg: `rgba(${R}, ${G}, ${B}, 0.11)`,
      border: `rgba(${R}, ${G}, ${B}, 0.34)`,
    };
  }

  function applyVideoSpeedColors(controlEl, rate) {
    if (typeof controlEl?.style?.setProperty !== 'function') return;
    const colors = getVideoSpeedColors(rate);
    const idx = rateToVideoSpeedIndex(rate);
    const progress = `${((idx / (VIDEO_SPEED_STOPS.length - 1)) * 100).toFixed(1)}%`;
    controlEl.style.setProperty('--speed-accent', colors.accent);
    controlEl.style.setProperty('--speed-text', colors.text);
    controlEl.style.setProperty('--speed-bg', colors.bg);
    controlEl.style.setProperty('--speed-border', colors.border);
    controlEl.style.setProperty('--speed-progress', progress);
  }

  const exported = {
    VIDEO_SPEED_STOPS,
    rateToVideoSpeedIndex,
    videoSpeedIndexToRate,
    formatVideoSpeed,
    getVideoSpeedColors,
    applyVideoSpeedColors,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
  globalScope.NutEggVideoSpeed = exported;
})(typeof globalThis !== 'undefined' ? globalThis : this);

