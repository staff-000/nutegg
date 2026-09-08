# NutEgg AI Workflow & Prompt Reference

Welcome to the **NutEgg Workflow Engine**. The files in this folder define the prompts, instructions, and schemas that power NutEgg's AI extraction and knowledge synthesis pipeline.

> [!TIP]
> You can freely edit and customize any file in this directory to tailor NutEgg's analysis to your specific needs (e.g. changing the tone, adding domain-specific perspectives, or adjusting extraction depth).

---

## Architecture Overview

When you capture an article, video, or note in NutEgg, the AI processor executes one of several pipelines based on how many eggs match and how long the content is:

```
                  ┌───────────────────────────────┐
                  │      Captured Web Content     │
                  │   (Article / YouTube / Tweet) │
                  └──────────────┬────────────────┘
                                 │
                 Did the user manually pick eggs?
                    ├── No ──► [egg-routing.md] (match eggs from _index.md)
                    └── Yes ─► Use selected eggs
                                 │
                 How many eggs matched?
                    ├── 1 Egg  ──► Single-Egg Fast Path (1 AI call)
                    │              [egg-combined.md]
                    │
                    └── 2+ Eggs ─► Multi-Egg Parallel Pipeline
                                   Step 1: [content-analysis.md] (Summary & Chapter Map)
                                   Step 2: [egg-analysis.md] (Per-egg candidate insights)
                                 │
                                 ▼
                     Knowledge Tree Comparison
                     [egg-compare.md]
                     (Compare candidate insights against existing egg knowledge tree)
                                 │
                                 ▼
                     Results returned to Popup
```

For long content (e.g. 1-2 hour videos, long transcripts), NutEgg automatically splits content into chapters and uses:
- **`aggregate-content.md`**: Combines per-part summaries into one cohesive overview.
- **`aggregate-egg.md`**: Synthesizes candidate entries across all chunks for each egg.

---

## Workflow File Directory

| File | Pipeline Stage | Purpose | Output Format |
|---|---|---|---|
| [`egg-combined.md`](file:///./egg-combined.md) | Single-Egg Fast Path | Combined 1-call prompt extracting summary, chapter map, and candidate insights for a single egg. | JSON (`titleVerdict`, `coreSummary`, `candidateKnowledge`, etc.) |
| [`content-analysis.md`](file:///./content-analysis.md) | Multi-Egg Step 1 | High-level content analysis: single-sentence title verdict, core summary bullet points, and chapter map. | JSON (`titleVerdict`, `coreSummary`, `chapterMap`, `customQuestions`) |
| [`egg-analysis.md`](file:///./egg-analysis.md) | Multi-Egg Step 2 | Extracts candidate knowledge entries targeted to one specific egg's scope and action guide. | JSON (`relevanceVerdict`, `keyQuestions`, `candidateKnowledge`) |
| [`egg-compare.md`](file:///./egg-compare.md) | Synthesis (All Paths) | Compares candidate entries against the existing `# Knowledge` tree in the egg note to eliminate duplicates and identify novel deltas. | JSON (`entries`, `rejectReason`) |
| [`egg-routing.md`](file:///./egg-routing.md) | Routing | Compares content against the egg descriptions in `_index.md` to select the best matching eggs. | JSON array of egg filenames |
| [`aggregate-content.md`](file:///./aggregate-content.md) | Long Content | Merges chunk-level summaries from long articles or video transcripts into one comprehensive overview. | JSON (`titleVerdict`, `coreSummary`) |
| [`aggregate-egg.md`](file:///./aggregate-egg.md) | Long Content | Combines and de-duplicates candidate insights extracted across multiple chunks for one egg. | JSON (`relevanceVerdict`, `keyQuestions`, `candidateKnowledge`) |
| [`merge-unprocessed.md`](file:///./merge-unprocessed.md) | Knowledge Maintenance | Merges entries accumulated under `# Unprocessed` into the structured `# Knowledge` tree on demand. | Full updated egg note (Markdown) |
| [`localize-egg.md`](file:///./localize-egg.md) | Egg Creation | Adapts the standard egg template into the language of the egg's description when a new egg is created. | Full initial egg note (Markdown) |
| [`suggest-egg.md`](file:///./suggest-egg.md) | Fallback Routing | Suggests a new egg name and description when captured content matches no existing egg. | JSON (`name`, `description`) |
| [`follow-up.md`](file:///./follow-up.md) | Interactive Q&A | Answers user follow-up questions about the captured content in the Chrome popup. | Plain text / Markdown answer |
| [`action-guide-default.md`](file:///./action-guide-default.md) | Default Fallback | The baseline Action Guide used when an egg note does not specify its own. | Plain text list |
| [`grounding-rule.md`](file:///./grounding-rule.md) | Shared Rule | The strict grounding & anti-hallucination directive injected into all analysis prompts. | Plain text rule |

---

## Customization Rules & Guidelines

### ✅ What You Can Safely Customize
- **Tone and Perspective**: You can instruct the AI to be more critical, more technical, or focus on specific themes.
- **Summary Depth**: You can change how concise or detailed summaries should be.
- **Language / Idiom Preferences**: You can tweak phrasing, formatting preferences, or custom analytical lenses.

### ⚠️ What You Must Preserve (To Prevent Parser Errors)
1. **`{{placeholders}}`**: The strings enclosed in double curly braces (e.g. `{{content}}`, `{{egg_description}}`, `{{knowledge_tree}}`) are replaced dynamically by the engine. Do not delete or rename them.
2. **JSON Schemas**: Prompts that output JSON must keep the exact JSON key names specified in the template. The TypeScript engine parses these exact keys.
3. **Markdown Structural Headings**: In prompts that output markdown (`merge-unprocessed.md`, `localize-egg.md`), the headings `# Knowledge` and `# Unprocessed` must remain verbatim in English for the note parser.

---

## Updates & Conflict Resolution

When NutEgg updates to a newer version:
- **If you haven't edited a workflow file**: The plugin automatically updates it to the latest version.
- **If you have customized a workflow file**: NutEgg will **never overwrite your custom version**. Instead, it writes `[filename].new.md` alongside your file so you can inspect what changed in the update.
- **Restore Defaults**: You can reset all workflow files back to factory defaults at any time from `Obsidian Settings → NutEgg → Restore Default Workflow Files`.

