// ============================================================
// Obsidian Plugin AI Processor — Delegating to Shared Core
// ============================================================

export {
  AIProcessor,
  MERGE_THRESHOLD,
  repairTruncatedJson,
  sanitizeJsonString,
  parseJson,
  chunkContent,
} from "../../shared/src/ai-processor";

export type {
  ChapterEntry,
  ContentAnalysis,
  KeyAnswer,
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
