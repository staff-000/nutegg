const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixture, seed } = require('./helpers/popup-fixture');
const { createMockRoot } = require('./helpers/mock-dom');
const { SettingsState } = require('../src/popup/state/settings-state.js');
const { PopupRenderer } = require('../src/popup/ui/popup-renderer.js');
const { TabAction } = require('../src/popup/action/tab.js');
const { AnalyzeAction } = require('../src/popup/action/analyze.js');
const { InteractionAction } = require('../src/popup/action/interaction.js');
for (const file of ['header', 'banners', 'capture-view', 'section-chips', 'verdict', 'action-controls', 'results-view', 'metrics', 'mindmap', 'discussion', 'qa', 'eggs']) require(`../src/popup/ui/${file}.js`);
function setup(t) {
  const f = fixture(); const root = createMockRoot(); root.querySelectorAll = () => [];
  const original = globalThis.document; globalThis.document = root; t.after(() => { globalThis.document = original; });
  const settings = new SettingsState(); settings.setConnectionMode('obsidian', false); settings.serverOnline = true; settings.obsidianAiConfigured = true; settings.analysisMode = 'preview';
  const ui = Object.fromEntries([['headerUI', 'HeaderComponent'], ['bannersUI', 'BannersComponent'], ['captureUI', 'CaptureViewComponent'], ['sectionsUI', 'SectionChipsComponent'], ['verdictUI', 'VerdictComponent'], ['actionsUI', 'ActionControlsComponent'], ['resultsUI', 'ResultsViewComponent'], ['metricsUI', 'MetricsComponent'], ['mindmapUI', 'MindmapComponent'], ['discussionUI', 'DiscussionComponent'], ['qaUI', 'QaComponent'], ['eggsUI', 'EggsComponent']].map(([key, type]) => [key, new globalThis.NutEggUI[type](root)]));
  const renderer = new PopupRenderer({ store: f.store, settings, ui, root });
  f.store.subscribe(event => renderer.handle(event)); renderer.render();
  const deps = { tabStateManager: f.store, operations: f.operations, settings, ui, envService: { checkServerStatus: async () => {} } };
  return { ...f, root, ui, renderer, settings, analyze: new AnalyzeAction(deps), tab: new TabAction(deps) };
}
const response = id => ({ titleVerdict: `Result ${id}`, coreSummary: [`Summary ${id}`], matchedEggs: [] });

test('discussion originals expand locally, stay isolated across tabs and reset with history', context => {
  const f = setup(context), core = globalThis.NutEggAI;
  const discussion = { kind: 'comments', status: 'partial', items: [{ id: 'original', text: 'Saved comment experience' }] };
  const result = core.buildDiscussionResult(discussion, [{ topics: [{ id: 't', title: 'Experience' }],
    classifications: [{ topicId: 't', commentId: 'original', stance: 'agree' }] }]);
  const entry = { title: 'Post', url: 'https://tab1.test', content: 'Body', result: { ...response(1), discussion: result },
    capturePayload: { discussion, enabledSections: { discussion: true } } };
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry });
  const action = new InteractionAction({ tabStateManager: f.store });
  const html = () => f.root.getElementById('discussion-result').innerHTML;
  assert.doesNotMatch(html(), /Saved comment experience/);
  action.toggleDiscussionComments('topic-1', 'agree');
  assert.match(html(), /Saved comment experience/);
  f.store.activateTab(2);
  assert.doesNotMatch(html(), /Saved comment experience/);
  f.store.activateTab(1);
  assert.match(html(), /Saved comment experience/);
  action.toggleDiscussionComments('topic-1', 'agree');
  assert.doesNotMatch(html(), /Saved comment experience/);
  action.toggleDiscussionComments('topic-1', 'agree');
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry });
  assert.doesNotMatch(html(), /Saved comment experience/);
  assert.equal(f.calls.length, 0);
});

test('caption retry progress switches with its tab and clears after the final capture', context => {
  const f = setup(context);
  const job = f.store.beginOperation(1, 'extraction');
  f.store.commitOperation(job.token, { type: 'captureProgress', progress: { captions: true, attempt: 1, retryCount: 3 } });
  assert.match(f.ui.captureUI.contentPreview.textContent, /Waiting for captions.*Retry 1 of 3/);
  assert.equal(f.ui.captureUI.contentPreview.classList.contains('incomplete'), false);
  f.store.activateTab(2);
  assert.doesNotMatch(f.ui.captureUI.contentPreview.textContent, /Waiting for captions/);
  f.store.commitOperation(job.token, { type: 'captureProgress', progress: { captions: true, attempt: 2, retryCount: 3 } });
  assert.doesNotMatch(f.ui.captureUI.contentPreview.textContent, /Waiting for captions/);
  f.store.activateTab(1);
  assert.match(f.ui.captureUI.contentPreview.textContent, /Retry 2 of 3/);
  f.store.commitOperation(job.token, { type: 'extracted', content: { url: 'https://tab1.test', content: 'Full transcript', transcriptAvailable: true } });
  assert.match(f.ui.captureUI.contentPreview.textContent, /Full transcript$/);
  assert.doesNotMatch(f.ui.captureUI.contentPreview.textContent, /Waiting for captions|Retry/);
});

