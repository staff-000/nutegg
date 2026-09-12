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
  "keyQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ],
  "extractedEntries": [
    {"kind": "insight", "content": "- [tag] **Concept**: short phrases\\n  - explanation\\n  - \u{1F3AF} Example: ..."}
  ]
}

## Output Rules:
- extractedEntries: empty array if the content contains no substantive knowledge matching this egg's scope. "kind" is "insight" (default) or "list" (for structured enumerations).
{{shared_output_rules}}
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
1. Answer Key Questions: answer each Key Question from the egg instructions directly and concisely based on the content.
2. Extract Knowledge Entries: extract all substantive insights, concepts, frameworks, and actionable knowledge from the content that fall within the egg's Scope, formatted strictly per the egg's Formatting Rules:
   - Follow the concept \u2192 explanation \u2192 example structure: one top-level bullet "- [tag] **Concept**: short phrases" (without "[tag] " when the egg defines no tags), with the explanation as one indented sub-bullet and concrete examples from the content as further indented sub-bullets ("  - \u{1F3AF} Example: ...") when present. Name each Concept clearly.
   - Structured enumerations / frameworks (numbered lists, step-by-step methods, named frameworks): capture as ONE complete entry preserving EVERY item in order. Never summarize items away, never truncate.
   - Do NOT include author or source \u2014 they are appended automatically.

## Output Format
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

## Output Rules
- coreSummary: at most 3 bullets. chapterMap: empty array when isLongForm is false; keep exact timestamps from the video chapters when provided. When Video Sections are listed above, return EXACTLY one chapterMap entry per listed section, using the section's start time as "time" \u2014 give each a short title and a 1-sentence summary of what happens between that section and the next.
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to the egg's Key Questions above or to another user question \u2014 answer it only once.
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
var localize_egg_default = 'You are a knowledge curator for NutEgg.\n\n## Egg Description\n{{description}}\n\n## Egg Template\n{{template}}\n\n## Task\nTranslate and adapt the concrete instructions, questions, criteria, and rule descriptions in the template above so they use the SAME LANGUAGE as the egg description: "{{description}}".\n\n## Output Rules:\n1. Language: All explanations, questions, criteria, and rule guidance must be written in the same language as the egg description: "{{description}}".\n2. Egg Parser Structure: The structure and these exact labels MUST remain in English:\n   - Frontmatter (`---`, `topic: ...`, `status: ...`, `last_updated: ...`)\n   - Callout: `> [!abstract]- Instructions:`\n   - Bold section labels: `> **Scope:**`, `> **Action Guide:**`, `> **Key Questions:**`, `> **Rejection Criteria:**`, `> **Formatting Rules:**`\n   - Step labels in Action Guide: `1. Title Verdict:`, `2. Core Summary:`, `3. Chapter Map (Long-form only):`, `4. Novel Delta:`, `5. Decide:`\n   - Headings: `# Knowledge` and `# Unprocessed`\n   - Tag names in Formatting Rules: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`\n\nOutput ONLY the complete updated egg file markdown. Do NOT wrap in markdown code fences.\n\n';

// src/workflow/shared-output-rules.md
var shared_output_rules_default = '- Grounding: The content is the ONLY source of truth for every answer and summary you produce. Report what the content actually says even when it contradicts common sense or well-known facts \u2014 never correct, refute, or supplement it with outside knowledge. If the content does not address a question, say "Not covered in this content".\n- Output Language: Write ALL output text (verdicts, summaries, answers, knowledge entries, reasons) in the same language as this reference: "{{egg_description}}". Keep all JSON keys in English.';

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

