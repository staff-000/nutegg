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
    assert.equal(settings.analysisMode, "full");
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

    settings.setAnalysisMode("preview");
    assert.equal(settings.analysisMode, "preview");
    assert.equal(store.analysisMode, "preview");

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
