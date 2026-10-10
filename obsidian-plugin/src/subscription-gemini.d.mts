export function resolveAgyCommand(command?: string): Promise<string>;
export function runGemini(prompt: string, model: string, options?: { command?: string; signal?: AbortSignal }): Promise<string>;
