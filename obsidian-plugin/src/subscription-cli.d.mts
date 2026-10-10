export class BridgeError extends Error { status: number; constructor(status: number, message: string); }
export function resolveSubscriptionCommand(provider: string, command?: string): Promise<string>;
export function subscriptionEnvironment(provider: string, source?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
export function executeSubscriptionCli(provider: string, executable: string, args: string[], input: string, options?: { cwd?: string; signal?: AbortSignal; timeoutMs?: number; includeStderr?: boolean }): Promise<string>;
export function checkSubscriptionCli(provider: string, command?: string, options?: { signal?: AbortSignal }): Promise<string>;
export function runSubscription(provider: string, prompt: string, model: string, options?: { command?: string; signal?: AbortSignal }): Promise<string>;