test('dynamic content still loading after retries warns even with a long page body', context => {
  const f = setup(context);
  const content = { url: 'https://tab1.test', content: 'word '.repeat(500), extractionStatus: 'not_ready' };
  let job = f.store.beginOperation(1, 'extraction');
  f.store.commitOperation(job.token, { type: 'extracted', content, warning: globalThis.NutEggHelpers.getExtractionWarning(content) });
  assert.match(f.ui.bannersUI.warningMessage.textContent, /still be loading/);
  assert.match(f.ui.captureUI.contentPreview.textContent, /still be loading/);
  job = f.store.beginOperation(1, 'extraction');
  f.store.commitOperation(job.token, { type: 'extracted', content: { ...content, extractionStatus: 'ready' } });
  assert.doesNotMatch(f.ui.captureUI.contentPreview.textContent, /still be loading/);
  assert.equal(f.ui.bannersUI.warningBanner.classList.contains('hidden'), true);
});

test('loaded forum answers clear the short-question warning and remain isolated across tabs', context => {
  const f = setup(context);
  const content = { url: 'https://www.zhihu.com/question/60003550', sourceType: 'zhihu',
    content: '这是一个很短的问题只有十四字', discussion: { kind: 'forum', items: [] } };
  let job = f.store.beginOperation(1, 'extraction');
  f.store.commitOperation(job.token, { type: 'extracted', content, warning: globalThis.NutEggHelpers.getExtractionWarning(content) });
  assert.match(f.ui.bannersUI.warningMessage.textContent, /Only 14 words/);
  job = f.store.beginOperation(1, 'discussion');
  f.store.commitOperation(job.token, { type: 'discussionUpdated', passive: true, discussion: {
    kind: 'forum', status: 'partial', items: [{ id: 'answer1', text: '这是已加载的完整回答。'.repeat(40) }],
  } });
  assert.equal(f.store.getTab(1).warning, null);
  assert.equal(f.ui.captureUI.pageWordCountEl.textContent, '📝 414 words');
  assert.equal(f.ui.bannersUI.warningBanner.classList.contains('hidden'), true);
  assert.equal(f.ui.captureUI.previewRefreshBtn.classList.contains('hidden'), true);
  f.store.activateTab(2);
  assert.doesNotMatch(f.ui.captureUI.pageWordCountEl.textContent, /414/);
  f.store.activateTab(1);
  assert.equal(f.ui.captureUI.pageWordCountEl.textContent, '📝 414 words');
  assert.equal(f.ui.bannersUI.warningBanner.classList.contains('hidden'), true);
});

test('comment usernames update as they load and stay with their own browser tab', context => {
  const f = setup(context);
  const update = author => {
    const job = f.store.beginOperation(1, 'discussion');
    f.store.commitOperation(job.token, { type: 'discussionUpdated', passive: true, discussion: {
      status: 'partial', items: [{ id: 'c1', author, text: 'Comment experience' }],
    } });
  };
  update(undefined);
  assert.match(f.ui.captureUI.contentPreview.textContent, /👤 Unknown user\nComment experience/);
  update('Alice');
  assert.match(f.ui.captureUI.contentPreview.textContent, /👤 Alice\nComment experience/);
  assert.ok(!f.ui.captureUI.contentPreview.textContent.includes('Unknown user'));
  f.store.activateTab(2);
  update('Alice Updated');
  assert.ok(!f.ui.captureUI.contentPreview.textContent.includes('Alice'));
  f.store.activateTab(1);
  assert.match(f.ui.captureUI.contentPreview.textContent, /👤 Alice Updated\nComment experience/);
});

