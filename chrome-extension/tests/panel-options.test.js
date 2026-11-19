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
  win.structuredClone = structuredClone;
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

test('four opening modes preserve the selected preset and expose a customized rules choice', async t => {
  const { root, control, change, saved } = await setup(t);
  assert.equal(control('Panel opening settings').value, 'nutegg');
  assert.equal(control('Panel opening settings').options.length, 4);
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
    openingPolicy: 'custom',
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

  // Inline conditions retain feed/listing control while retired content controls stay absent
  const condTag = root.querySelector('.panel-site-detail .panel-rule-default-tag.is-editable');
  assert.ok(condTag);
  condTag.click();
  const condBar = root.querySelector('.panel-site-conditions-bar');
  assert.equal(condBar.hidden, false);
  assert.equal(condBar.querySelector('select'), null);
  assert.equal(condBar.querySelector('input[type=number]'), null);
  condBar.querySelector('button').click();
  await flush();
  assert.equal(saved.at(-1).panelSettings.rules.at(-1).contentAvailable, undefined);
});


test('retired content controls stay hidden and inline edits preserve saved conditions', async t => {
  const legacy = { id: 'yt', hostname: 'youtube.com', website: websiteRegex('youtube.com'),
    name: 'YouTube', action: 'allow', minMinutes: 3, maxMinutes: 10, contentAvailable: false };
  const { root, saved } = await setup(t, { ...defaults, openingPolicy: 'custom', rules: [legacy] });
  assert.equal(root.querySelector('.panel-advanced-matching input[type=number]'), null);
  const tag = root.querySelector('.panel-site-detail .panel-rule-default-tag.is-editable');
  assert.ok(!tag.textContent.includes('min'));
  tag.click();
  const bar = root.querySelector('.panel-site-conditions-bar');
  assert.equal(bar.querySelector('input[type=number]'), null);
  assert.equal(bar.querySelector('select'), null);
  bar.querySelector('input[type=checkbox]').checked = false;
  bar.querySelector('button').click();
  await flush();
  const updated = saved.at(-1).panelSettings.rules.find(r => r.id === legacy.id);
  assert.equal(updated.minMinutes, 3);
  assert.equal(updated.maxMinutes, 10);
  assert.equal(updated.contentAvailable, false);
});


test('editing each built-in copies its rules and entering custom again replaces the previous custom copy', async t => {
  for (const policy of ['nutegg', 'open', 'closed']) {
    const { win, root, control, change, saved } = await setup(t, { ...defaults, openingPolicy: policy });
    const filter = root.querySelector('.panel-rules-filter');
    filter.value = 'example.org';
    filter.dispatchEvent(new win.Event('input', { bubbles: true }));
    root.querySelector('.panel-rules-header').dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
    await flush();
    assert.equal(control('Panel opening settings').value, 'custom');
    const custom = saved.at(-1).panelSettings;
    assert.equal(custom.openingPolicy, 'custom');
    assert.equal(custom.defaultOpen, policy === 'open');
    assert.ok(custom.rules.some(r => r.hostname === 'example.org'));
    if (policy === 'nutegg') assert.ok(custom.rules.some(r => r.hostname === 'youtube.com'));
    const customRules = structuredClone(custom.rules);
    await change('Panel opening settings', 'nutegg');
    assert.equal(root.querySelector('.panel-site-nav-item[data-site-key="example.org"]'), null);
    await change('Panel opening settings', 'closed');
    assert.deepEqual(saved.at(-1).panelSettings.rules, customRules);
    await change('Panel opening settings', 'custom');
    assert.equal(root.querySelector('.panel-site-nav-item[data-site-key="example.org"]'), null);
    assert.deepEqual(saved.at(-1).panelSettings.rules, []);
    assert.equal(saved.at(-1).panelSettings.defaultOpen, false);
  }
});


