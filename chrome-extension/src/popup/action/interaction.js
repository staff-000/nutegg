class InteractionAction {
  constructor(deps) { Object.assign(this, deps); this.store = deps.tabStateManager; }
  handleFollowUp() {
    const question = this.ui.qaUI.getFollowupText();
    if (!question) return;
    return this.operations.followup(this.store.activeTabId, question, { outputLanguage: this.settings.outputLanguage });
  }
  seekToChapter(seconds) { return this.pageExtractor.seekToChapter(this.store.activeTabId, seconds); }
  scrollToSection(heading, quote) { return this.pageExtractor.scrollToSection(this.store.activeTabId, heading, quote); }
  handleSourcePillClick(event) {
    return globalThis.NutEggUI.handleSourcePillClick(event, { onSeek: s => this.seekToChapter(s), onScroll: (h, q) => this.scrollToSection(h, q) });
  }
  openGitHubBugReport(error = '') { return globalThis.NutEggHelpers.openGitHubBugReport(error, { url: this.store.getTab(this.store.activeTabId)?.url || '' }); }
}
globalThis.NutEggActions = globalThis.NutEggActions || {};
globalThis.NutEggActions.InteractionAction = InteractionAction;
if (typeof module !== 'undefined' && module.exports) module.exports = { InteractionAction };
