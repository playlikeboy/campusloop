/**
 * Ranking experiment assignment.
 *
 * Deterministic 50/50 split on profile id (FNV-1a), so a student stays in the
 * same arm across devices and sessions without storing anything.
 * - control:      Phoenix score only (pre-personalisation baseline)
 * - personalized: Phoenix + viewer affinity, engaged authors and skip penalties
 *
 * Bump RANKING_EXPERIMENT.id to reshuffle everyone into fresh arms.
 */
export const RANKING_EXPERIMENT = {
  id: "ranking-v2",
  treatmentPercent: 50,
} as const;

export type RankingVariant = "control" | "personalized";

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function getRankingVariant(profileId?: string | null): RankingVariant {
  // Logged-out viewers have no affinity to personalise with anyway.
  if (!profileId) return "control";
  const bucket = fnv1a(`${RANKING_EXPERIMENT.id}:${profileId}`) % 100;
  return bucket < RANKING_EXPERIMENT.treatmentPercent ? "personalized" : "control";
}

/**
 * Two-proportion z statistic for comparing a rate between arms
 * (|z| >= 1.96 is roughly 95% confidence the arms really differ).
 */
export function twoProportionZ(successA: number, totalA: number, successB: number, totalB: number): number {
  if (totalA <= 0 || totalB <= 0) return 0;
  const pA = successA / totalA;
  const pB = successB / totalB;
  const pooled = (successA + successB) / (totalA + totalB);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / totalA + 1 / totalB));
  return se === 0 ? 0 : (pA - pB) / se;
}
