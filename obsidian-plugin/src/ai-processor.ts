// ============================================================
// Obsidian Plugin AI Processor — Delegating to Shared Core
// ============================================================

export {
  AIProcessor,
  MERGE_THRESHOLD,
  DEFAULT_ANALYSIS_SECTIONS,
  repairTruncatedJson,
  sanitizeJsonString,
  parseJson,
  chunkContent,
} from "../../shared/src/ai-processor";

export type {
  AnalysisSectionsConfig,
  ChapterEntry,
  ContentAnalysis,
  KeyAnswer,
  MindMapNode,
  ExtractedKnowledgeEntry,
  EggAnalysis,
  EggSaveEntry,
  ReadAction,
  MergeResult,
  AnalysisResult,
  EggContent,
  WorkflowPromptKey,
  QuestionScope,
} from "../../shared/src/types";
