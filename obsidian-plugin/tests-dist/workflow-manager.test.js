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

// tests/workflow-manager.test.ts
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

// src/workflow/content-analysis.md
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
- Output Language: write ALL output text (verdicts, summaries, answers) in the same language as the content, or as this sentence if provided: "{{egg_description}}". Keep JSON keys in English.
- titleVerdict: single sentence.
- coreSummary: at most 3 bullets, plain language.
- isLongForm: true only for long articles/videos that meaningfully benefit from a chapter map.
- chapterMap: empty array when isLongForm is false. When video chapters are provided, keep their exact timestamps and titles, and only add your 1-sentence summary.
- chapterMap when Video Sections are listed above: return EXACTLY one entry per listed section, using the section's start time as "time" \u2014 give each a short title and a 1-sentence summary of what happens between that section and the next.
- chapterMap when NO chapters or sections were provided: empty array (the content is not a timestamped video).
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to an Egg Key Question above or to another user question \u2014 answer it only once.
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
- Output Language: write ALL output text (answers, knowledge entries) in the same language as this sentence: "{{egg_description}}". Keep JSON keys in English.
- extractedEntries: empty array if the content contains no substantive knowledge matching this egg's scope. "kind" is "insight" (default) or "list" (for structured enumerations).
`;

// src/workflow/egg-combined.md
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
- Output Language: write ALL output text (verdicts, summaries, answers, knowledge entries, reasons) in the same language as this sentence: "{{egg_description}}". Keep JSON keys in English.
- coreSummary: at most 3 bullets. chapterMap: empty array when isLongForm is false; keep exact timestamps from the video chapters when provided. When Video Sections are listed above, return EXACTLY one chapterMap entry per listed section, using the section's start time as "time" \u2014 give each a short title and a 1-sentence summary of what happens between that section and the next.
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to the egg's Key Questions above or to another user question \u2014 answer it only once.
- extractedEntries: empty array if the content contains no substantive knowledge matching this egg's scope. "kind" is "insight" (default) or "list" (for structured enumerations).
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

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "answers": [
    {"question": "exact question text", "answer": "direct answer"}
  ]
}

IMPORTANT:
- One entry per question, in the same order.
- Grounding: {{grounding_rule}}
- Output Language: write ALL output text (answers) in the same language as the questions, or as this sentence if provided: "{{egg_description}}". Keep JSON keys in English.
- If a question is equivalent to one in Previous Questions & Answers, answer briefly with the same conclusion instead of repeating it.
`;

// src/workflow/egg-routing.md
var egg_routing_default = 'Given this content and egg index, which egg file(s) does this content belong to? Return ONLY the file names, one per line. If none match, return "none".\n\n## Content\nTitle: {{title}}\nURL: {{url}}\n{{content}}\n\n## Egg Index\n{{index}}\n\nReturn matching file names (one per line):\n';

// src/workflow/action-guide-default.md
var action_guide_default_default = "1. Title Verdict: Provide a single, direct sentence that resolves the core question posed in the title or introduction.\n2. Core Summary: Summarize the main concepts in plain language using a maximum of 3 bullet points.\n3. Chapter Map (Long-form only): If the content is a long article or lengthy video, provide a brief 1-sentence summary for each major section or topic shift. If it is short, omit this step entirely.\n";

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

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "knowledge": "the COMPLETE updated Knowledge section content as markdown \u2014 the existing tree with the merged entries nested in. Only the section BODY: do NOT include the '# Knowledge' heading line itself.",
  "unprocessed": "the entries that could not be merged (markdown), or an empty string when all were merged. Only the section BODY: do NOT include the '# Unprocessed' heading line itself."
}

