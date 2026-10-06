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

// tests/merge-widget.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));

// tests/obsidian-stub.ts
var TAbstractFile = class {
  path = "";
  name = "";
};
var TFile = class extends TAbstractFile {
  basename = "";
  extension = "";
};

// src/merge-widget.ts
var import_view = require("@codemirror/view");

// ../shared/src/egg-format.ts
function formatEggInstructionsForPrompt(egg) {
  const parts = [`**Scope:** ${egg.scope || "(not specified)"}`];
  parts.push(`**Generate Knowledge Entries:** ${egg.generateKnowledgeEntries === false ? "no" : "yes"}`);
  if (egg.actionGuide)
    parts.push(`**Action Guide:**
${egg.actionGuide}`);
  for (const [label, items] of [["Key Questions", egg.keyQuestions], ["Worth Reading If", egg.worthReadingIf], ["Skip If", egg.skipIf]]) {
    if (items?.length)
      parts.push(`**${label}:**
${items.map((item) => `- ${item}`).join("\n")}`);
  }
  if (egg.formattingRules)
    parts.push(`**Formatting Rules:**
${egg.formattingRules}`);
  return parts.join("\n\n");
}
function formatEggKnowledgeForPrompt(egg) {
  return `**Current Knowledge:**
${egg.knowledge || "(empty)"}

**Unprocessed:**
${egg.unprocessed || "(empty)"}`;
}
function formatEggForPrompt(egg) {
  return formatEggInstructionsForPrompt(egg);
}
function countUnprocessed(egg) {
  const indentOf = (l) => (l.match(/^\s*/) || [""])[0].length;
  const bullets = (egg.unprocessed || "").split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => /^\s*[-*]\s/.test(l));
  if (bullets.length === 0)
    return 0;
  const base = Math.min(...bullets.map(indentOf));
  return bullets.filter((l) => indentOf(l) === base).length;
}

