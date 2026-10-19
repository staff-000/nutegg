const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const core = new Function(fs.readFileSync(require.resolve('../dist/ai-core.js'), 'utf8') + '\nreturn NutEggAI;')();
const { deferred, fixture } = require('./helpers/popup-fixture');
const { createMockRoot } = require('./helpers/mock-dom');
const { MetricsComponent } = require('../src/popup/ui/metrics');
const { SettingsState } = require('../src/popup/state/settings-state');

test('AI diagnostics count overlapping requests and prompt words, and release failed calls', async () => {
  const before = core.getAIDebugInfo(), a = deferred(), b = deferred();
  const first = core.trackAIRequest('one two three', () => a.promise), second = core.trackAIRequest('你好 world', () => b.promise);
  assert.equal(core.getAIDebugInfo().activeCalls, before.activeCalls + 2);
  assert.equal(core.getAIDebugInfo().totalCalls, before.totalCalls + 2);
  assert.equal(core.getAIDebugInfo().promptWords, before.promptWords + 6);
  assert.equal(core.getAIDebugInfo().lastPromptWords, 3);
  assert.deepEqual(Object.keys(core.getAIDebugInfo()).sort(), ['activeCalls', 'cancelledCalls', 'completedCalls', 'diagnosticsVersion', 'epoch', 'failedCalls', 'lastCallAt', 'lastPromptWords', 'promptWords', 'startedAt', 'totalCalls', 'waitingCalls']);
  a.resolve('done'); await first; assert.equal(core.getAIDebugInfo().activeCalls, before.activeCalls + 1);
  const failure = assert.rejects(second, /failed/); b.reject(new Error('failed')); await failure;
  assert.equal(core.getAIDebugInfo().activeCalls, before.activeCalls);
});

test('real AI transport is instrumented, while missing credentials do not count as API calls', async t => {
  const previous = global.fetch; t.after(() => { global.fetch = previous; });
  const waiting = deferred(); global.fetch = () => waiting.promise;
  const config = core.resolveConfig({ aiProvider: 'openai', aiApiKey: 'test' });
  const scope = 'transport-tab';
  const before = core.getAIDebugInfo(), pending = core.chatAI('A real rendered prompt', 100, config, scope);
  assert.equal(core.getAIDebugInfo().activeCalls, before.activeCalls + 1);
  assert.equal(core.getAIDebugInfo(scope).activeCalls, 1);
  assert.equal(core.getAIDebugInfo(scope).promptWords, 4);
  waiting.resolve({ ok: true, json: async () => ({ choices: [{ message: { content: 'Answer' } }] }) });
  assert.equal(await pending, 'Answer'); assert.equal(core.getAIDebugInfo().activeCalls, before.activeCalls);
  const after = core.getAIDebugInfo();
  await assert.rejects(core.chatAI('Unused', 100, { ...config, client: { ...config.client, apiKey: '' } }, scope), /No AI API key/);
  assert.equal(core.getAIDebugInfo().totalCalls, after.totalCalls);
  assert.equal(core.getAIDebugInfo(scope).totalCalls, 1);
});

test('overlapping tab scopes count their own calls and words, including failures', async () => {
  const a = deferred(), b = deferred();
  const first = core.trackAIRequest('one two', () => a.promise, 'tab-a');
  const second = core.trackAIRequest('你好 world', () => b.promise, 'tab-b');
  assert.equal(core.getAIDebugInfo('tab-a').activeCalls, 1);
  assert.equal(core.getAIDebugInfo('tab-a').promptWords, 2);
  assert.equal(core.getAIDebugInfo('tab-b').activeCalls, 1);
  assert.equal(core.getAIDebugInfo('tab-b').promptWords, 3);
  assert.equal(core.getAIDebugInfo('unknown-tab').totalCalls, 0);
  assert.equal(core.getAIDebugInfo('').totalCalls, 0);
  a.resolve(); await first;
  assert.equal(core.getAIDebugInfo('tab-b').activeCalls, 1);
  const failure = assert.rejects(second, /failed/); b.reject(new Error('failed')); await failure;
  await core.trackAIRequest('next', async () => {}, 'tab-a');
  assert.equal(core.getAIDebugInfo('tab-a').totalCalls, 2);
  assert.equal(core.getAIDebugInfo('tab-a').promptWords, 3);
  assert.equal(core.getAIDebugInfo('tab-a').lastPromptWords, 1);
  assert.equal(core.getAIDebugInfo('tab-b').totalCalls, 1);
  assert.equal(core.getAIDebugInfo('tab-b').activeCalls, 0);
});

