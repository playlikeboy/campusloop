/**
 * One-line live status for each game on the /play hub. Every number is a real count.
 */
import { and, count, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { playAchievements, playDpEntries, playMemes, playTotPrompts, playTriviaRuns, userProfiles } from "@/db/schema";
import { istDateString, weekKey } from "@/lib/play/week";
import { computeBranchWars } from "./branch-wars";
import type { Player } from "./context";
import { getOrCreateTheme } from "./memes";
import { triviaStreakFor } from "./trivia";

export async function getPlayHub(profile: Player) {
  const db = getDb();
  const week = weekKey();
  const realAuthor = and(eq(userProfiles.isSeeded, false), eq(userProfiles.status, "ACTIVE"));

  const [dpCount, myDp, theme, memeCount, myMeme, todayRun, streak, totLeft, badges, branches] = await Promise.all([
    db
      .select({ n: count() })
      .from(playDpEntries)
      .innerJoin(userProfiles, eq(userProfiles.id, playDpEntries.profileId))
      .where(
        and(
          eq(playDpEntries.institutionId, profile.institutionId),
          eq(playDpEntries.weekKey, week),
          eq(playDpEntries.status, "ACTIVE"),
          realAuthor
        )
      ),
    db
      .select({ status: playDpEntries.status })
      .from(playDpEntries)
      .where(and(eq(playDpEntries.profileId, profile.id), eq(playDpEntries.weekKey, week)))
      .limit(1),
    getOrCreateTheme(week),
    db
      .select({ n: count() })
      .from(playMemes)
      .where(
        and(
          eq(playMemes.institutionId, profile.institutionId),
          eq(playMemes.weekKey, week),
          eq(playMemes.status, "ACTIVE")
        )
      ),
    db
      .select({ status: playMemes.status })
      .from(playMemes)
      .where(and(eq(playMemes.profileId, profile.id), eq(playMemes.weekKey, week)))
      .limit(1),
    db
      .select({ status: playTriviaRuns.status, score: playTriviaRuns.score })
      .from(playTriviaRuns)
      .where(and(eq(playTriviaRuns.profileId, profile.id), eq(playTriviaRuns.localDate, istDateString())))
      .limit(1),
    triviaStreakFor(profile.id),
    db
      .select({ n: count() })
      .from(playTotPrompts)
      .where(
        and(
          eq(playTotPrompts.isActive, true),
          sql`NOT EXISTS (SELECT 1 FROM play_tot_votes v WHERE v.prompt_id = ${playTotPrompts.id} AND v.voter_id = ${profile.id})`
        )
      ),
    db.select({ n: count() }).from(playAchievements).where(eq(playAchievements.profileId, profile.id)),
    computeBranchWars(profile.institutionId, week),
  ]);

  return {
    dp: { entrants: Number(dpCount[0]?.n ?? 0), myStatus: myDp[0]?.status ?? null },
    memes: { theme: theme?.title ?? null, count: Number(memeCount[0]?.n ?? 0), posted: myMeme[0]?.status === "ACTIVE" },
    trivia: {
      status: (todayRun[0]?.status ?? null) as "IN_PROGRESS" | "DONE" | null,
      score: todayRun[0]?.score ?? 0,
      streak: streak.current,
    },
    tot: { left: Number(totLeft[0]?.n ?? 0) },
    badges: Number(badges[0]?.n ?? 0),
    branches: branches.rows.slice(0, 3),
    myBranch: profile.branch?.trim() || null,
  };
}

export type PlayHubData = Awaited<ReturnType<typeof getPlayHub>>;
