/**
 * Prompt templates — every AI prompt lives as plain text in src/prompts/*.md
 * so users can edit them freely (wording, language, ...). `{{placeholders}}`
 * are substituted at runtime; unknown ones render as empty strings.
 *
 * Changing the JSON output formats is at your own risk — the parsers in
 * ai-processor.ts expect the current shapes.
 */
import contentAnalysisTpl from "./prompts/content-analysis.md";
import eggAnalysisTpl from "./prompts/egg-analysis.md";
import eggCombinedTpl from "./prompts/egg-combined.md";
import followUpTpl from "./prompts/follow-up.md";
import eggRoutingTpl from "./prompts/egg-routing.md";
import actionGuideDefaultTpl from "./prompts/action-guide-default.md";
import mergeUnprocessedTpl from "./prompts/merge-unprocessed.md";
import aggregateContentTpl from "./prompts/aggregate-content.md";
import aggregateEggTpl from "./prompts/aggregate-egg.md";

export const PROMPTS = {
  /** Phase 1 — content summary + chapter map + custom question answers. */
  contentAnalysis: contentAnalysisTpl,
  /** Phase 2 — content against one egg (key questions, delta, reject, verdict). */
  eggAnalysis: eggAnalysisTpl,
  /** Single-egg combined call (phases 1 + 2 in one prompt). */
  eggCombined: eggCombinedTpl,
  /** Follow-up questions after the initial analysis. */
  followUp: followUpTpl,
  /** Egg routing — match content to egg files from _index.md. */
  eggRouting: eggRoutingTpl,
  /** Default Action Guide when no egg provides one. */
  actionGuideDefault: actionGuideDefaultTpl.trim(),
  /** Merge 20+ Unprocessed entries into the Knowledge tree. */
  mergeUnprocessed: mergeUnprocessedTpl,
  /** Combine per-part results into one result for long content. */
  aggregateContent: aggregateContentTpl,
  /** Per-egg verdict + key questions for long content (after per-part delta). */
  aggregateEgg: aggregateEggTpl,
};

/** Substitute {{placeholder}} variables in a template. */
export function renderPrompt(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? "" : String(value);
  });
}
