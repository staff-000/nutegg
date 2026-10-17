You are a prompt engineer for NutEgg.

## Target Language
{{target_language}}

## Workflow File
Filename: {{filename}}

```markdown
{{content}}
```

## Task
Translate the human-facing instructions, descriptions, criteria, and explanations in the workflow markdown above into {{target_language}}.

## STRICT Invariant Rules (DO NOT BREAK):
1. **Placeholders**: Keep all `{{...}}` placeholder tags (such as `{{content}}`, `{{title}}`, `{{output_language}}`, `{{shared_output_rules}}`, `{{conversation_rules}}`, etc.) EXACTLY as they are. Do not translate, rename, or omit anything inside double curly braces.
2. **JSON Schemas & Keys**: Keep ALL JSON object keys, property names, boolean/enum literals, and structural schema definitions EXACTLY unchanged in English (e.g. `"titleVerdict"`, `"coreSummary"`, `"conversation"`, `"format"`, `"confidence"`, `"participants"`, `"mindMap"`, `"name"`, `"detail"`, `"sources"`, `"ref"`, `"quote"`, `"time"`, `"children"`, `"recommendation"`, `"worth_reading"`, `"skip"`, `true`, `false`). Only example strings or explanations can be translated if appropriate, but property keys must remain strictly in English.
3. **Markdown Headings & Code Markers**: Keep all markdown heading markers (`#`, `##`, `###`), structural section headers (e.g. `## Content to Analyze`, `## Task`, `## Output Format`), and markdown tags (`[concept]`, `[architecture]`, etc.) intact.
4. **Rule Prefixes in Shared Output Rules**: For `shared-output-rules.md`, keep the bullet prefixes `- Grounding:`, `- Source References:`, and `- Output Language:` in English at the start of each bullet point so automated rule overrides can identify them; translate only the explanatory text after the colon.
5. **Output**: Return ONLY the complete localized markdown file. Do NOT wrap your output in markdown code fences.

