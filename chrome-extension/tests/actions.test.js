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

    it("keeps newly created eggs when an older list request finishes", async () => {
      const oldSender = chrome.runtime.sendMessage;
      let finishFetch;
      chrome.runtime.sendMessage = () => new Promise(resolve => { finishFetch = resolve; });
      try {
        const session = { allEggs: [{ fileName: "old.md" }], preSelectedEggs: new Set(["old.md"]), selectedEggs: new Set(["old.md"]) };
        let captureList, resultList;
        const action = new TabAction({ session, ui: { eggsUI: {
          renderCaptureList: options => { captureList = options; },
          renderSection: (_, options) => { resultList = options; },
        } } });
        const pending = action.fetchEggs();
        action.addCreatedEgg({ fileName: "new.md", description: "New egg" });
        action.addCreatedEgg({ fileName: "new.md", description: "Duplicate" });
        assert.deepStrictEqual(captureList.allEggs.map(egg => egg.fileName), ["old.md", "new.md"]);
        assert.strictEqual(captureList.preSelectedEggs, session.preSelectedEggs);
        assert.strictEqual(resultList.selectedEggs, session.selectedEggs);
        finishFetch({ eggs: [{ fileName: "old.md" }] });
        await pending;
        assert.strictEqual(session.allEggs.length, 2);
      } finally {
        chrome.runtime.sendMessage = oldSender;
      }
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
      });
      assert.deepEqual(uiUpdatedSections, {
        titleVerdict: true,
        coreSummary: true,
        mindMap: false,
      });

      // 3. On Tab B, user changes to section x only (titleVerdict only)
      session.enabledSections = {
        titleVerdict: true,
        coreSummary: false,
        mindMap: false,
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
      });
      assert.deepEqual(uiUpdatedSections, {
        titleVerdict: true,
        coreSummary: true,
        mindMap: false,
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
      });
      assert.deepEqual(uiUpdatedSections, {
        titleVerdict: true,
        coreSummary: false,
        mindMap: false,
      });
    });

    it("preserves x on Tab A and x+y on Tab B without overriding each other", async () => {
      let uiUpdatedSections = null;
      const sectionsUI = {
        updateUI: (sections) => { uiUpdatedSections = { ...sections }; },
      };
      const captureUI = {
        render: () => {},
        setPageInfo: () => {},
        setLoading: () => {},
        setRefreshDisabled: () => {},
      };
      const bannersUI = { hideAll: () => {} };

      const settings = {
        enabledSections: {
          titleVerdict: true,
          coreSummary: false,
          mindMap: false,
        },
        setEnabledSections: (s) => { settings.enabledSections = { ...s }; },
      };

      const session = {
        activeTabId: 10,
        enabledSections: {
          titleVerdict: true,
          coreSummary: false,
          mindMap: false,
        },
        customQuestionsScope: "within",
        followupScope: "within",
        nextRefreshSeq: () => 1,
        reset: () => {},
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

      // 1. Initial: Tab A (id=10) has section x only
      globalThis.__testActiveTabId = 10;
      tabStateManager.saveActiveTabState(10, { enabledSections: session.enabledSections });

      // 2. Switch to Tab B (id=20), new tab
      globalThis.__testActiveTabId = 20;
      await tabAction.handleTabActivated({ tabId: 20 });
      assert.strictEqual(session.activeTabId, 20);
      assert.strictEqual(session.enabledSections.titleVerdict, true);
      assert.strictEqual(session.enabledSections.coreSummary, false);

      // 3. User on Tab B selects x + y (enables coreSummary)
      session.enabledSections = {
        ...session.enabledSections,
        coreSummary: true,
      };
      settings.setEnabledSections(session.enabledSections, true);
      tabStateManager.saveActiveTabState(20, { enabledSections: session.enabledSections });
      sectionsUI.updateUI(session.enabledSections);

      // Verify Tab B now shows and has x + y
      assert.strictEqual(session.enabledSections.titleVerdict, true);
      assert.strictEqual(session.enabledSections.coreSummary, true);
      assert.strictEqual(uiUpdatedSections.titleVerdict, true);
      assert.strictEqual(uiUpdatedSections.coreSummary, true);

      // 4. Switch back to Tab A (id=10)
      globalThis.__testActiveTabId = 10;
      await tabAction.handleTabActivated({ tabId: 10 });
      assert.strictEqual(session.activeTabId, 10);
      // Tab A must still only have x
      assert.strictEqual(session.enabledSections.titleVerdict, true);
      assert.strictEqual(session.enabledSections.coreSummary, false);
      assert.strictEqual(uiUpdatedSections.titleVerdict, true);
      assert.strictEqual(uiUpdatedSections.coreSummary, false);

      // 5. Switch back to Tab B (id=20)
      globalThis.__testActiveTabId = 20;
      await tabAction.handleTabActivated({ tabId: 20 });
      assert.strictEqual(session.activeTabId, 20);
      // Tab B must still have x + y
      assert.strictEqual(session.enabledSections.titleVerdict, true);
      assert.strictEqual(session.enabledSections.coreSummary, true);
      assert.strictEqual(uiUpdatedSections.titleVerdict, true);
      assert.strictEqual(uiUpdatedSections.coreSummary, true);
    });
  });

  describe("AnalyzeAction", () => {
    it("analysis menu choices set entry generation and analyze without saving", async () => {
      const session = { generateKnowledgeEntries: true, activeTabId: 1 };
      const action = new AnalyzeAction({ session, getSaveAction: () => ({ handleConfirm: () => assert.fail("Analysis must not save") }) });
      const modes = [];
      action.handleReanalyzeEggs = async () => { modes.push(session.generateKnowledgeEntries); };
      await action.handleEggAnalysis(false);
      await action.handleEggAnalysis(true);
      assert.deepEqual(modes, [false, true]);
    });

    it("toggles cached entries and Hatch data without losing answers or another tab's preference", () => {
      const fs = require("node:fs");
      globalThis.NutEggAI = new Function(fs.readFileSync(require.resolve("../dist/ai-core.js"), "utf8") + "\nreturn NutEggAI;")();
      const { SessionState } = require("../src/popup/state/session-state.js");
      const { TabStateManager } = require("../src/popup/state/tab-state.js");
      const session = new SessionState();
      const tabs = new TabStateManager();
      const egg = { egg: "a.md", readAction: "full", extractedEntries: [{ content: "Insight" }],
        keyQuestionAnswers: [{ question: "Why?", answer: "Evidence" }] };
      session.activeTabId = 1;
      session.analysisResult = NutEggAI.composeEggResults({ coreSummary: ["Summary"] }, [egg]);
      tabs.set(2, { generateKnowledgeEntries: true });
      const action = new AnalyzeAction({ session, tabStateManager: tabs });
      action.setGenerateKnowledgeEntries(false);
      assert.deepEqual(session.analysisResult.newKnowledge, []);
      assert.deepEqual(session.analysisResult.eggResults[0].extractedEntries, []);
      assert.equal(session.analysisResult.eggResults[0].keyQuestionAnswers[0].answer, "Evidence");
      assert.equal(session.analysisResult.shouldRead, true);
      assert.equal(tabs.get(1).generateKnowledgeEntries, false);
      assert.equal(tabs.get(2).generateKnowledgeEntries, true);
      session.restore(tabs.get(1));
      assert.equal(session.generateKnowledgeEntries, false);
      action.setGenerateKnowledgeEntries(true);
      assert.equal(session.analysisResult.newKnowledge.length, 2);
      assert.deepEqual(session.analysisResult.eggResults[0].extractedEntries, egg.extractedEntries);
    });
    it("navigates between content and existing analysis without AI calls or losing tab-specific save state", () => {
      const { SessionState } = require("../src/popup/state/session-state.js");
      const { TabStateManager } = require("../src/popup/state/tab-state.js");
      const session = new SessionState();
      const tabs = new TabStateManager();
      session.activeTabId = 1;
      session.analysisResult = { coreSummary: ["Saved answer"] };
      session.currentNutId = 42;
      session.eggHatched = true;
      session.nutCollected = true;
      session.followUpQa = [{ question: "Q", answer: "A" }];
      tabs.set(1, { status: "done" });
      tabs.set(2, { analysisResult: { coreSummary: ["Other tab"] }, viewingContent: false });
      const original = session.analysisResult;
      let shown = null;
      const action = new AnalyzeAction({ session, tabStateManager: tabs,
        analysisService: { analyze: () => assert.fail("Navigation must not call AI") },
        renderApp: () => {}, showResultsState: result => { shown = result; },
      });
      action.handleBackToContent();
      assert.equal(session.viewingContent, true);
      assert.equal(session.analysisResult, original);
      assert.equal(tabs.get(1).status, "done");
      assert.equal(tabs.get(1).viewingContent, true);
      session.restore(tabs.get(2));
      assert.equal(session.viewingContent, false);
      assert.deepEqual(session.analysisResult.coreSummary, ["Other tab"]);
      session.restore(tabs.get(1));
      assert.equal(session.viewingContent, true);
      action.handleViewAnalysis();
      assert.equal(shown, original);
      assert.equal(session.viewingContent, false);
      assert.equal(tabs.get(1).viewingContent, false);
      assert.equal(session.currentNutId, 42);
      assert.equal(session.eggHatched, true);
      assert.equal(session.nutCollected, true);
      assert.deepEqual(session.followUpQa, [{ question: "Q", answer: "A" }]);
      session.reset();
      assert.equal(session.viewingContent, false);
      shown = null;
      action.handleViewAnalysis();
      assert.equal(shown, null);
    });

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

    it("handleReanalyzeEggs runs only Stage 2 with selected eggs", async () => {
      let analyzedWithEggs = null;
      const session = {
        activeTabId: 1,
        selectedEggs: new Set(["EggA.md"]),
        extractedContent: { content: "Sample page content" },
        analysisResult: { stage: "stage2" },
      };
      let loadingState = null;
      const eggsUI = {

        clearError: () => {},
        showError: () => {},
      };
      const bannersUI = {
        hideMessages: () => {},
        hideWarning: () => {},
      };
      const analysisService = {
        analyze: async () => assert.fail("Selected-egg re-analysis must not run Stage 1"),
        proceedStage2: async (opts) => {
          analyzedWithEggs = opts.eggsToCompare;
          return { result: { stage: "stage2" } };
        },
      };

      const analyzeAction = new AnalyzeAction({
        session,
        analysisService,
        ui: { eggsUI, bannersUI, actionsUI: {
          stage1ProceedBtn: { disabled: false },
          setEggAnalysisLoading: (loading, text) => { loadingState = { loading, text }; },
        } },
      });

      await analyzeAction.handleReanalyzeEggs();
      assert.deepStrictEqual(analyzedWithEggs, ["EggA.md"]);
      assert.strictEqual(loadingState.loading, false);
    });
  });

  describe("SaveAction", () => {
    it("Hatch saves generated entries with answers and refuses answers-only results", async () => {
      const fs = require("node:fs");
      globalThis.NutEggAI = new Function(fs.readFileSync(require.resolve("../dist/ai-core.js"), "utf8") + "\nreturn NutEggAI;")();
      const egg = { egg: "a.md", readAction: "full", extractedEntries: [{ content: "Extracted insight" }],
        keyQuestionAnswers: [{ question: "Q", answer: "Answer" }] };
      const result = NutEggAI.composeEggResults({}, [egg]);
      const session = { activeTabId: 1, analysisResult: result, extractedContent: { content: "Source" } };
      const action = new SaveAction({ session });
      let saved;
      action.doSave = async entries => { saved = entries; };
      action.updateActionButtons = () => {};
      await action.handleConfirm();
      assert.equal(saved.length, 2);
      saved = null;
      session.analysisResult = NutEggAI.composeEggResults({}, [{ ...egg, extractedEntries: [] }]);
      await action.handleConfirm();
      assert.equal(saved, null);
      assert.equal(result.eggResults[0].extractedEntries.length, 1);
    });

    it("shows a created egg immediately while re-analysis is still pending", async () => {
      for (const inline of [true, false]) {
        const session = { activeTabId: 1, allEggs: [], selectedEggs: new Set(), preSelectedEggs: new Set() };
        let shown = false, finishAnalysis, markStarted;
        const started = new Promise(resolve => { markStarted = resolve; });
        const eggsUI = {
          getNewEggInput: () => ({ name: "My Egg", desc: "Useful ideas" }),
          setCreateButtonLoading: () => {}, resetCreateForm: () => {},
          renderCaptureList: options => { shown = options.allEggs.some(egg => egg.fileName === "My Egg.md"); },
          renderSection: () => {},
        };
        const tabAction = new TabAction({ session, ui: { eggsUI } });
        const action = new SaveAction({ session, ui: { eggsUI }, getTabAction: () => tabAction,
          analysisService: { createEgg: async () => ({ success: true, path: "nutegg/My Egg.md" }) },
          getAnalyzeAction: () => ({ handleAnalyze: (force, eggs) => {
            assert.strictEqual(shown, true);
            assert.strictEqual(force, true);
            if (!inline) assert.deepStrictEqual(eggs, ["My Egg.md"]);
            markStarted();
            return new Promise(resolve => { finishAnalysis = resolve; });
          } }),
        });
        const pending = action.handleCreateEgg(inline);
        await started;
        assert.deepStrictEqual(session.allEggs, [{ fileName: "My Egg.md", description: "Useful ideas" }]);
        finishAnalysis();
        await pending;
      }
    });

    it("does not add an egg after failed creation or update another tab", async () => {
      for (const switchTab of [false, true]) {
        const session = { activeTabId: 1 };
        let added = false;
        const action = new SaveAction({ session, ui: { eggsUI: { getNewEggInput: () => ({ name: "Egg" }) } },
          getTabAction: () => ({ addCreatedEgg: () => { added = true; } }),
          analysisService: { createEgg: async () => {
            if (switchTab) session.activeTabId = 2;
            return { success: switchTab, path: "nutegg/Egg.md" };
          } },
        });
        await action.handleCreateEgg(true);
        assert.strictEqual(added, false);
      }
    });

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

