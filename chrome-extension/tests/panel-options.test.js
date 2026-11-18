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

test('panel settings sit below Make it yours and show unified display control', async t => {
  const { win, root, control, change } = await setup(t);
  assert.equal(root.previousElementSibling.id, 'reading-preferences');
  const native = win.document.querySelector('.panel-position-card');
  assert.equal(native.closest('.panel-settings'), root);
  assert.equal(native.hidden, true);
  assert.equal(control('Panel display').value, 'injected-right');
  assert.equal(control('Page overlap').closest('.option-row').hidden, false);

  await change('Panel display', 'native');
  assert.equal(native.hidden, false);
  assert.equal(control('Panel opening settings').disabled, true);
  assert.equal(control('Panel opening settings').closest('.option-row').hidden, true);
  assert.equal(root.querySelector('.panel-custom-rules').hidden, true);
  assert.equal(control('Page overlap').closest('.option-row').hidden, true);
});

test('three opening presets are selected cleanly and custom rules stay visible across all presets', async t => {
  const { root, control, change, saved } = await setup(t);
  assert.equal(control('Panel opening settings').value, 'nutegg');
  assert.equal(control('Panel opening settings').options.length, 3);
  assert.equal(root.querySelector('.panel-custom-rules').hidden, false);
  for (const value of ['open', 'closed', 'nutegg']) {
    await change('Panel opening settings', value);
    assert.equal(root.querySelector('.panel-custom-rules').hidden, false);
    assert.equal(saved.at(-1).panelSettings.openingPolicy, value);
  }
});

test('unified filter/add input adds a site card and inline chip adds topic/author/channel rule', async t => {
  const { win, root, saved } = await setup(t);
  const filterInput = root.querySelector('.panel-rules-filter');
  filterInput.value = 'youtube.com';
  filterInput.dispatchEvent(new win.Event('input', { bubbles: true }));
  root.querySelector('.panel-rules-header').dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
  await flush();
  const siteCard = [...root.querySelectorAll('.panel-site-card')].find(
    c => c.querySelector('.panel-site-name')?.textContent === 'youtube.com'
  );
  assert.ok(siteCard);
  const addChipBtn = [...siteCard.querySelectorAll('.panel-chip-add')].find(
    b => b.textContent === '+ topic / author / channel'
  );
  assert.ok(addChipBtn);
  addChipBtn.click();
  const chipInput = siteCard.querySelector('.panel-chip-input');
  chipInput.value = 'Dan Koe';
  chipInput.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await flush();
  const rule = saved.at(-1).panelSettings.rules.at(-1);
  assert.equal(rule.hostname, 'youtube.com');
  assert.deepEqual(rule.topics, ['Dan Koe']);
});

test('existing generated regex rule and subdomain/sub-URL rules group into one root-domain card and master-detail switches selection', async t => {
  const { win, root, control, saved } = await setup(t, {
    ...defaults,
    openingPolicy: 'closed',
    rules: [
      { id: 'old', name: 'YouTube', website: websiteRegex('youtube.com'), action: 'allow', authors: ['Dan Koe'] },
      { id: 'sub', name: 'YouTube Shorts', website: '^https://www\\.youtube\\.com/shorts', action: 'block' },
      { id: 'zh', name: 'Zhihu', website: websiteRegex('zhihu.com'), action: 'allow', topics: ['AI'] },
    ],
  });
  // Master list has ranked items with Global on top and China on bottom; only 1 detail card renders at a time
  const navKeys = [...root.querySelectorAll('.panel-site-nav-item')].map(el => el.dataset.siteKey);
  assert.deepEqual(navKeys, ['*', 'youtube.com', 'zhihu.com']);
  assert.equal(root.querySelectorAll('.panel-site-detail .panel-site-card').length, 1);
  const ytCard = root.querySelector('.panel-site-detail .panel-site-card');
  assert.equal(ytCard.querySelector('.panel-site-name').textContent, 'youtube.com');
  assert.ok([...ytCard.querySelectorAll('.panel-topic-chip.allow')].some(c => c.textContent.includes('Dan Koe')));
  assert.ok([...ytCard.querySelectorAll('.panel-topic-chip.block')].some(c => c.textContent.includes('youtube.com/shorts')));

  // Clicking zhihu.com in the list switches the detail pane to zhihu.com with China tag
  root.querySelector('.panel-site-nav-item[data-site-key="zhihu.com"]').click();
  const zhCard = root.querySelector('.panel-site-detail .panel-site-card');
  assert.equal(zhCard.querySelector('.panel-site-name').textContent, 'zhihu.com');
  assert.equal(zhCard.querySelector('.panel-region-tag.is-china').textContent, 'China');

  // Adding a subdomain / sub-URL chip directly saves a friendly rule without editing raw regex
  const addUrlBtn = [...zhCard.querySelectorAll('.panel-chip-add')].find(b => b.textContent === '+ subdomain / URL');
  assert.ok(addUrlBtn);
  addUrlBtn.click();
  const urlInput = zhCard.querySelector('.panel-chip-input');
  urlInput.value = 'zhuanlan.zhihu.com';
  urlInput.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await flush();
  assert.ok(
    [...root.querySelectorAll('.panel-site-detail .panel-topic-chip.allow')].some(c =>
      c.textContent.includes('zhuanlan.zhihu.com')
    )
  );

  // Advanced rule composer auto-updates regex preview as user types domain or domain/path
  root.querySelector('.panel-rules-actions button.text-btn').click();
  const siteInput = control('Website hostname (blank = all)');
  siteInput.value = 'example.org';
  siteInput.dispatchEvent(new win.Event('input', { bubbles: true }));
  assert.equal(root.querySelector('.panel-website-preview').textContent, `Regex: ${websiteRegex('example.org')}`);

  // Clicking panel-rule-default-tag opens inline condition editor for contentAvailable and minMinutes
  const condTag = root.querySelector('.panel-site-detail .panel-rule-default-tag.is-editable');
  assert.ok(condTag);
  condTag.click();
  const condBar = root.querySelector('.panel-site-conditions-bar');
  assert.equal(condBar.hidden, false);
  condBar.querySelector('select').value = 'no';
  condBar.querySelector('button').click();
  await flush();
  assert.equal(saved.at(-1).panelSettings.rules.at(-1).contentAvailable, false);
});
