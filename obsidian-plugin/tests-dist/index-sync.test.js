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

// src/templates/egg.md
var egg_default = `---
topic: "Unknown"
status: "active"
last_updated: "2026-08-14"
---

> [!abstract]- Instructions:
> **Scope:** Capture high-signal, paradigm-shifting concepts, universally applicable frameworks, and novel data that hold significant strategic value but fall strictly outside established domain-specific routing.
>
> **Action Guide:**
> 1. Title Verdict: Provide a single, direct sentence that resolves the core question posed in the title or introduction.
> 2. Core Summary: Summarize the main concepts in plain language using a maximum of 3 bullet points.
> 3. Chapter Map (Long-form only): If the content is a long article or lengthy video, provide a brief 1-sentence summary for each major section or topic shift. If it is short, omit this step entirely.
> 4. Novel Delta: Extract only genuinely new, substantive insights or ideas not already captured in the existing knowledge files. State "None" if the content is entirely redundant.
> 5. Decide: should the user spend time reading this fully? Consider the egg's reject criteria if any are specified. If the content is repetitive, basic, or doesn't add new insight, answer false.
>
> **Key Questions:**
> 1. what new insights does this add?
> 2. Identify any conflicts between this new data and the existing knowledge base.
>
> **Rejection Criteria:**
> - Ignore content that repeats existing knowledge
>
> **Formatting Rules:** 
> - Each new entry contains: the insight itself, plus concrete examples from the content (if any) as indented sub-bullets. Author and source are appended automatically.
> - New entries are added to the "## Unprocessed" section first and are merged into the knowledge tree automatically once 20+ accumulate.
> - When merging: respect the existing knowledge tree. Locate the most relevant parent concept in the document and append the new information beneath it as nested sub-bullets. Do not break the existing hierarchy.


## Knowledge


## Unprocessed
`;

// src/defaults.ts
var EGG_TEMPLATE = egg_default;

