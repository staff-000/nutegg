const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

test('authoritative subscription state replaces API state and heartbeat acknowledgments do not echo', async () => {
  let socket, heartbeat;
  const sent = [], stored = {};
  const state = { instanceId: 'vault', protocolVersion: 2, revision: 2, subscriptionAvailable: true,
    mode: 'subscription', subscription: { provider: 'gemini', model: 'auto' }, transition: 'ready' };
  const context = vm.createContext({
    crypto: require('node:crypto').webcrypto,
    getConnectionMode: async () => 'obsidian', getServerUrl: async () => 'http://127.0.0.1:27123',
    connectObsidian: async () => ({ instanceId: 'vault', credential: 'private-connection' }),
    loadChromeAiSettings: async () => ({ chromeAiProvider: 'deepseek', chromeAiModel: 'deepseek-chat' }),
    NutEggAI: { publicExecutionSettings: value => value, reduceSharedExecutionState: (_, value) => value },
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
