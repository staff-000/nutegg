class DiscussionComponent {
  constructor(root = document) { this.root = root; }
  render(view) {
    const d = view.extractedContent?.discussion;
    const enabled = view.enabledSections.discussion === true;
    for (const prefix of ['discussion-capture', 'discussion-reanalyze']) {
      this.root.getElementById(prefix)?.classList.toggle('hidden', !enabled);
      const status = this.root.getElementById(prefix + '-status');
      if (status) status.textContent = view.discussionPending ? t('discussionLoading', { count: d?.items?.length || 0 })
        : d?.status === 'empty' ? t('discussionEmpty') : d?.status === 'unavailable' ? t(d?.reason === 'unsupported' ? 'discussionUnsupported' : 'discussionUnavailable')
        : d?.items?.length ? t('discussionPartial', { count: d.items.length }) : t('discussionNotLoaded');
      const indicator = this.root.getElementById(prefix + '-indicator');
      if (indicator) {
        indicator.classList.toggle('status-loading', Boolean(view.discussionPending));
        indicator.classList.toggle('status-active', !view.discussionPending && Boolean(d?.items?.length));
        indicator.classList.toggle('status-empty', !view.discussionPending && d?.status === 'empty');
      }
      for (const suffix of ['-load', '-refresh']) {
        const button = this.root.getElementById(prefix + suffix);
        if (button) button.disabled = view.discussionPending || view.extractionPending;
      }
    }
    const section = this.root.getElementById('discussion-section'), result = this.root.getElementById('discussion-result');
    if (!section || !result) return;
    section.classList.toggle('hidden', !enabled || !view.analysisResult);
    if (!enabled || !view.analysisResult) { result.innerHTML = ''; return; }
    const analysis = view.analysisResult.discussion;
    if (!analysis || analysis.status !== 'ready') {
      result.textContent = t(!analysis ? 'discussionAnalyzeAgain' : analysis.status === 'no_meaningful' ? 'discussionNoMeaningful'
        : analysis.status === 'unavailable' ? 'discussionUnavailable' : 'discussionNotLoaded');
      return;
    }
    const escape = value => globalThis.NutEggHelpers.escapeHtml(String(value || ''));
    const stanceIcons = { agree: '👍', disagree: '👎', mixed: '🤔', neutral: '⚖️', unclear: '❓' };
    const metric = (stance, m) => {
      const reactionParts = [];
      if (m.likesKnown) reactionParts.push(`${m.approximate ? '≈ ' : ''}❤️ ${m.likes}`);
      if (m.scoresKnown) reactionParts.push(`${m.approximate ? '≈ ' : ''}⬆️ ${m.score}`);
      const reactions = reactionParts.join(' · ');
      const icon = stanceIcons[stance] ? `<span class="stance-icon">${stanceIcons[stance]}</span> ` : '';
      const accessibleTitle = [t('discussionComments', { count: m.comments }), m.likesKnown ? t('discussionLikes', { count: m.likes }) : '', m.scoresKnown ? t('discussionScore', { count: m.score }) : ''].filter(Boolean).join(' · ');
      return `<span class="discussion-metric discussion-metric-${stance}" title="${escape(accessibleTitle)}">${icon}<strong>${escape(t('discussionStance_' + stance))}</strong> 💬 ${m.comments}${reactions ? ' · ' + reactions : ''}</span>`;
    };
    const coverageHtml = `<div class="discussion-coverage-row"><span class="discussion-coverage">💬 ${escape(t('discussionSample', { analyzed: analysis.analyzedCount, captured: analysis.capturedCount }))}</span></div>`;
    result.innerHTML = coverageHtml
      + analysis.topics.map(topic => {
        const highlights = [...new Set((topic.highlights || []).filter(h => !h.supplement).map(h => h.summary).filter(Boolean))].slice(0, 3);
        const supplements = [...new Set((topic.highlights || []).filter(h => h.supplement).map(h => h.summary).filter(Boolean))].slice(0, 2);
        const argsList = highlights.length ? highlights : [...(topic.agreeArguments || []), ...(topic.disagreeArguments || [])].slice(0, 3);
        const supplementDetails = supplements.length ? `<div class="discussion-supplements"><div class="discussion-supplements-header"><span class="supplement-icon">💡</span><strong>${escape(t('discussionSupplement'))}</strong></div>${supplements.map(value => `<p>${escape(value)}</p>`).join('')}</div>` : '';
        const details = argsList.length ? `<ul class="discussion-highlights">${argsList.map(value => `<li>${escape(value)}</li>`).join('')}</ul>`
          : !supplements.length && topic.summary ? `<p>${escape(topic.summary)}</p>` : '';
        return `<article class="discussion-topic"><h4>${escape(topic.title)}</h4>${details}${supplementDetails}<div class="discussion-metrics">${Object.entries(topic.metrics).filter(([, m]) => m.comments > 0).map(([stance, m]) => metric(stance, m)).join('')}</div></article>`;
      }).join('');
  }
}
globalThis.NutEggUI = globalThis.NutEggUI || {};
globalThis.NutEggUI.DiscussionComponent = DiscussionComponent;
if (typeof module !== 'undefined' && module.exports) module.exports = { DiscussionComponent };