// src/workflow/README.md
var README_default = '# NutEgg AI Workflow & Prompt Reference\n\nWelcome to the **NutEgg Workflow Engine**. The files in this folder define the prompts, instructions, and schemas that power NutEgg\'s AI extraction and knowledge synthesis pipeline.\n\n- \u{1F310} **Chrome Extension:** [NutEgg on Chrome Web Store](https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol)\n- \u{1F48E} **Obsidian Plugin:** [NutEgg on Obsidian Community Plugins](https://community.obsidian.md/plugins/nutegg)\n\n> [!TIP]\n> You can freely edit and customize any file in this directory to tailor NutEgg\'s analysis to your specific needs (e.g. changing the tone, adding domain-specific perspectives, or adjusting extraction depth).\n\n---\n\n## Architecture Overview\n\nNutEgg uses a **Two-Stage Analysis Architecture** designed for high precision, token efficiency, and user control. Rather than running a monolithic prompt, NutEgg separates broad content understanding from deep, egg-specific knowledge comparison.\n\n```\n                    \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n                    \u2502      Captured Web Content     \u2502\n                    \u2502   (Article / YouTube / Tweet) \u2502\n                    \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n                                    \u2502\n                                    \u25BC\n       ===========================================================\n       STAGE 1: Content Analysis & Summary-Based Egg Routing\n       ===========================================================\n                                    \u2502\n                         Is content >30k chars?\n                            \u251C\u2500\u2500 No  \u2500\u2500\u25BA [content-analysis.md]\n                            \u2514\u2500\u2500 Yes \u2500\u2500\u25BA Chunks + [aggregate-content.md]\n                                    \u2502\n                                    \u25BC\n                   Produces: Title Verdict, 3-Bullet Summary,\n                   Chapter Map, & Custom Question Answers\n                                    \u2502\n                                    \u25BC\n                           [egg-routing.md]\n           (Routes matched eggs from _index.md using the\n            concise Stage 1 summary instead of raw content)\n                                    \u2502\n                                    \u25BC\n       ===========================================================\n       INTERACTIVE CHOICE / EXECUTION MODE (Chrome Extension)\n       ===========================================================\n                                    \u2502\n                        Which mode is selected?\n                            \u2502\n            \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n            \u25BC                               \u25BC\n       [Fast Mode]                 [Confirm Eggs Mode]\n       Automatically proceeds      User reviews matched eggs:\n       to Stage 2 with all         \u251C\u2500\u2500 "Collect Nut Only" (skip Stage 2)\n       matched eggs.               \u2514\u2500\u2500 Add/remove eggs \u2500\u2500\u25BA Proceed\n            \u2502                               \u2502\n            \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n                            \u25BC\n       ===========================================================\n       STAGE 2: Per-Egg Knowledge Extraction & Novelty Comparison\n       ===========================================================\n                            \u2502\n               For each confirmed egg (1 or N):\n                            \u2502\n                            \u25BC\n                    [egg-analysis.md]\n              (Extract candidate knowledge entries\n               & key questions scoped to this egg)\n                            \u2502\n                            \u25BC\n                    [egg-compare.md]\n              (Diffs candidate entries against the\n               egg\'s existing # Knowledge tree to find\n               true novel insights & decide read verdict)\n                            \u2502\n                            \u25BC\n                 Results returned to Popup\n                 (Ready to Save Nut & Eggs)\n```\n\n> [!NOTE]\n> **Why Summary-Based Routing?**\n> Passing the Stage 1 summary to `egg-routing.md` instead of full raw articles or multi-hour video transcripts saves tens of thousands of tokens per capture and dramatically improves routing accuracy by focusing on distilled, high-signal semantic themes.\n\n---\n\n### Execution Modes\n\n| Mode | Behavior | Best Used For |\n|---|---|---|\n| **Fast Mode** | Runs Stage 1 content analysis, routes eggs automatically, and immediately executes Stage 2 knowledge comparison in one uninterrupted pass. | Everyday reading and quick captures when you trust automatic egg matching. |\n| **Confirm Eggs Mode** | Runs Stage 1 content analysis, then pauses in the popup. Shows matched eggs alongside your vault\'s full egg list. You can add/remove eggs, proceed with knowledge comparison, or click **Collect Nut Only** to save the note immediately without comparing against eggs. | Deep research, ambiguous topics, or when you only want a quick summary without updating egg knowledge trees. |\n\n---\n\n### Long Content (>30k Chars) Pipeline\n\nFor long articles, papers, or video transcripts (>30k characters), content is automatically split into timestamped or paragraph chunks (<=30k chars each) and aggregated in both stages:\n\n```\n  Captured Long Content \u2500\u2500\u25BA Split into Chunks (Part 1, Part 2, ... Part N)\n                                \u2502\n       \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n       \u25BC                                                 \u25BC\n  Stage 1: Content Summary                          Stage 2: Per-Egg Knowledge\n  Run [content-analysis.md]                         For each confirmed egg:\n  for each chunk                                    Run [egg-analysis.md] + [egg-compare.md]\n       \u2502                                            for each chunk\n       \u25BC                                                 \u2502\n  [aggregate-content.md]                                 \u25BC\n  Merges chunk summaries into ONE                   [aggregate-egg.md]\n  cohesive title verdict, 3-bullet                  Synthesizes cross-part findings\n  core summary, and custom Q&A.                     into unified novel delta, answers\n       \u2502                                            key questions, & read verdict.\n       \u25BC                                                 \u2502\n  [egg-routing.md]                                       \u2502\n  (Routes eggs via aggregated summary)                   \u2502\n       \u2502                                                 \u2502\n       \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n                                \u2502\n                                \u25BC\n                    Results returned to Popup\n```\n\n---\n\n### Other Workflows (Independent of Capture)\n\n```\n  User asks follow-up questions in Chrome popup\n     \u2514\u2500\u2500\u25BA [follow-up.md] (interactive Q&A, 1 AI call per batch)\n\n  Unprocessed entries accumulate in an egg note (20+ threshold or manual button)\n     \u2514\u2500\u2500\u25BA [merge-unprocessed.md] (merge into # Knowledge tree, 1 AI call)\n\n  User creates a new egg with a non-English description\n     \u2514\u2500\u2500\u25BA [localize-egg.md] (translate egg template, 1 AI call)\n```\n\n---\n\n## Prompt Dependency & Injection Map\n\nSome prompt files are **shared fragments** that are not executed independently, but are injected into other prompts via `{{placeholder}}` variables at runtime:\n\n```mermaid\nflowchart TD\n    subgraph Shared ["1. Shared Fragments (Injected via Placeholders)"]\n        direction TB\n        SOR["shared-output-rules.md<br/><i>(Grounding directive & output language)</i>"]\n        CTD["content-task-default.md<br/><i>(Default content analysis tasks)</i>"]\n    end\n\n    subgraph Capture ["2. Content Capture & Synthesis Pipeline"]\n        direction TB\n        CA["content-analysis.md<br/><i>(Stage 1: Content summary & Q&A)</i>"]\n        ROUT["egg-routing.md<br/><i>(Stage 1: Summary-based egg routing)</i>"]\n        EA["egg-analysis.md<br/><i>(Stage 2: Per-egg knowledge extraction)</i>"]\n        CMP["egg-compare.md<br/><i>(Stage 2: Knowledge tree diff)</i>"]\n        EC["egg-combined.md<br/><i>(Single-egg 1-call fast path)</i>"]\n        AC["aggregate-content.md<br/><i>(Stage 1 chunk aggregation)</i>"]\n        AE["aggregate-egg.md<br/><i>(Stage 2 chunk aggregation)</i>"]\n\n        CA --> ROUT\n        ROUT --> EA\n        EA --> CMP\n    end\n\n    subgraph Independent ["3. Independent Features"]\n        direction TB\n        FU["follow-up.md<br/><i>(Interactive popup Q&A)</i>"]\n        MU["merge-unprocessed.md<br/><i>(20+ entries knowledge merge)</i>"]\n        LOC["localize-egg.md<br/><i>(Translate new egg template)</i>"]\n        FU ~~~ MU ~~~ LOC\n    end\n\n    Shared ~~~ Capture\n    Capture ~~~ Independent\n\n    %% Injection connections\n    CTD -.->|"{{content_task_default}}"| CA\n    CTD -.->|"{{content_task_default}}"| AC\n\n    SOR -.->|"{{shared_output_rules}}"| CA\n    SOR -.->|"{{shared_output_rules}}"| EA\n    SOR -.->|"{{shared_output_rules}}"| CMP\n    SOR -.->|"{{shared_output_rules}}"| EC\n    SOR -.->|"{{shared_output_rules}}"| AC\n    SOR -.->|"{{shared_output_rules}}"| AE\n    SOR -.->|"{{shared_output_rules}}"| FU\n```\n\n---\n\n## Anatomy of an Egg File & How Instructions Work\n\nAn **Egg file** (`nutegg/*.md`) is both a curated knowledge repository and an instruction manual that guides NutEgg\'s AI pipeline whenever content touches that domain.\n\n### 1. Structural Blueprint\n\n```markdown\n---\ntopic: "AI Architecture & Multi-Agent Systems"\nstatus: "active"\nlast_updated: "2026-09-10"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** Multi-agent architectures, tool calling, memory layers, and LLM evaluation.\n> **Action Guide:** Focus on actionable design patterns, scalability tradeoffs, and real failure modes.\n> **Key Questions:**\n> 1. How are agent memory loops bounded to prevent context window overflow?\n> 2. What coordination mechanism is used between subagents?\n> **Rejection Criteria:**\n> - Ignore basic beginner tutorials or high-level sales pitches without technical substance.\n> - Discard speculative claims lacking empirical benchmarks or code evidence.\n> **Formatting Rules:**\n> - Prefix each insight with a bracketed tag: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`.\n> - Use the structure: `- [tag] **Concept Name**` followed by an indented explanation and concrete examples (`- \u{1F3AF} Example:`).\n\n# Knowledge\n## Agent Memory\n- [architecture] **Bounded Replay Buffers**\n    - Ephemeral short-term memory expires after session goals terminate to conserve token budget.\n    - \u{1F3AF} Example: Tool calling trace logs stored in vector stores with sliding window eviction.\n\n# Unprocessed\n(Newly hatched insights land here from captures until auto-merged)\n```\n\n### 2. How to Write Egg Instructions\n\nEach field in the `> [!abstract]- Instructions:` callout controls a specific behavior in the AI workflow:\n\n| Field | Purpose & Best Practices | Workflow Usage |\n|---|---|---|\n| **`**Scope:**`** | 1\u20132 sentences defining the topical boundaries of this egg. Specify what technologies, domains, or concepts are included and excluded. | Injected into [`egg-analysis.md`](./egg-analysis.md) (Stage 2) so the AI extracts knowledge through this domain lens. |\n| **`**Action Guide:**`** | 2-step instructions for Stage 2 egg analysis: Step 1 (Novel Delta: extract only genuinely new insights) and Step 2 (Decide: whether user should spend time reading). | Injected into [`egg-analysis.md`](./egg-analysis.md) and [`egg-compare.md`](./egg-compare.md) (Stage 2). |\n| **`**Key Questions:**`** | Numbered list of recurring questions you want answered whenever content touches this domain (e.g. *"What are the hidden tradeoffs?", "What is the token cost?"*). | Injected into [`egg-analysis.md`](./egg-analysis.md) (Stage 2). Answered in the popup and raw capture notes. |\n| **`**Rejection Criteria:**`** | Bulleted list of low-signal filters (e.g. *"Ignore beginner tutorials", "Reject speculative price talk"*). | Injected into [`egg-compare.md`](./egg-compare.md) (Stage 2). If matched, flags `rejected: true`, sets `readVerdict: false`, and gives a skip reason. |\n| **`**Formatting Rules:**`** | Standards for phrasing, tags (`[concept]`, `[architecture]`, `[method]`, etc.), and hierarchical indentation. | Injected into [`egg-analysis.md`](./egg-analysis.md) (Stage 2). Guarantees candidate entries match your notes\' formatting. |\n\n### 3. Knowledge Tree vs. Unprocessed Queue\n\n- **`# Knowledge` (Curated Knowledge Tree)**:\n  - Structured with markdown headings (`##`, `###`) and indented bullet points.\n  - Injected as `{{knowledge_tree}}` into [`egg-compare.md`](./egg-compare.md) (Stage 2). The AI compares extracted candidate insights against this tree to filter out redundant concepts and surface only true **Novel Delta**.\n- **`# Unprocessed` (Staging Queue)**:\n  - When you click **\u{1F95A} Hatch Egg** in the browser, fresh insights are safely appended to `# Unprocessed` first. This prevents AI runs from corrupting your curated knowledge tree.\n  - When 20+ entries accumulate (or when you click **Merge** in the Obsidian reading view widget), [`merge-unprocessed.md`](./merge-unprocessed.md) runs automatically to deduplicate and nest pending entries under appropriate parent concepts in `# Knowledge`.\n\n### 4. End-to-End Workflow Mapping\n\n```\n                                  [Captured Web Content]\n                                            \u2502\n               Stage 1: Content Analysis    \u25BC    _index.md (Topic routing guide)\n               \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n               \u2022 Uses content-task-default.md (fixed content tasks)\n               \u2022 Generates Title Verdict, 3-Bullet Summary, Chapter Map\n               \u2022 egg-routing.md matches egg descriptions via Stage 1 summary\n                                            \u2502\n                                            \u25BC\n               Interactive Review: User confirms or selects target eggs\n                                            \u2502\n               Stage 2: Per-Egg Deep Dive   \u25BC    Target Egg File (nutegg/*.md)\n               \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n               \u2022 Scope, Key Questions, Formatting Rules \u2500\u2500\u25BA egg-analysis.md\n                 (Extracts candidate knowledge entries and answers questions)\n               \u2022 Rejection Criteria, # Knowledge Tree \u2500\u2500\u25BA egg-compare.md\n                 (Diffs candidates against existing tree, drops redundant entries)\n                                            \u2502\n                                            \u25BC\n               Hatch Egg: Confirmed novel entries appended to # Unprocessed\n                                            \u2502\n               Merge Cycle (20+ entries or button click)\n               \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n               \u2022 merge-unprocessed.md nests and integrates entries into # Knowledge\n```\n\n---\n\n## Workflow File Directory\n\n### 1. Shared Fragments\n\nThese are **not standalone prompts** \u2014 they are modular snippets injected as `{{placeholders}}` into other prompts.\n\n| File | Injected As | Injected Into | Purpose |\n|---|---|---|---|\n| [`shared-output-rules.md`](./shared-output-rules.md) | `{{shared_output_rules}}` | `content-analysis`, `egg-analysis`, `egg-compare`, `egg-combined`, `aggregate-content`, `aggregate-egg`, `follow-up` | Combined grounding directive (content as sole truth) and multi-lingual output language reference rule. |\n| [`content-task-default.md`](./content-task-default.md) | `{{content_task_default}}` | `content-analysis`, `aggregate-content` | Default fixed tasks for content analysis: Title Verdict, 3-Bullet Core Summary, and Chapter Map. |\n\n### 2. Content Capture Pipeline\n\n| File | Pipeline Stage | Purpose | Output Format |\n|---|---|---|---|\n| [`content-analysis.md`](./content-analysis.md) | Stage 1: Content Analysis | Content-level summary: title verdict, 3-bullet summary, chapter map, and custom user question answers. | JSON (`titleVerdict`, `coreSummary`, `isLongForm`, `chapterMap`, `customQuestionAnswers`) |\n| [`egg-routing.md`](./egg-routing.md) | Stage 1: Summary-Based Routing | Matches the Stage 1 content summary against egg descriptions in `_index.md` to select matching eggs with minimal tokens. | Plain text list of filenames (one per line) |\n| [`egg-analysis.md`](./egg-analysis.md) | Stage 2: Egg Extraction | Per-egg extraction: candidate knowledge entries and key question answers scoped strictly to one egg\'s instructions. | JSON (`keyQuestionAnswers`, `extractedEntries`) |\n| [`egg-compare.md`](./egg-compare.md) | Stage 2: Knowledge Diff | Diffs candidate entries against the egg\'s existing `# Knowledge` tree and `# Unprocessed` to find novel insights and determine read verdict. | JSON (`novelDelta`, `redundantEntries`, `rejected`, `rejectReason`, `readVerdict`, `readVerdictReason`) |\n| [`egg-combined.md`](./egg-combined.md) | Single-Egg Fast Path / Fallback | Combined 1-call prompt: content summary + chapter map + candidate knowledge entries for a single egg. | JSON (`titleVerdict`, `coreSummary`, `chapterMap`, `customQuestionAnswers`, `keyQuestionAnswers`, `extractedEntries`) |\n\n### 3. Long Content Aggregation\n\nUsed only when content exceeds ~30k characters (long articles, 1-2 hour videos). Each chunk is processed through extraction first, then these prompts synthesize the per-chunk results.\n\n| File | Pipeline Stage | Purpose | Output Format |\n|---|---|---|---|\n| [`aggregate-content.md`](./aggregate-content.md) | Stage 1 Aggregation | Merges per-chunk summaries into one cohesive title verdict, core summary, and user Q&A for the whole content. | JSON (`titleVerdict`, `coreSummary`, `customQuestionAnswers`) |\n| [`aggregate-egg.md`](./aggregate-egg.md) | Stage 2 Aggregation | Synthesizes per-chunk findings into unified knowledge entries, key question answers, and read verdict for each egg. | JSON (`novelDelta`, `keyQuestionAnswers`, `rejected`, `rejectReason`, `readVerdict`, `readVerdictReason`) |\n\n### 4. Independent Features\n\n| File | Trigger | Purpose | Output Format |\n|---|---|---|---|\n| [`follow-up.md`](./follow-up.md) | User asks questions in Chrome popup | Answers follow-up questions about the captured content with conversation history context. | JSON (`answers`: `[{"question", "answer"}]`) |\n| [`merge-unprocessed.md`](./merge-unprocessed.md) | Manual button or 20+ entries threshold | Deduplicates and nests accumulated `# Unprocessed` entries into the structured `# Knowledge` tree. | JSON (`knowledge`, `unprocessed`) |\n| [`localize-egg.md`](./localize-egg.md) | New egg with non-English description | Translates the egg template into the language of the egg\'s description while keeping parser-critical headings in English. | Full egg note (Markdown) |\n\n---\n\n## Customization Rules & Guidelines\n\n### \u2705 What You Can Safely Customize\n- **Tone and Perspective**: You can instruct the AI to be more critical, more technical, or focus on specific themes.\n- **Summary Depth**: You can change how concise or detailed summaries should be.\n- **Language / Idiom Preferences**: You can tweak phrasing, formatting preferences, or custom analytical lenses.\n- **Shared Output Rules**: Edit `shared-output-rules.md` to adjust how strictly the AI stays grounded to the source content or handles output languages across all prompts.\n\n### \u26A0\uFE0F What You Must Preserve (To Prevent Parser Errors)\n1. **`{{placeholders}}`**: The strings enclosed in double curly braces (e.g. `{{content}}`, `{{egg_description}}`, `{{knowledge_tree}}`) are replaced dynamically by the engine. Do not delete or rename them.\n2. **JSON Schemas**: Prompts that output JSON must keep the exact JSON key names specified in the template. The TypeScript engine parses these exact keys.\n3. **Markdown Structural Headings**: In prompts that output markdown (`localize-egg.md`), structural labels and headings like `# Knowledge` and `# Unprocessed` must remain verbatim in English for the note parser.\n\n---\n\n## Updates & Conflict Resolution\n\nWhen NutEgg updates to a newer version:\n- **If you haven\'t edited a workflow file**: The plugin automatically updates it to the latest version.\n- **If you have customized a workflow file**: NutEgg will **never overwrite your custom version**. Instead, it writes `[filename].new.md` alongside your file so you can inspect what changed in the update.\n- **Obsolete prompt cleanup**: Any unedited prompt files that were removed in a newer release of NutEgg are automatically pruned so your `_workflow/` folder stays clean.\n- **Use Defaults (Clean Reset)**: You can reset all workflow files back to factory defaults at any time from `Obsidian Settings \u2192 NutEgg \u2192 Use Default Workflow Prompts` by clicking **Use Defaults**. This safely moves all your existing files to a timestamped backup folder (`_workflow/_backup/<timestamp>/`), clears obsolete files, and restores clean built-in defaults.\n';

