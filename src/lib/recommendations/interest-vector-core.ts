/**
 * Personal interest vector (pure part; DB and Redis live in interest-vector.ts).
 *
 * Per viewer, a weight in [-1, 1] for each post type, author, community,
 * hashtag and campus they have reacted to. Built from votes, comments, long
 * dwell, skips and profile taps, each decayed with a 14-day half-life, then
 * mixed with a cold-start seed (onboarding interests + swipe quiz) that fades
 * as real evidence accumulates.
 */

export interface InterestVector {
  types: Record<string, number>;
  authors: Record<string, number>;
  communities: Record<string, number>;
  hashtags: Record<string, number>;
  campuses: Record<string, number>;
  /** Decayed count of learned signals behind the vector. */
  evidence: number;
  /** How much of the cold-start seed is mixed in (0..1). */
  seedWeight: number;
}

export const EMPTY_INTEREST_VECTOR: InterestVector = {
  types: {},
  authors: {},
  communities: {},
  hashtags: {},
  campuses: {},
  evidence: 0,
  seedWeight: 0,
};

export const INTEREST_HALF_LIFE_DAYS = 14;
/** On screen at least this long counts as a long read. */
export const LONG_SIGNAL_DWELL_MS = 8000;
/** On screen less than this counts as a skip. */
export const SKIP_SIGNAL_DWELL_MS = 1200;
/** Learned signals at which the seed has faded to half strength. */
export const SEED_HALF_EVIDENCE = 20;
const MAX_KEYS_PER_DIMENSION = 40;

/** Signal weights (before time decay). */
export const INTEREST_SIGNAL_WEIGHTS = {
  upvote: 1,
  downvote: -1,
  comment: 3,
  longDwell: 2,
  dwell: 0.5,
  skip: -0.5,
  profileTap: 1.5,
  quizLike: 2,
  quizSkip: -1,
  onboardingInterest: 1.5,
} as const;

export interface InterestSignal {
  type?: string | null;
  authorId?: string | null;
  communityId?: string | null;
  institutionId?: string | null;
  hashtags?: string[] | null;
  weight: number;
  ageDays?: number;
}

export function decayWeight(ageDays: number, halfLifeDays = INTEREST_HALF_LIFE_DAYS): number {
  const age = Math.max(0, Number.isFinite(ageDays) ? ageDays : 0);
  return 0.5 ** (age / halfLifeDays);
}

const SAFE_KEY = /^[a-zA-Z0-9_-]{1,64}$/;

export function normalizeHashtag(tag: string): string {
  return tag.toLowerCase().replace(/^#/, "").replace(/[^a-z0-9_]/g, "").slice(0, 30);
}

function add(dim: Record<string, number>, key: string | null | undefined, w: number) {
  if (!key || !SAFE_KEY.test(key)) return;
  dim[key] = (dim[key] || 0) + w;
}

/** Scale to [-1, 1] by the largest magnitude and keep the strongest keys. */
function normalizeDimension(dim: Record<string, number>): Record<string, number> {
  const entries = Object.entries(dim).filter(([, v]) => Number.isFinite(v) && v !== 0);
  const max = entries.reduce((m, [, v]) => Math.max(m, Math.abs(v)), 0);
  if (max === 0) return {};
  return Object.fromEntries(
    entries
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, MAX_KEYS_PER_DIMENSION)
      .map(([k, v]) => [k, Number((v / max).toFixed(3))])
  );
}

export function buildInterestVector(signals: InterestSignal[]): InterestVector {
  const types: Record<string, number> = {};
  const authors: Record<string, number> = {};
  const communities: Record<string, number> = {};
  const hashtags: Record<string, number> = {};
  const campuses: Record<string, number> = {};
  let evidence = 0;

  for (const s of signals) {
    if (!Number.isFinite(s.weight) || s.weight === 0) continue;
    const decay = decayWeight(s.ageDays ?? 0);
    const w = s.weight * decay;
    evidence += decay;
    if (s.type && /^[A-Z_]+$/.test(s.type)) add(types, s.type, w);
    add(authors, s.authorId, w);
    add(communities, s.communityId, w);
    // Campus taste is weaker evidence than topic taste: halve it.
    add(campuses, s.institutionId, w * 0.5);
    for (const tag of (s.hashtags ?? []).slice(0, 5)) add(hashtags, normalizeHashtag(tag), w);
  }

  return {
    types: normalizeDimension(types),
    authors: normalizeDimension(authors),
    communities: normalizeDimension(communities),
    hashtags: normalizeDimension(hashtags),
    campuses: normalizeDimension(campuses),
    evidence: Number(evidence.toFixed(2)),
    seedWeight: 0,
  };
}

