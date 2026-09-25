// ============================================================
// NutEgg Popup UI — Collapsible Sections
// ============================================================

/** Initialize collapsible behavior for all result sections in results-state. */
function initCollapsibleSections() {
  document.querySelectorAll("#results-state .result-section").forEach((section) => {
    const header = section.querySelector(".section-header");
    const content = section.querySelector(".section-content");
    const chevron = section.querySelector(".section-chevron");
    if (!header || !content || !chevron) return;

    if (header.dataset.collapsibleInit) return;
    header.dataset.collapsibleInit = "true";

    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.setAttribute("aria-expanded", "true");
    header.setAttribute("title", "Click to collapse / expand section");

    const toggle = (e) => {
      if (e.target.closest("button, a, input, select, textarea")) return;
      const isCollapsed = content.classList.toggle("collapsed");
      chevron.classList.toggle("collapsed", isCollapsed);
      const svg = chevron.querySelector("svg");
      if (!svg) {
        chevron.textContent = isCollapsed ? "▸" : "▾";
      }
      header.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
    };

    header.addEventListener("click", toggle);
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(e);
      }
    });
  });
}

/** Reset all result sections to expanded state. */
function resetCollapsibleSections() {
  document.querySelectorAll("#results-state .result-section").forEach((section) => {
    const header = section.querySelector(".section-header");
    const content = section.querySelector(".section-content");
    const chevron = section.querySelector(".section-chevron");
    if (content && chevron && header) {
      content.classList.remove("collapsed");
      chevron.classList.remove("collapsed");
      const svg = chevron.querySelector("svg");
      if (!svg) {
        chevron.textContent = "▾";
      }
      header.setAttribute("aria-expanded", "true");
    }
  });
}

const _collapsibleScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_collapsibleScope.NutEggUI = _collapsibleScope.NutEggUI || {};
_collapsibleScope.NutEggUI.initCollapsibleSections = initCollapsibleSections;
_collapsibleScope.NutEggUI.resetCollapsibleSections = resetCollapsibleSections;
_collapsibleScope.initCollapsibleSections = initCollapsibleSections;
_collapsibleScope.resetCollapsibleSections = resetCollapsibleSections;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    initCollapsibleSections,
    resetCollapsibleSections,
  };
}
