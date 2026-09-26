const { describe, it } = require("node:test");
const assert = require("node:assert");
const { AnalysisService } = require("../src/popup/services/analysis-service.js");
const { TabStateManager } = require("../src/popup/state/tab-state.js");
const { SessionState } = require("../src/popup/state/session-state.js");
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

  it("analyze executes Stage 1 and populates cache & session when tab stays active", async () => {
    const mockChrome = createMockChrome({
      portResponse: {
        stage: "stage1",
        matchedEggs: ["productivity.md"],
        allEggs: ["productivity.md", "coding.md"],
        nutId: 42,
      },
    });
    const service = new AnalysisService({ chrome: mockChrome });
    const session = new SessionState();
    const settings = new SettingsState();
    const tabStateManager = new TabStateManager();

    session.activeTabId = 101;
    session.extractedContent = {
      url: "https://example.com/test",
      title: "Test Page",
      content: "Page content",
      sourceType: "webpage",
    };
    settings.setAnalysisMode("confirm");

    let completeCalled = false;
    const res = await service.analyze({
      session,
      settings,
      tabStateManager,
      pinnedTabId: 101,
      callbacks: {
        onStage1Complete: () => { completeCalled = true; },
      },
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(completeCalled, true);
    assert.strictEqual(session.analysisResult.stage, "stage1");
    assert.strictEqual(session.currentNutId, 42);
    assert.ok(session.selectedEggs.has("productivity.md"));

    // Cache on tab 101 is updated
    const cached101 = tabStateManager.get(101);
    assert.strictEqual(cached101.status, "done");
    assert.strictEqual(cached101.currentNutId, 42);
  });

  it("CRITICAL TAB-SWITCH: analyze completes in background without clobbering switched active tab", async () => {
    const mockChrome = createMockChrome({
      portResponse: {
        stage: "stage1",
        matchedEggs: ["tab1-egg.md"],
        nutId: 10142,
      },
    });
    const service = new AnalysisService({ chrome: mockChrome });
    const session = new SessionState();
    const settings = new SettingsState();
    const tabStateManager = new TabStateManager();

    // 1. User starts analyze on Tab 101
    session.activeTabId = 101;
    session.extractedContent = {
      url: "https://tab1.com",
      title: "Tab 1 Title",
      content: "Tab 1 Content",
    };
    settings.setAnalysisMode("confirm");

    let stage1CompleteForActiveTab = false;

    // Start analysis on Tab 101
    const analyzePromise = service.analyze({
      session,
      settings,
      tabStateManager,
      pinnedTabId: 101,
      callbacks: {
        onStage1Complete: () => { stage1CompleteForActiveTab = true; },
      },
    });

    // 2. USER SWITCHES TO TAB 102 BEFORE ANALYSIS FINISHES!
    session.activeTabId = 102;
    session.extractedContent = {
      url: "https://tab2.com",
      title: "Tab 2 Title",
      content: "Tab 2 Content",
    };
    session.analysisResult = null;
    session.currentNutId = null;

    // 3. Tab 101's async analysis finishes
    const res = await analyzePromise;
    assert.strictEqual(res.success, true);

    // Tab 101's cache MUST have the result
    const cached101 = tabStateManager.get(101);
    assert.ok(cached101, "Tab 101 must have cached state");
    assert.strictEqual(cached101.status, "done");
    assert.strictEqual(cached101.currentNutId, 10142);
    assert.strictEqual(cached101.analysisResult.nutId, 10142);

    // Active session for Tab 102 MUST NOT BE POLLUTED!
    assert.strictEqual(session.activeTabId, 102);
    assert.strictEqual(session.analysisResult, null, "Tab 102 must not receive Tab 101's result");
    assert.strictEqual(session.currentNutId, null, "Tab 102 must not receive Tab 101's nutId");
    assert.strictEqual(stage1CompleteForActiveTab, false, "Active UI callbacks must not fire for background tab");
  });

  it("CRITICAL TAB-SWITCH: proceedStage2 completes in background without corrupting switched active tab", async () => {
    const mockChrome = createMockChrome({
      portResponse: {
        stage: "stage2",
        shouldRead: true,
        shouldReadReason: "Very informative",
        newKnowledge: [{ egg: "tab1-egg.md", facts: ["Fact 1"] }],
        nutId: 999,
      },
    });
    const service = new AnalysisService({ chrome: mockChrome });
    const session = new SessionState();
    const settings = new SettingsState();
    const tabStateManager = new TabStateManager();

    // Tab 101 is ready for Stage 2
    session.activeTabId = 101;
    session.stage1ContentAnalysis = { titleVerdict: "Title 1" };
    session.stage1Payload = { url: "https://tab1.com" };

    let proceedCompleteFired = false;

    // Start Stage 2 on Tab 101
    const proceedPromise = service.proceedStage2({
      session,
      settings,
      tabStateManager,
      eggsToCompare: ["tab1-egg.md"],
      pinnedTabId: 101,
      callbacks: {
        onProceedComplete: () => { proceedCompleteFired = true; },
      },
    });

    // USER SWITCHES TO TAB 202!
    session.activeTabId = 202;
    session.stage1ContentAnalysis = null;
    session.analysisResult = null;

    await proceedPromise;

    // Tab 101 cache must record Stage 2 completion
    const cached101 = tabStateManager.get(101);
    assert.strictEqual(cached101.status, "done");
    assert.strictEqual(cached101.analysisResult.stage, "stage2");
    assert.strictEqual(cached101.currentNutId, 999);

    // Tab 202 active session must remain untouched
    assert.strictEqual(session.activeTabId, 202);
    assert.strictEqual(session.analysisResult, null);
    assert.strictEqual(proceedCompleteFired, false);
  });

  it("saveKnowledge calculates skipRaw correctly and handles tab isolation", async () => {
    let confirmPayload = null;
    const mockChrome = {
      runtime: {
        sendMessage: async (msg) => {
          if (msg.action === "confirm") {
            confirmPayload = msg.payload;
            return { success: true };
          }
          return {};
        },
      },
    };
    const service = new AnalysisService({ chrome: mockChrome });
    const session = new SessionState();
    const settings = new SettingsState();
    const tabStateManager = new TabStateManager();

    session.activeTabId = 301;
    session.nutCollected = false;
    session.cachedProcessedSaved = null;

    // 1. Initial save of new knowledge: skipRaw must be false
    await service.saveKnowledge({
      session,
      settings,
      tabStateManager,
      newKnowledge: [{ egg: "egg.md" }],
      isHatch: true,
      overrideNutId: 123,
      targetPinnedId: 301,
    });

    assert.strictEqual(confirmPayload.skipRaw, false);
    assert.strictEqual(session.eggHatched, true);
    assert.strictEqual(session.nutCollected, true);

    // 2. Subsequent save when nutCollected is true: skipRaw must be true
    await service.saveKnowledge({
      session,
      settings,
      tabStateManager,
      newKnowledge: [{ egg: "egg.md" }],
      isHatch: true,
      overrideNutId: 123,
      targetPinnedId: 301,
    });

    assert.strictEqual(confirmPayload.skipRaw, true);
  });

  it("askFollowUp appends pending and answered questions and respects active tab", async () => {
    const mockChrome = createMockChrome({
      sendResponses: {
        answers: [{ answer: "AI Answer to follow-up", sources: [{ quote: "Quote" }] }],
      },
    });
    const service = new AnalysisService({ chrome: mockChrome });
    const session = new SessionState();
    const settings = new SettingsState();
    const tabStateManager = new TabStateManager();

    session.activeTabId = 401;
    session.followUpQa = [];

    const res = await service.askFollowUp({
      session,
      settings,
      tabStateManager,
      question: "What is the key takeaway?",
      pinnedTabId: 401,
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.entry.answer, "AI Answer to follow-up");
    assert.strictEqual(session.followUpQa.length, 1);
    assert.strictEqual(session.followUpQa[0].answer, "AI Answer to follow-up");

    const cached401 = tabStateManager.get(401);
    assert.strictEqual(cached401.followUpQa.length, 1);
    assert.strictEqual(cached401.followUpQa[0].answer, "AI Answer to follow-up");
  });
});

