# NutEgg AI Workflow & Prompt Reference

These shared prompts power the extension and Obsidian plugin. Customize the Action Guide and Key Questions in each egg to highlight AMA answers, recurring video questions, or other results useful to you.

## Pipeline

```text
Captured content
  → Stage 1: summary, title verdict, mind map, custom Q&A
  → Summary-based egg routing and egg selection
  → Stage 2: egg-analysis (one call per egg for short content)
  → Answers, extracted entries, and reading recommendation
  → User clicks Hatch: archive originals and append to # Unprocessed
  → Merge at 20 pending entries or on demand: dedupe and organize # Knowledge
```

Changing selected eggs reuses the existing Stage 1 result. Stage 2 runs only for selected eggs without a captured result; previously analyzed eggs are displayed from the capture cache. Deselecting an egg hides its result while retaining it for reselection. Only currently selected eggs contribute to the reading recommendation and Hatch entries. Running a fresh Stage 1 analysis clears this cache.

Stage 2 reads the source and egg instructions, never the Knowledge tree or Unprocessed queue. Reading recommendations assess usefulness for your preferences rather than novelty against your notes. Hatch is independent of the recommendation: useful answers can be saved even when the original is skippable. There is no automatic Hatch.

## Knowledge-entry generation

Stage 2 uses the Stage 1 mind map to navigate relevant concepts and source locations, while the egg’s Scope, Action Guide and Formatting Rules decide what becomes an entry. Raw source evidence remains authoritative.

Set `> **Generate Knowledge Entries:** no` in an egg’s Instructions callout to disable entries for that egg. Omitting the setting or using `yes` permits generation. An opt-out in the Action Guide is also honored by the prompt.

The **🍃 Knowledge** option in **Analysis Sections** and the Egg Analysis dropdown share one per-tab setting. Choosing **🥚 Analysis only** turns Knowledge off on both pages; choosing **🍃 Include knowledge** turns it on. Toggling Knowledge updates the dropdown’s checkmark as well. Clicking a dropdown choice also runs analysis; toggling the section option alone does not start an AI call.

Knowledge-entry generation follows these rules:

| UI setting | Egg instructions | Result |
|---|---|---|
| Off / Analysis only | Any | No knowledge entries |
| On / Include knowledge | Explicit `no`, or Action Guide opts out | No entries for that egg |
| On / Include knowledge | `yes` or unspecified | Generate entries according to the egg instructions |

Either an off UI setting or an egg opt-out disables generation; an on setting never overrides an opt-out. The UI defaults to **Include knowledge** and is saved per browser tab and restored with its analysis. Key-question answers and reading recommendations are produced regardless. Generation does not save to egg files: **🐣 Hatch Egg** is the separate save action, enabled when generated entries are available.

Cached entries can be hidden and restored without AI. Turning generation on after an answers-only analysis requires Stage 2 for eggs without previously generated entries; eggs that explicitly opt out are not rerun just to request entries.


## Egg structure

Keep structural labels in English, including in localized eggs:

```markdown
> [!abstract]- Instructions:
> **Scope:** Agent architectures and practical tradeoffs.
> **Action Guide:** Highlight substantial questions, important answers, and limitations.
> **Key Questions:**
> - Which failure modes are demonstrated?
> **Worth Reading If:**
> - Practical examples or tradeoffs need attention beyond the summary.
> **Skip If:**
> - Mostly introductory definitions or promotion.
> **Formatting Rules:** Use concise answers with source locations.

# Knowledge

# Unprocessed
```

Worth Reading If and Skip If only guide recommendations; they never remove entries during merge. Existing Rejection Criteria sections require manual migration into Skip If. Do not ask Stage 2 to compare with existing notes, which it cannot see.

## Prompt directory

| File | Purpose | Main output |
|---|---|---|
| `content-analysis.md` | Stage 1 source analysis | Title verdict, summary, mind map, Q&A |
| `content-task-default.md` | Shared Stage 1 task fragment | Injected tasks |
| `egg-routing.md` | Match eggs from the Stage 1 summary | Matched eggs |
| `egg-analysis.md` | Follow one egg’s instructions | `keyQuestionAnswers`, `extractedEntries`, `readAction`, `readVerdictReason`, `readingSources`, `language` |
| `aggregate-content.md` | Combine long-content Stage 1 results | Whole-source summary and answers |
| `aggregate-egg.md` | Combine compact chunk answer drafts, recommendations, and coverage | Whole-source key answers and recommendation only |
| `merge-unprocessed.md` | Assemble fragments and consolidate duplicate claims | Complete `knowledge` and remaining `unprocessed` |
| `follow-up.md` | Answer follow-up questions | Answers with source references |
| `localize-egg.md` | Localize an egg’s instructions | Markdown with English structural labels |
| `shared-output-rules.md` | Shared grounding and language rules | Injected rules |

For content over 30k characters, Stage 2 analyzes each chunk then aggregates only answer drafts, recommendation notes, and coverage metadata. Aggregation never receives raw content, extracted entries, or the Knowledge tree. Chunk entries remain in source order until merge assembles them.

`readAction` is `full`, `highlights`, `summary`, `skip`, or `uncertain`. Code derives `readVerdict`: true for full/highlights, false for summary/skip, null for uncertain. Missing or invalid recommendations are uncertain. Stage 1’s enabled title verdict and core summary are small context signals; source evidence controls the decision. Partial failures preserve successful entries and make the recommendation uncertain.

## Saving and merging

Hatch archives original analyses and source references in the nut and history, then appends useful entries and supported key answers to Unprocessed. Threshold merges run after saving, so they do not delay Hatch acknowledgement. Merge preserves distinct examples, qualifications, disagreements, and provenance; it does not silently discard a claim because of Skip If. It serializes work per egg and checks the note snapshot before applying results. Malformed responses leave the note untouched; very large trees defer merging when the output budget cannot safely hold them.

## Customization and updates

Preserve `{{placeholders}}`, exact JSON schema keys, and English structural labels such as `# Knowledge` and `# Unprocessed`. Edited workflow files remain untouched during updates; new defaults are supplied as `.new.md` for review. Unmodified obsolete prompts are removed. Missing new recommendation fields in customized prompts display uncertain. Use Defaults backs up customized files before restoring built-in prompts.

The Chrome extension offers a per-tab **Knowledge** option in **Analysis Sections** on both the content and analysis pages. The egg selector offers **🥚 Egg Analysis** (answers and verdicts only) and **🥚 Egg Analysis with knowledge entry** (also generate entries). Neither saves to the egg file. The separate bottom **🐣 Hatch Egg** button saves generated entries and supported key answers to egg files; it is available only when entries have been generated. The **🍃 Knowledge** analysis-section option controls entry generation on both pages.

On the top Egg Analysis button beside Collect Nut Only, clicking the analysis label runs the current mode; clicking its separate arrow opens the two analysis choices. Selecting a choice runs it immediately. Egg selection changes do not open the menu. The top Egg Analysis and Collect Nut Only controls remain visible throughout connected-mode results.
