/**
 * 🎨 Diversity Reranker (VMRanker / DPP / MMR Architecture)
 * Inspired by Twitter/X's `vm-ranker/` (Determinantal Point Process) and author diversity decay.
 *
 * In feed recommendation, pure score-descending sorting causes:
 * - High-frequency authors/clubs monopolizing consecutive slots.
 * - Monotonous repetition of the same content type (e.g. 4 confessions in a row).
 *
 * This module applies progressive author discounting and category interleaving
 * to maximize content variety and user retention.
 */

export interface DiversityOptions {
  authorFirstPostMultiplier?: number; // Default: 1.00
  authorSecondPostMultiplier?: number; // Default: 0.70
  authorSubsequentPostMultiplier?: number; // Default: 0.45
  adjacentSameTypePenalty?: number; // Default: 0.85
  limit?: number;
}

export function applyAuthorDiversityReranking<
  T extends {
    id: string;
    authorId?: string | null;
    type?: string | null;
    _rankingScore?: number;
  },
>(items: T[], options?: DiversityOptions): T[] {
  if (items.length <= 1) return [...items];

  const firstMult = options?.authorFirstPostMultiplier ?? 1.0;
  const secondMult = options?.authorSecondPostMultiplier ?? 0.7;
  const subMult = options?.authorSubsequentPostMultiplier ?? 0.45;
  const typePenalty = options?.adjacentSameTypePenalty ?? 0.85;
  const maxLimit = options?.limit ?? items.length;

  // Track author post counts
  const authorPostCounts = new Map<string, number>();

  // Assign baseline rank score if not explicitly present (higher index = lower initial rank)
  const pool = items.map((item, idx) => ({
    item,
    baseScore: item._rankingScore ?? items.length - idx,
  }));

  const result: T[] = [];
  let lastType: string | null = null;

  while (pool.length > 0 && result.length < maxLimit) {
    let bestIndex = 0;
    let bestAdjustedScore = -Infinity;

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      const authorId = candidate.item.authorId;
      const count = authorId ? (authorPostCounts.get(authorId) || 0) : 0;

      // Author diversity decay multiplier
      let authorMult = firstMult;
      if (count === 1) authorMult = secondMult;
      else if (count >= 2) authorMult = subMult;

      // Category / Type diversity penalty if repeating adjacent category
      let categoryMult = 1.0;
      if (candidate.item.type && lastType && candidate.item.type === lastType) {
        categoryMult = typePenalty;
      }

      const effectiveScore = candidate.baseScore * authorMult * categoryMult;

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
    lastType = selected.type ?? null;
  }

  return result;
}
