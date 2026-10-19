// ============================================================
// NutEgg Provider Catalog & Configuration Resolver
// ============================================================

import { GENERATED_MODELS } from './generated-models';
import type { AIProviderId, ModelFamily, NutEggAISettings, ProviderInfo, ResolvedConfig } from './types';

export const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/** Display identity depends on authentication; saved provider IDs remain stable. */
export function aiConnectionLabel(provider?: string, method?: string): string {
  if (method === 'chatgpt') return 'ChatGPT sign-in';
  if (method === 'subscription' && provider === 'openai') return 'Codex CLI';
  if (method === 'subscription' && provider === 'anthropic') return 'Claude';
  return PROVIDER_CATALOG[provider as AIProviderId]?.label || provider || '';
}

// Only precompiled BYOKit selections enter the browser/plugin bundles.
const CLOUD_PROVIDERS = [
  { id: 'anthropic', byokitId: 'anthropic', label: 'Anthropic (Claude)',
    officialEndpoint: 'https://api.anthropic.com/v1/messages', apiFormat: 'anthropic', keyPlaceholder: 'sk-ant-...' },
  { id: 'openai', byokitId: 'openai', label: 'OpenAI',
    officialEndpoint: 'https://api.openai.com/v1/chat/completions', apiFormat: 'openai-compatible', keyPlaceholder: 'sk-...' },
  { id: 'gemini', byokitId: 'google', label: 'Google Gemini',
    officialEndpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    apiFormat: 'openai-compatible', keyPlaceholder: 'AIza...' },
  { id: 'deepseek', byokitId: 'deepseek', label: 'DeepSeek',
    officialEndpoint: 'https://api.deepseek.com/v1/chat/completions', apiFormat: 'openai-compatible', keyPlaceholder: 'sk-...' },
] as const;

function modelChoices(models: typeof GENERATED_MODELS) {
  return {
    models: models.map(model => model.apiModelId),
    defaultModel: (models.find(model => model.tier === 'flash') || models[0])?.apiModelId,
  };
}

const routerModels = GENERATED_MODELS.filter(model => model.providerId === 'openrouter');
const OPENROUTER_FAMILIES: ModelFamily[] = CLOUD_PROVIDERS.flatMap(provider => {
  const choices = modelChoices(routerModels.filter(model => model.modelId.startsWith(provider.byokitId + '/')));
  return choices.defaultModel ? [{ id: provider.byokitId, label: provider.label, ...choices, defaultModel: choices.defaultModel }] : [];
});
const routerChoices = modelChoices(routerModels);
OPENROUTER_FAMILIES.push({ id: 'custom', label: 'Custom OpenRouter Model', models: [], defaultModel: routerChoices.defaultModel! });

export const PROVIDER_CATALOG = {
  local: {
    id: 'local', label: 'Local LLM (Ollama, LM Studio, etc.)',
    officialEndpoint: 'http://127.0.0.1:11434/v1/chat/completions',
    apiFormat: 'openai-compatible', keyPlaceholder: 'Optional for local LLMs', openrouterPrefix: '',
  },
  openrouter: {
    id: 'openrouter', label: 'OpenRouter (Multi-Provider)', officialEndpoint: OPENROUTER_ENDPOINT,
    apiFormat: 'openai-compatible', ...routerChoices, families: OPENROUTER_FAMILIES,
    keyPlaceholder: 'sk-or-...', openrouterPrefix: '',
  },
  ...Object.fromEntries(CLOUD_PROVIDERS.map(({ byokitId, ...provider }) => [provider.id, {
    ...provider, ...modelChoices(GENERATED_MODELS.filter(model => model.providerId === byokitId)),
    openrouterPrefix: byokitId + '/',
  }])),
} as Record<AIProviderId, ProviderInfo>;

/** Keys may use HTTP only over loopback; never permit a network plaintext hop. */
export function validateAIEndpoint(endpoint: string, apiKey = ''): URL {
  const url = new URL(endpoint);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
    throw new Error('Use an HTTP(S) endpoint without credentials, query, or fragment.');
  const loopback = url.hostname === 'localhost' || url.hostname === '[::1]' || /^127\.\d+\.\d+\.\d+$/.test(url.hostname);
  if (apiKey.trim() && url.protocol !== 'https:' && !loopback)
    throw new Error('API keys require HTTPS except on localhost or loopback endpoints.');
  return url;
}

/** Accept BYOKit-style base URLs and existing NutEgg full request URLs. Offline only. */
export function resolveLocalEndpoint(settings: NutEggAISettings): { endpoint: string; apiFormat: 'ollama' | 'openai-compatible' } {
  const raw = (settings.chromeAiEndpoint || settings.localEndpoint || settings.aiEndpoint ||
    PROVIDER_CATALOG.local.officialEndpoint).trim();
  const url = validateAIEndpoint(raw, settings.chromeAiApiKey ?? settings.aiApiKey ?? '');
  const native = settings.localApiType === 'ollama' || /\/api\/chat\/?$/.test(url.pathname);
  let endpoint = raw.replace(/\/+$/, '');
  if (native) endpoint = endpoint.replace(/\/v1(?:\/chat\/completions)?$/, '').replace(/\/api\/chat$/, '') + '/api/chat';
  else if (!endpoint.endsWith('/chat/completions')) {
    if (!endpoint.endsWith('/v1')) endpoint += '/v1';
    endpoint += '/chat/completions';
  }
  return { endpoint, apiFormat: native ? 'ollama' : 'openai-compatible' };
}

