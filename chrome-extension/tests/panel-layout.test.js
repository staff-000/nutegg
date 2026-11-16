const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { PanelPageLayout } = require('../src/panel/page-layout');
function fixture(t, { left = 550, right = 1050, side = 'right', scan = false } = {}) {
  const dom = new JSDOM(
    '<html style="margin-left:2px"><body><main><p>Readable content</p></main><div data-nutegg-ui></div></body></html>',
    { pretendToBeVisual: true }
  );
  t.after(() => dom.window.close());
  const win = dom.window,
    doc = win.document;
  Object.defineProperty(win, 'innerWidth', { value: 1600, configurable: true });
  doc.createRange = () => ({
    selectNodeContents() {},
    getClientRects: () => [{ left, right, top: 10, bottom: 100, width: right - left, height: 90 }],
  });
  const getStyle = win.getComputedStyle.bind(win);
  win.getComputedStyle = node => {
    const style = getStyle(node);
    return new Proxy(style, {
      get: (obj, key) =>
        ['backgroundImage', 'transform', 'perspective', 'filter'].includes(key) ? obj[key] || 'none' : obj[key],
    });
  };
  if (scan) for (let i = 0; i < 3100; i++) doc.querySelector('main').append(doc.createElement('span'));
  const host = doc.querySelector('[data-nutegg-ui]');
  const layout = new PanelPageLayout(host, { side, width: 420, document: doc, window: win });
  t.after(() => layout.dispose());
  return { doc, win, host, layout };
}
test('clear side space floats without changing website styles', t => {
  const { doc, host } = fixture(t);
  assert.equal(host.getAttribute('data-nutegg-layout'), 'floating');
  assert.equal(doc.documentElement.style.width, '');
});
test('insufficient space reserves width and closing restores original styles', t => {
  const { doc, host, layout } = fixture(t, { right: 1500 });
  assert.equal(host.getAttribute('data-nutegg-layout'), 'inserted');
  assert.equal(doc.documentElement.style.width, '1168px');
  assert.equal(doc.documentElement.style.marginRight, '432px');
  layout.dispose();
  assert.equal(doc.documentElement.style.width, '');
  assert.equal(doc.documentElement.style.marginLeft, '2px');
});
test('left panels reserve the left side and resizing updates the reservation', t => {
  const { doc, layout } = fixture(t, { left: 20, right: 900, side: 'left' });
  assert.equal(doc.documentElement.style.marginLeft, '432px');
  layout.update(500);
  assert.equal(doc.documentElement.style.width, '1088px');
  assert.equal(doc.documentElement.style.marginLeft, '512px');
});
test('a wider panel switches from floating to inserted without oscillating', t => {
  const { layout } = fixture(t);
  layout.update(700);
  assert.equal(layout.mode, 'inserted');
  layout.update(280);
  assert.equal(layout.mode, 'inserted');
});
test('uncertain geometry reserves space and page-owned style changes survive cleanup', t => {
  const { doc, layout } = fixture(t, { scan: true });
  assert.equal(layout.mode, 'inserted');
  doc.documentElement.style.setProperty('width', '777px');
  layout.dispose();
  assert.equal(doc.documentElement.style.width, '777px');
});
