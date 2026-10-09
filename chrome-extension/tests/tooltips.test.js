const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const script = fs.readFileSync(require.resolve('../src/tooltips.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

function setup(t, html) {
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  dom.window.eval(script);
  const doc = dom.window.document;
  const bubble = doc.getElementById('nutegg-tooltip');
  const hover = element => element.dispatchEvent(new dom.window.MouseEvent('pointerover', { bubbles: true }));
  return { dom, doc, bubble, hover };
}

test('hints appear immediately on hover and focus without native tooltip duplication', t => {
  const { dom, doc, bubble, hover } = setup(t, '<button title="Analyze this page" aria-describedby="existing">Analyze</button>');
  const button = doc.querySelector('button');
  assert.equal(button.hasAttribute('title'), false);
  hover(button);
  assert.equal(bubble.hidden, false);
  assert.equal(bubble.textContent, 'Analyze this page');
  assert.equal(button.getAttribute('aria-describedby'), 'existing nutegg-tooltip');
  doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(bubble.hidden, true);
  assert.equal(button.getAttribute('aria-describedby'), 'existing');
  button.focus();
  assert.equal(bubble.hidden, false);
  button.blur();
  assert.equal(bubble.hidden, true);
});

test('dynamic and disabled controls use the latest localized hint and clear on removal', async t => {
  const { doc, bubble, hover } = setup(t, '<main></main>');
  const button = doc.createElement('button');
  button.title = '刷新内容';
  button.disabled = true;
  doc.querySelector('main').appendChild(button);
  await flush();
  hover(button);
  assert.equal(bubble.textContent, '刷新内容');
  assert.equal(button.getAttribute('aria-label'), '刷新内容');
  button.title = 'Please wait until loading finishes';
  await flush();
  assert.equal(bubble.textContent, 'Please wait until loading finishes');
  assert.equal(button.hasAttribute('title'), false);
  button.remove();
  await flush();
  assert.equal(bubble.hidden, true);
});

test('hints fit the viewport and dismiss on scrolling or hiding their control', async t => {
  const { dom, doc, bubble, hover } = setup(t, '<button title="Refresh">Refresh</button>');
  const button = doc.querySelector('button');
  Object.defineProperty(dom.window, 'innerWidth', { value: 320 });
  Object.defineProperty(bubble, 'offsetWidth', { value: 200 });
  Object.defineProperty(bubble, 'offsetHeight', { value: 40 });
  button.getBoundingClientRect = () => ({ left: 295, top: 2, bottom: 24, width: 20 });
  hover(button);
  assert.equal(bubble.style.left, '112px');
  assert.equal(bubble.style.top, '32px');
  doc.dispatchEvent(new dom.window.Event('scroll'));
  assert.equal(bubble.hidden, true);
  hover(button);
  button.classList.add('hidden');
  await flush();
  assert.equal(bubble.hidden, true);
});

test('email, source and timestamp controls have immediate hints even without title attributes', t => {
  const { dom, doc, bubble, hover } = setup(t, '<main></main>');
  const i18n = require('../src/i18n.js');
  i18n.initI18n('en');
  dom.window.t = i18n.t;
  doc.querySelector('main').innerHTML = `
    <a href="mailto:staffhacker.000@gmail.com"><span>Email</span></a>
    <button class="source-pill" data-heading="Introduction"><span>Source</span></button>
    <button class="source-pill" data-time="01:23"><span>01:23</span></button>`;
  const controls = doc.querySelectorAll('main span');
  hover(controls[0]);
  assert.match(bubble.textContent, /Email staffhacker/);
  hover(controls[1]);
  assert.equal(bubble.textContent, 'scroll to the source');
  hover(controls[2]);
  assert.equal(bubble.textContent, 'Jump to 01:23 in video');
  assert.equal(bubble.hidden, false);
});

test('a wrapper can suppress its own hint while keeping menu option hints', async t => {
  const { doc, bubble, hover } = setup(t, '<div data-hints="self-off" title="Choose eggs"><button title="Include knowledge">Knowledge</button></div>');
  const wrapper = doc.querySelector('[data-hints]');
  wrapper.setAttribute('data-tooltip', 'Choose eggs again');
  await flush();
  hover(wrapper);
  assert.equal(bubble.hidden, true);
  hover(wrapper.querySelector('button'));
  assert.equal(bubble.textContent, 'Include knowledge');
  assert.equal(bubble.hidden, false);
});

test('explicitly disabled hints stay off after rendering, including wrappers and keyboard focus', async t => {
  const { doc, bubble, hover } = setup(t, '<div data-hints="off" title="Wrapper hint"><button title="Analyze">Analyze</button></div><button id="keep" title="Keep this hint">Keep</button>');
  const button = doc.querySelector('button');
  hover(button);
  button.focus();
  assert.equal(bubble.hidden, true);
  button.title = 'A renderer added another hint';
  button.setAttribute('data-tooltip', 'Still no hint');
  await flush();
  assert.equal(button.hasAttribute('title'), false);
  assert.equal(button.hasAttribute('data-hint'), false);
  assert.equal(button.hasAttribute('data-tooltip'), false);
  hover(button);
  assert.equal(bubble.hidden, true);
  hover(doc.getElementById('keep'));
  assert.equal(bubble.textContent, 'Keep this hint');
  assert.equal(bubble.hidden, false);
});
