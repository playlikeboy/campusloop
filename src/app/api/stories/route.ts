import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { follows, stories } from "@/db/schema";
import { requireProfile } from "@/lib/require-profile";
import { getRankingVariant } from "@/lib/recommendations/experiments";
import { getViewerAffinity } from "@/lib/recommendations/viewer-affinity";
import { rankAndFilterStories, STORY_AUTHOR_COLUMNS } from "@/lib/stories-ranker";
import { rejectViewerWrite } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireProfile({ profileStatus: 403 });
    if (!auth.ok) return auth.response;
    const { profile } = auth;

    const db = getDb();

    const now = new Date();

    // 1. Who the viewer follows, plus learned closeness and blocks
    const [userFollows, affinity] = await Promise.all([
      db.query.follows.findMany({
        where: eq(follows.followerId, profile.id),
      }),
      getViewerAffinity(profile.id),
    ]);

    // 2. Active stories from self and followings only, with public author fields
    const authorIds = [profile.id, ...userFollows.map((f) => f.followingId)];
    const activeStories = await db.query.stories.findMany({
      where: and(gt(stories.expiresAt, now), inArray(stories.userId, authorIds)),
      orderBy: [desc(stories.createdAt)],
      limit: 500,
      with: {
        user: { columns: STORY_AUTHOR_COLUMNS },
      },
    });

    const followingIds = userFollows.map((f) => f.followingId);
    const friendIds = userFollows.filter((f) => f.isMutual).map((f) => f.followingId);

    // 3. Rank and filter: Friends prioritized first, then general followings, only show followings + self
    const rankedResult = rankAndFilterStories({
      viewerProfileId: profile.id,
      activeStories,
      followingIds,
      friendIds,
      engagedAuthorIds: getRankingVariant(profile.id) === "personalized" ? affinity.engagedAuthorIds : [],
      blockedUserIds: affinity.blockedUserIds,
    });

    return NextResponse.json(rankedResult);
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireProfile({ profileStatus: 403 });
    if (!auth.ok) return auth.response;
    const { profile } = auth;

    const db = getDb();

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    const data = await req.json();
    const { text, backgroundColor, mediaUrl } = data as {
      text?: string;
      backgroundColor?: string;
      mediaUrl?: string;
    };

    if (!text && !mediaUrl) {
      return NextResponse.json({ error: "Story content cannot be empty" }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const [newStory] = await db
      .insert(stories)
      .values({
        userId: profile.id,
        text: text || null,
        // ds-allow: user-persisted story background class string
        backgroundColor: backgroundColor || "from-stone-900 to-neutral-900",
        mediaUrl: mediaUrl || null,
        expiresAt,
      })
      .returning();

    return NextResponse.json(newStory, { status: 201 });
  } catch (error) {
    console.error("Error creating story:", error);
    return NextResponse.json({ error: "Failed to create story" }, { status: 500 });
  }
}
