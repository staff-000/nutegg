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

// ../shared/workflow/content-analysis.md
var content_analysis_default = 'You are a knowledge curator. Analyze the content below following the Task.\n\n## Content to Analyze\n**Title:** {{title}}\n**Source:** {{url}}\n**Type:** {{source_type}}\n{{part_note}}{{chapters}}\n{{questions}}\n\n{{content}}\n\n## Task\n{{content_task_default}}\n\n## Output Format\nRespond with ONLY a valid JSON object matching this schema (no markdown, no code fence, just the JSON object):\nThe `time` field shown on mind-map nodes is optional: include it only when a source timestamp supports that node.\n{\n  "titleVerdict": "direct answer to the title\'s question",\n  "coreSummary": ["bullet 1", "bullet 2", "bullet 3"],\n  "mindMap": [\n    {\n      "name": "First Main Topic / Theme",\n      "detail": "Core idea or thesis of this branch",\n      "time": "12:34",\n      "children": [\n        {\n          "name": "Subtopic / Concept",\n          "time": "12:34",\n          "detail": "Key reasoning, mechanism, or explanation",\n          "children": [\n            {\n              "name": "Detail / Evidence",\n              "detail": "Concrete takeaway or example"\n            }\n          ]\n        }\n      ]\n    },\n    {\n      "name": "Second Main Topic / Theme",\n      "detail": "Core idea or thesis of this branch",\n      "children": [\n        {\n          "name": "Subtopic / Concept",\n          "detail": "Key reasoning, mechanism, or explanation"\n        }\n      ]\n    }\n  ],\n  "customQuestionAnswers": [\n    {\n      "question": "exact question text",\n      "answer": "direct answer",\n      "sources": [{"ref": "12:34", "quote": "brief supporting quote"}]\n    }\n  ]\n}\n\n## Output Rules\n- titleVerdict must be a single sentence.\n- coreSummary: at most 3 bullets, plain language.\n- mindMap: main branches/topics directly at the root level (do NOT wrap everything in a single overall root node; start directly with the main themes/sections), up to 3 levels deep total. Each node has a concise name and rich explanatory detail (1-2 sentences). Structure logically to form an outline/mind map of the author\'s ideas.\n- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to an Egg Key Question above or to another user question \u2014 answer it only once.\n- mindMap time: optional at any node. For timestamped video content, cite the exact source timestamp supporting that node, as MM:SS or H:MM:SS. Omit time when unavailable; never invent timestamps. Preserve source timestamps when combining branches, and do not substitute chunk start times for evidence.\n{{shared_output_rules}}\n';

// ../shared/workflow/egg-analysis.md
var egg_analysis_default = `Analyze this source according to the instructions for egg "{{egg_file}}". Produce the requested answers and results, not a comparison with saved knowledge.

## Egg Instructions
{{egg_instructions}}

## Stage 1 Context (not an endorsement or quality score)
{{stage1_signals}}

## Source
Title: {{title}}
URL: {{url}}
Type: {{source_type}}
{{part_note}}

{{content}}

## Entry Generation
{{entry_generation}}

## Task
1. Treat the egg\u2019s Scope, Action Guide and Formatting Rules as the primary specification for which insights to capture and how to present them. Use the Stage 1 mind map to locate relevant concepts, relationships and evidence; verify all claims and timestamps against the raw source. Do not convert every mind-map branch into an entry. The mind map may cover the whole work; in a chunk, use only evidence present in that part. Preserve useful AMA question\u2013answer pairs, examples, qualifications and disagreements. Do not repeat the general mind map or force every result into a concept/explanation template.
2. Answer the exact Key Questions directly with supporting source locations/brief quotes. Use "Not addressed in this content" (or "Not addressed in this part" for chunks) when there is no supported answer. Do not mistake missing coverage for an absent answer.
3. When entry generation is enabled, extract concise, substantive results as markdown entries specifically serving this egg\u2019s instructions. If the egg instructions ask for no knowledge entries, return extractedEntries: [] even when the UI enables generation. Lists/frameworks retain all supported items and order; a chunk may contain a partial framework for later assembly. Do not invent missing fragments. Avoid repeating the same answer in both keyQuestionAnswers and extractedEntries.
4. Recommend what the user gains by opening the original AFTER reading the condensed analysis:
   - full: useful depth spans the source.
   - highlights: specific worthwhile passages; identify their source locations.
   - summary: the condensed result covers the useful substance.
   - skip: poor fit, low substance, or dominated by Skip If.
   - uncertain: insufficient evidence or coverage.
   Apply Scope, Key Questions, Worth Reading If and Skip If to the evidence. Mixed content may warrant highlights rather than skipping it all. Empty preference lists use this rubric, never an automatic yes. Explain the benefit/limitation in one concise reason. For chunks this is provisional evidence for a whole-source decision.
5. Do not claim novelty relative to the user's notes, unfamiliarity to the user, external factual verification, or unseen visual demonstrations. Worth Reading If and Skip If affect only the recommendation. Entry-generation opt-outs take priority over extraction tasks. Never include author/source URL metadata in entry bodies; it is appended mechanically.

## Output Format
JSON only:
{
  "language": "English",
  "generateKnowledgeEntries": true,
  "keyQuestionAnswers": [{"question": "exact question", "answered": true, "answer": "supported answer", "sources": [{"ref": "12:34", "quote": "supporting quote"}]}],
  "extractedEntries": [{"kind": "insight", "content": "instruction-formatted markdown", "sources": [{"ref": "12:34", "quote": "supporting quote"}]}],
  "readAction": "highlights",
  "readVerdictReason": "What remains to gain from opening the source",
  "readingSources": [{"ref": "12:34", "quote": "evidence for the recommendation"}]
}
Set generateKnowledgeEntries=false when entry generation is disabled by the UI or the egg instructions (including an opt-out written in the Action Guide). In that case extractedEntries must be []. Otherwise set it to true. Entry kind is insight, list, or answer. Empty arrays are valid. Source ref is an available timestamp or section heading; never invent one. Keep answers and recommendation notes concise.
{{shared_output_rules}}

Set answered=false for unsupported/unaddressed answers, regardless of output language. Such answers are displayed but not hatched as insights.
`;

