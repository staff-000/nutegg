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
  assert.deepEqual(Object.keys(core.getAIDebugInfo()).sort(), ['activeCalls', 'lastPromptWords', 'promptWords', 'startedAt', 'totalCalls']);
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
  await assert.rejects(core.chatAI('Unused', 100, { ...config, apiKey: '' }, scope), /No AI API key/);
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
  assert.equal(polls.length, 2, 'a slow poll from another tab does not block the current tab');
  assert.equal(polls[0].message.debugScope, scope1);
  assert.equal(polls[1].message.debugScope, store.getTab(2).debugScope);
  polls[1].resolve({ mode: 'chrome', totalCalls: 2, promptWords: 20 }); await second;
  polls[0].resolve({ mode: 'chrome', totalCalls: 9, promptWords: 90 }); await first;
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
    NutEggAI: { getAIDebugInfo: scope => { assert.equal(scope, 'tab:1'); return stats; }, normalizeAIDebugScope: core.normalizeAIDebugScope }, importScripts() {}, console: { log() {} }, AbortSignal, URL,
    chrome: { storage: { local: { get: async () => ({ serverPort: 12345, connectionMode: 'obsidian', 'obsidianConnection:http://127.0.0.1:12345': 'approved-test-credential' }) } }, action: { setPopup() {} }, sidePanel: { setPanelBehavior: async () => {} },
      runtime: { getURL: path => `chrome-extension://${'a'.repeat(32)}${path}`, onMessage: { addListener(fn) { listener = fn; } }, onConnect: { addListener() {} } } },
    fetch: async url => { requests++; assert.equal(url, 'http://127.0.0.1:12345/debug-info?scope=tab%3A1'); return { ok: true, json: async () => stats }; },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../src/background/service-worker.js'), 'utf8'), context);
  const send = mode => new Promise(resolve => listener({ action: 'get-debug-info', mode, debugScope: 'tab:1' }, {}, resolve));
  const chromeStats = await send('chrome'); assert.equal(chromeStats.mode, 'chrome'); assert.equal(chromeStats.activeCalls, 2); assert.equal(requests, 0);
  const obsidianStats = await send('obsidian'); assert.equal(obsidianStats.mode, 'obsidian'); assert.equal(obsidianStats.promptWords, 100); assert.equal(requests, 1);
  context.fetch = async () => ({ ok: false });
  assert.equal((await send('obsidian')).unavailable, true);
});
