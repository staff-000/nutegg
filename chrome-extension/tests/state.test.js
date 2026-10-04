const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const { SettingsState, DEFAULT_ANALYSIS_SECTIONS } = require("../src/popup/state/settings-state.js");
const { SessionState } = require("../src/popup/state/session-state.js");

// Mock chrome.storage.local supporting both callbacks and promises
function setupMockStorage(initial = {}) {
  let store = { ...initial };
  globalThis.chrome = {
    storage: {
      local: {
        get: (keys, cb) => {
          let res = {};
          if (typeof keys === "string") {
            res = { [keys]: store[keys] };
          } else if (Array.isArray(keys)) {
            for (const k of keys) res[k] = store[k];
          } else if (typeof keys === "object" && keys !== null) {
            for (const k of Object.keys(keys)) {
              res[k] = store[k] !== undefined ? store[k] : keys[k];
            }
          } else {
            res = { ...store };
          }
          if (typeof cb === "function") {
            cb(res);
          }
          return Promise.resolve(res);
        },
        set: (items, cb) => {
          Object.assign(store, items);
          if (typeof cb === "function") {
            cb();
          }
          return Promise.resolve();
        },
      },
    },
  };
  return store;
}

describe("SettingsState", () => {
  it("persists the last Knowledge choice as the default after reopening", async () => {
    const store = setupMockStorage();
    const settings = new SettingsState();
    settings.setGenerateKnowledgeEntries(false);
    assert.equal(store.generateKnowledgeEntries, false);
    const restored = new SettingsState();
    await restored.loadFromStorage();
    assert.equal(restored.generateKnowledgeEntries, false);
  });
  beforeEach(() => {
    setupMockStorage();
  });

  it("initializes with default values", () => {
    const settings = new SettingsState();
    assert.equal(settings.analysisMode, "fast");
    assert.equal(settings.outputLanguage, "same-as-content");
    assert.equal(settings.serverOnline, false);
    assert.equal(settings.obsidianPluginVersion, null);
    assert.equal(settings.obsidianAiConfigured, false);
    assert.equal(settings.chromeAiEnabled, false);
    assert.equal(settings.chromeAiConfigured, false);
    assert.deepEqual(settings.enabledSections, DEFAULT_ANALYSIS_SECTIONS);
  });

  it("updates mode and language and persists to storage", () => {
    const store = setupMockStorage();
    const settings = new SettingsState();

    settings.setAnalysisMode("confirm");
    assert.equal(settings.analysisMode, "confirm");
    assert.equal(store.analysisMode, "confirm");

    settings.setOutputLanguage("zh-CN");
    assert.equal(settings.outputLanguage, "zh-CN");
    assert.equal(store.outputLanguage, "zh-CN");
  });

  it("updates server and Chrome AI status", () => {
    const settings = new SettingsState();
    settings.setServerStatus({
      online: true,
      version: "1.2.3",
      aiConfigured: true,
    });
    assert.equal(settings.serverOnline, true);
    assert.equal(settings.obsidianPluginVersion, "1.2.3");
    assert.equal(settings.obsidianAiConfigured, true);

    settings.setChromeAiStatus({
      enabled: true,
      configured: true,
      provider: "google",
      model: "gemini-pro",
    });
    assert.equal(settings.chromeAiEnabled, true);
    assert.equal(settings.chromeAiConfigured, true);
    assert.equal(settings.chromeAiProvider, "google");
    assert.equal(settings.chromeAiModel, "gemini-pro");

    assert.equal(settings.isChromeMode("chrome"), true);

    // If server is offline, fallback is chrome mode
    settings.serverOnline = false;
    assert.equal(settings.isChromeMode(), true);
  });

  it("toggles enabled sections and enforces minimum 1 section", async () => {
    const store = setupMockStorage();
    const settings = new SettingsState();

    // Toggle off mindMap
    const res1 = await settings.toggleSection("mindMap");
    assert.equal(res1, true);
    assert.equal(settings.enabledSections.mindMap, false);
    assert.equal(store.enabledSections.mindMap, false);

    // Disable all except coreSummary
    settings.setEnabledSections({
      titleVerdict: false,
      coreSummary: true,
      mindMap: false,
      chapterMap: false,
    });

    // Attempting to toggle off the last remaining section should fail
    const resLast = await settings.toggleSection("coreSummary");
    assert.equal(resLast, false);
    assert.equal(settings.enabledSections.coreSummary, true);
  });

  it("loads settings from chrome.storage.local", async () => {
    setupMockStorage({
      analysisMode: "confirm",
      outputLanguage: "ja",
      enabledSections: { coreSummary: true, chapterMap: false },
    });

    const settings = new SettingsState();
    const loaded = await settings.loadFromStorage();

    assert.equal(loaded.analysisMode, "confirm");
    assert.equal(loaded.outputLanguage, "ja");
    assert.equal(settings.analysisMode, "confirm");
    assert.equal(settings.outputLanguage, "ja");
    assert.equal(settings.enabledSections.coreSummary, true);
    assert.equal("chapterMap" in settings.enabledSections, false);
    // Preserves defaults for unspecified sections
    assert.equal(settings.enabledSections.mindMap, true);
  });
});

