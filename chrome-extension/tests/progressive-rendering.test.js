const test = require("node:test");
const assert = require("node:assert/strict");
require("../src/i18n.js");
require("../src/popup/helpers.js");
const { TabStateManager } = require("../src/popup/state/tab-state.js");
const { SectionChipsComponent } = require("../src/popup/ui/section-chips.js");

test("progressive rendering: switches view to results as soon as summary arrives", () => {
  const store = new TabStateManager();
  const tabId = 101;
  store.dispatch({ type: "extracted", tabId, content: { title: "Test Article", url: "https://example.com/test", content: "Body text" } });

  // Start analysis operation
  const ctx = store.beginOperation(tabId, "analysis", {}, []);
  assert.equal(store.getTab(tabId).currentView, "capture");
  assert.equal(store.getTab(tabId).operations.analysis?.running, true);

  // First AI returns: summary
  store.commitOperation(ctx.token, {
    type: "analysisPartial",
    partial: {
      type: "partial",
      section: "summary",
      data: {
        titleVerdict: "Direct answer to the title.",
        coreSummary: ["Bullet 1", "Bullet 2", "Bullet 3"],
        customQuestionAnswers: [],
      },
    },
  });

  const tabAfterSummary = store.getTab(tabId);
  assert.equal(tabAfterSummary.currentView, "results", "Should switch to results view immediately on summary");
  assert.equal(tabAfterSummary.analysisResult?.titleVerdict, "Direct answer to the title.");
  assert.deepEqual(tabAfterSummary.analysisResult?.coreSummary, ["Bullet 1", "Bullet 2", "Bullet 3"]);
  assert.equal(tabAfterSummary.analysisResult?.mindMap, undefined);
  assert.equal(tabAfterSummary.operations.analysis?.running, true, "Analysis should still be running");

  // Second AI returns: mindmap
  store.commitOperation(ctx.token, {
    type: "analysisPartial",
    partial: {
      type: "partial",
      section: "mindmap",
      data: {
        mindMap: [{ name: "Topic 1", detail: "Details here", children: [] }],
      },
    },
  });

  const tabAfterMindMap = store.getTab(tabId);
  assert.equal(tabAfterMindMap.currentView, "results");
  assert.equal(tabAfterMindMap.analysisResult?.titleVerdict, "Direct answer to the title.");
  assert.equal(tabAfterMindMap.analysisResult?.mindMap?.length, 1);
  assert.equal(tabAfterMindMap.analysisResult?.mindMap?.[0].name, "Topic 1");

  // Third event: egg matching returns
  store.commitOperation(ctx.token, {
    type: "analysisPartial",
    partial: {
      type: "partial",
      section: "matchedEggs",
      data: {
        matchedEggs: ["tech.md", "ai.md"],
      },
    },
  });

  const tabAfterEggs = store.getTab(tabId);
  assert.deepEqual([...tabAfterEggs.selectedEggs], ["tech.md", "ai.md"]);
  assert.deepEqual(tabAfterEggs.analysisResult?.matchedEggs, ["tech.md", "ai.md"]);

  // Finally: analysis completes
  const finalResult = {
    ...tabAfterEggs.analysisResult,
    stage: "stage1",
    mode: "obsidian",
  };
  store.commitOperation(ctx.token, {
    type: "analysisComplete",
    result: finalResult,
    stage1: true,
  });

  const tabFinished = store.getTab(tabId);
  assert.equal(tabFinished.operations.analysis?.running, false);
  assert.equal(tabFinished.analysisResult?.titleVerdict, "Direct answer to the title.");
  assert.equal(tabFinished.analysisResult?.mindMap?.length, 1);
  assert.deepEqual([...tabFinished.selectedEggs], ["tech.md", "ai.md"]);
});

function createMockElement(id = "") {
  return {
    id,
    textContent: "",
    innerHTML: "",
    className: "",
    style: {},
    disabled: false,
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c, force) {
        if (force !== undefined) { if (force) this._classes.add(c); else this._classes.delete(c); return force; }
        if (this._classes.has(c)) { this._classes.delete(c); return false; }
        this._classes.add(c); return true;
      }
    },
    addEventListener() {},
    setAttribute() {},
    getAttribute() { return ""; },
    removeAttribute() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
    focus() {},
    appendChild(child) { this.children = this.children || []; this.children.push(child); if (child) child.parentElement = this; },
  };
}

function createMockRoot() {
  const elements = new Map();
  return {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createMockElement(id));
      }
      return elements.get(id);
    },
    querySelectorAll: () => [],
    querySelector: () => null,
  };
}

