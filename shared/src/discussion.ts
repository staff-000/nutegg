import type { CapturePayload, DiscussionAnalysis, DiscussionCapture, DiscussionItem, DiscussionMetric, DiscussionStance, DiscussionTopic } from './types';

export const DISCUSSION_STANCES: DiscussionStance[] = ['agree', 'disagree', 'mixed', 'neutral', 'unclear'];
const clean = (value: unknown, limit = 1000) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const list = (value: unknown): any[] => Array.isArray(value) ? value : [];

/** Bound untrusted page/transport input and preserve identities rather than deduplicating by text. */
export function normalizeDiscussion(value?: DiscussionCapture): DiscussionCapture | undefined {
  if (!value || !Array.isArray(value.items)) return undefined;
  const seen = new Set<string>();
  const items: DiscussionItem[] = [];
  let characters = 0, limited = false;
  for (const item of value.items.slice(0, 300)) {
    const id = clean(item?.id, 300), text = clean(item?.text, 6000);
    if (!id || !text || seen.has(id)) continue;
    if (characters + text.length > 150000) { limited = true; break; }
    characters += text.length;
    seen.add(id);
    const reaction = item.reaction;
    items.push({ id, text, parentId: clean(item.parentId, 300) || undefined,
      author: clean(item.author, 200) || undefined, authorId: clean(item.authorId, 500) || undefined,
      url: /^https?:\/\//i.test(item.url || '') ? clean(item.url, 2000) : undefined,
      reaction: reaction && ['likes', 'score'].includes(reaction.kind) ? {
        kind: reaction.kind, count: typeof reaction.count === 'number' && Number.isFinite(reaction.count) && (reaction.kind === 'score' || reaction.count >= 0) ? reaction.count : null,
        approximate: !!reaction.approximate,
      } : undefined });
  }
  return { ...value, kind: value.kind === 'forum' ? 'forum' : 'comments', items,
    status: ['not_loaded', 'loading', 'partial', 'complete', 'empty', 'unavailable'].includes(value.status) ? value.status : 'partial',
    totalCount: Number.isFinite(value.totalCount) && Number(value.totalCount) >= 0 ? Number(value.totalCount) : null,
    truncated: limited || !!value.truncated || value.items.length > 300 || value.items.some(i => (i?.text?.length || 0) > 6000) };
}

export function discussionSourceText(capture: CapturePayload): string {
  if (capture.enabledSections?.discussion !== true) return '';
  const discussion = normalizeDiscussion(capture.discussion);
  if (!discussion?.items.length) return '';
  return '\n\n## Captured discussion (commenter claims, not verified facts)\n' + JSON.stringify(discussion.items);
}

export function discussionBatches(items: DiscussionItem[], limit: number): DiscussionItem[][] {
  const batches: DiscussionItem[][] = [];
  let batch: DiscussionItem[] = [], size = 0;
  for (const item of items) {
    const length = JSON.stringify(item).length;
    if (batch.length && size + length > limit) { batches.push(batch); batch = []; size = 0; }
    batch.push(item); size += length;
  }
  if (batch.length) batches.push(batch);
  return batches;
}

export function discussionBase(capture?: DiscussionCapture): DiscussionAnalysis {
  const d = normalizeDiscussion(capture);
  return { status: d?.items.length ? 'ready' : d?.status === 'empty' || d?.status === 'complete' ? 'no_meaningful' : d?.status === 'unavailable' ? 'unavailable' : 'not_loaded',
    kind: d?.kind || 'comments', coverage: d?.status || 'not_loaded', capturedCount: d?.items.length || 0,
    analyzedCount: 0, totalCount: d?.totalCount ?? null, truncated: !!d?.truncated, topics: [] };
}