// src/workflow-manager.ts
var WORKFLOW_FILE_MAP = {
  contentAnalysis: "content-analysis.md",
  eggAnalysis: "egg-analysis.md",
  eggCombined: "egg-combined.md",
  eggCompare: "egg-compare.md",
  followUp: "follow-up.md",
  eggRouting: "egg-routing.md",
  contentTaskDefault: "content-task-default.md",
  mergeUnprocessed: "merge-unprocessed.md",
  aggregateContent: "aggregate-content.md",
  aggregateEgg: "aggregate-egg.md",
  localizeEgg: "localize-egg.md",
  sharedOutputRules: "shared-output-rules.md"
};
var BUILTIN_WORKFLOW_FILES = {
  "README.md": README_default,
  "content-analysis.md": PROMPTS.contentAnalysis,
  "egg-analysis.md": PROMPTS.eggAnalysis,
  "egg-combined.md": PROMPTS.eggCombined,
  "egg-compare.md": PROMPTS.eggCompare,
  "follow-up.md": PROMPTS.followUp,
  "egg-routing.md": PROMPTS.eggRouting,
  "content-task-default.md": PROMPTS.contentTaskDefault,
  "merge-unprocessed.md": PROMPTS.mergeUnprocessed,
  "aggregate-content.md": PROMPTS.aggregateContent,
  "aggregate-egg.md": PROMPTS.aggregateEgg,
  "localize-egg.md": PROMPTS.localizeEgg,
  "shared-output-rules.md": PROMPTS.sharedOutputRules
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
      let file = this.plugin.app.vault.getAbstractFileByPath(filePath);
      const existsOnDisk = await this.plugin.app.vault.adapter.exists(filePath);
      if (!file && !existsOnDisk) {
        try {
          await this.plugin.app.vault.create(filePath, builtinContent);
          this.cache.set(filename, builtinContent);
          this.plugin.settings.workflowHashes[filename] = builtinHash;
          settingsChanged = true;
          console.log(`[NutEgg] Seeded workflow file: ${filePath}`);
        } catch (err) {
          console.warn(`[NutEgg] Could not create ${filePath}:`, err);
        }
      } else {
        try {
          let vaultContent;
          if (file instanceof TFile) {
            vaultContent = await this.plugin.app.vault.read(file);
          } else {
            vaultContent = await this.plugin.app.vault.adapter.read(filePath);
          }
          this.cache.set(filename, vaultContent);
          const currentVaultHash = simpleHash(vaultContent);
          const recordedHash = this.plugin.settings.workflowHashes[filename];
          if (currentVaultHash === builtinHash) {
            if (recordedHash !== builtinHash) {
              this.plugin.settings.workflowHashes[filename] = builtinHash;
              settingsChanged = true;
            }
          } else if (recordedHash && recordedHash === currentVaultHash) {
            if (file instanceof TFile) {
              await this.plugin.app.vault.modify(file, builtinContent);
            } else {
              await this.plugin.app.vault.adapter.write(filePath, builtinContent);
            }
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
            const newExistsOnDisk = await this.plugin.app.vault.adapter.exists(newPath);
            if (!existingNew && !newExistsOnDisk) {
              try {
                await this.plugin.app.vault.create(newPath, builtinContent);
                console.log(`[NutEgg] Saved updated workflow template to: ${newPath}`);
                new Notice(
                  `[NutEgg] Workflow update available for ${filename}. Your custom file was preserved; see ${baseName}.new.md to compare.`,
                  8e3
                );
              } catch {
              }
            }
          }
        } catch (err) {
          console.warn(`[NutEgg] Error reading workflow file ${filePath}:`, err);
        }
      }
    }
    const localFiles = this.getWorkflowFiles();
    for (const file of localFiles) {
      const relName = file.path.slice(folder.length + 1);
      if (!(relName in BUILTIN_WORKFLOW_FILES) && !relName.endsWith(".new.md")) {
        const recordedHash = this.plugin.settings.workflowHashes[relName];
        if (recordedHash) {
          const content = await this.plugin.app.vault.read(file);
          if (simpleHash(content) === recordedHash) {
            await this.plugin.app.vault.delete(file);
            delete this.plugin.settings.workflowHashes[relName];
            this.cache.delete(relName);
            settingsChanged = true;
            console.log(`[NutEgg] Auto-removed obsolete unmodified workflow file: ${file.path}`);
          }
        }
      }
    }
    if (settingsChanged) {
      await this.plugin.saveSettings();
    }
  }
  /** Retrieve all workflow files in workflowFolder, excluding _backup/ */
  getWorkflowFiles() {
    const folder = this.workflowFolder;
    const vault = this.plugin.app.vault;
    let allFiles = [];
    if (typeof vault.getFiles === "function") {
      allFiles = vault.getFiles();
    } else if (typeof vault.getMarkdownFiles === "function") {
      allFiles = vault.getMarkdownFiles();
    }
    return allFiles.filter(
      (f) => f.path.startsWith(`${folder}/`) && !f.path.startsWith(`${folder}/_backup/`) && !f.path.endsWith("/_backup")
    );
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
  /**
   * Reset workflow files to built-in defaults:
   * 1. Moves ALL current files in workflowFolder to a timestamped backup folder.
   * 2. Copies clean built-in prompt files into workflowFolder.
   * 3. Resets cache and workflow hashes.
   */
  async resetToDefaults() {
    const folder = this.workflowFolder;
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const backupFolder = `${folder}/_backup/${timestamp}`;
    await this.ensureFolder(backupFolder);
    const existingFiles = this.getWorkflowFiles();
    for (const file of existingFiles) {
      const relName = file.path.slice(folder.length + 1);
      const lastSlash = relName.lastIndexOf("/");
      if (lastSlash !== -1) {
        await this.ensureFolder(`${backupFolder}/${relName.slice(0, lastSlash)}`);
      }
      const content = await this.plugin.app.vault.read(file);
      await this.plugin.app.vault.create(`${backupFolder}/${relName}`, content);
      await this.plugin.app.vault.delete(file);
    }
    this.cache.clear();
    this.plugin.settings.workflowHashes = {};
    for (const [filename, builtinContent] of Object.entries(BUILTIN_WORKFLOW_FILES)) {
      const filePath = `${folder}/${filename}`;
      await this.plugin.app.vault.create(filePath, builtinContent);
      this.cache.set(filename, builtinContent);
      this.plugin.settings.workflowHashes[filename] = simpleHash(builtinContent);
    }
    await this.plugin.saveSettings();
    new Notice(`[NutEgg] Reset workflow files to defaults. Previous files moved to ${backupFolder}`);
  }
  /** Alias for backward compatibility */
  async syncToDefaults() {
    return this.resetToDefaults();
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
      try {
        const exists = await this.plugin.app.vault.adapter.exists(currentPath);
        if (!exists) {
          await this.plugin.app.vault.createFolder(currentPath);
        }
      } catch {
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
  (0, import_node_test.it)("resetToDefaults moves all existing files to backup and restores built-in defaults", async () => {
    const customContent = "Custom prompt before reset";
    const obsoletePrompt = "Deprecated prompt that is no longer in code";
    const { manager, files, plugin } = makeManager({
      "nutegg/_workflow/content-analysis.md": customContent,
      "nutegg/_workflow/obsolete-prompt.md": obsoletePrompt
    });
    await manager.init();
    await manager.resetToDefaults();
    import_strict.default.equal(
      files.get("nutegg/_workflow/content-analysis.md"),
      BUILTIN_WORKFLOW_FILES["content-analysis.md"]
    );
    import_strict.default.equal(files.has("nutegg/_workflow/obsolete-prompt.md"), false);
    const customBackup = [...files.keys()].find(
      (k) => k.startsWith("nutegg/_workflow/_backup/") && k.endsWith("content-analysis.md")
    );
    import_strict.default.ok(customBackup);
    import_strict.default.equal(files.get(customBackup), customContent);
    const obsoleteBackup = [...files.keys()].find(
      (k) => k.startsWith("nutegg/_workflow/_backup/") && k.endsWith("obsolete-prompt.md")
    );
    import_strict.default.ok(obsoleteBackup);
    import_strict.default.equal(files.get(obsoleteBackup), obsoletePrompt);
    import_strict.default.equal(
      plugin.settings.workflowHashes["content-analysis.md"],
      simpleHash(BUILTIN_WORKFLOW_FILES["content-analysis.md"])
    );
    import_strict.default.equal(plugin.settings.workflowHashes["obsolete-prompt.md"], void 0);
  });
  (0, import_node_test.it)("ensureWorkflowFiles auto-removes unmodified obsolete prompts from prior versions", async () => {
    const oldPromptContent = "Old unmodified prompt from prior version";
    const oldHash = simpleHash(oldPromptContent);
    const { manager, files, plugin } = makeManager(
      {
        "nutegg/_workflow/deprecated.md": oldPromptContent
      },
      {
        workflowHashes: {
          "deprecated.md": oldHash
        }
      }
    );
    await manager.init();
    import_strict.default.equal(files.has("nutegg/_workflow/deprecated.md"), false);
    import_strict.default.equal(plugin.settings.workflowHashes["deprecated.md"], void 0);
  });
});
