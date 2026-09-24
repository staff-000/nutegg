// ============================================================
// NutEgg Unified AI Engine — Main Entry Point
// ============================================================

export * from "./types";
export * from "./catalog";
export * from "./client";
export * from "./chunker";
export * from "./json-repair";
export * from "./egg-format";
export * from "./egg-parser";
export * from "./prompt-templates";
export * from "./ai-processor";

import { resolveConfig } from "./catalog";
import { chatAI } from "./client";
import { AIProcessor } from "./ai-processor";
import type {
  AIProcessorHost,
  CapturePayload,
  ContentAnalysis,
  KeyAnswer,
  NutEggAISettings,
} from "./types";

/**
 * Standalone Stage 1 analysis helper (ideal for Chrome extension service worker).
 */
export async function analyzeContentStandalone(
  payload: CapturePayload,
  settings: NutEggAISettings
): Promise<ContentAnalysis> {
  const config = resolveConfig(settings);
  const language =
    payload.outputLanguage ||
    settings.outputLanguage ||
    "same-as-content";
  const host: AIProcessorHost = {
    settings: {
      ...settings,
      outputLanguage: language,
    },
    aiClient: {
      chat: (prompt, maxTokens) => chatAI(prompt, maxTokens || 16384, config),
    },
  };
  const processor = new AIProcessor(host);
  return processor.analyzeContent(payload);
}

/**
 * Standalone follow-up Q&A helper (ideal for Chrome extension service worker).
 */
export async function askFollowUpStandalone(
  payload: CapturePayload,
  question: string,
  priorQa: KeyAnswer[] = [],
  settings: NutEggAISettings
): Promise<string> {
  const config = resolveConfig(settings);
  const language =
    payload.outputLanguage ||
    settings.outputLanguage ||
    "same-as-content";
  const host: AIProcessorHost = {
    settings: {
      ...settings,
      outputLanguage: language,
    },
    aiClient: {
      chat: (prompt, maxTokens) => chatAI(prompt, maxTokens || 2000, config),
    },
  };
  const processor = new AIProcessor(host);
  const answers = await processor.askFollowUp(payload, [question], priorQa);
  return answers[0]?.answer || "No answer returned.";
}

