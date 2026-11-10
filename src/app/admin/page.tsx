import { ArrowRight, CheckCircle2, Flag, KeyRound, School, ShieldAlert, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { privateMetadata } from "@/lib/seo";
import { ActivityChart } from "./_components/activity-chart";
import { AdminStatStrip } from "./_components/admin-stat-strip";
import { HubRequestActions } from "./_components/hub-request-actions";
import { resolveAdminSession } from "./_lib/guard";
import { getHeadline, getInboxCounts, getInboxItems } from "./_lib/inbox";
import { getActivitySeries } from "./_lib/queries";

export const metadata: Metadata = privateMetadata("Inbox");
export const dynamic = "force-dynamic";

const ago = (d: Date) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

function Queue({
  title,
  icon: Icon,
  count,
  href,
  empty,
  children,
}: {
  title: string;
  icon: typeof Flag;
  count: number;
  href: string;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-fg">
          <Icon className="size-4 text-fg-muted" aria-hidden /> {title}
          <Badge variant={count > 0 ? "brand" : "neutral"}>{count}</Badge>
        </h2>
        <Link
          href={href}
          className="inline-flex min-h-11 items-center gap-1 px-1 text-sm font-semibold text-brand-text hover:underline"
          aria-label={`Open ${title}`}
        >
          Open <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      {count === 0 ? (
        <p className="mt-4 mb-1 flex items-center gap-2 text-sm text-fg-muted">
          <CheckCircle2 className="size-4 text-verified-text" aria-hidden /> {empty}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border">{children}</ul>
      )}
    </section>
  );
}

export default async function AdminInbox() {
  const { db } = await resolveAdminSession();
  const [counts, items, head, activity] = await Promise.all([
    getInboxCounts(db),
    getInboxItems(db),
    getHeadline(db),
    getActivitySeries(db).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl text-fg">Inbox</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {counts.total === 0
              ? "All clear. Nothing is waiting for you."
              : `${counts.total} item${counts.total === 1 ? "" : "s"} waiting for a decision.`}
          </p>
        </div>
      </header>

      <AdminStatStrip
        items={[
          { label: "Students", value: Number(head.students).toLocaleString("en-IN"), href: "/admin/users" },
          {
            label: "Verified students",
            value: Number(head.verified).toLocaleString("en-IN"),
            href: "/admin/users",
          },
          {
            label: "Joined today",
            value: Number(head.newToday).toLocaleString("en-IN"),
            href: "/admin/users",
          },
          {
            label: "Posts today",
            value: Number(head.postsToday).toLocaleString("en-IN"),
            href: "/admin/posts",
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Queue
          title="Held by safety filter"
          icon={ShieldAlert}
          count={counts.reviewPosts}
          href="/admin/review"
          empty="No posts waiting for review."
        >
          {items.heldPosts.map((p) => (
            <li key={p.id} className="py-2.5">
              <Link href="/admin/review" className="block rounded-lg transition-ui hover:bg-surface-muted">
                <p className="line-clamp-2 text-sm text-fg">{p.body}</p>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {p.type} · risk {p.riskScore ?? 0} · {p.college?.split(",")[0] ?? "Campus"} ·{" "}
                  {ago(p.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </Queue>

        <Queue
          title="Reports"
          icon={Flag}
          count={counts.openReports}
          href="/admin/reports"
          empty="No open reports."
        >
          {items.openReports.map((r) => (
            <li key={r.id} className="py-2.5">
              <Link href="/admin/reports" className="block rounded-lg transition-ui hover:bg-surface-muted">
                <p className="text-sm font-semibold text-fg">{r.reason}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-fg-muted">
                  {r.targetType.toLowerCase()} · by @{r.reporter ?? "student"} · {ago(r.createdAt)}
                  {r.details ? ` · ${r.details}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </Queue>

        <Queue
          title="College hub requests"
          icon={School}
          count={counts.hubRequests}
          href="/admin/colleges"
          empty="No colleges waiting to be added."
        >
          {items.hubRequests.map((h) => (
            <li key={h.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">{h.name}</p>
                <p className="truncate text-xs text-fg-muted">
                  {[h.domain, h.district, h.state].filter(Boolean).join(" · ") || "No details"}
                  {h.requester ? ` · @${h.requester}` : ""} · {ago(h.createdAt)}
                </p>
              </div>
              <HubRequestActions id={h.id} name={h.name} />
            </li>
          ))}
        </Queue>

        <Queue
          title="Developer apps"
          icon={KeyRound}
          count={items.apps.length}
          href="/admin/oauth-apps"
          empty="No developer apps yet."
        >
          {items.apps.map((a) => (
            <li key={a.id} className="py-2.5">
              <Link
                href="/admin/oauth-apps"
                className="flex items-center justify-between gap-3 rounded-lg transition-ui hover:bg-surface-muted"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-fg">
                    {a.name}
                    {a.isFirstParty ? " · CampusLoop app" : ""}
                    {a.status === "SUSPENDED" ? " · Suspended" : ""}
                  </span>
                  <span className="block truncate text-xs text-fg-muted">
                    {a.owner ? `@${a.owner}` : "CampusLoop"} · created {ago(a.createdAt)}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-fg-muted">
                  {a.usersCount} users
                </span>
              </Link>
            </li>
          ))}
        </Queue>
      </div>

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
    </div>
  );
}
