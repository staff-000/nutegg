// Headless DOM test: mount a real CodeMirror editor with the merge widget
// extension and assert the badge/button actually render.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { mergeEditorExtension } from "../src/merge-widget";
import { makeFakePlugin } from "./helpers";
import { EggParser } from "../src/egg-parser";

const dom = new JSDOM("<!doctype html><html><body><div id='editor'></div></body></html>", {
  pretendToBeVisual: true,
});
// Patch the globals CodeMirror expects (defineProperty — some are getter-only)
const defineGlobal = (key: string, value: any) =>
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
defineGlobal("window", dom.window);
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

async function renderEditor(docText: string, plugin: any): Promise<EditorView> {
  const parent = dom.window.document.getElementById("editor")!;
  parent.innerHTML = "";
  const view = new EditorView({
    parent,
    state: EditorState.create({ doc: docText, extensions: [mergeEditorExtension(plugin)] }),
  });
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
});
