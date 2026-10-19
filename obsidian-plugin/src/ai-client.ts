// ============================================================
// Obsidian Plugin AI Client — Delegating to Shared Core
// ============================================================

export {
  PROVIDER_CATALOG,
  findOpenRouterFamily,
  isAIConfigured,
  isSubscriptionProvider,
  resolveConfig,
} from '../../shared/src/catalog';

export {
  AIError,
  chatAI,
  checkCreditAI,
  AIClient,
  type AIErrorCode,
  type AICreditInfo,
} from '../../shared/src/client';

export type {
  AIProviderId,
  AISource,
  ModelFamily,
  ProviderInfo,
  ResolvedConfig,
  NutEggAISettings,
} from '../../shared/src/types';
