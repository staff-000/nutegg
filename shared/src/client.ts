// ============================================================
// NutEgg Unified AI Client & Transport
// ============================================================

import { OpenAI, CallError, Role } from 'byokit/client';
import { trackAIRequest } from './ai-diagnostics';
import { PROVIDER_CATALOG, isSubscriptionProvider, resolveConfig, resolveLocalEndpoint, aiConnectionLabel } from './catalog';
import type {
  AIProviderId,
  AISource,
  NutEggAISettings,
  ResolvedConfig,
  SubscriptionExecutor,
  SubscriptionProvider,
} from './types';

export type AIErrorCode =
  | 'cancelled'
  | 'timeout'
  | 'subscription_requires_obsidian'
  | 'no_api_key'
  | 'auth_failed'
  | 'forbidden'
  | 'model_not_found'
  | 'rate_limited'
  | 'quota_exceeded'
  | 'network_error'
  | 'server_error'
  | 'invalid_response'
  | 'cli_unavailable'
  | 'response_too_large'
  | 'unknown';

export class AIError extends Error {
  code: AIErrorCode;
  statusCode: number | null;

  constructor(code: AIErrorCode, message: string, statusCode?: number) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.statusCode = statusCode ?? null;
  }
}

export interface AICreditInfo {
  subscriptionState?: string;
  usageRemaining?: string;
  provider: AIProviderId;
  providerLabel: string;
  source?: AISource;
  model: string;
  hasBalance: boolean;
  balanceFormatted?: string;
  /** Unrounded remaining balance in the provider's billing currency. */
  remainingCredits?: number;
  currency?: string;
  totalCredits?: number;
  totalUsage?: number;
  statusText: string;
  error?: string;
}

/** Execute directly through BYOKit; NutEgg owns diagnostics and UI error codes. */
export async function chatAI(
  prompt: string,
  maxTokens: number,
  config: ResolvedConfig,
  debugScope?: string,
  signal?: AbortSignal
): Promise<string> {
  if (config.authMethod !== 'apiKey')
    throw new AIError('subscription_requires_obsidian', 'Set up an AI API key in Chrome Settings.');
  if (config.provider !== 'local' && !config.client.apiKey)
    throw new AIError('no_api_key', 'No AI API key configured. Open settings and enter your API key.');
  return trackAIRequest(prompt, async () => {
    try {
      const response = await new OpenAI(config.client).chat.completions.create({
        model: config.model,
        messages: [{ role: Role.User, content: prompt }],
        max_tokens: maxTokens,
      }, { signal, timeoutMs: 180000 });
      return response.choices[0].message.content || '';
    } catch (error) {
      // Presentation translation only; BYOKit owns transport, safety, and retries.
      if (error instanceof CallError) {
        const codes: Record<string, AIErrorCode> = {
          invalid_credentials: 'auth_failed', access_denied: 'forbidden',
          model_not_found_or_inaccessible: 'model_not_found', quota_exhausted: 'quota_exceeded',
          rate_limited: 'rate_limited', provider_unavailable: 'server_error',
          network_error: 'network_error', timeout: 'timeout',
        };
        throw new AIError(error.code === 'CANCELED' ? 'cancelled' :
          codes[error.attempt?.reason || 'unknown'] || 'unknown', error.message, error.status);
      }
      throw error;
    }
  }, debugScope, { signal });
}

/**
 * Check remaining credit/balance for the configured provider.
 */
export async function checkCreditAI(settings: NutEggAISettings): Promise<AICreditInfo> {
  const result = await checkCreditRequest(settings);
  const key = settings.chromeAiApiKey ?? settings.aiApiKey;
  if (key)
    for (const field of ['error', 'statusText'] as const) {
      if (result[field]) result[field] = result[field]!.split(key).join('[redacted]');
    }
  return result;
}

