import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

test('settings styles hide inactive rows and keep dropdown spacing without important overrides', () => {
  const css = readFileSync('styles.css', 'utf8');
  assert.doesNotMatch(css, /!important\b/i);
  for (const theme of ['theme-light', 'theme-dark']) {
    const dom = new JSDOM(`<html><head><style>${css}</style></head><body class="${theme}">
      <div class="nutegg-settings"><section class="nutegg-subscription-card">
      <div class="setting-item" hidden>inactive</div><div class="setting-item">active</div>
      <select class="dropdown"><option>Model</option></select></section></div>
      <div class="setting-item">unrelated</div></body></html>`);
    try {
      const { document, getComputedStyle } = dom.window;
      assert.equal(getComputedStyle(document.querySelector('[hidden]')!).display, 'none');
      assert.equal(getComputedStyle(document.querySelector('.setting-item:not([hidden])')!).backgroundColor, 'rgba(0, 0, 0, 0)');
      const dropdown = document.querySelector('select')!;
      assert.equal(getComputedStyle(dropdown).paddingRight, '28px');
      assert.equal(getComputedStyle(dropdown).cursor, 'pointer');
      assert.notEqual(getComputedStyle(document.body.lastElementChild!).display, 'none');
    } finally { dom.window.close(); }
  }
});