test('custom selection replaces existing edits with the current preset and custom-only changes keep them', async t => {
  for (const policy of ['nutegg', 'open', 'closed']) {
    const previousRule = { id: 'old-custom', website: websiteRegex('old.example'), action: 'block' };
    const { root, change, saved } = await setup(t, {
      ...defaults, openingPolicy: policy, customRulesInitialized: true, rules: [previousRule],
    });
    await change('Panel opening settings', 'custom');
    const custom = saved.at(-1).panelSettings;
    assert.equal(custom.rules.some(r => r.id === previousRule.id), false);
    assert.equal(custom.defaultOpen, policy === 'open');
    assert.equal(custom.rules.length, policy === 'nutegg' ? require('../src/panel/rules').defaultRules.length : 0);
    if (policy === 'nutegg') assert.ok(root.querySelector('.panel-site-nav-item[data-site-key="youtube.com"]'));
    const copied = structuredClone(custom.rules);
    await change('Page overlap', 'push');
    assert.deepEqual(saved.at(-1).panelSettings.rules, copied);
  }
});


test('deleting one Bilibili default path copies every other default URL into custom view', async t => {
  const Rules = require('../src/panel/rules');
  const { root, control, saved, change } = await setup(t);
  const snapshot = () => {
    const sites = [...root.querySelectorAll('.panel-site-nav-item')].map(e => e.dataset.siteKey).filter(k => k !== '*');
    const result = {};
    for (const site of sites) {
      root.querySelector(`.panel-site-nav-item[data-site-key="${site}"]`).click();
      result[site] = [...root.querySelectorAll('.panel-site-detail .panel-site-subsection:first-child .panel-topic-chip.allow > span')]
        .map(e => e.textContent);
    }
    return result;
  };
  const before = snapshot();
  root.querySelector('.panel-site-nav-item[data-site-key="bilibili.com"]').click();
  const remove = [...root.querySelectorAll('.panel-site-detail .panel-chip-remove')]
    .find(e => e.getAttribute('aria-label') === 'Delete /read/*');
  assert.ok(remove);
  remove.click();
  await flush();
  assert.equal(control('Panel opening settings').value, 'custom');
  const closedLabels = [...root.querySelectorAll('.panel-site-detail .panel-topic-chip.block > span')].map(e => e.textContent);
  assert.deepEqual(closedLabels, ['bilibili.com/read/*']);
  const after = snapshot();
  assert.deepEqual(after, {
    ...before,
    'bilibili.com': before['bilibili.com'].filter(label => label !== 'bilibili.com/read/*'),
  });
  const custom = saved.at(-1).panelSettings;
  assert.equal(custom.rules.filter(r => r._starter).length, Rules.defaultRules.length);
  assert.equal(Rules.decide(custom, { url: 'https://www.bilibili.com/read/cv123' }).open, false);
  assert.equal(Rules.decide(custom, { url: 'https://www.bilibili.com/video/BV123/' }).open, true);
  // Selecting the original preset still restores its complete path list.
  await change('Panel opening settings', 'nutegg');
  assert.deepEqual(snapshot(), before);
});

test('social video condition is visible, copies into custom, and can be disabled without changing defaults', async t => {
  const {root,win,control,saved,change}=await setup(t);
  root.querySelector('.panel-site-nav-item[data-site-key="tiktok.com"]').click();
  assert.match(root.querySelector('.panel-default-tag-text').textContent,/Video longer than 3 minutes/);
  root.querySelector('.panel-rule-default-tag').click();
  const bar=root.querySelector('.panel-site-conditions-bar');
  const checkbox=[...bar.querySelectorAll('label')].find(e=>e.textContent==='Video longer than 3 minutes').querySelector('input');
  assert.equal(checkbox.checked,true);
  checkbox.checked=false;
  bar.querySelector('button').click();await flush();
  assert.equal(control('Panel opening settings').value,'custom');
  const settings=saved.at(-1).panelSettings;
  const Rules=require('../src/panel/rules');
  assert.equal(Rules.decide(settings,{url:'https://tiktok.com/@alice/video/123',mediaKind:'video',videoDurationSeconds:10}).open,true);
  await change('Panel opening settings','nutegg');
  assert.equal(Rules.decide(saved.at(-1).panelSettings,{url:'https://tiktok.com/@alice/video/123',mediaKind:'video',videoDurationSeconds:10}).open,false);
});
