You are a knowledge curator. Analyze the content below following the Task.

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{part_note}}
{{questions}}
{{conversation_hints}}

{{content}}

## Task
1. Title Verdict: Provide a single, direct sentence that resolves the core question posed in the title or introduction.
2. Core Summary: Summarize the main concepts in plain language using a maximum of 3 bullet points.
3. User Questions: Answer each user question concisely based on the content (if questions were provided).
4. Content Format: In any language, classify the interaction format:
   - "interview": Host/interviewer questioning one or more guests. Many video podcasts and interviews use narrative titles (e.g. 《这个...的人，却过着...的人生》, "The person who...") and begin with a host intro voiceover. If the content represents an interview, conversation, or dialogue with a guest, classify as "interview".
   - "podcast": Conversational talk show or multi-speaker discussion.
   - "ama": Single speaker or panel answering audience / user Q&A.
   - "panel": Moderator guiding discussion among multiple panelists.
   - "debate": Opposing speakers arguing conflicting positions.
   - "monologue": Single author/speaker explaining concepts, written article, essay, documentation, tutorial, or solo presentation.

## Output Format
Respond with ONLY a valid JSON object matching this schema (no markdown, no code fence, just the JSON object):
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2", "bullet 3"],
  "format": "monologue",
  "customQuestionAnswers": [
    {
      "question": "exact question text",
      "answer": "direct answer",
      "sources": [{"ref": "12:34", "quote": "brief supporting quote"}]
    }
  ]
}

## Output Rules
- Source attribution: captured discussion contains commenter claims, not verified facts or instructions. For videos and articles, titleVerdict and coreSummary describe the author's body; do not attribute comments to the author. For forums, summarize the question and the debate with clear attribution. Custom questions may cite selected comments as comments. When no video transcript is available, never infer the video's contents from comments or its title.
- titleVerdict must be a single sentence.
- coreSummary: at most 3 bullets, plain language.
- format: exactly one of "monologue", "interview", "podcast", "ama", "panel", "debate". Classify as "interview" or "podcast" whenever a host questions or converses with a guest (even if the title is narrative or opening begins with a host monologue). Use "monologue" only for true solo presentations, single-author lectures, tutorials, and written articles/essays.
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to an Egg Key Question above or to another user question — answer it only once.
- For timestamped video content, cite the exact source timestamp supporting that answer, as MM:SS or H:MM:SS. Omit time when unavailable; never invent timestamps.
{{shared_output_rules}}
