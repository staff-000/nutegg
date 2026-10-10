// ============================================================
// NutEgg Popup UI — Mind Map Component
// ============================================================

/**
 * Unwrap single root node(s) with children so that the mind map directly
 * displays the core branches at the root level instead of an unnecessary single root.
 */
function unwrapMindMapRoots(nodes) {
  let current = nodes;
  while (
    Array.isArray(current) &&
    current.length === 1 &&
    !current[0].time &&
    !current[0].sources?.length &&
    Array.isArray(current[0].children) &&
    current[0].children.length > 0
  ) {
    current = current[0].children;
  }
  return current;
}

/**
 * Find the node representing "where are we" in the mind map.
 * - For video, uses current timestamp (in seconds).
 * - For long text, uses position (number / scroll ratio).
 * - If mind map is not exactly linear in progress, shows the first one.
 */
function findCurrentNode(nodes, progress) {
  if (!Array.isArray(nodes) || nodes.length === 0 || progress == null) return null;
  const helpers = typeof require === "function" ? require("../helpers.js") : globalThis.NutEggHelpers;
  const displayNodes = unwrapMindMapRoots(nodes);
  if (!Array.isArray(displayNodes) || displayNodes.length === 0) return null;

  const flat = [];
  function traverse(list, parent = null) {
    for (const item of list) {
      if (!item) continue;
      const entry = { node: item, parent, index: flat.length };
      flat.push(entry);
      if (Array.isArray(item.children) && item.children.length > 0) {
        traverse(item.children, entry);
      }
    }
  }
  traverse(displayNodes);
  if (flat.length === 0) return null;

  const toSec = t => {
    if (typeof t === "number") return !isNaN(t) ? t : 0;
    if (!t) return null;
    const str = String(t).trim();
    if (!str) return null;
    const m = str.match(/\b(?:(\d{1,3}):)?(\d{1,2}):(\d{2})\b/);
    if (m) {
      const parts = m[0].split(":").map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
    }
    const clean = str.replace(/^\[|\]$/g, "").trim();
    const cleanMatch = clean.match(/\b(?:(\d{1,3}):)?(\d{1,2}):(\d{2})\b/);
    if (cleanMatch) {
      const parts = cleanMatch[0].split(":").map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
    }
    const num = Number(clean);
    return !isNaN(num) && clean !== "" ? num : null;
  };

  const getNodeTs = n => {
    if (n == null) return null;
    if (typeof n.timestamp === "number" && !isNaN(n.timestamp)) return n.timestamp;
    if (typeof n.time === "number" && !isNaN(n.time)) return n.time;
    if (n.time) {
      const s = toSec(n.time);
      if (s !== null) return s;
    }
    const fromName = helpers?.extractTimestamp?.(n.name) || (typeof n.name === "string" && toSec(n.name));
    if (fromName !== null && fromName !== undefined) return fromName;
    if (Array.isArray(n.sources)) {
      for (const s of n.sources) {
        if (s && s.ref) {
          const inRef = helpers?.extractTimestamp?.(s.ref) || toSec(s.ref);
          if (inRef !== null && inRef !== undefined) return inRef;
        }
      }
    }
    return null;
  };

  const getNodePos = (n, idx) => {
    if (typeof n.position === "number") return n.position;
    if (Array.isArray(n.sources)) {
      for (const s of n.sources) {
        if (s && typeof s.position === "number") return s.position;
        if (s && typeof s.ratio === "number") return s.ratio;
      }
    }
    return flat.length > 1 ? idx / (flat.length - 1) : 0;
  };

  const hasAnyTimestamp = flat.some(item => getNodeTs(item.node) !== null);
  const isVideo =
    progress?.type === "video" ||
    typeof progress?.currentTime === "number" ||
    (typeof progress === "number" && hasAnyTimestamp);

  let targetValue = 0;
  if (isVideo) {
    if (typeof progress === "number") targetValue = progress;
    else if (typeof progress?.currentTime === "number") targetValue = progress.currentTime;
    else if (typeof progress?.time === "string") targetValue = toSec(progress.time) ?? 0;
  } else {
    if (typeof progress === "number") targetValue = progress;
    else if (typeof progress?.position === "number") targetValue = progress.position;
    else if (typeof progress?.scrollRatio === "number") targetValue = progress.scrollRatio;
  }

  // Populate metrics
  for (const item of flat) {
    if (isVideo) {
      item.val = getNodeTs(item.node);
    } else {
      item.val = getNodePos(item.node, item.index);
    }
  }

  // Nodes with valid metric
  const withMetric = flat.filter(item => item.val !== null);
  if (withMetric.length === 0) return flat[0].node;

  // Check linearity: non-decreasing progression across the tree
  let isLinear = true;
  for (let i = 1; i < withMetric.length; i++) {
    if (withMetric[i].val < withMetric[i - 1].val) {
      isLinear = false;
      break;
    }
  }

  const reached = withMetric.filter(item => item.val <= targetValue);
  if (reached.length === 0) return flat[0].node;

  // Most recent started metric
  const maxVal = Math.max(...reached.map(item => item.val));
  const candidates = reached.filter(item => item.val === maxVal);

  if (!isLinear) {
    // If mind map is not exactly linear in progress, show the first one
    return candidates[0].node;
  } else {
    // Linear progression: show the most specific / latest matching node
    return candidates[candidates.length - 1].node;
  }
}

