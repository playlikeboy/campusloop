import "server-only";

import { sql } from "drizzle-orm";
import { IsolateCache } from "@/lib/isolate-cache";
import type { Db } from "./db-context";

/**
 * Product analytics for /admin/analytics.
 *
 * "Real" users are every profile with is_seeded = false (seed/demo accounts carry
 * is_seeded = true). Day buckets are in Asia/Kolkata because the audience is Indian.
 * Every function is one SQL aggregate and one round trip; the page runs them in
 * Promise.all and caches the whole payload for five minutes per isolate.
 */

const IST = sql.raw(`'Asia/Kolkata'`);

function rowsOf(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  return ((result as { rows?: unknown[] })?.rows ?? []) as Record<string, unknown>[];
}

const num = (v: unknown) => Number(v ?? 0) || 0;
const str = (v: unknown) => (v == null ? "" : String(v));

/* ───────────────────────── Headline ───────────────────────── */

export type HeadlineStats = {
  realUsers: number;
  seededUsers: number;
  signupsToday: number;
  signupsYesterday: number;
  signups7d: number;
  signupsPrev7d: number;
  signups30d: number;
  signupsPrev30d: number;
  dau: number;
  wau: number;
  mau: number;
};

export async function getHeadline(db: Db): Promise<HeadlineStats> {
  const r = rowsOf(
    await db.execute(sql`
      with b as (select (now() at time zone ${IST})::date as today)
      select
        count(*) filter (where not p.is_seeded)::int as real_users,
        count(*) filter (where p.is_seeded)::int as seeded_users,
        count(*) filter (where not p.is_seeded and (p.created_at at time zone ${IST})::date = b.today)::int as today,
        count(*) filter (where not p.is_seeded and (p.created_at at time zone ${IST})::date = b.today - 1)::int as yesterday,
        count(*) filter (where not p.is_seeded and p.created_at >= now() - interval '7 days')::int as d7,
        count(*) filter (where not p.is_seeded and p.created_at >= now() - interval '14 days' and p.created_at < now() - interval '7 days')::int as p7,
        count(*) filter (where not p.is_seeded and p.created_at >= now() - interval '30 days')::int as d30,
        count(*) filter (where not p.is_seeded and p.created_at >= now() - interval '60 days' and p.created_at < now() - interval '30 days')::int as p30,
        count(*) filter (where not p.is_seeded and p.last_seen_at >= now() - interval '1 day')::int as dau,
        count(*) filter (where not p.is_seeded and p.last_seen_at >= now() - interval '7 days')::int as wau,
        count(*) filter (where not p.is_seeded and p.last_seen_at >= now() - interval '30 days')::int as mau
      from user_profiles p cross join b
      group by b.today
    `)
  )[0];
  return {
    realUsers: num(r?.real_users),
    seededUsers: num(r?.seeded_users),
    signupsToday: num(r?.today),
    signupsYesterday: num(r?.yesterday),
    signups7d: num(r?.d7),
    signupsPrev7d: num(r?.p7),
    signups30d: num(r?.d30),
    signupsPrev30d: num(r?.p30),
    dau: num(r?.dau),
    wau: num(r?.wau),
    mau: num(r?.mau),
  };
}

/* ───────────────────────── Recent signups ───────────────────────── */

export type RecentSignup = {
  id: string;
  displayName: string;
  username: string;
  college: string;
  createdAt: string;
  onboarded: boolean;
  verified: boolean;
  source: string;
};

export async function getRecentSignups(db: Db, limit = 50): Promise<RecentSignup[]> {
  return rowsOf(
    await db.execute(sql`
      select p.id, p.display_name, p.username, i.name as college, p.created_at,
             p.onboarding_completed, p.is_college_verified, ref.username as referred_by
      from user_profiles p
      left join institutions i on i.id = p.institution_id
      left join user_profiles ref on ref.id = p.referred_by_id
      where not p.is_seeded
      order by p.created_at desc
      limit ${limit}
    `)
  ).map((r) => ({
    id: str(r.id),
    displayName: str(r.display_name),
    username: str(r.username),
    college: str(r.college),
    createdAt: new Date(str(r.created_at)).toISOString(),
    onboarded: Boolean(r.onboarding_completed),
    verified: Boolean(r.is_college_verified),
    source: r.referred_by ? `Invite from @${str(r.referred_by)}` : "Direct",
  }));
}

