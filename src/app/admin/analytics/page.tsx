import { Activity, ArrowRight, Globe, School, TrendingUp, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { AdminStatStrip } from "../_components/admin-stat-strip";
import { getProductAnalytics } from "../_lib/analytics-queries";
import { type Ga4Snapshot, ga4LiveConfigured, getGa4Traffic } from "../_lib/ga4-report";
import { resolveAdminSession } from "../_lib/guard";
import { BarSeries, LineSeries } from "./charts";
import { RefreshGa4Button } from "./refresh-ga4-button";
import { SplitBar } from "./split-bar";

export const metadata: Metadata = privateMetadata("Analytics");

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-IN");
const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "–");

function delta(now: number, before: number): string {
  if (before === 0) return now === 0 ? "no change" : `+${fmt(now)} vs 0 before`;
  const change = Math.round(((now - before) / before) * 100);
  return `${change >= 0 ? "+" : ""}${change}% vs previous (${fmt(before)})`;
}

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function Panel({ title, icon: Icon, note, children }: { title: string; icon?: typeof Activity; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-fg">
        {Icon && <Icon className="size-4 text-fg-muted" aria-hidden />}
        {title}
      </h2>
      {note && <p className="mt-0.5 text-sm text-fg-muted">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Ranked list with a proportional bar under each label. */
function RankList({ rows, unit, empty = "No data yet." }: { rows: { label: string; value: number; extra?: string }[]; unit?: string; empty?: string }) {
  if (rows.length === 0) return <p className="text-sm text-fg-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ol className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-fg">{r.label}</span>
            <span className="shrink-0 tabular-nums text-fg-muted">
              {fmt(r.value)}
              {unit ? ` ${unit}` : ""}
              {r.extra ? ` · ${r.extra}` : ""}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-poll-track">
            <div className="h-full rounded-full bg-poll-fill-chosen" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="pt-2 font-sans text-lg font-semibold text-fg">{children}</h2>;
}

export default async function AdminAnalyticsPage() {
  const { db } = await resolveAdminSession();

  const [product, ga4] = await Promise.all([getProductAnalytics(db), getGa4Traffic(db)]);
  const { headline: h, funnel, signups, cohorts, colleges, features, content, recentSignups } = product;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics"
        icon={Activity}
        description="How CampusLoop is doing: real students only (seed and demo accounts are left out)."
        actions={
          <Link
            href="/admin/system"
            className="inline-flex min-h-11 items-center gap-1 px-1 text-sm font-semibold text-brand-text hover:underline"
          >
            Service health <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />

      {product.failed.length > 0 && (
        <p className="rounded-lg border border-border bg-warning-subtle p-3 text-sm text-fg">
          Some numbers could not load: {product.failed.join(", ")}. Reload to try again.
        </p>
      )}

      {/* ── Headline ── */}
      <AdminStatStrip
        items={[
          { label: "Real students", value: fmt(h.realUsers), note: `${fmt(h.seededUsers)} seed accounts hidden`, href: "/admin/users" },
          { label: "New today", value: fmt(h.signupsToday), note: delta(h.signupsToday, h.signupsYesterday) },
          { label: "New in 7 days", value: fmt(h.signups7d), note: delta(h.signups7d, h.signupsPrev7d) },
          { label: "New in 30 days", value: fmt(h.signups30d), note: delta(h.signups30d, h.signupsPrev30d) },
        ]}
      />
      <AdminStatStrip
        items={[
          { label: "Daily active", value: fmt(h.dau), note: "Seen in the last 24 hours" },
          { label: "Weekly active", value: fmt(h.wau), note: "Seen in the last 7 days" },
          { label: "Monthly active", value: fmt(h.mau), note: `${pct(h.mau, h.realUsers)} of real students` },
          { label: "Stickiness", value: pct(h.dau, h.mau), note: "Daily ÷ monthly active" },
        ]}
      />

      {/* ── Growth ── */}
      <SectionTitle>Growth</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Signups per day" icon={UserPlus} note="Last 30 days, India time">
          <BarSeries data={signups.daily} label="Signups" />
        </Panel>
        <Panel title="Signups per week" icon={TrendingUp} note="Last 12 weeks, weeks start Monday">
          <BarSeries data={signups.weekly} label="Signups" color="var(--chart-2)" />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Activation" icon={Users} note="All real students. First action = post, comment, vote, course enroll or event register.">
          <RankList
            rows={[
              { label: "Signed up", value: funnel.signedUp, extra: "100%" },
              { label: "Finished onboarding", value: funnel.onboarded, extra: pct(funnel.onboarded, funnel.signedUp) },
              { label: "First action within 7 days", value: funnel.activated7d, extra: pct(funnel.activated7d, funnel.signedUp) },
            ]}
          />
        </Panel>
        <Panel title="Weekly retention" note="Share of each signup week that did something (any recorded action) in week 1 to 4 after joining.">
          {cohorts.length === 0 ? (
            <p className="text-sm text-fg-muted">No signups in the last 8 weeks.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem] text-sm tabular-nums">
                <thead>
                  <tr className="text-left text-xs text-fg-muted">
                    <th className="py-1.5 pr-2 font-medium">Week of</th>
                    <th className="py-1.5 pr-2 text-right font-medium">Joined</th>
                    {[1, 2, 3, 4].map((k) => (
                      <th key={k} className="py-1.5 pl-2 text-right font-medium">
                        W{k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cohorts.map((c) => (
                    <tr key={c.week}>
                      <td className="py-1.5 pr-2 text-fg">{c.week}</td>
                      <td className="py-1.5 pr-2 text-right text-fg">{fmt(c.size)}</td>
                      {c.retained.map((n, k) => (
                        <td
                          key={k}
                          className={`py-1.5 pl-2 text-right ${n > 0 ? "text-fg" : "text-fg-subtle"}`}
                          title={`${n} of ${c.size}`}
                        >
                          {pct(n, c.size)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-fg-muted">Recent weeks fill in as time passes; a week that has not happened yet shows 0%.</p>
            </div>
          )}
        </Panel>
      </div>

      {/* ── Recent signups ── */}
      <section className="rounded-lg border border-border bg-surface">
        <h2 className="flex items-center gap-2 border-b border-border p-4 font-sans text-base font-semibold text-fg">
          <UserPlus className="size-4 text-fg-muted" aria-hidden /> Latest 50 signups
        </h2>
        {recentSignups.length === 0 ? (
          <EmptyState icon={UserPlus} title="No real signups yet" size="compact" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-fg-muted">
                  <th className="px-4 py-2 font-medium">Student</th>
                  <th className="px-4 py-2 font-medium">College</th>
                  <th className="px-4 py-2 font-medium">Joined</th>
                  <th className="px-4 py-2 font-medium">Onboarded</th>
                  <th className="px-4 py-2 font-medium">Verified</th>
                  <th className="px-4 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentSignups.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2">
                      <span className="block max-w-[14rem] truncate font-medium text-fg">{s.displayName}</span>
                      <Link href={`/@${s.username}`} className="text-xs text-brand-text hover:underline">
                        @{s.username}
                      </Link>
                    </td>
                    <td className="max-w-[14rem] truncate px-4 py-2 text-fg-muted">{s.college || "–"}</td>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums text-fg-muted">{timeFmt.format(new Date(s.createdAt))}</td>
                    <td className="px-4 py-2 text-fg">{s.onboarded ? "Yes" : "No"}</td>
                    <td className="px-4 py-2 text-fg">{s.verified ? "Yes" : "No"}</td>
                    <td className="px-4 py-2 text-fg-muted">{s.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Colleges ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Colleges by students" icon={School}>
          <RankList rows={colleges.byUsers.map((c) => ({ label: c.name, value: c.users }))} unit="students" />
        </Panel>
        <Panel title="Colleges by 7-day actives" icon={School}>
          <RankList rows={colleges.byActive.map((c) => ({ label: c.name, value: c.active7d }))} unit="active" empty="Nobody active this week." />
        </Panel>
      </div>

      {/* ── Usage ── */}
      <SectionTitle>What students use</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Feature usage, last 30 days" note="Distinct real students, then total actions.">
          <RankList
            rows={features.map((f) => ({ label: f.feature, value: f.users, extra: `${fmt(f.actions)} actions` }))}
            unit="students"
          />
        </Panel>
        <Panel title="Content per day" note="Posts, comments and chat messages by real students, last 30 days.">
          <LineSeries
            data={content}
            xKey="day"
            label="Content per day"
            series={[
              { key: "posts", name: "Posts", color: "var(--chart-1)" },
              { key: "comments", name: "Comments", color: "var(--chart-2)" },
              { key: "messages", name: "Messages", color: "var(--chart-3)" },
            ]}
          />
        </Panel>
      </div>

      {/* ── GA4 ── */}
      <Ga4Section snapshot={ga4.snapshot} source={ga4.source} error={ga4.error} canRefresh={ga4LiveConfigured()} />

      <p className="text-xs text-fg-muted">
        Product numbers computed {timeFmt.format(new Date(product.generatedAt))} IST and cached for 5 minutes.
      </p>
    </div>
  );
}

function Ga4Section({
  snapshot,
  source,
  error,
  canRefresh,
}: {
  snapshot: Ga4Snapshot | null;
  source: "live" | "snapshot" | "none";
  error?: string;
  canRefresh: boolean;
}) {
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <div>
        <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-fg">
          <Globe className="size-4 text-fg-muted" aria-hidden /> Website traffic (Google Analytics)
        </h2>
        <p className="text-sm text-fg-muted">
          {snapshot
            ? `${source === "live" ? "Live from GA4" : "Stored snapshot"} · fetched ${timeFmt.format(new Date(snapshot.fetchedAt))} IST · ${snapshot.range ?? "last 30 days"}`
            : "No GA4 data stored yet."}
          {error ? ` · live fetch failed: ${error}` : ""}
        </p>
      </div>
      <RefreshGa4Button enabled={canRefresh} />
    </div>
  );
  if (!snapshot) return header;

  const t = snapshot.totals;
  const india = snapshot.countries?.find((c) => c[0] === "India");
  const indiaUsers = india?.[1] ?? 0;
  const indiaSessions = india?.[2] ?? 0;
  const daily = snapshot.daily.map((r) => ({
    day: `${r[0].slice(6, 8)}/${r[0].slice(4, 6)}`,
    users: r[1] ?? 0,
    sessions: r[3] ?? 0,
    views: r[4] ?? 0,
    engaged: r[5] ?? 0,
  }));
  const rows = (list: Ga4Snapshot["channels"], col = 1) => (list ?? []).map((r) => ({ label: r[0] || "(not set)", value: Number(r[col] ?? 0) }));
  const botRows = snapshot.botTraffic ?? (snapshot.countries ?? []).filter((c) => c[0] !== "India");
  const likelyBots = botRows.reduce((sum, r) => sum + Number(r[1] ?? 0), 0);

  return (
    <>
      {header}
      <AdminStatStrip
        items={[
          { label: "India users", value: fmt(indiaUsers), note: `${fmt(indiaSessions)} sessions · the real audience` },
          { label: "All users", value: fmt(t.activeUsers), note: `${fmt(t.newUsers)} new · ${pct(indiaUsers, t.activeUsers)} from India` },
          { label: "Sessions", value: fmt(t.sessions), note: `${Math.round(t.avgSessionSec)}s average` },
          { label: "Page views", value: fmt(t.screenPageViews), note: `${Math.round(t.engagementRate * 100)}% engaged sessions` },
        ]}
      />
      <p className="rounded-lg border border-border bg-warning-subtle p-3 text-sm text-fg">
        Likely bot traffic: about {fmt(likelyBots)} users came from {snapshot.botTraffic ? "desktop, direct visits outside India" : "countries outside India, mostly desktop and direct"}{" "}
        (Singapore, Brazil, US, China and others). CampusLoop is for Indian students, so read the India numbers first.
        {snapshot.notes ? ` ${snapshot.notes}` : ""}
      </p>

      <Panel title="Daily traffic" note="All countries, last 30 days.">
        <LineSeries
          data={daily}
          xKey="day"
          label="Daily GA4 traffic"
          series={[
            { key: "users", name: "Users", color: "var(--chart-1)" },
            { key: "sessions", name: "Sessions", color: "var(--chart-2)" },
            { key: "engaged", name: "Engaged sessions", color: "var(--chart-3)" },
            { key: "views", name: "Page views", color: "var(--chart-4)" },
          ]}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <SplitBar
          title="India vs everywhere else"
          description="Users by country."
          icon={Globe}
          left={{ label: "India", value: indiaUsers }}
          right={{ label: "Other", value: Math.max(0, t.activeUsers - indiaUsers) }}
        />
        <Panel title="Countries" note="Users">
          <RankList rows={rows(snapshot.countries)} unit="users" />
        </Panel>
        <Panel title="India landing pages" note="Where Indian visitors start (sessions).">
          <RankList rows={rows(snapshot.indiaLanding)} unit="sessions" />
        </Panel>
        <Panel title="India devices" note="Users">
          <RankList rows={rows(snapshot.indiaDevices)} unit="users" />
        </Panel>
        <Panel title="Channels" note="Users, all countries.">
          <RankList rows={rows(snapshot.channels)} unit="users" />
        </Panel>
        <Panel title="Sources" note="Users, all countries.">
          <RankList rows={rows(snapshot.sources)} unit="users" />
        </Panel>
        <Panel title="Top pages" note="Page views, all countries.">
          <RankList rows={rows(snapshot.topPages)} unit="views" />
        </Panel>
        <Panel title="Events" note="Event counts. sign_up, login, post_create and others start with this release.">
          <RankList rows={rows(snapshot.events)} />
        </Panel>
      </div>
    </>
  );
}
