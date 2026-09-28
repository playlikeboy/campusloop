import { eq, or, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { articles } from "@/db/schema";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const db = getDb();

    const article = await db.query.articles.findFirst({
      where: or(eq(articles.slug, slug), eq(articles.id, slug)),
      columns: { id: true, status: true },
    });

    if (!article || article.status !== "PUBLISHED") {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    // Atomic increment of article view count
    await db
      .update(articles)
      .set({ viewsCount: sql`${articles.viewsCount} + 1` })
      .where(eq(articles.id, article.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/articles/[slug]/view error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
