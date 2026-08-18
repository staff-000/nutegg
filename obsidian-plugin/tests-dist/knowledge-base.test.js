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
  EggParser: () => EggParser
});
var EggParser;
var init_egg_parser = __esm({
  "src/egg-parser.ts"() {
    "use strict";
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
   * Insert new knowledge into egg files, nested under the anchor each
   * delta picked from the existing knowledge tree.
   */
  async appendKnowledge(newKnowledge, sourceUrl) {
    const { EggParser: EggParser2 } = await Promise.resolve().then(() => (init_egg_parser(), egg_parser_exports));
    const eggParser = new EggParser2(this.plugin);
    for (const item of newKnowledge) {
      await eggParser.insertKnowledge(
        item.egg,
        item.parent || "",
        item.content,
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
  (0, import_node_test.it)("inserts each knowledge item into its egg file with a source link", async () => {
    const { vault, files } = makeFakeVault({
      "a.md": "## Knowledge\n\n- existing a\n",
      "b.md": "## Knowledge\n\n- existing b\n"
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
      "https://example.com/src"
    );
    const a = files.get("a.md");
    const b = files.get("b.md");
    import_strict.default.ok(a.includes("- one"));
    import_strict.default.ok(a.includes("_source: [link](https://example.com/src)_"));
    import_strict.default.ok(b.includes("- two"));
    const anchor = a.split("\n").find((l) => l.includes("existing a"));
    const added = a.split("\n").find((l) => l.includes("- one"));
    import_strict.default.ok(
      added.match(/^\s*/)[0].length > anchor.match(/^\s*/)[0].length
    );
  });
});
