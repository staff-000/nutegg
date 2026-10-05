// ============================================================
// NutEgg Unified AI Engine — Type Definitions
// ============================================================

export type AIProviderId =
  | "local"
  | "openrouter"
  | "anthropic"
  | "deepseek"
  | "gemini"
  | "openai"
  | "kimi"
  | "zhipu"
  | "qwen";

export type AISource = "official" | "openrouter";

export interface ModelFamily {
  id: string;
  label: string;
  defaultModel: string;
  models: string[];
}

export interface ProviderInfo {
  id: AIProviderId;
  label: string;
  officialEndpoint: string;
  apiFormat: "anthropic" | "openai-compatible";
  defaultModel?: string;
  models?: string[];
  families?: ModelFamily[];
  keyPlaceholder: string;
  openrouterPrefix: string;
}

export interface ResolvedConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  apiFormat: "anthropic" | "openai-compatible" | "ollama";
  provider: AIProviderId;
  isLocal?: boolean;
}

export interface NutEggAISettings {
  aiProvider?: AIProviderId;
  aiSource?: AISource;
  aiEndpoint?: string;
  aiApiKey?: string;
  aiModel?: string;
  aiModelFamily?: string;
  openrouterApiKey?: string;
  openrouterModel?: string;
  contentAnalysisMaxTokens?: number;
  outputLanguage?: string;
  chunkWindowChars?: number;
  // Chrome settings keys compatibility
  chromeAiProvider?: AIProviderId;
  chromeAiSource?: AISource;
  chromeAiApiKey?: string;
  chromeAiModel?: string;
  chromeAiEndpoint?: string;
  promptOverrides?: Partial<Record<string, string>>;
  chromeAiPromptOverrides?: Partial<Record<string, string>>;
  [key: string]: any;
}

/** One part of a long content, aligned to chapter starts when possible. */
export interface ContentChunk {
  index: number;
  total: number;
  content: string;
  /** Chapters whose start time falls inside this chunk for timestamp grounding. */
  chapters: Array<{ time: string; title: string }>;
  /** Start timestamp of the chunk ("MM:SS" / "H:MM:SS"), "" for plain text. */
  startTime: string;
}

/** Positional reference and supporting quote for an answer. */
export interface SourceRef {
  /** Exact captured discussion item ID; never a CSS selector. */
  sourceId?: string;
  /** Timestamp string (e.g. "12:34") for video or section heading for articles. */
  ref: string;
  /** Brief verbatim quote from the content. */
  quote?: string;
}

export type QuestionScope = "within" | "beyond";

export interface KeyAnswer {
  /** False when the source does not address this question (Stage 2). */
  answered?: boolean;
  question: string;
  answer: string;
  /** Citations pointing to where in the content this answer comes from. */
  sources?: SourceRef[];
  /** Scope of the question: strictly within content vs unconstrained beyond content. */
  scope?: QuestionScope;
}

/** A node in the concept mind map / outline tree. */
export interface MindMapNode {
  /** References for scrolling to supporting text or comments. */
  sources?: SourceRef[];
  name: string;
  detail?: string;
  /** Exact timestamp from the source transcript, when available. */
  time?: string;
  children?: MindMapNode[];
}

/** Configuration for which Content Analysis sections should be generated. */
export interface AnalysisSectionsConfig {
  titleVerdict: boolean;
  coreSummary: boolean;
  mindMap: boolean;
  discussion?: boolean;
}

export const DEFAULT_ANALYSIS_SECTIONS: AnalysisSectionsConfig = {
  titleVerdict: true,
  coreSummary: true,
  mindMap: true,
  discussion: false,
};

export type DiscussionStance = "agree" | "disagree" | "mixed" | "neutral" | "unclear";
export interface DiscussionItem {
  id: string;
  parentId?: string;
  author?: string;
  authorId?: string;
  text: string;
  url?: string;
  reaction?: { kind: "likes" | "score"; count: number | null; approximate?: boolean };
}
export interface DiscussionCapture {
  kind: "forum" | "comments";
  status: "not_loaded" | "loading" | "partial" | "complete" | "empty" | "unavailable";
  reason?: "login" | "disabled" | "unsupported" | "error";
  items: DiscussionItem[];
  totalCount?: number | null;
  truncated?: boolean;
  capturedAt?: string;
  bodyLength?: number;
  autoEnable?: boolean;
}
export interface DiscussionMetric {
  comments: number;
  /** Null when any author identity is unavailable. Author buckets are exclusive per topic. */
  commenters: number | null;
  likes: number;
  score: number;
  reactionsKnown: number;
  likesKnown: number;
  scoresKnown: number;
  reactionsMissing: number;
  approximate: boolean;
}
export interface DiscussionTopic {
  id: string;
  title: string;
  claim: string;
  summary: string;
  agreeArguments: string[];
  disagreeArguments: string[];
  highlights: Array<{ commentId: string; summary: string; supplement?: boolean; source: DiscussionItem }>;
  metrics: Record<DiscussionStance, DiscussionMetric>;
}
export interface DiscussionAnalysis {
  status: "ready" | "no_meaningful" | "not_loaded" | "unavailable";
  kind: "forum" | "comments";
  coverage: DiscussionCapture["status"];
  capturedCount: number;
  analyzedCount: number;
  totalCount: number | null;
  truncated: boolean;
  topics: DiscussionTopic[];
}