/** Render the Mind Map hierarchical concept tree. */
function renderMindMap(nodes, container, progress = null) {
  const helpers = typeof require === "function" ? require("../helpers.js") : globalThis.NutEggHelpers;
  const t = (key, params) => (typeof globalThis.t === "function" ? globalThis.t(key, params) : (helpers?.t ? helpers.t(key, params) : key));
  const renderText = text => helpers.linkifyTimestamps(helpers.escapeHtml(String(text || "")));
  const target = container || (typeof mindmapTree !== "undefined" ? mindmapTree : (typeof document !== "undefined" ? document.getElementById("mindmap-tree") : null));
  if (!target) return;
  target.innerHTML = "";
  if (!Array.isArray(nodes) || nodes.length === 0) return;

  const displayNodes = unwrapMindMapRoots(nodes);
  if (!Array.isArray(displayNodes) || displayNodes.length === 0) return;

  const currentNode = progress != null ? findCurrentNode(nodes, progress) : null;
  let nodeIndex = 0;

  function buildNode(node) {
    const currentIndex = nodeIndex++;
    const isCurrent = currentNode === node;
    const nodeEl = document.createElement("div");
    nodeEl.className = "mindmap-node" + (isCurrent ? " is-current" : "");
    nodeEl.dataset.nodeIndex = String(currentIndex);
    nodeEl.__nuteggNode = node;

    const headerEl = document.createElement("div");
    headerEl.className = "mindmap-node-header";

    const hasChildren = Array.isArray(node.children) && node.children.length > 0;

    let toggleBtn = null;
    if (hasChildren) {
      toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "mindmap-toggle-btn";
      toggleBtn.setAttribute("aria-label", t("toggleBranch"));
      toggleBtn.title = t("toggleBranch");
      toggleBtn.innerHTML = `<span class="mindmap-toggle-icon">▾</span>`;
      headerEl.appendChild(toggleBtn);
    } else {
      const bullet = document.createElement("span");
      bullet.className = "mindmap-bullet";
      headerEl.appendChild(bullet);
    }

    const contentWrap = document.createElement("div");
    contentWrap.className = "mindmap-node-content";

    const nameEl = document.createElement("div");
    nameEl.className = "mindmap-node-name";
    const hasTime = Boolean(
      (typeof node.time === "string" && /^\d{1,3}:[0-5]\d(?::[0-5]\d)?$/.test(node.time)) ||
      helpers?.extractTimestamp?.(node.name) ||
      /(?:^|[^\d:])\d{1,3}(?::\d{2}){1,2}(?:[^\d:]|$)/.test(node.name || '') ||
      node.sources?.some(s => s && typeof s.ref === 'string' && /^\[?\d{1,3}(?::\d{2}){1,2}\]?$/.test(s.ref.trim()))
    );
    const source = node.sources?.find(s => s && typeof s.ref === 'string' && (s.sourceId || !/^\[?\d{1,3}(?::\d{2}){1,2}\]?$/.test(s.ref)) && (s.quote || s.sourceId || s.ref));
    nameEl.innerHTML = renderText(node.name);
    if (source && !hasTime) {
      nameEl.insertAdjacentHTML("beforeend", ` <button type="button" class="source-pill source-section source-mindmap inline-timestamp" data-heading="${helpers.escapeHtml(source.ref)}" data-quote="${helpers.escapeHtml(source.quote || '')}" data-source-id="${helpers.escapeHtml(source.sourceId || '')}" title="${helpers.escapeHtml(t('sourceTooltip'))}"><span class="source-icon">📍</span><span class="source-ref">${helpers.escapeHtml(t('jumpToSource'))}</span></button>`);
    }
    if (typeof node.time === "string" && /^\d{1,3}:[0-5]\d(?::[0-5]\d)?$/.test(node.time)) {
      nameEl.insertAdjacentHTML("beforeend", " " + renderText(node.time));
    }
    if (isCurrent) {
      const badgeTitle = helpers?.escapeHtml ? helpers.escapeHtml(t("currentPosition") || "Current location") : "Current location";
      const badgeText = helpers?.escapeHtml ? helpers.escapeHtml(t("whereAreWe") || "Current") : "Current";
      nameEl.insertAdjacentHTML("beforeend", ` <span class="mindmap-current-badge" title="${badgeTitle}"><span class="mindmap-current-dot"></span><span>${badgeText}</span></span>`);
    }
    contentWrap.appendChild(nameEl);

    if (node.detail) {
      const detailEl = document.createElement("div");
      detailEl.className = "mindmap-node-detail";
      detailEl.innerHTML = renderText(node.detail);
      contentWrap.appendChild(detailEl);
    }

    headerEl.appendChild(contentWrap);
    nodeEl.appendChild(headerEl);

    if (hasChildren) {
      const childrenContainer = document.createElement("div");
      childrenContainer.className = "mindmap-children";
      for (const child of node.children) {
        childrenContainer.appendChild(buildNode(child));
      }
      nodeEl.appendChild(childrenContainer);

      const toggleBranch = (e) => {
        if (e.target.closest?.(".source-pill")) return;
        e.stopPropagation();
        const isCollapsed = childrenContainer.classList.toggle("collapsed");
        const icon = toggleBtn.querySelector(".mindmap-toggle-icon");
        if (icon) icon.textContent = isCollapsed ? "▸" : "▾";
      };

      toggleBtn.addEventListener("click", toggleBranch);
      nameEl.addEventListener("click", toggleBranch);
    }

    return nodeEl;
  }

  for (const node of displayNodes) {
    target.appendChild(buildNode(node));
  }
}

