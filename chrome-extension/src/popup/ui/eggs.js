// ============================================================
// NutEgg Popup UI — Eggs Component
// ============================================================

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
function _renderCaptureEggsList(options = {}) {
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

function _updateCaptureEggsLabel(options = {}) {
  const labelEl = options.captureEggsLabel || (typeof captureEggsLabel !== "undefined" ? captureEggsLabel : (typeof document !== "undefined" ? document.getElementById("capture-eggs-label") : null));
  const selected = options.preSelectedEggs || (typeof preSelectedEggs !== "undefined" ? preSelectedEggs : (typeof window !== "undefined" ? window.preSelectedEggs : null)) || new Set();
  if (!labelEl) return;
  if (selected.size === 0) {
    labelEl.textContent = t("autoDetect");
  } else if (selected.size === 1) {
    const egg = [...selected][0].split("/").pop();
    labelEl.textContent = `(${egg})`;
  } else {
    labelEl.textContent = t("countSelected", { count: selected.size });
  }
}

/**
 * Render the egg picker: the matched eggs are checked; changing any box
 * reveals the "Re-analyze with selected eggs" button.
 */
function _renderEggsSection(firstArg = [], options = {}) {
  const matchedEggs = Array.isArray(firstArg) ? firstArg : (firstArg?.matchedEggs || []);
  const opts = Array.isArray(firstArg) ? options : (firstArg || {});
  const rawEggs = opts.allEggs || (typeof session !== "undefined" ? session.allEggs : null) || (typeof allEggs !== "undefined" ? allEggs : (typeof window !== "undefined" ? window.allEggs : [])) || [];
  const eggs = rawEggs.map((e) => (typeof e === "string" ? { fileName: e, description: "", topic: "" } : { ...e }));
  // Include matched eggs that are missing from the index list (index drift)
  for (const m of matchedEggs) {
    const mName = typeof m === "string" ? m : m?.fileName;
    if (mName && !eggs.some((e) => e.fileName === mName)) {
      eggs.push({ fileName: mName, description: "", topic: "" });
    }
  }

  const sectionEl = opts.eggsSection || (typeof eggsSection !== "undefined" ? eggsSection : (typeof document !== "undefined" ? document.getElementById("eggs-section") : null));
  const listEl = opts.eggsList || (typeof eggsList !== "undefined" ? eggsList : (typeof document !== "undefined" ? document.getElementById("eggs-list") : null));
  const expandedEl = opts.eggsExpanded || (typeof eggsExpanded !== "undefined" ? eggsExpanded : (typeof document !== "undefined" ? document.getElementById("eggs-expanded") : null));
  const chevronEl = opts.eggsToggleChevron || (typeof eggsToggleChevron !== "undefined" ? eggsToggleChevron : (typeof document !== "undefined" ? document.getElementById("eggs-toggle-chevron") : null));
  const errorEl = opts.eggsErrorEl || (typeof eggsErrorEl !== "undefined" ? eggsErrorEl : (typeof document !== "undefined" ? document.getElementById("eggs-error") : null));
  const toggleLabelEl = opts.eggsToggleLabel || (typeof eggsToggleLabel !== "undefined" ? eggsToggleLabel : (typeof document !== "undefined" ? document.getElementById("eggs-toggle-label") : null));
  const reanalyzeBtnEl = opts.reanalyzeEggsBtn || (typeof reanalyzeEggsBtn !== "undefined" ? reanalyzeEggsBtn : (typeof document !== "undefined" ? document.getElementById("reanalyze-eggs-btn") : null));
  const reanalyzeRefreshBtnEl = opts.reanalyzeEggsRefreshBtn || (typeof reanalyzeEggsRefreshBtn !== "undefined" ? reanalyzeEggsRefreshBtn : (typeof document !== "undefined" ? document.getElementById("reanalyze-eggs-refresh-btn") : null));
  const createFormEl = opts.eggsCreateForm || (typeof eggsCreateForm !== "undefined" ? eggsCreateForm : (typeof document !== "undefined" ? document.getElementById("eggs-create-form") : null));
  const createToggleEl = opts.eggsCreateToggle || (typeof eggsCreateToggle !== "undefined" ? eggsCreateToggle : (typeof document !== "undefined" ? document.getElementById("eggs-create-toggle") : null));

  if (eggs.length === 0) {
    if (listEl) {
      listEl.innerHTML = `<div class="eggs-empty-notice" style="padding: 8px 10px; font-size: 12px; color: #6b7280; font-style: italic;">🐣 No eggs found in your vault yet. Create your first egg below to hatch:</div>`;
    }
    if (createFormEl) {
      createFormEl.classList.remove("hidden");
    }
    if (createToggleEl) {
      createToggleEl.classList.add("hidden");
      createToggleEl.textContent = t("createNewEgg");
    }
    if (sectionEl) sectionEl.classList.remove("hidden");
    if (expandedEl) expandedEl.classList.remove("hidden");
    if (toggleLabelEl) toggleLabelEl.textContent = t("noneMatched");
    return;
  }

  if (typeof selectedEggs !== "undefined") {
    selectedEggs = new Set(matchedEggs);
  }
  const currentSelected = opts.selectedEggs || (typeof session !== "undefined" ? session.selectedEggs : null) || (typeof selectedEggs !== "undefined" ? selectedEggs : (typeof window !== "undefined" ? window.selectedEggs : null)) || new Set();
  if (currentSelected.size === 0 && Array.isArray(matchedEggs) && matchedEggs.length > 0) {
    matchedEggs.forEach((m) => {
      const name = typeof m === "string" ? m : m?.fileName;
      if (name) currentSelected.add(name);
    });
  }

  if (sectionEl) sectionEl.classList.remove("hidden");
  const shouldExpand = opts.expand === true || (expandedEl && !expandedEl.classList.contains("hidden"));
  if (shouldExpand) {
    if (expandedEl) expandedEl.classList.remove("hidden");
    if (chevronEl) chevronEl.textContent = "▾";
  } else {
    if (expandedEl) expandedEl.classList.add("hidden");
    if (chevronEl) chevronEl.textContent = "▸";
  }
  if (errorEl) errorEl.classList.add("hidden");
  if (toggleLabelEl) {
    if (opts.allRejected) {
      toggleLabelEl.textContent = t("noneMatched");
    } else {
      toggleLabelEl.textContent = matchedEggs.length > 0
        ? t("countMatched", { count: matchedEggs.length })
        : t("noneMatched");
    }
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
          reanalyzeRefreshBtnEl?.classList.add("hidden");
        } else {
          reanalyzeBtnEl?.classList.remove("hidden");
          reanalyzeRefreshBtnEl?.classList.remove("hidden");
        }
        if (opts.onSelectChange) {
          opts.onSelectChange(name, ev.target.checked);
        } else if (typeof updateStage1ProceedBtn === "function") {
          updateStage1ProceedBtn();
        }
      });
    });
  }

  if (reanalyzeBtnEl) reanalyzeBtnEl.classList.add("hidden");
  if (reanalyzeRefreshBtnEl) reanalyzeRefreshBtnEl.classList.add("hidden");
  if (createFormEl) createFormEl.classList.add("hidden");
  if (createToggleEl) {
    createToggleEl.classList.remove("hidden");
    createToggleEl.textContent = t("createNewEgg");
  }
}