/** Content-level analysis, independent of any egg. */
export interface ContentAnalysis {
  discussion?: DiscussionAnalysis;
  /** Direct answer to the question posed in the title / intro. */
  titleVerdict: string;
  /** Max 3 plain-language bullets. */
  coreSummary: string[];
  /** Answers to custom user questions (egg key questions live in EggAnalysis). */
  customQuestionAnswers: KeyAnswer[];
  /** Hierarchical concept mind-map / outline tree. */
  mindMap?: MindMapNode[];
}

export interface CapturePayload {
  /** Opaque tab/page diagnostics ID; never included in prompts or archived content. */
  debugScope?: string;
  discussion?: DiscussionCapture;
  transcriptAvailable?: boolean;
  mediaType?: string;
  generateKnowledgeEntries?: boolean;
  url: string;
  title: string;
  content: string;
  sourceType: string;
  chapters?: Array<{ time: string; title: string }>;
  questions?: string[];
  /** Scope for custom questions: strictly within content vs unconstrained beyond content. */
  questionsScope?: QuestionScope;
  enabledSections?: Partial<AnalysisSectionsConfig>;
  outputLanguage?: string;
}

export interface AskRequest {
  discussion?: DiscussionCapture;
  enabledSections?: Partial<AnalysisSectionsConfig>;
  url: string;
  title: string;
  content: string;
  sourceType: string;
  /** New follow-up questions to answer. */
  questions: string[];
  /** Previously answered Q&A (egg key questions + custom + earlier follow-ups). */
  priorQa?: Array<{ question: string; answer: string; scope?: QuestionScope }> | string;
  /** Output language for follow-up answers (sent from Chrome). */
  outputLanguage?: string;
  /** Scope of the question: strictly within content vs unconstrained beyond content. */
  scope?: QuestionScope;
}

/** In-memory representation of a parsed Egg note file. */
export interface EggContent {
  /** False disables extraction and Hatch entries; answers and recommendations remain available. */
  generateKnowledgeEntries?: boolean;
  fileName: string;
  topic: string;
  scope: string;
  actionGuide: string;
  keyQuestions: string[];
  worthReadingIf: string[];
  skipIf: string[];
  sourceText?: string;
  formattingRules: string;
  knowledge: string;
  unprocessed: string;
  language?: string;
  indexDescription?: string;
}

export type ReadAction = "full" | "highlights" | "summary" | "skip" | "uncertain";

/** Instruction-formatted result, not a claim of novelty. */
export interface ExtractedKnowledgeEntry {
  kind?: "insight" | "list" | "answer";
  content: string;
  sources?: SourceRef[];
}

export interface EggAnalysis {
  generateKnowledgeEntries?: boolean;
  entryGenerationDisabledByEgg?: boolean;
  egg: string;
  language?: string;
  keyQuestionAnswers: KeyAnswer[];
  extractedEntries: ExtractedKnowledgeEntry[];
  readAction: ReadAction;
  readVerdict: boolean | null;
  readVerdictReason: string;
  readingSources: SourceRef[];
}

/** Pending saveable item accepted by /confirm. */
export interface EggSaveEntry {
  egg: string;
  content: string;
}

/** Result of a successful Unprocessed -> Knowledge-tree merge. */
export interface MergeResult {
  egg: string;
  entries: number;
}

export interface AnalysisResult extends ContentAnalysis {
  generateKnowledgeEntries?: boolean;
  shouldRead: boolean | null;
  readAction?: ReadAction;
  readingSources?: SourceRef[];
  schemaVersion?: number;
  shouldReadReason: string;
  matchedEggs: string[];
  eggResults: EggAnalysis[];
  /** Results retained for this capture, including eggs currently deselected. */
  eggAnalysisCache?: EggAnalysis[];
  newKnowledge: EggSaveEntry[];
}

export type WorkflowPromptKey =
  | "discussionAnalysis"
  | "aggregateDiscussion"
  | "contentAnalysis"
  | "eggAnalysis"
  | "followUp"
  | "eggRouting"
  | "contentTaskDefault"
  | "mergeUnprocessed"
  | "aggregateContent"
  | "aggregateEgg"
  | "localizeEgg"
  | "sharedOutputRules";

/**
 * Host interface providing environment-specific services (Obsidian vault, custom prompt overrides, etc.)
 * to the AIProcessor. When not running in Obsidian, a minimal host with settings and aiClient suffices.
 */
export interface AIProcessorHost {
  settings?: NutEggAISettings;
  workflowManager?: {
    getPrompt(key: WorkflowPromptKey | string): string;
  };
  aiClient?: {
    chat(prompt: string, maxTokens?: number, debugScope?: string): Promise<string>;
  };
  eggParser?: {
    readEgg?(fileName: string): Promise<EggContent | null>;
    applyMerge?(fileName: string, knowledge: string, unprocessed: string, expected?: EggContent): Promise<void | boolean>;
    countUnprocessed?(egg: EggContent): number;
    formatEggInstructionsForPrompt?(egg: EggContent): string;
    formatEggForPrompt?(egg: EggContent): string;
    formatEggKnowledgeForPrompt?(egg: EggContent): string;
  };
  indexReader?: {
    getIndexContent?(): Promise<string>;
    parseIndexContent?(content: string): Array<{ fileName: string; description: string }>;
  };
  app?: {
    vault?: {
      getAbstractFileByPath?(path: string): any;
      read?(file: any): Promise<string>;
      modify?(file: any, data: string): Promise<void>;
    };
  };
}
