// ============================================================
// NutEgg Popup UI — Mind Map Component
// ============================================================

const _mindmapT = (key, params) => {
  if (typeof t === "function") return t(key, params);
  if (typeof window !== "undefined" && window.NutEggI18n) return window.NutEggI18n.t(key, params);
  return key;
};

/**
 * Unwrap single root node(s) with children so that the mind map directly
 * displays the core branches at the root level instead of an unnecessary single root.
 */
function unwrapMindMapRoots(nodes) {
  let current = nodes;
  while (
    Array.isArray(current) &&
    current.length === 1 &&
    Array.isArray(current[0].children) &&
    current[0].children.length > 0
  ) {
    current = current[0].children;
  }
  return current;
}

/** Render the Mind Map hierarchical concept tree. */
function renderMindMap(nodes, container) {
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
      toggleBtn.setAttribute("aria-label", _mindmapT("toggleBranch"));
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
    nameEl.textContent = node.name || "";
    contentWrap.appendChild(nameEl);

    if (node.detail) {
      const detailEl = document.createElement("div");
      detailEl.className = "mindmap-node-detail";
      detailEl.textContent = node.detail;
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
_mindmapScope.NutEggUI.unwrapMindMapRoots = unwrapMindMapRoots;
_mindmapScope.NutEggUI.renderMindMap = renderMindMap;
_mindmapScope.MindmapComponent = MindmapComponent;
_mindmapScope.unwrapMindMapRoots = unwrapMindMapRoots;
_mindmapScope.renderMindMap = renderMindMap;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MindmapComponent,
    unwrapMindMapRoots,
    renderMindMap,
  };
}

