// Bounded composed-DOM reader shared by articles, generic pages and source jumps.
var CAPTURE_DOM_LIMITS = { roots: 64, frames: 16, depth: 4, nodes: 100000 };
function captureNodeHidden(node) {
  if (node.nodeType !== 1) return false;
  if (node.hidden || node.getAttribute('aria-hidden') === 'true') return true;
  const style = node.ownerDocument.defaultView?.getComputedStyle(node);
  return style?.display === 'none' || style?.visibility === 'hidden';
}
function captureExcluded(node) {
  return (
    node.nodeType === 1 &&
    (node.matches(
      'script,style,noscript,svg,nav,footer,button,input,select,textarea,.comments,#comments,[itemprop="comment"],[data-comment-id],.sidebar,.advertisement,.ads,.social-share,.share-buttons,.related-posts,[role="navigation"]'
    ) ||
      captureNodeHidden(node))
  );
}
function captureRootWalker(context) {
  const roots = [],
    seen = new Set(),
    stack = [{ node: document, depth: 0 }];
  let frames = 0,
    nodes = 0,
    limited = false;
  const frameDocuments = [];
  function step() {
    let work = 0;
    while (stack.length && work++ < 1000) {
      context?.check();
      const { node, depth } = stack.pop();
      if (++nodes > CAPTURE_DOM_LIMITS.nodes) {
        limited = true;
        stack.length = 0;
        break;
      }
      if (captureExcluded(node)) continue;
      if (node.nodeType === 9 || node.nodeType === 11) {
        if (seen.has(node)) continue;
        if (roots.length >= CAPTURE_DOM_LIMITS.roots) {
          limited = true;
          continue;
        }
        seen.add(node);
        roots.push(node);
      }
      if (node.nodeType === 1 && node.shadowRoot) {
        if (depth < CAPTURE_DOM_LIMITS.depth) stack.push({ node: node.shadowRoot, depth: depth + 1 });
        else limited = true;
      }
      if (node.nodeType === 1 && node.tagName === 'IFRAME') {
        try {
          const child = node.contentDocument;
          // contentDocument is null for inaccessible origins; touching location verifies access.
          if (child?.documentElement && child.defaultView.location.href) {
            if (frames < CAPTURE_DOM_LIMITS.frames && depth < CAPTURE_DOM_LIMITS.depth) {
              frames++;
              frameDocuments.push({ frame: node, document: child });
              stack.push({ node: child, depth: depth + 1 });
            } else limited = true;
          }
        } catch {
          /* Cross-origin or sandboxed frame. */
        }
      }
      for (let i = (node.childNodes?.length || 0) - 1; i >= 0; i--) stack.push({ node: node.childNodes[i], depth });
    }
    return stack.length > 0;
  }
  return { step, result: () => ({ roots, frameDocuments, limited }) };
}
async function discoverCaptureRoots(context) {
  const walker = captureRootWalker(context);
  while (walker.step()) await capturePause(0, context);
  const result = walker.result();
  if (context) {
    context.domRoots = result.roots;
    context.frameDocuments = result.frameDocuments;
    context.domLimited = result.limited;
  }
  return result;
}
function captureDOMRoots() {
  const walker = captureRootWalker();
  while (walker.step()) {}
  return walker.result().roots;
}
function validateCaptureFrames(context) {
  for (const item of context?.selectedFrameDocuments || []) {
    if (!item.frame.isConnected || item.frame.contentDocument !== item.document)
      throw Object.assign(new Error('Embedded document changed'), { code: 'embedded_changed' });
  }
}
function findCaptureContainer(context) {
  validateCaptureFrames(context);
  const roots = context?.domRoots || [document];
  const selectors =
    '[itemprop="articleBody"],.RichTextStoryBody,.ArticleBody-articleBody,[data-module="ArticleBody"],.article-body,.article__body,.story-body,.story__body,[data-testid="article-body"],.caas-body,.meteredContent,.entry-content,.post-body,.post-content,article,[role="article"],main,[role="main"],#main-content,#content,.article-content,.article__content,.main-article,.blog-post,.story,.content,#article,.main';
  let best = null,
    bestScore = -Infinity;
  for (const root of roots) {
    const allCandidates = [...root.querySelectorAll(selectors)];
    if (allCandidates.length > 128 && context) context.domLimited = true;
    const candidates = allCandidates.slice(0, 128);
    if (root.body && !candidates.length) candidates.push(root.body);
    else if (root.nodeType === 11) candidates.push(root);
    for (const node of candidates) {
      if (captureExcluded(node) || node.closest?.('nav,header,footer,aside,.sidebar,[role="navigation"]')) continue;
      let hiddenAncestor = false;
      for (
        let ancestor = node.parentElement || node.getRootNode?.().host;
        ancestor;
        ancestor = ancestor.parentElement || ancestor.getRootNode?.().host
      ) {
        if (captureExcluded(ancestor)) {
          hiddenAncestor = true;
          break;
        }
      }
      if (hiddenAncestor) continue;
      context?.check();
      let text = node.textContent?.trim() || '';
      try {
        const clean = node.cloneNode(true);
        clean
          .querySelectorAll(
            'script,style,noscript,nav,footer,button,.comments,#comments,.sidebar,.ads,[hidden],[aria-hidden="true"]'
          )
          .forEach(el => el.remove());
        text = clean.textContent?.trim() || '';
      } catch {
        /* Shadow roots cannot be cloned; their own text remains a score hint. */
      }
      const linkLength = [...node.querySelectorAll('a')].reduce(
        (sum, link) => sum + (link.textContent?.length || 0),
        0
      );
      const p = node.querySelectorAll('p,pre,table,blockquote').length;
      const explicit = node.matches?.(
        '[itemprop="articleBody"],.RichTextStoryBody,.ArticleBody-articleBody,[data-module="ArticleBody"],[data-testid="article-body"],.article-body,.article__body,.post-content,.entry-content'
      );
      const score =
        text.length +
        p * 150 -
        linkLength * 1.5 +
        (explicit && text.length > 50 ? 1000 : 0) -
        (node.tagName === 'BODY' ? 500 : 0);
      if (score > bestScore) {
        best = node;
        bestScore = score;
      }
    }
  }
  return best;
}
function serializeCaptureDOM(container, context) {
  const seen = new Set();
  let nodes = 0,
    limited = false;
  const allowedRoots = new Set(context?.domRoots || captureDOMRoots());
  const usedFrames = [];
  for (
    let frame = container?.ownerDocument?.defaultView?.frameElement;
    frame;
    frame = frame.ownerDocument.defaultView?.frameElement
  ) {
    const item = context?.frameDocuments?.find(item => item.frame === frame);
    if (item) usedFrames.push(item);
  }
  const clean = text => text.replace(/[\t \r\n]+/g, ' ');
  const inline = node => {
    const parts = [];
    for (const child of children(node)) {
      if (nodes >= CAPTURE_DOM_LIMITS.nodes) {
        limited = true;
        break;
      }
      parts.push(visit(child));
    }
    return parts.join('');
  };
  function children(node) {
    if (node.nodeType === 1 && node.tagName === 'SLOT') {
      const assigned = node.assignedNodes?.({ flatten: true });
      if (assigned?.length) return [...assigned];
    }
    if (node.shadowRoot) {
      if (!allowedRoots.has(node.shadowRoot)) {
        limited = true;
        return [];
      }
      return [...node.shadowRoot.childNodes];
    }
    if (node.nodeType === 1 && node.tagName === 'IFRAME') {
      try {
        const doc = node.contentDocument;
        const frame = context?.frameDocuments?.find(item => item.frame === node);
        if (doc && allowedRoots.has(doc) && (!context || frame?.document === doc)) {
          if (frame) usedFrames.push(frame);
          return [doc.body || doc.documentElement].filter(Boolean);
        }
      } catch {}
      return [];
    }
    return [...(node.childNodes || [])];
  }
  let depth = 0;
  function visit(node) {
    if (seen.has(node)) return '';
    seen.add(node);
    if (++nodes > CAPTURE_DOM_LIMITS.nodes || depth > 256) {
      limited = true;
      return '';
    }
    if (nodes % 100 === 0) context?.check();
    if (node.nodeType === 3) return clean(node.textContent || '');
    if (captureExcluded(node)) return '';
    const tag = node.tagName;
    depth++;
    let result;
    if (tag === 'PRE') {
      const raw = rawCode(node);
      const fence = '`'.repeat([...raw.matchAll(/`+/g)].reduce((max, match) => Math.max(max, match[0].length + 1), 3));
      result = `\n\n${fence}\n${raw}\n${fence}\n\n`;
    } else if (tag === 'TABLE') result = table(node);
    else if (tag === 'BR') result = '\n';
    else if (tag === 'IMG') result = '';
    else if (tag === 'A') {
      const text = inline(node).trim();
      let href;
      try {
        const url = new URL(node.getAttribute('href'), node.ownerDocument.baseURI);
        if (/^https?:$/.test(url.protocol)) href = url.href.replace(/\)/g, '%29');
      } catch {}
      result = href && text ? `[${text}](${href})` : text;
    } else {
      const text = inline(node);
      if (/^H[1-6]$/.test(tag)) result = `\n\n${'#'.repeat(Number(tag[1]))} ${text.trim()}\n\n`;
      else if (tag === 'CODE') result = '`' + text + '`';
      else if (tag === 'BLOCKQUOTE')
        result =
          '\n\n' +
          text
            .trim()
            .split('\n')
            .map(line => '> ' + line)
            .join('\n') +
          '\n\n';
      else if (tag === 'LI') {
        const ordered = node.parentElement?.tagName === 'OL';
        const index = ordered
          ? Number(node.parentElement.getAttribute('start') || 1) + [...node.parentElement.children].indexOf(node)
          : 0;
        result = '\n' + (ordered ? `${index}. ` : '- ') + text.trim().replace(/\n/g, '\n  ') + '\n';
      } else if (
        ['P', 'DIV', 'SECTION', 'ARTICLE', 'MAIN', 'FIGURE', 'FIGCAPTION', 'UL', 'OL', 'DL', 'DT', 'DD', 'HR'].includes(
          tag
        )
      )
        result = '\n\n' + text.trim() + '\n\n';
      else result = text;
    }
    depth--;
    return result;
  }
  function rawCode(pre) {
    const stack = [...pre.childNodes].reverse(),
      parts = [];
    while (stack.length) {
      const node = stack.pop();
      if (seen.has(node)) continue;
      seen.add(node);
      if (++nodes > CAPTURE_DOM_LIMITS.nodes) {
        limited = true;
        break;
      }
      if (nodes % 100 === 0) context?.check();
      if (node.nodeType === 3) parts.push(node.textContent || '');
      else if (!captureExcluded(node)) {
        const count = Math.min(node.childNodes.length, Math.max(0, CAPTURE_DOM_LIMITS.nodes - nodes - stack.length));
        if (count < node.childNodes.length) limited = true;
        for (let i = count - 1; i >= 0; i--) stack.push(node.childNodes[i]);
      }
    }
    return parts.join('');
  }
  function table(node) {
    const rows = [],
      values = [];
    let complex = false;
    for (const row of node.rows) {
      if (++nodes >= CAPTURE_DOM_LIMITS.nodes) {
        limited = true;
        break;
      }
      if (captureExcluded(row)) continue;
      const cells = [];
      for (const cell of row.cells) {
        if (nodes >= CAPTURE_DOM_LIMITS.nodes) {
          limited = true;
          break;
        }
        complex ||= cell.colSpan > 1 || cell.rowSpan > 1;
        cells.push(visit(cell).trim().replace(/\n+/g, ' ').replace(/\|/g, '\\|'));
      }
      rows.push(row);
      values.push(cells);
      if (limited) break;
    }
    if (!values.length) return '';
    if (complex) return '\n\n' + values.map((row, i) => `Row ${i + 1}: ${row.join(' | ')}`).join('\n') + '\n\n';
    const width = values.reduce((max, row) => Math.max(max, row.length), 0);
    const rowText = row => '| ' + Array.from({ length: width }, (_, i) => row[i] || '').join(' | ') + ' |';
    const header = rows[0].querySelector('th') ? values.shift() : Array(width).fill('');
    return '\n\n' + [rowText(header), rowText(Array(width).fill('---')), ...values.map(rowText)].join('\n') + '\n\n';
  }
  const text = container ? visit(container).trim() : '';
  if (context) context.selectedFrameDocuments = usedFrames;
  validateCaptureFrames(context);
  return { text, limited: limited || context?.domLimited === true };
}
function textCaptureReadiness(container, body) {
  const text = body.replace(/^#{1,6} .*$/gm, '').trim();
  const relevant = node => {
    for (let current = node; current && current !== container; current = current.parentElement)
      if (captureExcluded(current)) return false;
    return true;
  };
  const wallSelector = '[data-testid="paywall"],.paywall,[data-paywall],form[action*="login"],form[action*="signin"]';
  const wall =
    container?.matches?.(wallSelector) || [...(container?.querySelectorAll(wallSelector) || [])].some(relevant);
  const accessText =
    /^(?:access denied|please (?:log|sign) in(?: to (?:continue|read))?|sign in to (?:continue|read)|subscribe to (?:continue|read|unlock))(?:[.!…\s]|$)/i.test(
      text
    );
  const blocked = !!wall || accessText;
  const loading =
    [...(container?.querySelectorAll('[aria-busy="true"],[role="progressbar"],.loading-spinner') || [])].some(
      relevant
    ) || container?.getAttribute?.('aria-busy') === 'true';
  const placeholder = /^(?:loading|please wait|加载中|載入中|読み込み中)[\s.!…]*$/i.test(text);
  return {
    status: blocked ? 'unavailable' : !text || placeholder || loading ? 'not_ready' : 'ready',
    blocked,
    loading,
  };
}
function captureTextResult(container, context, max = 60000) {
  const serialized = serializeCaptureDOM(container, context);
  const readiness = textCaptureReadiness(container, serialized.text);
  return {
    ...serialized,
    ...readiness,
    originalCharacters: serialized.text.length,
    text: truncate(serialized.text, max),
    truncated: serialized.text.length > max,
  };
}
function applyTextCaptureResult(capture, body) {
  capture.extractionStatus = body.status;
  if (body.truncated)
    addCaptureCoverage(capture, 'truncated', {
      originalCharacters: body.originalCharacters,
      capturedCharacters: Math.min(60000, body.originalCharacters),
    });
  if (body.limited) addCaptureCoverage(capture, 'traversal_limit');
  if (body.blocked) addCaptureCoverage(capture, 'access_restricted');
  Object.defineProperty(capture, '_bodyText', { value: body.text, configurable: true });
  return capture;
}
async function settleTextCapture(initial, extract, context) {
  if (!context) return initial;
  const settleStarted = Date.now();
  await discoverCaptureRoots(context);
  let capture = extract(context),
    fingerprint = capture?._bodyText || '',
    changed = Date.now();
  const until = Math.min(context.deadline - 20, settleStarted + 1000);
  while (capture && Date.now() < until) {
    context.check();
    context.partial = capture;
    if (capture.captureCoverage?.reasons.includes('access_restricted')) return capture;
    if (Date.now() - changed >= 300 && capture.extractionStatus === 'ready') return capture;
    await capturePause(Math.min(100, Math.max(1, until - Date.now())), context);
    await discoverCaptureRoots(context);
    const next = extract(context);
    if ((next?._bodyText || '') !== fingerprint) {
      fingerprint = next?._bodyText || '';
      changed = Date.now();
    }
    capture = next || capture;
  }
  if (capture && (Date.now() - changed < 300 || capture.extractionStatus === 'not_ready')) {
    capture.extractionStatus = 'not_ready';
    addCaptureCoverage(capture, 'loading_timeout');
  }
  return capture || initial;
}
