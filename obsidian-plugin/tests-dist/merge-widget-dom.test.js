"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tests/merge-widget-dom.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));
var import_jsdom = require("jsdom");
var import_view2 = require("@codemirror/view");
var import_state = require("@codemirror/state");

// tests/obsidian-stub.ts
var Notice = class {
  constructor(message, _timeout) {
    this.message = message;
  }
};

// src/merge-widget.ts
var import_view = require("@codemirror/view");
function findInstructionTargetLine(docText) {
  const lines = docText.split("\n");
  const calloutStart = lines.findIndex(
    (l) => /^>\s*\[!\w+\]-?\s*(?:instructions?|scope)?/i.test(l.trim())
  );
  if (calloutStart !== -1) {
    let calloutEnd = calloutStart;
    for (let i = calloutStart + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith(">")) {
        calloutEnd = i;
      } else if (trimmed === "") {
        let moreCallout = false;
        for (let j = i + 1; j < Math.min(lines.length, i + 10); j++) {
          const nextTrimmed = lines[j].trim();
          if (nextTrimmed === "")
            continue;
          if (nextTrimmed.startsWith(">"))
            moreCallout = true;
          break;
        }
        if (moreCallout)
          continue;
        break;
      } else {
        break;
      }
    }
    return calloutEnd + 1;
  }
  const headingIdx = lines.findIndex(
    (l) => /^#+\s*instructions?\s*:?$/i.test(l.trim())
  );
  if (headingIdx !== -1) {
    return headingIdx + 1;
  }
  const unprocIdx = lines.findIndex((l) => /^#\s*Unprocessed\s*$/i.test(l.trim()));
  if (unprocIdx !== -1) {
    return unprocIdx + 1;
  }
  return null;
}
async function runMerge(plugin, filePath, currentDoc) {
  if (currentDoc !== null) {
    const file = plugin.app.vault.getAbstractFileByPath(filePath);
    if (file) {
      const disk = await plugin.app.vault.read(file);
      if (disk !== currentDoc) {
        await plugin.app.vault.modify(file, currentDoc);
        console.log(`[NutEgg] Saved unsaved edits in ${filePath} before merge`);
      }
    }
  }
  return plugin.aiProcessor.mergeEgg(filePath);
}
function appendCreditPill(plugin, targetBadge) {
  if (typeof plugin.aiClient?.checkCredit !== "function")
    return;
  const creditPill = document.createElement("span");
  creditPill.className = "nutegg-merge-credit";
  creditPill.style.opacity = "0.75";
  creditPill.style.marginLeft = "8px";
  creditPill.style.fontSize = "0.85em";
  plugin.aiClient.checkCredit(plugin.settings).then((credit) => {
    if (credit.hasBalance && credit.balanceFormatted) {
      creditPill.textContent = `\u2022 \u{1FA99} ${credit.providerLabel}: ${credit.balanceFormatted}`;
      creditPill.title = `NutEgg AI: ${credit.statusText}`;
      targetBadge.appendChild(creditPill);
    } else if (credit.providerLabel) {
      const label = plugin.settings.aiSource === "openrouter" ? "OpenRouter" : credit.providerLabel;
      creditPill.textContent = `\u2022 \u{1FA99} ${label}`;
      creditPill.title = `NutEgg AI: ${credit.statusText}`;
      targetBadge.appendChild(creditPill);
    }
  }).catch(() => {
  });
}
var MergeButtonWidget = class extends import_view.WidgetType {
  constructor(plugin, view, filePath, count) {
    super();
    this.plugin = plugin;
    this.view = view;
    this.filePath = filePath;
    this.count = count;
  }
  toDOM() {
    const wrap = document.createElement("div");
    wrap.className = "nutegg-merge-container nutegg-merge-editor-widget";
    const badge = document.createElement("div");
    badge.className = "nutegg-merge-badge";
    badge.textContent = this.count > 0 ? `\u{1F95A} ${this.count} unprocessed ${this.count === 1 ? "entry" : "entries"}` : "\u2705 Knowledge tree is up to date";
    appendCreditPill(this.plugin, badge);
    wrap.appendChild(badge);
    if (this.count > 0) {
      const button = document.createElement("button");
      button.className = "nutegg-merge-btn mod-cta";
      button.textContent = "\u26A1 Merge into Knowledge Tree";
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (button.disabled)
          return;
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = "\u23F3 Merging...";
        try {
          const result = await runMerge(
            this.plugin,
            this.filePath,
            this.view.state.doc.toString()
          );
          if (result && result.entries > 0) {
            new Notice(`[NutEgg] Merged ${result.entries} entries into knowledge tree`);
          } else {
            new Notice("[NutEgg] Merge returned no changes or failed. Check console.");
            button.disabled = false;
            button.textContent = originalText;
          }
        } catch (err) {
          console.error("[NutEgg] Editor merge failed:", err);
          new Notice(`[NutEgg] Merge failed: ${err instanceof Error ? err.message : String(err)}`);
          button.disabled = false;
          button.textContent = originalText;
        }
      });
      wrap.appendChild(button);
    }
    return wrap;
  }
};
var EggMergeEditorPlugin = class {
  constructor(plugin, view) {
    this.plugin = plugin;
    this.view = view;
    this.decorations = this.build();
  }
  decorations;
  /** Last built state — logged once per transition, not per keystroke. */
  lastState = "";
  update(update) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.build();
    }
  }
  /** The vault path of the file rendered by this editor view. */
  filePath() {
    for (const leaf of this.plugin.app.workspace.getLeavesOfType("markdown")) {
      if (leaf.view?.editor?.cm === this.view) {
        return leaf.view.file?.path || "";
      }
    }
    return this.plugin.app.workspace.getActiveFile()?.path || "";
  }
  build() {
    const docText = this.view.state.doc.toString();
    const lineNo = findInstructionTargetLine(docText);
    if (lineNo === null) {
      return this.logState("no-target", import_view.Decoration.none);
    }
    const egg = this.plugin.eggParser.parseEggFile(this.filePath(), docText);
    const count = this.plugin.eggParser.countUnprocessed(egg);
    const state = count === 0 ? "up-to-date" : `count-${count}`;
    const line = this.view.state.doc.line(lineNo);
    return this.logState(
      state,
      import_view.Decoration.set([
        import_view.Decoration.widget({
          widget: new MergeButtonWidget(this.plugin, this.view, this.filePath(), count),
          // CM block widgets can't come from plugins — an inline decoration
          // whose DOM displays as a block is the portable equivalent (the
          // CSS gives it width:100% so it sits on its own line).
          side: 1
        }).range(line.to)
      ])
    );
  }
  logState(state, decorations) {
    if (state !== this.lastState) {
      this.lastState = state;
      const detail = state === "no-target" ? "no instruction block or heading in this file" : state === "up-to-date" ? "0 entries \u2014 showing up-to-date badge" : `${state.replace("count-", "")} entries \u2014 showing merge button`;
      console.log(`[NutEgg] Editor merge widget (${this.filePath() || "?"}): ${detail}`);
    }
    return decorations;
  }
};
function mergeEditorExtension(plugin) {
  return import_view.ViewPlugin.fromClass(
    class extends EggMergeEditorPlugin {
      constructor(view) {
        super(plugin, view);
      }
    },
    // Required: fromClass only wires decorations into the editor when the
    // spec declares them — an instance `decorations` field alone is ignored.
    { decorations: (v) => v.decorations }
  );
}

