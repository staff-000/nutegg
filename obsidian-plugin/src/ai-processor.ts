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
  NovelDelta,
  ExtractedKnowledgeEntry,
  RedundantEntry,
  EggAnalysis,
  NewKnowledgeItem,
  MergeResult,
  AnalysisResult,
  EggContent,
  WorkflowPromptKey,
} from "../../shared/src/types";
