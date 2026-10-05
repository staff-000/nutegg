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
  assert.equal(ui.button.textContent, '⏳ 1 running · ✅ 1 unread');
  const rows = ui.list.children.filter(e => e.dataset.activityTab); assert.deepEqual(rows.map(e => e.dataset.activityTab), ['1', '2']);
  ui.list.listeners.click({ target: { closest: () => rows[0] } }); assert.equal(selected, 1);
  store.dispatch({ type: 'viewed', tabId: 1, revision: store.getTab(1).resultRevision }); await ui.refresh();
  assert.equal(ui.button.textContent, '⏳ 1 running');
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
