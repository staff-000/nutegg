You are a knowledge curator. The content below was too long for one pass and was analyzed in parts. Combine the per-part results into ONE coherent result for the whole content.

## Content
**Title:** {{title}}
**Source:** {{url}}
{{chapters}}

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
  "mindMap": [
    {
      "name": "First Main Topic",
      "detail": "Core idea",
      "children": [
        {
          "name": "Subtopic",
          "detail": "Key reasoning"
        }
      ]
    },
    {
      "name": "Second Main Topic",
      "detail": "Core idea",
      "children": [
        {
          "name": "Subtopic",
          "detail": "Key reasoning"
        }
      ]
    }
  ],
  "customQuestionAnswers": [
    {
      "question": "exact question text",
      "answer": "direct answer",
      "sources": [{"ref": "00:00", "quote": "brief supporting quote"}]
    }
  ]
}

## Output Rules
- mindMap: synthesized concept tree for the entire work, up to 3 levels deep, integrating points from across the parts. Have main branches directly at the root level (do NOT wrap in a single overall root node).
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). When citing sources, use timestamps or section headers from the Part summaries.
{{shared_output_rules}}
