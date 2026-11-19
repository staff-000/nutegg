// ============================================================
// NutEgg Popup UI — Capture View Component
// ============================================================

const VIDEO_SPEED_STOPS = Object.freeze([
  0.25, 0.5, 0.75, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  16,
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
    // < 1x: purple
    const t = Math.max(0, Math.min(1, (v - 0.25) / 0.75));
    rgb = _lerpRgb([109, 40, 217], [147, 51, 234], t);
  } else if (v <= 3) {
    // 1x - 3x: green to yellow
    const t = (v - 1) / 2;
    rgb = _lerpRgb([22, 163, 74], [202, 138, 4], t);
  } else if (v <= 5) {
    // 3x - 5x: yellow to orange
    const t = (v - 3) / 2;
    rgb = _lerpRgb([202, 138, 4], [234, 88, 12], t);
  } else if (v <= 8) {
    // 5x - 8x: orange to red
    const t = (v - 5) / 3;
    rgb = _lerpRgb([234, 88, 12], [220, 38, 38], t);
  } else {
    // 8x+: red to dark-red
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

function isVideoView(view) {
  if (!view || typeof view !== 'object') return false;
  if (view.playbackPosition?.type === 'video') return true;
  const content = view.extractedContent || view.stage1Payload;
  if (content?.isVideo === true || content?.mediaType === 'video') return true;
  const sourceType = String(content?.sourceType || view.analysisResult?.sourceType || '').toLowerCase();
  if (['youtube', 'bilibili', 'douyin', 'tiktok'].includes(sourceType)) return true;
  const url = content?.url || view.url || '';
  if (url && globalThis.NutEggAI?.getVideoIdentity?.(url)) return true;
  return false;
}

class CaptureViewComponent {
  constructor(root = document) {
    this.root = root;
    this.pageTitle = root.getElementById('page-title');
    this.pageUrl = root.getElementById('page-url');
    this.pageType = root.getElementById('page-type');
    this.pageAuthorEl = root.getElementById('page-author');
    this.pagePublishedEl = root.getElementById('page-published');
    this.pageWordCountEl = root.getElementById('page-word-count');
    this.pageCaptionSourceEl = root.getElementById('page-caption-source');
    this.videoSpeedControl = root.getElementById('capture-video-speed');
    this.videoSpeedResetBtn = root.getElementById('capture-video-speed-reset');
    this.videoSpeedText = root.getElementById('capture-video-speed-text');
    this.videoSpeedSlider = root.getElementById('capture-video-speed-slider');
    this._draggingSpeed = false;
    this.contentPreview = root.getElementById('content-preview');
    this.refreshBtn = root.getElementById('refresh-btn');
    this.previewRefreshBtn = root.getElementById('preview-refresh-btn');
    this.previewRefreshBtn?.addEventListener('click', () => {
      if (this.refreshBtn && !this.refreshBtn.disabled) this.refreshBtn.click();
    });
    this.transcriptRefreshHint = root.getElementById('transcript-refresh-hint');
    this.questionsToggle = root.getElementById('questions-toggle');
    this.questionsArea = root.getElementById('questions-area');
    this.customQuestionsEl = root.getElementById('custom-questions');
    this.captureScopeContainer = root.getElementById('capture-questions-scope');
    this.questionsScope = 'within';
    this._bindScopeChips();
    this._bindVideoSpeed();
  }

  _bindVideoSpeed() {
    if (this.videoSpeedSlider) {
      const handleInput = () => {
        const rate = videoSpeedIndexToRate(this.videoSpeedSlider.value);
        if (this.videoSpeedText) this.videoSpeedText.textContent = formatVideoSpeed(rate);
        applyVideoSpeedColors(this.videoSpeedControl, rate);
        if (typeof this.onSpeedChange === 'function') this.onSpeedChange(rate);
      };
      this.videoSpeedSlider.addEventListener('pointerdown', () => {
        this._draggingSpeed = true;
      });
      this.videoSpeedSlider.addEventListener('pointerup', () => {
        this._draggingSpeed = false;
      });
      this.videoSpeedSlider.addEventListener('blur', () => {
        this._draggingSpeed = false;
      });
      this.videoSpeedSlider.addEventListener('input', handleInput);
      this.videoSpeedSlider.addEventListener('change', () => {
        this._draggingSpeed = false;
        handleInput();
      });
    }
    if (this.videoSpeedResetBtn) {
      this.videoSpeedResetBtn.addEventListener('click', () => {
        if (this.videoSpeedSlider) this.videoSpeedSlider.value = String(rateToVideoSpeedIndex(1));
        if (this.videoSpeedText) this.videoSpeedText.textContent = '1x';
        applyVideoSpeedColors(this.videoSpeedControl, 1);
        if (typeof this.onSpeedChange === 'function') this.onSpeedChange(1);
      });
    }
  }

  updateVideoSpeed(view, preferredRate = null) {
    if (!this.videoSpeedControl) return;
    if (!isVideoView(view)) {
      this.videoSpeedControl.classList.add('hidden');
      return;
    }
    this.videoSpeedControl.classList.remove('hidden');
    if (this._draggingSpeed) return;
    const liveRate = view?.playbackPosition?.type === 'video' ? Number(view.playbackPosition.playbackRate) : NaN;
    // A saved preference is not evidence of the current player's speed.
    const rate = Number.isFinite(liveRate) && liveRate > 0 ? liveRate : null;
    if (this.videoSpeedText) this.videoSpeedText.textContent = rate == null ? '—' : formatVideoSpeed(rate);
    applyVideoSpeedColors(this.videoSpeedControl, rate);
    if (this.videoSpeedSlider) {
      const idx = String(rateToVideoSpeedIndex(rate));
      if (this.videoSpeedSlider.value !== idx) this.videoSpeedSlider.value = idx;
    }
  }

  _bindScopeChips() {
    if (!this.captureScopeContainer) return;
    if (this.captureScopeContainer.tagName === 'SELECT') {
      this.captureScopeContainer.addEventListener('change', e => {
        this.setQuestionsScope(e.target.value);
        if (typeof this.onScopeChange === 'function') {
          this.onScopeChange(e.target.value);
        }
      });
    } else {
      this.captureScopeContainer.addEventListener('click', e => {
        const chip = e.target.closest('.scope-chip');
        if (!chip || !chip.dataset.scope) return;
        this.setQuestionsScope(chip.dataset.scope);
        if (typeof this.onScopeChange === 'function') {
          this.onScopeChange(chip.dataset.scope);
        }
      });
    }
  }

  getQuestionsScope() {
    if (this.captureScopeContainer && this.captureScopeContainer.tagName === 'SELECT') {
      return this.captureScopeContainer.value || this.questionsScope || 'within';
    }
    return this.questionsScope || 'within';
  }

  setQuestionsScope(scope) {
    this.questionsScope = scope === 'beyond' ? 'beyond' : 'within';
    if (this.captureScopeContainer) {
      if (this.captureScopeContainer.tagName === 'SELECT') {
        this.captureScopeContainer.value = this.questionsScope;
      }
      const chips = this.captureScopeContainer.querySelectorAll('.scope-chip');
      chips.forEach(c => {
        c.classList.toggle('active', c.dataset.scope === this.questionsScope);
      });
    }
  }

  render(firstArg, options = {}) {
    const isSession = Boolean(
      firstArg &&
      (firstArg.extractedContent !== undefined ||
        firstArg.currentTabLoading !== undefined ||
        firstArg.isAnalyzing !== undefined)
    );
    const content = isSession ? firstArg.extractedContent : firstArg;
    const isSessionLoading = isSession && Boolean(firstArg.currentTabLoading);
    const isSessionAnalyzing = isSession && Boolean(firstArg.isAnalyzing);

    if (this.pageTitle) this.pageTitle.textContent = content?.title || options.defaultTitle || t('untitled');
    if (this.pageUrl) this.pageUrl.textContent = content?.url || options.defaultUrl || '';
    if (this.pageType) this.pageType.textContent = content?.sourceType || options.defaultType || '';

    if (isSessionLoading) {
      this.setPreviewText(t('retrievingPageContent'));
      this.clearAuthorAndPublished();
    } else {
      this.setPreviewContent(content, options.previewPlaceholder);
      this.showProvenance(content?.metadata || {}, content?.content, content?.discussion);
    }

    if (isSession) {
      this.setRefreshDisabled(isSessionLoading || isSessionAnalyzing);
    }
  }

  showProvenance(metadata = {}, rawContent = '', discussion = null) {
    if (this.pageCaptionSourceEl) {
      const sourceKeys = {
        page_tracks: 'captionSourcePageTracks',
        watch_page: 'captionSourceWatchPage',
        innertube: 'captionSourcePlayerApi',
        player_tracks: 'captionSourceLivePlayer',
        transcript_panel: 'captionSourceTranscriptPanel',
      };
      const key = Object.hasOwn(sourceKeys, metadata.caption_source) ? sourceKeys[metadata.caption_source] : null;
      this.pageCaptionSourceEl.textContent = key ? t('captionSourceTag', { source: t(key) }) : '';
      if (key) this.pageCaptionSourceEl.classList.remove('hidden');
      else this.pageCaptionSourceEl.classList.add('hidden');
    }
    const author = metadata.author || metadata.channel || metadata.handle || '';
    if (this.pageAuthorEl) {
      this.pageAuthorEl.textContent = author ? `✍️ ${author}` : '';
    }
    if (this.pagePublishedEl) {
      if (metadata.published) {
        const d = new Date(metadata.published);
        const formatted = isNaN(d.getTime())
          ? metadata.published
          : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        this.pagePublishedEl.textContent = `📅 ${formatted}`;
      } else {
        this.pagePublishedEl.textContent = '';
      }
    }
    if (this.pageWordCountEl) {
      const text = rawContent || metadata?.content || '';
      const count =
        globalThis.NutEggHelpers?.countCapturedWords?.({ content: text, discussion }) ??
        text.trim().split(/\s+/).filter(Boolean).length;
      if (count) {
        this.pageWordCountEl.textContent = `📝 ${t('wordCount', { count: count.toLocaleString() })}`;
        this.pageWordCountEl.classList.remove('hidden');
      } else {
        this.pageWordCountEl.textContent = '';
        this.pageWordCountEl.classList.add('hidden');
      }
    }
  }

  setPreviewContent(content, placeholder) {
    if (content?.url !== this.previewUrl) {
      this.previewUrl = content?.url;
      if (this.contentPreview) this.contentPreview.scrollTop = 0;
    }
    const items = content?.discussion?.items || [];
    const comments = items.length
      ? '\n\n' +
        t('discussionPreview', { count: items.length }) +
        '\n' +
        items
          .map(
            (item, index) =>
              `${index + 1}. ${item.parentId ? '↳ ' : ''}👤 ${this.commentAuthor(item)}\n${item.text}` +
              (item.reaction?.count != null
                ? '\n' +
                  t(item.reaction.kind === 'score' ? 'discussionScore' : 'discussionLikes', {
                    count: item.reaction.count,
                  })
                : '')
          )
          .join('\n\n') +
        (content.discussion.truncated ? '\n\n' + t('discussionTruncated', { count: items.length }) : '')
      : '';
    const transcriptMissing = Boolean(globalThis.NutEggHelpers?.isTranscriptBlocked?.(content));
    const warning = transcriptMissing
      ? [t('transcriptRefreshPreview'), globalThis.NutEggHelpers?.getExtractionWarning?.(content)]
          .filter(Boolean)
          .join(' ')
      : !content?.content?.trim() && !(content?.discussion?.kind === 'forum' && items.some(item => item.text?.trim()))
        ? t('contentRefreshPreview')
        : globalThis.NutEggHelpers?.getExtractionWarning?.(content);
    this.setPreviewText(
      (content?.content || placeholder || t('noContentExtracted')) + comments,
      warning,
      Boolean(warning)
    );
  }

  commentAuthor(item) {
    if (typeof item.author === 'string' && item.author.trim()) return item.author.trim();
    // Older captures or avatar-only layouts may still expose a named profile URL.
    try {
      const profile = new URL(item.authorId);
      if (/^https?:$/.test(profile.protocol)) {
        const match = profile.pathname.match(/^\/(@[^/]+)(?:\/|$)|^\/(?:user|u|people)\/([^/]+)(?:\/|$)/);
        if (match) return decodeURIComponent(match[1] || match[2]);
      }
    } catch {
      /* No usable profile name. */
    }
    return t('discussionUnknownAuthor');
  }

  setPreviewText(text, warning = null, needsRefresh = false) {
    this.previewRefreshBtn?.classList.toggle('hidden', !needsRefresh);
    if (this.transcriptRefreshHint) {
      this.transcriptRefreshHint.textContent = needsRefresh ? t('contentRefreshHint') : '';
      this.transcriptRefreshHint.classList.toggle('hidden', !needsRefresh);
    }
    if (!this.contentPreview) return;
    this.contentPreview.classList.toggle('incomplete', !!warning);
    if (warning) text = `⚠️ ${warning}\n\n${text}`;
    // Bring a newly detected fetch problem into view after refreshing a scrolled preview.
    const scrollTop = warning && warning !== this.previewWarning ? 0 : this.contentPreview.scrollTop || 0;
    this.previewWarning = warning;
    const helpers = globalThis.NutEggHelpers;
    if (helpers?.escapeHtml && helpers?.linkifyTimestamps) {
      const escaped = helpers.escapeHtml(String(text ?? ''));
      const html = helpers.linkifyTimestamps(escaped);
      if (html !== escaped) {
        this.contentPreview.innerHTML = html;
        this.contentPreview.scrollTop = scrollTop;
        return;
      }
    }
    this.contentPreview.textContent = text;
    this.contentPreview.scrollTop = scrollTop;
  }

  clearProvenance() {
    if (this.pageCaptionSourceEl) {
      this.pageCaptionSourceEl.textContent = '';
      this.pageCaptionSourceEl.classList.add('hidden');
    }
    if (this.pageAuthorEl) this.pageAuthorEl.textContent = '';
    if (this.pagePublishedEl) this.pagePublishedEl.textContent = '';
    if (this.pageWordCountEl) {
      this.pageWordCountEl.textContent = '';
      this.pageWordCountEl.classList.add('hidden');
    }
  }

  clearAuthorAndPublished() {
    this.clearProvenance();
  }

  setLoading(text) {
    this.setPreviewText(text || t('retrievingPageContent'));
    this.clearAuthorAndPublished();
  }

  setError(message) {
    this.setPreviewText(message, t('contentRefreshPreview'), true);
    this.clearAuthorAndPublished();
  }

  clear() {
    if (this.pageTitle) this.pageTitle.textContent = t('untitled');
    if (this.pageUrl) this.pageUrl.textContent = '';
    if (this.pageType) this.pageType.textContent = '';
    this.setPreviewText(t('noContentExtracted'));
    this.clearAuthorAndPublished();
  }

  setContent(content, options = {}) {
    this.render(content, options);
  }

  getCustomQuestions() {
    return this.customQuestionsEl?.value || '';
  }

  setCustomQuestions(value) {
    if (this.customQuestionsEl) {
      this.customQuestionsEl.value = value || '';
    }
  }

  getParsedQuestions() {
    const raw = this.getCustomQuestions();
    return raw
      ? raw
          .split('\n')
          .map(q => q.trim())
          .filter(Boolean)
      : [];
  }

  setPageInfo({ title, url, sourceType } = {}) {
    if (title !== undefined && this.pageTitle) this.pageTitle.textContent = title;
    if (url !== undefined && this.pageUrl) this.pageUrl.textContent = url;
    if (sourceType !== undefined && this.pageType) this.pageType.textContent = sourceType;
  }

  getPageUrl() {
    return this.pageUrl?.textContent || '';
  }

  getPageTitle() {
    return this.pageTitle?.textContent || '';
  }

  getPageType() {
    return this.pageType?.textContent || '';
  }

  setRefreshDisabled(disabled) {
    if (this.refreshBtn) this.refreshBtn.disabled = Boolean(disabled);
    if (this.previewRefreshBtn) this.previewRefreshBtn.disabled = Boolean(disabled);
  }

  toggleQuestionsArea() {
    this.questionsArea?.classList.toggle('hidden');
  }
}

const _captureScope = typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this;
_captureScope.NutEggUI = _captureScope.NutEggUI || {};
_captureScope.NutEggUI.CaptureViewComponent = CaptureViewComponent;
_captureScope.NutEggUI.VIDEO_SPEED_STOPS = VIDEO_SPEED_STOPS;
_captureScope.NutEggUI.rateToVideoSpeedIndex = rateToVideoSpeedIndex;
_captureScope.NutEggUI.videoSpeedIndexToRate = videoSpeedIndexToRate;
_captureScope.NutEggUI.formatVideoSpeed = formatVideoSpeed;
_captureScope.NutEggUI.getVideoSpeedColors = getVideoSpeedColors;
_captureScope.NutEggUI.applyVideoSpeedColors = applyVideoSpeedColors;
_captureScope.NutEggUI.isVideoView = isVideoView;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CaptureViewComponent,
    VIDEO_SPEED_STOPS,
    rateToVideoSpeedIndex,
    videoSpeedIndexToRate,
    formatVideoSpeed,
    getVideoSpeedColors,
    applyVideoSpeedColors,
    isVideoView,
  };
}
