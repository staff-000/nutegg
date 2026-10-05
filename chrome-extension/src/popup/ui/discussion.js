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
    const metric = (stance, m) => {
      const hasReactions = m.reactionsKnown > 0;
      const reactions = [m.likesKnown ? t('discussionLikes', { count: m.likes }) : '', m.scoresKnown ? t('discussionScore', { count: m.score }) : ''].filter(Boolean).join(' · ');
      return `<div class="discussion-metric"><strong>${escape(t('discussionStance_' + stance))}</strong><span>${escape(t('discussionComments', { count: m.comments }))}${m.commenters != null ? ' · ' + escape(t('discussionPeople', { count: m.commenters })) : ''}</span>${hasReactions ? `<span>${m.approximate ? '≈ ' : ''}${escape(reactions || t('discussionLikes', { count: 0 }))}</span>` : ''}${m.reactionsMissing ? `<small>${escape(t('discussionReactionsMissing', { count: m.reactionsMissing }))}</small>` : ''}</div>`;
    };
    const args = (label, values) => values?.length ? `<p><strong>${escape(t(label))}</strong></p><ul>${values.map(value => `<li>${escape(value)}</li>`).join('')}</ul>` : '';
    result.innerHTML = `<p class="discussion-coverage">${escape(t('discussionSample', { analyzed: analysis.analyzedCount, captured: analysis.capturedCount }))}${analysis.totalCount != null ? ' ' + escape(t('discussionTotal', { count: analysis.totalCount })) : ''} ${escape(t('discussionSampleNote'))}${analysis.truncated ? ' ' + escape(t('discussionTruncated')) : ''}</p>`
      + analysis.topics.map(topic => `<article class="discussion-topic"><h4>${escape(topic.title)}</h4>${topic.claim ? `<p class="discussion-claim">${escape(topic.claim)}</p>` : ''}<p>${escape(topic.summary)}</p><div class="discussion-metrics">${Object.entries(topic.metrics).filter(([, m]) => m.comments || m.commenters).map(([stance, m]) => metric(stance, m)).join('')}</div>${args('discussionArgumentsAgree', topic.agreeArguments)}${args('discussionArgumentsDisagree', topic.disagreeArguments)}${topic.highlights.length ? `<ul class="discussion-highlights">${topic.highlights.map(h => `<li>${escape(h.summary)}</li>`).join('')}</ul>` : ''}</article>`).join('');
  }
}
globalThis.NutEggUI = globalThis.NutEggUI || {};
globalThis.NutEggUI.DiscussionComponent = DiscussionComponent;
if (typeof module !== 'undefined' && module.exports) module.exports = { DiscussionComponent };
