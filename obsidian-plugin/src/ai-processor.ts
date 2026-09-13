import type NutEggPlugin from "./main";
import { type EggContent, extractEggLanguage, insertEggLanguage } from "./egg-parser";
import { AIError, isAIConfigured } from "./ai-client";
import { PROMPTS, renderPrompt } from "./prompt-templates";
import { sanitizeEggName } from "./index-sync";
import type { WorkflowPromptKey } from "./workflow-manager";

/**
 * Default general chunk window size in characters for AI calls and long-content splitting (~30k chars ≈
 * 35 minutes of speech / ~8k tokens). Configurable in settings.
 */
const DEFAULT_CHUNK_WINDOW_CHARS = 30000;

/** One part of a long content, aligned to chapter starts when possible. */
interface ContentChunk {
  index: number;
  total: number;
  content: string;
  /** Chapters whose start time falls inside this chunk (for the Chapter Map). */
  chapters: Array<{ time: string; title: string }>;
  /** Start timestamp of the chunk ("MM:SS" / "H:MM:SS"), "" for plain text. */
  startTime: string;
  /**
   * Time grid for videos WITHOUT chapter markers — the AI fills one
   * chapterMap entry per section, guaranteeing whole-video coverage.
   */
  sections: string[];
}

/** Default grid step in seconds for section-based chapter maps (videos without chapters). Configurable in settings. */
const DEFAULT_SECTION_SECS = 300;

/**
 * One chapter in the Chapter Map. `time` is the video timestamp ("MM:SS" or
 * "HH:MM:SS") when available — the popup uses it to seek the video.
 */
export interface ChapterEntry {
  time: string;
  title: string;
  summary: string;
}

/** Content-level analysis, independent of any egg. */
export interface ContentAnalysis {
  /** Direct answer to the question posed in the title / intro. */
  titleVerdict: string;
  /** Max 3 plain-language bullets. */
  coreSummary: string[];
  isLongForm: boolean;
  chapterMap: ChapterEntry[];
  /** Answers to the user's custom questions (egg key questions live in EggAnalysis). */
  customQuestionAnswers: KeyAnswer[];
}

export interface KeyAnswer {
  question: string;
  answer: string;
}

/** New knowledge formatted per the egg's Formatting Rules. */
export interface NovelDelta {
  /** Anchor text from the existing knowledge tree to nest under ("" = append at end). */
  parent: string;
  content: string;
}

/** Candidate knowledge entry extracted from content per formatting rules. */
export interface ExtractedKnowledgeEntry {
  kind?: "insight" | "list";
  content: string;
}

/** Entry from content that was already covered in the existing knowledge tree. */
export interface RedundantEntry {
  existingParent?: string;
  content: string;
}

/** Result of analyzing content against one egg. */
export interface EggAnalysis {
  egg: string;
  language?: string;
  keyQuestionAnswers: KeyAnswer[];
  extractedEntries?: ExtractedKnowledgeEntry[];
  novelDelta: NovelDelta[];
  redundantEntries?: RedundantEntry[];
  existingKnowledge?: string;
  rejected: boolean;
  rejectReason: string;
  readVerdict: boolean;
  readVerdictReason: string;
}

/** Flattened delta item — exactly what /confirm accepts. */
export interface NewKnowledgeItem {
  egg: string;
  parent: string;
  content: string;
}

/** Unprocessed entries accumulate per egg; the merge runs at this threshold. */
export const MERGE_THRESHOLD = 20;

/** Result of a successful Unprocessed → Knowledge-tree merge. */
export interface MergeResult {
  egg: string;
  /** How many entries were merged. */
  entries: number;
}

export interface AnalysisResult extends ContentAnalysis {
  shouldRead: boolean;
  shouldReadReason: string;
  matchedEggs: string[];
  eggResults: EggAnalysis[];
  newKnowledge: NewKnowledgeItem[];
}

/**
 * Two-phase AI pipeline driven by the eggs' Action Guides:
 *   Phase 1 — content analysis (title verdict, core summary, chapter map).
 *   Phase 2 — per-egg analysis (key questions, novel delta, reject, verdict).
 * With exactly one matched egg, both phases are merged into a single call.
 *
 * All prompt text lives in src/workflow/*.md (user-editable templates in nutegg/_workflow/).
 */
