/**
 * Badge sync: gathers a student's game stats, runs the pure rules in
 * src/lib/play/achievements.ts and stores anything new. The unique index on
 * (profile, key, context) means every badge and its Loop Points land once,
 * however often this runs.
 */
import { and, count, desc, eq, ne, sql } from "drizzle-orm";
import { ACHIEVEMENTS_BY_KEY } from "@/constants/play";
import { getDb } from "@/db";
import { playAchievements, playDpEntries, playMemes } from "@/db/schema";
import { awardPoints } from "@/lib/gamification-server";
import { type AchievementStats, evaluateAchievements } from "@/lib/play/achievements";
import { DP_MIN_BATTLES_TO_RANK, normalizeBranch } from "@/lib/play/scoring";
import { previousWeekKey, weekKey } from "@/lib/play/week";
import { computeBranchWars } from "./branch-wars";
import type { Player } from "./context";
import { dpFieldSize, dpRankOf } from "./dp";
import { memeWeekWinner } from "./memes";
import { totPicksFor } from "./this-or-that";
import { triviaStreakFor, triviaTotals } from "./trivia";

const WEEKS_TO_CHECK = 8;

async function gatherStats(profile: Player): Promise<AchievementStats> {
  const db = getDb();
  const thisWeek = weekKey();

  const [dpAll, pastDp, memeCount, pastMemes, trivia, streak, totPicks] = await Promise.all([
    db
      .select({ n: count(), wins: sql<number>`coalesce(sum(${playDpEntries.wins}), 0)::int` })
      .from(playDpEntries)
      .where(eq(playDpEntries.profileId, profile.id)),
    db
      .select()
      .from(playDpEntries)
      .where(
        and(
          eq(playDpEntries.profileId, profile.id),
          ne(playDpEntries.weekKey, thisWeek),
          eq(playDpEntries.status, "ACTIVE"),
          sql`(${playDpEntries.wins} + ${playDpEntries.losses}) >= ${DP_MIN_BATTLES_TO_RANK}`
        )
      )
      .orderBy(desc(playDpEntries.weekKey))
      .limit(WEEKS_TO_CHECK),
    db
      .select({ n: count() })
      .from(playMemes)
      .where(and(eq(playMemes.profileId, profile.id), eq(playMemes.status, "ACTIVE"))),
    db
      .select({ id: playMemes.id, weekKey: playMemes.weekKey, institutionId: playMemes.institutionId })
      .from(playMemes)
      .where(
        and(eq(playMemes.profileId, profile.id), ne(playMemes.weekKey, thisWeek), eq(playMemes.status, "ACTIVE"))
      )
      .orderBy(desc(playMemes.weekKey))
      .limit(WEEKS_TO_CHECK),
    triviaTotals(profile.id),
    triviaStreakFor(profile.id),
    totPicksFor(profile.id),
  ]);

  const dpWeekFinishes = await Promise.all(
    pastDp.map(async (e) => ({
      week: e.weekKey,
      rank: await dpRankOf(e),
      field: await dpFieldSize(e.institutionId, e.weekKey),
    }))
  );

  const memeWins: AchievementStats["memeWins"] = [];
  for (const m of pastMemes) {
    const winner = await memeWeekWinner(m.institutionId, m.weekKey);
    if (winner?.id === m.id) memeWins.push({ week: m.weekKey, upvotes: winner.upvotes, field: winner.field });
  }

  const branchWinWeeks: string[] = [];
  const myBranch = normalizeBranch(profile.branch);
  if (myBranch) {
    const lastWeek = previousWeekKey();
    const { rows, students } = await computeBranchWars(profile.institutionId, lastWeek);
    const scored = students.some((s) => s.id === profile.id && s.points > 0);
    // A one-branch "war" is not a win.
    if (rows.length >= 2 && scored && normalizeBranch(rows[0].branch) === myBranch) branchWinWeeks.push(lastWeek);
  }

  return {
    dpEntries: Number(dpAll[0]?.n ?? 0),
    dpWins: Number(dpAll[0]?.wins ?? 0),
    dpWeekFinishes,
    memesPosted: Number(memeCount[0]?.n ?? 0),
    memeWins,
    triviaDone: trivia.done,
    triviaPerfect: trivia.perfect,
    triviaBestStreak: streak.best,
    totPicks,
    branchWinWeeks,
  };
}

export interface NewBadge {
  key: string;
  context: string;
  title: string;
  lp: number;
}

/** Stores newly earned badges, pays their Loop Points once, and returns them. */
export async function syncAchievements(profile: Player): Promise<NewBadge[]> {
  const earned = evaluateAchievements(await gatherStats(profile));
  if (!earned.length) return [];
  const values = earned
    .filter((e) => ACHIEVEMENTS_BY_KEY[e.key])
    .map((e) => ({
      profileId: profile.id,
      achievementKey: e.key,
      context: e.context,
      pointsAwarded: ACHIEVEMENTS_BY_KEY[e.key].lp,
    }));
  const inserted = await getDb()
    .insert(playAchievements)
    .values(values)
    .onConflictDoNothing()
    .returning({ id: playAchievements.id, key: playAchievements.achievementKey, context: playAchievements.context });

  const fresh: NewBadge[] = [];
  for (const row of inserted) {
    const def = ACHIEVEMENTS_BY_KEY[row.key];
    if (!def) continue;
    try {
      await awardPoints(profile.id, def.lp, "PLAY_ACHIEVEMENT", { referenceId: row.id, bypassCaps: true });
    } catch (e) {
      console.error("[play] Loop Points for badge failed:", e);
    }
    fresh.push({ key: row.key, context: row.context, title: def.title, lp: def.lp });
  }
  return fresh;
}

/** Earned badges, newest first. */
export async function listAchievements(profileId: string) {
  return getDb()
    .select({
      key: playAchievements.achievementKey,
      context: playAchievements.context,
      pointsAwarded: playAchievements.pointsAwarded,
      awardedAt: playAchievements.awardedAt,
    })
    .from(playAchievements)
    .where(eq(playAchievements.profileId, profileId))
    .orderBy(desc(playAchievements.awardedAt))
    .limit(200);
}

/** Runs a sync without ever failing the request that triggered it. */
export async function syncAchievementsSafe(profile: Player): Promise<NewBadge[]> {
  try {
    return await syncAchievements(profile);
  } catch (e) {
    console.error("[play] badge sync failed:", e);
    return [];
  }
}
