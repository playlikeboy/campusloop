import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { articles, userProfiles } from "@/db/schema";
import { getViewerInstitutionId, VIEWER_INSTITUTION_SLUG } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const viewerId = await getViewerInstitutionId().catch(() => VIEWER_INSTITUTION_SLUG);

    const verifiedTier = sql`CASE 
      WHEN ${userProfiles.institutionId} IS NOT NULL 
       AND ${userProfiles.institutionId} != ${viewerId} 
       AND ${userProfiles.institutionId} != ${VIEWER_INSTITUTION_SLUG} 
      THEN 1 
      ELSE 0 
    END`;

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
      .orderBy(sql`${verifiedTier} DESC`, sql`COUNT(${articles.id}) DESC`, desc(userProfiles.points))
      .limit(6);

    return NextResponse.json({ authors: topAuthorsQuery });
  } catch (error) {
    console.error("GET /api/articles/top-authors error:", error);
    return NextResponse.json({ authors: [] });
  }
}
