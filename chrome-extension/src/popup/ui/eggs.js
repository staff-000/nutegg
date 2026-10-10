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
  const accordionEl = options.captureEggsAccordion || (toggleEl?.closest?.(".sections-accordion") || (typeof document !== "undefined" ? document.getElementById("capture-eggs-accordion") : null));
  const eggs = options.allEggs || [];
  const selected = options.preSelectedEggs instanceof Set ? options.preSelectedEggs : new Set(options.preSelectedEggs || []);
  const onLabelUpdate = options.updateLabel || (typeof updateCaptureEggsLabel === "function" ? updateCaptureEggsLabel : null);

  if (!listEl || !toggleEl) return;
  if (eggs.length === 0) {
    toggleEl.classList.add("hidden");
    if (accordionEl && accordionEl !== toggleEl) accordionEl.classList.add("hidden");
    return;
  }
  toggleEl.classList.remove("hidden");
  if (accordionEl && accordionEl !== toggleEl) accordionEl.classList.remove("hidden");
  listEl.innerHTML = eggs
    .map((e) => {
      const checked = selected.has(e.fileName) ? "checked" : "";
      return `<label class="egg-row">
        <input type="checkbox" data-capture-egg="${_eggEscapeHtml(e.fileName)}" ${checked} />
        <span class="egg-row-name">${_eggEscapeHtml(cleanEggName(e.fileName))}</span>
        <span class="egg-row-desc">${_eggEscapeHtml(e.description || e.topic || "")}</span>
      </label>`;
    })
    .join("");

  listEl.querySelectorAll("input").forEach((cb) => {
    cb.addEventListener("click", (ev) => ev?.stopPropagation?.());
    cb.addEventListener("change", (ev) => {
      ev?.stopPropagation?.();
      const name = ev.target.dataset.captureEgg;
      if (ev.target.checked) selected.add(name);
      else selected.delete(name);
      options.onSelectChange?.(new Set(selected));
      if (onLabelUpdate) onLabelUpdate();
    });
  });
  if (onLabelUpdate) onLabelUpdate();
}

function _updateCaptureEggsLabel(options = {}) {
  const labelEl = options.captureEggsLabel || (typeof captureEggsLabel !== "undefined" ? captureEggsLabel : (typeof document !== "undefined" ? document.getElementById("capture-eggs-label") : null));
  const selected = options.preSelectedEggs instanceof Set ? options.preSelectedEggs : new Set(options.preSelectedEggs || []);
  if (!labelEl) return;
  if (selected.size === 0) {
    labelEl.textContent = "";
  } else if (selected.size === 1) {
    const rawEgg = [...selected][0];
    labelEl.textContent = `(${cleanEggName(rawEgg)})`;
  } else {
    labelEl.textContent = t("countSelected", { count: selected.size });
  }
}

/**
 * Render the selected eggs supplied by the store; changes dispatch new selections.
 */
function _renderEggsSection(firstArg = [], options = {}) {
  const matchedEggs = Array.isArray(firstArg) ? firstArg : (firstArg?.matchedEggs || []);
  const opts = Array.isArray(firstArg) ? options : (firstArg || {});
  const rawEggs = opts.allEggs || [];
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

  const currentSelected = new Set(opts.selectedEggs || []);

  if (sectionEl) sectionEl.classList.remove("hidden");
  const shouldExpand = opts.expand !== undefined ? Boolean(opts.expand) : (expandedEl && !expandedEl.classList.contains("hidden"));
  if (shouldExpand) {
    if (expandedEl) expandedEl.classList.remove("hidden");
    if (chevronEl) {
      chevronEl.classList.add("expanded");
      const svg = chevronEl.querySelector?.("svg");
      if (!svg) chevronEl.textContent = "▾";
    }
  } else {
    if (expandedEl) expandedEl.classList.add("hidden");
    if (chevronEl) {
      chevronEl.classList.remove("expanded");
      const svg = chevronEl.querySelector?.("svg");
      if (!svg) chevronEl.textContent = "▸";
    }
  }
  if (errorEl) errorEl.classList.add("hidden");
  if (toggleLabelEl) {
    if (matchedEggs.length > 0 && currentSelected.size === matchedEggs.length) {
      toggleLabelEl.textContent = t("countMatched", { count: matchedEggs.length });
    } else if (currentSelected.size > 0) {
      toggleLabelEl.textContent = t("countSelected", { count: currentSelected.size });
    } else {
      toggleLabelEl.textContent = t("noneMatched");
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
        if (toggleLabelEl) {
          if (matchedEggs.length > 0 && currentSelected.size === matchedEggs.length) {
            toggleLabelEl.textContent = t("countMatched", { count: matchedEggs.length });
          } else if (currentSelected.size > 0) {
            toggleLabelEl.textContent = t("countSelected", { count: currentSelected.size });
          } else {
            toggleLabelEl.textContent = t("noneMatched");
          }
        }
        if (opts.onSelectChange) {
          opts.onSelectChange(new Set(currentSelected));
        }
      });
    });
  }

  if (createFormEl) createFormEl.classList.add("hidden");
  if (createToggleEl) {
    createToggleEl.classList.remove("hidden");
    createToggleEl.textContent = t("createNewEgg");
  }
}