// tests/helpers.ts
function makeFakeVault(initial = {}) {
  const files = new Map(Object.entries(initial));
  const basePath = "/fake/vault";
  const adapter = {
    exists: async (p) => files.has(p) || [...files.keys()].some((k) => k.startsWith(p + "/")),
    read: async (p) => {
      if (!files.has(p))
        throw new Error("File not found: " + p);
      return files.get(p);
    },
    remove: async (p) => {
      files.delete(p);
    },
    append: async (p, data) => {
      files.set(p, (files.get(p) ?? "") + data);
    },
    getBasePath: () => basePath
  };
  const vault = {
    adapter,
    create: async (p, content) => {
      files.set(p, content);
    },
    createFolder: async (_p) => {
    },
    modify: async (file, content) => {
      files.set(file.path, content);
    },
    read: async (file) => {
      if (!files.has(file.path))
        throw new Error("File not found: " + file.path);
      return files.get(file.path);
    },
    getAbstractFileByPath: (p) => files.has(p) ? { path: p } : null,
    getMarkdownFiles: () => [...files.keys()].filter((k) => k.endsWith(".md")).map((p) => ({ path: p }))
  };
  return { files, basePath, vault };
}
function makeFakePlugin(overrides = {}) {
  const { vault } = makeFakeVault(overrides.vaultFiles || {});
  return {
    settings: {
      aiApiKey: "test-key",
      rawFolder: "nutegg/_raw",
      indexFile: "nutegg/_index.md",
      serverPort: 27123,
      ...overrides.settings || {}
    },
    app: { vault: overrides.vault ?? vault },
    aiClient: overrides.aiClient ?? {
      chat: async () => "{}",
      checkCredit: async () => ({
        provider: "anthropic",
        providerLabel: "Anthropic (Claude)",
        source: "openrouter",
        model: "claude-sonnet-5",
        hasBalance: true,
        balanceFormatted: "$8.45",
        statusText: "$8.45 left"
      })
    },
    eggParser: overrides.eggParser ?? {
      formatEggForPrompt: (e) => `egg:${e.fileName}`,
      formatEggInstructionsForPrompt: (e) => `instructions:${e.fileName}`,
      formatEggKnowledgeForPrompt: (e) => `knowledge:${e.fileName}`
    },
    indexReader: overrides.indexReader ?? {},
    knowledgeBase: overrides.knowledgeBase ?? {},
    db: overrides.db ?? null,
    ...overrides
  };
}