// src/index-sync.ts
var IndexSync = class {
  plugin;
  constructor(plugin) {
    this.plugin = plugin;
  }
  async checkAndFix() {
    const result = {
      addedIndexEntries: [],
      fixedIndexPaths: [],
      createdEggs: []
    };
    const eggFiles = this.plugin.app.vault.getMarkdownFiles().filter(
      (f) => f.path.startsWith("nutegg/") && !f.path.startsWith(this.plugin.settings.rawFolder) && !f.path.endsWith("/_index.md")
    ).map((f) => f.path);
    const indexContent = await this.plugin.indexReader.getIndexContent();
    if (indexContent === "(No _index.md found)") {
      return result;
    }
    const entries = this.plugin.indexReader.parseIndexContent(indexContent);
    const norm = (p) => p.startsWith("nutegg/") ? p : `nutegg/${p.replace(/^\/+/, "")}`;
    const byPath = new Map(entries.map((e) => [norm(e.fileName), e]));
    const indexFile = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.settings.indexFile
    );
    for (const eggPath of eggFiles) {
      const entry = byPath.get(eggPath);
      if (!entry) {
        const description = await this.describeEgg(eggPath);
        await this.appendIndexEntry(indexFile, eggPath, description);
        result.addedIndexEntries.push(eggPath);
      } else if (entry.fileName !== eggPath) {
        await this.rewriteIndexPath(indexFile, entry.fileName, eggPath);
        result.fixedIndexPaths.push(eggPath);
      }
    }
    const present = new Set(eggFiles);
    for (const entry of entries) {
      const target = norm(entry.fileName);
      if (present.has(target))
        continue;
      if (await this.plugin.app.vault.adapter.exists(entry.fileName))
        continue;
      await this.createEggFromTemplate(target, entry);
      if (target !== entry.fileName) {
        await this.rewriteIndexPath(indexFile, entry.fileName, target);
        result.fixedIndexPaths.push(target);
      }
      result.createdEggs.push(target);
    }
    if (result.addedIndexEntries.length || result.fixedIndexPaths.length || result.createdEggs.length) {
      console.log(
        `[NutEgg] Index sync: +${result.addedIndexEntries.length} index entries, ~${result.fixedIndexPaths.length} paths fixed, +${result.createdEggs.length} egg files created`
      );
    }
    return result;
  }
  /**
   * Create a new egg file from a name + description (the popup's "no egg
   * matched — create one?" flow). Seeds the template's topic/scope from the
   * description and appends the matching _index.md entry. `alreadyExists`
   * when the file was already there (nothing is overwritten).
   */
  async createEgg(name, description) {
    const fileName = `nutegg/${name}.md`;
    if (await this.plugin.app.vault.adapter.exists(fileName)) {
      return { path: fileName, alreadyExists: true };
    }
    await this.createEggFromTemplate(fileName, { fileName, description });
    const indexFile = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.settings.indexFile
    );
    await this.appendIndexEntry(indexFile, fileName, description || name);
    return { path: fileName, alreadyExists: false };
  }
  /** Description for a new index entry — the egg's frontmatter topic, or "". */
  async describeEgg(eggPath) {
    try {
      const egg2 = await this.plugin.eggParser.readEgg(eggPath);
      return egg2?.topic && egg2.topic !== "Unknown" ? egg2.topic : "";
    } catch {
      return "";
    }
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
   * entry's description (topic + scope).
   */
  async createEggFromTemplate(targetPath, entry) {
    await this.ensureParentFolders(targetPath);
    const fallbackTopic = targetPath.replace(/^nutegg\//, "").replace(/\.md$/, "");
    const topic = (entry.description || fallbackTopic).trim();
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
      `last_updated: "${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}"`
    );
    await this.plugin.app.vault.create(targetPath, content);
    console.log(`[NutEgg] Created egg from index entry: ${targetPath}`);
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

// src/prompts/content-analysis.md
var content_analysis_default = `You are a knowledge curator. Analyze the content below following this Action Guide.

## Action Guide
{{action_guide}}

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{part_note}}{{chapters}}
{{sections}}{{questions}}
{{egg_key_questions}}

{{content}}

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
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

IMPORTANT:
- Grounding: {{grounding_rule}}
- titleVerdict must be a single sentence.
- coreSummary: at most 3 bullets, plain language.
- isLongForm: true only for long articles/videos that meaningfully benefit from a chapter map.
- chapterMap: empty array when isLongForm is false. When video chapters are provided, keep their exact timestamps and titles, and only add your 1-sentence summary.
- chapterMap when Video Sections are listed above: return EXACTLY one entry per listed section, using the section's start time as "time" \u2014 give each a short title and a 1-sentence summary of what happens between that section and the next.
- chapterMap when NO chapters or sections were provided: empty array (the content is not a timestamped video).
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to an Egg Key Question above or to another user question \u2014 answer it only once.
`;

// src/prompts/egg-analysis.md
var egg_analysis_default = `You are a knowledge curator for the egg file "{{egg_file}}". Analyze the content below against this egg's instructions.

## Egg Instructions
{{egg_instructions}}

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{part_note}}

{{content}}

## Task
1. Answer each Key Question (if any) directly and concisely. Grounding: {{grounding_rule}}
2. Novel Delta: identify genuinely NEW insights vs the Current Knowledge AND the Unprocessed entries. If the content is entirely redundant, return an empty array.
3. Apply the Rejection Criteria \u2014 if the content should be rejected, set rejected to true and give a one-line reason.
4. Decide: should the user spend time reading/watching this fully? Consider the reject criteria and whether it adds new insight.

For each Novel Delta entry:
- "parent": the EXACT text of the existing bullet or heading in the Current Knowledge tree that best fits the new information \u2014 used as a suggestion when the entry is merged into the tree later. Use "" if no suitable parent exists.
- "content": ONE insight per entry, as a single top-level bullet with optional indented sub-bullets. Include concrete examples from the content that illustrate the insight (e.g. "  - \u{1F3AF} Example: ...") when present. Follow the Formatting Rules. Do NOT include author or source \u2014 they are appended automatically.

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "keyQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ],
  "novelDelta": [
    {"parent": "exact anchor text from the knowledge tree", "content": "- nested bullet\\n  - sub bullet"}
  ],
  "rejected": false,
  "rejectReason": "",
  "readVerdict": true,
  "readVerdictReason": "one-line reason"
}
`;

// src/prompts/egg-combined.md
var egg_combined_default = `You are a knowledge curator for the egg file "{{egg_file}}". Analyze the content below against this egg's instructions.

## Egg Instructions
{{egg_instructions}}

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{part_note}}{{chapters}}
{{sections}}{{questions}}

{{content}}

## Task
Follow the Action Guide steps, answer the Key Questions, answer the User Questions, and extract the Novel Delta against the Current Knowledge.

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2", "bullet 3"],
  "isLongForm": true,
  "chapterMap": [
    {"time": "00:12:34", "title": "chapter title", "summary": "one sentence"}
  ],
  "keyQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ],
  "customQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ],
  "novelDelta": [
    {"parent": "exact anchor text from the knowledge tree", "content": "- nested bullet\\n  - sub bullet"}
  ],
  "rejected": false,
  "rejectReason": "",
  "readVerdict": true,
  "readVerdictReason": "one-line reason"
}

IMPORTANT:
- Grounding: {{grounding_rule}}
- coreSummary: at most 3 bullets. chapterMap: empty array when isLongForm is false; keep exact timestamps from the video chapters when provided. When Video Sections are listed above, return EXACTLY one chapterMap entry per listed section, using the section's start time as "time" \u2014 give each a short title and a 1-sentence summary of what happens between that section and the next.
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to the egg's Key Questions above or to another user question \u2014 answer it only once.
- For each Novel Delta entry: "parent" is the EXACT text of the existing bullet or heading it best fits under ("" if none) \u2014 a suggestion used when the entry is merged into the tree later. "content" is ONE insight per entry: a single top-level bullet, plus concrete examples from the content as indented sub-bullets (e.g. "  - \u{1F3AF} Example: ...") when present. Follow the Formatting Rules. Do NOT include author or source \u2014 they are appended automatically.
- Novel Delta must be genuinely NEW vs the Current Knowledge AND the Unprocessed entries.
- Apply the Rejection Criteria strictly \u2014 set rejected to true when the content is noise for this egg.
`;

// src/prompts/follow-up.md
var follow_up_default = `You are a knowledge curator. Answer the user's follow-up questions about this content.

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{prior_qa}}

{{content}}

## New Questions (answer each directly and concisely)
{{questions}}

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "answers": [
    {"question": "exact question text", "answer": "direct answer"}
  ]
}

IMPORTANT:
- One entry per question, in the same order.
- Grounding: {{grounding_rule}}
- If a question is equivalent to one in Previous Questions & Answers, answer briefly with the same conclusion instead of repeating it.
`;

// src/prompts/egg-routing.md
var egg_routing_default = 'Given this content and egg index, which egg file(s) does this content belong to? Return ONLY the file names, one per line. If none match, return "none".\n\n## Content\nTitle: {{title}}\nURL: {{url}}\n{{content}}\n\n## Egg Index\n{{index}}\n\nReturn matching file names (one per line):\n';

// src/prompts/action-guide-default.md
var action_guide_default_default = "1. Title Verdict: Provide a single, direct sentence that resolves the core question posed in the title or introduction.\n2. Core Summary: Summarize the main concepts in plain language using a maximum of 3 bullet points.\n3. Chapter Map (Long-form only): If the content is a long article or lengthy video, provide a brief 1-sentence summary for each major section or topic shift. If it is short, omit this step entirely.\n";

// src/prompts/merge-unprocessed.md
var merge_unprocessed_default = `You are a knowledge curator for the egg file "{{egg_file}}". The Unprocessed section has accumulated {{unprocessed_count}} entries \u2014 merge them into the knowledge tree below.

## Formatting Rules
{{formatting_rules}}

## Existing Knowledge Tree
{{knowledge_tree}}

## Unprocessed Entries
{{unprocessed}}

## Task
1. PRESERVE the existing tree structure as much as possible: do not rename, restructure, or delete existing branches \u2014 the user may have edited them by hand.
2. Nest each unprocessed entry under the most relevant existing concept as sub-bullets.
3. Only when an entry matches no existing concept, create a new minimal top-level branch for it.
4. Keep each entry's insight, concrete examples, and its _author/_source lines intact when moving it into the tree.
5. If an entry duplicates existing knowledge, drop it entirely.
6. If an entry cannot be merged meaningfully, leave it in the "unprocessed" output.

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "knowledge": "the COMPLETE updated Knowledge section content as markdown \u2014 the existing tree with the merged entries nested in",
  "unprocessed": "the entries that could not be merged (markdown), or an empty string when all were merged"
}
`;

// src/prompts/aggregate-content.md
var aggregate_content_default = `You are a knowledge curator. The content below was too long for one pass and was analyzed in parts. Combine the per-part results into ONE coherent result for the whole content.

## Content
**Title:** {{title}}
**Source:** {{url}}

## Per-Part Summaries
{{chunk_summaries}}

{{questions}}

## Task
1. Title Verdict: answer the question posed in the title (or intro) in a single direct sentence, drawing on ALL parts.
2. Core Summary: at most 3 plain-language bullets covering the WHOLE content, not just one part.
3. Answer each User Question directly and concisely. Grounding: {{grounding_rule}}

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2"],
  "customQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ]
}

IMPORTANT:
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none).
- Grounding: {{grounding_rule}}
`;

// src/prompts/aggregate-egg.md
var aggregate_egg_default = 'You are a knowledge curator for the egg file "{{egg_file}}". The content was too long for one pass and was analyzed against this egg in parts. Decide for the content AS A WHOLE.\n\n## Egg Instructions\n{{egg_instructions}}\n\n## Per-Part Findings\n{{chunk_findings}}\n\n## Task\n1. Answer each Key Question (if any) for the whole content, directly and concisely. Grounding: {{grounding_rule}}\n2. Apply the Rejection Criteria to the whole content \u2014 set rejected to true with a one-line reason when it is noise for this egg.\n3. Decide: should the user spend time reading/watching this fully? Consider the reject criteria and whether the parts together add new insight.\n\nRespond in this EXACT JSON format (no markdown, no code fence, just the JSON object):\n{\n  "keyQuestionAnswers": [\n    {"question": "exact question text", "answer": "direct answer"}\n  ],\n  "rejected": false,\n  "rejectReason": "",\n  "readVerdict": true,\n  "readVerdictReason": "one-line reason"\n}\n';

// src/prompts/suggest-egg.md
var suggest_egg_default = 'You are a knowledge curator. The content below matched no existing egg (knowledge file). Suggest a new egg to capture content like this.\n\n## Content\n**Title:** {{title}}\n**Source:** {{url}}\n\n## What the content is about\n{{summary}}\n\n## Task\nSuggest a short snake_case egg name (2-4 words, e.g. "productivity" or "quant_finance") and a one-line description of what this egg captures (used as its routing description).\n\nRespond in this EXACT JSON format (no markdown, no code fence, just the JSON object):\n{\n  "name": "snake_case_name",\n  "description": "one line description"\n}\n';

// src/prompt-templates.ts
var PROMPTS = {
  /** Phase 1 — content summary + chapter map + custom question answers. */
  contentAnalysis: content_analysis_default,
  /** Phase 2 — content against one egg (key questions, delta, reject, verdict). */
  eggAnalysis: egg_analysis_default,
  /** Single-egg combined call (phases 1 + 2 in one prompt). */
  eggCombined: egg_combined_default,
  /** Follow-up questions after the initial analysis. */
  followUp: follow_up_default,
  /** Egg routing — match content to egg files from _index.md. */
  eggRouting: egg_routing_default,
  /** Default Action Guide when no egg provides one. */
  actionGuideDefault: action_guide_default_default.trim(),
  /** Merge 20+ Unprocessed entries into the Knowledge tree. */
  mergeUnprocessed: merge_unprocessed_default,
  /** Combine per-part results into one result for long content. */
  aggregateContent: aggregate_content_default,
  /** Per-egg verdict + key questions for long content (after per-part delta). */
  aggregateEgg: aggregate_egg_default,
  /** Suggest a new egg for content that matched no existing egg. */
  suggestEgg: suggest_egg_default
};
function renderPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = vars[key];
    return value === void 0 ? "" : String(value);
  });
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
    if (!this.plugin.settings.aiApiKey) {
      return [index[0]];
    }
    const indexText = index.map((e) => `- ${e.fileName}: ${e.description}`).join("\n");
    const prompt = renderPrompt(PROMPTS.eggRouting, {
      title: content.title,
      url: content.url,
      content: this.truncate(content.content, 2e3),
      index: indexText
    });
    try {
      const response = await this.plugin.aiClient.chat(prompt, 100);
      const matchedNames = response.split("\n").map((line) => line.trim()).filter((line) => line.endsWith(".md"));
      if (matchedNames.length === 0)
        return [];
      return index.filter(
        (e) => matchedNames.some((name) => name === e.fileName)
      );
    } catch {
      return index;
    }
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
      const egg2 = await this.readEgg(entry.fileName);
      if (egg2)
        eggs.push(egg2);
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
      result.knowledge = this.sectionBody(lines, knowledgeSection);
    }
    const unprocessedSection = this.findSection(lines, "unprocessed");
    if (unprocessedSection) {
      result.unprocessed = this.sectionBody(lines, unprocessedSection);
    }
    return result;
  }
  /**
   * Section content without the surrounding blank lines. Indentation of the
   * first line is preserved (unlike trim()) so re-indented sections survive.
   */
  sectionBody(lines, section) {
    return lines.slice(section.start + 1, section.end).join("\n").replace(/^\n+|\n+$/g, "");
  }
  /** Format one egg's instructions + knowledge for an AI prompt. */
  formatEggForPrompt(egg2) {
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
    parts.push(
      `**Current Knowledge:**
${egg2.knowledge || "(empty)"}`
    );
    if (egg2.unprocessed.trim()) {
      parts.push(
        `**Unprocessed (pending merge):**
${egg2.unprocessed}`
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
      lines.push("", "## Unprocessed", "", block);
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
      lines = [...lines, "", "## Knowledge", "", ...knowledge.trim().split("\n")];
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
      lines = [...lines, "", "## Unprocessed", "", ...remainder.split("\n")];
    }
    await this.plugin.app.vault.modify(file, lines.join("\n") + "\n");
    console.log(`[NutEgg] Merged knowledge tree in ${fileName}`);
  }
  /**
   * Locate a `## Name`-style section: `{start, level, end}`. `end` is the
   * index of the next heading of the same-or-higher level (or lines.length).
   * Returns null when the heading doesn't exist.
   */
  findSection(lines, name) {
    const start = lines.findIndex((l) => {
      const m = l.trim().match(/^(#{1,6})\s*(.*)$/);
      return m !== null && m[2].trim().toLowerCase() === name.toLowerCase();
    });
    if (start === -1)
      return null;
    const level = (lines[start].match(/^#+/) || [""])[0].length;
    const end = lines.findIndex((l, i) => {
      if (i <= start)
        return false;
      const m = l.trim().match(/^(#{1,6})\s/);
      return m !== null && m[1].length <= level;
    });
    return { start, level, end: end === -1 ? lines.length : end };
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

// tests/index-sync.test.ts
function makeSync(files) {
  const store = makeFakeVault(files);
  const plugin = makeFakePlugin({ vault: store.vault });
  plugin.indexReader = new IndexReader(plugin);
  plugin.eggParser = new EggParser(plugin);
  return { sync: new IndexSync(plugin), files: store.files };
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
    "## Knowledge",
    "",
    "## Unprocessed",
    ""
  ].join("\n");
}
(0, import_node_test.describe)("IndexSync.checkAndFix", () => {
  (0, import_node_test.it)("appends an index entry for an egg file that isn't indexed", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": INDEX,
      "nutegg/investment.md": egg("Investment"),
      "nutegg/psychology.md": egg("Psychology")
    });
    const result = await sync.checkAndFix();
    import_strict.default.deepEqual(result.addedIndexEntries, ["nutegg/psychology.md"]);
    import_strict.default.ok(
      files.get("nutegg/_index.md").includes(
        "* nutegg/psychology.md: Psychology"
      )
    );
    import_strict.default.ok(
      files.get("nutegg/_index.md").includes(
        "* nutegg/investment.md: investment strategies"
      )
    );
  });
  (0, import_node_test.it)("appends a bare entry (no description) for an egg without a topic", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": INDEX,
      "nutegg/investment.md": egg("Investment"),
      "nutegg/x.md": "## Knowledge\n"
    });
    await sync.checkAndFix();
    import_strict.default.ok(files.get("nutegg/_index.md").includes("* nutegg/x.md\n"));
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
    import_strict.default.ok(created.includes("## Knowledge"));
    import_strict.default.ok(created.includes("## Unprocessed"));
    import_strict.default.match(created, /last_updated: "\d{4}-\d{2}-\d{2}"/);
  });
  (0, import_node_test.it)("creates nested egg files (missing parent folder)", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": "* nutegg/sub/deep.md: deep topics\n"
    });
    await sync.checkAndFix();
    import_strict.default.ok(files.has("nutegg/sub/deep.md"));
    import_strict.default.ok(files.get("nutegg/sub/deep.md").includes('topic: "deep topics"'));
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
      createdEggs: []
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
      alreadyExists: false
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
  (0, import_node_test.it)("does nothing when _index.md is missing", async () => {
    const { sync, files } = makeSync({ "nutegg/eg.md": egg("EG") });
    const result = await sync.checkAndFix();
    import_strict.default.deepEqual(result, {
      addedIndexEntries: [],
      fixedIndexPaths: [],
      createdEggs: []
    });
    import_strict.default.deepEqual([...files.keys()], ["nutegg/eg.md"]);
  });
});
