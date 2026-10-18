const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AnalysisActivityComponent } = require('../src/popup/ui/analysis-activity.js');
const { TabAction } = require('../src/popup/action/tab.js');
const { fixture } = require('./helpers/popup-fixture');
function element() {
  const classes = new Set(['hidden']);
  return { dataset: {}, children: [], listeners: {}, classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c) },
    addEventListener(k, fn) { this.listeners[k] = fn; }, setAttribute() {}, appendChild(child) { this.children.push(child); }, replaceChildren() { this.children = []; }, contains: () => false };
}
function root() { const elements = new Map(); return { getElementById: id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }, createElement: element, addEventListener() {} }; }
test('indicator derives window-filtered unread/running rows and handles selection', async () => {
  const { store } = fixture();
  const a = store.beginOperation(1, 'analysis'); store.commitOperation(a.token, { type: 'analysisComplete', result: { titleVerdict: 'A' } });
  store.beginOperation(2, 'analysis'); store.ensure(3); store.beginOperation(3, 'analysis');
  const ui = new AnalysisActivityComponent(root()); let selected;
  await ui.init({ manager: store, onSelect: id => { selected = id; }, tabs: { query: async () => [{ id: 1, windowId: 7 }, { id: 2, windowId: 7 }] } });
  assert.equal(ui.button.textContent, '⏳ 0 running · ⌛ 1 waiting · ✅ 1 unread');
  const rows = ui.list.children.filter(e => e.dataset.activityTab); assert.deepEqual(rows.map(e => e.dataset.activityTab), ['2', '1']);
  ui.list.listeners.click({ target: { closest: () => rows[1] } }); assert.equal(selected, 1);
  store.dispatch({ type: 'viewed', tabId: 1, revision: store.getTab(1).resultRevision }); await ui.refresh();
  assert.equal(ui.button.textContent, '⏳ 0 running · ⌛ 1 waiting · ✅ 0 unread');
});
test('activity navigation activates cached results without AI; closed tabs stay closed', async t => {
  const old = globalThis.chrome; t.after(() => { globalThis.chrome = old; });
  const { store, operations } = fixture(); const a = store.beginOperation(1, 'analysis');
  store.commitOperation(a.token, { type: 'analysisComplete', result: { titleVerdict: 'A' } }); store.activateTab(2);
  let updated; globalThis.chrome = { tabs: { update: async id => { updated = id; }, get: async id => ({ id, status: 'complete' }) } };
  const action = new TabAction({ tabStateManager: store, operations, settings: {}, envService: { checkServerStatus: async () => {} } });
  await action.openAnalysisActivity(1); assert.equal(updated, 1); assert.equal(store.activeTabId, 1); assert.equal(store.getTab(1).currentView, 'results');
  globalThis.chrome.tabs.update = async () => { throw new Error('Closed'); };
  await action.openAnalysisActivity(1); assert.equal(store.getTab(1), null);
});

test('twenty tabs show exclusive running/waiting/unread counts including zero', async () => {
  const { store } = fixture(), jobs = [];
  for (let id = 1; id <= 20; id++) { store.ensure(id); jobs.push(store.beginOperation(id, 'analysis')); }
  for (const job of jobs.slice(0, 3)) store.commitOperation(job.token, { type: 'analysisQueueState', state: 'running' });
  const ui = new AnalysisActivityComponent(root());
  await ui.init({ manager: store, onSelect() {}, tabs: { query: async () => jobs.map(job => ({ id: job.token.tabId, windowId: 7 })) } });
  assert.equal(ui.button.textContent, '⏳ 3 running · ⌛ 17 waiting · ✅ 0 unread');
  store.activateTab(10); await ui.refresh();
  assert.equal(ui.button.textContent, '⏳ 3 running · ⌛ 17 waiting · ✅ 0 unread');
  store.commitOperation(jobs[0].token, { type: 'analysisComplete', result: { titleVerdict: 'Done' } });
  store.commitOperation(jobs[3].token, { type: 'analysisQueueState', state: 'running' });
  await ui.refresh();
  assert.equal(ui.button.textContent, '⏳ 3 running · ⌛ 16 waiting · ✅ 1 unread');
  store.activateTab(1);
  store.dispatch({ type: 'viewed', tabId: 1, revision: store.getTab(1).resultRevision });
  store.invalidateTab(2, 'https://replacement.test');
  assert.equal(store.commitOperation(jobs[1].token, { type: 'analysisQueueState', state: 'running' }), false);
  for (const job of jobs.slice(2)) store.commitOperation(job.token, { type: 'operationFailed', error: 'Cancelled' });
  await ui.refresh();
  assert.equal(ui.button.textContent, '⏳ 0 running · ⌛ 0 waiting · ✅ 0 unread');
  assert.equal(ui.container.classList.contains('hidden'), false);
});

test('Stage 2 can wait again and unrelated operation kinds do not enter analysis counts', () => {
  const { store } = fixture();
  const job = store.beginOperation(1, 'analysis');
  store.beginOperation(2, 'followup'); store.ensure(3); store.beginOperation(3, 'creation');
  store.ensure(4); store.beginOperation(4, 'saving');
  store.commitOperation(job.token, { type: 'analysisQueueState', state: 'running' });
  store.commitOperation(job.token, { type: 'phase', phase: 'stage2' });
  store.commitOperation(job.token, { type: 'analysisQueueState', state: 'waiting' });
  const entries = store.getAnalysisActivity();
  assert.equal(entries.length, 1); assert.equal(entries[0].waiting, true);
  store.commitOperation(job.token, { type: 'operationFailed', error: 'Failed' });
  assert.equal(store.getAnalysisActivity().length, 0);
});
