You are a knowledge curator. Analyze the content below following the Task.

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
  "mindMap": [
    {
      "name": "First Main Topic / Theme",
      "detail": "Core idea or thesis of this branch",
      "children": [
        {
          "name": "Subtopic / Concept",
          "detail": "Key reasoning, mechanism, or explanation",
          "children": [
            {
              "name": "Detail / Evidence",
              "detail": "Concrete takeaway or example"
            }
          ]
        }
      ]
    },
    {
      "name": "Second Main Topic / Theme",
      "detail": "Core idea or thesis of this branch",
      "children": [
        {
          "name": "Subtopic / Concept",
          "detail": "Key reasoning, mechanism, or explanation"
        }
      ]
    }
  ],
  "isLongForm": true,
  "chapterMap": [
    {"time": "00:12:34", "title": "chapter title", "summary": "one sentence"}
  ],
  "customQuestionAnswers": [
    {
      "question": "exact question text",
      "answer": "direct answer",
      "sources": [{"ref": "12:34", "quote": "brief supporting quote"}]
    }
  ]
}

## Output Rules
- titleVerdict must be a single sentence.
- coreSummary: at most 3 bullets, plain language.
- mindMap: main branches/topics directly at the root level (do NOT wrap everything in a single overall root node; start directly with the main themes/sections), up to 3 levels deep total. Each node has a concise name and rich explanatory detail (1-2 sentences). Structure logically to form an outline/mind map of the author's ideas.
- isLongForm: true only for long articles/videos that meaningfully benefit from a chapter map.
- chapterMap: empty array when isLongForm is false. When video chapters are provided, keep their exact timestamps and titles, and only add your 1-sentence summary.
- chapterMap when Video Sections are listed above: return EXACTLY one entry per listed section, using the section's start time as "time" — give each a short title and a 1-sentence summary of what happens between that section and the next.
- chapterMap when NO chapters or sections were provided: empty array (the content is not a timestamped video).
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to an Egg Key Question above or to another user question — answer it only once.
{{shared_output_rules}}
