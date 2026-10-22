import { ArrowRight, CheckCircle2, Flag, KeyRound, School, ShieldAlert, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ActivityChart } from "./_components/activity-chart";
import { HubRequestActions } from "./_components/hub-request-actions";
import { resolveAdminSession } from "./_lib/guard";
import { getHeadline, getInboxCounts, getInboxItems } from "./_lib/inbox";
import { getActivitySeries } from "./_lib/queries";

export const metadata: Metadata = { title: "Inbox" };
export const dynamic = "force-dynamic";

const ago = (d: Date) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

function Queue({ title, icon: Icon, count, href, empty, children }: { title: string; icon: typeof Flag; count: number; href: string; empty: string; children: ReactNode }) {
  return (
    <section className="flex flex-col rounded-2xl bg-card/70 p-4 shadow-2xs ring-1 ring-border/40 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Icon className="size-4 text-muted-foreground" aria-hidden /> {title}
          <span className={count > 0 ? "rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground" : "rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground"}>{count}</span>
        </h2>
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Open <ArrowRight className="size-3.5" aria-hidden /></Link>
      </div>
      {count === 0 ? (
        <p className="mt-6 mb-2 flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="size-4 text-emerald-500" aria-hidden /> {empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border/40">{children}</ul>
      )}
    </section>
  );
}

export default async function AdminInbox() {
  const { db } = await resolveAdminSession();
  const [counts, items, head, activity] = await Promise.all([getInboxCounts(db), getInboxItems(db), getHeadline(db), getActivitySeries(db).catch(() => [])]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Inbox</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {counts.total === 0 ? "All clear. Nothing is waiting for you." : `${counts.total} item${counts.total === 1 ? "" : "s"} waiting for a decision.`}
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-2 overflow-hidden rounded-2xl bg-card/70 shadow-2xs ring-1 ring-border/40 sm:grid-cols-4">
        {[
          ["Students", head.students, "/admin/users"],
          ["College-verified", head.verified, "/admin/users"],
          ["Joined today", head.newToday, "/admin/users"],
          ["Posts today", head.postsToday, "/admin/posts"],
        ].map(([label, value, href], i) => (
          <Link key={String(label)} href={String(href)} className={`p-4 hover:bg-muted/40 ${i % 2 ? "border-l border-border/40" : ""} ${i > 1 ? "border-t border-border/40 sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}>
            <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-2xl font-black tabular-nums text-foreground">{Number(value).toLocaleString("en-IN")}</dd>
          </Link>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <Queue title="Held by safety filter" icon={ShieldAlert} count={counts.reviewPosts} href="/admin/review" empty="No posts waiting for review.">
          {items.heldPosts.map((p) => (
            <li key={p.id} className="py-2.5">
              <Link href="/admin/review" className="block rounded-lg hover:bg-muted/30">
                <p className="line-clamp-2 text-sm text-foreground">{p.body}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.type} · risk {p.riskScore ?? 0} · {p.college?.split(",")[0] ?? "Campus"} · {ago(p.createdAt)}</p>
              </Link>
            </li>
          ))}
        </Queue>

        <Queue title="Reports" icon={Flag} count={counts.openReports} href="/admin/reports" empty="No open reports.">
          {items.openReports.map((r) => (
            <li key={r.id} className="py-2.5">
              <Link href="/admin/reports" className="block rounded-lg hover:bg-muted/30">
                <p className="text-sm font-semibold text-foreground">{r.reason}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.targetType.toLowerCase()} · by @{r.reporter ?? "student"} · {ago(r.createdAt)}{r.details ? ` · ${r.details}` : ""}</p>
              </Link>
            </li>
          ))}
        </Queue>

        <Queue title="College hub requests" icon={School} count={counts.hubRequests} href="/admin/colleges" empty="No colleges waiting to be added.">
          {items.hubRequests.map((h) => (
            <li key={h.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{h.name}</p>
                <p className="truncate text-xs text-muted-foreground">{[h.domain, h.district, h.state].filter(Boolean).join(" · ") || "No details"}{h.requester ? ` · @${h.requester}` : ""} · {ago(h.createdAt)}</p>
              </div>
              <HubRequestActions id={h.id} name={h.name} />
            </li>
          ))}
        </Queue>

        <Queue title="Developer apps" icon={KeyRound} count={items.apps.length} href="/admin/oauth-apps" empty="No Login with CampusLoop apps yet.">
          {items.apps.map((a) => (
            <li key={a.id} className="py-2.5">
              <Link href="/admin/oauth-apps" className="flex items-center justify-between gap-3 rounded-lg hover:bg-muted/30">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">{a.name}{a.isFirstParty ? " · Ecosystem" : ""}{a.status === "SUSPENDED" ? " · Suspended" : ""}</span>
                  <span className="block truncate text-xs text-muted-foreground">{a.owner ? `@${a.owner}` : "CampusLoop"} · created {ago(a.createdAt)}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{a.usersCount} users</span>
              </Link>
            </li>
          ))}
        </Queue>
      </div>

      <section className="rounded-2xl bg-card/70 p-4 shadow-2xs ring-1 ring-border/40 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground"><TrendingUp className="size-4 text-muted-foreground" aria-hidden /> Last 14 days</h2>
        {activity.length > 0 ? <div className="mt-3"><ActivityChart data={activity} /></div> : <p className="py-8 text-center text-sm text-muted-foreground">No activity recorded yet.</p>}
      </section>
    </div>
  );
}
