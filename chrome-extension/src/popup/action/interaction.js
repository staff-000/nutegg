class InteractionAction {
  constructor(deps) {
    Object.assign(this, deps);
    this.store = deps.tabStateManager;
  }
  handleFollowUp() {
    const question = this.ui.qaUI.getFollowupText();
    if (!question) return;
    return this.operations.followup(this.store.activeTabId, question, { outputLanguage: this.settings.outputLanguage });
  }
  playbackOwner() {
    const tabId = this.store.activeTabId;
    const tab = this.store.getTab(tabId);
    if (!tab) return null;
    const epoch = this.store.activationEpoch;
    const generation = tab.pageGeneration;
    return { tabId, tab, options: {
      expectedUrl: tab.stage1Payload?.url || tab.extractedContent?.url || tab.url,
      owner: `${generation}`,
      isCurrent: () => this.store.activeTabId === tabId && this.store.activationEpoch === epoch &&
        this.store.getTab(tabId)?.pageGeneration === generation,
    } };
  }
  cancelPendingSeek() {
    if (this.seekTabId == null) return;
    this.pageExtractor.cancelPendingSeek?.(this.seekTabId);
    this.playbackSequence = (this.playbackSequence || 0) + 1;
    this.seeking = null;
    this.seekTabId = null;
  }
  async seekToChapter(seconds) {
    const owner = this.playbackOwner();
    if (!owner) return false;
    this.ui?.mindmapUI?.markUserTouched?.();
    const request = this.playbackSequence = (this.playbackSequence || 0) + 1;
    this.seeking = request;
    this.seekTabId = owner.tabId;
    const current = () => owner.options.isCurrent() && this.playbackSequence === request;
    try {
      const pos = await this.pageExtractor.seekToChapter(owner.tabId, seconds,
        { ...owner.options, isCurrent: current, isPageCurrent: owner.options.isCurrent });
      if (!current()) return false;
      this.store.dispatch({ type: 'playbackPosition', tabId: owner.tabId,
        pageGeneration: owner.tab.pageGeneration, position: pos });
      this.store.dispatch({ type: 'sourceJumpNotice', tabId: owner.tabId, message: null });
      return true;
    } catch (error) {
      if (current()) this.store.dispatch({ type: 'sourceJumpNotice', tabId: owner.tabId,
        message: t('videoSeekUnavailable') });
      return false;
    } finally { if (this.seeking === request) { this.seeking = null; this.seekTabId = null; } }
  }
  async updateMindmapPosition() {
    if (this.positionPending || this.seeking) return null;
    const owner = this.playbackOwner();
    if (!owner || !this.pageExtractor?.getPagePosition) return null;
    const sequence = this.playbackSequence || 0;
    const current = () => owner.options.isCurrent() && (this.playbackSequence || 0) === sequence;
    this.positionPending = true;
    try {
      const pos = await this.pageExtractor.getPagePosition(owner.tabId, null,
        { ...owner.options, isCurrent: current, isPageCurrent: owner.options.isCurrent });
      if (current()) this.store.dispatch({ type: 'playbackPosition', tabId: owner.tabId,
        pageGeneration: owner.tab.pageGeneration, position: pos });
      return pos;
    } catch {
      if (current()) this.store.dispatch({ type: 'playbackPosition', tabId: owner.tabId,
        pageGeneration: owner.tab.pageGeneration, position: null });
      return null;
    } finally { this.positionPending = false; }
  }
  toggleDiscussionComments(topicId, stance) {
    const tabId = this.store.activeTabId,
      tab = this.store.getTab(tabId);
    const topic = tab?.analysisResult?.discussion?.topics?.find(topic => topic.id === topicId);
    if (
      !['agree', 'disagree', 'mixed', 'neutral', 'unclear'].includes(stance) ||
      !(topic?.metrics?.[stance]?.comments > 0)
    )
      return;
    const expanded = tab.presentation.discussionComments || {};
    this.store.dispatch({
      type: 'draft',
      tabId,
      values: {
        presentation: {
          ...tab.presentation,
          discussionComments: { ...expanded, [topicId]: expanded[topicId] === stance ? null : stance },
        },
      },
    });
  }
  async scrollToSection(heading, quote, sourceId) {
    this.ui?.mindmapUI?.markUserTouched?.();
    const tabId = this.store.activeTabId,
      tab = this.store.getTab(tabId);
    if (!tab) return false;
    const request = (this.sourceJumpRequest = (this.sourceJumpRequest || 0) + 1);
    const capturedUrl = tab.stage1Payload?.url || tab.extractedContent?.url || tab.url;
    const capturedVideo = globalThis.NutEggAI?.getVideoIdentity?.(capturedUrl);
    const currentVideo = globalThis.NutEggAI?.getVideoIdentity?.(tab.url);
    const expectedUrl =
      capturedVideo && capturedVideo.canonicalUrl === currentVideo?.canonicalUrl ? tab.url : capturedUrl;
    const ok = await this.pageExtractor.scrollToSection(tabId, heading, quote, sourceId, expectedUrl);
    if (this.sourceJumpRequest === request && this.store.getTab(tabId)?.pageGeneration === tab.pageGeneration) {
      this.store.dispatch({ type: 'sourceJumpNotice', tabId, message: ok ? null : t('sourceJumpUnavailable') });
    }
    if (ok) void this.updateMindmapPosition();
    return ok;
  }
  handleSourcePillClick(event) {
    return globalThis.NutEggUI.handleSourcePillClick(event, {
      onSeek: s => this.seekToChapter(s),
      onScroll: (h, q, id) => this.scrollToSection(h, q, id),
    });
  }
  openGitHubBugReport(error = '') {
    return globalThis.NutEggHelpers.openGitHubBugReport(error, {
      url: this.store.getTab(this.store.activeTabId)?.url || '',
    });
  }
  openEmailBugReport(error = '') {
    return globalThis.NutEggHelpers.openEmailBugReport(error, {
      url: this.store.getTab(this.store.activeTabId)?.url || '',
    });
  }
}
globalThis.NutEggActions = globalThis.NutEggActions || {};
globalThis.NutEggActions.InteractionAction = InteractionAction;
if (typeof module !== 'undefined' && module.exports) module.exports = { InteractionAction };
