/** Numeric counters only: never retain prompt text, responses or credentials. */
const createStats = (startedAt = Date.now()) => ({
  activeCalls: 0,
  waitingCalls: 0,
  completedCalls: 0,
  failedCalls: 0,
  cancelledCalls: 0,
  totalCalls: 0,
  promptWords: 0,
  lastPromptWords: 0,
  lastCallAt: 0,
  startedAt,
});
const stats = createStats();
const epoch = `${stats.startedAt}:${Math.random().toString(36).slice(2)}`;
const scopedStats = new Map<string, ReturnType<typeof createStats>>();
const panelStats = new Map<string, ReturnType<typeof createStats> & { generation: number }>();
let panelGeneration = 0;
const MAX_IDLE_SCOPES = 256;

export function normalizeAIDebugScope(scope: unknown): string | undefined {
  return typeof scope === 'string' && scope.trim().length > 0 && scope.length <= 160 ? scope.trim() : undefined;
}

export function aiDebugPanelId(scope: unknown): string | undefined {
  return normalizeAIDebugScope(scope)?.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):\d+:\d+$/i
  )?.[1];
}

export function getAIDebugInfo(scope?: string) {
  const sessionId = aiDebugPanelId(scope);
  // A panel aggregate is independent of the bounded, per-page diagnostic cache.
  const panel = sessionId ? ensurePanel(sessionId) : undefined;
  pruneIdleScopes();
  return {
    ...(scope === undefined ? stats : scopedStats.get(normalizeAIDebugScope(scope) || '') || createStats(0)),
    diagnosticsVersion: 2,
    epoch,
    ...(panel ? { panel: { ...panel, sessionId, available: true, epoch: `${epoch}:${panel.generation}` } } : {}),
  };
}

function ensurePanel(id: string) {
  const counter = panelStats.get(id) || { ...createStats(), generation: ++panelGeneration };
  panelStats.delete(id);
  panelStats.set(id, counter);
  return counter;
}

function pruneIdleScopes() {
  for (const map of [scopedStats, panelStats]) {
    for (const [scope, counters] of map) {
      if (map.size <= MAX_IDLE_SCOPES) break;
      if (counters.activeCalls === 0 && counters.waitingCalls === 0) map.delete(scope);
    }
  }
}

/** Merge disjoint execution owners, never count delegation as another AI call. */
export function combineAIDebugInfo(chrome: any, obsidian?: any) {
  const validCounters = (value: any) =>
    ['activeCalls', 'waitingCalls', 'completedCalls', 'failedCalls', 'cancelledCalls', 'totalCalls'].every(
      key => Number.isSafeInteger(value?.[key]) && value[key] >= 0
    );
  const combine = (a: any, b: any) => {
    const sum: any = {};
    for (const key of Object.keys(createStats())) {
      if (key === 'startedAt') {
        const times = [a?.[key], b?.[key]].filter(value => Number.isFinite(value) && value > 0);
        sum[key] = times.length ? Math.min(...times) : 0;
      } else if (key === 'lastCallAt') sum[key] = Math.max(a?.lastCallAt || 0, b?.lastCallAt || 0);
      else if (key === 'lastPromptWords') {
        const latest = (a?.lastCallAt || 0) >= (b?.lastCallAt || 0) ? a : b;
        sum[key] = Number.isFinite(latest?.lastPromptWords) ? latest.lastPromptWords : 0;
      } else sum[key] = (Number.isFinite(a?.[key]) ? a[key] : 0) + (Number.isFinite(b?.[key]) ? b[key] : 0);
    }
    return sum;
  };
  const compatible =
    chrome?.diagnosticsVersion === 2 &&
    validCounters(chrome) &&
    (!obsidian || (obsidian.diagnosticsVersion === 2 && validCounters(obsidian)));
  const sessionId = chrome?.panel?.sessionId;
  const available =
    compatible &&
    chrome?.panel?.available === true &&
    validCounters(chrome.panel) &&
    (!obsidian ||
      (obsidian.panel?.available === true && obsidian.panel.sessionId === sessionId && validCounters(obsidian.panel)));
  const result = combine(chrome, obsidian);
  if (!compatible)
    for (const key of ['waitingCalls', 'completedCalls', 'failedCalls', 'cancelledCalls']) delete result[key];
  return {
    ...result,
    diagnosticsVersion: compatible ? 2 : 1,
    panel: {
      ...(available ? combine(chrome.panel, obsidian?.panel) : {}),
      sessionId,
      available,
      epochs: {
        chrome: chrome?.panel?.epoch || chrome?.epoch,
        ...(obsidian ? { obsidian: obsidian.panel?.epoch || obsidian.epoch } : {}),
      },
    },
  };
}

// CJK characters count separately, consistent with the capture's word-count convention.
export function countPromptWords(prompt: string): number {
  return (
    prompt.match(/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]|[^\s\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]+/gu)?.length ||
    0
  );
}

export async function trackAIRequest<T>(
  prompt: string,
  request: (markRunning: () => void) => Promise<T>,
  scope?: string,
  options: { queued?: boolean; signal?: AbortSignal } = {}
): Promise<T> {
  options.signal?.throwIfAborted();
  const key = normalizeAIDebugScope(scope);
  const counters = [stats];
  if (key) {
    const counter = scopedStats.get(key) || createStats();
    scopedStats.delete(key);
    scopedStats.set(key, counter);
    counters.push(counter);
  }
  const panelId = aiDebugPanelId(key);
  if (panelId) counters.push(ensurePanel(panelId));
  const words = countPromptWords(prompt);
  let state: 'waiting' | 'running' | 'finished' = options.queued ? 'waiting' : 'running';
  for (const counter of counters) {
    counter[state === 'waiting' ? 'waitingCalls' : 'activeCalls']++;
    counter.totalCalls++;
    counter.lastPromptWords = words;
    counter.lastCallAt = Date.now();
    counter.promptWords += words;
  }
  const markRunning = () => {
    if (state !== 'waiting') return;
    for (const counter of counters) {
      counter.waitingCalls--;
      counter.activeCalls++;
    }
    state = 'running';
  };
  const finish = (outcome: 'completedCalls' | 'failedCalls' | 'cancelledCalls') => {
    if (state === 'finished') return;
    for (const counter of counters) {
      counter[state === 'waiting' ? 'waitingCalls' : 'activeCalls']--;
      counter[outcome]++;
    }
    state = 'finished';
    pruneIdleScopes();
  };
  const cancelled = (error: any) => {
    const reason = options.signal?.reason;
    return (
      reason !== 'timeout' &&
      reason?.name !== 'TimeoutError' &&
      error?.code !== 'timeout' &&
      (options.signal?.aborted || error?.code === 'cancelled' || error?.name === 'AbortError')
    );
  };
  const abort = () => finish(cancelled(options.signal?.reason) ? 'cancelledCalls' : 'failedCalls');
  options.signal?.addEventListener('abort', abort, { once: true });
  pruneIdleScopes();
  try {
    const result = await request(markRunning);
    options.signal?.throwIfAborted();
    finish('completedCalls');
    return result;
  } catch (error) {
    finish(cancelled(error) ? 'cancelledCalls' : 'failedCalls');
    throw error;
  } finally {
    options.signal?.removeEventListener('abort', abort);
  }
}
