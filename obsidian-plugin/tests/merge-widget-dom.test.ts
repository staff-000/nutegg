// Headless DOM test: mount a real CodeMirror editor with the merge widget
// extension and assert the badge/button actually render.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { EditorView } from "@codemirror/view";
import { EditorState, StateEffect } from "@codemirror/state";
import { mergeEditorExtension, registerMergeWidget } from "../src/merge-widget";
import { makeFakePlugin, makeFakeVault } from "./helpers";
import { EggParser } from "../src/egg-parser";

const dom = new JSDOM("<!doctype html><html><body><div id='editor'></div></body></html>", {
  pretendToBeVisual: true,
});
// Patch the globals CodeMirror expects (defineProperty — some are getter-only)
const defineGlobal = (key: string, value: any) =>
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
defineGlobal("window", dom.window);
defineGlobal("Window", dom.window.Window);
defineGlobal("document", dom.window.document);
defineGlobal("navigator", dom.window.navigator);
defineGlobal("requestAnimationFrame", (cb: any) => setTimeout(cb, 0));
defineGlobal("cancelAnimationFrame", (id: any) => clearTimeout(id));
defineGlobal("getComputedStyle", dom.window.getComputedStyle.bind(dom.window));
defineGlobal("HTMLElement", dom.window.HTMLElement);
defineGlobal("Node", dom.window.Node);
defineGlobal("Text", dom.window.Text);
defineGlobal("Range", dom.window.Range);
defineGlobal("getSelection", () => dom.window.getSelection());
defineGlobal("MutationObserver", dom.window.MutationObserver);
defineGlobal("Element", dom.window.Element);
defineGlobal("HTMLElement", dom.window.HTMLElement);
defineGlobal("MouseEvent", dom.window.MouseEvent);
defineGlobal("Event", dom.window.Event);

const EGG_WITH_ENTRIES = [
  "---",
  "topic: X",
  "---",
  "",
  "# Knowledge",
  "",
  "- tree",
  "",
  "# Unprocessed",
  "",
  "- pending one",
  "- pending two",
].join("\n");

const EGG_EMPTY = ["# Knowledge", "", "- tree", "", "# Unprocessed"].join("\n");

function makePlugin() {
  const { vault } = makeFakePlugin().app;
  const fake = makeFakePlugin({ vault });
  fake.eggParser = new EggParser(fake as any);
  fake.app.workspace = { getLeavesOfType: () => [], getActiveFile: () => null };
  return fake;
}

async function renderEditor(docText: string, plugin: any, filePath = "nutegg/egg.md", mapped = true): Promise<EditorView> {
  const parent = dom.window.document.getElementById("editor")!;
  parent.innerHTML = "";
  const view = new EditorView({
    parent,
    state: EditorState.create({ doc: docText }),
  });
  plugin.app.workspace = {
    getLeavesOfType: () => mapped ? [{ view: { file: { path: filePath }, editor: { cm: view } } }] : [],
    getActiveFile: () => ({ path: "nutegg/active.md" }),
  };
  view.dispatch({ effects: StateEffect.appendConfig.of(mergeEditorExtension(plugin)) });
  // Let CodeMirror run its measure/render cycle
  for (let i = 0; i < 10; i++) {
    view.requestMeasure();
    await new Promise((r) => setTimeout(r, 10));
  }
  return view;
}