/** Seed strength left once `evidence` learned signals exist: 1 → 0.5 at 20 → ~0. */
export function seedStrength(evidence: number): number {
  return 1 / (1 + Math.max(0, evidence) / SEED_HALF_EVIDENCE);
}

function mergeDimension(a: Record<string, number>, b: Record<string, number>, bWeight: number) {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] || 0) + v * bWeight;
  for (const k of Object.keys(out)) out[k] = Math.max(-1, Math.min(1, Number(out[k].toFixed(3))));
  return out;
}

/** Learned vector plus the cold-start seed, scaled down as evidence grows. */
export function mergeWithSeed(learned: InterestVector, seed: InterestVector | null | undefined): InterestVector {
  if (!seed) return learned;
  const k = seedStrength(learned.evidence);
  return {
    types: mergeDimension(learned.types, seed.types, k),
    authors: mergeDimension(learned.authors, seed.authors, k),
    communities: mergeDimension(learned.communities, seed.communities, k),
    hashtags: mergeDimension(learned.hashtags, seed.hashtags, k),
    campuses: mergeDimension(learned.campuses, seed.campuses, k),
    evidence: learned.evidence,
    seedWeight: Number(k.toFixed(3)),
  };
}

/**
 * Onboarding interest labels ("Memes & Banter") to hashtags and post types.
 * Unknown labels become their own hashtag.
 */
const INTEREST_MAP: Record<string, { hashtags: string[]; types?: string[] }> = {
  "tech & coding": { hashtags: ["tech", "coding", "programming", "dev", "dsa"] },
  "late night tea": { hashtags: ["tea", "chai", "gossip", "latenight"], types: ["CONFESSION"] },
  "hostel life": { hashtags: ["hostel", "hostellife", "mess", "hosteldiaries"] },
  "campus dating": { hashtags: ["dating", "crush", "love"], types: ["CONFESSION"] },
  "gaming & esports": { hashtags: ["gaming", "esports", "bgmi", "valorant"] },
  "startups & ai": { hashtags: ["startup", "startups", "ai", "founders"] },
  "music & jamming": { hashtags: ["music", "jamming", "band"] },
  "exam prep": { hashtags: ["exam", "exams", "pyq", "study", "notes"], types: ["QUESTION"] },
  "sports & fitness": { hashtags: ["sports", "fitness", "gym", "cricket", "football"] },
  photography: { hashtags: ["photography", "photo", "clicks"] },
  "memes & banter": { hashtags: ["memes", "meme", "banter"], types: ["MEME"] },
  "cinema & tv": { hashtags: ["movies", "cinema", "tv", "series"] },
};

export function interestsToSignals(interests: string[]): InterestSignal[] {
  const signals: InterestSignal[] = [];
  for (const raw of interests.slice(0, 20)) {
    if (typeof raw !== "string") continue;
    const label = raw.trim().toLowerCase();
    if (!label) continue;
    const mapped = INTEREST_MAP[label];
    const hashtags = mapped?.hashtags ?? [normalizeHashtag(label.replace(/\s+/g, ""))].filter((t) => t.length >= 2);
    const w = INTEREST_SIGNAL_WEIGHTS.onboardingInterest;
    signals.push({ hashtags, weight: w });
    for (const type of mapped?.types ?? []) signals.push({ type, weight: w * 0.6 });
  }
  return signals;
}

export interface InterestTarget {
  type: string;
  authorId?: string | null;
  isAnonymous?: boolean;
  communityId?: string | null;
  institutionId?: string | null;
  hashtags?: string[] | null;
}

/**
 * How well a post matches the vector, roughly in [-1.25, 1.45].
 * 0 means no opinion. Anonymous authors never match (no author signal leaks).
 */
export function interestMatch(vector: InterestVector, target: InterestTarget): number {
  let s = 0.35 * (vector.types[target.type] ?? 0);
  if (target.authorId && !target.isAnonymous) s += 0.4 * (vector.authors[target.authorId] ?? 0);
  if (target.communityId) s += 0.25 * (vector.communities[target.communityId] ?? 0);
  if (target.institutionId) s += 0.15 * (vector.campuses[target.institutionId] ?? 0);
  const tags = (target.hashtags ?? []).map(normalizeHashtag);
  if (tags.length > 0) {
    let tagSum = 0;
    for (const t of tags) tagSum += vector.hashtags[t] ?? 0;
    s += 0.3 * Math.max(-1, Math.min(1, tagSum));
  }
  return s;
}
