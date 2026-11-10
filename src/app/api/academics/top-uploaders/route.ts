import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { academicResources, userProfiles } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * Top academic contributors leaderboard — same shape/pattern as /api/articles/top-authors,
 * used by academic-context-rail.tsx's "Top Contributors" card (gamification / social proof).
 */
export async function GET() {
  try {
    const db = getDb();

    const topUploaders = await db
      .select({
        id: userProfiles.id,
        username: userProfiles.username,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        points: userProfiles.points,
        uploadCount: sql<number>`COUNT(${academicResources.id})::int`,
        totalUpvotes: sql<number>`COALESCE(SUM(${academicResources.upvotesCount}), 0)::int`,
      })
      .from(academicResources)
      .innerJoin(userProfiles, eq(academicResources.uploaderId, userProfiles.id))
      .groupBy(userProfiles.id, userProfiles.username, userProfiles.displayName, userProfiles.avatarUrl, userProfiles.points)
      .orderBy(
        sql`COUNT(${academicResources.id}) DESC`,
        sql`COALESCE(SUM(${academicResources.upvotesCount}), 0) DESC`,
        desc(userProfiles.points)
      )
      .limit(8);

    return NextResponse.json({ uploaders: topUploaders });
  } catch (error) {
    console.error("GET /api/academics/top-uploaders error:", error);
    return NextResponse.json({ uploaders: [] });
  }
}
