import type NutEggPlugin from "./main";
import type { EggContent } from "./egg-parser";
import { AIError } from "./ai-client";

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
 */
export class AIProcessor {
  private plugin: NutEggPlugin;

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  /** Default content-level guide when no egg provides an Action Guide. */
  private static readonly DEFAULT_ACTION_GUIDE = [
    "1. Title Verdict: Provide a single, direct sentence that resolves the core question posed in the title or introduction.",
    "2. Core Summary: Summarize the main concepts in plain language using a maximum of 3 bullet points.",
    "3. Chapter Map (Long-form only): If the content is a long article or lengthy video, provide a brief 1-sentence summary for each major section or topic shift. If it is short, omit this step entirely.",
  ].join("\n");

  async analyze(
    capture: {
      url: string;
      title: string;
      content: string;
      sourceType: string;
      chapters?: Array<{ time: string; title: string }>;
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
      };
      eggResults = [combined];
    } else {
      // Phase 1: content analysis (shared guide — eggs carry the same steps)
      const guide = (eggs[0]?.actionGuide || AIProcessor.DEFAULT_ACTION_GUIDE).trim();
      contentAnalysis = await this.analyzeContent(capture, guide);

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

  /** Phase 1 — content-level summary + chapter map. */
  private async analyzeContent(
    capture: {
      title: string;
      url: string;
      content: string;
      sourceType: string;
      chapters?: Array<{ time: string; title: string }>;
    },
    actionGuide: string
  ): Promise<ContentAnalysis> {
    const chaptersHint = capture.chapters?.length
      ? `\n## Video Chapters (use these EXACT timestamps)\n${capture.chapters
          .map((c) => `- ${c.time} — ${c.title}`)
          .join("\n")}`
      : "";

    const prompt = `You are a knowledge curator. Analyze the content below following this Action Guide.

## Action Guide
${actionGuide}

## Content to Analyze
**Title:** ${capture.title}
**Source:** ${capture.url}
**Type:** ${capture.sourceType}
${chaptersHint}

${this.truncate(capture.content, 8000)}

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2", "bullet 3"],
  "isLongForm": true,
  "chapterMap": [
    {"time": "00:12:34", "title": "chapter title", "summary": "one sentence"}
  ]
}

IMPORTANT:
- titleVerdict must be a single sentence.
- coreSummary: at most 3 bullets, plain language.
- isLongForm: true only for long articles/videos that meaningfully benefit from a chapter map.
- chapterMap: empty array when isLongForm is false. When video chapters are provided, keep their exact timestamps and titles, and only add your 1-sentence summary.`;

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
    };
  }

  /** Phase 2 — content against one egg: key questions, delta, reject, verdict. */
  private async analyzeAgainstEgg(
    capture: { title: string; url: string; content: string; sourceType: string },
    egg: EggContent
  ): Promise<EggAnalysis | null> {
    const prompt = `You are a knowledge curator for the egg file "${egg.fileName}". Analyze the content below against this egg's instructions.

## Egg Instructions
${this.plugin.eggParser.formatEggForPrompt(egg)}

## Content to Analyze
**Title:** ${capture.title}
**Source:** ${capture.url}
**Type:** ${capture.sourceType}

${this.truncate(capture.content, 6000)}

## Task
1. Answer each Key Question (if any) directly and concisely.
2. Novel Delta: identify genuinely NEW insights vs the Current Knowledge. If the content is entirely redundant, return an empty array.
3. Apply the Rejection Criteria — if the content should be rejected, set rejected to true and give a one-line reason.
4. Decide: should the user spend time reading/watching this fully? Consider the reject criteria and whether it adds new insight.

For each Novel Delta entry:
- "parent": copy the EXACT text of the existing bullet or heading in the Current Knowledge tree that the new information nests under. Use "" if no suitable parent exists.
- "content": the new information as markdown nested bullets, written relative to that parent (top-level lines are children of the parent). Follow the Formatting Rules.

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "keyQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ],
  "novelDelta": [
    {"parent": "exact anchor text from the knowledge tree", "content": "- nested bullet\\n  - sub bullet"}
  ],
  "rejected": false,
  "rejectReason": "",
  "readVerdict": true,
  "readVerdictReason": "one-line reason"
}`;

    try {
      const response = await this.callAI(prompt, 800);
      const parsed = this.parseJson(response);
      return {
        egg: egg.fileName,
        keyQuestionAnswers: Array.isArray(parsed.keyQuestionAnswers)
          ? parsed.keyQuestionAnswers
              .filter((qa: any) => qa && qa.question && qa.answer)
              .map((qa: any) => ({ question: String(qa.question), answer: String(qa.answer) }))
          : [],
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
    },
    egg: EggContent
  ): Promise<EggAnalysis & ContentAnalysis> {
    const chaptersHint = capture.chapters?.length
      ? `\n## Video Chapters (use these EXACT timestamps)\n${capture.chapters
          .map((c) => `- ${c.time} — ${c.title}`)
          .join("\n")}`
      : "";

    const prompt = `You are a knowledge curator for the egg file "${egg.fileName}". Analyze the content below against this egg's instructions.

## Egg Instructions
${this.plugin.eggParser.formatEggForPrompt(egg)}

## Content to Analyze
**Title:** ${capture.title}
**Source:** ${capture.url}
**Type:** ${capture.sourceType}
${chaptersHint}

${this.truncate(capture.content, 8000)}

## Task
Follow the Action Guide steps, then answer the Key Questions and extract the Novel Delta against the Current Knowledge.

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2", "bullet 3"],
  "isLongForm": true,
  "chapterMap": [
    {"time": "00:12:34", "title": "chapter title", "summary": "one sentence"}
  ],
  "keyQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ],
  "novelDelta": [
    {"parent": "exact anchor text from the knowledge tree", "content": "- nested bullet\\n  - sub bullet"}
  ],
  "rejected": false,
  "rejectReason": "",
  "readVerdict": true,
  "readVerdictReason": "one-line reason"
}

IMPORTANT:
- coreSummary: at most 3 bullets. chapterMap: empty array when isLongForm is false; keep exact timestamps from the video chapters when provided.
- For each Novel Delta entry: "parent" is the EXACT text of the existing bullet or heading it nests under ("" if none), "content" follows the Formatting Rules.
- Apply the Rejection Criteria strictly — set rejected to true when the content is noise for this egg.`;

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
      egg: egg.fileName,
      keyQuestionAnswers: Array.isArray(parsed.keyQuestionAnswers)
        ? parsed.keyQuestionAnswers
            .filter((qa: any) => qa && qa.question && qa.answer)
            .map((qa: any) => ({ question: String(qa.question), answer: String(qa.answer) }))
        : [],
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
    capture: { title: string; content: string },
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
      shouldRead: true,
      shouldReadReason: "No API key configured — cannot analyze.",
      matchedEggs: eggs.map((e) => e.fileName),
      eggResults: [],
      newKnowledge: [],
    };
  }

  private async callAI(prompt: string, maxTokens: number): Promise<string> {
    return await this.plugin.aiClient.chat(prompt, maxTokens);
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
