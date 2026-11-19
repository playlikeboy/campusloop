/**
 * Backfill post_engagement_stats (drizzle/manual/0013) from history:
 * - impressions, dwell, long reads, skips: POST_DWELL events
 * - reel completions, loops, skips, watch time: REEL_WATCH / REEL_LOOP / REEL_SKIP events
 * - votes (upvotes), comments (published), saves, shares (reposts), reports
 *
 * Idempotent: each column is set to GREATEST(current, recomputed), so re-runs
 * never double count, and counters the app already incremented are kept.
 * Batched by post id (keyset pagination), one INSERT ... SELECT per batch.
 *
 * Usage:
 *   bun run scripts/db/backfill-post-engagement-stats.ts [--dry-run] [--batch=500] [--since-days=N]
 *
 * --dry-run     run the aggregate SELECTs only and print totals; writes nothing.
 * --since-days  only posts created in the last N days (default: all posts).
 */
import { neon } from "@neondatabase/serverless";

import { loadLocalEnv } from "../../src/lib/load-env";

const LONG_DWELL_MS = 8000;
const SKIP_DWELL_MS = 1200;
const MAX_DWELL_MS = 120_000;

function arg(name: string): string | undefined {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return hit?.split("=")[1];
}

/** Aggregates for one batch of post ids ($1::text[]). */
const AGGREGATE_SQL = `
  with ids as (select unnest($1::text[]) as id),
  dwell as (
    select target_id as post_id,
           count(*) as impressions,
           sum(least(coalesce((metadata->>'dwellMs')::int, 0), ${MAX_DWELL_MS})) as dwell_ms,
           count(*) filter (where coalesce((metadata->>'dwellMs')::int, 0) >= ${LONG_DWELL_MS}) as long_dwell,
           count(*) filter (where coalesce((metadata->>'dwellMs')::int, 0) < ${SKIP_DWELL_MS}) as skips,
           max(created_at) as last_at
      from user_behavior_events
     where target_id = any($1::text[]) and event_type = 'POST_DWELL' and target_type = 'POST'
     group by target_id
  ),
  reel as (
    select target_id as post_id,
           count(*) as impressions,
           sum(least(coalesce((metadata->>'watchDurationMs')::int, 0), ${MAX_DWELL_MS})) as dwell_ms,
           count(*) filter (where coalesce((metadata->>'watchDurationMs')::int, 0) >= ${LONG_DWELL_MS}) as long_dwell,
           count(*) filter (where event_type = 'REEL_SKIP') as skips,
           count(*) filter (where event_type = 'REEL_LOOP' or coalesce((metadata->>'completed')::boolean, false)) as completions,
           sum(least(greatest(coalesce((metadata->>'loopCount')::int, 0), 0), 20)) as loops,
           max(created_at) as last_at
      from user_behavior_events
     where target_id = any($1::text[]) and event_type in ('REEL_WATCH', 'REEL_LOOP', 'REEL_SKIP')
     group by target_id
  ),
  v as (
    select post_id, count(*) filter (where value = 1) as n, max(created_at) as last_at
      from votes where post_id = any($1::text[]) group by post_id
  ),
  c as (
    select post_id, count(*) as n, max(created_at) as last_at
      from comments where post_id = any($1::text[]) and status = 'PUBLISHED' group by post_id
  ),
  s as (select post_id, count(*) as n from saved_posts where post_id = any($1::text[]) group by post_id),
  sh as (select repost_of_id as post_id, count(*) as n from posts where repost_of_id = any($1::text[]) group by repost_of_id),
  rp as (
    select target_id as post_id, count(*) as n from reports
     where target_type = 'POST' and target_id = any($1::text[]) group by target_id
  )
  select p.id as post_id,
         (coalesce(dwell.impressions, 0) + coalesce(reel.impressions, 0))::int as impressions,
         (coalesce(dwell.dwell_ms, 0) + coalesce(reel.dwell_ms, 0))::bigint as dwell_ms_sum,
         (coalesce(dwell.long_dwell, 0) + coalesce(reel.long_dwell, 0))::int as long_dwell,
         (coalesce(dwell.skips, 0) + coalesce(reel.skips, 0))::int as skips,
         coalesce(v.n, 0)::int as votes,
         coalesce(c.n, 0)::int as comments,
         coalesce(sh.n, 0)::int as shares,
         coalesce(s.n, 0)::int as saves,
         coalesce(rp.n, 0)::int as reports,
         coalesce(reel.completions, 0)::int as completions,
         coalesce(reel.loops, 0)::int as loops,
         greatest(p.created_at, dwell.last_at, reel.last_at, v.last_at, c.last_at) as updated_at
    from posts p
    join ids on ids.id = p.id
    left join dwell on dwell.post_id = p.id
    left join reel on reel.post_id = p.id
    left join v on v.post_id = p.id
    left join c on c.post_id = p.id
    left join s on s.post_id = p.id
    left join sh on sh.post_id = p.id
    left join rp on rp.post_id = p.id
`;