test('standalone analysis chunks and follow-up share the originating tab scope', async t => {
  const previous = global.fetch; t.after(() => { global.fetch = previous; });
  let requests = 0;
  global.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    assert.equal(body.debugScope, undefined, 'diagnostic IDs are never sent to the AI provider');
    requests++;
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ titleVerdict: 'Summary', coreSummary: ['One point'], mindMap: [], answers: [{ answer: 'Answer' }] }) } }] }) };
  };
  const payload = { debugScope: 'standalone-tab', title: 'Article', url: 'https://example.test', content: 'paragraph words '.repeat(100), sourceType: 'article' };
  const settings = { aiProvider: 'openai', aiApiKey: 'test', chunkWindowChars: 300 };
  await core.analyzeContentStandalone(payload, settings);
  const analysisCalls = requests;
  assert(analysisCalls > 1, 'chunking and aggregation each count actual AI calls');
  await core.askFollowUpStandalone(payload, 'Why?', [], settings);
  assert.equal(core.getAIDebugInfo(payload.debugScope).totalCalls, requests);
  assert.equal(requests, analysisCalls + 1);
  assert.equal(core.getAIDebugInfo(payload.debugScope).activeCalls, 0);
});

test('idle tab counters are bounded without dropping a running tab', async () => {
  const waiting = deferred();
  const pending = core.trackAIRequest('still running', () => waiting.promise, 'long-running-tab');
  for (let i = 0; i < 260; i++) await core.trackAIRequest('word', async () => {}, `closed-tab-${i}`);
  assert.equal(core.getAIDebugInfo('long-running-tab').activeCalls, 1);
  assert.equal(core.getAIDebugInfo('closed-tab-0').totalCalls, 0);
  assert.equal(core.getAIDebugInfo('closed-tab-259').totalCalls, 1);
  waiting.resolve(); await pending;
  assert.equal(core.getAIDebugInfo('long-running-tab').activeCalls, 0);
});

test('debug preference defaults off, renders tab counters only when enabled and hides when disabled', () => {
  assert.equal(new SettingsState().debugInfo, false);
  const root = createMockRoot(), ui = new MetricsComponent(root), panel = root.getElementById('debug-info');
  ui.renderDebug({ mode: 'chrome', activeCalls: 2, totalCalls: 8, promptWords: 12000, lastPromptWords: 500 }, false);
  assert(panel.classList.contains('hidden')); assert.equal(panel.textContent, '');
  ui.renderDebug({ mode: 'chrome', activeCalls: 2, totalCalls: 8, promptWords: 12000, lastPromptWords: 500 }, true);
  assert.match(panel.textContent, /Chrome.*This tab.*2 AI calls running.*8 calls total/);
  assert.match(panel.textContent, /12,000 total.*500 last call/);
  ui.renderDebug({ unavailable: true }, true); assert.match(panel.textContent, /unavailable/);
  ui.renderDebug(null, false); assert.equal(panel.textContent, '');
});

test('debug info displays settings and status when enabled', () => {
  const root = createMockRoot(), ui = new MetricsComponent(root), panel = root.getElementById('debug-info');
  const view = {
    operations: { analysis: { running: false } },
    analysisResult: { stage: 'stage1', conversation: { format: 'interview' }, matchedEggs: ['tech.md', 'ai.md'] },
    extractedContent: { content: 'a'.repeat(35000), isVideo: true },
    enabledSections: { titleVerdict: true, coreSummary: true, mindMap: true },
    optimizeForConversation: true,
  };
  const settings = {
    isChromeMode: () => true,
    chromeAiProvider: 'google',
    chromeAiModel: 'gemini-2.5-flash',
    analysisMode: 'full',
  };
  ui.renderDebug({ mode: 'chrome', activeCalls: 0, totalCalls: 5, promptWords: 24000, lastPromptWords: 8000 }, true, { view, settings });
  assert.match(panel.textContent, /Chrome.*5 calls total/);
  assert.match(panel.textContent, /Connection.*Mode: Chrome.*Obsidian: Offline.*Chrome AI: Ready \(google \/ gemini-2\.5-flash\)/);
  assert.match(panel.textContent, /Settings.*Backend: Chrome \(google \/ gemini-2\.5-flash\).*Analysis: full.*Dialogue enhance: ON/);
  assert.match(panel.textContent, /Status.*Pipeline: complete \(stage1\).*35,000 chars \(2 chunks\).*Video.*Format: interview.*Eggs: 2 matched/);
});

