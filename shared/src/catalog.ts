// ============================================================
// NutEgg Provider Catalog & Configuration Resolver
// ============================================================

import { ApiProtocol, ProviderId, validateClientConfig } from 'byokit/client';
import type { Connection, ExecutionModel } from 'byokit/client';
import { getModelsByProvider } from '../generated/models.mjs';
import type { AIProviderId, NutEggAISettings, ProviderInfo, ResolvedConfig } from './types';

const modelsByProvider = getModelsByProvider();

/** Display identity depends on authentication; saved provider IDs remain stable. */
export function aiConnectionLabel(provider?: string, method?: string): string {
  if (method === 'chatgpt') return 'ChatGPT sign-in';
  if (method === 'subscription' && provider === 'openai') return 'Codex CLI';
  if (method === 'subscription' && provider === 'anthropic') return 'Claude';
  return PROVIDER_CATALOG[provider as AIProviderId]?.label || provider || '';
}

// Provider identities, labels, and connections all come from BYOKit at build time.
function modelChoices(models: readonly ExecutionModel[]) {
  return {
    models: models.map(model => model.apiModelId),
    defaultModel: (models.find(model => model.tier === 'flash') || models[0])?.apiModelId,
  };
}

// Local is a settings form; its actual endpoint and model are supplied by the user.
// Cloud display metadata and execution offerings come from the native generated list.
const providers: ProviderInfo[] = [
  { id: ProviderId.Local, label: 'Local', connection: resolveLocalEndpoint({}) },
  ...Object.values(modelsByProvider).map(models => ({
    id: models[0].providerId,
    label: models[0].provider!.name,
    connection: models[0].connection!,
    ...modelChoices(models),
  })),
];

export const PROVIDER_CATALOG = Object.fromEntries(providers.map(provider =>
  [provider.id, provider])) as Record<AIProviderId, ProviderInfo>;

/** Local settings use base URLs and BYOKit's native protocol names. No requests. */
export function resolveLocalEndpoint(settings: NutEggAISettings): Connection {
  const raw = (settings.chromeAiEndpoint || settings.localEndpoint || settings.aiEndpoint ||
    'http://127.0.0.1:11434/v1').trim();
  const connection = validateClientConfig({
    baseURL: raw.replace(/\/+$/, ''),
    apiKey: settings.chromeAiApiKey ?? settings.aiApiKey ?? '',
    protocol: settings.localApiType === 'ollama' ? ApiProtocol.Ollama : ApiProtocol.OpenAI,
  });
  if (/\/(?:chat\/completions|api\/chat)\/?$/.test(new URL(connection.baseUrl).pathname))
    throw new Error('Use the server base URL, without /chat/completions or /api/chat.');
  return connection;
}

export function isSubscriptionProvider(settings?: NutEggAISettings): boolean {
  return (settings?.chromeAiAuthMethod || settings?.aiAuthMethod) === 'subscription';
}

export function supportsSubscription(provider?: string): boolean {
  return ['openai', 'anthropic', 'google'].includes(provider || '');
}

/** Normalize authentication settings without translating provider IDs. */
export function normalizeAISettings<T extends NutEggAISettings>(settings: T): T {
  const next: NutEggAISettings = { ...settings };
  for (const prefix of ['ai', 'chromeAi']) {
    if (!next[prefix + 'Provider'] && !next[prefix + 'AuthMethod']) continue;
    next[prefix + 'AuthMethod'] ||= 'apiKey';
    if (next[prefix + 'AuthMethod'] === 'subscription') next[prefix + 'ApiKey'] = '';
  }
  return next as T;
}

/**
 * Check if the user has configured enough information to make AI calls.
 * For cloud providers, requires a non-empty API key.
 * For local LLMs, requires an exact served model ID and a valid endpoint.
 */
export function isAIConfigured(settings?: NutEggAISettings): boolean {
  if (!settings) return false;
  if ((settings.chromeAiAuthMethod || settings.aiAuthMethod) === 'chatgpt') return settings.chatgptReady === true;
  const provider = (settings.chromeAiProvider || settings.aiProvider || 'google') as AIProviderId;
  const apiKey = (settings.chromeAiApiKey !== undefined ? settings.chromeAiApiKey : settings.aiApiKey) || '';

  if (isSubscriptionProvider(settings)) return supportsSubscription(provider);
  if (provider === 'local') {
    if (!(settings.chromeAiModel || settings.aiModel || '').trim()) return false;
    try { resolveLocalEndpoint(settings); return true; } catch { return false; }
  }
  return Boolean(PROVIDER_CATALOG[provider] && apiKey && apiKey.trim().length > 0);
}

/**
 * Resolve settings into actionable API call parameters.
 * Normalizes both Obsidian settings format and Chrome settings format.
 */
export function resolveConfig(settings: NutEggAISettings): ResolvedConfig {
  const provider = (settings.chromeAiProvider || settings.aiProvider || 'anthropic') as AIProviderId;
  const authMethod = settings.chromeAiAuthMethod || settings.aiAuthMethod || 'apiKey';
  const apiKey = (settings.chromeAiApiKey ?? settings.aiApiKey ?? '').trim();
  const catalog = PROVIDER_CATALOG[provider];
  if (!catalog) throw new Error(`Unknown AI provider: ${provider}`);
  const model = (settings.chromeAiModel || settings.aiModel ||
    (authMethod === 'apiKey' ? catalog.defaultModel : 'auto') || '').trim();
  if (authMethod !== 'apiKey')
    return { provider, authMethod, model, client: { apiKey: '' } };
  if (provider === 'local' && !model) throw new Error('Configure the exact model ID served by your local server.');
  const connection = provider === 'local' ? resolveLocalEndpoint(settings) : catalog.connection;
  return {
    provider,
    authMethod,
    model,
    client: {
      apiKey,
      baseURL: connection.baseUrl,
      protocol: connection.protocol,
      models: (modelsByProvider[provider] || []).filter(offering => offering.apiModelId === model),
      ...(provider === 'openrouter' ? { defaultHeaders: {
        'HTTP-Referer': 'https://github.com/nutegg', 'X-Title': 'NutEgg',
      } } : {}),
    },
  };
}
