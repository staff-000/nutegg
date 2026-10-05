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
