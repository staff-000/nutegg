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

// tests/index-sync.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));

// tests/obsidian-stub.ts
var Notice = class {
  constructor(message, _timeout) {
    this.message = message;
  }
};
var TAbstractFile = class {
  path = "";
  name = "";
};
var TFile = class extends TAbstractFile {
  basename = "";
  extension = "";
};

// src/templates/egg.md
var egg_default = `---
topic: "Unknown"
status: "active"
last_updated: "2026-08-14"
language: "English"
---

> [!abstract]- Instructions:
> **Scope:** Capture high-signal, paradigm-shifting concepts, universally applicable frameworks, and novel data that hold significant strategic value but fall strictly outside established domain-specific routing.
>
> **Action Guide:**
> 1. Novel Delta: Extract only genuinely new, substantive insights or ideas not already captured in the existing knowledge files. State "None" if the content is entirely redundant.
> 2. Decide: should the user spend time reading this fully? Consider the egg's reject criteria if any are specified. If the content is repetitive, basic, or doesn't add new insight, answer false.
>
> **Key Questions:**
> 1. what new insights does this add?
> 2. Identify any conflicts between this new data and the existing knowledge base.
>
> **Rejection Criteria:**
> - Ignore content that repeats existing knowledge
>
> **Formatting Rules:** 
> - Each bullet MUST begin with exactly one entry tag. Format: "- [tag] The insight text\u2026". Pick the single best fit:
>   * [concept] \u2014 a definition or explanation of what something IS (e.g. a technique, algorithm, or paradigm)
>   * [architecture] \u2014 a model architecture, system design, or structural approach
>   * [method] \u2014 a how-to, workflow, training recipe, or step-by-step process
>   * [benchmark] \u2014 a measurable result, performance comparison, or empirical finding
>   * [explain] \u2014 reasoning or rationale behind a design choice or conclusion (the "why")
>   * [fact] \u2014 a verifiable data point, statistic, or empirical finding
>   * [example] \u2014 a concrete demo, paper, deployment, or case study that illustrates an idea
> - Each new entry follows a concept \u2192 explanation \u2192 example structure: one top-level bullet "- [tag] **Concept Name**" \u2014 Concept Name is a short 2\u20135 word name that uniquely identifies the insight (dedup and novelty checks compare concepts: the same insight under different wording is ONE concept). Explanation is added as a indented sub-bullet. Concrete examples from the content (if any) follow as indented sub-bullets ("  - \u{1F3AF} Example: ..."). Author and source are appended automatically.
> - Structured content: when the source itself is a well-organized enumeration (a numbered list, a named framework like "Seven Principles of X", a step-by-step process), capture it as ONE complete entry \u2014 the list's title as the Concept and EVERY item as an indented sub-bullet, in the source's own order. A partial list is worse than no entry.
> - New entries are added to the "# Unprocessed" section first and can be merged into the knowledge tree on demand.
> - When merging: respect the existing knowledge tree. Locate the most relevant parent concept in the document and append the new information beneath it as nested sub-bullets. Do not break the existing hierarchy.


# Knowledge


# Unprocessed
`;

// src/defaults.ts
var EGG_TEMPLATE = egg_default;

