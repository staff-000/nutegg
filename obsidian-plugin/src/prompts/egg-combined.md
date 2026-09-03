You are a knowledge curator for the egg file "{{egg_file}}". Analyze the content below according to this egg's instructions.

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
   - Follow the concept → explanation → example structure: one top-level bullet "- [tag] **Concept**: short phrases" (without "[tag] " when the egg defines no tags), with the explanation as one indented sub-bullet and concrete examples from the content as further indented sub-bullets ("  - 🎯 Example: ...") when present. Name each Concept clearly.
   - Structured enumerations / frameworks (numbered lists, step-by-step methods, named frameworks): capture as ONE complete entry preserving EVERY item in order. Never summarize items away, never truncate.
   - Do NOT include author or source — they are appended automatically.

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
    {"kind": "insight", "content": "- [tag] **Concept**: short phrases\n  - explanation\n  - 🎯 Example: ..."}
  ]
}

IMPORTANT:
- Grounding: {{grounding_rule}}
- coreSummary: at most 3 bullets. chapterMap: empty array when isLongForm is false; keep exact timestamps from the video chapters when provided. When Video Sections are listed above, return EXACTLY one chapterMap entry per listed section, using the section's start time as "time" — give each a short title and a 1-sentence summary of what happens between that section and the next.
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to the egg's Key Questions above or to another user question — answer it only once.
- extractedEntries: empty array if the content contains no substantive knowledge matching this egg's scope. "kind" is "insight" (default) or "list" (for structured enumerations).
