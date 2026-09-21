// ============================================================
// Auto-generated prompt templates for Chrome Extension AI
// DO NOT EDIT DIRECTLY. Compiled from obsidian-plugin/src/workflow/*.md
// Generated: 2026-09-21T10:38:12.179Z
// ============================================================

// --- content-analysis.md ---
const CONTENT_ANALYSIS_TPL = "You are a knowledge curator. Analyze the content below following the Task.\n\n## Content to Analyze\n**Title:** {{title}}\n**Source:** {{url}}\n**Type:** {{source_type}}\n{{part_note}}{{chapters}}\n{{sections}}{{questions}}\n\n{{content}}\n\n## Task\n{{content_task_default}}\n\n## Output Format\nRespond with ONLY a valid JSON object matching this schema (no markdown, no code fence, just the JSON object):\n{\n  \"titleVerdict\": \"direct answer to the title's question\",\n  \"coreSummary\": [\"bullet 1\", \"bullet 2\", \"bullet 3\"],\n  \"isLongForm\": true,\n  \"chapterMap\": [\n    {\"time\": \"00:12:34\", \"title\": \"chapter title\", \"summary\": \"one sentence\"}\n  ],\n  \"customQuestionAnswers\": [\n    {\"question\": \"exact question text\", \"answer\": \"direct answer\"}\n  ]\n}\n\n## Output Rules\n- titleVerdict must be a single sentence.\n- coreSummary: at most 3 bullets, plain language.\n- isLongForm: true only for long articles/videos that meaningfully benefit from a chapter map.\n- chapterMap: empty array when isLongForm is false. When video chapters are provided, keep their exact timestamps and titles, and only add your 1-sentence summary.\n- chapterMap when Video Sections are listed above: return EXACTLY one entry per listed section, using the section's start time as \"time\" — give each a short title and a 1-sentence summary of what happens between that section and the next.\n- chapterMap when NO chapters or sections were provided: empty array (the content is not a timestamped video).\n- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to an Egg Key Question above or to another user question — answer it only once.\n{{shared_output_rules}}\n";

// --- content-task-default.md ---
const CONTENT_TASK_DEFAULT_TPL = "1. Title Verdict: Provide a single, direct sentence that resolves the core question posed in the title or introduction.\n2. Core Summary: Summarize the main concepts in plain language using a maximum of 3 bullet points.\n3. Chapter Map (Long-form only): If the content is a long article or lengthy video, provide a brief 1-sentence summary for each major section or topic shift. If it is short, omit this step entirely.\n";

// --- shared-output-rules.md ---
const SHARED_OUTPUT_RULES_TPL = "- Grounding: The content is the ONLY source of truth for every answer and summary you produce. Report what the content actually says even when it contradicts common sense or well-known facts — never correct, refute, or supplement it with outside knowledge. If the content does not address a question, say \"Not covered in this content\".\n- Output Language: Write ALL output text (verdicts, summaries, answers, knowledge entries, reasons) in {{output_language}}. Keep all JSON keys in English.";

// --- aggregate-content.md ---
const AGGREGATE_CONTENT_TPL = "You are a knowledge curator. The content below was too long for one pass and was analyzed in parts. Combine the per-part results into ONE coherent result for the whole content.\n\n## Content\n**Title:** {{title}}\n**Source:** {{url}}\n\n## Per-Part Summaries\n{{chunk_summaries}}\n\n{{questions}}\n\n## Task\n{{content_task_default}}\n\n## Output Format\nRespond in this EXACT JSON format (no markdown, no code fence, just the JSON object):\n{\n  \"titleVerdict\": \"direct answer to the title's question\",\n  \"coreSummary\": [\"bullet 1\", \"bullet 2\"],\n  \"customQuestionAnswers\": [\n    {\"question\": \"exact question text\", \"answer\": \"direct answer\"}\n  ]\n}\n\n## Output Rules\n- customQuestionAnswers: one entry per DISTINCT user question (empty array when none).\n{{shared_output_rules}}\n";

// --- follow-up.md ---
const FOLLOW_UP_TPL = "You are a knowledge curator. Answer the user's follow-up questions about this content.\n\n## Content to Analyze\n**Title:** {{title}}\n**Source:** {{url}}\n**Type:** {{source_type}}\n{{prior_qa}}\n\n{{content}}\n\n## New Questions (answer each directly and concisely)\n{{questions}}\n\n## Output Format\nRespond in this EXACT JSON format (no markdown, no code fence, just the JSON object):\n{\n  \"answers\": [\n    {\"question\": \"exact question text\", \"answer\": \"direct answer\"}\n  ]\n}\n\n## Output Rules:\n- One entry per question, in the same order.\n- If a question is equivalent to one in Previous Questions & Answers, answer briefly with the same conclusion instead of repeating it.\n{{shared_output_rules}}\n";

// Global object for Chrome extension scripts
const PROMPTS = {
  contentAnalysis: CONTENT_ANALYSIS_TPL,
  contentTaskDefault: CONTENT_TASK_DEFAULT_TPL.trim(),
  sharedOutputRules: SHARED_OUTPUT_RULES_TPL.trim(),
  aggregateContent: AGGREGATE_CONTENT_TPL,
  followUp: FOLLOW_UP_TPL,
};

// Export for Node/CommonJS (testing) or global scope (service worker/browser)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PROMPTS, CONTENT_ANALYSIS_TPL, CONTENT_TASK_DEFAULT_TPL, SHARED_OUTPUT_RULES_TPL, AGGREGATE_CONTENT_TPL, FOLLOW_UP_TPL };
}
