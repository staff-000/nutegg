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
const { QaComponent } = require("../src/popup/ui/qa.js");
const { EggsComponent } = require("../src/popup/ui/eggs.js");
const { SettingsState } = require("../src/popup/state/settings-state.js");
const { testView } = require("./helpers/popup-fixture.js");
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
      toggle(c, force) {
        if (force !== undefined) { if (force) this._classes.add(c); else this._classes.delete(c); return force; }
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
  it('CaptureViewComponent previews comments when discussion is off, safely and without comment links', () => {
    const root = createMockRoot(), capture = new CaptureViewComponent(root);
    capture.render({ title: 'Page', content: 'Original body', enabledSections: { discussion: false }, discussion: { truncated: true, items: [
      { id: 'c', author: 'Reader <img src=x onerror=alert(1)>', text: '<script>alert(1)</script> [02:30] A useful experience', url: 'https://comment.test', reaction: { kind: 'likes', count: 12 } },
      { id: 'reply', parentId: 'c', text: 'Reply with unknown reactions', reaction: { kind: 'likes', count: null } },
    ] } });
    const html = root.getElementById('content-preview').innerHTML;
    assert(html.includes('Original body')); assert(html.includes('2 captured comments'));
    assert(html.includes('1. 👤 Reader'));
    assert(html.includes('&lt;img'));
    assert(!html.includes('<img'));
    assert(html.includes('2. ↳ 👤 Unknown user'));
    assert(html.includes('A useful experience')); assert(html.includes('12 likes')); assert(html.includes('Capture limit reached'));
    assert(!html.includes('<script>')); assert(!html.includes('https://comment.test')); assert(!html.includes('null likes'));
    capture.render({ content: 'A different page' });
    assert.ok(root.getElementById('content-preview').textContent.endsWith('A different page'));
  });

  it('CaptureViewComponent shows comment usernames and named profile fallbacks above their own comments', () => {
    const capture = new CaptureViewComponent(createMockRoot());
    const content = { content: 'Article', discussion: { items: [
      { id: 'a', author: ' Alice ', text: 'First experience' },
      { id: 'b', authorId: 'https://www.youtube.com/@bob', text: 'Second experience' },
      { id: 'c', parentId: 'a', authorId: 'https://www.reddit.com/user/Carol', text: 'Reply experience' },
      { id: 'd', authorId: 'https://www.tiktok.com/@%E5%B0%8F%E6%98%8E', text: 'Chinese name' },
      { id: 'e', author: '   ', text: 'Anonymous experience' },
    ] } };
    const original = structuredClone(content);
    capture.render(content);
    const text = capture.contentPreview.textContent;
    assert.ok(text.includes('1. 👤 Alice\nFirst experience'));
    assert.ok(text.includes('2. 👤 @bob\nSecond experience'));
    assert.ok(text.includes('3. ↳ 👤 Carol\nReply experience'));
    assert.ok(text.includes('4. 👤 @小明\nChinese name'));
    assert.ok(text.includes('5. 👤 Unknown user\nAnonymous experience'));
    assert.deepEqual(content, original);
  });
  it("runs the current analysis mode from the label and opens choices only from the arrow", async () => {
    const eggs = new ActionControlsComponent(createMockRoot());
    const calls = [];
    eggs.updateEggAnalysisLabel(false);
    assert.equal(eggs.eggAnalysisLabel.textContent, t("eggAnalysis"));
    assert.equal(eggs.eggAnalysisOnlyBtn.getAttribute("aria-checked"), "true");
    assert.equal(eggs.eggAnalysisOnlyBtn.textContent, `✓ ${t("eggAnalysisOnly")}`);
    await eggs.handleEggAnalysisClick({ target: { closest: () => null } }, mode => calls.push(mode));
    assert.deepEqual(calls, [false]);
    eggs.updateEggAnalysisLabel(true);
    assert.equal(eggs.eggAnalysisLabel.textContent, `${t("eggAnalysis")} 🍃`);
    assert.equal(eggs.eggAnalysisWithKnowledgeBtn.getAttribute("aria-checked"), "true");
    assert.equal(eggs.eggAnalysisWithKnowledgeBtn.textContent, `✓ ${t("eggAnalysisWithKnowledge")}`);
    await eggs.handleEggAnalysisClick({ target: { closest: () => null } }, mode => calls.push(mode));
    assert.deepEqual(calls, [false, true]);
    eggs.toggleEggAnalysisMenu(false);
    await eggs.handleEggAnalysisClick({ target: { closest: () => ({}) } }, mode => calls.push(mode));
    assert.deepEqual(calls, [false, true]);
    assert.equal(eggs.eggAnalysisMenu.classList.contains("hidden"), false);
  });

  it("keeps the top analysis and collect controls visible through stages and modes", () => {
    const controls = new ActionControlsComponent(createMockRoot());
    for (const mode of ["full", "preview"]) {
      for (const stage of ["stage1", "stage2"]) {
        const session = { analysisResult: { stage, matchedEggs: ["a.md"] }, selectedEggs: new Set(["a.md"]),
          isStage1: () => stage === "stage1" };
        controls.render(session, { connectionMode: 'obsidian', analysisMode: mode, isChromeMode: () => false });
        assert.equal(controls.stage1ConfirmBox.classList.contains("hidden"), false);
        assert.equal(controls.stage1ProceedBtn.disabled, false);
        assert.equal(controls.stage1SkipBtn.disabled, false);
      }
    }
  });

  it("does not reveal the analysis menu when egg selection changes", () => {
    const root = createMockRoot();
    const eggs = new EggsComponent(root);
    const checkbox = createMockElement();
    checkbox.dataset = { egg: "a.md" };
    checkbox.checked = true;
    eggs.eggsList.querySelectorAll = () => [checkbox];
    const controls = new ActionControlsComponent(root);
    controls.toggleEggAnalysisMenu(false);
    let selected = new Set();
    eggs.renderSection([], { allEggs: [{ fileName: "a.md" }], selectedEggs: selected, onSelectChange: next => { selected = next; } });
    checkbox._listeners.change[0]({ target: checkbox });
    assert.equal(selected.has("a.md"), true);
    assert.equal(controls.eggAnalysisMenu.classList.contains("hidden"), true);
  });

  it("keeps Hatch as a direct save button and expands analysis choices in the egg selector", () => {
    const root = createMockRoot();
    const controls = new ActionControlsComponent(root);
    controls.updateActionButtons({ hasDelta: false });
    assert.equal(controls.confirmBtn.textContent, t("hatchEgg"));
    assert.equal(controls.confirmBtn.disabled, true);
    assert.equal(controls.confirmBtn.title, t("noNewKnowledgeToAdd"));
    assert.equal(controls.confirmBtnWrap.title, t("noNewKnowledgeToAdd"));
    controls.updateActionButtons({ eggHatched: true });
    assert.equal(controls.confirmBtn.disabled, true);
    assert.equal(controls.confirmBtn.title, t("hatchAlreadySaved"));
    assert.equal(controls.confirmBtnWrap.title, t("hatchAlreadySaved"));
    controls.updateActionButtons({ hasDelta: true });
    assert.equal(controls.confirmBtn.disabled, false);
    assert.equal(controls.confirmBtn.title, t("buttonHatchHint"));
    assert.equal(controls.confirmBtnWrap.title, t("buttonHatchHint"));
    controls.updateActionButtons({ isStage1: true, nutCollected: true });
    assert.equal(controls.stage1SkipBtn.disabled, true);
    assert.equal(controls.stage1SkipBtn.title, t("nutAlreadySaved"));
    assert.equal(controls.stage1SkipBtnWrap.title, t("nutAlreadySaved"));
    controls.updateActionButtons({ isStage1: false, nutCollected: true });
    assert.equal(controls.collectNutBtn.disabled, true);
    assert.equal(controls.collectNutBtn.title, t("nutAlreadySaved"));
    assert.equal(controls.collectNutBtnWrap.title, t("nutAlreadySaved"));
    controls.updateStage1ProceedBtn({ selectedCount: 0 });
    assert.equal(controls.stage1ProceedBtn.disabled, true);
    assert.equal(controls.stage1ProceedBtn.title, t("selectEggToAnalyzeHint"));
    assert.equal(controls.eggAnalysisSelector.title, t("selectEggToAnalyzeHint"));
    assert.equal(controls.eggAnalysisLabel.textContent, t("eggAnalysisSelectEgg"));
    assert.equal(controls.eggAnalysisLabel.textContent, "🥚 Select an Egg...");
    controls.updateStage1ProceedBtn({ selectedCount: 1 });
    assert.equal(controls.stage1ProceedBtn.disabled, false);
    assert.equal(controls.stage1ProceedBtn.title, t("targetEggsTooltip"));
    assert.equal(controls.eggAnalysisSelector.title, t("targetEggsTooltip"));
    assert.equal(controls.eggAnalysisLabel.textContent, t("eggAnalysis"));
    assert.ok(controls.eggAnalysisLabel.textContent.startsWith("🥚"));
    const eggs = controls;
    eggs.toggleEggAnalysisMenu(true);
    assert.equal(eggs.eggAnalysisMenu.classList.contains("hidden"), false);
    assert.equal(eggs.stage1ProceedBtn.getAttribute("aria-expanded"), "true");
    eggs.setEggAnalysisLoading(true);
    assert.equal(controls.eggAnalysisMenu.classList.contains("hidden"), true);
    assert.equal(eggs.eggAnalysisWithKnowledgeBtn.disabled, true);
    eggs.setEggAnalysisLoading(false);
    assert.equal(eggs.eggAnalysisWithKnowledgeBtn.disabled, false);
    assert.equal(eggs.eggAnalysisLabel.textContent, t("eggAnalysis"));
  });

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

    banners.showError("Invalid bridge pairing token.", "bridge_auth_failed");
    assert.strictEqual(banners.errorMessage.textContent, "Invalid bridge pairing token.");
    assert.strictEqual(banners.errorHint.classList.contains("hidden"), true);
    banners.showError("Pairing token missing.", "pairing_token_missing");
    assert.strictEqual(banners.errorHint.innerHTML, t("subscriptionBridgeTokenRequired"));
    assert.strictEqual(banners.errorHint.classList.contains("hidden"), false);

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

    // Setup is presented once in the setup hub, never as a duplicate warning.
    banners.updateCaptureBanners({ serverOnline: false, chromeAiConfigured: false, chromeAiEnabled: false });
    assert.strictEqual(banners.aiKeyMissingBanner.classList.contains("hidden"), true);
    assert.strictEqual(banners.chromeModeTipBanner.classList.contains("hidden"), true);

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
    assert.ok(captureView.contentPreview.textContent.startsWith("⚠️ Only 3 words extracted"));
    assert.ok(captureView.contentPreview.textContent.endsWith("Hello world content"));
    assert.ok(captureView.pageAuthorEl.textContent.includes("Alice"));
    assert.ok(captureView.pageWordCountEl.textContent.includes("3 words"));
    assert.strictEqual(captureView.pageWordCountEl.classList.contains("hidden"), false);

    captureView.clearProvenance();
    assert.strictEqual(captureView.pageWordCountEl.textContent, "");
    assert.strictEqual(captureView.pageWordCountEl.classList.contains("hidden"), true);
  });

  it("CaptureViewComponent explains missing transcripts above the description without changing captured text", () => {
    const capture = new CaptureViewComponent(createMockRoot());
    const content = { url: "https://youtube.com/watch?v=video", sourceType: "youtube", transcriptAvailable: false,
      content: "Video description ".repeat(150) };
    const original = structuredClone(content);
    capture.previewUrl = content.url;
    capture.contentPreview.scrollTop = 150;
    capture.render(content);
    assert.ok(capture.contentPreview.textContent.startsWith("⚠️ Transcript not loaded."));
    assert.ok(capture.contentPreview.textContent.includes("not the spoken content"));
    assert.ok(capture.contentPreview.textContent.endsWith(content.content));
    assert.equal(capture.contentPreview.classList.contains("incomplete"), true);
    assert.equal(capture.contentPreview.scrollTop, 0);
    assert.deepEqual(content, original);
    assert.equal(capture.transcriptRefreshHint.textContent, "Refresh content");
    assert.equal(capture.transcriptRefreshHint.classList.contains("hidden"), false);
    assert.ok(capture.contentPreview.textContent.includes("click Refresh to try again"));


    capture.render({ ...content, content: "", transcriptAvailable: false });
    assert.ok(capture.contentPreview.textContent.startsWith("⚠️ Transcript not loaded."));

    capture.render({ ...content, transcriptAvailable: true });
    assert.equal(capture.contentPreview.textContent, content.content);
    assert.equal(capture.transcriptRefreshHint.classList.contains("hidden"), true);
    assert.equal(capture.contentPreview.classList.contains("incomplete"), false);
  });

  it('CaptureViewComponent counts the question and loaded Zhihu answers shown in its preview', () => {
    const capture = new CaptureViewComponent(createMockRoot());
    const content = { sourceType: 'zhihu', content: '这是一个很短的问题只有十四字',
      discussion: { kind: 'forum', items: [{ id: 'answer1', text: '这是已加载的完整回答。'.repeat(40) }] } };
    capture.render(content);
    assert.equal(capture.pageWordCountEl.textContent, '📝 414 words');
    assert.equal(capture.contentPreview.classList.contains('incomplete'), false);
    assert.equal(capture.previewRefreshBtn.classList.contains('hidden'), true);
    assert.ok(capture.contentPreview.textContent.includes(content.discussion.items[0].text));
  });

  it("CaptureViewComponent clears extraction notices on loading and tab changes", () => {
    const capture = new CaptureViewComponent(createMockRoot());
    const missing = { sourceType: "youtube", transcriptAvailable: false, content: "Description" };
    for (const reset of [() => capture.setLoading(), () => capture.clear()]) {
      capture.render(missing);
      reset();
      assert.equal(capture.transcriptRefreshHint.classList.contains("hidden"), true);
      assert.ok(!capture.contentPreview.textContent.includes("Transcript not loaded"));
      assert.equal(capture.contentPreview.classList.contains("incomplete"), false);
    }
    capture.render(missing);
    capture.render({ sourceType: "article", content: "article ".repeat(250) });
    assert.equal(capture.transcriptRefreshHint.classList.contains("hidden"), true);
    assert.ok(!capture.contentPreview.textContent.includes("transcript"));
    assert.equal(capture.contentPreview.classList.contains("incomplete"), false);
  });

  it("CaptureViewComponent offers refresh for extraction errors and incomplete content on any page", () => {
    const capture = new CaptureViewComponent(createMockRoot());
    for (const showProblem of [
      () => capture.setError(t("couldNotExtractContent")),
      () => capture.render({ sourceType: "article", content: "" }),
      () => capture.render({ sourceType: "article", content: "Partial article", extractionStatus: "transient" }),
    ]) {
      showProblem();
      assert.equal(capture.transcriptRefreshHint.textContent, "Refresh content");
      assert.equal(capture.transcriptRefreshHint.classList.contains("hidden"), false);
      assert.ok(/refresh|retry/i.test(capture.contentPreview.textContent));
      assert.equal(capture.contentPreview.classList.contains("incomplete"), true);
    }
    capture.setError(t("couldNotExtractContent"));
    assert.ok(capture.contentPreview.textContent.includes("click Refresh to try again"));
    assert.ok(capture.contentPreview.textContent.includes("(Could not extract content)"));
    capture.setLoading();
    assert.equal(capture.transcriptRefreshHint.classList.contains("hidden"), true);
    capture.render({ sourceType: "article", content: "Complete article ".repeat(250) });
    assert.equal(capture.transcriptRefreshHint.classList.contains("hidden"), true);
    assert.equal(capture.contentPreview.classList.contains("incomplete"), false);
  });

  it("CaptureViewComponent refreshes from inside the content box and respects busy state", () => {
    const capture = new CaptureViewComponent(createMockRoot());
    let refreshes = 0;
    capture.refreshBtn.addEventListener("click", () => refreshes++);
    capture.setError("Could not extract content");
    assert.equal(capture.previewRefreshBtn.classList.contains("hidden"), false);
    capture.previewRefreshBtn.click();
    assert.equal(refreshes, 1);
    capture.setRefreshDisabled(true);
    assert.equal(capture.previewRefreshBtn.disabled, true);
    capture.previewRefreshBtn.click();
    assert.equal(refreshes, 1);
    capture.setLoading();
    assert.equal(capture.previewRefreshBtn.classList.contains("hidden"), true);
  });

  it("CaptureViewComponent shows the caption route and clears it across refreshes and pages", () => {
    const capture = new CaptureViewComponent(createMockRoot());
    const labels = {
      page_tracks: "Page tracks", watch_page: "Watch page", innertube: "Player API",
      player_tracks: "Live player", transcript_panel: "Transcript panel",
    };
    for (const [source, label] of Object.entries(labels)) {
      capture.render({ sourceType: "youtube", content: "Transcript", metadata: { caption_source: source } });
      assert.strictEqual(capture.pageCaptionSourceEl.textContent, `Captions · ${label}`);
      assert.strictEqual(capture.pageCaptionSourceEl.classList.contains("hidden"), false);
    }
    capture.setLoading();
    assert.strictEqual(capture.pageCaptionSourceEl.textContent, "");
    assert.strictEqual(capture.pageCaptionSourceEl.classList.contains("hidden"), true);
    capture.render({ sourceType: "article", content: "Article", metadata: {} });
    assert.strictEqual(capture.pageCaptionSourceEl.classList.contains("hidden"), true);
  });

  it("CaptureViewComponent renders safe clickable timestamps in fetched content and restored previews", () => {
    const capture = new CaptureViewComponent(createMockRoot());
    const content = { title: "Video", sourceType: "bilibili", content: '[00:15] Intro\n01:02:03 Answer <img src=x onerror="bad()">' };
    const original = content.content;
    capture.render(content);
    assert.ok(capture.contentPreview.innerHTML.includes('data-time="00:15"'));
    assert.ok(capture.contentPreview.innerHTML.includes('data-time="01:02:03"'));
    assert.ok(capture.contentPreview.innerHTML.includes("&lt;img"));
    assert.ok(!capture.contentPreview.innerHTML.includes("<img"));
    assert.equal(content.content, original);
    capture.setPreviewText("[12:34] Restored transcript");
    assert.ok(capture.contentPreview.innerHTML.includes('data-time="12:34"'));
    assert.ok(capture.contentPreview.innerHTML.includes("source-pill"));

    let sought = null;
    globalThis.NutEggUI.handleSourcePillClick({
      target: { closest: () => ({ dataset: { time: "12:34" } }) },
      preventDefault() {}, stopPropagation() {},
    }, { onSeek: seconds => { sought = seconds; } });
    assert.equal(sought, 754);
  });

  it("SectionChipsComponent binds capture and re-analyze section chips and handles clicks", async () => {
    const root = createMockRoot();
    const chips = new SectionChipsComponent(root);

    assert.ok(chips.chipVerdictSummary);
    assert.ok(chips.chipMindmap);
    assert.ok(chips.chipMindmap);
    assert.ok(chips.reanalyzeChipVerdictSummary);
    assert.ok(chips.sectionsToggle);

    let toggledKey = null;
    const expanded = { sectionsExpanded: false, reanalyzeSectionsExpanded: false };
    chips.init({
      onToggle: (key) => {
        toggledKey = key;
      },
      onExpand: key => { expanded[key] = !expanded[key]; chips.renderPresentation(expanded); },
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
    chips.chipVerdictSummary.click();
    assert.strictEqual(toggledKey, "verdictSummary");

    chips.chipMindmap.click();
    assert.strictEqual(toggledKey, "mindMap");

    chips.reanalyzeChipMindmap.click();
    assert.strictEqual(toggledKey, "mindMap");

    // Test updateUI visual classes & badges
    chips.updateUI({
      titleVerdict: true,
      coreSummary: true,
      mindMap: false,
    });
    assert.strictEqual(chips.chipMindmap.classList.contains("inactive"), true);
    assert.strictEqual(chips.chipVerdictSummary.classList.contains("active"), true);
    assert.strictEqual(chips.chipKnowledge.classList.contains("inactive"), true);
    assert.strictEqual(chips.sectionsBadge.textContent, "1/4");
    assert.strictEqual(chips.reanalyzeSectionsBadge.textContent, "1/4");

    chips.chipKnowledge.click();
    assert.equal(toggledKey, "generateKnowledgeEntries");
    chips.reanalyzeChipKnowledge.click();
    assert.equal(toggledKey, "generateKnowledgeEntries");
    chips.updateUI({ titleVerdict: true, coreSummary: true, mindMap: false }, true);
    assert.equal(chips.chipKnowledge.classList.contains("active"), true);
    assert.equal(chips.reanalyzeChipKnowledge.classList.contains("active"), true);
    assert.equal(chips.sectionsBadge.textContent, "2/4");

    // Test onSectionToggle fallback
    let fallbackResult = null;
    chips.init({
      onSectionToggle: (key, nextVal, newSections) => {
        fallbackResult = { key, nextVal, newSections };
      },
    });
    chips.chipVerdictSummary.click();
    assert.strictEqual(fallbackResult.key, "verdictSummary");
    assert.strictEqual(fallbackResult.nextVal, false);
    assert.strictEqual(fallbackResult.newSections.coreSummary, false);
    assert.strictEqual(fallbackResult.newSections.titleVerdict, false);
  });

  it("VerdictComponent renders decision verdicts and title verdict", () => {
    const root = createMockRoot();
    const verdict = new VerdictComponent(root);

    verdict.renderTitleVerdict("Yes, it's worth it");
    assert.strictEqual(verdict.verdictAnswer.textContent, "Yes, it's worth it");
    assert.strictEqual(verdict.titleVerdictSection.classList.contains("hidden"), false);

    verdict.renderDecision({ readAction: "full", shouldRead: true, shouldReadReason: "Highly relevant" });
    assert.strictEqual(verdict.verdictIcon.textContent, "📖");
    assert.strictEqual(verdict.verdictReason.innerHTML, "Highly relevant");
  });

  it("ActionControlsComponent handles full/preview mode and buttons", () => {
    const root = createMockRoot();
    const actions = new ActionControlsComponent(root);

    actions.setMode("preview");
    assert.strictEqual(actions.modeConfirmBtn.classList.contains("active"), true);
    assert.strictEqual(actions.modeFastBtn.classList.contains("active"), false);

    actions.setMode("full");
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

  it("Mindmap, Qa, and Eggs components bind their respective DOM elements", () => {
    const root = createMockRoot();
    const mindmap = new MindmapComponent(root);
    const qa = new QaComponent(root);
    const eggs = new EggsComponent(root);

    assert.ok(mindmap.mindmapTree);
    assert.ok(qa.customQuestionsList);
    assert.ok(eggs.eggsList);
    assert.ok(eggs.eggKnowledgeContent);
  });

  it("ActionControlsComponent offers existing analysis independently of AI readiness", () => {
    const actions = new ActionControlsComponent(createMockRoot());
    actions.updateAnalyzeState({ hasAnalysisResult: false });
    assert.equal(actions.viewAnalysisBtn.classList.contains("hidden"), true);
    actions.updateAnalyzeState({ hasAnalysisResult: true, notReadyReason: "AI offline" });
    assert.equal(actions.viewAnalysisBtn.classList.contains("hidden"), false);
    assert.equal(actions.viewAnalysisBtn.disabled, false);
    actions.updateAnalyzeState({ hasAnalysisResult: false });
    assert.equal(actions.viewAnalysisBtn.classList.contains("hidden"), true);
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
    assert.ok(actions.eggAnalysisLabel.textContent);

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
    assert.ok(capture.contentPreview.textContent.endsWith("Error message"));
    assert.ok(capture.contentPreview.textContent.includes("click Refresh to try again"));

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

    const captureCheckbox = createMockElement("cb");
    captureCheckbox.dataset = { captureEgg: "prod.md" };
    captureCheckbox.checked = true;
    eggs.captureEggsList.querySelectorAll = () => [captureCheckbox];

    let captureSelected = new Set();
    eggs.renderCaptureList({
      allEggs: [{ fileName: "prod.md", description: "Productivity" }],
      preSelectedEggs: captureSelected,
      onSelectChange: next => { captureSelected = next; }
    });
    assert.strictEqual(eggs.captureEggsToggle.classList.contains("hidden"), false);
    assert.strictEqual(eggs.captureEggsLabel.textContent, "");

    captureCheckbox._listeners.change[0]({ target: captureCheckbox });
    assert.strictEqual(captureSelected.has("prod.md"), true);
    assert.strictEqual(eggs.captureEggsLabel.textContent, "(prod)");

    eggs.toggleCaptureEggs();
    assert.strictEqual(eggs.captureEggsArea.classList.contains("hidden"), true);

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

  it("VerdictComponent show, hide, reset, and setAnalyzing work correctly", () => {
    const root = createMockRoot();
    const verdict = new VerdictComponent(root);

    verdict.setAnalyzing(3);
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
    settings.setConnectionMode("obsidian", false);
    settings.setServerStatus({ online: true, version: "0.2.0", aiConfigured: true });
    header.render(null, settings);
    assert.strictEqual(header.serverStatus.className, "status-dot online");

    // 2. Chrome AI mode
    settings.setConnectionMode("chrome", false);
    settings.setServerStatus({ online: false });
    settings.setChromeAiStatus({ enabled: true, configured: true, provider: "Gemini" });
    header.render(null, settings);
    assert.strictEqual(header.serverStatus.className, "status-dot chrome-ai");

    // 3. Chrome setup needed; no Obsidian offline warning
    settings.setChromeAiStatus({ enabled: false, configured: false });
    header.render(null, settings);
    assert.strictEqual(header.serverStatus.className, "status-dot warning");
  });

  it("BannersComponent.render keeps removed setup duplicates and Obsidian pitches hidden", () => {
    const root = createMockRoot();
    const banners = new BannersComponent(root);
    const session = testView();
    const settings = new SettingsState();

    // Capture state with server offline and chrome AI enabled but not configured
    settings.setServerStatus({ online: false });
    settings.setChromeAiStatus({ enabled: true, configured: false });
    banners.render(session, settings);
    assert.strictEqual(banners.aiKeyMissingBanner.classList.contains("hidden"), true);

    // Chrome mode with results
    session.analysisResult = { stage: "stage1", coreSummary: "Hello" };
    settings.setChromeAiStatus({ enabled: true, configured: true });
    banners.render(session, settings);
    assert.strictEqual(banners.chromeResultBanner.classList.contains("hidden"), true);
    assert.strictEqual(banners.chromeActionsCard.classList.contains("hidden"), true);
  });

  it("ResultsViewComponent.render toggles view and displays summary/provenance", () => {
    const root = createMockRoot();
    const results = new ResultsViewComponent(root);
    const session = testView();
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
    session.currentView = "results";
    results.render(session, settings);
    assert.strictEqual(results.resultsState.classList.contains("hidden"), false);
    assert.strictEqual(results.captureState.classList.contains("hidden"), true);
    assert.strictEqual(results.resultPageTitle.textContent, "My Result");
    assert.ok(results.coreSummaryEl.innerHTML.includes("Key takeaway 1"));

    session.currentView = 'capture';
    results.render(session, settings);
    assert.equal(results.captureState.classList.contains("hidden"), false);
    assert.equal(results.resultsState.classList.contains("hidden"), true);
    assert.ok(session.analysisResult);
    session.currentView = 'results';
    results.render(session, settings);
    assert.equal(results.resultsState.classList.contains("hidden"), false);

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
    const session = testView();

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
    const session = testView();
    const settings = new SettingsState();

    // Chrome mode: decision verdict hidden, but title verdict shown!
    settings.setServerStatus({ online: false });
    settings.setChromeAiStatus({ enabled: true, configured: true });
    session.analysisResult = { titleVerdict: "Direct answer in Chrome AI", readAction: "full", shouldRead: true };
    verdict.render(session, settings);
    assert.strictEqual(verdict.verdictSection.classList.contains("hidden"), true);
    assert.strictEqual(verdict.titleVerdictSection.classList.contains("hidden"), false);
    assert.strictEqual(verdict.verdictAnswer.textContent, "Direct answer in Chrome AI");

    // Obsidian mode - Stage 1 confirm: decision verdict hidden, title verdict shown!
    settings.setConnectionMode("obsidian", false);
    settings.setServerStatus({ online: true });
    settings.setAnalysisMode("preview");
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
    session.analysisResult = { stage: "stage2", titleVerdict: "Final verdict", readAction: "full", shouldRead: true, shouldReadReason: "Must read" };
    verdict.render(session, settings);
    assert.strictEqual(verdict.titleVerdictSection.classList.contains("hidden"), false);
    assert.strictEqual(verdict.verdictAnswer.textContent, "Final verdict");
    assert.strictEqual(verdict.verdictSection.classList.contains("hidden"), false);
    assert.strictEqual(verdict.verdictIcon.textContent, "📖");
    assert.strictEqual(verdict.verdictReason.innerHTML, "Must read");
  });

  it("ActionControlsComponent.render updates buttons, modes, and analyze state", () => {
    const root = createMockRoot();
    const actions = new ActionControlsComponent(root);
    const session = testView();
    const settings = new SettingsState();
    settings.setConnectionMode("obsidian", false);
    settings.setServerStatus({ online: true });

    settings.setAnalysisMode("preview");
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
    const session = testView();
    const settings = new SettingsState();

    // Obsidian mode, no eggs matched
    settings.setConnectionMode("obsidian", false);
    settings.setServerStatus({ online: true });
    session.analysisResult = { matchedEggs: [], eggResults: [] };
    eggs.render(session, settings);
    assert.strictEqual(eggs.noEggSection.classList.contains("hidden"), false);

    // A skip recommendation leaves useful results visible and matched.
    session.analysisResult = { matchedEggs: ["a.md"], eggResults: [{ egg: "a.md", readAction: "skip", readVerdict: false,
      extractedEntries: [{ content: "Useful answer" }], keyQuestionAnswers: [] }] };
    eggs.render(session, settings);
    assert.strictEqual(eggs.noEggSection.classList.contains("hidden"), true);
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), false);
    assert.ok(eggs.eggKnowledgeContent.innerHTML.includes("Useful answer"));

    // Losing connectivity does not hide an already-produced egg result.
    settings.setServerStatus({ online: false });
    settings.setChromeAiStatus({ enabled: true, configured: true });
    eggs.render(session, settings);
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), false);
    // A result produced in Chrome mode has no egg UI.
    session.analysisResult = { mode: 'chrome', matchedEggs: [], eggResults: [] };
    eggs.render(session, settings);
    assert.strictEqual(eggs.noEggSection.classList.contains("hidden"), true);
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), true);

    // Re-analyzing with selected eggs hides existing eggs
    settings.setConnectionMode("obsidian", false);
    settings.setServerStatus({ online: true });
    session.isAnalyzing = true;
    session.analysisResult = {
      stage: "stage2",
      matchedEggs: ["Egg1.md"],
      eggResults: [{ egg: "Egg1.md", extractedEntries: ["Knowledge 1"] }],
    };
    eggs.render(session, settings);
    assert.strictEqual(eggs.noEggSection.classList.contains("hidden"), true);
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), true);
  });

  it("Stage 1 egg selection: expands eggs list in confirm mode and in fast mode with 0 matches", () => {
    const root = createMockRoot();
    const eggs = new EggsComponent(root);
    const actions = new ActionControlsComponent(root);
    const session = testView();
    const settings = new SettingsState();
    settings.setConnectionMode("obsidian", false);
    settings.setServerStatus({ online: true });

    // Case 1: Preview mode with matched eggs
    settings.setAnalysisMode("preview");
    session.analysisResult = { stage: "stage1", matchedEggs: ["Egg1.md"] };
    session.allEggs = [{ fileName: "Egg1.md" }, { fileName: "Egg2.md" }];
    session.selectedEggs = new Set(session.analysisResult.matchedEggs || []);
    eggs.render(session, settings);
    actions.render(session, settings);

    assert.strictEqual(actions.stage1ConfirmBox.classList.contains("hidden"), false);
    assert.strictEqual(eggs.eggsSection.classList.contains("hidden"), false);
    assert.strictEqual(eggs.eggsExpanded.classList.contains("hidden"), false);
    assert.strictEqual(session.selectedEggs.has("Egg1.md"), true);
    assert.strictEqual(actions.stage1ProceedBtn.disabled, false);

    // Case 2: Full mode with 0 matched eggs - MUST show stage 1 confirm and expand eggs list
    settings.setAnalysisMode("full");
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
        eggResults: [{ egg: "test.md", extractedEntries: ["fact 1"] }],
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
      eggs.renderKnowledge([{ egg: "direct.md", extractedEntries: [] }]);
    });
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), false);
  });

  it("multi-egg tab switching updates active tab and card visibility", () => {
    const root = createMockRoot();
    const eggs = new EggsComponent(root);

    const eggResults = [
      { egg: "egg1.md", extractedEntries: [{ content: "delta 1" }] },
      { egg: "egg2.md", extractedEntries: [{ content: "delta 2" }] },
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

  it("renderEggKnowledge renders refined entries with kind badges, copy button, and markdown formatting", () => {
    const root = createMockRoot();
    const eggs = new EggsComponent(root);

    eggs.renderKnowledge({
      eggResults: [
        {
          egg: "investment.md",
          readAction: "highlights",
          readVerdictReason: "Good actionable frameworks",
          keyQuestionAnswers: [
            { question: "What is DCA?", answer: "DCA means **Dollar Cost Averaging**." },
          ],
          extractedEntries: [
            {
              kind: "insight",
              content: "**Core Idea**: Buy index funds regularly `SPY`\n- Low fees\n- Broad exposure",
              sources: [{ ref: "05:20" }],
            },
            {
              kind: "list",
              content: "1. Asset allocation\n2. Rebalancing",
            },
          ],
        },
      ],
      activeEggTab: "investment.md",
    });

    const html = eggs.eggKnowledgeContent.innerHTML;
    // Section visible
    assert.strictEqual(eggs.eggKnowledgeSection.classList.contains("hidden"), false);

    // Kind badges
    assert.ok(html.includes('delta-kind-badge kind-insight'));
    assert.ok(html.includes('delta-kind-badge kind-list'));
    assert.ok(html.includes('💡'));
    assert.ok(html.includes('📋'));

    // Copy buttons with data-content
    assert.ok(html.includes('class="entry-copy-btn"'));
    assert.ok(html.includes('data-content='));

    // Markdown formatted output (bold and inline code)
    assert.ok(html.includes('<strong>Core Idea</strong>'));
    assert.ok(html.includes('<code class="delta-inline-code">SPY</code>'));

    // Bullet and numbered formatting
    assert.ok(html.includes('delta-bullet-row'));
    assert.ok(html.includes('delta-bullet-dot'));
    assert.ok(html.includes('delta-bullet-num'));

    // Key Questions Q badge
    assert.ok(html.includes('class="qa-q-badge">Q</span>'));

    // Status banner action class
    assert.ok(html.includes('action-highlights'));
  });
});