/* ───────────────────────── Signup series ───────────────────────── */

export type SeriesPoint = { label: string; value: number };

export async function getSignupSeries(db: Db): Promise<{ daily: SeriesPoint[]; weekly: SeriesPoint[] }> {
  const [daily, weekly] = await Promise.all([
    db.execute(sql`
      with days as (
        select generate_series((now() at time zone ${IST})::date - 29, (now() at time zone ${IST})::date, interval '1 day')::date as d
      ), s as (
        select (created_at at time zone ${IST})::date as d, count(*)::int as n
        from user_profiles
        where not is_seeded and created_at >= now() - interval '31 days'
        group by 1
      )
      select to_char(days.d, 'DD Mon') as label, coalesce(s.n, 0)::int as value
      from days left join s on s.d = days.d order by days.d
    `),
    db.execute(sql`
      with weeks as (
        select generate_series(date_trunc('week', now() at time zone ${IST})::date - 77, date_trunc('week', now() at time zone ${IST})::date, interval '7 days')::date as w
      ), s as (
        select date_trunc('week', created_at at time zone ${IST})::date as w, count(*)::int as n
        from user_profiles
        where not is_seeded and created_at >= now() - interval '13 weeks'
        group by 1
      )
      select to_char(weeks.w, 'DD Mon') as label, coalesce(s.n, 0)::int as value
      from weeks left join s on s.w = weeks.w order by weeks.w
    `),
  ]);
  const map = (rows: Record<string, unknown>[]) => rows.map((r) => ({ label: str(r.label), value: num(r.value) }));
  return { daily: map(rowsOf(daily)), weekly: map(rowsOf(weekly)) };
}

/* ───────────────────────── Activation funnel ───────────────────────── */

/** Actions that count as "did something": post, comment, vote, poll vote, course enroll, event register. */
const FIRST_ACTION_SQL = sql`
  select author_id as uid, created_at as at from posts where author_id is not null
  union all select author_id, created_at from comments where author_id is not null
  union all select user_id, created_at from votes
  union all select user_id, created_at from poll_votes
  union all select profile_id, created_at from course_enrollments
  union all select profile_id, created_at from event_registrations
`;

export type Funnel = { signedUp: number; onboarded: number; activated7d: number };

export async function getFunnel(db: Db): Promise<Funnel> {
  const r = rowsOf(
    await db.execute(sql`
      with first_act as (
        select a.uid, min(a.at) as first_at from (${FIRST_ACTION_SQL}) a group by a.uid
      )
      select
        count(*)::int as signed_up,
        count(*) filter (where p.onboarding_completed)::int as onboarded,
        count(*) filter (where f.first_at is not null and f.first_at < p.created_at + interval '7 days')::int as activated
      from user_profiles p
      left join first_act f on f.uid = p.id
      where not p.is_seeded
    `)
  )[0];
  return { signedUp: num(r?.signed_up), onboarded: num(r?.onboarded), activated7d: num(r?.activated) };
}

/* ───────────────────────── Retention cohorts ───────────────────────── */

/** Any sign of life: content, votes, learning, chat, streaks, swipes, behaviour events. */
const ACTIVITY_SQL = sql`
  ${FIRST_ACTION_SQL}
  union all select profile_id, updated_at from course_lecture_progress
  union all select sender_id, created_at from messages
  union all select user_id, created_at from streak_events
  union all select user_id, created_at from community_members
  union all select swiper_id, created_at from swipes
  union all select user_id, created_at from stories
  union all select user_id, created_at from user_behavior_events
`;

export type Cohort = { week: string; size: number; retained: number[] };

