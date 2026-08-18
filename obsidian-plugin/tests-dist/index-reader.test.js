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
{{chapters}}
{{questions}}
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

{{content}}

## Task
1. Answer each Key Question (if any) directly and concisely. Grounding: {{grounding_rule}}
2. Novel Delta: identify genuinely NEW insights vs the Current Knowledge. If the content is entirely redundant, return an empty array.
3. Apply the Rejection Criteria \u2014 if the content should be rejected, set rejected to true and give a one-line reason.
4. Decide: should the user spend time reading/watching this fully? Consider the reject criteria and whether it adds new insight.

For each Novel Delta entry:
- "parent": copy the EXACT text of the existing bullet or heading in the Current Knowledge tree that the new information nests under. Use "" if no suitable parent exists.
- "content": the new information as markdown nested bullets, written relative to that parent (top-level lines are children of the parent). Follow the Formatting Rules.

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
{{chapters}}
{{questions}}

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
- coreSummary: at most 3 bullets. chapterMap: empty array when isLongForm is false; keep exact timestamps from the video chapters when provided.
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to the egg's Key Questions above or to another user question \u2014 answer it only once.
- For each Novel Delta entry: "parent" is the EXACT text of the existing bullet or heading it nests under ("" if none), "content" follows the Formatting Rules.
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
  actionGuideDefault: action_guide_default_default.trim()
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
