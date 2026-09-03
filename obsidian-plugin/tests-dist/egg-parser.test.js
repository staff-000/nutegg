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
var KNOWLEDGE_HEADING = "# Knowledge";
var UNPROCESSED_HEADING = "# Unprocessed";
var EggParser = class {
  plugin;
  constructor(plugin) {
    this.plugin = plugin;
  }
  async readEgg(fileName) {
    let file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file && !fileName.includes("/")) {
      const parentDir = this.plugin.settings.indexFile.replace(/\/[^/]+$/, "");
      file = this.plugin.app.vault.getAbstractFileByPath(`${parentDir}/${fileName}`);
    }
    if (!file) {
      const allFiles = this.plugin.app.vault.getMarkdownFiles?.() || [];
      const base = fileName.split("/").pop().toLowerCase();
      const match = allFiles.find(
        (f) => f.path.split("/").pop().toLowerCase() === base
      );
      if (match)
        file = match;
    }
    if (!file) {
      console.warn(`[NutEgg] Egg file not found: ${fileName}`);
      return null;
    }
    const content = await this.plugin.app.vault.read(file);
    return this.parseEggFile(file.path || fileName, content);
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

# Knowledge

- Risk Management
  - tail hedging

# Unprocessed

- pending insight
  - \u{1F3AF} Example: a concrete case
_author: Jane Doe_
_source: [Source Title](https://e.com/p)_
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
  (0, import_node_test.it)("extracts the Knowledge section content (stops at # Unprocessed)", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    import_strict.default.equal(egg.knowledge, "- Risk Management\n  - tail hedging");
  });
  (0, import_node_test.it)("extracts the Unprocessed section content", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    import_strict.default.ok(egg.unprocessed.includes("- pending insight"));
    import_strict.default.ok(egg.unprocessed.includes("_author: Jane Doe_"));
    import_strict.default.ok(egg.unprocessed.includes("_source: [Source Title](https://e.com/p)_"));
    import_strict.default.ok(!egg.unprocessed.includes("tail hedging"));
  });
  (0, import_node_test.it)("defaults topic to Unknown when frontmatter is missing", () => {
    const egg = parser.parseEggFile("x.md", "# Knowledge\n\n- stuff\n");
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
  (0, import_node_test.it)("includes the Unprocessed section so the AI can avoid duplicates", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    const out = parser.formatEggForPrompt(egg);
    import_strict.default.ok(out.includes("**Unprocessed (pending merge):**"));
    import_strict.default.ok(out.includes("- pending insight"));
  });
  (0, import_node_test.it)("marks empty knowledge as (empty)", () => {
    const egg = parser.parseEggFile("x.md", "# Knowledge\n");
    import_strict.default.ok(parser.formatEggForPrompt(egg).includes("(empty)"));
  });
});
(0, import_node_test.describe)("EggParser.appendUnprocessed", () => {
  const baseEgg = [
    "---",
    "topic: X",
    "---",
    "",
    "> [!abstract]- Instructions:",
    "> **Scope:** s",
    "",
    "# Knowledge",
    "",
    "- existing knowledge",
    "",
    "# Unprocessed"
  ].join("\n");
  async function append(files, content, author = "Jane Doe", title = "Post", url = "https://example.com/post") {
    const store = makeFakeVault(files);
    const fake = makeFakePlugin({ vault: store.vault });
    const parser = new EggParser(fake);
    await parser.appendUnprocessed("egg.md", content, author, title, url);
    return store;
  }
  (0, import_node_test.it)("appends the entry with author and source to # Unprocessed", async () => {
    const store = await append(
      { "egg.md": baseEgg },
      "- insight\n  - \u{1F3AF} Example: case"
    );
    const out = store.files.get("egg.md");
    import_strict.default.ok(out.includes("# Unprocessed\n\n- insight"));
    import_strict.default.ok(out.includes("  - \u{1F3AF} Example: case"));
    import_strict.default.ok(out.includes("_author: Jane Doe_"));
    import_strict.default.ok(out.includes("_source: [Post](https://example.com/post)_"));
  });
  (0, import_node_test.it)("does not touch the Knowledge tree", async () => {
    const store = await append({ "egg.md": baseEgg }, "- insight");
    const out = store.files.get("egg.md");
    const knowledge = out.split("# Unprocessed")[0];
    import_strict.default.ok(knowledge.includes("- existing knowledge"));
    import_strict.default.ok(!knowledge.includes("- insight"));
  });
  (0, import_node_test.it)("prefixes a bullet when the content has none", async () => {
    const store = await append({ "egg.md": baseEgg }, "bare insight text");
    import_strict.default.ok(store.files.get("egg.md").includes("- bare insight text"));
  });
  (0, import_node_test.it)("omits the _author line when the author is unknown", async () => {
    const store = await append({ "egg.md": baseEgg }, "- insight", "");
    const out = store.files.get("egg.md");
    import_strict.default.ok(!out.includes("_author:"));
    import_strict.default.ok(out.includes("_source: [Post](https://example.com/post)_"));
  });
  (0, import_node_test.it)("separates consecutive entries with a blank line", async () => {
    const store = makeFakeVault({ "egg.md": baseEgg });
    const fake = makeFakePlugin({ vault: store.vault });
    const parser = new EggParser(fake);
    await parser.appendUnprocessed(
      "egg.md",
      "- first",
      "Jane Doe",
      "Post",
      "https://example.com/post"
    );
    await parser.appendUnprocessed(
      "egg.md",
      "- second",
      "Jane Doe",
      "Post",
      "https://example.com/post"
    );
    const out = store.files.get("egg.md");
    import_strict.default.ok(
      /_source: \[Post\]\(https:\/\/example\.com\/post\)_\n\n- second/.test(out)
    );
  });
  (0, import_node_test.it)("creates the Unprocessed section when the egg has none", async () => {
    const store = await append(
      { "egg.md": "# Knowledge\n\n- tree\n" },
      "- first"
    );
    const out = store.files.get("egg.md");
    import_strict.default.ok(out.includes("# Unprocessed"));
    import_strict.default.ok(out.includes("- first"));
    import_strict.default.ok(out.includes("# Knowledge\n\n- tree\n\n# Unprocessed"));
  });
  (0, import_node_test.it)("sanitizes link brackets out of the source title", async () => {
    const store = await append(
      { "egg.md": baseEgg },
      "- insight",
      "Jane",
      "A [bracket] title"
    );
    import_strict.default.ok(
      store.files.get("egg.md").includes("_source: [A bracket title](https://example.com/post)_")
    );
  });
  (0, import_node_test.it)("does nothing when the egg file is missing", async () => {
    const store = await append({}, "- bullet");
    import_strict.default.equal(store.files.size, 0);
  });
});
(0, import_node_test.describe)("EggParser.countUnprocessed", () => {
  const parser = new EggParser(makeFakePlugin());
  (0, import_node_test.it)("counts top-level entry bullets, ignoring indented example sub-bullets", () => {
    const egg = parser.parseEggFile(
      "x.md",
      [
        "# Unprocessed",
        "",
        "- entry one",
        "  - \u{1F3AF} Example: a",
        "- entry two",
        "- entry three"
      ].join("\n")
    );
    import_strict.default.equal(parser.countUnprocessed(egg), 3);
  });
  (0, import_node_test.it)("returns 0 for a missing or empty section", () => {
    import_strict.default.equal(parser.countUnprocessed(parser.parseEggFile("x.md", "")), 0);
    import_strict.default.equal(
      parser.countUnprocessed(parser.parseEggFile("x.md", "# Unprocessed\n")),
      0
    );
  });
  (0, import_node_test.it)("counts entries at the user's base indent (re-indented section)", () => {
    const egg = parser.parseEggFile(
      "x.md",
      [
        "# Unprocessed",
        "",
        "  - entry one",
        "    - sub bullet",
        "  - entry two"
      ].join("\n")
    );
    import_strict.default.equal(parser.countUnprocessed(egg), 2);
  });
});
(0, import_node_test.describe)("EggParser.applyMerge", () => {
  const fullEgg = [
    "---",
    "topic: X",
    "---",
    "",
    "> [!abstract]- Instructions:",
    "> **Scope:** s",
    "",
    "# Knowledge",
    "",
    "### Old Branch",
    "  - old stuff",
    "",
    "# Unprocessed",
    "",
    "- stale entry"
  ].join("\n");
  async function merge(files, knowledge, unprocessed) {
    const store = makeFakeVault(files);
    const fake = makeFakePlugin({ vault: store.vault });
    const parser = new EggParser(fake);
    await parser.applyMerge("egg.md", knowledge, unprocessed);
    return store;
  }
  (0, import_node_test.it)("replaces both sections while preserving frontmatter and instructions", async () => {
    const store = await merge(
      { "egg.md": fullEgg },
      "### Old Branch\n  - old stuff\n  - merged entry",
      "- leftover entry"
    );
    const out = store.files.get("egg.md");
    import_strict.default.ok(out.includes("topic: X"));
    import_strict.default.ok(out.includes("> **Scope:** s"));
    import_strict.default.ok(out.includes("### Old Branch\n  - old stuff\n  - merged entry"));
    import_strict.default.ok(out.includes("# Unprocessed\n\n- leftover entry"));
    import_strict.default.ok(!out.includes("stale entry"));
    import_strict.default.equal(out.split("# Knowledge").length - 1, 1);
    import_strict.default.equal(out.split("# Unprocessed").length - 1, 1);
  });
  (0, import_node_test.it)("empties the Unprocessed section when nothing is left over", async () => {
    const store = await merge({ "egg.md": fullEgg }, "- all merged", "");
    const out = store.files.get("egg.md");
    import_strict.default.ok(out.includes("# Unprocessed"));
    import_strict.default.ok(!out.includes("- stale entry"));
  });
  (0, import_node_test.it)("creates missing sections", async () => {
    const store = await merge(
      { "egg.md": "---\ntopic: X\n---\n" },
      "- new tree",
      "- leftover"
    );
    const out = store.files.get("egg.md");
    import_strict.default.ok(out.includes("# Knowledge\n\n- new tree"));
    import_strict.default.ok(out.includes("# Unprocessed\n\n- leftover"));
  });
  (0, import_node_test.it)("does nothing when the egg file is missing", async () => {
    const store = await merge({}, "- tree", "");
    import_strict.default.equal(store.files.size, 0);
  });
  (0, import_node_test.it)("strips a leading '# Knowledge' heading from the AI output", async () => {
    const store = await merge(
      { "egg.md": fullEgg },
      "# Knowledge\n\n- merged entry",
      ""
    );
    const out = store.files.get("egg.md");
    import_strict.default.equal(out.split("\n").filter((l) => l === "# Knowledge").length, 1);
    import_strict.default.ok(out.includes("# Knowledge\n\n- merged entry"));
  });
  (0, import_node_test.it)("strips a leading '# Unprocessed' heading from the AI leftovers", async () => {
    const store = await merge(
      { "egg.md": fullEgg },
      "- merged entry",
      "# Unprocessed\n\n- leftover entry"
    );
    const out = store.files.get("egg.md");
    import_strict.default.equal(out.split("\n").filter((l) => l === "# Unprocessed").length, 1);
    import_strict.default.ok(out.includes("- leftover entry"));
  });
  (0, import_node_test.it)("cuts an embedded Unprocessed section out of the knowledge field", async () => {
    const store = await merge(
      { "egg.md": fullEgg },
      "- merged entry\n\n# Unprocessed\n- leftover entry",
      ""
    );
    const out = store.files.get("egg.md");
    import_strict.default.equal(out.split("\n").filter((l) => l === "# Unprocessed").length, 1);
    import_strict.default.ok(out.includes("- merged entry"));
    import_strict.default.ok(out.includes("- leftover entry"));
    import_strict.default.ok(!out.split("# Unprocessed")[0].includes("- leftover entry"));
  });
  (0, import_node_test.it)("self-heals a file already broken by a duplicate '# Knowledge' heading", async () => {
    const broken = fullEgg.replace(
      "# Knowledge\n",
      "# Knowledge\n\n# Knowledge\n"
    );
    const store = await merge({ "egg.md": broken }, "- fresh tree", "");
    const out = store.files.get("egg.md");
    import_strict.default.equal(out.split("\n").filter((l) => l === "# Knowledge").length, 1);
    import_strict.default.ok(!out.includes("### Old Branch"));
    import_strict.default.ok(out.includes("- fresh tree"));
  });
  (0, import_node_test.it)("inserts a missing Knowledge section before Unprocessed", async () => {
    const store = await merge(
      { "egg.md": "# Unprocessed\n\n- stale entry" },
      "- new tree",
      ""
    );
    const out = store.files.get("egg.md");
    import_strict.default.ok(out.indexOf("# Knowledge") < out.indexOf("# Unprocessed"));
    import_strict.default.ok(out.includes("- new tree"));
  });
});
(0, import_node_test.describe)("EggParser.parseEggFile knowledge-tree structure (regression)", () => {
  const parser = new EggParser(makeFakePlugin());
  (0, import_node_test.it)("includes same-level ## branches as part of the Knowledge tree", () => {
    const egg = parser.parseEggFile(
      "x.md",
      [
        "# Knowledge",
        "",
        "## Learning",
        "- real tree",
        "",
        "# Unprocessed",
        "",
        "- pending"
      ].join("\n")
    );
    import_strict.default.ok(egg.knowledge.includes("## Learning"));
    import_strict.default.ok(egg.knowledge.includes("- real tree"));
    import_strict.default.ok(!egg.knowledge.includes("- pending"));
    import_strict.default.ok(egg.unprocessed.includes("- pending"));
  });
  (0, import_node_test.it)("ignores a stray '# Knowledge' duplicate when reading a broken file", () => {
    const egg = parser.parseEggFile(
      "x.md",
      [
        "# Knowledge",
        "",
        "# Knowledge",
        "",
        "## Learning",
        "- real tree",
        "",
        "# Unprocessed",
        "",
        "- pending"
      ].join("\n")
    );
    import_strict.default.ok(egg.knowledge.includes("- real tree"));
    import_strict.default.ok(!egg.knowledge.split("\n").includes("# Knowledge"));
    import_strict.default.ok(egg.unprocessed.includes("- pending"));
  });
});
