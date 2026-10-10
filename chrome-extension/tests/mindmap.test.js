const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
require('../src/i18n.js');
const { MindmapComponent } = require('../src/popup/ui/mindmap.js');
require('../src/popup/ui/qa.js');
const { handleSourcePillClick } = global.NutEggUI;

test('mind-map timestamp clicks seek without collapsing branches and escape source text', t => {
  const dom = new JSDOM('<div id="mindmap-section"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => { global.document = previousDocument; dom.window.close(); });
  new MindmapComponent(document).render([
    { name: '<img src=x onerror=alert(1)>', time: '12:34', detail: 'Evidence [01:02:03]', children: [{ name: 'Child', time: '13:45' }] },
    { name: 'Another topic at 100:00' },
  ]);
  const tree = document.getElementById('mindmap-tree');
  assert.equal(tree.querySelector('img'), null);
  assert.ok(tree.textContent.includes('<img src=x onerror=alert(1)>'));
  const seeks = [];
  document.addEventListener('click', event => handleSourcePillClick(event, { onSeek: seconds => seeks.push(seconds) }));
  for (const pill of tree.querySelectorAll('.source-pill')) pill.click();
  assert.deepEqual(seeks, [754, 3723, 825, 6000]);
  assert.equal(tree.querySelector('.mindmap-children').classList.contains('collapsed'), false);
  tree.querySelector('.mindmap-toggle-btn').click();
  assert.equal(tree.querySelector('.mindmap-children').classList.contains('collapsed'), true);
});

test('a timestamped root keeps its own citation visible', t => {
  const dom = new JSDOM('<div id="mindmap-section"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => { global.document = previousDocument; dom.window.close(); });
  new MindmapComponent(document).render([{ name: 'Main topic', time: '00:00', children: [{ name: 'Subtopic' }] }]);
  assert.equal(document.querySelector('.source-pill').dataset.time, '00:00');
});

test('text mind-map source tags jump while titles only expand branches', t => {
  const dom = new JSDOM('<div id="mindmap-section"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => { global.document = previousDocument; dom.window.close(); });
  new MindmapComponent(document).render([{ name: 'Translated topic', sources: [{ ref: 'Original heading', quote: 'Exact supporting passage', sourceId: 'zhihu:answer-1' }], children: [{ name: 'Child' }] }]);
  const calls = [];
  document.addEventListener('click', event => handleSourcePillClick(event, { onScroll: (...args) => calls.push(args), onSeek: () => assert.fail('Text reference sought a video') }));
  const tag = document.querySelector('.source-mindmap');
  assert.equal(tag.querySelector('.source-ref').textContent, 'Source');
  assert.equal(tag.classList.contains('source-section'), true);
  assert(document.querySelector('.mindmap-node-name').firstChild.textContent.includes('Translated topic'));
  tag.click();
  assert.deepEqual(calls, [['Original heading', 'Exact supporting passage', 'zhihu:answer-1']]);
  assert.equal(document.querySelector('.mindmap-children').classList.contains('collapsed'), false);
  document.querySelector('.mindmap-node-name').click();
  assert.equal(document.querySelector('.mindmap-children').classList.contains('collapsed'), true);
  assert.equal(calls.length, 1);
  document.querySelector('.mindmap-toggle-btn').click();
  assert.equal(document.querySelector('.mindmap-children').classList.contains('collapsed'), false);
});

test('Q&A comment sources route by captured ID even when the label contains a timestamp', t => {
  const dom = new JSDOM('<div id="sources"></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => { global.document = previousDocument; dom.window.close(); });
  const { renderQaSources } = require('../src/popup/ui/qa.js');
  document.getElementById('sources').innerHTML = renderQaSources([{ ref: 'Comment about 12:34', quote: 'Comment evidence', sourceId: 'reddit:t1_c1' }]);
  const calls = [];
  document.addEventListener('click', event => handleSourcePillClick(event, { onScroll: (...args) => calls.push(args), onSeek: () => assert.fail('Comment attempted video seek') }));
  document.querySelector('.source-pill').click();
  assert.deepEqual(calls, [['Comment about 12:34', 'Comment evidence', 'reddit:t1_c1']]);
});

test('a text heading containing a ratio is not treated as a video timestamp', t => {
  const dom = new JSDOM('<div id="sources"></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => { global.document = previousDocument; dom.window.close(); });
  document.getElementById('sources').innerHTML = global.NutEggUI.renderQaSources([{ ref: 'The 1:30 ratio', quote: 'An exact supporting passage' }]);
  const calls = [];
  document.addEventListener('click', event => handleSourcePillClick(event, { onScroll: (...args) => calls.push(args), onSeek: () => assert.fail('Ratio sought video') }));
  document.querySelector('.source-pill').click();
  assert.equal(calls[0][0], 'The 1:30 ratio');
});

test('mind-map nodes omit source tag when there is a timestamp', t => {
  const dom = new JSDOM('<div id="mindmap-section"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => { global.document = previousDocument; dom.window.close(); });
  new MindmapComponent(document).render([
    {
      name: 'Video topic',
      time: '05:30',
      sources: [{ ref: 'Chapter 2', quote: 'Supporting transcript', sourceId: 'yt-ch-2' }],
      children: [{ name: 'Subtopic with time', time: '06:00', sources: [{ ref: 'Chapter 2.1' }] }],
    },
  ]);
  const tree = document.getElementById('mindmap-tree');
  // Should NOT contain .source-mindmap or .source-section tag
  assert.equal(tree.querySelector('.source-mindmap'), null);
  assert.equal(tree.querySelector('.source-section'), null);
  // Should contain timestamp buttons
  const timestamps = tree.querySelectorAll('.source-timestamp');
  assert.equal(timestamps.length, 2);
  assert.equal(timestamps[0].dataset.time, '05:30');
  assert.equal(timestamps[1].dataset.time, '06:00');
});

test('video uses current timestamp to determine current node when linear in progress', t => {
  const dom = new JSDOM('<div id="mindmap-section"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => { global.document = previousDocument; dom.window.close(); });
  const component = new MindmapComponent(document);
  const nodes = [
    { name: 'Intro', time: '01:00' },
    { name: 'Key Mechanism', time: '03:00' },
    { name: 'Conclusion', time: '06:00' },
  ];
  component.render(nodes, true, { type: 'video', currentTime: 240 }); // 04:00 (between 03:00 and 06:00)

  const currentNodes = document.querySelectorAll('.mindmap-node.is-current');
  assert.equal(currentNodes.length, 1);
  assert.ok(currentNodes[0].querySelector('.mindmap-node-name').textContent.includes('Key Mechanism'));
  assert.ok(currentNodes[0].querySelector('.mindmap-current-badge'));
});

test('if video mindmap is not exactly linear in progress, show the first one', t => {
  const dom = new JSDOM('<div id="mindmap-section"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => { global.document = previousDocument; dom.window.close(); });
  const component = new MindmapComponent(document);
  // Timestamps jump backwards from 05:00 to 02:00 -> not linear
  const nodes = [
    { name: 'Overview at five min', time: '05:00' },
    { name: 'Background at two min', time: '02:00' },
    { name: 'Deep dive at eight min', time: '08:00' },
  ];
  component.render(nodes, true, { type: 'video', currentTime: 360 }); // 06:00

  const currentNodes = document.querySelectorAll('.mindmap-node.is-current');
  assert.equal(currentNodes.length, 1);
  // Both 05:00 and 02:00 have passed <= 06:00, but progress is non-linear -> must show the first one
  assert.ok(currentNodes[0].querySelector('.mindmap-node-name').textContent.includes('Overview at five min'));
  assert.ok(currentNodes[0].querySelector('.mindmap-current-badge'));
});

test('long text uses position to determine current node when linear in progress', t => {
  const dom = new JSDOM('<div id="mindmap-section"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => { global.document = previousDocument; dom.window.close(); });
  const component = new MindmapComponent(document);
  const nodes = [
    { name: 'Part 1', position: 0.1 },
    { name: 'Part 2', position: 0.4 },
    { name: 'Part 3', position: 0.8 },
  ];
  component.render(nodes, true, { type: 'text', position: 0.5 });

  const currentNodes = document.querySelectorAll('.mindmap-node.is-current');
  assert.equal(currentNodes.length, 1);
  assert.ok(currentNodes[0].querySelector('.mindmap-node-name').textContent.includes('Part 2'));
  assert.ok(currentNodes[0].querySelector('.mindmap-current-badge'));
});

test('if long text mindmap is not exactly linear in progress, show the first one', t => {
  const dom = new JSDOM('<div id="mindmap-section"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => { global.document = previousDocument; dom.window.close(); });
  const component = new MindmapComponent(document);
  // Non-linear positions: 0.6 -> 0.2 -> 0.9
  const nodes = [
    { name: 'High-level concept', position: 0.6 },
    { name: 'Early premise', position: 0.2 },
    { name: 'Late conclusion', position: 0.9 },
  ];
  component.render(nodes, true, { type: 'text', position: 0.7 });

  const currentNodes = document.querySelectorAll('.mindmap-node.is-current');
  assert.equal(currentNodes.length, 1);
  // Both 0.6 and 0.2 qualify <= 0.7, but progress is non-linear -> must show the first one
  assert.ok(currentNodes[0].querySelector('.mindmap-node-name').textContent.includes('High-level concept'));
  assert.ok(currentNodes[0].querySelector('.mindmap-current-badge'));
});

test('updateProgress dynamically shifts current node and uncollapses parent branches', t => {
  const dom = new JSDOM('<div id="mindmap-section"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => { global.document = previousDocument; dom.window.close(); });
  const component = new MindmapComponent(document);
  const nodes = [
    { name: 'Root 1', time: '00:00', children: [{ name: 'Child 1.1', time: '01:30' }] },
    { name: 'Root 2', time: '03:00', children: [{ name: 'Child 2.1', time: '04:30' }] },
  ];
  component.render(nodes, true, { type: 'video', currentTime: 10 }); // 00:10
  assert.ok(document.querySelector('.is-current .mindmap-node-name').textContent.includes('Root 1'));

  // Manually collapse the second root
  const children = document.querySelectorAll('.mindmap-children');
  children[1].classList.add('collapsed');

  // Progress advances to 05:00 -> Child 2.1
  component.updateProgress({ type: 'video', currentTime: 300 });

  const current = document.querySelector('.is-current');
  assert.ok(current.querySelector('.mindmap-node-name').textContent.includes('Child 2.1'));
  // The collapsed parent branch was automatically uncollapsed so the current child is visible
  assert.equal(children[1].classList.contains('collapsed'), false);
});

test('mindmap auto scroll rules: avoids scroll on fresh analysis, short mindmaps, or reading other sections', t => {
  const dom = new JSDOM('<div id="mindmap-section"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => { global.document = previousDocument; dom.window.close(); });

  const component = new MindmapComponent(document);
  const nodes = [
    { name: 'Node 1', time: '00:00' },
    { name: 'Node 2', time: '02:00' },
    { name: 'Node 3', time: '04:00' },
  ];
  component.render(nodes, true);

  const nodeEl = document.querySelector('.mindmap-node');
  let scrolled = false;
  nodeEl.scrollIntoView = () => { scrolled = true; };

  // Case 3: Fresh analysis, nothing touched -> should not auto scroll
  assert.equal(component.userTouched, false);
  assert.equal(component.shouldAutoScroll(nodeEl), false);

  // Mark user touched
  component.markUserTouched();
  assert.equal(component.userTouched, true);

  // Case 2: Mindmap is too short to scroll (e.g. height 300 <= vh 600)
  const section = document.getElementById('mindmap-section');
  section.getBoundingClientRect = () => ({
    top: 50, bottom: 350, left: 0, right: 300, width: 300, height: 300,
  });
  assert.equal(component.shouldAutoScroll(nodeEl), false);

  // Case 1: Long mindmap (height 1200), but user is reading others (< 2/3 screen filled)
  // vh = 600. Mindmap is scrolled down so visible from top: 450 to bottom: 600 (visibleHeight = 150 -> 150/600 = 25% < 66.7%)
  section.getBoundingClientRect = () => ({
    top: 450, bottom: 1650, left: 0, right: 300, width: 300, height: 1200,
  });
  assert.equal(component.shouldAutoScroll(nodeEl), false);

  // When mindmap fills >= 2/3 of screen (e.g. top: -200, bottom: 1000 -> visible 0 to 600 -> 600/600 = 100% >= 66.7%)
  // and node is outside the visible area:
  section.getBoundingClientRect = () => ({
    top: -200, bottom: 1000, left: 0, right: 300, width: 300, height: 1200,
  });
  nodeEl.getBoundingClientRect = () => ({
    top: 800, bottom: 830, left: 0, right: 300, width: 300, height: 30, // outside bottom of screen (vh 768)
  });
  assert.equal(component.shouldAutoScroll(nodeEl), true);
});


