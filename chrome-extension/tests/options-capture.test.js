const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const flush = () => new Promise(resolve => setImmediate(resolve));

test('capture settings load, validate, and persist retry count and delay in milliseconds', async t => {
  const html = fs.readFileSync(require.resolve('../src/options/options.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'https://extension.test/options', runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const win = dom.window, values = { captureRetryCount: 5, captureRetryDelayMs: 2500 };
  win.chrome = { storage: { local: { get: async () => ({ ...values }), set: async data => Object.assign(values, data) } },
    runtime: { sendMessage: async () => ({}), getManifest: () => ({}) } };
  win.fetch = async () => { throw new Error('Offline'); };
  for (const file of ['i18n', 'popup/state/settings-state', 'options/options']) {
    win.eval(fs.readFileSync(require.resolve(`../src/${file}.js`), 'utf8'));
  }
  await flush();
  const count = win.document.getElementById('capture-retry-count');
  const delay = win.document.getElementById('capture-retry-delay');
  const save = win.document.getElementById('capture-retry-save');
  assert.equal(count.value, '5'); assert.equal(delay.value, '2.5');
  count.value = '0'; delay.value = '1.5'; save.click(); await flush();
  assert.equal(values.captureRetryCount, 0); assert.equal(values.captureRetryDelayMs, 1500);
  count.value = '2.5'; save.click(); await flush();
  assert.equal(values.captureRetryCount, 0);
  count.value = '3'; delay.value = ''; save.click(); await flush();
  assert.equal(values.captureRetryDelayMs, 1500);
});