/** Signup-week cohorts for the last 8 weeks; retained[k] = users active in days [7k, 7k+7) after signup, k = 1..4. */
export async function getRetentionCohorts(db: Db): Promise<Cohort[]> {
  const rows = rowsOf(
    await db.execute(sql`
      with cohort as (
        select id, created_at, date_trunc('week', created_at at time zone ${IST})::date as w
        from user_profiles
        where not is_seeded and created_at >= date_trunc('week', now() at time zone ${IST}) - interval '7 weeks'
      ), act as (
        select distinct a.uid, floor(extract(epoch from (a.at - c.created_at)) / 604800)::int as k
        from (${ACTIVITY_SQL}) a
        join cohort c on c.id = a.uid
        where a.at >= c.created_at + interval '7 days' and a.at < c.created_at + interval '35 days'
      )
      select to_char(c.w, 'DD Mon') as week, c.w,
        count(distinct c.id)::int as size,
        count(distinct act.uid) filter (where act.k = 1)::int as w1,
        count(distinct act.uid) filter (where act.k = 2)::int as w2,
        count(distinct act.uid) filter (where act.k = 3)::int as w3,
        count(distinct act.uid) filter (where act.k = 4)::int as w4
      from cohort c left join act on act.uid = c.id
      group by c.w order by c.w
    `)
  );
  return rows.map((r) => ({
    week: str(r.week),
    size: num(r.size),
    retained: [num(r.w1), num(r.w2), num(r.w3), num(r.w4)],
  }));
}

/* ───────────────────────── Colleges ───────────────────────── */

export type CollegeRow = { id: string; name: string; users: number; active7d: number };

export async function getCollegeBreakdown(db: Db, limit = 10): Promise<{ byUsers: CollegeRow[]; byActive: CollegeRow[] }> {
  const rows = rowsOf(
    await db.execute(sql`
      select i.id, i.name,
        count(*)::int as users,
        count(*) filter (where p.last_seen_at >= now() - interval '7 days')::int as active7d
      from user_profiles p join institutions i on i.id = p.institution_id
      where not p.is_seeded
      group by i.id, i.name
    `)
  ).map((r) => ({ id: str(r.id), name: str(r.name), users: num(r.users), active7d: num(r.active7d) }));
  return {
    byUsers: [...rows].sort((a, b) => b.users - a.users).slice(0, limit),
    byActive: rows.filter((r) => r.active7d > 0).sort((a, b) => b.active7d - a.active7d).slice(0, limit),
  };
}

/* ───────────────────────── Feature usage ───────────────────────── */

export type FeatureUsage = { feature: string; users: number; actions: number };

export async function getFeatureUsage(db: Db): Promise<FeatureUsage[]> {
  const rows = rowsOf(
    await db.execute(sql`
      with u as (
        select 'Posts' as f, author_id as uid, created_at as at from posts where author_id is not null and type <> 'CONFESSION'
        union all select 'Confessions', author_id, created_at from posts where author_id is not null and type = 'CONFESSION'
        union all select 'Comments', author_id, created_at from comments where author_id is not null
        union all select 'Votes', user_id, created_at from votes
        union all select 'Votes', user_id, created_at from poll_votes
        union all select 'Votes', user_id, created_at from comment_votes
        union all select 'Course views', user_id, created_at from user_behavior_events where event_type = 'COURSE_VIEW'
        union all select 'Course enrolls', profile_id, created_at from course_enrollments
        union all select 'Lecture progress', profile_id, updated_at from course_lecture_progress
        union all select 'Event registrations', profile_id, created_at from event_registrations
        union all select 'Chat messages', sender_id, created_at from messages
        union all select 'Community joins', user_id, created_at from community_members
        union all select 'Streak days', user_id, created_at from streak_events
        union all select 'Swipes', swiper_id, created_at from swipes
        union all select 'Secret crushes', sender_id, created_at from secret_crushes
        union all select 'Board items', creator_id, created_at from rideshare_pools
        union all select 'Board items', author_id, created_at from housing_listings
        union all select 'Board items', author_id, created_at from lost_and_found_items
        union all select 'Board items', seller_id, created_at from marketplace_items
        union all select 'Stories', user_id, created_at from stories
      )
      select u.f as feature, count(distinct u.uid)::int as users, count(*)::int as actions
      from u join user_profiles p on p.id = u.uid
      where not p.is_seeded and u.at >= now() - interval '30 days'
      group by u.f
    `)
  );
  const order = [
    "Posts",
    "Confessions",
    "Comments",
    "Votes",
    "Course views",
    "Course enrolls",
    "Lecture progress",
    "Event registrations",
    "Chat messages",
    "Community joins",
    "Streak days",
    "Swipes",
    "Secret crushes",
    "Board items",
    "Stories",
  ];
  const byName = new Map(rows.map((r) => [str(r.feature), { users: num(r.users), actions: num(r.actions) }]));
  return order
    .map((feature) => ({ feature, ...(byName.get(feature) ?? { users: 0, actions: 0 }) }))
    .sort((a, b) => b.users - a.users || b.actions - a.actions);
}