// src/egg-parser.ts
var KNOWLEDGE_HEADING = "# Knowledge";
var UNPROCESSED_HEADING = "# Unprocessed";
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
var EggParser = class {
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
      const egg2 = await this.readEgg(entry.fileName, entry.description);
      if (egg2) {
        egg2.indexDescription = entry.description;
        eggs.push(egg2);
      }
    }
    return eggs;
  }
  parseEggFile(fileName, content) {
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
        if (key === "language")
          result.language = value;
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
  formatEggInstructionsForPrompt(egg2) {
    const parts = [];
    parts.push(`**Scope:** ${egg2.scope || "(not specified)"}`);
    if (egg2.keyQuestions.length > 0) {
      parts.push(
        `**Key Questions:**
${egg2.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      );
    }
    if (egg2.rejectionCriteria.length > 0) {
      parts.push(
        `**Rejection Criteria:**
${egg2.rejectionCriteria.map((c) => `- ${c}`).join("\n")}`
      );
    }
    if (egg2.formattingRules) {
      parts.push(`**Formatting Rules:**
${egg2.formattingRules}`);
    }
    return parts.join("\n\n");
  }
  /** Format only the egg's existing Knowledge tree and Unprocessed entries for Step 2 comparison. */
  formatEggKnowledgeForPrompt(egg2) {
    const parts = [];
    parts.push(`**Current Knowledge:**
${egg2.knowledge || "(empty)"}`);
    if (egg2.unprocessed.trim()) {
      parts.push(`**Unprocessed (pending merge):**
${egg2.unprocessed}`);
    }
    return parts.join("\n\n");
  }
  /** Format one egg's instructions + knowledge for an AI prompt (backward compatibility). */
  formatEggForPrompt(egg2) {
    return [
      this.formatEggInstructionsForPrompt(egg2),
      this.formatEggKnowledgeForPrompt(egg2)
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
  countUnprocessed(egg2) {
    const indentOf = (l) => (l.match(/^\s*/) || [""])[0].length;
    const bullets = egg2.unprocessed.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => /^\s*[-*]\s/.test(l));
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

// src/index-sync.ts
function sanitizeEggName(name) {
  return String(name || "").trim().toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 60);
}
var IndexSync = class {
  plugin;
  initialized = false;
  isUpdatingIndex = false;
  directEditTimer = null;
  diffListeners = /* @__PURE__ */ new Set();
  constructor(plugin) {
    this.plugin = plugin;
  }
  /** Subscribe to index diff status changes. Returns unsubscribe function. */
  onDiffChanged(listener) {
    this.diffListeners.add(listener);
    return () => this.diffListeners.delete(listener);
  }
  notifyDiffChanged() {
    for (const listener of this.diffListeners) {
      try {
        listener();
      } catch {
      }
    }
  }
  /** Register vault event listeners for egg additions, deletions, renames, and direct index edits. */
  init() {
    if (this.initialized)
      return;
    this.initialized = true;
    const vault = this.plugin.app?.vault;
    if (!vault?.on)
      return;
    const hook = (event, cb) => {
      const ref = vault.on(event, cb);
      if (typeof this.plugin.registerEvent === "function") {
        this.plugin.registerEvent(ref);
      }
    };
    hook("create", async (file) => {
      if (this.isUpdatingIndex)
        return;
      if (file && file.path) {
        await this.onEggFileCreated(file);
      }
    });
    hook("delete", async (file) => {
      if (this.isUpdatingIndex)
        return;
      if (file && file.path) {
        await this.onEggFileDeleted(file.path);
      }
    });
    hook("rename", async (file, oldPath) => {
      if (this.isUpdatingIndex)
        return;
      if (file && file.path && oldPath) {
        await this.onEggFileRenamed(oldPath, file.path);
      }
    });
    hook("modify", async (file) => {
      if (this.isUpdatingIndex)
        return;
      if (file && file.path === this.plugin.settings?.indexFile) {
        this.debounceDirectIndexEdit();
      }
    });
  }
  /** Handle an egg file being created or dropped into nutegg/ */
  async onEggFileCreated(file) {
    const folder = this.plugin.vaultFolder || "nutegg";
    if (!isEggPath(file.path, folder))
      return;
    this.notifyDiffChanged();
  }
  /** Handle an egg file being deleted from nutegg/ */
  async onEggFileDeleted(filePath) {
    const folder = this.plugin.vaultFolder || "nutegg";
    if (!isEggPath(filePath, folder))
      return;
    const indexFile = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.settings.indexFile
    );
    if (!indexFile)
      return;
    this.isUpdatingIndex = true;
    try {
      const fileName = filePath.split("/").pop() || "";
      let modified = await this.removeIndexEntry(indexFile, filePath);
      if (fileName && fileName !== filePath) {
        const mod2 = await this.removeIndexEntry(indexFile, fileName);
        modified = modified || mod2;
      }
      if (modified) {
        new Notice(`[NutEgg] Removed ${filePath} from egg index`);
      }
      this.notifyDiffChanged();
    } finally {
      this.isUpdatingIndex = false;
    }
  }
  /** Handle an egg file being renamed */
  async onEggFileRenamed(oldPath, newPath) {
    const folder = this.plugin.vaultFolder || "nutegg";
    const wasEgg = isEggPath(oldPath, folder);
    const isEgg = isEggPath(newPath, folder);
    if (!wasEgg && !isEgg)
      return;
    const indexFile = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.settings.indexFile
    );
    if (!indexFile)
      return;
    this.isUpdatingIndex = true;
    try {
      if (wasEgg && isEgg) {
        await this.rewriteIndexPath(indexFile, oldPath, newPath);
        const oldBase = oldPath.split("/").pop() || "";
        if (oldBase) {
          await this.rewriteIndexPath(indexFile, oldBase, newPath);
        }
        new Notice(`[NutEgg] Renamed index path: ${oldPath} -> ${newPath}`);
      } else if (wasEgg && !isEgg) {
        await this.removeIndexEntry(indexFile, oldPath);
      } else {
        this.notifyDiffChanged();
      }
    } finally {
      this.isUpdatingIndex = false;
    }
  }
  /** Debounce direct edits on _index.md: notify diff changed without creating files automatically */
  debounceDirectIndexEdit() {
    if (this.directEditTimer) {
      clearTimeout(this.directEditTimer);
    }
    this.directEditTimer = setTimeout(async () => {
      this.directEditTimer = null;
      await this.onDirectIndexEdit();
    }, 300);
  }
  /**
   * Handle direct user edits on _index.md.
   * Per user requirement, direct edits on _index.md NEVER create egg files automatically.
   * The user clicks the Sync button in _index.md to trigger creation.
   */
  async onDirectIndexEdit() {
    if (this.isUpdatingIndex)
      return;
    this.notifyDiffChanged();
  }
  /** Calculate discrepancies between _index.md and disk */
  async getDiffStatus() {
    const folder = this.plugin.vaultFolder || "nutegg";
    const norm = (p) => p.startsWith(folder + "/") ? p : `${folder}/${p.replace(/^\/+/, "")}`;
    const eggFilesOnDisk = (this.plugin.app.vault.getMarkdownFiles?.() || []).filter((f) => isEggPath(f.path, folder)).map((f) => f.path);
    const diskSet = new Set(eggFilesOnDisk);
    const indexContent = await this.plugin.indexReader.getIndexContent();
    if (indexContent === "(No _index.md found)") {
      return { missingEggs: [], unindexedEggs: [], invalidEntries: [], totalDiffs: 0 };
    }
    const rawEntries = this.plugin.indexReader.parseIndexContent(indexContent);
    const missingEggs = [];
    const invalidEntries = [];
    const indexedEggPaths = /* @__PURE__ */ new Set();
    for (const entry of rawEntries) {
      const target = norm(entry.fileName);
      if (!isEggPath(target, folder)) {
        invalidEntries.push(entry.fileName);
      } else {
        indexedEggPaths.add(target);
        if (!diskSet.has(target)) {
          const exists = await this.plugin.app.vault.adapter.exists(target) || Boolean(this.plugin.app.vault.getAbstractFileByPath(target));
          if (!exists) {
            missingEggs.push(target);
          }
        }
      }
    }
    const unindexedEggs = [];
    for (const eggPath of eggFilesOnDisk) {
      if (!indexedEggPaths.has(eggPath)) {
        unindexedEggs.push(eggPath);
      }
    }
    return {
      missingEggs,
      unindexedEggs,
      invalidEntries,
      totalDiffs: missingEggs.length + unindexedEggs.length + invalidEntries.length
    };
  }
  /** Trigger full manual sync from the Sync button */
  async sync() {
    this.isUpdatingIndex = true;
    try {
      const result = await this.checkAndFix({ syncUnindexed: true });
      this.notifyDiffChanged();
      return result;
    } finally {
      this.isUpdatingIndex = false;
    }
  }
  async checkAndFix(options) {
    const result = {
      addedIndexEntries: [],
      fixedIndexPaths: [],
      createdEggs: [],
      prunedIndexEntries: []
    };
    const folder = this.plugin.vaultFolder || "nutegg";
    const indexContent = await this.plugin.indexReader.getIndexContent();
    if (indexContent === "(No _index.md found)") {
      return result;
    }
    const rawEntries = this.plugin.indexReader.parseIndexContent(indexContent);
    const norm = (p) => p.startsWith(folder + "/") ? p : `${folder}/${p.replace(/^\/+/, "")}`;
    const indexFile = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.settings.indexFile
    );
    const entries = [];
    let updatedIndexContent = indexContent;
    for (const entry of rawEntries) {
      const target = norm(entry.fileName);
      if (!isEggPath(target, folder)) {
        const escaped = entry.fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`^[\\t ]*[*\\-+]?[\\t ]*${escaped}(?:[\\t ]*:.*)?(?:\\r?\\n)?`, "m");
        updatedIndexContent = updatedIndexContent.replace(re, "");
        result.prunedIndexEntries.push(entry.fileName);
      } else {
        entries.push(entry);
      }
    }
    if (result.prunedIndexEntries.length > 0 && indexFile) {
      await this.plugin.app.vault.modify(indexFile, updatedIndexContent);
      console.log(`[NutEgg] Pruned ${result.prunedIndexEntries.length} invalid entries from index`);
    }
    if (options?.syncUnindexed && indexFile) {
      const diskEggFiles = (this.plugin.app.vault.getMarkdownFiles?.() || []).filter((f) => isEggPath(f.path, folder));
      const indexedTargets = new Set(entries.map((e) => norm(e.fileName)));
      for (const file of diskEggFiles) {
        if (!indexedTargets.has(file.path)) {
          const content = await this.plugin.app.vault.read(file).catch(() => "");
          if (matchesEggFormat(content)) {
            let topic = "";
            try {
              const egg2 = await this.plugin.eggParser.readEgg(file.path);
              if (egg2?.topic && egg2.topic !== "Unknown") {
                topic = egg2.topic;
              }
            } catch {
            }
            if (!topic) {
              topic = file.path.split("/").pop().replace(/\.md$/, "");
            }
            await this.appendIndexEntry(indexFile, file.path, topic);
            result.addedIndexEntries.push(file.path);
            indexedTargets.add(file.path);
          }
        }
      }
    }
    for (const entry of entries) {
      const target = norm(entry.fileName);
      if (await this.plugin.app.vault.adapter.exists(target))
        continue;
      if (await this.plugin.app.vault.adapter.exists(entry.fileName))
        continue;
      try {
        await this.createEggFromTemplate(target, entry);
        if (target !== entry.fileName) {
          await this.rewriteIndexPath(indexFile, entry.fileName, target);
          result.fixedIndexPaths.push(target);
        }
        result.createdEggs.push(target);
      } catch (err) {
        console.warn(`[NutEgg] Could not create egg from template for ${target}:`, err);
      }
    }
    for (const entry of entries) {
      const target = norm(entry.fileName);
      if (entry.fileName !== target && await this.plugin.app.vault.adapter.exists(target)) {
        await this.rewriteIndexPath(indexFile, entry.fileName, target);
        if (!result.fixedIndexPaths.includes(target)) {
          result.fixedIndexPaths.push(target);
        }
      }
    }
    if (result.addedIndexEntries.length || result.fixedIndexPaths.length || result.createdEggs.length || result.prunedIndexEntries.length) {
      console.log(
        `[NutEgg] Index sync: +${result.addedIndexEntries.length} entries added, ~${result.fixedIndexPaths.length} paths normalized, +${result.createdEggs.length} egg files created, -${result.prunedIndexEntries.length} non-egg entries pruned`
      );
    }
    this.notifyDiffChanged();
    return result;
  }
  /**
   * Create a new egg file from a name + description (the popup's "no egg
   * matched — create one?" flow). Seeds the template's topic/scope from the
   * description and appends the matching _index.md entry. `alreadyExists`
   * when the file was already there (nothing is overwritten).
   */
  async createEgg(rawName, rawDescription) {
    const name = sanitizeEggName(rawName);
    const description = (rawDescription || "").trim();
    if (!name) {
      throw new Error("Invalid egg name");
    }
    const folder = this.plugin.vaultFolder || "nutegg";
    const fileName = `${folder}/${name}.md`;
    if (await this.plugin.app.vault.adapter.exists(fileName)) {
      const existingContent = await this.plugin.app.vault.adapter.read(fileName).catch(() => "");
      return {
        path: fileName,
        alreadyExists: true,
        language: extractEggLanguage(existingContent)
      };
    }
    const { language } = await this.createEggFromTemplate(fileName, {
      fileName,
      description
    });
    const indexFile = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.settings.indexFile
    );
    this.isUpdatingIndex = true;
    try {
      await this.appendIndexEntry(indexFile, fileName, description || name);
      this.notifyDiffChanged();
    } finally {
      this.isUpdatingIndex = false;
    }
    return { path: fileName, alreadyExists: false, language };
  }
  async removeIndexEntry(indexFile, entryPath) {
    if (!indexFile)
      return false;
    const content = await this.plugin.app.vault.read(indexFile);
    const escaped = entryPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^[\\t ]*[*\\-+]?[\\t ]*${escaped}(?:[\\t ]*:.*)?(?:\\r?\\n)?`, "m");
    if (!re.test(content))
      return false;
    const updated = content.replace(re, "");
    if (updated === content)
      return false;
    await this.plugin.app.vault.modify(indexFile, updated);
    console.log(`[NutEgg] Removed index entry: ${entryPath}`);
    return true;
  }
  async appendIndexEntry(indexFile, eggPath, description) {
    if (!indexFile)
      return;
    const line = `* ${eggPath}${description ? `: ${description}` : ""}`;
    const content = await this.plugin.app.vault.read(indexFile);
    await this.plugin.app.vault.modify(
      indexFile,
      content.replace(/\n+$/, "") + `
${line}
`
    );
    console.log(`[NutEgg] Added index entry: ${line}`);
  }
  /** Rewrite one index entry's file path in place (keeps its description). */
  async rewriteIndexPath(indexFile, oldPath, newPath) {
    if (!indexFile)
      return;
    const content = await this.plugin.app.vault.read(indexFile);
    const escaped = oldPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^(\\s*[*\\-+]?\\s*)${escaped}(\\s*:)`, "m");
    if (!re.test(content))
      return;
    const updated = content.replace(re, `$1${newPath}$2`);
    if (updated === content)
      return;
    await this.plugin.app.vault.modify(indexFile, updated);
    console.log(`[NutEgg] Index path fixed: ${oldPath} -> ${newPath}`);
  }
  /**
   * Create the missing egg file from the template, seeded from the index
   * entry's description (topic + scope). Reuses EGG_TEMPLATE and optionally
   * localizes concrete instructions to match the description's language.
   */
  async createEggFromTemplate(targetPath, entry) {
    await this.ensureParentFolders(targetPath);
    const folder = this.plugin.vaultFolder || "nutegg";
    const fallbackTopic = targetPath.replace(new RegExp(`^${folder}/`), "").replace(/\.md$/, "");
    const topic = (entry.description || fallbackTopic).trim();
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    let content = EGG_TEMPLATE;
    content = content.replace(
      /^topic: .*$/m,
      `topic: "${this.escapeYaml(topic)}"`
    );
    if (entry.description) {
      content = content.replace(
        /^> \*\*Scope:\*\* .*$/m,
        `> **Scope:** ${entry.description}`
      );
    }
    content = content.replace(
      /^last_updated: .*$/m,
      `last_updated: "${dateStr}"`
    );
    let detectedLanguage = "";
    if (entry.description && this.plugin.aiProcessor?.localizeEggTemplate) {
      try {
        const localized = await this.plugin.aiProcessor.localizeEggTemplate(
          content,
          entry.description
        );
        if (localized) {
          if (typeof localized === "string") {
            content = localized;
            detectedLanguage = extractEggLanguage(localized) || detectedLanguage;
          } else {
            content = localized.content;
            detectedLanguage = localized.language || extractEggLanguage(localized.content) || detectedLanguage;
          }
        }
      } catch (err) {
        console.warn("[NutEgg] Failed to localize egg template with AI:", err);
      }
    }
    const settingLang = this.plugin.settings?.contentOutputLanguage;
    const pluginLang = settingLang && settingLang !== "same-as-content" ? settingLang.trim() : "";
    if (!detectedLanguage) {
      detectedLanguage = extractEggLanguage(content) || pluginLang || "English";
    }
    if (detectedLanguage) {
      content = insertEggLanguage(content, detectedLanguage, { overwrite: true });
    }
    await this.plugin.app.vault.create(targetPath, content);
    console.log(`[NutEgg] Created egg from index entry: ${targetPath}`);
    return { path: targetPath, language: detectedLanguage };
  }
  async ensureParentFolders(path) {
    const parts = path.split("/").slice(0, -1);
    let currentPath = "";
    for (const part of parts) {
      currentPath += (currentPath ? "/" : "") + part;
      const exists = await this.plugin.app.vault.adapter.exists(currentPath);
      if (!exists) {
        await this.plugin.app.vault.createFolder(currentPath);
      }
    }
  }
  escapeYaml(value) {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
};

// src/workflow/content-analysis.md
var content_analysis_default = `You are a knowledge curator. Analyze the content below following the Task.

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{part_note}}{{chapters}}
{{sections}}{{questions}}

{{content}}

## Task
{{content_task_default}}

## Output Format
Respond with ONLY a valid JSON object matching this schema (no markdown, no code fence, just the JSON object):
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2", "bullet 3"],
  "isLongForm": true,
  "chapterMap": [
    {"time": "00:12:34", "title": "chapter title", "summary": "one sentence"}
  ],
  "customQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ]
}

## Output Rules
- titleVerdict must be a single sentence.
- coreSummary: at most 3 bullets, plain language.
- isLongForm: true only for long articles/videos that meaningfully benefit from a chapter map.
- chapterMap: empty array when isLongForm is false. When video chapters are provided, keep their exact timestamps and titles, and only add your 1-sentence summary.
- chapterMap when Video Sections are listed above: return EXACTLY one entry per listed section, using the section's start time as "time" \u2014 give each a short title and a 1-sentence summary of what happens between that section and the next.
- chapterMap when NO chapters or sections were provided: empty array (the content is not a timestamped video).
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to an Egg Key Question above or to another user question \u2014 answer it only once.
{{shared_output_rules}}
`;

// src/workflow/egg-analysis.md
var egg_analysis_default = `You are a knowledge curator for the egg file "{{egg_file}}". Extract knowledge entries from the content below according to this egg's instructions.

## Egg Instructions
{{egg_instructions}}

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{part_note}}

