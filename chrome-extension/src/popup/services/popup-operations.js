// Async orchestration: immutable contexts in, guarded events out. No DOM/session access.
class PopupOperations {
  constructor({ store, service, extractor, chromeApi = chrome }) {
    this.store = store; this.service = service; this.extractor = extractor; this.chromeApi = chromeApi;
    this.catalogTask = null;
    this.extractionTasks = new Map();
    this.debugPending = new Set();
  }
  async refreshDebugInfo() {
    const tab = this.store.getTab(this.store.activeTabId);
    if (!this.store.settings?.debugInfo || !tab) return;
    const { tabId, debugScope } = tab;
    const mode = this.store.settings.isChromeMode() ? 'chrome' : 'obsidian';
    const key = `${mode}:${debugScope}`;
    if (this.debugPending.has(key)) return;
    this.debugPending.add(key);
    try {
      const value = await this.service.sendMessage({ action: 'get-debug-info', mode, debugScope });
      if (!this.store.settings.debugInfo || mode !== (this.store.settings.isChromeMode() ? 'chrome' : 'obsidian')) return;
      this.store.dispatch({ type: 'debugInfo', tabId, debugScope, value });
    } catch {
      if (this.store.settings.debugInfo && mode === (this.store.settings.isChromeMode() ? 'chrome' : 'obsidian')) this.store.dispatch({ type: 'debugInfo', tabId, debugScope, value: { unavailable: true, mode } });
    } finally { this.debugPending.delete(key); }
  }
  fail(context, error) {
    this.store.commitOperation(context.token, { type: 'operationFailed', error: error?.message || String(error), code: error?.code });
    return { error: error?.message || String(error) };
  }
  extract(tabId, { waitForSettle = false } = {}) {
    const tab = this.store.getTab(tabId);
    if (!tab) return Promise.resolve(null);
    const existing = this.extractionTasks.get(tabId);
    if (existing?.generation === tab.pageGeneration && this.store.isOperationCurrent(existing.token)) return existing.task;
    const ctx = this.store.beginOperation(tabId, 'extraction', {}, ['sourceVersion']);
    if (!ctx) return Promise.resolve(null);
    const task = this.runExtraction(ctx, waitForSettle).finally(() => {
      if (this.extractionTasks.get(tabId)?.task === task) this.extractionTasks.delete(tabId);
    });
    this.extractionTasks.set(tabId, { generation: tab.pageGeneration, token: ctx.token, task });
    return task;
  }
  async runExtraction(ctx, waitForSettle) {
    const tabId = ctx.token.tabId;
    const deadline = Date.now() + 20000;
    try {
      const tab = await this.chromeApi.tabs.get(tabId);
      if (!this.store.isOperationCurrent(ctx.token)) return null;
      const cancelled = () => !this.store.isOperationCurrent(ctx.token);
      if (tab.status === 'loading') {
        await this.extractor.waitForTabComplete(tabId, 6000);
        if (cancelled()) return null;
      }
      if (tab.status === 'loading' || waitForSettle) {
        await this.extractor.waitForPageSettle(tabId, cancelled);
        if (cancelled()) return null;
      }
      const content = await this.extractor.extractPage(tabId, {
        isCancelled: cancelled, expectedUrl: ctx.tab.url,
        discussionSessionId: `${ctx.token.pageGeneration}:capture:${ctx.token.requestId}`,
        retryCount: this.store.settings?.captureRetryCount ?? 3,
        retryDelayMs: this.store.settings?.captureRetryDelayMs ?? 3000,
        timeoutMs: Math.max(1, deadline - Date.now()),
        onProgress: progress => this.store.commitOperation(ctx.token, { type: 'captureProgress', progress }),
      });
      if (cancelled()) return null;
      if (!content) throw new Error(t('couldNotExtractContent'));
      const helpers = globalThis.NutEggHelpers || {};
      const warning = helpers.getExtractionWarning?.(content) || null;
      const accepted = this.store.commitOperation(ctx.token, { type: 'extracted', content, warning });
      if (accepted && this.extractor.collectDiscussion) void this.discussion(tabId, false, true);
      return accepted ? content : null;
    } catch (error) { this.fail(ctx, error); return null; }
  }
  async discussion(tabId, load = false, passive = false) {
    const ctx = this.store.beginOperation(tabId, 'discussion');
    if (!ctx || (!passive && !ctx.tab.enabledSections.discussion) || !ctx.tab.extractedContent) {
      if (ctx) this.store.commitOperation(ctx.token, { type: 'operationFinished' });
      return;
    }
    const cancelled = () => !this.store.isOperationCurrent(ctx.token) || (!passive && !this.store.getTab(tabId)?.enabledSections.discussion);
    const sessionId = `${ctx.token.pageGeneration}:${ctx.token.requestId}`;
    try {
      const discussion = await this.extractor.collectDiscussion(tabId, { sessionId, load, isCancelled: cancelled,
        onUpdate: (discussion, loading) => {
          if (cancelled() || discussion.url?.split('#')[0] !== ctx.tab.url?.split('#')[0]) return;
          this.store.commitOperation(ctx.token, { type: 'discussionUpdated', discussion, loading, passive });
        } });
      if (this.store.isOperationCurrent(ctx.token)) {
        if (discussion) this.store.commitOperation(ctx.token, { type: 'discussionUpdated', discussion, loading: false, passive });
        else this.store.commitOperation(ctx.token, { type: 'operationFinished' });
      }
    } catch (error) {
      if (passive && !this.store.getTab(tabId)?.enabledSections.discussion) this.store.commitOperation(ctx.token, { type: 'operationFinished' });
      else this.fail(ctx, error);
    }
  }
  stopDiscussion(tabId) {
    const tab = this.store.getTab(tabId), operation = tab?.operations.discussion;
    this.store.dispatch({ type: 'discussionCancelled', tabId });
    if (operation) void this.extractor.stopDiscussion(tabId, `${tab.pageGeneration}:${operation.requestId}`);
  }
  async history(tabId, select = true, expectedSelection) {
    const ctx = this.store.beginOperation(tabId, 'history', { select }, ['selectionRevision', 'sourceVersion']);
    if (!ctx) return;
    if (expectedSelection != null && ctx.tab.selectionRevision !== expectedSelection) { this.store.commitOperation(ctx.token, { type: 'operationFinished' }); return; }
    try {
      const history = await this.service.loadHistory(ctx.tab.url || ctx.tab.extractedContent?.url);
      this.store.commitOperation(ctx.token, { type: 'historyLoaded', history: history || [], select, selectionIntent: ctx.tab.intentRevision });
    } catch (error) { this.fail(ctx, error); }
  }
  async catalog() {
    if (this.catalogTask) return this.catalogTask;
    const version = this.store.dispatch({ type: 'catalogRequested' });
    const task = this.service.sendMessage({ action: 'get-eggs' }).then(response => {
      this.store.dispatch({ type: 'catalog', version, eggs: response?.eggs || [] });
    }).catch(() => {}).finally(() => { if (this.catalogTask === task) this.catalogTask = null; });
    this.catalogTask = task; return task;
  }
  async analyze(tabId, options) {
    const ctx = this.store.beginOperation(tabId, 'analysis', options, ['sourceVersion']);
    if (!ctx) return { busy: true };
    const { tab, inputs, token } = ctx;
    const content = tab.extractedContent;
    try {
      if (!content?.content) throw new Error(t('couldNotRetrieveContent'));
      const payload = { ...content, debugScope: tab.debugScope, force: true, stage: 1, questions: inputs.questions || [], questionsScope: tab.customQuestionsScope,
        generateKnowledgeEntries: tab.generateKnowledgeEntries, enabledSections: tab.enabledSections,
        discussion: tab.enabledSections.discussion === true ? content.discussion : undefined,
        outputLanguage: inputs.outputLanguage, ...(inputs.eggs ? { eggs: inputs.eggs } : {}) };
      const response = await this.service.sendAnalyzeViaPort(payload);
      if (!this.store.isOperationCurrent(token)) return { stale: true };
      if (response?.error) throw Object.assign(new Error(response.error), { code: response.errorCode });
      const stage1 = { ...response, generateKnowledgeEntries: tab.generateKnowledgeEntries };
      const chromeMode = response.mode === 'chrome' || inputs.chromeMode;
      const eggs = chromeMode ? [] : inputs.eggs || response.matchedEggs || [];
      if (!chromeMode && (inputs.analysisMode === 'full' || inputs.analysisMode === 'fast' || inputs.reanalyze) && eggs.length) {
        this.store.commitOperation(token, { type: 'analysisInterim', result: stage1, payload, eggs });
        this.store.commitOperation(token, { type: 'phase', phase: 'stage2' });
        const result = await this.runEggs(ctx, stage1, payload, eggs, []);
        return result;
      }
      if (!chromeMode) {
        stage1.stage = 'stage1';
        for (const key of ['eggResults', 'shouldRead', 'shouldReadReason', 'newKnowledge']) delete stage1[key];
      }
      this.store.commitOperation(token, { type: 'analysisComplete', result: stage1, payload: { ...payload, nutId: stage1.nutId }, stage1: true, eggs });
      return { success: true, result: stage1 };
    } catch (error) { return this.fail(ctx, error); }
  }
  async eggs(tabId, options) {
    const tab = this.store.getTab(tabId);
    if (!tab || this.store.isBusy(tabId)) return { busy: true };
    const eggs = options.eggs || tab.selectedEggs;
    if (!eggs.length) { this.store.dispatch({ type: 'notice', tabId, message: t('selectEggWarning') }); return; }
    const result = tab.analysisResult || {};
    const cached = [...(result.eggResults || []), ...(result.eggAnalysisCache || [])];
    const byEgg = new Map(cached.map(r => [r.egg, r]));
    const pending = eggs.filter(egg => {
      if (!byEgg.has(egg)) return true;
      const cachedResult = byEgg.get(egg);
      if (tab.generateKnowledgeEntries && !cachedResult.entryGenerationDisabledByEgg) {
        const wasEggOnly = cachedResult.generateKnowledgeEntries === false || result.generateKnowledgeEntries === false;
        const hasKnowledge = Boolean(cachedResult.extractedEntries?.length ||
          cachedResult.keyQuestionAnswers?.some(a => a.answered !== false && a.answer && !/^(?:not addressed in this content|not addressed in this part)[.!]?$/i.test(String(a.answer).trim())));
        if (wasEggOnly && !hasKnowledge || cachedResult.generateKnowledgeEntries === false) {
          return true;
        }
      }
      return false;
    });
    if (!pending.length) {
      try {
        const composed = { ...globalThis.NutEggAI.composeEggResults(tab.stage1ContentAnalysis || result, eggs.map(egg => byEgg.get(egg)), [...byEgg.values()]),
          stage: 'stage2', mode: result.mode, generateKnowledgeEntries: tab.generateKnowledgeEntries };
        this.store.dispatch({ type: 'cachedResult', tabId, result: composed, eggs, message: t('cachedEggAnalysisShown') });
        return { success: true, result: composed, cached: true };
      } catch (error) {
        const message = error?.message || String(error);
        this.store.dispatch({ type: 'notice', tabId, message });
        return { error: message };
      }
    }
    const ctx = this.store.beginOperation(tabId, 'analysis', { ...options, eggs, cached: [...byEgg.values()], pending }, ['sourceVersion', 'stage1Version']);
    if (!ctx) return { busy: true };
    this.store.commitOperation(ctx.token, { type: 'phase', phase: 'stage2' });
    try { return await this.runEggs(ctx, ctx.tab.stage1ContentAnalysis || result, ctx.tab.stage1Payload, eggs, [...byEgg.values()]); }
    catch (error) { return this.fail(ctx, error); }
  }
  async runEggs(ctx, analysis, base, eggs, cached) {
    const { tab, inputs, token } = ctx;
    // A history record can supply Stage 1 metadata without a source body.
    // Prefer its snapshot only when it contains content; otherwise use the
    // fetched source captured in this operation, never a fresh active-tab read.
    const source = typeof base?.content === 'string' && base.content.trim() ? base : tab.extractedContent;
    if (typeof source?.content !== 'string' || !source.content.trim()) throw new Error(t('couldNotRetrieveContent'));
    const payload = { ...source, debugScope: tab.debugScope, stage: 2, force: true, contentAnalysis: analysis, eggs: inputs.pending || eggs,
      selectedEggs: eggs, cachedEggResults: cached, generateKnowledgeEntries: tab.generateKnowledgeEntries,
      outputLanguage: inputs.outputLanguage, nutId: source.nutId || analysis.nutId || tab.currentNutId };
    const response = await this.service.sendAnalyzeViaPort(payload);
    if (!this.store.isOperationCurrent(token)) return { stale: true };
    if (response?.error) throw Object.assign(new Error(response.error), { code: response.errorCode });
    const cache = new Map(cached.map(r => [r.egg, r]));
    for (const r of [...(response.eggResults || []), ...(response.eggAnalysisCache || [])]) cache.set(r.egg, r);
    const result = { ...globalThis.NutEggAI.composeEggResults(analysis, eggs.map(egg => cache.get(egg)).filter(Boolean), [...cache.values()]),
      stage: 'stage2', mode: response.mode ?? analysis.mode, nutId: response.nutId || payload.nutId, generateKnowledgeEntries: tab.generateKnowledgeEntries };
    this.store.commitOperation(token, { type: 'analysisComplete', result, eggs });
    return { success: true, result };
  }
  async save(tabId, hatch) {
    const ctx = this.store.beginOperation(tabId, 'saving', { hatch }, ['resultRevision']);
    if (!ctx) return { busy: true };
    const { tab, token } = ctx;
    let requested = false;
    let received = false;
    const receipt = outcome => this.store.dispatch({ type: 'receipt', receipt: { tabId, pageGeneration: token.pageGeneration,
      resultRevision: tab.resultRevision, requestId: token.requestId, nutId: tab.currentNutId, time: Date.now(), ...outcome } });
    try {
      const result = tab.analysisResult;
      if (hatch && globalThis.NutEggHelpers.selectedEggsNeedAnalysis(tab)) throw new Error(t('hatchAnalyzeSelectedEggs'));
      const entries = hatch ? result?.newKnowledge || [] : [];
      if (hatch && !entries.length) throw new Error(t('noNewKnowledgeToAdd'));
      const content = tab.stage1Payload || tab.extractedContent;
      if (!content) throw new Error(t('couldNotExtractToSave'));
      const payload = { ...content, debugScope: tab.debugScope, analysis: result, summary: result?.summary || '', matchedEggs: result?.matchedEggs || [],
        newKnowledge: entries, nutId: tab.currentNutId ?? undefined, skipRaw: hatch && tab.nutCollected };
      requested = true;
      const response = await this.service.sendMessage({ action: 'confirm', payload });
      received = true;
      receipt({ success: !!response?.success, outcome: response?.success ? 'saved' : 'failed' });
      if (!response?.success) throw new Error(response?.error || t('failedToSave'));
      this.store.commitOperation(token, { type: 'saved', hatch, message: t(hatch ? 'eggHatchedSuccess' : 'nutCollectedVault', { mergedNote: '' }) });
      return { success: true };
    } catch (error) {
      // A disconnected client cannot know whether the backend accepted its write.
      if (requested && !received) receipt({ success: false, outcome: 'unknown' });
      return this.fail(ctx, error);
    }
  }
  async followup(tabId, question, options = {}) {
    const ctx = this.store.beginOperation(tabId, 'followup', { question, ...options }, ['resultRevision']);
    if (!ctx) return;
    const { token, tab } = ctx;
    this.store.commitOperation(token, { type: 'questionStarted', id: token.requestId, question, scope: tab.followupScope });
    const priorQa = [...(tab.analysisResult?.eggResults || []).flatMap(r => r.keyQuestionAnswers || []), ...(tab.analysisResult?.customQuestionAnswers || []), ...tab.followUpQa.filter(q => !q.pending)];
    try {
      const response = await this.service.sendMessage({ action: 'ask', payload: { ...(tab.stage1Payload || tab.extractedContent),
        debugScope: tab.debugScope,
        questions: [question], scope: tab.followupScope, priorQa, outputLanguage: ctx.inputs.outputLanguage } });
      if (response?.error) throw Object.assign(new Error(response.error), { code: response.errorCode });
      this.store.commitOperation(token, { type: 'questionAnswered', id: token.requestId, answer: response.answers?.[0] || { answer: t('noContentExtracted') } });
    } catch (error) { return this.fail(ctx, error); }
  }
  async create(tabId, inputs) {
    const ctx = this.store.beginOperation(tabId, 'creation', inputs);
    if (!ctx) return;
    const captured = ctx.inputs;
    try {
      const response = await this.service.createEgg(captured.name, captured.desc);
      if (!response?.success) throw new Error(response?.error || t('failedToCreateEgg'));
      const fileName = response.path || `${globalThis.NutEggHelpers.slugify(captured.name)}.md`;
      const pendingCatalog = this.catalogTask;
      this.store.dispatch({ type: 'eggCreated', egg: { fileName, description: captured.desc || captured.name } });
      // A fetch started before creation is discarded; refresh it to retain the other eggs too.
      if (pendingCatalog) void pendingCatalog.then(() => this.catalog());
      if (!this.store.commitOperation(ctx.token, { type: 'creationComplete', fileName,
        message: t('eggCreatedSelected', { egg: globalThis.NutEggHelpers.cleanEggName(fileName) }) })) return { stale: true };
      return { success: true, fileName };
    } catch (error) { return this.fail(ctx, error); }
  }
}
globalThis.NutEggServices = globalThis.NutEggServices || {};
globalThis.NutEggServices.PopupOperations = PopupOperations;
if (typeof module !== 'undefined' && module.exports) module.exports = { PopupOperations };