// ../shared/src/egg-parser.ts
var KNOWLEDGE_HEADING = "# Knowledge";
var UNPROCESSED_HEADING = "# Unprocessed";
function isEggPath(path, vaultFolder = "nutegg") {
  if (!path || typeof path !== "string")
    return false;
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const folder = (vaultFolder || "").replace(/^\/+|\/+$/g, "");
  if (folder) {
    if (!normalized.startsWith(folder + "/"))
      return false;
    const rel = normalized.slice(folder.length + 1);
    if (rel.includes("/"))
      return false;
    if (rel.startsWith("_") || !rel.toLowerCase().endsWith(".md"))
      return false;
    return true;
  } else {
    if (normalized.includes("/"))
      return false;
    if (normalized.startsWith("_") || !normalized.toLowerCase().endsWith(".md"))
      return false;
    return true;
  }
}
function parseEggFile(fileName, content) {
  const result = {
    fileName,
    topic: "Unknown",
    language: "",
    scope: "",
    actionGuide: "",
    keyQuestions: [],
    worthReadingIf: [],
    skipIf: [],
    sourceText: content,
    formattingRules: "",
    knowledge: "",
    unprocessed: "",
    indexDescription: ""
  };
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (!kv)
        continue;
      const key = kv[1].toLowerCase();
      const value = kv[2].trim().replace(/^"(.*)"$/, "$1");
      if (key === "topic")
        result.topic = value;
      if (key === "language")
        result.language = value;
    }
  }
  const callout = extractCallout(content);
  const sections = callout ? splitLabeledSections(callout) : /* @__PURE__ */ new Map();
  const generation = (sections.get("generate knowledge entries") || "").trim().toLowerCase();
  result.generateKnowledgeEntries = !/^(?:no|false|off|disabled)\b/.test(generation);
  result.scope = (sections.get("scope") || "").trim();
  result.actionGuide = (sections.get("action guide") || "").trim();
  result.keyQuestions = parseListItems(sections.get("key questions") || "");
  result.worthReadingIf = parseListItems(sections.get("worth reading if") || "");
  result.skipIf = parseListItems(sections.get("skip if") || "");
  result.formattingRules = (sections.get("formatting rules") || "").trim();
  const lines = content.split(/\r?\n/);
  const knowledgeSection = findSection(lines, "knowledge");
  if (knowledgeSection) {
    result.knowledge = sectionBody(lines, knowledgeSection, "knowledge");
  }
  const unprocessedSection = findSection(lines, "unprocessed");
  if (unprocessedSection) {
    result.unprocessed = sectionBody(lines, unprocessedSection, "unprocessed");
  }
  return result;
}
function findSection(lines, name) {
  const wanted = name.toLowerCase();
  const start = lines.findIndex((l) => headingName(l) === wanted);
  if (start === -1)
    return null;
  let end = -1;
  if (wanted === "knowledge") {
    end = lines.findIndex(
      (l, i) => i > start && headingName(l) === "unprocessed"
    );
  }
  if (end === -1) {
    end = lines.findIndex((l, i) => {
      if (i <= start)
        return false;
      const head = headingName(l);
      return head !== null && head !== wanted;
    });
  }
  return { start, end: end === -1 ? lines.length : end };
}
function headingName(line) {
  const m = line.trim().match(/^#\s+(.+?)\s*#*\s*$/);
  if (!m)
    return null;
  return m[1].trim().toLowerCase();
}
function sectionBody(lines, section, name) {
  const body = lines.slice(section.start + 1, section.end);
  while (body.length > 0 && (body[0].trim() === "" || headingName(body[0]) === name.toLowerCase())) {
    body.shift();
  }
  return body.join("\n").replace(/\n+$/g, "");
}
function stripSectionHeading(body, name) {
  const lines = body.split("\n");
  const wanted = name.toLowerCase();
  while (lines.length > 0 && (lines[0].trim() === "" || headingName(lines[0]) === wanted)) {
    lines.shift();
  }
  return lines.join("\n").replace(/\s+$/g, "");
}
function extractCallout(content) {
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
function splitLabeledSections(text) {
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
function parseListItems(text) {
  return text.split("\n").map((l) => l.trim()).filter((l) => /^(?:\d+[.)]|[-*])\s+/.test(l)).map((l) => l.replace(/^(?:\d+[.)]|[-*])\s+/, ""));
}

// src/egg-parser.ts
function resolveEggPath(fileName, vaultFolder = "nutegg") {
  if (typeof fileName !== "string" || !fileName || fileName.includes("\\"))
    return null;
  const folder = (vaultFolder || "nutegg").replace(/\/+$/, "");
  const path = fileName.includes("/") ? fileName : `${folder}/${fileName}`;
  if (path.split("/").some((part) => !part || part === "." || part === ".."))
    return null;
  return isEggPath(path, folder) ? path : null;
}
var EggParser = class {
  plugin;
  constructor(plugin) {
    this.plugin = plugin;
  }
  async findFile(fileName) {
    const folder = this.plugin.vaultFolder || "nutegg";
    const path = resolveEggPath(fileName, folder);
    if (!path)
      return null;
    const vault = this.plugin.app.vault;
    const exists = await vault.adapter.exists(path);
    const files = vault.getMarkdownFiles().filter((file2) => resolveEggPath(file2.path, folder) === file2.path);
    const exact = exists && files.find((file2) => file2.path === path);
    if (exact)
      return { file: exact, path: exact.path };
    const matches = files.filter((file2) => file2.path.toLowerCase() === path.toLowerCase());
    if (matches.length !== 1)
      return null;
    const file = matches[0];
    const matchedPath = file.path;
    if (!await vault.adapter.exists(matchedPath))
      return null;
    this.assertEggFile(file, matchedPath);
    return { file, path: matchedPath };
  }
  assertEggFile(file, path) {
    if (file.path !== path || resolveEggPath(file.path, this.plugin.vaultFolder || "nutegg") !== path) {
      throw new Error(`Egg file moved or is outside the egg folder: ${path}`);
    }
  }
  async processFile(target, transform) {
    const { file, path } = target;
    this.assertEggFile(file, path);
    const guardedTransform = (content) => {
      this.assertEggFile(file, path);
      return transform(content);
    };
    const vault = this.plugin.app.vault;
    if (vault.process)
      await vault.process(file, guardedTransform);
    else
      await vault.modify(file, guardedTransform(await vault.read(file)));
  }
  /** All egg mutations, including language metadata and editor saves, use this boundary. */
  async processEgg(fileName, transform) {
    const file = await this.findFile(fileName);
    if (!file)
      throw new Error(`Cannot update \u2014 egg file not found or outside the egg folder: ${fileName}`);
    await this.processFile(file, transform);
  }
  async readEgg(fileName, fallbackDescription) {
    const target = await this.findFile(fileName);
    if (!target) {
      console.warn(`[NutEgg] Egg file not found: ${fileName}`);
      return null;
    }
    const { file, path } = target;
    this.assertEggFile(file, path);
    const content = await this.plugin.app.vault.read(file);
    this.assertEggFile(file, path);
    const parsed = this.parseEggFile(path, content);
    if (fallbackDescription && !parsed.indexDescription) {
      parsed.indexDescription = fallbackDescription;
    }
    return parsed;
  }
  async readEggs(entries) {
    const eggs = [];
    for (const entry of entries) {
      const egg = await this.readEgg(entry.fileName, entry.description);
      if (egg) {
        egg.indexDescription = entry.description;
        eggs.push(egg);
      }
    }
    return eggs;
  }
  parseEggFile(fileName, content) {
    return parseEggFile(fileName, content);
  }
  formatEggInstructionsForPrompt(egg) {
    return formatEggInstructionsForPrompt(egg);
  }
  formatEggKnowledgeForPrompt(egg) {
    return formatEggKnowledgeForPrompt(egg);
  }
  formatEggForPrompt = (egg) => {
    return formatEggForPrompt(egg);
  };
  countUnprocessed(egg) {
    return countUnprocessed(egg);
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
    const transform = (existing) => {
      const lines = existing.replace(/\n+$/, "").split("\n");
      const section = findSection(lines, "unprocessed");
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
      if (existing.includes(block))
        return existing;
      return lines.join("\n") + "\n";
    };
    await this.processEgg(fileName, transform);
    console.log(`[NutEgg] Added unprocessed entry to ${fileName}`);
  }
  /**
   * Replace the Knowledge and Unprocessed sections with the merged output
   * from the merge AI call. Missing sections are created as needed.
   */
  async applyMerge(fileName, knowledge, unprocessed, expected) {
    const file = await this.findFile(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot merge \u2014 egg file not found: ${fileName}`);
      return false;
    }
    knowledge = stripSectionHeading(knowledge, "knowledge");
    unprocessed = stripSectionHeading(unprocessed, "unprocessed");
    const kLines = knowledge.split("\n");
    const uIdx = kLines.findIndex((l) => headingName(l) === "unprocessed");
    if (uIdx !== -1) {
      const rest = stripSectionHeading(
        kLines.slice(uIdx).join("\n"),
        "unprocessed"
      );
      knowledge = kLines.slice(0, uIdx).join("\n").replace(/\s+$/g, "");
      if (!unprocessed)
        unprocessed = rest;
    }
    let applied = true;
    const transform = (existing) => {
      if (expected && (expected.sourceText ? existing !== expected.sourceText : parseEggFile(fileName, existing).knowledge !== expected.knowledge || parseEggFile(fileName, existing).unprocessed !== expected.unprocessed)) {
        applied = false;
        return existing;
      }
      let lines = existing.replace(/\n+$/, "").split("\n");
      const knowledgeSection = findSection(lines, "knowledge");
      if (knowledgeSection) {
        lines = [
          ...lines.slice(0, knowledgeSection.start + 1),
          "",
          ...knowledge.trim().split("\n"),
          ...lines.slice(knowledgeSection.end)
        ];
      } else {
        const unprocessedSection2 = findSection(lines, "unprocessed");
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
      const unprocessedSection = findSection(lines, "unprocessed");
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
      return lines.join("\n") + "\n";
    };
    await this.processFile(file, transform);
    return applied;
  }
};

// src/merge-widget.ts
function isScopedEgg(plugin, path) {
  return !!path && resolveEggPath(path, plugin.vaultFolder || "nutegg") === path;
}
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
  if (!isScopedEgg(plugin, filePath))
    return null;
  if (currentDoc !== null) {
    const egg = await plugin.eggParser.readEgg(filePath);
    if (egg) {
      if (egg.sourceText !== currentDoc) {
        await plugin.eggParser.processEgg(filePath, (disk) => {
          if (disk !== egg.sourceText)
            throw new Error(`Egg changed before editor save: ${filePath}`);
          return currentDoc;
        });
        console.log(`[NutEgg] Saved unsaved edits in ${filePath} before merge`);
      }
    }
  }
  return plugin.aiProcessor.mergeEgg(filePath);
}

// tests/helpers.ts
function makeFakeVault(initial = {}) {
  const files = new Map(Object.entries(initial));
  const basePath = "/fake/vault";
  const listeners = /* @__PURE__ */ new Map();
  const toTFile = (p) => Object.assign(new TFile(), {
    path: p,
    name: p.split("/").pop() || "",
    basename: (p.split("/").pop() || "").replace(/\.[^/.]+$/, ""),
    extension: p.split(".").pop() || ""
  });
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
    listeners,
    on: (event, callback) => {
      if (!listeners.has(event))
        listeners.set(event, []);
      listeners.get(event).push(callback);
    },
    trigger: (event, file) => {
      for (const cb of listeners.get(event) || []) {
        cb(file);
      }
    },
    create: async (p, content) => {
      files.set(p, content);
      vault.trigger("create", toTFile(p));
    },
    createFolder: async (_p) => {
    },
    modify: async (file, content) => {
      files.set(file.path, content);
      vault.trigger("modify", toTFile(file.path));
    },
    read: async (file) => {
      if (!files.has(file.path))
        throw new Error("File not found: " + file.path);
      return files.get(file.path);
    },
    delete: async (file) => {
      files.delete(file.path);
      vault.trigger("delete", toTFile(file.path));
    },
    getAbstractFileByPath: (p) => files.has(p) ? toTFile(p) : null,
    getFiles: () => [...files.keys()].map((p) => toTFile(p)),
    getMarkdownFiles: () => [...files.keys()].filter((k) => k.endsWith(".md")).map((p) => toTFile(p))
  };
  return { files, basePath, vault };
}
function makeFakePlugin(overrides = {}) {
  const { vault } = makeFakeVault(overrides.vaultFiles || {});
  return {
    manifest: overrides.manifest ?? { version: "0.1.0" },
    settings: {
      aiApiKey: "test-key",
      rawFolder: "nutegg/_raw",
      indexFile: "nutegg/_index.md",
      serverPort: 27123,
      chunkWindowChars: 3e4,
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
    indexReader: overrides.indexReader ?? {
      getIndexContent: async () => "",
      parseIndexContent: () => []
    },
    knowledgeBase: overrides.knowledgeBase ?? {},
    workflowManager: overrides.workflowManager ?? {
      getPrompt: () => ""
    },
    db: overrides.db ?? null,
    ...overrides
  };
}

// tests/merge-widget.test.ts
(0, import_node_test.describe)("merge-widget.findInstructionTargetLine", () => {
  (0, import_node_test.it)("finds the end line of a callout block with instructions", () => {
    const doc = [
      "---",
      "topic: x",
      "---",
      "",
      "> [!abstract]- Instructions:",
      "> **Scope:** ...",
      "> **Action Guide:** ...",
      "",
      "# Knowledge",
      "",
      "# Unprocessed"
    ].join("\n");
    import_strict.default.equal(findInstructionTargetLine(doc), 7);
  });
  (0, import_node_test.it)("finds the # Instructions heading line", () => {
    const doc = ["---", "topic: x", "---", "", "# Instructions", "", "# Knowledge"].join("\n");
    import_strict.default.equal(findInstructionTargetLine(doc), 5);
  });
  (0, import_node_test.it)("falls back to # Unprocessed when no instructions block is found", () => {
    import_strict.default.equal(findInstructionTargetLine("---\ntopic: x\n---\n\n# Knowledge\n\n# Unprocessed\n\n- entry\n"), 7);
  });
  (0, import_node_test.it)("tolerates extra spacing and case", () => {
    import_strict.default.equal(findInstructionTargetLine("#  INSTRUCTIONS  "), 1);
    import_strict.default.equal(findInstructionTargetLine("a\n\n# unprocessed\n"), 3);
  });
  (0, import_node_test.it)("returns null for completely empty or unrelated files", () => {
    import_strict.default.equal(findInstructionTargetLine(""), null);
    import_strict.default.equal(findInstructionTargetLine("Just plain text without headers"), null);
  });
});
(0, import_node_test.describe)("merge-widget.runMerge", () => {
  function makeRunner(overrides = {}) {
    const { files, vault } = makeFakeVault(overrides.files || { "nutegg/egg.md": "disk content" });
    let modifies = [];
    const spiedVault = {
      ...vault,
      modify: async (file, content) => {
        modifies.push(file.path);
        await vault.modify(file, content);
      }
    };
    let mergedPath = null;
    const plugin = makeFakePlugin({
      vault: spiedVault,
      aiProcessor: {
        mergeEgg: async (p) => {
          mergedPath = p;
          return { egg: p, entries: 3 };
        }
      }
    });
    plugin.eggParser = new EggParser(plugin);
    return { plugin, files, modifies: () => modifies, mergedPath: () => mergedPath };
  }
  (0, import_node_test.it)("persists unsaved editor changes before merging", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner();
    const result = await runMerge(plugin, "nutegg/egg.md", "edited buffer");
    import_strict.default.deepEqual(modifies(), ["nutegg/egg.md"]);
    import_strict.default.equal(files.get("nutegg/egg.md"), "edited buffer");
    import_strict.default.equal(mergedPath(), "nutegg/egg.md");
    import_strict.default.deepEqual(result, { egg: "nutegg/egg.md", entries: 3 });
  });
  (0, import_node_test.it)("skips the save when the buffer matches the disk content", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner();
    const result = await runMerge(plugin, "nutegg/egg.md", "disk content");
    import_strict.default.deepEqual(modifies(), []);
    import_strict.default.equal(files.get("nutegg/egg.md"), "disk content");
    import_strict.default.equal(mergedPath(), "nutegg/egg.md");
    import_strict.default.deepEqual(result, { egg: "nutegg/egg.md", entries: 3 });
  });
  (0, import_node_test.it)("merges without touching the file when there is no editor buffer (reading mode)", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner();
    const result = await runMerge(plugin, "nutegg/egg.md", null);
    import_strict.default.deepEqual(modifies(), []);
    import_strict.default.equal(files.get("nutegg/egg.md"), "disk content");
    import_strict.default.equal(mergedPath(), "nutegg/egg.md");
    import_strict.default.deepEqual(result, { egg: "nutegg/egg.md", entries: 3 });
  });
  (0, import_node_test.it)("skips the save and does not throw when the egg file is missing", async () => {
    const { plugin, modifies, mergedPath } = makeRunner({ files: {} });
    await runMerge(plugin, "nutegg/missing.md", "buffer");
    import_strict.default.deepEqual(modifies(), []);
    import_strict.default.equal(mergedPath(), "nutegg/missing.md");
  });
  (0, import_node_test.it)("never saves or merges a note outside the egg folder, even if it has egg headings", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner({ files: { "outside/egg.md": "# Unprocessed\n- private" } });
    import_strict.default.equal(await runMerge(plugin, "outside/egg.md", "editor buffer"), null);
    import_strict.default.equal(await runMerge(plugin, "outside/egg.md", null), null);
    import_strict.default.equal(files.get("outside/egg.md"), "# Unprocessed\n- private");
    import_strict.default.deepEqual(modifies(), []);
    import_strict.default.equal(mergedPath(), null);
  });
});