{{content}}

## Task
1. Follow action guide in Egg Instructions
2. Answer each Key Question (if any) directly and concisely based on the content.
3. Extract Knowledge Entries: extract all substantive insights, concepts, frameworks, and findings from the content that fall within this egg's Scope, formatted strictly per the Formatting Rules:
   - Follow the concept \u2192 explanation \u2192 example structure: one top-level bullet "- [tag] **Concept**: short phrases" (without "[tag] " when the egg defines no tags), with the explanation as one indented sub-bullet and concrete examples from the content as further indented sub-bullets ("  - \u{1F3AF} Example: ...") when present. Name each Concept clearly.
   - Structured enumerations / frameworks (numbered lists, step-by-step methods, named frameworks): capture as ONE complete entry preserving EVERY item in order. Never summarize items away, never truncate.
   - Do NOT include author or source \u2014 they are appended automatically.

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "language": "English",
  "keyQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ],
  "extractedEntries": [
    {"kind": "insight", "content": "- [tag] **Concept**: short phrases\\n  - explanation\\n  - \u{1F3AF} Example: ..."}
  ]
}

## Output Rules:
- language: the primary natural language of the egg note or extracted entries (e.g. "English", "Chinese", "Japanese", etc.).
- extractedEntries: empty array if the content contains no substantive knowledge matching this egg's scope. "kind" is "insight" (default) or "list" (for structured enumerations).
{{shared_output_rules}}
`;

// src/workflow/follow-up.md
var follow_up_default = `You are a knowledge curator. Answer the user's follow-up questions about this content.

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{prior_qa}}

{{content}}