const KIND_METADATA = {
  insight: { icon: "💡", label: "Insight", className: "kind-insight" },
  list: { icon: "📋", label: "Framework", className: "kind-list" },
  answer: { icon: "💬", label: "Takeaway", className: "kind-answer" },
};

function _formatEntryMarkdown(rawText, linkify) {
  if (!rawText) return "";
  const lines = String(rawText).split("\n");
  const processed = [];
  for (const line of lines) {
    let l = _eggEscapeHtml(line);
    // Bold: **text**
    l = l.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Inline code: `code`
    l = l.replace(/`([^`]+)`/g, '<code class="delta-inline-code">$1</code>');
    // Italic: *text*
    l = l.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, "$1<em>$2</em>$3");

    // Bullet lists: - item, * item, • item
    const bulletMatch = l.match(/^\s*(?:[-*•]|\&\#8226;)\s+(.+)$/);
    if (bulletMatch) {
      processed.push(`<div class="delta-bullet-row"><span class="delta-bullet-dot">•</span><span class="delta-bullet-text">${linkify(bulletMatch[1])}</span></div>`);
      continue;
    }

    // Numbered lists: 1. item
    const numMatch = l.match(/^\s*(\d+)[.)]\s+(.+)$/);
    if (numMatch) {
      processed.push(`<div class="delta-bullet-row"><span class="delta-bullet-num">${numMatch[1]}.</span><span class="delta-bullet-text">${linkify(numMatch[2])}</span></div>`);
      continue;
    }

    processed.push(linkify(l));
  }
  return processed.join("\n");
}

function _renderEggKnowledge(firstArg = [], options = {}) {
  const raw = Array.isArray(firstArg) ? firstArg : firstArg?.eggResults;
  const eggResults = Array.isArray(raw) ? raw : [];
  const opts = Array.isArray(firstArg) ? options : firstArg;
  const section = opts.eggKnowledgeSection || (typeof document !== "undefined" ? document.getElementById("egg-knowledge-section") : null);
  const content = opts.eggKnowledgeContent || (typeof document !== "undefined" ? document.getElementById("egg-knowledge-content") : null);
  const tabs = opts.eggTabsBar || (typeof document !== "undefined" ? document.getElementById("egg-tabs-bar") : null);
  const hint = opts.eggKnowledgeHint || (typeof document !== "undefined" ? document.getElementById("egg-knowledge-hint") : null);
  if (!section || !content) return;
  if (!eggResults.length) {
    section.classList.add("hidden"); content.innerHTML = "";
    if (tabs) tabs.innerHTML = "";
    return;
  }
  section.classList.remove("hidden");
  let active = opts.activeEggTab;
  if (active !== "all" && !eggResults.some(r => r.egg === active)) active = eggResults[0].egg;
  const count = r => (r.extractedEntries?.length || 0) + (r.keyQuestionAnswers?.length || 0);
  const labels = { full: "readingFull", highlights: "readingHighlights", summary: "readingSummary", skip: "readingSkip", uncertain: "readingUncertain" };
  const sources = globalThis.NutEggUI?.renderQaSources || globalThis.renderQaSources || (() => "");
  const linkify = globalThis.NutEggHelpers?.linkifyTimestamps || (text => text);
  if (hint) hint.textContent = t("eggsMatchedCount", { count: eggResults.length });
  if (tabs) {
    tabs.classList.toggle("hidden", eggResults.length < 2);
    const total = eggResults.reduce((n, r) => n + count(r), 0);
    tabs.innerHTML = eggResults.length < 2 ? "" : [...eggResults.map(r => ({ name: r.egg, label: cleanEggName(r.egg), count: count(r) })),
      { name: "all", label: t("allEggsTab"), count: total }].map(tab =>
      `<button type="button" class="egg-tab-btn${active === tab.name ? " active" : ""}" data-tab="${_eggEscapeHtml(tab.name)}" title="${_eggEscapeHtml(t('buttonEggTabHint', { name: tab.label }))}"><span class="egg-tab-name">${_eggEscapeHtml(tab.label)}</span><span class="egg-tab-badge badge-tab-covered">${tab.count}</span></button>`).join("");
    tabs.querySelectorAll(".egg-tab-btn").forEach(btn => btn.addEventListener("click", () => {
      opts.onTabChange?.(btn.dataset.tab);
      _renderEggKnowledge(eggResults, { ...opts, activeEggTab: btn.dataset.tab });
    }));
  }
  content.innerHTML = eggResults.map(r => {
    const visible = active === "all" || active === r.egg;
    const qa = (r.keyQuestionAnswers || []).map(answer => {
      const ansFormatted = _formatEntryMarkdown(answer.answer, linkify);
      const sourcesHtml = sources(answer.sources);
      return `<div class="qa-item">
        <div class="qa-question"><span class="qa-q-badge">Q</span> ${_eggEscapeHtml(answer.question)}</div>
        <div class="qa-answer">${ansFormatted}</div>
        ${sourcesHtml ? `<div class="entry-sources-footer">${sourcesHtml}</div>` : ""}
      </div>`;
    }).join("");

    const entries = (r.extractedEntries || []).map(entry => {
      const text = typeof entry === "string" ? entry : (entry?.content || "");
      const rawKind = typeof entry === "object" && entry?.kind ? String(entry.kind).toLowerCase() : "insight";
      const meta = KIND_METADATA[rawKind] || KIND_METADATA.insight;
      const formatted = _formatEntryMarkdown(text, linkify);
      const sourcesHtml = typeof entry === "object" ? sources(entry.sources) : "";

      return `<div class="delta-item delta-knowledge-entry ${meta.className}" data-kind="${_eggEscapeHtml(rawKind)}">
        <div class="delta-header">
          <span class="delta-kind-badge ${meta.className}">
            <span class="kind-icon">${meta.icon}</span>
            <span class="kind-label">${meta.label}</span>
          </span>
          <button type="button" class="entry-copy-btn" title="${_eggEscapeHtml(t('buttonCopyHint'))}" aria-label="${_eggEscapeHtml(t('buttonCopyHint'))}" data-content="${_eggEscapeHtml(text)}">
            <span class="copy-icon">📋</span>
            <span class="copy-feedback hidden">✓</span>
          </button>
        </div>
        <div class="delta-content">${formatted}</div>
        ${sourcesHtml ? `<div class="entry-sources-footer">${sourcesHtml}</div>` : ""}
      </div>`;
    }).join("");

    const actionClass = r.readAction ? `action-${r.readAction}` : "action-uncertain";

    return `<div class="egg-card${visible ? "" : " hidden"}" data-egg="${_eggEscapeHtml(r.egg)}">
      <div class="egg-card-header"><span class="egg-card-title">${_eggEscapeHtml(cleanEggName(r.egg))}</span></div>
      <div class="egg-status-banner ${actionClass}"><strong>${_eggEscapeHtml(t(labels[r.readAction] || labels.uncertain))}</strong> — ${_eggEscapeHtml(r.readVerdictReason || "")}${sources(r.readingSources)}</div>
      ${qa ? `<div class="knowledge-subsection egg-qa-block"><div class="knowledge-subhead">${t("eggKeyQuestions", { count: r.keyQuestionAnswers.length })}</div>${qa}</div>` : ""}
      ${entries ? `<div class="knowledge-subsection"><div class="knowledge-subhead"><span class="subhead-icon">🍃</span> <span>${t("eggResultsHeading", { count: r.extractedEntries.length })}</span></div>${entries}</div>` : ""}
    </div>`;
  }).join("");

  content.querySelectorAll?.(".entry-copy-btn")?.forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const text = btn.getAttribute("data-content") || "";
      if (!text) return;
      try {
        if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else if (typeof document !== "undefined") {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
        btn.classList.add("copied");
        const icon = btn.querySelector(".copy-icon");
        const feedback = btn.querySelector(".copy-feedback");
        if (icon) icon.classList.add("hidden");
        if (feedback) feedback.classList.remove("hidden");
        setTimeout(() => {
          btn.classList.remove("copied");
          if (icon) icon.classList.remove("hidden");
          if (feedback) feedback.classList.add("hidden");
        }, 1500);
      } catch (err) {
        console.warn("[NutEgg] Copy failed:", err);
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
    this.eggsErrorEl = getEl("eggs-error");
    this.eggsCreateToggle = getEl("eggs-create-toggle");
    this.eggsCreateForm = getEl("eggs-create-form");
    this.eggsNewName = getEl("eggs-new-name");
    this.eggsNewDesc = getEl("eggs-new-desc");
    this.eggsCreateBtn = getEl("eggs-create-btn");
    this.eggsCreateCancelBtn = getEl("eggs-create-cancel-btn");
    this.captureEggsAccordion = getEl("capture-eggs-accordion");
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
    const title = isLoading ? t("operationInProgressHint") : t("createEggBtn");
    if (this.eggsCreateBtn) {
      this.eggsCreateBtn.disabled = Boolean(isLoading);
      this.eggsCreateBtn.textContent = isLoading ? loadingText : normalText;
      this.eggsCreateBtn.title = title;
      if (title) this.eggsCreateBtn.setAttribute?.("data-tooltip", title);
      else this.eggsCreateBtn.removeAttribute?.("data-tooltip");
    }
    if (this.createEggBtn) {
      this.createEggBtn.disabled = Boolean(isLoading);
      this.createEggBtn.textContent = isLoading ? loadingText : normalText;
      this.createEggBtn.title = title;
      if (title) this.createEggBtn.setAttribute?.("data-tooltip", title);
      else this.createEggBtn.removeAttribute?.("data-tooltip");
    }
  }

  resetCreateForm() {
    this.toggleCreateForm(false);
    this.clearNewEggInput();
    this.clearError();
    this.setCreateButtonLoading(false);
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
      this.eggsToggleChevron?.classList.add("expanded");
      const svg = this.eggsToggleChevron?.querySelector?.("svg");
      if (!svg && this.eggsToggleChevron) this.eggsToggleChevron.textContent = "▾";
      this.eggsToggle?.setAttribute("aria-expanded", "true");
    } else {
      this.eggsExpanded?.classList.add("hidden");
      this.eggsToggleChevron?.classList.remove("expanded");
      const svg = this.eggsToggleChevron?.querySelector?.("svg");
      if (!svg && this.eggsToggleChevron) this.eggsToggleChevron.textContent = "▸";
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
      this.captureEggsChevron?.classList.add("expanded");
      const svg = this.captureEggsChevron?.querySelector?.("svg");
      if (!svg && this.captureEggsChevron) this.captureEggsChevron.textContent = "▾";
      this.captureEggsToggle?.setAttribute?.("aria-expanded", "true");
    } else {
      this.captureEggsArea?.classList.add("hidden");
      this.captureEggsChevron?.classList.remove("expanded");
      const svg = this.captureEggsChevron?.querySelector?.("svg");
      if (!svg && this.captureEggsChevron) this.captureEggsChevron.textContent = "▸";
      this.captureEggsToggle?.setAttribute?.("aria-expanded", "false");
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
      captureEggsAccordion: this.captureEggsAccordion,
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
    } else {
      this.noEggSection?.classList.add("hidden");
    }
  }

  setKnowledgeVisible(visible) {
    if (visible) {
      this.eggKnowledgeSection?.classList.remove("hidden");
    } else {
      this.eggKnowledgeSection?.classList.add("hidden");
      if (this.eggKnowledgeContent) this.eggKnowledgeContent.innerHTML = "";
      if (this.eggTabsBar) this.eggTabsBar.innerHTML = "";
    }
  }

  render(view, settings, callbacks = {}) {
    const result = view.analysisResult;
    const visible = !!result && !settings.isChromeMode(result);
    this.eggsSection?.classList.toggle('hidden', !visible);
    this.setNoEggVisible(false);
    this.renderKnowledge(view.isStage1?.() ? [] : result?.eggResults || [], { activeEggTab: view.activeEggTab, onTabChange: callbacks.onTabChange });
    this.setKnowledgeVisible(visible && !view.isAnalyzing && !view.isStage1?.() && !!result.eggResults?.length);
    const isExpanded = typeof view.presentation?.eggsExpanded === 'boolean'
      ? view.presentation.eggsExpanded
      : Boolean(view.isStage1?.() && (settings.analysisMode === 'preview' || settings.analysisMode === 'confirm' || !(result?.matchedEggs || []).length));
    this.renderSection(result?.matchedEggs || [], { allEggs: view.allEggs, selectedEggs: view.selectedEggs, onSelectChange: callbacks.onSelectChange, expand: isExpanded });
    this.eggsSection?.classList.toggle('hidden', !visible);
    this.expandEggsList(isExpanded);
    this.eggsSection?.classList.toggle('hidden', !visible);
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
