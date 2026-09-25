// ============================================================
// NutEgg Popup UI — Eggs Component
// ============================================================

const _eggT = (key, params) => {
  if (typeof t === "function") return t(key, params);
  if (typeof window !== "undefined" && window.NutEggI18n) return window.NutEggI18n.t(key, params);
  return key;
};

function _eggEscapeHtml(str) {
  if (typeof escapeHtml === "function") return escapeHtml(str);
  if (typeof document !== "undefined" && document.createElement) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanEggName(fileName) {
  if (!fileName) return "Egg";
  return fileName.split("/").pop().replace(/\.md$/, "");
}

/** Render target egg checklist on the capture screen (State 1). */
function renderCaptureEggsList(options = {}) {
  const listEl = options.captureEggsList || (typeof captureEggsList !== "undefined" ? captureEggsList : (typeof document !== "undefined" ? document.getElementById("capture-eggs-list") : null));
  const toggleEl = options.captureEggsToggle || (typeof captureEggsToggle !== "undefined" ? captureEggsToggle : (typeof document !== "undefined" ? document.getElementById("capture-eggs-toggle") : null));
  const eggs = options.allEggs || (typeof allEggs !== "undefined" ? allEggs : (typeof window !== "undefined" ? window.allEggs : [])) || [];
  const selected = options.preSelectedEggs || (typeof preSelectedEggs !== "undefined" ? preSelectedEggs : (typeof window !== "undefined" ? window.preSelectedEggs : null)) || new Set();
  const onLabelUpdate = options.updateLabel || (typeof updateCaptureEggsLabel === "function" ? updateCaptureEggsLabel : null);

  if (!listEl || !toggleEl) return;
  if (eggs.length === 0) {
    toggleEl.classList.add("hidden");
    return;
  }
  toggleEl.classList.remove("hidden");
  listEl.innerHTML = eggs
    .map((e) => {
      const checked = selected.has(e.fileName) ? "checked" : "";
      return `<label class="egg-row">
        <input type="checkbox" data-capture-egg="${_eggEscapeHtml(e.fileName)}" ${checked} />
        <span class="egg-row-name">${_eggEscapeHtml(e.fileName)}</span>
        <span class="egg-row-desc">${_eggEscapeHtml(e.description || e.topic || "")}</span>
      </label>`;
    })
    .join("");

  listEl.querySelectorAll("input").forEach((cb) => {
    cb.addEventListener("change", (ev) => {
      const name = ev.target.dataset.captureEgg;
      if (ev.target.checked) selected.add(name);
      else selected.delete(name);
      if (onLabelUpdate) onLabelUpdate();
    });
  });
  if (onLabelUpdate) onLabelUpdate();
}

function updateCaptureEggsLabel(options = {}) {
  const labelEl = options.captureEggsLabel || (typeof captureEggsLabel !== "undefined" ? captureEggsLabel : (typeof document !== "undefined" ? document.getElementById("capture-eggs-label") : null));
  const selected = options.preSelectedEggs || (typeof preSelectedEggs !== "undefined" ? preSelectedEggs : (typeof window !== "undefined" ? window.preSelectedEggs : null)) || new Set();
  if (!labelEl) return;
  if (selected.size === 0) {
    labelEl.textContent = _eggT("autoDetect");
  } else if (selected.size === 1) {
    const egg = [...selected][0].split("/").pop();
    labelEl.textContent = `(${egg})`;
  } else {
    labelEl.textContent = _eggT("countSelected", { count: selected.size });
  }
}

/**
 * Render the egg picker: the matched eggs are checked; changing any box
 * reveals the "Re-analyze with selected eggs" button.
 */
function renderEggsSection(matchedEggs = [], options = {}) {
  const eggs = options.allEggs || (typeof allEggs !== "undefined" ? allEggs : (typeof window !== "undefined" ? window.allEggs : [])) || [];
  // Include matched eggs that are missing from the index list (index drift)
  for (const m of matchedEggs) {
    if (!eggs.some((e) => e.fileName === m)) {
      eggs.push({ fileName: m, description: "", topic: "" });
    }
  }

  const sectionEl = options.eggsSection || (typeof eggsSection !== "undefined" ? eggsSection : (typeof document !== "undefined" ? document.getElementById("eggs-section") : null));
  const listEl = options.eggsList || (typeof eggsList !== "undefined" ? eggsList : (typeof document !== "undefined" ? document.getElementById("eggs-list") : null));
  const expandedEl = options.eggsExpanded || (typeof eggsExpanded !== "undefined" ? eggsExpanded : (typeof document !== "undefined" ? document.getElementById("eggs-expanded") : null));
  const chevronEl = options.eggsToggleChevron || (typeof eggsToggleChevron !== "undefined" ? eggsToggleChevron : (typeof document !== "undefined" ? document.getElementById("eggs-toggle-chevron") : null));
  const errorEl = options.eggsErrorEl || (typeof eggsErrorEl !== "undefined" ? eggsErrorEl : (typeof document !== "undefined" ? document.getElementById("eggs-error") : null));
  const toggleLabelEl = options.eggsToggleLabel || (typeof eggsToggleLabel !== "undefined" ? eggsToggleLabel : (typeof document !== "undefined" ? document.getElementById("eggs-toggle-label") : null));
  const reanalyzeBtnEl = options.reanalyzeEggsBtn || (typeof reanalyzeEggsBtn !== "undefined" ? reanalyzeEggsBtn : (typeof document !== "undefined" ? document.getElementById("reanalyze-eggs-btn") : null));
  const createFormEl = options.eggsCreateForm || (typeof eggsCreateForm !== "undefined" ? eggsCreateForm : (typeof document !== "undefined" ? document.getElementById("eggs-create-form") : null));

  if (eggs.length === 0) {
    if (sectionEl) sectionEl.classList.add("hidden");
    if (listEl) listEl.innerHTML = "";
    return;
  }

  if (typeof selectedEggs !== "undefined") {
    selectedEggs = new Set(matchedEggs);
  }
  const currentSelected = options.selectedEggs || (typeof selectedEggs !== "undefined" ? selectedEggs : (typeof window !== "undefined" ? window.selectedEggs : null)) || new Set(matchedEggs);

  if (sectionEl) sectionEl.classList.remove("hidden");
  if (expandedEl) expandedEl.classList.add("hidden");
  if (chevronEl) chevronEl.textContent = "▸";
  if (errorEl) errorEl.classList.add("hidden");
  if (toggleLabelEl) {
    toggleLabelEl.textContent = matchedEggs.length > 0
      ? _eggT("countMatched", { count: matchedEggs.length })
      : _eggT("noneMatched");
  }

  if (listEl) {
    listEl.innerHTML = eggs
      .map((e) => {
        const checked = currentSelected.has(e.fileName) ? "checked" : "";
        return `<label class="egg-row">
          <input type="checkbox" data-egg="${_eggEscapeHtml(e.fileName)}" ${checked} />
          <span class="egg-row-name">${_eggEscapeHtml(e.fileName)}</span>
          <span class="egg-row-desc">${_eggEscapeHtml(e.description || e.topic || "")}</span>
        </label>`;
      })
      .join("");
    listEl.querySelectorAll("input").forEach((cb) => {
      cb.addEventListener("change", (ev) => {
        const name = ev.target.dataset.egg;
        if (ev.target.checked) currentSelected.add(name);
        else currentSelected.delete(name);
        const stage = typeof analysisResult !== "undefined" ? analysisResult?.stage : null;
        if (stage === "stage1") {
          reanalyzeBtnEl?.classList.add("hidden");
        } else {
          reanalyzeBtnEl?.classList.remove("hidden");
        }
        if (options.onSelectChange) {
          options.onSelectChange(name, ev.target.checked);
        } else if (typeof updateStage1ProceedBtn === "function") {
          updateStage1ProceedBtn();
        }
      });
    });
  }

  if (reanalyzeBtnEl) reanalyzeBtnEl.classList.add("hidden");
  if (createFormEl) createFormEl.classList.add("hidden");
}

function renderEggKnowledge(eggResults = [], options = {}) {
  const sectionEl = options.eggKnowledgeSection || (typeof eggKnowledgeSection !== "undefined" ? eggKnowledgeSection : (typeof document !== "undefined" ? document.getElementById("egg-knowledge-section") : null));
  const contentEl = options.eggKnowledgeContent || (typeof eggKnowledgeContent !== "undefined" ? eggKnowledgeContent : (typeof document !== "undefined" ? document.getElementById("egg-knowledge-content") : null));
  const tabsBarEl = options.eggTabsBar || (typeof eggTabsBar !== "undefined" ? eggTabsBar : (typeof document !== "undefined" ? document.getElementById("egg-tabs-bar") : null));
  const hintEl = options.eggKnowledgeHint || (typeof eggKnowledgeHint !== "undefined" ? eggKnowledgeHint : (typeof document !== "undefined" ? document.getElementById("egg-knowledge-hint") : null));

  if (!sectionEl || !contentEl) return;

  if (eggResults.length === 0) {
    sectionEl.classList.add("hidden");
    contentEl.innerHTML = "";
    if (tabsBarEl) tabsBarEl.innerHTML = "";
    return;
  }

  sectionEl.classList.remove("hidden");

  // Determine active tab
  const eggNames = eggResults.map((r) => r.egg);
  let activeTab = options.activeEggTab || (typeof activeEggTab !== "undefined" ? activeEggTab : (typeof window !== "undefined" ? window.activeEggTab : null));
  if (!activeTab || (!eggNames.includes(activeTab) && activeTab !== "all")) {
    const eggWithDeltas = eggResults.find((r) => (r.novelDelta || []).length > 0);
    activeTab = eggWithDeltas ? eggWithDeltas.egg : eggResults[0].egg;
    if (typeof activeEggTab !== "undefined") {
      activeEggTab = activeTab;
    }
    if (typeof window !== "undefined") {
      window.activeEggTab = activeTab;
    }
  }

  // Render Tabs (only if 2+ eggs)
  if (eggResults.length > 1 && tabsBarEl) {
    tabsBarEl.classList.remove("hidden");
    if (hintEl) hintEl.textContent = _eggT("eggsMatchedCount", { count: eggResults.length });

    const totalNewCount = eggResults.reduce((acc, r) => acc + (r.novelDelta?.length || 0), 0);

    const tabsHtml = eggResults
      .map((r) => {
        const newCount = (r.novelDelta || []).length;
        let badgeClass = "badge-tab-covered";
        let badgeText = "✓";
        if (r.rejected) {
          badgeClass = "badge-tab-reject";
          badgeText = "✕";
        } else if (newCount > 0) {
          badgeClass = "badge-tab-new";
          badgeText = `+${newCount}`;
        }

        const isActive = activeTab === r.egg ? " active" : "";
        return `
          <button type="button" class="egg-tab-btn${isActive}" data-tab="${_eggEscapeHtml(r.egg)}" title="${_eggEscapeHtml(r.egg)}">
            <span class="egg-tab-name">${_eggEscapeHtml(cleanEggName(r.egg))}</span>
            <span class="egg-tab-badge ${badgeClass}">${badgeText}</span>
          </button>`;
      })
      .join("");

    const isAllActive = activeTab === "all" ? " active" : "";
    const allBadgeText = totalNewCount > 0 ? `+${totalNewCount}` : "✓";
    const allBadgeClass = totalNewCount > 0 ? "badge-tab-new" : "badge-tab-covered";

    tabsBarEl.innerHTML =
      tabsHtml +
      `
      <button type="button" class="egg-tab-btn${isAllActive}" data-tab="all" title="${_eggEscapeHtml(_eggT("viewAllEggs"))}">
        <span class="egg-tab-name">📋 ${_eggEscapeHtml(_eggT("allEggsTab"))}</span>
        <span class="egg-tab-badge ${allBadgeClass}">${allBadgeText}</span>
      </button>`;

    // Tab click listeners
    tabsBarEl.querySelectorAll(".egg-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (typeof activeEggTab !== "undefined") {
          activeEggTab = btn.dataset.tab;
        }
        if (typeof window !== "undefined") {
          window.activeEggTab = btn.dataset.tab;
        }
        activeTab = btn.dataset.tab;
        if (options.onTabChange) {
          options.onTabChange(activeTab);
        }
        renderEggKnowledge(eggResults, options);
      });
    });
  } else if (tabsBarEl) {
    tabsBarEl.classList.add("hidden");
    tabsBarEl.innerHTML = "";
    if (hintEl) hintEl.textContent = `(${cleanEggName(eggResults[0]?.egg)})`;
    if (typeof activeEggTab !== "undefined") {
      activeEggTab = eggResults[0]?.egg;
    }
    if (typeof window !== "undefined") {
      window.activeEggTab = eggResults[0]?.egg;
    }
  }

  // Render Egg Cards
  contentEl.innerHTML = eggResults
    .map((r) => {
      const isVisible = activeTab === "all" || activeTab === r.egg;
      const hideClass = isVisible ? "" : " hidden";
      const newDeltas = r.novelDelta || [];
      const redundantDeltas = r.redundantEntries || [];
      const existingKnowledge = (r.existingKnowledge || "").trim();
      const qaItems = r.keyQuestionAnswers || [];

      let statusHeader = "";
      if (eggResults.length > 1 && activeTab === "all") {
        statusHeader = `
          <div class="egg-card-header">
            <span class="egg-card-title">📄 ${_eggEscapeHtml(cleanEggName(r.egg))}</span>
            <span class="egg-card-file">${_eggEscapeHtml(r.egg)}</span>
          </div>`;
      }

      let statusNote = "";
      if (r.rejected) {
        statusNote = `
          <div class="egg-status-banner banner-reject">
            ${_eggT("rejectedByEgg", { reason: _eggEscapeHtml(r.rejectReason || _eggT("outOfScope")) })}
          </div>`;
      } else if (newDeltas.length === 0 && redundantDeltas.length > 0) {
        statusNote = `
          <div class="egg-status-banner banner-covered">
            ${_eggT("fullyCoveredNotice")}
          </div>`;
      } else if (newDeltas.length === 0 && qaItems.length === 0) {
        statusNote = `
          <div class="egg-status-banner banner-covered">
            ${_eggT("noNewKnowledgeNotice")}
          </div>`;
      }

      let newHtml = "";
      if (newDeltas.length > 0) {
        newHtml = `
          <div class="knowledge-subsection">
            <div class="knowledge-subhead new-subhead">${_eggT("newInsightsHeading", { count: newDeltas.length })}</div>
            ${newDeltas
              .map(
                (d) => `
                <div class="delta-item is-new">
                  <div class="delta-header">
                    <span class="delta-badge badge-new">${_eggT("badgeNewEntry")}</span>
                    <span class="delta-parent">${d.parent ? _eggT("unprocessedParent", { parent: _eggEscapeHtml(d.parent) }) : _eggT("unprocessedOnly")}</span>
                  </div>
                  <div class="delta-content">${_eggEscapeHtml(d.content)}</div>
                </div>`
              )
              .join("")}
          </div>`;
      }

      let qaHtml = "";
      if (qaItems.length > 0) {
        const linkify = typeof linkifyTimestamps === "function" ? linkifyTimestamps : (t) => t;
        const renderSources = typeof renderQaSources === "function" ? renderQaSources : () => "";
        qaHtml = `
          <div class="knowledge-subsection egg-qa-block">
            <div class="knowledge-subhead qa-subhead">${_eggT("eggKeyQuestions", { count: qaItems.length })}</div>
            ${qaItems
              .map(
                (qa) => `
                <div class="qa-item">
                  <div class="qa-question">Q: ${_eggEscapeHtml(qa.question)}</div>
                  <div class="qa-answer">${linkify(_eggEscapeHtml(qa.answer))}</div>
                  ${renderSources(qa.sources)}
                </div>`
              )
              .join("")}
          </div>`;
      }

      let redundantHtml = "";
      if (redundantDeltas.length > 0) {
        redundantHtml = `
          <div class="existing-tree-container">
            <div class="existing-tree-header">
              <span class="existing-tree-title">${_eggT("alreadyCoveredHeading", { count: redundantDeltas.length })}</span>
              <button type="button" class="covered-toggle">${_eggT("viewCovered")}</button>
            </div>
            <div class="covered-body hidden">
              ${redundantDeltas
                .map(
                  (d) => `
                  <div class="delta-item is-covered">
                    <div class="delta-header">
                      <span class="delta-badge badge-covered">${_eggT("badgeCovered")}</span>
                      <span class="delta-parent">${d.existingParent ? _eggT("underParent", { parent: _eggEscapeHtml(d.existingParent) }) : _eggT("alreadyKnown")}</span>
                    </div>
                    <div class="delta-content">${_eggEscapeHtml(d.content)}</div>
                  </div>`
                )
                .join("")}
            </div>
          </div>`;
      }

      let treeHtml = "";
      if (existingKnowledge) {
        treeHtml = `
          <div class="existing-tree-container">
            <div class="existing-tree-header">
              <span class="existing-tree-title">${_eggT("currentKnowledgeInEgg")}</span>
              <button type="button" class="existing-tree-toggle">${_eggT("viewTree")}</button>
            </div>
            <div class="existing-tree-body hidden">${_eggEscapeHtml(existingKnowledge)}</div>
          </div>`;
      }

      return `
        <div class="egg-card${hideClass}" data-egg="${_eggEscapeHtml(r.egg)}">
          ${statusHeader}
          ${statusNote}
          ${newHtml}
          ${qaHtml}
          ${redundantHtml}
          ${treeHtml}
        </div>`;
    })
    .join("");

  // Wire covered toggles
  contentEl.querySelectorAll(".covered-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const body = btn.closest(".existing-tree-container")?.querySelector(".covered-body");
      if (body) {
        const isHidden = body.classList.toggle("hidden");
        btn.textContent = isHidden ? _eggT("viewCovered") : _eggT("hideCovered");
      }
    });
  });

  // Wire tree toggles
  contentEl.querySelectorAll(".existing-tree-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const body = btn.closest(".existing-tree-container")?.querySelector(".existing-tree-body");
      if (body) {
        const isHidden = body.classList.toggle("hidden");
        btn.textContent = isHidden ? _eggT("viewTree") : _eggT("hideTree");
      }
    });
  });
}