## New Questions (answer each directly and concisely)
{{questions}}

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "answers": [
    {"question": "exact question text", "answer": "direct answer"}
  ]
}

## Output Rules:
- One entry per question, in the same order.
- If a question is equivalent to one in Previous Questions & Answers, answer briefly with the same conclusion instead of repeating it.
{{shared_output_rules}}
`;

// src/workflow/egg-routing.md
var egg_routing_default = 'Given this content and egg index, which egg file(s) does this content belong to? Return ONLY the file names, one per line. If none match, return "none".\n\n## Content\nTitle: {{title}}\nURL: {{url}}\n{{content}}\n\n## Egg Index\n{{index}}\n\nReturn matching file names (one per line):\n';

// src/workflow/content-task-default.md
var content_task_default_default = "1. Title Verdict: Provide a single, direct sentence that resolves the core question posed in the title or introduction.\n2. Core Summary: Summarize the main concepts in plain language using a maximum of 3 bullet points.\n3. Chapter Map (Long-form only): If the content is a long article or lengthy video, provide a brief 1-sentence summary for each major section or topic shift. If it is short, omit this step entirely.\n";

// src/workflow/merge-unprocessed.md
var merge_unprocessed_default = `You are a knowledge curator for the egg file "{{egg_file}}". The Unprocessed section has accumulated {{unprocessed_count}} entries \u2014 merge them into the knowledge tree below.

## Formatting Rules
{{formatting_rules}}

## Existing Knowledge Tree
{{knowledge_tree}}

## Entries to Merge
{{unprocessed}}

## Task
1. PRESERVE the existing tree structure as much as possible: do not rename, restructure, or delete existing branches \u2014 the user may have edited them by hand.
2. Deduplicate the entries against EACH OTHER first, comparing their Concepts: entries with the same or equivalent concept are ONE entry, even when the explanations differ \u2014 keep the clearest explanation, fold the others' examples into it, and keep every distinct _author/_source line. A near-duplicate must never appear twice in the merged tree \u2014 dropping redundant rewordings is more valuable than preserving slight wording differences.
3. Structured lists (entries holding a numbered enumeration / framework): entries with the same title are fragments of ONE list \u2014 union their items (drop exact-duplicate items), keep the source's item order. Never truncate a list: every item the source enumerated must survive the merge.
4. Nest each deduplicated entry under the most relevant existing concept as sub-bullets.
5. Only when an entry matches no existing concept, create a new minimal top-level branch for it.
6. Keep each entry's insight, concrete examples, and its _author/_source lines intact when moving it into the tree.
7. If an entry's concept duplicates existing knowledge in the tree, drop it entirely.
8. If an entry cannot be merged meaningfully, leave it in the "unprocessed" output.

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "knowledge": "the COMPLETE updated Knowledge section content as markdown \u2014 the existing tree with the merged entries nested in. Only the section BODY: do NOT include the '# Knowledge' heading line itself.",
  "unprocessed": "the entries that could not be merged (markdown), or an empty string when all were merged. Only the section BODY: do NOT include the '# Unprocessed' heading line itself."
}

## Output Rules:
- Output Language: write ALL output text (knowledge entries, explanations) in {{output_language}}. Keep JSON keys in English.
`;

// src/workflow/aggregate-content.md
var aggregate_content_default = `You are a knowledge curator. The content below was too long for one pass and was analyzed in parts. Combine the per-part results into ONE coherent result for the whole content.

## Content
**Title:** {{title}}
**Source:** {{url}}

## Per-Part Summaries
{{chunk_summaries}}

{{questions}}

## Task
{{content_task_default}}

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2"],
  "customQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ]
}

## Output Rules
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none).
{{shared_output_rules}}
`;

// src/workflow/aggregate-egg.md
var aggregate_egg_default = 'You are a knowledge curator for the egg file "{{egg_file}}". The content was too long for one pass and was analyzed against this egg in parts. Decide for the content AS A WHOLE and synthesize knowledge entries across parts.\n\n## Egg Instructions\n{{egg_instructions}}\n\n## Per-Part Findings\n{{chunk_findings}}\n\n## Task\n1. Synthesize Knowledge Entries across parts into "novelDelta":\n   - Connect and assemble related findings that spread across different parts (e.g. principles of a framework, steps of a methodology, or concepts introduced in one part and expanded in another) into complete, unified knowledge entries.\n   - When a concept was partially mentioned in an earlier part and fully explained in a later part, merge them into the single complete entry.\n   - For standalone insights from individual parts, preserve them as formatted entries.\n   - Determine "parent" in the Knowledge Tree for each entry.\n2. Answer each Key Question (if any) for the whole content, directly and concisely.\n3. Apply the Rejection Criteria to the whole content \u2014 set rejected to true with a one-line reason when it is noise for this egg.\n4. Decide: should the user spend time reading/watching this fully? Consider the reject criteria and whether the parts together add new insight.\n\n## Output Format\nRespond in this EXACT JSON format (no markdown, no code fence, just the JSON object):\n{\n  "novelDelta": [\n    {"parent": "parent heading in knowledge tree or empty string", "kind": "insight", "content": "- formatted entry text\\n  - sub bullets"}\n  ],\n  "keyQuestionAnswers": [\n    {"question": "exact question text", "answer": "direct answer"}\n  ],\n  "rejected": false,\n  "rejectReason": "",\n  "readVerdict": true,\n  "readVerdictReason": "one-line reason"\n}\n\n## Output Rules:\n{{shared_output_rules}}\n';

// src/workflow/egg-compare.md
var egg_compare_default = `You are a knowledge curator for the egg file "{{egg_file}}".
Your task is to compare newly extracted candidate knowledge entries from a source against this egg's existing Knowledge tree and Unprocessed entries to identify genuinely NEW insights and decide if the source is worth reading.

## Existing Knowledge in Egg
### Current Knowledge Tree
{{current_knowledge}}

### Unprocessed Entries (pending merge)
{{unprocessed}}

## Rejection Criteria
{{rejection_criteria}}

## Candidate Knowledge Entries Extracted from Source
**Source Title:** {{title}}
**Source URL:** {{url}}

{{extracted_entries}}

## Task
1. Novel Delta: compare each candidate knowledge entry against the Current Knowledge Tree AND the Unprocessed entries.
   - Compare by CONCEPT: an insight is new only when its core concept is not already covered in the existing knowledge. The same concept with different wording or a different minor example is a DUPLICATE, not new.
   - Classify EVERY candidate entry into either "novelDelta" (genuinely new) or "redundantEntries" (already covered/known in the existing knowledge tree).
   - EXCEPTION \u2014 structured content: when an entry is a well-organized enumeration (a numbered list, a named framework like "Seven Principles of X", a step-by-step process), preserve the COMPLETE list intact in novelDelta unless the entire framework already exists in the tree.
   - For each kept novel entry: determine "parent" \u2014 the EXACT text of the existing bullet or heading in the Current Knowledge tree that best fits as a parent topic to nest under (use "" if no suitable parent exists in the tree).
   - For each redundant entry: determine "existingParent" \u2014 the existing concept or heading it was already covered under.
2. Rejection Criteria:
   - If the content violates the Rejection Criteria or has NO new/novel knowledge for this egg, set "rejected": true and give a one-line "rejectReason".
3. Read Verdict:
   - Decide if the user should spend time reading/watching this source fully ("readVerdict": true/false).
   - If novel, valuable insights were found, set "readVerdict": true with a one-line "readVerdictReason".
   - If redundant, superficial, or noise, set "readVerdict": false with a one-line "readVerdictReason".

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "novelDelta": [
    {"parent": "exact parent bullet text from knowledge tree or empty string", "kind": "insight", "content": "- formatted entry text\\n  - sub bullets"}
  ],
  "redundantEntries": [
    {"existingParent": "matched concept or heading in knowledge tree", "content": "- candidate entry text that was already known"}
  ],
  "rejected": false,
  "rejectReason": "",
  "readVerdict": true,
  "readVerdictReason": "one-line explanation"
}

