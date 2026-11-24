/**
 * Branch Wars: every point a student scores in Play this week goes to their
 * branch. Computed from the game tables, so nothing can drift out of sync.
 */
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { playDpEntries, playMemes, playTotVotes, playTriviaRuns, userProfiles } from "@/db/schema";
import { BRANCH_POINTS, type BranchRow, branchPointsFor, normalizeBranch, rankBranches, type StudentWeekActivity } from "@/lib/play/scoring";

export async function computeBranchWars(institutionId: string, week: string) {
  const db = getDb();
  const [trivia, tot, memes, dp] = await Promise.all([
    db
      .select({ id: playTriviaRuns.profileId, v: sql<number>`sum(${playTriviaRuns.correctCount})::int` })
      .from(playTriviaRuns)
      .where(
        and(
          eq(playTriviaRuns.institutionId, institutionId),
          eq(playTriviaRuns.weekKey, week),
          eq(playTriviaRuns.status, "DONE")
        )
      )
      .groupBy(playTriviaRuns.profileId),
    db
      .select({ id: playTotVotes.voterId, v: sql<number>`count(*)::int` })
      .from(playTotVotes)
      .where(and(eq(playTotVotes.institutionId, institutionId), eq(playTotVotes.weekKey, week)))
      .groupBy(playTotVotes.voterId),
    db
      .select({
        id: playMemes.profileId,
        posted: sql<number>`count(*)::int`,
        up: sql<number>`sum(${playMemes.upvotes})::int`,
      })
      .from(playMemes)
      .where(
        and(eq(playMemes.institutionId, institutionId), eq(playMemes.weekKey, week), eq(playMemes.status, "ACTIVE"))
      )
      .groupBy(playMemes.profileId),
    db
      .select({ id: playDpEntries.profileId, v: sql<number>`sum(${playDpEntries.wins})::int` })
      .from(playDpEntries)
      .where(
        and(
          eq(playDpEntries.institutionId, institutionId),
          eq(playDpEntries.weekKey, week),
          eq(playDpEntries.status, "ACTIVE")
        )
      )
      .groupBy(playDpEntries.profileId),
  ]);

  const activity = new Map<string, StudentWeekActivity>();
  const get = (id: string) => {
    let a = activity.get(id);
    if (!a) {
      a = { triviaCorrect: 0, totPicks: 0, memesPosted: 0, memeUpvotes: 0, dpWins: 0 };
      activity.set(id, a);
    }
    return a;
  };
  for (const r of trivia) get(r.id).triviaCorrect += Number(r.v);
  for (const r of tot) get(r.id).totPicks += Number(r.v);
  for (const r of memes) {
    get(r.id).memesPosted += Number(r.posted);
    get(r.id).memeUpvotes += Number(r.up);
  }
  for (const r of dp) get(r.id).dpWins += Number(r.v);

  const ids = [...activity.keys()];
  const people = ids.length
    ? await db
        .select({ id: userProfiles.id, branch: userProfiles.branch })
        .from(userProfiles)
        .where(and(inArray(userProfiles.id, ids), eq(userProfiles.isSeeded, false), eq(userProfiles.status, "ACTIVE")))
    : [];

  const students = people.map((p) => ({
    id: p.id,
    branch: p.branch,
    points: branchPointsFor(activity.get(p.id) as StudentWeekActivity),
  }));
  return { rows: rankBranches(students), students };
}

export async function getBranchWars(profile: { id: string; institutionId: string; branch: string | null }, week: string) {
  const { rows, students } = await computeBranchWars(profile.institutionId, week);
  const mine = students.find((s) => s.id === profile.id);
  const myKey = normalizeBranch(profile.branch);
  const myRow = myKey ? rows.findIndex((r) => normalizeBranch(r.branch) === myKey) : -1;
  return {
    rows: rows.slice(0, 30).map((r: BranchRow, i) => ({ ...r, rank: i + 1 })),
    myBranch: profile.branch?.trim() || null,
    myBranchRank: myRow >= 0 ? myRow + 1 : null,
    myPoints: mine?.points ?? 0,
    rules: BRANCH_POINTS,
  };
}
