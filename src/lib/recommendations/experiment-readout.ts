import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { comments, userBehaviorEvents, votes } from "@/db/schema";
import { getRankingVariant, RANKING_EXPERIMENT, type RankingVariant, twoProportionZ } from "./experiments";
import { SKIP_DWELL_MS } from "./viewer-affinity";

export interface ArmMetrics {
  variant: RankingVariant;
  users: number;
  impressions: number;
  avgDwellMs: number;
  skipRate: number;
  longDwellRate: number;
  votesPerUser: number;
  commentsPerUser: number;
}

export interface ExperimentReadout {
  experimentId: string;
  days: number;
  arms: ArmMetrics[];
  skipRateZ: number;
  longDwellZ: number;
}

const LONG_DWELL_MS = 8000;
const MAX_USERS = 5000;

/** Per-arm feed engagement for the ranking experiment over the last `days`. */
export async function getRankingExperimentReadout(days = 7): Promise<ExperimentReadout> {
  const db = getDb();
  const since = sql`now() - make_interval(days => ${days})`;
  const dwellMsSql = sql<number>`coalesce((${userBehaviorEvents.metadata}->>'dwellMs')::int, 0)`;

  const perUser = await db
    .select({
      userId: userBehaviorEvents.userId,
      impressions: sql<number>`count(*)::int`,
      dwellSum: sql<number>`sum(${dwellMsSql})::bigint`,
      skips: sql<number>`count(*) filter (where ${dwellMsSql} < ${SKIP_DWELL_MS})::int`,
      longDwells: sql<number>`count(*) filter (where ${dwellMsSql} >= ${LONG_DWELL_MS})::int`,
    })
    .from(userBehaviorEvents)
    .where(
      and(
        eq(userBehaviorEvents.eventType, "POST_DWELL"),
        eq(userBehaviorEvents.targetType, "POST"),
        sql`${userBehaviorEvents.metadata}->>'experiment' = ${RANKING_EXPERIMENT.id}`,
        gt(userBehaviorEvents.createdAt, since)
      )
    )
    .groupBy(userBehaviorEvents.userId)
    .limit(MAX_USERS);

  const userIds = perUser.map((r) => r.userId);
  const voteCounts = new Map<string, number>();
  const commentCounts = new Map<string, number>();
  if (userIds.length > 0) {
    const [voteRows, commentRows] = await Promise.all([
      db
        .select({ id: votes.userId, n: sql<number>`count(*)::int` })
        .from(votes)
        .where(and(inArray(votes.userId, userIds), gt(votes.createdAt, since)))
        .groupBy(votes.userId),
      db
        .select({ id: comments.authorId, n: sql<number>`count(*)::int` })
        .from(comments)
        .where(and(inArray(comments.authorId, userIds), gt(comments.createdAt, since)))
        .groupBy(comments.authorId),
    ]);
    for (const r of voteRows) voteCounts.set(r.id, Number(r.n));
    for (const r of commentRows) if (r.id) commentCounts.set(r.id, Number(r.n));
  }

  const totals = new Map<RankingVariant, { users: number; imp: number; dwell: number; skips: number; long: number; votes: number; comments: number }>();
  for (const v of ["control", "personalized"] as const) {
    totals.set(v, { users: 0, imp: 0, dwell: 0, skips: 0, long: 0, votes: 0, comments: 0 });
  }
  for (const r of perUser) {
    const t = totals.get(getRankingVariant(r.userId));
    if (!t) continue;
    t.users += 1;
    t.imp += Number(r.impressions);
    t.dwell += Number(r.dwellSum);
    t.skips += Number(r.skips);
    t.long += Number(r.longDwells);
    t.votes += voteCounts.get(r.userId) || 0;
    t.comments += commentCounts.get(r.userId) || 0;
  }

  const arms: ArmMetrics[] = [...totals.entries()].map(([variant, t]) => ({
    variant,
    users: t.users,
    impressions: t.imp,
    avgDwellMs: t.imp > 0 ? Math.round(t.dwell / t.imp) : 0,
    skipRate: t.imp > 0 ? t.skips / t.imp : 0,
    longDwellRate: t.imp > 0 ? t.long / t.imp : 0,
    votesPerUser: t.users > 0 ? t.votes / t.users : 0,
    commentsPerUser: t.users > 0 ? t.comments / t.users : 0,
  }));

  const c = totals.get("control")!;
  const p = totals.get("personalized")!;
  return {
    experimentId: RANKING_EXPERIMENT.id,
    days,
    arms,
    // Positive z = personalized arm higher than control.
    skipRateZ: twoProportionZ(p.skips, p.imp, c.skips, c.imp),
    longDwellZ: twoProportionZ(p.long, p.imp, c.long, c.imp),
  };
}