test('missing-transcript notices appear in the warning and preview, survive tab switches, and clear on recovery', async context => {
  const f = setup(context);
  const body = 'page text '.repeat(250);
  f.extractor.extractPage = async () => ({ title: 'Video', url: 'https://tab1.test', sourceType: 'youtube',
    content: body, transcriptAvailable: false });
  await f.operations.extract(1);
  assert.match(f.ui.bannersUI.warningMessage.textContent, /Could not fetch the video transcript/);
  assert.match(f.ui.captureUI.contentPreview.textContent, /^⚠️ Transcript not loaded/);
  assert.equal(f.ui.bannersUI.warningBanner.classList.contains('hidden'), false);
  assert.equal(f.ui.captureUI.contentPreview.classList.contains('incomplete'), true);
  f.ui.captureUI.contentPreview.scrollTop = 100;

  f.store.activateTab(2);
  assert.ok(!f.ui.captureUI.contentPreview.textContent.includes('video transcript'));
  f.store.activateTab(1);
  assert.match(f.ui.captureUI.contentPreview.textContent, /Transcript not loaded/);
  assert.equal(f.ui.captureUI.contentPreview.scrollTop, 0);

  // The same text with a corrected transcript flag must invalidate the renderer cache.
  f.extractor.extractPage = async () => ({ title: 'Video', url: 'https://tab1.test', sourceType: 'youtube',
    content: body, transcriptAvailable: true });
  await f.operations.extract(1);
  assert.equal(f.ui.captureUI.contentPreview.textContent, body);
  assert.equal(f.ui.captureUI.contentPreview.classList.contains('incomplete'), false);
  assert.equal(f.ui.bannersUI.warningBanner.classList.contains('hidden'), true);
});

