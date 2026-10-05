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

/** Render the Mind Map hierarchical concept tree. */
function renderMindMap(nodes, container) {
  const helpers = typeof require === "function" ? require("../helpers.js") : globalThis.NutEggHelpers;
  const renderText = text => helpers.linkifyTimestamps(helpers.escapeHtml(String(text || "")));
  const target = container || (typeof mindmapTree !== "undefined" ? mindmapTree : (typeof document !== "undefined" ? document.getElementById("mindmap-tree") : null));
  if (!target) return;
  target.innerHTML = "";
  if (!Array.isArray(nodes) || nodes.length === 0) return;

  const displayNodes = unwrapMindMapRoots(nodes);
  if (!Array.isArray(displayNodes) || displayNodes.length === 0) return;

  function buildNode(node) {
    const nodeEl = document.createElement("div");
    nodeEl.className = "mindmap-node";

    const headerEl = document.createElement("div");
    headerEl.className = "mindmap-node-header";

    const hasChildren = Array.isArray(node.children) && node.children.length > 0;

    let toggleBtn = null;
    if (hasChildren) {
      toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "mindmap-toggle-btn";
      toggleBtn.setAttribute("aria-label", t("toggleBranch"));
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
    const source = node.sources?.find(s => s && typeof s.ref === 'string' && (s.sourceId || !/^\[?\d{1,3}(?::\d{2}){1,2}\]?$/.test(s.ref)) && (s.quote || s.sourceId || s.ref));
    nameEl.innerHTML = renderText(node.name);
    if (source) {
      nameEl.insertAdjacentHTML("beforeend", ` <button type="button" class="source-pill source-section source-mindmap inline-timestamp" data-heading="${helpers.escapeHtml(source.ref)}" data-quote="${helpers.escapeHtml(source.quote || '')}" data-source-id="${helpers.escapeHtml(source.sourceId || '')}" title="${helpers.escapeHtml(t('jumpToSource'))}"><span class="source-icon">📍</span><span class="source-ref">${helpers.escapeHtml(t('jumpToSource'))}</span></button>`);
    }
    if (typeof node.time === "string" && /^\d{1,3}:[0-5]\d(?::[0-5]\d)?$/.test(node.time)) {
      nameEl.insertAdjacentHTML("beforeend", " " + renderText(node.time));
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
  }

  show() {
    this.mindmapSection?.classList.remove("hidden");
  }

  hide() {
    this.mindmapSection?.classList.add("hidden");
  }

  render(nodes, enabled = true) {
    if (Array.isArray(nodes) && nodes.length > 0 && enabled !== false) {
      this.show();
      return renderMindMap(nodes, this.mindmapTree);
    } else {
      this.hide();
    }
  }
}

const _mindmapScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_mindmapScope.NutEggUI = _mindmapScope.NutEggUI || {};
_mindmapScope.NutEggUI.MindmapComponent = MindmapComponent;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MindmapComponent,
  };
}

