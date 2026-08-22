"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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

// src/egg-parser.ts
var egg_parser_exports = {};
__export(egg_parser_exports, {
  EggParser: () => EggParser,
  KNOWLEDGE_HEADING: () => KNOWLEDGE_HEADING,
  UNPROCESSED_HEADING: () => UNPROCESSED_HEADING
});
var KNOWLEDGE_HEADING, UNPROCESSED_HEADING, EggParser;
var init_egg_parser = __esm({
  "src/egg-parser.ts"() {
    "use strict";
    KNOWLEDGE_HEADING = "# Knowledge";
    UNPROCESSED_HEADING = "# Unprocessed";
    EggParser = class {
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
        if (egg.unprocessed.trim()) {
          parts.push(
            `**Unprocessed (pending merge):**
${egg.unprocessed}`
          );
        }
        return parts.join("\n\n");
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
  }
});

// tests/knowledge-base.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));

// src/knowledge-base.ts
var KnowledgeBase = class {
  plugin;
  constructor(plugin) {
    this.plugin = plugin;
  }
  /**
   * Save the captured content to the raw folder.
   * File naming: YYYY-MM-DD-HH-MM-Source-Author-title.md
   */
  async saveRaw(capture) {
    const folder = this.plugin.settings.rawFolder;
    await this.ensureFolder(folder);
    const safeTitle = this.sanitizeFileName(capture.title);
    const now = /* @__PURE__ */ new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const timestamp = [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      pad(now.getHours()),
      pad(now.getMinutes())
    ].join("-");
    const source = this.sanitizeFileName(capture.sourceType);
    const publishedAt = capture.metadata?.published || "unknown";
    const savedAt = (/* @__PURE__ */ new Date()).toISOString();
    const author = capture.metadata?.author || capture.metadata?.channel || capture.metadata?.handle || "unknown";
    const safeAuthor = this.sanitizeFileName(author);
    const fileName = `${folder}/${timestamp}-${source}-${safeAuthor}-${safeTitle}.md`;
    const sourceUrl = capture.url;
    const processingResult = capture.processingResult;
    const timeEstimate = capture.metadata?.time_estimate_minutes || String(Math.max(1, Math.ceil((capture.content?.split(/\s+/)?.length || 0) / 200)));
    const summary = capture.summary || "";
    const eggFiles = capture.matchedEggs || [];
    const frontmatterLines = [
      "---",
      `source_url: "${this.escapeYaml(capture.url)}"`,
      `source_type: ${capture.sourceType}`,
      `published_at: "${publishedAt === "unknown" ? "unknown" : this.escapeYaml(publishedAt)}"`,
      `saved_at: "${savedAt}"`,
      `author: "${author === "unknown" ? "unknown" : this.escapeYaml(author)}"`,
      `processing_result: ${processingResult}`,
      `time_estimate_minutes: ${timeEstimate}`
    ];
    if (summary) {
      const escapedSummary = summary.replace(/"/g, '\\"').replace(/\n/g, "\\n");
      frontmatterLines.push(`summary: "${escapedSummary}"`);
    }
    if (eggFiles.length > 0) {
      frontmatterLines.push(`egg_files:`);
      for (const egg of eggFiles) {
        frontmatterLines.push(`  - ${egg}`);
      }
    }
    frontmatterLines.push(`tags: []`);
    if (capture.metadata) {
      const passthroughKeys = ["published", "author", "channel", "handle", "time_estimate_minutes"];
      for (const [key, value] of Object.entries(capture.metadata)) {
        if (!passthroughKeys.includes(key) && value) {
          frontmatterLines.push(`${key}: "${this.escapeYaml(value)}"`);
        }
      }
    }
    frontmatterLines.push("---");
    frontmatterLines.push("");
    frontmatterLines.push(`# ${capture.title}`);
    frontmatterLines.push("");
    frontmatterLines.push(`**Source:** ${capture.url}`);
    frontmatterLines.push("");
    frontmatterLines.push(capture.content);
    const noteContent = frontmatterLines.join("\n");
    await this.plugin.app.vault.create(fileName, noteContent);
    console.log(`[NutEgg] Saved raw: ${fileName}`);
    return fileName;
  }
  /**
   * Append new knowledge entries to each egg's Unprocessed section (insight +
   * examples from the AI, plus mechanical author/source lines). Entries are
   * merged into the Knowledge tree later, once 20+ accumulate per egg.
   */
  async appendKnowledge(newKnowledge, sourceTitle, sourceUrl, author) {
    const { EggParser: EggParser2 } = await Promise.resolve().then(() => (init_egg_parser(), egg_parser_exports));
    const eggParser = new EggParser2(this.plugin);
    for (const item of newKnowledge) {
      await eggParser.appendUnprocessed(
        item.egg,
        item.content,
        author,
        sourceTitle,
        sourceUrl
      );
    }
  }
  escapeYaml(value) {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  async ensureFolder(folder) {
    const parts = folder.split("/");
    let currentPath = "";
    for (const part of parts) {
      currentPath += (currentPath ? "/" : "") + part;
      const exists = await this.plugin.app.vault.adapter.exists(currentPath);
      if (!exists) {
        await this.plugin.app.vault.createFolder(currentPath);
      }
    }
  }
  sanitizeFileName(name) {
    return name.replace(/[\\/:*?"<>|#^\[\]]/g, "").replace(/\s+/g, "-").substring(0, 80);
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

// tests/knowledge-base.test.ts
function makeKb() {
  const { vault, files } = makeFakeVault();
  const kb = new KnowledgeBase({
    settings: { rawFolder: "nutegg/_raw" },
    app: { vault }
  });
  return { kb, files };
}
(0, import_node_test.describe)("KnowledgeBase.saveRaw", () => {
  const base = {
    url: "https://example.com/post",
    title: "My Title!",
    content: "Hello world content here.",
    sourceType: "article",
    metadata: {
      published: "2026-08-10",
      author: "Jane Doe",
      time_estimate_minutes: "12",
      site: "Example"
    },
    matchedEggs: ["nutegg/investment.md", "nutegg/ai.md"],
    processingResult: "saved"
  };
  (0, import_node_test.it)("writes a file with the timestamp-source-author-title naming", async () => {
    const { kb, files } = makeKb();
    const fileName = await kb.saveRaw({ ...base });
    import_strict.default.match(
      fileName,
      /^nutegg\/_raw\/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-article-Jane-Doe-My-Title!.md$/
    );
    import_strict.default.ok(files.has(fileName));
  });
  (0, import_node_test.it)("uses `unknown` for missing published/author", async () => {
    const { kb } = makeKb();
    const fileName = await kb.saveRaw({
      ...base,
      metadata: {},
      matchedEggs: []
    });
    import_strict.default.ok(fileName.includes("-unknown-"));
  });
  (0, import_node_test.it)("includes all frontmatter properties", async () => {
    const { kb, files } = makeKb();
    const fileName = await kb.saveRaw({ ...base, summary: "Line one.\nLine two." });
    const content = files.get(fileName);
    import_strict.default.ok(content.includes('source_url: "https://example.com/post"'));
    import_strict.default.ok(content.includes("source_type: article"));
    import_strict.default.ok(content.includes('published_at: "2026-08-10"'));
    import_strict.default.ok(content.includes("saved_at:"));
    import_strict.default.ok(content.includes('author: "Jane Doe"'));
    import_strict.default.ok(content.includes("processing_result: saved"));
    import_strict.default.ok(content.includes("time_estimate_minutes: 12"));
    import_strict.default.ok(content.includes('summary: "Line one.\\nLine two."'));
    import_strict.default.ok(content.includes("egg_files:"));
    import_strict.default.ok(content.includes("  - nutegg/investment.md"));
    import_strict.default.ok(content.includes("tags: []"));
  });
  (0, import_node_test.it)("escapes quotes and backslashes in YAML strings", async () => {
    const { kb, files } = makeKb();
    const fileName = await kb.saveRaw({
      ...base,
      url: 'https://x.com/?q="a\\b"',
      metadata: {}
    });
    const content = files.get(fileName);
    import_strict.default.ok(content.includes('source_url: "https://x.com/?q=\\"a\\\\b\\""'));
  });
  (0, import_node_test.it)("passthrough metadata not covered by known keys", async () => {
    const { kb, files } = makeKb();
    const fileName = await kb.saveRaw({ ...base });
    const content = files.get(fileName);
    import_strict.default.ok(content.includes('site: "Example"'));
    import_strict.default.ok(!content.includes("published:"), "published handled as published_at");
  });
  (0, import_node_test.it)("falls back to word-count time estimate when metadata is missing", async () => {
    const { kb, files } = makeKb();
    const fileName = await kb.saveRaw({
      ...base,
      content: Array(600).fill("word").join(" "),
      // 600 words → 3 min
      metadata: {}
    });
    import_strict.default.ok(files.get(fileName).includes("time_estimate_minutes: 3"));
  });
  (0, import_node_test.it)("creates the raw folder when it doesn't exist", async () => {
    const { kb, files } = makeKb();
    await kb.saveRaw({ ...base });
    const fileName = [...files.keys()].find((k) => k.endsWith(".md"));
    import_strict.default.ok(fileName.startsWith("nutegg/_raw/"));
  });
  (0, import_node_test.it)("sanitizes dangerous filename characters", async () => {
    const { kb } = makeKb();
    const fileName = await kb.saveRaw({
      ...base,
      title: 'Bad:File<Name>*"#?',
      metadata: {}
    });
    import_strict.default.ok(!/[\\/:*?"<>|#^\[\]]/.test(fileName.split("/").pop()));
    import_strict.default.ok(fileName.includes("BadFileName"));
  });
});
(0, import_node_test.describe)("KnowledgeBase.appendKnowledge", () => {
  (0, import_node_test.it)("appends each entry to the egg's Unprocessed section with author and source", async () => {
    const { vault, files } = makeFakeVault({
      "a.md": "# Knowledge\n\n- existing a\n",
      "b.md": "# Knowledge\n\n- existing b\n"
    });
    const kb = new KnowledgeBase({
      settings: { rawFolder: "nutegg/_raw" },
      app: { vault }
    });
    await kb.appendKnowledge(
      [
        { egg: "a.md", parent: "existing a", content: "- one" },
        { egg: "b.md", content: "- two" }
      ],
      "Article Title",
      "https://example.com/src",
      "Jane Doe"
    );
    const a = files.get("a.md");
    const b = files.get("b.md");
    import_strict.default.ok(a.includes("# Unprocessed"));
    import_strict.default.ok(a.includes("- one"));
    import_strict.default.ok(a.includes("_author: Jane Doe_"));
    import_strict.default.ok(a.includes("_source: [Article Title](https://example.com/src)_"));
    import_strict.default.ok(b.includes("- two"));
    import_strict.default.ok(!a.split("# Unprocessed")[0].includes("- one"));
  });
  (0, import_node_test.it)("omits the author line when unknown", async () => {
    const { vault, files } = makeFakeVault({ "a.md": "# Knowledge\n" });
    const kb = new KnowledgeBase({
      settings: { rawFolder: "nutegg/_raw" },
      app: { vault }
    });
    await kb.appendKnowledge(
      [{ egg: "a.md", content: "- one" }],
      "Title",
      "https://example.com/src",
      ""
    );
    const a = files.get("a.md");
    import_strict.default.ok(!a.includes("_author:"));
    import_strict.default.ok(a.includes("_source: [Title](https://example.com/src)_"));
  });
});