class EggsComponent {
  constructor(root = document) {
    this.root = root;
    this.eggKnowledgeSection = root.getElementById("egg-knowledge-section");
    this.eggKnowledgeHint = root.getElementById("egg-knowledge-hint");
    this.eggTabsBar = root.getElementById("egg-tabs-bar");
    this.eggKnowledgeContent = root.getElementById("egg-knowledge-content");
    this.noEggSection = root.getElementById("no-egg-section");
    this.newEggName = root.getElementById("new-egg-name");
    this.newEggDescription = root.getElementById("new-egg-description");
    this.createEggBtn = root.getElementById("create-egg-btn");
    this.eggsSection = root.getElementById("eggs-section");
    this.eggsToggle = root.getElementById("eggs-toggle");
    this.eggsToggleLabel = root.getElementById("eggs-toggle-label");
    this.eggsToggleChevron = root.getElementById("eggs-toggle-chevron");
    this.eggsExpanded = root.getElementById("eggs-expanded");
    this.eggsList = root.getElementById("eggs-list");
    this.reanalyzeEggsBtn = root.getElementById("reanalyze-eggs-btn");
    this.eggsErrorEl = root.getElementById("eggs-error");
    this.eggsCreateToggle = root.getElementById("eggs-create-toggle");
    this.eggsCreateForm = root.getElementById("eggs-create-form");
    this.eggsNewName = root.getElementById("eggs-new-name");
    this.eggsNewDesc = root.getElementById("eggs-new-desc");
    this.eggsCreateBtn = root.getElementById("eggs-create-btn");
    this.captureEggsToggle = root.getElementById("capture-eggs-toggle");
    this.captureEggsLabel = root.getElementById("capture-eggs-label");
    this.captureEggsChevron = root.getElementById("capture-eggs-chevron");
    this.captureEggsArea = root.getElementById("capture-eggs-area");
    this.captureEggsList = root.getElementById("capture-eggs-list");
  }
}

const _eggScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_eggScope.NutEggUI = _eggScope.NutEggUI || {};
_eggScope.NutEggUI.EggsComponent = EggsComponent;
_eggScope.NutEggUI.cleanEggName = cleanEggName;
_eggScope.NutEggUI.renderCaptureEggsList = renderCaptureEggsList;
_eggScope.NutEggUI.updateCaptureEggsLabel = updateCaptureEggsLabel;
_eggScope.NutEggUI.renderEggsSection = renderEggsSection;
_eggScope.NutEggUI.renderEggKnowledge = renderEggKnowledge;
_eggScope.EggsComponent = EggsComponent;
_eggScope.cleanEggName = cleanEggName;
_eggScope.renderCaptureEggsList = renderCaptureEggsList;
_eggScope.updateCaptureEggsLabel = updateCaptureEggsLabel;
_eggScope.renderEggsSection = renderEggsSection;
_eggScope.renderEggKnowledge = renderEggKnowledge;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    EggsComponent,
    cleanEggName,
    renderCaptureEggsList,
    updateCaptureEggsLabel,
    renderEggsSection,
    renderEggKnowledge,
  };
}

