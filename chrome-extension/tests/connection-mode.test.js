const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function worker(initial = {}, { online = true } = {}) {
  const stored = { ...initial }, http = [], ai = [];
  let listener;
  const context = vm.createContext({
    importScripts() {}, console: { log() {} }, AbortController, AbortSignal, setTimeout, clearTimeout,
    NutEggAI: {
      PROVIDER_CATALOG: { gemini: { defaultModel: 'default-model' } },
      normalizeAIDebugScope: value => value,
      getAIDebugInfo: () => ({ totalCalls: 1 }),
      checkCreditAI: async settings => { ai.push({ action: 'credit', settings }); return { hasBalance: true }; },
      analyzeContentStandalone: async (payload, settings) => { ai.push({ action: 'analyze', payload, settings }); return { coreSummary: ['Summary'] }; },
      askFollowUpStandalone: async (payload, question, priorQa, settings, scope) => {
        ai.push({ action: 'ask', payload, question, priorQa, settings, scope }); return 'Answer';
      },
    },
    chrome: {
      storage: { local: {
        get: async keys => Object.fromEntries(keys.map(key => [key, stored[key]])),
        set: async values => Object.assign(stored, values),
      } },
      action: { setPopup() {} }, sidePanel: { setPanelBehavior: async () => {} },
      runtime: { onMessage: { addListener(fn) { listener = fn; } }, onConnect: { addListener() {} } },
    },
    fetch: async (url, options) => {
      http.push({ url, options });
      if (!online) throw new Error('Connection refused');
      return { ok: true, json: async () => url.endsWith('/health') ? { version: '1' } : { answers: ['Obsidian answer'], coreSummary: ['Obsidian summary'] } };
    },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../src/background/service-worker.js'), 'utf8'), context);
  return { stored, http, ai, send: (action, values = {}) => new Promise(resolve => listener({ action, ...values }, {}, resolve)) };
}

test('a saved Chrome key works immediately without a legacy enable toggle or an Obsidian probe', async () => {
  const app = worker({ chromeAiEnabled: false });
  assert.equal((await app.send('check-chrome-ai')).configured, false);
  const missing = await app.send('analyze', { payload: { content: 'Article' } });
  assert.equal(missing.errorCode, 'no_api_key');
  assert.doesNotMatch(missing.error, /Obsidian/);
  app.stored.chromeAiApiKey = 'new-key';
  assert.equal((await app.send('check-chrome-ai')).configured, true);
  const result = await app.send('analyze', { payload: { content: 'Article' } });
  assert.equal(result.mode, 'chrome');
  assert.equal(result.stage, 'stage1');
  const answer = await app.send('ask', { payload: { questions: ['Why?'], scope: 'beyond' } });
  assert.equal(answer.answers[0].answer, 'Answer');
  assert.equal(app.ai[1].scope, 'beyond');
  assert.equal(app.ai[0].settings.chromeAiApiKey, 'new-key');
  assert.equal(app.http.length, 0, 'Even an available Obsidian server must never be contacted');
});

test('Chrome mode guards every Obsidian-only request and uses Chrome credit', async () => {
  const app = worker({ connectionMode: 'chrome', chromeAiApiKey: 'test' });
  assert.equal((await app.send('check-server')).online, false);
  assert.equal((await app.send('history', { url: 'https://example.test' })).history.length, 0);
  assert.equal((await app.send('get-eggs')).eggs.length, 0);
  assert.equal((await app.send('metrics')).nuts, 0);
  assert.equal((await app.send('config-status')).mode, 'chrome');
  assert.equal((await app.send('get-credit')).hasBalance, true);
  assert.equal((await app.send('get-debug-info', { mode: 'obsidian', debugScope: 'tab1' })).unavailable, true);
  for (const action of ['confirm', 'create-egg']) {
    assert.equal((await app.send(action, { payload: {}, name: 'Egg' })).errorCode, 'obsidian_mode_required');
  }
  assert.equal(app.http.length, 0);
  assert.deepEqual(app.ai.map(call => call.action), ['credit']);
});

test('Obsidian mode routes both analysis and questions to the chosen server', async () => {
  const app = worker({ connectionMode: 'obsidian', chromeAiApiKey: 'unused', serverPort: 27124 });
  assert.equal((await app.send('analyze', { payload: { content: 'Article' } })).mode, 'obsidian');
  assert.equal((await app.send('ask', { payload: { questions: ['Why?'] } })).answers[0], 'Obsidian answer');
  assert.deepEqual(app.http.map(call => new URL(call.url).pathname), ['/health', '/analyze', '/health', '/ask']);
  assert(app.http.every(call => new URL(call.url).port === '27124'));
  assert.equal(app.ai.length, 0);
});

test('offline Obsidian mode explains how to reconnect without silently using a saved Chrome key', async () => {
  const app = worker({ connectionMode: 'obsidian', chromeAiApiKey: 'unused' }, { online: false });
  for (const action of ['analyze', 'ask']) {
    const result = await app.send(action, { payload: { content: 'Article', questions: ['Why?'] } });
    assert.equal(result.mode, 'obsidian');
    assert.equal(result.errorCode, 'obsidian_offline');
    assert.match(result.error, /Open Obsidian.*switch to Chrome/);
  }
  assert.equal(app.ai.length, 0);
  app.stored.connectionMode = 'chrome';
  assert.equal((await app.send('analyze', { payload: { content: 'Article' } })).mode, 'chrome');
  assert.equal(app.ai.length, 1);
});

test('local AI uses the saved endpoint and needs no API key', async () => {
  const app = worker({ chromeAiProvider: 'local', chromeAiLocalEndpoint: 'http://localhost:11434/v1' });
  assert.equal((await app.send('check-chrome-ai')).configured, true);
  assert.equal((await app.send('analyze', { payload: { content: 'Article' } })).mode, 'chrome');
  assert.equal(app.ai[0].settings.chromeAiEndpoint, 'http://localhost:11434/v1');
});
