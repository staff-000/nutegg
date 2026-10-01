const { describe, it } = require("node:test");
const assert = require("node:assert");

require("../src/i18n.js");
require("../src/popup/helpers.js");
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
const { SettingsState } = require("../src/popup/state/settings-state.js");
const { SessionState } = require("../src/popup/state/session-state.js");
const { EnvironmentService } = require("../src/popup/services/environment-service.js");

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
    addEventListener(event, fn) {
      if (!this._listeners) this._listeners = {};
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(fn);
    },
    removeEventListener(event, fn) {
      if (!this._listeners || !this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter((f) => f !== fn);
    },
    click() {
      if (this._listeners?.click) {
        this._listeners.click.forEach((fn) => fn({ target: this }));
      }
    },
    scrollIntoView() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
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

    banners.showError("Failed to fetch", "network_error");
    assert.strictEqual(banners.errorMessage.textContent, "Failed to fetch");
    assert.strictEqual(banners.errorBanner.classList.contains("hidden"), false);
    assert.strictEqual(banners.getError(), "Failed to fetch");
    assert.strictEqual(banners.getErrorCode(), "network_error");

    banners.showWarning("Low memory");
    assert.strictEqual(banners.warningMessage.textContent, "Low memory");
    assert.strictEqual(banners.getWarning(), "Low memory");

    banners.hideWarning();
    assert.strictEqual(banners.warningBanner.classList.contains("hidden"), true);
    assert.strictEqual(banners.getWarning(), null);

    banners.showDuplicate("Note already exists");
    assert.strictEqual(banners.duplicateMessage.textContent, "Note already exists");
    assert.strictEqual(banners.getDuplicate(), "Note already exists");

    banners.showWarning("Could not extract content");
    assert.strictEqual(banners.getWarning(), "Could not extract content");

    // hideMessages hides warning, error, duplicate
    banners.hideMessages();
    assert.strictEqual(banners.errorBanner.classList.contains("hidden"), true);
    assert.strictEqual(banners.warningBanner.classList.contains("hidden"), true);
    assert.strictEqual(banners.duplicateBanner.classList.contains("hidden"), true);
    assert.strictEqual(banners.getError(), null);
    assert.strictEqual(banners.getWarning(), null);
    assert.strictEqual(banners.getDuplicate(), null);

    // showSuccess and hideAll
    banners.showSuccess("Saved note successfully");
    assert.strictEqual(banners.successMessage.textContent, "Saved note successfully");
    assert.strictEqual(banners.successBanner.classList.contains("hidden"), false);

    banners.showWarning("Warning again");
    banners.hideAll();
    assert.strictEqual(banners.successBanner.classList.contains("hidden"), true);
    assert.strictEqual(banners.warningBanner.classList.contains("hidden"), true);
    assert.strictEqual(banners.getWarning(), null);

    // Test Enable Chrome AI button and Open Settings button clicks
    let optionsPageOpened = false;
    let storageSaved = null;
    globalThis.chrome = globalThis.chrome || {};
    globalThis.chrome.runtime = globalThis.chrome.runtime || {};
    globalThis.chrome.runtime.openOptionsPage = () => { optionsPageOpened = true; };
    globalThis.chrome.storage = globalThis.chrome.storage || {};
    globalThis.chrome.storage.local = {
      set: async (obj) => { storageSaved = obj; },
    };

    // When offline & Chrome AI off: renders enable Chrome AI button
    banners.updateCaptureBanners({ serverOnline: false, chromeAiConfigured: false, chromeAiEnabled: false });
    assert.strictEqual(banners.aiKeyMissingBanner.classList.contains("hidden"), false);
    assert.ok(banners.aiKeyMissingBanner.innerHTML.includes("open-settings-enable-ai-btn"));

    // Simulate click on enable button inside aiKeyMissingBanner
    optionsPageOpened = false;
    storageSaved = null;
    const enableBtnTarget = { id: "open-settings-enable-ai-btn" };
    banners.aiKeyMissingBanner._listeners.click.forEach((fn) => fn({ target: enableBtnTarget, preventDefault() {} }));
    assert.strictEqual(optionsPageOpened, true);
    assert.deepStrictEqual(storageSaved, { chromeAiEnabled: true });

    // When offline & Chrome AI on but unconfigured: renders open settings key button
    banners.updateCaptureBanners({ serverOnline: false, chromeAiConfigured: false, chromeAiEnabled: true });
    assert.ok(banners.aiKeyMissingBanner.innerHTML.includes("open-settings-key-btn"));

    optionsPageOpened = false;
    const keyBtnTarget = { id: "open-settings-key-btn" };
    banners.aiKeyMissingBanner._listeners.click.forEach((fn) => fn({ target: keyBtnTarget, preventDefault() {} }));
    assert.strictEqual(optionsPageOpened, true);
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
    assert.ok(captureView.pageWordCountEl.textContent.includes("3 words"));
    assert.strictEqual(captureView.pageWordCountEl.classList.contains("hidden"), false);

    captureView.clearProvenance();
    assert.strictEqual(captureView.pageWordCountEl.textContent, "");
    assert.strictEqual(captureView.pageWordCountEl.classList.contains("hidden"), true);
  });

  it("SectionChipsComponent binds capture and re-analyze section chips and handles clicks", async () => {
    const root = createMockRoot();
    const chips = new SectionChipsComponent(root);

    assert.ok(chips.chipVerdict);
    assert.ok(chips.chipSummary);
    assert.ok(chips.chipMindmap);
    assert.ok(chips.chipChapters);
    assert.ok(chips.reanalyzeChipVerdict);
    assert.ok(chips.sectionsToggle);

    let toggledKey = null;
    chips.init({
      onToggle: (key) => {
        toggledKey = key;
      },
    });

    // Test accordion toggling
    chips.sectionsBody.classList.add("hidden");
    chips.sectionsToggle.click();
    assert.strictEqual(chips.sectionsBody.classList.contains("hidden"), false);
    assert.strictEqual(chips.sectionsChevron.textContent, "▾");

    chips.sectionsToggle.click();
    assert.strictEqual(chips.sectionsBody.classList.contains("hidden"), true);
    assert.strictEqual(chips.sectionsChevron.textContent, "▸");

    // Test re-analysis accordion toggling (should toggle reanalyzeSectionsBody, not the outer container)
    chips.reanalyzeSectionsBody.classList.add("hidden");
    chips.reanalyzeSectionsToggle.click();
    assert.strictEqual(chips.reanalyzeSectionsBody.classList.contains("hidden"), false);
    assert.strictEqual(chips.reanalyzeSectionsChevron.textContent, "▾");
    assert.strictEqual(chips.reanalyzeSectionsAccordion.classList.contains("hidden"), false);

    chips.reanalyzeSectionsToggle.click();
    assert.strictEqual(chips.reanalyzeSectionsBody.classList.contains("hidden"), true);
    assert.strictEqual(chips.reanalyzeSectionsChevron.textContent, "▸");
    assert.strictEqual(chips.reanalyzeSectionsAccordion.classList.contains("hidden"), false);

    // Test chip click
    chips.chipVerdict.click();
    assert.strictEqual(toggledKey, "titleVerdict");

    chips.chipMindmap.click();
    assert.strictEqual(toggledKey, "mindMap");

    chips.reanalyzeChipChapters.click();
    assert.strictEqual(toggledKey, "chapterMap");

    // Test updateUI visual classes & badges
    chips.updateUI({
      titleVerdict: true,
      coreSummary: true,
      mindMap: false,
      chapterMap: true,
    });
    assert.strictEqual(chips.chipMindmap.classList.contains("inactive"), true);
    assert.strictEqual(chips.chipVerdict.classList.contains("active"), true);
    assert.strictEqual(chips.sectionsBadge.textContent, "3/4");
    assert.strictEqual(chips.reanalyzeSectionsBadge.textContent, "3/4");

    // Test onSectionToggle fallback
    let fallbackResult = null;
    chips.init({
      onSectionToggle: (key, nextVal, newSections) => {
        fallbackResult = { key, nextVal, newSections };
      },
    });
    chips.chipSummary.click();
    assert.strictEqual(fallbackResult.key, "coreSummary");
    assert.strictEqual(fallbackResult.nextVal, false);
    assert.strictEqual(fallbackResult.newSections.coreSummary, false);
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

    actions.setReanalyzeRefreshLoading(true);
    assert.strictEqual(actions.reanalyzeRefreshBtn.disabled, true);
    assert.strictEqual(actions.reanalyzeRefreshBtn.classList.contains("rotating"), true);
    actions.setReanalyzeRefreshLoading(false);
    assert.strictEqual(actions.reanalyzeRefreshBtn.disabled, false);
    assert.strictEqual(actions.reanalyzeRefreshBtn.classList.contains("rotating"), false);
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

    eggs.setReanalyzeEggsRefreshLoading(true);
    assert.strictEqual(eggs.reanalyzeEggsRefreshBtn.disabled, true);
    assert.strictEqual(eggs.reanalyzeEggsRefreshBtn.classList.contains("rotating"), true);
    eggs.setReanalyzeEggsRefreshLoading(false);
    assert.strictEqual(eggs.reanalyzeEggsRefreshBtn.disabled, false);
    assert.strictEqual(eggs.reanalyzeEggsRefreshBtn.classList.contains("rotating"), false);

    eggs.showError("Failed to match");
    assert.strictEqual(eggs.eggsErrorEl.textContent, "Failed to match");
    eggs.clearError();
    assert.strictEqual(eggs.eggsErrorEl.classList.contains("hidden"), true);

    // Test toggleCreateForm open & close
    eggs.toggleCreateForm(true);
    assert.strictEqual(eggs.eggsCreateForm.classList.contains("hidden"), false);
    assert.strictEqual(eggs.eggsCreateToggle.classList.contains("hidden"), true);

    eggs.toggleCreateForm(false);
    assert.strictEqual(eggs.eggsCreateForm.classList.contains("hidden"), true);
    assert.strictEqual(eggs.eggsCreateToggle.classList.contains("hidden"), false);
    assert.strictEqual(eggs.eggsCreateToggle.textContent, t("createNewEgg"));

    // Test setCreateButtonLoading
    eggs.setCreateButtonLoading(true);
    assert.strictEqual(eggs.eggsCreateBtn.disabled, true);
    assert.strictEqual(eggs.eggsCreateBtn.textContent, t("creatingEgg"));
    assert.strictEqual(eggs.createEggBtn.disabled, true);
    assert.strictEqual(eggs.createEggBtn.textContent, t("creatingEgg"));

    eggs.setCreateButtonLoading(false);
    assert.strictEqual(eggs.eggsCreateBtn.disabled, false);
    assert.strictEqual(eggs.eggsCreateBtn.textContent, t("createEggBtn"));
    assert.strictEqual(eggs.createEggBtn.disabled, false);
    assert.strictEqual(eggs.createEggBtn.textContent, t("createEggBtn"));

    // Test resetCreateForm restores all states
    eggs.toggleCreateForm(true);
    eggs.eggsNewName.value = "NewTopic";
    eggs.setCreateButtonLoading(true);
    eggs.resetCreateForm();
    assert.strictEqual(eggs.eggsCreateForm.classList.contains("hidden"), true);
    assert.strictEqual(eggs.eggsCreateToggle.classList.contains("hidden"), false);
    assert.strictEqual(eggs.eggsCreateToggle.textContent, t("createNewEgg"));
    assert.strictEqual(eggs.eggsNewName.value, "");
    assert.strictEqual(eggs.eggsCreateBtn.disabled, false);
    assert.strictEqual(eggs.eggsCreateBtn.textContent, t("createEggBtn"));
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

  it("HeaderComponent.render synchronizes Obsidian and Chrome AI status", () => {
    const root = createMockRoot();
    const header = new HeaderComponent(root);
    const settings = new SettingsState();

    // 1. Obsidian online
    settings.setServerStatus({ online: true, version: "0.2.0", aiConfigured: true });
    header.render(null, settings);
    assert.strictEqual(header.serverStatus.className, "status-dot online");

    // 2. Chrome AI mode
    settings.setServerStatus({ online: false });
    settings.setChromeAiStatus({ enabled: true, configured: true, provider: "Gemini" });
    header.render(null, settings);
    assert.strictEqual(header.serverStatus.className, "status-dot chrome-ai");

    // 3. Offline
    settings.setChromeAiStatus({ enabled: false, configured: false });
    header.render(null, settings);
    assert.strictEqual(header.serverStatus.className, "status-dot offline");
  });

  it("BannersComponent.render synchronizes capture and chrome result banners", () => {
    const root = createMockRoot();
    const banners = new BannersComponent(root);
    const session = new SessionState();
    const settings = new SettingsState();

    // Capture state with server offline and chrome AI enabled but not configured
    settings.setServerStatus({ online: false });
    settings.setChromeAiStatus({ enabled: true, configured: false });
    banners.render(session, settings);
    assert.strictEqual(banners.aiKeyMissingBanner.classList.contains("hidden"), false);

    // Chrome mode with results
    session.analysisResult = { stage: "stage1", coreSummary: "Hello" };
    settings.setChromeAiStatus({ enabled: true, configured: true });
    banners.render(session, settings);
    assert.strictEqual(banners.chromeResultBanner.classList.contains("hidden"), false);
    assert.strictEqual(banners.chromeActionsCard.classList.contains("hidden"), false);
  });

  it("ResultsViewComponent.render toggles view and displays summary/provenance", () => {
    const root = createMockRoot();
    const results = new ResultsViewComponent(root);
    const session = new SessionState();
    const settings = new SettingsState();

    // Capture state
    results.render(session, settings);
    assert.strictEqual(results.captureState.classList.contains("hidden"), false);
    assert.strictEqual(results.resultsState.classList.contains("hidden"), true);

    // Results state
    session.analysisResult = {
      title: "My Result",
      coreSummary: ["Key takeaway 1", "Key takeaway 2"],
    };
    results.render(session, settings);
    assert.strictEqual(results.resultsState.classList.contains("hidden"), false);
    assert.strictEqual(results.captureState.classList.contains("hidden"), true);
    assert.strictEqual(results.resultPageTitle.textContent, "My Result");
    assert.ok(results.coreSummaryEl.innerHTML.includes("Key takeaway 1"));

    results.renderProvenance({ title: "My Result", wordCount: 1200 });
    assert.ok(results.resultPageWordCount.textContent.includes("1,200 words"));
    assert.strictEqual(results.resultPageWordCount.classList.contains("hidden"), false);

    results.renderProvenance({ title: "My Result", wordCount: 0 });
    assert.strictEqual(results.resultPageWordCount.textContent, "");
    assert.strictEqual(results.resultPageWordCount.classList.contains("hidden"), true);
  });

  it("CaptureViewComponent.render supports polymorphic session input and loading state", () => {
    const root = createMockRoot();
    const capture = new CaptureViewComponent(root);
    const session = new SessionState();

    // Loading state
    session.currentTabLoading = true;
    capture.render(session);
    assert.ok(capture.refreshBtn.disabled);
    assert.ok(capture.contentPreview.textContent.length > 0);

    // Content loaded
    session.currentTabLoading = false;
    session.extractedContent = {
      title: "Page Title",
      url: "https://example.com/page",
      sourceType: "article",
      content: "Full extracted article content",
      metadata: { author: "Bob" },
    };
    capture.render(session);
    assert.strictEqual(capture.refreshBtn.disabled, false);
    assert.strictEqual(capture.pageTitle.textContent, "Page Title");
    assert.strictEqual(capture.pageUrl.textContent, "https://example.com/page");
    assert.ok(capture.pageAuthorEl.textContent.includes("Bob"));
  });

  it("VerdictComponent.render shows/hides verdicts based on mode and stage", () => {
    const root = createMockRoot();
    const verdict = new VerdictComponent(root);
    const session = new SessionState();
    const settings = new SettingsState();

    // Chrome mode: decision verdict hidden, but title verdict shown!
    settings.setServerStatus({ online: false });
    settings.setChromeAiStatus({ enabled: true, configured: true });
    session.analysisResult = { titleVerdict: "Direct answer in Chrome AI", shouldRead: true };
    verdict.render(session, settings);
    assert.strictEqual(verdict.verdictSection.classList.contains("hidden"), true);
    assert.strictEqual(verdict.titleVerdictSection.classList.contains("hidden"), false);
    assert.strictEqual(verdict.verdictAnswer.textContent, "Direct answer in Chrome AI");

    // Obsidian mode - Stage 1 confirm: decision verdict hidden, title verdict shown!
    settings.setServerStatus({ online: true });
    settings.setAnalysisMode("confirm");
    session.analysisResult = { stage: "stage1", titleVerdict: "Title verdict in confirm mode" };
    verdict.render(session, settings);
    assert.strictEqual(verdict.verdictSection.classList.contains("hidden"), true);
    assert.strictEqual(verdict.titleVerdictSection.classList.contains("hidden"), false);
    assert.strictEqual(verdict.verdictAnswer.textContent, "Title verdict in confirm mode");

    // Disabled in settings: title verdict hidden
    settings.enabledSections.titleVerdict = false;
    verdict.render(session, settings);
    assert.strictEqual(verdict.titleVerdictSection.classList.contains("hidden"), true);
    settings.enabledSections.titleVerdict = true;

    // Obsidian mode - Stage 2: both decision verdict and title verdict shown!
    session.analysisResult = { stage: "stage2", titleVerdict: "Final verdict", shouldRead: true, shouldReadReason: "Must read" };
    verdict.render(session, settings);
    assert.strictEqual(verdict.titleVerdictSection.classList.contains("hidden"), false);
    assert.strictEqual(verdict.verdictAnswer.textContent, "Final verdict");
    assert.strictEqual(verdict.verdictSection.classList.contains("hidden"), false);
    assert.strictEqual(verdict.verdictIcon.textContent, "✅");
    assert.strictEqual(verdict.verdictReason.textContent, "Must read");
  });

  it("ActionControlsComponent.render updates buttons, modes, and analyze state", () => {
    const root = createMockRoot();
    const actions = new ActionControlsComponent(root);
    const session = new SessionState();
    const settings = new SettingsState();
    settings.setServerStatus({ online: true });

    settings.setAnalysisMode("confirm");
    session.analysisResult = { stage: "stage1" };
    session.selectedEggs = new Set(["Egg1.md"]);
    session.allEggs = [{ fileName: "Egg1.md" }];
    actions.render(session, settings);

    assert.strictEqual(actions.modeConfirmBtn.classList.contains("active"), true);
    assert.strictEqual(actions.stage1ConfirmBox.classList.contains("hidden"), false);
    assert.strictEqual(actions.confirmBtn.classList.contains("hidden"), true);
    assert.strictEqual(actions.collectNutBtn.classList.contains("hidden"), false);
  });

  it("EggsComponent.render toggles no-egg banner and egg knowledge section", () => {
    const root = createMockRoot();
    const eggs = new EggsComponent(root);
    const session = new SessionState();
    const settings = new SettingsState();

    // Obsidian mode, no eggs matched
    settings.setServerStatus({ online: true });
    session.analysisResult = { matchedEggs: [], eggResults: [] };
    eggs.render(session, settings);
    assert.strictEqual(eggs.noEggSection.classList.contains("hidden"), false);

    // Obsidian mode, all eggs rejected in Stage 2 (user manually selected eggs)
    session.analysisResult = {
      stage: "stage2",
      matchedEggs: ["Egg1.md", "Egg2.md"],
      eggResults: [
        { egg: "Egg1.md", rejected: true, rejectReason: "Out of scope A", novelDelta: [] },
        { egg: "Egg2.md", rejected: true, rejectReason: "Out of scope B", novelDelta: [] },
      ],
    };
    eggs.render(session, settings);
    assert.strictEqual(eggs.noEggSection.classList.contains("hidden"), false);
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), false);
    assert.ok(eggs.eggKnowledgeContent.innerHTML.includes("No egg matches this content"));
    assert.strictEqual(eggs.eggsToggleLabel.textContent, "— none matched");
    assert.strictEqual(eggs.eggKnowledgeHint.textContent, "(0 matched)");

    // Chrome mode: no eggs or knowledge shown
    settings.setServerStatus({ online: false });
    settings.setChromeAiStatus({ enabled: true, configured: true });
    eggs.render(session, settings);
    assert.strictEqual(eggs.noEggSection.classList.contains("hidden"), true);
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), true);

    // Re-analyzing with selected eggs hides existing eggs
    settings.setServerStatus({ online: true });
    session.isReanalyzing = true;
    session.analysisResult = {
      stage: "stage2",
      matchedEggs: ["Egg1.md"],
      eggResults: [{ egg: "Egg1.md", novelDelta: ["Knowledge 1"] }],
    };
    eggs.render(session, settings);
    assert.strictEqual(eggs.noEggSection.classList.contains("hidden"), true);
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), true);
  });

  it("Stage 1 egg selection: expands eggs list in confirm mode and in fast mode with 0 matches", () => {
    const root = createMockRoot();
    const eggs = new EggsComponent(root);
    const actions = new ActionControlsComponent(root);
    const session = new SessionState();
    const settings = new SettingsState();
    settings.setServerStatus({ online: true });

    // Case 1: Confirm mode with matched eggs
    settings.setAnalysisMode("confirm");
    session.analysisResult = { stage: "stage1", matchedEggs: ["Egg1.md"] };
    session.allEggs = [{ fileName: "Egg1.md" }, { fileName: "Egg2.md" }];
    eggs.render(session, settings);
    actions.render(session, settings);

    assert.strictEqual(actions.stage1ConfirmBox.classList.contains("hidden"), false);
    assert.strictEqual(eggs.eggsSection.classList.contains("hidden"), false);
    assert.strictEqual(eggs.eggsExpanded.classList.contains("hidden"), false);
    assert.strictEqual(session.selectedEggs.has("Egg1.md"), true);
    assert.strictEqual(actions.stage1ProceedBtn.disabled, false);

    // Case 2: Fast mode with 0 matched eggs - MUST show stage 1 confirm and expand eggs list
    settings.setAnalysisMode("fast");
    session.selectedEggs.clear();
    session.analysisResult = { stage: "stage1", matchedEggs: [] };
    eggs.render(session, settings);
    actions.render(session, settings);

    assert.strictEqual(actions.stage1ConfirmBox.classList.contains("hidden"), false);
    assert.strictEqual(eggs.eggsSection.classList.contains("hidden"), false);
    assert.strictEqual(eggs.eggsExpanded.classList.contains("hidden"), false);
    assert.strictEqual(actions.stage1ProceedBtn.disabled, true);

    // Case 3: Empty vault eggs does not hide eggs section, shows notice and create form
    session.allEggs = [];
    session.analysisResult = { stage: "stage1", matchedEggs: [] };
    eggs.render(session, settings);
    assert.strictEqual(eggs.eggsSection.classList.contains("hidden"), false);
    assert.strictEqual(eggs.eggsExpanded.classList.contains("hidden"), false);
    assert.strictEqual(eggs.eggsList.innerHTML.includes("eggs-empty-notice"), true);
    assert.strictEqual(eggs.eggsCreateForm.classList.contains("hidden"), false);
  });

  it("renderEggKnowledge handles polymorphic arguments and never throws 'eggResults.map is not a function'", () => {
    const root = createMockRoot();
    const eggs = new EggsComponent(root);

    // 1. Calling renderKnowledge with an options object (the previous bug pattern)
    assert.doesNotThrow(() => {
      eggs.renderKnowledge({
        eggResults: [{ egg: "test.md", novelDelta: ["fact 1"] }],
        activeEggTab: "test.md",
      });
    });
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), false);

    // 2. Calling renderKnowledge with empty object
    assert.doesNotThrow(() => {
      eggs.renderKnowledge({});
    });
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), true);

    // 3. Calling renderKnowledge with null/undefined/non-array eggResults
    assert.doesNotThrow(() => {
      eggs.renderKnowledge({ eggResults: null });
    });
    assert.doesNotThrow(() => {
      eggs.renderKnowledge({ eggResults: "not-an-array" });
    });
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), true);

    // 4. Calling renderKnowledge with array directly
    assert.doesNotThrow(() => {
      eggs.renderKnowledge([{ egg: "direct.md", novelDelta: [] }]);
    });
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), false);
  });

  it("multi-egg tab switching updates active tab and card visibility", () => {
    const root = createMockRoot();
    const eggs = new EggsComponent(root);

    const eggResults = [
      { egg: "egg1.md", novelDelta: [{ content: "delta 1" }] },
      { egg: "egg2.md", novelDelta: [{ content: "delta 2" }] },
    ];

    function createTabButton(tab) {
      const listeners = {};
      return {
        dataset: { tab },
        addEventListener(evt, fn) {
          listeners[evt] = fn;
        },
        click() {
          listeners["click"]?.();
        },
      };
    }

    let currentButtons = [createTabButton("egg1.md"), createTabButton("egg2.md"), createTabButton("all")];
    eggs.eggTabsBar.querySelectorAll = (selector) => {
      if (selector === ".egg-tab-btn") return currentButtons;
      return [];
    };

    let switchedTab = null;
    eggs.renderKnowledge({
      eggResults,
      activeEggTab: "egg1.md",
      onTabChange: (t) => { switchedTab = t; },
    });

    // Content initially shows egg1.md and hides egg2.md
    assert.ok(eggs.eggKnowledgeContent.innerHTML.includes('data-egg="egg1.md"'));
    assert.ok(eggs.eggKnowledgeContent.innerHTML.includes('data-egg="egg2.md"'));
    assert.ok(eggs.eggKnowledgeContent.innerHTML.includes('egg-card hidden" data-egg="egg2.md"'));

    // Prepare next buttons for the re-render when clicked
    const nextButtons = [createTabButton("egg1.md"), createTabButton("egg2.md"), createTabButton("all")];
    eggs.eggTabsBar.querySelectorAll = (selector) => {
      if (selector === ".egg-tab-btn") return nextButtons;
      return [];
    };

    // Click tab for egg2.md
    assert.doesNotThrow(() => {
      currentButtons[1].click();
    });

    assert.strictEqual(switchedTab, "egg2.md");
    // After clicking egg2.md, egg1.md is hidden and egg2.md is active
    assert.ok(eggs.eggKnowledgeContent.innerHTML.includes('egg-card hidden" data-egg="egg1.md"'));
    assert.ok(eggs.eggKnowledgeContent.innerHTML.includes('egg-card" data-egg="egg2.md"'));

    // Now click the "all" tab
    currentButtons = nextButtons;
    const allButtons = [createTabButton("egg1.md"), createTabButton("egg2.md"), createTabButton("all")];
    eggs.eggTabsBar.querySelectorAll = (selector) => {
      if (selector === ".egg-tab-btn") return allButtons;
      return [];
    };

    assert.doesNotThrow(() => {
      currentButtons[2].click();
    });

    assert.strictEqual(switchedTab, "all");
    // In "all" tab, neither egg is hidden
    assert.ok(!eggs.eggKnowledgeContent.innerHTML.includes('hidden" data-egg="egg1.md"'));
    assert.ok(!eggs.eggKnowledgeContent.innerHTML.includes('hidden" data-egg="egg2.md"'));
  });

  it("CaptureViewComponent manages questions scope ('within' | 'beyond')", () => {
    const root = createMockRoot();
    const beyondChip = createMockElement();
    beyondChip.dataset = { scope: "beyond" };
    const withinChip = createMockElement();
    withinChip.dataset = { scope: "within" };
    withinChip.classList.add("active");

    const scopeContainer = root.getElementById("capture-questions-scope");
    scopeContainer.querySelectorAll = () => [withinChip, beyondChip];

    const capture = new CaptureViewComponent(root);
    assert.strictEqual(capture.getQuestionsScope(), "within");

    capture.setQuestionsScope("beyond");
    assert.strictEqual(capture.getQuestionsScope(), "beyond");
    assert.strictEqual(beyondChip.classList.contains("active"), true);
    assert.strictEqual(withinChip.classList.contains("active"), false);

    capture.setQuestionsScope("within");
    assert.strictEqual(capture.getQuestionsScope(), "within");
    assert.strictEqual(withinChip.classList.contains("active"), true);
    assert.strictEqual(beyondChip.classList.contains("active"), false);
  });

  it("QaComponent manages followup scope and renders scope badges", () => {
    const root = createMockRoot();
    const beyondChip = createMockElement();
    beyondChip.dataset = { scope: "beyond" };
    const withinChip = createMockElement();
    withinChip.dataset = { scope: "within" };
    withinChip.classList.add("active");

    const scopeContainer = root.getElementById("followup-scope");
    scopeContainer.querySelectorAll = () => [withinChip, beyondChip];

    const qa = new QaComponent(root);
    assert.strictEqual(qa.getScope(), "within");

    qa.setScope("beyond");
    assert.strictEqual(qa.getScope(), "beyond");
    assert.strictEqual(beyondChip.classList.contains("active"), true);
    assert.strictEqual(withinChip.classList.contains("active"), false);
    assert.ok(qa.followupInput.placeholder.length > 0);

    // Test render with mixed scopes
    qa.render({
      questions: [
        { question: "Strict fact question", answer: "Fact", scope: "within" },
        { question: "Beyond content question", answer: "Expanded insight", scope: "beyond" },
      ],
      followUps: [],
    });

    const renderedHtml = qa.customQuestionsList.innerHTML;
    assert.ok(renderedHtml.includes("qa-scope-badge qa-scope-within"));
    assert.ok(renderedHtml.includes("qa-scope-badge qa-scope-beyond"));
    assert.ok(renderedHtml.includes("Content only"));
    assert.ok(renderedHtml.includes("Global Mode"));
  });

  it("QaComponent supports select element dropdown selector", () => {
    const root = createMockRoot();
    const selectElem = createMockElement();
    selectElem.tagName = "SELECT";
    selectElem.value = "within";

    root.getElementById = (id) => {
      if (id === "followup-scope") return selectElem;
      return createMockElement(id);
    };

    let changedScope = null;
    const qa = new QaComponent(root);
    qa.onScopeChange = (s) => { changedScope = s; };

    assert.strictEqual(qa.getScope(), "within");

    qa.setScope("beyond");
    assert.strictEqual(qa.getScope(), "beyond");
    assert.strictEqual(selectElem.value, "beyond");

    qa.setScope("within");
    assert.strictEqual(qa.getScope(), "within");
    assert.strictEqual(selectElem.value, "within");
  });

  it("HeaderComponent.renderCredit renders Obsidian AI credit and Chrome AI credit properly", () => {
    const root = createMockRoot();
    const header = new HeaderComponent(root);

    // 1. Obsidian online with balance
    header.renderCredit({
      source: "openrouter",
      hasBalance: true,
      balanceFormatted: "$4.50",
      statusText: "$4.50 left",
    }, true);

    assert.strictEqual(header.aiCreditPill.classList.contains("hidden"), false);
    assert.strictEqual(header.aiCreditText.textContent, "OpenRouter: $4.50");

    // 2. Obsidian online with pay-as-you-go / direct (e.g. OpenAI, Gemini)
    header.renderCredit({
      provider: "gemini",
      hasBalance: false,
      statusText: "Gemini (Pay-as-you-go / Direct)",
    }, true);

    assert.strictEqual(header.aiCreditPill.classList.contains("hidden"), false);
    assert.strictEqual(header.aiCreditText.textContent, "Gemini");

    // 3. Chrome AI credit when Obsidian is offline
    header.renderCredit({
      provider: "deepseek",
      isChromeAi: true,
      hasBalance: true,
      balanceFormatted: "¥18.50",
    }, false);

    assert.strictEqual(header.aiCreditPill.classList.contains("hidden"), false);
    assert.strictEqual(header.aiCreditText.textContent, "DeepSeek: ¥18.50");

    // 4. Hidden when error or no active mode
    header.renderCredit({ error: "Failed" }, true);
    assert.strictEqual(header.aiCreditPill.classList.contains("hidden"), true);
  });

  it("EnvironmentService synchronizes with UI components and renders metrics and credits", async () => {
    const root = createMockRoot();
    const headerUI = new HeaderComponent(root);
    const metricsUI = new MetricsComponent(root);
    const bannersUI = new BannersComponent(root);
    const settings = new SettingsState();

    // Mock chrome.runtime.sendMessage
    globalThis.chrome = globalThis.chrome || {};
    globalThis.chrome.runtime = {
      sendMessage: async (msg) => {
        if (msg.action === "metrics") {
          return { nuts: 15, eggs: 4, timeSaved: "1h 15m" };
        }
        if (msg.action === "get-credit") {
          return { provider: "deepseek", hasBalance: true, balanceFormatted: "¥25.00" };
        }
        return {};
      },
    };

    const env = new EnvironmentService({
      settings,
      headerUI,
      metricsUI,
      bannersUI,
    });

    settings.setServerStatus({ online: true, version: "0.2.3", aiConfigured: true });

    await env.fetchMetrics();
    assert.strictEqual(metricsUI.metricNuts.textContent, 15);
    assert.strictEqual(metricsUI.metricEggs.textContent, 4);
    assert.strictEqual(metricsUI.metricTime.textContent, "1h 15m");

    await env.checkCreditStatus();
    assert.strictEqual(headerUI.aiCreditPill.classList.contains("hidden"), false);
    assert.strictEqual(headerUI.aiCreditText.textContent, "DeepSeek: ¥25.00");
  });
});


