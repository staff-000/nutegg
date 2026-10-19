const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function worker(initial = {}, availability = {}) {
  const stored = { executionSchemaVersion:2, [`obsidianConnection:http://127.0.0.1:${initial.serverPort || 27123}:test`]: 'approved-test-credential', ...initial }, http = [], ai = [], timeouts = [];
  let listener, storageListener, connectListener;
  const context = vm.createContext({
    importScripts() {}, structuredClone, DOMException, Response, TextDecoder, NutEggExecution:{state:{instanceId:"test",revision:1,mode:availability.mode||"apiKey",subscriptionAvailable:availability.subscriptionEnabled===true,subscription:{provider:"google",model:"auto"},transition:"ready"},ensure:async()=>({}),latest:async()=>{if(availability.online===false)throw new Error("Offline");return {instanceId:"test",revision:1,mode:availability.mode||"apiKey",subscriptionAvailable:availability.subscriptionEnabled===true,subscription:{provider:"google",model:"auto"},transition:"ready"};},register:async()=>({jobId:"test-job",revision:1}),close(){},configurationChanged(){}}, console: { log() {} }, TextEncoder, URL, crypto: require('node:crypto').webcrypto, AbortController, AbortSignal,
    setTimeout: (callback, delay) => { timeouts.push(delay); return availability.timer ? availability.timer(callback, delay) : setTimeout(callback, delay); }, clearTimeout,
    NutEggAI: {
      PROVIDER_CATALOG: { google: { defaultModel: 'default-model' } },
      normalizeAIDebugScope: value => value,
      getAIDebugInfo: () => ({ totalCalls: 1 }),
      checkCreditAI: async settings => { ai.push({ action: 'credit', settings }); return { hasBalance: true }; },
      analyzeContentStandalone: async (payload, settings) => {
        ai.push({ action: 'analyze', payload, settings });
        if (availability.analyze) return availability.analyze(payload);
        return payload.generateKnowledgeEntries
          ? { coreSummary: ['Summary'], extractedEntries: [{ content: 'Knowledge 1' }] }
          : { coreSummary: ['Summary'] };
      },
      askFollowUpStandalone: async (payload, question, priorQa, settings, scope) => {
        ai.push({ action: 'ask', payload, question, priorQa, settings, scope }); return 'Answer';
      },
      isSubscriptionProvider: value => value?.chromeAiAuthMethod === 'subscription',
      supportsSubscription: () => true,
      selectEffectiveExecution:(mode,state)=>mode==='obsidian'&&state?.subscriptionAvailable&&state.mode==='subscription'?'subscription':'apiKey',
      normalizeAISettings: value => value,
      restoreChromeApiPreferences: value => ({...value,chromeAiAuthMethod:'apiKey'}),
      isAIConfigured: settings=>settings.chromeAiProvider==='local'||!!settings.chromeAiApiKey,
    },
    chrome: {
      storage: { onChanged: { addListener(fn) { storageListener = fn; } }, local: {
        get: async keys => keys==null?structuredClone(stored):Object.fromEntries(keys.map(key => [key, stored[key]])),
        set: async values => Object.assign(stored, values),
        remove: async key => { delete stored[key]; },
      } },
      action: { setPopup() {} }, sidePanel: { setPanelBehavior: async () => {} },
      runtime: {id:'a'.repeat(32), getURL: path => `chrome-extension://${'a'.repeat(32)}${path}`, onMessage: { addListener(fn) { listener = fn; } }, onConnect: { addListener(fn) { connectListener = fn; } } },
    },
    fetch: async (url, options) => {
      http.push({ url, options });
      if (availability.respond) {
        const result=await availability.respond(url,options);
        if(url.endsWith('/health'))return {...result,json:async()=>({...await result.json(),instanceId:'test',protocolVersion:3,capabilities:['execution-v3']})};
        return result;
      }
      if (availability.online === false || availability.offlinePaths?.some(path => url.endsWith(path))) throw new Error('Connection refused');
      if (url.endsWith('/metrics')) return { ok: availability.metricsOk !== false, json: async () => availability.metrics || { nuts: 0, eggs: 0, timeSavedMinutes: 0 } };
      return { ok: !url.endsWith('/ai-config') || availability.syncOk !== false, json: async () => url.endsWith('/health') ? { version: '1',instanceId:'test',protocolVersion:3,capabilities:['execution-v3'] } : { answers: ['Obsidian answer'], coreSummary: ['Obsidian summary'] } };
    },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../dist/page-identity.js'), 'utf8'), context);
  context.NutEggAI.normalizeCaptureCoverage = new Function(fs.readFileSync(require.resolve('../dist/ai-core.js'), 'utf8')+';return NutEggAI')().normalizeCaptureCoverage;
  vm.runInContext(fs.readFileSync(require.resolve('../src/background/service-worker.js'), 'utf8'), context);
  return { context, stored, http, ai, timeouts, connect: port => connectListener(port), change: async values => {
    const changes = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { newValue: value }]));
    Object.assign(stored, values);
    storageListener(changes, 'local');
    await new Promise(resolve => setImmediate(resolve));
  }, send: (action, values = {}) => new Promise(resolve => listener({ action, ...values }, {id:'a'.repeat(32),url:`chrome-extension://${'a'.repeat(32)}/src/popup/popup.html`}, resolve)) };
}

