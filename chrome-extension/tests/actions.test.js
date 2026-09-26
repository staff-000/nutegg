const { describe, it } = require("node:test");
const assert = require("node:assert");

// Mock browser globals before loading actions
globalThis.chrome = {
  runtime: {
    sendMessage: async (msg) => {
      if (msg.action === "get-eggs") return { eggs: [{ fileName: "egg1.md" }, { fileName: "egg2.md" }] };
      return {};
    },
    openOptionsPage: () => {},
  },
  tabs: {
    query: async () => [{ id: 1, title: "Test Page", url: "https://example.com" }],
    get: async () => ({ id: 1, title: "Test Page", url: "https://example.com", status: "complete" }),
  },
};

const { TabAction } = require("../src/popup/action/tab.js");
const { AnalyzeAction } = require("../src/popup/action/analyze.js");
const { SaveAction } = require("../src/popup/action/save.js");
const { HistoryAction } = require("../src/popup/action/history.js");
const { InteractionAction } = require("../src/popup/action/interaction.js");

describe("Action Handlers", () => {
  describe("TabAction", () => {
    it("instantiates and fetches eggs via chrome.runtime", async () => {
      const session = { allEggs: [], preSelectedEggs: new Set(), reset: () => {}, nextRefreshSeq: () => 1 };
      let updatedLabel = null;
      let renderedList = null;
      const eggsUI = {
        updateCaptureLabel: (sel) => { updatedLabel = sel; },
        renderCaptureList: (opts) => { renderedList = opts; },
      };

      const tabAction = new TabAction({
        session,
        ui: { eggsUI },
      });

      const eggs = await tabAction.fetchEggs();
      assert.strictEqual(eggs.length, 2);
      assert.strictEqual(session.allEggs.length, 2);
      assert.ok(renderedList);
    });

    it("invalidates tab on tab removal", () => {
      let invalidated = null;
      const tabStateManager = {
        invalidateTab: (id) => { invalidated = id; },
      };
      const tabAction = new TabAction({ tabStateManager });
      tabAction.handleTabRemoved(42);
      assert.strictEqual(invalidated, 42);
    });

    it("snapshots active tab with customQuestions and analysisMode", () => {
      const session = {
        snapshot: (extra) => ({ test: true, ...extra }),
      };
      const captureUI = { getCustomQuestions: () => "What is this?" };
      const settings = { analysisMode: "confirm" };

      const tabAction = new TabAction({
        session,
        settings,
        ui: { captureUI },
      });

      const snap = tabAction.getActiveTabSnapshot();
      assert.strictEqual(snap.customQuestions, "What is this?");
      assert.strictEqual(snap.analysisMode, "confirm");
      assert.strictEqual(snap.test, true);
    });
  });

  describe("AnalyzeAction", () => {
    it("sets analysis mode and updates UI", () => {
      let modeSet = null;
      let appRendered = false;
      let expanded = false;
      const settings = { setAnalysisMode: (m) => { modeSet = m; } };
      const session = { isStage1: () => true, selectedEggs: new Set(["egg1.md"]), allEggs: [{}, {}] };
      const eggsUI = { expandEggsList: (exp) => { expanded = exp; } };
      const actionsUI = { updateStage1ProceedBtn: () => {} };

      const analyzeAction = new AnalyzeAction({
        session,
        settings,
        ui: { eggsUI, actionsUI },
        renderApp: () => { appRendered = true; },
      });

      analyzeAction.setAnalysisMode("confirm");
      assert.strictEqual(modeSet, "confirm");
      assert.strictEqual(appRendered, true);
      assert.strictEqual(expanded, true);
    });

    it("blocks analysis when page content is missing", async () => {
      let warned = null;
      const session = { activeTabId: 1, extractedContent: null };
      const bannersUI = { showWarning: (w) => { warned = w; } };

      const analyzeAction = new AnalyzeAction({
        session,
        ui: { bannersUI },
      });

      const res = await analyzeAction.handleAnalyze(true);
      assert.ok(res.includes("still loading"));
      assert.ok(warned.includes("still loading"));
    });

    it("handleReanalyzeEggs triggers re-analysis with selected eggs", async () => {
      let analyzedWithEggs = null;
      const session = {
        activeTabId: 1,
        selectedEggs: new Set(["EggA.md"]),
        extractedContent: { content: "Sample page content" },
        analysisResult: { stage: "stage2" },
      };
      let loadingState = null;
      const eggsUI = {
        reanalyzeEggsBtn: { disabled: false },
        setReanalyzeLoading: (loading, text) => { loadingState = { loading, text }; },
        clearError: () => {},
        showError: () => {},
      };
      const bannersUI = {
        hideMessages: () => {},
        hideWarning: () => {},
      };
      const analysisService = {
        analyze: async (opts) => {
          analyzedWithEggs = opts.eggsOverride;
          return { result: { stage: "stage2" } };
        },
      };

      const analyzeAction = new AnalyzeAction({
        session,
        analysisService,
        ui: { eggsUI, bannersUI },
      });

      await analyzeAction.handleReanalyzeEggs();
      assert.deepStrictEqual(analyzedWithEggs, ["EggA.md"]);
      assert.strictEqual(loadingState.loading, false);
    });
  });

  describe("SaveAction", () => {
    it("handles save success notification and triggers metrics fetch", () => {
      let successBanner = null;
      let metricsFetched = false;
      let actionButtonsRendered = false;

      const session = {
        captureHistory: [],
        currentNutId: 10,
        isStage1: () => false,
      };
      const bannersUI = {
        showSuccess: (msg) => { successBanner = msg; },
        hideSuccess: () => {},
      };
      const actionsUI = {
        renderHistory: () => {},
        render: () => { actionButtonsRendered = true; },
      };
      const envService = {
        fetchMetrics: () => { metricsFetched = true; },
      };

      const saveAction = new SaveAction({
        session,
        ui: { bannersUI, actionsUI },
        envService,
      });

      saveAction.handleSaveSuccessNotification({
        response: { merged: [] },
        newKnowledge: [{ egg: "Egg1", title: "Note" }],
        isHatch: true,
        result: {},
      });

      assert.ok(successBanner);
      assert.strictEqual(metricsFetched, true);
      assert.strictEqual(actionButtonsRendered, true);
    });

    it("triggers saveKnowledge on handleConfirm when new knowledge exists", async () => {
      let saveCalled = false;
      const session = {
        activeTabId: 1,
        analysisResult: { newKnowledge: [{ egg: "Egg1" }] },
        extractedContent: { content: "Page body" },
        eggHatched: false,
      };
      const analysisService = {
        saveKnowledge: async (args) => {
          saveCalled = true;
          return { success: true };
        },
      };

      const saveAction = new SaveAction({
        session,
        analysisService,
        ui: { actionsUI: { setConfirmButtonLoading: () => {}, render: () => {} } },
      });

      await saveAction.handleConfirm();
      assert.strictEqual(saveCalled, true);
    });
  });

  describe("HistoryAction", () => {
    it("loads history and updates session on loadHistoryIfAny", async () => {
      const session = {
        refreshSeq: 1,
        extractedContent: { url: "https://example.com" },
        captureHistory: [],
      };
      const settings = { serverOnline: true };
      const analysisService = {
        loadHistory: async () => [{ nutId: 123, saved: "saved", result: { title: "Archived Nut" } }],
      };

      let resultsRendered = null;
      const historyAction = new HistoryAction({
        session,
        settings,
        analysisService,
        ui: { actionsUI: { setAnalyzeButtonLoading: () => {}, showProcessedNote: () => {}, renderHistory: () => {} } },
        showResultsState: (res) => { resultsRendered = res; },
      });

      const loaded = await historyAction.loadHistoryIfAny(1);
      assert.strictEqual(loaded, true);
      assert.strictEqual(session.captureHistory.length, 1);
      assert.strictEqual(session.currentNutId, 123);
      assert.strictEqual(resultsRendered.title, "Archived Nut");
    });
  });

  describe("InteractionAction", () => {
    it("delegates seekToChapter and scrollToSection to pageExtractor", async () => {
      let sought = null;
      let scrolled = null;

      const pageExtractor = {
        seekToChapter: async (tabId, sec) => { sought = { tabId, sec }; return true; },
        scrollToSection: async (tabId, heading, quote) => { scrolled = { tabId, heading, quote }; return true; },
      };

      const session = { activeTabId: 5 };
      const interactionAction = new InteractionAction({
        session,
        pageExtractor,
      });

      await interactionAction.seekToChapter(120);
      assert.deepStrictEqual(sought, { tabId: 5, sec: 120 });

      await interactionAction.scrollToSection("Overview", "quote");
      assert.deepStrictEqual(scrolled, { tabId: 5, heading: "Overview", quote: "quote" });
    });
  });
});

