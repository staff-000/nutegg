class HistoryAction {
  constructor(deps) { Object.assign(this, deps); this.store = deps.tabStateManager; }
  onHistorySelected(index) {
    const tabId = this.store.activeTabId;
    const entry = this.store.getTab(tabId)?.captureHistory[Number(index)];
    if (entry) this.store.dispatch({ type: 'historySelected', tabId, entry });
  }
}
globalThis.NutEggActions = globalThis.NutEggActions || {};
globalThis.NutEggActions.HistoryAction = HistoryAction;
if (typeof module !== 'undefined' && module.exports) module.exports = { HistoryAction };
