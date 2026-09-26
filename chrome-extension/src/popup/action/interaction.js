// ============================================================
// NutEgg Popup Action — Interaction Action Handler
// ============================================================

class InteractionAction {
  constructor(deps = {}) {
    this.session = deps.session;
    this.settings = deps.settings;
    this.tabStateManager = deps.tabStateManager;
    this.pageExtractor = deps.pageExtractor;
    this.analysisService = deps.analysisService;
    this.ui = deps.ui || {};
    this.getTabAction = deps.getTabAction || (() => null);
  }

  async handleFollowUp() {
    const session = this.session;
    const settings = this.settings;
    const tabStateManager = this.tabStateManager;
    const ui = this.ui;
    const tabAction = this.getTabAction();
    const pageHelper = typeof helper !== "undefined" ? helper : globalThis.helper;

    const pinnedTabId = session.activeTabId;
    const q = ui.qaUI?.getFollowupText?.();
    if (!q || ui.qaUI?.followupBtn?.disabled) return;
    ui.qaUI?.clearFollowup?.();
    ui.qaUI?.setFollowupLoading?.(true);
    ui.qaUI?.render?.(session.analysisResult, session.followUpQa);

    await this.analysisService.askFollowUp({
      session,
      settings,
      tabStateManager,
      question: q,
      pinnedTabId,
      extractFallback: (id) => tabAction ? tabAction.extractPageContent(session.refreshSeq, id) : null,
      buildPriorQa: (res, qaList) => pageHelper?.buildPriorQa ? pageHelper.buildPriorQa(res, qaList) : [],
    });

    if (session.activeTabId === pinnedTabId) {
      ui.qaUI?.setFollowupLoading?.(false);
      ui.qaUI?.render?.(session.analysisResult, session.followUpQa);
    }
  }

  async seekToChapter(seconds) {
    let tabId = this.session?.activeTabId;
    if (!tabId) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = tab?.id;
      } catch {}
    }
    return this.pageExtractor?.seekToChapter?.(tabId, seconds);
  }

  async scrollToSection(heading, quote) {
    let tabId = this.session?.activeTabId;
    if (!tabId) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = tab?.id;
      } catch {}
    }
    return this.pageExtractor?.scrollToSection?.(tabId, heading, quote);
  }

  handleSourcePillClick(e) {
    const fn = (globalThis.NutEggUI || (typeof window !== "undefined" && window.NutEggUI))?.handleSourcePillClick;
    if (fn) {
      fn(e, {
        onSeek: (seconds) => this.seekToChapter(seconds),
        onScroll: (heading, quote) => this.scrollToSection(heading, quote),
      });
    }
  }

  openGitHubBugReport(errorContext = "") {
    const session = this.session;
    const ui = this.ui;
    let contentUrl = "";
    if (session?.extractedContent?.url) {
      contentUrl = session.extractedContent.url;
    } else if (ui.captureUI?.getPageUrl?.() && ui.captureUI.getPageUrl() !== "Loading...") {
      contentUrl = ui.captureUI.getPageUrl();
    }
    const pageHelper = typeof helper !== "undefined" ? helper : globalThis.helper;
    return pageHelper?.openGitHubBugReport ? pageHelper.openGitHubBugReport(errorContext, { url: contentUrl }) : null;
  }
}

const _interactionActionScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_interactionActionScope.NutEggActions = _interactionActionScope.NutEggActions || {};
_interactionActionScope.NutEggActions.InteractionAction = InteractionAction;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { InteractionAction };
}

