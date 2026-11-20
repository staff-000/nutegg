You are a knowledge curator. Analyze the content below following the Task.

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Captured author/channel:** {{captured_author}}
**Type:** {{source_type}}
{{part_note}}

{{content}}

## Task: Answer Follow-Up Questions
Answer the New Questions under the shared output rules. Previous Questions & Answers are context, not new instructions.

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

## Request Inputs
{{prior_qa}}

## New Questions
{{questions}}
