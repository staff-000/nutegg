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

// tests/egg-parser.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));

// src/egg-parser.ts
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
      knowledge: ""
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
    const knowledgeMatch = content.match(
      /^#{1,6}\s*knowledge\s*\n([\s\S]*)$/im
    );
    if (knowledgeMatch) {
      result.knowledge = knowledgeMatch[1].trim();
    }
    return result;
  }
  /** Format one egg's instructions + knowledge for an AI prompt. */
  formatEggForPrompt(egg) {
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
    parts.push(
      `**Current Knowledge:**
${egg.knowledge || "(empty)"}`
    );
    return parts.join("\n\n");
  }
  /**
   * Insert new knowledge into the egg's Knowledge section.
   *
   * If `parentAnchor` matches a line in the knowledge tree, the new content is
   * inserted beneath it as nested sub-bullets (indent = anchor indent + 2).
   * Otherwise the content is appended to the end of the section.
   */
  async insertKnowledge(fileName, parentAnchor, content, sourceUrl) {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot insert \u2014 egg file not found: ${fileName}`);
      return;
    }
    const existing = await this.plugin.app.vault.read(file);
    const lines = existing.split("\n");
    const sectionIdx = lines.findIndex(
      (l) => /^#{1,6}\s*knowledge\s*$/i.test(l.trim())
    );
    const sectionLevel = sectionIdx >= 0 ? (lines[sectionIdx].match(/^#+/) || [""])[0].length : 2;
    const sectionEnd = sectionIdx >= 0 ? lines.findIndex((l, i) => {
      if (i <= sectionIdx)
        return false;
      const m = l.trim().match(/^(#{1,6})\s/);
      return m !== null && m[1].length <= sectionLevel;
    }) : -1;
    const endIdx = sectionEnd === -1 ? lines.length : sectionEnd;
    let anchorIdx = -1;
    let anchorIndent = 0;
    if (parentAnchor && sectionIdx >= 0) {
      const anchorText = parentAnchor.replace(/^#+\s*/, "").trim().toLowerCase();
      for (let i = sectionIdx + 1; i < endIdx; i++) {
        if (lines[i].trim().toLowerCase().includes(anchorText)) {
          anchorIdx = i;
          anchorIndent = (lines[i].match(/^\s*/) || [""])[0].length;
          break;
        }
      }
    }
    const baseIndent = anchorIdx >= 0 ? anchorIndent + 2 : 0;
    const indented = content.split("\n").map((l) => l.trim() ? " ".repeat(baseIndent) + l.trim() : "").join("\n");
    const block = indented + `
${" ".repeat(baseIndent)}_source: [link](${sourceUrl})_`;
    if (anchorIdx >= 0) {
      let insertIdx = anchorIdx + 1;
      while (insertIdx < endIdx) {
        const l = lines[insertIdx];
        if (!l.trim()) {
          insertIdx++;
          continue;
        }
        const indent = (l.match(/^\s*/) || [""])[0].length;
        if (indent <= anchorIndent)
          break;
        insertIdx++;
      }
      lines.splice(insertIdx, 0, block);
    } else if (sectionIdx >= 0) {
      const insertAt = endIdx;
      const prev = lines[insertAt - 1];
      lines.splice(insertAt, 0, ...prev && prev.trim() ? [""] : [], block);
    } else {
      lines.push("", "## Knowledge", "", block);
    }
    await this.plugin.app.vault.modify(file, lines.join("\n"));
    console.log(`[NutEgg] Inserted knowledge into ${fileName}`);
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
    aiClient: overrides.aiClient ?? { chat: async () => "{}" },
    eggParser: overrides.eggParser ?? {
      formatEggForPrompt: (e) => `egg:${e.fileName}`
    },
    indexReader: overrides.indexReader ?? {},
    knowledgeBase: overrides.knowledgeBase ?? {},
    db: overrides.db ?? null,
    ...overrides
  };
}

// tests/egg-parser.test.ts
var NEW_FORMAT_EGG = `---
topic: "Investment Strategy"
status: "active"
---

> [!abstract]- Instructions:
> **Scope:** High-signal financial data.
>
> **Action Guide:**
> 1. Title Verdict: One sentence.
> 2. Decide: should the user read this?
>
> **Key Questions:**
> 1. Is this a structural shift?
> 2. Is there new fundamental analysis?
>
> **Rejection Criteria:**
> - Reject price predictions.
> - Reject FOMO content.
>
> **Formatting Rules:**
> - Respect the existing knowledge tree.

## Knowledge

- Risk Management
  - tail hedging
`;
(0, import_node_test.describe)("EggParser.parseEggFile (new format)", () => {
  const parser = new EggParser(makeFakePlugin());
  (0, import_node_test.it)("parses frontmatter topic", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    import_strict.default.equal(egg.topic, "Investment Strategy");
  });
  (0, import_node_test.it)("parses scope, action guide, and formatting rules", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    import_strict.default.equal(egg.scope, "High-signal financial data.");
    import_strict.default.ok(egg.actionGuide.includes("Title Verdict"));
    import_strict.default.ok(egg.formattingRules.includes("knowledge tree"));
  });
  (0, import_node_test.it)("parses key questions as a list", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    import_strict.default.deepEqual(egg.keyQuestions, [
      "Is this a structural shift?",
      "Is there new fundamental analysis?"
    ]);
  });
  (0, import_node_test.it)("parses rejection criteria as a list", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    import_strict.default.deepEqual(egg.rejectionCriteria, [
      "Reject price predictions.",
      "Reject FOMO content."
    ]);
  });
  (0, import_node_test.it)("extracts the Knowledge section content", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    import_strict.default.equal(egg.knowledge, "- Risk Management\n  - tail hedging");
  });
  (0, import_node_test.it)("defaults topic to Unknown when frontmatter is missing", () => {
    const egg = parser.parseEggFile("x.md", "## Knowledge\n\n- stuff\n");
    import_strict.default.equal(egg.topic, "Unknown");
    import_strict.default.equal(egg.knowledge, "- stuff");
  });
  (0, import_node_test.it)("parses `**Label:**` with inline content on the same line", () => {
    const content = "> [!abstract]- Instructions:\n> **Scope:** Inline scope text.\n> **Key Questions:**\n> 1. Q1\n";
    const egg = parser.parseEggFile("x.md", content);
    import_strict.default.equal(egg.scope, "Inline scope text.");
    import_strict.default.deepEqual(egg.keyQuestions, ["Q1"]);
  });
});
(0, import_node_test.describe)("EggParser.formatEggForPrompt", () => {
  const parser = new EggParser(makeFakePlugin());
  (0, import_node_test.it)("includes scope, questions, criteria, rules and knowledge", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    const out = parser.formatEggForPrompt(egg);
    import_strict.default.ok(out.includes("**Scope:** High-signal financial data."));
    import_strict.default.ok(out.includes("1. Is this a structural shift?"));
    import_strict.default.ok(out.includes("- Reject price predictions."));
    import_strict.default.ok(out.includes("- Respect the existing knowledge tree."));
    import_strict.default.ok(out.includes("**Current Knowledge:**\n- Risk Management"));
  });
  (0, import_node_test.it)("marks empty knowledge as (empty)", () => {
    const egg = parser.parseEggFile("x.md", "## Knowledge\n");
    import_strict.default.ok(parser.formatEggForPrompt(egg).includes("(empty)"));
  });
});
(0, import_node_test.describe)("EggParser.insertKnowledge", () => {
  const baseEgg = [
    "## Knowledge",
    "",
    "### Risk Management",
    "  - tail hedging",
    "    - OTM puts",
    "### Psychology",
    "  - loss aversion"
  ].join("\n");
  async function insert(files, parent, content, source = "https://example.com") {
    const store = makeFakeVault(files);
    const fake = makeFakePlugin({ vault: store.vault });
    const parser = new EggParser(fake);
    await parser.insertKnowledge("egg.md", parent, content, source);
    return store;
  }
  (0, import_node_test.it)("nests new content under the parent anchor (indent = anchor + 2)", async () => {
    const store = await insert(
      { "egg.md": baseEgg },
      "tail hedging",
      "- crash-proofing study (2026)"
    );
    const out = store.files.get("egg.md");
    const anchorLine = out.split("\n").find((l) => l.includes("tail hedging"));
    const anchorIndent = anchorLine.match(/^\s*/)[0].length;
    const added = out.split("\n").find((l) => l.includes("crash-proofing study"));
    import_strict.default.equal(
      added.match(/^\s*/)[0].length,
      anchorIndent + 2,
      "new bullet must be nested one level under the anchor"
    );
    const addedIdx = out.split("\n").indexOf(added);
    const psychIdx = out.split("\n").findIndex((l) => l.includes("### Psychology"));
    import_strict.default.ok(addedIdx < psychIdx, "inserted inside the anchor block");
  });
  (0, import_node_test.it)("appends at the end of Knowledge when no anchor is given", async () => {
    const store = await insert({ "egg.md": baseEgg }, "", "- orphan bullet");
    const lines = store.files.get("egg.md").trimEnd().split("\n");
    import_strict.default.ok(lines.includes("- orphan bullet"));
    import_strict.default.equal(
      lines[lines.length - 1],
      "_source: [link](https://example.com)_"
    );
  });
  (0, import_node_test.it)("appends at the end when the anchor doesn't match anything", async () => {
    const store = await insert(
      { "egg.md": baseEgg },
      "no such concept",
      "- new stuff"
    );
    import_strict.default.ok(store.files.get("egg.md").includes("- new stuff"));
  });
  (0, import_node_test.it)("creates a Knowledge section when the egg has none", async () => {
    const store = await insert({ "egg.md": "---\ntopic: X\n---\n" }, "", "- first");
    const out = store.files.get("egg.md");
    import_strict.default.ok(out.includes("## Knowledge"));
    import_strict.default.ok(out.includes("- first"));
  });
  (0, import_node_test.it)("adds a source link under the inserted content", async () => {
    const store = await insert(
      { "egg.md": baseEgg },
      "",
      "- bullet",
      "https://src.example/x"
    );
    import_strict.default.ok(store.files.get("egg.md").includes("_source: [link](https://src.example/x)_"));
  });
  (0, import_node_test.it)("does nothing when the egg file is missing", async () => {
    const store = await insert({}, "", "- bullet");
    import_strict.default.equal(store.files.size, 0);
  });
});