test('history restores extraction notices from its own capture rather than the previous page text', context => {
  const f = setup(context);
  const body = 'description '.repeat(250);
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry: {
    result: response(1), title: 'Video', url: 'https://tab1.test', sourceType: 'youtube', content: body,
    capturePayload: { sourceType: 'youtube', transcriptAvailable: false, content: body },
  } });
  assert.match(f.ui.bannersUI.warningMessage.textContent, /Could not fetch the video transcript/);
  assert.match(f.ui.captureUI.contentPreview.textContent, /Transcript not loaded/);
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry: {
    result: response(1), title: 'Article', url: 'https://tab1.test', sourceType: 'article', content: body,
  } });
  assert.equal(f.ui.bannersUI.warningBanner.classList.contains('hidden'), true);
  assert.equal(f.ui.captureUI.contentPreview.textContent, body);
});
test('debug panel restores only the active tab counters and clears on navigation', context => {
  const f = setup(context);
  f.settings.debugInfo = true;
  const update = (tabId, calls) => f.store.dispatch({ type: 'debugInfo', tabId,
    debugScope: f.store.getTab(tabId).debugScope,
    value: { mode: 'obsidian', activeCalls: 1, totalCalls: calls, promptWords: calls * 10, lastPromptWords: 10 } });
  const panel = f.root.getElementById('debug-info');
  update(1, 9); update(2, 2);
  assert.match(panel.textContent, /9 calls total/);
  f.store.activateTab(2); assert.match(panel.textContent, /2 calls total/);
  update(1, 10); assert.match(panel.textContent, /2 calls total/);
  f.store.activateTab(1); assert.match(panel.textContent, /10 calls total/);
  f.store.invalidateTab(1, 'https://new.test'); assert.match(panel.textContent, /unavailable/);
});
for (const order of [[0, 1], [1, 0]]) test(`actual shared DOM shows results for both concurrent tabs in order ${order}`, async context => {
  const f = setup(context); const a = f.analyze.handleAnalyze(); f.store.activateTab(2); const b = f.analyze.handleAnalyze(); f.store.activateTab(1);
  assert.equal(f.ui.resultsUI.captureState.classList.contains('hidden'), false);
  assert.equal(f.ui.actionsUI.analyzeBtn.classList.contains('inactive'), true);
  f.calls[order[0]].resolve(response(order[0] + 1)); await new Promise(resolve => setImmediate(resolve));
  f.calls[order[1]].resolve(response(order[1] + 1)); await Promise.all([a, b]);
  for (const id of [1, 2, 1]) {
    f.store.activateTab(id);
    assert.equal(f.ui.resultsUI.resultsState.classList.contains('hidden'), false);
    assert.equal(f.ui.resultsUI.captureState.classList.contains('hidden'), true);
    assert.equal(f.ui.verdictUI.verdictAnswer.textContent, `Result ${id}`);
    assert.equal(f.ui.actionsUI.analyzeBtn.disabled, false);
    assert.equal(f.ui.actionsUI.analyzeBtn.classList.contains('inactive'), false);
    assert.equal(f.ui.actionsUI.reanalyzeBtn.classList.contains('inactive'), false);
  }
});
test('Stage 2 loading resets every button dimension on B; background A cleanup leaves B busy', async context => {
  const f = setup(context);
  for (const id of [1, 2]) seed(f.store, id, { stage: 'stage1', matchedEggs: ['a.md'] });
  const a = f.analyze.handleReanalyzeEggs();
  assert.equal(f.ui.actionsUI.stage1ProceedBtn.disabled, true);
  assert.equal(f.ui.actionsUI.eggAnalysisLabel.textContent, t('analyzingEggs'));
  assert.equal(f.ui.eggsUI.createEggBtn.disabled, true);
  assert.equal(f.ui.eggsUI.createEggBtn.textContent, t('createEggBtn'));
  f.store.activateTab(2);
  assert.equal(f.ui.actionsUI.stage1ProceedBtn.disabled, false);
  assert.equal(f.ui.actionsUI.eggAnalysisOnlyBtn.disabled, false);
  assert.equal(f.ui.actionsUI.eggAnalysisWithKnowledgeBtn.disabled, false);
  assert.equal(f.ui.actionsUI.eggAnalysisLabel.textContent, t('eggAnalysis'));
  const b = f.analyze.handleReanalyzeEggs();
  f.calls[0].resolve({ eggResults: [{ egg: 'a.md', extractedEntries: [] }] }); await a;
  assert.equal(f.ui.actionsUI.stage1ProceedBtn.disabled, true);
  assert.equal(f.ui.actionsUI.eggAnalysisLabel.textContent, t('analyzingEggs'));
  f.calls[1].resolve({ eggResults: [{ egg: 'a.md', extractedEntries: [{ content: 'Useful knowledge' }] }] }); await b;
  assert.equal(f.ui.actionsUI.stage1ProceedBtn.disabled, false);
  assert.equal(f.ui.actionsUI.eggAnalysisOnlyBtn.disabled, false);
  assert.equal(f.store.viewModel().isStage1(), false);
  assert.equal(f.ui.actionsUI.confirmBtn.classList.contains('hidden'), false);
  assert.equal(f.ui.actionsUI.confirmBtn.disabled, false);
  assert.equal(f.ui.eggsUI.eggKnowledgeSection.classList.contains('hidden'), false);
  assert(f.ui.eggsUI.eggKnowledgeContent.innerHTML.includes('Useful knowledge'));
});
test('fresh and cached question-only Stage 2 results show knowledge and can be hatched', async context => {
  const f = setup(context); seed(f.store, 1, { stage: 'stage1', matchedEggs: ['ama.md'] });
  const job = f.analyze.handleReanalyzeEggs();
  f.calls[0].resolve({ eggResults: [{ egg: 'ama.md', extractedEntries: [], keyQuestionAnswers: [
    { question: 'Key question?', answer: 'Important answer.', answered: true },
  ] }] }); await job;
  const assertHatchable = () => {
    assert.equal(f.store.getTab(1).analysisResult.stage, 'stage2');
    assert.equal(f.ui.actionsUI.confirmBtn.classList.contains('hidden'), false);
    assert.equal(f.ui.actionsUI.confirmBtn.disabled, false);
    assert.equal(f.ui.actionsUI.confirmBtn.title, t("buttonHatchHint"));
    assert.equal(f.ui.eggsUI.eggKnowledgeSection.classList.contains('hidden'), false);
    assert(f.ui.eggsUI.eggKnowledgeContent.innerHTML.includes('Important answer.'));
  };
  assertHatchable();
  await f.analyze.handleReanalyzeEggs();
  assert.equal(f.calls.length, 1); assertHatchable();
  assert.equal(f.ui.bannersUI.successBanner.classList.contains('hidden'), false);
  assert.equal(f.ui.bannersUI.successMessage.textContent, t('cachedEggAnalysisShown'));
  let saved;
  f.service.sendMessage = async message => { saved = message.payload; return { success: true }; };
  await f.operations.save(1, true);
  assert.equal(saved.newKnowledge.length, 1);
  assert(saved.newKnowledge[0].content.includes('Important answer.'));
  assert.equal(f.ui.actionsUI.confirmBtn.disabled, true);
});
test('Hatch stays visible but disabled when Stage 2 has no saveable knowledge', async context => {
  const f = setup(context); seed(f.store, 1, { stage: 'stage1', matchedEggs: ['a.md'] });
  const job = f.analyze.handleReanalyzeEggs();
  f.calls[0].resolve({ eggResults: [{ egg: 'a.md', extractedEntries: [], keyQuestionAnswers: [
    { question: 'Unanswered?', answer: 'Not addressed in this content', answered: false },
  ] }] }); await job;
  assert.equal(f.ui.actionsUI.confirmBtn.classList.contains('hidden'), false);
  assert.equal(f.ui.actionsUI.confirmBtn.disabled, true);
  assert.equal(f.ui.actionsUI.confirmBtn.title, t('noNewKnowledgeToAdd'));
  assert.equal(f.ui.actionsUI.confirmBtnWrap.title, t('noNewKnowledgeToAdd'));
  assert.equal(f.ui.actionsUI.confirmBtnWrap.classList.contains('hidden'), false);
});
test('Hatch hover explains each running operation, saved results, and clears across tabs', context => {
  const f = setup(context);
  const result = { stage: 'stage2', matchedEggs: ['a.md'], eggResults: [{ egg: 'a.md' }], newKnowledge: [{ egg: 'a.md', content: 'Insight' }] };
  seed(f.store, 1, result); seed(f.store, 2, result);
  for (const [kind, inputs, phase, label] of [
    ['analysis', {}, 'stage2', 'analyzingEggs'], ['saving', { hatch: true }, null, 'hatching'],
    ['saving', { hatch: false }, null, 'collecting'], ['followup', {}, null, 'askingBtn'], ['creation', {}, null, 'creatingEgg'],
  ]) {
    const ctx = f.store.beginOperation(1, kind, inputs);
    if (phase) f.store.commitOperation(ctx.token, { type: 'phase', phase });
    assert.equal(f.ui.actionsUI.confirmBtn.disabled, true);
    assert.equal(f.ui.actionsUI.confirmBtnWrap.title, t('hatchWaitForOperation', { operation: t(label) }));
    f.store.activateTab(2);
    assert.equal(f.ui.actionsUI.confirmBtn.disabled, false); assert.equal(f.ui.actionsUI.confirmBtnWrap.title, t("buttonHatchHint"));
    f.store.activateTab(1); f.store.commitOperation(ctx.token, { type: 'operationFinished' });
  }
  const save = f.store.beginOperation(1, 'saving', { hatch: true });
  f.store.commitOperation(save.token, { type: 'saved', hatch: true, message: 'Saved' });
  assert.equal(f.ui.actionsUI.confirmBtnWrap.title, t('hatchAlreadySaved'));
  f.store.activateTab(2);
  assert.equal(f.ui.actionsUI.confirmBtnWrap.title, t("buttonHatchHint")); assert.equal(f.ui.actionsUI.confirmBtn.title, t("buttonHatchHint"));
  seed(f.store, 2, { stage: 'stage1' });
  assert.equal(f.ui.actionsUI.confirmBtnWrap.classList.contains('hidden'), true);
});
test('restoring content clears the obsolete extraction banner and allows Egg Analysis', async context => {
  const f = setup(context); f.store.invalidateTab(1, 'https://tab1.test');
  f.extractor.extractPage = async () => null;
  await f.operations.extract(1);
  assert.equal(f.ui.bannersUI.errorMessage.textContent, t('couldNotExtractContent'));
  f.store.dispatch({ type: 'historySelected', tabId: 1, entry: { nutId: 1, title: 'Restored', content: 'Restored fetched content',
    result: { stage: 'stage1', matchedEggs: ['a.md'] } } });
  assert.equal(f.ui.bannersUI.errorBanner.classList.contains('hidden'), true);
  const job = f.analyze.handleEggAnalysis(true);
  assert.equal(f.calls[0].payload.content, 'Restored fetched content');
  f.calls[0].resolve({ mode: 'obsidian', eggResults: [{ egg: 'a.md', extractedEntries: [{ content: 'Insight' }] }] }); await job;
  assert.equal(f.ui.bannersUI.errorBanner.classList.contains('hidden'), true);
  assert.equal(f.ui.actionsUI.confirmBtn.classList.contains('hidden'), false);
});
test('background commits never render active content; preferences and input values remain isolated', async context => {
  const f = setup(context); let renders = 0; const render = f.renderer.render.bind(f.renderer); f.renderer.render = () => { renders++; render(); };
  f.store.dispatch({ type: 'draft', tabId: 1, values: { customQuestions: 'Draft A', generateKnowledgeEntries: false } });
  const job = f.analyze.handleAnalyze(); f.store.activateTab(2);
  f.store.dispatch({ type: 'draft', tabId: 2, values: { customQuestions: 'Draft B' } }); const before = renders;
  f.calls[0].resolve(response(1)); await job;
  assert.equal(renders, before); assert.equal(f.ui.captureUI.customQuestionsEl.value, 'Draft B');
  f.store.activateTab(1); assert.equal(f.ui.captureUI.customQuestionsEl.value, 'Draft A');
  assert.equal(f.ui.actionsUI.eggAnalysisOnlyBtn.getAttribute('aria-checked'), 'true');
});
test('Back preserves preview until new completion and only visible results acknowledge unread', async context => {
  const f = setup(context); const a = f.analyze.handleAnalyze(); f.calls[0].resolve(response(1)); await a;
  f.analyze.handleBackToContent(); assert.equal(f.ui.resultsUI.captureState.classList.contains('hidden'), false);
  const b = f.analyze.handleAnalyze(); f.store.dispatch({ type: 'visibility', visible: false });
  f.calls[1].resolve(response(1)); await b;
  assert.equal(f.store.getAnalysisActivity().length, 1);
  f.store.dispatch({ type: 'visibility', visible: true });
  assert.equal(f.ui.resultsUI.resultsState.classList.contains('hidden'), false); assert.equal(f.store.getAnalysisActivity().length, 0);
});
test('keyed rendering preserves focused drafts, selection, scroll and per-tab expansion', context => {
  const old = globalThis.window; const scrolls = [];
  globalThis.window = { scrollTo: (x, y) => scrolls.push(y) }; context.after(() => { globalThis.window = old; });
  const f = setup(context); const input = f.ui.captureUI.customQuestionsEl;
  f.store.dispatch({ type: 'draft', tabId: 1, values: { customQuestions: 'Focused draft', presentation: { ...f.store.getTab(1).presentation, scroll: 125, sectionsExpanded: true } } });
  input.selectionStart = 3; input.selectionEnd = 7;
  let writes = 0; let text = input.value;
  Object.defineProperty(input, 'value', { get: () => text, set: value => { writes++; text = value; input.selectionStart = 0; input.selectionEnd = 0; } });
  const ctx = f.store.beginOperation(1, 'analysis');
  f.store.commitOperation(ctx.token, { type: 'phase', phase: 'stage2' });
  assert.equal(writes, 0); assert.equal(input.selectionStart, 3); assert.equal(input.selectionEnd, 7);
  f.store.activateTab(2);
  assert.equal(f.ui.sectionsUI.sectionsBody.classList.contains('hidden'), true);
  f.store.activateTab(1);
  assert.equal(f.ui.captureUI.customQuestionsEl.value, 'Focused draft');
  assert.equal(f.ui.sectionsUI.sectionsBody.classList.contains('hidden'), false);
  assert.equal(scrolls.at(-1), 125);
});
test('global catalog updates preserve a create draft, and follow-up renders without initial questions', async context => {
  const f = setup(context); seed(f.store, 1, { titleVerdict: 'Egg-free result', matchedEggs: [] });
  assert.equal(f.ui.eggsUI.eggsCreateForm.classList.contains('hidden'), false);
  assert.equal(f.ui.eggsUI.eggsCreateToggle.classList.contains('hidden'), true);
  f.store.dispatch({ type: 'draft', tabId: 1, values: { newEggName: 'Draft egg' } });
  f.store.dispatch({ type: 'eggCreated', egg: { fileName: 'background.md' } });
  assert.equal(f.ui.eggsUI.newEggName.value, 'Draft egg');
  assert.equal(f.ui.eggsUI.eggsCreateToggle.classList.contains('hidden'), false);
  f.service.sendMessage = async () => ({ answers: [{ answer: 'Follow-up answer' }] });
  await f.operations.followup(1, 'Question');
  assert(f.ui.qaUI.customQuestionsList.innerHTML.includes('Follow-up answer'));
});

