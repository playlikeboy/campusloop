import { sql } from "drizzle-orm";
import { Activity, ArrowRight, EyeOff, School, ThumbsUp, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { votes } from "@/db/schema";
import { privateMetadata } from "@/lib/seo";
import { ActivityChart } from "../_components/activity-chart";
import { AdminPageHeader } from "../_components/admin-page-header";
import { AdminStatStrip } from "../_components/admin-stat-strip";
import { resolveAdminSession } from "../_lib/guard";
import { getActivitySeries, getDashboardStats, getTopColleges } from "../_lib/queries";
import { SplitBar } from "./split-bar";

export const metadata: Metadata = privateMetadata("Analytics");

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-IN");

export default async function AdminAnalyticsPage() {
  const { db } = await resolveAdminSession();

  const [stats, activity, topColleges, voteRows] = await Promise.all([
    getDashboardStats(db),
    getActivitySeries(db).catch(() => []),
    getTopColleges(db).catch(() => []),
    db
      .select({
        upvotes: sql<number>`count(*) filter (where ${votes.value} > 0)::int`,
        downvotes: sql<number>`count(*) filter (where ${votes.value} < 0)::int`,
      })
      .from(votes)
      .catch(() => [{ upvotes: 0, downvotes: 0 }]),
  ]);

  const upvotes = voteRows[0]?.upvotes ?? 0;
  const downvotes = voteRows[0]?.downvotes ?? 0;
  const namedPosts = Math.max(0, stats.totalPosts - stats.anonymousPosts);
  const commentsPerPost = stats.totalPosts > 0 ? (stats.totalComments / stats.totalPosts).toFixed(1) : "0";

  const totals: [string, string, string][] = [
    ["Students", fmt(stats.totalUsers), `${fmt(stats.activeUsers)} active accounts`],
    ["Posts", fmt(stats.totalPosts), `${fmt(stats.publishedPosts)} published`],
    ["Comments", fmt(stats.totalComments), `${commentsPerPost} per post`],
    ["Colleges", fmt(stats.colleges), "Listed on CampusLoop"],
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics"
        icon={Activity}
        description="Signups, posts and engagement across CampusLoop."
        actions={
          <Link
            href="/admin/system"
            className="inline-flex min-h-11 items-center gap-1 px-1 text-sm font-semibold text-brand-text hover:underline"
          >
            Service health <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />

      <AdminStatStrip items={totals.map(([label, value, note]) => ({ label, value, note }))} />

      <section className="rounded-lg border border-border bg-surface p-4 sm:p-5">
        <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-fg">
          <TrendingUp className="size-4 text-fg-muted" aria-hidden /> Last 14 days
        </h2>
        {activity.length > 0 ? (
          <div className="mt-3">
            <ActivityChart data={activity} />
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-fg-muted">No activity in the last 14 days.</p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <SplitBar
          title="Anonymous vs named posts"
          description="How many posts hide the author's name."
          icon={EyeOff}
          left={{ label: "Anonymous", value: stats.anonymousPosts }}
          right={{ label: "Named", value: namedPosts }}
        />
        <SplitBar
          title="Upvotes vs downvotes"
          description="Every up and down vote students have cast."
          icon={ThumbsUp}
          left={{ label: "Upvotes", value: upvotes }}
          right={{ label: "Downvotes", value: downvotes }}
        />
      </div>

      <section className="rounded-lg border border-border bg-surface">
        <h2 className="flex items-center gap-2 border-b border-border p-4 font-sans text-base font-semibold text-fg">
          <School className="size-4 text-fg-muted" aria-hidden /> Most active colleges
        </h2>
        {topColleges.length === 0 ? (
          <EmptyState icon={School} title="No college activity yet" size="compact" />
        ) : (
          <ol className="divide-y divide-border">
            {topColleges.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-5 shrink-0 tabular-nums text-fg-subtle">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-fg">{c.name}</span>
                <span className="shrink-0 tabular-nums text-fg-muted">
                  {fmt(c.students)} students · {fmt(c.postCount)} posts
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