## Output Rules:
- "parent" must match the exact text of a heading or bullet in Current Knowledge ("" if none).
- "kind" is "insight" or "list".
{{shared_output_rules}}
`;

// src/workflow/localize-egg.md
var localize_egg_default = 'You are a knowledge curator for NutEgg.\n\n## Egg Description\n{{description}}\n\n## Egg Template\n{{template}}\n\n## Task\nTranslate and adapt the concrete instructions, questions, criteria, and rule descriptions in the template above so they use the SAME LANGUAGE as the egg description: "{{description}}".\n\n## Output Rules:\n1. Language: All explanations, questions, criteria, and rule guidance must be written in the same language as the egg description: "{{description}}".\n2. Egg Parser Structure: The structure and these exact labels MUST remain in English:\n   - Frontmatter (`---`, `topic: ...`, `status: ...`, `last_updated: ...`, `language: <detected language name in English, e.g. English, Chinese, Japanese, Korean, Spanish, French, German, Russian>`)\n   - Callout: `> [!abstract]- Instructions:`\n   - Bold section labels: `> **Scope:**`, `> **Action Guide:**`, `> **Key Questions:**`, `> **Rejection Criteria:**`, `> **Formatting Rules:**`\n   - Step labels in Action Guide: `1. Title Verdict:`, `2. Core Summary:`, `3. Chapter Map (Long-form only):`, `4. Novel Delta:`, `5. Decide:`\n   - Headings: `# Knowledge` and `# Unprocessed`\n   - Tag names in Formatting Rules: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`\n\nOutput ONLY the complete updated egg file markdown. Do NOT wrap in markdown code fences.\n\n';

// src/workflow/shared-output-rules.md
var shared_output_rules_default = '- Grounding: The content is the ONLY source of truth for every answer and summary you produce. Report what the content actually says even when it contradicts common sense or well-known facts \u2014 never correct, refute, or supplement it with outside knowledge. If the content does not address a question, say "Not covered in this content".\n- Output Language: Write ALL output text (verdicts, summaries, answers, knowledge entries, reasons) in {{output_language}}. Keep all JSON keys in English.';

// src/prompt-templates.ts
var PROMPTS = {
  /** Phase 1 — content summary + chapter map + custom question answers. */
  contentAnalysis: content_analysis_default,
  /** Step 1 extraction — content against one egg using instructions only. */
  eggAnalysis: egg_analysis_default,
  /** Step 2 comparison — candidate knowledge entries vs egg knowledge tree. */
  eggCompare: egg_compare_default,
  /** Follow-up questions after the initial analysis. */
  followUp: follow_up_default,
  /** Egg routing — match content to egg files from _index.md. */
  eggRouting: egg_routing_default,
  /** Default content analysis task (Title Verdict, Core Summary, Chapter Map). */
  contentTaskDefault: content_task_default_default.trim(),
  /** Merge 20+ Unprocessed entries into the Knowledge tree. */
  mergeUnprocessed: merge_unprocessed_default,
  /** Combine per-part results into one result for long content. */
  aggregateContent: aggregate_content_default,
  /** Per-egg verdict + key questions for long content (after per-part delta). */
  aggregateEgg: aggregate_egg_default,
  /** Localize egg template matching the description language while keeping parser structure in English. */
  localizeEgg: localize_egg_default,
  /** Shared output rules (grounding + language reference) injected into prompts. */
  sharedOutputRules: shared_output_rules_default.trim()
};
function renderPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = vars[key];
    return value === void 0 ? "" : String(value);
  });
}