test("progressive rendering: mind map shows in-progress placeholder card when loading", () => {
  const { MindmapComponent } = require("../src/popup/ui/mindmap.js");
  const root = createMockRoot();
  const comp = new MindmapComponent(root);

  // When isLoading is true and mind map nodes are not yet available
  comp.render(null, true, null, true);

  const section = root.getElementById("mindmap-section");
  const tree = root.getElementById("mindmap-tree");
  assert.equal(section.classList.contains("hidden"), false);
  assert.ok(tree.innerHTML.includes("mindmap-loading-indicator"));
  assert.ok(tree.innerHTML.includes("Mind Map generation in progress"));
  assert.ok(tree.innerHTML.includes("spinner-small"));
});

test("progressive rendering: discussion shows in-progress placeholder card when analyzing", () => {
  const { DiscussionComponent } = require("../src/popup/ui/discussion.js");
  const root = createMockRoot();
  const comp = new DiscussionComponent(root);

  const view = {
    enabledSections: { discussion: true },
    isAnalyzing: true,
    analysisResult: {
      titleVerdict: "Some title verdict",
      coreSummary: ["Bullet 1"],
      // discussion is not yet ready
    },
  };

  comp.render(view);

  const section = root.getElementById("discussion-section");
  const result = root.getElementById("discussion-result");
  assert.equal(section.classList.contains("hidden"), false);
  assert.ok(result.innerHTML.includes("discussion-loading-indicator"));
  assert.ok(result.innerHTML.includes("Discussion analysis in progress"));
  assert.ok(result.innerHTML.includes("spinner-small"));
});

test("progressive rendering: Chrome mode shows knowledge in-progress placeholder card", () => {
  const { EggsComponent } = require("../src/popup/ui/eggs.js");
  const { SettingsState } = require("../src/popup/state/settings-state.js");
  const root = createMockRoot();
  const comp = new EggsComponent(root);
  const settings = new SettingsState();
  settings.setConnectionMode("standalone", false);
  settings.setServerStatus({ online: false });

  const view = {
    isAnalyzing: true,
    enabledSections: { knowledge: true },
    generateKnowledgeEntries: true,
    allEggs: [],
    selectedEggs: new Set(),
    analysisResult: {
      mode: "chrome",
      titleVerdict: "Title",
      // extractedEntries not yet arrived
    },
  };

  comp.render(view, settings);

  const section = root.getElementById("chrome-knowledge-section");
  const content = root.getElementById("chrome-knowledge-content");
  assert.equal(section.classList.contains("hidden"), false);
  assert.ok(content.innerHTML.includes("knowledge-loading-indicator"));
  assert.ok(content.innerHTML.includes("Knowledge extraction in progress"));
  assert.ok(content.innerHTML.includes("spinner-small"));
});

test("progressive rendering: Obsidian mode shows egg knowledge in-progress placeholder card", () => {
  const { EggsComponent } = require("../src/popup/ui/eggs.js");
  const { SettingsState } = require("../src/popup/state/settings-state.js");
  const root = createMockRoot();
  const comp = new EggsComponent(root);
  const settings = new SettingsState();
  settings.setConnectionMode("obsidian", false);
  settings.setServerStatus({ online: true });

  const view = {
    isAnalyzing: true,
    analyzingEggs: true,
    isStage1: () => false,
    allEggs: [{ fileName: "Egg.md" }],
    selectedEggs: new Set(["Egg.md"]),
    analysisResult: {
      mode: "obsidian",
      stage: "stage2",
      matchedEggs: ["Egg.md"],
      // eggResults not yet arrived
    },
  };

  comp.render(view, settings);

  const section = root.getElementById("egg-knowledge-section");
  const content = root.getElementById("egg-knowledge-content");
  assert.equal(section.classList.contains("hidden"), false);
  assert.ok(content.innerHTML.includes("egg-knowledge-loading-indicator"));
  assert.ok(content.innerHTML.includes("Egg Knowledge analysis in progress"));
  assert.ok(content.innerHTML.includes("spinner-small"));
});

