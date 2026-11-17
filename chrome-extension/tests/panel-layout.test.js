const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { PanelPageLayout } = require('../src/panel/page-layout');
function fixture(
  t,
  { left = 550, right = 1050, side = 'right', layoutMode = 'auto', scan = false, url = 'https://example.com/article', prepare } = {}
) {
  const dom = new JSDOM(
    '<html style="margin-left:2px"><body style="margin-left:8px"><main><p>Readable content</p></main><div data-nutegg-ui></div></body></html>',
    { pretendToBeVisual: true, url }
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
  prepare?.(win);
  const host = doc.querySelector('[data-nutegg-ui]');
  const layout = new PanelPageLayout(host, { side, width: 420, layoutMode, document: doc, window: win });
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
  assert.equal(doc.body.style.marginLeft, '8px');
  assert.equal(layout.scrollbarHost.style.width, '1168px');
  assert.equal(doc.querySelectorAll('[data-nutegg-page-scroll]').length, 1);
  layout.dispose();
  assert.equal(doc.documentElement.style.width, '');
  assert.equal(doc.documentElement.style.marginLeft, '2px');
});
test('always push mode pushes right-docked pages even when right margin is clear', t => {
  const { doc, host, layout } = fixture(t, { right: 1050, layoutMode: 'push' });
  assert.equal(host.getAttribute('data-nutegg-layout'), 'inserted');
  assert.equal(doc.documentElement.style.width, '1168px');
  layout.setLayoutMode('floating');
  assert.equal(host.getAttribute('data-nutegg-layout'), 'floating');
  assert.equal(doc.documentElement.style.width, '');
  layout.setLayoutMode('auto');
  assert.equal(host.getAttribute('data-nutegg-layout'), 'floating');
});
test('setSide switches pushed layout cleanly between right and left', t => {
  const { doc, host, layout } = fixture(t, { right: 1500, layoutMode: 'push' });
  assert.equal(host.getAttribute('data-nutegg-layout'), 'inserted');
  assert.equal(doc.documentElement.style.width, '1168px');
  layout.setSide('left');
  assert.equal(doc.documentElement.style.width, '');
  assert.equal(doc.body.style.marginLeft, '440px');
  layout.setSide('right');
  assert.equal(doc.documentElement.style.width, '1168px');
  assert.equal(doc.body.style.marginLeft, '8px');
});
test('left panels reserve the left side and resizing updates the reservation', t => {
  const { doc, layout } = fixture(t, { left: 20, right: 900, side: 'left' });
  assert.equal(doc.body.style.marginLeft, '440px');
  layout.update(500);
  assert.equal(layout.scrollbarHost.style.width, '1088px');
  assert.equal(doc.body.style.marginLeft, '520px');
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
  doc.body.style.setProperty('margin-left', '777px');
  layout.dispose();
  assert.equal(doc.body.style.marginLeft, '777px');
});

test('Bilibili columns retain their original layout and live DOM while the page pans horizontally', t => {
  const { doc, layout } = fixture(t, {
    left: 0,
    right: 1440,
    side: 'left',
    url: 'https://www.bilibili.com/video/BV1D3xj6FEzK/',
    prepare(win) {
      Object.defineProperty(win, 'innerWidth', { value: 1440, configurable: true });
      const app = win.document.createElement('div');
      app.id = 'app';
      app.style.minWidth = '1080px';
      app.innerHTML =
        '<div class="video-container-v1" style="display:flex;flex-wrap:nowrap;justify-content:center"><div class="left-container" style="position:sticky;width:978px"></div><div class="right-container" style="width:350px"></div></div>';
      win.document.body.prepend(app);
      const rect = (left, width) => ({ left, right: left + width, top: 20, bottom: 600, width, height: 580 });
      app.getBoundingClientRect = () => rect(432, 1080);
      app.firstChild.getBoundingClientRect = () => rect(432, 1008);
      app.querySelector('.left-container').getBoundingClientRect = () => rect(293, 978);
      app.querySelector('.right-container').getBoundingClientRect = () => rect(1301, 350);
    },
  });
  const player = doc.querySelector('.left-container');
  assert.equal(doc.querySelector('#app').style.minWidth, '1080px');
  assert.equal(doc.querySelector('.video-container-v1').style.flexWrap, 'nowrap');
  assert.equal(doc.querySelector('.video-container-v1').style.justifyContent, 'center');
  assert.equal(doc.querySelector('.left-container').style.position, 'sticky');
  assert.ok(doc.body.style.clipPath);
  assert.equal(doc.body.style.overflowX, '');
  layout.horizontalOffset = 200;
  layout.pan();
  assert.equal(doc.body.style.marginLeft, '240px');
  assert.equal(doc.querySelector('.left-container'), player);
  layout.dispose();
  assert.equal(doc.querySelector('#app').style.minWidth, '1080px');
  assert.equal(doc.querySelector('.video-container-v1').style.flexWrap, 'nowrap');
  assert.equal(doc.querySelector('.video-container-v1').style.justifyContent, 'center');
  assert.equal(doc.body.style.overflowX, '');
  assert.equal(doc.body.style.clipPath, '');
  assert.equal(doc.querySelector('[data-nutegg-page-scroll]'), null);
});

test('horizontal scrolling pans the existing page while ordinary vertical wheel scrolling remains native', t => {
  const { doc, win, layout } = fixture(t, { left: 20, right: 900, side: 'left' });
  const content = doc.querySelector('main');
  layout.scrollbar.scrollLeft = 200;
  layout.scrollbar.dispatchEvent(new win.Event('scroll'));
  assert.equal(doc.body.style.marginLeft, '240px');
  assert.equal(doc.querySelector('main'), content);
  const vertical = new win.WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
  doc.body.dispatchEvent(vertical);
  assert.equal(vertical.defaultPrevented, false);
  const horizontal = new win.WheelEvent('wheel', { deltaX: 100, bubbles: true, cancelable: true });
  doc.body.dispatchEvent(horizontal);
  assert.equal(horizontal.defaultPrevented, true);
  assert.equal(doc.body.style.marginLeft, '140px');
  layout.dispose();
  assert.equal(doc.body.style.marginLeft, '8px');
});