class MindmapComponent {
  constructor(root = document) {
    this.root = root;
    this.mindmapSection = root.getElementById("mindmap-section");
    this.mindmapTree = root.getElementById("mindmap-tree");
    this.nodes = null;
    this.lastProgress = null;
    this.currentNode = null;
    this.userTouched = false;
    this.bindUserTouchEvents();
  }

  bindUserTouchEvents() {
    const win = this.root.defaultView || (typeof window !== "undefined" ? window : null);
    if (!win || this._touchBound) return;
    this._touchBound = true;
    const mark = () => { this.userTouched = true; };
    const opts = { passive: true, capture: true };
    for (const evt of ["wheel", "touchstart", "pointerdown", "keydown"]) {
      try { win.addEventListener(evt, mark, opts); } catch {}
    }
    try {
      this.mindmapSection?.addEventListener("click", mark, opts);
      this.mindmapTree?.addEventListener("click", mark, opts);
    } catch {}
  }

  markUserTouched() {
    this.userTouched = true;
  }

  show() {
    this.mindmapSection?.classList.remove("hidden");
  }

  hide() {
    this.mindmapSection?.classList.add("hidden");
  }

  findCurrentNode(nodes, progress) {
    return findCurrentNode(nodes, progress);
  }

  updateProgress(progress) {
    this.lastProgress = progress;
    if (!this.mindmapTree || !Array.isArray(this.nodes) || this.nodes.length === 0) return null;
    const current = findCurrentNode(this.nodes, progress);
    this.currentNode = current;
    this.highlightCurrentNode(current);
    return current;
  }

  shouldAutoScroll(nodeEl) {
    if (!nodeEl) return false;

    // Condition 3: The page is just analyzed, nothing touched -> avoid auto scroll
    if (!this.userTouched) return false;

    const mindmapEl = this.mindmapSection || this.mindmapTree;
    if (!mindmapEl) return false;

    const win = this.root.defaultView || (typeof window !== "undefined" ? window : null);
    const vh = win?.innerHeight || this.root.documentElement?.clientHeight || 600;

    let rect = null;
    try {
      rect = mindmapEl.getBoundingClientRect?.();
    } catch {}
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      return false;
    }

    // Condition 2: If mindmap is too short to scroll -> avoid auto scroll
    if (rect.height <= vh || (rect.top >= 0 && rect.bottom <= vh)) {
      return false;
    }

