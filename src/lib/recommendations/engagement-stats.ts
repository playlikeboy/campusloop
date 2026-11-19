import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { postEngagementStats } from "@/db/schema";
import { runInBackground } from "@/lib/background";
import { IsolateCache } from "@/lib/isolate-cache";
import { getRedis } from "@/lib/redis";
import { deriveTypePriors, type TypePrior, type TypePriorRow } from "@/lib/recommendations/value-model";

/**
 * Writers and readers for `post_engagement_stats` (drizzle/manual/0013).
 *
 * The table may not exist yet on a given database. Every function here treats
 * "relation does not exist" as a soft failure: it remembers the table is
 * missing for a few minutes (so the hot path stops paying for failed queries),
 * and callers fall back to ranking v2.
 */

const MISSING_RECHECK_MS = 5 * 60 * 1000;
let missingUntil = 0;
let missingLogged = false;

export function isMissingStatsTableError(error: unknown): boolean {
  const seen = new Set<unknown>();
  let e = error as { code?: string; message?: string; cause?: unknown } | null | undefined;
  while (e && typeof e === "object" && !seen.has(e)) {
    seen.add(e);
    if (e.code === "42P01" && /post_engagement_stats/i.test(String(e.message ?? ""))) return true;
    if (/post_engagement_stats.*does not exist/i.test(String(e.message ?? ""))) return true;
    e = e.cause as typeof e;
  }
  return false;
}

/** Messages along the `cause` chain (Drizzle wraps the driver error). */
function errorChainText(error: unknown): string {
  const parts: string[] = [];
  let e = error as { message?: string; cause?: unknown } | null | undefined;
  for (let depth = 0; e && typeof e === "object" && depth < 5; depth++) {
    parts.push(String(e.message ?? ""));
    e = e.cause as typeof e;
  }
  return parts.join(" | ");
}

const isForeignKeyError = (error: unknown) => /foreign key/i.test(errorChainText(error));

/** True while the table is known to be missing; the v3 ranker is skipped. */
export function isEngagementStatsUnavailable(): boolean {
  return Date.now() < missingUntil;
}

/**
 * Record a stats failure. Returns true when it was the missing-table case
 * (already handled); false means the caller should log it as a real error.
 */
export function noteStatsError(error: unknown): boolean {
  if (!isMissingStatsTableError(error)) return false;
  missingUntil = Date.now() + MISSING_RECHECK_MS;
  if (!missingLogged) {
    console.warn(
      "[engagement-stats] post_engagement_stats missing: ranking v3 falls back to v2 (apply drizzle/manual/0013)"
    );
    missingLogged = true;
  }
  return true;
}

/** Test hook. */
export function resetEngagementStatsState(): void {
  missingUntil = 0;
  missingLogged = false;
}

export type CounterField = "votes" | "comments" | "shares" | "saves" | "profileTaps" | "reports";

const COUNTER_COLUMNS: Record<CounterField, string> = {
  votes: "votes",
  comments: "comments",
  shares: "shares",
  saves: "saves",
  profileTaps: "profile_taps",
  reports: "reports",
};

const SAFE_ID = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * One `+1` on a post's counter (upsert, so a post with no row yet gets one).
 * Never throws and never blocks on a missing table.
 */
export async function incrementPostStat(postId: string, field: CounterField, by = 1): Promise<void> {
  if (!SAFE_ID.test(postId) || isEngagementStatsUnavailable()) return;
  const column = sql.raw(COUNTER_COLUMNS[field]);
  try {
    await getDb().execute(sql`
      insert into post_engagement_stats (post_id, ${column}, updated_at)
      values (${postId}, ${by}, now())
      on conflict (post_id) do update
        set ${column} = post_engagement_stats.${column} + excluded.${column},
            updated_at = now()
    `);
  } catch (error) {
    // A foreign-key miss (post deleted meanwhile) is as harmless as a missing table.
    if (!noteStatsError(error) && !isForeignKeyError(error)) {
      console.warn(`[engagement-stats] increment ${field} failed:`, error);
    }
  }
}

/** Fire-and-forget form for API routes: keeps the response fast, never throws. */
export function bumpPostStat(postId: string, field: CounterField): void {
  runInBackground(incrementPostStat(postId, field), "post-stats");
}

export interface ImpressionDelta {
  postId: string;
  impressions: number;
  dwellMs: number;
  longDwell: number;
  skips: number;
  completions?: number;
  loops?: number;
  shares?: number;
}

