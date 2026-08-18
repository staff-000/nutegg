import type NutEggPlugin from "./main";
import type { EggContent } from "./egg-parser";
import { AIError } from "./ai-client";
import { PROMPTS, renderPrompt } from "./prompt-templates";
import groundingRuleTpl from "./prompts/grounding-rule.md";

/** Shared grounding rule injected into every prompt. */
const GROUNDING_RULE = groundingRuleTpl.trim();

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

/** Result of analyzing content against one egg. */
export interface EggAnalysis {
  egg: string;
  keyQuestionAnswers: KeyAnswer[];
  novelDelta: NovelDelta[];
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
 * All prompt text lives in src/prompts/*.md (user-editable templates).
 */
export class AIProcessor {
  private plugin: NutEggPlugin;

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
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
    if (!this.plugin.settings.aiApiKey) {
      return this.fallbackAnalysis(capture, eggs);
    }

    let contentAnalysis: ContentAnalysis;
    let eggResults: EggAnalysis[] = [];

    if (eggs.length === 1) {
      // Common case — one combined call using the egg's full instructions
      const combined = await this.analyzeSingleEgg(capture, eggs[0]);
      contentAnalysis = {
        titleVerdict: combined.titleVerdict,
        coreSummary: combined.coreSummary,
        isLongForm: combined.isLongForm,
        chapterMap: combined.chapterMap,
        customQuestionAnswers: combined.customQuestionAnswers,
      };
      eggResults = [combined];
    } else {
      // Phase 1: content analysis (shared guide — eggs carry the same steps).
      // The eggs' key questions are passed along so the AI can skip
      // user questions that are equivalent to them.
      const guide = (eggs[0]?.actionGuide || PROMPTS.actionGuideDefault).trim();
      contentAnalysis = await this.analyzeContent(
        capture,
        guide,
        eggs.flatMap((e) => e.keyQuestions)
      );

      // Phase 2: one parallel call per egg
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
  private async analyzeContent(
    capture: {
      title: string;
      url: string;
      content: string;
      sourceType: string;
      chapters?: Array<{ time: string; title: string }>;
      questions?: string[];
    },
    actionGuide: string,
    eggKeyQuestions: string[]
  ): Promise<ContentAnalysis> {
    const prompt = renderPrompt(PROMPTS.contentAnalysis, {
      action_guide: actionGuide,
      title: capture.title,
      url: capture.url,
      source_type: capture.sourceType,
      chapters: this.chaptersBlock(capture.chapters),
      questions: this.questionsBlock(
        capture.questions,
        "User Questions (answer each directly and concisely)"
      ),
      egg_key_questions: this.questionsBlock(
        eggKeyQuestions,
        "Egg Key Questions (answered separately — skip equivalent user questions)"
      ),
      content: this.truncate(capture.content, 8000),
      grounding_rule: GROUNDING_RULE,
    });

    const response = await this.callAI(prompt, 800);
    const parsed = this.parseJson(response);
    return {
      titleVerdict: String(parsed.titleVerdict || "Could not generate a verdict."),
      coreSummary: Array.isArray(parsed.coreSummary)
        ? parsed.coreSummary.map(String).slice(0, 3)
        : [],
      isLongForm: parsed.isLongForm === true,
      chapterMap: Array.isArray(parsed.chapterMap)
        ? parsed.chapterMap
            .filter((c: any) => c && (c.time || c.title))
            .map((c: any) => ({
              time: String(c.time || ""),
              title: String(c.title || ""),
              summary: String(c.summary || ""),
            }))
        : [],
      customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers),
    };
  }

  /** Phase 2 — content against one egg: key questions, delta, reject, verdict. */
  private async analyzeAgainstEgg(
    capture: { title: string; url: string; content: string; sourceType: string },
    egg: EggContent
  ): Promise<EggAnalysis | null> {
    const prompt = renderPrompt(PROMPTS.eggAnalysis, {
      egg_file: egg.fileName,
      egg_instructions: this.plugin.eggParser.formatEggForPrompt(egg),
      title: capture.title,
      url: capture.url,
      source_type: capture.sourceType,
      content: this.truncate(capture.content, 6000),
      grounding_rule: GROUNDING_RULE,
    });

    try {
      const response = await this.callAI(prompt, 800);
      const parsed = this.parseJson(response);
      return {
        egg: egg.fileName,
        keyQuestionAnswers: this.parseKeyAnswers(parsed.keyQuestionAnswers),
        novelDelta: Array.isArray(parsed.novelDelta)
          ? parsed.novelDelta
              .filter((d: any) => d && d.content)
              .map((d: any) => ({
                parent: String(d.parent || ""),
                content: String(d.content),
              }))
          : [],
        rejected: parsed.rejected === true,
        rejectReason: String(parsed.rejectReason || ""),
        readVerdict: parsed.readVerdict !== false,
        readVerdictReason: String(parsed.readVerdictReason || ""),
      };
    } catch (err) {
      // Typed AI errors (auth, quota, ...) must reach the popup's error hints
      if (err instanceof AIError) throw err;
      console.error(`[NutEgg] Egg analysis failed for ${egg.fileName}:`, err);
      return null;
    }
  }