test("progressive rendering: Obsidian mode shows matching vault eggs in-progress placeholder", () => {
  const { EggsComponent } = require("../src/popup/ui/eggs.js");
  const { SettingsState } = require("../src/popup/state/settings-state.js");
  const root = createMockRoot();
  const comp = new EggsComponent(root);
  const settings = new SettingsState();
  settings.setConnectionMode("obsidian", false);
  settings.setServerStatus({ online: true });

  const view = {
    isAnalyzing: true,
    isStage1: () => true,
    allEggs: [{ fileName: "Topic.md" }],
    selectedEggs: new Set(),
    analysisResult: {
      mode: "obsidian",
      stage: "stage1",
      // matchedEggs not yet populated
    },
  };

  comp.render(view, settings);

  const toggleLabel = root.getElementById("eggs-toggle-label");
  assert.ok(toggleLabel.innerHTML.includes("Matching Vault Eggs in progress"));
  assert.ok(toggleLabel.innerHTML.includes("spinner-small"));
});

test("view switch to analysis results resets scroll to 0 and calls scrollTo(0, 0)", () => {
  const { ResultsViewComponent } = require("../src/popup/ui/results-view.js");
  const store = new TabStateManager();
  const tabId = 202;
  const ctx = store.beginOperation(tabId, "analysis", {}, []);

  // Simulate user scrolling down on capture view
  store.dispatch({ type: "draft", tabId, values: { presentation: { scroll: 420 } } });
  assert.equal(store.getTab(tabId).presentation.scroll, 420);
  store.commitOperation(ctx.token, {
    type: "analysisPartial",
    partial: {
      type: "partial",
      section: "summary",
      data: {
        titleVerdict: "Title verdict",
        coreSummary: ["Key takeaway"],
      },
    },
  });

  const tab = store.getTab(tabId);
  assert.equal(tab.currentView, "results");
  assert.equal(tab.presentation.scroll, 0, "presentation.scroll should be reset to 0 upon switching to results");

  // Verify ResultsViewComponent calls scrollTo(0, 0)
  const root = createMockRoot();
  const resultsComp = new ResultsViewComponent(root);
  let scrolledTo = null;
  globalThis.window = {
    scrollTo: (x, y) => { scrolledTo = [x, y]; },
  };

  resultsComp.render({ currentView: "results", analysisResult: tab.analysisResult });
  assert.deepEqual(scrolledTo, [0, 0], "should scroll back to top when switching to results view");

  // Subsequent render while remaining on results view should not re-trigger scrollTo
  scrolledTo = null;
  resultsComp.render({ currentView: "results", analysisResult: tab.analysisResult });
  assert.equal(scrolledTo, null, "should not force-scroll if already on results view");

  delete globalThis.window;
});

test("Default analysis sections - on fresh install only coreSummary and mindMap are enabled", () => {
  const { EggsComponent } = require("../src/popup/ui/eggs.js");
  const { SettingsState } = require("../src/popup/state/settings-state.js");
  const settings = new SettingsState();
  assert.equal(settings.enabledSections.coreSummary, true);
  assert.equal(settings.enabledSections.mindMap, true);
  assert.equal(settings.enabledSections.discussion, false);
  assert.equal(settings.generateKnowledgeEntries, false);

  const root = createMockRoot();
  const chips = new SectionChipsComponent(root);
  chips.updateUI(settings.enabledSections, settings.generateKnowledgeEntries, true);

  const verdictSummaryChip = root.getElementById("chip-verdict-summary");
  const mindmapChip = root.getElementById("chip-mindmap");
  const knowledgeChip = root.getElementById("chip-knowledge");
  const discussionChip = root.getElementById("chip-discussion");
  const badge = root.getElementById("sections-badge");

  assert.equal(verdictSummaryChip.classList.contains("active"), true);
  assert.equal(mindmapChip.classList.contains("active"), true);
  assert.equal(knowledgeChip.classList.contains("active"), false);
  assert.equal(knowledgeChip.classList.contains("inactive"), true);
  assert.equal(discussionChip.classList.contains("active"), false);
  assert.equal(discussionChip.classList.contains("inactive"), true);
  assert.equal(badge.textContent, "2/4");

  // Verify that during analysis with defaults, Knowledge does not show placeholder
  const eggsComp = new EggsComponent(root);
  const view = {
    isAnalyzing: true,
    enabledSections: { ...settings.enabledSections },
    generateKnowledgeEntries: settings.generateKnowledgeEntries,
    allEggs: [],
    selectedEggs: new Set(),
    analysisResult: { mode: "chrome" },
  };
  eggsComp.render(view, settings);
  const chromeKnowledgeSection = root.getElementById("chrome-knowledge-section");
  assert.equal(chromeKnowledgeSection.classList.contains("hidden"), true, "Chrome knowledge section should be hidden when not enabled");
});