/** Batched impression upsert: one statement for the whole batch. */
export async function recordImpressionDeltas(deltas: ImpressionDelta[]): Promise<void> {
  const rows = deltas.filter((d) => SAFE_ID.test(d.postId));
  if (rows.length === 0 || isEngagementStatsUnavailable()) return;
  const int = (v: number | undefined) => Math.max(0, Math.round(Number(v) || 0));
  try {
    await getDb()
      .insert(postEngagementStats)
      .values(
        rows.map((d) => ({
          postId: d.postId,
          impressions: int(d.impressions),
          dwellMsSum: int(d.dwellMs),
          longDwell: int(d.longDwell),
          skips: int(d.skips),
          completions: int(d.completions),
          loops: int(d.loops),
          shares: int(d.shares),
          updatedAt: new Date(),
        }))
      )
      .onConflictDoUpdate({
        target: postEngagementStats.postId,
        set: {
          impressions: sql`${postEngagementStats.impressions} + excluded.impressions`,
          dwellMsSum: sql`${postEngagementStats.dwellMsSum} + excluded.dwell_ms_sum`,
          longDwell: sql`${postEngagementStats.longDwell} + excluded.long_dwell`,
          skips: sql`${postEngagementStats.skips} + excluded.skips`,
          completions: sql`${postEngagementStats.completions} + excluded.completions`,
          loops: sql`${postEngagementStats.loops} + excluded.loops`,
          shares: sql`${postEngagementStats.shares} + excluded.shares`,
          updatedAt: sql`now()`,
        },
      });
  } catch (error) {
    // Ids that aren't posts (e.g. reels-table ids from telemetry) fail the foreign key: ignore.
    if (!noteStatsError(error) && !isForeignKeyError(error)) {
      console.warn("[engagement-stats] impression upsert failed:", error);
    }
  }
}

// ── Type priors ──
// Learned from every post touched in the last 30 days, refreshed at most every
// 6 hours (lazily, by whichever feed request finds the cache empty).

const PRIORS_KEY = "feed:type-priors:v1";
const PRIORS_TTL_SECONDS = 6 * 60 * 60;
const priorsMemo = new IsolateCache<Record<string, TypePrior>>(30 * 60 * 1000, 4);
let priorsInflight: Promise<Record<string, TypePrior>> | null = null;

export async function getTypePriors(): Promise<Record<string, TypePrior>> {
  const hit = priorsMemo.get(PRIORS_KEY);
  if (hit) return hit;
  if (!priorsInflight) {
    priorsInflight = loadTypePriors()
      .then((priors) => {
        priorsMemo.set(PRIORS_KEY, priors);
        return priors;
      })
      .finally(() => {
        priorsInflight = null;
      });
  }
  return priorsInflight;
}

async function loadTypePriors(): Promise<Record<string, TypePrior>> {
  const redis = getRedis();
  try {
    const cached = await redis?.get<Record<string, TypePrior>>(PRIORS_KEY);
    if (cached && typeof cached === "object") return cached;
  } catch {
    // Recompute below
  }
  if (isEngagementStatsUnavailable()) return deriveTypePriors([]);

  try {
    const result = await getDb().execute(sql`
      select p.type as "type",
             count(*)::int as "posts",
             coalesce(sum(s.impressions), 0)::float8 as "impressions",
             coalesce(sum(s.dwell_ms_sum), 0)::float8 as "dwellMsSum",
             coalesce(sum(s.long_dwell), 0)::float8 as "longDwell",
             coalesce(sum(s.skips), 0)::float8 as "skips",
             coalesce(sum(s.votes), 0)::float8 as "votes",
             coalesce(sum(s.comments), 0)::float8 as "comments",
             coalesce(sum(s.shares), 0)::float8 as "shares",
             coalesce(sum(s.saves), 0)::float8 as "saves",
             coalesce(sum(s.profile_taps), 0)::float8 as "profileTaps",
             coalesce(sum(s.completions), 0)::float8 as "completions",
             coalesce(sum(s.loops), 0)::float8 as "loops",
             percentile_cont(0.5) within group (
               order by (s.votes + s.comments + s.shares + s.saves)::float8 / greatest(s.impressions, 1)
             ) filter (where s.impressions >= 30) as "medianEngage"
        from post_engagement_stats s
        join posts p on p.id = s.post_id
       where s.updated_at > now() - interval '30 days'
       group by p.type
    `);
    const rows = ((result as unknown as { rows?: TypePriorRow[] }).rows ?? []) as TypePriorRow[];
    const priors = deriveTypePriors(rows);
    redis?.set(PRIORS_KEY, priors, { ex: PRIORS_TTL_SECONDS }).catch(() => {});
    return priors;
  } catch (error) {
    if (!noteStatsError(error)) console.warn("[engagement-stats] type priors failed:", error);
    return deriveTypePriors([]);
  }
}
