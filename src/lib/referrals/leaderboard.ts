import { and, desc, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { institutions, userProfiles } from "@/db/schema";

export interface InviteLeader {
  rank: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  invites: number;
  college: string | null;
}

export const INVITE_LEADERBOARD_MAX = 50;

/** Clamps a requested page size to 1..INVITE_LEADERBOARD_MAX (default 25). */
export function clampLeaderboardLimit(raw: string | number | null | undefined): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return 25;
  return Math.min(n, INVITE_LEADERBOARD_MAX);
}

/** Adds 1-based ranks; students with the same invite count share a rank. */
export function rankLeaders<T extends { invites: number }>(rows: T[]): (T & { rank: number })[] {
  let rank = 0;
  let previous = Number.NaN;
  return rows.map((row, index) => {
    if (row.invites !== previous) {
      rank = index + 1;
      previous = row.invites;
    }
    return { ...row, rank };
  });
}

/** Students with the most credited invites, for one college or for all of CampusLoop. */
export async function getInviteLeaderboard(options: {
  institutionId?: string | null;
  limit?: number;
}): Promise<InviteLeader[]> {
  const db = getDb();
  const rows = await db
    .select({
      username: userProfiles.username,
      displayName: userProfiles.displayName,
      avatarUrl: userProfiles.avatarUrl,
      invites: userProfiles.referralCount,
      college: institutions.name,
    })
    .from(userProfiles)
    .leftJoin(institutions, eq(institutions.id, userProfiles.institutionId))
    .where(
      and(
        gt(userProfiles.referralCount, 0),
        eq(userProfiles.status, "ACTIVE"),
        eq(userProfiles.isSeeded, false),
        options.institutionId ? eq(userProfiles.institutionId, options.institutionId) : undefined
      )
    )
    .orderBy(desc(userProfiles.referralCount), userProfiles.username)
    .limit(clampLeaderboardLimit(options.limit));

  return rankLeaders(rows);
}
