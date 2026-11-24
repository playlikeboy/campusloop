import { NextResponse } from "next/server";
import { syncAchievementsSafe } from "@/lib/play/server/achievements";
import { badRequest, getBlockedIds, requirePlayer, serverError } from "@/lib/play/server/context";
import { enterDp, getDpState, withdrawDp } from "@/lib/play/server/dp";

export const dynamic = "force-dynamic";

/** GET /api/play/dp: your entry, this week's campus leaderboard and last week's top 3. */
export async function GET() {
  try {
    const auth = await requirePlayer();
    if (!auth.ok) return auth.response;
    const blocked = await getBlockedIds(auth.profile.id);
    return NextResponse.json(await getDpState(auth.profile, blocked));
  } catch (e) {
    return serverError("GET dp", e);
  }
}

/** POST /api/play/dp { confirm: true }: enter this week with your current profile photo. */
export async function POST(req: Request) {
  try {
    const auth = await requirePlayer({ write: true });
    if (!auth.ok) return auth.response;
    const body = (await req.json().catch(() => ({}))) as { confirm?: unknown };
    if (body.confirm !== true) return badRequest("Confirm that you want to enter your DP.");
    const result = await enterDp(auth.profile);
    if (!result.ok) return badRequest(result.error, result.status);
    const newBadges = await syncAchievementsSafe(auth.profile);
    return NextResponse.json({ ok: true, newBadges });
  } catch (e) {
    return serverError("POST dp", e);
  }
}

/** DELETE /api/play/dp: withdraw this week's entry. It stops showing at once. */
export async function DELETE() {
  try {
    const auth = await requirePlayer({ write: true });
    if (!auth.ok) return auth.response;
    await withdrawDp(auth.profile);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError("DELETE dp", e);
  }
}
