const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { PanelPageLayout, resolveContentAlignment } = require('../src/panel/page-layout');
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
  const { doc, host, layout } = fixture(t, { left: 0, right: 1500 });
  assert.equal(host.getAttribute('data-nutegg-layout'), 'inserted');
  assert.equal(doc.documentElement.style.width, '');
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
  assert.equal(doc.documentElement.style.width, '');
  layout.setLayoutMode('floating');
  assert.equal(host.getAttribute('data-nutegg-layout'), 'floating');
  assert.equal(doc.documentElement.style.width, '');
  layout.setLayoutMode('auto');
  assert.equal(host.getAttribute('data-nutegg-layout'), 'floating');
});
test('setSide switches pushed layout cleanly between right and left', t => {
  const { doc, host, layout } = fixture(t, { left: 0, right: 1500, layoutMode: 'push' });
  assert.equal(host.getAttribute('data-nutegg-layout'), 'inserted');
  assert.equal(doc.documentElement.style.width, '');
  layout.setSide('left');
  assert.equal(doc.documentElement.style.width, '');
  assert.equal(doc.body.style.marginLeft, '440px');
  layout.setSide('right');
  assert.equal(doc.documentElement.style.width, '');
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

test('push mode auto-scrolls centered content to align beside left or right panel', t => {
  // Left panel: content starts at left=300 in 1600px viewport -> trims excess left margin (300 - 12 = 288)
  const leftFit = fixture(t, { left: 300, right: 1100, side: 'left', layoutMode: 'push' });
  assert.equal(leftFit.layout.horizontalOffset, 288);
  assert.equal(leftFit.doc.body.style.marginLeft, `${8 + 432 - 288}px`);

  // Right panel: content right=1360 exceeds available=1168, left=260 -> shifts left to fit right edge
  const rightFit = fixture(t, { left: 260, right: 1360, side: 'right', layoutMode: 'push' });
  assert.equal(rightFit.layout.horizontalOffset, 1360 - (1168 - 12));
  assert.equal(rightFit.doc.body.style.marginLeft, `${8 - rightFit.layout.horizontalOffset}px`);
});


test('right docking preserves native page width and fixed media geometry', t => {
  const { doc, layout } = fixture(t, { left: 0, right: 1500, prepare(win) {
    win.document.body.style.width = '1584px';
    const media = win.document.createElement('div');
    media.id = 'live-photo';
    media.style.cssText = 'position:fixed;width:300px;left:1300px';
    media.getBoundingClientRect = () => ({left:1300,right:1600,top:50,bottom:350,width:300,height:300});
    win.document.body.append(media);
  }});
  assert.equal(doc.body.style.width, '1584px');
  assert.equal(doc.documentElement.style.width, '');
  assert.equal(doc.body.style.marginLeft, '8px');
  assert.equal(doc.querySelector('#live-photo').style.width, '300px');
  assert.equal(doc.querySelector('#live-photo').style.left, '1300px');
  assert.equal(layout.canvasWidth, 1600);
});

test('feed mutations, media loads and vertical scrolling do not rewrite page layout', async t => {
  const { doc, win, layout } = fixture(t, { right: 1500 });
  const mutations = [];
  const observer = new win.MutationObserver(records => mutations.push(...records));
  observer.observe(doc.documentElement, {attributes:true, subtree:true, attributeFilter:['style']});
  t.after(() => observer.disconnect());
  doc.querySelector('main').append(doc.createElement('video'));
  doc.querySelector('video').dispatchEvent(new win.Event('load'));
  win.dispatchEvent(new win.Event('scroll'));
  await new Promise(resolve => setTimeout(resolve, 300));
  layout.update();
  await Promise.resolve();
  assert.equal(mutations.length, 0, 'passive updates must not reset geometry or retrigger hover');
  layout.update(500);
  assert.equal(layout.scrollbarHost.style.width, '1088px');
});

test('opening below the fold does not align the page to the currently visible content', t => {
  const { layout, doc } = fixture(t, { left: 400, right: 1500, layoutMode: 'push', prepare(win) {
    Object.defineProperty(win, 'scrollY', { value: 900, configurable: true });
  }});
  assert.equal(layout.horizontalOffset, 0);
  assert.equal(doc.body.style.marginLeft, '8px');
});

test('mini-player stays beside panel and releases dimensions when returning to normal flow', t => {
  const { doc, layout } = fixture(t, { left: 0, right: 1500, layoutMode: 'push', prepare(win) {
    const player = win.document.createElement('div');
    player.id = 'mini-player';
    player.style.cssText = 'position:fixed;right:20px;width:300px';
    player.append(win.document.createElement('video'));
    player.getBoundingClientRect = () => {
      const left = player.style.left ? parseFloat(player.style.left) : 1280;
      return {left,right:left+300,top:300,bottom:500,width:300,height:200};
    };
    win.document.body.append(player);
  }});
  const player = doc.querySelector('#mini-player');
  const video = player.firstChild;
  assert.equal(player.style.left, '848px');
  player.style.position = 'static';
  layout.update();
  assert.equal(player.style.left, '');
  assert.equal(player.style.right, '20px');
  assert.equal(player.style.getPropertyPriority('width'), '');
  assert.equal(player.firstChild, video);
  // Mini mode can activate again while NutEgg stays open.
  player.style.position = 'fixed';
  layout.update();
  assert.equal(player.style.left, '848px');
  layout.dispose();
  assert.equal(player.style.left, '');
  assert.equal(player.style.right, '20px');
});

test('site alignment strategies align X primaryColumn and scrolled Weibo #comment main content beside left panel', t => {
  // X status page: primaryColumn sits at left=380 while left nav is at left=0
  const xFit = fixture(t, {
    left: 0,
    right: 1400,
    side: 'left',
    layoutMode: 'push',
    url: 'https://x.com/AI_DVD6/status/2122672539814019530',
    prepare(win) {
      const col = win.document.createElement('div');
      col.setAttribute('data-testid', 'primaryColumn');
      col.getBoundingClientRect = () => ({ left: 380, right: 980, top: 0, bottom: 900, width: 600, height: 900 });
      win.document.querySelector('main').append(col);
    },
  });
  assert.equal(xFit.layout.horizontalOffset, 380 - 12);

  // Weibo detail page scrolled to #comment (scrollY > 0): aligns to Main_full center column
  const weiboFit = fixture(t, {
    left: 0,
    right: 1400,
    side: 'left',
    layoutMode: 'push',
    url: 'https://weibo.com/7070444422/Rs0wKouK0?from=feed#comment',
    prepare(win) {
      Object.defineProperty(win, 'scrollY', { value: 650, configurable: true });
      const center = win.document.createElement('div');
      center.className = 'Main_full_1dfQX';
      center.getBoundingClientRect = () => ({ left: 410, right: 1052, top: 0, bottom: 1200, width: 642, height: 1200 });
      win.document.querySelector('main').append(center);
    },
  });
  assert.equal(weiboFit.layout.horizontalOffset, 410 - 12);

  // Abstract resolver supports custom URL pattern strategies
  const custom = resolveContentAlignment(
    'https://docs.example.org/guide/intro',
    { doc: xFit.doc, win: xFit.win, layout: xFit.layout },
    [
      {
        id: 'custom-docs',
        match: ({ hostname, pathname }) => hostname === 'docs.example.org' && pathname.startsWith('/guide/'),
        resolve: () => ({ left: 240, right: 1040 }),
      },
    ]
  );
  assert.deepEqual(custom, { left: 240, right: 1040, strategyId: 'custom-docs' });
});
