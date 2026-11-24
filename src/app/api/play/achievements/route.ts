import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { listAchievements, syncAchievementsSafe } from "@/lib/play/server/achievements";
import { requirePlayer, serverError } from "@/lib/play/server/context";

export const dynamic = "force-dynamic";

/**
 * GET /api/play/achievements: your badges (checks for new ones first).
 * ?profileId=… returns another student's earned badges only.
 * ?sync=0 skips the check for new badges (used by the profile card).
 */
export async function GET(req: Request) {
  try {
    const auth = await requirePlayer();
    if (!auth.ok) return auth.response;
    const params = new URL(req.url).searchParams;
    const profileId = params.get("profileId");

    if (profileId && profileId !== auth.profile.id) {
      const target = await getDb().query.userProfiles.findFirst({
        where: eq(userProfiles.id, profileId),
        columns: { id: true, status: true },
      });
      if (!target || target.status !== "ACTIVE") return NextResponse.json({ earned: [], newBadges: [] });
      return NextResponse.json({ earned: await listAchievements(profileId), newBadges: [], isOwn: false });
    }

    const newBadges = params.get("sync") === "0" ? [] : await syncAchievementsSafe(auth.profile);
    const earned = await listAchievements(auth.profile.id);
    return NextResponse.json(
      { earned, newBadges, isOwn: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return serverError("GET achievements", e);
  }
}
