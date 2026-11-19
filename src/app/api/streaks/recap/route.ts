import { and, desc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { STREAK_MILESTONES } from "@/constants/streaks";
import { getDb } from "@/db";
import { userProfiles, userStreakMilestones } from "@/db/schema";
import { STREAK_FREEZE_COST_LP, STREAK_FREEZE_MAX } from "@/lib/growth/constants";
import { getGrowthPrefs } from "@/lib/growth/engagement-prefs";
import { requireProfile } from "@/lib/require-profile";
import { getWeeklyRecap } from "@/lib/streaks/weekly-recap";

export const dynamic = "force-dynamic";

/**
 * Everything around the streak that is the student's own business: the
 * weekly recap, freezes held, Loop Points to buy one, and a milestone reached
 * in the last day (for the celebration).
 */
export async function GET() {
  const auth = await requireProfile();
  if (!auth.ok) return auth.response;
  const profileId = auth.profile.id;
  const db = getDb();

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recap, prefs, fresh, milestone] = await Promise.all([
      getWeeklyRecap(profileId),
      getGrowthPrefs(profileId),
      db.query.userProfiles.findFirst({ where: eq(userProfiles.id, profileId), columns: { points: true } }),
      db.query.userStreakMilestones.findFirst({
        where: and(eq(userStreakMilestones.userId, profileId), gte(userStreakMilestones.awardedAt, since)),
        orderBy: [desc(userStreakMilestones.awardedAt)],
      }),
    ]);

    const reached = milestone ? STREAK_MILESTONES.find((m) => m.days === milestone.milestoneDays) : null;
    return NextResponse.json({
      recap,
      freezes: prefs.streakFreezes,
      maxFreezes: STREAK_FREEZE_MAX,
      freezeCost: STREAK_FREEZE_COST_LP,
      points: fresh?.points ?? 0,
      remindersEnabled: prefs.remindersEnabled,
      recentMilestone: reached
        ? { days: reached.days, title: reached.title, points: milestone?.pointsAwarded ?? reached.points }
        : null,
    });
  } catch (error) {
    console.error("GET /api/streaks/recap failed:", error);
    return NextResponse.json({ error: "Couldn't load your week." }, { status: 500 });
  }
}
