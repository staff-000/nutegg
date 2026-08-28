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

// tests/prompt-templates.test.ts
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
2. Novel Delta: identify genuinely NEW insights vs the Current Knowledge AND the Unprocessed entries. Compare by CONCEPT: an insight is new only when its concept is not already covered \u2014 the same concept with a different example or wording is a duplicate, NOT new. If the content is entirely redundant, return an empty array.
3. Apply the Rejection Criteria \u2014 if the content should be rejected, set rejected to true and give a one-line reason.
4. Decide: should the user spend time reading/watching this fully? Consider the reject criteria and whether it adds new insight (by concept, per step 2).

For each Novel Delta entry:
- "parent": the EXACT text of the existing bullet or heading in the Current Knowledge tree that best fits the new information \u2014 used as a suggestion when the entry is merged into the tree later. Use "" if no suitable parent exists.
- "content": ONE insight per entry, in the Formatting Rules' entry structure: a single top-level bullet "- [tag] **Concept**: short phrases" (without "[tag] " when the egg defines no tags), with explanation as one indented sub0bullet and concrete examples from the content as other indented sub-bullets ("  - \u{1F3AF} Example: ...") when present. Name each Concept so it can be compared against the tree for dedup and novelty checks. Do NOT include author or source \u2014 they are appended automatically.

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
- For each Novel Delta entry: "parent" is the EXACT text of the existing bullet or heading it best fits under ("" if none) \u2014 a suggestion used when the entry is merged into the tree later. "content" is ONE insight per entry, in the Formatting Rules' entry structure: a single top-level bullet "- [tag] **Concept**: short phrases" (without "[tag] " when the egg defines no tags), with explanation as one indented sub-bullet and concrete examples from the content as other indented sub-bullets ("  - \u{1F3AF} Example: ...") when present. Name each Concept so it can be compared against the tree for dedup and novelty checks. Do NOT include author or source \u2014 they are appended automatically.
- Novel Delta must be genuinely NEW vs the Current Knowledge AND the Unprocessed entries \u2014 compare by CONCEPT: the same concept with a different example or wording is a duplicate, not a new insight.
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

## Entries to Merge
{{unprocessed}}

## Task
1. PRESERVE the existing tree structure as much as possible: do not rename, restructure, or delete existing branches \u2014 the user may have edited them by hand.
2. Deduplicate the entries against EACH OTHER first, comparing their Concepts: entries with the same or equivalent concept are ONE entry, even when the explanations differ \u2014 keep the clearest explanation, fold the others' examples into it, and keep every distinct _author/_source line. A near-duplicate must never appear twice in the merged tree \u2014 dropping redundant rewordings is more valuable than preserving slight wording differences.
3. Nest each deduplicated entry under the most relevant existing concept as sub-bullets.
4. Only when an entry matches no existing concept, create a new minimal top-level branch for it.
5. Keep each entry's insight, concrete examples, and its _author/_source lines intact when moving it into the tree.
6. If an entry's concept duplicates existing knowledge in the tree, drop it entirely.
7. If an entry cannot be merged meaningfully, leave it in the "unprocessed" output.

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

// tests/prompt-templates.test.ts
(0, import_node_test.describe)("renderPrompt", () => {
  (0, import_node_test.it)("substitutes {{placeholders}} with values", () => {
    const out = renderPrompt("Hello {{name}}, you are {{age}}.", {
      name: "NutEgg",
      age: 2
    });
    import_strict.default.equal(out, "Hello NutEgg, you are 2.");
  });
  (0, import_node_test.it)("renders missing variables as empty strings", () => {
    const out = renderPrompt("A{{missing}}B", {});
    import_strict.default.equal(out, "AB");
  });
  (0, import_node_test.it)("replaces repeated placeholders everywhere", () => {
    const out = renderPrompt("{{x}}-{{x}}", { x: "y" });
    import_strict.default.equal(out, "y-y");
  });
  (0, import_node_test.it)("leaves unknown syntax untouched", () => {
    import_strict.default.equal(renderPrompt("{{a}} {{a.b}} {a}", { a: "1" }), "1 {{a.b}} {a}");
  });
  (0, import_node_test.it)("coerces numeric values to strings", () => {
    import_strict.default.equal(renderPrompt("{{n}}", { n: 42 }), "42");
  });
});
(0, import_node_test.describe)("PROMPTS", () => {
  (0, import_node_test.it)("every template bundle is loaded and non-empty", () => {
    for (const [name, tpl] of Object.entries(PROMPTS)) {
      import_strict.default.ok(tpl.length > 10, `${name} should be non-empty`);
    }
  });
  (0, import_node_test.it)("templates use the documented placeholder names", () => {
    const all = Object.values(PROMPTS).join("\n");
    const used = new Set([...all.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]));
    const known = [
      "action_guide",
      "title",
      "url",
      "source_type",
      "chapters",
      "questions",
      "egg_key_questions",
      "content",
      "grounding_rule",
      "egg_file",
      "egg_instructions",
      "prior_qa",
      "index",
      // merge-unprocessed.md
      "formatting_rules",
      "knowledge_tree",
      "unprocessed",
      "unprocessed_count",
      // chunked analysis (per-part labels + aggregates)
      "part_note",
      "chunk_summaries",
      "chunk_findings",
      "sections",
      // suggest-egg.md
      "summary"
    ];
    for (const v of used) {
      import_strict.default.ok(known.includes(v), `unknown placeholder {{${v}}}`);
    }
  });
});