/** Model supplies labels and cited arguments; code supplies all counts from original records. */
export function buildDiscussionResult(capture: DiscussionCapture, parts: any[], aggregate?: any): DiscussionAnalysis {
  const base = discussionBase(capture);
  const items = normalizeDiscussion(capture)!.items;
  const byId = new Map(items.map(i => [i.id, i]));
  const originalTopics = new Map<string, any>();
  const labels: Array<{ id: string; topic: string; stance: DiscussionStance }> = [];
  parts.forEach((part, index) => {
    for (const topic of list(part?.topics)) {
      const id = clean(topic?.id, 200);
      if (id && clean(topic.title)) originalTopics.set(`${index}:${id}`, topic);
    }
    for (const label of list(part?.classifications)) {
      if (byId.has(label?.commentId) && originalTopics.has(`${index}:${label.topicId}`) && DISCUSSION_STANCES.includes(label.stance)) {
        labels.push({ id: label.commentId, topic: `${index}:${label.topicId}`, stance: label.stance });
      }
    }
  });
  const used = new Set<string>();
  const groups: Array<{ raw: any; ids: string[] }> = [];
  if (aggregate) {
    for (const raw of list(aggregate.topics)) {
      const ids = list(raw?.mergeTopicIds).filter(id => typeof id === 'string' && originalTopics.has(id) && !used.has(id));
      if (ids.length && clean(raw.title)) { ids.forEach(id => used.add(id)); groups.push({ raw, ids }); }
    }
  }
  for (const [id, raw] of originalTopics) if (!used.has(id)) groups.push({ raw, ids: [id] });
  const topics: DiscussionTopic[] = [];
  for (const { raw, ids } of groups) {
    const assignments = new Map<string, DiscussionStance>();
    for (const label of labels.filter(l => ids.includes(l.topic))) {
      const previous = assignments.get(label.id);
      assignments.set(label.id, previous && previous !== label.stance ? 'mixed' : label.stance);
    }
    // Topics must cite an actual classified source, not just a generated title.
    if (!assignments.size) continue;
    const metric = (): DiscussionMetric => ({ comments: 0, commenters: 0, likes: 0, score: 0, reactionsKnown: 0, likesKnown: 0, scoresKnown: 0, reactionsMissing: 0, approximate: false });
    const metrics = Object.fromEntries(DISCUSSION_STANCES.map(s => [s, metric()])) as Record<DiscussionStance, DiscussionMetric>;
    const authors = new Map<string, Set<DiscussionStance>>();
    let identitiesComplete = true;
    for (const [id, stance] of assignments) {
      const item = byId.get(id)!, m = metrics[stance];
      m.comments++;
      if (item.authorId) { const positions = authors.get(item.authorId) || new Set(); positions.add(stance); authors.set(item.authorId, positions); }
      else identitiesComplete = false;
      if (item.reaction?.count != null) {
        m.reactionsKnown++;
        if (item.reaction.kind === 'likes') { m.likes += item.reaction.count; m.likesKnown++; } else { m.score += item.reaction.count; m.scoresKnown++; }
        m.approximate ||= !!item.reaction.approximate;
      } else m.reactionsMissing++;
    }
    for (const positions of authors.values()) {
      const stance = positions.size === 1 ? [...positions][0] : positions.has('agree') && positions.has('disagree') || positions.has('mixed') ? 'mixed' : positions.has('agree') ? 'agree' : positions.has('disagree') ? 'disagree' : 'unclear';
      metrics[stance].commenters!++;
    }
    if (!identitiesComplete) for (const m of Object.values(metrics)) m.commenters = null;
    const highlighted = new Set<string>();
    const highlights = list(raw.highlights).filter(h => assignments.has(h?.commentId) && clean(h.summary) && !highlighted.has(h.commentId) && !!highlighted.add(h.commentId)).slice(0, 8)
      .map(h => ({ commentId: h.commentId, summary: clean(h.summary, 600), source: byId.get(h.commentId)! }));
    topics.push({ id: `topic-${topics.length + 1}`, title: clean(raw.title, 200), claim: clean(raw.claim, 500), summary: clean(raw.summary),
      agreeArguments: list(raw.agreeArguments).map(v => clean(v, 600)).filter(Boolean).slice(0, 4),
      disagreeArguments: list(raw.disagreeArguments).map(v => clean(v, 600)).filter(Boolean).slice(0, 4), highlights, metrics });
  }
  return { ...base, status: topics.length ? 'ready' : 'no_meaningful', analyzedCount: items.length, topics };
}
