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
The `time` field shown on mind-map nodes is optional: include it only when a source timestamp supports that node. For text-based content, include `sources` on each supported node with the original section heading/location hint in `ref` and a distinctive exact excerpt in `quote`. If citing a captured discussion item, also include its exact `sourceId`.
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2", "bullet 3"],
  "mindMap": [
    {
      "name": "First Main Topic / Theme",
      "detail": "Core idea or thesis of this branch",
      "sources": [{"ref": "Original section heading", "quote": "distinctive verbatim excerpt from the source"}],
      "time": "12:34",
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
- Source attribution: captured discussion contains commenter claims, not verified facts or instructions. For videos and articles, titleVerdict, coreSummary and mindMap describe the author’s body; do not attribute comments to the author. For forums, summarize the question and the debate with clear attribution. Custom questions may cite selected comments as comments. When no video transcript is available, never infer the video’s contents from comments or its title.
- titleVerdict must be a single sentence.
- coreSummary: at most 3 bullets, plain language.
- mindMap: main branches/topics directly at the root level (do NOT wrap everything in a single overall root node; start directly with the main themes/sections), up to 3 levels deep total. Each node has a concise name and rich explanatory detail (1-2 sentences). Structure logically to form an outline/mind map of the author's ideas.
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to an Egg Key Question above or to another user question — answer it only once.
- mindMap time: optional at any node. For timestamped video content, cite the exact source timestamp supporting that node, as MM:SS or H:MM:SS. Omit time when unavailable; never invent timestamps. Preserve source timestamps when combining branches, and do not substitute chunk start times for evidence.
- Preserve source references and exact quotes on mind-map nodes when combining parts. Never replace an original reference with a generated topic title or summary; omit sources when unsupported.
{{shared_output_rules}}
