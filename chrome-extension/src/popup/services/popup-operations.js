// Async orchestration: immutable contexts in, guarded events out. No DOM/session access.
class PopupOperations {
  constructor({ store, service, extractor, chromeApi = chrome }) {
    this.store = store;
    this.service = service;
    this.extractor = extractor;
    this.chromeApi = chromeApi;
    this.catalogTask = null;
    this.extractionTasks = new Map();
    this.debugPending = new Set();
    this.debugEpochs = new Map();
    this.debugCountersReset = false;
    this.debugVersion = 0;
    this.recoveryJobs = new Map();
    this.originalJobs = new Set();
    this.localAnalysisTabs = new Set();
    this.recoveryLoads = new Map();
    this.recoveryReady = service.watchJobs && chromeApi.tabs?.query
      ? new Promise(resolve => { this.finishRecovery = resolve; }) : Promise.resolve();
  }
  async initializeRecovery() {
    if (!this.service.watchJobs || !this.chromeApi.tabs?.query) return;
    try {
      const tabs = await this.chromeApi.tabs.query({ currentWindow: true });
      const windowId = tabs[0]?.windowId;
      if (windowId == null) return;
      const snapshot = await this.service.watchJobs(windowId, event => this.handleBackgroundJob(event));
      this.store.setDebugSessionId(snapshot.sessionId);
      for (const job of snapshot.jobs) await this.handleBackgroundJob({ type: 'job', job });
      this.store.subscribe(event => {
        if (event.type === 'viewed') {
          const tab = this.store.getTab(event.tabId);
          if (tab?.backgroundJob?.status === 'completed') this.service.markJobViewed(tab.backgroundJob.id);
        }
      });
    } catch (error) {
      // Recovery is independent of Obsidian connectivity and never starts AI work.
      this.recoveryError = error.message;
    } finally { this.finishRecovery?.(); }
  }
  async handleBackgroundJob(event) {
    if (event.type === 'disconnected') {
      for (const summary of this.recoveryJobs.values()) {
        const tab = this.store.getTab(summary.owner.tabId), operation = tab?.operations.analysis;
        if (!operation?.running || this.localAnalysisTabs.has(tab.tabId)) continue;
        this.store.commitOperation({ tabId: tab.tabId, pageGeneration: tab.pageGeneration,
          kind: 'analysis', requestId: operation.requestId, dependencies: operation.dependencies || {},
        }, { type: 'operationFailed', code: 'job_connection_lost', error: t('jobConnectionLost') });
      }
      return;
    }
    if (event.type === 'partial') {
      if (event.section === 'executionQueue') return;
      const summary = [...this.recoveryJobs.values()].find(job => job.id === event.jobId);
      if (!summary || this.localAnalysisTabs.has(summary.owner.tabId)) return;
      const tab = this.store.getTab(summary.owner.tabId), operation = tab?.operations.analysis;
      if (tab?.backgroundJob?.id === event.jobId && operation?.running) this.store.commitOperation({
        tabId: tab.tabId, pageGeneration: tab.pageGeneration, kind: 'analysis',
        requestId: operation.requestId, dependencies: operation.dependencies || {},
      }, { type: 'analysisPartial', partial: event });
      return;
    }
    if (event.type !== 'job') return;
    const job = event.job;
    if (!job || job.errorCode === 'stale') return;
    const liveTab = await this.chromeApi.tabs.get(job.owner.tabId).catch(() => null);
    if (!liveTab || globalThis.NutEggAI.capturePageKey(liveTab.url) !== job.owner.key) return;
    const previous = this.recoveryJobs.get(job.owner.tabId);
    if (previous && (previous.createdAt > job.createdAt ||
      previous.id === job.id && previous.revision >= job.revision)) return;
    this.recoveryJobs.set(job.owner.tabId, job);
    if (this.originalJobs.has(job.id) || this.localAnalysisTabs.has(job.owner.tabId)) return;
    const tab = this.store.ensure(job.owner.tabId, job.owner.key);
    if (tab.backgroundDismissedJobId === job.id || globalThis.NutEggAI.capturePageKey(tab.url) !== job.owner.key) return;
    // Viewed/save metadata can advance a terminal job's revision. Its result has
    // already been applied; replaying it would erase subsequent local actions.
    if (tab.backgroundAppliedJobId === job.id && !['waiting', 'running'].includes(job.status)) {
      this.store.dispatch({ type: 'backgroundJobInfo', tabId: job.owner.tabId, job });
      return;
    }
    if (!tab.operations.analysis?.running) this.store.beginOperation(job.owner.tabId, 'analysis', {}, []);
    this.store.dispatch({ type: 'backgroundJobSummary', tabId: job.owner.tabId,
      pageGeneration: tab.pageGeneration, job });
    if (this.store.activeTabId === job.owner.tabId) void this.restoreForTab(job.owner.tabId);
  }
  async restoreForTab(tabId) {
    const summary = this.recoveryJobs.get(tabId), tab = this.store.getTab(tabId);
    if (!summary || !tab || tab.backgroundDismissedJobId === summary.id || this.localAnalysisTabs.has(tabId) || this.originalJobs.has(summary.id) ||
      globalThis.NutEggAI.capturePageKey(tab.url) !== summary.owner.key) return false;
    if (tab.backgroundAppliedJobId === summary.id && !['waiting', 'running'].includes(summary.status)) return true;
    if (tab.backgroundRestoredRevision === summary.revision && tab.backgroundJob?.id === summary.id) return true;
    const key = `${summary.id}:${summary.revision}`;
    if (this.recoveryLoads.has(key)) return this.recoveryLoads.get(key);
    const task = (async () => {
      const job = await this.service.getJob(summary.id);
      const current = this.store.getTab(tabId);
      if (!job || this.localAnalysisTabs.has(tabId) || current?.backgroundDismissedJobId === summary.id || current?.pageGeneration !== tab.pageGeneration ||
        this.recoveryJobs.get(tabId)?.id !== job.id || current.backgroundJob?.revision > job.revision) return false;
      if (current.backgroundAppliedJobId === job.id && !['waiting', 'running'].includes(job.status)) return true;
      let result = job.result;
      const stoppedStage2 = job.stage === 2 && ['failed', 'cancelled', 'interrupted'].includes(job.status);
      if (job.stage === 2 && (result || stoppedStage2 && job.payload.cachedEggResults?.length)) {
        result ||= {};
        const byEgg = new Map([...(job.payload.cachedEggResults || []), ...(result.eggResults || []),
          ...(result.eggAnalysisCache || [])].map(value => [value.egg, value]));
        const eggs = job.payload.selectedEggs || job.payload.eggs || [];
        result = { ...globalThis.NutEggAI.composeEggResults(job.payload.contentAnalysis,
          eggs.map(egg => byEgg.get(egg)).filter(Boolean), [...byEgg.values()]), stage: 'stage2',
          mode: result.mode || job.payload.contentAnalysis?.mode, nutId: result.nutId || job.payload.nutId,
          generateKnowledgeEntries: job.payload.generateKnowledgeEntries };
      } else if (result) {
        result = { ...result, stage: 'stage1', generateKnowledgeEntries: job.payload.generateKnowledgeEntries };
        if (result.mode !== 'chrome') for (const key of ['eggResults', 'shouldRead', 'shouldReadReason', 'newKnowledge']) delete result[key];
      }
      const { payload, context, result: rawResult, signature, progress, ...metadata } = job;
      this.recoveryJobs.set(tabId, metadata);
      this.store.dispatch({ type: 'backgroundJobRestored', tabId, pageGeneration: tab.pageGeneration, job, result });
      for (const event of job.progress || []) this.handleBackgroundJob(event);
      return true;
    })().catch(error => {
      if (this.store.getTab(tabId)?.pageGeneration === tab.pageGeneration)
        this.store.dispatch({ type: 'notice', tabId, message: error.message });
      return false;
    }).finally(() => this.recoveryLoads.delete(key));
    this.recoveryLoads.set(key, task);
    return task;
  }
  async refreshDebugInfo() {
    const tab = this.store.getTab(this.store.activeTabId);
    if (!this.store.settings?.debugInfo || !tab) return;
    const { tabId, debugScope } = tab;
    const mode = this.store.settings.isChromeMode() ? 'chrome' : 'obsidian';
    const key = `${mode}:${this.store.debugSessionId}`;
    if (this.debugPending.has(key)) return;
    this.debugPending.add(key);
    const version = ++this.debugVersion;
    try {
      const value = await this.service.sendMessage({ action: 'get-debug-info', mode, debugScope });
      if (
        version !== this.debugVersion ||
        !this.store.settings.debugInfo ||
        mode !== (this.store.settings.isChromeMode() ? 'chrome' : 'obsidian')
      )
        return;
      if (value?.panel?.sessionId && value.panel.sessionId !== this.store.debugSessionId) return;
      for (const [owner, epoch] of Object.entries(value?.panel?.epochs || {})) {
        if (!epoch) continue;
        if (this.debugEpochs.has(owner) && this.debugEpochs.get(owner) !== epoch) this.debugCountersReset = true;
        this.debugEpochs.set(owner, epoch);
      }
      if (value?.panel) value.panel.reset = this.debugCountersReset;
      // After leaving connected mode, earlier Obsidian-owned counts are unknown.
      // Do not silently present the local-only subtotal as the entire session.
      if (value?.panel && mode === 'chrome' && this.debugEpochs.has('obsidian')) value.panel.available = false;
      this.store.dispatch({ type: 'debugInfo', tabId, debugScope, value });
    } catch {
      if (
        version === this.debugVersion &&
        this.store.settings.debugInfo &&
        mode === (this.store.settings.isChromeMode() ? 'chrome' : 'obsidian')
      )
        this.store.dispatch({ type: 'debugInfo', tabId, debugScope, value: { unavailable: true, mode } });
    } finally {
      this.debugPending.delete(key);
    }
  }
  fail(context, error) {
    this.store.commitOperation(context.token, {
      type: 'operationFailed',
      error: ['job_storage_full', 'job_storage_failed', 'job_storage_unavailable'].includes(error?.code)
        ? t('jobStorageUnavailable') : error?.code === 'job_protocol_mismatch' ? t('jobUpdateRequired') : error?.message || String(error),
      code: error?.code,
      partialResult: error?.partialResult,
    });
    return { error: error?.message || String(error) };
  }
  extract(tabId, { waitForSettle = false } = {}) {
    const tab = this.store.getTab(tabId);
    if (!tab) return Promise.resolve(null);
    const existing = this.extractionTasks.get(tabId);
    if (existing?.generation === tab.pageGeneration && this.store.isOperationCurrent(existing.token))
      return existing.task;
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
        isCancelled: cancelled,
        expectedUrl: ctx.tab.url,
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
    } catch (error) {
      this.fail(ctx, error);
      return null;
    }
  }
  async discussion(tabId, load = false, passive = false) {
    const ctx = this.store.beginOperation(tabId, 'discussion');
    if (!ctx || (!passive && !ctx.tab.enabledSections.discussion) || !ctx.tab.extractedContent) {
      if (ctx) this.store.commitOperation(ctx.token, { type: 'operationFinished' });
      return;
    }
    const cancelled = () =>
      !this.store.isOperationCurrent(ctx.token) || (!passive && !this.store.getTab(tabId)?.enabledSections.discussion);
    const sessionId = `${ctx.token.pageGeneration}:${ctx.token.requestId}`;
    try {
      const discussion = await this.extractor.collectDiscussion(tabId, {
        sessionId,
        load,
        isCancelled: cancelled,
        onUpdate: (discussion, loading) => {
          if (
            cancelled() ||
            globalThis.NutEggAI.capturePageKey(discussion.url || '') !==
              globalThis.NutEggAI.capturePageKey(ctx.tab.url || '')
          )
            return;
          this.store.commitOperation(ctx.token, { type: 'discussionUpdated', discussion, loading, passive });
        },
      });
      if (this.store.isOperationCurrent(ctx.token)) {
        if (discussion)
          this.store.commitOperation(ctx.token, { type: 'discussionUpdated', discussion, loading: false, passive });
        else this.store.commitOperation(ctx.token, { type: 'operationFinished' });
      }
    } catch (error) {
      if (passive && !this.store.getTab(tabId)?.enabledSections.discussion)
        this.store.commitOperation(ctx.token, { type: 'operationFinished' });
      else this.fail(ctx, error);
    }
  }
  stopDiscussion(tabId) {
    const tab = this.store.getTab(tabId),
      operation = tab?.operations.discussion;
    this.store.dispatch({ type: 'discussionCancelled', tabId });
    if (operation) void this.extractor.stopDiscussion(tabId, `${tab.pageGeneration}:${operation.requestId}`);
  }
  async history(tabId, select = true, expectedSelection) {
    const ctx = this.store.beginOperation(tabId, 'history', { select }, ['selectionRevision', 'sourceVersion']);
    if (!ctx) return;
    if (expectedSelection != null && ctx.tab.selectionRevision !== expectedSelection) {
      this.store.commitOperation(ctx.token, { type: 'operationFinished' });
      return;
    }
    try {
      const history = await this.service.loadHistory(ctx.tab.url || ctx.tab.extractedContent?.url);
      this.store.commitOperation(ctx.token, {
        type: 'historyLoaded',
        history: history || [],
        select,
        selectionIntent: ctx.tab.intentRevision,
      });
    } catch (error) {
      this.fail(ctx, error);
    }
  }
  async catalog() {
    if (this.catalogTask) return this.catalogTask;
    const version = this.store.dispatch({ type: 'catalogRequested' });
    const task = this.service
      .sendMessage({ action: 'get-eggs' })
      .then(response => {
        this.store.dispatch({ type: 'catalog', version, eggs: response?.eggs || [] });
      })
      .catch(() => {})
      .finally(() => {
        if (this.catalogTask === task) this.catalogTask = null;
      });
    this.catalogTask = task;
    return task;
  }
  async sendAnalysis(ctx, payload, onProgress, retryOfJobId) {
    const previousRetry = this.store.getTab(ctx.token.tabId)?.analysisRetry;
    const stage1Request = Number(payload.stage) === 2
      ? Number(previousRetry?.payload.stage) === 1 ? { payload: previousRetry.payload, inputs: previousRetry.inputs }
        : previousRetry?.stage1Request
      : undefined;
    this.store.commitOperation(ctx.token, { type: 'analysisRetryContext', payload, inputs: ctx.inputs, stage1Request });
    const controller = new AbortController();
    const check = () => {
      if (!this.store.isOperationCurrent(ctx.token)) controller.abort();
    };
    const unsubscribe = this.store.subscribe(check);
    check();
    const jobId = crypto.randomUUID();
    this.originalJobs.add(jobId);
    this.localAnalysisTabs.add(ctx.token.tabId);
    let acceptedId = jobId;
    const parentJob = this.store.getTab(ctx.token.tabId)?.backgroundJob;
    try {
      return await this.service.sendAnalyzeViaPort(
        payload,
        event => {
          if (event?.section === 'executionQueue') {
            this.store.commitOperation(ctx.token, { type: 'analysisQueueState', state: event.data?.state });
          } else onProgress?.(event);
        },
        { signal: controller.signal, tabId: ctx.token.tabId, jobId,
          context: { inputs: ctx.inputs, retryOfJobId, stage1Request, parentJobId: Number(payload.stage) === 2 && parentJob?.stage === 1
            ? parentJob.id : Number(payload.stage) === 2 ? parentJob?.parentJobId : undefined },
          onJob: job => {
            acceptedId = job.id; this.originalJobs.add(job.id);
            const { payload, context, result, signature, progress, ...metadata } = job;
            this.store.commitOperation(ctx.token, { type: 'backgroundJobInfo', job: metadata });
          },
        }
      );
    } finally {
      this.originalJobs.delete(jobId); this.originalJobs.delete(acceptedId);
      this.localAnalysisTabs.delete(ctx.token.tabId);
      unsubscribe();
    }
  }
  async retryAnalysis(tabId) {
    const tab = this.store.getTab(tabId);
    let retry = tab?.analysisRetry;
    if (!retry || retry.pageGeneration !== tab.pageGeneration || this.store.isBusy(tabId)) return { busy: true };
    // A later egg stage may have succeeded while Stage 1 was incomplete.
    // Retry that original request instead of needlessly regenerating healthy eggs.
    if (!tab.errors.analysis && tab.analysisResult?.analysisFailures?.length && retry.stage1Request &&
      !(tab.analysisResult?.eggResults || []).some(egg => egg.analysisFailures?.length)) retry = retry.stage1Request;
    const ctx = this.store.beginOperation(tabId, 'analysis', retry.inputs || {},
      Number(retry.payload.stage) === 2 ? ['sourceVersion', 'stage1Version'] : ['sourceVersion']);
    if (!ctx) return { busy: true };
    try {
      const payload = structuredClone(retry.payload);
      if (Number(payload.stage) === 2) {
        const result = tab.analysisResult || {};
        const cached = new Map([...(payload.cachedEggResults || []), ...(result.eggAnalysisCache || []),
          ...(result.eggResults || [])].map(egg => [egg.egg, egg]));
        const selected = payload.selectedEggs || payload.eggs || [];
        payload.eggs = selected.filter(egg => !cached.has(egg) || cached.get(egg).analysisFailures?.length ||
          ['partial', 'failed'].includes(cached.get(egg).generation?.status));
        payload.cachedEggResults = [...cached.values()];
        if (!payload.eggs.length) payload.eggs = retry.payload.eggs;
        this.store.commitOperation(ctx.token, { type: 'phase', phase: 'stage2' });
      }
      const response = await this.sendAnalysis(ctx, payload, partial =>
        this.store.commitOperation(ctx.token, { type: 'analysisPartial', partial }), tab.backgroundJob?.id || 'manual');
      if (!this.store.isOperationCurrent(ctx.token)) return { stale: true };
      if (response?.error) throw Object.assign(new Error(response.error), { code: response.errorCode, partialResult: response.partialResult });
      let result = { ...response, generateKnowledgeEntries: payload.generateKnowledgeEntries };
      if (Number(payload.stage) === 2) {
        const cache = new Map([...(payload.cachedEggResults || []), ...(response.eggAnalysisCache || []),
          ...(response.eggResults || [])].map(egg => [egg.egg, egg]));
        const eggs = payload.selectedEggs || payload.eggs;
        result = { ...globalThis.NutEggAI.composeEggResults(payload.contentAnalysis,
          eggs.map(egg => cache.get(egg)).filter(Boolean), [...cache.values()], payload.generateKnowledgeEntries !== false), stage: 'stage2',
          mode: response.mode || payload.contentAnalysis?.mode, nutId: response.nutId || payload.nutId,
          generateKnowledgeEntries: payload.generateKnowledgeEntries };
        this.store.commitOperation(ctx.token, { type: 'analysisComplete', result, eggs });
      } else {
        result.stage = 'stage1';
        const chromeMode = result.mode === 'chrome' || retry.inputs?.chromeMode;
        if (!chromeMode)
          for (const key of ['eggResults', 'shouldRead', 'shouldReadReason', 'newKnowledge']) delete result[key];
        const cached = Number(tab.analysisRetry.payload.stage) === 2 ||
          tab.stage1Payload?.content === payload.content && tab.stage1Payload?.url === payload.url
          ? tab.analysisResult?.eggAnalysisCache || tab.analysisResult?.eggResults || [] : [];
        const eggs = retry.inputs?.eggs || result.matchedEggs || payload.eggs || [];
        if (!chromeMode && eggs.length &&
          (['full', 'fast'].includes(retry.inputs?.analysisMode) || retry.inputs?.reanalyze)) {
          this.store.commitOperation(ctx.token, { type: 'analysisInterim', result, payload, eggs });
          this.store.commitOperation(ctx.token, { type: 'phase', phase: 'stage2' });
          const byEgg = new Map(cached.map(egg => [egg.egg, egg]));
          const pending = eggs.filter(egg => !byEgg.has(egg) || byEgg.get(egg).analysisFailures?.length);
          if (pending.length) return await this.runEggs({ ...ctx,
            tab: { ...ctx.tab, generateKnowledgeEntries: payload.generateKnowledgeEntries },
            inputs: { ...ctx.inputs, pending } }, result, payload, eggs, cached);
          result = { ...globalThis.NutEggAI.composeEggResults(result, eggs.map(egg => byEgg.get(egg)), cached,
            payload.generateKnowledgeEntries !== false),
            stage: 'stage2', mode: result.mode, nutId: result.nutId, generateKnowledgeEntries: payload.generateKnowledgeEntries };
          this.store.commitOperation(ctx.token, { type: 'analysisComplete', result, eggs });
          return { success: true, result };
        }
        if (!chromeMode && cached.length) result.eggAnalysisCache = cached;
        this.store.commitOperation(ctx.token, { type: 'analysisComplete', result, stage1: true,
          payload: { ...payload, nutId: result.nutId }, eggs: result.matchedEggs || payload.eggs || [] });
      }
      return { success: true, result };
    } catch (error) { return this.fail(ctx, error); }
  }
  async analyze(tabId, options) {
    const ctx = this.store.beginOperation(tabId, 'analysis', options, ['sourceVersion']);
    if (!ctx) return { busy: true };
    const { tab, inputs, token } = ctx;
    const content = tab.extractedContent;
    try {
      if (!content?.content) throw new Error(t('couldNotRetrieveContent'));
      const payload = {
        ...content,
        debugScope: tab.debugScope,
        force: true,
        stage: 1,
        questions: inputs.questions || [],
        questionsScope: tab.customQuestionsScope,
        generateKnowledgeEntries: tab.generateKnowledgeEntries,
        enabledSections: tab.enabledSections,
        optimizeForConversation: tab.optimizeForConversation !== false,
        discussion: tab.enabledSections.discussion === true ? content.discussion : undefined,
        outputLanguage: inputs.outputLanguage,
        ...(inputs.eggs ? { eggs: inputs.eggs } : {}),
      };
      const response = await this.sendAnalysis(ctx, payload, event => {
        if (!this.store.isOperationCurrent(token)) return;
        this.store.commitOperation(token, { type: 'analysisPartial', partial: event });
      });
      if (!this.store.isOperationCurrent(token)) return { stale: true };
      if (response?.error) throw Object.assign(new Error(response.error), { code: response.errorCode, partialResult: response.partialResult });
      const stage1 = { ...response, generateKnowledgeEntries: tab.generateKnowledgeEntries };
      const chromeMode = response.mode === 'chrome' || inputs.chromeMode;
      const eggs = chromeMode ? [] : inputs.eggs || response.matchedEggs || [];
      if (
        !chromeMode &&
        (inputs.analysisMode === 'full' || inputs.analysisMode === 'fast' || inputs.reanalyze) &&
        eggs.length
      ) {
        this.store.commitOperation(token, { type: 'analysisInterim', result: stage1, payload, eggs });
        this.store.commitOperation(token, { type: 'phase', phase: 'stage2' });
        const result = await this.runEggs(ctx, stage1, payload, eggs, []);
        return result;
      }
      if (!chromeMode) {
        stage1.stage = 'stage1';
        for (const key of ['eggResults', 'shouldRead', 'shouldReadReason', 'newKnowledge']) delete stage1[key];
      }
      this.store.commitOperation(token, {
        type: 'analysisComplete',
        result: stage1,
        payload: { ...payload, nutId: stage1.nutId },
        stage1: true,
        eggs,
      });
      return { success: true, result: stage1 };
    } catch (error) {
      return this.fail(ctx, error);
    }
  }
  async eggs(tabId, options) {
    const tab = this.store.getTab(tabId);
    if (!tab || this.store.isBusy(tabId)) return { busy: true };
    const eggs = options.eggs || tab.selectedEggs;
    if (!eggs.length) {
      this.store.dispatch({ type: 'notice', tabId, message: t('selectEggWarning') });
      return;
    }
    const result = tab.analysisResult || {};
    const cached = [...(result.eggResults || []), ...(result.eggAnalysisCache || [])];
    const byEgg = new Map(cached.map(r => [r.egg, r]));
    const pending = eggs.filter(egg => {
      if (!byEgg.has(egg)) return true;
      const cachedResult = byEgg.get(egg);
      if (cachedResult.analysisFailures?.length) return true;
      if (tab.generateKnowledgeEntries && !cachedResult.entryGenerationDisabledByEgg) {
        const wasEggOnly = cachedResult.generateKnowledgeEntries === false || result.generateKnowledgeEntries === false;
        const hasKnowledge = Boolean(
          cachedResult.extractedEntries?.length ||
          cachedResult.keyQuestionAnswers?.some(
            a =>
              a.answered !== false &&
              a.answer &&
              !/^(?:not addressed in this content|not addressed in this part)[.!]?$/i.test(String(a.answer).trim())
          )
        );
        if ((wasEggOnly && !hasKnowledge) || cachedResult.generateKnowledgeEntries === false) {
          return true;
        }
      }
      return false;
    });
    if (!pending.length) {
      try {
        const composed = {
          ...globalThis.NutEggAI.composeEggResults(
            tab.stage1ContentAnalysis || result,
            eggs.map(egg => byEgg.get(egg)),
            [...byEgg.values()]
          ),
          stage: 'stage2',
          mode: result.mode,
          generateKnowledgeEntries: tab.generateKnowledgeEntries,
        };
        this.store.dispatch({
          type: 'cachedResult',
          tabId,
          result: composed,
          eggs,
          message: t('cachedEggAnalysisShown'),
        });
        return { success: true, result: composed, cached: true };
      } catch (error) {
        const message = error?.message || String(error);
        this.store.dispatch({ type: 'notice', tabId, message });
        return { error: message };
      }
    }
    const ctx = this.store.beginOperation(
      tabId,
      'analysis',
      { ...options, eggs, cached: [...byEgg.values()], pending },
      ['sourceVersion', 'stage1Version']
    );
    if (!ctx) return { busy: true };
    this.store.commitOperation(ctx.token, { type: 'phase', phase: 'stage2' });
    try {
      return await this.runEggs(ctx, ctx.tab.stage1ContentAnalysis || result, ctx.tab.stage1Payload, eggs, [
        ...byEgg.values(),
      ]);
    } catch (error) {
      return this.fail(ctx, error);
    }
  }
  async runEggs(ctx, analysis, base, eggs, cached) {
    const { tab, inputs, token } = ctx;
    // A history record can supply Stage 1 metadata without a source body.
    // Prefer its snapshot only when it contains content; otherwise use the
    // fetched source captured in this operation, never a fresh active-tab read.
    const source = typeof base?.content === 'string' && base.content.trim() ? base : tab.extractedContent;
    if (typeof source?.content !== 'string' || !source.content.trim()) throw new Error(t('couldNotRetrieveContent'));
    const payload = {
      ...source,
      debugScope: tab.debugScope,
      stage: 2,
      force: true,
      contentAnalysis: analysis,
      eggs: inputs.pending || eggs,
      selectedEggs: eggs,
      cachedEggResults: cached,
      generateKnowledgeEntries: tab.generateKnowledgeEntries,
      outputLanguage: tab.backgroundJob?.detached ? source.outputLanguage ?? inputs.outputLanguage : inputs.outputLanguage,
      nutId: source.nutId || analysis.nutId || tab.currentNutId,
    };
    const response = await this.sendAnalysis(ctx, payload);
    if (!this.store.isOperationCurrent(token)) return { stale: true };
    if (response?.error) throw Object.assign(new Error(response.error), { code: response.errorCode, partialResult: response.partialResult });
    const cache = new Map(cached.map(r => [r.egg, r]));
    for (const r of [...(response.eggResults || []), ...(response.eggAnalysisCache || [])]) cache.set(r.egg, r);
    const result = {
      ...globalThis.NutEggAI.composeEggResults(analysis, eggs.map(egg => cache.get(egg)).filter(Boolean), [
        ...cache.values(),
      ]),
      stage: 'stage2',
      mode: response.mode ?? analysis.mode,
      nutId: response.nutId || payload.nutId,
      generateKnowledgeEntries: tab.generateKnowledgeEntries,
    };
    this.store.commitOperation(token, { type: 'analysisComplete', result, eggs });
    return { success: true, result };
  }
  async save(tabId, hatch) {
    const ctx = this.store.beginOperation(tabId, 'saving', { hatch }, ['resultRevision']);
    if (!ctx) return { busy: true };
    const { tab, token } = ctx;
    let requested = false;
    let received = false;
    const receipt = outcome =>
      this.store.dispatch({
        type: 'receipt',
        receipt: {
          tabId,
          pageGeneration: token.pageGeneration,
          resultRevision: tab.resultRevision,
          requestId: token.requestId,
          nutId: tab.currentNutId,
          time: Date.now(),
          ...outcome,
        },
      });
    try {
      const result = tab.analysisResult;
      if (hatch && globalThis.NutEggHelpers.selectedEggsNeedAnalysis(tab))
        throw new Error(t('hatchAnalyzeSelectedEggs'));
      const entries = hatch ? result?.newKnowledge || [] : [];
      if (hatch && !entries.length) throw new Error(t('noNewKnowledgeToAdd'));
      const content = tab.stage1Payload || tab.extractedContent;
      if (!content) throw new Error(t('couldNotExtractToSave'));
      const payload = {
        ...content,
        debugScope: tab.debugScope,
        analysis: result,
        summary: result?.summary || '',
        matchedEggs: result?.matchedEggs || [],
        newKnowledge: entries,
        nutId: tab.currentNutId ?? undefined,
        skipRaw: hatch && tab.nutCollected,
      };
      requested = true;
      const response = await this.service.sendMessage({ action: 'confirm', payload });
      received = true;
      receipt({ success: !!response?.success, outcome: response?.success ? 'saved' : 'failed' });
      if (!response?.success) throw new Error(response?.error || t('failedToSave'));
      this.service.markJobSaved?.(tab.backgroundJob?.id, tab.currentNutId, hatch);
      this.store.commitOperation(token, {
        type: 'saved',
        hatch,
        message: t(hatch ? 'eggHatchedSuccess' : 'nutCollectedVault', { mergedNote: '' }),
      });
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
    this.store.commitOperation(token, {
      type: 'questionStarted',
      id: token.requestId,
      question,
      scope: tab.followupScope,
    });
    const priorQa = [
      ...(tab.analysisResult?.eggResults || []).flatMap(r => r.keyQuestionAnswers || []),
      ...(tab.analysisResult?.customQuestionAnswers || []),
      ...tab.followUpQa.filter(q => !q.pending),
    ];
    try {
      const response = await this.service.sendMessage({
        action: 'ask',
        payload: {
          ...(tab.stage1Payload || tab.extractedContent),
          debugScope: tab.debugScope,
          questions: [question],
          scope: tab.followupScope,
          priorQa,
          outputLanguage: ctx.inputs.outputLanguage,
        },
      });
      if (response?.error) throw Object.assign(new Error(response.error), { code: response.errorCode, partialResult: response.partialResult });
      this.store.commitOperation(token, {
        type: 'questionAnswered',
        id: token.requestId,
        answer: { ...(response.answers?.[0] || { answer: t('noContentExtracted') }), execution: response.execution },
      });
    } catch (error) {
      return this.fail(ctx, error);
    }
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
      if (
        !this.store.commitOperation(ctx.token, {
          type: 'creationComplete',
          fileName,
          message: t('eggCreatedSelected', { egg: globalThis.NutEggHelpers.cleanEggName(fileName) }),
        })
      )
        return { stale: true };
      return { success: true, fileName };
    } catch (error) {
      return this.fail(ctx, error);
    }
  }
}
globalThis.NutEggServices = globalThis.NutEggServices || {};
globalThis.NutEggServices.PopupOperations = PopupOperations;
if (typeof module !== 'undefined' && module.exports) module.exports = { PopupOperations };
