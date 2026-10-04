// ============================================================
// NutEgg Unified AI Processor (Stage 1 + Stage 2 + Orchestration)
// ============================================================

import { isAIConfigured } from "./catalog";
import { AIError } from "./client";
import {
  DEFAULT_CHUNK_WINDOW_CHARS,
  chunkContent,
  formatSeconds,
  partNote,
  toSeconds,
} from "./chunker";
import {
  countUnprocessed,
  extractEggLanguage,
  formatEggForPrompt,
  formatEggInstructionsForPrompt,
  formatEggKnowledgeForPrompt,
  insertEggLanguage,
} from "./egg-format";
import {
  parseJson,
  repairTruncatedJson,
  sanitizeJsonString,
} from "./json-repair";
import { PROMPTS, renderPrompt } from "./prompt-templates";
import {
  DEFAULT_ANALYSIS_SECTIONS,
  type AIProcessorHost,
  type AnalysisResult,
  type AnalysisSectionsConfig,
  type CapturePayload,
  type ContentAnalysis,
  type ContentChunk,
  type EggAnalysis,
  type EggContent,
  type ExtractedKnowledgeEntry,
  type KeyAnswer,
  type MindMapNode,
  type SourceRef,
  type MergeResult,
  type EggSaveEntry,
  type ReadAction,
  type QuestionScope,
  type WorkflowPromptKey,
} from "./types";

export {
  repairTruncatedJson,
  sanitizeJsonString,
  parseJson,
  chunkContent,
};

export type {
  AnalysisSectionsConfig,
  ContentAnalysis,
  KeyAnswer,
  MindMapNode,
  SourceRef,
  ExtractedKnowledgeEntry,
  EggAnalysis,
  EggSaveEntry,
  MergeResult,
  AnalysisResult,
  EggContent,
  WorkflowPromptKey,
};

export { DEFAULT_ANALYSIS_SECTIONS };

/**
 * Prune task instructions from an existing task template string based on enabled sections,
 * preserving any user customizations to the prompt wording, and renumbering remaining items.
 */
export function pruneTaskContent(
  taskText: string,
  sections: AnalysisSectionsConfig
): string {
  if (!taskText) return "";
  const lines = taskText.split("\n");
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (!sections.titleVerdict && /title\s*verdict/i.test(line)) return false;
    if (!sections.coreSummary && /core\s*summary/i.test(line)) return false;
    if (!sections.mindMap && /mind\s*map/i.test(line)) return false;
    return true;
  });
  return filtered
    .map((line, idx) => line.replace(/^\s*\d+[\.\)]\s*/, `${idx + 1}. `))
    .join("\n");
}

/**
 * Prune section-specific output rules from an existing rules template string,
 * preserving any user customizations or extra custom rules.
 */
export function pruneRulesFromTemplate(
  rulesBlock: string,
  sections: AnalysisSectionsConfig
): string {
  if (!rulesBlock) return "";
  const lines = rulesBlock.split("\n");
  const result: string[] = [];
  let skippingCurrentBullet = false;

  for (const line of lines) {
    const isBulletStart = /^\s*[-*]\s+/.test(line);
    if (isBulletStart) {
      skippingCurrentBullet = false;
      if (!sections.titleVerdict && /^\s*[-*]\s*titleVerdict\b/i.test(line)) {
        skippingCurrentBullet = true;
        continue;
      }
      if (!sections.coreSummary && /^\s*[-*]\s*coreSummary\b/i.test(line)) {
        skippingCurrentBullet = true;
        continue;
      }
      if (!sections.mindMap && /^\s*[-*]\s*mindMap\b/i.test(line)) {
        skippingCurrentBullet = true;
        continue;
      }
    }

    if (!skippingCurrentBullet) {
      result.push(line);
    }
  }
  return result.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Prune disabled keys from a JSON schema string found in the prompt template,
 * preserving user schema formatting and customizations.
 */
export function pruneSchemaFromTemplate(
  schemaText: string,
  sections: AnalysisSectionsConfig
): string {
  const startIdx = schemaText.indexOf("{");
  const endIdx = schemaText.lastIndexOf("}");
  if (startIdx === -1 || endIdx === -1) return schemaText;

  const inner = schemaText.slice(startIdx + 1, endIdx);
  const properties: string[] = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  let currentProp = "";

  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (inString) {
      currentProp += c;
      if (escaped) {
        escaped = false;
      } else if (c === "\\") {
        escaped = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }

    if (c === '"') {
      inString = true;
      currentProp += c;
      continue;
    }

    if (c === "{" || c === "[") {
      depth++;
      currentProp += c;
      continue;
    }

    if (c === "}" || c === "]") {
      depth--;
      currentProp += c;
      continue;
    }

    if (c === "," && depth === 0) {
      properties.push(currentProp);
      currentProp = "";
      continue;
    }

    currentProp += c;
  }
  if (currentProp.trim()) {
    properties.push(currentProp);
  }

  const filtered = properties.filter((prop) => {
    const keyMatch = prop.match(/"([^"]+)"\s*:/);
    if (!keyMatch) return true;
    const key = keyMatch[1];
    if (!sections.titleVerdict && key === "titleVerdict") return false;
    if (!sections.coreSummary && key === "coreSummary") return false;
    if (!sections.mindMap && key === "mindMap") return false;
    return true;
  });

  return "{\n  " + filtered.map((p) => p.trim()).join(",\n  ") + "\n}";
}

