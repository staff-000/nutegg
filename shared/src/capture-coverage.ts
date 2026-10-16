import type { CaptureCoverage } from './types';

/** Public capture metadata contains reason codes and finite counts only. */
export function normalizeCaptureCoverage(value: unknown): CaptureCoverage | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const allowed = ['truncated', 'loading_timeout', 'access_restricted', 'traversal_limit'];
  const reasons = Array.isArray(raw.reasons)
    ? [...new Set(raw.reasons.filter(reason => allowed.includes(reason)))]
    : [];
  if (!reasons.length) return undefined;
  const result: CaptureCoverage = { reasons: reasons as CaptureCoverage['reasons'] };
  for (const field of ['originalCharacters', 'capturedCharacters'] as const) {
    const count = raw[field];
    if (typeof count === 'number' && Number.isSafeInteger(count) && count >= 0) result[field] = count;
  }
  return result;
}
