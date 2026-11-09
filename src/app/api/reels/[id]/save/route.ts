import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { reelBookmarks } from "@/db/schema";
import { requireProfile } from "@/lib/require-profile";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: reelId } = await props.params;
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const { profile } = auth;

    const db = getDb();

    const existingBookmark = await db.query.reelBookmarks.findFirst({
      where: and(eq(reelBookmarks.reelId, reelId), eq(reelBookmarks.userId, profile.id)),
    });

    let isSaved = false;
    if (existingBookmark) {
      await db.delete(reelBookmarks).where(eq(reelBookmarks.id, existingBookmark.id));
      isSaved = false;
    } else {
      await db.insert(reelBookmarks).values({
        reelId,
        userId: profile.id,
      });
      isSaved = true;
    }

    return NextResponse.json({
      success: true,
      isSaved,
    });
  } catch (error) {
    console.error("[POST /api/reels/[id]/save error]:", error);
    return NextResponse.json({ error: "Failed to toggle bookmark" }, { status: 500 });
  }
}
