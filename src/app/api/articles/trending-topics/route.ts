import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();

    // Unnest tags from published articles and aggregate counts
    const tagsQuery = await db.execute<{ tag: string; count: number }>(sql`
      SELECT LOWER(elem) AS tag, COUNT(*)::int AS count
      FROM articles,
      jsonb_array_elements_text(COALESCE(articles.tags, '[]'::jsonb)) AS elem
      WHERE articles.status = 'PUBLISHED'
        AND TRIM(elem) != ''
      GROUP BY LOWER(elem)
      ORDER BY count DESC
      LIMIT 12;
    `);

    const topics = Array.isArray(tagsQuery)
      ? tagsQuery
      : (tagsQuery as any)?.rows || [];

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("GET /api/articles/trending-topics error:", error);
    return NextResponse.json({ topics: [] });
  }
}
