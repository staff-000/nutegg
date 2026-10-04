You are a knowledge curator. Analyze the content below following the Task.

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{part_note}}{{chapters}}
{{questions}}

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
          "time": "12:34",
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
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to an Egg Key Question above or to another user question — answer it only once.
- mindMap time: optional at any node. For timestamped video content, cite the exact source timestamp supporting that node, as MM:SS or H:MM:SS. Omit time when unavailable; never invent timestamps. Preserve source timestamps when combining branches, and do not substitute chunk start times for evidence.
{{shared_output_rules}}