function _renderEggKnowledge(firstArg = [], options = {}) {
  const eggResults = Array.isArray(firstArg) ? firstArg : (firstArg?.eggResults || []);
  const opts = Array.isArray(firstArg) ? options : (firstArg || {});
  const sectionEl = opts.eggKnowledgeSection || (typeof eggKnowledgeSection !== "undefined" ? eggKnowledgeSection : (typeof document !== "undefined" ? document.getElementById("egg-knowledge-section") : null));
  const contentEl = opts.eggKnowledgeContent || (typeof eggKnowledgeContent !== "undefined" ? eggKnowledgeContent : (typeof document !== "undefined" ? document.getElementById("egg-knowledge-content") : null));
  const tabsBarEl = opts.eggTabsBar || (typeof eggTabsBar !== "undefined" ? eggTabsBar : (typeof document !== "undefined" ? document.getElementById("egg-tabs-bar") : null));
  const hintEl = opts.eggKnowledgeHint || (typeof eggKnowledgeHint !== "undefined" ? eggKnowledgeHint : (typeof document !== "undefined" ? document.getElementById("egg-knowledge-hint") : null));

  if (!sectionEl || !contentEl) return;

  const allRejected = opts.allRejected !== undefined
    ? opts.allRejected
    : (Array.isArray(eggResults) && eggResults.length > 0 && eggResults.every((r) => r.rejected));

  if (!Array.isArray(eggResults) || eggResults.length === 0) {
    if (opts.allRejected || opts.noEggMatched) {
      sectionEl.classList.remove("hidden");
      if (tabsBarEl) {
        tabsBarEl.classList.add("hidden");
        tabsBarEl.innerHTML = "";
      }
      if (hintEl) hintEl.textContent = t("allEggsRejectedHint");
      contentEl.innerHTML = `
        <div class="egg-status-banner banner-reject">
          🚫 <strong>${t("allEggsRejectedTitle")}</strong> — ${t("allEggsRejectedDesc")}
        </div>`;
      return;
    }
    sectionEl.classList.add("hidden");
    contentEl.innerHTML = "";
    if (tabsBarEl) tabsBarEl.innerHTML = "";
    return;
  }

  sectionEl.classList.remove("hidden");

  // Determine active tab
  const eggNames = eggResults.map((r) => r.egg);
  let activeTab = opts.activeEggTab || (typeof activeEggTab !== "undefined" ? activeEggTab : (typeof window !== "undefined" ? window.activeEggTab : null));
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
    if (hintEl) hintEl.textContent = allRejected ? t("allEggsRejectedHint") : t("eggsMatchedCount", { count: eggResults.length });

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
    const allBadgeText = allRejected ? "✕" : (totalNewCount > 0 ? `+${totalNewCount}` : "✓");
    const allBadgeClass = allRejected ? "badge-tab-reject" : (totalNewCount > 0 ? "badge-tab-new" : "badge-tab-covered");

    tabsBarEl.innerHTML =
      tabsHtml +
      `
      <button type="button" class="egg-tab-btn${isAllActive}" data-tab="all" title="${_eggEscapeHtml(t("viewAllEggs"))}">
        <span class="egg-tab-name">📋 ${_eggEscapeHtml(t("allEggsTab"))}</span>
        <span class="egg-tab-badge ${allBadgeClass}">${allBadgeText}</span>
      </button>`;

    // Tab click listeners
    tabsBarEl.querySelectorAll(".egg-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextTab = btn.dataset.tab;
        if (typeof activeEggTab !== "undefined") {
          activeEggTab = nextTab;
        }
        if (typeof window !== "undefined") {
          window.activeEggTab = nextTab;
        }
        activeTab = nextTab;
        if (opts.onTabChange) {
          opts.onTabChange(nextTab);
        }
        _renderEggKnowledge(eggResults, {
          ...opts,
          activeEggTab: nextTab,
        });
      });
    });
  } else if (tabsBarEl) {
    tabsBarEl.classList.add("hidden");
    tabsBarEl.innerHTML = "";
    if (hintEl) {
      hintEl.textContent = allRejected
        ? `(${cleanEggName(eggResults[0]?.egg)} — ${t("noneMatched")})`
        : `(${cleanEggName(eggResults[0]?.egg)})`;
    }
    if (typeof activeEggTab !== "undefined") {
      activeEggTab = eggResults[0]?.egg;
    }
    if (typeof window !== "undefined") {
      window.activeEggTab = eggResults[0]?.egg;
    }
  }

  const allRejectedBanner = allRejected
    ? `<div class="egg-status-banner banner-reject" style="margin-bottom: 12px;">
        🚫 <strong>${t("allEggsRejectedTitle")}</strong> — ${t("allEggsRejectedDesc")}
      </div>`
    : "";

  // Render Egg Cards
  contentEl.innerHTML = allRejectedBanner + eggResults
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
            ${t("rejectedByEgg", { reason: _eggEscapeHtml(r.rejectReason || t("outOfScope")) })}
          </div>`;
      } else if (newDeltas.length === 0 && redundantDeltas.length > 0) {
        statusNote = `
          <div class="egg-status-banner banner-covered">
            ${t("fullyCoveredNotice")}
          </div>`;
      } else if (newDeltas.length === 0 && qaItems.length === 0) {
        statusNote = `
          <div class="egg-status-banner banner-covered">
            ${t("noNewKnowledgeNotice")}
          </div>`;
      }

      let newHtml = "";
      if (newDeltas.length > 0) {
        newHtml = `
          <div class="knowledge-subsection">
            <div class="knowledge-subhead new-subhead">${t("newInsightsHeading", { count: newDeltas.length })}</div>
            ${newDeltas
              .map(
                (d) => `
                <div class="delta-item is-new">
                  <div class="delta-header">
                    <span class="delta-badge badge-new">${t("badgeNewEntry")}</span>
                    <span class="delta-parent">${d.parent ? t("unprocessedParent", { parent: _eggEscapeHtml(d.parent) }) : t("unprocessedOnly")}</span>
                  </div>
                  <div class="delta-content">${_eggEscapeHtml(d.content)}</div>
                </div>`
              )
              .join("")}
          </div>`;
      }

      let qaHtml = "";
      if (qaItems.length > 0) {
        const linkify = (typeof linkifyTimestamps === "function" ? linkifyTimestamps : null)
          || globalThis.NutEggHelpers?.linkifyTimestamps
          || globalThis.linkifyTimestamps
          || ((t) => t);
        const renderSources = (typeof renderQaSources === "function" ? renderQaSources : null)
          || globalThis.NutEggUI?.renderQaSources
          || globalThis.renderQaSources
          || (() => "");
        qaHtml = `
          <div class="knowledge-subsection egg-qa-block">
            <div class="knowledge-subhead qa-subhead">${t("eggKeyQuestions", { count: qaItems.length })}</div>
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
              <span class="existing-tree-title">${t("alreadyCoveredHeading", { count: redundantDeltas.length })}</span>
              <button type="button" class="covered-toggle">${t("viewCovered")}</button>
            </div>
            <div class="covered-body hidden">
              ${redundantDeltas
                .map(
                  (d) => `
                  <div class="delta-item is-covered">
                    <div class="delta-header">
                      <span class="delta-badge badge-covered">${t("badgeCovered")}</span>
                      <span class="delta-parent">${d.existingParent ? t("underParent", { parent: _eggEscapeHtml(d.existingParent) }) : t("alreadyKnown")}</span>
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
              <span class="existing-tree-title">${t("currentKnowledgeInEgg")}</span>
              <button type="button" class="existing-tree-toggle">${t("viewTree")}</button>
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
        btn.textContent = isHidden ? t("viewCovered") : t("hideCovered");
      }
    });
  });

  // Wire tree toggles
  contentEl.querySelectorAll(".existing-tree-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const body = btn.closest(".existing-tree-container")?.querySelector(".existing-tree-body");
      if (body) {
        const isHidden = body.classList.toggle("hidden");
        btn.textContent = isHidden ? t("viewTree") : t("hideTree");
      }
    });
  });
}

class EggsComponent {
  constructor(root = document) {
    this.root = root;
    this.bindElements(root);
  }

  bindElements(root = this.root || (typeof document !== "undefined" ? document : null)) {
    if (!root) return;
    const getEl = (id) => (root.getElementById ? root.getElementById(id) : root.querySelector ? root.querySelector(`#${id}`) : null) || (typeof document !== "undefined" ? document.getElementById(id) : null);

    this.eggKnowledgeSection = getEl("egg-knowledge-section");
    this.eggKnowledgeHint = getEl("egg-knowledge-hint");
    this.eggTabsBar = getEl("egg-tabs-bar");
    this.eggKnowledgeContent = getEl("egg-knowledge-content");
    this.noEggSection = getEl("no-egg-section");
    this.newEggName = getEl("new-egg-name");
    this.newEggDescription = getEl("new-egg-description");
    this.createEggBtn = getEl("create-egg-btn");
    this.eggsSection = getEl("eggs-section");
    this.eggsToggle = getEl("eggs-toggle");
    this.eggsToggleLabel = getEl("eggs-toggle-label");
    this.eggsToggleChevron = getEl("eggs-toggle-chevron");
    this.eggsExpanded = getEl("eggs-expanded");
    this.eggsList = getEl("eggs-list");
    this.reanalyzeEggsBtn = getEl("reanalyze-eggs-btn");
    this.reanalyzeEggsRefreshBtn = getEl("reanalyze-eggs-refresh-btn");
    this.eggsErrorEl = getEl("eggs-error");
    this.eggsCreateToggle = getEl("eggs-create-toggle");
    this.eggsCreateForm = getEl("eggs-create-form");
    this.eggsNewName = getEl("eggs-new-name");
    this.eggsNewDesc = getEl("eggs-new-desc");
    this.eggsCreateBtn = getEl("eggs-create-btn");
    this.eggsCreateCancelBtn = getEl("eggs-create-cancel-btn");
    this.captureEggsToggle = getEl("capture-eggs-toggle");
    this.captureEggsLabel = getEl("capture-eggs-label");
    this.captureEggsChevron = getEl("capture-eggs-chevron");
    this.captureEggsArea = getEl("capture-eggs-area");
    this.captureEggsList = getEl("capture-eggs-list");
  }

  toggleCreateForm(open) {
    if (!this.eggsCreateForm) return;
    const isHidden = open !== undefined ? !open : !this.eggsCreateForm.classList.contains("hidden");
    if (isHidden) {
      this.eggsCreateForm.classList.add("hidden");
      if (this.eggsCreateToggle) {
        this.eggsCreateToggle.classList.remove("hidden");
        this.eggsCreateToggle.textContent = t("createNewEgg");
      }
    } else {
      this.eggsCreateForm.classList.remove("hidden");
      if (this.eggsCreateToggle) {
        this.eggsCreateToggle.classList.add("hidden");
        this.eggsCreateToggle.textContent = t("createNewEgg");
      }
      this.clearError();
      if (typeof this.eggsNewName?.focus === "function") {
        this.eggsNewName.focus();
      }
    }
  }

  getNewEggInput() {
    const name = (this.eggsNewName?.value || this.newEggName?.value || "").trim();
    const desc = (this.eggsNewDesc?.value || this.newEggDescription?.value || "").trim();
    return { name, desc };
  }

  clearNewEggInput() {
    if (this.eggsNewName) this.eggsNewName.value = "";
    if (this.eggsNewDesc) this.eggsNewDesc.value = "";
    if (this.newEggName) this.newEggName.value = "";
    if (this.newEggDescription) this.newEggDescription.value = "";
  }

  setCreateButtonLoading(isLoading) {
    const loadingText = t("creatingEgg") || t("creating") || "Creating…";
    const normalText = t("createEggBtn") || "Create Egg";
    if (this.eggsCreateBtn) {
      this.eggsCreateBtn.disabled = Boolean(isLoading);
      this.eggsCreateBtn.textContent = isLoading ? loadingText : normalText;
    }
    if (this.createEggBtn) {
      this.createEggBtn.disabled = Boolean(isLoading);
      this.createEggBtn.textContent = isLoading ? loadingText : normalText;
    }
  }

  resetCreateForm() {
    this.toggleCreateForm(false);
    this.clearNewEggInput();
    this.clearError();
    this.setCreateButtonLoading(false);
  }

  setReanalyzeLoading(isLoading, text = "") {
    if (this.reanalyzeEggsBtn) {
      this.reanalyzeEggsBtn.disabled = Boolean(isLoading);
      if (text) this.reanalyzeEggsBtn.textContent = text;
    }
    if (this.reanalyzeEggsRefreshBtn) {
      this.reanalyzeEggsRefreshBtn.disabled = Boolean(isLoading);
    }
  }

  setReanalyzeEggsRefreshLoading(isLoading) {
    if (!this.reanalyzeEggsRefreshBtn) return;
    this.reanalyzeEggsRefreshBtn.disabled = Boolean(isLoading);
    if (isLoading) {
      this.reanalyzeEggsRefreshBtn.classList.add("rotating");
    } else {
      this.reanalyzeEggsRefreshBtn.classList.remove("rotating");
    }
  }

  showError(msg) {
    if (this.eggsErrorEl) {
      this.eggsErrorEl.textContent = msg;
      this.eggsErrorEl.classList.remove("hidden");
    }
  }

  clearError() {
    if (this.eggsErrorEl) {
      this.eggsErrorEl.textContent = "";
      this.eggsErrorEl.classList.add("hidden");
    }
  }

  expandEggsList(expanded = true) {
    if (this.eggsSection) {
      this.eggsSection.classList.remove("hidden");
    }
    if (expanded) {
      this.eggsExpanded?.classList.remove("hidden");
      if (this.eggsToggleChevron) this.eggsToggleChevron.textContent = "▾";
      this.eggsToggle?.setAttribute("aria-expanded", "true");
    } else {
      this.eggsExpanded?.classList.add("hidden");
      if (this.eggsToggleChevron) this.eggsToggleChevron.textContent = "▸";
      this.eggsToggle?.setAttribute("aria-expanded", "false");
    }
  }

  toggleEggsList() {
    const isCurrentlyHidden = this.eggsExpanded?.classList.contains("hidden");
    this.expandEggsList(isCurrentlyHidden);
    return isCurrentlyHidden;
  }

  expandCaptureEggs(expanded = true) {
    if (expanded) {
      this.captureEggsArea?.classList.remove("hidden");
      if (this.captureEggsChevron) this.captureEggsChevron.textContent = "▾";
    } else {
      this.captureEggsArea?.classList.add("hidden");
      if (this.captureEggsChevron) this.captureEggsChevron.textContent = "▸";
    }
  }

  toggleCaptureEggs() {
    const isCurrentlyHidden = this.captureEggsArea?.classList.contains("hidden");
    this.expandCaptureEggs(isCurrentlyHidden);
    return isCurrentlyHidden;
  }

  updateCaptureLabel(selected = null) {
    return _updateCaptureEggsLabel({
      captureEggsLabel: this.captureEggsLabel,
      preSelectedEggs: selected,
    });
  }

  renderCaptureList(options = {}) {
    return _renderCaptureEggsList({
      captureEggsList: this.captureEggsList,
      captureEggsToggle: this.captureEggsToggle,
      captureEggsLabel: this.captureEggsLabel,
      updateLabel: () => this.updateCaptureLabel(options.preSelectedEggs),
      ...options,
    });
  }

  renderSection(firstArg = [], options = {}) {
    const matched = Array.isArray(firstArg) ? firstArg : (firstArg?.matchedEggs || []);
    const opts = Array.isArray(firstArg) ? options : (firstArg || {});
    return _renderEggsSection(matched, {
      eggsSection: this.eggsSection,
      eggsList: this.eggsList,
      eggsExpanded: this.eggsExpanded,
      eggsToggleChevron: this.eggsToggleChevron,
      eggsToggleLabel: this.eggsToggleLabel,
      reanalyzeEggsBtn: this.reanalyzeEggsBtn,
      reanalyzeEggsRefreshBtn: this.reanalyzeEggsRefreshBtn,
      eggsCreateForm: this.eggsCreateForm,
      eggsCreateToggle: this.eggsCreateToggle,
      eggsErrorEl: this.eggsErrorEl,
      ...opts,
    });
  }

  renderKnowledge(firstArg = [], options = {}) {
    const eggResults = Array.isArray(firstArg) ? firstArg : (firstArg?.eggResults || []);
    const opts = Array.isArray(firstArg) ? options : (firstArg || {});
    return _renderEggKnowledge(eggResults, {
      eggKnowledgeSection: this.eggKnowledgeSection,
      eggKnowledgeContent: this.eggKnowledgeContent,
      eggTabsBar: this.eggTabsBar,
      eggKnowledgeHint: this.eggKnowledgeHint,
      ...opts,
    });
  }

  setNoEggVisible(visible) {
    if (visible) {
      this.noEggSection?.classList.remove("hidden");
      this.clearNewEggInput();
    } else {
      this.noEggSection?.classList.add("hidden");
    }
  }

  setKnowledgeVisible(visible) {
    if (visible) {
      this.eggKnowledgeSection?.classList.remove("hidden");
    } else {
      this.eggKnowledgeSection?.classList.add("hidden");
    }
  }

  render(session, settings) {
    const result = session?.analysisResult;
    const isChrome = settings ? settings.isChromeMode() : false;
    const isStage1 = session?.isStage1 ? session.isStage1(result) : (result?.stage === "stage1" || result?.mode === "chrome");

    if (!result || isChrome) {
      this.setNoEggVisible(false);
      this.setKnowledgeVisible(false);
      if (this.eggsSection) this.eggsSection.classList.add("hidden");
      return;
    }

    const eggResults = isStage1 ? [] : (result.eggResults || []);
    const allRejected = !isStage1 && (
      (eggResults.length > 0 && eggResults.every((r) => r.rejected)) ||
      (eggResults.length === 0 && Array.isArray(result.matchedEggs) && result.matchedEggs.length > 0)
    );

    // No egg matched banner
    const noEgg = (result.matchedEggs || []).length === 0 || allRejected;
    this.setNoEggVisible(noEgg);

    // Egg knowledge section
    this.renderKnowledge({
      eggResults,
      activeEggTab: session?.activeEggTab,
      allRejected,
      noEggMatched: allRejected,
      onTabChange: (tab) => {
        if (session) session.activeEggTab = tab;
      },
    });

    // Populate session.selectedEggs if empty and matched eggs exist
    if (!allRejected && session?.selectedEggs && session.selectedEggs.size === 0 && Array.isArray(result.matchedEggs) && result.matchedEggs.length > 0) {
      result.matchedEggs.forEach((egg) => session.selectedEggs.add(egg));
    }

    // Checklist of eggs
    const allVaultEggs = session?.allEggs || settings?.allEggs || [];
    this.renderSection({
      matchedEggs: allRejected ? [] : (result.matchedEggs || []),
      allEggs: allVaultEggs,
      selectedEggs: session?.selectedEggs,
      allRejected,
      onSelectChange: () => {
        if (typeof updateStage1ProceedBtn === "function") {
          updateStage1ProceedBtn();
        }
      },
    });

    if (this.eggsSection) {
      this.eggsSection.classList.remove("hidden");
    }

    const shouldExpand = isStage1 && (settings?.analysisMode === "confirm" || (result?.matchedEggs || []).length === 0);
    if (shouldExpand) {
      this.expandEggsList(true);
    }
  }
}

const _eggScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_eggScope.NutEggUI = _eggScope.NutEggUI || {};
_eggScope.NutEggUI.EggsComponent = EggsComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    EggsComponent,
  };
}