// src/ai-client.ts
var PROVIDER_CATALOG = {
  local: {
    id: "local",
    label: "Local LLM (Ollama, LM Studio, etc.)",
    officialEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
    apiFormat: "openai-compatible",
    keyPlaceholder: "Optional for local LLMs",
    openrouterPrefix: ""
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter (Multi-Provider)",
    officialEndpoint: "https://openrouter.ai/api/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "openai/gpt-6-astra",
    families: [
      {
        id: "openai",
        label: "OpenAI GPT & Reasoning",
        defaultModel: "openai/gpt-6-astra",
        models: [
          "openai/gpt-6-astra",
          "openai/gpt-5.6-sol",
          "openai/o3-mini",
          "openai/gpt-4o"
        ]
      },
      {
        id: "anthropic",
        label: "Anthropic Claude",
        defaultModel: "anthropic/claude-sonnet-5",
        models: [
          "anthropic/claude-fable-5-1",
          "anthropic/claude-opus-5",
          "anthropic/claude-sonnet-5"
        ]
      },
      {
        id: "deepseek",
        label: "DeepSeek",
        defaultModel: "deepseek/deepseek-r1",
        models: ["deepseek/deepseek-r1", "deepseek/deepseek-chat"]
      },
      {
        id: "google",
        label: "Google Gemini",
        defaultModel: "google/gemini-2.5-flash",
        models: [
          "google/gemini-2.5-flash",
          "google/gemini-2.5-pro"
        ]
      },
      {
        id: "meta",
        label: "Meta Llama",
        defaultModel: "meta-llama/llama-3.3-70b-instruct",
        models: [
          "meta-llama/llama-3.3-70b-instruct"
        ]
      },
      {
        id: "qwen",
        label: "Qwen",
        defaultModel: "qwen/qwen-2.5-72b-instruct",
        models: [
          "qwen/qwen-2.5-72b-instruct"
        ]
      },
      {
        id: "custom",
        label: "Custom OpenRouter Model",
        defaultModel: "openai/gpt-6-astra",
        models: []
      }
    ],
    models: [
      "openai/gpt-6-astra",
      "openai/gpt-5.6-sol",
      "openai/o3-mini",
      "openai/gpt-4o",
      "anthropic/claude-fable-5-1",
      "anthropic/claude-opus-5",
      "anthropic/claude-sonnet-5",
      "deepseek/deepseek-r1",
      "deepseek/deepseek-chat",
      "google/gemini-2.5-flash",
      "google/gemini-2.5-pro",
      "meta-llama/llama-3.3-70b-instruct",
      "qwen/qwen-2.5-72b-instruct"
    ],
    keyPlaceholder: "sk-or-...",
    openrouterPrefix: ""
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    officialEndpoint: "https://api.anthropic.com/v1/messages",
    apiFormat: "anthropic",
    defaultModel: "claude-sonnet-5",
    models: [
      "claude-fable-5-1",
      "claude-opus-5",
      "claude-sonnet-5",
      "claude-haiku-4-5-20251001",
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022"
    ],
    keyPlaceholder: "sk-ant-...",
    openrouterPrefix: "anthropic/"
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    officialEndpoint: "https://api.openai.com/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "gpt-6-astra",
    models: [
      "gpt-6-astra",
      "gpt-5.6-sol",
      "gpt-5.6-terra",
      "gpt-5.6-luna",
      "o3-mini",
      "o1",
      "gpt-4o",
      "gpt-4o-mini"
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "openai/"
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    officialEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "gemini-2.5-flash",
    models: [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite"
    ],
    keyPlaceholder: "AIza...",
    openrouterPrefix: "google/"
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    officialEndpoint: "https://api.deepseek.com/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "deepseek-chat",
    models: [
      "deepseek-chat",
      "deepseek-reasoner",
      "deepseek-flash"
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "deepseek/"
  },
  kimi: {
    id: "kimi",
    label: "Kimi (Moonshot)",
    officialEndpoint: "https://api.moonshot.cn/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "kimi-k3",
    models: [
      "kimi-k3",
      "kimi-k2.7-code",
      "kimi-k2.7-code-highspeed",
      "moonshot-v1-8k",
      "moonshot-v1-32k",
      "moonshot-v1-128k"
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "moonshot/"
  },
  zhipu: {
    id: "zhipu",
    label: "Zhipu (GLM)",
    officialEndpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "glm-5.3",
    models: [
      "glm-5.3",
      "glm-5",
      "glm-5-turbo",
      "glm-4.7",
      "glm-4-plus",
      "glm-4-air",
      "glm-4-flash"
    ],
    keyPlaceholder: "...",
    openrouterPrefix: "zhipu/"
  },
  qwen: {
    id: "qwen",
    label: "Qwen (Tongyi)",
    officialEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "qwen3-max",
    models: [
      "qwen3-max",
      "qwen3-plus",
      "qwen3-flash",
      "qwen-max",
      "qwen-plus",
      "qwen-turbo"
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "qwen/"
  }
};
function isAIConfigured(settings) {
  if (settings.aiProvider === "local") {
    return Boolean(
      settings.localEndpoint && settings.localEndpoint.trim().length > 0 || PROVIDER_CATALOG.local.officialEndpoint
    );
  }
  return Boolean(settings.aiApiKey && settings.aiApiKey.trim().length > 0);
}

// src/index-reader.ts
var IndexReader = class {
  plugin;
  constructor(plugin) {
    this.plugin = plugin;
  }
  /**
   * Parse _index.md and return all egg entries.
   * Each non-empty line should be in format: `file.md: description`
   * Lines starting with `#` are comments, skipped.
   */
  async getIndex() {
    const indexPath = this.plugin.settings.indexFile;
    const file = this.plugin.app.vault.getAbstractFileByPath(indexPath);
    if (!file) {
      console.warn(`[NutEgg] Index file not found: ${indexPath}`);
      return [];
    }
    const content = await this.plugin.app.vault.read(file);
    return this.parseIndexContent(content);
  }
  /**
   * Use AI to determine which egg files are relevant to the content.
   * Returns the matched index entries.
   */
  async matchEggs(content, index) {
    if (index.length === 0)
      return [];
    if (index.length === 1)
      return index;
    if (!isAIConfigured(this.plugin.settings)) {
      return [index[0]];
    }
    const indexText = index.map((e) => `- ${e.fileName}: ${e.description}`).join("\n");
    const promptTemplate = this.plugin.workflowManager?.getPrompt("eggRouting") || PROMPTS.eggRouting;
    const prompt = renderPrompt(promptTemplate, {
      title: content.title,
      url: content.url,
      content: this.truncate(content.content, 8e3),
      index: indexText
    });
    try {
      const response = await this.plugin.aiClient.chat(prompt, 800);
      return this.parseMatchedEggs(response, index);
    } catch (err) {
      console.warn("[NutEgg] Egg routing failed, falling back to all index entries:", err);
      return index;
    }
  }
  /**
   * Parse matching egg files from the AI routing response.
   * Tolerates JSON arrays, bullet points (- / *), numbering, backticks,
   * quotes, path prefixes (nutegg/file.md vs file.md), and conversational text.
   */
  parseMatchedEggs(response, index) {
    if (!response || !response.trim() || index.length === 0)
      return [];
    const text = response.trim();
    const isExplicitNone = /^\s*(\[\]|none|no\s+match|no\s+matching\s+eggs?)\.?\s*$/i.test(text);
    const entryMap = /* @__PURE__ */ new Map();
    for (const entry of index) {
      const full = entry.fileName.trim().toLowerCase();
      const base = entry.fileName.split("/").pop().trim().toLowerCase();
      const stem = base.replace(/\.md$/, "");
      entryMap.set(entry, { full, base, stem });
    }
    const matchedEntries = /* @__PURE__ */ new Set();
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const str = String(item).trim().toLowerCase();
            for (const [entry, names] of entryMap.entries()) {
              if (str === names.full || str === names.base || str.endsWith("/" + names.base)) {
                matchedEntries.add(entry);
              }
            }
          }
        }
      } catch {
      }
    }
    const mdMatches = text.match(/[\w\-./\\]+\.md\b/gi) || [];
    for (const rawMatch of mdMatches) {
      const clean = rawMatch.replace(/^[\\/]+/, "").trim().toLowerCase();
      for (const [entry, names] of entryMap.entries()) {
        if (clean === names.full || clean === names.base || clean.endsWith("/" + names.base)) {
          matchedEntries.add(entry);
        }
      }
    }
    const lines = text.split("\n");
    for (const rawLine of lines) {
      let line = rawLine.trim();
      if (!line)
        continue;
      line = line.replace(/^```[a-z]*\s*/i, "").replace(/```$/, "").replace(/^[\s*\-•+]+/, "").replace(/^\d+[.)]\s*/, "").replace(/^[`"']+|[`"']+$/g, "").replace(/[.:;,!?]+$/, "").trim().toLowerCase();
      if (!line)
        continue;
      for (const [entry, names] of entryMap.entries()) {
        if (line === names.full || line === names.base || line.endsWith("/" + names.base)) {
          matchedEntries.add(entry);
        }
      }
    }
    if (matchedEntries.size === 0 && !isExplicitNone) {
      for (const [entry, names] of entryMap.entries()) {
        const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const basePattern = new RegExp(`(^|[^a-z0-9_-])${escapeRegExp(names.base)}($|[^a-z0-9_-])`, "i");
        const fullPattern = new RegExp(`(^|[^a-z0-9_-])${escapeRegExp(names.full)}($|[^a-z0-9_-])`, "i");
        if (basePattern.test(text) || fullPattern.test(text)) {
          matchedEntries.add(entry);
        }
      }
    }
    return Array.from(matchedEntries);
  }
  /**
   * Get the full content of _index.md as a string, for passing to the main analysis prompt.
   */
  async getIndexContent() {
    const indexPath = this.plugin.settings.indexFile;
    const file = this.plugin.app.vault.getAbstractFileByPath(indexPath);
    if (!file)
      return "(No _index.md found)";
    return await this.plugin.app.vault.read(file);
  }
  parseIndexContent(content) {
    const entries = [];
    for (const rawLine of content.split("\n")) {
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(">"))
        continue;
      const line = trimmed.replace(/^[*\-+]\s+/, "");
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1)
        continue;
      const fileName = line.substring(0, colonIdx).trim();
      const description = line.substring(colonIdx + 1).trim();
      if (fileName.endsWith(".md")) {
        entries.push({ fileName, description });
      }
    }
    return entries;
  }
  truncate(text, maxChars) {
    if (text.length <= maxChars)
      return text;
    return text.substring(0, maxChars) + "\n\n[...truncated]";
  }
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
function makeFakePlugin(overrides = {}) {
  const { vault } = makeFakeVault(overrides.vaultFiles || {});
  return {
    settings: {
      aiApiKey: "test-key",
      rawFolder: "nutegg/_raw",
      indexFile: "nutegg/_index.md",
      serverPort: 27123,
      chunkWindowChars: 3e4,
      sectionGridSeconds: 300,
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

// tests/index-sync.test.ts
function makeSync(files, overrides = {}) {
  const store = makeFakeVault(files);
  const plugin = makeFakePlugin({ vault: store.vault, ...overrides });
  plugin.indexReader = overrides.indexReader || new IndexReader(plugin);
  plugin.eggParser = overrides.eggParser || new EggParser(plugin);
  if (overrides.aiProcessor)
    plugin.aiProcessor = overrides.aiProcessor;
  return { sync: new IndexSync(plugin), files: store.files, plugin };
}
var INDEX = [
  "# NutEgg Egg Index",
  "",
  "* nutegg/investment.md: investment strategies",
  "* nutegg/ai_ml.md: artificial intelligence",
  ""
].join("\n");
function egg(topic) {
  return [
    "---",
    `topic: "${topic}"`,
    'status: "active"',
    "---",
    "",
    "> [!abstract]- Instructions:",
    "> **Scope:** high-signal data",
    "",
    "# Knowledge",
    "",
    "# Unprocessed",
    ""
  ].join("\n");
}
(0, import_node_test.describe)("IndexSync.checkAndFix", () => {
  (0, import_node_test.it)("does not auto-append unindexed egg files or workflow files to _index.md", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": INDEX,
      "nutegg/investment.md": egg("Investment"),
      "nutegg/ai_ml.md": egg("AI/ML"),
      "nutegg/psychology.md": egg("Psychology"),
      "nutegg/_workflow/custom-prompt.md": "custom prompt"
    });
    const result = await sync.checkAndFix();
    import_strict.default.deepEqual(result.addedIndexEntries, []);
    import_strict.default.deepEqual(result.createdEggs, []);
    import_strict.default.deepEqual(result.prunedIndexEntries, []);
    import_strict.default.ok(!files.get("nutegg/_index.md").includes("psychology.md"));
    import_strict.default.ok(!files.get("nutegg/_index.md").includes("custom-prompt.md"));
    import_strict.default.ok(
      files.get("nutegg/_index.md").includes(
        "* nutegg/investment.md: investment strategies"
      )
    );
  });
  (0, import_node_test.it)("prunes invalid entries (workflow, raw, subdirectories, system files) from _index.md", async () => {
    const invalidIndex = [
      "# NutEgg Egg Index",
      "",
      "* nutegg/investment.md: investment strategies",
      "* nutegg/_workflow/custom.md: custom prompt",
      "* nutegg/_raw/raw.md: raw nut capture",
      "* nutegg/sub/deep.md: nested egg",
      "* nutegg/_index.md: index itself",
      "* nutegg/ai_ml.md: artificial intelligence",
      ""
    ].join("\n");
    const { sync, files } = makeSync({
      "nutegg/_index.md": invalidIndex,
      "nutegg/investment.md": egg("Investment"),
      "nutegg/ai_ml.md": egg("AI/ML")
    });
    const result = await sync.checkAndFix();
    import_strict.default.deepEqual(result.prunedIndexEntries, [
      "nutegg/_workflow/custom.md",
      "nutegg/_raw/raw.md",
      "nutegg/sub/deep.md",
      "nutegg/_index.md"
    ]);
    const updatedIndex = files.get("nutegg/_index.md");
    import_strict.default.ok(updatedIndex.includes("* nutegg/investment.md: investment strategies"));
    import_strict.default.ok(updatedIndex.includes("* nutegg/ai_ml.md: artificial intelligence"));
    import_strict.default.ok(!updatedIndex.includes("_workflow"));
    import_strict.default.ok(!updatedIndex.includes("_raw"));
    import_strict.default.ok(!updatedIndex.includes("sub/deep"));
    import_strict.default.ok(!updatedIndex.includes("* nutegg/_index.md"));
  });
  (0, import_node_test.it)("creates a missing egg file from the index description", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": INDEX,
      "nutegg/ai_ml.md": egg("AI/ML")
    });
    const result = await sync.checkAndFix();
    import_strict.default.deepEqual(result.createdEggs, ["nutegg/investment.md"]);
    const created = files.get("nutegg/investment.md");
    import_strict.default.ok(created.includes('topic: "investment strategies"'));
    import_strict.default.ok(created.includes("> **Scope:** investment strategies"));
    import_strict.default.ok(created.includes("# Knowledge"));
    import_strict.default.ok(created.includes("# Unprocessed"));
    import_strict.default.match(created, /last_updated: "\d{4}-\d{2}-\d{2}"/);
  });
  (0, import_node_test.it)("leaves a consistent vault untouched", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": INDEX,
      "nutegg/investment.md": egg("Investment"),
      "nutegg/ai_ml.md": egg("AI/ML")
    });
    const before = { ...Object.fromEntries(files) };
    const result = await sync.checkAndFix();
    import_strict.default.deepEqual(result, {
      addedIndexEntries: [],
      fixedIndexPaths: [],
      createdEggs: [],
      prunedIndexEntries: []
    });
    import_strict.default.deepEqual(Object.fromEntries(files), before);
  });
  (0, import_node_test.it)("upgrades relative index paths to the full vault path", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": "# index\n\n* investment.md: investment strategies\n",
      "nutegg/investment.md": egg("Investment")
    });
    const result = await sync.checkAndFix();
    import_strict.default.deepEqual(result.fixedIndexPaths, ["nutegg/investment.md"]);
    import_strict.default.deepEqual(result.createdEggs, [], "no duplicate egg created");
    const index = files.get("nutegg/_index.md");
    import_strict.default.ok(index.includes("* nutegg/investment.md: investment strategies"));
    import_strict.default.ok(!index.includes("* investment.md"));
  });
  (0, import_node_test.it)("createEgg builds the file from the description and adds the index entry", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": "* nutegg/investment.md: investment strategies\n",
      "nutegg/investment.md": egg("Investment")
    });
    const result = await sync.createEgg(
      "productivity",
      "productivity and systems"
    );
    import_strict.default.deepEqual(result, {
      path: "nutegg/productivity.md",
      alreadyExists: false,
      language: "English"
    });
    const created = files.get("nutegg/productivity.md");
    import_strict.default.ok(created.includes('topic: "productivity and systems"'));
    import_strict.default.ok(created.includes("> **Scope:** productivity and systems"));
    import_strict.default.ok(
      files.get("nutegg/_index.md").includes("* nutegg/productivity.md: productivity and systems")
    );
  });
  (0, import_node_test.it)("createEgg reports alreadyExists without overwriting", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": "",
      "nutegg/productivity.md": egg("P")
    });
    const result = await sync.createEgg("productivity", "x");
    import_strict.default.equal(result.alreadyExists, true);
    import_strict.default.ok(files.get("nutegg/productivity.md").includes('topic: "P"'));
  });
  (0, import_node_test.it)("createEgg supports Unicode Chinese name and description", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": ""
    });
    const result = await sync.createEgg("\u65B9\u6CD5\u8BBA", "\u4ECB\u7ECD\u505A\u4E8B\u7684\u5177\u4F53\u65B9\u6CD5");
    import_strict.default.deepEqual(result, {
      path: "nutegg/\u65B9\u6CD5\u8BBA.md",
      alreadyExists: false,
      language: "English"
    });
    const created = files.get("nutegg/\u65B9\u6CD5\u8BBA.md");
    import_strict.default.ok(created.includes('topic: "\u4ECB\u7ECD\u505A\u4E8B\u7684\u5177\u4F53\u65B9\u6CD5"'));
    import_strict.default.ok(created.includes("> **Scope:** \u4ECB\u7ECD\u505A\u4E8B\u7684\u5177\u4F53\u65B9\u6CD5"));
    import_strict.default.ok(created.includes('language: "English"'));
    import_strict.default.ok(
      files.get("nutegg/_index.md").includes("* nutegg/\u65B9\u6CD5\u8BBA.md: \u4ECB\u7ECD\u505A\u4E8B\u7684\u5177\u4F53\u65B9\u6CD5")
    );
  });
  (0, import_node_test.it)("createEgg uses localizeEggTemplate when available", async () => {
    let calledWith = null;
    const { sync, files } = makeSync(
      { "nutegg/_index.md": "" },
      {
        aiProcessor: {
          localizeEggTemplate: async (tpl, desc) => {
            calledWith = [tpl, desc];
            return tpl.replace("> **Scope:**", "> **Scope:** Localized");
          }
        }
      }
    );
    const result = await sync.createEgg("ai_egg", "artificial intelligence");
    import_strict.default.ok(calledWith);
    import_strict.default.equal(calledWith[1], "artificial intelligence");
    import_strict.default.ok(calledWith[0].includes("artificial intelligence"));
    const created = files.get("nutegg/ai_egg.md");
    import_strict.default.ok(created.includes("Localized"));
    import_strict.default.ok(created.includes("# Knowledge"));
    import_strict.default.equal(result.language, "English");
  });
  (0, import_node_test.it)("createEgg captures language from localized egg output", async () => {
    const { sync, files } = makeSync(
      { "nutegg/_index.md": "" },
      {
        aiProcessor: {
          localizeEggTemplate: async (tpl) => {
            return {
              content: tpl.replace('language: "English"', 'language: "Chinese"').replace("> **Scope:**", "> **Scope:** Localized Scope"),
              language: "Chinese"
            };
          }
        }
      }
    );
    const result = await sync.createEgg("zh_egg", "\u4ECB\u7ECD\u505A\u4E8B\u7684\u5177\u4F53\u65B9\u6CD5");
    import_strict.default.equal(result.language, "Chinese");
    const created = files.get("nutegg/zh_egg.md");
    import_strict.default.ok(created.includes('language: "Chinese"'));
  });
  (0, import_node_test.it)("does nothing when _index.md is missing", async () => {
    const { sync, files } = makeSync({ "nutegg/eg.md": egg("EG") });
    const result = await sync.checkAndFix();
    import_strict.default.deepEqual(result, {
      addedIndexEntries: [],
      fixedIndexPaths: [],
      createdEggs: [],
      prunedIndexEntries: []
    });
    import_strict.default.deepEqual([...files.keys()], ["nutegg/eg.md"]);
  });
});
(0, import_node_test.describe)("isEggPath", () => {
  (0, import_node_test.it)("allows valid direct egg files under nutegg/", () => {
    import_strict.default.equal(isEggPath("nutegg/investment.md"), true);
    import_strict.default.equal(isEggPath("nutegg/ai_ml.md"), true);
    import_strict.default.equal(isEggPath("nutegg/my-egg.md"), true);
  });
  (0, import_node_test.it)("rejects system files and directories", () => {
    import_strict.default.equal(isEggPath("nutegg/_index.md"), false);
    import_strict.default.equal(isEggPath("nutegg/_template.md"), false);
    import_strict.default.equal(isEggPath("nutegg/_workflow/content-analysis.md"), false);
    import_strict.default.equal(isEggPath("nutegg/_raw/article.md"), false);
    import_strict.default.equal(isEggPath("nutegg/_backup/old.md"), false);
  });
  (0, import_node_test.it)("rejects subdirectories (only direct files under nutegg/ are eggs)", () => {
    import_strict.default.equal(isEggPath("nutegg/tech/react.md"), false);
    import_strict.default.equal(isEggPath("nutegg/sub/nested.md"), false);
  });
  (0, import_node_test.it)("rejects non-markdown files and files outside vault folder", () => {
    import_strict.default.equal(isEggPath("nutegg/data.json"), false);
    import_strict.default.equal(isEggPath("outside/investment.md"), false);
    import_strict.default.equal(isEggPath("investment.md"), false);
  });
});
(0, import_node_test.describe)("matchesEggFormat", () => {
  (0, import_node_test.it)("matches egg frontmatter with topic", () => {
    import_strict.default.equal(
      matchesEggFormat('---\ntopic: "AI Research"\nstatus: "active"\n---\n# Content'),
      true
    );
  });
  (0, import_node_test.it)("matches canonical egg headings and callouts", () => {
    import_strict.default.equal(matchesEggFormat("# Knowledge\n- Some point"), true);
    import_strict.default.equal(matchesEggFormat("# Unprocessed\n- Some entry"), true);
    import_strict.default.equal(matchesEggFormat("> [!abstract]- Instructions:"), true);
  });
  (0, import_node_test.it)("rejects regular non-egg markdown notes", () => {
    import_strict.default.equal(matchesEggFormat("# Shopping List\n- Milk\n- Bread"), false);
    import_strict.default.equal(matchesEggFormat("Just a plain note without egg structure"), false);
    import_strict.default.equal(matchesEggFormat(""), false);
  });
});
(0, import_node_test.describe)("IndexSync diffs & event-driven operations", () => {
  (0, import_node_test.it)("computes getDiffStatus accurately", async () => {
    const { sync } = makeSync({
      "nutegg/_index.md": [
        "# Index",
        "* nutegg/investment.md: investment",
        "* nutegg/missing.md: missing egg file",
        "* nutegg/_workflow/prompt.md: invalid entry"
      ].join("\n"),
      "nutegg/investment.md": egg("Investment"),
      "nutegg/unindexed.md": egg("Unindexed")
    });
    const status = await sync.getDiffStatus();
    import_strict.default.equal(status.totalDiffs, 3);
    import_strict.default.deepEqual(status.missingEggs, ["nutegg/missing.md"]);
    import_strict.default.deepEqual(status.unindexedEggs, ["nutegg/unindexed.md"]);
    import_strict.default.deepEqual(status.invalidEntries, ["nutegg/_workflow/prompt.md"]);
  });
  (0, import_node_test.it)("sync() resolves all diffs and reports 0 diffs afterwards", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": [
        "# Index",
        "* nutegg/investment.md: investment",
        "* nutegg/missing.md: missing egg file",
        "* nutegg/_workflow/prompt.md: invalid entry"
      ].join("\n"),
      "nutegg/investment.md": egg("Investment"),
      "nutegg/unindexed.md": egg("Unindexed Topic")
    });
    const res = await sync.sync();
    import_strict.default.deepEqual(res.createdEggs, ["nutegg/missing.md"]);
    import_strict.default.deepEqual(res.addedIndexEntries, ["nutegg/unindexed.md"]);
    import_strict.default.deepEqual(res.prunedIndexEntries, ["nutegg/_workflow/prompt.md"]);
    const indexText = files.get("nutegg/_index.md");
    import_strict.default.ok(indexText.includes("* nutegg/investment.md"));
    import_strict.default.ok(indexText.includes("* nutegg/missing.md"));
    import_strict.default.ok(indexText.includes("* nutegg/unindexed.md"));
    import_strict.default.ok(!indexText.includes("_workflow"));
    const statusAfter = await sync.getDiffStatus();
    import_strict.default.equal(statusAfter.totalDiffs, 0);
  });
  (0, import_node_test.it)("onEggFileDeleted removes the entry from _index.md", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": [
        "# Index",
        "* nutegg/investment.md: investment",
        "* nutegg/ai_ml.md: artificial intelligence"
      ].join("\n"),
      "nutegg/investment.md": egg("Investment"),
      "nutegg/ai_ml.md": egg("AI/ML")
    });
    await sync.onEggFileDeleted("nutegg/ai_ml.md");
    const indexText = files.get("nutegg/_index.md");
    import_strict.default.ok(indexText.includes("investment.md"));
    import_strict.default.ok(!indexText.includes("ai_ml.md"));
  });
  (0, import_node_test.it)("onEggFileCreated does not auto-edit _index.md", async () => {
    let notified = false;
    const { sync, files } = makeSync({
      "nutegg/_index.md": "* nutegg/investment.md: investment\n",
      "nutegg/investment.md": egg("Investment"),
      "nutegg/crypto.md": egg("Cryptocurrency"),
      "nutegg/groceries.md": "# Groceries\n- apples"
    });
    sync.onDiffChanged(() => {
      notified = true;
    });
    await sync.onEggFileCreated({ path: "nutegg/crypto.md" });
    import_strict.default.equal(files.get("nutegg/_index.md"), "* nutegg/investment.md: investment\n");
    import_strict.default.equal(notified, true);
  });
  (0, import_node_test.it)("onEggFileRenamed updates path in _index.md", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": "* nutegg/old_name.md: my topic\n",
      "nutegg/new_name.md": egg("my topic")
    });
    await sync.onEggFileRenamed("nutegg/old_name.md", "nutegg/new_name.md");
    const indexText = files.get("nutegg/_index.md");
    import_strict.default.ok(indexText.includes("* nutegg/new_name.md: my topic"));
    import_strict.default.ok(!indexText.includes("old_name.md"));
  });
  (0, import_node_test.it)("onDirectIndexEdit does not auto-create template until sync is triggered", async () => {
    let diffNotified = false;
    const { sync, files } = makeSync({
      "nutegg/_index.md": "* nutegg/new_topic.md: brand new subject\n"
    });
    sync.onDiffChanged(() => {
      diffNotified = true;
    });
    await sync.onDirectIndexEdit();
    import_strict.default.equal(files.has("nutegg/new_topic.md"), false);
    import_strict.default.equal(diffNotified, true);
    const syncRes = await sync.sync();
    import_strict.default.ok(syncRes.createdEggs.includes("nutegg/new_topic.md"));
    import_strict.default.ok(files.has("nutegg/new_topic.md"));
    const created = files.get("nutegg/new_topic.md");
    import_strict.default.ok(created.includes('topic: "brand new subject"'));
  });
  (0, import_node_test.it)("sync creates localized egg file when index description is provided and AI is available", async () => {
    const { sync, files } = makeSync(
      {
        "nutegg/_index.md": "* nutegg/china_history.md: \u4E2D\u56FD\u53E4\u4EE3\u53F2\u4E0E\u671D\u4EE3\u6F14\u53D8\n"
      },
      {
        aiProcessor: {
          localizeEggTemplate: async (tpl) => {
            return {
              content: tpl.replace('language: "English"', 'language: "Chinese"').replace("> **Scope:**", "> **Scope:** localized"),
              language: "Chinese"
            };
          }
        }
      }
    );
    await sync.sync();
    import_strict.default.ok(files.has("nutegg/china_history.md"));
    const created = files.get("nutegg/china_history.md");
    import_strict.default.ok(created.includes('language: "Chinese"'));
    import_strict.default.ok(created.includes("> **Scope:** localized"));
  });
});