IMPORTANT:
- Output Language: write ALL output text (knowledge entries, explanations) in the same language as this sentence: "{{egg_description}}". Keep JSON keys in English.
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
- Output Language: write ALL output text (verdicts, summaries, answers) in the same language as this sentence: "{{egg_description}}". Keep JSON keys in English.
`;

// src/workflow/aggregate-egg.md
var aggregate_egg_default = 'You are a knowledge curator for the egg file "{{egg_file}}". The content was too long for one pass and was analyzed against this egg in parts. Decide for the content AS A WHOLE and synthesize knowledge entries across parts.\n\n## Egg Instructions\n{{egg_instructions}}\n\n## Per-Part Findings\n{{chunk_findings}}\n\n## Task\n1. Synthesize Knowledge Entries across parts into "novelDelta":\n   - Connect and assemble related findings that spread across different parts (e.g. principles of a framework, steps of a methodology, or concepts introduced in one part and expanded in another) into complete, unified knowledge entries.\n   - When a concept was partially mentioned in an earlier part and fully explained in a later part, merge them into the single complete entry.\n   - For standalone insights from individual parts, preserve them as formatted entries.\n   - Determine "parent" in the Knowledge Tree for each entry.\n2. Answer each Key Question (if any) for the whole content, directly and concisely. Grounding: {{grounding_rule}}\n3. Apply the Rejection Criteria to the whole content \u2014 set rejected to true with a one-line reason when it is noise for this egg.\n4. Decide: should the user spend time reading/watching this fully? Consider the reject criteria and whether the parts together add new insight.\n\nRespond in this EXACT JSON format (no markdown, no code fence, just the JSON object):\n{\n  "novelDelta": [\n    {"parent": "parent heading in knowledge tree or empty string", "kind": "insight", "content": "- formatted entry text\\n  - sub bullets"}\n  ],\n  "keyQuestionAnswers": [\n    {"question": "exact question text", "answer": "direct answer"}\n  ],\n  "rejected": false,\n  "rejectReason": "",\n  "readVerdict": true,\n  "readVerdictReason": "one-line reason"\n}\n\nIMPORTANT:\n- Output Language: write ALL output text (knowledge entries, answers, reasons, verdicts) in the same language as this sentence: "{{egg_description}}". Keep JSON keys in English.\n';

// src/workflow/suggest-egg.md
var suggest_egg_default = 'You are a knowledge curator. The content below matched no existing egg (knowledge file). Suggest a new egg to capture content like this.\n\n## Content\n**Title:** {{title}}\n**Source:** {{url}}\n\n## What the content is about\n{{summary}}\n\n## Task\nSuggest a short snake_case egg name (2-4 words, e.g. "productivity" or "quant_finance") and a one-line description of what this egg captures (used as its routing description).\n\nRespond in this EXACT JSON format (no markdown, no code fence, just the JSON object):\n{\n  "name": "snake_case_name",\n  "description": "one line description"\n}\n';

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
- Output Language: write ALL output text (knowledge entries, reasons, verdicts) in the same language as this sentence: "{{egg_description}}". Keep JSON keys in English.
- "parent" must match the exact text of a heading or bullet in Current Knowledge ("" if none).
- "kind" is "insight" or "list".
`;

// src/workflow/localize-egg.md
var localize_egg_default = 'You are a knowledge curator for NutEgg.\n\n## Egg Description\n{{description}}\n\n## Egg Template\n{{template}}\n\n## Task\nTranslate and adapt the concrete instructions, questions, criteria, and rule descriptions in the template above so they use the SAME LANGUAGE as the egg description: "{{description}}".\n\nIMPORTANT:\n1. Language: All explanations, questions, criteria, and rule guidance must be written in the same language as the egg description: "{{description}}".\n2. Egg Parser Structure: The structure and these exact labels MUST remain in English:\n   - Frontmatter (`---`, `topic: ...`, `status: ...`, `last_updated: ...`)\n   - Callout: `> [!abstract]- Instructions:`\n   - Bold section labels: `> **Scope:**`, `> **Action Guide:**`, `> **Key Questions:**`, `> **Rejection Criteria:**`, `> **Formatting Rules:**`\n   - Step labels in Action Guide: `1. Title Verdict:`, `2. Core Summary:`, `3. Chapter Map (Long-form only):`, `4. Novel Delta:`, `5. Decide:`\n   - Headings: `# Knowledge` and `# Unprocessed`\n   - Tag names in Formatting Rules: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`\n\nOutput ONLY the complete updated egg file markdown. Do NOT wrap in markdown code fences.\n\n';