async function checkCreditRequest(settings: NutEggAISettings): Promise<AICreditInfo> {
  const providerId = (settings.chromeAiProvider || settings.aiProvider || 'google') as AIProviderId;
  const provider = PROVIDER_CATALOG[providerId];
  const source: AISource = providerId === 'openrouter' ? 'openrouter' : 'official';
  const apiKey = (settings.chromeAiApiKey !== undefined ? settings.chromeAiApiKey : settings.aiApiKey) || '';
  const model = settings.chromeAiModel || settings.aiModel || provider?.defaultModel || '';

  const baseInfo: AICreditInfo = {
    provider: providerId,
    providerLabel: provider?.label || providerId,
    source,
    model,
    hasBalance: false,
    statusText: 'Checking...',
  };

  if (isSubscriptionProvider(settings))
    return { ...baseInfo, statusText: 'Key required', error: 'Set up an AI API key in Chrome Settings.' };

  // 0. Local LLM (Ollama, LM Studio, etc.) — ping endpoint
  if (providerId === 'local') {
    const { baseUrl, protocol } = resolveLocalEndpoint(settings);
    const isOllama = protocol === 'ollama';
    const pingEndpoint = baseUrl + (isOllama ? '/api/tags' : '/models');
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const resp = await fetch(pingEndpoint, {
        redirect: 'error',
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const typeLabel = isOllama ? 'Ollama Native' : 'OpenAI-compatible';
        return {
          ...baseInfo,
          hasBalance: false,
          statusText: `Connected [${typeLabel}]`,
        };
      } else {
        return {
          ...baseInfo,
          hasBalance: false,
          statusText: `Local LLM (${resp.status} ${resp.statusText})`,
          error: `Local LLM server returned HTTP ${resp.status}`,
        };
      }
    } catch {
      return {
        ...baseInfo,
        hasBalance: false,
        statusText: 'Offline — ensure local runner is running',
        error: 'Cannot connect to local LLM server',
      };
    }
  }

  if (!apiKey) {
    return {
      ...baseInfo,
      statusText: 'No API key configured',
      error: 'No API key',
    };
  }

  // 1. OpenRouter
  if (providerId === 'openrouter') {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/credits', {
        redirect: 'error',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (resp.ok) {
        const json = await resp.json();
        const totalCredits = Number(json?.data?.total_credits ?? 0);
        const totalUsage = Number(json?.data?.total_usage ?? 0);
        const remaining = Math.max(0, totalCredits - totalUsage);
        const balanceFormatted = `$${remaining.toFixed(2)}`;
        return {
          ...baseInfo,
          hasBalance: true,
          balanceFormatted,
          currency: 'USD',
          remainingCredits: remaining,
          totalCredits,
          totalUsage,
          statusText: `${balanceFormatted} left ($${totalUsage.toFixed(2)} used / $${totalCredits.toFixed(2)} total)`,
        };
      } else if (resp.status === 401) {
        return {
          ...baseInfo,
          statusText: 'Invalid API key',
          error: 'Authentication failed',
        };
      } else {
        return {
          ...baseInfo,
          statusText: 'OpenRouter (Active)',
        };
      }
    } catch (err) {
      return {
        ...baseInfo,
        statusText: 'OpenRouter (Network error)',
        error: String(err),
      };
    }
  }

  // 2. Official DeepSeek
  if (providerId === 'deepseek') {
    try {
      const resp = await fetch('https://api.deepseek.com/user/balance', {
        redirect: 'error',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      });
      if (resp.ok) {
        const json = await resp.json();
        const info = json?.balance_infos?.[0];
        const curr = info?.currency || 'CNY';
        const symbol = curr === 'USD' ? '$' : '¥';
        const balance = parseFloat(info?.total_balance || '0');
        const balanceFormatted = `${symbol}${balance.toFixed(2)}`;
        return {
          ...baseInfo,
          hasBalance: true,
          balanceFormatted,
          currency: curr,
          remainingCredits: balance,
          statusText: `${balanceFormatted} available`,
        };
      } else if (resp.status === 401) {
        return { ...baseInfo, statusText: 'Invalid API key', error: 'Auth failed' };
      }
    } catch {}
    return { ...baseInfo, statusText: 'DeepSeek (Active)' };
  }

  // Anthropic / OpenAI / Gemini
  return {
    ...baseInfo,
    hasBalance: false,
    statusText: `${provider?.label || providerId} (Pay-as-you-go / Direct)`,
  };
}

export class AIClient {
  private settings: NutEggAISettings;

  constructor(
    settings: NutEggAISettings,
    private subscription?: SubscriptionExecutor,
    private signal?: AbortSignal
  ) {
    this.settings = structuredClone(settings);
  }

  async checkCredit(settings: NutEggAISettings): Promise<AICreditInfo> {
    if (isSubscriptionProvider(settings) && this.subscription) {
      const config = resolveConfig(settings);
      const status = await this.subscription.status(config.provider as SubscriptionProvider);
      return {
        provider: config.provider,
        providerLabel: aiConnectionLabel(config.provider, config.authMethod),
        source: 'official',
        model: config.model,
        hasBalance: false,
        statusText: status.message,
        ...(status.state === 'error' ? { error: status.message } : {}),
        subscriptionState: status.state,
        usageRemaining: status.usageRemaining,
      };
    }
    return checkCreditAI(settings);
  }

  async chat(prompt: string, maxTokens: number, debugScope?: string): Promise<string> {
    // Each executor uses the configuration captured for its owning job.
    const config = resolveConfig(this.settings);
    if (config.authMethod === 'subscription' && this.subscription)
      return trackAIRequest(
        prompt,
        markRunning =>
          this.subscription!.chat(
            config.provider as SubscriptionProvider,
            config.model,
            prompt,
            this.signal,
            markRunning
          ),
        debugScope,
        { queued: true, signal: this.signal }
      );
    return chatAI(prompt, maxTokens, config, debugScope, this.signal);
  }
}