const COUNTERS = [
  "impressions",
  "dwell_ms_sum",
  "long_dwell",
  "skips",
  "votes",
  "comments",
  "shares",
  "saves",
  "reports",
  "completions",
  "loops",
] as const;

const UPSERT_SQL = `
  insert into post_engagement_stats (post_id, ${COUNTERS.join(", ")}, updated_at)
  ${AGGREGATE_SQL}
  on conflict (post_id) do update set
    ${COUNTERS.map((col) => `${col} = greatest(post_engagement_stats.${col}, excluded.${col})`).join(",\n    ")},
    updated_at = greatest(post_engagement_stats.updated_at, excluded.updated_at)
`;

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const batchSize = Math.min(Math.max(Number(arg("batch")) || 500, 50), 2000);
  const sinceDays = arg("since-days") ? Number(arg("since-days")) : null;

  loadLocalEnv();
  const url = process.env.DATABASE_URL ?? process.env.DB_URL;
  if (!url) {
    console.error("DATABASE_URL (or DB_URL) is not set.");
    process.exit(1);
  }
  const sql = neon(url);

  const [{ exists }] = (await sql.query(
    `select to_regclass('public.post_engagement_stats') is not null as exists`
  )) as { exists: boolean }[];
  if (!exists && !dryRun) {
    console.error("post_engagement_stats does not exist. Apply drizzle/manual/0013_post_engagement_stats.sql first.");
    process.exit(1);
  }
  console.log(
    `backfill post_engagement_stats${dryRun ? " [dry run, no writes]" : ""} batch=${batchSize}` +
      (sinceDays ? ` since=${sinceDays}d` : "") +
      (exists ? "" : " (table missing: dry run only)")
  );

  const totals: Record<string, number> = Object.fromEntries(COUNTERS.map((c) => [c, 0]));
  let lastId = "";
  let posts = 0;
  let batches = 0;
  const started = performance.now();

  for (;;) {
    const params: unknown[] = [lastId, batchSize];
    let where = "id > $1";
    if (sinceDays) {
      params.push(sinceDays);
      where += " and created_at > now() - make_interval(days => $3::int)";
    }
    const rows = (await sql.query(`select id from posts where ${where} order by id limit $2`, params)) as {
      id: string;
    }[];
    if (rows.length === 0) break;
    const ids = rows.map((r) => r.id);
    lastId = ids[ids.length - 1];
    batches++;
    posts += ids.length;

    if (dryRun) {
      const agg = (await sql.query(AGGREGATE_SQL, [ids])) as Record<string, number | string>[];
      for (const row of agg) for (const c of COUNTERS) totals[c] += Number(row[c]) || 0;
    } else {
      await sql.query(UPSERT_SQL, [ids]);
    }
    if (batches % 10 === 0) console.log(`  ${posts} posts (${batches} batches)…`);
  }

  console.log(`done: ${posts} posts in ${batches} batches, ${((performance.now() - started) / 1000).toFixed(1)}s`);
  if (dryRun) console.log("would write totals:", totals);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