test('twenty connected analyses reserve HTTP capacity and preserve every result', async () => {
  const pending = [];
  let active = 0, peak = 0;
  const app = worker({ connectionMode: 'obsidian' }, { respond: async (url, options) => {
    if (!url.endsWith('/analyze')) return { ok: true, json: async () => ({}) };
    active++; peak = Math.max(peak, active);
    const title = JSON.parse(options.body).title;
    await new Promise(resolve => pending.push(resolve));
    return { ok: true, json: async () => { active--; return { title }; } };
  } });
  const states = [], started = [];
  const jobs = Array.from({ length: 20 }, (_, n) => app.context.handleAnalyze({ title: String(n) }, event => {
    if (event.section === 'executionQueue') { states[n] = event.data.state; if (event.data.state === 'running') started.push(n); }
  }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(active, 3);
  assert.equal(states.filter(value => value === 'running').length, 3);
  assert.equal(states.filter(value => value === 'waiting').length, 17);
  assert.equal((await app.send('check-server')).online, true);
  let completed = 0;
  while (completed < 20) {
    const batch = pending.splice(0);
    for (const release of batch) { release(); completed++; }
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.equal(peak, 3);
  assert.deepEqual(started, Array.from({ length: 20 }, (_, n) => n));
  assert.deepEqual((await Promise.all(jobs)).map(r => r.title), Array.from({ length: 20 }, (_, n) => String(n)));
  assert.equal(active, 0);
});

test('failed streams release slots and preserve terminal provider errors', async () => {
  const app = worker({ connectionMode: 'obsidian' }, { respond: async url => {
    if (!url.endsWith('/analyze')) return { ok: true, json: async () => ({}) };
    return new Response('{"type":"partial","section":"summary"}\n{"type":"error","error":"Quota exhausted","errorCode":"quota_exceeded"}\n', {
      headers: { 'content-type': 'application/x-ndjson' },
    });
  } });
  const results = await Promise.all(Array.from({ length: 8 }, () => app.send('analyze', { payload: {} })));
  assert(results.every(r => r.errorCode === 'quota_exceeded' && r.error === 'Quota exhausted'));
  assert.equal((await app.send('check-server')).online, true);
});

test('HTTP error cleanup leaves the response body readable and preserves its error code', async () => {
  let controller;
  const app = worker({ connectionMode: 'obsidian' }, { respond: async url => {
    if (!url.endsWith('/analyze')) return { ok: true, json: async () => ({}) };
    return { ok: false, status: 409, json: async () => {
      assert.equal(controller.signal.aborted, false);
      return { error: 'Refresh capture', errorCode: 'capture_identity_mismatch' };
    } };
  } });
  app.context.NutEggExecution.bindTransport = (_id, value) => { controller = value; };
  app.context.NutEggExecution.cancel = (_id, finished) => { if (!finished) controller.abort(); };
  const result = await app.send('analyze', { payload: {} });
  assert.equal(result.errorCode, 'capture_identity_mismatch');
  assert.equal(result.error, 'Refresh capture');
});

test('analysis deadline aborts body reading and the next request still runs', async () => {
  let expire, cancelled = false, first = true;
  const app = worker({ connectionMode: 'obsidian' }, {
    timer(callback, delay) { if (delay === 600000) expire = callback; return setTimeout(() => {}, 60000); },
    respond: async (url, options) => {
      if (!url.endsWith('/analyze')) return { ok: true, json: async () => ({}) };
      if (!first) return { ok: true, json: async () => ({ title: 'Next' }) };
      first = false;
      return { ok: true, headers: { get: () => 'application/x-ndjson' }, body: { getReader: () => ({
        read: () => new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true })),
        cancel: async () => { cancelled = true; }, releaseLock() {},
      }) } };
    },
  });
  const job = app.send('analyze', { payload: {} });
  await new Promise(resolve => setImmediate(resolve));
  expire();
  assert.equal((await job).errorCode, 'timeout');
  assert.equal(cancelled, true);
  assert.equal((await app.send('analyze', { payload: {} })).title, 'Next');
});

