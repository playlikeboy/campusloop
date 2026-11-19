import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { comments, userBehaviorEvents, votes } from "@/db/schema";
import { RANKING_EXPERIMENT, RANKING_VARIANTS, type RankingVariant, twoProportionZ } from "./experiments";
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
  /** Feed sessions (impressions with gaps under 30 min) per student. */
  sessionsPerUser: number;
  /** Mean feed session length. */
  avgSessionMs: number;
  /** Students whose first feed day in the window is fully followed by another day. */
  d1Eligible: number;
  /** Of those, how many came back (any activity) the next calendar day. */
  d1Returned: number;
  d1Rate: number;
}

export interface ArmComparison {
  variant: RankingVariant;
  /** Positive = this arm higher than control. */
  skipRateZ: number;
  longDwellZ: number;
  d1ReturnZ: number;
}

export interface ExperimentReadout {
  experimentId: string;
  days: number;
  arms: ArmMetrics[];
  /** Each treatment arm against control. */
  comparisons: ArmComparison[];
  /** personalized vs control (kept for older callers). */
  skipRateZ: number;
  longDwellZ: number;
}

const LONG_DWELL_MS = 8000;
const MAX_USERS = 5000;
const SESSION_GAP_MINUTES = 30;

type Totals = {
  users: number;
  imp: number;
  dwell: number;
  skips: number;
  long: number;
  votes: number;
  comments: number;
  sessions: number;
  sessionMs: number;
  d1Eligible: number;
  d1Returned: number;
};

const emptyTotals = (): Totals => ({
  users: 0,
  imp: 0,
  dwell: 0,
  skips: 0,
  long: 0,
  votes: 0,
  comments: 0,
  sessions: 0,
  sessionMs: 0,
  d1Eligible: 0,
  d1Returned: 0,
});

function toVariant(value: unknown): RankingVariant | null {
  return (RANKING_VARIANTS as readonly string[]).includes(String(value)) ? (value as RankingVariant) : null;
}

/** Pure roll-up so it can be unit tested. */
export function summarizeArms(totals: Map<RankingVariant, Totals>): {
  arms: ArmMetrics[];
  comparisons: ArmComparison[];
} {
  const arms: ArmMetrics[] = RANKING_VARIANTS.map((variant) => {
    const t = totals.get(variant) ?? emptyTotals();
    return {
      variant,
      users: t.users,
      impressions: t.imp,
      avgDwellMs: t.imp > 0 ? Math.round(t.dwell / t.imp) : 0,
      skipRate: t.imp > 0 ? t.skips / t.imp : 0,
      longDwellRate: t.imp > 0 ? t.long / t.imp : 0,
      votesPerUser: t.users > 0 ? t.votes / t.users : 0,
      commentsPerUser: t.users > 0 ? t.comments / t.users : 0,
      sessionsPerUser: t.users > 0 ? t.sessions / t.users : 0,
      avgSessionMs: t.sessions > 0 ? Math.round(t.sessionMs / t.sessions) : 0,
      d1Eligible: t.d1Eligible,
      d1Returned: t.d1Returned,
      d1Rate: t.d1Eligible > 0 ? t.d1Returned / t.d1Eligible : 0,
    };
  });
  const c = totals.get("control") ?? emptyTotals();
  const comparisons = RANKING_VARIANTS.filter((v) => v !== "control").map((variant) => {
    const t = totals.get(variant) ?? emptyTotals();
    return {
      variant,
      skipRateZ: twoProportionZ(t.skips, t.imp, c.skips, c.imp),
      longDwellZ: twoProportionZ(t.long, t.imp, c.long, c.imp),
      d1ReturnZ: twoProportionZ(t.d1Returned, t.d1Eligible, c.d1Returned, c.d1Eligible),
    };
  });
  return { arms, comparisons };
}

/**
 * Per-arm feed engagement for the ranking experiment over the last `days`.
 * Arms come from the variant stored on each impression (the arm the student
 * was actually served), not from today's assignment.
 */