test('a created egg stays selected until manual Egg Analysis, then Hatch includes its knowledge', async context => {
  const f = setup(context);
  const oldEgg = { egg: 'nutegg/old.md', readAction: 'full', readVerdict: true, keyQuestionAnswers: [], extractedEntries: [{ content: 'Old insight' }] };
  seed(f.store, 1, { stage: 'stage2', matchedEggs: ['nutegg/old.md'], eggResults: [oldEgg], newKnowledge: [{ egg: oldEgg.egg, content: 'Old insight' }] });
  const previous = f.store.getTab(1).analysisResult;
  f.service.createEgg = async () => ({ success: true, path: 'nutegg/new.md' });
  let confirmations = 0, saved;
  f.service.sendMessage = async message => { if (message.action === 'confirm') { confirmations++; saved = message.payload; } return { success: true }; };
  await f.operations.create(1, { name: 'New', desc: 'New knowledge', inline: true });
  assert.equal(f.calls.length, 0);
  assert.deepEqual(f.store.getTab(1).analysisResult, previous);
  assert.deepEqual(f.store.getTab(1).selectedEggs, ['nutegg/old.md', 'nutegg/new.md']);
  assert.equal(f.ui.actionsUI.confirmBtn.disabled, true);
  assert.equal(f.ui.actionsUI.confirmBtn.title, t('hatchAnalyzeSelectedEggs'));
  const blocked = await f.operations.save(1, true);
  assert.equal(blocked.error, t('hatchAnalyzeSelectedEggs')); assert.equal(confirmations, 0);
  const analysis = f.analyze.handleReanalyzeEggs();
  assert.deepEqual(f.calls[0].payload.eggs, ['nutegg/new.md']);
  assert.deepEqual(f.calls[0].payload.selectedEggs, ['nutegg/old.md', 'nutegg/new.md']);
  f.calls[0].resolve({ eggResults: [{ egg: 'nutegg/new.md', readAction: 'full', readVerdict: true, keyQuestionAnswers: [], extractedEntries: [{ content: 'New insight' }] }] });
  await analysis;
  assert.equal(f.ui.actionsUI.confirmBtn.disabled, false);
  await f.operations.save(1, true);
  assert.equal(confirmations, 1);
  assert.ok(saved.newKnowledge.some(entry => entry.egg === 'nutegg/new.md' && entry.content.includes('New insight')));
});