/**
 * Dynamically prune prompt task, JSON schema, and output rules directly from the
 * given template string when any section is disabled.
 * Preserves user custom rules, custom schema modifications, and prompt formatting.
 */
export function applyPrunedSections(
  tpl: string,
  sections: AnalysisSectionsConfig,
  _isAggregate = false
): string {
  const isDefault =
    sections.titleVerdict &&
    sections.coreSummary &&
    sections.mindMap;
  if (isDefault) return tpl;

  let out = tpl;

  // 1. Prune hardcoded task items inside ## Task if not using {{content_task_default}}
  out = out.replace(
    /(## Task[^\n]*\n)([\s\S]*?)(\n##\s+|$)/,
    (match, header, taskBody, footer) => {
      if (taskBody.includes("{{content_task_default}}")) {
        return match;
      }
      const pruned = pruneTaskContent(taskBody, sections);
      return `${header}${pruned}${footer}`;
    }
  );

  // 2. Prune schema inside ## Output Format
  const formatIdx = out.indexOf("## Output Format");
  if (formatIdx !== -1) {
    const afterFormat = formatIdx + "## Output Format".length;
    const nextHeaderMatch = out.slice(afterFormat).search(/\n##\s+/);
    const endOfFormatIdx =
      nextHeaderMatch !== -1 ? afterFormat + nextHeaderMatch : out.length;
    const formatSection = out.slice(formatIdx, endOfFormatIdx);
    const startBrace = formatSection.indexOf("{");
    const endBrace = formatSection.lastIndexOf("}");
    if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
      const schemaBody = formatSection.slice(startBrace, endBrace + 1);
      const pruned = pruneSchemaFromTemplate(schemaBody, sections);
      out =
        out.slice(0, formatIdx + startBrace) +
        pruned +
        out.slice(formatIdx + endBrace + 1);
    }
  }

  // 3. Prune rules inside ## Output Rules
  out = out.replace(
    /(## Output Rules[^\n]*\n)([\s\S]*?)(\{\{shared_output_rules\}\}|\n##\s+|$)/,
    (match, header, rulesBody, footer) => {
      const pruned = pruneRulesFromTemplate(rulesBody, sections);
      return `${header}${pruned}\n${footer}`;
    }
  );

  return out;
}

/** Unprocessed entries accumulate per egg; the merge runs at this threshold. */
export const MERGE_THRESHOLD = 20;

/**
 * Two-phase AI pipeline driven by the eggs' Action Guides:
 *   Phase 1 — content analysis (title verdict, core summary, mind map).
 *   Phase 2 — per-egg analysis (key answers, extracted entries, reading recommendation).
 * With exactly one matched egg, both phases are merged into a single call.
 *
 * All prompt text lives in shared/workflow/*.md (and user-editable templates in nutegg/_workflow/).
 */
export class AIProcessor {
  private host: AIProcessorHost;

  constructor(host: AIProcessorHost) {
    this.host = host;
  }

  get chunkWindowChars(): number {
    const val = this.host?.settings?.chunkWindowChars;
    return typeof val === "number" && val > 0 ? val : DEFAULT_CHUNK_WINDOW_CHARS;
  }

  private getPrompt(key: WorkflowPromptKey): string {
    const overrides =
      this.host?.settings?.promptOverrides ||
      this.host?.settings?.chromeAiPromptOverrides;
    if (overrides && typeof overrides[key] === "string" && overrides[key].trim().length > 0) {
      return overrides[key];
    }
    return (
      this.host?.workflowManager?.getPrompt(key) ||
      PROMPTS[key as keyof typeof PROMPTS] ||
      ""
    );
  }

  /** Output rules for Stage 1 content analysis (follows payload.outputLanguage or host settings.outputLanguage). */
  private getContentOutputRules(
    capture?: { outputLanguage?: string; [key: string]: any },
    scope: QuestionScope = "within"
  ): string {
    const langSetting =
      capture?.outputLanguage ||
      this.host?.settings?.outputLanguage ||
      "same-as-content";
    const isSame = !langSetting || langSetting === "same-as-content";
    const outputLanguage = isSame
      ? "the same language as the captured content"
      : `${langSetting} (translate into ${langSetting} even if the source content is in a different language)`;

    const tpl = this.getPrompt("sharedOutputRules");
    let rendered = renderPrompt(tpl, { output_language: outputLanguage }).trim();

    if (scope === "beyond") {
      const globalModeRule =
        "- Mode: Global Mode (Open / External Knowledge). You are in Global Mode and are NOT restricted to the provided content. You MUST use your full external world knowledge, independent reasoning, and fact-checking capabilities to answer questions. The provided content is only reference context or the subject of inquiry, NOT an exclusive boundary or sole source of truth. Freely fact-check, verify, refute, critique, supplement, or answer open-ended questions using general world knowledge. Do NOT limit your answer to only what is stated in the content.";

      const globalSourceRule =
        "- Source References: In Global Mode, source references to the content are optional. If an answer draws on external knowledge, set \"sources\": []. Only include sources if you are directly citing or quoting a specific passage from the provided content.";

      if (/^[ \t]*- Grounding:.*(?:\r?\n|$)/m.test(rendered)) {
        rendered = rendered.replace(/^[ \t]*- Grounding:.*(?:\r?\n|$)/m, `${globalModeRule}\n`);
      } else {
        rendered = `${globalModeRule}\n${rendered}`;
      }

      if (/^[ \t]*- Source References:[\s\S]*?(?=\n[ \t]*- Output Language:|\Z)/m.test(rendered)) {
        rendered = rendered.replace(
          /^[ \t]*- Source References:[\s\S]*?(?=\n[ \t]*- Output Language:|\Z)/m,
          `${globalSourceRule}\n`
        );
      }
      rendered = rendered.trim();
    }
    return rendered;
  }

  /** Output rules for Stage 2 egg analysis (follows the egg's language property). */
  private getEggOutputRules(
    eggOrLanguage: EggContent | string = "",
    fallbackDescription = "",
    capture?: { outputLanguage?: string; [key: string]: any }
  ): string {
    let lang = "";
    let desc = fallbackDescription;

    if (typeof eggOrLanguage === "object" && eggOrLanguage !== null) {
      lang = (eggOrLanguage.language || "").trim();
      desc = desc || (eggOrLanguage.indexDescription || "").trim();
    } else {
      lang = (eggOrLanguage || "").trim();
    }

    const hostSetting =
      capture?.outputLanguage ||
      this.host?.settings?.outputLanguage;
    const hostLang =
      hostSetting && hostSetting !== "same-as-content" ? hostSetting.trim() : "";

    const outputLanguage = lang
      ? lang.includes(" ") && !/^[A-Za-z]+$/.test(lang)
        ? `the same language as this reference: "${lang}"`
        : `${lang} (translate into ${lang} even if the source content is in a different language)`
      : hostLang
      ? `${hostLang} (translate into ${hostLang} even if the source content is in a different language)`
      : "the same language as the captured content";

    const tpl = this.getPrompt("sharedOutputRules");
    return renderPrompt(tpl, {
      output_language: outputLanguage,
    }).trim();
  }

  /**
   * Run end-to-end pipeline: Stage 1 content analysis + Stage 2 egg analysis.
   */
  async analyze(
    capture: {
      url: string;
      title: string;
      content: string;
      sourceType: string;
      chapters?: Array<{ time: string; title: string }>;
      questions?: string[];
      questionsScope?: QuestionScope;
      enabledSections?: Partial<AnalysisSectionsConfig>;
    },
    eggs: EggContent[]
  ): Promise<AnalysisResult> {
    if (!isAIConfigured(this.host?.settings)) {
      return this.fallbackAnalysis(capture, eggs);
    }
    const contentAnalysis = await this.analyzeContent(capture);
    return this.analyzeEggs(capture, eggs, contentAnalysis);
  }

  /**
   * Stage 1 — content summary + mind map + custom question answers.
   * Handles long-form chunked content with aggregation or single-chunk content.
   */
  async analyzeContent(
    capture: {
      url: string;
      title: string;
      content: string;
      sourceType: string;
      chapters?: Array<{ time: string; title: string }>;
      questions?: string[];
      questionsScope?: QuestionScope;
      enabledSections?: Partial<AnalysisSectionsConfig>;
    }
  ): Promise<ContentAnalysis> {
    const effectiveSections: AnalysisSectionsConfig = {
      ...DEFAULT_ANALYSIS_SECTIONS,
      ...(capture.enabledSections || {}),
    };

    if (!isAIConfigured(this.host?.settings)) {
      return {
        titleVerdict: effectiveSections.titleVerdict ? capture.title : "",
        coreSummary: effectiveSections.coreSummary ? [capture.title] : [],
        customQuestionAnswers: (capture.questions || []).map((q) => ({
          question: q,
          answer: "No API key configured — cannot answer.",
          scope: capture.questionsScope || "within",
        })),
        mindMap: [],
      };
    }

    const chunks = this.chunkContent(capture.content, capture.chapters || []);
    if (chunks.length > 1) {
      const partResults = await Promise.all(
        chunks.map((chunk) =>
          this.callContentChunk(
            {
              ...capture,
              content: chunk.content,
              chapters: chunk.chapters,
              questions: [],
              enabledSections: effectiveSections,
            },
            partNote(chunk)
          )
        )
      );
      const summary = await this.aggregateContent(
        {
          ...capture,
          enabledSections: effectiveSections,
        },
        partResults.map((r, i) => ({
          part: i + 1,
          startTime: chunks[i].startTime,
          bullets: r.coreSummary,
          mindMap: effectiveSections.mindMap ? r.mindMap : undefined,
        }))
      );
      return {
        titleVerdict: summary.titleVerdict,
        coreSummary: summary.coreSummary,
        customQuestionAnswers: summary.customQuestionAnswers,
        mindMap: summary.mindMap,
      };
    }

    const single = chunks[0];
    const effective = {
      ...capture,
      chapters: single?.chapters,
      enabledSections: effectiveSections,
    };
    return this.callContentChunk(effective, "");
  }

  /**
   * Stage 2 — follow egg instructions and synthesize reading recommendations.
   * Existing notes are only read during merge.
   */
  async analyzeEggs(capture: CapturePayload, eggs: EggContent[], contentAnalysis: ContentAnalysis): Promise<AnalysisResult> {
    if (!isAIConfigured(this.host?.settings) || !eggs.length) {
      return { ...contentAnalysis, schemaVersion: 3, shouldRead: null,
        shouldReadReason: eggs.length ? "AI analysis unavailable." : "", matchedEggs: eggs.map(e => e.fileName),
        eggResults: [], newKnowledge: [], ...(eggs.length ? { readAction: "uncertain" as const } : {}) };
    }
    const chunks = this.chunkContent(capture.content, capture.chapters || []);
    const signals = this.eggStage1Signals(capture, contentAnalysis);
    const eggResults = await Promise.all(eggs.map(async egg => {
      if (chunks.length === 1) return await this.analyzeAgainstEgg(capture, egg, "", signals) || this.failedEgg(egg);
      const parts = await Promise.all(chunks.map(chunk => this.analyzeAgainstEgg(
        { ...capture, content: chunk.content }, egg, partNote(chunk), signals)));
      const entries = parts.flatMap(part => part?.extractedEntries || []);
      try {
        const aggregate = await this.aggregateEgg(egg, chunks.map((chunk, i) => ({
          part: i + 1, startTime: chunk.startTime, success: !!parts[i],
          keyQuestionAnswers: parts[i]?.keyQuestionAnswers || [],
          readAction: parts[i]?.readAction || "uncertain", readVerdictReason: parts[i]?.readVerdictReason || "Part failed to process.",
          readingSources: parts[i]?.readingSources || [],
        })), signals);
        // Incomplete coverage must remain explicit, even if the model overlooks it.
        if (parts.some(p => !p)) Object.assign(aggregate, { readAction: "uncertain", readVerdict: null,
          readVerdictReason: "Some parts failed to process; coverage is incomplete." });
        return { egg: egg.fileName, language: parts.find(p => p?.language)?.language, extractedEntries: entries, ...aggregate };
      } catch (err) {
        console.warn(`[NutEgg] Aggregate failed for ${egg.fileName}`, err);
        return { ...this.failedEgg(egg), extractedEntries: entries,
          readVerdictReason: "Whole-content aggregation failed; showing available per-part answers.",
          keyQuestionAnswers: parts.flatMap((part, i) => (part?.keyQuestionAnswers || []).map(answer => ({
            ...answer, question: `[Part ${i + 1}] ${answer.question}`,
          }))) };
      }
    }));
    const newKnowledge: EggSaveEntry[] = eggResults.flatMap(result => {
      const items = result.extractedEntries.map(entry => ({ egg: result.egg,
        content: this.saveEntryBody(entry.content, entry.sources || []) }));
      for (const answer of result.keyQuestionAnswers) {
        if (answer.answered === false || /^(?:not addressed in this content|not addressed in this part)[.!]?$/i.test(answer.answer.trim())) continue;
        const body = `**${answer.question}**\n${answer.answer}`;
        items.push({ egg: result.egg, content: this.saveEntryBody(body, answer.sources || []) });
      }
      return items.filter((item, i) => items.findIndex(other => other.content === item.content) === i);
    });
    return { ...contentAnalysis, schemaVersion: 3, ...this.mergeVerdict(eggResults),
      matchedEggs: eggs.map(e => e.fileName), eggResults, newKnowledge };
  }

  private saveEntryBody(body: string, sources: SourceRef[]): string {
    const refs = sources.map(s => `  - Source location: ${s.ref}${s.quote ? ` — ${s.quote}` : ""}`).join("\n");
    return `${body.startsWith("- ") ? body : `- ${body.replace(/\n/g, "\n  ")}`}${refs ? `\n${refs}` : ""}`;
  }

  private failedEgg(egg: EggContent): EggAnalysis {
    return { egg: egg.fileName, keyQuestionAnswers: [], extractedEntries: [], readAction: "uncertain",
      readVerdict: null, readVerdictReason: "Egg analysis unavailable or failed.", readingSources: [] };
  }

  private eggStage1Signals(capture: CapturePayload, analysis: ContentAnalysis): string {
    return [capture.enabledSections?.titleVerdict !== false && analysis.titleVerdict ? `Stage 1 title answer: ${analysis.titleVerdict}` : "",
      capture.enabledSections?.coreSummary !== false && analysis.coreSummary?.length ? `Stage 1 summary:\n${analysis.coreSummary.join("\n")}` : ""].filter(Boolean).join("\n\n");
  }

  /** Phase 1 — content-level summary + mind map + custom question answers. */
  private async callContentChunk(
    capture: {
      title: string;
      url: string;
      content: string;
      sourceType: string;
      chapters?: Array<{ time: string; title: string }>;
      questions?: string[];
      questionsScope?: QuestionScope;
      enabledSections?: Partial<AnalysisSectionsConfig>;
    },
    partNoteStr = ""
  ): Promise<ContentAnalysis> {
    const sections: AnalysisSectionsConfig = {
      ...DEFAULT_ANALYSIS_SECTIONS,
      ...(capture.enabledSections || {}),
    };
    const rawTpl = this.getPrompt("contentAnalysis");
    const prunedTpl = applyPrunedSections(rawTpl, sections, false);
    const rawTask = this.getPrompt("contentTaskDefault");
    const prunedTask = pruneTaskContent(rawTask, sections);

    const prompt = renderPrompt(prunedTpl, {
      content_task_default: prunedTask,
      title: capture.title,
      url: capture.url,
      source_type: capture.sourceType,
      part_note: partNoteStr,
      chapters: sections.mindMap ? this.chaptersBlock(capture.chapters) : "",
      questions: this.questionsBlock(
        capture.questions,
        capture.questionsScope === "beyond"
          ? "User Questions — Global Mode (answer using broad external world knowledge, reasoning, and fact-checking)"
          : "User Questions (answer each directly and concisely)"
      ),
      content: this.truncate(capture.content, this.chunkWindowChars),
      shared_output_rules: this.getContentOutputRules(capture as any, capture.questionsScope || "within"),
    });

    const configuredMax = this.host?.settings?.contentAnalysisMaxTokens || 16384;
    const response = await this.callAI(prompt, configuredMax);
    const parsed = this.parseJson(response, "content-analysis");
    return {
      titleVerdict: sections.titleVerdict
        ? String(parsed.titleVerdict || "Could not generate a verdict.")
        : "",
      coreSummary:
        sections.coreSummary && Array.isArray(parsed.coreSummary)
          ? parsed.coreSummary.map(String).slice(0, 3)
          : [],
      mindMap: sections.mindMap ? this.parseMindMap(parsed.mindMap) : [],
      customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers).map((a) => ({
        ...a,
        scope: a.scope || capture.questionsScope || "within",
      })),
    };
  }

  /** One instruction-driven call per egg/part, without existing knowledge. */
  private async analyzeAgainstEgg(capture: CapturePayload, egg: EggContent, partNoteStr = "", signals = ""): Promise<EggAnalysis | null> {
    const prompt = renderPrompt(this.getPrompt("eggAnalysis"), {
      egg_file: egg.fileName, egg_instructions: formatEggInstructionsForPrompt(egg),
      stage1_signals: signals, title: capture.title, url: capture.url, source_type: capture.sourceType,
      part_note: partNoteStr, content: capture.content,
      shared_output_rules: this.getEggOutputRules(egg, "", capture),
    });
    try {
      const parsed = this.parseJson(await this.callAI(prompt, this.host?.settings?.contentAnalysisMaxTokens || 16384), "egg-analysis");
      return { egg: egg.fileName, language: typeof parsed.language === "string" ? parsed.language : egg.language,
        keyQuestionAnswers: this.parseKeyAnswers(parsed.keyQuestionAnswers), extractedEntries: this.parseExtractedEntries(parsed.extractedEntries),
        ...this.parseRecommendation(parsed) };
    } catch (err) {
      console.warn(`[NutEgg] Egg analysis failed for ${egg.fileName}`, err);
      return null;
    }
  }

  private parseRecommendation(parsed: any): Pick<EggAnalysis, "readAction" | "readVerdict" | "readVerdictReason" | "readingSources"> {
    const actions = ["full", "highlights", "summary", "skip", "uncertain"];
    const readAction: ReadAction = actions.includes(parsed.readAction) ? parsed.readAction : "uncertain";
    return { readAction, readVerdict: this.actionVerdict(readAction),
      readVerdictReason: typeof parsed.readVerdictReason === "string" ? parsed.readVerdictReason : "Recommendation unavailable.",
      readingSources: this.parseSources(parsed.readingSources) };
  }

  private actionVerdict(action: ReadAction): boolean | null {
    return action === "uncertain" ? null : action === "full" || action === "highlights";
  }

  private parseSources(raw: any): SourceRef[] {
    return Array.isArray(raw) ? raw.filter(s => s && typeof s.ref === "string" && s.ref.trim()).map(s => ({
      ref: s.ref.trim(), ...(typeof s.quote === "string" ? { quote: s.quote } : {}),
    })) : [];
  }

  private parseExtractedEntries(raw: any): ExtractedKnowledgeEntry[] {
    return Array.isArray(raw) ? raw.filter(e => e && typeof e.content === "string" && e.content.trim()).map(e => ({
      kind: e.kind === "list" || e.kind === "answer" ? e.kind : "insight", content: e.content.trim(), sources: this.parseSources(e.sources),
    })) : [];
  }

  /** Aggregate the per-part content summaries into one result. */
  private async aggregateContent(
    capture: {
      title: string;
      url: string;
      chapters?: Array<{ time: string; title: string }>;
      questions?: string[];
      questionsScope?: QuestionScope;
      enabledSections?: Partial<AnalysisSectionsConfig>;
    },
    chunkSummaries: Array<{
      part: number;
      startTime: string;
      bullets: string[];
      mindMap?: MindMapNode[];
    }>
  ): Promise<{
    titleVerdict: string;
    coreSummary: string[];
    customQuestionAnswers: KeyAnswer[];
    mindMap?: MindMapNode[];
  }> {
    const sections: AnalysisSectionsConfig = {
      ...DEFAULT_ANALYSIS_SECTIONS,
      ...(capture.enabledSections || {}),
    };
    const rawTpl = this.getPrompt("aggregateContent");
    const prunedTpl = applyPrunedSections(rawTpl, sections, true);
    const rawTask = this.getPrompt("contentTaskDefault");
    const prunedTask = pruneTaskContent(rawTask, sections);

    const prompt = renderPrompt(prunedTpl, {
      title: capture.title,
      url: capture.url,
      chapters: sections.mindMap ? this.chaptersBlock(capture.chapters) : "",
      chunk_summaries: chunkSummaries
        .map((c) => {
          const at = c.startTime ? ` (${c.startTime})` : "";
          const bullets = c.bullets.map((b) => `- ${b}`).join("\n");
          let mmStr = "";
          if (sections.mindMap && Array.isArray(c.mindMap) && c.mindMap.length > 0) {
            mmStr =
              "\n### Key Concepts/Branches from this part:\n" +
              JSON.stringify(c.mindMap);
          }
          return `## Part ${c.part} of ${chunkSummaries.length}${at}\n${bullets || "- (no summary)"}${mmStr}`;
        })
        .join("\n\n"),
      questions: this.questionsBlock(
        capture.questions,
        capture.questionsScope === "beyond"
          ? "User Questions — Global Mode (answer using broad external world knowledge, reasoning, and fact-checking)"
          : "User Questions (answer each directly and concisely)"
      ),
      content_task_default: prunedTask,
      shared_output_rules: this.getContentOutputRules(capture as any, capture.questionsScope || "within"),
    });

    const defaultMax = sections.mindMap ? 4096 : 1500;
    const budget = Math.max(defaultMax, this.host?.settings?.contentAnalysisMaxTokens || defaultMax);
    const response = await this.callAI(prompt, budget);
    const parsed = this.parseJson(response, "aggregate-content");
    return {
      titleVerdict: sections.titleVerdict
        ? String(parsed.titleVerdict || "Could not generate a verdict.")
        : "",
      coreSummary:
        sections.coreSummary && Array.isArray(parsed.coreSummary)
          ? parsed.coreSummary.map(String).slice(0, 3)
          : [],
      customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers).map((a) => ({
        ...a,
        scope: a.scope || capture.questionsScope || "within",
      })),
      mindMap: sections.mindMap ? this.parseMindMap(parsed.mindMap) : [],
    };
  }

  /** Whole-source answers/recommendation; no raw content or entry bodies. */
  private async aggregateEgg(egg: EggContent, findings: Array<{ part: number; startTime: string; success: boolean;
    keyQuestionAnswers: KeyAnswer[]; readAction: string; readVerdictReason: string; readingSources: SourceRef[] }>, signals = "") {
    const prompt = renderPrompt(this.getPrompt("aggregateEgg"), {
      egg_file: egg.fileName, scope: egg.scope, key_questions: egg.keyQuestions.join("\n"),
      worth_reading_if: egg.worthReadingIf.join("\n"), skip_if: egg.skipIf.join("\n"), stage1_signals: signals,
      chunk_findings: JSON.stringify(findings), shared_output_rules: this.getEggOutputRules(egg),
    });
    const parsed = this.parseJson(await this.callAI(prompt, Math.max(4096, egg.keyQuestions.length * 512)), "aggregate-egg");
    return { keyQuestionAnswers: this.parseKeyAnswers(parsed.keyQuestionAnswers), ...this.parseRecommendation(parsed) };
  }

  /**
   * Localize an egg template (from templates/egg.md) into the same language as
   * the egg description. Keeps the structure and parser keywords in English.
   * Returns null when unavailable (no API key, AI error).
   */
  async localizeEggTemplate(
    templateContent: string,
    description: string
  ): Promise<{ content: string; language: string } | null> {
    if (!isAIConfigured(this.host?.settings)) return null;
    try {
      const prompt = renderPrompt(this.getPrompt("localizeEgg"), {
        description: description,
        template: templateContent,
      });
      const maxTokens = Math.max(8192, this.host?.settings?.contentAnalysisMaxTokens || 8192);
      const response = await this.callAI(prompt, maxTokens);
      let text = response.trim();
      text = text.replace(/^```[a-z]*\s*\n/i, "").replace(/\n```$/g, "").trim();
      if (
        text.includes("[!abstract]") &&
        text.includes("**Scope:**") &&
        text.includes("**Action Guide:**") &&
        text.includes("# Knowledge") &&
        text.includes("# Unprocessed")
      ) {
        const language = extractEggLanguage(text);
        return { content: text, language };
      }
      return null;
    } catch (err) {
      console.warn("[NutEgg] AI egg template localization failed:", err);
      return null;
    }
  }

  /**
   * Split content into <=chunkWindowChars parts. Timestamped transcripts
   * (YouTube) are split at caption lines and chapters are attached to the
   * chunk covering their start time; plain text is split at paragraphs.
   */
  private chunkContent(
    content: string,
    chapters: Array<{ time: string; title: string }>
  ): ContentChunk[] {
    return chunkContent(
      content,
      chapters,
      this.chunkWindowChars
    );
  }

  private mergeVerdict(results: EggAnalysis[]): Pick<AnalysisResult, "readAction" | "shouldRead" | "shouldReadReason" | "readingSources"> {
    const order: ReadAction[] = ["full", "highlights", "uncertain", "summary", "skip"];
    const readAction = order.find(action => results.some(r => r.readAction === action)) || "uncertain";
    return { readAction, shouldRead: this.actionVerdict(readAction),
      shouldReadReason: results.filter(r => r.readAction === readAction).map(r => `${r.egg}: ${r.readVerdictReason}`).join(" "),
      readingSources: results.filter(r => r.readAction === "full" || r.readAction === "highlights").flatMap(r => r.readingSources) };
  }

  /** No-API-key fallback: naive content summary, no egg analysis. */
  private fallbackAnalysis(
    capture: { title: string; content: string; questions?: string[] },
    eggs: EggContent[]
  ): AnalysisResult {
    const firstSentence =
      capture.content.match(/^[^.!?]+[.!?]/)?.[0]?.trim() || capture.title;
    return {
      titleVerdict: firstSentence,
      coreSummary: [
        `Source: ${capture.title}`,
        "(Configure an API key in NutEgg settings for AI analysis)",
      ],
      customQuestionAnswers: (capture.questions || []).map((q) => ({
        question: q,
        answer: "No API key configured — cannot answer.",
      })),
      mindMap: [],
      shouldRead: null,
      readAction: "uncertain",
      schemaVersion: 3,
      shouldReadReason: "No API key configured — cannot analyze.",
      matchedEggs: eggs.map((e) => e.fileName),
      eggResults: [],
      newKnowledge: [],
    };
  }

  /**
   * Answer follow-up questions after the initial analysis — one lightweight
   * call, grounded in the same content. Previous Q&A pairs are included as
   * context so the model can refer back instead of repeating answers.
   */
  async askFollowUp(
    capture: {
      title: string;
      url: string;
      content: string;
      sourceType: string;
    },
    questions: string[],
    priorQa: KeyAnswer[] | string = [],
    scope: QuestionScope = "within"
  ): Promise<KeyAnswer[]> {
    if (questions.length === 0) return [];

    if (!isAIConfigured(this.host?.settings)) {
      const aiProvider = this.host?.settings?.chromeAiProvider || this.host?.settings?.aiProvider;
      const msg =
        aiProvider === "local"
          ? "Local LLM not configured — cannot answer."
          : "No API key configured — cannot answer.";
      return questions.map((q) => ({
        question: q,
        answer: msg,
        scope,
      }));
    }

    let priorBlock = "";
    if (Array.isArray(priorQa) && priorQa.length > 0) {
      priorBlock = `## Previous Questions & Answers (context — refer back instead of repeating)\n${priorQa
        .map((qa: any) => (typeof qa === "string" ? qa : `Q: ${qa.question}\nA: ${qa.answer}`))
        .join("\n")}`;
    } else if (typeof priorQa === "string" && priorQa.trim().length > 0) {
      priorBlock = `## Previous Questions & Answers (context — refer back instead of repeating)\n${priorQa.trim()}`;
    }

    const prompt = renderPrompt(this.getPrompt("followUp"), {
      title: capture.title,
      url: capture.url,
      source_type: capture.sourceType,
      prior_qa: priorBlock,
      content: this.truncate(capture.content, this.chunkWindowChars),
      questions: questions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      shared_output_rules: this.getContentOutputRules(capture, scope),
    });

    try {
      const response = await this.callAI(prompt, 2000);
      const parsed = this.parseJson(response, "follow-up");
      const answers = this.parseKeyAnswers(parsed.answers);
      const byQuestion = new Map(answers.map((a) => [a.question, a]));
      return questions.map((q) => {
        const found = byQuestion.get(q);
        const item: KeyAnswer = {
          question: q,
          answer: found?.answer || "No answer returned — please try again.",
          scope: found?.scope || scope,
        };
        if (found?.sources && found.sources.length > 0) {
          item.sources = found.sources;
        }
        return item;
      });
    } catch (err) {
      if (err instanceof AIError) throw err;
      console.error("[NutEgg] Follow-up question failed:", err);
      return questions.map((q) => ({
        question: q,
        answer: "Failed to answer — please try again.",
        scope,
      }));
    }
  }

  /**
   * Merge an egg's Unprocessed entries into its Knowledge tree on demand.
   * Merges whenever there is at least 1 unprocessed entry.
   */
  private mergeJobs = new Map<string, Promise<MergeResult | null>>();

  async mergeEgg(fileName: string): Promise<MergeResult | null> {
    const existing = this.mergeJobs.get(fileName);
    if (existing) return existing;
    const job = this.performMergeEgg(fileName).finally(() => this.mergeJobs.delete(fileName));
    this.mergeJobs.set(fileName, job);
    return job;
  }

  private async performMergeEgg(fileName: string, retried = false): Promise<MergeResult | null> {
    const egg = await this.host?.eggParser?.readEgg?.(fileName);
    if (!egg) return null;

    const countFn = (e: EggContent) =>
      this.host?.eggParser?.countUnprocessed
        ? this.host.eggParser.countUnprocessed(e)
        : countUnprocessed(e);
    const entries = countFn(egg);
    if (entries === 0) {
      console.log(`[NutEgg] ${fileName} has no unprocessed entries to merge`);
      return null;
    }

    if (!isAIConfigured(this.host?.settings)) {
      console.log(
        `[NutEgg] ${fileName} has ${entries} unprocessed entries — skipped merge (AI not configured)`
      );
      return null;
    }

    let fallbackDesc = "";
    if (!egg.language && this.host?.indexReader) {
      try {
        const indexContent = await this.host.indexReader.getIndexContent?.();
        if (indexContent) {
          const indexEntries = this.host.indexReader.parseIndexContent?.(indexContent) || [];
          const indexEntry = indexEntries.find(
            (e) => e.fileName === fileName || e.fileName.endsWith("/" + fileName)
          );
          fallbackDesc = indexEntry?.description || "";
        }
      } catch {}
    }

    const hostSetting = this.host?.settings?.outputLanguage;
    const hostLang =
      hostSetting && hostSetting !== "same-as-content" ? hostSetting.trim() : "";

    const outputLanguage =
      egg.language ||
      (hostLang ? `${hostLang} (translate into ${hostLang} even if the source is in a different language)` : "") ||
      "the same language as this egg's existing knowledge";

    const prompt = renderPrompt(this.getPrompt("mergeUnprocessed"), {
      egg_file: fileName,
      output_language: outputLanguage,
      egg_description: fallbackDesc || egg.scope || egg.topic || "",
      formatting_rules: egg.formattingRules || "(none)",
      knowledge_tree: egg.knowledge || "(empty)",
      unprocessed: egg.unprocessed,
      unprocessed_count: entries,
    });

    try {
      const needed = Math.max(4096, Math.ceil((egg.knowledge.length + egg.unprocessed.length) / 1.5) + 1024);
      const cap = Number(this.host?.settings?.mergeMaxTokens || this.host?.settings?.contentAnalysisMaxTokens || 16384);
      if (needed > cap) {
        console.warn(`[NutEgg] Merge deferred for ${fileName}: full tree exceeds output budget.`);
        return null;
      }
      const response = await this.callAI(prompt, needed);
      // Never repair truncated merge JSON: a repaired tree could delete notes.
      const raw = response.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      const parsed = JSON.parse(raw);
      if (typeof parsed.knowledge !== "string" || !parsed.knowledge.trim() || typeof parsed.unprocessed !== "string") return null;
      const knowledge = parsed.knowledge.trim();
      const unprocessed = parsed.unprocessed.trim();
      const current = await this.host?.eggParser?.readEgg?.(fileName);
      const changed = current && (egg.sourceText ? current.sourceText !== egg.sourceText :
        current.knowledge !== egg.knowledge || current.unprocessed !== egg.unprocessed);
      if (changed) return retried ? null : this.performMergeEgg(fileName, true);
      const applied = await this.host?.eggParser?.applyMerge?.(fileName, knowledge, unprocessed, egg);
      if (applied === false) return retried ? null : this.performMergeEgg(fileName, true);
      console.log(`[NutEgg] Merged ${entries} unprocessed entries into ${fileName}`);
      return { egg: fileName, entries };
    } catch (err) {
      console.error(`[NutEgg] Merge failed for ${fileName}:`, err);
      return null;
    }
  }

  /**
   * Threshold-based merge helper scheduled after durable Hatch saving.
   */
  async maybeMergeEgg(fileName: string): Promise<MergeResult | null> {
    const egg = await this.host?.eggParser?.readEgg?.(fileName);
    if (!egg) return null;

    const countFn = (e: EggContent) =>
      this.host?.eggParser?.countUnprocessed
        ? this.host.eggParser.countUnprocessed(e)
        : countUnprocessed(e);
    const entries = countFn(egg);
    if (entries < MERGE_THRESHOLD) return null;

    return this.mergeEgg(fileName);
  }

  // --- Prompt building helpers ---

  /** `## Video Chapters (use these EXACT timestamps)` block, or "". */
  private chaptersBlock(chapters?: Array<{ time: string; title: string }>): string {
    if (!chapters?.length) return "";
    return `## Video Chapters (use these EXACT timestamps)\n${chapters
      .map((c) => `- ${c.time} — ${c.title}`)
      .join("\n")}`;
  }

  /** Numbered questions block with a heading, or "". */
  private questionsBlock(questions: string[] | undefined, heading: string): string {
    if (!questions?.length) return "";
    return `## ${heading}\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
  }

  private async callAI(prompt: string, maxTokens: number): Promise<string> {
    if (!this.host?.aiClient) {
      throw new AIError("unknown", "AIClient not provided to AIProcessor host");
    }
    return await this.host.aiClient.chat(prompt, maxTokens);
  }

  /** Normalize a `[{question, answer, sources}]` array from the AI response. */
  private parseKeyAnswers(raw: any): KeyAnswer[] {
    return Array.isArray(raw)
      ? raw
          .filter((qa: any) => qa && qa.question && qa.answer)
          .map((qa: any) => {
            const entry: KeyAnswer = {
              question: String(qa.question),
              answer: String(qa.answer),
            };
            if (typeof qa.answered === "boolean") entry.answered = qa.answered;
            if (qa.scope === "within" || qa.scope === "beyond") {
              entry.scope = qa.scope;
            }
            if (Array.isArray(qa.sources)) {
              const sources = qa.sources
                .filter((s: any) => s && (s.ref || s.timestamp || s.section))
                .map((s: any) => {
                  const item: SourceRef = {
                    ref: String(s.ref || s.timestamp || s.section).trim(),
                  };
                  if (s.quote) {
                    item.quote = String(s.quote).trim();
                  }
                  return item;
                })
                .filter((s: SourceRef) => s.ref.length > 0);
              if (sources.length > 0) {
                entry.sources = sources;
              }
            }
            return entry;
          })
      : [];
  }

  /** Normalize a hierarchical mind map array from the AI response. */
  private parseMindMap(raw: any, depth = 0): MindMapNode[] {
    if (!Array.isArray(raw) || depth > 5) return [];
    return raw
      .filter((item: any) => item && (item.name || item.title || item.topic))
      .map((item: any) => {
        const node: MindMapNode = {
          name: String(item.name || item.title || item.topic).trim(),
        };
        const time = typeof item.time === "string" ? item.time.trim().replace(/^\[|\]$/g, "") : "";
        if (/^\d{1,3}:[0-5]\d(?::[0-5]\d)?$/.test(time)) node.time = time;
        const detail = item.detail || item.description || item.summary;
        if (detail && typeof detail === "string" && detail.trim().length > 0) {
          node.detail = detail.trim();
        }
        if (Array.isArray(item.children) && item.children.length > 0) {
          const children = this.parseMindMap(item.children, depth + 1);
          if (children.length > 0) {
            node.children = children;
          }
        }
        return node;
      });
  }

  /**
   * Parse an AI response that should be JSON, stripping markdown fences.
   * Sanitizes unescaped control characters (\n, \r, \t) in strings and
   * recovers partial/truncated JSON when responses are cut off mid-stream.
   */
  private parseJson(
    response: string,
    context = "response"
  ): Record<string, any> {
    return parseJson(response, context);
  }

  private truncate(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars) + "\n\n[...truncated]";
  }

  toSeconds(time: string): number {
    return toSeconds(time);
  }

  formatSeconds(sec: number): string {
    return formatSeconds(sec);
  }
}
