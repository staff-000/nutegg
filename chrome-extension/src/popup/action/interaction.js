class InteractionAction {
  constructor(deps) { Object.assign(this, deps); this.store = deps.tabStateManager; }
  handleFollowUp() {
    const question = this.ui.qaUI.getFollowupText();
    if (!question) return;
    return this.operations.followup(this.store.activeTabId, question, { outputLanguage: this.settings.outputLanguage });
  }
  seekToChapter(seconds) {
    this.ui?.mindmapUI?.markUserTouched?.();
    const secs = typeof seconds === 'number' ? seconds : this.pageExtractor?.toSeconds?.(seconds) ?? seconds;
    const res = this.pageExtractor.seekToChapter(this.store.activeTabId, seconds);
    this.ui?.mindmapUI?.updateProgress?.({ type: 'video', currentTime: secs });
    return res;
  }
  async updateMindmapPosition() {
    const tabId = this.store.activeTabId;
    if (tabId == null || !this.pageExtractor?.getPagePosition) return null;
    const pos = await this.pageExtractor.getPagePosition(tabId);
    if (pos) {
      this.ui?.mindmapUI?.updateProgress?.(pos);
    }
    return pos;
  }
  toggleDiscussionComments(topicId, stance) {
    const tabId = this.store.activeTabId, tab = this.store.getTab(tabId);
    const topic = tab?.analysisResult?.discussion?.topics?.find(topic => topic.id === topicId);
    if (!['agree', 'disagree', 'mixed', 'neutral', 'unclear'].includes(stance) || !(topic?.metrics?.[stance]?.comments > 0)) return;
    const expanded = tab.presentation.discussionComments || {};
    this.store.dispatch({ type: 'draft', tabId, values: { presentation: { ...tab.presentation,
      discussionComments: { ...expanded, [topicId]: expanded[topicId] === stance ? null : stance } } } });
  }
  async scrollToSection(heading, quote, sourceId) {
    this.ui?.mindmapUI?.markUserTouched?.();
    const tabId = this.store.activeTabId, tab = this.store.getTab(tabId);
    if (!tab) return false;
    const request = this.sourceJumpRequest = (this.sourceJumpRequest || 0) + 1;
    const capturedUrl = tab.stage1Payload?.url || tab.extractedContent?.url || tab.url;
    const capturedVideo = globalThis.NutEggAI?.getVideoIdentity?.(capturedUrl);
    const currentVideo = globalThis.NutEggAI?.getVideoIdentity?.(tab.url);
    const expectedUrl = capturedVideo && capturedVideo.canonicalUrl === currentVideo?.canonicalUrl ? tab.url : capturedUrl;
    const ok = await this.pageExtractor.scrollToSection(tabId, heading, quote, sourceId, expectedUrl);
    if (this.sourceJumpRequest === request && this.store.getTab(tabId)?.pageGeneration === tab.pageGeneration) {
      this.store.dispatch({ type: 'sourceJumpNotice', tabId, message: ok ? null : t('sourceJumpUnavailable') });
    }
    if (ok) void this.updateMindmapPosition();
    return ok;
  }
  handleSourcePillClick(event) {
    return globalThis.NutEggUI.handleSourcePillClick(event, { onSeek: s => this.seekToChapter(s), onScroll: (h, q, id) => this.scrollToSection(h, q, id) });
  }
  openGitHubBugReport(error = '') { return globalThis.NutEggHelpers.openGitHubBugReport(error, { url: this.store.getTab(this.store.activeTabId)?.url || '' }); }
  openEmailBugReport(error = '') { return globalThis.NutEggHelpers.openEmailBugReport(error, { url: this.store.getTab(this.store.activeTabId)?.url || '' }); }
}
globalThis.NutEggActions = globalThis.NutEggActions || {};
globalThis.NutEggActions.InteractionAction = InteractionAction;
if (typeof module !== 'undefined' && module.exports) module.exports = { InteractionAction };