export class AIProcessor {
  private plugin: NutEggPlugin;

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  get chunkWindowChars(): number {
    const val = this.plugin?.settings?.chunkWindowChars;
    return typeof val === "number" && val > 0 ? val : DEFAULT_CHUNK_WINDOW_CHARS;
  }

  get sectionGridSeconds(): number {
    const val = this.plugin?.settings?.sectionGridSeconds;
    return typeof val === "number" && val > 0 ? val : DEFAULT_SECTION_SECS;
  }

  private getPrompt(key: WorkflowPromptKey): string {
    return this.plugin.workflowManager?.getPrompt(key) || PROMPTS[key as keyof typeof PROMPTS] || "";
  }

  /**
   * Output rules for Stage 1 content analysis (follows settings.contentOutputLanguage).
   */
  private getContentOutputRules(): string {
    const langSetting = this.plugin.settings?.contentOutputLanguage || "same-as-content";
    const isSame = langSetting === "same-as-content";
    const outputLanguage = isSame
      ? "the same language as the captured content"
      : langSetting;

    const tpl = this.getPrompt("sharedOutputRules");
    return renderPrompt(tpl, {output_language: outputLanguage}).trim();
  }

  /**
   * Output rules for Stage 2 egg analysis (follows the egg's language property).
   */
  private getEggOutputRules(
    eggOrLanguage: EggContent | string = "",
    fallbackDescription = ""
  ): string {
    let lang = "";
    let desc = fallbackDescription;

    if (typeof eggOrLanguage === "object" && eggOrLanguage !== null) {
      lang = (eggOrLanguage.language || "").trim();
      desc = desc || (eggOrLanguage.indexDescription || "").trim();
    } else {
      lang = (eggOrLanguage || "").trim();
    }

    const pluginSetting = this.plugin.settings?.contentOutputLanguage;
    const pluginLang =
      pluginSetting && pluginSetting !== "same-as-content" ? pluginSetting.trim() : "";

    const outputLanguage = lang
      ? (lang.includes(" ") && !/^[A-Za-z]+$/.test(lang) ? `the same language as this reference: "${lang}"` : lang)
      : pluginLang
      ? pluginLang
      : "the same language as this egg note's existing knowledge (or the captured content if the egg has no existing knowledge)";

    const tpl = this.getPrompt("sharedOutputRules");
    return renderPrompt(tpl, {
      output_language: outputLanguage,
    }).trim();
  }

