/**
 * Ranking v3: TikTok-style value model (pure functions, no I/O).
 *
 *   score = Σ_a P̂(a)·V(a) + Ê[dwell]·V_dwell − P̂(skip)·V_skip − P̂(report)·V_report
 *         × freshness decay × social multiplier × personal affinity × audience (traffic tier)
 *
 * - P̂(a) is Bayesian-smoothed per post: (k + prior·m) / (impressions + m), with
 *   priors per post type learned from all posts (see engagement-stats.ts).
 * - Traffic pools: new posts get guaranteed test slots with same-campus viewers
 *   until 30 impressions. Winners (P̂(engage) ≥ their type median) are promoted
 *   to nearby campuses (tier 2, up to 300 impressions), then everywhere (tier 3).
 *   Losers decay out.
 * - Session freshness: one exploration post (out-of-interest, high P̂) every 6
 *   slots, and author / type / community / hashtag diversity.
 */
import { bayesianRate } from "@/lib/recommendations/scoring-primitives";
import { diversityMultiplier, type DiversityOptions } from "@/lib/recommendations/diversity-reranker";
import { DEFAULT_PHOENIX_WEIGHTS } from "@/lib/recommendations/phoenix-ranker";
import { EMPTY_INTEREST_VECTOR, type InterestVector, interestMatch } from "@/lib/recommendations/interest-vector-core";

// ── Priors ──

export interface TypePrior {
  vote: number;
  comment: number;
  share: number;
  save: number;
  profileTap: number;
  longDwell: number;
  skip: number;
  completion: number;
  loop: number;
  /** Mean seconds on screen per impression. */
  dwellSec: number;
  /** Median P̂(engage) among posts of this type with 30+ impressions. */
  medianEngage: number;
}

/** Used until a type has enough traffic to learn its own prior. */
export const DEFAULT_TYPE_PRIOR: TypePrior = {
  vote: 0.06,
  comment: 0.012,
  share: 0.003,
  save: 0.006,
  profileTap: 0.01,
  longDwell: 0.15,
  skip: 0.5,
  completion: 0.3,
  loop: 0.08,
  dwellSec: 4,
  medianEngage: 0.08,
};

/** Pseudo-impressions of prior weight per post (m in the smoothing formula). */
export const PRIOR_STRENGTH = 20;
/** Pseudo-impressions of the global prior when learning a type prior. */
const TYPE_PRIOR_STRENGTH = 200;

export interface TypePriorRow {
  type: string;
  posts?: number | string;
  impressions: number | string;
  dwellMsSum: number | string;
  longDwell: number | string;
  skips: number | string;
  votes: number | string;
  comments: number | string;
  shares: number | string;
  saves: number | string;
  profileTaps: number | string;
  completions: number | string;
  loops: number | string;
  medianEngage: number | string | null;
}

/**
 * Per-type priors from aggregate stats, each shrunk toward DEFAULT_TYPE_PRIOR so
 * a type with little traffic stays close to the global baseline.
 * Always returns a `DEFAULT` entry.
 */
export function deriveTypePriors(rows: TypePriorRow[]): Record<string, TypePrior> {
  const out: Record<string, TypePrior> = { DEFAULT: { ...DEFAULT_TYPE_PRIOR } };
  const d = DEFAULT_TYPE_PRIOR;
  for (const r of rows) {
    if (!r?.type || !/^[A-Z_]+$/.test(r.type)) continue;
    const n = Math.max(0, Number(r.impressions) || 0);
    const rate = (k: number | string, prior: number) => bayesianRate(Number(k) || 0, n, prior, TYPE_PRIOR_STRENGTH);
    const median = Number(r.medianEngage);
    const engagePrior = d.vote + d.comment + d.share + d.save;
    out[r.type] = {
      vote: rate(r.votes, d.vote),
      comment: rate(r.comments, d.comment),
      share: rate(r.shares, d.share),
      save: rate(r.saves, d.save),
      profileTap: rate(r.profileTaps, d.profileTap),
      longDwell: rate(r.longDwell, d.longDwell),
      skip: rate(r.skips, d.skip),
      completion: rate(r.completions, d.completion),
      loop: rate(r.loops, d.loop),
      dwellSec: (Math.max(0, Number(r.dwellMsSum) || 0) / 1000 + d.dwellSec * TYPE_PRIOR_STRENGTH) / (n + TYPE_PRIOR_STRENGTH),
      medianEngage: Number.isFinite(median) && median > 0 ? median : engagePrior,
    };
  }
  return out;
}

