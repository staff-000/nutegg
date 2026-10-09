// Shared immediate hints for the popup and settings, including dynamic controls.
(() => {
  const doc = document;
  const bubble = doc.createElement('div');
  bubble.id = 'nutegg-tooltip';
  bubble.className = 'nutegg-tooltip';
  bubble.setAttribute('role', 'tooltip');
  bubble.hidden = true;
  doc.body.appendChild(bubble);
  doc.documentElement.classList.add('instant-hints');
  let active = null;

  function suppressed(element) {
    return element?.matches('[data-hints="self-off"]') || element?.closest('[data-hints="off"]');
  }

  function convert(element) {
    if (suppressed(element)) {
      for (const attribute of ['title', 'data-hint', 'data-tooltip']) {
        if (element.hasAttribute(attribute)) element.removeAttribute(attribute);
      }
      return;
    }
    if (!element.hasAttribute('title')) return;
    const title = element.getAttribute('title');
    if (title) element.setAttribute('data-hint', title);
    else element.removeAttribute('data-hint');
    // Preserve the accessible name of icon-only controls that relied on title.
    if (title && element.matches('button, a') && !element.textContent.trim() && !element.hasAttribute('aria-label')) {
      element.setAttribute('aria-label', title);
    }
    element.removeAttribute('title');
  }
  function scan(root) {
    if (root.nodeType !== 1) return;
    convert(root);
    root.querySelectorAll('[title], [data-hint], [data-tooltip]').forEach(convert);
  }
  function hide() {
    if (active) {
      const ids = (active.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== bubble.id);
      if (ids.length) active.setAttribute('aria-describedby', ids.join(' '));
      else active.removeAttribute('aria-describedby');
    }
    active = null;
    bubble.hidden = true;
  }
  function show(element) {
    if (suppressed(element)) return hide();
    let text = element?.getAttribute('data-hint') || element?.getAttribute('data-tooltip');
    // These controls may be inserted by translated HTML or result renderers.
    if (!text && typeof globalThis.t === 'function') {
      if (element?.matches('a[href^="mailto:"]')) text = t('reportBugEmailTooltip');
      else if (element?.hasAttribute('data-time')) text = t('jumpToVideoTime', { time: element.getAttribute('data-time') });
      else if (element?.matches('.source-pill')) text = t('sourceTooltip');
    }
    if (!text || !element.isConnected || element.closest('.hidden, [hidden]')) return hide();
    if (active !== element) hide();
    active = element;
    if (bubble.textContent !== text) bubble.textContent = text;
    bubble.hidden = false;
    const ids = new Set((element.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    ids.add(bubble.id);
    element.setAttribute('aria-describedby', [...ids].join(' '));
    const rect = element.getBoundingClientRect();
    const width = bubble.offsetWidth;
    const height = bubble.offsetHeight;
    const left = Math.max(8, Math.min(rect.left + (rect.width - width) / 2, window.innerWidth - width - 8));
    const top = rect.top >= height + 16 ? rect.top - height - 8 : rect.bottom + 8;
    bubble.style.left = `${left}px`;
    bubble.style.top = `${Math.max(8, Math.min(top, window.innerHeight - height - 8))}px`;
  }
  function target(node) {
    if (node?.closest?.('[data-hints="off"]')) return null;
    const element = node?.closest?.('[data-hint], [data-tooltip]:not([data-tooltip=""]), a[href^="mailto:"], .source-pill, [data-time]');
    return suppressed(element) ? null : element;
  }
  scan(doc.body);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') scan(record.target);
      else record.addedNodes.forEach(scan);
    }
    if (active) show(active);
  }).observe(doc.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['title', 'data-tooltip', 'class', 'data-hints'] });
  doc.addEventListener('pointerover', event => show(target(event.target)));
  doc.addEventListener('pointerout', event => {
    if (target(event.relatedTarget) !== active) hide();
  });
  doc.addEventListener('focusin', event => show(target(event.target)));
  doc.addEventListener('focusout', hide);
  doc.addEventListener('pointerdown', hide);
  doc.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  doc.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
  window.addEventListener('blur', hide);
})();