  async analyze(
    capture: {
      url: string;
      title: string;
      content: string;
      sourceType: string;
      chapters?: Array<{ time: string; title: string }>;
      questions?: string[];
    },
    eggs: EggContent[]
  ): Promise<AnalysisResult> {
    if (!isAIConfigured(this.plugin.settings)) {
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
    }
  ): Promise<ContentAnalysis> {
    if (!isAIConfigured(this.plugin.settings)) {
      return {
        titleVerdict: capture.title,
        coreSummary: [capture.title],
        isLongForm: false,
        chapterMap: [],
        customQuestionAnswers: (capture.questions || []).map((q) => ({
          question: q,
          answer: "No API key configured — cannot answer.",
        })),
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
            },
            this.partNote(chunk)
          )
        )
      );
      const summary = await this.aggregateContent(
        capture,
        partResults.map((r, i) => ({
          part: i + 1,
          startTime: chunks[i].startTime,
          bullets: r.coreSummary,
        }))
      );
      const chapterMap = partResults.flatMap((r) => r.chapterMap);
      return {
        titleVerdict: summary.titleVerdict,
        coreSummary: summary.coreSummary,
        isLongForm: true,
        chapterMap,
        customQuestionAnswers: summary.customQuestionAnswers,
      };
    }

    const single = chunks[0];
    const effective = {
      ...capture,
      chapters: single?.chapters,
      sections: single?.sections,
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
    if (!isAIConfigured(this.plugin.settings) || eggs.length === 0) {
      return {
        ...contentAnalysis,
        shouldRead: eggs.length === 0 ? false : true,
        shouldReadReason:
          eggs.length === 0
            ? "No matching egg found in vault."
            : this.plugin.settings.aiProvider === "local"
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
              this.partNote(chunk)
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
    },
    partNote = ""
  ): Promise<ContentAnalysis> {
    const prompt = renderPrompt(this.getPrompt("contentAnalysis"), {
      content_task_default: this.getPrompt("contentTaskDefault"),
      title: capture.title,
      url: capture.url,
      source_type: capture.sourceType,
      part_note: partNote,
      chapters: this.chaptersBlock(capture.chapters),
      sections: this.sectionsBlock(capture.sections),
      questions: this.questionsBlock(
        capture.questions,
        "User Questions (answer each directly and concisely)"
      ),
      content: this.truncate(capture.content, this.chunkWindowChars),
      shared_output_rules: this.getContentOutputRules(),
    });

    const configuredMax = this.plugin?.settings?.contentAnalysisMaxTokens || 16384;
    const response = await this.callAI(prompt, configuredMax);
    const parsed = this.parseJson(response, "content-analysis");
    return {
      titleVerdict: String(parsed.titleVerdict || "Could not generate a verdict."),
      coreSummary: Array.isArray(parsed.coreSummary)
        ? parsed.coreSummary.map(String).slice(0, 3)
        : [],
      isLongForm: parsed.isLongForm === true,
      chapterMap: this.completeChapterMap(
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
    partNote = ""
  ): Promise<EggAnalysis | null> {
    // Step 1: Extract knowledge entries using ONLY the instruction part of the egg file
    const prompt = renderPrompt(this.getPrompt("eggAnalysis"), {
      egg_file: egg.fileName,
      egg_instructions: this.plugin.eggParser.formatEggInstructionsForPrompt(egg),
      title: capture.title,
      url: capture.url,
      source_type: capture.sourceType,
      part_note: partNote,
      content: this.truncate(capture.content, this.chunkWindowChars),
      shared_output_rules: this.getEggOutputRules(egg),
    });

    try {
      const tokenBudget = this.plugin?.settings?.contentAnalysisMaxTokens || 16384;
      const response = await this.callAI(prompt, tokenBudget);
      const parsed = this.parseJson(response, "egg-analysis");
      const keyQuestionAnswers = this.parseKeyAnswers(parsed.keyQuestionAnswers);
      const extractedEntries = this.parseExtractedEntries(parsed.extractedEntries);
      const detectedLanguage = typeof parsed.language === "string" ? parsed.language.trim() : "";

      // If the egg had no language property, persist the LLM-detected language
      if (!egg.language && detectedLanguage) {
        egg.language = detectedLanguage;
        try {
          const file = this.plugin.app.vault.getAbstractFileByPath(egg.fileName);
          if (file) {
            const content = await this.plugin.app.vault.read(file as any);
            const updated = insertEggLanguage(content, detectedLanguage);
            if (updated !== content) {
              await this.plugin.app.vault.modify(file as any, updated);
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
      // Typed AI errors (auth, quota, ...) must reach the popup's error hints
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
      rejection_criteria: egg.rejectionCriteria.length > 0
        ? egg.rejectionCriteria.map((c) => `- ${c}`).join("\n")
        : "(none)",
      extracted_entries: extractedEntries
        .map((e, i) => `### Entry ${i + 1} (${e.kind || "insight"})\n${e.content}`)
        .join("\n\n"),
      shared_output_rules: this.getEggOutputRules(egg),
    });

    try {
      const tokenBudget = this.plugin?.settings?.contentAnalysisMaxTokens || 16384;
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
      // Extract the concept name, e.g. from "- **Concept Name**: ..." or "- [tag] **Concept Name**: ..."
      const match = d.content.match(/\*\*([^*]+)\*\*/);
      const conceptKey = match ? match[1].trim().toLowerCase() : "";

      if (!conceptKey) {
        // No distinct concept header — dedup by exact parent + content
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
        // Replace shorter/partial entry with the fuller explanation
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
    capture: { title: string; url: string; questions?: string[] },
    chunkSummaries: Array<{ part: number; startTime: string; bullets: string[] }>
  ): Promise<{
    titleVerdict: string;
    coreSummary: string[];
    customQuestionAnswers: KeyAnswer[];
  }> {
    const prompt = renderPrompt(this.getPrompt("aggregateContent"), {
      title: capture.title,
      url: capture.url,
      chunk_summaries: chunkSummaries
        .map((c) => {
          const at = c.startTime ? ` (${c.startTime})` : "";
          const bullets = c.bullets.map((b) => `- ${b}`).join("\n");
          return `## Part ${c.part} of ${chunkSummaries.length}${at}\n${bullets || "- (no summary)"}`;
        })
        .join("\n\n"),
      questions: this.questionsBlock(
        capture.questions,
        "User Questions (answer each directly and concisely)"
      ),
      content_task_default: this.getPrompt("contentTaskDefault"),
      shared_output_rules: this.getContentOutputRules(),
    });

    const response = await this.callAI(prompt, 800);
    const parsed = this.parseJson(response, "aggregate-content");
    return {
      titleVerdict: String(parsed.titleVerdict || "Could not generate a verdict."),
      coreSummary: Array.isArray(parsed.coreSummary)
        ? parsed.coreSummary.map(String).slice(0, 3)
        : [],
      customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers),
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
    const prompt = renderPrompt(this.getPrompt("aggregateEgg"), {
      egg_file: egg.fileName,
      egg_instructions: this.plugin.eggParser.formatEggForPrompt(egg),
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
    if (!isAIConfigured(this.plugin.settings)) return null;
    try {
      const prompt = renderPrompt(this.getPrompt("localizeEgg"), {
        description: description,
        template: templateContent,
      });
      const maxTokens = Math.max(8192, this.plugin?.settings?.contentAnalysisMaxTokens || 8192);
      const response = await this.callAI(prompt, maxTokens);
      let text = response.trim();
      // Strip markdown code fences if AI wrapped it in ```markdown ... ```
        text = text.replace(/^```[a-z]*\s*\n/i, "").replace(/\n```$/g, "").trim();
      // Verify basic parser markers exist to ensure validity
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

  // --- Chunking ---

  /**
   * Split content into ≤chunkWindowChars parts. Timestamped transcripts
   * (YouTube) are split at caption lines and chapters are attached to the
   * chunk covering their start time; plain text is split at paragraphs.
   */
  private chunkContent(
    content: string,
    chapters: Array<{ time: string; title: string }>
  ): ContentChunk[] {
    const lines = content.split("\n");
    const firstTsIdx = lines.findIndex((l) => this.lineSeconds(l) !== null);
    if (firstTsIdx !== -1) {
      // Timestamped transcript — even a short one gets the section grid
      return this.timestampedChunks(lines, firstTsIdx, chapters);
    }
    const chunkSize = this.chunkWindowChars;
    if (content.length <= chunkSize) {
      return [
        { index: 0, total: 1, content, chapters, startTime: "", sections: [] },
      ];
    }
    return this.paragraphChunks(content, chapters);
  }

  private paragraphChunks(
    content: string,
    chapters: Array<{ time: string; title: string }>
  ): ContentChunk[] {
    const chunkSize = this.chunkWindowChars;
    const paras = content.split(/\n\n+/);
    const chunks: ContentChunk[] = [];
    let buf: string[] = [];
    let bufChars = 0;
    const flush = () => {
      if (!buf.length) return;
      chunks.push({ index: 0, total: 0, content: buf.join("\n\n"), chapters: [], startTime: "", sections: [] });
      buf = [];
      bufChars = 0;
    };
    for (const p of paras) {
      if (p.length > chunkSize) {
        flush();
        // One oversized paragraph — hard-split by chars
        for (let i = 0; i < p.length; i += chunkSize) {
          chunks.push({
            index: 0, total: 0,
            content: p.slice(i, i + chunkSize),
            chapters: [],
            startTime: "",
            sections: [],
          });
        }
        continue;
      }
      if (bufChars + p.length > chunkSize) flush();
      buf.push(p);
      bufChars += p.length + 2;
    }
    flush();
    if (chunks.length === 0) {
      chunks.push({ index: 0, total: 1, content, chapters, startTime: "", sections: [] });
    }
    chunks.forEach((c, i) => {
      c.index = i;
      c.total = chunks.length;
    });
    if (chunks.length === 1) chunks[0].chapters = chapters;
    return chunks;
  }

  private timestampedChunks(
    lines: string[],
    firstTsIdx: number,
    chapters: Array<{ time: string; title: string }>
  ): ContentChunk[] {
    // Title/meta/description lines before the first caption
    const preambleLines = lines.slice(0, firstTsIdx);
    const filteredPreamble: string[] = [];
    let inChaptersSection = false;
    for (const line of preambleLines) {
      if (line.trim().startsWith("## Chapters")) {
        inChaptersSection = true;
        continue;
      }
      if (inChaptersSection && line.trim().startsWith("#")) {
        inChaptersSection = false;
      }
      if (!inChaptersSection) {
        filteredPreamble.push(line);
      }
    }
    const cleanPreamble = filteredPreamble.join("\n").trim();

    const units: Array<{ sec: number; line: string }> = [];
    let lastCaptionSec = 0;
    for (let i = firstTsIdx; i < lines.length; i++) {
      const sec = this.lineSeconds(lines[i]);
      if (sec === null) continue;
      units.push({ sec, line: lines[i] });
      lastCaptionSec = Math.max(lastCaptionSec, sec);
    }

    const chunks: ContentChunk[] = [];
    let buf: string[] = [];
    let bufChars = 0;
    let startSec = 0;
    const flush = () => {
      if (!buf.length) return;
      chunks.push({
        index: 0, total: 0,
        content: buf.join("\n"),
        chapters: [],
        startTime: this.formatSeconds(startSec),
        sections: [],
      });
      buf = [];
      bufChars = 0;
    };
    const chunkSize = this.chunkWindowChars;
    for (const u of units) {
      if (bufChars + u.line.length > chunkSize) flush();
      if (!buf.length) startSec = u.sec;
      buf.push(u.line);
      bufChars += u.line.length + 1;
    }
    flush();

    if (chunks.length === 0) {
      // No caption lines at all — fall back to paragraph chunking
      return this.paragraphChunks(lines.join("\n"), chapters);
    }

    // Attach each chapter to the chunk covering its start time
    const starts = chunks.map((c) => this.toSeconds(c.startTime));
    for (const ch of chapters) {
      const t = this.toSeconds(ch.time);
      let idx = 0;
      for (let i = starts.length - 1; i >= 0; i--) {
        if (t >= starts[i]) {
          idx = i;
          break;
        }
      }
      chunks[idx].chapters.push(ch);
    }

    // Videos WITHOUT chapter markers: build ONE continuous lattice
    // over the whole video and hand each lattice point to the chunk covering
    // it. The AI fills one chapterMap entry per section — whole-video
    // coverage no longer depends on the model inventing section boundaries.
    if (chapters.length === 0) {
      const begins = chunks.map((c) => this.toSeconds(c.startTime));
      for (let t = 0; t < lastCaptionSec + 1; t += this.sectionGridSeconds) {
        let idx = 0;
        for (let i = begins.length - 1; i >= 0; i--) {
          if (t >= begins[i]) {
            idx = i;
            break;
          }
        }
        chunks[idx].sections.push(this.formatSeconds(t));
      }
    }

    chunks.forEach((c, i) => {
      c.index = i;
      c.total = chunks.length;
      if (chunks.length === 1) {
        c.content = `${preambleLines.join("\n")}\n\n${c.content}`;
      } else if (cleanPreamble) {
        c.content = `${cleanPreamble}\n\n${c.content}`;
      }
    });
    return chunks;
  }

  /** `**Part:** i of N (from MM:SS)` label for per-part calls. */
  private partNote(chunk: ContentChunk): string {
    const at = chunk.startTime ? ` (from ${chunk.startTime})` : "";
    return `**Part:** ${chunk.index + 1} of ${chunk.total}${at}`;
  }

  /** Seconds of a `[MM:SS]` / `[H:MM:SS]` caption line, or null. */
  private lineSeconds(line: string): number | null {
    const m = line.trim().match(/^\[(\d{1,2}:)?(\d{1,2}):(\d{2})\]/);
    if (!m) return null;
    const parts = m[0].slice(1, -1).split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return null;
  }

  /** "MM:SS" / "H:MM:SS" → seconds (0 when unparseable). */
  private toSeconds(time: string): number {
    const parts = time.split(":").map(Number);
    if (parts.some((n) => Number.isNaN(n))) return 0;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  }

  /** Seconds → "MM:SS" / "H:MM:SS". */
  private formatSeconds(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
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

    if (!isAIConfigured(this.plugin.settings)) {
      const msg =
        this.plugin.settings.aiProvider === "local"
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
      shared_output_rules: this.getContentOutputRules(),
    });

    try {
      const response = await this.callAI(prompt, 2000);
      const parsed = this.parseJson(response, "follow-up");
      const answers = this.parseKeyAnswers(parsed.answers);
      // Ensure every asked question has an entry (model may have skipped one)
      const byQuestion = new Map(answers.map((a) => [a.question, a]));
      return questions.map((q) => ({
        question: q,
        answer: byQuestion.get(q)?.answer || "No answer returned — please try again.",
      }));
    } catch (err) {
      // Typed AI errors (auth, quota, ...) must reach the popup's error hints
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
    const egg = await this.plugin.eggParser.readEgg(fileName);
    if (!egg) return null;

    const entries = this.plugin.eggParser.countUnprocessed(egg);
    if (entries === 0) {
      console.log(`[NutEgg] ${fileName} has no unprocessed entries to merge`);
      return null;
    }

    if (!isAIConfigured(this.plugin.settings)) {
      console.log(
        `[NutEgg] ${fileName} has ${entries} unprocessed entries — skipped merge (AI not configured)`
      );
      return null;
    }

    // Determine output language from egg's language property (with index description fallback)
    let fallbackDesc = "";
    if (!egg.language) {
      try {
        const indexContent = await this.plugin.indexReader.getIndexContent();
        const indexEntries = this.plugin.indexReader.parseIndexContent(indexContent);
        const indexEntry = indexEntries.find(
          (e) => e.fileName === fileName || e.fileName.endsWith("/" + fileName)
        );
        fallbackDesc = indexEntry?.description || "";
      } catch {
        // Fall back gracefully
      }
    }

    const pluginSetting = this.plugin.settings?.contentOutputLanguage;
    const pluginLang =
      pluginSetting && pluginSetting !== "same-as-content" ? pluginSetting.trim() : "";

    const outputLanguage =
      egg.language ||
      pluginLang ||
      "the same language as this egg's existing knowledge";

    const prompt = renderPrompt(this.getPrompt("mergeUnprocessed"), {
      egg_file: fileName,
      output_language: outputLanguage,
      egg_description: outputLanguage,
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
        typeof parsed.unprocessed === "string"
          ? parsed.unprocessed.trim()
          : "";
      await this.plugin.eggParser.applyMerge(fileName, knowledge, unprocessed);
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
    const egg = await this.plugin.eggParser.readEgg(fileName);
    if (!egg) return null;

    const entries = this.plugin.eggParser.countUnprocessed(egg);
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
    const byTime = new Map(parsed.map((e) => [this.toSeconds(e.time), e]));
    return sections.map((s) => {
      const e = byTime.get(this.toSeconds(s));
      return { time: s, title: e?.title || "", summary: e?.summary || "" };
    });
  }

  /** Numbered questions block with a heading, or "". */
  private questionsBlock(questions: string[] | undefined, heading: string): string {
    if (!questions?.length) return "";
    return `## ${heading}\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
  }

  private async callAI(prompt: string, maxTokens: number): Promise<string> {
    return await this.plugin.aiClient.chat(prompt, maxTokens);
  }

  /** Normalize a `[{question, answer}]` array from the AI response. */
  private parseKeyAnswers(raw: any): KeyAnswer[] {
    return Array.isArray(raw)
      ? raw
          .filter((qa: any) => qa && qa.question && qa.answer)
          .map((qa: any) => ({
            question: String(qa.question),
            answer: String(qa.answer),
          }))
      : [];
  }

  /**
   * Parse an AI response that should be JSON, stripping markdown fences.
   * Sanitizes unescaped control characters (\n, \r, \t) in strings and
   * recovers partial/truncated JSON when responses are cut off mid-stream.
   * `context` names the prompt for diagnostics when parsing fails.
   */
  private parseJson(
    response: string,
    context = "response"
  ): Record<string, any> {
    let jsonStr = (response || "").trim();
    if (!jsonStr) {
      console.warn(`[NutEgg] Empty AI response received for (${context}).`);
      return {};
    }

    // 1. Strip markdown code fences if wrapped
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "");
    }

    // Attempt 1: raw parse
    try {
      return JSON.parse(jsonStr);
    } catch {}

    // Attempt 2: sanitize raw control characters in strings and trailing commas
    const sanitized = sanitizeJsonString(jsonStr);
    try {
      return JSON.parse(sanitized);
    } catch {}

    // Attempt 3: find outermost { ... } block
    const braceMatch = sanitized.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {}
    }

    // Attempt 4: evaluate as JavaScript object expression (handles unquoted keys, single quotes, comments)
    try {
      const target = braceMatch ? braceMatch[0].trim() : sanitized.trim();
      if (target.startsWith("{") && target.endsWith("}")) {
        const obj = Function("return (" + target + ")")();
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
          return obj;
        }
      }
    } catch {}

    // Attempt 5: repair truncated JSON stream
    const repaired = repairTruncatedJson(sanitized);
    if (repaired) {
      try {
        const res = JSON.parse(repaired);
        console.warn(`[NutEgg] Recovered truncated JSON response (${context})`);
        return res;
      } catch {
        try {
          const repTrim = repaired.trim();
          if (repTrim.startsWith("{") && repTrim.endsWith("}")) {
            const obj = Function("return (" + repTrim + ")")();
            if (obj && typeof obj === "object" && !Array.isArray(obj)) {
              console.warn(`[NutEgg] Recovered truncated JSON expression (${context})`);
              return obj;
            }
          }
        } catch {}
      }
    }

    console.warn(
      `[NutEgg] Failed to parse AI JSON response (${context}) [length=${jsonStr.length}]:`,
      jsonStr.slice(0, 500)
    );
    return {};
  }

  private truncate(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars) + "\n\n[...truncated]";
  }
}

/**
 * Repairs a truncated JSON string (e.g. cut off mid-stream by token limit).
 * Recovers valid fields, objects, and array elements generated before the cutoff.
 */
export function repairTruncatedJson(jsonStr: string): string | null {
  const firstBrace = jsonStr.indexOf("{");
  if (firstBrace === -1) return null;

  let text = jsonStr.slice(firstBrace).trim();
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
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
    } else if (c === "{" || c === "[") {
      stack.push(c);
    } else if (c === "}") {
      if (stack[stack.length - 1] === "{") stack.pop();
    } else if (c === "]") {
      if (stack[stack.length - 1] === "[") stack.pop();
    }
  }

  // If already balanced and not in a string, return as is
  if (stack.length === 0 && !inString) {
    return text;
  }

  // If truncated inside a string literal, close the quote
  if (inString) {
    text += '"';
  }

  // If inside an object, check if the last token is an incomplete key-value pair
  if (stack[stack.length - 1] === "{") {
    // Drop dangling key with colon: e.g. `, "key":` or `{"key":`
    text = text.replace(/,?\s*"[^"]*"\s*:\s*$/, "");
    // Drop dangling key without colon after comma or brace: e.g. `, "key"` or `{"key"`
    text = text.replace(/(?:\{|,)\s*"[^"]*"\s*$/, (m) => (m.startsWith("{") ? "{" : ""));
  }

  // Drop any trailing comma or whitespace
  text = text.replace(/,\s*$/, "").trim();

  // Re-scan stack on the cleaned text to get accurate unclosed brackets
  const finalStack: string[] = [];
  let inStr = false;
  let esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") finalStack.push(c);
    else if (c === "}") {
      if (finalStack[finalStack.length - 1] === "{") finalStack.pop();
    } else if (c === "]") {
      if (finalStack[finalStack.length - 1] === "[") finalStack.pop();
    }
  }

  // Close unclosed brackets in reverse order
  while (finalStack.length > 0) {
    const open = finalStack.pop();
    if (open === "{") text += "}";
    else if (open === "[") text += "]";
  }

  return text;
}

/**
 * Sanitizes an AI JSON string response:
 * - Escapes literal control characters (\n, \r, \t) inside string values so JSON.parse won't crash
 * - Removes trailing commas before closing braces/brackets
 */
export function sanitizeJsonString(str: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        result += c;
      } else if (c === "\\") {
        escaped = true;
        result += c;
      } else if (c === '"') {
        inString = false;
        result += c;
      } else if (c === "\n") {
        result += "\\n";
      } else if (c === "\r") {
        result += "\\r";
      } else if (c === "\t") {
        result += "\\t";
      } else if (c.charCodeAt(0) < 32) {
        result += "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0");
      } else {
        result += c;
      }
    } else {
      if (c === '"') inString = true;
      result += c;
    }
  }

  // Remove trailing commas outside of strings
  return result.replace(/,\s*([}\]])/g, "$1");
}
