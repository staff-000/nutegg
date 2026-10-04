const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
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
