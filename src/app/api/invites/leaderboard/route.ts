import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { clampLeaderboardLimit, getInviteLeaderboard } from "@/lib/referrals/leaderboard";
import { getCachedAuthUser } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

/** GET /api/invites/leaderboard?scope=campus|all&limit=25 */
export async function GET(request: Request) {
  try {
    const user = await getCachedAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") === "all" ? "all" : "campus";
    const limit = clampLeaderboardLimit(searchParams.get("limit"));

    const profile = await getDb().query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
      columns: { id: true, username: true, institutionId: true, referralCount: true },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const leaders = await getInviteLeaderboard({
      institutionId: scope === "campus" ? profile.institutionId : null,
      limit,
    });

    return NextResponse.json({
      scope,
      leaders,
      me: { username: profile.username, invites: profile.referralCount },
    });
  } catch (error) {
    console.error("GET /api/invites/leaderboard error:", error);
    return NextResponse.json({ error: "Could not load the leaderboard." }, { status: 500 });
  }
}
