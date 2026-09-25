const { describe, it } = require("node:test");
const assert = require("node:assert");

const { HeaderComponent } = require("../src/popup/ui/header.js");
const { BannersComponent } = require("../src/popup/ui/banners.js");
const { CaptureViewComponent } = require("../src/popup/ui/capture-view.js");
const { SectionChipsComponent } = require("../src/popup/ui/section-chips.js");
const { VerdictComponent } = require("../src/popup/ui/verdict.js");
const { ActionControlsComponent } = require("../src/popup/ui/action-controls.js");
const { ResultsViewComponent } = require("../src/popup/ui/results-view.js");
const { MetricsComponent } = require("../src/popup/ui/metrics.js");
const { MindmapComponent } = require("../src/popup/ui/mindmap.js");
const { ChaptersComponent } = require("../src/popup/ui/chapters.js");
const { QaComponent } = require("../src/popup/ui/qa.js");
const { EggsComponent } = require("../src/popup/ui/eggs.js");

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
      toggle(c) {
        if (this._classes.has(c)) { this._classes.delete(c); return false; }
        this._classes.add(c); return true;
      }
    },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; },
    addEventListener() {},
    scrollIntoView() {},
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
    }
  };
}

describe("Modular UI Components", () => {
  it("HeaderComponent binds DOM and updates version & server status", () => {
    const root = createMockRoot();
    const header = new HeaderComponent(root);
    assert.ok(header.serverStatus);
    assert.ok(header.versionTag);

    header.updateVersion("0.2.0", "0.2.0");
    assert.strictEqual(header.versionTag.textContent, "NutEgg v0.2.0");

    header.updateServerStatus("obsidian-online", "0.2.0");
    assert.strictEqual(header.serverStatus.className, "status-dot online");

    header.updateServerStatus("chrome-ai", null, "Gemini");
    assert.strictEqual(header.serverStatus.className, "status-dot chrome-ai");
  });

  it("BannersComponent manages error, warning, duplicate, and success banners", () => {
    const root = createMockRoot();
    const banners = new BannersComponent(root);

    banners.showError("Failed to fetch");
    assert.strictEqual(banners.errorMessage.textContent, "Failed to fetch");
    assert.strictEqual(banners.errorBanner.classList.contains("hidden"), false);

    banners.showWarning("Low memory");
    assert.strictEqual(banners.warningMessage.textContent, "Low memory");

    banners.hideWarning();
    assert.strictEqual(banners.warningBanner.classList.contains("hidden"), true);

    banners.showDuplicate("Note already exists");
    assert.strictEqual(banners.duplicateMessage.textContent, "Note already exists");

    banners.hideMessages();
    assert.strictEqual(banners.errorBanner.classList.contains("hidden"), true);
    assert.strictEqual(banners.duplicateBanner.classList.contains("hidden"), true);
  });

  it("CaptureViewComponent renders extracted content and provenance", () => {
    const root = createMockRoot();
    const captureView = new CaptureViewComponent(root);

    captureView.render({
      title: "Test Page",
      url: "https://example.com",
      sourceType: "article",
      content: "Hello world content",
      metadata: { author: "Alice", published: "2026-01-01" },
    });

    assert.strictEqual(captureView.pageTitle.textContent, "Test Page");
    assert.strictEqual(captureView.pageUrl.textContent, "https://example.com");
    assert.strictEqual(captureView.contentPreview.textContent, "Hello world content");
    assert.ok(captureView.pageAuthorEl.textContent.includes("Alice"));
  });

  it("SectionChipsComponent binds capture and re-analyze section chips", () => {
    const root = createMockRoot();
    const chips = new SectionChipsComponent(root);

    assert.ok(chips.chipVerdict);
    assert.ok(chips.chipSummary);
    assert.ok(chips.chipMindmap);
    assert.ok(chips.chipChapters);
    assert.ok(chips.reanalyzeChipVerdict);
    assert.ok(chips.sectionsToggle);
  });

  it("VerdictComponent renders decision verdicts and title verdict", () => {
    const root = createMockRoot();
    const verdict = new VerdictComponent(root);

    verdict.renderTitleVerdict("Yes, it's worth it");
    assert.strictEqual(verdict.verdictAnswer.textContent, "Yes, it's worth it");
    assert.strictEqual(verdict.titleVerdictSection.classList.contains("hidden"), false);

    verdict.renderDecision({ shouldRead: true, shouldReadReason: "Highly relevant" });
    assert.strictEqual(verdict.verdictIcon.textContent, "✅");
    assert.strictEqual(verdict.verdictReason.textContent, "Highly relevant");
  });

  it("ActionControlsComponent handles fast/confirm mode and buttons", () => {
    const root = createMockRoot();
    const actions = new ActionControlsComponent(root);

    actions.setMode("confirm");
    assert.strictEqual(actions.modeConfirmBtn.classList.contains("active"), true);
    assert.strictEqual(actions.modeFastBtn.classList.contains("active"), false);

    actions.setMode("fast");
    assert.strictEqual(actions.modeFastBtn.classList.contains("active"), true);
    assert.strictEqual(actions.modeConfirmBtn.classList.contains("active"), false);
  });

  it("ResultsViewComponent toggles between capture and results states", () => {
    const root = createMockRoot();
    const results = new ResultsViewComponent(root);

    results.showResults();
    assert.strictEqual(results.captureState.classList.contains("hidden"), true);
    assert.strictEqual(results.resultsState.classList.contains("hidden"), false);

    results.showCapture();
    assert.strictEqual(results.resultsState.classList.contains("hidden"), true);
    assert.strictEqual(results.captureState.classList.contains("hidden"), false);

    results.renderCoreSummary("Summary text here");
    assert.strictEqual(results.coreSummaryEl.textContent, "Summary text here");
  });

  it("MetricsComponent renders usage metrics and plugin links", () => {
    const root = createMockRoot();
    const metrics = new MetricsComponent(root);

    metrics.render({ nuts: 42, eggs: 5, timeSaved: "1h 20m" });
    assert.strictEqual(metrics.metricNuts.textContent, 42);
    assert.strictEqual(metrics.metricEggs.textContent, 5);
    assert.strictEqual(metrics.metricTime.textContent, "1h 20m");

    metrics.showPluginLink(true);
    assert.strictEqual(metrics.obsidianPluginLink.classList.contains("hidden"), false);
  });

  it("Mindmap, Chapters, Qa, and Eggs components bind their respective DOM elements", () => {
    const root = createMockRoot();
    const mindmap = new MindmapComponent(root);
    const chapters = new ChaptersComponent(root);
    const qa = new QaComponent(root);
    const eggs = new EggsComponent(root);

    assert.ok(mindmap.mindmapTree);
    assert.ok(chapters.chapterList);
    assert.ok(qa.customQuestionsList);
    assert.ok(eggs.eggsList);
    assert.ok(eggs.eggKnowledgeContent);
  });
});

