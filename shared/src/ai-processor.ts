// ============================================================
// NutEgg Unified AI Processor (Stage 1 + Stage 2 + Orchestration)
// ============================================================

import { isAIConfigured } from "./catalog";
import { AIError } from "./client";
import {
  DEFAULT_CHUNK_WINDOW_CHARS,
  DEFAULT_SECTION_SECS,
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
  type ChapterEntry,
  type ContentAnalysis,
  type ContentChunk,
  type EggAnalysis,
  type EggContent,
  type ExtractedKnowledgeEntry,
  type KeyAnswer,
  type MindMapNode,
  type SourceRef,
  type MergeResult,
  type NewKnowledgeItem,
  type NovelDelta,
  type RedundantEntry,
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
  ChapterEntry,
  ContentAnalysis,
  KeyAnswer,
  MindMapNode,
  SourceRef,
  NovelDelta,
  ExtractedKnowledgeEntry,
  RedundantEntry,
  EggAnalysis,
  NewKnowledgeItem,
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
    if (!sections.chapterMap && /chapter\s*map/i.test(line)) return false;
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
      if (!sections.chapterMap && /^\s*[-*]\s*(chapterMap|isLongForm)\b/i.test(line)) {
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
    if (!sections.chapterMap && (key === "chapterMap" || key === "isLongForm")) return false;
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
    sections.mindMap &&
    sections.chapterMap;
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
 *   Phase 1 — content analysis (title verdict, core summary, chapter map).
 *   Phase 2 — per-egg analysis (key questions, novel delta, reject, verdict).
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

  get sectionGridSeconds(): number {
    const val = this.host?.settings?.sectionGridSeconds;
    return typeof val === "number" && val > 0 ? val : DEFAULT_SECTION_SECS;
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
  private getContentOutputRules(capture?: { outputLanguage?: string; [key: string]: any }): string {
    const langSetting =
      capture?.outputLanguage ||
      this.host?.settings?.outputLanguage ||
      "same-as-content";
    const isSame = !langSetting || langSetting === "same-as-content";
    const outputLanguage = isSame
      ? "the same language as the captured content"
      : `${langSetting} (translate into ${langSetting} even if the source content is in a different language)`;

    const tpl = this.getPrompt("sharedOutputRules");
    return renderPrompt(tpl, { output_language: outputLanguage }).trim();
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
      : "the same language as this egg note's existing knowledge (or the captured content if the egg has no existing knowledge)";

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
   * Stage 1 — content summary + chapter map + custom question answers.
   * Handles long-form chunked content with aggregation or single-chunk content.
   */
  async analyzeContent(
    capture: {
      url: string;
      title: string;
      content: string;
      sourceType: string;
      chapters?: Array<{ time: string; title: string }>;
      sections?: string[];
      questions?: string[];
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
        isLongForm: false,
        chapterMap: [],
        customQuestionAnswers: (capture.questions || []).map((q) => ({
          question: q,
          answer: "No API key configured — cannot answer.",
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
              sections: chunk.sections,
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
      const chapterMap = effectiveSections.chapterMap
        ? partResults.flatMap((r) => r.chapterMap)
        : [];
      return {
        titleVerdict: summary.titleVerdict,
        coreSummary: summary.coreSummary,
        isLongForm: true,
        chapterMap,
        customQuestionAnswers: summary.customQuestionAnswers,
        mindMap: summary.mindMap,
      };
    }

    const single = chunks[0];
    const effective = {
      ...capture,
      chapters: single?.chapters,
      sections: single?.sections,
      enabledSections: effectiveSections,
    };
    return this.callContentChunk(effective, "");
  }

  /**
   * Stage 2 — per-egg extraction, comparison against egg knowledge tree,
   * and final read verdict synthesis. Works identically for 1 or N eggs.
   */
  async analyzeEggs(
    capture: {
      url: string;
      title: string;
      content: string;
      sourceType: string;
      chapters?: Array<{ time: string; title: string }>;
      questions?: string[];
    },
    eggs: EggContent[],
    contentAnalysis: ContentAnalysis
  ): Promise<AnalysisResult> {
    if (!isAIConfigured(this.host?.settings) || eggs.length === 0) {
      const aiProvider = this.host?.settings?.chromeAiProvider || this.host?.settings?.aiProvider;
      return {
        ...contentAnalysis,
        shouldRead: eggs.length === 0 ? false : true,
        shouldReadReason:
          eggs.length === 0
            ? "No matching egg found in vault."
            : aiProvider === "local"
            ? "Local LLM not configured."
            : "No API key configured.",
        matchedEggs: eggs.map((e) => e.fileName),
        eggResults: [],
        newKnowledge: [],
      };
    }

    const chunks = this.chunkContent(capture.content, capture.chapters || []);
    let eggResults: EggAnalysis[] = [];

    if (chunks.length > 1) {
      for (const egg of eggs) {
        const partEggs = await Promise.all(
          chunks.map((chunk) =>
            this.analyzeAgainstEgg(
              { ...capture, content: chunk.content },
              egg,
              partNote(chunk)
            )
          )
        );
        const aggregate = await this.aggregateEgg(
          egg,
          chunks.map((chunk, i) => ({
            part: i + 1,
            startTime: chunk.startTime,
            delta: partEggs[i]?.novelDelta || [],
          }))
        );
        const novelDelta =
          aggregate.novelDelta && aggregate.novelDelta.length > 0
            ? aggregate.novelDelta
            : this.mergePerPartDeltas(partEggs.flatMap((r) => r?.novelDelta || []));
        const redundantEntries = partEggs.flatMap((r) => r?.redundantEntries || []);
        const existingKnowledge =
          partEggs.find((r) => r?.existingKnowledge)?.existingKnowledge || egg.knowledge;

        eggResults.push({
          egg: egg.fileName,
          keyQuestionAnswers: aggregate.keyQuestionAnswers,
          novelDelta,
          redundantEntries,
          existingKnowledge,
          rejected: aggregate.rejected,
          rejectReason: aggregate.rejectReason,
          readVerdict: aggregate.readVerdict,
          readVerdictReason: aggregate.readVerdictReason,
        });
      }
    } else {
      eggResults = (
        await Promise.all(
          eggs.map((egg) => this.analyzeAgainstEgg(capture, egg))
        )
      ).filter((r): r is EggAnalysis => r !== null);
    }

    const verdict = this.mergeVerdict(eggResults);
    const newKnowledge: NewKnowledgeItem[] = eggResults.flatMap((r) =>
      r.novelDelta.map((d) => ({
        egg: r.egg,
        parent: d.parent,
        content: d.content,
      }))
    );

    return {
      ...contentAnalysis,
      ...verdict,
      matchedEggs: eggs.map((e) => e.fileName),
      eggResults,
      newKnowledge,
    };
  }

  /** Phase 1 — content-level summary + chapter map + custom question answers. */
  private async callContentChunk(
    capture: {
      title: string;
      url: string;
      content: string;
      sourceType: string;
      chapters?: Array<{ time: string; title: string }>;
      sections?: string[];
      questions?: string[];
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
      chapters: sections.chapterMap ? this.chaptersBlock(capture.chapters) : "",
      sections: sections.chapterMap ? this.sectionsBlock(capture.sections) : "",
      questions: this.questionsBlock(
        capture.questions,
        "User Questions (answer each directly and concisely)"
      ),
      content: this.truncate(capture.content, this.chunkWindowChars),
      shared_output_rules: this.getContentOutputRules(capture as any),
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
      isLongForm: sections.chapterMap ? parsed.isLongForm === true : false,
      chapterMap: !sections.chapterMap
        ? []
        : parsed.isLongForm === false && (!capture.chapters || capture.chapters.length === 0)
        ? []
        : this.completeChapterMap(
            Array.isArray(parsed.chapterMap)
              ? parsed.chapterMap
                  .filter((c: any) => c && (c.time || c.title))
                  .map((c: any) => ({
                    time: String(c.time || ""),
                    title: String(c.title || ""),
                    summary: String(c.summary || ""),
                  }))
              : [],
            capture.sections
          ),
      customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers),
    };
  }

  /**
   * Multiple eggs — per-egg analysis:
   *   Step 1: Extract candidate knowledge entries + key question answers using ONLY the egg's instructions.
   *   Step 2: Compare candidate entries against egg's Knowledge tree & Unprocessed entries to find novel delta and read verdict.
   */
  private async analyzeAgainstEgg(
    capture: { title: string; url: string; content: string; sourceType: string },
    egg: EggContent,
    partNoteStr = ""
  ): Promise<EggAnalysis | null> {
    const formatInstructions = (e: EggContent) =>
      this.host?.eggParser?.formatEggInstructionsForPrompt
        ? this.host.eggParser.formatEggInstructionsForPrompt(e)
        : formatEggInstructionsForPrompt(e);

    const prompt = renderPrompt(this.getPrompt("eggAnalysis"), {
      egg_file: egg.fileName,
      egg_instructions: formatInstructions(egg),
      title: capture.title,
      url: capture.url,
      source_type: capture.sourceType,
      part_note: partNoteStr,
      content: this.truncate(capture.content, this.chunkWindowChars),
      shared_output_rules: this.getEggOutputRules(egg, "", capture),
    });

    try {
      const tokenBudget = this.host?.settings?.contentAnalysisMaxTokens || 16384;
      const response = await this.callAI(prompt, tokenBudget);
      const parsed = this.parseJson(response, "egg-analysis");
      const keyQuestionAnswers = this.parseKeyAnswers(parsed.keyQuestionAnswers);
      const extractedEntries = this.parseExtractedEntries(parsed.extractedEntries);
      const detectedLanguage = typeof parsed.language === "string" ? parsed.language.trim() : "";

      // If the egg had no language property, persist the LLM-detected language
      if (!egg.language && detectedLanguage) {
        egg.language = detectedLanguage;
        try {
          const vault = this.host?.app?.vault;
          const file = vault?.getAbstractFileByPath?.(egg.fileName);
          if (file && vault?.read && vault?.modify) {
            const content = await vault.read(file);
            const updated = insertEggLanguage(content, detectedLanguage);
            if (updated !== content) {
              await vault.modify(file, updated);
            }
          }
        } catch (err) {
          console.warn(`[NutEgg] Failed to persist LLM-detected language to ${egg.fileName}:`, err);
        }
      }

      // Step 2: Compare candidate entries with knowledge entries in the egg file
      const diff = await this.compareEggKnowledge(capture, egg, extractedEntries);

      return {
        egg: egg.fileName,
        language: detectedLanguage || egg.language || undefined,
        keyQuestionAnswers,
        extractedEntries,
        novelDelta: diff.novelDelta,
        redundantEntries: diff.redundantEntries,
        existingKnowledge: diff.existingKnowledge,
        rejected: diff.rejected,
        rejectReason: diff.rejectReason,
        readVerdict: diff.readVerdict,
        readVerdictReason: diff.readVerdictReason,
      };
    } catch (err) {
      if (err instanceof AIError) throw err;
      console.error(`[NutEgg] Egg analysis failed for ${egg.fileName}:`, err);
      return null;
    }
  }

  /**
   * Step 2 — Compare extracted candidate knowledge entries against the egg's
   * existing Knowledge tree and Unprocessed entries to find novel delta and read verdict.
   */
  private async compareEggKnowledge(
    capture: { title: string; url: string },
    egg: EggContent,
    extractedEntries: ExtractedKnowledgeEntry[]
  ): Promise<{
    novelDelta: NovelDelta[];
    redundantEntries: RedundantEntry[];
    existingKnowledge: string;
    rejected: boolean;
    rejectReason: string;
    readVerdict: boolean;
    readVerdictReason: string;
  }> {
    const existingKnowledge = egg.knowledge || "";
    if (extractedEntries.length === 0) {
      return {
        novelDelta: [],
        redundantEntries: [],
        existingKnowledge,
        rejected: false,
        rejectReason: "",
        readVerdict: false,
        readVerdictReason: "No knowledge entries extracted matching this egg's scope.",
      };
    }

    const prompt = renderPrompt(this.getPrompt("eggCompare"), {
      egg_file: egg.fileName,
      title: capture.title,
      url: capture.url,
      current_knowledge: existingKnowledge || "(empty)",
      unprocessed: egg.unprocessed || "(empty)",
      rejection_criteria:
        egg.rejectionCriteria && egg.rejectionCriteria.length > 0
          ? egg.rejectionCriteria.map((c) => `- ${c}`).join("\n")
          : "(none)",
      extracted_entries: extractedEntries
        .map((e, i) => `### Entry ${i + 1} (${e.kind || "insight"})\n${e.content}`)
        .join("\n\n"),
      shared_output_rules: this.getEggOutputRules(egg, "", capture),
    });

    try {
      const tokenBudget = this.host?.settings?.contentAnalysisMaxTokens || 16384;
      const response = await this.callAI(prompt, tokenBudget);
      const parsed = this.parseJson(response, "egg-compare");
      const novelDelta = Array.isArray(parsed.novelDelta)
        ? parsed.novelDelta
            .filter((d: any) => d && d.content)
            .map((d: any) => ({
              parent: String(d.parent || ""),
              content: String(d.content),
            }))
        : [];
      const rawRedundant = Array.isArray(parsed.redundantEntries)
        ? parsed.redundantEntries
        : Array.isArray(parsed.duplicateEntries)
        ? parsed.duplicateEntries
        : Array.isArray(parsed.duplicates)
        ? parsed.duplicates
        : [];

      const redundantEntries: RedundantEntry[] = rawRedundant
        .filter((r: any) => r && r.content)
        .map((r: any) => ({
          existingParent: String(r.existingParent || r.parent || ""),
          content: String(r.content),
        }));

      // Reconcile: ensure any candidate entry not in novelDelta is preserved in redundantEntries
      for (const ext of extractedEntries) {
        const extClean = ext.content.trim().toLowerCase();
        const isInDelta = novelDelta.some((n) => {
          const nClean = n.content.trim().toLowerCase();
          return nClean === extClean || nClean.includes(extClean) || extClean.includes(nClean);
        });
        const isInRedundant = redundantEntries.some((r) => {
          const rClean = r.content.trim().toLowerCase();
          return rClean === extClean || rClean.includes(extClean) || extClean.includes(rClean);
        });
        if (!isInDelta && !isInRedundant) {
          redundantEntries.push({
            existingParent: "Existing Knowledge Tree",
            content: ext.content,
          });
        }
      }

      return {
        novelDelta,
        redundantEntries,
        existingKnowledge,
        rejected: parsed.rejected === true,
        rejectReason: String(parsed.rejectReason || ""),
        readVerdict: parsed.readVerdict !== false,
        readVerdictReason: String(parsed.readVerdictReason || ""),
      };
    } catch (err) {
      if (err instanceof AIError) throw err;
      console.error(`[NutEgg] Knowledge comparison failed for ${egg.fileName}:`, err);
      // Fallback: preserve extracted entries as delta if comparison call failed
      return {
        novelDelta: extractedEntries.map((e) => ({ parent: "", content: e.content })),
        redundantEntries: [],
        existingKnowledge,
        rejected: false,
        rejectReason: "",
        readVerdict: true,
        readVerdictReason: "Extracted novel knowledge entries.",
      };
    }
  }

  /** Normalize a candidate knowledge entries array from the AI response. */
  private parseExtractedEntries(raw: any): ExtractedKnowledgeEntry[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((e: any) => e && (typeof e === "string" || e.content))
      .map((e: any) => {
        if (typeof e === "string") {
          return { kind: "insight" as const, content: e.trim() };
        }
        return {
          kind: e.kind === "list" ? ("list" as const) : ("insight" as const),
          content: String(e.content).trim(),
        };
      })
      .filter((e) => e.content.length > 0);
  }

  /**
   * Deduplicate and merge per-part deltas. When multiple parts report on the same concept,
   * prefer the fuller, more comprehensive entry over a partial or stub mention.
   */
  private mergePerPartDeltas(deltas: NovelDelta[]): NovelDelta[] {
    const conceptMap = new Map<string, NovelDelta>();
    const result: NovelDelta[] = [];

    for (const d of deltas) {
      const match = d.content.match(/\*\*([^*]+)\*\*/);
      const conceptKey = match ? match[1].trim().toLowerCase() : "";

      if (!conceptKey) {
        if (!result.some((r) => r.parent === d.parent && r.content === d.content)) {
          result.push(d);
        }
        continue;
      }

      const existing = conceptMap.get(conceptKey);
      if (!existing) {
        conceptMap.set(conceptKey, d);
        result.push(d);
      } else if (d.content.length > existing.content.length) {
        const idx = result.indexOf(existing);
        if (idx !== -1) {
          result[idx] = d;
        }
        conceptMap.set(conceptKey, d);
      }
    }

    return result;
  }

  /** Aggregate the per-part content summaries into one result. */
  private async aggregateContent(
    capture: {
      title: string;
      url: string;
      chapters?: Array<{ time: string; title: string }>;
      questions?: string[];
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
      chapters: sections.chapterMap ? this.chaptersBlock(capture.chapters) : "",
      chunk_summaries: chunkSummaries
        .map((c) => {
          const at = c.startTime ? ` (${c.startTime})` : "";
          const bullets = c.bullets.map((b) => `- ${b}`).join("\n");
          let mmStr = "";
          if (sections.mindMap && Array.isArray(c.mindMap) && c.mindMap.length > 0) {
            mmStr =
              "\n### Key Concepts/Branches from this part:\n" +
              c.mindMap
                .map(
                  (n) =>
                    `- **${n.name}**${n.detail ? `: ${n.detail}` : ""}`
                )
                .join("\n");
          }
          return `## Part ${c.part} of ${chunkSummaries.length}${at}\n${bullets || "- (no summary)"}${mmStr}`;
        })
        .join("\n\n"),
      questions: this.questionsBlock(
        capture.questions,
        "User Questions (answer each directly and concisely)"
      ),
      content_task_default: prunedTask,
      shared_output_rules: this.getContentOutputRules(capture),
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
      customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers),
      mindMap: sections.mindMap ? this.parseMindMap(parsed.mindMap) : [],
    };
  }

  /** Aggregate per-part delta findings into the egg's key answers + verdict. */
  private async aggregateEgg(
    egg: EggContent,
    chunkFindings: Array<{ part: number; startTime: string; delta: NovelDelta[] }>
  ): Promise<{
    novelDelta?: NovelDelta[];
    keyQuestionAnswers: KeyAnswer[];
    rejected: boolean;
    rejectReason: string;
    readVerdict: boolean;
    readVerdictReason: string;
  }> {
    const formatEgg = (e: EggContent) =>
      this.host?.eggParser?.formatEggForPrompt
        ? this.host.eggParser.formatEggForPrompt(e)
        : formatEggForPrompt(e);
    const prompt = renderPrompt(this.getPrompt("aggregateEgg"), {
      egg_file: egg.fileName,
      egg_instructions: formatEgg(egg),
      chunk_findings: chunkFindings
        .map((f) => {
          const at = f.startTime ? ` (${f.startTime})` : "";
          const delta = f.delta.map((d) => d.content).join("\n");
          return `## Part ${f.part} of ${chunkFindings.length}${at}\n${delta || "- (no novel delta)"}`;
        })
        .join("\n\n"),
      shared_output_rules: this.getEggOutputRules(egg),
    });

    const response = await this.callAI(prompt, 1500);
    const parsed = this.parseJson(response, "aggregate-egg");
    const novelDelta = Array.isArray(parsed.novelDelta)
      ? parsed.novelDelta
          .filter((d: any) => d && d.content)
          .map((d: any) => ({
            parent: String(d.parent || ""),
            content: String(d.content),
          }))
      : undefined;

    return {
      novelDelta,
      keyQuestionAnswers: this.parseKeyAnswers(parsed.keyQuestionAnswers),
      rejected: parsed.rejected === true,
      rejectReason: String(parsed.rejectReason || ""),
      readVerdict: parsed.readVerdict !== false,
      readVerdictReason: String(parsed.readVerdictReason || ""),
    };
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
      this.chunkWindowChars,
      this.sectionGridSeconds
    );
  }

  /** Combine per-egg verdicts into one global read recommendation. */
  private mergeVerdict(
    eggResults: EggAnalysis[]
  ): { shouldRead: boolean; shouldReadReason: string } {
    if (eggResults.length === 0) {
      return {
        shouldRead: true,
        shouldReadReason: "No matching egg found — review the summary above.",
      };
    }

    const rejectedAll = eggResults.every((r) => r.rejected);
    if (rejectedAll) {
      return {
        shouldRead: false,
        shouldReadReason:
          eggResults.map((r) => r.rejectReason).filter(Boolean).join(" ") ||
          "Rejected by all matched eggs.",
      };
    }

    const forReading = eggResults.filter((r) => r.readVerdict);
    const reasons = forReading.map((r) => r.readVerdictReason).filter(Boolean);
    return {
      shouldRead: forReading.length > 0,
      shouldReadReason:
        reasons.join(" ") ||
        (forReading.length > 0
          ? "See key question answers and novel delta below."
          : "No new knowledge found — the summary above likely covers it."),
    };
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
      isLongForm: false,
      chapterMap: [],
      customQuestionAnswers: (capture.questions || []).map((q) => ({
        question: q,
        answer: "No API key configured — cannot answer.",
      })),
      mindMap: [],
      shouldRead: true,
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
    priorQa: KeyAnswer[] = []
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
      }));
    }

    const priorBlock =
      priorQa.length > 0
        ? `## Previous Questions & Answers (context — refer back instead of repeating)\n${priorQa
            .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
            .join("\n")}`
        : "";

    const prompt = renderPrompt(this.getPrompt("followUp"), {
      title: capture.title,
      url: capture.url,
      source_type: capture.sourceType,
      prior_qa: priorBlock,
      content: this.truncate(capture.content, this.chunkWindowChars),
      questions: questions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      shared_output_rules: this.getContentOutputRules(capture),
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
      }));
    }
  }

  /**
   * Merge an egg's Unprocessed entries into its Knowledge tree on demand.
   * Merges whenever there is at least 1 unprocessed entry.
   */
  async mergeEgg(fileName: string): Promise<MergeResult | null> {
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
      const response = await this.callAI(prompt, 2000);
      const parsed = this.parseJson(response, "merge-unprocessed");
      const knowledge =
        typeof parsed.knowledge === "string" ? parsed.knowledge.trim() : "";
      if (!knowledge) {
        console.warn(
          `[NutEgg] Merge for ${fileName} returned no knowledge — egg untouched`
        );
        return null;
      }
      const unprocessed =
        typeof parsed.unprocessed === "string" ? parsed.unprocessed.trim() : "";
      await this.host?.eggParser?.applyMerge?.(fileName, knowledge, unprocessed);
      console.log(`[NutEgg] Merged ${entries} unprocessed entries into ${fileName}`);
      return { egg: fileName, entries };
    } catch (err) {
      console.error(`[NutEgg] Merge failed for ${fileName}:`, err);
      return null;
    }
  }

  /**
   * Threshold-based merge helper (kept for backward compatibility and testing).
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

  /** 5-minute section grid for videos without chapters, or "". */
  private sectionsBlock(sections?: string[]): string {
    if (!sections?.length) return "";
    return `## Video Sections (one chapterMap entry per section, EXACT start time)\n${sections
      .map((s) => `- [${s}]`)
      .join("\n")}`;
  }

  /**
   * Guarantee the chapter map covers the whole video: when a section grid
   * was provided, keep one entry per section (the AI's title/summary for
   * matching times, blank for any section the model skipped).
   */
  private completeChapterMap(
    parsed: ChapterEntry[],
    sections?: string[]
  ): ChapterEntry[] {
    if (!sections?.length) return parsed;
    if (!parsed || parsed.length === 0) return [];
    const byTime = new Map(parsed.map((e) => [toSeconds(e.time), e]));
    return sections.map((s) => {
      const e = byTime.get(toSeconds(s));
      return { time: s, title: e?.title || "", summary: e?.summary || "" };
    });
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