describe("merge-widget editor extension (DOM)", () => {
  let views: EditorView[] = [];

  after(() => {
    for (const v of views) v.destroy();
  });

  it("renders the badge + merge button below # Unprocessed as a block", async () => {
    const view = await renderEditor(EGG_WITH_ENTRIES, makePlugin());
    views.push(view);
    const html = view.dom.innerHTML;
    assert.ok(html.includes("nutegg-merge-editor-widget"), `widget not in DOM: ${html.slice(0, 400)}`);
    assert.ok(html.includes("🥚 2 unprocessed entries"));
    assert.ok(html.includes("⚡ Merge into Knowledge Tree"));
    // Inline decoration styled as a block (CM forbids block widgets from
    // plugins): shares the reading-mode container class and follows the
    // heading line in document order.
    const widget = view.dom.querySelector(".nutegg-merge-editor-widget")!;
    assert.ok(widget.classList.contains("nutegg-merge-container"), "shares reading-mode container class");
    assert.ok(widget.querySelector("button")!.classList.contains("nutegg-merge-btn"));
    assert.ok(widget.querySelector("button")!.classList.contains("mod-cta"));
    const headingLine = [...view.dom.querySelectorAll(".cm-line")].find((l) =>
      l.textContent?.includes("Unprocessed")
    )!;
    assert.ok(
      headingLine.compareDocumentPosition(widget) & Node.DOCUMENT_POSITION_FOLLOWING,
      "widget sits after the heading line"
    );
  });

  it("renders the up-to-date badge when there are no entries", async () => {
    const view = await renderEditor(EGG_EMPTY, makePlugin());
    views.push(view);
    assert.ok(view.dom.innerHTML.includes("✅ Knowledge tree is up to date"));
  });

  it("renders nothing for files without the heading", async () => {
    const view = await renderEditor("# Knowledge\n\n- tree", makePlugin());
    views.push(view);
    assert.ok(!view.dom.innerHTML.includes("nutegg-merge-editor-widget"));
  });

  it("renders nothing for an external note with egg headings", async () => {
    const view = await renderEditor(EGG_WITH_ENTRIES, makePlugin(), "outside/egg.md");
    views.push(view);
    assert.ok(!view.dom.innerHTML.includes("nutegg-merge-editor-widget"));
  });

  it("does not borrow the active tab's path for an unmapped editor", async () => {
    const view = await renderEditor(EGG_WITH_ENTRIES, makePlugin(), "", false);
    views.push(view);
    assert.ok(!view.dom.innerHTML.includes("nutegg-merge-editor-widget"));
  });

  it("ignores a stale button after its editor changes to another file", async () => {
    const plugin = makePlugin();
    let merges = 0;
    let writes = 0;
    plugin.aiProcessor = { mergeEgg: async () => { merges++; return null; } };
    plugin.app.vault.modify = async () => { writes++; };
    const view = await renderEditor(EGG_WITH_ENTRIES, plugin);
    views.push(view);
    const button = view.dom.querySelector<HTMLButtonElement>(".nutegg-merge-btn")!;
    assert.ok(button);
    plugin.app.workspace.getLeavesOfType = () => [{ view: { file: { path: "outside/other.md" }, editor: { cm: view } } }];
    button.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(merges, 0);
    assert.equal(writes, 0);
  });

  it("merges its own egg when a different Obsidian tab becomes active", async () => {
    const plugin = makePlugin();
    const { vault, files } = makeFakeVault({ "nutegg/egg.md": EGG_WITH_ENTRIES, "outside/other.md": "private" });
    plugin.app.vault = vault;
    let mergedPath = "";
    plugin.aiProcessor = { mergeEgg: async (path: string) => { mergedPath = path; return { egg: path, entries: 2 }; } };
    const view = await renderEditor(EGG_WITH_ENTRIES, plugin);
    views.push(view);
    plugin.app.workspace.getActiveFile = () => ({ path: "outside/other.md" });
    view.dom.querySelector<HTMLButtonElement>(".nutegg-merge-btn")!.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(mergedPath, "nutegg/egg.md");
    assert.equal(files.get("outside/other.md"), "private");
  });

  it("never adds a reading-mode merge widget to notes outside the egg folder", async () => {
    const plugin = makePlugin();
    let callback: any;
    plugin.registerMarkdownPostProcessor = (cb: any) => { callback = cb; };
    plugin.eggParser.readEgg = async () => { throw new Error("External note was read"); };
    registerMergeWidget(plugin as any);
    const el = document.createElement("div");
    el.innerHTML = "<h1>Unprocessed</h1><ul><li>Pending</li></ul>";
    await callback(el, { sourcePath: "outside/egg.md" });
    assert.equal(el.querySelector(".nutegg-merge-container"), null);
  });
});
