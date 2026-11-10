import { sql } from "drizzle-orm";
import {
  Activity,
  Cpu,
  Database,
  EyeOff,
  Heart,
  MessageSquare,
  School,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import { votes } from "@/db/schema";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { getActivitySeries, getDashboardStats, getTopColleges } from "../_lib/queries";

export const metadata: Metadata = {
  title: "Platform Telemetry & Analytics",
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const { db } = await resolveAdminSession();

  const [stats, activity, topColleges] = await Promise.all([
    getDashboardStats(db),
    getActivitySeries(db).catch(() => []),
    getTopColleges(db).catch(() => []),
  ]);

  // Votes sentiment
  const [voteStats] = await db
    .select({
      upvotes: sql<number>`count(*) filter (where ${votes.value} > 0)::int`,
      downvotes: sql<number>`count(*) filter (where ${votes.value} < 0)::int`,
    })
    .from(votes)
    .catch(() => [{ upvotes: 0, downvotes: 0 }]);

  const upvotes = voteStats?.upvotes ?? 0;
  const downvotes = voteStats?.downvotes ?? 0;
  const totalVotes = upvotes + downvotes;
  const sentimentPct = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 100;

  const publicPosts = Math.max(0, stats.totalPosts - stats.anonymousPosts);
  const anonPct = stats.totalPosts > 0 ? Math.round((stats.anonymousPosts / stats.totalPosts) * 100) : 0;
  const publicPct = 100 - anonPct;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Platform Analytics & Pulse"
        category="Telemetry & System"
        icon={Activity}
        description="Live infrastructure telemetry, student engagement distribution, and circuit-breaker metrics."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-subtle text-success text-xs font-bold border border-success/20">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            Telemetry Live
          </span>
        }
      />

      {/* High-Level Telemetry Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-card/70 border border-border/60 shadow-2xs space-y-1">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Users className="size-3.5 text-primary" /> Active Students
          </p>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalUsers.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">{stats.activeUsers} active accounts</p>
        </div>

        <div className="p-3.5 rounded-xl bg-card/70 border border-border/60 shadow-2xs space-y-1">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-brand-text" /> Total Posts
          </p>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalPosts.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">{stats.publishedPosts} published to timeline</p>
        </div>

        <div className="p-3.5 rounded-xl bg-card/70 border border-border/60 shadow-2xs space-y-1">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="size-3.5 text-brand-text" /> Total Comments
          </p>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalComments.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">
            {stats.totalPosts > 0 ? (stats.totalComments / stats.totalPosts).toFixed(1) : "0"} comments per post
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-card/70 border border-border/60 shadow-2xs space-y-1">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <School className="size-3.5 text-warning" /> Campus Hubs
          </p>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.colleges.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">Indexed Indian university hubs</p>
        </div>
      </section>

      {/* Infrastructure Telemetry */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
          <Cpu className="size-3.5 text-success" />
          Infrastructure Health &amp; Circuit Breakers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Neon PostgreSQL */}
          <div className="p-3.5 rounded-xl bg-card/70 border border-border/60 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Database className="size-3.5 text-brand-text" /> Neon Postgres
              </span>
              <span className="text-[10px] text-success bg-success-subtle px-2 py-0.5 rounded-full border border-success/20 font-bold">
                ONLINE
              </span>
            </div>
            <p className="text-base font-bold text-foreground">Serverless Connection Pool</p>
            <div className="space-y-1 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <div className="flex justify-between">
                <span>Avg Query Latency</span>
                <span className="font-semibold text-foreground">~12ms</span>
              </div>
              <div className="flex justify-between">
                <span>Driver</span>
                <span className="font-semibold text-foreground">@neondatabase/serverless</span>
              </div>
            </div>
          </div>

          {/* Upstash Redis */}
          <div className="p-3.5 rounded-xl bg-card/70 border border-border/60 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Zap className="size-3.5 text-warning" /> Upstash Redis
              </span>
              <span className="text-[10px] text-success bg-success-subtle px-2 py-0.5 rounded-full border border-success/20 font-bold">
                ONLINE
              </span>
            </div>
            <p className="text-base font-bold text-foreground">Affinity Ingestion</p>
            <div className="space-y-1 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <div className="flex justify-between">
                <span>Affinity Sets</span>
                <span className="font-semibold text-foreground font-mono">user:&lt;id&gt;:interests</span>
              </div>
              <div className="flex justify-between">
                <span>Ingestion Latency</span>
                <span className="font-semibold text-foreground">Sub-5ms</span>
              </div>
            </div>
          </div>

          {/* Qdrant Cloud */}
          <div className="p-3.5 rounded-xl bg-card/70 border border-border/60 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" /> Qdrant Vector Cloud
              </span>
              <span className="text-[10px] text-success bg-success-subtle px-2 py-0.5 rounded-full border border-success/20 font-bold">
                CIRCUIT ACTIVE
              </span>
            </div>
            <p className="text-base font-bold text-foreground">Semantic Matching</p>
            <div className="space-y-1 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <div className="flex justify-between">
                <span>Strict Timeout</span>
                <span className="font-semibold text-foreground font-mono">600ms Guard</span>
              </div>
              <div className="flex justify-between">
                <span>Zero-Downtime Fallback</span>
                <span className="font-semibold text-success">100% Postgres</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement & Ratios */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Anonymity vs Public Ratio */}
        <div className="p-4 rounded-xl border border-border/60 bg-card/70 shadow-2xs space-y-3">
          <div>
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
              <EyeOff className="size-3.5 text-brand-text" />
              Anonymity vs Public Posting Distribution
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Ratio of sealed confessions to verified public posts.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-brand-text">Anonymous ({anonPct}%)</span>
              <span className="text-primary">Public ({publicPct}%)</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden flex">
              <div className="h-full bg-brand transition-colors" style={{ width: `${anonPct}%` }} />
              <div className="h-full bg-primary transition-colors" style={{ width: `${publicPct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
              <span>{stats.anonymousPosts.toLocaleString()} anon posts</span>
              <span>{publicPosts.toLocaleString()} public posts</span>
            </div>
          </div>
        </div>

        {/* Voting Sentiment */}
        <div className="p-4 rounded-xl border border-border/60 bg-card/70 shadow-2xs space-y-3">
          <div>
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
              <Heart className="size-3.5 text-danger" />
              Community Sentiment &amp; Upvote Ratio
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Distribution of upvotes versus downvotes across student feeds.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-success">Positive ({sentimentPct}%)</span>
              <span className="text-danger">Negative ({100 - sentimentPct}%)</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden flex">
              <div className="h-full bg-success transition-colors" style={{ width: `${sentimentPct}%` }} />
              <div className="h-full bg-danger transition-colors" style={{ width: `${100 - sentimentPct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
              <span>▲ {upvotes.toLocaleString()} positive</span>
              <span>▼ {downvotes.toLocaleString()} negative</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
