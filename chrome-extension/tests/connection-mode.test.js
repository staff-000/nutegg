const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function worker(initial = {}, availability = {}) {
  const stored = { ...initial }, http = [], ai = [];
  let listener, storageListener;
  const context = vm.createContext({
    importScripts() {}, console: { log() {} }, TextEncoder, URL, AbortController, AbortSignal, setTimeout, clearTimeout,
    NutEggAI: {
      PROVIDER_CATALOG: { gemini: { defaultModel: 'default-model' } },
      normalizeAIDebugScope: value => value,
      getAIDebugInfo: () => ({ totalCalls: 1 }),
      checkCreditAI: async settings => { ai.push({ action: 'credit', settings }); return { hasBalance: true }; },
      analyzeContentStandalone: async (payload, settings) => { ai.push({ action: 'analyze', payload, settings }); return { coreSummary: ['Summary'] }; },
      askFollowUpStandalone: async (payload, question, priorQa, settings, scope) => {
        ai.push({ action: 'ask', payload, question, priorQa, settings, scope }); return 'Answer';
      },
      isSubscriptionProvider: provider => ['gemini-cli', 'codex-cli', 'claude-cli'].includes(provider),
    },
    chrome: {
      storage: { onChanged: { addListener(fn) { storageListener = fn; } }, local: {
        get: async keys => Object.fromEntries(keys.map(key => [key, stored[key]])),
        set: async values => Object.assign(stored, values),
      } },
      action: { setPopup() {} }, sidePanel: { setPanelBehavior: async () => {} },
      runtime: { onMessage: { addListener(fn) { listener = fn; } }, onConnect: { addListener() {} } },
    },
    fetch: async (url, options) => {
      http.push({ url, options });
      if (availability.online === false || availability.offlinePaths?.some(path => url.endsWith(path))) throw new Error('Connection refused');
      if (url.endsWith('/metrics')) return { ok: availability.metricsOk !== false, json: async () => availability.metrics || { nuts: 0, eggs: 0, timeSavedMinutes: 0 } };
      return { ok: !url.endsWith('/ai-config') || availability.syncOk !== false, json: async () => url.endsWith('/health') ? { version: '1' } : { answers: ['Obsidian answer'], coreSummary: ['Obsidian summary'] } };
    },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../src/background/service-worker.js'), 'utf8'), context);
  return { stored, http, ai, change: async values => {
    const changes = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { newValue: value }]));
    Object.assign(stored, values);
    storageListener(changes, 'local');
    await new Promise(resolve => setImmediate(resolve));
  }, send: (action, values = {}) => new Promise(resolve => listener({ action, ...values }, {}, resolve)) };
}

test('a saved Chrome key works immediately while configuration mirroring never routes analysis to Obsidian', async () => {
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
  assert(app.http.every(call => call.url.endsWith('/ai-config')), 'Only configuration mirroring may contact Obsidian');
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
  assert(app.http.every(call => call.url.endsWith('/metrics')), 'Metrics may read the vault snapshot independently of mode');
  assert.deepEqual(app.ai.map(call => call.action), ['credit']);
});

test('Obsidian mode routes both analysis and questions to the chosen server', async () => {
  const app = worker({ connectionMode: 'obsidian', chromeAiApiKey: 'unused', serverPort: 27124 });
  assert.equal((await app.send('analyze', { payload: { content: 'Article' } })).mode, 'obsidian');
  assert.equal((await app.send('ask', { payload: { questions: ['Why?'] } })).answers[0], 'Obsidian answer');
  assert.deepEqual(app.http.map(call => new URL(call.url).pathname), ['/health', '/ai-config', '/analyze', '/health', '/ai-config', '/ask']);
  assert(app.http.every(call => new URL(call.url).port === '27124'));
  assert.equal(app.ai.length, 0);
});

test('offline Obsidian uses Chrome analysis, questions and cache, then reconnects without changing the selected mode', async () => {
  const availability = { online: false };
  const app = worker({ connectionMode: 'obsidian', chromeAiApiKey: 'key' }, availability);
  for (const action of ['analyze', 'ask']) {
    const result = await app.send(action, { payload: { url: 'https://example.test', content: 'Article', questions: ['Why?'] } });
    assert.equal(result.mode, 'chrome');
    assert.equal(result.error, undefined);
  }
  assert.equal((await app.send('history', { url: 'https://example.test' })).history[0].result.mode, 'chrome');
  assert.equal(app.ai.length, 2);
  assert.equal(app.stored.connectionMode, 'obsidian');
  availability.online = true;
  assert.equal((await app.send('analyze', { payload: { content: 'Article' } })).mode, 'obsidian');
  assert.equal(app.ai.length, 2);
});

