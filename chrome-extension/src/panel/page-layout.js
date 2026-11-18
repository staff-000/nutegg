/* Conservative side-space detection; uncertainty reserves room for the panel. */
(function (root) {
  const GAP = 12,
    SCAN_LIMIT = 3000;
  class PanelPageLayout {
    constructor(host, { side, width, layoutMode = 'auto', document: doc = document, window: win = window }) {
      Object.assign(this, { host, side, width, layoutMode, doc, win });
      this.saved = new Map();
      this.fixed = new Map();
      this.initialScrollX = win.scrollX || 0;
      this.horizontalOffset = this.initialScrollX;
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
            node.style.getPropertyValue(key) !== value.applied ||
            node.style.getPropertyPriority(key) !== value.appliedPriority
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
    measureContentSpan() {
      const rootEl =
        this.doc.querySelector('.video-container-v1, #mirror-vdcon, main, article, [role="main"]') ||
        this.doc.body ||
        this.doc.documentElement;
      if (!rootEl) return null;
      let minLeft = Infinity,
        maxRight = -Infinity,
        scanned = 0;
      const walker = this.doc.createTreeWalker(rootEl, 1 | 4, {
        acceptNode: node => {
          if (this.isUI(node)) return 2;
          if (node.nodeType === 1) {
            if (
              node.matches('script,style,noscript,template,header,nav,[role="banner"],[role="navigation"],.bili-header,#biliMainHeader') ||
              node.hidden
            )
              return 2;
            const style = this.win.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return 2;
          }
          return 1;
        },
      });
      let node;
      while ((node = walker.nextNode()) && ++scanned <= 800) {
        if (node.nodeType === 3 && node.textContent.trim()) {
          const range = this.doc.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < this.win.innerHeight) {
              minLeft = Math.min(minLeft, rect.left);
              maxRight = Math.max(maxRight, rect.right);
            }
          }
        } else if (
          node.nodeType === 1 &&
          node.matches('img,video,canvas,svg,iframe')
        ) {
          const rect = node.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < this.win.innerHeight) {
            minLeft = Math.min(minLeft, rect.left);
            maxRight = Math.max(maxRight, rect.right);
          }
        }
      }
      return minLeft < Infinity && maxRight > -Infinity ? { left: minLeft, right: maxRight } : null;
    }
    write(element, property, value, collection = this.saved) {
      let properties = collection.get(element);
      if (!properties) collection.set(element, (properties = new Map()));
      let previous = properties.get(property);
      if (
        !previous ||
        element.style.getPropertyValue(property) !== previous.applied ||
        element.style.getPropertyPriority(property) !== previous.appliedPriority
      ) {
        previous = {
          value: element.style.getPropertyValue(property),
          priority: element.style.getPropertyPriority(property),
        };
        properties.set(property, previous);
      }
      if (
        element.style.getPropertyValue(property) !== value ||
        element.style.getPropertyPriority(property) !== 'important'
      )
        element.style.setProperty(property, value, 'important');
      previous.applied = element.style.getPropertyValue(property);
      previous.appliedPriority = element.style.getPropertyPriority(property);
    }
    restore(collection) {
      for (const [element, properties] of collection)
        for (const [property, previous] of properties) {
          if (
            element.style.getPropertyValue(property) !== previous.applied ||
            element.style.getPropertyPriority(property) !== previous.appliedPriority
          )
            continue;
          if (previous.value) element.style.setProperty(property, previous.value, previous.priority);
          else element.style.removeProperty(property);
        }
      collection.clear();
    }
    ensureScrollbar() {
      if (this.scrollbarHost) return;
      const host = this.doc.createElement('div');
      host.setAttribute('data-nutegg-ui', '');
      host.setAttribute('data-nutegg-page-scroll', '');
      const shadow = host.attachShadow({ mode: 'closed' });
      const style = this.doc.createElement('style');
      style.textContent =
        ':host{all:initial}div{box-sizing:border-box;height:18px;overflow-x:scroll;overflow-y:hidden;background:#fcfaf7;border-top:1px solid #ded5c9}div:focus-visible{outline:2px solid #a85718;outline-offset:-2px}div::-webkit-scrollbar{height:12px}div::-webkit-scrollbar-track{background:#f1ece4}div::-webkit-scrollbar-thumb{background:#b7a48d;border:2px solid #f1ece4;border-radius:8px}div>div{height:1px;overflow:hidden;border:0}';
      const scroll = this.doc.createElement('div'),
        track = this.doc.createElement('div');
      scroll.tabIndex = 0;
      scroll.setAttribute('role', 'region');
      scroll.setAttribute('aria-label', root.NutEggI18n?.t('panelPageScroll') || '');
      scroll.append(track);
      shadow.append(style, scroll);
      this.doc.documentElement.append(host);
      scroll.addEventListener('scroll', () => {
        this.horizontalOffset = scroll.scrollLeft;
        this.pan();
      });
      this.scrollbarHost = host;
      this.scrollbar = scroll;
      this.scrollTrack = track;
      this.wheel = event => {
        if (event.ctrlKey || event.metaKey || event.defaultPrevented || this.isUI(event.target)) return;
        const delta = event.shiftKey
          ? event.deltaY || event.deltaX
          : Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : 0;
        if (!delta) return;
        // Let the site's own carousels and editors handle their horizontal scrolling.
        for (const element of event.composedPath()) {
          if (element === this.doc.body) break;
          if (
            element.nodeType === 1 &&
            element.scrollWidth > element.clientWidth &&
            /^(auto|scroll)$/.test(this.win.getComputedStyle(element).overflowX)
          )
            return;
        }
        const old = scroll.scrollLeft;
        scroll.scrollLeft += delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroll.clientWidth : 1);
        if (scroll.scrollLeft !== old) {
          this.horizontalOffset = scroll.scrollLeft;
          this.pan();
          event.preventDefault();
        }
      };
      this.win.addEventListener('wheel', this.wheel, { passive: false });
      this.focus = event => {
        if (this.isUI(event.target) || !event.target.getBoundingClientRect) return;
        const rect = event.target.getBoundingClientRect();
        const delta =
          rect.left < this.pageLeft
            ? rect.left - this.pageLeft
            : rect.right > this.pageRight
              ? rect.right - this.pageRight
              : 0;
        if (delta) {
          scroll.scrollLeft += delta;
          this.horizontalOffset = scroll.scrollLeft;
          this.pan();
        }
      };
      this.doc.addEventListener('focusin', this.focus);
    }
    reserve() {
      if (!this.doc.body) return;
      // Feed animations, media loads and vertical scrolling must not repeatedly reset
      // the document geometry: doing so can retrigger hover/autoplay on live photos.
      const geometryKey = `${this.viewport()}:${this.win.innerHeight}:${this.width}:${this.side}`;
      if (this.geometryKey === geometryKey && this.layoutBody === this.doc.body && this.saved.size) return;
      this.geometryKey = geometryKey;
      this.layoutBody = this.doc.body;
      // Measure the live site's own layout, without changing its DOM or columns.
      this.restore(this.fixed);
      this.restore(this.saved);
      const html = this.doc.documentElement,
        body = this.doc.body,
        viewport = this.viewport();
      const nativeStyle = this.win.getComputedStyle(body);
      this.nativeBodyWidth = nativeStyle.width;
      this.nativeMarginLeft = parseFloat(nativeStyle.marginLeft) || 0;
      const reserved = Math.min(this.width + GAP, viewport),
        available = Math.max(0, viewport - reserved);
      this.pageLeft = this.side === 'left' ? reserved : 0;
      this.pageRight = this.pageLeft + available;
      this.fixedItems = [];
      const walker = this.doc.createTreeWalker(body, 1, { acceptNode: node => (this.isUI(node) ? 2 : 1) });
      let node,
        count = 0;
      while ((node = walker.nextNode()) && ++count <= SCAN_LIMIT) {
        const style = this.win.getComputedStyle(node);
        if (
          !['fixed', 'absolute'].includes(style.position) ||
          style.display === 'none' ||
          style.visibility === 'hidden'
        )
          continue;
        let ancestor = node.parentElement,
          contained = false;
        while (ancestor && ancestor !== html) {
          const parentStyle = this.win.getComputedStyle(ancestor);
          if (
            parentStyle.transform !== 'none' ||
            parentStyle.perspective !== 'none' ||
            parentStyle.filter !== 'none' ||
            (style.position === 'absolute' && parentStyle.position !== 'static')
          ) {
            contained = true;
            break;
          }
          ancestor = ancestor.parentElement;
        }
        if (contained) continue;
        const rect = node.getBoundingClientRect();
        if (rect.width && rect.height)
          this.fixedItems.push({ node, left: rect.left, right: rect.right, width: style.width });
      }
      this.write(html, 'overflow-x', 'clip');
      if (this.nativeBodyWidth && this.nativeBodyWidth !== 'auto') {
        this.write(body, 'width', this.nativeBodyWidth);
      }
      const postBounds = body.getBoundingClientRect();
      this.canvasWidth = Math.max(
        viewport,
        html.scrollWidth,
        body.scrollWidth,
        postBounds.right + (this.win.scrollX || 0)
      );
      this.ensureScrollbar();
      this.scrollbarHost.style.cssText = `all:initial;position:fixed!important;bottom:0!important;left:${this.pageLeft}px!important;width:${available}px!important;height:18px!important;z-index:2147483645!important`;
      this.scrollbarHost.hidden = !available || this.canvasWidth <= available + 1;
      this.scrollbarHost.style.setProperty('display', this.scrollbarHost.hidden ? 'none' : 'block', 'important');
      this.scrollTrack.style.width = `${this.canvasWidth}px`;
      this.horizontalOffset = Math.max(0, Math.min(this.horizontalOffset, this.canvasWidth - available));
      if (this.autoAlignedSide !== this.side) {
        this.autoAlignedSide = this.side;
        const span = this.measureContentSpan();
        if (span && span.left > GAP * 3) {
          const maxShift = Math.max(0, span.left - GAP);
          let targetOffset = 0;
          if (this.side === 'left') {
            targetOffset = maxShift;
          } else if (span.right > available - GAP) {
            targetOffset = Math.min(maxShift, span.right - (available - GAP));
          }
          this.horizontalOffset = Math.max(0, Math.min(targetOffset, Math.max(0, this.canvasWidth - available)));
        }
      }
      this.scrollbar.scrollLeft = this.horizontalOffset;
      this.pan();
    }
    pan() {
      if (this.disposed || !this.doc.body) return;
      const body = this.doc.body,
        offset = this.pageLeft - this.horizontalOffset;
      this.write(body, 'margin-left', `${this.nativeMarginLeft + offset}px`);
      const rect = body.getBoundingClientRect();
      // Clip only horizontally. Vertical document scrolling and sticky positioning stay native.
      this.write(
        body,
        'clip-path',
        `inset(-1000000px ${rect.right - this.pageRight}px -1000000px ${this.pageLeft - rect.left}px)`
      );
      for (const item of this.fixedItems || []) {
        if (!item.node.isConnected) continue;
        const target = item.left + offset;
        this.write(item.node, 'left', `${target}px`, this.fixed);
        this.write(item.node, 'right', 'auto', this.fixed);
        if (item.width && item.width !== 'auto') this.write(item.node, 'width', item.width, this.fixed);
        const actual = item.node.getBoundingClientRect();
        if (actual.left !== target) this.write(item.node, 'left', `${target + target - actual.left}px`, this.fixed);
      }
    }
    setSide(side) {
      if (this.disposed || !['left', 'right'].includes(side) || this.side === side) return;
      this.side = side;
      this.geometryKey = '';
      this.autoAlignedSide = '';
      this.horizontalOffset = 0;
      this.restore(this.fixed);
      this.restore(this.saved);
      if (this.scrollbarHost) {
        this.scrollbarHost.hidden = true;
        this.scrollbarHost.style.setProperty('display', 'none', 'important');
      }
      if (this.layoutMode === 'auto') this.mode = 'floating';
      this.update();
    }
    setLayoutMode(layoutMode) {
      if (this.disposed || this.layoutMode === layoutMode) return;
      this.layoutMode = layoutMode;
      this.geometryKey = '';
      this.autoAlignedSide = '';
      if (layoutMode === 'floating' || layoutMode === 'auto') {
        this.mode = 'floating';
        this.restore(this.fixed);
        this.restore(this.saved);
        if (this.scrollbarHost) {
          this.scrollbarHost.hidden = true;
          this.scrollbarHost.style.setProperty('display', 'none', 'important');
        }
      }
      this.update();
    }
    update(width = this.width) {
      this.width = width;
      if (this.layoutMode === 'floating') {
        this.mode = 'floating';
        if (this.host.getAttribute('data-nutegg-layout') !== this.mode)
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
      if (this.host.getAttribute('data-nutegg-layout') !== this.mode)
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
      this.win.removeEventListener('wheel', this.wheel);
      this.doc.removeEventListener('focusin', this.focus);
      this.scrollbarHost?.remove();
      this.restore(this.fixed);
      this.restore(this.saved);
      if ((this.win.scrollX || 0) !== this.initialScrollX) this.win.scrollTo(this.initialScrollX, this.win.scrollY);
    }
  }
  root.NutEggPanelPageLayout = PanelPageLayout;
  if (typeof module !== 'undefined') module.exports = { PanelPageLayout };
})(globalThis);
