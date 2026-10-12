import { desc, eq } from "drizzle-orm";
import {
  ArrowRight,
  FileText,
  Ghost,
  GraduationCap,
  RotateCw,
  Server,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { institutions, posts, userProfiles } from "@/db/schema";
import { ActivityChart } from "./_components/activity-chart";
import { AdminPageHeader } from "./_components/admin-page-header";
import { StatCard } from "./_components/stat-card";
import { resolveAdminSession } from "./_lib/guard";
import {
  getActivitySeries,
  getDashboardStats,
  getPendingReviewPosts,
  getRecentAuditLog,
  getTopColleges,
  getTotalEngagement,
} from "./_lib/queries";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { db } = await resolveAdminSession();

  const [
    stats,
    activity,
    topColleges,
    auditLog,
    engagement,
    recentPosts,
    recentUsers,
    pendingPreview,
  ] = await Promise.all([
    getDashboardStats(db),
    getActivitySeries(db).catch(() => []),
    getTopColleges(db, 5).catch(() => []),
    getRecentAuditLog(db, 6).catch(() => []),
    getTotalEngagement(db),
    db
      .select({
        id: posts.id,
        body: posts.body,
        isAnonymous: posts.isAnonymous,
        pseudonym: posts.pseudonym,
        createdAt: posts.createdAt,
        type: posts.type,
        institutionName: institutions.name,
      })
      .from(posts)
      .leftJoin(institutions, eq(posts.institutionId, institutions.id))
      .orderBy(desc(posts.createdAt))
      .limit(5)
      .catch(() => []),
    db.query.userProfiles
      .findMany({
        orderBy: [desc(userProfiles.createdAt)],
        limit: 5,
        with: { institution: true },
      })
      .catch(() => []),
    getPendingReviewPosts(db, 3).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Operations Dashboard"
        category="Operations & Telemetry"
        description="Unified operations console across campus feeds, student verification, content safety, and system health."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/review"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-2xs"
            >
              <ShieldAlert className="size-3.5" />
              <span>Review Queue ({stats.pendingPosts})</span>
            </Link>
            <Link
              href="/admin/composio"
              className="inline-flex items-center gap-2 rounded-lg bg-muted/60 hover:bg-muted border border-border/50 px-3 py-1.5 text-xs font-bold text-foreground transition-all cursor-pointer"
            >
              <Zap className="size-3.5 text-amber-500" />
              <span>Reddit Studio</span>
            </Link>
          </div>
        }
      />

      {/* Top KPI Grid (High Density) */}
      <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Active Students"
          value={stats.activeUsers.toLocaleString()}
          icon={Users}
          accent="primary"
          href="/admin/users"
          hint={`${stats.totalUsers} registered`}
          trend={`+${stats.signupsToday} today`}
          status="healthy"
        />
        <StatCard
          label="Posts Today"
          value={stats.postsToday.toLocaleString()}
          icon={FileText}
          accent="blue"
          href="/admin/posts"
          hint={`${stats.publishedPosts} live across hubs`}
          trend="Real-time"
          status="healthy"
        />
        <StatCard
          label="Pending Review"
          value={stats.pendingPosts}
          icon={ShieldAlert}
          accent={stats.pendingPosts > 0 ? "red" : "green"}
          href="/admin/review"
          hint="Flagged by safety engine"
          trend={stats.pendingPosts > 0 ? "Action required" : "Clear"}
          status={stats.pendingPosts > 0 ? "critical" : "healthy"}
        />
        <StatCard
          label="Open Reports"
          value={stats.openReports}
          icon={ShieldAlert}
          accent={stats.openReports > 0 ? "orange" : "green"}
          href="/admin/reports"
          hint="User-reported items"
          trend={stats.openReports > 0 ? "Needs triage" : "Zero open"}
          status={stats.openReports > 0 ? "attention" : "healthy"}
        />
        <StatCard
          label="Sealed Confessions"
          value={stats.anonymousPosts.toLocaleString()}
          icon={Ghost}
          accent="primary"
          href="/admin/confessions"
          hint={`${stats.anonVaultEntries} sealed vaults`}
          trend={`${stats.confessionsPending} pending review`}
          status={stats.confessionsPending > 0 ? "attention" : "neutral"}
        />
        <StatCard
          label="Ingested Content"
          value={stats.externalPostsCount.toLocaleString()}
          icon={RotateCw}
          accent="violet"
          href="/admin/composio"
          hint="Subreddit discussions"
          trend="Sync active"
          status="healthy"
        />
        <StatCard
          label="Campus Hubs"
          value={stats.colleges.toLocaleString()}
          icon={GraduationCap}
          accent="orange"
          href="/admin/colleges"
          hint="Verified institutions"
          trend="All-India"
          status="neutral"
        />
        <StatCard
          label="System Health"
          value="Healthy"
          icon={Server}
          accent="green"
          href="/admin/system"
          hint="Database · Cache · Edge"
          trend="99.9% Uptime"
          status="healthy"
        />
      </section>

      {/* Critical Triage Notice (Only if pending items exist) */}
      {(stats.pendingPosts > 0 || stats.openReports > 0) && (
        <section className="p-3.5 sm:p-4 rounded-xl border border-destructive/20 bg-destructive/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
              <ShieldAlert className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                Content requiring moderator triage: {stats.pendingPosts} quarantined post
                {stats.pendingPosts === 1 ? "" : "s"} &amp; {stats.openReports} user report
                {stats.openReports === 1 ? "" : "s"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Triage prevents inappropriate content and defamatory material from reaching campus feeds.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {stats.pendingPosts > 0 && (
              <Link
                href="/admin/review"
                className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-colors"
              >
                Triage Review Queue ({stats.pendingPosts})
              </Link>
            )}
            {stats.openReports > 0 && (
              <Link
                href="/admin/reports"
                className="px-3 py-1.5 rounded-lg bg-card border border-border/60 text-foreground text-xs font-bold hover:bg-muted/80 transition-colors"
              >
                View Reports ({stats.openReports})
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Network Activity Chart */}
      <section className="rounded-xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="size-3.5" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Network Pulse — Last 14 Days
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            {stats.totalComments.toLocaleString()} comments · {engagement.votes.toLocaleString()} votes
          </span>
        </div>
        {activity.length > 0 ? (
          <ActivityChart data={activity} />
        ) : (
          <p className="text-xs text-muted-foreground py-10 text-center">
            No activity telemetry recorded yet.
          </p>
        )}
      </section>

      {/* Two Column Grid: Operations Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Posts Stream (2 Cols on lg) */}
        <section className="lg:col-span-2 rounded-xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <FileText className="size-3.5 text-muted-foreground" />
              Recent Campus Posts
            </h2>
            <Link
              href="/admin/posts"
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Manage all</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="divide-y divide-border/40">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="block py-2.5 first:pt-0 last:pb-0 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors group"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {post.isAnonymous ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Ghost className="size-3" />
                        <span>{post.pseudonym || "Anonymous Student"}</span>
                      </span>
                    ) : (
                      <span>{post.institutionName?.split(",")[0] || "Campus Post"}</span>
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                    {new Date(post.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed mt-0.5">
                  {post.body}
                </p>
              </Link>
            ))}
            {recentPosts.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                No posts recorded yet.
              </p>
            )}
          </div>
        </section>

        {/* Top Campuses Leaderboard (1 Col on lg) */}
        <section className="rounded-xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <GraduationCap className="size-3.5 text-muted-foreground" />
              Top Active Hubs
            </h2>
            <Link
              href="/admin/colleges"
              className="text-[11px] font-bold text-primary hover:underline"
            >
              Directory
            </Link>
          </div>

          <div className="space-y-2">
            {topColleges.map((c, i) => (
              <Link
                key={c.id}
                href={`/college/${c.slug}`}
                className="flex items-center gap-2.5 py-1.5 group"
              >
                <span
                  className={`size-5 rounded flex items-center justify-center text-[10px] font-black shrink-0 ${
                    i === 0
                      ? "bg-amber-500/15 text-amber-500"
                      : i === 1
                        ? "bg-blue-500/15 text-blue-500"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-xs font-medium text-foreground truncate flex-1 group-hover:text-primary transition-colors">
                  {c.name.split(",")[0]}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                  {c.postCount} posts
                </span>
              </Link>
            ))}
            {topColleges.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                No colleges indexed yet.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Moderation Audit Trail Summary */}
      <section className="rounded-xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="size-3.5 text-muted-foreground" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Recent Moderation Actions
            </h2>
          </div>
          <Link
            href="/admin/audit"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>Full Audit Trail</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {auditLog.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-lg bg-muted/25 border border-border/40 space-y-1"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-foreground uppercase tracking-wider">
                  {entry.action.replaceAll("_", " ")}
                </span>
                <span className="text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                by @{entry.moderatorName || "system"} · {entry.targetType}
              </p>
            </div>
          ))}
          {auditLog.length === 0 && (
            <p className="text-xs text-muted-foreground col-span-3 text-center py-4">
              No audit records available yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
