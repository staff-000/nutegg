/**
 * Prompt templates — every AI prompt lives as plain text in src/workflow/*.md
 * so users can edit them freely (wording, language, ...). `{{placeholders}}`
 * are substituted at runtime; unknown ones render as empty strings.
 *
 * Changing the JSON output formats is at your own risk — the parsers in
 * ai-processor.ts expect the current shapes.
 */
import contentAnalysisTpl from "./workflow/content-analysis.md";
import eggAnalysisTpl from "./workflow/egg-analysis.md";
import eggCombinedTpl from "./workflow/egg-combined.md";
import followUpTpl from "./workflow/follow-up.md";
import eggRoutingTpl from "./workflow/egg-routing.md";
import actionGuideDefaultTpl from "./workflow/action-guide-default.md";
import mergeUnprocessedTpl from "./workflow/merge-unprocessed.md";
import aggregateContentTpl from "./workflow/aggregate-content.md";
import aggregateEggTpl from "./workflow/aggregate-egg.md";
import suggestEggTpl from "./workflow/suggest-egg.md";
import eggCompareTpl from "./workflow/egg-compare.md";
import localizeEggTpl from "./workflow/localize-egg.md";
import groundingRuleTpl from "./workflow/grounding-rule.md";

export const PROMPTS = {
  /** Phase 1 — content summary + chapter map + custom question answers. */
  contentAnalysis: contentAnalysisTpl,
  /** Step 1 extraction — content against one egg using instructions only. */
  eggAnalysis: eggAnalysisTpl,
  /** Step 1 single-egg extraction (content summary + key questions + candidate entries). */
  eggCombined: eggCombinedTpl,
  /** Step 2 comparison — candidate knowledge entries vs egg knowledge tree. */
  eggCompare: eggCompareTpl,
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
  /** Suggest a new egg for content that matched no existing egg. */
  suggestEgg: suggestEggTpl,
  /** Localize egg template matching the description language while keeping parser structure in English. */
  localizeEgg: localizeEggTpl,
  /** Shared grounding rule injected into every prompt. */
  groundingRule: groundingRuleTpl.trim(),
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