test('creating an egg after no matches hides the empty creation prompt and enables manual Egg Analysis', async context => {
  const f = setup(context);
  seed(f.store, 1, { stage: 'stage1', matchedEggs: [] });
  assert.equal(f.ui.eggsUI.noEggSection.classList.contains('hidden'), false);
  f.service.createEgg = async () => ({ success: true, path: 'nutegg/new.md' });
  await f.operations.create(1, { name: 'New', inline: false });
  assert.equal(f.calls.length, 0);
  assert.equal(f.ui.eggsUI.noEggSection.classList.contains('hidden'), true);
  assert.equal(f.ui.actionsUI.stage1ProceedBtn.disabled, false);
  assert.ok(f.ui.eggsUI.eggsList.innerHTML.includes('nutegg/new.md'));
});

test('when offline and unconfigured, setup hub is shown and capture-state is not-functional; becomes functional once connected', context => {
  const f = setup(context);
  const captureState = f.root.getElementById('capture-state');
  const setupHub = f.root.getElementById('setup-hub');

  // Set offline and unconfigured
  f.settings.serverOnline = false;
  f.settings.chromeAiConfigured = false;
  f.renderer.render();

  assert.equal(setupHub.classList.contains('hidden'), false);
  assert.equal(captureState.classList.contains('not-functional'), true);

  // Connecting to Obsidian makes it functional
  f.settings.serverOnline = true;
  f.renderer.render();

  assert.equal(setupHub.classList.contains('hidden'), true);
  assert.equal(captureState.classList.contains('not-functional'), false);

  // Selecting Chrome mode uses its key without an Obsidian connection.
  f.settings.setConnectionMode('chrome', false);
  f.settings.serverOnline = false;
  f.settings.chromeAiConfigured = true;
  f.renderer.render();

  assert.equal(setupHub.classList.contains('hidden'), true);
  assert.equal(captureState.classList.contains('not-functional'), false);

  // Even if unconfigured, if a tab has an analysis result, setup hub does not block results
  f.settings.chromeAiConfigured = false;
  seed(f.store, 1, { titleVerdict: 'Cached result' });
  f.renderer.render();

  assert.equal(setupHub.classList.contains('hidden'), true);
  assert.equal(captureState.classList.contains('not-functional'), false);
});