// src/egg-parser.ts
var KNOWLEDGE_HEADING = "# Knowledge";
var UNPROCESSED_HEADING = "# Unprocessed";
var EggParser = class {
  plugin;
  constructor(plugin) {
    this.plugin = plugin;
  }
  async readEgg(fileName) {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Egg file not found: ${fileName}`);
      return null;
    }
    const content = await this.plugin.app.vault.read(file);
    return this.parseEggFile(fileName, content);
  }
  async readEggs(entries) {
    const eggs = [];
    for (const entry of entries) {
      const egg = await this.readEgg(entry.fileName);
      if (egg)
        eggs.push(egg);
    }
    return eggs;
  }
  parseEggFile(fileName, content) {
    const result = {
      fileName,
      topic: "Unknown",
      scope: "",
      actionGuide: "",
      keyQuestions: [],
      rejectionCriteria: [],
      formattingRules: "",
      knowledge: "",
      unprocessed: ""
    };
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      for (const line of fmMatch[1].split("\n")) {
        const kv = line.match(/^(\w+):\s*(.*)$/);
        if (!kv)
          continue;
        const key = kv[1].toLowerCase();
        const value = kv[2].trim().replace(/^"(.*)"$/, "$1");
        if (key === "topic")
          result.topic = value;
      }
    }
    const callout = this.extractCallout(content);
    const sections = callout ? this.splitLabeledSections(callout) : /* @__PURE__ */ new Map();
    result.scope = (sections.get("scope") || "").trim();
    result.actionGuide = (sections.get("action guide") || "").trim();
    result.keyQuestions = this.parseListItems(sections.get("key questions") || "");
    result.rejectionCriteria = this.parseListItems(sections.get("rejection criteria") || "");
    result.formattingRules = (sections.get("formatting rules") || "").trim();
    const lines = content.split("\n");
    const knowledgeSection = this.findSection(lines, "knowledge");
    if (knowledgeSection) {
      result.knowledge = this.sectionBody(lines, knowledgeSection, "knowledge");
    }
    const unprocessedSection = this.findSection(lines, "unprocessed");
    if (unprocessedSection) {
      result.unprocessed = this.sectionBody(lines, unprocessedSection, "unprocessed");
    }
    return result;
  }
  /**
   * Section content without the surrounding blank lines. Indentation of the
   * first line is preserved (unlike trim()) so re-indented sections survive.
   *
   * A stray duplicate heading of the same name (AI merge output that included
   * its own `# Knowledge`-style line) is stripped so the body starts with the
   * actual content.
   */
  sectionBody(lines, section, name) {
    const body = lines.slice(section.start + 1, section.end);
    while (body.length > 0 && (body[0].trim() === "" || this.headingName(body[0]) === name.toLowerCase())) {
      body.shift();
    }
    return body.join("\n").replace(/\n+$/g, "");
  }
  /** Format only the egg's instructions (Scope, Key Questions, Rejection Criteria, Formatting Rules) for Step 1 extraction. */
  formatEggInstructionsForPrompt(egg) {
    const parts = [];
    parts.push(`**Scope:** ${egg.scope || "(not specified)"}`);
    if (egg.keyQuestions.length > 0) {
      parts.push(
        `**Key Questions:**
${egg.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      );
    }
    if (egg.rejectionCriteria.length > 0) {
      parts.push(
        `**Rejection Criteria:**
${egg.rejectionCriteria.map((c) => `- ${c}`).join("\n")}`
      );
    }
    if (egg.formattingRules) {
      parts.push(`**Formatting Rules:**
${egg.formattingRules}`);
    }
    return parts.join("\n\n");
  }
  /** Format only the egg's existing Knowledge tree and Unprocessed entries for Step 2 comparison. */
  formatEggKnowledgeForPrompt(egg) {
    const parts = [];
    parts.push(`**Current Knowledge:**
${egg.knowledge || "(empty)"}`);
    if (egg.unprocessed.trim()) {
      parts.push(`**Unprocessed (pending merge):**
${egg.unprocessed}`);
    }
    return parts.join("\n\n");
  }
  /** Format one egg's instructions + knowledge for an AI prompt (backward compatibility). */
  formatEggForPrompt(egg) {
    return [
      this.formatEggInstructionsForPrompt(egg),
      this.formatEggKnowledgeForPrompt(egg)
    ].join("\n\n");
  }
  /**
   * Append one new knowledge entry to the egg's Unprocessed section.
   *
   * Entries land here first and are merged into the Knowledge tree later,
   * once 20+ accumulate (see ai-processor.maybeMergeEgg). Each entry keeps
   * its insight + examples (AI-generated `content`), plus mechanical
   * `_author` / `_source` lines for provenance.
   */
  async appendUnprocessed(fileName, content, author, sourceTitle, sourceUrl) {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot append \u2014 egg file not found: ${fileName}`);
      return;
    }
    const existing = await this.plugin.app.vault.read(file);
    const lines = existing.replace(/\n+$/, "").split("\n");
    const section = this.findSection(lines, "unprocessed");
    const trimmed = content.trim();
    const withBullet = /^[-*]\s/.test(trimmed) ? trimmed : `- ${trimmed}`;
    const meta = [];
    if (author)
      meta.push(`_author: ${author}_`);
    const safeTitle = sourceTitle.replace(/[[\]]/g, "");
    meta.push(`_source: [${safeTitle || "source"}](${sourceUrl})_`);
    const block = [withBullet, ...meta].join("\n");
    if (section) {
      lines.splice(section.end, 0, "", block);
    } else {
      lines.push("", UNPROCESSED_HEADING, "", block);
    }
    await this.plugin.app.vault.modify(file, lines.join("\n") + "\n");
    console.log(`[NutEgg] Added unprocessed entry to ${fileName}`);
  }
  /** Count top-level entries in the Unprocessed section (sub-bullets don't count). */
  countUnprocessed(egg) {
    const indentOf = (l) => (l.match(/^\s*/) || [""])[0].length;
    const bullets = egg.unprocessed.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => /^\s*[-*]\s/.test(l));
    if (bullets.length === 0)
      return 0;
    const base = Math.min(...bullets.map(indentOf));
    return bullets.filter((l) => indentOf(l) === base).length;
  }
  /**
   * Replace the Knowledge and Unprocessed sections with the merged output
   * from the merge AI call. Missing sections are created as needed.
   */
  async applyMerge(fileName, knowledge, unprocessed) {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot merge \u2014 egg file not found: ${fileName}`);
      return;
    }
    knowledge = this.stripSectionHeading(knowledge, "knowledge");
    unprocessed = this.stripSectionHeading(unprocessed, "unprocessed");
    const kLines = knowledge.split("\n");
    const uIdx = kLines.findIndex((l) => this.headingName(l) === "unprocessed");
    if (uIdx !== -1) {
      const rest = this.stripSectionHeading(
        kLines.slice(uIdx).join("\n"),
        "unprocessed"
      );
      knowledge = kLines.slice(0, uIdx).join("\n").replace(/\s+$/g, "");
      if (!unprocessed)
        unprocessed = rest;
    }
    const existing = await this.plugin.app.vault.read(file);
    let lines = existing.replace(/\n+$/, "").split("\n");
    const knowledgeSection = this.findSection(lines, "knowledge");
    if (knowledgeSection) {
      lines = [
        ...lines.slice(0, knowledgeSection.start + 1),
        "",
        ...knowledge.trim().split("\n"),
        ...lines.slice(knowledgeSection.end)
      ];
    } else {
      const unprocessedSection2 = this.findSection(lines, "unprocessed");
      if (unprocessedSection2) {
        lines = [
          ...lines.slice(0, unprocessedSection2.start),
          "",
          KNOWLEDGE_HEADING,
          "",
          ...knowledge.trim().split("\n"),
          "",
          ...lines.slice(unprocessedSection2.start)
        ];
      } else {
        lines = [...lines, "", KNOWLEDGE_HEADING, "", ...knowledge.trim().split("\n")];
      }
    }
    const unprocessedSection = this.findSection(lines, "unprocessed");
    const remainder = unprocessed.trim();
    if (unprocessedSection) {
      lines = [
        ...lines.slice(0, unprocessedSection.start + 1),
        ...remainder ? ["", ...remainder.split("\n")] : [],
        ...lines.slice(unprocessedSection.end)
      ];
    } else if (remainder) {
      lines = [...lines, "", UNPROCESSED_HEADING, "", ...remainder.split("\n")];
    }
    await this.plugin.app.vault.modify(file, lines.join("\n") + "\n");
    console.log(`[NutEgg] Merged knowledge tree in ${fileName}`);
  }
  /**
   * Locate a `# Name` section heading: `{start, end}`. Returns null when the
   * heading doesn't exist. Sections are h1; `##` lines are knowledge-tree
   * branches and are never treated as section headings.
   *
   * The Knowledge section runs until its successor — the `# Unprocessed`
   * heading — instead of stopping at the next `#` heading, so the tree can
   * use `##` branches as its top level. Other sections end at the next `#`
   * heading.
   *
   * A duplicate heading of the SAME name (a `# Knowledge` line that slipped
   * in below the section heading via a merge) is never treated as the
   * boundary — it stays inside the section, where sectionBody strips it.
   */
  findSection(lines, name) {
    const wanted = name.toLowerCase();
    const start = lines.findIndex(
      (l) => this.headingName(l) === wanted
    );
    if (start === -1)
      return null;
    let end = -1;
    if (wanted === "knowledge") {
      end = lines.findIndex(
        (l, i) => i > start && this.headingName(l) === "unprocessed"
      );
    }
    if (end === -1) {
      end = lines.findIndex((l, i) => {
        if (i <= start)
          return false;
        const head = this.headingName(l);
        return head !== null && head !== wanted;
      });
    }
    return { start, end: end === -1 ? lines.length : end };
  }
  /**
   * Lowercased name of an h1 (`# Name`) heading line, or null when the line
   * is not one.
   */
  headingName(line) {
    const m = line.trim().match(/^#\s+(.+?)\s*#*\s*$/);
    if (!m)
      return null;
    return m[1].trim().toLowerCase();
  }
  /**
   * Drop a leading duplicate `# Name` heading plus the blank lines around
   * it, so the body starts with the actual content.
   */
  stripSectionHeading(body, name) {
    const lines = body.split("\n");
    const wanted = name.toLowerCase();
    while (lines.length > 0 && (lines[0].trim() === "" || this.headingName(lines[0]) === wanted)) {
      lines.shift();
    }
    return lines.join("\n").replace(/\s+$/g, "");
  }
  /** Extract the `> [!abstract]- Instructions:` callout body (lines without `>`). */
  extractCallout(content) {
    const calloutLines = [];
    for (const line of content.split("\n")) {
      if (line.startsWith(">")) {
        calloutLines.push(line.replace(/^>\s?/, ""));
      } else if (calloutLines.length > 0) {
        break;
      }
    }
    if (calloutLines.length === 0)
      return null;
    const marker = calloutLines.findIndex((l) => l.includes("[!abstract]"));
    const body = marker >= 0 ? calloutLines.slice(marker + 1) : calloutLines.slice(1);
    return body.join("\n");
  }
  /** Split instruction text into sections by `**Label:**` lines (content may follow on the same line). */
  splitLabeledSections(text) {
    const map = /* @__PURE__ */ new Map();
    let current = null;
    let buffer = [];
    for (const line of text.split("\n")) {
      const labelMatch = line.match(/^\*\*([^*]+?):\*\*\s*(.*)$/);
      if (labelMatch) {
        if (current)
          map.set(current, buffer.join("\n"));
        current = labelMatch[1].toLowerCase();
        buffer = labelMatch[2] ? [labelMatch[2]] : [];
      } else {
        buffer.push(line);
      }
    }
    if (current)
      map.set(current, buffer.join("\n"));
    return map;
  }
  /** Parse numbered (`1.`) or bulleted (`-`) list items, stripping markers. */
  parseListItems(text) {
    return text.split("\n").map((l) => l.trim()).filter((l) => /^(?:\d+[.)]|[-*])\s+/.test(l)).map((l) => l.replace(/^(?:\d+[.)]|[-*])\s+/, ""));
  }
};