test('Obsidian disconnecting after the health check falls back for reading and questions', async () => {
  const app = worker({ connectionMode: 'obsidian', chromeAiApiKey: 'key' }, { offlinePaths: ['/analyze', '/ask'] });
  assert.equal((await app.send('analyze', { payload: { content: 'Article' } })).mode, 'chrome');
  assert.equal((await app.send('ask', { payload: { questions: ['Why?'] } })).answers[0].answer, 'Answer');
  assert.equal(app.ai.length, 2);
});

test('offline fallback still requires a Chrome-compatible provider and never substitutes vault egg analysis', async () => {
  for (const settings of [{}, { chromeAiProvider: 'codex-cli', chromeAiApiKey: 'pairing' }]) {
    const app = worker({ connectionMode: 'obsidian', ...settings }, { online: false });
    assert.equal((await app.send('analyze', { payload: { content: 'Article' } })).errorCode,
      settings.chromeAiProvider ? 'subscription_requires_obsidian' : 'no_api_key');
    assert.equal((await app.send('analyze', { payload: { content: 'Article', stage: 2 } })).errorCode, 'obsidian_offline');
    assert.equal(app.ai.length, 0);
  }
});

test('local AI uses the saved endpoint and needs no API key', async () => {
  const app = worker({ chromeAiProvider: 'local', chromeAiLocalEndpoint: 'http://localhost:11434/v1' });
  assert.equal((await app.send('check-chrome-ai')).configured, true);
  assert.equal((await app.send('analyze', { payload: { content: 'Article' } })).mode, 'chrome');
  assert.equal(app.ai[0].settings.chromeAiEndpoint, 'http://localhost:11434/v1');
});

test('Chrome mode caches analyzed tabs and returns cached history first on revisit', async () => {
  const app = worker({ connectionMode: 'chrome', chromeAiApiKey: 'test-key', chromeCacheTabLimit: 2 });
  
  // 1. Initial analysis for page 1
  const res1 = await app.send('analyze', { payload: { url: 'https://example.com/page1', title: 'Page 1', content: 'Content 1' } });
  assert.equal(res1.mode, 'chrome');
  assert.ok(app.stored.chromeTabCache?.length === 1);
  assert.equal(app.stored.chromeTabCache[0].url, 'https://example.com/page1');
  assert.equal(app.stored.chromeTabCache[0].title, 'Page 1');

  // 2. Fetch history for page 1 (even with hash fragment)
  const hist1 = await app.send('history', { url: 'https://example.com/page1#section' });
  assert.equal(hist1.history.length, 1);
  assert.equal(hist1.history[0].url, 'https://example.com/page1');
  assert.deepEqual(hist1.history[0].result.coreSummary, ['Summary']);

  // 3. Analysis for page 2
  await app.send('analyze', { payload: { url: 'https://example.com/page2', title: 'Page 2', content: 'Content 2' } });
  assert.equal(app.stored.chromeTabCache.length, 2);

  // 4. Analysis for page 3 evicts page 1 (LRU limit is 2)
  await app.send('analyze', { payload: { url: 'https://example.com/page3', title: 'Page 3', content: 'Content 3' } });
  assert.equal(app.stored.chromeTabCache.length, 2);
  assert.equal(app.stored.chromeTabCache[0].url, 'https://example.com/page3');
  assert.equal(app.stored.chromeTabCache[1].url, 'https://example.com/page2');

  const evicted = await app.send('history', { url: 'https://example.com/page1' });
  assert.equal(evicted.history.length, 0);

  // 5. Clear cache
  const clearRes = await app.send('clear-chrome-cache');
  assert.equal(clearRes.success, true);
  assert.equal(app.stored.chromeTabCache.length, 0);
});