// ../shared/workflow/follow-up.md
var follow_up_default = `You are a knowledge curator. Answer the user's follow-up questions.

## Context / Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{prior_qa}}

{{content}}

## New Questions
{{questions}}

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "answers": [
    {
      "question": "exact question text",
      "answer": "direct answer",
      "sources": [{"ref": "12:34", "quote": "brief supporting quote"}]
    }
  ]
}

## Output Rules:
- One entry per question, in the same order.
- If a question is equivalent to one in Previous Questions & Answers, answer briefly with the same conclusion instead of repeating it.
{{shared_output_rules}}
`;

// ../shared/workflow/egg-routing.md
var egg_routing_default = 'Given this content and egg index, which egg file(s) does this content belong to? Return ONLY the file names, one per line. If none match, return "none".\n\n## Content\nTitle: {{title}}\nURL: {{url}}\n{{content}}\n\n## Egg Index\n{{index}}\n\nReturn matching file names (one per line):\n';

// ../shared/workflow/content-task-default.md
var content_task_default_default = "1. Title Verdict: Provide a single, direct sentence that resolves the core question posed in the title or introduction.\n2. Core Summary: Summarize the main concepts in plain language using a maximum of 3 bullet points.\n3. Mind Map: Construct a hierarchical concept tree capturing the core mental model or argument flow (up to 3 levels deep). Each node must have a concise `name` and informative explanatory `detail`. Use an optional `time` per Mind Map node for an exact supporting timestamp in video transcripts. Omit it for untimestamped sources; never invent a time.\n";

// ../shared/workflow/merge-unprocessed.md
var merge_unprocessed_default = `You are a knowledge curator for the egg file "{{egg_file}}". The Unprocessed section has accumulated {{unprocessed_count}} entries \u2014 merge them into the knowledge tree below.

## Formatting Rules
{{formatting_rules}}

## Existing Knowledge Tree
{{knowledge_tree}}

## Entries to Merge
{{unprocessed}}

## Task
1. Preserve existing user-authored branches and structure. Do not delete or rename them.
2. Consolidate genuinely equivalent claims across pending entries and the tree. Retain ALL distinct author/source lines, examples, caveats and qualifications. A familiar concept is not a reason to discard its new substantive details or attribution.
3. Assemble supported complementary fragments (an early partial mention and a later explanation) into a complete entry. Do not invent missing relationships or items.
4. For frameworks/lists from the same source/version, assemble fragments, preserve source order and every distinct item. Equal titles alone do not establish equivalence: different speakers, versions, dates or contexts remain distinguishable.
5. Preserve disagreements, contradictions and counterexamples explicitly with their sources. Never silently choose a winner or average incompatible claims into agreement.
6. Place consolidated entries under relevant parents; create minimal new branches only when needed. Unresolved fragments remain Unprocessed.
7. Reading preferences/recommendations are NEVER merge rejection criteria.
8. Return the COMPLETE tree and remaining Unprocessed. Never truncate either to fit the output.

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "knowledge": "the COMPLETE updated Knowledge section content as markdown \u2014 the existing tree with the merged entries nested in. Only the section BODY: do NOT include the '# Knowledge' heading line itself.",
  "unprocessed": "the entries that could not be merged (markdown), or an empty string when all were merged. Only the section BODY: do NOT include the '# Unprocessed' heading line itself."
}

## Output Rules:
- Output Language: write ALL output text (knowledge entries, explanations) in {{output_language}}. Keep JSON keys in English.
`;

