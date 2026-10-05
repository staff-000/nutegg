/** Numeric counters only: never retain prompt text, responses or credentials. */
const createStats = (startedAt = Date.now()) => ({ activeCalls: 0, totalCalls: 0, promptWords: 0, lastPromptWords: 0, startedAt });
const stats = createStats();
const scopedStats = new Map<string, ReturnType<typeof createStats>>();
const MAX_IDLE_SCOPES = 256;

export function normalizeAIDebugScope(scope: unknown): string | undefined {
  return typeof scope === "string" && scope.trim().length > 0 && scope.length <= 160 ? scope.trim() : undefined;
}

export function getAIDebugInfo(scope?: string) {
  // An explicitly requested, unknown scope must never fall back to global totals.
  return { ...(scope === undefined ? stats : scopedStats.get(normalizeAIDebugScope(scope) || "") || createStats(0)) };
}

function pruneIdleScopes() {
  for (const [scope, counters] of scopedStats) {
    if (scopedStats.size <= MAX_IDLE_SCOPES) break;
    if (counters.activeCalls === 0) scopedStats.delete(scope);
  }
}

// CJK characters count separately, consistent with the capture's word-count convention.
export function countPromptWords(prompt: string): number {
  return prompt.match(/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]|[^\s\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]+/gu)?.length || 0;
}
export async function trackAIRequest<T>(prompt: string, request: () => Promise<T>, scope?: string): Promise<T> {
  const key = normalizeAIDebugScope(scope);
  const counters = [stats];
  if (key) {
    const scoped = scopedStats.get(key) || createStats();
    scopedStats.delete(key); scopedStats.set(key, scoped);
    counters.push(scoped);
  }
  const words = countPromptWords(prompt);
  for (const counter of counters) {
    counter.activeCalls++; counter.totalCalls++;
    counter.lastPromptWords = words; counter.promptWords += words;
  }
  pruneIdleScopes();
  try { return await request(); } finally {
    for (const counter of counters) counter.activeCalls--;
    pruneIdleScopes();
  }
}
