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
  const before = core.getAIDebugInfo(), pending = core.chatAI('A real rendered prompt', 100, config);
  assert.equal(core.getAIDebugInfo().activeCalls, before.activeCalls + 1);
  waiting.resolve({ ok: true, json: async () => ({ choices: [{ message: { content: 'Answer' } }] }) });
  assert.equal(await pending, 'Answer'); assert.equal(core.getAIDebugInfo().activeCalls, before.activeCalls);
  const after = core.getAIDebugInfo();
  await assert.rejects(core.chatAI('Unused', 100, { ...config, apiKey: '' }), /No AI API key/);
  assert.equal(core.getAIDebugInfo().totalCalls, after.totalCalls);
});

test('debug preference defaults off, renders session counters only when enabled and hides when disabled', () => {
  assert.equal(new SettingsState().debugInfo, false);
  const root = createMockRoot(), ui = new MetricsComponent(root), panel = root.getElementById('debug-info');
  ui.renderDebug({ mode: 'chrome', activeCalls: 2, totalCalls: 8, promptWords: 12000, lastPromptWords: 500 }, false);
  assert(panel.classList.contains('hidden')); assert.equal(panel.textContent, '');
  ui.renderDebug({ mode: 'chrome', activeCalls: 2, totalCalls: 8, promptWords: 12000, lastPromptWords: 500 }, true);
  assert.match(panel.textContent, /Chrome session.*2 AI calls running.*8 calls total/);
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
  assert.equal(store.debugInfo, undefined);
  store.settings.debugInfo = true; service.sendMessage = async () => ({ mode: 'chrome', activeCalls: 2 });
  await operations.refreshDebugInfo(); assert.equal(store.debugInfo.activeCalls, 2);
});

test('background debug messages return Chrome counters or bounded Obsidian snapshots without AI calls', async () => {
  const vm = require('node:vm'); let listener, requests = 0;
  const stats = { activeCalls: 2, totalCalls: 4, promptWords: 100, lastPromptWords: 30 };
  const context = vm.createContext({
    NutEggAI: { getAIDebugInfo: () => stats }, importScripts() {}, console: { log() {} }, AbortSignal,
    chrome: { storage: { local: { get: async () => ({ serverPort: 12345 }) } }, action: { setPopup() {} }, sidePanel: { setPanelBehavior: async () => {} },
      runtime: { onMessage: { addListener(fn) { listener = fn; } }, onConnect: { addListener() {} } } },
    fetch: async url => { requests++; assert.equal(url, 'http://127.0.0.1:12345/debug-info'); return { ok: true, json: async () => stats }; },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../src/background/service-worker.js'), 'utf8'), context);
  const send = mode => new Promise(resolve => listener({ action: 'get-debug-info', mode }, {}, resolve));
  const chromeStats = await send('chrome'); assert.equal(chromeStats.mode, 'chrome'); assert.equal(chromeStats.activeCalls, 2); assert.equal(requests, 0);
  const obsidianStats = await send('obsidian'); assert.equal(obsidianStats.mode, 'obsidian'); assert.equal(obsidianStats.promptWords, 100); assert.equal(requests, 1);
  context.fetch = async () => ({ ok: false });
  assert.equal((await send('obsidian')).unavailable, true);
});
