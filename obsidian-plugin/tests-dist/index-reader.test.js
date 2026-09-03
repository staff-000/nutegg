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

// tests/index-reader.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));

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
1. Answer each Key Question (if any) directly and concisely based on the content. Grounding: {{grounding_rule}}
2. Extract Knowledge Entries: extract all substantive insights, concepts, frameworks, and findings from the content that fall within this egg's Scope, formatted strictly per the Formatting Rules:
   - Follow the concept \u2192 explanation \u2192 example structure: one top-level bullet "- [tag] **Concept**: short phrases" (without "[tag] " when the egg defines no tags), with the explanation as one indented sub-bullet and concrete examples from the content as further indented sub-bullets ("  - \u{1F3AF} Example: ...") when present. Name each Concept clearly.
   - Structured enumerations / frameworks (numbered lists, step-by-step methods, named frameworks): capture as ONE complete entry preserving EVERY item in order. Never summarize items away, never truncate.
   - Do NOT include author or source \u2014 they are appended automatically.

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "keyQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ],
  "extractedEntries": [
    {"kind": "insight", "content": "- [tag] **Concept**: short phrases\\n  - explanation\\n  - \u{1F3AF} Example: ..."}
  ]
}

IMPORTANT:
- Grounding: {{grounding_rule}}
- extractedEntries: empty array if the content contains no substantive knowledge matching this egg's scope. "kind" is "insight" (default) or "list" (for structured enumerations).
`;

// src/prompts/egg-combined.md
var egg_combined_default = `You are a knowledge curator for the egg file "{{egg_file}}". Analyze the content below according to this egg's instructions.

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
1. Follow the Action Guide:
   - titleVerdict: provide a single, direct sentence resolving the core question in the title or intro.
   - coreSummary: summarize the main concepts in plain language using at most 3 bullet points.
   - chapterMap: timestamped breakdown for long-form / video content. Empty array if not long-form.
2. Answer Key Questions: answer each Key Question from the egg instructions directly and concisely based on the content. Grounding: {{grounding_rule}}
3. Answer User Questions: answer any custom user questions directly and concisely.
4. Extract Knowledge Entries: extract all substantive insights, concepts, frameworks, and actionable knowledge from the content that fall within the egg's Scope, formatted strictly per the egg's Formatting Rules:
   - Follow the concept \u2192 explanation \u2192 example structure: one top-level bullet "- [tag] **Concept**: short phrases" (without "[tag] " when the egg defines no tags), with the explanation as one indented sub-bullet and concrete examples from the content as further indented sub-bullets ("  - \u{1F3AF} Example: ...") when present. Name each Concept clearly.
   - Structured enumerations / frameworks (numbered lists, step-by-step methods, named frameworks): capture as ONE complete entry preserving EVERY item in order. Never summarize items away, never truncate.
   - Do NOT include author or source \u2014 they are appended automatically.

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
  "extractedEntries": [
    {"kind": "insight", "content": "- [tag] **Concept**: short phrases\\n  - explanation\\n  - \u{1F3AF} Example: ..."}
  ]
}

