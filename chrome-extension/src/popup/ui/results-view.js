// ============================================================
// NutEgg Popup UI — Results View Component
// ============================================================

function _resultsEscapeHtml(str) {
  if (typeof escapeHtml === 'function') return escapeHtml(str);
  if (typeof document !== 'undefined' && document.createElement) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

class ResultsViewComponent {
  constructor(root = document) {
    this.root = root;
    this.captureState = root.getElementById('capture-state');
    this.resultsState = root.getElementById('results-state');
    this.resultPageInfo = root.getElementById('result-page-info');
    this.resultPageTitle = root.getElementById('result-page-title');
    this.resultPageAuthor = root.getElementById('result-page-author');
    this.resultPagePublished = root.getElementById('result-page-published');
    this.resultPageWordCount = root.getElementById('result-page-word-count');
    this.coreSummarySection = root.getElementById('core-summary-section');
    this.coreSummaryEl = root.getElementById('core-summary');
    this.currentView = null;
    this.sectionFailures = [];
  }

  clearSectionFailures() {
    for (const { section, notice, wasHidden } of this.sectionFailures) {
      notice.remove();
      if (wasHidden) section.classList.add('hidden');
    }
    this.sectionFailures = [];
  }

  renderSectionFailures(view, settings) {
    if (view.currentView !== 'results' || view.analysisCancelled || view.isAnalyzing || !this.root.createElement) return;
    const result = view.analysisResult || {}, sections = view.enabledSections || {};
    const isChrome = settings.isChromeMode(result);
    const groups = new Map();
    const add = (id, failures, enabled = true) => {
      if (enabled && failures.length) groups.set(id, [...(groups.get(id) || []), ...failures]);
    };
    const failures = result.analysisFailures || [];
    const byTask = task => failures.filter(failure => failure.section === task);
    let summary = byTask('summary'), mindmap = byTask('mindmap'), knowledge = byTask('knowledge'), discussion = byTask('discussion');
    let title = summary, questions = summary;
    let egg = (result.eggResults || []).flatMap(value => value.analysisFailures || []);
    // A rejected request may have no result metadata. Mark only its missing
    // outputs; existing successful content remains available.
    const failed = view.errors?.analysis;
    if (failed) {
      const fallback = [{ code: failed.code }];
      if (Number(view.analysisRetry?.payload.stage) === 2) egg = [...egg, ...fallback];
      else {
        if (!result.titleVerdict) title = [...title, ...fallback];
        if (!result.coreSummary?.length) summary = [...summary, ...fallback];
        if (!result.customQuestionAnswers?.length) questions = [...questions, ...fallback];
        if (!result.mindMap?.length) mindmap = [...mindmap, ...fallback];
        if (!result.extractedEntries?.length) knowledge = [...knowledge, ...fallback];
        if (!result.discussion) discussion = [...discussion, ...fallback];
      }
    }
    add('title-verdict-section', title, sections.titleVerdict !== false);
    add('core-summary-section', summary, sections.coreSummary !== false);
    add('custom-questions-section', questions, !!(view.analysisRetry?.payload.questions?.length || view.customQuestions?.trim()));
    add('mindmap-section', mindmap, sections.mindMap !== false);
    add('discussion-section', discussion, sections.discussion === true);
    add('chrome-knowledge-section', knowledge, isChrome && view.generateKnowledgeEntries === true);
    add('egg-knowledge-section', egg, !isChrome);
    add('verdict-section', egg, !isChrome);
    for (const [id, failures] of groups) {
      const section = this.root.getElementById(id);
      if (!section) continue;
      if (id === 'verdict-section' && !result.readAction) {
        for (const field of ['verdict-icon', 'verdict-text', 'verdict-reason']) {
          const element = this.root.getElementById(field);
          if (element) element.textContent = '';
        }
      }
      const notice = this.root.createElement('div');
      notice.className = 'ai-section-failure';
      notice.setAttribute('role', 'status');
      const message = this.root.createElement('p');
      const explanation = globalThis.NutEggHelpers.analysisFailureNotice({ analysisResult: { analysisFailures: failures } });
      message.textContent = t('analysisSectionFailed', { reason: explanation.reason });
      notice.appendChild(message);
      const retry = this.root.createElement('button');
      retry.type = 'button';
      retry.textContent = t('retryAnalysis');
      retry.title = t('analysisRetryHint');
      retry.disabled = !!view.busy || !!view.extractionPending || !view.analysisRetry || view.analysisRetry.pageGeneration !== view.pageGeneration;
      retry.dataset.analysisRetry = 'true';
      retry.dataset.tabId = String(view.activeTabId);
      retry.dataset.pageGeneration = String(view.pageGeneration);
      notice.appendChild(retry);
      const wasHidden = section.classList.contains('hidden');
      section.classList.remove('hidden');
      section.querySelector('.section-header')?.insertAdjacentElement('afterend', notice) || section.appendChild(notice);
      this.sectionFailures.push({ section, notice, wasHidden });
    }
  }

  showResults() {
    this.currentView = 'results';
    this.captureState?.classList.add('hidden');
    this.resultsState?.classList.remove('hidden');
  }

  showCapture() {
    this.currentView = 'capture';
    this.resultsState?.classList.add('hidden');
    this.resultPageInfo?.classList.add('hidden');
    this.captureState?.classList.remove('hidden');
  }

  renderProvenance(prov) {
    if (!this.resultPageInfo) return;
    if (!prov || !prov.title) {
      this.resultPageInfo.classList.add('hidden');
      if (this.resultPageWordCount) this.resultPageWordCount.textContent = '';
      return;
    }
    this.resultPageInfo.classList.remove('hidden');
    if (this.resultPageTitle) this.resultPageTitle.textContent = prov.title;
    if (this.resultPageAuthor) {
      this.resultPageAuthor.textContent = prov.author ? `✍️ ${prov.author}` : '';
    }
    if (this.resultPagePublished) {
      this.resultPagePublished.textContent = prov.publishedAt
        ? `📅 ${new Date(prov.publishedAt).toLocaleDateString()}`
        : '';
    }
    if (this.resultPageWordCount) {
      if (prov.wordCount != null && prov.wordCount > 0) {
        this.resultPageWordCount.textContent = `📝 ${t('wordCount', { count: prov.wordCount.toLocaleString() })}`;
        this.resultPageWordCount.classList.remove('hidden');
      } else {
        this.resultPageWordCount.textContent = '';
        this.resultPageWordCount.classList.add('hidden');
      }
    }
  }

  renderCoreSummary(summary, enabled = true) {
    if (!this.coreSummarySection || !this.coreSummaryEl) return;
    const hasBullets = Array.isArray(summary) && summary.length > 0;
    const hasString = typeof summary === 'string' && summary.trim().length > 0;
    if ((hasBullets || hasString) && enabled !== false) {
      this.coreSummarySection.classList.remove('hidden');
      if (hasBullets) {
        this.coreSummaryEl.innerHTML = summary.map(b => `<li>${_resultsEscapeHtml(b)}</li>`).join('');
      } else {
        this.coreSummaryEl.textContent = summary;
      }
    } else {
      this.coreSummarySection.classList.add('hidden');
      this.coreSummaryEl.innerHTML = '';
    }
  }

  render(session, settings) {
    if (!session) return;
    const result = session.analysisResult || {};
    if (session.currentView === 'results') {
      const switchedToResults = this.currentView !== 'results';
      this.showResults();
      if (switchedToResults) {
        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
        if (this.root?.documentElement) this.root.documentElement.scrollTop = 0;
        if (this.root?.body) this.root.body.scrollTop = 0;
      }
      const prov = session.provenance || {
        title: session.extractedContent?.title || result.title,
        author: session.extractedContent?.metadata?.author || result.author,
        publishedAt: session.extractedContent?.metadata?.published || result.publishedAt,
      };
      this.renderProvenance(prov);
      const effectiveSections = session?.enabledSections || settings?.enabledSections;
      this.renderCoreSummary(result.coreSummary, effectiveSections?.coreSummary !== false);
    } else {
      this.showCapture();
    }
  }
}

const _resultsScope = typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this;
_resultsScope.NutEggUI = _resultsScope.NutEggUI || {};
_resultsScope.NutEggUI.ResultsViewComponent = ResultsViewComponent;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ResultsViewComponent };
}
