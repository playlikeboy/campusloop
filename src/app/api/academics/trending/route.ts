import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { academicResources } from "@/db/schema";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

/**
 * Lightweight trending feed used by academic-context-rail.tsx's "Popular this week" widget
 * (previously hardcoded mock data) and the Trending tab/sort on the academics hub.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "campus";
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "10", 10)), 20);

    let user = null;
    try {
      user = await getCachedAuthUser();
    } catch {}
    const profile = user ? await getCachedUserProfile(user.id) : null;
    const userInstitutionId = profile?.institutionId || "inst_35df75700bb23dd30311ef5f";

    const db = getDb();
    const conditions = [];
    if (scope === "campus" && userInstitutionId) {
      conditions.push(eq(academicResources.institutionId, userInstitutionId));
    }

    const trendingScore = sql<number>`(${academicResources.upvotesCount} * 3 + ${academicResources.viewsCount} + ${academicResources.downloadsCount} * 2) / POWER(EXTRACT(EPOCH FROM (now() - ${academicResources.createdAt})) / 3600 + 2, 1.5)`;

    const items = await db
      .select({
        id: academicResources.id,
        title: academicResources.title,
        subjectCode: academicResources.subjectCode,
        subjectName: academicResources.subjectName,
        resourceType: academicResources.resourceType,
        viewsCount: academicResources.viewsCount,
        upvotesCount: academicResources.upvotesCount,
        createdAt: academicResources.createdAt,
      })
      .from(academicResources)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(trendingScore))
      .limit(limit);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching trending academic resources:", error);
    return NextResponse.json({ items: [] });
  }
}
