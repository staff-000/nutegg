const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const { defaults, websiteRegex } = require('../src/panel/rules');
const flush = () => new Promise(resolve => setImmediate(resolve));
async function setup(t, settings = defaults) {
  const html = fs.readFileSync(require.resolve('../src/options/options.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'https://extension.test/settings', runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const win = dom.window,
    saved = [];
  win.chrome = {
    runtime: { sendMessage: async () => ({ settings: structuredClone(settings) }) },
    storage: { local: { set: async data => saved.push(structuredClone(data)) }, session: { get: async () => ({}) } },
  };
  for (const file of ['i18n.js', 'panel/rules.js', 'panel/options.js'])
    win.eval(fs.readFileSync(require.resolve('../src/' + file), 'utf8'));
  await flush();
  const root = win.document.querySelector('.panel-settings');
  const control = label => [...root.querySelectorAll('label')].find(el => el.textContent === label).control;
  const change = async (label, value) => {
    control(label).value = value;
    control(label).dispatchEvent(new win.Event('change', { bubbles: true }));
    await flush();
  };
  return { win, root, control, change, saved };
}

test('panel settings sit between Connect your AI and UI Density and show unified display control', async t => {
  const { win, root, control, change } = await setup(t);
  assert.equal(root.previousElementSibling.className, 'setup-card');
  assert.equal(root.nextElementSibling.id, 'ui-density-card');
  const native = win.document.querySelector('.panel-position-card');
  assert.equal(native.closest('.panel-settings'), root);
  assert.equal(native.hidden, true);
  assert.equal(control('Panel display').value, 'injected-right');
  assert.equal(control('Page overlap').closest('.option-row').hidden, false);

  await change('Panel display', 'native');
  assert.equal(native.hidden, false);
  assert.equal(control('Panel opening settings').disabled, true);
  assert.equal(control('Panel opening settings').closest('.option-row').hidden, true);
  assert.equal(root.querySelector('.panel-rules-box').hidden, true);
  assert.equal(control('Page overlap').closest('.option-row').hidden, true);
});

test('three opening presets are selected cleanly and custom rules stay visible across all presets', async t => {
  const { root, control, change, saved } = await setup(t);
  assert.equal(control('Panel opening settings').value, 'nutegg');
  assert.equal(control('Panel opening settings').options.length, 3);
  assert.equal(root.querySelector('.panel-rules-box').hidden, false);
  for (const value of ['open', 'closed', 'nutegg']) {
    await change('Panel opening settings', value);
    assert.equal(root.querySelector('.panel-rules-box').hidden, false);
    assert.equal(saved.at(-1).panelSettings.openingPolicy, value);
  }
});

test('Dan Koe example populates the 3-field composer with More conditions collapsed', async t => {
  const { root, control, saved } = await setup(t);
  const count = saved.length;
  const tryBtn = [...root.querySelectorAll('.panel-rules-actions button')].find(b => b.textContent === 'Try this example');
  tryBtn.click();
  assert.equal(root.querySelector('.panel-rule-editor').hidden, false);
  assert.equal(control('Website hostname (blank = all)').value, 'youtube.com');
  assert.equal(control('Topics').value, 'Dan Koe');
  assert.equal(control('Action').value, 'allow');
  assert.equal(root.querySelector('.panel-advanced-matching').open, false);
  assert.equal(saved.length, count);

  const save = [...root.querySelectorAll('.panel-composer-footer button')].find(el => el.textContent === 'Save');
  save.click();
  await flush();
  const rule = saved.at(-1).panelSettings.rules.at(-1);
  assert.equal(rule.hostname, 'youtube.com');
  assert.deepEqual(rule.topics, ['Dan Koe']);
  assert.equal(rule.authors, undefined);
});

test('editing an existing generated regex restores its friendly hostname and migrated topics', async t => {
  const { root, control } = await setup(t, {
    ...defaults,
    openingPolicy: 'closed',
    rules: [
      { id: 'old', name: 'YouTube', website: websiteRegex('youtube.com'), action: 'allow', authors: ['Dan Koe'] },
    ],
  });
  [...root.querySelectorAll('.panel-rule-row button')].find(el => el.textContent === 'Edit').click();
  assert.equal(control('Website hostname (blank = all)').value, 'youtube.com');
  assert.equal(control('Topics').value, 'Dan Koe');
});
