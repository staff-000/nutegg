// ============================================================
// Obsidian Plugin AI Client — Delegating to Shared Core
// ============================================================

export {
  PROVIDER_CATALOG,
  OPENROUTER_ENDPOINT,
  findOpenRouterFamily,
  isAIConfigured,
  resolveConfig,
} from "../../shared/src/catalog";

export {
  AIError,
  classifyError,
  chatAI,
  checkCreditAI,
  AIClient,
  type AIErrorCode,
  type AICreditInfo,
} from "../../shared/src/client";

export type {
  AIProviderId,
  AISource,
  ModelFamily,
  ProviderInfo,
  ResolvedConfig,
  NutEggAISettings,
} from "../../shared/src/types";
