import { NextResponse } from "next/server";
import { STREAK_FREEZE_COST_LP, STREAK_FREEZE_MAX } from "@/lib/growth/constants";
import { addStreakFreeze, getGrowthPrefs, isMissingTable, refundPoints, spendPoints } from "@/lib/growth/engagement-prefs";
import { requireProfile } from "@/lib/require-profile";

export const dynamic = "force-dynamic";

/** Buy one streak freeze with Loop Points. It covers one missed day, used automatically. */
export async function POST() {
  const auth = await requireProfile();
  if (!auth.ok) return auth.response;
  const profileId = auth.profile.id;

  const prefs = await getGrowthPrefs(profileId);
  if (prefs.streakFreezes >= STREAK_FREEZE_MAX) {
    return NextResponse.json(
      { error: `You already hold ${STREAK_FREEZE_MAX} freezes. Use one before buying another.` },
      { status: 400 }
    );
  }

  const spent = await spendPoints(profileId, STREAK_FREEZE_COST_LP);
  if (!spent.ok) {
    return NextResponse.json(
      { error: `A freeze costs ${STREAK_FREEZE_COST_LP} Loop Points. Earn a few more and try again.` },
      { status: 400 }
    );
  }

  try {
    const freezes = await addStreakFreeze(profileId, STREAK_FREEZE_MAX);
    if (freezes === null) {
      await refundPoints(profileId, STREAK_FREEZE_COST_LP);
      return NextResponse.json(
        { error: `You already hold ${STREAK_FREEZE_MAX} freezes. Your points were not used.` },
        { status: 400 }
      );
    }
    return NextResponse.json({ freezes, points: spent.points });
  } catch (error) {
    await refundPoints(profileId, STREAK_FREEZE_COST_LP);
    if (isMissingTable(error)) {
      return NextResponse.json({ error: "Streak freezes aren't available yet. Your points were not used." }, { status: 503 });
    }
    console.error("POST /api/streaks/freeze failed:", error);
    return NextResponse.json({ error: "Couldn't buy the freeze. Your points were not used." }, { status: 500 });
  }
}