// tests/merge-widget-dom.test.ts
var dom = new import_jsdom.JSDOM("<!doctype html><html><body><div id='editor'></div></body></html>", {
  pretendToBeVisual: true
});
var defineGlobal = (key, value) => Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
defineGlobal("window", dom.window);
defineGlobal("document", dom.window.document);
defineGlobal("navigator", dom.window.navigator);
defineGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 0));
defineGlobal("cancelAnimationFrame", (id) => clearTimeout(id));
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
var EGG_WITH_ENTRIES = [
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
  "- pending two"
].join("\n");
var EGG_EMPTY = ["# Knowledge", "", "- tree", "", "# Unprocessed"].join("\n");
function makePlugin() {
  const { vault } = makeFakePlugin().app;
  const fake = makeFakePlugin({ vault });
  fake.eggParser = new EggParser(fake);
  fake.app.workspace = { getLeavesOfType: () => [], getActiveFile: () => null };
  return fake;
}
async function renderEditor(docText, plugin) {
  const parent = dom.window.document.getElementById("editor");
  parent.innerHTML = "";
  const view = new import_view2.EditorView({
    parent,
    state: import_state.EditorState.create({ doc: docText, extensions: [mergeEditorExtension(plugin)] })
  });
  for (let i = 0; i < 10; i++) {
    view.requestMeasure();
    await new Promise((r) => setTimeout(r, 10));
  }
  return view;
}
(0, import_node_test.describe)("merge-widget editor extension (DOM)", () => {
  let views = [];
  (0, import_node_test.after)(() => {
    for (const v of views)
      v.destroy();
  });
  (0, import_node_test.it)("renders the badge + merge button below # Unprocessed as a block", async () => {
    const view = await renderEditor(EGG_WITH_ENTRIES, makePlugin());
    views.push(view);
    const html = view.dom.innerHTML;
    import_strict.default.ok(html.includes("nutegg-merge-editor-widget"), `widget not in DOM: ${html.slice(0, 400)}`);
    import_strict.default.ok(html.includes("\u{1F95A} 2 unprocessed entries"));
    import_strict.default.ok(html.includes("\u26A1 Merge into Knowledge Tree"));
    const widget = view.dom.querySelector(".nutegg-merge-editor-widget");
    import_strict.default.ok(widget.classList.contains("nutegg-merge-container"), "shares reading-mode container class");
    import_strict.default.ok(widget.querySelector("button").classList.contains("nutegg-merge-btn"));
    import_strict.default.ok(widget.querySelector("button").classList.contains("mod-cta"));
    const headingLine = [...view.dom.querySelectorAll(".cm-line")].find(
      (l) => l.textContent?.includes("Unprocessed")
    );
    import_strict.default.ok(
      headingLine.compareDocumentPosition(widget) & Node.DOCUMENT_POSITION_FOLLOWING,
      "widget sits after the heading line"
    );
  });
  (0, import_node_test.it)("renders the up-to-date badge when there are no entries", async () => {
    const view = await renderEditor(EGG_EMPTY, makePlugin());
    views.push(view);
    import_strict.default.ok(view.dom.innerHTML.includes("\u2705 Knowledge tree is up to date"));
  });
  (0, import_node_test.it)("renders nothing for files without the heading", async () => {
    const view = await renderEditor("# Knowledge\n\n- tree", makePlugin());
    views.push(view);
    import_strict.default.ok(!view.dom.innerHTML.includes("nutegg-merge-editor-widget"));
  });
});
