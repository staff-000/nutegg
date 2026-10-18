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
    mode: 'subscription', subscription: { provider: 'gemini', model: 'auto' }, transition: 'ready' };
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
    mode: 'apiKey', subscription: { provider: 'gemini', model: 'auto' }, transition: 'ready' };
  const context = vm.createContext({
    crypto: require('node:crypto').webcrypto,
    getConnectionMode: async () => 'obsidian', getServerUrl: async () => 'http://127.0.0.1:27123',
    connectObsidian: async () => ({ instanceId: 'vault', credential: 'connection-cred' }),
    loadChromeAiSettings: async () => ({ outputLanguage: 'Japanese', chromeAiProvider: 'gemini' }),
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
