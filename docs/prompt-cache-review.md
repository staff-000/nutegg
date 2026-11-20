# Prompt cache review

Reviewed the 18 files in `shared/workflow/`, their rendering in `shared/src/ai-processor.ts`, localization and routing, and the API client. The findings below describe the audit baseline.

Implementation: raw-content prompts retain their common source prefix and now align the complete shared-rules block immediately after it. Stage 1 keeps optional inputs alongside Task instructions, before Output Format, without a separate Request Inputs heading. Follow-up, aggregation, merge and localization retain static-first input ordering. Localization examples no longer duplicate input, and schema pruning bounds the standalone JSON object. Numeric cache diagnostics record provider fields when exposed by the transport. Custom prompts remain intact; splitting customized policy templates and introducing explicit provider cache controls are deliberately separate transport/template migrations.

## Preserve the existing source prefix

The six raw-content templates (`content-analysis`, `verdict-summary`, `mindmap-analysis`, `chrome-knowledge`, `egg-analysis`, `follow-up`) have an identical 229-character template prefix before `{{content}}`, followed by the source itself. This already makes the expensive source eligible for reuse across tasks when the rendered metadata, part label, content, model, and request settings agree. Identical text is an eligibility condition, not proof of a cache hit.

Do not move different task instructions or JSON schemas ahead of that source independently in each template: their divergence would prevent reuse of the source across tasks. Adding one identical common preamble to all six is compatible with source reuse. Padding a small preamble merely to meet a provider's cache threshold is not recommended.

## Proposed ordering

For the raw-content family, use:

1. Identical common introduction and any truly universal instructions.
2. Identical source metadata, part identity, and source text.
3. Shared policies that are identical for the participating tasks.
4. Task-specific static instructions, schema, and output rules.
5. Request-specific history and egg inputs. For the three Stage 1 templates, optional questions, chapters, verdict context and conversation hints instead stay next to Task instructions, before the schema, to keep related instructions together.

Keep `## Task`, `## Output Format` and `## Output Rules` separate. Stage 1 optional inputs belong with the task; follow-up retains a separate `## Request Inputs` section. A task can refer to inputs supplied later; change references such as “above” to the named input section when moving them.

`shared_output_rules` is about 1,733 template characters, but its rendered value is not universally constant:

- `within` and `beyond` replace grounding and citation instructions.
- Source analysis follows capture/settings language; egg analysis can override language per egg.
- The shared template itself is customizable.

The lowest-risk first step is to move the existing complete placeholder to the same point immediately after source text, before task-specific divergence, where policies agree. This extends reuse between compatible calls without shortening source reuse when policies differ.

For greater reuse, separate common citation formatting from request-specific grounding/language policies. Keep egg language with egg-specific inputs. Preserve the existing customized shared template intact as a compatibility path; do not assume an arbitrary customized template can safely be split by English bullet labels.

## Per-template opportunities

| Templates | Recommended change | Semantic constraints |
| --- | --- | --- |
| content-analysis, verdict-summary, mindmap-analysis | Keep the common source/policy prefix; place optional questions, chapters, verdict context and conversation hints with Task instructions before the schema. | Preserve section pruning, enumeration completeness, exact source references, and conditional conversation rules. |
| chrome-knowledge | Keep the source prefix; align compatible shared policies with the other raw-content prompts. | Preserve its knowledge-entry tags and formatting specification. |
| egg-analysis | Keep source and source-shared Stage 1 signals before per-egg inputs. Keep task/schema instructions ahead of `Target Egg`. Move per-egg language to the egg-specific tail if policies are split. | Keep scope, action guide, key questions, entry-generation opt-out, recommendation preferences, and language together and authoritative. |
| follow-up | Move output schema, rules, and static task text before previous Q&A and new questions, after the common source/policy prefix. | Preserve `within`/`beyond` behavior, question order, and previous answers as context rather than instructions. |
| aggregate-content | Move task/schema/rules before title, chapters, part summaries, and questions. | The evidence is per-part drafts, not the original source. Retain coverage limitations and original source citations. |
| aggregate-discussion | Move grouping instructions, schema, and shared policies before title/drafts. | Preserve draft-topic identity, attribution, and prohibition on recalculating consensus. |
| aggregate-egg | Already keeps shared Stage 1 context and task/schema before target egg. Separate per-egg language if splitting shared policies. | Keep per-part findings egg-specific: findings differ across eggs and must not be shared as if source-global. |
| discussion-analysis | Already places static instructions and shared policies before batch data. Keep title/body before changing parents/items. | Preserve compact numeric ID semantics and parent-only context. |
| egg-routing | Already puts the reusable vault index before changing page data. Preserve its order deterministically. | Do not sort/rewrite user instructions as an incidental cache optimization. |
| merge-unprocessed | Start with generic task/schema/rules, then stable egg name/language/formatting, then knowledge tree and pending entries. Move changing entry count to the data tail. | Preserve complete-tree output, user-authored branches, source attribution, and unresolved fragments. |
| localize-workflow | Put invariant instructions/schema before target language, filename, and input workflow. Fix literal-placeholder rendering first. | Preserve every input placeholder and parser-dependent English heading/bullet prefix. |
| localize-egg | Put fixed localization/parser instructions first. A stable source template can precede changing target language/description. | Remove “above” assumptions; retain language choice and exact parser labels. |
| shared-output-rules, conversation-rules, content-task-default | Treat these as fragments with different stability domains, not standalone cache entries. | The last two depend on section/format settings; inserting them before the common source would fragment cross-task reuse. |

