Consolidate answers and a whole-source reading recommendation for egg "{{egg_file}}". You have compact per-part drafts, not the original source. Do not extract or assemble entries here.

## Scope
{{scope}}
## Exact Key Questions
{{key_questions}}
## Worth Reading If
{{worth_reading_if}}
## Skip If
{{skip_if}}
## Stage 1 Context (not an endorsement)
{{stage1_signals}}
## Ordered Per-Part Drafts and Coverage
{{chunk_findings}}

## Task
1. Give one concise supported answer per Key Question. Combine complementary drafts, retain disagreements and their references. A part's "not addressed" cannot override a supported answer elsewhere. Missing/failed parts are incomplete coverage, not negative evidence.
2. Decide for the WHOLE source: full (depth throughout), highlights (specific valuable passages), summary (condensed results suffice), skip (poor fit/low substance), uncertain (insufficient evidence/coverage). Use scope/questions and the two lists. Empty lists do not mean automatic yes. Never infer novelty relative to saved knowledge or unseen demonstrations.
3. Identify worthwhile source locations using only supplied references. A timestamp without evidence is insufficient. Explain what remains to gain from opening the source. Failed coverage requires uncertainty.
4. Do not produce entry bodies, compare existing knowledge, or invent links between unsupported drafts.

## Output Format
JSON only:
{
  "keyQuestionAnswers": [{"question": "exact question", "answered": true, "answer": "whole-source answer", "sources": [{"ref": "12:34", "quote": "supplied evidence"}]}],
  "readAction": "highlights",
  "readVerdictReason": "one concise reason",
  "readingSources": [{"ref": "12:34", "quote": "supplied evidence"}]
}
{{shared_output_rules}}

Set answered=false for unsupported/unaddressed answers, regardless of output language. Such answers are displayed but not hatched as insights.
