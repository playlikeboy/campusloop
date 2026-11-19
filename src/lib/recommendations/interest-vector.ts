import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { comments, posts, userBehaviorEvents, userProfiles, votes } from "@/db/schema";
import { getRedis } from "@/lib/redis";
import {
  buildInterestVector,
  EMPTY_INTEREST_VECTOR,
  INTEREST_SIGNAL_WEIGHTS,
  type InterestSignal,
  type InterestVector,
  interestsToSignals,
  mergeWithSeed,
  SKIP_SIGNAL_DWELL_MS,
  LONG_SIGNAL_DWELL_MS,
} from "@/lib/recommendations/interest-vector-core";

export * from "@/lib/recommendations/interest-vector-core";

/**
 * Personal interest vector: DB + Redis side. See interest-vector-core.ts for the model.
 *
 * The learned vector is computed inside viewer-affinity (and so shares its
 * 10-minute Redis cache). The cold-start seed lives under its own key for 60
 * days and is also written as one FEED_INTEREST_SEED behaviour event, so it
 * survives a Redis flush.
 */

const SEED_KEY = (profileId: string) => `feed:interest-seed:v1:${profileId}`;
const SEED_TTL_SECONDS = 60 * 24 * 60 * 60;
const SAFE_ID = /^[a-zA-Z0-9_-]{1,64}$/;

/** Up to 5 lowercase hashtags from a post body, extracted in SQL (no table access). */
export const postHashtagsSql = sql<string[]>`array(select distinct lower(m[1]) from regexp_matches(${posts.body}, '#([A-Za-z0-9_]{2,30})', 'g') as m limit 5)`;

type PostFacts = {
  type: string;
  authorId: string | null;
  communityId: string | null;
  institutionId: string | null;
  hashtags: string[] | null;
};

const postFactsColumns = {
  type: posts.type,
  // Anonymous authors are never learned, so the vector can't de-anonymise.
  authorId: sql<string | null>`case when ${posts.isAnonymous} then null else ${posts.authorId} end`,
  communityId: posts.communityId,
  institutionId: posts.institutionId,
  hashtags: postHashtagsSql,
};

async function loadPostFacts(ids: string[]): Promise<Map<string, PostFacts>> {
  const safe = [...new Set(ids.filter((id) => typeof id === "string" && SAFE_ID.test(id)))].slice(0, 100);
  if (safe.length === 0) return new Map();
  const rows = await getDb()
    .select({ id: posts.id, ...postFactsColumns })
    .from(posts)
    .where(inArray(posts.id, safe));
  return new Map(rows.map((r) => [r.id, r]));
}

export interface SeedSignals {
  likedPostIds?: string[];
  skippedPostIds?: string[];
  interests?: string[];
}

/** Pure part of the seed: post facts + labels to a vector. */
export function buildSeedVector(
  facts: Map<string, PostFacts>,
  signals: SeedSignals
): InterestVector {
  const out: InterestSignal[] = [];
  for (const id of signals.likedPostIds ?? []) {
    const f = facts.get(id);
    if (f) out.push({ ...f, weight: INTEREST_SIGNAL_WEIGHTS.quizLike });
  }
  for (const id of signals.skippedPostIds ?? []) {
    const f = facts.get(id);
    if (f) out.push({ ...f, weight: INTEREST_SIGNAL_WEIGHTS.quizSkip });
  }
  out.push(...interestsToSignals(signals.interests ?? []));
  const vector = buildInterestVector(out);
  return { ...vector, evidence: 0, seedWeight: 1 };
}

/**
 * Cold-start seed, called by onboarding after the swipe quiz (W5).
 * Signature is a stable contract: do not change it.
 *
 * Stores the seed (Redis + one behaviour event), drops the viewer's cached
 * affinity so the next feed request uses it, and returns the seed vector.
 * Never throws: a failure returns the empty vector.
 */
export async function seedInterestVector(
  profileId: string,
  signals: { likedPostIds?: string[]; skippedPostIds?: string[]; interests?: string[] }
): Promise<InterestVector> {
  if (!profileId || !SAFE_ID.test(profileId)) return EMPTY_INTEREST_VECTOR;
  const clean: SeedSignals = {
    likedPostIds: (signals?.likedPostIds ?? []).filter((id) => SAFE_ID.test(id)).slice(0, 50),
    skippedPostIds: (signals?.skippedPostIds ?? []).filter((id) => SAFE_ID.test(id)).slice(0, 50),
    interests: (signals?.interests ?? []).filter((s) => typeof s === "string").map((s) => s.slice(0, 60)).slice(0, 20),
  };

  try {
    const facts = await loadPostFacts([...(clean.likedPostIds ?? []), ...(clean.skippedPostIds ?? [])]);
    const seed = buildSeedVector(facts, clean);

    await Promise.all([
      getRedis()
        ?.set(SEED_KEY(profileId), seed, { ex: SEED_TTL_SECONDS })
        .catch(() => {}),
      getDb()
        .insert(userBehaviorEvents)
        .values({
          userId: profileId,
          eventType: "FEED_INTEREST_SEED",
          targetType: "USER",
          targetId: profileId,
          metadata: clean,
          weight: 1,
        })
        .catch((err) => console.warn("[interest-vector] seed event insert failed:", err)),
    ]);

    const { invalidateViewerAffinity } = await import("@/lib/recommendations/viewer-affinity");
    await invalidateViewerAffinity(profileId);
    return seed;
  } catch (error) {
    console.warn("[interest-vector] seedInterestVector failed:", error);
    return EMPTY_INTEREST_VECTOR;
  }
}