## Confirmed rendering issue and movement hazards

### Localization duplicates source input and destroys literal examples

`localize-workflow.md` uses literal `{{content}}`, `{{title}}`, and similar examples in its placeholder-preservation instruction. `renderPrompt` substitutes every occurrence and removes missing variables. A sentinel render confirmed the complete input appears twice, while several literal examples become empty strings. Protect literal examples with an escaping mechanism, dedicated literal-valued placeholders, or wording that does not resemble render slots. Do not change missing-variable behavior globally without auditing custom templates.

### Section movement affects pruning

`applyPrunedSections` recognizes the first `## Task`, the `## Output Format` section, and `## Output Rules` ending at `{{shared_output_rules}}` or the next level-two heading. Moving section-specific instructions outside those ranges bypasses their pruning. Moving shared placeholders or brace-containing examples into the schema range can also confuse its first-brace/last-brace scan. Reorder complete sections and keep a bounded schema region; verify the fully rendered prompt for every enabled-section combination.

### Source text is not always identical across stages

Stage 1 and Stage 2 call `buildBodyContent`, which can append discussion evidence or add a missing-transcript notice. Follow-up uses `capture.content` directly, and always supplies an empty part note. Therefore cross-stage source reuse is conditional, especially with discussion or chunking. Do not change follow-up evidence scope merely to force a cache hit; measure these paths separately and correct the README's unconditional cache-reuse claim.

## Transport and verification

The API-key path sends one user-message string through BYOKit and returns only response text. NutEgg does not currently request explicit provider cache boundaries or record cached-input usage. The installed BYOKit `ChatInput` type also does not expose cache controls. Subscription execution is a separate transport and needs separate measurement.

Prompt ordering improves eligibility for implicit caching. Explicit Claude caching requires transport support; it cannot be enabled by moving Markdown alone. OpenAI and Gemini documentation likewise ties reuse to compatible prefixes and model-specific behavior. Minimum lengths, retention, and concurrent warming differ, so measure instead of promising a particular saving.

Recommended checks before shipping:

- Compare rendered common prefixes for summary → mind map → egg → follow-up, with mixed egg languages, both question scopes, long chunks, and discussion enabled/disabled.
- Assert disabled sections disappear from task instructions, schema, and output rules after reordering.
- Test localization preserves literal placeholders and includes input workflow only once.
- Test egg opt-outs, original-source attribution, missing coverage, exact timestamps/quotes, and question ordering with mocked responses; use a small output-quality evaluation before rollout.
- Preserve custom prompt overrides and Obsidian workflow update behavior.
- Record numeric provider-reported cached-input tokens when supported by the adapter, separately from estimated local prefix reuse; do not log source content or credentials.
- Build shared/extension and plugin after implementation. No provider or paid AI calls were made for this audit.

Provider references: [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching), [Claude prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Gemini context caching](https://aistudio.google.com/docs/caching).
