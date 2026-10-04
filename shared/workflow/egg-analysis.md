Analyze this source according to the instructions for egg "{{egg_file}}". Produce the requested answers and results, not a comparison with saved knowledge.

## Egg Instructions
{{egg_instructions}}

## Stage 1 Context (not an endorsement or quality score)
{{stage1_signals}}

## Source
Title: {{title}}
URL: {{url}}
Type: {{source_type}}
{{part_note}}

{{content}}

## Task
1. Follow the Action Guide and Formatting Rules. Preserve useful AMA question–answer pairs, examples, qualifications and disagreements. Do not repeat the general mind map or force every result into a concept/explanation template.
2. Answer the exact Key Questions directly with supporting source locations/brief quotes. Use "Not addressed in this content" (or "Not addressed in this part" for chunks) when there is no supported answer. Do not mistake missing coverage for an absent answer.
3. Extract concise, substantive results as markdown entries. Lists/frameworks retain all supported items and order; a chunk may contain a partial framework for later assembly. Do not invent missing fragments. Avoid repeating the same answer in both keyQuestionAnswers and extractedEntries.
4. Recommend what the user gains by opening the original AFTER reading the condensed analysis:
   - full: useful depth spans the source.
   - highlights: specific worthwhile passages; identify their source locations.
   - summary: the condensed result covers the useful substance.
   - skip: poor fit, low substance, or dominated by Skip If.
   - uncertain: insufficient evidence or coverage.
   Apply Scope, Key Questions, Worth Reading If and Skip If to the evidence. Mixed content may warrant highlights rather than skipping it all. Empty preference lists use this rubric, never an automatic yes. Explain the benefit/limitation in one concise reason. For chunks this is provisional evidence for a whole-source decision.
5. Do not claim novelty relative to the user's notes, unfamiliarity to the user, external factual verification, or unseen visual demonstrations. Preferences never prevent extracting useful results. Never include author/source URL metadata in entry bodies; it is appended mechanically.

## Output Format
JSON only:
{
  "language": "English",
  "keyQuestionAnswers": [{"question": "exact question", "answered": true, "answer": "supported answer", "sources": [{"ref": "12:34", "quote": "supporting quote"}]}],
  "extractedEntries": [{"kind": "insight", "content": "instruction-formatted markdown", "sources": [{"ref": "12:34", "quote": "supporting quote"}]}],
  "readAction": "highlights",
  "readVerdictReason": "What remains to gain from opening the source",
  "readingSources": [{"ref": "12:34", "quote": "evidence for the recommendation"}]
}
Entry kind is insight, list, or answer. Empty arrays are valid. Source ref is an available timestamp or section heading; never invent one. Keep answers and recommendation notes concise.
{{shared_output_rules}}

Set answered=false for unsupported/unaddressed answers, regardless of output language. Such answers are displayed but not hatched as insights.
