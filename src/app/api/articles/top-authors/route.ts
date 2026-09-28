import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { articles, userProfiles } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();

    // Query top article authors with real published articles
    const topAuthorsQuery = await db
      .select({
        id: userProfiles.id,
        username: userProfiles.username,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        points: userProfiles.points,
        articleCount: sql<number>`COUNT(${articles.id})::int`,
        institutionId: userProfiles.institutionId,
      })
      .from(articles)
      .innerJoin(userProfiles, eq(articles.authorId, userProfiles.id))
      .where(eq(articles.status, "PUBLISHED"))
      .groupBy(
        userProfiles.id,
        userProfiles.username,
        userProfiles.displayName,
        userProfiles.avatarUrl,
        userProfiles.points,
        userProfiles.institutionId
      )
      .orderBy(sql`COUNT(${articles.id}) DESC`, desc(userProfiles.points))
      .limit(6);

    return NextResponse.json({ authors: topAuthorsQuery });
  } catch (error) {
    console.error("GET /api/articles/top-authors error:", error);
    return NextResponse.json({ authors: [] });
  }
}