describe("SessionState", () => {
  it("initializes with default session state", () => {
    const session = new SessionState();
    assert.equal(session.activeTabId, null);
    assert.equal(session.currentTabLoading, false);
    assert.equal(session.extractedContent, null);
    assert.equal(session.analysisResult, null);
    assert.equal(session.currentNutId, null);
    assert.equal(session.nutCollected, false);
    assert.equal(session.eggHatched, false);
    assert.deepEqual(session.followUpQa, []);
    assert.equal(session.selectedEggs instanceof Set, true);
    assert.equal(session.preSelectedEggs instanceof Set, true);
  });

  it("resets session state while keeping active tab and sequence", () => {
    const session = new SessionState();
    session.activeTabId = 42;
    session.refreshSeq = 5;
    session.extractedContent = { title: "Test" };
    session.analysisResult = { summary: "Done" };
    session.currentNutId = "nut-1";
    session.nutCollected = true;
    session.eggHatched = true;
    session.selectedEggs.add("egg-1");
    session.followUpQa.push({ question: "Q?", answer: "A" });

    session.reset();

    assert.equal(session.activeTabId, 42);
    assert.equal(session.refreshSeq, 5);
    assert.equal(session.extractedContent, null);
    assert.equal(session.analysisResult, null);
    assert.equal(session.currentNutId, null);
    assert.equal(session.nutCollected, false);
    assert.equal(session.eggHatched, false);
    assert.deepEqual(session.followUpQa, []);
    assert.equal(session.selectedEggs.size, 0);
  });

  it("increments sequence number with nextRefreshSeq", () => {
    const session = new SessionState();
    assert.equal(session.refreshSeq, 0);
    assert.equal(session.nextRefreshSeq(), 1);
    assert.equal(session.nextRefreshSeq(), 2);
    assert.equal(session.refreshSeq, 2);
  });

  it("manages egg selection correctly", () => {
    const session = new SessionState();
    session.selectEgg("egg-a");
    assert.equal(session.isEggSelected("egg-a"), true);
    assert.equal(session.selectedEggs.size, 1);

    session.toggleEgg("egg-a");
    assert.equal(session.isEggSelected("egg-a"), false);

    session.toggleEgg("egg-b");
    assert.equal(session.isEggSelected("egg-b"), true);

    session.unselectEgg("egg-b");
    assert.equal(session.isEggSelected("egg-b"), false);

    session.preSelectEgg("egg-c");
    assert.equal(session.preSelectedEggs.has("egg-c"), true);
    session.clearPreSelectedEggs();
    assert.equal(session.preSelectedEggs.size, 0);
  });

  it("manages followUpQa", () => {
    const session = new SessionState();
    session.addFollowUpQa("What is this?", "NutEgg");
    assert.deepEqual(session.followUpQa, [
      { question: "What is this?", answer: "NutEgg", sources: undefined },
    ]);
  });

  it("creates and restores snapshots cleanly", () => {
    const session = new SessionState();
    session.extractedContent = { title: "Title", url: "https://example.com" };
    session.analysisResult = { summary: "Summary" };
    session.currentNutId = "nut-99";
    session.nutCollected = true;
    session.eggHatched = false;
    session.selectedEggs.add("egg-1");
    session.selectedEggs.add("egg-2");
    session.followUpQa.push({ question: "q1", answer: "a1" });

    const snap = session.snapshot({
      status: "done",
      customQuestions: "user question",
      analysisMode: "confirm",
    });

    assert.equal(snap.status, "done");
    assert.equal(snap.customQuestions, "user question");
    assert.equal(snap.analysisMode, "confirm");
    assert.equal(snap.extractedContent.title, "Title");
    assert.equal(snap.currentNutId, "nut-99");
    assert.deepEqual(snap.selectedEggs, new Set(["egg-1", "egg-2"]));

    // Restore into a fresh session
    const newSession = new SessionState();
    newSession.restore(snap);

    assert.equal(newSession.extractedContent.title, "Title");
    assert.equal(newSession.analysisResult.summary, "Summary");
    assert.equal(newSession.currentNutId, "nut-99");
    assert.equal(newSession.nutCollected, true);
    assert.equal(newSession.selectedEggs instanceof Set, true);
    assert.equal(newSession.selectedEggs.has("egg-1"), true);
    assert.equal(newSession.selectedEggs.has("egg-2"), true);
    assert.deepEqual(newSession.followUpQa, [{ question: "q1", answer: "a1" }]);
  });

  it("determines isStage1 correctly on session", () => {
    const session = new SessionState();
    assert.equal(session.isStage1(), false);

    // Stage 1 explicit
    session.analysisResult = { stage: "stage1", summary: "Content analysis" };
    assert.equal(session.isStage1(), true);

    // Chrome mode result
    session.analysisResult = { mode: "chrome", summary: "Chrome result" };
    assert.equal(session.isStage1(), true);

    // Stage 2 result with matched eggs
    session.analysisResult = { stage: "stage2", matchedEggs: ["egg-1"] };
    assert.equal(session.isStage1(), false);

    // Passed result override
    assert.equal(session.isStage1({ stage: "stage1" }), true);
    assert.equal(session.isStage1({ stage: "done" }), false);
  });
});
