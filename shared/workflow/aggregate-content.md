You are a knowledge curator. The content below was too long for one pass and was analyzed in parts. Combine the per-part results into ONE coherent result for the whole content.

## Content
**Title:** {{title}}
**Source:** {{url}}
**Captured author/channel:** {{captured_author}}
{{chapters}}

## Per-Part Summaries
{{chunk_summaries}}

{{questions}}

## Task
{{content_task_default}}

{{conversation_rules}}

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
The `time` field shown on mind-map nodes is optional: include it only when a source timestamp supports that node. For text-based content, include `sources` on each supported node with the original section heading/location hint in `ref` and a distinctive exact excerpt in `quote`. If citing a captured discussion item, also include its exact `sourceId`.
For conversational formats, set `conversation.format` accordingly, unify participants across chunks, and maintain question/topic structure.
For monologues, solo lectures, and written articles/essays, set `conversation`: `{"format": "monologue", "confidence": "high", "participants": []}` and use standard hierarchical concept nodes.
{
  "contentMetadata": {"topics": ["concise topic"], "author": null, "answerableQuestions": ["A question substantially answered by this content?"]},
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2"],
  "conversation": {
    "format": "monologue",
    "confidence": "high",
    "participants": []
  },
  "mindMap": [
    {
      "name": "First Main Topic",
      "detail": "Core idea",
      "time": "12:34",
      "children": [
        {
          "name": "Subtopic",
          "detail": "Key reasoning",
          "time": "12:45"
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
- Preserve attribution between author text and commenter claims. Video/article summaries must not present commenters’ claims as the author’s ideas. Forum summaries may describe the debate with attribution.
- mindMap: synthesized concept tree for the entire work, up to 3 levels deep, integrating points from across the parts. Have main branches directly at the root level (do NOT wrap in a single overall root node). Preserve every item and its number in `name` (e.g., `"1. ..."`) for any explicit enumerations or numbered steps without capping node counts per level.
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). When citing sources, use timestamps or section headers from the Part summaries.
- mindMap time: optional at any node. For timestamped video content, cite the exact source timestamp supporting that node, as MM:SS or H:MM:SS. Omit time when unavailable; never invent timestamps. Preserve source timestamps when combining branches, and do not substitute chunk start times for evidence.
- Preserve source references and exact quotes on mind-map nodes when combining parts. Never replace an original reference with a generated topic title or summary; omit sources when unsupported.
{{shared_output_rules}}

- contentMetadata: list up to 5 distinct concise topics and up to 5 questions substantially answered by the source. These are discovery questions, separate from customQuestionAnswers. Use empty lists when unsupported. Author must be the captured author/channel; use null when unknown. Never infer authorship from a title, guest, or commenter. Aggregate only supported topics/questions across parts; deduplicate and cap each list at 5.
