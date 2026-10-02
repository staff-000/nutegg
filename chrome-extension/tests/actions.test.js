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
    query: async () => [{ id: globalThis.__testActiveTabId || 1, title: "Test Page", url: "https://example.com" }],
    get: async (id) => ({ id: id || globalThis.__testActiveTabId || 1, title: "Test Page", url: "https://example.com", status: "complete" }),
  },
};

require("../src/i18n.js");
require("../src/popup/helpers.js");

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

    it("snapshots active banners and isolates banners across tab switches", async () => {
      let currentWarning = "Could not extract content from this page";
      let allHidden = false;
      const bannersUI = {
        getWarning: () => currentWarning,
        getError: () => null,
        getErrorCode: () => null,
        getDuplicate: () => null,
        showWarning: (w) => { currentWarning = w; },
        hideAll: () => { allHidden = true; currentWarning = null; },
        hideMessages: () => { currentWarning = null; },
      };

      const session = {
        activeTabId: 2,
        snapshot: (extra) => ({ activeTabId: session.activeTabId, ...extra }),
        restore: (st) => { session.activeTabId = st.activeTabId; session.analysisResult = st.analysisResult; },
        nextRefreshSeq: () => 2,
      };

      const tabCache = new Map();
      tabCache.set(1, {
        activeTabId: 1,
        analysisResult: { titleVerdict: "Good" },
        extractedContent: { title: "Tab 1" },
        status: "done",
      });

      const tabStateManager = {
        switchActiveTab: (toTabId, departingState) => {
          if (departingState) tabCache.set(departingState.activeTabId, departingState);
          return { targetState: tabCache.get(toTabId) };
        },
        restoreTabState: (tabId) => tabCache.get(tabId),
        isExtracting: () => false,
      };

      let resultsRendered = null;
      const tabAction = new TabAction({
        session,
        tabStateManager,
        ui: { bannersUI, captureUI: { render: () => {} } },
        showResultsState: (res) => { resultsRendered = res; },
        showCaptureState: () => {},
      });

      // While on Tab 2, snapshot contains the active warning
      const snapTab2 = tabAction.getActiveTabSnapshot();
      assert.strictEqual(snapTab2.warning, "Could not extract content from this page");

      // Switch to Tab 1 (which has valid results)
      await tabAction.handleTabActivated({ tabId: 1 });

      // Tab 2's warning banner MUST be hidden and NOT pinned on Tab 1
      assert.strictEqual(allHidden, true);
      assert.strictEqual(currentWarning, null);
      assert.strictEqual(session.activeTabId, 1);
      assert.ok(resultsRendered);

      // Now switch back to Tab 2
      allHidden = false;
      await tabAction.handleTabActivated({ tabId: 2 });
      assert.strictEqual(session.activeTabId, 2);
      // Tab 2 restores its warning banner
      assert.strictEqual(currentWarning, "Could not extract content from this page");
    });

    it("preserves per-tab section selection and defaults new tabs to last active sections", async () => {
      let uiUpdatedSections = null;
      const sectionsUI = {
        updateUI: (sec) => { uiUpdatedSections = { ...sec }; },
      };
      const captureUI = {
        render: () => {},
        setPageInfo: () => {},
        setLoading: () => {},
        setRefreshDisabled: () => {},
      };
      const bannersUI = {
        hideAll: () => {},
      };

      const settings = {
        enabledSections: {
          titleVerdict: true,
          coreSummary: true,
          mindMap: true,
          chapterMap: true,
        },
        setEnabledSections: (s) => { settings.enabledSections = { ...s }; },
      };

      const session = {
        activeTabId: 1,
        enabledSections: null,
        customQuestionsScope: "within",
        followupScope: "within",
        nextRefreshSeq: () => 1,
        reset: () => { session.enabledSections = null; },
        snapshot: (extra = {}) => ({
          activeTabId: session.activeTabId,
          enabledSections: session.enabledSections ? { ...session.enabledSections } : null,
          ...extra,
        }),
        restore: (st = {}) => {
          session.activeTabId = st.activeTabId;
          session.enabledSections = st.enabledSections ? { ...st.enabledSections } : null;
        },
      };

      const tabCache = new Map();
      const tabStateManager = {
        get: (id) => tabCache.get(id),
        set: (id, val) => tabCache.set(id, val),
        saveActiveTabState: (id, state) => {
          const prev = tabCache.get(id) || {};
          const merged = { ...prev, ...state };
          tabCache.set(id, merged);
          return merged;
        },
        restoreTabState: (id) => tabCache.get(id) || null,
        switchActiveTab: (toTabId, departingState) => {
          if (departingState) {
            tabStateManager.saveActiveTabState(session.activeTabId, departingState);
          }
          session.activeTabId = toTabId;
          return { targetState: tabStateManager.restoreTabState(toTabId) };
        },
        setActiveTabId: (id) => { session.activeTabId = id; },
        setCurrentTabLoading: () => {},
        isExtracting: () => false,
      };

      const tabAction = new TabAction({
        session,
        settings,
        tabStateManager,
        ui: { sectionsUI, captureUI, bannersUI },
        pageExtractor: {
          waitForTabComplete: async () => {},
          waitForPageSettle: async () => {},
          extractPage: async () => ({ title: "Page", content: "Content", url: "https://example.com" }),
        },
        getAnalyzeAction: () => ({ updateAnalyzeButtonsState: () => {} }),
      });

      // 1. Tab A (id=1): User selects sections x, y (titleVerdict, coreSummary)
      globalThis.__testActiveTabId = 1;
      session.activeTabId = 1;
      session.enabledSections = {
        titleVerdict: true,
        coreSummary: true,
        mindMap: false,
        chapterMap: false,
      };
      settings.setEnabledSections(session.enabledSections, true);
      tabStateManager.saveActiveTabState(1, { enabledSections: session.enabledSections });

      // 2. Switch to Tab B (id=2), which is a new tab
      globalThis.__testActiveTabId = 2;
      await tabAction.handleTabActivated({ tabId: 2 });

      // Tab B should inherit Tab A's sections as default
      assert.strictEqual(session.activeTabId, 2);
      assert.deepEqual(session.enabledSections, {
        titleVerdict: true,
        coreSummary: true,
        mindMap: false,
        chapterMap: false,
      });
      assert.deepEqual(uiUpdatedSections, {
        titleVerdict: true,
        coreSummary: true,
        mindMap: false,
        chapterMap: false,
      });

      // 3. On Tab B, user changes to section x only (titleVerdict only)
      session.enabledSections = {
        titleVerdict: true,
        coreSummary: false,
        mindMap: false,
        chapterMap: false,
      };
      settings.setEnabledSections(session.enabledSections, true);
      tabStateManager.saveActiveTabState(2, { enabledSections: session.enabledSections });

      // 4. Switch back to Tab A (id=1)
      globalThis.__testActiveTabId = 1;
      await tabAction.handleTabActivated({ tabId: 1 });

      // Tab A should restore its own sections (both x and y: titleVerdict and coreSummary)
      assert.strictEqual(session.activeTabId, 1);
      assert.deepEqual(session.enabledSections, {
        titleVerdict: true,
        coreSummary: true,
        mindMap: false,
        chapterMap: false,
      });
      assert.deepEqual(uiUpdatedSections, {
        titleVerdict: true,
        coreSummary: true,
        mindMap: false,
        chapterMap: false,
      });

      // 5. Open/switch to a new Tab C (id=3)
      // Since Tab A was last active with (x, y), Tab C must default to Tab A's (x, y)
      globalThis.__testActiveTabId = 3;
      await tabAction.handleTabActivated({ tabId: 3 });
      assert.strictEqual(session.activeTabId, 3);
      assert.deepEqual(session.enabledSections, {
        titleVerdict: true,
        coreSummary: true,
        mindMap: false,
        chapterMap: false,
      });

      // 6. Switch to Tab B (id=2)
      // Tab B should restore its own x-only configuration
      globalThis.__testActiveTabId = 2;
      await tabAction.handleTabActivated({ tabId: 2 });
      assert.strictEqual(session.activeTabId, 2);
      assert.deepEqual(session.enabledSections, {
        titleVerdict: true,
        coreSummary: false,
        mindMap: false,
        chapterMap: false,
      });
      assert.deepEqual(uiUpdatedSections, {
        titleVerdict: true,
        coreSummary: false,
        mindMap: false,
        chapterMap: false,
      });
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

