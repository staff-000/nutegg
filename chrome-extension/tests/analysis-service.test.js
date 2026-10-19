const fs = require("node:fs");
globalThis.NutEggAI = new Function(fs.readFileSync(require.resolve("../dist/ai-core.js"), "utf8") + "\nreturn NutEggAI;")();
const { describe, it } = require("node:test");
const assert = require("node:assert");
const { AnalysisService } = require("../src/popup/services/analysis-service.js");
const { TabStateManager } = require("../src/popup/state/tab-state.js");
const { SettingsState } = require("../src/popup/state/settings-state.js");

function createMockChrome({ portResponse, lastError, sendResponses = {} } = {}) {
  const listeners = [];
  const disconnectListeners = [];
  let postedMessage = null;

  const port = {
    postMessage: (msg) => {
      postedMessage = msg;
      if (msg.action === "analyze") {
        setTimeout(() => {
          if (lastError) {
            disconnectListeners.forEach((fn) => fn());
          } else {
            listeners.forEach((fn) => fn(portResponse));
          }
        }, 10);
      }
    },
    onMessage: {
      addListener: (fn) => listeners.push(fn),
    },
    onDisconnect: {
      addListener: (fn) => disconnectListeners.push(fn),
    },
    disconnect: () => {},
  };

  return {
    runtime: {
      connect: () => port,
      sendMessage: async (msg) => {
        if (msg.action === "history") return { history: sendResponses.history || [] };
        if (msg.action === "confirm") return { success: true, ...(sendResponses.confirm || {}) };
        if (msg.action === "ask") return { answers: sendResponses.answers || [{ answer: "AI Answer" }] };
        if (msg.action === "create-egg") return { success: true, ...(sendResponses.createEgg || {}) };
        return {};
      },
      lastError: lastError ? { message: lastError } : null,
    },
    getPostedMessage: () => postedMessage,
  };
}

describe("AnalysisService", () => {
  it("sendAnalyzeViaPort submits a versioned job and receives its response", async () => {
    const mockChrome = createMockChrome({ portResponse: { titleVerdict: "Great article" } });
    const service = new AnalysisService({ chrome: mockChrome });

    const result = await service.sendAnalyzeViaPort({ test: true });
    assert.deepStrictEqual(result, { titleVerdict: "Great article" });
    assert.strictEqual(mockChrome.getPostedMessage().action, "analyze");
  });

  it("sendAnalyzeViaPort rejects on disconnect error", async () => {
    const mockChrome = createMockChrome({ lastError: "Connection failed" });
    const service = new AnalysisService({ chrome: mockChrome });

    await assert.rejects(
      async () => service.sendAnalyzeViaPort({ test: true }),
      /Connection failed/
    );
  });

});

it('aborting a request disconnects only its port and ignores late messages', async () => {
  let onMessage, onDisconnect, disconnected = 0;
  const controller = new AbortController();
  const service = new AnalysisService({ chrome: { runtime: { connect: () => ({
    postMessage() {}, disconnect() { disconnected++; onDisconnect?.(); },
    onMessage: { addListener(fn) { onMessage = fn; } },
    onDisconnect: { addListener(fn) { onDisconnect = fn; } },
  }) } } });
  const job = service.sendAnalyzeViaPort({}, null, { signal: controller.signal });
  const rejected = assert.rejects(job, error => error.code === 'cancelled');
  controller.abort();
  await rejected;
  onMessage({ type: 'complete', result: { title: 'Obsolete' } });
  assert.equal(disconnected, 1);
});

it('abort sends an explicit cancellation, while disconnect alone sends none', async () => {
  const sent = []; let disconnect;
  const service = new AnalysisService({ chrome: { runtime: { connect: () => ({
    postMessage: message => sent.push(message), disconnect() {},
    onMessage: { addListener() {} }, onDisconnect: { addListener: fn => { disconnect = fn; } },
  }) } } });
  const controller = new AbortController();
  const first = service.sendAnalyzeViaPort({}, null, { signal: controller.signal, jobId: 'explicit', tabId: 1 });
  controller.abort(); await assert.rejects(first, error => error.code === 'cancelled');
  assert.equal(sent.filter(message => message.action === 'cancel').length, 1);
  const second = service.sendAnalyzeViaPort({}, null, { jobId: 'detach', tabId: 2 });
  disconnect(); await assert.rejects(second, /Connection closed/);
  assert.equal(sent.filter(message => message.action === 'cancel').length, 1);
});

it('completed jobs request stored details instead of resubmitting analysis', async () => {
  const sent = []; let receive;
  const service = new AnalysisService({ chrome: { runtime: { connect: () => ({
    postMessage: message => sent.push(message), disconnect() {},
    onMessage: { addListener: fn => { receive = fn; } }, onDisconnect: { addListener() {} },
  }) } } });
  const promise = service.sendAnalyzeViaPort({ content: 'Source' }, null, { jobId: 'original', tabId: 1 });
  receive({ type: 'accepted', jobId: 'deduplicated', revision: 2 });
  receive({ type: 'job', job: { id: 'deduplicated', status: 'completed', revision: 3 } });
  receive({ type: 'detail', job: { id: 'deduplicated', result: { coreSummary: ['Saved'] } } });
  assert.deepStrictEqual(await promise, { coreSummary: ['Saved'] });
  assert.equal(sent.filter(message => message.action === 'analyze').length, 1);
  assert.equal(sent.find(message => message.action === 'detail').jobId, 'deduplicated');
});
