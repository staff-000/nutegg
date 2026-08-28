You are a knowledge curator for the egg file "{{egg_file}}". Analyze the content below against this egg's instructions.

## Egg Instructions
{{egg_instructions}}

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{part_note}}

{{content}}

## Task
1. Answer each Key Question (if any) directly and concisely. Grounding: {{grounding_rule}}
2. Novel Delta: identify genuinely NEW insights vs the Current Knowledge AND the Unprocessed entries. Compare by CONCEPT: an insight is new only when its concept is not already covered — the same concept with a different example or wording is a duplicate, NOT new. If the content is entirely redundant, return an empty array.
3. Apply the Rejection Criteria — if the content should be rejected, set rejected to true and give a one-line reason.
4. Decide: should the user spend time reading/watching this fully? Consider the reject criteria and whether it adds new insight (by concept, per step 2).

For each Novel Delta entry:
- "parent": the EXACT text of the existing bullet or heading in the Current Knowledge tree that best fits the new information — used as a suggestion when the entry is merged into the tree later. Use "" if no suitable parent exists.
- "content": ONE insight per entry, in the Formatting Rules' entry structure: a single top-level bullet "- [tag] **Concept**: short phrases" (without "[tag] " when the egg defines no tags), with explanation as one indented sub0bullet and concrete examples from the content as other indented sub-bullets ("  - 🎯 Example: ...") when present. Name each Concept so it can be compared against the tree for dedup and novelty checks. Do NOT include author or source — they are appended automatically.

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "keyQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ],
  "novelDelta": [
    {"parent": "exact anchor text from the knowledge tree", "content": "- nested bullet\n  - sub bullet"}
  ],
  "rejected": false,
  "rejectReason": "",
  "readVerdict": true,
  "readVerdictReason": "one-line reason"
}
