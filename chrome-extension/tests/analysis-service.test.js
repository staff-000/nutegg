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
  it("sendAnalyzeViaPort connects, heartbeats, and receives response", async () => {
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