export function priorFor(priors: Record<string, TypePrior> | null | undefined, type: string): TypePrior {
  return priors?.[type] ?? priors?.DEFAULT ?? DEFAULT_TYPE_PRIOR;
}

// ── Predictions ──

export interface EngagementCounts {
  impressions: number;
  dwellMsSum: number;
  longDwell: number;
  skips: number;
  votes: number;
  comments: number;
  shares: number;
  saves: number;
  profileTaps: number;
  reports: number;
  completions: number;
  loops: number;
}

export const ZERO_COUNTS: EngagementCounts = {
  impressions: 0,
  dwellMsSum: 0,
  longDwell: 0,
  skips: 0,
  votes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
  profileTaps: 0,
  reports: 0,
  completions: 0,
  loops: 0,
};

export interface ActionPredictions {
  pVote: number;
  pComment: number;
  pShare: number;
  pSave: number;
  pProfileTap: number;
  pLongDwell: number;
  pSkip: number;
  pReport: number;
  pCompletion: number;
  pLoop: number;
  /** Expected seconds on screen, capped at MAX_EXPECTED_DWELL_SEC. */
  expectedDwellSec: number;
  /** Any explicit engagement (vote, comment, share, save). */
  pEngage: number;
}

export const MAX_EXPECTED_DWELL_SEC = 30;

export function predictActions(counts: EngagementCounts, prior: TypePrior, m = PRIOR_STRENGTH): ActionPredictions {
  const n = Math.max(0, counts.impressions);
  const engaged = counts.votes + counts.comments + counts.shares + counts.saves;
  // Posts from before impression tracking can have more votes than impressions;
  // every engagement implies at least one view, so rates never exceed 1.
  const nEngage = Math.max(n, engaged, counts.profileTaps);
  const rate = (k: number, p: number) => Math.min(1, bayesianRate(k, nEngage, p, m));
  const viewRate = (k: number, p: number) => Math.min(1, bayesianRate(k, n, p, m));
  const expectedDwellSec = (Math.max(0, counts.dwellMsSum) / 1000 + prior.dwellSec * m) / (n + m);
  return {
    pVote: rate(counts.votes, prior.vote),
    pComment: rate(counts.comments, prior.comment),
    pShare: rate(counts.shares, prior.share),
    pSave: rate(counts.saves, prior.save),
    pProfileTap: rate(counts.profileTaps, prior.profileTap),
    pLongDwell: viewRate(counts.longDwell, prior.longDwell),
    pSkip: viewRate(counts.skips, prior.skip),
    // No prior: reports are rare and only ever push a post down.
    pReport: Math.min(1, Math.max(0, counts.reports) / (nEngage + m)),
    pCompletion: viewRate(counts.completions, prior.completion),
    pLoop: viewRate(counts.loops, prior.loop),
    expectedDwellSec: Math.min(MAX_EXPECTED_DWELL_SEC, expectedDwellSec),
    pEngage: rate(engaged, prior.vote + prior.comment + prior.share + prior.save),
  };
}

// ── Value function ──

export interface ValueWeights {
  dwellPerSec: number;
  longDwell: number;
  comment: number;
  share: number;
  vote: number;
  save: number;
  profileTap: number;
  completion: number;
  loop: number;
  skip: number;
  report: number;
}

