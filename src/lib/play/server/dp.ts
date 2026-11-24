/**
 * DP Battle. Students opt in with their own current profile photo for one week.
 * Classmates at the same campus pick the better DP of two; ratings use Elo.
 * Only ACTIVE entries are ever read for display. Voter ids never leave the server.
 */
import { and, count, desc, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { playDpEntries, playDpVotes, userProfiles } from "@/db/schema";
import { DP_MIN_BATTLES_TO_RANK, dpPairKey, eloDelta, ELO_START } from "@/lib/play/scoring";
import { previousWeekKey, weekEndsAt, weekKey } from "@/lib/play/week";
import type { Player } from "./context";

const battles = sql<number>`(${playDpEntries.wins} + ${playDpEntries.losses})`;

/** Real, active students only: never seeded demo accounts or suspended ones. */
const realAuthor = and(eq(userProfiles.isSeeded, false), eq(userProfiles.status, "ACTIVE"));

export interface DpLeaderRow {
  rank: number;
  entryId: string;
  imageUrl: string;
  displayName: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  isMe: boolean;
}

async function topEntries(institutionId: string, week: string, limit: number, viewerId: string, blocked: Set<string>) {
  const rows = await getDb()
    .select({
      entryId: playDpEntries.id,
      profileId: playDpEntries.profileId,
      imageUrl: playDpEntries.imageUrl,
      rating: playDpEntries.rating,
      wins: playDpEntries.wins,
      losses: playDpEntries.losses,
      displayName: userProfiles.displayName,
      username: userProfiles.username,
    })
    .from(playDpEntries)
    .innerJoin(userProfiles, eq(userProfiles.id, playDpEntries.profileId))
    .where(
      and(
        eq(playDpEntries.institutionId, institutionId),
        eq(playDpEntries.weekKey, week),
        eq(playDpEntries.status, "ACTIVE"),
        sql`${battles} >= ${DP_MIN_BATTLES_TO_RANK}`,
        realAuthor
      )
    )
    .orderBy(desc(playDpEntries.rating), desc(playDpEntries.wins))
    .limit(limit + blocked.size);

  return rows
    .filter((r) => !blocked.has(r.profileId))
    .slice(0, limit)
    .map<DpLeaderRow>((r, i) => ({
      rank: i + 1,
      entryId: r.entryId,
      imageUrl: r.imageUrl,
      displayName: r.displayName,
      username: r.username,
      rating: r.rating,
      wins: r.wins,
      losses: r.losses,
      isMe: r.profileId === viewerId,
    }));
}

/** Campus rank of an entry among qualified entries, or null if not ranked yet. */
export async function dpRankOf(entry: { institutionId: string; weekKey: string; rating: number }) {
  const [row] = await getDb()
    .select({ n: count() })
    .from(playDpEntries)
    .innerJoin(userProfiles, eq(userProfiles.id, playDpEntries.profileId))
    .where(
      and(
        eq(playDpEntries.institutionId, entry.institutionId),
        eq(playDpEntries.weekKey, entry.weekKey),
        eq(playDpEntries.status, "ACTIVE"),
        sql`${battles} >= ${DP_MIN_BATTLES_TO_RANK}`,
        gt(playDpEntries.rating, entry.rating),
        realAuthor
      )
    );
  return Number(row?.n ?? 0) + 1;
}

/** How many qualified entries a campus had in a week. */
export async function dpFieldSize(institutionId: string, week: string) {
  const [row] = await getDb()
    .select({ n: count() })
    .from(playDpEntries)
    .innerJoin(userProfiles, eq(userProfiles.id, playDpEntries.profileId))
    .where(
      and(
        eq(playDpEntries.institutionId, institutionId),
        eq(playDpEntries.weekKey, week),
        eq(playDpEntries.status, "ACTIVE"),
        sql`${battles} >= ${DP_MIN_BATTLES_TO_RANK}`,
        realAuthor
      )
    );
  return Number(row?.n ?? 0);
}

export async function getDpState(profile: Player, blocked: Set<string>) {
  const db = getDb();
  const week = weekKey();
  const [mine] = await db
    .select()
    .from(playDpEntries)
    .where(and(eq(playDpEntries.profileId, profile.id), eq(playDpEntries.weekKey, week)))
    .limit(1);

  const [[entrants], leaderboard, lastWeek] = await Promise.all([
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
    topEntries(profile.institutionId, week, 20, profile.id, blocked),
    topEntries(profile.institutionId, previousWeekKey(), 3, profile.id, blocked),
  ]);

  let myRank: number | null = null;
  if (mine?.status === "ACTIVE" && mine.wins + mine.losses >= DP_MIN_BATTLES_TO_RANK) {
    myRank = await dpRankOf(mine);
  }

  const avatar = profile.avatarUrl ?? null;
  return {
    week,
    endsAt: weekEndsAt(),
    minBattles: DP_MIN_BATTLES_TO_RANK,
    entrants: Number(entrants?.n ?? 0),
    myAvatarUrl: avatar,
    canEnter: isRealPhoto(avatar),
    myEntry: mine
      ? {
          id: mine.id,
          status: mine.status as "ACTIVE" | "WITHDRAWN" | "HIDDEN",
          imageUrl: mine.imageUrl,
          rating: mine.rating,
          wins: mine.wins,
          losses: mine.losses,
          rank: myRank,
        }
      : null,
    leaderboard,
    lastWeek,
  };
}

/** Generated placeholder avatars are not a DP worth battling. */
export function isRealPhoto(url: string | null | undefined): url is string {
  return Boolean(url) && !/dicebear\.com|ui-avatars\.com|\/default-avatar/i.test(url ?? "");
}

export type EnterResult = { ok: true } | { ok: false; error: string; status: number };

/** Opt in this week with the current profile photo. Re-entering after a withdraw starts fresh. */
export async function enterDp(profile: Player): Promise<EnterResult> {
  if (!isRealPhoto(profile.avatarUrl)) {
    return { ok: false, error: "Add a profile photo first, then enter.", status: 400 };
  }
  const db = getDb();
  const week = weekKey();
  const [existing] = await db
    .select({ id: playDpEntries.id, status: playDpEntries.status })
    .from(playDpEntries)
    .where(and(eq(playDpEntries.profileId, profile.id), eq(playDpEntries.weekKey, week)))
    .limit(1);

  if (existing?.status === "HIDDEN") {
    return { ok: false, error: "Your entry was hidden after reports. You can enter again next week.", status: 403 };
  }
  if (existing?.status === "ACTIVE") return { ok: true };
  if (existing) {
    await db
      .update(playDpEntries)
      .set({ status: "ACTIVE", imageUrl: profile.avatarUrl as string, rating: ELO_START, wins: 0, losses: 0 })
      .where(and(eq(playDpEntries.id, existing.id), eq(playDpEntries.status, "WITHDRAWN")));
    return { ok: true };
  }
  await db
    .insert(playDpEntries)
    .values({
      profileId: profile.id,
      institutionId: profile.institutionId,
      weekKey: week,
      imageUrl: profile.avatarUrl as string,
    })
    .onConflictDoNothing();
  return { ok: true };
}

export async function withdrawDp(profile: Player) {
  await getDb()
    .update(playDpEntries)
    .set({ status: "WITHDRAWN" })
    .where(
      and(
        eq(playDpEntries.profileId, profile.id),
        eq(playDpEntries.weekKey, weekKey()),
        eq(playDpEntries.status, "ACTIVE")
      )
    );
}

export interface DpPair {
  a: { entryId: string; imageUrl: string };
  b: { entryId: string; imageUrl: string };
}

/**
 * Two entries this student has not judged together yet. Entries with fewer
 * battles go first so everyone gets seen; the opponent is the closest rating.
 */
export async function pickDpPair(
  profile: Player,
  blocked: Set<string>
): Promise<{ pair: DpPair | null; reason?: "not_enough" | "all_done" }> {
  const db = getDb();
  const week = weekKey();
  const [candidates, voted] = await Promise.all([
    db
      .select({
        id: playDpEntries.id,
        profileId: playDpEntries.profileId,
        imageUrl: playDpEntries.imageUrl,
        rating: playDpEntries.rating,
        played: battles,
      })
      .from(playDpEntries)
      .innerJoin(userProfiles, eq(userProfiles.id, playDpEntries.profileId))
      .where(
        and(
          eq(playDpEntries.institutionId, profile.institutionId),
          eq(playDpEntries.weekKey, week),
          eq(playDpEntries.status, "ACTIVE"),
          ne(playDpEntries.profileId, profile.id),
          realAuthor
        )
      )
      .limit(400),
    db
      .select({ pairKey: playDpVotes.pairKey })
      .from(playDpVotes)
      .where(and(eq(playDpVotes.voterId, profile.id), eq(playDpVotes.weekKey, week))),
  ]);

  const pool = candidates.filter((c) => !blocked.has(c.profileId));
  if (pool.length < 2) return { pair: null, reason: "not_enough" };

  const done = new Set(voted.map((v) => v.pairKey));
  const order = pool
    .map((c) => ({ c, r: Math.random() }))
    .sort((x, y) => Number(x.c.played) - Number(y.c.played) || x.r - y.r)
    .map((x) => x.c);

  for (const a of order.slice(0, 40)) {
    const opponents = pool
      .filter((b) => b.id !== a.id && !done.has(dpPairKey(a.id, b.id)))
      .sort((x, y) => Math.abs(x.rating - a.rating) - Math.abs(y.rating - a.rating));
    const b = opponents[Math.floor(Math.random() * Math.min(3, opponents.length))];
    if (b) {
      // Random sides so position never hints at rating.
      const [left, right] = Math.random() < 0.5 ? [a, b] : [b, a];
      return {
        pair: {
          a: { entryId: left.id, imageUrl: left.imageUrl },
          b: { entryId: right.id, imageUrl: right.imageUrl },
        },
      };
    }
  }
  return { pair: null, reason: "all_done" };
}

export type VoteResult = { ok: true } | { ok: false; error: string; status: number };

export async function voteDp(
  profile: Player,
  blocked: Set<string>,
  winnerId: string,
  loserId: string
): Promise<VoteResult> {
  if (winnerId === loserId) return { ok: false, error: "Pick one of two different DPs.", status: 400 };
  const db = getDb();
  const week = weekKey();
  const rows = await db
    .select({
      id: playDpEntries.id,
      profileId: playDpEntries.profileId,
      institutionId: playDpEntries.institutionId,
      weekKey: playDpEntries.weekKey,
      status: playDpEntries.status,
      rating: playDpEntries.rating,
      isSeeded: userProfiles.isSeeded,
    })
    .from(playDpEntries)
    .innerJoin(userProfiles, eq(userProfiles.id, playDpEntries.profileId))
    .where(inArray(playDpEntries.id, [winnerId, loserId]));

  const winner = rows.find((r) => r.id === winnerId);
  const loser = rows.find((r) => r.id === loserId);
  const valid = (e: (typeof rows)[number] | undefined) =>
    e &&
    e.status === "ACTIVE" &&
    e.weekKey === week &&
    e.institutionId === profile.institutionId &&
    e.profileId !== profile.id &&
    !e.isSeeded &&
    !blocked.has(e.profileId);
  if (!valid(winner) || !valid(loser) || !winner || !loser) {
    return { ok: false, error: "This battle is no longer open. Here's a new one.", status: 409 };
  }

  const inserted = await db
    .insert(playDpVotes)
    .values({
      weekKey: week,
      voterId: profile.id,
      winnerEntryId: winner.id,
      loserEntryId: loser.id,
      pairKey: dpPairKey(winner.id, loser.id),
    })
    .onConflictDoNothing()
    .returning({ id: playDpVotes.id });
  if (inserted.length === 0) return { ok: false, error: "You already judged this pair.", status: 409 };

  const delta = eloDelta(winner.rating, loser.rating);
  await db
    .update(playDpEntries)
    .set({
      rating: sql`CASE WHEN ${playDpEntries.id} = ${winner.id} THEN ${playDpEntries.rating} + ${delta} ELSE GREATEST(${playDpEntries.rating} - ${delta}, 100) END`,
      wins: sql`${playDpEntries.wins} + CASE WHEN ${playDpEntries.id} = ${winner.id} THEN 1 ELSE 0 END`,
      losses: sql`${playDpEntries.losses} + CASE WHEN ${playDpEntries.id} = ${loser.id} THEN 1 ELSE 0 END`,
    })
    .where(inArray(playDpEntries.id, [winner.id, loser.id]));
  return { ok: true };
}
