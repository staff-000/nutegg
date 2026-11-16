/* Conservative side-space detection; uncertainty reserves room for the panel. */
(function (root) {
  const GAP = 12,
    SCAN_LIMIT = 3000;
  class PanelPageLayout {
    constructor(host, { side, width, layoutMode = 'auto', document: doc = document, window: win = window }) {
      Object.assign(this, { host, side, width, layoutMode, doc, win });
      this.saved = new Map();
      this.fixed = new Map();
      this.mode = layoutMode === 'push' ? 'inserted' : 'floating';
      this.schedule = () => {
        if (this.disposed) return;
        clearTimeout(this.timer);
        this.timer = win.setTimeout(() => this.update(), 120);
      };
      win.addEventListener('resize', this.schedule);
      win.addEventListener('scroll', this.schedule, { passive: true });
      this.loaded = event => {
        if (!this.isUI(event.target)) this.schedule();
      };
      doc.addEventListener('load', this.loaded, true);
      doc.addEventListener('transitionend', this.loaded, true);
      this.observer = new win.MutationObserver(records => {
        if (
          records.some(
            record =>
              !this.isUI(record.target) &&
              (record.type === 'attributes'
                ? this.attributeChanged(record.target)
                : [...record.addedNodes, ...record.removedNodes].some(node => !this.isUI(node)))
          )
        )
          this.schedule();
      });
      this.observer.observe(doc.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden'],
      });
      this.update();
    }
    isUI(node) {
      return !!(node.nodeType === 1
        ? node.closest?.('[data-nutegg-ui]')
        : node.parentElement?.closest('[data-nutegg-ui]'));
    }
    attributeChanged(node) {
      if (this.mode === 'floating') return true;
      const properties = this.saved.get(node) || this.fixed.get(node);
      if (properties)
        return [...properties].some(
          ([key, value]) =>
            node.style.getPropertyValue(key) !== value.applied || node.style.getPropertyPriority(key) !== 'important'
        );
      return this.win.getComputedStyle(node).position === 'fixed';
    }
    viewport() {
      return this.doc.documentElement.clientWidth || this.win.innerWidth;
    }
    hasSpace() {
      const width = Math.min(this.width, this.viewport()),
        edge = this.side === 'left' ? width + GAP : this.viewport() - width - GAP;
      let scanned = 0,
        found = false;
      const overlaps = rect =>
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < this.win.innerHeight &&
        rect.right > 0 &&
        rect.left < this.viewport() &&
        (this.side === 'left' ? rect.left < edge : rect.right > edge);
      const walker = this.doc.createTreeWalker(this.doc.body || this.doc.documentElement, 1 | 4, {
        acceptNode: node => {
          if (this.isUI(node)) return 2;
          if (node.nodeType === 1) {
            if (node.matches('script,style,noscript,template') || node.hidden) return 2;
            const style = this.win.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return 2;
          }
          return 1;
        },
      });
      let node;
      while ((node = walker.nextNode())) {
        if (++scanned > SCAN_LIMIT) return false;
        if (node.nodeType === 3 && node.textContent.trim()) {
          const range = this.doc.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (rect.width && rect.height) found = true;
            if (overlaps(rect)) return false;
          }
        } else if (
          node.nodeType === 1 &&
          (node.matches('img,video,canvas,svg,iframe,button,input,select,textarea,[role="button"]') ||
            this.win.getComputedStyle(node).backgroundImage !== 'none')
        ) {
          const rect = node.getBoundingClientRect();
          if (rect.width && rect.height) found = true;
          if (overlaps(rect)) return false;
        }
      }
      return found;
    }
    write(element, property, value, collection = this.saved) {
      let properties = collection.get(element);
      if (!properties) collection.set(element, (properties = new Map()));
      let previous = properties.get(property);
      if (
        !previous ||
        element.style.getPropertyValue(property) !== previous.applied ||
        element.style.getPropertyPriority(property) !== 'important'
      ) {
        previous = {
          value: element.style.getPropertyValue(property),
          priority: element.style.getPropertyPriority(property),
        };
        properties.set(property, previous);
      }
      element.style.setProperty(property, value, 'important');
      previous.applied = element.style.getPropertyValue(property);
    }
    restore(collection) {
      for (const [element, properties] of collection)
        for (const [property, previous] of properties) {
          if (
            element.style.getPropertyValue(property) !== previous.applied ||
            element.style.getPropertyPriority(property) !== 'important'
          )
            continue;
          if (previous.value) element.style.setProperty(property, previous.value, previous.priority);
          else element.style.removeProperty(property);
        }
      collection.clear();
    }
    reserve() {
      const viewport = this.viewport(),
        reserved = Math.min(this.width + GAP, viewport),
        available = Math.max(0, viewport - reserved),
        left = this.side === 'left' ? reserved : 0;
      const html = this.doc.documentElement;
      this.write(html, 'width', `${available}px`);
      this.write(html, 'max-width', 'none');
      this.write(html, 'box-sizing', 'border-box');
      this.write(html, 'margin-left', `${left}px`);
      this.write(html, 'margin-right', this.side === 'right' ? `${reserved}px` : '0px');
      if (this.doc.body) {
        this.write(this.doc.body, 'max-width', '100%');
        this.write(this.doc.body, 'box-sizing', 'border-box');
      }
      // Viewport-fixed headers and controls do not naturally follow the narrower document.
      this.restore(this.fixed);
      const walker = this.doc.createTreeWalker(this.doc.body || html, 1, {
        acceptNode: node => (this.isUI(node) ? 2 : 1),
      });
      let node,
        count = 0;
      while ((node = walker.nextNode()) && ++count <= SCAN_LIMIT) {
        const style = this.win.getComputedStyle(node);
        if (style.position !== 'fixed' && node.getBoundingClientRect().width >= viewport - 1 && viewport > available) {
          this.write(node, 'max-width', '100%');
          if (parseFloat(style.minWidth) > available) this.write(node, 'min-width', '0');
        }
        if (style.position !== 'fixed' || style.display === 'none' || style.visibility === 'hidden') continue;
        let ancestor = node.parentElement,
          contained = false;
        while (ancestor && ancestor !== html) {
          const parentStyle = this.win.getComputedStyle(ancestor);
          if (parentStyle.transform !== 'none' || parentStyle.perspective !== 'none' || parentStyle.filter !== 'none') {
            contained = true;
            break;
          }
          ancestor = ancestor.parentElement;
        }
        if (contained) continue;
        const rect = node.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const width = Math.min(rect.width, available);
        if (rect.left >= left && rect.right <= left + available) continue;
        const nextLeft = Math.max(left, Math.min(rect.left, left + available - width));
        this.write(node, 'left', `${nextLeft}px`, this.fixed);
        this.write(node, 'right', 'auto', this.fixed);
        this.write(node, 'width', `${width}px`, this.fixed);
        this.write(node, 'max-width', `${available}px`, this.fixed);
        this.write(node, 'box-sizing', 'border-box', this.fixed);
        const adjusted = node.getBoundingClientRect();
        const correction = Math.max(left, Math.min(adjusted.left, left + available - adjusted.width)) - adjusted.left;
        if (correction) this.write(node, 'left', `${nextLeft + correction}px`, this.fixed);
      }
    }
    update(width = this.width) {
      this.width = width;
      if (this.layoutMode === 'floating') {
        this.mode = 'floating';
        this.host.setAttribute('data-nutegg-layout', this.mode);
        return;
      }
      if (this.layoutMode === 'push') {
        this.mode = 'inserted';
      } else if (this.mode === 'floating') {
        try {
          if (!this.hasSpace()) this.mode = 'inserted';
        } catch {
          this.mode = 'inserted';
        }
      }
      this.host.setAttribute('data-nutegg-layout', this.mode);
      if (this.mode === 'inserted') this.reserve();
    }
    dispose() {
      this.disposed = true;
      this.win.clearTimeout(this.timer);
      this.observer.disconnect();
      this.win.removeEventListener('resize', this.schedule);
      this.win.removeEventListener('scroll', this.schedule);
      this.doc.removeEventListener('load', this.loaded, true);
      this.doc.removeEventListener('transitionend', this.loaded, true);
      this.restore(this.fixed);
      this.restore(this.saved);
    }
  }
  root.NutEggPanelPageLayout = PanelPageLayout;
  if (typeof module !== 'undefined') module.exports = { PanelPageLayout };
})(globalThis);