/**
 * V(a) per action, starting from DEFAULT_PHOENIX_WEIGHTS and reordered per the
 * TikTok leak: time on screen is the strongest signal, then
 * comment > share > vote > save. Skip is negative and report a hard negative.
 * With default priors a post scores about 10; a strong one 40+.
 */
export const VALUE_WEIGHTS: ValueWeights = {
  dwellPerSec: 4,
  longDwell: 25,
  comment: DEFAULT_PHOENIX_WEIGHTS.comment * 6, // 30
  share: DEFAULT_PHOENIX_WEIGHTS.share * 5, // 20
  vote: 12,
  save: 10,
  profileTap: DEFAULT_PHOENIX_WEIGHTS.follow * 3, // 12
  completion: 0,
  loop: 0,
  skip: 20,
  report: -DEFAULT_PHOENIX_WEIGHTS.report * 12.5, // 1000: a 5% report rate zeroes any post
};

/** Reels: completion and loops dominate, as in TikTok's playtime terms. */
export const REEL_VALUE_WEIGHTS: ValueWeights = {
  ...VALUE_WEIGHTS,
  dwellPerSec: 1.5,
  longDwell: 10,
  completion: 60,
  loop: 90,
  skip: 30,
};

/** Floor keeps the score positive so the multipliers below stay monotonic. */
export const MIN_VALUE_SCORE = 0.5;

export function computeValueScore(p: ActionPredictions, w: ValueWeights = VALUE_WEIGHTS): number {
  const raw =
    p.expectedDwellSec * w.dwellPerSec +
    p.pLongDwell * w.longDwell +
    p.pComment * w.comment +
    p.pShare * w.share +
    p.pVote * w.vote +
    p.pSave * w.save +
    p.pProfileTap * w.profileTap +
    p.pCompletion * w.completion +
    p.pLoop * w.loop -
    p.pSkip * w.skip -
    p.pReport * w.report;
  return Math.max(MIN_VALUE_SCORE, raw);
}

/** 1.0 when new, ~0.21 at a day old, ~0.12 at three days. */
export function freshnessDecay(ageHours: number): number {
  const h = Math.max(0, Number.isFinite(ageHours) ? ageHours : 0);
  return ((h + 2) / 2) ** -0.6;
}

export type FollowRelation = "mutual" | "follow" | null;
export type Reach = "campus" | "nearby" | "far";

export function socialMultiplier(follow: FollowRelation, reach: Reach, isAnonymous: boolean): number {
  // Anonymous posts never get the follow boost: it would hint at who wrote them.
  const graph = isAnonymous ? 1 : follow === "mutual" ? 1.6 : follow === "follow" ? 1.35 : 1;
  const campus = reach === "campus" ? 1.3 : reach === "nearby" ? 1.1 : 1;
  return graph * campus;
}

export interface AffinityTarget {
  type: string;
  authorId?: string | null;
  isAnonymous?: boolean;
  communityId?: string | null;
  institutionId?: string | null;
  hashtags?: string[] | null;
}

/** Personal interest as a multiplier in [0.35, 2.2]; 1 when the vector knows nothing. */
export function affinityMultiplier(target: AffinityTarget, vector: InterestVector | null | undefined): number {
  const s = interestMatch(vector ?? EMPTY_INTEREST_VECTOR, target);
  return Math.min(2.2, Math.max(0.35, 1 + s));
}

// ── Traffic pools ──

export const TEST_POOL_IMPRESSIONS = 30;
export const TIER2_IMPRESSION_CAP = 300;
/** A post older than this with under 30 impressions has missed its test window. */
export const TEST_POOL_MAX_AGE_HOURS = 48;

export type TrafficTier = "test" | "tier1" | "tier2" | "tier3" | "decayed";

export function trafficTier(impressions: number, pEngage: number, medianEngage: number, ageHours: number): TrafficTier {
  if (impressions < TEST_POOL_IMPRESSIONS) return ageHours <= TEST_POOL_MAX_AGE_HOURS ? "test" : "tier1";
  if (pEngage < medianEngage) return "decayed";
  return impressions < TIER2_IMPRESSION_CAP ? "tier2" : "tier3";
}

