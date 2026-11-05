import { and, desc, eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { stories, storyHighlights } from "@/db/schema";
import { parseBefore, parseLimit } from "@/lib/pagination";
import { requireProfile } from "@/lib/require-profile";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireProfile({ profileStatus: 403 });
    if (!auth.ok) return auth.response;
    const { profile } = auth;

    const { searchParams } = new URL(req.url);
    const limit = parseLimit(searchParams, 100, 200);
    const before = parseBefore(searchParams);

    const db = getDb();

    // Newest slice of the user's stories; `?before=` pages further back
    const userStories = await db.query.stories.findMany({
      where: and(eq(stories.userId, profile.id), before ? lt(stories.createdAt, before) : undefined),
      orderBy: [desc(stories.createdAt)],
      limit,
      with: {
        likes: true,
      },
    });

    // Also fetch user's highlights to see which stories are currently highlighted
    const highlights = await db.query.storyHighlights.findMany({
      where: eq(storyHighlights.userId, profile.id),
      limit: 100,
    });

    const highlightedStoryIds = new Set<string>();
    for (const h of highlights) {
      for (const sid of h.storyIds || []) {
        highlightedStoryIds.add(sid);
      }
    }

    const now = new Date();
    const formatted = userStories.map((s) => ({
      id: s.id,
      mediaUrl: s.mediaUrl,
      text: s.text,
      backgroundColor: s.backgroundColor,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isExpired: new Date(s.expiresAt) <= now,
      likesCount: s.likes?.length || 0,
      isHighlighted: highlightedStoryIds.has(s.id),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching story archive:", error);
    return NextResponse.json({ error: "Failed to fetch story archive" }, { status: 500 });
  }
}
