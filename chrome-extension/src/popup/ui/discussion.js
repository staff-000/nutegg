class DiscussionComponent {
  constructor(root = document) { this.root = root; }
  init({ onToggle }) {
    this.root.getElementById('discussion-result')?.addEventListener('click', event => {
      const button = event.target.closest?.('button[data-discussion-stance]');
      if (!button || button.disabled) return;
      onToggle(button.dataset.discussionTopic, button.dataset.discussionStance);
      // Rendering replaces the badge; preserve keyboard focus after expanding/collapsing.
      this.root.getElementById(button.id)?.focus?.({ preventScroll: true });
    });
  }
  render(view) {
    const d = view.extractedContent?.discussion;
    const enabled = view.enabledSections.discussion === true;
    for (const prefix of ['discussion-capture', 'discussion-reanalyze']) {
      this.root.getElementById(prefix)?.classList.toggle('hidden', !enabled);
      const status = this.root.getElementById(prefix + '-status');
      if (status) status.textContent = view.discussionPending ? t('discussionLoading', { count: d?.items?.length || 0 })
        : d?.truncated ? t('discussionTruncated')
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
    const renderComment = text => (globalThis.NutEggHelpers?.linkifyTimestamps ? globalThis.NutEggHelpers.linkifyTimestamps(escape(text)) : escape(text));
    const hasTimestamp = h => {
      if (!h) return false;
      const text = typeof h === 'string' ? h : (h.summary || '');
      return Boolean(
        (h.time && /^\d{1,3}:[0-5]\d(?::[0-5]\d)?$/.test(String(h.time))) ||
        (globalThis.NutEggHelpers?.extractTimestamp ? globalThis.NutEggHelpers.extractTimestamp(text) : /(?:^|[^\d:])\d{1,3}(?::\d{2}){1,2}(?:[^\d:]|$)/.test(text))
      );
    };
    const sourceTag = h => (h.commentId && !hasTimestamp(h)) ? `<button type="button" class="source-pill source-section discussion-source" data-source-id="${escape(h.commentId)}" data-heading="${escape(t('discussionComment'))}" title="${escape(t('sourceTooltip'))}">📍 ${escape(t('jumpToSource'))}</button>` : '';
    const unique = values => [...new Map(values.map(h => [h.summary, h])).values()];
    const stanceIcons = { agree: '👍', disagree: '👎', mixed: '🤔', neutral: '⚖️', unclear: '❓' };
    // Prefer the analyzed snapshot over comments refreshed after analysis.
    const sources = new Map((view.stage1Payload?.discussion?.items || view.extractedContent?.discussion?.items || []).map(item => [item.id, item]));
    const expanded = view.presentation?.discussionComments || {};
    const metric = (topic, index, stance, m) => {
      const reactionParts = [];
      if (m.likesKnown) reactionParts.push(`${m.approximate ? '≈ ' : ''}❤️ ${m.likes}`);
      if (m.scoresKnown) reactionParts.push(`${m.approximate ? '≈ ' : ''}⬆️ ${m.score}`);
      const reactions = reactionParts.join(' · ');
      const icon = stanceIcons[stance] ? `<span class="stance-icon">${stanceIcons[stance]}</span> ` : '';
      const accessibleTitle = [t('discussionComments', { count: m.comments }), m.likesKnown ? t('discussionLikes', { count: m.likes }) : ''].filter(Boolean).join(' · ');
      const label = `${icon}<strong>${escape(t('discussionStance_' + stance))}</strong> 💬 ${m.comments}${reactions ? ' · ' + reactions : ''}`;
      const open = expanded[topic.id] === stance;
      return `<button type="button" id="discussion-metric-${index}-${stance}" class="discussion-metric discussion-metric-${stance}" data-discussion-topic="${escape(topic.id)}" data-discussion-stance="${stance}" aria-expanded="${open}" aria-controls="discussion-comments-${index}" title="${escape(accessibleTitle)}">${label}<span class="discussion-metric-chevron" aria-hidden="true">${open ? '▾' : '▸'}</span></button>`;
    };
    const coverageHtml = `<div class="discussion-coverage-row"><span class="discussion-coverage">💬 ${escape(t('discussionSample', { analyzed: analysis.analyzedCount, captured: analysis.capturedCount }))}</span></div>`;
    result.innerHTML = coverageHtml
      + analysis.topics.map((topic, index) => {
        const originals = new Map(sources);
        for (const highlight of topic.highlights || []) if (highlight.source?.id === highlight.commentId) originals.set(highlight.commentId, highlight.source);
        const groups = Object.fromEntries(Object.keys(stanceIcons).map(stance => [stance,
          [...new Set(topic.commentIds?.[stance] || [])].map(id => originals.get(id)).filter(item => item?.text)]));
        const stance = expanded[topic.id], comments = groups[stance] || [];
        const open = Boolean(stanceIcons[stance] && topic.metrics[stance]?.comments > 0);
        const panelLabel = open ? `${t('discussionStance_' + stance)} · ${t('discussionComments', { count: topic.metrics[stance].comments })}` : '';
        const missing = open ? Math.max(0, topic.metrics[stance].comments - comments.length) : 0;
        const missingText = open && !topic.commentIds ? t('discussionGroupsUnavailable')
          : missing ? t('discussionOriginalsMissing', { count: missing }) : '';
        const panel = `<div id="discussion-comments-${index}" class="discussion-comments-panel${open ? '' : ' hidden'}" role="region" aria-label="${escape(panelLabel)}">${comments.map(item => {
          const reaction = item.reaction;
          const reactionText = reaction?.count != null ? `${reaction.approximate ? '≈ ' : ''}${t(reaction.kind === 'score' ? 'discussionScore' : 'discussionLikes', { count: reaction.count })}` : '';
          return `<div class="discussion-original"><div class="discussion-original-meta"><strong>${escape(item.author || t('discussionUnknownAuthor'))}</strong>${reactionText ? `<span>${escape(reactionText)}</span>` : ''}</div><blockquote>${escape(item.text)}</blockquote></div>`;
        }).join('')}${missingText ? `<p class="discussion-originals-missing">${escape(missingText)}</p>` : ''}</div>`;
        const highlights = unique((topic.highlights || []).filter(h => !h.supplement && h.summary)).slice(0, 3);
        const supplements = unique((topic.highlights || []).filter(h => h.supplement && h.summary)).slice(0, 2);
        const argsList = highlights.length ? highlights : [...(topic.agreeArguments || []), ...(topic.disagreeArguments || [])].slice(0, 3);
        const supplementDetails = supplements.length ? `<div class="discussion-supplements"><div class="discussion-supplements-header"><span class="supplement-icon">💡</span><strong>${escape(t('discussionSupplement'))}</strong></div>${supplements.map(h => `<p>${renderComment(h.summary)} ${sourceTag(h)}</p>`).join('')}</div>` : '';
        const details = argsList.length ? `<ul class="discussion-highlights">${argsList.map(value => `<li>${typeof value === "string" ? renderComment(value) : renderComment(value.summary) + " " + sourceTag(value)}</li>`).join('')}</ul>`
          : !supplements.length && topic.summary ? `<p>${renderComment(topic.summary)}</p>` : '';
        return `<article class="discussion-topic"><h4>${escape(topic.title)}</h4>${details}${supplementDetails}<div class="discussion-metrics">${Object.entries(topic.metrics).filter(([stance, m]) => stanceIcons[stance] && m.comments > 0).map(([stance, m]) => metric(topic, index, stance, m)).join('')}</div>${panel}</article>`;
      }).join('');
  }
}
globalThis.NutEggUI = globalThis.NutEggUI || {};
globalThis.NutEggUI.DiscussionComponent = DiscussionComponent;
if (typeof module !== 'undefined' && module.exports) module.exports = { DiscussionComponent };
