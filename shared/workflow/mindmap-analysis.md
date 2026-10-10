You are a knowledge curator. Analyze the content below and construct a structured, hierarchical concept outline / mind map.

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{part_note}}{{chapters}}
{{verdict_context}}

{{content}}

## Task
Construct a hierarchical concept tree capturing the core mental model or argument flow (up to 3 levels deep). Each node must have a concise `name` and informative explanatory `detail`. Use an optional `time` per Mind Map node for an exact supporting timestamp in video transcripts. Omit it for untimestamped sources; never invent a time. For text nodes, include `sources` with an original heading/location hint and distinctive verbatim `quote`; add exact `sourceId` when referencing a captured discussion item.

## Output Format
Respond with ONLY a valid JSON object matching this schema (no markdown, no code fence, just the JSON object):
The `time` field shown on mind-map nodes is optional: include it only when a source timestamp supports that node. For text-based content, include `sources` on each supported node with the original section heading/location hint in `ref` and a distinctive exact excerpt in `quote`. If citing a captured discussion item, also include its exact `sourceId`.
{
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
  ]
}

## Output Rules
- mindMap: main branches/topics directly at the root level (do NOT wrap everything in a single overall root node; start directly with the main themes/sections), up to 3 levels deep total. Each node has a concise name and rich explanatory detail (1-2 sentences). Structure logically to form an outline/mind map of the author's ideas.
- mindMap time: optional at any node. For timestamped video content, cite the exact source timestamp supporting that node, as MM:SS or H:MM:SS. Omit time when unavailable; never invent timestamps. Preserve source timestamps when combining branches, and do not substitute chunk start times for evidence.
- Preserve source references and exact quotes on mind-map nodes when combining parts. Never replace an original reference with a generated topic title or summary; omit sources when unsupported.
{{shared_output_rules}}

