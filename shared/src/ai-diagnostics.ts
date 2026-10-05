/** Numeric session counters only: never retain prompt text, responses or credentials. */
const stats = { activeCalls: 0, totalCalls: 0, promptWords: 0, lastPromptWords: 0, startedAt: Date.now() };
export function getAIDebugInfo() { return { ...stats }; }

// CJK characters count separately, consistent with the capture's word-count convention.
export function countPromptWords(prompt: string): number {
  return prompt.match(/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]|[^\s\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]+/gu)?.length || 0;
}
export async function trackAIRequest<T>(prompt: string, request: () => Promise<T>): Promise<T> {
  stats.activeCalls++; stats.totalCalls++;
  stats.lastPromptWords = countPromptWords(prompt); stats.promptWords += stats.lastPromptWords;
  try { return await request(); } finally { stats.activeCalls--; }
}
