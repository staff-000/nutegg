// ============================================================
// NutEgg Popup UI — Section Chips Component
// ============================================================

class SectionChipsComponent {
  constructor(root = document) {
    this.root = root;
    this.sectionsToggle = root.getElementById("sections-toggle");
    this.sectionsChevron = root.getElementById("sections-chevron");
    this.sectionsBody = root.getElementById("sections-body");
    this.sectionsBadge = root.getElementById("sections-badge");

    this.reanalyzeSectionsToggle = root.getElementById("reanalyze-sections-toggle");
    this.reanalyzeSectionsChevron = root.getElementById("reanalyze-sections-chevron");
    this.reanalyzeSectionsBody = root.getElementById("reanalyze-sections-body");
    this.reanalyzeSectionsBadge = root.getElementById("reanalyze-sections-badge");

    this.chipVerdict = root.getElementById("chip-verdict");
    this.chipSummary = root.getElementById("chip-summary");
    this.chipMindmap = root.getElementById("chip-mindmap");
    this.chipChapters = root.getElementById("chip-chapters");

    this.reanalyzeChipVerdict = root.getElementById("reanalyze-chip-verdict");
    this.reanalyzeChipSummary = root.getElementById("reanalyze-chip-summary");
    this.reanalyzeChipMindmap = root.getElementById("reanalyze-chip-mindmap");
    this.reanalyzeChipChapters = root.getElementById("reanalyze-chip-chapters");
  }

  init(options = {}) {
    const onToggle = options.onToggle || (() => {});
    const onWarning = options.onWarning || (() => {});

    // Capture accordion toggle
    this.sectionsToggle?.addEventListener("click", () => {
      const isHidden = this.sectionsBody?.classList.toggle("hidden");
      if (this.sectionsChevron) this.sectionsChevron.textContent = isHidden ? "▸" : "▾";
      this.sectionsToggle?.setAttribute("aria-expanded", String(!isHidden));
    });

    // Re-analyze accordion toggle
    this.reanalyzeSectionsToggle?.addEventListener("click", () => {
      const isHidden = this.reanalyzeSectionsBody?.classList.toggle("hidden");
      if (this.reanalyzeSectionsChevron) this.reanalyzeSectionsChevron.textContent = isHidden ? "▸" : "▾";
      this.reanalyzeSectionsToggle?.setAttribute("aria-expanded", String(!isHidden));
    });

    const allChips = [
      { el: this.chipVerdict, key: "titleVerdict" },
      { el: this.chipSummary, key: "coreSummary" },
      { el: this.chipMindmap, key: "mindMap" },
      { el: this.chipChapters, key: "chapterMap" },
      { el: this.reanalyzeChipVerdict, key: "titleVerdict" },
      { el: this.reanalyzeChipSummary, key: "coreSummary" },
      { el: this.reanalyzeChipMindmap, key: "mindMap" },
      { el: this.reanalyzeChipChapters, key: "chapterMap" },
    ];

    allChips.forEach(({ el, key }) => {
      if (!el) return;
      el.addEventListener("click", () => {
        onToggle(key);
      });
    });
  }

  updateUI(enabledSections = {}) {
    const map = [
      { el: this.chipVerdict, key: "titleVerdict" },
      { el: this.chipSummary, key: "coreSummary" },
      { el: this.chipMindmap, key: "mindMap" },
      { el: this.chipChapters, key: "chapterMap" },
      { el: this.reanalyzeChipVerdict, key: "titleVerdict" },
      { el: this.reanalyzeChipSummary, key: "coreSummary" },
      { el: this.reanalyzeChipMindmap, key: "mindMap" },
      { el: this.reanalyzeChipChapters, key: "chapterMap" },
    ];

    map.forEach(({ el, key }) => {
      if (!el) return;
      const active = enabledSections[key] !== false;
      if (active) {
        el.classList.add("active");
        el.classList.remove("inactive");
      } else {
        el.classList.remove("active");
        el.classList.add("inactive");
      }
    });

    const total = 4;
    const activeCount = [
      enabledSections.titleVerdict !== false,
      enabledSections.coreSummary !== false,
      enabledSections.mindMap !== false,
      enabledSections.chapterMap !== false,
    ].filter(Boolean).length;

    const badgeText = `${activeCount}/${total}`;
    if (this.sectionsBadge) this.sectionsBadge.textContent = badgeText;
    if (this.reanalyzeSectionsBadge) this.reanalyzeSectionsBadge.textContent = badgeText;
  }
}

const _chipsScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_chipsScope.NutEggUI = _chipsScope.NutEggUI || {};
_chipsScope.NutEggUI.SectionChipsComponent = SectionChipsComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SectionChipsComponent };
}

