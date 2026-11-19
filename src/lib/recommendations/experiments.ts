/**
 * Ranking experiment assignment.
 *
 * Deterministic split on profile id (FNV-1a), so a student stays in the
 * same arm across devices and sessions without storing anything.
 * - control:      Phoenix score only (pre-personalisation baseline), 50%
 * - personalized: Phoenix + viewer affinity, engaged authors and skip penalties, 25%
 * - ranking-v3:   value model (engagement stats, traffic pools, interest vector), 25%
 *
 * v3 takes half of the existing treatment buckets, so control students keep
 * their arm. Impressions store the arm they were served under, and the readout
 * groups by that stored arm, so pre-v3 "personalized" history stays in place.
 *
 * Bump RANKING_EXPERIMENT.id to reshuffle everyone into fresh arms.
 */
export const RANKING_EXPERIMENT = {
  id: "ranking-v2",
  treatmentPercent: 50,
  /** Share of the treatment buckets (0..100) that get ranking v3. */
  v3PercentOfTreatment: 50,
} as const;

export const RANKING_VARIANTS = ["control", "personalized", "ranking-v3"] as const;
export type RankingVariant = (typeof RANKING_VARIANTS)[number];

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
  if (bucket >= RANKING_EXPERIMENT.treatmentPercent) return "control";
  const v3Buckets = (RANKING_EXPERIMENT.treatmentPercent * RANKING_EXPERIMENT.v3PercentOfTreatment) / 100;
  return bucket < v3Buckets ? "ranking-v3" : "personalized";
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
