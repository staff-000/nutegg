const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { JSDOM } = require('jsdom');

async function loadPopup(t) {
  const directory = path.dirname(require.resolve('../src/popup/popup.html'));
  const dom = new JSDOM(fs.readFileSync(path.join(directory, 'popup.html'), 'utf8'), {
    url: 'https://extension.test/src/popup/popup.html', runScripts: 'outside-only',
  });
  t.after(() => dom.window.close());
  const win = dom.window, calls = [];
  win.crypto.randomUUID = randomUUID;
  win.structuredClone = structuredClone;
  win.scrollTo = () => {};
  win.setInterval = () => 0;
  const tab = { id: 1, url: 'https://post.test', title: 'Post', windowId: 1, status: 'complete' };
  const listener = () => ({ addListener() {} });
  win.chrome = {
    storage: { local: { get: (_, callback) => callback({}), set: async () => {} }, onChanged: listener() },
    tabs: { query: async () => [tab], get: async () => tab,
      onActivated: listener(), onUpdated: listener(), onRemoved: listener() },
    runtime: { getManifest: () => ({ version: '0.2.3' }),
      sendMessage: async message => { calls.push(message); return {}; }, openOptionsPage() {} },
  };
  win.fetch = async () => { throw new Error('Offline test'); };
  // Load the actual HTML script list and entry point, including production event wiring.
  for (const script of win.document.querySelectorAll('script[src]')) {
    const filename = path.resolve(directory, script.getAttribute('src'));
    if (filename === path.join(directory, 'popup.js')) win.module = { exports: {} };
    win.eval(fs.readFileSync(filename, 'utf8'));
  }
  win.NutEggServices.PageExtractor.prototype.extractPage = async () => ({ ...tab, content: 'Body', sourceType: 'article' });
  win.NutEggServices.EnvironmentService.prototype.checkServerStatus = async () => {};
  win.NutEggServices.EnvironmentService.prototype.fetchMetrics = async () => {};
  const { initPopup, tabStateManager: store } = win.module.exports;
  await initPopup();
  const discussion = { kind: 'comments', status: 'partial', items: [{ id: 'c1', text: 'My captured experience', author: 'Alice' }] };
  const analysis = win.NutEggAI.buildDiscussionResult(discussion, [{ topics: [{ id: 't', title: 'Experience' }],
    classifications: [{ commentId: 'c1', topicId: 't', stance: 'agree' }] }]);
  const show = (result = analysis, mode = 'chrome', source = discussion) => store.dispatch({ type: 'historySelected', tabId: 1,
    entry: { result: { titleVerdict: '', coreSummary: [], ...(mode === 'chrome' ? { mode } : { stage: 'stage1', matchedEggs: [] }), discussion: result },
      capturePayload: { discussion: source, enabledSections: { discussion: true } } } });
  return { root: win.document, store, analysis, show, calls };
}

for (const mode of ['chrome', 'obsidian']) test(`full popup entry point expands and collapses original comments in ${mode} mode`, async t => {
  const f = await loadPopup(t);
  f.show(f.analysis, mode);
  const callCount = f.calls.length;
  const badge = () => f.root.querySelector('.discussion-metric');
  const panel = () => f.root.querySelector('.discussion-comments-panel');
  assert.equal(panel().classList.contains('hidden'), true);
  badge().querySelector('strong').click();
  assert.equal(panel().classList.contains('hidden'), false);
  assert.equal(panel().querySelector('blockquote').textContent, 'My captured experience');
  assert.equal(badge().getAttribute('aria-expanded'), 'true');
  badge().click();
  assert.equal(panel().classList.contains('hidden'), true);
  assert.equal(f.calls.length, callCount);
});

test('clicking a cached badge without saved groups opens an explanation instead of silently doing nothing', async t => {
  const f = await loadPopup(t);
  delete f.analysis.topics[0].commentIds;
  f.show();
  const callCount = f.calls.length;
  f.root.querySelector('.discussion-metric').click();
  const panel = f.root.querySelector('.discussion-comments-panel');
  assert.equal(panel.classList.contains('hidden'), false);
  assert.match(panel.textContent, /no saved comment groups/);
  assert.equal(panel.querySelector('blockquote'), null);
  assert.equal(f.calls.length, callCount);
});

test('a badge with missing source text opens an unavailable notice without making requests', async t => {
  const f = await loadPopup(t);
  f.show(f.analysis, 'obsidian', { kind: 'comments', status: 'partial', items: [] });
  const callCount = f.calls.length;
  f.root.querySelector('.discussion-metric').click();
  const panel = f.root.querySelector('.discussion-comments-panel');
  assert.equal(panel.classList.contains('hidden'), false);
  assert.match(panel.textContent, /Original text unavailable for 1 comments/);
  assert.equal(f.calls.length, callCount);
});