export async function getRankingExperimentReadout(days = 7): Promise<ExperimentReadout> {
  const db = getDb();
  const since = sql`now() - make_interval(days => ${days})`;
  const dwellMsSql = sql<number>`coalesce((${userBehaviorEvents.metadata}->>'dwellMs')::int, 0)`;
  const variantSql = sql<string>`coalesce(${userBehaviorEvents.metadata}->>'variant', 'control')`;
  const experimentWhere = and(
    eq(userBehaviorEvents.eventType, "POST_DWELL"),
    eq(userBehaviorEvents.targetType, "POST"),
    sql`${userBehaviorEvents.metadata}->>'experiment' = ${RANKING_EXPERIMENT.id}`,
    gt(userBehaviorEvents.createdAt, since)
  );

  const [perUser, sessionRows, d1Rows] = await Promise.all([
    db
      .select({
        userId: userBehaviorEvents.userId,
        variant: variantSql,
        impressions: sql<number>`count(*)::int`,
        dwellSum: sql<number>`sum(${dwellMsSql})::bigint`,
        skips: sql<number>`count(*) filter (where ${dwellMsSql} < ${SKIP_DWELL_MS})::int`,
        longDwells: sql<number>`count(*) filter (where ${dwellMsSql} >= ${LONG_DWELL_MS})::int`,
      })
      .from(userBehaviorEvents)
      .where(experimentWhere)
      .groupBy(userBehaviorEvents.userId, variantSql)
      .limit(MAX_USERS),
    // Sessions: a new one starts after a 30-minute gap between impressions.
    // Length = last impression - first impression + the last impression's dwell.
    db.execute(sql`
      with ev as (
        select ${userBehaviorEvents.userId} as user_id,
               ${variantSql} as variant,
               ${userBehaviorEvents.createdAt} as at,
               ${dwellMsSql} as dwell,
               case when ${userBehaviorEvents.createdAt} - lag(${userBehaviorEvents.createdAt})
                      over (partition by ${userBehaviorEvents.userId} order by ${userBehaviorEvents.createdAt})
                      <= make_interval(mins => ${SESSION_GAP_MINUTES})
                    then 0 else 1 end as starts
          from ${userBehaviorEvents}
         where ${experimentWhere}
      ), numbered as (
        select *, sum(starts) over (partition by user_id order by at) as sid from ev
      ), sessions as (
        select variant,
               extract(epoch from (max(at) - min(at))) * 1000
                 + (array_agg(dwell order by at desc))[1] as ms
          from numbered
         group by user_id, variant, sid
      )
      select variant, count(*)::int as sessions, coalesce(sum(ms), 0)::float8 as total_ms
        from sessions
       group by variant
    `),
    // D1: first feed day in the window, then any activity on the next calendar day.
    // Only students whose next day has fully ended are counted.
    db.execute(sql`
      with firsts as (
        select ${userBehaviorEvents.userId} as user_id,
               min(${variantSql}) as variant,
               min(${userBehaviorEvents.createdAt})::date as d0
          from ${userBehaviorEvents}
         where ${experimentWhere}
         group by ${userBehaviorEvents.userId}
      )
      select f.variant,
             count(*)::int as eligible,
             count(*) filter (where exists (
               select 1 from ${userBehaviorEvents} e
                where e.user_id = f.user_id
                  and e.created_at >= f.d0 + 1
                  and e.created_at < f.d0 + 2
             ))::int as returned
        from firsts f
       where f.d0 + 2 <= current_date
       group by f.variant
    `),
  ]);

  const userIds = [...new Set(perUser.map((r) => r.userId))];
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

  const totals = new Map<RankingVariant, Totals>(RANKING_VARIANTS.map((v) => [v, emptyTotals()]));
  const countedUser = new Set<string>();
  for (const r of perUser) {
    const variant = toVariant(r.variant);
    const t = variant ? totals.get(variant) : undefined;
    if (!t) continue;
    t.users += 1;
    t.imp += Number(r.impressions);
    t.dwell += Number(r.dwellSum);
    t.skips += Number(r.skips);
    t.long += Number(r.longDwells);
    // A student who switched arms is credited once, to the first arm listed.
    if (!countedUser.has(r.userId)) {
      countedUser.add(r.userId);
      t.votes += voteCounts.get(r.userId) || 0;
      t.comments += commentCounts.get(r.userId) || 0;
    }
  }
  for (const r of (sessionRows.rows ?? []) as { variant: string; sessions: number; total_ms: number }[]) {
    const t = totals.get(toVariant(r.variant) as RankingVariant);
    if (!t) continue;
    t.sessions += Number(r.sessions) || 0;
    t.sessionMs += Number(r.total_ms) || 0;
  }
  for (const r of (d1Rows.rows ?? []) as { variant: string; eligible: number; returned: number }[]) {
    const t = totals.get(toVariant(r.variant) as RankingVariant);
    if (!t) continue;
    t.d1Eligible += Number(r.eligible) || 0;
    t.d1Returned += Number(r.returned) || 0;
  }

  const { arms, comparisons } = summarizeArms(totals);
  const personalized = comparisons.find((c) => c.variant === "personalized");
  return {
    experimentId: RANKING_EXPERIMENT.id,
    days,
    arms,
    comparisons,
    skipRateZ: personalized?.skipRateZ ?? 0,
    longDwellZ: personalized?.longDwellZ ?? 0,
  };
}
