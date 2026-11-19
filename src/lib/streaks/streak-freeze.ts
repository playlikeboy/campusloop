import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { streakEvents, userStreaks } from "@/db/schema";
import { getGrowthPrefs, isMissingTable, takeStreakFreezes } from "@/lib/growth/engagement-prefs";

/** Journal event type written for a day a freeze covered. */
export const STREAK_FREEZE_EVENT = "STREAK_FREEZE";

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const out = new Date(Date.UTC(y, m - 1, d));
  out.setUTCDate(out.getUTCDate() + days);
  return out.toISOString().slice(0, 10);
}

/**
 * The days a freeze should fill: every whole day missed between the last
 * active day and today, but only when the student holds enough freezes to
 * cover all of them. Today is never filled, since it can still be earned.
 */
export function missedDaysToFreeze(lastActiveDate: string | null, today: string, freezes: number): string[] {
  if (!lastActiveDate || freezes <= 0 || lastActiveDate >= today) return [];
  const missed: string[] = [];
  let cursor = addDays(lastActiveDate, 1);
  while (cursor < today) {
    missed.push(cursor);
    if (missed.length > freezes) return [];
    cursor = addDays(cursor, 1);
  }
  return missed;
}

/**
 * Spends freezes on missed days so the run survives. Called before the streak
 * is read or extended. Never throws: a freeze problem must not hide the streak.
 * Returns the days it filled.
 */
export async function applyStreakFreezes(profileId: string, today: string): Promise<string[]> {
  try {
    const prefs = await getGrowthPrefs(profileId);
    if (prefs.streakFreezes <= 0) return [];

    const db = getDb();
    const [last] = await db
      .select({ localDate: streakEvents.localDate })
      .from(streakEvents)
      .where(eq(streakEvents.userId, profileId))
      .orderBy(desc(streakEvents.localDate))
      .limit(1);

    const days = missedDaysToFreeze(last?.localDate ?? null, today, prefs.streakFreezes);
    if (days.length === 0) return [];
    if (!(await takeStreakFreezes(profileId, days.length))) return [];

    await db
      .insert(streakEvents)
      .values(days.map((localDate) => ({ userId: profileId, localDate, eventType: STREAK_FREEZE_EVENT })))
      .onConflictDoNothing();

    // Keep the summary row in step, so the next real action extends the run.
    await db
      .update(userStreaks)
      .set({ lastQualifiedDate: days[days.length - 1], updatedAt: new Date() })
      .where(eq(userStreaks.userId, profileId));

    return days;
  } catch (error) {
    if (!isMissingTable(error)) console.error("[streak-freeze] apply failed:", error);
    return [];
  }
}
