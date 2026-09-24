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
  sectionGridSeconds?: number;
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

/** One chapter in the Chapter Map. `time` is video timestamp ("MM:SS" or "HH:MM:SS") when available. */
export interface ChapterEntry {
  time: string;
  title: string;
  summary: string;
}

/** Positional reference and supporting quote for an answer. */
export interface SourceRef {
  /** Timestamp string (e.g. "12:34") for video or section heading for articles. */
  ref: string;
  /** Brief verbatim quote from the content. */
  quote?: string;
}

export interface KeyAnswer {
  question: string;
  answer: string;
  /** Citations pointing to where in the content this answer comes from. */
  sources?: SourceRef[];
}

/** A node in the concept mind map / outline tree. */
export interface MindMapNode {
  name: string;
  detail?: string;
  children?: MindMapNode[];
}

/** Configuration for which Content Analysis sections should be generated. */
export interface AnalysisSectionsConfig {
  titleVerdict: boolean;
  coreSummary: boolean;
  mindMap: boolean;
  chapterMap: boolean;
}

export const DEFAULT_ANALYSIS_SECTIONS: AnalysisSectionsConfig = {
  titleVerdict: true,
  coreSummary: true,
  mindMap: true,
  chapterMap: true,
};

/** Content-level analysis, independent of any egg. */
export interface ContentAnalysis {
  /** Direct answer to the question posed in the title / intro. */
  titleVerdict: string;
  /** Max 3 plain-language bullets. */
  coreSummary: string[];
  isLongForm: boolean;
  chapterMap: ChapterEntry[];
  /** Answers to custom user questions (egg key questions live in EggAnalysis). */
  customQuestionAnswers: KeyAnswer[];
  /** Hierarchical concept mind-map / outline tree. */
  mindMap?: MindMapNode[];
}

export interface CapturePayload {
  url: string;
  title: string;
  content: string;
  sourceType: string;
  chapters?: Array<{ time: string; title: string }>;
  questions?: string[];
  enabledSections?: Partial<AnalysisSectionsConfig>;
  outputLanguage?: string;
}

/** In-memory representation of a parsed Egg note file. */
export interface EggContent {
  fileName: string;
  topic: string;
  scope: string;
  actionGuide: string;
  keyQuestions: string[];
  rejectionCriteria: string[];
  formattingRules: string;
  knowledge: string;
  unprocessed: string;
  language?: string;
  indexDescription?: string;
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

/** Result of a successful Unprocessed -> Knowledge-tree merge. */
export interface MergeResult {
  egg: string;
  entries: number;
}

export interface AnalysisResult extends ContentAnalysis {
  shouldRead: boolean;
  shouldReadReason: string;
  matchedEggs: string[];
  eggResults: EggAnalysis[];
  newKnowledge: NewKnowledgeItem[];
}

export type WorkflowPromptKey =
  | "contentAnalysis"
  | "eggAnalysis"
  | "eggCompare"
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
    chat(prompt: string, maxTokens?: number): Promise<string>;
  };
  eggParser?: {
    readEgg?(fileName: string): Promise<EggContent | null>;
    applyMerge?(fileName: string, knowledge: string, unprocessed: string): Promise<void>;
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