test('Chrome cache enforces its byte cap on existing entries and subsequent saves', async () => {
  const entry = i => ({ url: `https://example.com/${i}`, content: '字'.repeat(1000000), result: {} });
  const app = worker({ connectionMode: 'chrome', chromeAiApiKey: 'key', chromeTabCache: [entry(3), entry(2), entry(1)] });
  const info = await app.send('get-chrome-cache-info');
  assert.equal(info.count, 2, 'UTF-8 bytes, rather than character count, determine the limit');
  assert.deepEqual(Array.from(app.stored.chromeTabCache, e => e.url), ['https://example.com/3', 'https://example.com/2']);
  const bytes = () => Buffer.byteLength('chromeTabCache') + Buffer.byteLength(JSON.stringify(app.stored.chromeTabCache));
  assert.ok(bytes() <= 8 * 1024 * 1024);
  app.stored.chromeTabCache = [entry(3), entry(2), entry(1)];
  await app.send('analyze', { payload: { url: 'https://example.com/new', content: 'New article' } });
  assert.equal(app.stored.chromeTabCache[0].url, 'https://example.com/new');
  assert.ok(bytes() <= 8 * 1024 * 1024);
  assert.equal((await app.send('history', { url: 'https://example.com/1' })).history.length, 0);
});

test('Chrome cache accounts for JSON overhead and drops a single oversized entry', async () => {
  const cap = 8 * 1024 * 1024;
  const url = 'https://example.com/large';
  const entry = { url, result: {} };
  const overhead = Buffer.byteLength('chromeTabCache') + Buffer.byteLength(JSON.stringify([{ ...entry, content: '' }]));
  const app = worker({ chromeTabCache: [{ ...entry, content: 'a'.repeat(cap - overhead) }] });
  assert.equal((await app.send('get-chrome-cache-info')).count, 1, 'An entry exactly at the cap is retained');
  app.stored.chromeTabCache[0].content += 'a';
  assert.equal((await app.send('history', { url })).history.length, 0);
  assert.equal(app.stored.chromeTabCache.length, 0, 'Even a single entry cannot exceed the cap');
});

test('Obsidian mode fetches history from server and does not use Chrome tab cache', async () => {
  const app = worker({ connectionMode: 'obsidian', chromeAiApiKey: 'key', serverPort: 27123 });
  const hist = await app.send('history', { url: 'https://obsidian.test/page' });
  assert.equal(app.http.some(call => call.url.includes('/history')), true);
  assert.equal(hist.coreSummary[0], 'Obsidian summary');
});

test('Chrome mode matches cache by video ID across Bilibili and YouTube URL variants', async () => {
  const app = worker({ connectionMode: 'chrome', chromeAiApiKey: 'test-key', chromeCacheTabLimit: 10 });

  // 1. Bilibili watchlater cached, then visited via /video/... with tracking parameters
  const biliWatchlater = 'https://www.bilibili.com/list/watchlater/?bvid=BV1WS8v6DEJT&oid=117148923988962';
  const biliVideoPage = 'https://www.bilibili.com/video/BV1WS8v6DEJT/?spm_id_from=333.1245.0.0&vd_source=e0b9ac349802cc71b68bc73bc6344bc7';

  await app.send('analyze', {
    payload: {
      url: biliWatchlater,
      title: 'Bilibili Test Video',
      content: 'Bilibili Content',
      sourceType: 'bilibili',
      metadata: { video_id: 'BV1WS8v6DEJT', platform: 'bilibili' },
    },
  });

  const biliHist = await app.send('history', { url: biliVideoPage });
  assert.equal(biliHist.history.length, 1);
  assert.equal(biliHist.history[0].title, 'Bilibili Test Video');
  assert.equal(biliHist.history[0].videoId, 'BV1WS8v6DEJT');

  // 2. YouTube watch URL cached, then visited via youtu.be or shorts
  const ytWatch = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&si=tracking';
  const ytShortLink = 'https://youtu.be/dQw4w9WgXcQ?si=other_tracking';

  await app.send('analyze', {
    payload: {
      url: ytWatch,
      title: 'YouTube Test Video',
      content: 'YouTube Content',
      sourceType: 'youtube',
    },
  });

  const ytHist = await app.send('history', { url: ytShortLink });
  assert.equal(ytHist.history.length, 1);
  assert.equal(ytHist.history[0].title, 'YouTube Test Video');
  assert.equal(ytHist.history[0].videoId, 'dQw4w9WgXcQ');

  // 3. Re-analyzing on the second variant replaces the existing cache entry without duplicates
  await app.send('analyze', {
    payload: {
      url: biliVideoPage,
      title: 'Bilibili Test Video Re-analyzed',
      content: 'Bilibili Content 2',
      sourceType: 'bilibili',
    },
  });
  assert.equal(app.stored.chromeTabCache.filter(item => item.videoId === 'BV1WS8v6DEJT').length, 1);
  const updatedHist = await app.send('history', { url: biliWatchlater });
  assert.equal(updatedHist.history[0].title, 'Bilibili Test Video Re-analyzed');
});