IMPORTANT:
- Grounding: {{grounding_rule}}
- coreSummary: at most 3 bullets. chapterMap: empty array when isLongForm is false; keep exact timestamps from the video chapters when provided. When Video Sections are listed above, return EXACTLY one chapterMap entry per listed section, using the section's start time as "time" \u2014 give each a short title and a 1-sentence summary of what happens between that section and the next.
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to the egg's Key Questions above or to another user question \u2014 answer it only once.
- extractedEntries: empty array if the content contains no substantive knowledge matching this egg's scope. "kind" is "insight" (default) or "list" (for structured enumerations).
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

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "knowledge": "the COMPLETE updated Knowledge section content as markdown \u2014 the existing tree with the merged entries nested in. Only the section BODY: do NOT include the '# Knowledge' heading line itself.",
  "unprocessed": "the entries that could not be merged (markdown), or an empty string when all were merged. Only the section BODY: do NOT include the '# Unprocessed' heading line itself."
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
var aggregate_egg_default = 'You are a knowledge curator for the egg file "{{egg_file}}". The content was too long for one pass and was analyzed against this egg in parts. Decide for the content AS A WHOLE and synthesize knowledge entries across parts.\n\n## Egg Instructions\n{{egg_instructions}}\n\n## Per-Part Findings\n{{chunk_findings}}\n\n## Task\n1. Synthesize Knowledge Entries across parts into "novelDelta":\n   - Connect and assemble related findings that spread across different parts (e.g. principles of a framework, steps of a methodology, or concepts introduced in one part and expanded in another) into complete, unified knowledge entries.\n   - When a concept was partially mentioned in an earlier part and fully explained in a later part, merge them into the single complete entry.\n   - For standalone insights from individual parts, preserve them as formatted entries.\n   - Determine "parent" in the Knowledge Tree for each entry.\n2. Answer each Key Question (if any) for the whole content, directly and concisely. Grounding: {{grounding_rule}}\n3. Apply the Rejection Criteria to the whole content \u2014 set rejected to true with a one-line reason when it is noise for this egg.\n4. Decide: should the user spend time reading/watching this fully? Consider the reject criteria and whether the parts together add new insight.\n\nRespond in this EXACT JSON format (no markdown, no code fence, just the JSON object):\n{\n  "novelDelta": [\n    {"parent": "parent heading in knowledge tree or empty string", "kind": "insight", "content": "- formatted entry text\\n  - sub bullets"}\n  ],\n  "keyQuestionAnswers": [\n    {"question": "exact question text", "answer": "direct answer"}\n  ],\n  "rejected": false,\n  "rejectReason": "",\n  "readVerdict": true,\n  "readVerdictReason": "one-line reason"\n}\n';

// src/prompts/suggest-egg.md
var suggest_egg_default = 'You are a knowledge curator. The content below matched no existing egg (knowledge file). Suggest a new egg to capture content like this.\n\n## Content\n**Title:** {{title}}\n**Source:** {{url}}\n\n## What the content is about\n{{summary}}\n\n## Task\nSuggest a short snake_case egg name (2-4 words, e.g. "productivity" or "quant_finance") and a one-line description of what this egg captures (used as its routing description).\n\nRespond in this EXACT JSON format (no markdown, no code fence, just the JSON object):\n{\n  "name": "snake_case_name",\n  "description": "one line description"\n}\n';

// src/prompts/egg-compare.md
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

