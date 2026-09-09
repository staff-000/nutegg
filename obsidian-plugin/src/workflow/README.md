# NutEgg AI Workflow & Prompt Reference

Welcome to the **NutEgg Workflow Engine**. The files in this folder define the prompts, instructions, and schemas that power NutEgg's AI extraction and knowledge synthesis pipeline.

- 🌐 **Chrome Extension:** [NutEgg on Chrome Web Store](https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol)
- 💎 **Obsidian Plugin:** [NutEgg on Obsidian Community Plugins](https://community.obsidian.md/plugins/nutegg)

> [!TIP]
> You can freely edit and customize any file in this directory to tailor NutEgg's analysis to your specific needs (e.g. changing the tone, adding domain-specific perspectives, or adjusting extraction depth).

---

## Architecture Overview

NutEgg uses a **Two-Stage Analysis Architecture** designed for high precision, token efficiency, and user control. Rather than running a monolithic prompt, NutEgg separates broad content understanding from deep, egg-specific knowledge comparison.

```
                    ┌───────────────────────────────┐
                    │      Captured Web Content     │
                    │   (Article / YouTube / Tweet) │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
       ===========================================================
       STAGE 1: Content Analysis & Summary-Based Egg Routing
       ===========================================================
                                    │
                         Is content >30k chars?
                            ├── No  ──► [content-analysis.md]
                            └── Yes ──► Chunks + [aggregate-content.md]
                                    │
                                    ▼
                   Produces: Title Verdict, 3-Bullet Summary,
                   Chapter Map, & Custom Question Answers
                                    │
                                    ▼
                           [egg-routing.md]
           (Routes matched eggs from _index.md using the
            concise Stage 1 summary instead of raw content)
                                    │
                                    ▼
       ===========================================================
       INTERACTIVE CHOICE / EXECUTION MODE (Chrome Extension)
       ===========================================================
                                    │
                        Which mode is selected?
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
       [Fast Mode]                 [Confirm Eggs Mode]
       Automatically proceeds      User reviews matched eggs:
       to Stage 2 with all         ├── "Collect Nut Only" (skip Stage 2)
       matched eggs.               └── Add/remove eggs ──► Proceed
            │                               │
            └───────────────┬───────────────┘
                            ▼
       ===========================================================
       STAGE 2: Per-Egg Knowledge Extraction & Novelty Comparison
       ===========================================================
                            │
               For each confirmed egg (1 or N):
                            │
                            ▼
                    [egg-analysis.md]
              (Extract candidate knowledge entries
               & key questions scoped to this egg)
                            │
                            ▼
                    [egg-compare.md]
              (Diffs candidate entries against the
               egg's existing # Knowledge tree to find
               true novel insights & decide read verdict)
                            │
                            ▼
                 Results returned to Popup
                 (Ready to Save Nut & Eggs)
```

> [!NOTE]
> **Why Summary-Based Routing?**
> Passing the Stage 1 summary to `egg-routing.md` instead of full raw articles or multi-hour video transcripts saves tens of thousands of tokens per capture and dramatically improves routing accuracy by focusing on distilled, high-signal semantic themes.

---

### Execution Modes

| Mode | Behavior | Best Used For |
|---|---|---|
| **Fast Mode** | Runs Stage 1 content analysis, routes eggs automatically, and immediately executes Stage 2 knowledge comparison in one uninterrupted pass. | Everyday reading and quick captures when you trust automatic egg matching. |
| **Confirm Eggs Mode** | Runs Stage 1 content analysis, then pauses in the popup. Shows matched eggs alongside your vault's full egg list. You can add/remove eggs, proceed with knowledge comparison, or click **Collect Nut Only** to save the note immediately without comparing against eggs. | Deep research, ambiguous topics, or when you only want a quick summary without updating egg knowledge trees. |

---

### Long Content (>30k Chars) Pipeline

For long articles, papers, or video transcripts (>30k characters), content is automatically split into timestamped or paragraph chunks (<=30k chars each) and aggregated in both stages:

```
  Captured Long Content ──► Split into Chunks (Part 1, Part 2, ... Part N)
                                │
       ┌────────────────────────┴────────────────────────┐
       ▼                                                 ▼
  Stage 1: Content Summary                          Stage 2: Per-Egg Knowledge
  Run [content-analysis.md]                         For each confirmed egg:
  for each chunk                                    Run [egg-analysis.md] + [egg-compare.md]
       │                                            for each chunk
       ▼                                                 │
  [aggregate-content.md]                                 ▼
  Merges chunk summaries into ONE                   [aggregate-egg.md]
  cohesive title verdict, 3-bullet                  Synthesizes cross-part findings
  core summary, and custom Q&A.                     into unified novel delta, answers
       │                                            key questions, & read verdict.
       ▼                                                 │
  [egg-routing.md]                                       │
  (Routes eggs via aggregated summary)                   │
       │                                                 │
       └────────────────────────┬────────────────────────┘
                                │
                                ▼
                    Results returned to Popup
```

---

### Other Workflows (Independent of Capture)

```
  User asks follow-up questions in Chrome popup
     └──► [follow-up.md] (interactive Q&A, 1 AI call per batch)

  Unprocessed entries accumulate in an egg note (20+ threshold or manual button)
     └──► [merge-unprocessed.md] (merge into # Knowledge tree, 1 AI call)

  User creates a new egg with a non-English description
     └──► [localize-egg.md] (translate egg template, 1 AI call)
```

---

## Prompt Dependency & Injection Map

Some prompt files are **shared fragments** that are not executed independently, but are injected into other prompts via `{{placeholder}}` variables at runtime:

```mermaid
graph TD
    subgraph Shared Fragments
        GR["grounding-rule.md<br/><i>(Strict anti-hallucination rule)</i>"]
        AG["action-guide-default.md<br/><i>(Default 3-step summary instructions)</i>"]
    end

    subgraph Content Capture & Synthesis
        EC["egg-combined.md"]
        CA["content-analysis.md"]
        EA["egg-analysis.md"]
        CMP["egg-compare.md"]
        AC["aggregate-content.md"]
        AE["aggregate-egg.md"]
    end

    subgraph Independent Prompts
        FU["follow-up.md"]
        ROUT["egg-routing.md"]
        MU["merge-unprocessed.md"]
        LOC["localize-egg.md"]
    end

    AG -.->|"{{action_guide}}"| CA
    AG -.->|"{{action_guide}}"| EC

    GR -.->|"{{grounding_rule}}"| EC
    GR -.->|"{{grounding_rule}}"| CA
    GR -.->|"{{grounding_rule}}"| EA
    GR -.->|"{{grounding_rule}}"| CMP
    GR -.->|"{{grounding_rule}}"| AC
    GR -.->|"{{grounding_rule}}"| AE
    GR -.->|"{{grounding_rule}}"| FU
```

---

## Workflow File Directory

### 1. Shared Fragments

These are **not standalone prompts** — they are modular snippets injected as `{{placeholders}}` into other prompts.

| File | Injected As | Injected Into | Purpose |
|---|---|---|---|
| [`grounding-rule.md`](./grounding-rule.md) | `{{grounding_rule}}` | `egg-combined`, `content-analysis`, `egg-analysis`, `egg-compare`, `aggregate-content`, `aggregate-egg`, `follow-up` | Strict anti-hallucination directive: *"The content is the ONLY source of truth... never supplement with outside knowledge."* |
| [`action-guide-default.md`](./action-guide-default.md) | `{{action_guide}}` | `content-analysis`, `egg-combined` | Baseline Action Guide (Verdict, 3 bullets, Chapter map) used when an egg note does not specify its own. |

### 2. Content Capture Pipeline

| File | Pipeline Stage | Purpose | Output Format |
|---|---|---|---|
| [`content-analysis.md`](./content-analysis.md) | Stage 1: Content Analysis | Content-level summary: title verdict, 3-bullet summary, chapter map, and custom user question answers. | JSON (`titleVerdict`, `coreSummary`, `isLongForm`, `chapterMap`, `customQuestionAnswers`) |
| [`egg-routing.md`](./egg-routing.md) | Stage 1: Summary-Based Routing | Matches the Stage 1 content summary against egg descriptions in `_index.md` to select matching eggs with minimal tokens. | Plain text list of filenames (one per line) |
| [`egg-analysis.md`](./egg-analysis.md) | Stage 2: Egg Extraction | Per-egg extraction: candidate knowledge entries and key question answers scoped strictly to one egg's instructions. | JSON (`keyQuestionAnswers`, `extractedEntries`) |
| [`egg-compare.md`](./egg-compare.md) | Stage 2: Knowledge Diff | Diffs candidate entries against the egg's existing `# Knowledge` tree and `# Unprocessed` to find novel insights and determine read verdict. | JSON (`novelDelta`, `redundantEntries`, `rejected`, `rejectReason`, `readVerdict`, `readVerdictReason`) |
| [`egg-combined.md`](./egg-combined.md) | Single-Egg Fast Path / Fallback | Combined 1-call prompt: content summary + chapter map + candidate knowledge entries for a single egg. | JSON (`titleVerdict`, `coreSummary`, `chapterMap`, `customQuestionAnswers`, `keyQuestionAnswers`, `extractedEntries`) |

### 3. Long Content Aggregation

Used only when content exceeds ~30k characters (long articles, 1-2 hour videos). Each chunk is processed through extraction first, then these prompts synthesize the per-chunk results.

| File | Pipeline Stage | Purpose | Output Format |
|---|---|---|---|
| [`aggregate-content.md`](./aggregate-content.md) | Stage 1 Aggregation | Merges per-chunk summaries into one cohesive title verdict, core summary, and user Q&A for the whole content. | JSON (`titleVerdict`, `coreSummary`, `customQuestionAnswers`) |
| [`aggregate-egg.md`](./aggregate-egg.md) | Stage 2 Aggregation | Synthesizes per-chunk findings into unified knowledge entries, key question answers, and read verdict for each egg. | JSON (`novelDelta`, `keyQuestionAnswers`, `rejected`, `rejectReason`, `readVerdict`, `readVerdictReason`) |

### 4. Independent Features

| File | Trigger | Purpose | Output Format |
|---|---|---|---|
| [`follow-up.md`](./follow-up.md) | User asks questions in Chrome popup | Answers follow-up questions about the captured content with conversation history context. | JSON (`answers`: `[{"question", "answer"}]`) |
| [`merge-unprocessed.md`](./merge-unprocessed.md) | Manual button or 20+ entries threshold | Deduplicates and nests accumulated `# Unprocessed` entries into the structured `# Knowledge` tree. | JSON (`knowledge`, `unprocessed`) |
| [`localize-egg.md`](./localize-egg.md) | New egg with non-English description | Translates the egg template into the language of the egg's description while keeping parser-critical headings in English. | Full egg note (Markdown) |

---

## Customization Rules & Guidelines

### ✅ What You Can Safely Customize
- **Tone and Perspective**: You can instruct the AI to be more critical, more technical, or focus on specific themes.
- **Summary Depth**: You can change how concise or detailed summaries should be.
- **Language / Idiom Preferences**: You can tweak phrasing, formatting preferences, or custom analytical lenses.
- **Grounding Rule**: Edit `grounding-rule.md` to adjust how strictly the AI stays grounded to the source content. The change automatically applies to all 7 prompts that use `{{grounding_rule}}`.

### ⚠️ What You Must Preserve (To Prevent Parser Errors)
1. **`{{placeholders}}`**: The strings enclosed in double curly braces (e.g. `{{content}}`, `{{egg_description}}`, `{{knowledge_tree}}`) are replaced dynamically by the engine. Do not delete or rename them.
2. **JSON Schemas**: Prompts that output JSON must keep the exact JSON key names specified in the template. The TypeScript engine parses these exact keys.
3. **Markdown Structural Headings**: In prompts that output markdown (`localize-egg.md`), structural labels and headings like `# Knowledge` and `# Unprocessed` must remain verbatim in English for the note parser.

---

## Updates & Conflict Resolution

When NutEgg updates to a newer version:
- **If you haven't edited a workflow file**: The plugin automatically updates it to the latest version.
- **If you have customized a workflow file**: NutEgg will **never overwrite your custom version**. Instead, it writes `[filename].new.md` alongside your file so you can inspect what changed in the update.
- **Obsolete prompt cleanup**: Any unedited prompt files that were removed in a newer release of NutEgg are automatically pruned so your `_workflow/` folder stays clean.
- **Use Defaults (Clean Reset)**: You can reset all workflow files back to factory defaults at any time from `Obsidian Settings → NutEgg → Use Default Workflow Prompts` by clicking **Use Defaults**. This safely moves all your existing files to a timestamped backup folder (`_workflow/_backup/<timestamp>/`), clears obsolete files, and restores clean built-in defaults.