test('configuration changes cancel active and queued requests before newer settings can execute them', async () => {
  let started = 0;
  const app = worker({ connectionMode: 'obsidian' }, { respond: async (url, options) => {
    if (!url.endsWith('/analyze')) return { ok: true, json: async () => ({}) };
    started++;
    await new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
  } });
  const jobs = Array.from({ length: 8 }, () => app.send('analyze', { payload: {} }));
  await new Promise(resolve => setImmediate(resolve));
  await app.change({ chromeAiProvider: 'openai' });
  assert((await Promise.all(jobs)).every(r => r.errorCode === 'cancelled'));
  assert.equal(started, 3);
});

test('routine connection checks never announce a configuration change', async () => {
  const app = worker({ connectionMode: 'obsidian' });
  let changes = 0;
  app.context.NutEggExecution.configurationChanged = () => changes++;
  await app.send('check-server');
  await app.send('config-status');
  assert.equal(changes, 0);
});

test('a delayed health check with an authenticated session remains connected', async () => {
  const app = worker({ connectionMode: 'obsidian' }, { online: false });
  app.context.NutEggExecution.session = { sessionId: 'live-session' };
  const result = await app.send('check-server');
  assert.equal(result.online, true);
  assert.equal(result.degraded, true);
});

test('disconnecting an analysis port aborts its stream', async () => {
  let messageListener, disconnectListener, requestSignal;
  const app = worker({ connectionMode: 'obsidian' }, { respond: async (url, options) => {
    if (!url.endsWith('/analyze')) return { ok: true, json: async () => ({}) };
    requestSignal = options.signal;
    await new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
  } });
  const posted = [];
  app.connect({ name: 'nutegg-analyze', sender: { id: 'a'.repeat(32), url: `chrome-extension://${'a'.repeat(32)}/src/popup/popup.html` },
    onDisconnect: { addListener(fn) { disconnectListener = fn; } },
    onMessage: { addListener(fn) { messageListener = fn; } }, postMessage: value => posted.push(value),
  });
  const job = messageListener({ action: 'analyze', payload: {} });
  await new Promise(resolve => setImmediate(resolve));
  disconnectListener();
  await job;
  assert.equal(requestSignal.aborted, true);
  assert.deepEqual(posted.map(event => event.data?.state), ['waiting', 'running']);
});

test('a cancelled Chrome-only analysis cannot cache a provider result that arrives late', async () => {
  let finish, messageListener, disconnectListener;
  const app = worker({ connectionMode: 'chrome', chromeAiApiKey: 'test' }, {
    analyze: () => new Promise(resolve => { finish = resolve; }),
  });
  app.connect({ name: 'nutegg-analyze', sender: { id: 'a'.repeat(32), url: `chrome-extension://${'a'.repeat(32)}/src/popup/popup.html` },
    onDisconnect: { addListener(fn) { disconnectListener = fn; } },
    onMessage: { addListener(fn) { messageListener = fn; } }, postMessage() {},
  });
  const job = messageListener({ action: 'analyze', payload: { title: 'Old', url: 'https://example.com/old', content: 'Body' } });
  await new Promise(resolve => setImmediate(resolve));
  disconnectListener();
  finish({ coreSummary: ['Late result'] });
  await job;
  assert.equal(app.stored.chromeTabCache, undefined);
  assert.equal(app.stored.chromeMetrics, undefined);
});

