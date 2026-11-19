import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { engagementPrefs, userProfiles } from "@/db/schema";
import { invalidateProfileCache } from "@/lib/server-cache";

/**
 * Reads and writes for engagement_prefs. Until drizzle/manual/0014 is applied
 * the table does not exist: reads fall back to defaults and writes report
 * `unavailable`, so nothing else on the page breaks.
 */

export interface GrowthPrefs {
  remindersEnabled: boolean;
  streakFreezes: number;
  crushHintsUnlocked: boolean;
}

export const DEFAULT_GROWTH_PREFS: GrowthPrefs = {
  remindersEnabled: true,
  streakFreezes: 0,
  crushHintsUnlocked: false,
};

export function isMissingTable(error: unknown): boolean {
  const e = error as { code?: string; message?: string; cause?: { code?: string; message?: string } } | null;
  return (
    e?.code === "42P01" ||
    e?.cause?.code === "42P01" ||
    /engagement_(prefs|sends).*does not exist/i.test(String(e?.message ?? e?.cause?.message ?? ""))
  );
}

export async function getGrowthPrefs(profileId: string): Promise<GrowthPrefs> {
  try {
    const [row] = await getDb()
      .select()
      .from(engagementPrefs)
      .where(eq(engagementPrefs.profileId, profileId))
      .limit(1);
    if (!row) return DEFAULT_GROWTH_PREFS;
    return {
      remindersEnabled: row.remindersEnabled,
      streakFreezes: row.streakFreezes,
      crushHintsUnlocked: Boolean(row.crushHintsUnlockedAt),
    };
  } catch (error) {
    if (!isMissingTable(error)) console.error("[growth] getGrowthPrefs failed:", error);
    return DEFAULT_GROWTH_PREFS;
  }
}

export async function setRemindersEnabled(profileId: string, enabled: boolean): Promise<boolean> {
  try {
    await getDb()
      .insert(engagementPrefs)
      .values({ profileId, remindersEnabled: enabled })
      .onConflictDoUpdate({
        target: engagementPrefs.profileId,
        set: { remindersEnabled: enabled, updatedAt: new Date() },
      });
    return true;
  } catch (error) {
    if (!isMissingTable(error)) console.error("[growth] setRemindersEnabled failed:", error);
    return false;
  }
}

export type SpendResult = { ok: true; points: number } | { ok: false; reason: "not_enough_points" | "unavailable" };

/**
 * Takes Loop Points from a balance only when the balance covers it, in one
 * statement, so two taps can never spend the same points twice.
 */
export async function spendPoints(profileId: string, amount: number): Promise<SpendResult> {
  const db = getDb();
  const [row] = await db
    .update(userProfiles)
    .set({ points: sql`${userProfiles.points} - ${amount}` })
    .where(and(eq(userProfiles.id, profileId), gte(userProfiles.points, amount)))
    .returning({ points: userProfiles.points, userId: userProfiles.userId });
  if (!row) return { ok: false, reason: "not_enough_points" };
  invalidateProfileCache(row.userId);
  return { ok: true, points: row.points };
}

/** Gives Loop Points back after a purchase failed half way. */
export async function refundPoints(profileId: string, amount: number): Promise<void> {
  const [row] = await getDb()
    .update(userProfiles)
    .set({ points: sql`${userProfiles.points} + ${amount}` })
    .where(eq(userProfiles.id, profileId))
    .returning({ userId: userProfiles.userId });
  if (row) invalidateProfileCache(row.userId);
}

/** Adds one freeze when the student holds fewer than `max`. Returns the new count, or null. */
export async function addStreakFreeze(profileId: string, max: number): Promise<number | null> {
  const db = getDb();
  const [row] = await db
    .insert(engagementPrefs)
    .values({ profileId, streakFreezes: 1 })
    .onConflictDoUpdate({
      target: engagementPrefs.profileId,
      set: { streakFreezes: sql`${engagementPrefs.streakFreezes} + 1`, updatedAt: new Date() },
      setWhere: sql`${engagementPrefs.streakFreezes} < ${max}`,
    })
    .returning({ streakFreezes: engagementPrefs.streakFreezes });
  return row ? row.streakFreezes : null;
}

/** Uses `count` freezes when the student holds that many. True when they were taken. */
export async function takeStreakFreezes(profileId: string, count: number): Promise<boolean> {
  const [row] = await getDb()
    .update(engagementPrefs)
    .set({ streakFreezes: sql`${engagementPrefs.streakFreezes} - ${count}`, updatedAt: new Date() })
    .where(and(eq(engagementPrefs.profileId, profileId), gte(engagementPrefs.streakFreezes, count)))
    .returning({ streakFreezes: engagementPrefs.streakFreezes });
  return Boolean(row);
}

export async function markCrushHintsUnlocked(profileId: string): Promise<void> {
  await getDb()
    .insert(engagementPrefs)
    .values({ profileId, crushHintsUnlockedAt: new Date() })
    .onConflictDoUpdate({
      target: engagementPrefs.profileId,
      set: { crushHintsUnlockedAt: new Date(), updatedAt: new Date() },
    });
}
