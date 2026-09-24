import { eq, inArray, lt, type SQL, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { posts, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { formatApiFeedPosts, normalizeApiFeedSort, resolveFeedPage } from "@/lib/feed";
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
    const scopeParam = searchParams.get("scope");
    const typeParam = searchParams.get("type");
    const visibilityParam = searchParams.get("visibility");
    const sort = normalizeApiFeedSort(searchParams.get("sort"));

    if (scopeParam && !["CAMPUS", "GLOBAL"].includes(scopeParam)) {
      return NextResponse.json({ error: "Invalid feed scope." }, { status: 400 });
    }
    if (
      typeParam &&
      typeParam !== "ALL" &&
      typeParam !== "all" &&
      typeParam !== "memes" &&
      !posts.type.enumValues.includes(typeParam as (typeof posts.type.enumValues)[number])
    ) {
      return NextResponse.json({ error: "Invalid feed type." }, { status: 400 });
    }
    if (
      visibilityParam &&
      !["all", "anonymous", "public", "non_anonymous", "NON_ANONYMOUS"].includes(visibilityParam)
    ) {
      return NextResponse.json({ error: "Invalid feed visibility." }, { status: 400 });
    }

    const pageRaw = Number(searchParams.get("page"));
    const limitRaw = Number(searchParams.get("limit"));
    const page = Number.isInteger(pageRaw) && pageRaw > 0 ? Math.min(pageRaw, 10_000) : 1;
    const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 20;
    const scope = scopeParam as "CAMPUS" | "GLOBAL" | null;
    const type = typeParam;
    const visibility = visibilityParam;
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
    const conditions: SQL[] = [
      eq(posts.status, "PUBLISHED"),
      eq(posts.isSeeded, false),
    ];

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

    let combinedSeenIds: string[] = [];
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
      conditions.push(sql`${posts.id} NOT IN (${sql.join(uniqueSeenIds.map((eid) => sql`${eid}`), sql`, `)})`);
    }

    if (sort === "memes" || (type && (type === "MEME" || type === "memes"))) {
      conditions.push(eq(posts.type, "MEME"));
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
      conditions.push(sql`${posts.body} ILIKE ${`%#${cleanHashtag}%`}`);
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
