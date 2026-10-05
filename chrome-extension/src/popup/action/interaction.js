class InteractionAction {
  constructor(deps) { Object.assign(this, deps); this.store = deps.tabStateManager; }
  handleFollowUp() {
    const question = this.ui.qaUI.getFollowupText();
    if (!question) return;
    return this.operations.followup(this.store.activeTabId, question, { outputLanguage: this.settings.outputLanguage });
  }
  seekToChapter(seconds) { return this.pageExtractor.seekToChapter(this.store.activeTabId, seconds); }
  async scrollToSection(heading, quote, sourceId) {
    const tabId = this.store.activeTabId, tab = this.store.getTab(tabId);
    if (!tab) return false;
    const request = this.sourceJumpRequest = (this.sourceJumpRequest || 0) + 1;
    const expectedUrl = tab.stage1Payload?.url || tab.extractedContent?.url || tab.url;
    const ok = await this.pageExtractor.scrollToSection(tabId, heading, quote, sourceId, expectedUrl);
    if (this.sourceJumpRequest === request && this.store.getTab(tabId)?.pageGeneration === tab.pageGeneration) {
      this.store.dispatch({ type: 'sourceJumpNotice', tabId, message: ok ? null : t('sourceJumpUnavailable') });
    }
    return ok;
  }
  handleSourcePillClick(event) {
    return globalThis.NutEggUI.handleSourcePillClick(event, { onSeek: s => this.seekToChapter(s), onScroll: (h, q, id) => this.scrollToSection(h, q, id) });
  }
  openGitHubBugReport(error = '') { return globalThis.NutEggHelpers.openGitHubBugReport(error, { url: this.store.getTab(this.store.activeTabId)?.url || '' }); }
}
globalThis.NutEggActions = globalThis.NutEggActions || {};
globalThis.NutEggActions.InteractionAction = InteractionAction;
if (typeof module !== 'undefined' && module.exports) module.exports = { InteractionAction };