test('Chrome first-use has one setup action, hides vault controls, and becomes ready when a key is saved', context => {
  const f = setup(context);
  f.settings.setConnectionMode('chrome', false);
  f.settings.serverOnline = false;
  f.settings.chromeAiConfigured = false;
  f.renderer.render();
  const element = id => f.root.getElementById(id);
  assert.equal(element('setup-hub').classList.contains('hidden'), false);
  assert.equal(element('setup-open-settings-btn').textContent, t('readerSetupAction'));
  assert.equal(element('capture-state').classList.contains('not-functional'), true);
  for (const id of ['metrics-bar', 'obsidian-analysis-mode', 'capture-eggs-accordion', 'obsidian-plugin-link']) {
    assert.equal(element(id).classList.contains('hidden'), true, id);
  }
  assert.equal(element('chip-knowledge').classList.contains('hidden'), false);
  assert.equal(element('reanalyze-chip-knowledge').classList.contains('hidden'), false);
  assert.equal(f.ui.headerUI.serverStatus.className, 'status-dot warning');
  assert.equal(f.ui.bannersUI.aiKeyMissingBanner.classList.contains('hidden'), true);
  assert.equal(f.ui.bannersUI.chromeModeTipBanner.classList.contains('hidden'), true);

  f.settings.setChromeAiStatus({ enabled: true, configured: true });
  f.store.emit({ type: 'settings' });
  assert.equal(element('setup-hub').classList.contains('hidden'), true);
  assert.equal(element('capture-state').classList.contains('not-functional'), false);
  assert.equal(f.ui.actionsUI.analyzeBtn.disabled, false);
  assert.equal(f.ui.headerUI.serverStatus.className, 'status-dot chrome-ai');
  assert.equal(f.ui.sectionsUI.sectionsBadge.textContent, '2/4');

  seed(f.store, 1, { ...response(1), mode: 'chrome' });
  for (const id of ['confirm-btn', 'collect-nut-btn', 'stage1-confirm-box', 'history-select', 'chrome-result-banner', 'chrome-actions-card']) {
    assert.equal(element(id).classList.contains('hidden'), true, id);
  }
});

