// Session-only analysis activity for tabs in this panel's Chrome window.
class AnalysisActivityComponent {
  constructor(root = document) {
    this.root = root;
    this.container = root.getElementById("analysis-activity");
    this.button = root.getElementById("analysis-activity-toggle");
    this.list = root.getElementById("analysis-activity-list");
    this.refreshRevision = 0;
  }

  async init({ manager, onSelect, onChange = () => {}, tabs = chrome.tabs }) {
    this.manager = manager;
    this.tabs = tabs;
    this.onSelect = onSelect;
    this.button?.addEventListener("click", () => this.toggle());
    this.list?.addEventListener("click", event => {
      const row = event.target.closest?.("[data-activity-tab]");
      if (!row) return;
      this.toggle(false);
      Promise.resolve(onSelect(Number(row.dataset.activityTab))).catch(() => this.refresh());
    });
    this.root.addEventListener?.("click", event => {
      if (!this.container?.contains(event.target)) this.toggle(false);
    });
    this.root.addEventListener?.("keydown", event => {
      if (event.key === "Escape") this.toggle(false);
    });
    this.unsubscribe = manager.subscribeActivity(() => { onChange(); this.refresh(); });
    const currentTabs = await tabs.query({ currentWindow: true });
    this.windowId = currentTabs[0]?.windowId;
    await this.refresh();
  }

  toggle(open = this.list?.classList.contains("hidden")) {
    if (open) this.list?.classList.remove("hidden");
    else this.list?.classList.add("hidden");
    this.button?.setAttribute("aria-expanded", String(!!open));
  }

  async refresh() {
    const revision = ++this.refreshRevision;
    try {
      const tabs = await this.tabs.query(this.windowId == null ? { currentWindow: true } : { windowId: this.windowId });
      if (revision !== this.refreshRevision) return;
      const byId = new Map(tabs.map(tab => [tab.id, tab]));
      const entries = this.manager.getAnalysisActivity().filter(entry => byId.has(entry.tabId));
      this.render(entries.map(entry => ({ ...entry, title: entry.title || byId.get(entry.tabId).title || entry.url })));
    } catch {
      // A closing window may make its tabs unavailable.
      if (revision === this.refreshRevision) this.render([]);
    }
  }

  render(entries) {
    const unread = entries.filter(entry => !entry.running).sort((a, b) => a.completedAt - b.completedAt || a.revision - b.revision);
    const running = entries.filter(entry => entry.running).sort((a, b) => a.startedAt - b.startedAt || a.revision - b.revision);
    this.container?.classList.toggle("hidden", entries.length === 0);
    if (!entries.length) this.toggle(false);
    if (this.button) this.button.textContent = [
      running.length ? `⏳ ${t("activityRunningCount", { count: running.length })}` : "",
      unread.length ? `✅ ${t("activityUnreadCount", { count: unread.length })}` : "",
    ].filter(Boolean).join(" · ");
    if (!this.list) return;
    this.list.replaceChildren();
    for (const [items, label] of [[unread, "activityUnread"], [running, "activityRunning"]]) {
      if (!items.length) continue;
      const heading = this.root.createElement("div");
      heading.className = "activity-group-title";
      heading.textContent = t(label);
      this.list.appendChild(heading);
      for (const entry of items) {
        const row = this.root.createElement("button");
        row.type = "button";
        row.dataset.activityTab = String(entry.tabId);
        row.textContent = `${entry.running ? "⏳" : "✅"} ${entry.title || t("activityUntitled")}`;
        row.title = row.textContent;
        this.list.appendChild(row);
      }
    }
  }
}
globalThis.NutEggUI = globalThis.NutEggUI || {};
globalThis.NutEggUI.AnalysisActivityComponent = AnalysisActivityComponent;
if (typeof module !== "undefined" && module.exports) module.exports = { AnalysisActivityComponent };