test('debug info shows Dialogue enhance OFF when optimizeForConversation is false', () => {
  const root = createMockRoot(), ui = new MetricsComponent(root), panel = root.getElementById('debug-info');
  const view = { optimizeForConversation: false };
  const settings = { isChromeMode: () => true, optimizeForConversation: false };
  ui.renderDebug({ mode: 'chrome', activeCalls: 0, totalCalls: 2, promptWords: 5000, lastPromptWords: 2000 }, true, { view, settings });
  assert.match(panel.textContent, /Dialogue enhance: OFF/);
});

test('debug info shows Obsidian connection status and AI readiness', () => {
  const root = createMockRoot(), ui = new MetricsComponent(root), panel = root.getElementById('debug-info');
  const view = { analysisResult: { stage: 'stage2', mode: 'obsidian' } };
  const settings = {
    connectionMode: 'obsidian',
    isChromeMode: () => false,
    serverOnline: true,
    obsidianPluginVersion: '0.3.0',
    obsidianAiConfigured: true,
    chromeAiConfigured: true,
    chromeAiProvider: 'google',
    chromeAiModel: 'gemini-2.5-flash',
  };
  ui.renderDebug({ mode: 'obsidian', activeCalls: 0, totalCalls: 4 }, true, { view, settings });
  assert.match(panel.textContent, /Connection.*Mode: Obsidian.*Obsidian: Connected \(v0\.3\.0\) \[AI ready\].*Chrome AI: Ready \(google \/ gemini-2\.5-flash\)/);
  assert.match(panel.textContent, /Pipeline: complete \(stage2\) \[obsidian mode\]/);
});

test('debug polling is opt-in and rejects stale backend responses and disabled preference', async () => {
  const { store, service, operations } = fixture(); let requests = 0;
  store.settings = { debugInfo: false, isChromeMode: () => true };
  const waiting = deferred(); service.sendMessage = () => { requests++; return waiting.promise; };
  await operations.refreshDebugInfo(); assert.equal(requests, 0);
  store.settings.debugInfo = true; const pending = operations.refreshDebugInfo();
  store.settings.debugInfo = false; waiting.resolve({ activeCalls: 5 }); await pending;
  assert.equal(store.debugInfo, null);
  store.settings.debugInfo = true; service.sendMessage = async () => ({ mode: 'chrome', activeCalls: 2 });
  await operations.refreshDebugInfo(); assert.equal(store.debugInfo.activeCalls, 2);
});

test('debug polling follows tab switches and rejects responses for old page generations', async () => {
  const { store, service, operations } = fixture();
  store.settings = { debugInfo: true, isChromeMode: () => true };
  const polls = [];
  service.sendMessage = message => { const d = deferred(); polls.push({ message, ...d }); return d.promise; };
  const scope1 = store.getTab(1).debugScope;
  const first = operations.refreshDebugInfo();
  store.activateTab(2);
  const second = operations.refreshDebugInfo();
  assert.equal(polls.length, 1, 'panel aggregate polling is deduplicated across tab switches');
  await second;
  polls[0].resolve({ mode: 'chrome', totalCalls: 9, promptWords: 90 }); await first;
  const current = operations.refreshDebugInfo();
  assert.equal(polls[0].message.debugScope, scope1);
  assert.equal(polls[1].message.debugScope, store.getTab(2).debugScope);
  polls[1].resolve({ mode: 'chrome', totalCalls: 2, promptWords: 20 }); await current;
  assert.equal(store.debugInfo.totalCalls, 2);
  store.activateTab(1); assert.equal(store.debugInfo.totalCalls, 9);
  const oldPage = operations.refreshDebugInfo();
  store.invalidateTab(1, 'https://new.test');
  assert.notEqual(store.getTab(1).debugScope, scope1);
  assert.equal(store.debugInfo, null);
  polls[2].resolve({ mode: 'chrome', totalCalls: 99 }); await oldPage;
  assert.equal(store.debugInfo, null);
});