test('a saved Chrome key works immediately and Chrome-only mode never writes shared configuration', async () => {
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
  assert.equal(app.http.length,0,'Chrome-only AI execution does not contact Obsidian');
});

test('configuration checks do not fetch credit and health uses one request', async () => {
  const app = worker({ connectionMode: 'obsidian', chromeAiApiKey: 'test' });
  assert.equal((await app.send('check-server')).online, true);
  assert.equal(app.http.filter(call => call.url.endsWith('/health')).length, 1);
  const result = await app.send('config-status');
  assert.equal(result.status, 'ok');
  assert.equal(app.ai.filter(call => call.action === 'credit').length, 0);
});

test('configuration timeout reports a retryable check failure rather than a raw abort', async () => {
  const app = worker({ connectionMode: 'obsidian' }, { respond: async url => {
    if (url.endsWith('/config-status')) throw new DOMException('signal aborted without reason', 'TimeoutError');
    return { ok: true, json: async () => ({}) };
  } });
  const result = await app.send('config-status');
  assert.equal(result.unavailable, true);
  assert.match(result.issues[0], /configuration check timed out/);
  assert.doesNotMatch(result.issues[0], /aborted/);
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
  assert(app.http.every(call => ['/health', '/metrics'].includes(new URL(call.url).pathname)), 'Metrics may read the vault snapshot independently of mode');
  assert.deepEqual(app.ai.map(call => call.action), ['credit']);
});

test('Obsidian mode routes both analysis and questions to the chosen server', async () => {
  const app = worker({ connectionMode: 'obsidian', chromeAiApiKey: 'unused', serverPort: 27124 });
  assert.equal((await app.send('analyze', { payload: { content: 'Article' } })).mode, 'obsidian');
  assert.equal((await app.send('ask', { payload: { questions: ['Why?'] } })).answers[0], 'Obsidian answer');
  assert.deepEqual(app.http.filter(call => !call.url.endsWith('/health')).map(call => new URL(call.url).pathname), ['/analyze','/ask']);
  assert(app.http.every(call => new URL(call.url).port === '27124'));
  for (const call of app.http.filter(call => !call.url.endsWith('/health'))) {
    assert.equal(call.options.headers['X-NutEgg-Extension-Origin'], `chrome-extension://${'a'.repeat(32)}`);
    assert.equal(call.options.headers.Authorization, 'Bearer approved-test-credential');
  }
  assert.equal(app.ai.length, 0);
});

test('local AI uses the saved endpoint and needs no API key', async () => {
  const app = worker({ chromeAiProvider: 'local', chromeAiEndpoint: 'http://localhost:11434/v1' });
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
  assert.equal(afterFirst.eggs, 0);
  assert.equal(afterFirst.timeSavedMinutes, 5);
  assert.equal(afterFirst.timeSaved, '5m');
  assert.equal(app.stored.chromeMetrics.nuts, 1);
  assert.equal(app.stored.chromeMetrics.eggs, 0);

  await app.send('analyze', {
    payload: {
      url: 'https://example.test/article2',
      title: 'Article 2',
      content: 'Second article text.',
      metadata: { time_estimate_minutes: 10 },
      generateKnowledgeEntries: true,
    },
  });

  const afterSecond = await app.send('metrics');
  assert.equal(afterSecond.nuts, 2);
  assert.equal(afterSecond.eggs, 1);
  assert.equal(afterSecond.timeSavedMinutes, 15);
  assert.equal(afterSecond.timeSaved, '15m');
  assert.equal(app.stored.chromeMetrics.nuts, 2);
  assert.equal(app.stored.chromeMetrics.eggs, 1);
});