async function loadSeed(profileId: string): Promise<InterestVector | null> {
  try {
    const cached = await getRedis()?.get<InterestVector>(SEED_KEY(profileId));
    if (cached && typeof cached === "object" && cached.types) return { ...EMPTY_INTEREST_VECTOR, ...cached };
  } catch {
    // Fall back to the durable copy
  }
  const db = getDb();
  const [event, profile] = await Promise.all([
    db.query.userBehaviorEvents.findFirst({
      where: and(eq(userBehaviorEvents.userId, profileId), eq(userBehaviorEvents.eventType, "FEED_INTEREST_SEED")),
      columns: { metadata: true },
      orderBy: [desc(userBehaviorEvents.createdAt)],
    }),
    db.query.userProfiles.findFirst({ where: eq(userProfiles.id, profileId), columns: { interests: true } }),
  ]);
  const meta = (event?.metadata ?? {}) as SeedSignals;
  const interests = [...(meta.interests ?? []), ...((profile?.interests as string[] | undefined) ?? [])];
  const postIds = [...(meta.likedPostIds ?? []), ...(meta.skippedPostIds ?? [])];
  if (interests.length === 0 && postIds.length === 0) return null;
  const facts = await loadPostFacts(postIds);
  const seed = buildSeedVector(facts, { ...meta, interests: [...new Set(interests)] });
  getRedis()
    ?.set(SEED_KEY(profileId), seed, { ex: SEED_TTL_SECONDS })
    .catch(() => {});
  return seed;
}

/**
 * Learned vector (60 days of signals, 14-day half-life) merged with the seed.
 * Throws on DB failure; viewer-affinity catches and ranks without it.
 */
export async function computeInterestVector(profileId: string): Promise<InterestVector> {
  const db = getDb();
  const ageDays = (col: unknown) => sql<number>`(extract(epoch from (now() - ${col})) / 86400.0)::float8`;
  const dwellMsSql = sql<number>`coalesce((${userBehaviorEvents.metadata}->>'dwellMs')::int, 0)`;

  const [voteRows, commentRows, dwellRows, tapRows, seed] = await Promise.all([
    db
      .select({ ...postFactsColumns, value: votes.value, ageDays: ageDays(votes.createdAt) })
      .from(votes)
      .innerJoin(posts, eq(votes.postId, posts.id))
      .where(and(eq(votes.userId, profileId), gt(votes.createdAt, sql`now() - interval '60 days'`)))
      .orderBy(desc(votes.createdAt))
      .limit(300),
    db
      .select({ ...postFactsColumns, ageDays: ageDays(comments.createdAt) })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(and(eq(comments.authorId, profileId), gt(comments.createdAt, sql`now() - interval '60 days'`)))
      .orderBy(desc(comments.createdAt))
      .limit(200),
    db
      .select({ ...postFactsColumns, dwellMs: dwellMsSql, ageDays: ageDays(userBehaviorEvents.createdAt) })
      .from(userBehaviorEvents)
      .innerJoin(posts, eq(posts.id, userBehaviorEvents.targetId))
      .where(
        and(
          eq(userBehaviorEvents.userId, profileId),
          eq(userBehaviorEvents.eventType, "POST_DWELL"),
          gt(userBehaviorEvents.createdAt, sql`now() - interval '30 days'`)
        )
      )
      .orderBy(desc(userBehaviorEvents.createdAt))
      .limit(400),
    db
      .select({ targetId: userBehaviorEvents.targetId, ageDays: ageDays(userBehaviorEvents.createdAt) })
      .from(userBehaviorEvents)
      .where(
        and(
          eq(userBehaviorEvents.userId, profileId),
          eq(userBehaviorEvents.eventType, "PROFILE_VISIT"),
          gt(userBehaviorEvents.createdAt, sql`now() - interval '30 days'`)
        )
      )
      .orderBy(desc(userBehaviorEvents.createdAt))
      .limit(100),
    loadSeed(profileId).catch(() => null),
  ]);

  const signals: InterestSignal[] = [];
  const W = INTEREST_SIGNAL_WEIGHTS;
  for (const r of voteRows) {
    signals.push({ ...r, weight: Number(r.value) > 0 ? W.upvote : W.downvote, ageDays: Number(r.ageDays) });
  }
  for (const r of commentRows) signals.push({ ...r, weight: W.comment, ageDays: Number(r.ageDays) });
  for (const r of dwellRows) {
    const ms = Number(r.dwellMs) || 0;
    const weight = ms >= LONG_SIGNAL_DWELL_MS ? W.longDwell : ms < SKIP_SIGNAL_DWELL_MS ? W.skip : ms >= 2500 ? W.dwell : 0;
    if (weight !== 0) signals.push({ ...r, weight, ageDays: Number(r.ageDays) });
  }
  for (const r of tapRows) {
    if (r.targetId && r.targetId !== profileId) {
      signals.push({ authorId: r.targetId, weight: W.profileTap, ageDays: Number(r.ageDays) });
    }
  }

  return mergeWithSeed(buildInterestVector(signals), seed);
}
