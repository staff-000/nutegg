// ============================================================
// NutEgg Popup UI — Metrics & Footer Component
// ============================================================

class MetricsComponent {
  constructor(root = document) {
    this.root = root;
    this.metricNuts = root.getElementById("metric-nuts");
    this.metricEggs = root.getElementById("metric-eggs");
    this.metricTime = root.getElementById("metric-time");
    this.obsidianPluginLink = root.getElementById("obsidian-plugin-link");
    this.reportBugLink = root.getElementById("report-bug-link");
  }

  render(data = {}) {
    if (!data) return;
    if (this.metricNuts && data.nuts != null) this.metricNuts.textContent = data.nuts;
    if (this.metricEggs && data.eggs != null) this.metricEggs.textContent = data.eggs;
    if (this.metricTime && data.timeSaved != null) this.metricTime.textContent = data.timeSaved;
  }

  showPluginLink(visible) {
    if (!this.obsidianPluginLink) return;
    if (visible) {
      this.obsidianPluginLink.classList.remove("hidden");
    } else {
      this.obsidianPluginLink.classList.add("hidden");
    }
  }
}

const _metricsScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_metricsScope.NutEggUI = _metricsScope.NutEggUI || {};
_metricsScope.NutEggUI.MetricsComponent = MetricsComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MetricsComponent };
}