// ../shared/workflow/aggregate-content.md
var aggregate_content_default = 'You are a knowledge curator. The content below was too long for one pass and was analyzed in parts. Combine the per-part results into ONE coherent result for the whole content.\n\n## Content\n**Title:** {{title}}\n**Source:** {{url}}\n{{chapters}}\n\n## Per-Part Summaries\n{{chunk_summaries}}\n\n{{questions}}\n\n## Task\n{{content_task_default}}\n\n## Output Format\nRespond in this EXACT JSON format (no markdown, no code fence, just the JSON object):\nThe `time` field shown on mind-map nodes is optional: include it only when a source timestamp supports that node.\n{\n  "titleVerdict": "direct answer to the title\'s question",\n  "coreSummary": ["bullet 1", "bullet 2"],\n  "mindMap": [\n    {\n      "name": "First Main Topic",\n      "detail": "Core idea",\n      "time": "12:34",\n      "children": [\n        {\n          "name": "Subtopic",\n          "detail": "Key reasoning",\n          "time": "12:45"\n        }\n      ]\n    },\n    {\n      "name": "Second Main Topic",\n      "detail": "Core idea",\n      "children": [\n        {\n          "name": "Subtopic",\n          "detail": "Key reasoning"\n        }\n      ]\n    }\n  ],\n  "customQuestionAnswers": [\n    {\n      "question": "exact question text",\n      "answer": "direct answer",\n      "sources": [{"ref": "00:00", "quote": "brief supporting quote"}]\n    }\n  ]\n}\n\n## Output Rules\n- mindMap: synthesized concept tree for the entire work, up to 3 levels deep, integrating points from across the parts. Have main branches directly at the root level (do NOT wrap in a single overall root node).\n- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). When citing sources, use timestamps or section headers from the Part summaries.\n- mindMap time: optional at any node. For timestamped video content, cite the exact source timestamp supporting that node, as MM:SS or H:MM:SS. Omit time when unavailable; never invent timestamps. Preserve source timestamps when combining branches, and do not substitute chunk start times for evidence.\n{{shared_output_rules}}\n';

// ../shared/workflow/aggregate-egg.md
var aggregate_egg_default = `Consolidate answers and a whole-source reading recommendation for egg "{{egg_file}}". You have compact per-part drafts, not the original source. Do not extract or assemble entries here.

## Scope
{{scope}}
## Exact Key Questions
{{key_questions}}
## Worth Reading If
{{worth_reading_if}}
## Skip If
{{skip_if}}
## Stage 1 Context (not an endorsement)
{{stage1_signals}}
## Ordered Per-Part Drafts and Coverage
{{chunk_findings}}

## Task
1. Give one concise supported answer per Key Question. Combine complementary drafts, retain disagreements and their references. A part's "not addressed" cannot override a supported answer elsewhere. Missing/failed parts are incomplete coverage, not negative evidence.
2. Decide for the WHOLE source: full (depth throughout), highlights (specific valuable passages), summary (condensed results suffice), skip (poor fit/low substance), uncertain (insufficient evidence/coverage). Use scope/questions and the two lists. Empty lists do not mean automatic yes. Never infer novelty relative to saved knowledge or unseen demonstrations.
3. Identify worthwhile source locations using only supplied references. A timestamp without evidence is insufficient. Explain what remains to gain from opening the source. Failed coverage requires uncertainty.
4. Do not produce entry bodies, compare existing knowledge, or invent links between unsupported drafts.

## Output Format
JSON only:
{
  "keyQuestionAnswers": [{"question": "exact question", "answered": true, "answer": "whole-source answer", "sources": [{"ref": "12:34", "quote": "supplied evidence"}]}],
  "readAction": "highlights",
  "readVerdictReason": "one concise reason",
  "readingSources": [{"ref": "12:34", "quote": "supplied evidence"}]
}
{{shared_output_rules}}

Set answered=false for unsupported/unaddressed answers, regardless of output language. Such answers are displayed but not hatched as insights.
`;