    // Condition 1: When user is reading others (only consider 2/3 of the screen is filled with mindmap)
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(vh, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const screenFilledRatio = visibleHeight / vh;

    if (screenFilledRatio < 2 / 3) {
      return false;
    }

    // Don't auto scroll if the active node is already comfortably visible
    let nodeRect = null;
    try {
      nodeRect = nodeEl.getBoundingClientRect?.();
    } catch {}
    if (nodeRect && (nodeRect.width > 0 || nodeRect.height > 0)) {
      if (nodeRect.top >= visibleTop + 10 && nodeRect.bottom <= visibleBottom - 10) {
        return false;
      }
    }

    return true;
  }

  highlightCurrentNode(targetNode) {
    if (!this.mindmapTree) return;
    const helpers = typeof require === "function" ? require("../helpers.js") : globalThis.NutEggHelpers;
    const t = (key, params) => (typeof globalThis.t === "function" ? globalThis.t(key, params) : (helpers?.t ? helpers.t(key, params) : key));

    this.mindmapTree.querySelectorAll(".mindmap-node.is-current").forEach(el => el.classList.remove("is-current"));
    this.mindmapTree.querySelectorAll(".mindmap-current-badge").forEach(el => el.remove());

    if (!targetNode) return;

    const displayNodes = unwrapMindMapRoots(this.nodes);
    let matchedIndex = -1;
    let idx = 0;
    function findIdx(list) {
      for (const item of list) {
        if (item === targetNode) { matchedIndex = idx; return true; }
        idx++;
        if (Array.isArray(item.children) && item.children.length > 0) {
          if (findIdx(item.children)) return true;
        }
      }
      return false;
    }
    findIdx(displayNodes);

    let nodeEl = matchedIndex !== -1 ? this.mindmapTree.querySelector(`.mindmap-node[data-node-index="${matchedIndex}"]`) : null;
    if (!nodeEl) {
      for (const el of this.mindmapTree.querySelectorAll(".mindmap-node")) {
        if (el.__nuteggNode === targetNode) { nodeEl = el; break; }
      }
    }
    if (!nodeEl) return;

    nodeEl.classList.add("is-current");
    const nameEl = nodeEl.querySelector(".mindmap-node-name");
    if (nameEl && !nameEl.querySelector(".mindmap-current-badge")) {
      const badgeTitle = helpers?.escapeHtml ? helpers.escapeHtml(t("currentPosition") || "Current location") : "Current location";
      const badgeText = helpers?.escapeHtml ? helpers.escapeHtml(t("whereAreWe") || "Current") : "Current";
      nameEl.insertAdjacentHTML("beforeend", ` <span class="mindmap-current-badge" title="${badgeTitle}"><span class="mindmap-current-dot"></span><span>${badgeText}</span></span>`);
    }

    // Auto-uncollapse ancestors so where are we is visible
    let parentBranch = nodeEl.parentElement?.closest(".mindmap-children");
    while (parentBranch) {
      if (parentBranch.classList.contains("collapsed")) {
        parentBranch.classList.remove("collapsed");
        const toggleBtn = parentBranch.parentElement?.querySelector(".mindmap-toggle-btn .mindmap-toggle-icon");
        if (toggleBtn) toggleBtn.textContent = "▾";
      }
      parentBranch = parentBranch.parentElement?.closest(".mindmap-children");
    }

    if (this.shouldAutoScroll(nodeEl)) {
      try {
        nodeEl.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
      } catch {}
    }
  }

  render(nodes, enabled = true, progress = null) {
    if (this.nodes !== nodes) {
      // New analysis result: reset user touched status
      this.userTouched = false;
    }
    this.nodes = nodes;
    if (progress != null) this.lastProgress = progress;
    if (Array.isArray(nodes) && nodes.length > 0 && enabled !== false) {
      this.show();
      const res = renderMindMap(nodes, this.mindmapTree, this.lastProgress);
      if (this.lastProgress != null) {
        this.updateProgress(this.lastProgress);
      }
      return res;
    } else {
      this.hide();
    }
  }
}

const _mindmapScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_mindmapScope.NutEggUI = _mindmapScope.NutEggUI || {};
_mindmapScope.NutEggUI.MindmapComponent = MindmapComponent;
_mindmapScope.NutEggUI.renderMindMap = renderMindMap;
_mindmapScope.NutEggUI.findCurrentNode = findCurrentNode;
_mindmapScope.NutEggUI.unwrapMindMapRoots = unwrapMindMapRoots;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MindmapComponent,
    renderMindMap,
    findCurrentNode,
    unwrapMindMapRoots,
  };
}