test('Chrome mode persists and increments metrics in Chrome storage on each analysis', async () => {
  const app = worker({ connectionMode: 'chrome', chromeAiApiKey: 'test-key' });
  const initial = await app.send('metrics');
  assert.equal(initial.nuts, 0);
  assert.equal(initial.eggs, 0);
  assert.equal(initial.timeSaved, '0m');

  await app.send('analyze', {
    payload: {
      url: 'https://example.test/article1',
      title: 'Article 1',
      content: 'This is a short article with several words.',
      metadata: { time_estimate_minutes: 5 },
    },
  });

  const afterFirst = await app.send('metrics');
  assert.equal(afterFirst.nuts, 1);
  assert.equal(afterFirst.eggs, 1);
  assert.equal(afterFirst.timeSavedMinutes, 5);
  assert.equal(afterFirst.timeSaved, '5m');
  assert.equal(app.stored.chromeMetrics.nuts, 1);
  assert.equal(app.stored.chromeMetrics.eggs, 1);

  await app.send('analyze', {
    payload: {
      url: 'https://example.test/article2',
      title: 'Article 2',
      content: 'Second article text.',
      metadata: { time_estimate_minutes: 10 },
    },
  });

  const afterSecond = await app.send('metrics');
  assert.equal(afterSecond.nuts, 2);
  assert.equal(afterSecond.eggs, 2);
  assert.equal(afterSecond.timeSavedMinutes, 15);
  assert.equal(afterSecond.timeSaved, '15m');
  assert.equal(app.stored.chromeMetrics.nuts, 2);
  assert.equal(app.stored.chromeMetrics.eggs, 2);
});


test('combined metrics replace the vault snapshot, stay consistent across modes, and survive offline refreshes', async () => {
  const availability = { metrics: { nuts: 100, eggs: 80, timeSavedMinutes: 200 } };
  const app = worker({ connectionMode: 'chrome', chromeAiApiKey: 'key', chromeMetrics: { nuts: 5, eggs: 5, timeSavedMinutes: 10 } }, availability);
  const first = await app.send('metrics');
  assert.equal(first.nuts, 105);
  assert.equal(first.eggs, 85);
  assert.equal(first.timeSavedMinutes, 210);
  assert.equal((await app.send('metrics')).nuts, 105, 'Refreshing must not import the same vault twice');
  app.stored.connectionMode = 'obsidian';
  assert.equal((await app.send('metrics')).nuts, 105);
  availability.metrics = { nuts: 101, eggs: 81, timeSavedMinutes: 205 };
  assert.equal((await app.send('metrics')).nuts, 106);
  availability.online = false;
  await app.send('analyze', { payload: { content: 'Article', metadata: { time_estimate_minutes: 5 } } });
  const offline = await app.send('metrics');
  assert.equal(offline.nuts, 107);
  assert.equal(offline.timeSavedMinutes, 220);
  assert.equal(app.stored.obsidianMetricsSnapshot.nuts, 101);
  availability.online = true;
  availability.metricsOk = false;
  assert.equal((await app.send('metrics')).nuts, 107, 'An HTTP error cannot replace the snapshot with zeros');
  availability.metricsOk = true;
  availability.metrics = { nuts: -1, eggs: 0, timeSavedMinutes: 0 };
  assert.equal((await app.send('metrics')).nuts, 107, 'Malformed snapshots are ignored');
});

test('first Chrome analysis is counted once and concurrent completions cannot lose metric increments', async () => {
  const app = worker({ chromeAiApiKey: 'key' });
  await app.send('analyze', { payload: { url: 'https://example.test/first', content: 'Article' } });
  assert.equal((await app.send('metrics')).nuts, 1);
  await Promise.all([1, 2, 3].map(i => app.send('analyze', { payload: { url: `https://example.test/${i}`, content: 'Article' } })));
  assert.equal((await app.send('metrics')).nuts, 4);
});

