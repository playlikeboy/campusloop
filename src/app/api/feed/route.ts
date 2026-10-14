import { eq, inArray, lt, or, type SQL, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { posts, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { formatApiFeedPosts, normalizeApiFeedSort, resolveFeedPage } from "@/lib/feed";
import { getShowSeededPosts } from "@/lib/platform-config";
import { isViewerProfile } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    let user = null;
    try {
      user = await hexclaveServerApp.getUser();
    } catch {
      // Unauthenticated or public viewer
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
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
      });
      if (profile) {
        profileId = profile.id;
        institutionId = profile.institutionId;
        userFeedVisibility = profile.feedVisibility;
        targetInstitutionIds = (profile.targetInstitutionIds as string[]) || [];
      }
    }

    const isViewer = institutionId ? await isViewerProfile({ institutionId }) : false;
    const showSeeded = await getShowSeededPosts();
    const conditions: SQL[] = [eq(posts.status, "PUBLISHED")];
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

    const rawFeed = await resolveFeedPage({
      conditions,
      sort,
      limit,
      offset,
      userInstitutionId: scope === "GLOBAL" ? null : institutionId,
      seenIds: uniqueSeenIds,
      viewerProfileId: profileId,
      seed,
    });
    const feed = await formatApiFeedPosts(rawFeed, profileId);
    return NextResponse.json(feed);
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
