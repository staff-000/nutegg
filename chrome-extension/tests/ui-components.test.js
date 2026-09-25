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

  it("ActionControlsComponent encapsulated helper methods work correctly", () => {
    const root = createMockRoot();
    const actions = new ActionControlsComponent(root);

    actions.showStage1Confirm();
    assert.strictEqual(actions.isStage1ConfirmVisible(), true);
    actions.hideStage1Confirm();
    assert.strictEqual(actions.isStage1ConfirmVisible(), false);

    actions.showProcessedNote("Processing...");
    assert.strictEqual(actions.getProcessedMessage(), "Processing...");
    actions.hideProcessedNote();
    assert.strictEqual(actions.getProcessedMessage(), "");

    actions.setAnalyzeButtonLoading(true, "Analyzing");
    assert.strictEqual(actions.analyzeBtn.disabled, true);
    assert.strictEqual(actions.analyzeBtnText.textContent, "Analyzing");

    actions.setHistorySelectDisabled(true);
    assert.strictEqual(actions.historySelect.disabled, true);

    actions.setConfirmButtonVisible(true);
    assert.strictEqual(actions.confirmBtn.classList.contains("hidden"), false);
    actions.setConfirmButtonVisible(false);
    assert.strictEqual(actions.confirmBtn.classList.contains("hidden"), true);

    actions.setCollectNutButtonVisible(true);
    assert.strictEqual(actions.collectNutBtn.classList.contains("hidden"), false);
    actions.setCollectNutButtonVisible(false);
    assert.strictEqual(actions.collectNutBtn.classList.contains("hidden"), true);

    actions.setConfirmButtonLoading(true, "Hatching");
    assert.strictEqual(actions.confirmBtn.disabled, true);
    assert.strictEqual(actions.confirmBtn.textContent, "Hatching");

    actions.setCollectNutLoading(true, "Collecting");
    assert.strictEqual(actions.collectNutBtn.disabled, true);
    assert.strictEqual(actions.collectNutBtn.textContent, "Collecting");
    assert.strictEqual(actions.stage1SkipBtn.disabled, true);
    assert.strictEqual(actions.stage1SkipBtn.textContent, "Collecting");

    actions.updateStage1ProceedBtn({ selectedCount: 2 });
    assert.strictEqual(actions.stage1ProceedBtn.disabled, false);
    assert.ok(actions.stage1ProceedBtn.textContent);

    actions.updateStage1ProceedBtn({ isProceeding: true, autoSave: true });
    assert.strictEqual(actions.stage1ProceedBtn.disabled, true);
  });

  it("CaptureViewComponent encapsulated helper methods work correctly", () => {
    const root = createMockRoot();
    const capture = new CaptureViewComponent(root);

    capture.setPageInfo({ title: "My Title", url: "https://example.com", sourceType: "webpage" });
    assert.strictEqual(capture.getPageTitle(), "My Title");
    assert.strictEqual(capture.getPageUrl(), "https://example.com");
    assert.strictEqual(capture.getPageType(), "webpage");

    capture.setLoading("Loading test...");
    assert.strictEqual(capture.contentPreview.textContent, "Loading test...");
    assert.strictEqual(capture.pageAuthorEl.textContent, "");

    capture.setError("Error message");
    assert.strictEqual(capture.contentPreview.textContent, "Error message");

    capture.setRefreshDisabled(true);
    assert.strictEqual(capture.refreshBtn.disabled, true);

    capture.setCustomQuestions("Question 1\nQuestion 2");
    assert.deepStrictEqual(capture.getParsedQuestions(), ["Question 1", "Question 2"]);

    capture.toggleQuestionsArea();
    assert.strictEqual(capture.questionsArea.classList.contains("hidden"), true);
  });

  it("EggsComponent encapsulated helper methods work correctly", () => {
    const root = createMockRoot();
    const eggs = new EggsComponent(root);

    eggs.setNoEggVisible(true);
    assert.strictEqual(eggs.noEggSection.classList.contains("hidden"), false);
    eggs.setNoEggVisible(false);
    assert.strictEqual(eggs.noEggSection.classList.contains("hidden"), true);

    eggs.setKnowledgeVisible(true);
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), false);
    eggs.setKnowledgeVisible(false);
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), true);

    eggs.expandEggsList(true);
    assert.strictEqual(eggs.eggsExpanded.classList.contains("hidden"), false);
    assert.strictEqual(eggs.eggsToggleChevron.textContent, "▾");

    eggs.toggleEggsList();
    assert.strictEqual(eggs.eggsExpanded.classList.contains("hidden"), true);

    eggs.expandCaptureEggs(true);
    assert.strictEqual(eggs.captureEggsArea.classList.contains("hidden"), false);

    eggs.toggleCaptureEggs();
    assert.strictEqual(eggs.captureEggsArea.classList.contains("hidden"), true);

    eggs.setReanalyzeLoading(true, "Comparing");
    assert.strictEqual(eggs.reanalyzeEggsBtn.disabled, true);
    assert.strictEqual(eggs.reanalyzeEggsBtn.textContent, "Comparing");

    eggs.showError("Failed to match");
    assert.strictEqual(eggs.eggsErrorEl.textContent, "Failed to match");
    eggs.clearError();
    assert.strictEqual(eggs.eggsErrorEl.classList.contains("hidden"), true);

    eggs.resetCreateForm();
    assert.strictEqual(eggs.eggsCreateForm.classList.contains("hidden"), true);
  });

  it("ResultsViewComponent renders bullet array and handles provenance", () => {
    const root = createMockRoot();
    const results = new ResultsViewComponent(root);

    results.renderCoreSummary(["Bullet 1", "Bullet 2"]);
    assert.strictEqual(results.coreSummarySection.classList.contains("hidden"), false);
    assert.ok(results.coreSummaryEl.innerHTML.includes("<li>Bullet 1</li>"));
    assert.ok(results.coreSummaryEl.innerHTML.includes("<li>Bullet 2</li>"));

    results.renderProvenance({ title: "Results Provenance Title", author: "Bob", publishedAt: "2026-02-01" });
    assert.strictEqual(results.resultPageInfo.classList.contains("hidden"), false);
    assert.strictEqual(results.resultPageTitle.textContent, "Results Provenance Title");
    assert.ok(results.resultPageAuthor.textContent.includes("Bob"));

    results.renderProvenance(null);
    assert.strictEqual(results.resultPageInfo.classList.contains("hidden"), true);
  });

  it("VerdictComponent show, hide, reset, and setComparing work correctly", () => {
    const root = createMockRoot();
    const verdict = new VerdictComponent(root);

    verdict.setComparing(3);
    assert.strictEqual(verdict.verdictSection.classList.contains("hidden"), false);
    assert.strictEqual(verdict.verdictIcon.textContent, "⏳");

    verdict.hide();
    assert.strictEqual(verdict.verdictSection.classList.contains("hidden"), true);

    verdict.show();
    assert.strictEqual(verdict.verdictSection.classList.contains("hidden"), false);

    verdict.reset();
    assert.strictEqual(verdict.verdictSection.classList.contains("hidden"), true);
    assert.strictEqual(verdict.verdictAnswer.textContent, "");
  });

  it("MindmapComponent show, hide, and render work correctly", () => {
    const root = createMockRoot();
    const mindmap = new MindmapComponent(root);

    mindmap.show();
    assert.strictEqual(mindmap.mindmapSection.classList.contains("hidden"), false);

    mindmap.hide();
    assert.strictEqual(mindmap.mindmapSection.classList.contains("hidden"), true);

    mindmap.render([], false);
    assert.strictEqual(mindmap.mindmapSection.classList.contains("hidden"), true);
  });
});