test('analysis, saving and follow-up requests carry their originating tab scope', async () => {
  const { store, service, operations, calls } = fixture();
  const scope = store.getTab(1).debugScope;
  const analyze = operations.analyze(1, { chromeMode: true });
  assert.equal(calls[0].payload.debugScope, scope);
  calls[0].resolve({ stage: 'stage1', coreSummary: [], mindMap: [], matchedEggs: [] }); await analyze;
  const messages = [];
  service.sendMessage = async message => { messages.push(message); return { success: true, answers: [{ answer: 'Answer' }] }; };
  await operations.followup(1, 'Why?');
  await operations.save(1, false);
  for (const message of messages) assert.equal(message.payload.debugScope, scope);
});

test('background debug messages return Chrome counters or bounded Obsidian snapshots without AI calls', async () => {
  const vm = require('node:vm'); let listener, requests = 0;
  const stats = { activeCalls: 2, totalCalls: 4, promptWords: 100, lastPromptWords: 30 };
  const context = vm.createContext({
    NutEggAI: { combineAIDebugInfo: core.combineAIDebugInfo, getAIDebugInfo: scope => { assert.equal(scope, 'tab:1'); return stats; }, normalizeAIDebugScope: core.normalizeAIDebugScope, restoreChromeApiPreferences: core.restoreChromeApiPreferences }, importScripts() {}, console: { log() {} }, AbortSignal, URL,
    chrome: { storage: { local: { get: async () => ({ executionSchemaVersion: 2, serverPort: 12345, connectionMode: 'obsidian', 'obsidianConnection:http://127.0.0.1:12345:test': 'approved-test-credential' }), set: async () => {} } }, action: { setPopup() {} }, sidePanel: { setPanelBehavior: async () => {} },
      runtime: { getURL: path => `chrome-extension://${'a'.repeat(32)}${path}`, onMessage: { addListener(fn) { listener = fn; } }, onConnect: { addListener() {} } } },
    fetch: async url => {
      if (url.endsWith('/health')) return { ok: true, json: async () => ({ instanceId: 'test' }) };
      requests++; assert.equal(url, 'http://127.0.0.1:12345/debug-info?scope=tab%3A1'); return { ok: true, json: async () => stats };
    },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../src/background/service-worker.js'), 'utf8'), context);
  const send = mode => new Promise(resolve => listener({ action: 'get-debug-info', mode, debugScope: 'tab:1' }, {}, resolve));
  const chromeStats = await send('chrome'); assert.equal(chromeStats.mode, 'chrome'); assert.equal(chromeStats.activeCalls, 2); assert.equal(requests, 0);
  const obsidianStats = await send('obsidian'); assert.equal(obsidianStats.mode, 'obsidian'); assert.equal(obsidianStats.promptWords, 200); assert.equal(requests, 1);
  context.fetch = async () => ({ ok: false });
  assert.equal((await send('obsidian')).unavailable, true);
});

test('Bilibili debug provenance distinguishes legacy captures and never prints URLs or account fields', () => {
  const root = createMockRoot(), ui = new MetricsComponent(root), panel = root.getElementById('debug-info');
  const view = { extractedContent: { sourceType: 'bilibili', content: 'Caption', metadata: {} } };
  ui.renderDebug(null, true, { view });
  assert.match(panel.textContent, /caption identity: not assessed/);
  view.extractedContent.metadata.subtitle_provenance = JSON.stringify({ version: 1, outcome: 'verified', route: 'legacy_player', requestedVideoId: 'BV13fg56xE21', requestedCid: '40842559501', validatedBvid: 'BV13fg56xE21', validatedCid: '40842559501', trackId: '77', account: 'private', url: 'https://example.test/?signature=secret' });
  ui.renderDebug(null, true, { view });
  assert.match(panel.textContent, /verified.*legacy_player.*track 77/);
  assert.doesNotMatch(panel.textContent, /private|signature|secret|https/);
  view.extractedContent.metadata.subtitle_provenance = '{invalid';
  ui.renderDebug(null, true, { view });
  assert.match(panel.textContent, /caption identity: not assessed/);
});

test('panel AI counters separate real execution, provider waiting, successes, failures and cancellations', async () => {
  const panel = crypto.randomUUID(), scope = `${panel}:1:1`, other = `${crypto.randomUUID()}:2:1`;
  const a = deferred(), b = deferred(), c = deferred();
  let start;
  const controller = new AbortController();
  const first = core.trackAIRequest('A', () => a.promise, scope);
  const second = core.trackAIRequest('B', run => { start = run; return b.promise; }, `${panel}:2:2`, { queued: true });
  const third = core.trackAIRequest('C', () => c.promise, `${panel}:3:3`, { queued: true, signal: controller.signal });
  await core.trackAIRequest('Other panel', async () => 'Answer', other);
  let stats = core.getAIDebugInfo(scope).panel;
  assert.equal(stats.activeCalls, 1); assert.equal(stats.waitingCalls, 2); assert.equal(stats.totalCalls, 3);
  a.resolve('A'); await first;
  start(); start();
  stats = core.getAIDebugInfo(scope).panel;
  assert.equal(stats.activeCalls, 1); assert.equal(stats.waitingCalls, 1); assert.equal(stats.completedCalls, 1);
  controller.abort();
  assert.equal(core.getAIDebugInfo(scope).panel.cancelledCalls, 1);
  const rejected = assert.rejects(second, /provider failed/);
  b.reject(new Error('provider failed')); await rejected;
  const cancelled = assert.rejects(third); c.resolve('Too late'); await cancelled;
  stats = core.getAIDebugInfo(scope).panel;
  assert.equal(stats.activeCalls, 0); assert.equal(stats.waitingCalls, 0);
  assert.equal(stats.completedCalls, 1); assert.equal(stats.failedCalls, 1); assert.equal(stats.cancelledCalls, 1);
});

test('panel aggregates survive per-page eviction and expose empty owners without counting delegation', async () => {
  const otherCore = new Function(fs.readFileSync(require.resolve('../dist/ai-core.js'), 'utf8') + '\nreturn NutEggAI;')();
  const panel = crypto.randomUUID(), scope = `${panel}:1:1`;
  for (let n = 1; n <= 260; n++) await core.trackAIRequest('Content', async () => 'Answer', `${panel}:1:${n}`);
  assert.equal(core.getAIDebugInfo(scope).totalCalls, 0, 'old page scope was pruned');
  const combined = core.combineAIDebugInfo(core.getAIDebugInfo(scope), otherCore.getAIDebugInfo(scope));
  assert.equal(combined.panel.available, true);
  assert.equal(combined.panel.completedCalls, 260);
  assert.equal(combined.panel.totalCalls, 260);
  assert.equal(otherCore.getAIDebugInfo(scope).panel.totalCalls, 0);
  const legacy = core.combineAIDebugInfo(core.getAIDebugInfo(scope), { activeCalls: 1, totalCalls: 2 });
  assert.equal(legacy.panel.available, false);
  assert.equal(legacy.panel.completedCalls, undefined);
  assert.equal(legacy.completedCalls, undefined);
});

test('retry attempts count separately and timeouts are failures rather than successful completions', async () => {
  const scope = `${crypto.randomUUID()}:1:1`;
  for (let n = 0; n < 2; n++) await assert.rejects(core.trackAIRequest('Retry', async () => { throw new Error('Transient'); }, scope));
  await core.trackAIRequest('Retry', async () => 'Success', scope);
  const controller = new AbortController(), pending = deferred();
  const timeout = core.trackAIRequest('Timeout', () => pending.promise, scope, { signal: controller.signal });
  controller.abort(new DOMException('Timed out', 'TimeoutError'));
  const rejected = assert.rejects(timeout); pending.resolve('Late'); await rejected;
  const stats = core.getAIDebugInfo(scope);
  assert.equal(stats.totalCalls, 4); assert.equal(stats.completedCalls, 1); assert.equal(stats.failedCalls, 3); assert.equal(stats.cancelledCalls, 0);
});

test('debug displays panel counters, current-tab details, unavailable legacy data and backend resets', () => {
  const root = createMockRoot(), ui = new MetricsComponent(root), panel = root.getElementById('debug-info');
  ui.renderDebug({ mode: 'chrome', diagnosticsVersion: 2, activeCalls: 1, waitingCalls: 0, totalCalls: 2, completedCalls: 1, failedCalls: 0, cancelledCalls: 0,
    panel: { available: true, activeCalls: 3, waitingCalls: 4, completedCalls: 5, failedCalls: 1, cancelledCalls: 2, reset: true } }, true);
  assert.match(panel.textContent, /Panel AI requests: 3 running.*4 waiting.*5 completed.*1 failed.*2 cancelled/);
  assert.match(panel.textContent, /This tab AI requests: 1 running/);
  assert.match(panel.textContent, /counters reset/);
  ui.renderDebug({ mode: 'obsidian', activeCalls: 0, totalCalls: 1 }, true);
  assert.match(panel.textContent, /Panel AI request counters unavailable/);
  assert.doesNotMatch(panel.textContent, /0 completed/);
});

test('panel diagnostics detect backend reset and reject mismatched panel sessions', async () => {
  const { store, service, operations } = fixture();
  store.settings = { debugInfo: true, isChromeMode: () => false };
  const value = epoch => ({ diagnosticsVersion: 2, panel: { available: true, sessionId: store.debugSessionId, epochs: { chrome: 'worker', obsidian: epoch }, completedCalls: 1 } });
  service.sendMessage = async () => value('server1');
  await operations.refreshDebugInfo();
  assert.equal(store.debugInfo.panel.reset, false);
  store.activateTab(2); service.sendMessage = async () => value('server2');
  await operations.refreshDebugInfo();
  assert.equal(store.debugInfo.panel.reset, true);
  service.sendMessage = async () => ({ panel: { available: true, sessionId: crypto.randomUUID(), completedCalls: 999 } });
  await operations.refreshDebugInfo();
  assert.equal(store.debugInfo.panel.completedCalls, 1);
});

test('missing telemetry is not turned into zero successes, and session subtotals are not passed off as complete', async () => {
  const scope = `${crypto.randomUUID()}:1:1`;
  const local = core.getAIDebugInfo(scope);
  const incomplete = core.combineAIDebugInfo(local, { ...local, completedCalls: undefined });
  assert.equal(incomplete.panel.available, false);
  assert.equal(incomplete.completedCalls, undefined);
  const { store, service, operations } = fixture(); let chromeOnly = false;
  store.settings = { debugInfo: true, isChromeMode: () => chromeOnly };
  service.sendMessage = async () => ({ panel: { available: true, sessionId: store.debugSessionId,
    epochs: { chrome: 'worker', ...(!chromeOnly ? { obsidian: 'plugin' } : {}) }, completedCalls: chromeOnly ? 1 : 2 } });
  await operations.refreshDebugInfo();
  assert.equal(store.debugInfo.panel.available, true);
  chromeOnly = true;
  await operations.refreshDebugInfo();
  assert.equal(store.debugInfo.panel.available, false);
});

test('debug responses from an obsolete mode generation cannot win after switching away and back', async () => {
  const { store, service, operations } = fixture(); let chromeOnly = true;
  store.settings = { debugInfo: true, isChromeMode: () => chromeOnly };
  const polls = [];
  service.sendMessage = () => { const d = deferred(); polls.push(d); return d.promise; };
  const oldChrome = operations.refreshDebugInfo();
  chromeOnly = false; const obsidian = operations.refreshDebugInfo();
  chromeOnly = true; await operations.refreshDebugInfo();
  polls[0].resolve({ mode: 'chrome', totalCalls: 99 }); await oldChrome;
  polls[1].resolve({ mode: 'obsidian', totalCalls: 88 }); await obsidian;
  assert.equal(store.debugInfo, null);
});