export function isSubscriptionProvider(provider?: string | NutEggAISettings): boolean {
  if (typeof provider === 'object')
    return (
      (provider.chromeAiAuthMethod || provider.aiAuthMethod) === 'subscription' ||
      ['codex-cli', 'claude-cli', 'gemini-cli'].includes(provider.chromeAiProvider || provider.aiProvider || '')
    );
  return ['codex-cli', 'claude-cli', 'gemini-cli'].includes(provider || '');
}

export function supportsSubscription(provider?: string): boolean {
  return ['openai', 'anthropic', 'gemini'].includes(provider || '');
}

/** Idempotent migration; bridge tokens must never become provider API keys. */
export function migrateAISettings<T extends NutEggAISettings>(settings: T): T {
  const next: NutEggAISettings = { ...settings };
  const aliases: Record<string, string> = { 'codex-cli': 'openai', 'claude-cli': 'anthropic', 'gemini-cli': 'gemini' };
  for (const prefix of ['ai', 'chromeAi']) {
    if (!next[prefix + 'Provider'] && !next[prefix + 'AuthMethod']) continue;
    const old = next[prefix + 'Provider'];
    if (aliases[old]) {
      next[prefix + 'Provider'] = aliases[old];
      next[prefix + 'AuthMethod'] = 'subscription';
      next[prefix + 'ApiKey'] = '';
      next[prefix + 'Endpoint'] = '';
      if (prefix === 'chromeAi') next.chromeAiLocalEndpoint = '';
    }
    next[prefix + 'AuthMethod'] ||= 'apiKey';
    if (next[prefix + 'AuthMethod'] === 'subscription') next[prefix + 'ApiKey'] = '';
  }
  return next as T;
}

export function findOpenRouterFamily(modelName: string): ModelFamily | undefined {
  const families = PROVIDER_CATALOG.openrouter!.families || [];
  if (families.length === 0) return undefined;
  const exact = families.find(f => f.models.includes(modelName));
  if (exact) return exact;
  const byPrefix = families.find(f => {
    if (f.id === 'custom') return false;
    return modelName.startsWith(f.id + '/');
  });
  return byPrefix || families.find(f => f.id === 'custom');
}

/**
 * Check if the user has configured enough information to make AI calls.
 * For cloud providers, requires a non-empty API key.
 * For local LLMs, requires an exact served model ID and a valid endpoint.
 */
export function isAIConfigured(settings?: NutEggAISettings): boolean {
  if (!settings) return false;
  if ((settings.chromeAiAuthMethod || settings.aiAuthMethod) === 'chatgpt') return settings.chatgptReady === true;
  const provider = (settings.chromeAiProvider || settings.aiProvider || 'gemini') as AIProviderId;
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
export function resolveConfig(settings: NutEggAISettings): ResolvedConfig & {
  extraHeaders: Record<string, string>;
} {
  const providerId = (settings.chromeAiProvider || settings.aiProvider || 'anthropic') as AIProviderId;
  if ((settings.chromeAiAuthMethod || settings.aiAuthMethod) === 'chatgpt')
    return {
      provider: 'openai',
      authMethod: 'chatgpt',
      endpoint: '',
      apiKey: '',
      model: settings.chromeAiModel || settings.aiModel || '',
      apiFormat: 'openai-compatible',
      extraHeaders: {},
    };
  if (isSubscriptionProvider(settings))
    return {
      provider: providerId,
      authMethod: 'subscription',
      endpoint: '',
      apiKey: '',
      model: settings.chromeAiModel || settings.aiModel || 'auto',
      apiFormat: 'openai-compatible',
      extraHeaders: {},
    };
  const isLocal = providerId === 'local';
  const isOpenRouter = providerId === 'openrouter';

  const rawKey = settings.chromeAiApiKey !== undefined ? settings.chromeAiApiKey : settings.aiApiKey;
  const apiKey = (rawKey || '').trim();

  if (isLocal) {
    const { endpoint, apiFormat } = resolveLocalEndpoint(settings);
    const model = (settings.chromeAiModel || settings.aiModel || '').trim();
    if (!model) throw new Error('Configure the exact model ID served by your local server.');

    return {
      provider: 'local',
      endpoint,
      apiKey,
      model,
      apiFormat,
      isLocal: true,
      extraHeaders: {},
    };
  }

  if (isOpenRouter) {
    return {
      provider: 'openrouter',
      endpoint: OPENROUTER_ENDPOINT,
      apiKey,
      model:
        settings.chromeAiModel ||
        settings.openrouterModel ||
        settings.aiModel ||
        PROVIDER_CATALOG.openrouter!.defaultModel!,
      apiFormat: 'openai-compatible',
      isLocal: false,
      extraHeaders: {
        'HTTP-Referer': 'https://github.com/nutegg',
        'X-Title': 'NutEgg',
      },
    };
  }

  const catalog = PROVIDER_CATALOG[providerId];
  if (!catalog) throw new Error(`Unknown AI provider: ${providerId}`);
  const model = (settings.chromeAiModel || settings.aiModel || catalog.defaultModel || '').trim();

  return {
    provider: providerId,
    endpoint: catalog.officialEndpoint,
    apiKey,
    model,
    apiFormat: catalog.apiFormat,
    isLocal: false,
    extraHeaders: catalog.apiFormat === 'anthropic' ? { 'anthropic-version': '2023-06-01' } : {},
  };
}