const AUDIENCE: Record<Reach, Record<TrafficTier, number>> = {
  campus: { test: 1, tier1: 1, tier2: 1, tier3: 1, decayed: 0.5 },
  nearby: { test: 0.5, tier1: 0.6, tier2: 1, tier3: 1, decayed: 0.3 },
  far: { test: 0.35, tier1: 0.45, tier2: 0.6, tier3: 1, decayed: 0.25 },
};

/** How much of a post's score reaches this viewer, given its tier and distance. */
export function audienceMultiplier(tier: TrafficTier, reach: Reach): number {
  return AUDIENCE[reach][tier];
}

// ── Candidate scoring + slot assembly ──

export interface V3Candidate extends AffinityTarget {
  id: string;
  createdAt: Date | string;
  counts: EngagementCounts;
  follow?: FollowRelation;
  viewerVoted?: boolean;
  /** Editorial tier from feed-boosts: 1 organic, >1 promoted/pinned, <1 buried. */
  boostTier?: number;
  boostMultiplier?: number;
}

export interface V3Context {
  viewerProfileId?: string | null;
  viewerInstitutionId?: string | null;
  nearbyInstitutionIds?: string[];
  interest?: InterestVector | null;
  priors?: Record<string, TypePrior> | null;
  mode?: "feed" | "reels";
  now?: number;
}

export interface ScoredCandidate<T extends V3Candidate = V3Candidate> {
  item: T;
  score: number;
  tier: TrafficTier;
  reach: Reach;
  pEngage: number;
  affinity: number;
}

export function reachOf(institutionId: string | null | undefined, ctx: V3Context): Reach {
  if (!ctx.viewerInstitutionId) return "campus"; // no campus: everything is equally local
  if (institutionId && institutionId === ctx.viewerInstitutionId) return "campus";
  if (institutionId && ctx.nearbyInstitutionIds?.includes(institutionId)) return "nearby";
  return "far";
}

export function scoreCandidate<T extends V3Candidate>(c: T, ctx: V3Context): ScoredCandidate<T> {
  const now = ctx.now ?? Date.now();
  const prior = priorFor(ctx.priors, c.type);
  const p = predictActions(c.counts, prior);
  const weights = ctx.mode === "reels" ? REEL_VALUE_WEIGHTS : VALUE_WEIGHTS;
  const ageHours = (now - new Date(c.createdAt).getTime()) / 3_600_000;
  const reach = reachOf(c.institutionId, ctx);
  const tier = trafficTier(c.counts.impressions, p.pEngage, prior.medianEngage, ageHours);
  const affinity = affinityMultiplier(c, ctx.interest);

  let score =
    computeValueScore(p, weights) *
    freshnessDecay(ageHours) *
    socialMultiplier(c.follow ?? null, reach, Boolean(c.isAnonymous)) *
    affinity *
    audienceMultiplier(tier, reach);

  const boost = Number(c.boostMultiplier);
  if (Number.isFinite(boost) && boost > 0) score *= Math.min(25, Math.max(0.01, boost));
  if (c.viewerVoted) score *= 0.35;
  if (ctx.viewerProfileId && c.authorId === ctx.viewerProfileId) score *= 0.5;

  return { item: c, score, tier, reach, pEngage: p.pEngage, affinity };
}

/** 0-based slot indexes: a test-pool post at 4, 12, 20…; exploration at 5, 11, 17… (never collide). */
export const TEST_SLOT_EVERY = 8;
export const TEST_SLOT_OFFSET = 4;
export const EXPLORE_SLOT_EVERY = 6;
export const EXPLORE_SLOT_OFFSET = 5;
/** Greedy diversity only looks this far down the ranked list per slot. */
const DIVERSITY_WINDOW = 40;

export const V3_DIVERSITY: DiversityOptions = {
  adjacentSameTypePenalty: 0.85,
  adjacentSameCommunityPenalty: 0.8,
  recentHashtagPenalty: 0.85,
};

