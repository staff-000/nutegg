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
import followUpTpl from "./workflow/follow-up.md";
import eggRoutingTpl from "./workflow/egg-routing.md";
import contentTaskDefaultTpl from "./workflow/content-task-default.md";
import mergeUnprocessedTpl from "./workflow/merge-unprocessed.md";
import aggregateContentTpl from "./workflow/aggregate-content.md";
import aggregateEggTpl from "./workflow/aggregate-egg.md";
import eggCompareTpl from "./workflow/egg-compare.md";
import localizeEggTpl from "./workflow/localize-egg.md";
import sharedOutputRulesTpl from "./workflow/shared-output-rules.md";

export const PROMPTS = {
  /** Phase 1 — content summary + chapter map + custom question answers. */
  contentAnalysis: contentAnalysisTpl,
  /** Step 1 extraction — content against one egg using instructions only. */
  eggAnalysis: eggAnalysisTpl,
  /** Step 2 comparison — candidate knowledge entries vs egg knowledge tree. */
  eggCompare: eggCompareTpl,
  /** Follow-up questions after the initial analysis. */
  followUp: followUpTpl,
  /** Egg routing — match content to egg files from _index.md. */
  eggRouting: eggRoutingTpl,
  /** Default content analysis task (Title Verdict, Core Summary, Chapter Map). */
  contentTaskDefault: contentTaskDefaultTpl.trim(),
  /** Merge 20+ Unprocessed entries into the Knowledge tree. */
  mergeUnprocessed: mergeUnprocessedTpl,
  /** Combine per-part results into one result for long content. */
  aggregateContent: aggregateContentTpl,
  /** Per-egg verdict + key questions for long content (after per-part delta). */
  aggregateEgg: aggregateEggTpl,
  /** Localize egg template matching the description language while keeping parser structure in English. */
  localizeEgg: localizeEggTpl,
  /** Shared output rules (grounding + language reference) injected into prompts. */
  sharedOutputRules: sharedOutputRulesTpl.trim(),
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
