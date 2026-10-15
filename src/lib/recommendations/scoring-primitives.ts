/**
 * Shared, pure ranking primitives used across feed, academics and matching.
 *
 * - Wilson lower bound (Evan Miller / Reddit "best"): ranks by the confidence
 *   that an item is good, so 4/4 upvotes doesn't beat 95/100.
 * - Bayesian average (IMDb top-250 style): shrinks small-sample rates toward a
 *   prior so new items neither dominate nor vanish.
 * - Harmonic-mean reciprocity (RECON, Pizzato et al. 2010): two-sided match
 *   score that is only high when BOTH sides are likely to say yes.
 * - Exam-season context: Indian university exam windows raise demand for
 *   PYQs and revision material.
 */

/** Lower bound of the Wilson score interval for a Bernoulli parameter. */
export function wilsonLowerBound(positive: number, total: number, z = 1.96): number {
  if (total <= 0) return 0;
  const p = Math.min(1, Math.max(0, positive / total));
  const z2 = z * z;
  const denom = 1 + z2 / total;
  const centre = p + z2 / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);
  return Math.max(0, (centre - margin) / denom);
}

/** Bayesian-smoothed rate: (successes + priorMean * priorWeight) / (trials + priorWeight). */
export function bayesianRate(successes: number, trials: number, priorMean: number, priorWeight: number): number {
  const s = Math.max(0, successes);
  const n = Math.max(0, trials);
  return (s + priorMean * priorWeight) / (n + priorWeight);
}

/** Harmonic mean of two probabilities in [0, 1]; 0 if either side is 0. */
export function reciprocalScore(a: number, b: number): number {
  if (a <= 0 || b <= 0) return 0;
  return (2 * a * b) / (a + b);
}

/**
 * Most Indian universities sit end-semester exams in Nov–Dec and Apr–Jun,
 * with mid-sems around Sep–Oct and Feb–Mar. Returns a 0..1 intensity.
 */
export function examSeasonIntensity(date: Date = new Date()): number {
  const month = date.getMonth(); // 0 = Jan
  if (month === 10 || month === 11 || month === 3 || month === 4) return 1;
  if (month === 5 || month === 9 || month === 2) return 0.6;
  return 0.2;
}

const EXAM_PREP_TYPES = new Set(["PYQ", "CHEAT_SHEET", "MODULE"]);

/** Extra score for exam-prep formats, scaled by how close exams are. */
export function examSeasonBoost(resourceType: string, date: Date = new Date(), maxBoost = 30): number {
  if (!EXAM_PREP_TYPES.has(resourceType.toUpperCase())) return 0;
  return Math.round(examSeasonIntensity(date) * maxBoost);
}

/** Recency of activity as a multiplier: active people reply, dormant ones don't. */
export function activityRecencyMultiplier(lastSeenAt: Date | string | null | undefined, now = Date.now()): number {
  if (!lastSeenAt) return 0.85;
  const hours = (now - new Date(lastSeenAt).getTime()) / 3_600_000;
  if (!Number.isFinite(hours)) return 0.85;
  if (hours <= 24) return 1.15;
  if (hours <= 72) return 1.05;
  if (hours <= 24 * 14) return 1.0;
  return 0.8;
}
