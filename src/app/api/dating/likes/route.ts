import { and, eq, inArray, notInArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { swipes, userProfiles } from "@/db/schema";
import { requireProfile } from "@/lib/require-profile";
import { rejectViewerWrite } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * Who liked you — the classic dating-app teaser panel.
 * Returns students who LIKEd the current user and are still waiting for an
 * answer (the user hasn't swiped on them yet). One tap to like back = match.
 */
export async function GET() {
  try {
    const auth = await requireProfile({ profileStatus: 403 });
    if (!auth.ok) return auth.response;
    const { profile } = auth;

    const db = getDb();

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    const [likedMeRows, mySwipes] = await Promise.all([
      db
        .select({ id: swipes.swiperId })
        .from(swipes)
        .where(and(eq(swipes.targetId, profile.id), eq(swipes.direction, "LIKE"))),
      db.select({ id: swipes.targetId }).from(swipes).where(eq(swipes.swiperId, profile.id)),
    ]);

    const answered = new Set(mySwipes.map((s) => s.id));
    const pendingIds = likedMeRows.map((s) => s.id).filter((id) => !answered.has(id));

    if (pendingIds.length === 0) {
      return NextResponse.json({ likes: [] });
    }

    const admirers = await db.query.userProfiles.findMany({
      where: and(
        inArray(userProfiles.id, pendingIds),
        eq(userProfiles.status, "ACTIVE"),
        notInArray(userProfiles.id, [profile.id])
      ),
      with: { institution: true },
      limit: 30,
    });

    return NextResponse.json({
      likes: admirers.map((a) => ({
        id: a.id,
        displayName: a.displayName,
        username: a.username,
        avatarUrl: a.avatarUrl,
        photo: a.photos?.[0] ?? a.avatarUrl ?? null,
        year: a.year,
        institutionName: a.institution?.name?.split(",")[0] ?? null,
      })),
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