// ../shared/workflow/localize-egg.md
var localize_egg_default = 'You are a knowledge curator for NutEgg.\n\n## Egg Description\n{{description}}\n\n## Egg Template\n{{template}}\n\n## Task\nTranslate and adapt the concrete instructions, questions, criteria, and rule descriptions in the template above so they use the SAME LANGUAGE as the egg description: "{{description}}".\n\n## Output Rules:\n1. Language: All explanations, questions, criteria, and rule guidance must be written in the same language as the egg description: "{{description}}".\n2. Egg Parser Structure: The structure and these exact labels MUST remain in English:\n   - Frontmatter (`---`, `topic: ...`, `status: ...`, `last_updated: ...`, `language: <detected language name in English, e.g. English, Chinese, Japanese, Korean, Spanish, French, German, Russian>`)\n   - Callout: `> [!abstract]- Instructions:`\n   - Bold section labels: `> **Scope:**`, `> **Generate Knowledge Entries:**` (keep its value `yes` or `no`), `> **Action Guide:**`, `> **Key Questions:**`, `> **Worth Reading If:**`, `> **Skip If:**`, `> **Formatting Rules:**`\n   - Headings: `# Knowledge` and `# Unprocessed`\n   - Tag names in Formatting Rules: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`\n\nOutput ONLY the complete updated egg file markdown. Do NOT wrap in markdown code fences.\n\n';

// ../shared/workflow/shared-output-rules.md
var shared_output_rules_default = '- Grounding: The content is the ONLY source of truth for every answer and summary you produce. Report what the content actually says even when it contradicts common sense or well-known facts \u2014 never correct, refute, or supplement it with outside knowledge. If the content does not address a question, say "Not covered in this content".\n- Source References: For every question you answer (customQuestionAnswers, keyQuestionAnswers, answers), include a "sources" array citing WHERE in the content the answer comes from: `[{"ref": "...", "quote": "..."}]`.\n  - For video transcripts: `ref` must be the timestamp string (e.g. "12:34" or "1:05:30") where the relevant segment begins.\n  - For articles/webpages: `ref` must be the nearest section heading (e.g. "Methodology" or "Key Findings") or short location hint.\n  - `quote`: A brief verbatim excerpt (10-25 words) from that location directly supporting the answer.\n  - If the question is not covered in the content (or answered "Not covered in this content"), omit the "sources" field or return an empty array `[]`.\n- Output Language: Write ALL output text (verdicts, summaries, answers, knowledge entries, reasons) in {{output_language}}. Keep all JSON keys in English.';

// ../shared/src/prompt-templates.ts
var PROMPTS = {
  /** Phase 1 — content summary + mind map + custom question answers. */
  contentAnalysis: content_analysis_default,
  /** Step 1 extraction — content against one egg using instructions only. */
  eggAnalysis: egg_analysis_default,
  /** Follow-up questions after the initial analysis. */
  followUp: follow_up_default,
  /** Egg routing — match content to egg files from _index.md. */
  eggRouting: egg_routing_default,
  /** Default content analysis task (Title Verdict, Core Summary, Mind Map). */
  contentTaskDefault: content_task_default_default.trim(),
  /** Merge 20+ Unprocessed entries into the Knowledge tree. */
  mergeUnprocessed: merge_unprocessed_default,
  /** Combine per-part results into one result for long content. */
  aggregateContent: aggregate_content_default,
  /** Per-egg recommendation + key questions for long content (compact chunk drafts). */
  aggregateEgg: aggregate_egg_default,
  /** Localize egg template matching the description language while keeping parser structure in English. */
  localizeEgg: localize_egg_default,
  /** Shared output rules (grounding + language reference) injected into prompts. */
  sharedOutputRules: shared_output_rules_default.trim()
};

