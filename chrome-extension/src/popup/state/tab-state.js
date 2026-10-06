// Authoritative popup state. Reads are immutable; only events change records.
/**
 * @typedef {'discussion'|'extraction'|'history'|'analysis'|'saving'|'followup'|'creation'} PopupOperationKind
 * @typedef {{readonly tabId: number, readonly pageGeneration: number, readonly kind: PopupOperationKind,
 *   readonly requestId: number, readonly dependencies: Readonly<Record<string, number>>}} PopupOperationToken
 * @typedef {{readonly token: PopupOperationToken, readonly tab: Readonly<object>, readonly inputs: Readonly<object>}} PopupOperationContext
 */
const POPUP_OPERATION_KINDS = ['discussion', 'extraction', 'history', 'analysis', 'saving', 'followup', 'creation'];
function popupCopy(value) { return value == null ? value : structuredClone(value); }
function popupFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(popupFreeze);
    Object.freeze(value);
  }
  return value;
}
class TabStateManager {
  #tabs = new Map();
  #listeners = new Set();
  #sequence = 0;
  #activeTabId = null;
  #activationEpoch = 0;
  #debugSessionId = globalThis.crypto.randomUUID();
  constructor() {
    this.panelVisible = true;
    this.defaults = {};
    this.catalog = Object.freeze([]);
    this.catalogVersion = 0;
    this.receipts = Object.freeze([]);
    this.diagnosticsEnabled = false;
    this.diagnostics = [];
  }
  get activeTabId() { return this.#activeTabId; }
  get activationEpoch() { return this.#activationEpoch; }
  get debugInfo() { return this.getTab(this.activeTabId)?.debugInfo; }
  fresh(tabId, url = '') {
    return { tabId, url, pageGeneration: ++this.#sequence, revision: 0, sourceVersion: 0,
      debugScope: `${this.#debugSessionId}:${tabId}:${this.#sequence}`, debugInfo: null,
      stage1Version: 0, resultRevision: 0, selectionRevision: 0, intentRevision: 0, viewedRevision: 0,
      currentView: 'capture', extractedContent: null, analysisResult: null, stage1Payload: null,
      stage1ContentAnalysis: null, currentNutId: null, captureHistory: [], followUpQa: [],
      selectedEggs: [], preSelectedEggs: [], activeEggTab: null, customQuestions: '',
      followupDraft: '', newEggName: '', newEggDescription: '', customQuestionsScope: 'within', followupScope: 'within',
      discussionOverride: null,
      enabledSections: { discussion: false, ...this.defaults.enabledSections }, generateKnowledgeEntries: this.defaults.generateKnowledgeEntries !== false,
      eggHatched: false, nutCollected: false, errors: {}, warning: null, success: null,
      operations: {}, completion: null, currentTabLoading: false,
      presentation: { scroll: 0, eggsExpanded: false, captureEggsExpanded: false, questionsExpanded: false, createFormOpen: false, sectionsExpanded: false, reanalyzeSectionsExpanded: false, collapsible: {}, discussionComments: {} },
    };
  }
  ensure(tabId, url = '') {
    if (tabId == null) return null;
    if (!this.#tabs.has(tabId)) this.#tabs.set(tabId, popupFreeze(this.fresh(tabId, url)));
    return this.getTab(tabId);
  }
  getTab(tabId) { return this.#tabs.get(tabId) || null; }
  subscribe(listener) { this.#listeners.add(listener); return () => this.#listeners.delete(listener); }
  subscribeActivity(listener) { return this.subscribe(listener); }
  emit(event) { for (const listener of this.#listeners) listener(event); }
  trace(event, accepted, reason = 'accepted') {
    if (!this.diagnosticsEnabled) return;
    const { tabId, pageGeneration, requestId, kind } = event.token || event;
    this.diagnostics.push({ time: Date.now(), type: event.type, tabId, pageGeneration: pageGeneration ?? this.getTab(tabId)?.pageGeneration, requestId, kind, accepted, reason });
    if (this.diagnostics.length > 200) this.diagnostics.shift();
  }
  activateTab(tabId) {
    this.ensure(tabId);
    this.#activeTabId = tabId;
    const epoch = ++this.#activationEpoch;
    this.trace({ type: 'activated', tabId }, true);
    this.emit({ type: 'activated', tabId, epoch });
    return { tabId, epoch, pageGeneration: this.getTab(tabId).pageGeneration };
  }
  isActivationCurrent({ tabId, epoch, pageGeneration }) {
    return this.activeTabId === tabId && this.activationEpoch === epoch && this.getTab(tabId)?.pageGeneration === pageGeneration;
  }
  invalidateTab(tabId, url = '', remove = false) {
    if (remove) this.#tabs.delete(tabId);
    else this.#tabs.set(tabId, popupFreeze(this.fresh(tabId, url)));
    if (this.activeTabId === tabId) this.#activationEpoch++;
    this.trace({ type: 'invalidated', tabId }, true, remove ? 'closed' : 'new-page-generation');
    this.emit({ type: 'invalidated', tabId });
  }
  isBusy(tabId) { return ['analysis', 'saving', 'followup', 'creation'].some(k => this.getTab(tabId)?.operations[k]?.running); }
  beginOperation(tabId, kind, inputs = {}, dependencies = []) {
    if (!POPUP_OPERATION_KINDS.includes(kind)) throw new Error(`Invalid popup operation: ${kind}`);
    const tab = this.ensure(tabId);
    if (!tab || (['analysis', 'saving', 'followup', 'creation'].includes(kind) && this.isBusy(tabId))) return null;
    const token = popupFreeze({ tabId, pageGeneration: tab.pageGeneration, kind, requestId: ++this.#sequence,
      dependencies: Object.fromEntries(dependencies.map(key => [key, tab[key]])) });
    this.dispatch({ type: 'operationStarted', token, phase: kind === 'saving' ? inputs.hatch ? 'hatch' : 'collect' : undefined });
    return popupFreeze({ token, tab: popupCopy(tab), inputs: popupCopy(inputs) });
  }
  operationValidity(token) {
    const tab = this.getTab(token?.tabId);
    if (!tab) return 'closed';
    if (tab.pageGeneration !== token.pageGeneration) return 'page-generation';
    if (tab.operations[token.kind]?.requestId !== token.requestId) return 'superseded-request';
    if (Object.entries(token.dependencies).some(([key, version]) => tab[key] !== version)) return 'changed-dependency';
    if (!tab.operations[token.kind]?.running) return 'finished-operation';
    return 'accepted';
  }
  isOperationCurrent(token) { return this.operationValidity(token) === 'accepted'; }
  commitOperation(token, event) {
    const reason = this.operationValidity(token);
    const accepted = reason === 'accepted';
    if (!accepted) this.trace({ ...event, token }, false, reason);
    if (!accepted) return false;
    this.dispatch({ ...event, token, tabId: token.tabId });
    return true;
  }
  dispatch(event) {
    const tabId = event.tabId ?? event.token?.tabId;
    if (event.type === 'visibility') { this.panelVisible = event.visible; this.emit(event); return; }
    if (event.type === 'defaults') { this.defaults = popupFreeze(popupCopy(event.defaults)); return; }
    if (event.type === 'catalogRequested') { return ++this.catalogVersion; }
    if (event.type === 'catalog') {
      if (event.version !== this.catalogVersion) return;
      this.catalog = popupFreeze(popupCopy(event.eggs)); this.emit(event); return;
    }
    if (event.type === 'eggCreated') {
      this.catalogVersion++;
      this.catalog = popupFreeze([...this.catalog.filter(e => e.fileName.split('/').pop() !== event.egg.fileName.split('/').pop()), popupCopy(event.egg)]);
      this.emit(event); return;
    }
    if (event.type === 'environment') { this.environment = popupFreeze(popupCopy(event.value)); this.emit(event); return; }
    if (event.type === 'metrics') { this.metrics = popupFreeze(popupCopy(event.value)); this.emit(event); return; }
    if (event.type === 'receipt') {
      this.receipts = popupFreeze([...this.receipts, popupCopy(event.receipt)].slice(-50)); this.emit(event); return;
    }
    if (event.token && event.type !== 'operationStarted' && !this.isOperationCurrent(event.token)) {
      this.trace(event, false, this.operationValidity(event.token)); return;
    }
    const prev = this.getTab(tabId);
    if (!prev) return;
    if (event.type === 'debugInfo' && event.debugScope !== prev.debugScope) return;
    const next = popupCopy(prev);
    const kind = event.token?.kind;
    const finish = () => { next.operations[kind].running = false; };
    const result = (value, stage1 = false) => {
      next.analysisResult = popupCopy(value);
      next.presentation.discussionComments = {};
      next.resultRevision++;
      next.selectionRevision++;
      next.currentView = 'results'; next.followUpQa = []; next.eggHatched = false; next.nutCollected = false;
      next.currentNutId = value.nutId ?? next.currentNutId;
      if (stage1) { next.stage1Version++; next.stage1ContentAnalysis = popupCopy(value); }
    };
    switch (event.type) {
      case 'debugInfo': next.debugInfo = popupCopy(event.value); break;
      case 'operationStarted':
        next.operations[kind] = { requestId: event.token.requestId, running: true, phase: event.phase || (kind === 'analysis' ? 'stage1' : kind), dependencies: event.token.dependencies, startedAt: Date.now() };
        if (['analysis', 'saving', 'followup', 'creation'].includes(kind)) next.intentRevision++;
        delete next.errors[kind]; next.success = null;
        if (kind === 'extraction') next.warning = null;
        if (kind === 'analysis') next.completion = null;
        break;
      case 'phase': next.operations[kind].phase = event.phase; break;
      case 'captureProgress': next.operations[kind].progress = popupCopy(event.progress); break;
      case 'analysisInterim':
        result(event.result, true); next.stage1Payload = popupCopy(event.payload);
        next.selectedEggs = popupCopy(event.eggs || event.result.matchedEggs || []);
        break;
      case 'analysisComplete':
        result(event.result, event.stage1);
        if (event.payload) next.stage1Payload = popupCopy(event.payload);
        if (event.eggs) next.selectedEggs = popupCopy(event.eggs);
        if (event.history) next.captureHistory = popupCopy(event.history);
        else if (next.currentNutId != null) {
          const content = next.stage1Payload || next.extractedContent || {};
          const entry = { ...popupCopy(content), capturePayload: popupCopy(content), nutId: next.currentNutId, result: popupCopy(event.result), saved: 'analyzed', capturedAt: new Date().toISOString() };
          next.captureHistory = [entry, ...next.captureHistory.filter(h => h.nutId !== next.currentNutId)];
        }
        finish(); next.completion = { revision: next.resultRevision, completedAt: Date.now(), startedAt: next.operations[kind].startedAt };
        break;
      case 'cachedResult':
        result(event.result); next.selectedEggs = popupCopy(event.eggs);
        delete next.errors.analysis; delete next.errors.intent;
        next.success = event.message || null; break;
      case 'extracted':
        next.extractedContent = popupCopy(event.content); next.url = event.content.url || next.url;
        if (next.discussionOverride === null && event.content.discussion?.autoEnable) next.enabledSections.discussion = true;
        next.sourceVersion++; next.warning = event.warning || null; finish(); break;
      case 'discussionUpdated': {
        if ((!event.passive && !next.enabledSections.discussion) || !next.extractedContent) { finish(); break; }
        const previous = next.extractedContent.discussion || {};
        const byId = new Map((previous.items || []).map(item => [item.id, item]));
        for (const item of event.discussion.items || []) byId.set(item.id, popupCopy(item));
        let characters = 0;
        const items = [...byId.values()].slice(0, 300).filter(item => { characters += item.text.length; return characters <= 150000; });
        next.extractedContent.discussion = { ...previous, ...popupCopy(event.discussion), kind: previous.kind || event.discussion.kind,
          items, status: items.length ? (event.loading ? 'loading' : 'partial') : event.discussion.status,
          bodyLength: previous.bodyLength, autoEnable: previous.autoEnable || (previous.kind === 'forum' && previous.bodyLength < 500 && items.length >= 3 && items.reduce((n, item) => n + item.text.replace(/\s/g, '').length, 0) >= Math.max(800, previous.bodyLength * 3)),
          truncated: previous.truncated || event.discussion.truncated || byId.size > 300 || characters > 150000 };
        if (next.discussionOverride === null && next.extractedContent.discussion.autoEnable) next.enabledSections.discussion = true;
        if (!event.loading) finish();
        break;
      }
      case 'discussionCancelled':
        if (next.operations.discussion) next.operations.discussion.running = false;
        break;
      case 'historyLoaded':
        next.captureHistory = popupCopy(event.history); finish();
        if (event.select && event.history.length && !this.isBusy(tabId) &&
            (event.selectionIntent == null || event.selectionIntent === next.intentRevision)) this.applyHistory(next, event.history[0]);
        break;
      case 'historySelected':
        if (this.isBusy(tabId)) return;
        this.applyHistory(next, event.entry); break;
      case 'saved':
        finish(); next.eggHatched = event.hatch || next.eggHatched; next.nutCollected = true;
        next.success = event.message;
        next.captureHistory = next.captureHistory.map(h => h.nutId === next.currentNutId ? { ...h, saved: event.hatch ? 'saved' : 'skip' } : h);
        break;
      case 'questionStarted': next.followUpQa.push({ id: event.id, question: event.question, scope: event.scope, pending: true, answer: '…' }); next.followupDraft = ''; break;
      case 'questionAnswered':
        next.followUpQa = next.followUpQa.map(q => q.id === event.id ? { ...q, ...popupCopy(event.answer), pending: false } : q); finish(); break;
      case 'creationComplete': {
        const select = eggs => [...eggs.filter(egg => egg.split('/').pop() !== event.fileName.split('/').pop()), event.fileName];
        next.selectedEggs = select(next.selectedEggs);
        next.preSelectedEggs = select(next.preSelectedEggs);
        next.selectionRevision++;
        next.newEggName = ''; next.newEggDescription = '';
        next.presentation.createFormOpen = false; next.presentation.eggsExpanded = true; next.presentation.captureEggsExpanded = true;
        next.success = event.message; finish(); break;
      }
      case 'operationFinished': finish();
        if (kind === 'creation') { next.newEggName = ''; next.newEggDescription = ''; next.presentation.createFormOpen = false; }
        break;
      case 'operationFailed':
        finish(); next.errors[kind] = { message: event.error, code: event.code || null };
        if (kind === 'followup') next.followUpQa = next.followUpQa.map(q => q.pending ? { ...q, pending: false, answer: event.error } : q);
        break;
      case 'draft':
        for (const key of ['discussionOverride', 'enabledSections', 'generateKnowledgeEntries', 'selectedEggs', 'preSelectedEggs', 'activeEggTab', 'customQuestions', 'customQuestionsScope', 'followupScope', 'followupDraft', 'newEggName', 'newEggDescription', 'presentation']) {
          if (key in event.values) next[key] = popupCopy(event.values[key]);
        }
        break;
      case 'view':
        if (event.view === 'results' && !next.analysisResult) return;
        if (!['capture', 'results'].includes(event.view)) throw new Error('Invalid view');
        next.currentView = event.view; break;
      case 'activitySelected': next.currentView = next.analysisResult ? 'results' : 'capture'; break;
      case 'pageInfo': next.url = event.url || next.url; next.title = event.title || ''; next.currentTabLoading = event.loading; break;
      case 'loading': next.currentTabLoading = event.loading; break;
      case 'sourceJumpNotice':
        if (event.message) next.errors.navigation = { message: event.message };
        else delete next.errors.navigation;
        break;
      case 'notice': next.errors.intent = { message: event.message }; break;
      case 'viewed':
        if (tabId !== this.activeTabId || !this.panelVisible || next.currentView !== 'results' || !next.analysisResult || next.resultRevision !== event.revision || next.operations.analysis?.running || next.viewedRevision === event.revision) return;
        next.viewedRevision = event.revision; break;
      default: throw new Error(`Unknown popup event: ${event.type}`);
    }
    for (const operation of Object.values(next.operations)) {
      if (operation.running && Object.entries(operation.dependencies || {}).some(([key, value]) => next[key] !== value)) operation.running = false;
    }
    next.revision++;
    this.#tabs.set(tabId, popupFreeze(next));
    this.trace(event, true);
    this.emit({ ...event, tabId });
  }
  applyHistory(tab, entry) {
    if (!entry?.result) return;
    tab.analysisResult = popupCopy(entry.result); tab.resultRevision++; tab.selectionRevision++;
    tab.presentation.discussionComments = {};
    tab.currentView = 'results'; tab.completion = null; tab.followUpQa = [];
    tab.currentNutId = entry.nutId; tab.nutCollected = ['saved', 'skip'].includes(entry.saved); tab.eggHatched = entry.saved === 'saved';
    tab.stage1Version++;
    tab.stage1ContentAnalysis = popupCopy(entry.result);
    if (entry.capturePayload?.enabledSections) tab.enabledSections = { ...tab.enabledSections, ...popupCopy(entry.capturePayload.enabledSections) };
    tab.stage1Payload = { ...(entry.capturePayload || {}), url: entry.capturePayload?.url || entry.url || tab.url, title: entry.title, content: entry.content || tab.extractedContent?.content || '', sourceType: entry.sourceType || 'generic', nutId: entry.nutId };
    if (typeof entry.content === 'string' && entry.content.trim()) {
      tab.extractedContent = { ...tab.stage1Payload, metadata: { ...entry.capturePayload?.metadata, ...(entry.author ? { author: entry.author } : {}), ...(entry.publishedAt ? { published: entry.publishedAt } : {}) } };
      tab.sourceVersion++;
      tab.warning = globalThis.NutEggHelpers?.getExtractionWarning?.(tab.extractedContent) || null;
    }
    if (typeof tab.extractedContent?.content === 'string' && tab.extractedContent.content.trim()) delete tab.errors.extraction;
    tab.selectedEggs = popupCopy(entry.result.matchedEggs || []);
  }
  getAnalysisActivity() {
    return [...this.#tabs.values()].flatMap(tab => {
      const job = tab.operations.analysis;
      if (!job?.running && (!tab.completion || tab.completion.revision <= tab.viewedRevision)) return [];
      return [{ tabId: tab.tabId, title: tab.extractedContent?.title, url: tab.url, running: !!job?.running,
        revision: job?.running ? job.requestId : tab.completion.revision, startedAt: job?.startedAt, completedAt: tab.completion?.completedAt }];
    });
  }
  viewModel(tabId = this.activeTabId) {
    const tab = this.getTab(tabId) || this.fresh(null);
    const analysis = tab.operations.analysis;
    const error = Object.values(tab.errors).at(-1);
    const selectedEggs = new Set(tab.selectedEggs), preSelectedEggs = new Set(tab.preSelectedEggs);
    for (const set of [selectedEggs, preSelectedEggs]) for (const key of ['add', 'delete', 'clear']) Object.defineProperty(set, key, { value: () => { throw new Error('Dispatch egg selections'); } });
    return Object.freeze({ ...tab, activeTabId: tab.tabId, allEggs: this.catalog, selectedEggs, preSelectedEggs,
      isStage1: (r = tab.analysisResult) => r?.stage === 'stage1' || r?.mode === 'chrome',
      isAnalyzing: !!analysis?.running, analyzingEggs: !!analysis?.running && analysis.phase === 'stage2',
      savingToVault: !!tab.operations.saving?.running, busy: this.isBusy(tab.tabId),
      extractionPending: !!tab.operations.extraction?.running, extractionFailed: !!tab.errors.extraction,
      discussionPending: !!tab.operations.discussion?.running,
      warning: tab.extractedContent?.discussion?.kind === 'forum' && tab.extractedContent.discussion.autoEnable && tab.extractedContent.discussion.bodyLength < 500 && tab.enabledSections.discussion !== true
        ? (globalThis.t?.('discussionShortBody') || tab.warning)
        : tab.extractedContent?.transcriptAvailable === false && tab.enabledSections.discussion === true
          ? globalThis.t?.('discussionOnlyWarning') : tab.warning,
      error: error?.message || null, errorCode: error?.code || null,
    });
  }
}
globalThis.NutEggState = globalThis.NutEggState || {};
globalThis.NutEggState.TabStateManager = TabStateManager;
if (typeof module !== 'undefined' && module.exports) module.exports = { TabStateManager };