test('Obsidian receives Chrome AI configuration before requests and receives subsequent changes', async () => {
  const app = worker({ connectionMode: 'obsidian', chromeAiProvider: 'codex-cli', chromeAiApiKey: 'pairing', chromeAiModel: 'auto', chunkWindowChars: 10000, contentAnalysisMaxTokens: 5000 });
  await app.send('analyze', { payload: { content: 'Article' } });
  const config = () => JSON.parse(app.http.filter(call => call.url.endsWith('/ai-config')).at(-1).options.body);
  assert.equal(config().aiProvider, 'codex-cli');
  assert.equal(config().aiApiKey, 'pairing');
  assert.equal(config().chunkWindowChars, 10000);
  assert.equal(config().contentAnalysisMaxTokens, 5000);
  assert.equal(config().localApiType, 'openai');
  app.stored.chromeAiProvider = 'local';
  app.stored.chromeAiApiKey = '';
  app.stored.chromeAiModel = 'local-model';
  app.stored.chromeAiLocalEndpoint = 'http://localhost:1234/v1/chat/completions';
  await app.send('ask', { payload: { questions: ['Why?'] } });
  assert.equal(config().aiProvider, 'local');
  assert.equal(config().aiApiKey, '');
  assert.equal(config().localEndpoint, app.stored.chromeAiLocalEndpoint);
});

test('failed sync blocks analysis instead of using stale Obsidian settings', async () => {
  const app = worker({ connectionMode: 'obsidian', chromeAiApiKey: 'key' }, { syncOk: false });
  for (const action of ['analyze', 'ask']) {
    const result = await app.send(action, { payload: { content: 'Article', questions: ['Why?'] } });
    assert.equal(result.errorCode, 'ai_config_sync_failed');
  }
  assert.equal(app.http.some(call => /\/(analyze|ask)$/.test(call.url)), false);
});

test('Chrome rejects legacy subscription settings for analysis, questions and credit', async () => {
  const app = worker({ chromeAiProvider: 'codex-cli', chromeAiApiKey: 'pairing-token' });
  assert.equal((await app.send('check-chrome-ai')).configured, false);
  for (const action of ['analyze', 'ask', 'get-credit', 'check-chrome-credit']) {
    const result = await app.send(action, { payload: { content: 'Article', questions: ['Why?'] } });
    assert.equal(result.errorCode, 'subscription_requires_obsidian');
  }
  assert(app.http.every(call => call.url.endsWith('/ai-config')));
  assert.equal(app.ai.length, 0);
});

test('standalone AI receives processing limits, including legacy token settings', async () => {
  const app = worker({ chromeAiApiKey: 'key', chunkWindowChars: 7000, chromeAiMaxTokens: 2000 });
  await app.send('analyze', { payload: { content: 'Article' } });
  assert.equal(app.ai[0].settings.chunkWindowChars, 7000);
  assert.equal(app.ai[0].settings.contentAnalysisMaxTokens, 2000);
});

test('Chrome mirrors configuration in standalone mode when settings change or sync is requested', async () => {
  const app = worker({ connectionMode: 'chrome', chromeAiProvider: 'gemini', chromeAiApiKey: 'key' });
  assert.equal((await app.send('sync-ai-config')).success, true);
  assert.equal(JSON.parse(app.http.at(-1).options.body).aiProvider, 'gemini');
  await app.change({ chromeAiProvider: 'deepseek', chromeAiModel: 'deepseek-chat' });
  assert.equal(JSON.parse(app.http.at(-1).options.body).aiProvider, 'deepseek');
  assert.equal(app.stored.connectionMode, 'chrome');
  assert(app.http.every(call => call.url.endsWith('/ai-config')));
});

test('reading Obsidian settings for comparison never changes them or triggers a sync', async () => {
  const app = worker({ connectionMode: 'chrome', chromeAiApiKey: 'stored-key' });
  await app.send('get-obsidian-ai-config', { settings: { chromeAiProvider: 'deepseek', chromeAiModel: 'draft-model', chromeAiApiKey: 'draft-key', chunkWindowChars: 9000, contentAnalysisMaxTokens: 4000 } });
  assert.equal(app.http.length, 1);
  assert.equal(new URL(app.http[0].url).pathname, '/ai-config-status');
  const sent = JSON.parse(app.http[0].options.body);
  assert.equal(sent.aiModel, 'draft-model');
  assert.equal(sent.aiApiKey, 'draft-key');
  assert.equal(app.stored.chromeAiApiKey, 'stored-key');
  assert.equal(app.ai.length, 0);
});
