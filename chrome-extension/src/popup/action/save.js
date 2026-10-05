class SaveAction {
  constructor(deps) { Object.assign(this, deps); this.store = deps.tabStateManager; }
  handleConfirm() { return this.operations.save(this.store.activeTabId, true); }
  handleSaveRaw() { return this.operations.save(this.store.activeTabId, false); }
  handleCreateEgg(inline = false) {
    const tabId = this.store.activeTabId;
    const input = this.ui.eggsUI.getNewEggInput();
    if (!input.name) return;
    return this.operations.create(tabId, { ...input, inline, ...this.getAnalyzeAction().requestOptions() });
  }
}
globalThis.NutEggActions = globalThis.NutEggActions || {};
globalThis.NutEggActions.SaveAction = SaveAction;
if (typeof module !== 'undefined' && module.exports) module.exports = { SaveAction };
