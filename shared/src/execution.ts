import { PROMPTS } from './prompt-templates';
import type { AIAuthMethod, NutEggAISettings, SubscriptionProvider } from './types';
export const EXECUTION_PROTOCOL = 2;
export interface SharedExecutionState {
    instanceId: string;
    protocolVersion: number;
    revision: number;
    subscriptionAvailable: boolean;
    mode: AIAuthMethod;
    subscription: {
        provider: SubscriptionProvider;
        model: string;
    };
    transition: 'ready' | 'changing' | 'error';
}
export interface ClientSession {
    clientId: string;
    sessionId: string;
    displayName: string;
    connected: boolean;
    provider?: string;
    model?: string;
    configurationRevision?: string;
    chunkWindowChars?: number;
    contentAnalysisMaxTokens?: number;
}
export interface AIRequest {
    prompt: string;
    maxTokens: number;
    debugScope?: string;
}
export interface AIExecutor {
    chat(request: AIRequest, signal: AbortSignal): Promise<string>;
}
export interface ExecutionContext {
    jobId: string;
    origin: string;
    revision: number;
    configurationRevision: string;
    settings: Readonly<NutEggAISettings>;
    executor: AIExecutor;
    signal: AbortSignal;
}
export interface ExecutionMetadata {
    jobId: string;
    origin: string;
    revision: number;
    configurationRevision: string;
    authMethod: AIAuthMethod;
    provider: string;
    model: string;
}
// Explicit allowlists keep credentials, endpoints and arbitrary settings out of RPC.
export function publicExecutionSettings(settings: NutEggAISettings): NutEggAISettings {
    const result: NutEggAISettings = {};
    for (const key of ['aiProvider', 'aiModel', 'chromeAiProvider', 'chromeAiModel', 'outputLanguage']) {
        const value=settings[key];
        if(value===undefined)continue;
        if(typeof value!=='string' || value.length>512)throw new RangeError(`Invalid execution setting: ${key}`);
        result[key]=value;
    }
    for(const key of ['chunkWindowChars','contentAnalysisMaxTokens','mergeMaxTokens']) {
        const value=settings[key];if(value===undefined)continue;
        if(!Number.isSafeInteger(value) || value<1 || value>(key==='chunkWindowChars'?2000000:262144))throw new RangeError(`Invalid execution setting: ${key}`);
        result[key]=value;
    }
    for(const key of ['promptOverrides','chromeAiPromptOverrides']) {
        const value=settings[key];if(value===undefined)continue;
        if(!value || typeof value!=='object' || Array.isArray(value))throw new RangeError(`Invalid execution setting: ${key}`);
        const prompts:Record<string,string>={};
        for(const [name,prompt]of Object.entries(value)) {
            if(!(name in PROMPTS))continue;
            if(typeof prompt!=='string' || prompt.length>1024*1024)throw new RangeError('Invalid execution prompt.');
            prompts[name]=prompt;
        }
        result[key]=prompts;
    }
    return result;
}
/** Apply only authoritative snapshots. Local drafts never enter this reducer. */
export function reduceSharedExecutionState(current: SharedExecutionState | undefined, next: SharedExecutionState): SharedExecutionState {
    if (current?.instanceId === next.instanceId && next.revision < current.revision)
        return current;
    return structuredClone({ ...next, mode: next.subscriptionAvailable ? next.mode : 'apiKey' });
}
export function selectEffectiveExecution(connectionMode: string, state?: SharedExecutionState | null) {
    return connectionMode === 'obsidian' && state?.subscriptionAvailable && state.mode === 'subscription' ? 'subscription' : 'apiKey';
}
/** Subscription selection never overwrites the independently saved API setup. */
export function migrateChromeApiPreferences(stored: Record<string, any>): NutEggAISettings {
    const candidates = [stored.chromeApiConfig, stored.aiProfiles?.[`${stored.lastApiKeyProvider}:apiKey`]];
    const backup = candidates.find(value => value && typeof value === 'object') || {};
    const provider = backup.chromeAiProvider || stored.lastApiKeyProvider || stored.chromeAiProvider || 'gemini';
    const profile = stored.aiProfiles?.[`${provider}:apiKey`] || {};
    if (stored.chromeAiAuthMethod !== 'subscription')
        return { ...stored, chromeAiAuthMethod: 'apiKey' };
    return { ...stored, ...backup, chromeAiAuthMethod: 'apiKey', chromeAiProvider: provider,
        chromeAiApiKey: backup.chromeAiApiKey ?? profile.apiKey ?? '',
        chromeAiModel: backup.chromeAiModel ?? profile.model ?? '',
        chromeAiEndpoint: backup.chromeAiEndpoint ?? profile.endpoint ?? '',
        chromeAiLocalEndpoint: backup.chromeAiLocalEndpoint ?? profile.endpoint ?? '' };
}
