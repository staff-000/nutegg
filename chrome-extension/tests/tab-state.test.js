// ============================================================
// NutEgg Chrome Extension Tab State Manager Tests
// ============================================================

const test = require("node:test");
const assert = require("node:assert/strict");

const { TabStateManager } = require("../src/popup/state/tab-state.js");

test("TabStateManager - basic Map compatibility (get, set, has, delete, size)", () => {
  const manager = new TabStateManager();
  assert.equal(manager.size, 0);

  manager.set(101, { url: "https://example.com", status: "done" });
  assert.equal(manager.size, 1);
  assert.equal(manager.has(101), true);
  assert.equal(manager.has(102), false);

  const entry = manager.get(101);
  assert.equal(entry.url, "https://example.com");
  assert.equal(entry.status, "done");

  manager.delete(101);
  assert.equal(manager.size, 0);
  assert.equal(manager.has(101), false);
});

test("TabStateManager - active tab tracking", () => {
  const manager = new TabStateManager();
  assert.equal(manager.getActiveTabId(), null);
  assert.equal(manager.isCurrentTabLoading(), false);

  manager.setActiveTabId(202);
  manager.setCurrentTabLoading(true);

  assert.equal(manager.getActiveTabId(), 202);
  assert.equal(manager.isCurrentTabLoading(), true);

  manager.setCurrentTabLoading(false);
  assert.equal(manager.isCurrentTabLoading(), false);
});

test("TabStateManager - extraction sequence numbers & current check", () => {
  const manager = new TabStateManager();

  assert.equal(manager.getExtractSeq(10), 0);
  assert.equal(manager.isExtractSeqCurrent(10, 1), false);

  const seq1 = manager.nextExtractSeq(10);
  assert.equal(seq1, 1);
  assert.equal(manager.getExtractSeq(10), 1);
  assert.equal(manager.isExtractSeqCurrent(10, 1), true);
  assert.equal(manager.isExtractSeqCurrent(10, 2), false);

  const seq2 = manager.nextExtractSeq(10);
  assert.equal(seq2, 2);
  assert.equal(manager.isExtractSeqCurrent(10, 1), false);
  assert.equal(manager.isExtractSeqCurrent(10, 2), true);
});

test("TabStateManager - extraction in-flight status", () => {
  const manager = new TabStateManager();

  assert.equal(manager.isExtracting(10), false);
  manager.setExtracting(10, true);
  assert.equal(manager.isExtracting(10), true);

  manager.setExtracting(10, false);
  assert.equal(manager.isExtracting(10), false);
});

test("TabStateManager - status & isAnalyzing helpers", () => {
  const manager = new TabStateManager();

  assert.equal(manager.getStatus(50), null);
  assert.equal(manager.isAnalyzing(50), false);

  manager.setStatus(50, "analyzing");
  assert.equal(manager.getStatus(50), "analyzing");
  assert.equal(manager.isAnalyzing(50), true);

  manager.setStatus(50, "hatching");
  assert.equal(manager.getStatus(50), "hatching");
  assert.equal(manager.isAnalyzing(50), true);

  manager.setStatus(50, "done");
  assert.equal(manager.getStatus(50), "done");
  assert.equal(manager.isAnalyzing(50), false);
});

test("TabStateManager - saveActiveTabState and restoreTabState with Set hydration", () => {
  const manager = new TabStateManager();

  const state = {
    url: "https://example.com/article",
    extractedContent: { title: "Test Article", content: "Hello world" },
    selectedEggs: new Set(["AI/LLM", "Tech"]),
    preSelectedEggs: new Set(["AI/LLM"]),
    captureHistory: [{ nutId: 1, capturedAt: 12345 }],
    followUpQa: [{ question: "What?", answer: "This" }],
    customQuestions: "Summarize this",
    currentNutId: 1,
  };

  manager.saveActiveTabState(55, state);

  // Cached data stored selectedEggs as Array
  const cached = manager.get(55);
  assert.ok(Array.isArray(cached.selectedEggs));
  assert.deepEqual(cached.selectedEggs, ["AI/LLM", "Tech"]);
  assert.deepEqual(cached.preSelectedEggs, ["AI/LLM"]);

  // Restored data converts selectedEggs back to Set
  const restored = manager.restoreTabState(55);
  assert.ok(restored.selectedEggs instanceof Set);
  assert.equal(restored.selectedEggs.has("Tech"), true);
  assert.ok(restored.preSelectedEggs instanceof Set);
  assert.equal(restored.preSelectedEggs.has("AI/LLM"), true);
  assert.equal(restored.currentNutId, 1);
  assert.equal(restored.customQuestions, "Summarize this");
});

test("TabStateManager - invalidateTab clears cache, sequence, and extracting flag", () => {
  const manager = new TabStateManager();

  manager.set(77, { url: "https://example.com" });
  manager.nextExtractSeq(77);
  manager.setExtracting(77, true);

  assert.equal(manager.has(77), true);
  assert.equal(manager.getExtractSeq(77), 1);
  assert.equal(manager.isExtracting(77), true);

  manager.invalidateTab(77);

  assert.equal(manager.has(77), false);
  assert.equal(manager.getExtractSeq(77), 0);
  assert.equal(manager.isExtracting(77), false);
});

