const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const { SettingsState, DEFAULT_ANALYSIS_SECTIONS } = require("../src/popup/state/settings-state.js");

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
  it('loads and bounds capture retry preferences, including zero retries', async () => {
    const stored = setupMockStorage({ captureRetryCount: 0, captureRetryDelayMs: 2500 });
    const settings = new SettingsState();
    assert.equal(settings.captureRetryCount, 3);
    assert.equal(settings.captureRetryDelayMs, 3000);
    await settings.loadFromStorage();
    assert.equal(settings.captureRetryCount, 0);
    assert.equal(settings.captureRetryDelayMs, 2500);
    settings.setCaptureRetries({ captureRetryCount: Infinity, captureRetryDelayMs: 'bad' });
    assert.equal(settings.captureRetryCount, 3);
    assert.equal(settings.captureRetryDelayMs, 3000);
    settings.setCaptureRetries({ captureRetryCount: 100, captureRetryDelayMs: -1 });
    assert.equal(settings.captureRetryCount, 10);
    assert.equal(settings.captureRetryDelayMs, 100);
    assert.equal(stored.captureRetryCount, 0);
  });
  it("toggles Verdict and Summary together while retaining a Stage 1 section", async () => {
    setupMockStorage();
    const settings = new SettingsState();
    assert.equal(await settings.toggleSection("verdictSummary"), true);
    assert.equal(settings.enabledSections.titleVerdict, false);
    assert.equal(settings.enabledSections.coreSummary, false);
    assert.equal(await settings.toggleSection("mindMap"), false);
    assert.equal(await settings.toggleSection("verdictSummary"), true);
    assert.equal(settings.enabledSections.titleVerdict, true);
    assert.equal(settings.enabledSections.coreSummary, true);
    assert.equal(await settings.toggleSection("mindMap"), true);
    assert.equal(await settings.toggleSection("verdictSummary"), false);
  });
  it("persists the last Knowledge choice as the default after reopening", async () => {
    const store = setupMockStorage();
    const settings = new SettingsState();
    settings.setGenerateKnowledgeEntries(true);
    assert.equal(store.generateKnowledgeEntries, true);
    const restored = new SettingsState();
    await restored.loadFromStorage();
    assert.equal(restored.generateKnowledgeEntries, true);
  });
  beforeEach(() => {
    setupMockStorage();
  });

  it("initializes with default values", () => {
    const settings = new SettingsState();
    assert.equal(settings.analysisMode, "preview");
    assert.equal(settings.outputLanguage, "same-as-content");
    assert.equal(settings.serverOnline, false);
    assert.equal(settings.obsidianPluginVersion, null);
    assert.equal(settings.obsidianAiConfigured, false);
    assert.equal(settings.connectionMode, "chrome");
    assert.equal(settings.chromeAiEnabled, true);
    assert.equal(settings.chromeAiConfigured, false);
    assert.deepEqual(settings.enabledSections, DEFAULT_ANALYSIS_SECTIONS);
    assert.equal(settings.generateKnowledgeEntries, false);
  });

  it("updates mode and language and persists to storage", () => {
    const store = setupMockStorage();
    const settings = new SettingsState();

    settings.setAnalysisMode("full");
    assert.equal(settings.analysisMode, "full");
    assert.equal(store.analysisMode, "full");

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

    // Connectivity does not change the user's selected mode.
    settings.serverOnline = false;
    assert.equal(settings.isChromeMode(), true);
  });

  it("uses Chrome by default and keeps Obsidian opt-in across reloads", async () => {
    const store = setupMockStorage({ chromeAiEnabled: false });
    const settings = new SettingsState();
    await settings.loadFromStorage();
    settings.serverOnline = true;
    assert.equal(settings.isChromeMode(), true, "An available server never opts a user into Obsidian");
    settings.setConnectionMode("obsidian");
    assert.equal(store.connectionMode, "obsidian");
    assert.equal(settings.serverOnline, false);
    assert.equal(settings.isChromeMode(), false, "An offline server never switches the selected backend");
    assert.equal(settings.isChromeMode({ mode: "chrome" }), true, "Existing result retains its backend");
    const restored = new SettingsState();
    await restored.loadFromStorage();
    assert.equal(restored.connectionMode, "obsidian");
    assert.equal(restored.chromeAiEnabled, false);
    restored.setConnectionMode("chrome");
    assert.equal(restored.chromeAiEnabled, true);
    assert.equal(restored.isChromeMode({ mode: "obsidian", matchedEggs: [] }), false);
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
      analysisMode: "preview",
      outputLanguage: "ja",
      enabledSections: { coreSummary: true, chapterMap: false },
    });

    const settings = new SettingsState();
    const loaded = await settings.loadFromStorage();

    assert.equal(loaded.analysisMode, "preview");
    assert.equal(loaded.outputLanguage, "ja");
    assert.equal(settings.analysisMode, "preview");
    assert.equal(settings.outputLanguage, "ja");
    assert.equal(settings.enabledSections.coreSummary, true);
    assert.equal("chapterMap" in settings.enabledSections, false);
    // Preserves defaults for unspecified sections
    assert.equal(settings.enabledSections.mindMap, true);
  });
});
