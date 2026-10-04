const fs = require("node:fs");
globalThis.NutEggAI = new Function(fs.readFileSync(require.resolve("../dist/ai-core.js"), "utf8") + "\nreturn NutEggAI;")();
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

  it("selected-egg re-analysis reuses Stage 1 signals, including results restored from history", async () => {
    const { AnalyzeAction } = require("../src/popup/action/analyze.js");
    for (const stage of ["stage1", "stage2"]) {
      const sourceAnalysis = { titleVerdict: "Existing verdict", coreSummary: ["Existing summary"], mindMap: [{ name: "Topic", time: "12:34" }], customQuestionAnswers: [{ question: "Q", answer: "A" }] };
      const mockChrome = createMockChrome({ portResponse: { ...sourceAnalysis, eggResults: [], newKnowledge: [], nutId: 42 } });
      const service = new AnalysisService({ chrome: mockChrome });
      service.analyze = () => assert.fail("Stage 1 must not run");
      const session = new SessionState();
      session.activeTabId = 101;
      session.selectedEggs = new Set(["selected.md", "second.md"]);
      session.currentNutId = 42;
      session.analysisResult = { ...sourceAnalysis, stage };
      session.extractedContent = { url: "https://example.com/video", title: "Video", content: "[12:34] Original transcript", sourceType: "youtube" };
      // Stage 2 history can have no separate Stage 1 cache.
      if (stage === "stage1") {
        session.stage1ContentAnalysis = sourceAnalysis;
        session.stage1Payload = { ...session.extractedContent, nutId: 42 };
      }
      const tabs = new TabStateManager();
      tabs.set(101, { eggHatched: true, nutCollected: true });
      const action = new AnalyzeAction({ session, settings: new SettingsState(), tabStateManager: tabs, analysisService: service });
      await action.handleReanalyzeEggs();
      const payload = mockChrome.getPostedMessage().payload;
      assert.strictEqual(payload.stage, 2);
      assert.deepStrictEqual(payload.eggs, ["selected.md", "second.md"]);
      for (const key of Object.keys(sourceAnalysis)) assert.deepStrictEqual(payload.contentAnalysis[key], sourceAnalysis[key]);
      assert.strictEqual(payload.content, session.extractedContent.content);
      assert.strictEqual(payload.nutId, 42);
      assert.strictEqual(tabs.get(101).eggHatched, false);
      assert.strictEqual(tabs.get(101).nutCollected, true);
      assert.strictEqual(tabs.get(101).isReanalyzing, false);
    }
  });

  it("analyzes only newly selected eggs and retains deselected results across history and tab restoration", async () => {
    const session = new SessionState();
    session.activeTabId = 101;
    const stage1 = { titleVerdict: "Existing verdict", coreSummary: ["Summary"], mindMap: [{ name: "Topic" }], customQuestionAnswers: [] };
    session.analysisResult = { ...stage1, stage: "stage1" };
    session.stage1ContentAnalysis = stage1;
    session.extractedContent = { url: "https://example.com", title: "Title", content: "Original content" };
    const tabs = new TabStateManager();
    const service = new AnalysisService();
    const calls = [];
    service.sendAnalyzeViaPort = async payload => {
      calls.push(payload);
      return { ...stage1, nutId: 42, eggResults: payload.eggs.map(egg => ({ egg,
        readAction: egg === "A.md" ? "full" : "summary", readVerdict: egg === "A.md",
        readVerdictReason: egg, readingSources: [], keyQuestionAnswers: [], extractedEntries: [{ content: `Insight ${egg}` }],
      })) };
    };
    const run = async selected => {
      session.selectedEggs = new Set(selected);
      const result = await service.proceedStage2({ session, settings: new SettingsState(), tabStateManager: tabs, eggsToCompare: selected });
      assert.strictEqual(result.success, true);
      return result.result;
    };
    const first = await run(["A.md"]);
    assert.deepStrictEqual(calls[0].eggs, ["A.md"]);
    const second = await run(["A.md", "B.md"]);
    assert.deepStrictEqual(calls[1].eggs, ["B.md"]);
    assert.strictEqual(calls[1].stage, 2);
    assert.strictEqual(second.eggResults[0], first.eggResults[0]);
    assert.deepStrictEqual(second.matchedEggs, ["A.md", "B.md"]);
    assert.strictEqual(second.newKnowledge.length, 2);
    assert.strictEqual(second.shouldRead, true);
    const onlyB = await run(["B.md"]);
    assert.strictEqual(onlyB.readAction, "summary");
    assert.strictEqual(onlyB.shouldRead, false);
    assert.deepStrictEqual(onlyB.newKnowledge.map(entry => entry.egg), ["B.md"]);
    assert.strictEqual(onlyB.eggAnalysisCache.length, 2);
    const snapshot = session.snapshot();
    session.reset();
    session.restore(snapshot);
    // Captured history stores the same complete per-egg cache.
    session.analysisResult = JSON.parse(JSON.stringify(onlyB));
    await run([]);
    const again = await run(["A.md", "B.md"]);
    assert.strictEqual(calls.length, 2);
    assert.deepStrictEqual(again.matchedEggs, ["A.md", "B.md"]);
    assert.strictEqual(again.shouldRead, true);
    const oldCache = session.analysisResult;
    service.sendAnalyzeViaPort = async () => ({ error: "Temporary failure" });
    const failed = await runFailure(["A.md", "C.md"]);
    assert.strictEqual(failed.error, "Temporary failure");
    assert.strictEqual(session.analysisResult, oldCache);
    async function runFailure(selected) {
      return service.proceedStage2({ session, settings: new SettingsState(), tabStateManager: tabs, eggsToCompare: selected });
    }
    service.sendAnalyzeViaPort = async payload => {
      calls.push(payload);
      return { ...stage1, eggResults: [{ ...first.eggResults[0], readVerdictReason: "Fresh analysis" }] };
    };
    await service.proceedStage2({ session, settings: new SettingsState(), tabStateManager: tabs,
      eggsToCompare: ["A.md"], contentAnalysis: stage1, basePayload: { ...session.extractedContent, content: "Fresh content" } });
    assert.deepStrictEqual(calls[2].eggs, ["A.md"]);
    assert.strictEqual(session.analysisResult.eggResults[0].readVerdictReason, "Fresh analysis");
    assert.strictEqual(session.analysisResult.eggAnalysisCache, undefined);
  });

  it("incremental Stage 2 completion updates only the pinned tab's cache", async () => {
    const session = new SessionState();
    session.activeTabId = 101;
    const stage1 = { titleVerdict: "Tab 101", coreSummary: [], customQuestionAnswers: [] };
    const eggA = { egg: "A.md", readAction: "full", readVerdict: true, readVerdictReason: "A", extractedEntries: [], keyQuestionAnswers: [], readingSources: [] };
    session.analysisResult = globalThis.NutEggAI.composeEggResults(stage1, [eggA]);
    session.stage1ContentAnalysis = stage1;
    session.extractedContent = { url: "https://tab101.com", content: "Tab 101 content" };
    const tabs = new TabStateManager();
    const service = new AnalysisService();
    let finish;
    service.sendAnalyzeViaPort = payload => {
      assert.deepStrictEqual(payload.eggs, ["B.md"]);
      return new Promise(resolve => { finish = resolve; });
    };
    const pending = service.proceedStage2({ session, settings: new SettingsState(), tabStateManager: tabs, eggsToCompare: ["A.md", "B.md"] });
    session.activeTabId = 202;
    const otherResult = { titleVerdict: "Tab 202", eggResults: [] };
    session.analysisResult = otherResult;
    finish({ ...stage1, eggResults: [{ ...eggA, egg: "B.md" }] });
    await pending;
    assert.strictEqual(session.analysisResult, otherResult);
    assert.deepStrictEqual(tabs.get(101).analysisResult.matchedEggs, ["A.md", "B.md"]);
    assert.strictEqual(tabs.get(101).analysisResult.eggResults[0], eggA);
  });

  it("entry-generation preferences preserve cached entries and refresh answers-only results when enabled", async () => {
    const session = new SessionState();
    session.activeTabId = 101;
    session.extractedContent = { content: "Original content" };
    const analysis = { titleVerdict: "Verdict", coreSummary: [], customQuestionAnswers: [] };
    const complete = { egg: "A.md", generateKnowledgeEntries: true, extractedEntries: [{ content: "Insight" }], keyQuestionAnswers: [{ question: "Q", answer: "Answer" }], readAction: "full", readVerdictReason: "Useful", readingSources: [] };
    session.analysisResult = NutEggAI.composeEggResults(analysis, [complete]);
    const service = new AnalysisService();
    let calls = 0;
    service.sendAnalyzeViaPort = async payload => {
      calls++;
      assert.equal(payload.generateKnowledgeEntries, true);
      return NutEggAI.composeEggResults(analysis, [{ ...complete }]);
    };
    const run = () => service.proceedStage2({ session, settings: new SettingsState(), tabStateManager: new TabStateManager(), eggsToCompare: ["A.md"] });
    session.generateKnowledgeEntries = false;
    await run();
    assert.equal(session.analysisResult.newKnowledge.length, 2);
    assert.equal(session.analysisResult.eggResults[0].extractedEntries.length, 1);
    assert.equal(session.analysisResult.eggResults[0].keyQuestionAnswers.length, 1);
    assert.equal(session.analysisResult.eggAnalysisCache[0].extractedEntries.length, 1);
    session.generateKnowledgeEntries = true;
    await run();
    assert.equal(calls, 0);
    assert.ok(session.analysisResult.newKnowledge.length > 0);
    session.analysisResult = NutEggAI.composeEggResults(analysis, [{ ...complete, generateKnowledgeEntries: false, extractedEntries: [] }]);
    await run();
    assert.equal(calls, 1);
    session.analysisResult = NutEggAI.composeEggResults(analysis, [{ ...complete, generateKnowledgeEntries: false, entryGenerationDisabledByEgg: true, extractedEntries: [] }]);
    await run();
    assert.equal(calls, 1, 'An egg-level opt-out must not cause repeated analyses');
    assert.equal(session.analysisResult.newKnowledge.length, 0);
  });

  it("cached-only egg selection renders without an API key or source extraction", async () => {
    const { AnalyzeAction } = require("../src/popup/action/analyze.js");
    const session = new SessionState();
    session.activeTabId = 101;
    session.analysisResult = globalThis.NutEggAI.composeEggResults({ titleVerdict: "Verdict", coreSummary: [], customQuestionAnswers: [] },
      [{ egg: "A.md", readAction: "full", readVerdict: true, readVerdictReason: "Useful", readingSources: [], extractedEntries: [], keyQuestionAnswers: [] }]);
    session.selectedEggs = new Set(["A.md"]);
    const service = new AnalysisService();
    service.sendAnalyzeViaPort = () => assert.fail("Cached selection must not call AI");
    const action = new AnalyzeAction({ session, settings: new SettingsState(), tabStateManager: new TabStateManager(), analysisService: service,
      getTabAction: () => ({ extractPageContent: () => assert.fail("Cached selection must not extract the page") }),
    });
    action.getAnalyzeNotReadyReason = () => "No API key";
    await action.handleReanalyzeEggs();
    assert.deepStrictEqual(session.analysisResult.matchedEggs, ["A.md"]);
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

