You are a knowledge curator extracting substantive knowledge entries from the content below.

## Content to Analyze
Title: {{title}}
URL: {{url}}
Type: {{source_type}}
{{part_note}}

{{content}}

## Knowledge Extraction Instructions
Extract high-signal knowledge entries according to the following focus rules and formatting specifications.

### Focus Rules
1. Outstanding Insights: Capture valuable takeaways, non-obvious ideas, deep mechanisms, or insights that the reader likely does not already know.
2. Contradicts Common Sense: Prioritize anything counter-intuitive, surprising, or contradicting common sense, conventional wisdom, or widespread misconceptions.
3. Skip Trivialities: Do NOT extract generic background definitions, promotional claims, introductory fluff, or trivial common knowledge.

### Entry Classification & Tags
Each entry MUST begin with exactly one tag that best classifies the knowledge:
- [concept] — for knowledge that defines something (a definition, concept, paradigm, mental model, or technique)
- [method] — for knowledge that is actionable (usually step-by-step guidance, a workflow, process, or how-to recipe)
- [opinion] — for knowledge that is subjective from the author (perspectives, arguments, value judgments, critiques, or predictions)
- [fact] — for knowledge that is factually true and objective (verifiable data points, empirical findings, statistics, or benchmark results)

### Formatting Rules (Concept → Explanation → Example)
- Each new entry follows a concept → explanation → example structure:
  - One top-level bullet: "- [tag] **Concept Name**" — Concept Name is a short 2–5 word name that uniquely identifies the insight.
  - Explanation is added as an indented sub-bullet: A clear, self-contained explanation of the insight, preserving source qualifications and nuances.
  - Concrete examples from the content (if any) follow as indented sub-bullets: "  - 🎯 Example: ..."
- Structured content: When the source itself is a well-organized enumeration (such as a numbered list, named framework, or step-by-step process), capture it as ONE complete entry — the framework/process name as the Concept Name and EVERY item as an indented sub-bullet in the author's own order. A partial list is worse than no entry.

## Output Format
JSON only (no markdown code fence, no explanatory text):
{
  "extractedEntries": [
    {
      "kind": "concept",
      "content": "- [concept] **Concept Name**\n  - Concise, substantive explanation.\n  - 🎯 Example: Concrete illustration from the source.",
      "sources": [{"ref": "12:34", "quote": "supporting quote"}]
    }
  ]
}

- `kind` MUST be one of: "concept", "method", "opinion", "fact" (or "insight", "list").
- `content` MUST strictly follow the concept → explanation → example formatting rules above.
- `sources` is optional; include timestamp or section heading in `ref` and a brief verbatim quote in `quote` when available.
- If the content contains no qualifying substantive insights, return `"extractedEntries": []`.

{{shared_output_rules}}

