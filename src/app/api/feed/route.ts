import { eq, inArray, lt, or, type SQL, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { posts, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { formatApiFeedPosts, normalizeApiFeedSort, resolveFeedPage } from "@/lib/feed";
import { getShowSeededPosts } from "@/lib/platform-config";
import { getRankingVariant } from "@/lib/recommendations/experiments";
import { EMPTY_AFFINITY, getViewerAffinity } from "@/lib/recommendations/viewer-affinity";
import { IsolateCache } from "@/lib/isolate-cache";
import { getRedis } from "@/lib/redis";
import { isViewerProfile } from "@/lib/viewer";

export const dynamic = "force-dynamic";

type FeedProfile = {
  id: string;
  institutionId: string | null;
  feedVisibility: string | null;
  targetInstitutionIds: string[];
};

// Profile fields the feed needs change rarely; the anonymity toggle also sends
// `visibility` explicitly, so a 60s isolate cache is safe and saves a round trip.
const profileCache = new IsolateCache<FeedProfile | null>(60_000);

/** Ranked sorts that take longer than this fall back to the chronological feed. */
const RANKED_BUDGET_MS = 5000;

/** Logged-out responses are identical for everyone, so they are edge-cached briefly. */
const ANON_EDGE_TTL_SECONDS = 30;

// Redis rather than the Cache API: with Smart Placement, requests run in many
// colos and the Cache API is per-colo, so it almost never hit.
const anonMemo = new IsolateCache<string>(ANON_EDGE_TTL_SECONDS * 1000, 200);

export async function GET(req: Request) {
  const started = performance.now();
  const marks: string[] = [];
  const mark = (name: string, since: number) => marks.push(`${name};dur=${Math.round(performance.now() - since)}`);

  try {
    // Independent of the viewer: start it alongside auth.
    const showSeededPromise = getShowSeededPosts();

    let user = null;
    const tAuth = performance.now();
    try {
      user = await hexclaveServerApp.getUser();
    } catch {
      // Unauthenticated or public viewer
    }
    mark("auth", tAuth);

    const url = new URL(req.url);
    const isCacheableAnon =
      !user &&
      !url.searchParams.get("seenIds") &&
      !url.searchParams.get("excludeIds") &&
      !req.headers.get("x-seen-ids");
    const anonKey = isCacheableAnon ? `feed:anon:v1:${url.search}` : null;
    if (anonKey) {
      let body = anonMemo.get(anonKey);
      if (!body) {
        body = (await getRedis()?.get<string>(anonKey).catch(() => null)) ?? undefined;
        if (body && typeof body !== "string") body = JSON.stringify(body);
        if (body) anonMemo.set(anonKey, body);
      }
      if (body) {
        return new Response(body, {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, s-maxage=${ANON_EDGE_TTL_SECONDS}`,
            "X-Feed-Cache": "HIT",
          },
        });
      }
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") as "CAMPUS" | "GLOBAL" | null;
    const type = searchParams.get("type");
    const sort = normalizeApiFeedSort(searchParams.get("sort"));
    const visibility = searchParams.get("visibility");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(Math.max(1, Number(searchParams.get("limit")) || 20), 50);
    const offset = (page - 1) * limit;
    const hashtag = searchParams.get("hashtag");

    const rawSeed = searchParams.get("seed");
    const parsedSeed = rawSeed === null ? undefined : Number(rawSeed);
    const seed = Number.isFinite(parsedSeed) ? Math.trunc(parsedSeed as number) : undefined;

    // A scroll session keeps the same membership snapshot, preventing new posts
    // from pushing older results between page requests.
    const beforeParam = searchParams.get("before");

    const db = getDb();

    let profileId: string | null = null;
    let institutionId: string | null = null;
    let userFeedVisibility: string | null = null;
    let targetInstitutionIds: string[] = [];

    if (user) {
      const tProfile = performance.now();
      let profile = profileCache.get(user.id);
      if (profile === undefined) {
        const row = await db.query.userProfiles.findFirst({
          where: eq(userProfiles.userId, user.id),
          columns: { id: true, institutionId: true, feedVisibility: true, targetInstitutionIds: true },
        });
        profile = row
          ? {
              id: row.id,
              institutionId: row.institutionId,
              feedVisibility: row.feedVisibility,
              targetInstitutionIds: (row.targetInstitutionIds as string[]) || [],
            }
          : null;
        profileCache.set(user.id, profile);
      }
      mark("profile", tProfile);
      if (profile) {
        profileId = profile.id;
        institutionId = profile.institutionId;
        userFeedVisibility = profile.feedVisibility;
        targetInstitutionIds = (profile.targetInstitutionIds as string[]) || [];
      }
    }

    const tCtx = performance.now();
    const [isViewer, showSeeded, affinity] = await Promise.all([
      institutionId ? isViewerProfile({ institutionId }) : Promise.resolve(false),
      showSeededPromise,
      getViewerAffinity(profileId),
    ]);
    mark("context", tCtx);
    const conditions: SQL[] = [eq(posts.status, "PUBLISHED")];

    // Blocks are a visibility rule, not a ranking signal: either direction removes the author.
    if (affinity.blockedUserIds.length > 0) {
      conditions.push(
        sql`(${posts.authorId} is null or ${posts.authorId} not in (${sql.join(
          affinity.blockedUserIds.map((id) => sql`${id}`),
          sql`, `
        )}))`
      );
    }
    if (!showSeeded) {
      conditions.push(eq(posts.isSeeded, false));
    }

    if (beforeParam) {
      const beforeDate = new Date(beforeParam);
      if (!Number.isNaN(beforeDate.getTime())) {
        conditions.push(lt(posts.createdAt, beforeDate));
      }
    }

    if (scope === "CAMPUS") {
      if (isViewer && targetInstitutionIds.length > 0) {
        conditions.push(inArray(posts.institutionId, targetInstitutionIds));
      } else if (institutionId && !isViewer) {
        conditions.push(eq(posts.institutionId, institutionId));
      }
    }

    const excludeIdsParam = searchParams.get("excludeIds");
    const seenIdsParam = searchParams.get("seenIds") || req.headers.get("x-seen-ids");

    const combinedSeenIds: string[] = [];
    if (excludeIdsParam) {
      combinedSeenIds.push(
        ...excludeIdsParam
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && /^[a-zA-Z0-9_-]+$/.test(s))
      );
    }
    if (seenIdsParam) {
      combinedSeenIds.push(
        ...seenIdsParam
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && /^[a-zA-Z0-9_-]+$/.test(s))
      );
    }

    const uniqueSeenIds = Array.from(new Set(combinedSeenIds))
      .filter((id) => /^[a-zA-Z0-9_-]+$/.test(id))
      .slice(0, 500);

    if (uniqueSeenIds.length > 0) {
      conditions.push(
        sql`${posts.id} NOT IN (${sql.join(
          uniqueSeenIds.map((eid) => sql`${eid}`),
          sql`, `
        )})`
      );
    }

    if (sort === "memes" || (type && (type === "MEME" || type === "memes"))) {
      conditions.push(eq(posts.type, "MEME"));
    } else if (type === "MEDIA" || type === "media") {
      conditions.push(
        sql`(${posts.body} ILIKE '%![%http%' OR ${posts.body} ILIKE '%.jpg%' OR ${posts.body} ILIKE '%.png%' OR ${posts.body} ILIKE '%.webp%')`
      );
    } else if (type && type !== "ALL" && type !== "all") {
      conditions.push(eq(posts.type, type as (typeof posts.type.enumValues)[number]));
    }

    // Confessions are by definition anonymous; never block them due to visibility filter
    if (type !== "CONFESSION") {
      const explicitVisibility = visibility && visibility !== "all" ? visibility : null;
      const effectiveVisibility =
        explicitVisibility || (userFeedVisibility === "NON_ANONYMOUS" ? "non_anonymous" : "all");

      if (effectiveVisibility === "anonymous") {
        conditions.push(eq(posts.isAnonymous, true));
      } else if (
        effectiveVisibility === "public" ||
        effectiveVisibility === "non_anonymous" ||
        effectiveVisibility === "NON_ANONYMOUS"
      ) {
        conditions.push(eq(posts.isAnonymous, false));
      }
    }

    if (hashtag) {
      const cleanHashtag = decodeURIComponent(hashtag).replace(/^#/, "").trim();
      if (cleanHashtag) {
        const hashtagCondition = or(
          sql`${posts.body} ILIKE ${`%#${cleanHashtag}%`}`,
          sql`${posts.body} ILIKE ${`%#%${cleanHashtag}%`}`,
          sql`${posts.body} ILIKE ${`%${cleanHashtag}%`}`
        );
        if (hashtagCondition) {
          conditions.push(hashtagCondition);
        }
      }
    }

    const authorId = searchParams.get("authorId");
    const authorUsername = searchParams.get("authorUsername");

    if (authorId) {
      conditions.push(eq(posts.authorId, authorId));
      conditions.push(eq(posts.isAnonymous, false));
    } else if (authorUsername) {
      const targetUser = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.username, authorUsername.toLowerCase().trim()),
      });
      if (targetUser) {
        conditions.push(eq(posts.authorId, targetUser.id));
        conditions.push(eq(posts.isAnonymous, false));
      }
    }

    const pageOptions = {
      conditions,
      limit,
      offset,
      userInstitutionId: scope === "GLOBAL" ? null : institutionId,
      seenIds: uniqueSeenIds,
      viewerProfileId: profileId,
      seed,
      // Control arm keeps safety filtering but ranks without learned preferences.
      affinity:
        getRankingVariant(profileId) === "personalized"
          ? affinity
          : { ...EMPTY_AFFINITY, blockedUserIds: affinity.blockedUserIds },
    };
    // Ranking is an enhancement: if a scored sort fails, serve the
    // chronological feed rather than an empty timeline.
    const tRank = performance.now();
    // A ranked sort gets a time budget; past it, the chronological query answers instead.
    const ranked =
      sort === "latest"
        ? resolveFeedPage({ ...pageOptions, sort })
        : Promise.race([
            resolveFeedPage({ ...pageOptions, sort }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`ranked feed exceeded ${RANKED_BUDGET_MS}ms`)), RANKED_BUDGET_MS)
            ),
          ]);
    const rawFeed = await ranked.catch((error) => {
      if (sort === "latest") throw error;
      console.error(`Ranked feed (${sort}) failed, falling back to latest:`, error);
      marks.push("fallback;desc=latest");
      return resolveFeedPage({ ...pageOptions, sort: "latest" });
    });
    mark("rank", tRank);
    const tFormat = performance.now();
    const feed = await formatApiFeedPosts(rawFeed, profileId);
    mark("format", tFormat);
    mark("total", started);

    const response = NextResponse.json(feed);
    response.headers.set("Server-Timing", marks.join(", "));
    if (anonKey) {
      response.headers.set("Cache-Control", `public, s-maxage=${ANON_EDGE_TTL_SECONDS}`);
      response.headers.set("X-Feed-Cache", "MISS");
      const body = JSON.stringify(feed);
      anonMemo.set(anonKey, body);
      await getRedis()
        ?.set(anonKey, body, { ex: ANON_EDGE_TTL_SECONDS })
        .catch(() => {});
    } else {
      response.headers.set("Cache-Control", "private, no-store");
    }
    return response;
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
