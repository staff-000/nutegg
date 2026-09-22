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

// ../shared/src/egg-format.ts
function sanitizeEggName(name) {
  return String(name || "").trim().toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 60);
}
function extractEggLanguage(content) {
  if (!content)
    return "";
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (kv && kv[1].toLowerCase() === "language") {
        return kv[2].trim().replace(/^["'](.*)["']$/, "$1");
      }
    }
  }
  const directMatch = content.match(/^language:\s*["']?([^"'\r\n]+)["']?/im);
  return directMatch ? directMatch[1].trim() : "";
}
function insertEggLanguage(content, language, options) {
  if (!content || !language)
    return content;
  const existing = extractEggLanguage(content);
  if (existing && !options?.overwrite)
    return content;
  if (existing && options?.overwrite) {
    return content.replace(/^language:\s*["']?[^"'\r\n]*["']?/im, `language: "${language}"`);
  }
  if (/^language:\s*["']?["']?\s*$/m.test(content)) {
    return content.replace(/^language:\s*["']?["']?\s*$/m, `language: "${language}"`);
  }
  const fmRegex = /^(---\r?\n)([\s\S]*?)(\r?\n---)/;
  const match = content.match(fmRegex);
  if (match) {
    const opening = match[1];
    const body = match[2];
    const closing = match[3];
    const separator = body.endsWith("\n") || body.length === 0 ? "" : "\n";
    const newBody = `${body}${separator}language: "${language}"`;
    return content.replace(fmRegex, `${opening}${newBody}${closing}`);
  }
  return `---
language: "${language}"
---

${content}`;
}
function formatEggInstructionsForPrompt(egg) {
  const parts = [];
  parts.push(`**Scope:** ${egg.scope || "(not specified)"}`);
  if (egg.keyQuestions && egg.keyQuestions.length > 0) {
    parts.push(
      `**Key Questions:**
${egg.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    );
  }
  if (egg.rejectionCriteria && egg.rejectionCriteria.length > 0) {
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
function formatEggKnowledgeForPrompt(egg) {
  const parts = [];
  parts.push(`**Current Knowledge:**
${egg.knowledge || "(empty)"}`);
  if (egg.unprocessed && egg.unprocessed.trim()) {
    parts.push(`**Unprocessed (pending merge):**
${egg.unprocessed}`);
  }
  return parts.join("\n\n");
}
function formatEggForPrompt(egg) {
  return [
    formatEggInstructionsForPrompt(egg),
    formatEggKnowledgeForPrompt(egg)
  ].join("\n\n");
}
function countUnprocessed(egg) {
  const indentOf = (l) => (l.match(/^\s*/) || [""])[0].length;
  const bullets = (egg.unprocessed || "").split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => /^\s*[-*]\s/.test(l));
  if (bullets.length === 0)
    return 0;
  const base = Math.min(...bullets.map(indentOf));
  return bullets.filter((l) => indentOf(l) === base).length;
}
var init_egg_format = __esm({
  "../shared/src/egg-format.ts"() {
  }
});

// ../shared/src/egg-parser.ts
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
function matchesEggFormat(content) {
  if (!content || typeof content !== "string")
    return false;
  if (/^---\r?\n[\s\S]*?\btopic:\s*["']?.+["']?[\s\S]*?\r?\n---/m.test(content)) {
    return true;
  }
  if (content.includes("# Knowledge") || content.includes("# Unprocessed") || content.includes("[!abstract]")) {
    return true;
  }
  return false;
}
function parseEggFile(fileName, content) {
  const result = {
    fileName,
    topic: "Unknown",
    language: "",
    scope: "",
    actionGuide: "",
    keyQuestions: [],
    rejectionCriteria: [],
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
  result.scope = (sections.get("scope") || "").trim();
  result.actionGuide = (sections.get("action guide") || "").trim();
  result.keyQuestions = parseListItems(sections.get("key questions") || "");
  result.rejectionCriteria = parseListItems(sections.get("rejection criteria") || "");
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
var KNOWLEDGE_HEADING, UNPROCESSED_HEADING;
var init_egg_parser = __esm({
  "../shared/src/egg-parser.ts"() {
    init_egg_format();
    KNOWLEDGE_HEADING = "# Knowledge";
    UNPROCESSED_HEADING = "# Unprocessed";
  }
});

// src/egg-parser.ts
var egg_parser_exports = {};
__export(egg_parser_exports, {
  EggParser: () => EggParser,
  KNOWLEDGE_HEADING: () => KNOWLEDGE_HEADING,
  UNPROCESSED_HEADING: () => UNPROCESSED_HEADING,
  countUnprocessed: () => countUnprocessed,
  extractCallout: () => extractCallout,
  extractEggLanguage: () => extractEggLanguage,
  findSection: () => findSection,
  formatEggForPrompt: () => formatEggForPrompt,
  formatEggInstructionsForPrompt: () => formatEggInstructionsForPrompt,
  formatEggKnowledgeForPrompt: () => formatEggKnowledgeForPrompt,
  headingName: () => headingName,
  insertEggLanguage: () => insertEggLanguage,
  isEggPath: () => isEggPath,
  matchesEggFormat: () => matchesEggFormat,
  parseEggFile: () => parseEggFile,
  parseListItems: () => parseListItems,
  sanitizeEggName: () => sanitizeEggName,
  sectionBody: () => sectionBody,
  splitLabeledSections: () => splitLabeledSections,
  stripSectionHeading: () => stripSectionHeading
});
var EggParser;
var init_egg_parser2 = __esm({
  "src/egg-parser.ts"() {
    "use strict";
    init_egg_parser();
    init_egg_parser();
    EggParser = class {
      plugin;
      constructor(plugin) {
        this.plugin = plugin;
      }
      async readEgg(fileName, fallbackDescription) {
        let file = this.plugin.app.vault.getAbstractFileByPath(fileName);
        if (!file && !fileName.includes("/")) {
          const parentDir = this.plugin.settings.indexFile.replace(/\/[^/]+$/, "");
          file = this.plugin.app.vault.getAbstractFileByPath(`${parentDir}/${fileName}`);
        }
        if (!file) {
          const folder = this.plugin.vaultFolder || "nutegg";
          const allFiles = (this.plugin.app.vault.getMarkdownFiles?.() || []).filter(
            (f) => isEggPath(f.path, folder)
          );
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
        const parsed = this.parseEggFile(file.path || fileName, content);
        if (fallbackDescription && !parsed.indexDescription) {
          parsed.indexDescription = fallbackDescription;
        }
        if (!parsed.language) {
          const settingLang = this.plugin.settings?.contentOutputLanguage;
          const pluginLang = settingLang && settingLang !== "same-as-content" ? settingLang.trim() : "";
          if (pluginLang) {
            parsed.language = pluginLang;
            const updated = insertEggLanguage(content, pluginLang);
            if (updated !== content) {
              try {
                await this.plugin.app.vault.modify(file, updated);
              } catch (err) {
                console.warn(
                  `[NutEgg] Could not persist filled language to ${file.path}:`,
                  err
                );
              }
            }
          }
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
        const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
        if (!file) {
          console.warn(`[NutEgg] Cannot append \u2014 egg file not found: ${fileName}`);
          return;
        }
        const existing = await this.plugin.app.vault.read(file);
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
        await this.plugin.app.vault.modify(file, lines.join("\n") + "\n");
        console.log(`[NutEgg] Added unprocessed entry to ${fileName}`);
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
        const existing = await this.plugin.app.vault.read(file);
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
        await this.plugin.app.vault.modify(file, lines.join("\n") + "\n");
        console.log(`[NutEgg] Merged knowledge tree in ${fileName}`);
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
    const { EggParser: EggParser2 } = await Promise.resolve().then(() => (init_egg_parser2(), egg_parser_exports));
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

// tests/obsidian-stub.ts
var TAbstractFile = class {
  path = "";
  name = "";
};
var TFile = class extends TAbstractFile {
  basename = "";
  extension = "";
};

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
