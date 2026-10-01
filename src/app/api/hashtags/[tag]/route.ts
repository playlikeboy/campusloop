import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { getHashtagTheme } from "@/lib/hashtag-meta";

interface RouteParams {
  params: Promise<{ tag: string }>;
}

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { tag: rawTag } = await params;
    const cleanTag = decodeURIComponent(rawTag).replace(/^#/, "").trim();

    if (!cleanTag) {
      return NextResponse.json({ error: "Invalid hashtag" }, { status: 400 });
    }

    const theme = getHashtagTheme(cleanTag);
    const db = getDb();
    const likePattern = `%#${cleanTag}%`;

    const getRows = <T>(res: unknown): T[] => (Array.isArray(res) ? (res as T[]) : (res as { rows?: T[] })?.rows || []);

    // 1. Total posts count
    const postsCountRes = await db.execute<{ count: number }>(sql`
      SELECT COUNT(*)::int AS count
      FROM posts
      WHERE status = 'PUBLISHED'
        AND is_seeded = FALSE
        AND body ILIKE ${likePattern};
    `);
    const postsCountRows = getRows<{ count: number }>(postsCountRes);

    // 2. Distinct colleges count
    const collegesCountRes = await db.execute<{ count: number }>(sql`
      SELECT COUNT(DISTINCT institution_id)::int AS count
      FROM posts
      WHERE status = 'PUBLISHED'
        AND is_seeded = FALSE
        AND body ILIKE ${likePattern};
    `);
    const collegesCountRows = getRows<{ count: number }>(collegesCountRes);

    // 3. Top colleges talking about this hashtag
    const topCollegesRes = await db.execute<{
      id: string;
      name: string;
      short_name: string | null;
      count: number;
    }>(sql`
      SELECT 
        i.id,
        i.name,
        i.short_name,
        COUNT(p.id)::int AS count
      FROM posts p
      JOIN institutions i ON p.institution_id = i.id
      WHERE p.status = 'PUBLISHED'
        AND p.is_seeded = FALSE
        AND p.body ILIKE ${likePattern}
      GROUP BY i.id, i.name, i.short_name
      ORDER BY count DESC
      LIMIT 4;
    `);
    const topCollegesRows = getRows<{
      id: string;
      name: string;
      short_name: string | null;
      count: number;
    }>(topCollegesRes);

    // 4. Media posts count (photos/attachments)
    const mediaCountRes = await db.execute<{ count: number }>(sql`
      SELECT COUNT(*)::int AS count
      FROM posts
      WHERE status = 'PUBLISHED'
        AND is_seeded = FALSE
        AND body ILIKE ${likePattern}
        AND (body ILIKE '%![%http%' OR body ILIKE '%.jpg%' OR body ILIKE '%.png%' OR body ILIKE '%.webp%');
    `);
    const mediaCountRows = getRows<{ count: number }>(mediaCountRes);

    const stats = {
      postsCount: postsCountRows[0]?.count ?? 0,
      collegesCount: collegesCountRows[0]?.count ?? 0,
      mediaPostsCount: mediaCountRows[0]?.count ?? 0,
      topColleges: topCollegesRows,
    };

    return NextResponse.json({
      theme,
      stats,
    });
  } catch (error) {
    console.error("Error fetching hashtag details:", error);
    return NextResponse.json(
      { error: "Failed to fetch hashtag details" },
      { status: 500 }
    );
  }
}
