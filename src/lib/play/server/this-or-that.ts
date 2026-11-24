/**
 * This or That: quick two-option polls. Results (campus and all colleges) are
 * shown only after you pick. Picks are counted, never listed by person.
 */
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { playTotPrompts, playTotVotes } from "@/db/schema";
import { weekKey } from "@/lib/play/week";
import type { Player } from "./context";

export interface TotResult {
  promptId: string;
  optionA: string;
  optionB: string;
  myChoice: "A" | "B";
  campus: { a: number; b: number };
  everyone: { a: number; b: number };
}

async function tallies(promptIds: string[], institutionId: string) {
  if (!promptIds.length) return new Map<string, { campus: { a: number; b: number }; everyone: { a: number; b: number } }>();
  const rows = await getDb()
    .select({
      promptId: playTotVotes.promptId,
      campusA: sql<number>`count(*) FILTER (WHERE ${playTotVotes.choice} = 'A' AND ${playTotVotes.institutionId} = ${institutionId})::int`,
      campusB: sql<number>`count(*) FILTER (WHERE ${playTotVotes.choice} = 'B' AND ${playTotVotes.institutionId} = ${institutionId})::int`,
      allA: sql<number>`count(*) FILTER (WHERE ${playTotVotes.choice} = 'A')::int`,
      allB: sql<number>`count(*) FILTER (WHERE ${playTotVotes.choice} = 'B')::int`,
    })
    .from(playTotVotes)
    .where(inArray(playTotVotes.promptId, promptIds))
    .groupBy(playTotVotes.promptId);
  return new Map(
    rows.map((r) => [
      r.promptId,
      {
        campus: { a: Number(r.campusA), b: Number(r.campusB) },
        everyone: { a: Number(r.allA), b: Number(r.allB) },
      },
    ])
  );
}

export async function getThisOrThat(profile: Player) {
  const db = getDb();
  const [next, recentVotes, [{ n: picks } = { n: 0 }], [{ n: total } = { n: 0 }]] = await Promise.all([
    db
      .select({ id: playTotPrompts.id, optionA: playTotPrompts.optionA, optionB: playTotPrompts.optionB })
      .from(playTotPrompts)
      .where(
        and(
          eq(playTotPrompts.isActive, true),
          sql`NOT EXISTS (SELECT 1 FROM play_tot_votes v WHERE v.prompt_id = ${playTotPrompts.id} AND v.voter_id = ${profile.id})`
        )
      )
      .orderBy(sql`random()`)
      .limit(10),
    db
      .select({
        promptId: playTotVotes.promptId,
        choice: playTotVotes.choice,
        optionA: playTotPrompts.optionA,
        optionB: playTotPrompts.optionB,
      })
      .from(playTotVotes)
      .innerJoin(playTotPrompts, eq(playTotPrompts.id, playTotVotes.promptId))
      .where(eq(playTotVotes.voterId, profile.id))
      .orderBy(desc(playTotVotes.createdAt))
      .limit(8),
    db.select({ n: count() }).from(playTotVotes).where(eq(playTotVotes.voterId, profile.id)),
    db.select({ n: count() }).from(playTotPrompts).where(eq(playTotPrompts.isActive, true)),
  ]);

  const t = await tallies(
    recentVotes.map((v) => v.promptId),
    profile.institutionId
  );
  const recent: TotResult[] = recentVotes.map((v) => ({
    promptId: v.promptId,
    optionA: v.optionA,
    optionB: v.optionB,
    myChoice: v.choice as "A" | "B",
    campus: t.get(v.promptId)?.campus ?? { a: 0, b: 0 },
    everyone: t.get(v.promptId)?.everyone ?? { a: 0, b: 0 },
  }));

  return { next, recent, picks: Number(picks), totalPrompts: Number(total) };
}

export type TotVoteResult = { ok: true; result: TotResult } | { ok: false; error: string; status: number };

/** One pick per prompt; a second tap returns the first pick's result. */
export async function voteThisOrThat(profile: Player, promptId: string, choice: "A" | "B"): Promise<TotVoteResult> {
  const db = getDb();
  const [prompt] = await db.select().from(playTotPrompts).where(eq(playTotPrompts.id, promptId)).limit(1);
  if (!prompt || !prompt.isActive) return { ok: false, error: "This poll is closed.", status: 404 };

  await db
    .insert(playTotVotes)
    .values({ promptId, voterId: profile.id, institutionId: profile.institutionId, weekKey: weekKey(), choice })
    .onConflictDoNothing();

  const [mine] = await db
    .select({ choice: playTotVotes.choice })
    .from(playTotVotes)
    .where(and(eq(playTotVotes.promptId, promptId), eq(playTotVotes.voterId, profile.id)))
    .limit(1);
  const t = (await tallies([promptId], profile.institutionId)).get(promptId);
  return {
    ok: true,
    result: {
      promptId,
      optionA: prompt.optionA,
      optionB: prompt.optionB,
      myChoice: (mine?.choice ?? choice) as "A" | "B",
      campus: t?.campus ?? { a: 0, b: 0 },
      everyone: t?.everyone ?? { a: 0, b: 0 },
    },
  };
}

export async function totPicksFor(profileId: string) {
  const [row] = await getDb().select({ n: count() }).from(playTotVotes).where(eq(playTotVotes.voterId, profileId));
  return Number(row?.n ?? 0);
}