// src/workflow/grounding-rule.md
var grounding_rule_default = 'The content is the ONLY source of truth for every answer and summary you produce. Report what the content actually says even when it contradicts common sense or well-known facts \u2014 never correct, refute, or supplement it with outside knowledge. If the content does not address a question, say "Not covered in this content".\n';

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
  suggestEgg: suggest_egg_default,
  /** Localize egg template matching the description language while keeping parser structure in English. */
  localizeEgg: localize_egg_default,
  /** Shared grounding rule injected into every prompt. */
  groundingRule: grounding_rule_default.trim()
};

// src/workflow/README.md
var README_default = "# NutEgg AI Workflow & Prompt Reference\n\nWelcome to the **NutEgg Workflow Engine**. The files in this folder define the prompts, instructions, and schemas that power NutEgg's AI extraction and knowledge synthesis pipeline.\n\n> [!TIP]\n> You can freely edit and customize any file in this directory to tailor NutEgg's analysis to your specific needs (e.g. changing the tone, adding domain-specific perspectives, or adjusting extraction depth).\n\n---\n\n## Architecture Overview\n\nWhen you capture an article, video, or note in NutEgg, the AI processor executes one of several pipelines based on how many eggs match and how long the content is:\n\n```\n                  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n                  \u2502      Captured Web Content     \u2502\n                  \u2502   (Article / YouTube / Tweet) \u2502\n                  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n                                 \u2502\n                 Did the user manually pick eggs?\n                    \u251C\u2500\u2500 No \u2500\u2500\u25BA [egg-routing.md] (match eggs from _index.md)\n                    \u2514\u2500\u2500 Yes \u2500\u25BA Use selected eggs\n                                 \u2502\n                 How many eggs matched?\n                    \u251C\u2500\u2500 1 Egg  \u2500\u2500\u25BA Single-Egg Fast Path (1 AI call)\n                    \u2502              [egg-combined.md]\n                    \u2502\n                    \u2514\u2500\u2500 2+ Eggs \u2500\u25BA Multi-Egg Parallel Pipeline\n                                   Step 1: [content-analysis.md] (Summary & Chapter Map)\n                                   Step 2: [egg-analysis.md] (Per-egg candidate insights)\n                                 \u2502\n                                 \u25BC\n                     Knowledge Tree Comparison\n                     [egg-compare.md]\n                     (Compare candidate insights against existing egg knowledge tree)\n                                 \u2502\n                                 \u25BC\n                     Results returned to Popup\n```\n\nFor long content (e.g. 1-2 hour videos, long transcripts), NutEgg automatically splits content into chapters and uses:\n- **`aggregate-content.md`**: Combines per-part summaries into one cohesive overview.\n- **`aggregate-egg.md`**: Synthesizes candidate entries across all chunks for each egg.\n\n---\n\n## Workflow File Directory\n\n| File | Pipeline Stage | Purpose | Output Format |\n|---|---|---|---|\n| [`egg-combined.md`](file:///./egg-combined.md) | Single-Egg Fast Path | Combined 1-call prompt extracting summary, chapter map, and candidate insights for a single egg. | JSON (`titleVerdict`, `coreSummary`, `chapterMap`, `customQuestionAnswers`, `keyQuestionAnswers`, `extractedEntries`) |\n| [`content-analysis.md`](file:///./content-analysis.md) | Multi-Egg Step 1 | High-level content analysis: single-sentence title verdict, core summary bullet points, and chapter map. | JSON (`titleVerdict`, `coreSummary`, `isLongForm`, `chapterMap`, `customQuestionAnswers`) |\n| [`egg-analysis.md`](file:///./egg-analysis.md) | Multi-Egg Step 2 | Extracts candidate knowledge entries targeted to one specific egg's scope and action guide. | JSON (`keyQuestionAnswers`, `extractedEntries`) |\n| [`egg-compare.md`](file:///./egg-compare.md) | Synthesis (All Paths) | Compares candidate entries against the existing `# Knowledge` tree in the egg note to eliminate duplicates and identify novel deltas. | JSON (`novelDelta`, `redundantEntries`, `rejected`, `rejectReason`, `readVerdict`, `readVerdictReason`) |\n| [`egg-routing.md`](file:///./egg-routing.md) | Routing | Compares content against the egg descriptions in `_index.md` to select the best matching eggs. | Plain text list of filenames (one per line, or JSON array) |\n| [`aggregate-content.md`](file:///./aggregate-content.md) | Long Content | Merges chunk-level summaries from long articles or video transcripts into one comprehensive overview. | JSON (`titleVerdict`, `coreSummary`, `customQuestionAnswers`) |\n| [`aggregate-egg.md`](file:///./aggregate-egg.md) | Long Content | Combines and de-duplicates candidate insights extracted across multiple chunks for one egg. | JSON (`novelDelta`, `keyQuestionAnswers`, `rejected`, `rejectReason`, `readVerdict`, `readVerdictReason`) |\n| [`merge-unprocessed.md`](file:///./merge-unprocessed.md) | Knowledge Maintenance | Merges entries accumulated under `# Unprocessed` into the structured `# Knowledge` tree on demand. | JSON (`knowledge`, `unprocessed`) |\n| [`localize-egg.md`](file:///./localize-egg.md) | Egg Creation | Adapts the standard egg template into the language of the egg's description when a new egg is created. | Full initial egg note (Markdown) |\n| [`suggest-egg.md`](file:///./suggest-egg.md) | Fallback Routing | Suggests a new egg name and description when captured content matches no existing egg. | JSON (`name`, `description`) |\n| [`follow-up.md`](file:///./follow-up.md) | Interactive Q&A | Answers user follow-up questions about the captured content in the Chrome popup. | JSON (`answers`: `[{\"question\", \"answer\"}]`) |\n| [`action-guide-default.md`](file:///./action-guide-default.md) | Default Fallback | The baseline Action Guide used when an egg note does not specify its own. | Plain text list |\n| [`grounding-rule.md`](file:///./grounding-rule.md) | Shared Rule | The strict grounding & anti-hallucination directive injected into all analysis prompts. | Plain text rule |\n\n---\n\n## Customization Rules & Guidelines\n\n### \u2705 What You Can Safely Customize\n- **Tone and Perspective**: You can instruct the AI to be more critical, more technical, or focus on specific themes.\n- **Summary Depth**: You can change how concise or detailed summaries should be.\n- **Language / Idiom Preferences**: You can tweak phrasing, formatting preferences, or custom analytical lenses.\n\n### \u26A0\uFE0F What You Must Preserve (To Prevent Parser Errors)\n1. **`{{placeholders}}`**: The strings enclosed in double curly braces (e.g. `{{content}}`, `{{egg_description}}`, `{{knowledge_tree}}`) are replaced dynamically by the engine. Do not delete or rename them.\n2. **JSON Schemas**: Prompts that output JSON must keep the exact JSON key names specified in the template. The TypeScript engine parses these exact keys.\n3. **Markdown Structural Headings**: In prompts that output markdown (`localize-egg.md`), structural labels and headings like `# Knowledge` and `# Unprocessed` must remain verbatim in English for the note parser.\n\n---\n\n## Updates & Conflict Resolution\n\nWhen NutEgg updates to a newer version:\n- **If you haven't edited a workflow file**: The plugin automatically updates it to the latest version.\n- **If you have customized a workflow file**: NutEgg will **never overwrite your custom version**. Instead, it writes `[filename].new.md` alongside your file so you can inspect what changed in the update.\n- **Restore Defaults**: You can reset all workflow files back to factory defaults at any time from `Obsidian Settings \u2192 NutEgg \u2192 Restore Default Workflow Files`.\n\n";

