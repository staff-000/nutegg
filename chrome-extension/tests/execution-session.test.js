const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

test('incompatible execution snapshots fail with an update message before being cached', async () => {
  let socket;
  const stored = {};
  const context = vm.createContext({
    crypto: require('node:crypto').webcrypto,
    getConnectionMode: async () => 'obsidian', getServerUrl: async () => 'http://127.0.0.1:27123',
    connectObsidian: async () => ({ instanceId: 'vault', credential: 'connection' }),
    loadChromeAiSettings: async () => ({}),
    NutEggAI: { EXECUTION_PROTOCOL: 3, publicExecutionSettings: value => value },
    chrome: { storage: { local: { get: async () => stored, set: async value => Object.assign(stored, value) } } },
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    WebSocket: class { constructor() { socket = this; this.readyState = 1; } send() {} close() {} },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../src/background/execution-session.js'), 'utf8'), context);
  const opening = vm.runInContext('NutEggExecution.ensure()', context);
  const rejected = assert.rejects(opening, /Update both NutEgg Chrome and Obsidian/);
  await new Promise(resolve => setImmediate(resolve));
  await socket.onmessage({ data: JSON.stringify({ type: 'connected', session: { sessionId: 'bad' }, state: { protocolVersion: 2 } }) });
  await rejected;
  assert.equal(stored.obsidianExecutionState, undefined);
});

test('authoritative subscription state replaces API state and heartbeat acknowledgments do not echo', async () => {
  let socket, heartbeat;
  const sent = [], stored = {};
  const state = { instanceId: 'vault', protocolVersion: 3, revision: 2, subscriptionAvailable: true,
    mode: 'subscription', subscription: { provider: 'google', model: 'auto' }, transition: 'ready' };
  const context = vm.createContext({
    crypto: require('node:crypto').webcrypto,
    getConnectionMode: async () => 'obsidian', getServerUrl: async () => 'http://127.0.0.1:27123',
    connectObsidian: async () => ({ instanceId: 'vault', credential: 'private-connection' }),
    loadChromeAiSettings: async () => ({ chromeAiProvider: 'deepseek', chromeAiModel: 'deepseek-chat' }),
    NutEggAI: { EXECUTION_PROTOCOL: 3, publicExecutionSettings: value => value, reduceSharedExecutionState: (_, value) => value },
    chrome: { storage: { local: { get: async () => stored, set: async value => Object.assign(stored, value) } } },
    setTimeout: () => 1, clearTimeout() {}, setInterval: callback => { heartbeat = callback; return 1; }, clearInterval() {},
    WebSocket: class { constructor() { socket = this; this.readyState = 1; } send(value) { sent.push(JSON.parse(value)); } close() {} },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../src/background/execution-session.js'), 'utf8'), context);
  const opening = vm.runInContext('NutEggExecution.ensure()', context);
  await new Promise(resolve => setImmediate(resolve));
  socket.onopen();
  await socket.onmessage({ data: JSON.stringify({ type: 'connected', session: { sessionId: 'session' }, state }) });
  await opening;
  assert.equal(stored.obsidianExecutionState.mode, 'subscription');
  heartbeat();
  const count = sent.length;
  await socket.onmessage({ data: JSON.stringify({ type: 'heartbeat' }) });
  assert.equal(sent.length, count, 'heartbeat acknowledgment must not send another heartbeat');
  await socket.onmessage({ data: JSON.stringify({ type: 'state', state: { ...state, mode: 'apiKey', revision: 3 } }) });
  assert.equal(stored.obsidianExecutionState.mode, 'apiKey');
});

test('configurationChanged connects when disconnected and sends updated configuration', async () => {
  let socket;
  const sent = [], stored = {};
  const state = { instanceId: 'vault', protocolVersion: 3, revision: 1, subscriptionAvailable: false,
    mode: 'apiKey', subscription: { provider: 'google', model: 'auto' }, transition: 'ready' };
  const context = vm.createContext({
    crypto: require('node:crypto').webcrypto,
    getConnectionMode: async () => 'obsidian', getServerUrl: async () => 'http://127.0.0.1:27123',
    connectObsidian: async () => ({ instanceId: 'vault', credential: 'connection-cred' }),
    loadChromeAiSettings: async () => ({ outputLanguage: 'Japanese', chromeAiProvider: 'google' }),
    NutEggAI: { EXECUTION_PROTOCOL: 3, publicExecutionSettings: value => value, reduceSharedExecutionState: (_, value) => value },
    chrome: { storage: { local: { get: async () => stored, set: async value => Object.assign(stored, value) } } },
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    WebSocket: class { constructor() { socket = this; this.readyState = 1; } send(value) { sent.push(JSON.parse(value)); } close() {} },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../src/background/execution-session.js'), 'utf8'), context);

  // Calling configurationChanged while disconnected initiates ensure()
  vm.runInContext('NutEggExecution.configurationChanged()', context);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(socket, 'socket should be initiated by configurationChanged');
  socket.onopen();
  assert.equal(sent[0]?.type, 'authenticate');
  assert.equal(sent[0]?.configuration?.outputLanguage, 'Japanese');

  // Complete connection
  await socket.onmessage({ data: JSON.stringify({ type: 'connected', session: { sessionId: 'session-1' }, state }) });
  await new Promise(resolve => setImmediate(resolve));

  // Now connected, subsequent configurationChanged sends configuration-changed
  vm.runInContext('NutEggExecution.configurationChanged()', context);
  await new Promise(resolve => setImmediate(resolve));
  const changedMsg = sent.find(m => m.type === 'configuration-changed');
  assert.ok(changedMsg, 'configuration-changed message should be sent');
  assert.equal(changedMsg?.configuration?.outputLanguage, 'Japanese');
});


for (const event of ['cancel-job', 'job-finished', 'revision', 'disconnect']) {
  test(`HTTP transport cancellation follows execution ${event}`, async () => {
    let socket, cancelledQueues = 0;
    const stored = {};
    const state = { instanceId: 'vault', protocolVersion: 3, revision: 1, mode: 'subscription', transition: 'ready' };
    const context = vm.createContext({
      crypto: require('node:crypto').webcrypto, AbortController, structuredClone,
      getConnectionMode: async () => 'obsidian', getServerUrl: async () => 'http://127.0.0.1:27123',
      connectObsidian: async () => ({ instanceId: 'vault', credential: 'test' }),
      loadChromeAiSettings: async () => ({}), cancelObsidianRequests: () => cancelledQueues++,
      NutEggAI: { EXECUTION_PROTOCOL: 3, publicExecutionSettings: value => value, reduceSharedExecutionState: (_, value) => value },
      chrome: { storage: { local: { get: async () => stored, set: async value => Object.assign(stored, value) } } },
      setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
      WebSocket: class { constructor() { socket = this; this.readyState = 1; } send() {} close() {} },
    });
    vm.runInContext(fs.readFileSync(require.resolve('../src/background/execution-session.js'), 'utf8'), context);
    const api = vm.runInContext('NutEggExecution', context);
    const opening = api.ensure();
    await new Promise(resolve => setImmediate(resolve));
    await socket.onmessage({ data: JSON.stringify({ type: 'connected', session: { sessionId: 's', clientId: 'c' }, state }) });
    await opening;
    const job = await api.register({});
    const transport = new AbortController();
    api.bindTransport(job.jobId, transport);
    if (event === 'revision') await socket.onmessage({ data: JSON.stringify({ type: 'state', state: { ...state, revision: 2 } }) });
    else if (event === 'disconnect') socket.onclose();
    else await socket.onmessage({ data: JSON.stringify({ type: event, jobId: job.jobId }) });
    assert.equal(transport.signal.aborted, event !== 'job-finished', 'normal completion must allow final HTTP bytes to arrive');
    if (['revision', 'disconnect'].includes(event)) assert.equal(cancelledQueues, 1);
    api.close();
  });
}

async function pollingFixture() {
  let socket, response;
  let requests = 0;
  const stored = {};
  const initial = { instanceId: 'vault', protocolVersion: 3, revision: 2, mode: 'apiKey',
    subscriptionAvailable: true, subscription: { provider: 'google', model: 'auto' }, transition: 'changing' };
  const context = vm.createContext({
    crypto: require('node:crypto').webcrypto, AbortSignal,
    getConnectionMode: async () => 'obsidian', getServerUrl: async () => 'http://127.0.0.1:27123',
    connectObsidian: async () => ({ instanceId: 'vault', credential: 'private' }),
    loadChromeAiSettings: async () => ({}),
    NutEggAI: { EXECUTION_PROTOCOL: 3, publicExecutionSettings: x => x, reduceSharedExecutionState: (_, x) => x },
    chrome: { storage: { local: { get: async () => stored, set: async x => Object.assign(stored, x) } } },
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    serverFetch: async (url, options) => {
      ++requests;
      assert.ok(url.endsWith('/execution/state'));
      assert.equal(options.cache, 'no-store');
      return new Promise(resolve => { response = (state, ok = true) => resolve({ ok, json: async () => ({ state, error: 'offline' }) }); });
    },
    WebSocket: class { constructor() { socket = this; this.readyState = 1; } send() {} close() {} },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../src/background/execution-session.js'), 'utf8'), context);
  const call = code => vm.runInContext(code, context);
  const opening = call('NutEggExecution.ensure()');
  await new Promise(resolve => setImmediate(resolve));
  await socket.onmessage({ data: JSON.stringify({ type: 'connected', session: { sessionId: 'B' }, state: initial }) });
  await opening;
  return { initial, stored, call, socket, setFetch: fetch => { context.serverFetch = fetch; }, reply: (...args) => response(...args), requests: () => requests };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('periodic status pull recovers a missed ready update and deduplicates overlapping refreshes', async () => {
  const f = await pollingFixture();
  const a = f.call('NutEggExecution.latest()'), b = f.call('NutEggExecution.latest()');
  await tick(); assert.equal(f.requests(), 1);
  f.reply({ ...f.initial, transition: 'ready' });
  assert.equal((await a).transition, 'ready'); assert.equal((await b).transition, 'ready');
  assert.equal(f.stored.obsidianExecutionState.transition, 'ready');
  const again = f.call('NutEggExecution.latest()'); await tick();
  assert.equal(f.requests(), 2);
  f.reply({ ...f.initial, mode: 'subscription', revision: 3, transition: 'ready' });
  assert.equal((await again).mode, 'subscription');
});

test('a delayed poll cannot roll back a pushed ready transition at the same revision', async () => {
  const f = await pollingFixture();
  const pending = f.call('NutEggExecution.latest()'); await tick();
  await f.socket.onmessage({ data: JSON.stringify({ type: 'state', state: { ...f.initial, transition: 'ready' } }) });
  f.reply(f.initial);
  assert.equal((await pending).transition, 'ready');
});

test('a delayed poll cannot restore state after disconnection', async () => {
  const f = await pollingFixture(); const pending = f.call('NutEggExecution.latest()');
  const rejected = assert.rejects(pending, /connection changed/); await tick();
  f.call('NutEggExecution.close()'); f.reply({ ...f.initial, transition: 'ready' }); await rejected;
  assert.equal(f.stored.obsidianExecutionState.transition, 'changing');
});

test('failed status polls preserve confirmed state and permit another refresh', async () => {
  const f = await pollingFixture(); const pending = f.call('NutEggExecution.latest()');
  const rejected = assert.rejects(pending, /offline/); await tick(); f.reply(undefined, false); await rejected;
  assert.equal(f.stored.obsidianExecutionState.transition, 'changing');
  const retry = f.call('NutEggExecution.latest()'); await tick();
  f.reply({ ...f.initial, transition: 'ready' }); assert.equal((await retry).transition, 'ready');
});


test('a mode-change revision conflict refreshes authority before returning the error', async () => {
  const f = await pollingFixture();
  let reads = 0;
  f.setFetch(async url => {
    if (url.endsWith('/execution/mode')) return { ok: false, json: async () => ({
      error: 'AI mode changed. Refresh and try again.', errorCode: 'revision_conflict',
      state: { ...f.initial, revision: 3, transition: 'changing' },
    }) };
    assert.ok(url.endsWith('/execution/state')); ++reads;
    return { ok: true, json: async () => ({ state: { ...f.initial, revision: 3, transition: 'ready' } }) };
  });
  await assert.rejects(f.call("NutEggExecution.changeMode('subscription')"), /AI mode changed/);
  assert.equal(reads, 1);
  assert.equal(f.stored.obsidianExecutionState.revision, 3);
  assert.equal(f.stored.obsidianExecutionState.transition, 'ready');
});

test('polling rejects incompatible responses and reconnects after an Obsidian instance change', async () => {
  const f = await pollingFixture();
  let pending = f.call('NutEggExecution.latest()');
  let rejected = assert.rejects(pending, /Update both/); await tick();
  f.reply({ ...f.initial, protocolVersion: 2 }); await rejected;
  assert.equal(f.stored.obsidianExecutionState.protocolVersion, 3);
  pending = f.call('NutEggExecution.latest()');
  rejected = assert.rejects(pending, /Obsidian restarted/); await tick();
  f.reply({ ...f.initial, instanceId: 'new-vault', transition: 'ready' }); await rejected;
  assert.equal(f.call('NutEggExecution.session'), null);
  assert.equal(f.stored.obsidianExecutionState.instanceId, 'vault');
});
