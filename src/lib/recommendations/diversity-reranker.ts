/**
 * 🎨 Diversity Reranker (VMRanker / DPP / MMR Architecture)
 * Inspired by Twitter/X's `vm-ranker/` (Determinantal Point Process) and author diversity decay.
 *
 * In feed recommendation, pure score-descending sorting causes:
 * - High-frequency authors/clubs monopolizing consecutive slots.
 * - Monotonous repetition of the same content type (e.g. 4 confessions in a row).
 * - The same community or hashtag thread taking over a scroll session.
 *
 * This module applies progressive author discounting and category interleaving
 * to maximize content variety and user retention.
 */

export interface DiversityOptions {
  authorFirstPostMultiplier?: number; // Default: 1.00
  authorSecondPostMultiplier?: number; // Default: 0.70
  authorSubsequentPostMultiplier?: number; // Default: 0.45
  adjacentSameTypePenalty?: number; // Default: 0.85
  /** Same community as the previous slot. Default 1.0 (off) so ranking v2 is unchanged. */
  adjacentSameCommunityPenalty?: number;
  /** Shares a hashtag with one of the last 3 slots. Default 1.0 (off). */
  recentHashtagPenalty?: number;
  limit?: number;
}

export interface DiversityItem {
  authorId?: string | null;
  type?: string | null;
  communityId?: string | null;
  hashtags?: string[] | null;
}

/**
 * Multiplier (0..1] for placing `candidate` next, given the last few placed
 * items (most recent last) and how many posts each author already has.
 */
export function diversityMultiplier(
  candidate: DiversityItem,
  recent: DiversityItem[],
  authorCounts: Map<string, number>,
  options?: DiversityOptions
): number {
  const firstMult = options?.authorFirstPostMultiplier ?? 1.0;
  const secondMult = options?.authorSecondPostMultiplier ?? 0.7;
  const subMult = options?.authorSubsequentPostMultiplier ?? 0.45;
  const typePenalty = options?.adjacentSameTypePenalty ?? 0.85;
  const communityPenalty = options?.adjacentSameCommunityPenalty ?? 1.0;
  const hashtagPenalty = options?.recentHashtagPenalty ?? 1.0;

  const count = candidate.authorId ? authorCounts.get(candidate.authorId) || 0 : 0;
  let mult = count === 0 ? firstMult : count === 1 ? secondMult : subMult;

  const last = recent[recent.length - 1];
  if (last) {
    if (candidate.type && last.type && candidate.type === last.type) mult *= typePenalty;
    if (communityPenalty !== 1 && candidate.communityId && candidate.communityId === last.communityId) {
      mult *= communityPenalty;
    }
  }

  if (hashtagPenalty !== 1 && candidate.hashtags && candidate.hashtags.length > 0) {
    const window = recent.slice(-3);
    const overlaps = window.some((item) => item.hashtags?.some((tag) => candidate.hashtags?.includes(tag)));
    if (overlaps) mult *= hashtagPenalty;
  }

  return mult;
}

export function applyAuthorDiversityReranking<
  T extends {
    id: string;
    authorId?: string | null;
    type?: string | null;
    communityId?: string | null;
    hashtags?: string[] | null;
    _rankingScore?: number;
  },
>(items: T[], options?: DiversityOptions): T[] {
  if (items.length <= 1) return [...items];

  const maxLimit = options?.limit ?? items.length;

  // Track author post counts
  const authorPostCounts = new Map<string, number>();

  // Assign baseline rank score if not explicitly present (higher index = lower initial rank)
  const pool = items.map((item, idx) => ({
    item,
    baseScore: item._rankingScore ?? items.length - idx,
  }));

  const result: T[] = [];

  while (pool.length > 0 && result.length < maxLimit) {
    let bestIndex = 0;
    let bestAdjustedScore = -Infinity;
    const recent = result.slice(-3);

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      const effectiveScore =
        candidate.baseScore * diversityMultiplier(candidate.item, recent, authorPostCounts, options);

      if (effectiveScore > bestAdjustedScore) {
        bestAdjustedScore = effectiveScore;
        bestIndex = i;
      }
    }

    const selected = pool.splice(bestIndex, 1)[0].item;
    result.push(selected);

    if (selected.authorId) {
      authorPostCounts.set(selected.authorId, (authorPostCounts.get(selected.authorId) || 0) + 1);
    }
  }

  return result;
}