function byScore(a: ScoredCandidate, b: ScoredCandidate): number {
  if (b.score !== a.score) return b.score - a.score;
  const ta = new Date(a.item.createdAt).getTime();
  const tb = new Date(b.item.createdAt).getTime();
  if (tb !== ta) return tb - ta;
  return a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0;
}

/**
 * Score, then assemble the first `count` slots:
 * - editorial PIN/PROMOTE tiers first, BURY last (as in v2);
 * - a same-campus test-pool post at every 8th slot;
 * - an out-of-interest, high-P̂ exploration post at every 6th slot;
 * - every other slot is the best remaining post after diversity penalties.
 * Deterministic for the same inputs, so offset pagination stays stable.
 */
export function rankCandidatesV3<T extends V3Candidate>(candidates: T[], ctx: V3Context, count = candidates.length): T[] {
  const scored = candidates.map((c) => scoreCandidate(c, ctx));
  const promoted = scored.filter((s) => (s.item.boostTier ?? 1) > 1);
  const buried = scored.filter((s) => (s.item.boostTier ?? 1) < 1).sort(byScore);
  const organic = scored.filter((s) => (s.item.boostTier ?? 1) === 1).sort(byScore);
  promoted.sort((a, b) => (b.item.boostTier ?? 1) - (a.item.boostTier ?? 1) || byScore(a, b));

  const out: T[] = promoted.map((s) => s.item);
  const placed = new Set(out.map((i) => i.id));
  const recent: T[] = [...out];
  const authorCounts = new Map<string, number>();
  for (const i of out) if (i.authorId) authorCounts.set(i.authorId, (authorCounts.get(i.authorId) || 0) + 1);

  const take = (s: ScoredCandidate<T>) => {
    out.push(s.item);
    placed.add(s.item.id);
    recent.push(s.item);
    if (s.item.authorId) authorCounts.set(s.item.authorId, (authorCounts.get(s.item.authorId) || 0) + 1);
  };

  const hasCampus = Boolean(ctx.viewerInstitutionId);
  const isTestSlot = (i: number) => hasCampus && i % TEST_SLOT_EVERY === TEST_SLOT_OFFSET;
  const isExploreSlot = (i: number) => i % EXPLORE_SLOT_EVERY === EXPLORE_SLOT_OFFSET;
  const outOfInterest = (s: ScoredCandidate<T>) => s.affinity <= 1 && s.tier !== "decayed";

  while (out.length < count) {
    const slot = out.length;
    let pick: ScoredCandidate<T> | undefined;

    if (isTestSlot(slot)) {
      // Best-scoring unplaced same-campus post still in its test pool.
      pick = organic.find((s) => !placed.has(s.item.id) && s.tier === "test" && s.reach === "campus");
    } else if (isExploreSlot(slot) && ctx.interest && ctx.interest.evidence + ctx.interest.seedWeight > 0) {
      // Highest P̂(engage) outside the viewer's known interests.
      let best: ScoredCandidate<T> | undefined;
      for (const s of organic) {
        if (placed.has(s.item.id) || !outOfInterest(s)) continue;
        if (!best || s.pEngage > best.pEngage || (s.pEngage === best.pEngage && s.score > best.score)) best = s;
      }
      pick = best;
    }

    if (!pick) {
      let bestAdj = -Infinity;
      let scanned = 0;
      const window = recent.slice(-3);
      for (const s of organic) {
        if (placed.has(s.item.id)) continue;
        const adj = s.score * diversityMultiplier(s.item, window, authorCounts, V3_DIVERSITY);
        if (adj > bestAdj) {
          bestAdj = adj;
          pick = s;
        }
        if (++scanned >= DIVERSITY_WINDOW) break;
      }
    }

    if (!pick) pick = buried.find((s) => !placed.has(s.item.id));
    if (!pick) break;
    take(pick);
  }

  return out.slice(0, count);
}