  /** Single combined call — used when exactly one egg matches. */
  private async analyzeSingleEgg(
    capture: {
      title: string;
      url: string;
      content: string;
      sourceType: string;
      chapters?: Array<{ time: string; title: string }>;
      questions?: string[];
    },
    egg: EggContent
  ): Promise<EggAnalysis & ContentAnalysis> {
    const prompt = renderPrompt(PROMPTS.eggCombined, {
      egg_file: egg.fileName,
      egg_instructions: this.plugin.eggParser.formatEggForPrompt(egg),
      title: capture.title,
      url: capture.url,
      source_type: capture.sourceType,
      chapters: this.chaptersBlock(capture.chapters),
      questions: this.questionsBlock(
        capture.questions,
        "User Questions (answer each directly and concisely)"
      ),
      content: this.truncate(capture.content, 8000),
      grounding_rule: GROUNDING_RULE,
    });

    const response = await this.callAI(prompt, 1000);
    const parsed = this.parseJson(response);
    return {
      titleVerdict: String(parsed.titleVerdict || "Could not generate a verdict."),
      coreSummary: Array.isArray(parsed.coreSummary)
        ? parsed.coreSummary.map(String).slice(0, 3)
        : [],
      isLongForm: parsed.isLongForm === true,
      chapterMap: Array.isArray(parsed.chapterMap)
        ? parsed.chapterMap
            .filter((c: any) => c && (c.time || c.title))
            .map((c: any) => ({
              time: String(c.time || ""),
              title: String(c.title || ""),
              summary: String(c.summary || ""),
            }))
        : [],
      customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers),
      egg: egg.fileName,
      keyQuestionAnswers: this.parseKeyAnswers(parsed.keyQuestionAnswers),
      novelDelta: Array.isArray(parsed.novelDelta)
        ? parsed.novelDelta
            .filter((d: any) => d && d.content)
            .map((d: any) => ({
              parent: String(d.parent || ""),
              content: String(d.content),
            }))
        : [],
      rejected: parsed.rejected === true,
      rejectReason: String(parsed.rejectReason || ""),
      readVerdict: parsed.readVerdict !== false,
      readVerdictReason: String(parsed.readVerdictReason || ""),
    };
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
    priorQa: KeyAnswer[]
  ): Promise<KeyAnswer[]> {
    if (questions.length === 0) return [];

    if (!this.plugin.settings.aiApiKey) {
      return questions.map((q) => ({
        question: q,
        answer: "No API key configured — cannot answer.",
      }));
    }

    const priorBlock =
      priorQa.length > 0
        ? `## Previous Questions & Answers (context — refer back instead of repeating)\n${priorQa
            .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
            .join("\n")}`
        : "";

    const prompt = renderPrompt(PROMPTS.followUp, {
      title: capture.title,
      url: capture.url,
      source_type: capture.sourceType,
      prior_qa: priorBlock,
      content: this.truncate(capture.content, 8000),
      questions: questions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      grounding_rule: GROUNDING_RULE,
    });

    try {
      const response = await this.callAI(prompt, 500);
      const parsed = this.parseJson(response);
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

  /** Parse an AI response that should be JSON, stripping markdown fences. */
  private parseJson(response: string): Record<string, any> {
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "");
    }

    try {
      return JSON.parse(jsonStr);
    } catch {
      // Last resort: find the outermost { ... } block
      const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        try {
          return JSON.parse(braceMatch[0]);
        } catch {
          // fall through
        }
      }
      console.warn("[NutEgg] Failed to parse AI JSON response");
      return {};
    }
  }

  private truncate(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars) + "\n\n[...truncated]";
  }
}