test('combined metrics replace the vault snapshot, stay consistent across modes, and survive offline refreshes', async () => {
  const availability = { metrics: { nuts: 100, eggs: 80, timeSavedMinutes: 200 } };
  const app = worker({ connectionMode: 'chrome', chromeAiApiKey: 'key', chromeMetrics: { nuts: 5, eggs: 5, timeSavedMinutes: 10 } }, availability);
  const first = await app.send('metrics');
  assert.equal(first.nuts, 105);
  assert.equal(first.eggs, 5);
  assert.equal(first.timeSavedMinutes, 210);
  assert.equal((await app.send('metrics')).nuts, 105, 'Refreshing must not import the same vault twice');
  app.stored.connectionMode = 'obsidian';
  assert.equal((await app.send('metrics')).nuts, 105);
  assert.equal((await app.send('metrics')).eggs, 5);
  availability.metrics = { nuts: 101, eggs: 81, timeSavedMinutes: 205 };
  assert.equal((await app.send('metrics')).nuts, 106);
  assert.equal((await app.send('metrics')).eggs, 5);
  availability.online = false;
  await app.change({ connectionMode: 'chrome' });
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

test('egg metric is only incremented when knowledge is selected and generated from chrome, ignoring obsidian vault eggs', async () => {
  const availability = { metrics: { nuts: 50, eggs: 45, timeSavedMinutes: 100 } };
  const app = worker({ connectionMode: 'chrome', chromeAiApiKey: 'key' }, availability);

  // 1. Initial metrics: 0 eggs
  const initial = await app.send('metrics');
  assert.equal(initial.nuts, 50);
  assert.equal(initial.eggs, 0, 'Obsidian vault eggs (45) must not be counted in total eggs');

  // 2. Analyze without knowledge selected: nuts increments, eggs remains 0
  await app.send('analyze', {
    payload: { url: 'https://example.test/no-knowledge', content: 'Article content' },
  });
  const m1 = await app.send('metrics');
  assert.equal(m1.nuts, 51);
  assert.equal(m1.eggs, 0);

  // 3. Analyze with knowledge selected and generated: eggs increments by 1
  await app.send('analyze', {
    payload: {
      url: 'https://example.test/with-knowledge',
      content: 'Article content',
      generateKnowledgeEntries: true,
    },
  });
  const m2 = await app.send('metrics');
  assert.equal(m2.nuts, 52);
  assert.equal(m2.eggs, 1);

  // 4. In Obsidian mode, knowledge generated from chrome increments chrome egg counter, but vault eggs are still ignored
  app.stored.connectionMode = 'obsidian';
  availability.respond = (url) => {
    if (url.endsWith('/health')) return { ok: true, json: async () => ({ version: '1' }) };
    if (url.endsWith('/ai-config')) return { ok: true, json: async () => ({}) };
    if (url.endsWith('/metrics')) return { ok: true, json: async () => ({ nuts: 52, eggs: 52, timeSavedMinutes: 120 }) };
    if (url.endsWith('/analyze')) {
      return {
        ok: true,
        json: async () => ({
          coreSummary: ['Obsidian summary'],
          eggResults: [{ egg: 'Topic', extractedEntries: [{ content: 'Key takeaway' }] }],
        }),
      };
    }
  };

  await app.send('analyze', {
    payload: {
      url: 'https://example.test/obsidian-knowledge',
      content: 'Article content',
      generateKnowledgeEntries: true,
    },
  });
  const m3 = await app.send('metrics');
  assert.equal(m3.eggs, 2, 'Obsidian analysis from chrome with knowledge generated increments chrome egg counter');
  assert.equal(m3.nuts, 52 + 2, 'Total nuts combines local and vault nuts');
});

test('standalone AI receives processing limits, including legacy token settings', async () => {
  const app = worker({ chromeAiApiKey: 'key', chunkWindowChars: 7000, chromeAiMaxTokens: 2000 });
  await app.send('analyze', { payload: { content: 'Article' } });
  assert.equal(app.ai[0].settings.chunkWindowChars, 7000);
  assert.equal(app.ai[0].settings.contentAnalysisMaxTokens, 2000);
});

test('legacy cache fallbacks cannot cross hash routes and preserve coverage warnings', async () => {
  const app=worker({chromeAiApiKey:'test'});
  const url='https://example.test/#/one';
  const old={url,canonicalUrl:'https://example.test/',capturePayload:{url}};
  app.context.cacheCandidate=old;
  assert.equal(vm.runInContext("matchesCacheEntry(cacheCandidate,'https://example.test/#/two')",app.context),false);
  assert.equal(vm.runInContext("matchesCacheEntry(cacheCandidate,'https://example.test/#/one')",app.context),true);
  app.context.cacheCandidate={...old,url:'https://example.test/',capturePayload:{url:'https://example.test/'}};
  assert.equal(vm.runInContext("matchesCacheEntry(cacheCandidate,'https://example.test/#/one')",app.context),false);
  await app.send('analyze',{payload:{url,title:'Partial',content:'A'.repeat(31000),sourceType:'article',captureCoverage:{reasons:['traversal_limit'],originalCharacters:65000}}});
  const saved=app.stored.chromeTabCache[0];
  assert.deepEqual([...saved.capturePayload.captureCoverage.reasons],['traversal_limit','truncated']);
  assert.equal(saved.capturePayload.captureCoverage.capturedCharacters,30000);
  assert.equal(saved.capturePayload.captureCoverage.originalCharacters,65000);
});

const cachePayload = id => ({ url: `https://example.test/${id}`, title: id, content: `body-${id}` });
const cacheResult = id => ({ coreSummary: [`summary-${id}`] });
const cacheTick = () => new Promise(resolve => setImmediate(resolve));

test('concurrent cache saves keep both original payload/result pairs', async () => {
  const app = worker(); await cacheTick();
  const get = app.context.chrome.storage.local.get;
  let release, started, reads = 0;
  const waiting = new Promise(resolve => { release = resolve; });
  const began = new Promise(resolve => { started = resolve; });
  app.context.chrome.storage.local.get = async keys => {
    const value = structuredClone(await get(keys));
    if (keys?.includes('chromeTabCache') && ++reads === 1) { started(); await waiting; }
    return value;
  };
  const a = app.context.saveChromeCacheEntry(cachePayload('a'), cacheResult('a')); await began;
  const b = app.context.saveChromeCacheEntry(cachePayload('b'), cacheResult('b'));
  await cacheTick(); assert.equal(reads, 1, 'second transaction waits rather than reading an obsolete snapshot');
  release(); await Promise.all([a, b]);
  assert.equal(app.stored.chromeTabCache.length, 2);
  for (const entry of app.stored.chromeTabCache) {
    assert.equal(entry.content, `body-${entry.title}`);
    assert.equal(entry.result.coreSummary[0], `summary-${entry.title}`);
    assert.equal(entry.url, `https://example.test/${entry.title}`);
  }
});

test('cache reads and trimming wait for preceding saves', async () => {
  const app = worker({ chromeCacheTabLimit: 1 }); await cacheTick();
  const save = app.context.chrome.storage.local.set;
  let release, started;
  const waiting = new Promise(resolve => { release = resolve; });
  const began = new Promise(resolve => { started = resolve; });
  app.context.chrome.storage.local.set = async values => {
    if (values.chromeTabCache) { started(); await waiting; }
    return save(values);
  };
  const write = app.context.saveChromeCacheEntry(cachePayload('a'), cacheResult('a')); await began;
  let readFinished = false;
  const read = app.context.loadChromeCache().then(value => { readFinished = true; return value; });
  await cacheTick(); assert.equal(readFinished, false);
  release(); await write;
  assert.equal((await read)[0].title, 'a');
  await app.context.saveChromeCacheEntry(cachePayload('b'), cacheResult('b'));
  assert.deepEqual(Array.from(app.stored.chromeTabCache, entry => entry.title), ['b']);
});

test('clearing cache prevents an already admitted analysis from restoring its result', async () => {
  let finish, started;
  const waiting = new Promise(resolve => { finish = resolve; });
  const began = new Promise(resolve => { started = resolve; });
  const app = worker({ chromeAiApiKey: 'test' }, { analyze: async () => { started(); await waiting; return cacheResult('old'); } });
  await cacheTick();
  const analysis = app.context.handleAnalyze(cachePayload('old')); await began;
  await app.context.clearChromeCache();
  finish(); const result = await analysis;
  assert.equal(result.coreSummary[0], 'summary-old', 'the originating caller still receives its own result');
  assert.equal(app.stored.chromeTabCache.length, 0);
  await app.context.saveChromeCacheEntry(cachePayload('new'), cacheResult('new'));
  assert.equal(app.stored.chromeTabCache[0].title, 'new');
});

test('clear follows an in-flight save and a failed storage write releases the cache queue', async () => {
  const app = worker(); await cacheTick();
  const save = app.context.chrome.storage.local.set; let fail = true;
  app.context.chrome.storage.local.set = async values => {
    if (values.chromeTabCache && fail) { fail = false; throw new Error('quota failure'); }
    return save(values);
  };
  await app.context.saveChromeCacheEntry(cachePayload('failed'), cacheResult('failed'));
  await app.context.saveChromeCacheEntry(cachePayload('kept'), cacheResult('kept'));
  assert.equal(app.stored.chromeTabCache[0].title, 'kept');
  const writes = ['a', 'b'].map(id => app.context.saveChromeCacheEntry(cachePayload(id), cacheResult(id)));
  const clear = app.context.clearChromeCache();
  await Promise.all([...writes, clear]);
  assert.equal((await app.context.loadChromeCache()).length, 0);
});

test('caption provenance survives cache history and legacy entries remain readable', async () => {
  const app = worker(); await cacheTick();
  const provenance = JSON.stringify({ version: 1, outcome: 'verified', requestedVideoId: 'BV1eVgA64EbW', validatedCid: '111' });
  await app.context.saveChromeCacheEntry({ ...cachePayload('caption'), metadata: { subtitle_provenance: provenance } }, cacheResult('caption'));
  const history = await app.context.getChromeCacheHistory(cachePayload('caption').url);
  assert.equal(history.latest.capturePayload.metadata.subtitle_provenance, provenance);
  app.stored.chromeTabCache = [{ url: cachePayload('legacy').url, content: 'Legacy body', result: cacheResult('legacy') }];
  assert.equal((await app.context.getChromeCacheHistory(cachePayload('legacy').url)).latest.content, 'Legacy body');
});

test('Obsidian capture ownership errors retain their code through analysis and Hatch transport', async () => {
  const app = worker({ connectionMode: 'obsidian' }, { respond: async url => url.endsWith('/health')
    ? { ok: true, json: async () => ({ version: '1' }) }
    : { ok: false, status: 409, json: async () => ({ error: 'Refresh the capture.', errorCode: 'capture_identity_mismatch' }) } });
  const result = await app.send('analyze', { payload: cachePayload('wrong') });
  assert.equal(result.errorCode, 'capture_identity_mismatch');
  const hatch = await app.context.handleConfirm(cachePayload('wrong'));
  assert.equal(hatch.errorCode, 'capture_identity_mismatch');
});

test('settings cache-limit changes share the worker transaction queue with analysis saves', async () => {
  const app = worker(); await cacheTick();
  await app.context.saveChromeCacheEntry(cachePayload('old'), cacheResult('old'));
  const operations = [
    app.context.saveChromeCacheEntry(cachePayload('a'), cacheResult('a')),
    app.send('set-chrome-cache-limit', { limit: 1 }),
    app.context.saveChromeCacheEntry(cachePayload('b'), cacheResult('b')),
  ];
  await Promise.all(operations);
  assert.equal(app.stored.chromeCacheTabLimit, 1);
  assert.deepEqual(Array.from(app.stored.chromeTabCache, entry => entry.title), ['b']);
  const clear = await app.send('clear-chrome-cache');
  assert.equal(clear.count, 0); assert.equal(clear.limit, 1);
  const invalid = await app.send('set-chrome-cache-limit', { limit: 'not a number' });
  assert.match(invalid.error, /Invalid cache limit/);
  await app.send('set-chrome-cache-limit', { limit: 0 });
  await app.context.saveChromeCacheEntry(cachePayload('disabled'), cacheResult('disabled'));
  assert.equal(app.stored.chromeTabCache.length, 0);
});

test('followups, creation and Hatch share the bounded pool with analyses', async () => {
  const waiting = [];
  let active = 0, peak = 0;
  const app = worker({ connectionMode: 'obsidian' }, { respond: async (url, options) => {
    if (options?.method !== 'POST') return { ok: true, json: async () => ({}) };
    active++; peak = Math.max(peak, active);
    await new Promise(resolve => waiting.push(resolve));
    return { ok: true, json: async () => { active--; return { success: true }; } };
  } });
  const jobs = ['analyze', 'ask', 'create-egg', 'confirm', 'analyze', 'ask', 'confirm'].map(action => app.send(action, { payload: {}, name: 'Egg' }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(active, 3);
  let released = 0;
  while (released < jobs.length) {
    for (const release of waiting.splice(0)) { release(); released++; }
    await new Promise(resolve => setImmediate(resolve));
  }
  assert((await Promise.all(jobs)).every(result => result.success));
  assert.equal(peak, 3);
  assert.equal(active, 0);
});