// src/workflow-manager.ts
var WORKFLOW_FILE_MAP = {
  contentAnalysis: "content-analysis.md",
  eggAnalysis: "egg-analysis.md",
  eggCombined: "egg-combined.md",
  eggCompare: "egg-compare.md",
  followUp: "follow-up.md",
  eggRouting: "egg-routing.md",
  actionGuideDefault: "action-guide-default.md",
  mergeUnprocessed: "merge-unprocessed.md",
  aggregateContent: "aggregate-content.md",
  aggregateEgg: "aggregate-egg.md",
  suggestEgg: "suggest-egg.md",
  localizeEgg: "localize-egg.md",
  groundingRule: "grounding-rule.md"
};
var BUILTIN_WORKFLOW_FILES = {
  "README.md": README_default,
  "content-analysis.md": PROMPTS.contentAnalysis,
  "egg-analysis.md": PROMPTS.eggAnalysis,
  "egg-combined.md": PROMPTS.eggCombined,
  "egg-compare.md": PROMPTS.eggCompare,
  "follow-up.md": PROMPTS.followUp,
  "egg-routing.md": PROMPTS.eggRouting,
  "action-guide-default.md": PROMPTS.actionGuideDefault,
  "merge-unprocessed.md": PROMPTS.mergeUnprocessed,
  "aggregate-content.md": PROMPTS.aggregateContent,
  "aggregate-egg.md": PROMPTS.aggregateEgg,
  "suggest-egg.md": PROMPTS.suggestEgg,
  "localize-egg.md": PROMPTS.localizeEgg,
  "grounding-rule.md": PROMPTS.groundingRule
};
function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = hash * 33 ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}
var WorkflowManager = class {
  plugin;
  cache = /* @__PURE__ */ new Map();
  initialized = false;
  constructor(plugin) {
    this.plugin = plugin;
  }
  get workflowFolder() {
    if (this.plugin.settings?.workflowFolder) {
      return this.plugin.settings.workflowFolder;
    }
    const base = this.plugin.vaultFolder || "nutegg";
    return `${base}/_workflow`;
  }
  /** Initialize watcher, seed files, and load cache */
  async init() {
    if (!this.initialized && this.plugin.app?.vault?.on) {
      this.plugin.app.vault.on("modify", (file) => {
        this.onFileChanged(file);
      });
      this.plugin.app.vault.on("create", (file) => {
        this.onFileChanged(file);
      });
      this.plugin.app.vault.on("delete", (file) => {
        this.onFileDeleted(file);
      });
      this.initialized = true;
    }
    await this.ensureWorkflowFiles();
  }
  /**
   * Ensure the workflow folder and all built-in files exist in the vault.
   * Detects version updates non-destructively:
   * - Unmodified files are updated cleanly.
   * - User-customized files are preserved, and new versions are written as `*.new.md`.
   */
  async ensureWorkflowFiles() {
    const folder = this.workflowFolder;
    await this.ensureFolder(folder);
    if (!this.plugin.settings.workflowHashes) {
      this.plugin.settings.workflowHashes = {};
    }
    let settingsChanged = false;
    for (const [filename, builtinContent] of Object.entries(BUILTIN_WORKFLOW_FILES)) {
      const filePath = `${folder}/${filename}`;
      const builtinHash = simpleHash(builtinContent);
      const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
      if (!file) {
        await this.plugin.app.vault.create(filePath, builtinContent);
        this.cache.set(filename, builtinContent);
        this.plugin.settings.workflowHashes[filename] = builtinHash;
        settingsChanged = true;
        console.log(`[NutEgg] Seeded workflow file: ${filePath}`);
      } else {
        const vaultContent = await this.plugin.app.vault.read(file);
        this.cache.set(filename, vaultContent);
        const currentVaultHash = simpleHash(vaultContent);
        const recordedHash = this.plugin.settings.workflowHashes[filename];
        if (currentVaultHash === builtinHash) {
          if (recordedHash !== builtinHash) {
            this.plugin.settings.workflowHashes[filename] = builtinHash;
            settingsChanged = true;
          }
        } else if (recordedHash && recordedHash === currentVaultHash) {
          await this.plugin.app.vault.modify(file, builtinContent);
          this.cache.set(filename, builtinContent);
          this.plugin.settings.workflowHashes[filename] = builtinHash;
          settingsChanged = true;
          console.log(`[NutEgg] Auto-updated unmodified workflow file: ${filePath}`);
        } else if (!recordedHash) {
          this.plugin.settings.workflowHashes[filename] = currentVaultHash;
          settingsChanged = true;
        } else {
          const baseName = filename.replace(/\.md$/, "");
          const newPath = `${folder}/${baseName}.new.md`;
          const existingNew = this.plugin.app.vault.getAbstractFileByPath(newPath);
          if (!existingNew) {
            await this.plugin.app.vault.create(newPath, builtinContent);
            console.log(`[NutEgg] Saved updated workflow template to: ${newPath}`);
            new Notice(
              `[NutEgg] Workflow update available for ${filename}. Your custom file was preserved; see ${baseName}.new.md to compare.`,
              8e3
            );
          }
        }
      }
    }
    if (settingsChanged) {
      await this.plugin.saveSettings();
    }
  }
  /** Retrieve prompt text dynamically from vault cache, falling back to built-in */
  getPrompt(key) {
    const filename = WORKFLOW_FILE_MAP[key];
    if (!filename)
      return "";
    const cached = this.cache.get(filename);
    if (cached && cached.trim().length > 0) {
      return cached;
    }
    return BUILTIN_WORKFLOW_FILES[filename] || "";
  }
  /** Reset all workflow files to built-in defaults with backup */
  async resetToDefaults() {
    const folder = this.workflowFolder;
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const backupFolder = `${folder}/_backup/${timestamp}`;
    await this.ensureFolder(backupFolder);
    for (const [filename, builtinContent] of Object.entries(BUILTIN_WORKFLOW_FILES)) {
      const filePath = `${folder}/${filename}`;
      const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
      if (file) {
        const currentContent = await this.plugin.app.vault.read(file);
        await this.plugin.app.vault.create(`${backupFolder}/${filename}`, currentContent);
        await this.plugin.app.vault.modify(file, builtinContent);
      } else {
        await this.plugin.app.vault.create(filePath, builtinContent);
      }
      this.cache.set(filename, builtinContent);
      this.plugin.settings.workflowHashes[filename] = simpleHash(builtinContent);
    }
    await this.plugin.saveSettings();
    new Notice(`[NutEgg] Restored default workflow files. Previous files backed up to ${backupFolder}`);
  }
  async onFileChanged(file) {
    if (!(file instanceof TFile) || !file.path.startsWith(this.workflowFolder)) {
      return;
    }
    const filename = file.name;
    if (filename in BUILTIN_WORKFLOW_FILES) {
      const content = await this.plugin.app.vault.read(file);
      this.cache.set(filename, content);
    }
  }
  onFileDeleted(file) {
    if (!file.path.startsWith(this.workflowFolder)) {
      return;
    }
    const parts = file.path.split("/");
    const filename = parts[parts.length - 1];
    if (this.cache.has(filename)) {
      this.cache.delete(filename);
    }
  }
  async ensureFolder(path) {
    const parts = path.split("/");
    let currentPath = "";
    for (const part of parts) {
      if (!part)
        continue;
      currentPath += (currentPath ? "/" : "") + part;
      const exists = await this.plugin.app.vault.adapter.exists(currentPath);
      if (!exists) {
        await this.plugin.app.vault.createFolder(currentPath);
      }
    }
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
    getAbstractFileByPath: (p) => files.has(p) ? toTFile(p) : null,
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

// tests/workflow-manager.test.ts
function makeManager(files = {}, settingsOverrides = {}) {
  const store = makeFakeVault(files);
  const plugin = makeFakePlugin({
    vault: store.vault,
    settings: {
      workflowFolder: "nutegg/_workflow",
      workflowHashes: {},
      ...settingsOverrides
    },
    saveSettings: async () => {
    }
  });
  const manager = new WorkflowManager(plugin);
  return { manager, plugin, store, files: store.files };
}
(0, import_node_test.describe)("WorkflowManager", () => {
  (0, import_node_test.it)("seeds all built-in workflow files and populates settings.workflowHashes on initial run", async () => {
    const { manager, files, plugin } = makeManager();
    await manager.init();
    for (const [filename, expectedContent] of Object.entries(BUILTIN_WORKFLOW_FILES)) {
      const fullPath = `nutegg/_workflow/${filename}`;
      import_strict.default.equal(files.has(fullPath), true, `Missing seeded file: ${fullPath}`);
      import_strict.default.equal(files.get(fullPath), expectedContent);
      import_strict.default.equal(
        plugin.settings.workflowHashes[filename],
        simpleHash(expectedContent),
        `Hash mismatch for ${filename}`
      );
    }
    import_strict.default.equal(files.has("nutegg/_workflow/README.md"), true);
  });
  (0, import_node_test.it)("retrieves seeded prompts dynamically via getPrompt", async () => {
    const { manager } = makeManager();
    await manager.init();
    for (const [key, filename] of Object.entries(WORKFLOW_FILE_MAP)) {
      const prompt = manager.getPrompt(key);
      import_strict.default.equal(
        prompt,
        BUILTIN_WORKFLOW_FILES[filename],
        `Prompt mismatch for key: ${key}`
      );
    }
  });
  (0, import_node_test.it)("returns customized prompt when user edits a file", async () => {
    const { manager, store } = makeManager();
    await manager.init();
    const customPrompt = "You are a custom NutEgg content analyzer. Output JSON only.";
    await store.vault.modify(
      { path: "nutegg/_workflow/content-analysis.md" },
      customPrompt
    );
    import_strict.default.equal(manager.getPrompt("contentAnalysis"), customPrompt);
  });
  (0, import_node_test.it)("falls back to built-in default when file is deleted or empty", async () => {
    const { manager, store } = makeManager();
    await manager.init();
    await store.vault.modify(
      { path: "nutegg/_workflow/content-analysis.md" },
      "   \n  "
    );
    import_strict.default.equal(
      manager.getPrompt("contentAnalysis"),
      BUILTIN_WORKFLOW_FILES["content-analysis.md"]
    );
    store.vault.trigger("delete", { path: "nutegg/_workflow/content-analysis.md" });
    import_strict.default.equal(
      manager.getPrompt("contentAnalysis"),
      BUILTIN_WORKFLOW_FILES["content-analysis.md"]
    );
  });
  (0, import_node_test.it)("auto-updates unmodified file when built-in version changes", async () => {
    const oldBuiltin = "Old default prompt";
    const oldHash = simpleHash(oldBuiltin);
    const { manager, files, plugin } = makeManager(
      {
        "nutegg/_workflow/content-analysis.md": oldBuiltin
      },
      {
        workflowHashes: {
          "content-analysis.md": oldHash
        }
      }
    );
    await manager.init();
    const expected = BUILTIN_WORKFLOW_FILES["content-analysis.md"];
    import_strict.default.equal(files.get("nutegg/_workflow/content-analysis.md"), expected);
    import_strict.default.equal(plugin.settings.workflowHashes["content-analysis.md"], simpleHash(expected));
    import_strict.default.equal(files.has("nutegg/_workflow/content-analysis.new.md"), false);
  });
  (0, import_node_test.it)("preserves user customized file and writes *.new.md on version update conflict", async () => {
    const userCustomizedContent = "My very special customized analysis prompt.";
    const originalDefault = "Some older default";
    const originalHash = simpleHash(originalDefault);
    const { manager, files } = makeManager(
      {
        "nutegg/_workflow/content-analysis.md": userCustomizedContent
      },
      {
        workflowHashes: {
          "content-analysis.md": originalHash
        }
      }
    );
    await manager.init();
    import_strict.default.equal(
      files.get("nutegg/_workflow/content-analysis.md"),
      userCustomizedContent
    );
    import_strict.default.equal(files.has("nutegg/_workflow/content-analysis.new.md"), true);
    import_strict.default.equal(
      files.get("nutegg/_workflow/content-analysis.new.md"),
      BUILTIN_WORKFLOW_FILES["content-analysis.md"]
    );
    import_strict.default.equal(manager.getPrompt("contentAnalysis"), userCustomizedContent);
  });
  (0, import_node_test.it)("resetToDefaults creates backup and resets all workflow files", async () => {
    const customContent = "Custom prompt before reset";
    const { manager, files, plugin } = makeManager({
      "nutegg/_workflow/content-analysis.md": customContent
    });
    await manager.init();
    await manager.resetToDefaults();
    import_strict.default.equal(
      files.get("nutegg/_workflow/content-analysis.md"),
      BUILTIN_WORKFLOW_FILES["content-analysis.md"]
    );
    const backupKeys = [...files.keys()].filter(
      (k) => k.startsWith("nutegg/_workflow/_backup/") && k.endsWith("content-analysis.md")
    );
    import_strict.default.equal(backupKeys.length, 1);
    import_strict.default.equal(files.get(backupKeys[0]), customContent);
    import_strict.default.equal(
      plugin.settings.workflowHashes["content-analysis.md"],
      simpleHash(BUILTIN_WORKFLOW_FILES["content-analysis.md"])
    );
  });
});
