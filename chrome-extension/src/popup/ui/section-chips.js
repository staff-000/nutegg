// ============================================================
// NutEgg Popup UI — Section Chips Component
// ============================================================

class SectionChipsComponent {
  constructor(root = document) {
    this.root = root;
    this.enabledSections = {};
    this.bindElements(root);
  }

  bindElements(root = this.root || (typeof document !== "undefined" ? document : null)) {
    if (!root) return;
    const getEl = (id) => {
      if (root.getElementById) return root.getElementById(id);
      if (root.querySelector) return root.querySelector(`#${id}`);
      return typeof document !== "undefined" ? document.getElementById(id) : null;
    };

    this.sectionsAccordion = getEl("sections-accordion");
    this.sectionsToggle = getEl("sections-toggle");
    this.sectionsChevron = getEl("sections-chevron");
    this.sectionsBody = getEl("sections-body");
    this.sectionsBadge = getEl("sections-badge");

    this.reanalyzeSectionsAccordion = getEl("reanalyze-sections-accordion");
    this.reanalyzeSectionsToggle = getEl("reanalyze-sections-toggle");
    this.reanalyzeSectionsChevron = getEl("reanalyze-sections-chevron");
    this.reanalyzeSectionsBody = getEl("reanalyze-sections-body");
    this.reanalyzeSectionsBadge = getEl("reanalyze-sections-badge");

    this.chipVerdictSummary = getEl("chip-verdict-summary");
    this.chipMindmap = getEl("chip-mindmap");
    this.chipKnowledge = getEl("chip-knowledge");

    this.reanalyzeChipVerdictSummary = getEl("reanalyze-chip-verdict-summary");
    this.reanalyzeChipMindmap = getEl("reanalyze-chip-mindmap");
    this.reanalyzeChipKnowledge = getEl("reanalyze-chip-knowledge");
  }