/* ───────────────────────── Content per day ───────────────────────── */

export type ContentPoint = { day: string; posts: number; comments: number; messages: number };

export async function getContentSeries(db: Db): Promise<ContentPoint[]> {
  return rowsOf(
    await db.execute(sql`
      with days as (
        select generate_series((now() at time zone ${IST})::date - 29, (now() at time zone ${IST})::date, interval '1 day')::date as d
      ), c as (
        select k, (at at time zone ${IST})::date as d, count(*)::int as n from (
          select 'posts' as k, author_id as uid, created_at as at from posts where created_at >= now() - interval '31 days'
          union all select 'comments', author_id, created_at from comments where created_at >= now() - interval '31 days'
          union all select 'messages', sender_id, created_at from messages where created_at >= now() - interval '31 days'
        ) x join user_profiles p on p.id = x.uid
        where not p.is_seeded
        group by 1, 2
      )
      select to_char(days.d, 'DD Mon') as day,
        coalesce(sum(c.n) filter (where c.k = 'posts'), 0)::int as posts,
        coalesce(sum(c.n) filter (where c.k = 'comments'), 0)::int as comments,
        coalesce(sum(c.n) filter (where c.k = 'messages'), 0)::int as messages
      from days left join c on c.d = days.d
      group by days.d order by days.d
    `)
  ).map((r) => ({ day: str(r.day), posts: num(r.posts), comments: num(r.comments), messages: num(r.messages) }));
}

/* ───────────────────────── Payload ───────────────────────── */

export type ProductAnalytics = {
  headline: HeadlineStats;
  recentSignups: RecentSignup[];
  signups: { daily: SeriesPoint[]; weekly: SeriesPoint[] };
  funnel: Funnel;
  cohorts: Cohort[];
  colleges: { byUsers: CollegeRow[]; byActive: CollegeRow[] };
  features: FeatureUsage[];
  content: ContentPoint[];
  generatedAt: string;
  failed: string[];
};

const payloadCache = new IsolateCache<ProductAnalytics>(5 * 60_000, 4);

async function safe<T>(name: string, failed: string[], fallback: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(`[admin analytics] ${name} failed:`, error);
    failed.push(name);
    return fallback;
  }
}

/** Whole product-analytics payload, cached 5 minutes per isolate. */
export async function getProductAnalytics(db: Db, { fresh = false } = {}): Promise<ProductAnalytics> {
  if (!fresh) {
    const hit = payloadCache.get("all");
    if (hit) return hit;
  }
  const failed: string[] = [];
  const emptyHeadline: HeadlineStats = {
    realUsers: 0,
    seededUsers: 0,
    signupsToday: 0,
    signupsYesterday: 0,
    signups7d: 0,
    signupsPrev7d: 0,
    signups30d: 0,
    signupsPrev30d: 0,
    dau: 0,
    wau: 0,
    mau: 0,
  };
  const [headline, recentSignups, signups, funnel, cohorts, colleges, features, content] = await Promise.all([
    safe("headline", failed, emptyHeadline, () => getHeadline(db)),
    safe("recent signups", failed, [], () => getRecentSignups(db)),
    safe("signup series", failed, { daily: [], weekly: [] }, () => getSignupSeries(db)),
    safe("funnel", failed, { signedUp: 0, onboarded: 0, activated7d: 0 }, () => getFunnel(db)),
    safe("retention", failed, [], () => getRetentionCohorts(db)),
    safe("colleges", failed, { byUsers: [], byActive: [] }, () => getCollegeBreakdown(db)),
    safe("feature usage", failed, [], () => getFeatureUsage(db)),
    safe("content series", failed, [], () => getContentSeries(db)),
  ]);
  const payload: ProductAnalytics = {
    headline,
    recentSignups,
    signups,
    funnel,
    cohorts,
    colleges,
    features,
    content,
    generatedAt: new Date().toISOString(),
    failed,
  };
  if (failed.length === 0) payloadCache.set("all", payload);
  return payload;
}
