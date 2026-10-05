// Resolve references in the current page. Never follow comment links or pagination.
(function (scope) {
  const normalize = value => String(value || '').replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const pageKey = value => { try { const url = new URL(value); url.hash = ''; url.pathname = url.pathname.replace(/\/$/, '') || '/'; return url.href; } catch { return ''; } };
  const parent = el => el.parentElement || el.getRootNode?.().host;
  function visible(el) {
    for (let node = el; node; node = parent(node)) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || node.hidden) return false;
    }
    return true;
  }
  function roots() {
    const found = [document], seen = new Set(found);
    for (let i = 0; i < found.length && found.length < 2048; i++) {
      for (const el of found[i].querySelectorAll('*')) if (el.shadowRoot && !seen.has(el.shadowRoot) && found.length < 2048) {
        seen.add(el.shadowRoot); found.push(el.shadowRoot);
      }
    }
    return found;
  }
  function plainText(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('script, style, noscript, button, [hidden], [aria-hidden="true"]').forEach(node => node.remove());
    clone.querySelectorAll('br').forEach(node => node.replaceWith(document.createTextNode(' ')));
    clone.querySelectorAll('p, li, div').forEach(node => node.appendChild(document.createTextNode(' ')));
    return normalize(clone.textContent);
  }
  function resolve({ heading, quote, sourceId }) {
    if (sourceId) {
      const source = scope.NutEggDiscussion?.findSource(sourceId);
      return source?.element ? { element: source.element } : { reason: 'not_loaded' };
    }
    const allRoots = roots(), excerpt = normalize(quote);
    if (excerpt.length >= 8) {
      let matches = allRoots.flatMap(root => Array.from(root.querySelectorAll('p, li, blockquote, pre, h1, h2, h3, h4, h5, h6, .RichText, .RichContent-inner, .content, .postbody, .message-body, .cooked, .bbWrapper, [itemprop="articleBody"], article, main')))
        .filter(el => visible(el) && plainText(el).includes(excerpt));
      // Keep the smallest matching block, not its containing article/answer.
      matches = matches.filter(el => !matches.some(other => other !== el && el.contains(other)));
      const label = normalize(heading);
      if (matches.length > 1 && label) {
        const sections = allRoots.flatMap(root => Array.from(root.querySelectorAll('section, article')))
          .filter(el => Array.from(el.querySelectorAll('h1,h2,h3,h4,h5,h6')).some(h => normalize(h.textContent) === label));
        const scoped = matches.filter(el => sections.some(section => section.contains(el)));
        if (scoped.length) matches = scoped;
      }
      return matches.length === 1 ? { element: matches[0] } : { reason: matches.length ? 'ambiguous' : 'not_found' };
    }
    const label = normalize(heading);
    if (!label) return { reason: 'not_found' };
    const matches = allRoots.flatMap(root => Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')))
      .filter(el => visible(el) && normalize(el.textContent) === label);
    return matches.length === 1 ? { element: matches[0] } : { reason: matches.length ? 'ambiguous' : 'not_found' };
  }
  const highlighted = new WeakMap();
  async function jump(source) {
    if (source.expectedUrl && pageKey(source.expectedUrl) !== pageKey(location.href)) return { success: false, reason: 'page_changed' };
    let match = resolve(source);
    if (!match.element) return { success: false, reason: match.reason };
    let element = match.element;
    // Native disclosures and Zhihu's collapsed answer can expose already-loaded text.
    for (let node = element; node; node = parent(node)) if (node.matches('details')) node.open = true;
    const answer = element.closest?.('.RichContent.is-collapsed');
    const expand = answer?.querySelector('button.RichContent-expandButton, button.ContentItem-rightButton');
    if (expand) {
      expand.click();
      await new Promise(resolve => requestAnimationFrame(resolve));
      if (source.expectedUrl && pageKey(source.expectedUrl) !== pageKey(location.href)) return { success: false, reason: 'page_changed' };
      match = resolve(source); element = match.element;
    }
    if (!element?.isConnected || !visible(element)) return { success: false, reason: 'not_loaded' };
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    const previous = highlighted.get(element);
    if (previous) clearTimeout(previous.timer);
    const original = previous?.original || { outline: element.style.outline, outlineOffset: element.style.outlineOffset };
    element.style.outline = '2px solid #eab308'; element.style.outlineOffset = '3px';
    const timer = setTimeout(() => { element.style.outline = original.outline; element.style.outlineOffset = original.outlineOffset; highlighted.delete(element); }, 2200);
    highlighted.set(element, { original, timer });
    return { success: true };
  }
  scope.NutEggSources = { jump, resolve };
})(typeof window !== 'undefined' ? window : globalThis);