  init(options = {}) {
    this.bindElements(options.root || this.root);

    if (options.sectionsAccordion) this.sectionsAccordion = options.sectionsAccordion;
    if (options.sectionsToggle) this.sectionsToggle = options.sectionsToggle;
    if (options.sectionsBody) this.sectionsBody = options.sectionsBody;
    if (options.sectionsChevron) this.sectionsChevron = options.sectionsChevron;
    if (options.sectionsBadge) this.sectionsBadge = options.sectionsBadge;

    if (options.reanalyzeAccordion || options.reanalyzeSectionsAccordion) {
      this.reanalyzeSectionsAccordion = options.reanalyzeSectionsAccordion || options.reanalyzeAccordion;
    }
    if (options.reanalyzeToggleBtn || options.reanalyzeSectionsToggle) {
      this.reanalyzeSectionsToggle = options.reanalyzeToggleBtn || options.reanalyzeSectionsToggle;
    }
    if (options.reanalyzeSectionsBody || options.reanalyzeBody) {
      this.reanalyzeSectionsBody = options.reanalyzeSectionsBody || options.reanalyzeBody;
    }
    if (options.reanalyzeSectionsChevron) {
      this.reanalyzeSectionsChevron = options.reanalyzeSectionsChevron;
    }
    if (options.reanalyzeSectionsBadge) {
      this.reanalyzeSectionsBadge = options.reanalyzeSectionsBadge;
    }

    if (options.chipVerdictSummary) this.chipVerdictSummary = options.chipVerdictSummary;
    if (options.reanalyzeChipVerdictSummary) this.reanalyzeChipVerdictSummary = options.reanalyzeChipVerdictSummary;
    if (options.chipMindmap) this.chipMindmap = options.chipMindmap;

    if (options.chipReMindmap || options.reanalyzeChipMindmap) {
      this.reanalyzeChipMindmap = options.chipReMindmap || options.reanalyzeChipMindmap;
    }

    // Capture accordion toggle
    if (this.sectionsToggle && !this.sectionsToggle._hasAccordionListener) {
      this.sectionsToggle._hasAccordionListener = true;
      this.sectionsToggle.addEventListener("click", () => {
        const isHidden = this.sectionsBody?.classList.toggle("hidden");
        if (this.sectionsChevron) this.sectionsChevron.textContent = isHidden ? "▸" : "▾";
        this.sectionsToggle?.setAttribute("aria-expanded", String(!isHidden));
      });
    }

    // Re-analyze accordion toggle
    if (this.reanalyzeSectionsToggle && !this.reanalyzeSectionsToggle._hasAccordionListener) {
      this.reanalyzeSectionsToggle._hasAccordionListener = true;
      this.reanalyzeSectionsToggle.addEventListener("click", () => {
        const isHidden = this.reanalyzeSectionsBody?.classList.toggle("hidden");
        if (this.reanalyzeSectionsChevron) this.reanalyzeSectionsChevron.textContent = isHidden ? "▸" : "▾";
        this.reanalyzeSectionsToggle?.setAttribute("aria-expanded", String(!isHidden));
      });
    }

    const allChips = [
      { el: this.chipVerdictSummary, key: "verdictSummary" },
      { el: this.chipMindmap, key: "mindMap" },
      { el: this.chipKnowledge, key: "generateKnowledgeEntries" },
      { el: this.reanalyzeChipVerdictSummary, key: "verdictSummary" },
      { el: this.reanalyzeChipMindmap, key: "mindMap" },
      { el: this.reanalyzeChipKnowledge, key: "generateKnowledgeEntries" },
    ];

    allChips.forEach(({ el, key }) => {
      if (!el) return;
      if (el._chipClickListener) {
        el.removeEventListener?.("click", el._chipClickListener);
      }
      el._chipClickListener = async () => {
        if (options.onToggle) {
          await options.onToggle(key);
        } else if (options.onSectionToggle) {
          const current = this.enabledSections || {};
          const currentVal = current[key] !== false;
          const nextVal = !currentVal;
          const keys = key === "verdictSummary" ? ["titleVerdict", "coreSummary"] : [key];
          const newSections = { ...current, ...Object.fromEntries(keys.map(k => [k, nextVal])) };
          await options.onSectionToggle(key, nextVal, newSections);
        }
      };
      el.addEventListener("click", el._chipClickListener);
    });
  }

  updateUI(enabledSections = {}, generateKnowledgeEntries = true) {
    enabledSections = { ...enabledSections, generateKnowledgeEntries, verdictSummary: enabledSections.titleVerdict !== false && enabledSections.coreSummary !== false };
    this.enabledSections = enabledSections;
    if (!this.chipVerdictSummary && (this.root || typeof document !== "undefined")) {
      this.bindElements(this.root || document);
    }

    const map = [
      { el: this.chipVerdictSummary, key: "verdictSummary" },
      { el: this.chipMindmap, key: "mindMap" },
      { el: this.chipKnowledge, key: "generateKnowledgeEntries" },
      { el: this.reanalyzeChipVerdictSummary, key: "verdictSummary" },
      { el: this.reanalyzeChipMindmap, key: "mindMap" },
      { el: this.reanalyzeChipKnowledge, key: "generateKnowledgeEntries" },
    ];

    map.forEach(({ el, key }) => {
      if (!el) return;
      const active = enabledSections[key] !== false;
      el.setAttribute?.("aria-pressed", String(active));
      if (active) {
        el.classList.add("active");
        el.classList.remove("inactive");
      } else {
        el.classList.remove("active");
        el.classList.add("inactive");
      }
    });

    const hasKnowledgeChip = Boolean(this.chipKnowledge || this.reanalyzeChipKnowledge);
    const total = hasKnowledgeChip ? 3 : 2;
    const activeCount = [
      enabledSections.verdictSummary,
      enabledSections.mindMap !== false,
      ...(hasKnowledgeChip ? [generateKnowledgeEntries] : []),
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