test('content preview is displayed and UI density class is synchronized', context => {
  const f = setup(context);
  const preview = f.ui.captureUI.contentPreview;
  assert.equal(preview.classList.contains('hidden'), false);
  assert.equal(f.root.body.classList.contains('density-compact'), true);
  assert.equal(f.root.body.classList.contains('density-comfortable'), false);
  assert.equal(f.root.body.classList.contains('density-ultra-compact'), false);

  f.settings.setUiDensity('comfortable', false);
  f.renderer.render();
  assert.equal(f.root.body.classList.contains('density-comfortable'), true);
  assert.equal(f.root.body.classList.contains('density-margin'), true);
  assert.equal(f.root.body.classList.contains('density-compact'), false);
  assert.equal(f.root.body.classList.contains('density-ultra-compact'), false);

  f.settings.setUiDensity('ultra-compact', false);
  f.renderer.render();
  assert.equal(f.root.body.classList.contains('density-ultra-compact'), true);
  assert.equal(f.root.body.classList.contains('density-compact'), false);
  assert.equal(f.root.body.classList.contains('density-margin'), false);
  assert.equal(f.root.body.classList.contains('density-comfortable'), false);

  f.settings.setUiDensity('margin', false);
  f.renderer.render();
  assert.equal(f.root.body.classList.contains('density-margin'), true);
  assert.equal(f.root.body.classList.contains('density-comfortable'), true);
  assert.equal(f.root.body.classList.contains('density-compact'), false);
  assert.equal(f.root.body.classList.contains('density-ultra-compact'), false);
});

test('Obsidian mode reveals its controls only after an explicit switch', context => {
  const f = setup(context);
  f.settings.setConnectionMode('chrome', false);
  f.settings.chromeAiConfigured = true;
  f.renderer.render();
  assert.equal(f.root.getElementById('metrics-bar').classList.contains('hidden'), false);
  assert.equal(f.root.getElementById('obsidian-analysis-mode').classList.contains('hidden'), true);
  f.settings.setConnectionMode('obsidian', false);
  f.settings.setServerStatus({ online: true, aiConfigured: true });
  f.renderer.render();
  assert.equal(f.root.getElementById('metrics-bar').classList.contains('hidden'), false);
  assert.equal(f.root.getElementById('obsidian-analysis-mode').classList.contains('hidden'), false);
  f.settings.serverOnline = false;
  f.renderer.render();
  assert.equal(f.root.getElementById('setup-hub').classList.contains('hidden'), false);
  assert.equal(f.root.getElementById('setup-title').textContent, t('readerSetupTitle'));
});

test('switching an existing Obsidian result to Chrome keeps the summary and hides vault actions', context => {
  const f = setup(context);
  seed(f.store, 1, { ...response(1), stage: 'stage1', mode: 'obsidian', matchedEggs: ['a.md'] });
  assert.equal(f.ui.actionsUI.stage1ConfirmBox.classList.contains('hidden'), false);
  f.settings.setConnectionMode('chrome', false);
  f.settings.setChromeAiStatus({ enabled: true, configured: true });
  f.renderer.render();
  assert.equal(f.ui.resultsUI.resultsState.classList.contains('hidden'), false);
  assert.equal(f.ui.verdictUI.verdictAnswer.textContent, 'Result 1');
  for (const id of ['stage1-confirm-box', 'confirm-btn', 'collect-nut-btn', 'eggs-section', 'egg-knowledge-section', 'history-select']) {
    assert.equal(f.root.getElementById(id).classList.contains('hidden'), true, id);
  }
  f.settings.setConnectionMode('obsidian', false);
  f.settings.setServerStatus({ online: true, aiConfigured: true });
  f.renderer.render();
  assert.equal(f.ui.actionsUI.stage1ConfirmBox.classList.contains('hidden'), false);
});
