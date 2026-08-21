import type NutEggPlugin from "./main";
import type { EggContent } from "./egg-parser";
import { AIError } from "./ai-client";
import { PROMPTS, renderPrompt } from "./prompt-templates";
import groundingRuleTpl from "./prompts/grounding-rule.md";

/** Shared grounding rule injected into every prompt. */
const GROUNDING_RULE = groundingRuleTpl.trim();

/**
 * Max characters of the nut's content sent in each AI call. ~30k chars ≈
 * 35 minutes of speech (~8k tokens) — long videos get real coverage instead
 * of a 7-minute slice. Tune here to trade cost against coverage.
 */
const CONTENT_WINDOW_CHARS = 30000;

/**
 * Content longer than this is split into parts and analyzed part by part
 * (one AI call per part + aggregate calls — see analyzeChunked).
 */
const CHUNK_CHARS = CONTENT_WINDOW_CHARS;

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
   * 5-minute time grid for videos WITHOUT chapter markers — the AI fills one
   * chapterMap entry per section, guaranteeing whole-video coverage.
   */
  sections: string[];
}

/** Grid step for section-based chapter maps (videos without chapters). */
const SECTION_SECS = 300;

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

    // Long content (long videos, books, ...) — process part by part
    const chunks = this.chunkContent(capture.content, capture.chapters || []);
    if (chunks.length > 1) {
      return this.analyzeChunked(capture, eggs, chunks);
    }

    // Single chunk may still carry a section grid (short video without
    // chapters) — use it for the chapter map
    const single = chunks[0];
    const effective = {
      ...capture,
      chapters: single.chapters,
      sections: single.sections,
    };

    let contentAnalysis: ContentAnalysis;
    let eggResults: EggAnalysis[] = [];

    if (eggs.length === 1) {
      // Common case — one combined call using the egg's full instructions
      const combined = await this.analyzeSingleEgg(effective, eggs[0]);
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
      sections?: string[];
      questions?: string[];
    },
    actionGuide: string,
    eggKeyQuestions: string[],
    partNote = ""
  ): Promise<ContentAnalysis> {
    const prompt = renderPrompt(PROMPTS.contentAnalysis, {
      action_guide: actionGuide,
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
      egg_key_questions: this.questionsBlock(
        eggKeyQuestions,
        "Egg Key Questions (answered separately — skip equivalent user questions)"
      ),
      content: this.truncate(capture.content, CONTENT_WINDOW_CHARS),
      grounding_rule: GROUNDING_RULE,
    });

    // Room for a full chapter map (one summary per chapter) + questions
    const response = await this.callAI(prompt, 1200);
    const parsed = this.parseJson(response);
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

  /** Phase 2 — content against one egg: key questions, delta, reject, verdict. */
  private async analyzeAgainstEgg(
    capture: { title: string; url: string; content: string; sourceType: string },
    egg: EggContent,
    partNote = ""
  ): Promise<EggAnalysis | null> {
    const prompt = renderPrompt(PROMPTS.eggAnalysis, {
      egg_file: egg.fileName,
      egg_instructions: this.plugin.eggParser.formatEggForPrompt(egg),
      title: capture.title,
      url: capture.url,
      source_type: capture.sourceType,
      part_note: partNote,
      content: this.truncate(capture.content, CONTENT_WINDOW_CHARS),
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
      sections?: string[];
      questions?: string[];
    },
    egg: EggContent,
    partNote = ""
  ): Promise<EggAnalysis & ContentAnalysis> {
    const prompt = renderPrompt(PROMPTS.eggCombined, {
      egg_file: egg.fileName,
      egg_instructions: this.plugin.eggParser.formatEggForPrompt(egg),
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
      content: this.truncate(capture.content, CONTENT_WINDOW_CHARS),
      grounding_rule: GROUNDING_RULE,
    });

    // Room for a full chapter map (one summary per chapter) + questions
    const response = await this.callAI(prompt, 1500);
    const parsed = this.parseJson(response);
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

  /**
   * Long content: one analysis call per part, then aggregate calls that
   * combine the parts into a single result.
   *   Phase 1 — per-part content analysis → aggregate (verdict, 3-bullet
   *   summary, custom questions). Chapter maps are unioned directly.
   *   Phase 2 — per egg: per-part delta calls → aggregate (key questions,
   *   reject, read verdict). Novel deltas are the union of the parts.
   */
  private async analyzeChunked(
    capture: {
      url: string;
      title: string;
      content: string;
      sourceType: string;
      chapters?: Array<{ time: string; title: string }>;
      questions?: string[];
    },
    eggs: EggContent[],
    chunks: ContentChunk[]
  ): Promise<AnalysisResult> {
    const guide = (eggs[0]?.actionGuide || PROMPTS.actionGuideDefault).trim();

    // Phase 1 — per-part content analysis (custom questions are answered
    // once, in the aggregate call, so parts run without them)
    const partResults = await Promise.all(
      chunks.map((chunk) =>
        this.analyzeContent(
          {
            ...capture,
            content: chunk.content,
            chapters: chunk.chapters,
            sections: chunk.sections,
            questions: [],
          },
          guide,
          eggs.flatMap((e) => e.keyQuestions),
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

    // Phase 2 — per egg: per-part delta calls, then one aggregate call
    const eggResults: EggAnalysis[] = [];
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
      // Union of per-part deltas (deduped — parts may re-find the same thing)
      const seen = new Set<string>();
      const novelDelta = partEggs
        .flatMap((r) => r?.novelDelta || [])
        .filter((d) => {
          const key = `${d.parent}\n${d.content}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      eggResults.push({
        egg: egg.fileName,
        keyQuestionAnswers: aggregate.keyQuestionAnswers,
        novelDelta,
        rejected: aggregate.rejected,
        rejectReason: aggregate.rejectReason,
        readVerdict: aggregate.readVerdict,
        readVerdictReason: aggregate.readVerdictReason,
      });
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
      titleVerdict: summary.titleVerdict,
      coreSummary: summary.coreSummary,
      isLongForm: true,
      chapterMap,
      customQuestionAnswers: summary.customQuestionAnswers,
      ...verdict,
      matchedEggs: eggs.map((e) => e.fileName),
      eggResults,
      newKnowledge,
    };
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
    const prompt = renderPrompt(PROMPTS.aggregateContent, {
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
      grounding_rule: GROUNDING_RULE,
    });

    const response = await this.callAI(prompt, 500);
    const parsed = this.parseJson(response);
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
    keyQuestionAnswers: KeyAnswer[];
    rejected: boolean;
    rejectReason: string;
    readVerdict: boolean;
    readVerdictReason: string;
  }> {
    const prompt = renderPrompt(PROMPTS.aggregateEgg, {
      egg_file: egg.fileName,
      egg_instructions: this.plugin.eggParser.formatEggForPrompt(egg),
      chunk_findings: chunkFindings
        .map((f) => {
          const at = f.startTime ? ` (${f.startTime})` : "";
          const delta = f.delta.map((d) => d.content).join("\n");
          return `## Part ${f.part} of ${chunkFindings.length}${at}\n${delta || "- (no novel delta)"}`;
        })
        .join("\n\n"),
      grounding_rule: GROUNDING_RULE,
    });

    const response = await this.callAI(prompt, 500);
    const parsed = this.parseJson(response);
    return {
      keyQuestionAnswers: this.parseKeyAnswers(parsed.keyQuestionAnswers),
      rejected: parsed.rejected === true,
      rejectReason: String(parsed.rejectReason || ""),
      readVerdict: parsed.readVerdict !== false,
      readVerdictReason: String(parsed.readVerdictReason || ""),
    };
  }

  // --- Chunking ---

  /**
   * Split content into ≤CHUNK_CHARS parts. Timestamped transcripts
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
    if (content.length <= CHUNK_CHARS) {
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
      if (p.length > CHUNK_CHARS) {
        flush();
        // One oversized paragraph — hard-split by chars
        for (let i = 0; i < p.length; i += CHUNK_CHARS) {
          chunks.push({
            index: 0, total: 0,
            content: p.slice(i, i + CHUNK_CHARS),
            chapters: [],
            startTime: "",
            sections: [],
          });
        }
        continue;
      }
      if (bufChars + p.length > CHUNK_CHARS) flush();
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
    // Title/meta/description lines before the first caption — kept as the
    // first chunk's preamble so the AI still gets the context.
    const preamble = lines.slice(0, firstTsIdx).join("\n");
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
    for (const u of units) {
      if (bufChars + u.line.length > CHUNK_CHARS) flush();
      if (!buf.length) startSec = u.sec;
      buf.push(u.line);
      bufChars += u.line.length + 1;
    }
    flush();

    if (chunks.length === 0) {
      // No caption lines at all — fall back to paragraph chunking
      return this.paragraphChunks(lines.join("\n"), chapters);
    }

    chunks[0].content = `${preamble}\n\n${chunks[0].content}`;

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

    // Videos WITHOUT chapter markers: build ONE continuous 5-minute lattice
    // over the whole video and hand each lattice point to the chunk covering
    // it. The AI fills one chapterMap entry per section — whole-video
    // coverage no longer depends on the model inventing section boundaries.
    if (chapters.length === 0) {
      const begins = chunks.map((c) => this.toSeconds(c.startTime));
      for (let t = 0; t < lastCaptionSec + 1; t += SECTION_SECS) {
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
      content: this.truncate(capture.content, CONTENT_WINDOW_CHARS),
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

  /**
   * Merge an egg's Unprocessed entries into its Knowledge tree once
   * MERGE_THRESHOLD is reached. Best-effort: on any failure the egg is left
   * untouched and the entries stay in Unprocessed for the next attempt.
   */
  async maybeMergeEgg(fileName: string): Promise<MergeResult | null> {
    const egg = await this.plugin.eggParser.readEgg(fileName);
    if (!egg) return null;

    const entries = this.plugin.eggParser.countUnprocessed(egg);
    if (entries < MERGE_THRESHOLD) return null;

    if (!this.plugin.settings.aiApiKey) {
      console.log(
        `[NutEgg] ${fileName} has ${entries} unprocessed entries — skipped merge (no API key)`
      );
      return null;
    }

    const prompt = renderPrompt(PROMPTS.mergeUnprocessed, {
      egg_file: fileName,
      formatting_rules: egg.formattingRules || "(none)",
      knowledge_tree: egg.knowledge || "(empty)",
      unprocessed: egg.unprocessed,
      unprocessed_count: entries,
    });

    try {
      const response = await this.callAI(prompt, 2000);
      const parsed = this.parseJson(response);
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
      // Best-effort — the save already succeeded; leave entries for the next run
      console.error(`[NutEgg] Merge failed for ${fileName}:`, err);
      return null;
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
