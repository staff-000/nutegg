const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const { fixture } = require('./helpers/popup-fixture');
const { ResultsViewComponent } = require('../src/popup/ui/results-view');
const { MindmapComponent } = require('../src/popup/ui/mindmap');
const { VerdictComponent } = require('../src/popup/ui/verdict');
function setup(t, chrome = true) {
  const dom = new JSDOM(fs.readFileSync(require.resolve('../src/popup/popup.html'), 'utf8'));
  t.after(() => dom.window.close());
  const root = dom.window.document, ui = new ResultsViewComponent(root);
  const f = fixture();
  f.store.dispatch({ type: 'draft', tabId: 1, values: { generateKnowledgeEntries: true } });
  const token = f.store.beginOperation(1, 'analysis').token;
  f.store.commitOperation(token, { type: 'analysisRetryContext', inputs: {}, payload: { stage: 1, questions: ['Q'] } });
  f.store.commitOperation(token, { type: 'analysisComplete', stage1: true,
    result: { mode: chrome ? 'chrome' : 'obsidian', coreSummary: ['Keep this successful summary'],
      analysisFailures: [{ section: 'mindmap', code: 'timeout' }, { section: 'knowledge', code: 'network_error' }] } });
  const settings = { isChromeMode: () => chrome };
  return { ...f, dom, root, ui, settings, view: f.store.viewModel() };
}

test('failed mind map and knowledge stay visible with reasons while successful summary stays intact', t => {
  const f = setup(t);
  f.ui.renderCoreSummary(f.view.analysisResult.coreSummary);
  const mindmap = new MindmapComponent(f.root);
  mindmap.render([], true, null, true);
  mindmap.render([], true);
  assert.equal(f.root.getElementById('mindmap-section').classList.contains('hidden'), true);
  f.ui.renderSectionFailures(f.view, f.settings);
  for (const id of ['mindmap-section', 'chrome-knowledge-section']) {
    const section = f.root.getElementById(id);
    assert.equal(section.classList.contains('hidden'), false);
    assert.ok(section.querySelector('.section-header'));
    assert.ok(section.querySelector('.ai-section-failure button'));
    assert.equal(section.querySelector('button[data-analysis-retry]').dataset.tabId, '1');
  }
  assert.match(f.root.querySelector('#mindmap-section .ai-section-failure').textContent, /timed out/);
  assert.equal(f.root.querySelector('#mindmap-tree').textContent, '', 'failed output must not keep an old loading indicator');
  assert.match(f.root.querySelector('#chrome-knowledge-section .ai-section-failure').textContent, /internet connection/);
  assert.equal(f.root.querySelectorAll('#core-summary li').length, 1);
  assert.equal(f.root.querySelector('#core-summary-section .ai-section-failure'), null);
});

test('summary-call failure appears in its enabled title, summary and questions sections', t => {
  const f = setup(t), view = { ...f.view, analysisResult: { mode: 'chrome',
    analysisFailures: [{ section: 'summary', code: 'rate_limited' }] } };
  f.ui.renderCoreSummary([]);
  new VerdictComponent(f.root).renderTitleVerdict('');
  f.ui.renderSectionFailures(view, f.settings);
  for (const id of ['title-verdict-section', 'core-summary-section', 'custom-questions-section']) {
    assert.equal(f.root.getElementById(id).classList.contains('hidden'), false);
    assert.match(f.root.querySelector(`#${id} .ai-section-failure`).textContent, /Too many requests/);
  }
  assert.equal(f.root.querySelector('#mindmap-section .ai-section-failure'), null);
});

test('failed egg generation remains visible without hiding successful entries', t => {
  const f = setup(t, false), view = { ...f.view, analysisResult: { mode: 'obsidian', stage: 'stage2',
    eggResults: [{ egg: 'good.md', extractedEntries: [{ content: 'Saved insight' }], keyQuestionAnswers: [] },
      { egg: 'bad.md', analysisFailures: [{ section: 'egg', code: 'auth_failed' }], extractedEntries: [], keyQuestionAnswers: [] }] } };
  const content = f.root.getElementById('egg-knowledge-content'); content.textContent = 'Saved insight';
  f.ui.renderSectionFailures(view, f.settings);
  assert.equal(f.root.getElementById('egg-knowledge-section').classList.contains('hidden'), false);
  assert.equal(content.textContent, 'Saved insight');
  assert.match(f.root.querySelector('#egg-knowledge-section .ai-section-failure').textContent, /Authorization/);
  assert.equal(f.root.querySelector('#chrome-knowledge-section .ai-section-failure'), null);
});

test('disabled sections, cancellation and active retry do not show failed placeholders', t => {
  const f = setup(t);
  for (const view of [{ ...f.view, analysisCancelled: true }, { ...f.view, isAnalyzing: true },
    { ...f.view, generateKnowledgeEntries: false, enabledSections: { mindMap: false } }]) {
    f.ui.clearSectionFailures();
    f.ui.renderSectionFailures(view, f.settings);
    assert.equal(f.root.querySelectorAll('.ai-section-failure').length, 0);
  }
});

test('tab changes and recovery clear old notices without duplicate cards or stale visibility', t => {
  const f = setup(t);
  f.ui.renderSectionFailures(f.view, f.settings);
  f.ui.clearSectionFailures(); f.ui.renderSectionFailures(f.view, f.settings);
  assert.equal(f.root.querySelectorAll('#mindmap-section .ai-section-failure').length, 1);
  f.ui.clearSectionFailures();
  f.ui.renderSectionFailures({ ...f.view, analysisResult: { mode: 'chrome' } }, f.settings);
  assert.equal(f.root.querySelectorAll('.ai-section-failure').length, 0);
  assert.equal(f.root.getElementById('mindmap-section').classList.contains('hidden'), true);
  f.ui.renderSectionFailures({ ...f.view, busy: true }, f.settings);
  assert.equal(f.root.querySelector('#mindmap-section button[data-analysis-retry]').disabled, true);
});

test('fatal request failures use safe section reasons; genuine empty results remain empty', t => {
  const f = setup(t);
  f.ui.renderSectionFailures({ ...f.view, analysisResult: { mode: 'chrome' } }, f.settings);
  assert.equal(f.root.querySelectorAll('.ai-section-failure').length, 0);
  f.ui.renderCoreSummary(['Success']);
  f.ui.renderSectionFailures({ ...f.view, analysisResult: { mode: 'chrome', coreSummary: ['Success'] },
    errors: { analysis: { code: 'unknown', message: 'secret credential' } } }, f.settings);
  assert.ok(f.root.querySelector('#mindmap-section .ai-section-failure'));
  assert.doesNotMatch(f.root.querySelector('#mindmap-section .ai-section-failure').textContent, /secret/);
  assert.equal(f.root.querySelector('#core-summary').textContent, 'Success');
  assert.equal(f.root.querySelector('#core-summary-section .ai-section-failure'), null);
});