// ../shared/workflow/README.md
var README_default = "# NutEgg AI Workflow & Prompt Reference\n\nThese shared prompts power the extension and Obsidian plugin. Customize the Action Guide and Key Questions in each egg to highlight AMA answers, recurring video questions, or other results useful to you.\n\n## Pipeline\n\n```text\nCaptured content\n  \u2192 Stage 1: summary, title verdict, mind map, custom Q&A\n  \u2192 Summary-based egg routing and egg selection\n  \u2192 Stage 2: egg-analysis (one call per egg for short content)\n  \u2192 Answers, extracted entries, and reading recommendation\n  \u2192 User clicks Hatch: archive originals and append to # Unprocessed\n  \u2192 Merge at 20 pending entries or on demand: dedupe and organize # Knowledge\n```\n\nChanging selected eggs reuses the existing Stage 1 result. Stage 2 runs only for selected eggs without a captured result; previously analyzed eggs are displayed from the capture cache. Deselecting an egg hides its result while retaining it for reselection. Only currently selected eggs contribute to the reading recommendation and Hatch entries. Running a fresh Stage 1 analysis clears this cache.\n\nStage 2 reads the source and egg instructions, never the Knowledge tree or Unprocessed queue. Reading recommendations assess usefulness for your preferences rather than novelty against your notes. Hatch is independent of the recommendation: useful answers can be saved even when the original is skippable. There is no automatic Hatch.\n\n## Knowledge-entry generation\n\nStage 2 uses the Stage 1 mind map to navigate relevant concepts and source locations, while the egg\u2019s Scope, Action Guide and Formatting Rules decide what becomes an entry. Raw source evidence remains authoritative.\n\nSet `> **Generate Knowledge Entries:** no` in an egg\u2019s Instructions callout to disable entries for that egg. Omitting the setting or using `yes` permits generation. An opt-out in the Action Guide is also honored by the prompt.\n\nThe **\u{1F343} Knowledge** option in **Analysis Sections** and the Egg Analysis dropdown share one per-tab setting. Choosing **\u{1F95A} Analysis only** turns Knowledge off on both pages; choosing **\u{1F343} Include knowledge** turns it on. Toggling Knowledge updates the dropdown\u2019s checkmark as well. Clicking a dropdown choice also runs analysis; toggling the section option alone does not start an AI call.\n\nKnowledge-entry generation follows these rules:\n\n| UI setting | Egg instructions | Result |\n|---|---|---|\n| Off / Analysis only | Any | No new knowledge entries; existing entries stay visible |\n| On / Include knowledge | Explicit `no`, or Action Guide opts out | No entries for that egg |\n| On / Include knowledge | `yes` or unspecified | Generate entries according to the egg instructions |\n\nEither an off UI setting or an egg opt-out disables generation; an on setting never overrides an opt-out. The initial default is **Include knowledge**. Your last choice is saved as the default for tabs without analysis, including after reopening the panel. Processed tabs retain their own choice. Key-question answers and reading recommendations are produced regardless. Generation does not save to egg files: **\u{1F423} Hatch Egg** is the separate save action, enabled when generated entries are available.\n\nChanging the generation setting does not hide or remove entries already generated, and those entries remain available to Hatch. Turning generation on after an answers-only analysis requires Stage 2 for eggs without previously generated entries; eggs that explicitly opt out are not rerun just to request entries.\n\n\n## Egg structure\n\nKeep structural labels in English, including in localized eggs:\n\n```markdown\n> [!abstract]- Instructions:\n> **Scope:** Agent architectures and practical tradeoffs.\n> **Action Guide:** Highlight substantial questions, important answers, and limitations.\n> **Key Questions:**\n> - Which failure modes are demonstrated?\n> **Worth Reading If:**\n> - Practical examples or tradeoffs need attention beyond the summary.\n> **Skip If:**\n> - Mostly introductory definitions or promotion.\n> **Formatting Rules:** Use concise answers with source locations.\n\n# Knowledge\n\n# Unprocessed\n```\n\nWorth Reading If and Skip If only guide recommendations; they never remove entries during merge. Existing Rejection Criteria sections require manual migration into Skip If. Do not ask Stage 2 to compare with existing notes, which it cannot see.\n\n## Prompt directory\n\n| File | Purpose | Main output |\n|---|---|---|\n| `content-analysis.md` | Stage 1 source analysis | Title verdict, summary, mind map, Q&A |\n| `content-task-default.md` | Shared Stage 1 task fragment | Injected tasks |\n| `egg-routing.md` | Match eggs from the Stage 1 summary | Matched eggs |\n| `egg-analysis.md` | Follow one egg\u2019s instructions | `keyQuestionAnswers`, `extractedEntries`, `readAction`, `readVerdictReason`, `readingSources`, `language` |\n| `aggregate-content.md` | Combine long-content Stage 1 results | Whole-source summary and answers |\n| `aggregate-egg.md` | Combine compact chunk answer drafts, recommendations, and coverage | Whole-source key answers and recommendation only |\n| `merge-unprocessed.md` | Assemble fragments and consolidate duplicate claims | Complete `knowledge` and remaining `unprocessed` |\n| `follow-up.md` | Answer follow-up questions | Answers with source references |\n| `localize-egg.md` | Localize an egg\u2019s instructions | Markdown with English structural labels |\n| `shared-output-rules.md` | Shared grounding and language rules | Injected rules |\n\nFor content over 30k characters, Stage 2 analyzes each chunk then aggregates only answer drafts, recommendation notes, and coverage metadata. Aggregation never receives raw content, extracted entries, or the Knowledge tree. Chunk entries remain in source order until merge assembles them.\n\n`readAction` is `full`, `highlights`, `summary`, `skip`, or `uncertain`. Code derives `readVerdict`: true for full/highlights, false for summary/skip, null for uncertain. Missing or invalid recommendations are uncertain. Stage 1\u2019s enabled title verdict and core summary are small context signals; source evidence controls the decision. Partial failures preserve successful entries and make the recommendation uncertain.\n\n## Saving and merging\n\nHatch archives original analyses and source references in the nut and history, then appends useful entries and supported key answers to Unprocessed. Threshold merges run after saving, so they do not delay Hatch acknowledgement. Merge preserves distinct examples, qualifications, disagreements, and provenance; it does not silently discard a claim because of Skip If. It serializes work per egg and checks the note snapshot before applying results. Malformed responses leave the note untouched; very large trees defer merging when the output budget cannot safely hold them.\n\n## Customization and updates\n\nPreserve `{{placeholders}}`, exact JSON schema keys, and English structural labels such as `# Knowledge` and `# Unprocessed`. Edited workflow files remain untouched during updates; new defaults are supplied as `.new.md` for review. Unmodified obsolete prompts are removed. Missing new recommendation fields in customized prompts display uncertain. Use Defaults backs up customized files before restoring built-in prompts.\n\nThe Chrome extension offers a per-tab **Knowledge** option in **Analysis Sections** on both the content and analysis pages. The egg selector offers **\u{1F95A} Egg Analysis** (answers and verdicts only) and **\u{1F95A} Egg Analysis with knowledge entry** (also generate entries). Neither saves to the egg file. The separate bottom **\u{1F423} Hatch Egg** button saves generated entries and supported key answers to egg files; it is available only when entries have been generated. The **\u{1F343} Knowledge** analysis-section option controls entry generation on both pages.\n\nOn the top Egg Analysis button beside Collect Nut Only, clicking the analysis label runs the current mode; clicking its separate arrow opens the two analysis choices. Selecting a choice runs it immediately. Egg selection changes do not open the menu. The top Egg Analysis and Collect Nut Only controls remain visible throughout connected-mode results.\n\n## Cross-tab analysis activity\n\nWhile the side panel stays open, the indicator below its header counts running analyses and completed results you have not viewed in the current Chrome window. Click it to list unread completions first and running tabs second. Selecting a completed tab switches to its analysis without rerunning it; selecting a running tab opens its current progress.\n\nResults count as read when the latest analysis is shown in the active tab with the panel visible, including completion while you are already viewing it. Content previews do not mark results read. Automatic Stage 1\u2192Stage 2 processing counts as one running tab; a confirmation pause completes Stage 1, and a later Stage 2 run can produce a new unread result. Cached-only changes, Hatch, and follow-up questions do not create notifications. Closed or navigated tabs are removed. This tracker resets when the panel closes; it does not persist across sessions or add a toolbar badge.\n";

// src/workflow-manager.ts
var WORKFLOW_FILE_MAP = {
  contentAnalysis: "content-analysis.md",
  eggAnalysis: "egg-analysis.md",
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
      try {
        const content = await this.plugin.app.vault.read(file);
        this.cache.set(filename, content);
      } catch (err) {
        console.warn(`[NutEgg] Error reading changed workflow file ${file.path}:`, err);
      }
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
        "nutegg/_workflow/egg-compare.md": oldPromptContent
      },
      {
        workflowHashes: {
          "egg-compare.md": oldHash
        }
      }
    );
    await manager.init();
    import_strict.default.equal(files.has("nutegg/_workflow/egg-compare.md"), false);
    import_strict.default.equal(plugin.settings.workflowHashes["egg-compare.md"], void 0);
  });
});