IMPORTANT:
- Grounding: {{grounding_rule}}
- "parent" must match the exact text of a heading or bullet in Current Knowledge ("" if none).
- "kind" is "insight" or "list".
`;

// src/prompt-templates.ts
var PROMPTS = {
  /** Phase 1 — content summary + chapter map + custom question answers. */
  contentAnalysis: content_analysis_default,
  /** Step 1 extraction — content against one egg using instructions only. */
  eggAnalysis: egg_analysis_default,
  /** Step 1 single-egg extraction (content summary + key questions + candidate entries). */
  eggCombined: egg_combined_default,
  /** Step 2 comparison — candidate knowledge entries vs egg knowledge tree. */
  eggCompare: egg_compare_default,
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

// tests/index-reader.test.ts
function parse(content) {
  const reader = new IndexReader(makeFakePlugin());
  return reader.parseIndexContent(content);
}
(0, import_node_test.describe)("IndexReader.parseIndexContent", () => {
  (0, import_node_test.it)("parses `* path: description` bullet lines", () => {
    const entries = parse("* nutegg/investment.md: investment strategies\n");
    import_strict.default.equal(entries.length, 1);
    import_strict.default.deepEqual(entries[0], {
      fileName: "nutegg/investment.md",
      description: "investment strategies"
    });
  });
  (0, import_node_test.it)("parses plain lines without bullets", () => {
    const entries = parse("nutegg/ai.md: AI and machine learning\n");
    import_strict.default.equal(entries[0].fileName, "nutegg/ai.md");
  });
  (0, import_node_test.it)("skips markdown headings, comments, and callout lines", () => {
    const entries = parse([
      "# NutEgg Egg Index",
      "> [!abstract]- Instructions:",
      "> - Add one line per egg file",
      "",
      "* nutegg/society.md: geopolitics"
    ].join("\n"));
    import_strict.default.deepEqual(
      entries.map((e) => e.fileName),
      ["nutegg/society.md"]
    );
  });
  (0, import_node_test.it)("strips `-` and `+` bullet prefixes too", () => {
    const entries = parse([
      "- nutegg/a.md: first",
      "+ nutegg/b.md: second"
    ].join("\n"));
    import_strict.default.deepEqual(
      entries.map((e) => e.fileName),
      ["nutegg/a.md", "nutegg/b.md"]
    );
  });
  (0, import_node_test.it)("ignores lines whose path doesn't end in .md", () => {
    const entries = parse("not-a-file.txt: description\n* nutegg/ok.md: fine\n");
    import_strict.default.equal(entries.length, 1);
  });
  (0, import_node_test.it)("handles descriptions containing colons", () => {
    const entries = parse("* nutegg/x.md: a: b: c\n");
    import_strict.default.equal(entries[0].description, "a: b: c");
  });
  (0, import_node_test.it)("returns empty list for empty content", () => {
    import_strict.default.deepEqual(parse(""), []);
  });
});
(0, import_node_test.describe)("IndexReader.parseMatchedEggs", () => {
  const reader = new IndexReader(makeFakePlugin());
  const index = [
    { fileName: "nutegg/investment.md", description: "investment strategies" },
    { fileName: "nutegg/ai_ml.md", description: "artificial intelligence and machine learning" },
    { fileName: "nutegg/psychology.md", description: "mental models and psychology" }
  ];
  (0, import_node_test.it)("matches JSON array of full paths", () => {
    const res = reader.parseMatchedEggs('["nutegg/ai_ml.md"]', index);
    import_strict.default.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md"]);
  });
  (0, import_node_test.it)("matches JSON array of basenames", () => {
    const res = reader.parseMatchedEggs('["ai_ml.md"]', index);
    import_strict.default.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md"]);
  });
  (0, import_node_test.it)("matches markdown bullet list (- nutegg/ai_ml.md)", () => {
    const res = reader.parseMatchedEggs("- nutegg/ai_ml.md\n- nutegg/investment.md", index);
    import_strict.default.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md", "nutegg/investment.md"]);
  });
  (0, import_node_test.it)("matches markdown bullet list with basenames (* ai_ml.md)", () => {
    const res = reader.parseMatchedEggs("* ai_ml.md\n", index);
    import_strict.default.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md"]);
  });
  (0, import_node_test.it)("matches numbered list (1. nutegg/ai_ml.md)", () => {
    const res = reader.parseMatchedEggs("1. nutegg/ai_ml.md", index);
    import_strict.default.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md"]);
  });
  (0, import_node_test.it)("matches backticks (`nutegg/ai_ml.md`)", () => {
    const res = reader.parseMatchedEggs("`nutegg/ai_ml.md`", index);
    import_strict.default.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md"]);
  });
  (0, import_node_test.it)("matches conversational text mentioning the egg file", () => {
    const res = reader.parseMatchedEggs(
      "Based on the provided article, this content belongs to nutegg/ai_ml.md as it discusses neural networks.",
      index
    );
    import_strict.default.deepEqual(res.map((e) => e.fileName), ["nutegg/ai_ml.md"]);
  });
  (0, import_node_test.it)("returns empty array for explicit 'none' or '[]'", () => {
    import_strict.default.deepEqual(reader.parseMatchedEggs("none", index), []);
    import_strict.default.deepEqual(reader.parseMatchedEggs("None.", index), []);
    import_strict.default.deepEqual(reader.parseMatchedEggs("[]", index), []);
    import_strict.default.deepEqual(reader.parseMatchedEggs("No match found", index), []);
  });
});
