import { and, count, desc, eq, sql } from "drizzle-orm";
import { ArrowLeft, ChevronLeft, ChevronRight, Send } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { emailCampaignRecipients, emailCampaigns, userProfiles } from "@/db/schema";
import { describeSegment, normalizeSegment } from "@/lib/email-campaigns/segment-spec";
import { privateMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { AdminPageHeader } from "../../_components/admin-page-header";
import { resolveAdminSession } from "../../_lib/guard";
import { CampaignStatusBadge, ProgressBar } from "../campaign-ui";
import { CampaignControls } from "./campaign-controls";

export const metadata: Metadata = privateMetadata("Email campaign");

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;
const STATUSES = ["ALL", "QUEUED", "SENDING", "SENT", "FAILED", "SKIPPED"] as const;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function EmailCampaignPage({ params, searchParams }: PageProps) {
  const { db } = await resolveAdminSession();
  const { id } = await params;
  const sp = await searchParams;
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as (typeof STATUSES)[number]) : "ALL";
  const page = Math.max(1, Number(sp.page) || 1);

  const campaign = await db.query.emailCampaigns.findFirst({ where: eq(emailCampaigns.id, id) }).catch(() => null);
  if (!campaign) notFound();

  const filter =
    status === "ALL"
      ? eq(emailCampaignRecipients.campaignId, id)
      : and(eq(emailCampaignRecipients.campaignId, id), eq(emailCampaignRecipients.status, status));

  const [rows, [filtered], byStatus, creator] = await Promise.all([
    db
      .select({
        id: emailCampaignRecipients.id,
        email: emailCampaignRecipients.email,
        status: emailCampaignRecipients.status,
        error: emailCampaignRecipients.error,
        sentAt: emailCampaignRecipients.sentAt,
        updatedAt: emailCampaignRecipients.updatedAt,
        username: userProfiles.username,
      })
      .from(emailCampaignRecipients)
      .leftJoin(userProfiles, eq(emailCampaignRecipients.profileId, userProfiles.id))
      .where(filter)
      .orderBy(desc(emailCampaignRecipients.updatedAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(emailCampaignRecipients).where(filter),
    db
      .select({ status: emailCampaignRecipients.status, n: sql<number>`count(*)::int` })
      .from(emailCampaignRecipients)
      .where(eq(emailCampaignRecipients.campaignId, id))
      .groupBy(emailCampaignRecipients.status),
    campaign.createdById
      ? db.query.userProfiles.findFirst({ where: eq(userProfiles.id, campaign.createdById), columns: { username: true } })
      : Promise.resolve(undefined),
  ]);

  const counts = Object.fromEntries(byStatus.map((r) => [r.status, Number(r.n)])) as Record<string, number>;
  const queued = counts.QUEUED ?? 0;
  const processed = (counts.SENT ?? 0) + (counts.FAILED ?? 0) + (counts.SKIPPED ?? 0);
  const totalPages = Math.max(1, Math.ceil(Number(filtered?.n ?? 0) / PAGE_SIZE));

  const spec = normalizeSegment(campaign.segment);
  const collegeRows =
    spec.institutionIds.length > 0
      ? await db.query.institutions.findMany({
          columns: { id: true, name: true },
          where: (t, { inArray }) => inArray(t.id, spec.institutionIds),
        })
      : [];
  const audience = describeSegment(spec, Object.fromEntries(collegeRows.map((c) => [c.id, c.name])));

  const href = (next: { status?: string; page?: number }) => {
    const q = new URLSearchParams();
    const s = next.status ?? status;
    if (s !== "ALL") q.set("status", s);
    if ((next.page ?? 1) > 1) q.set("page", String(next.page));
    const qs = q.toString();
    return `/admin/emails/${id}${qs ? `?${qs}` : ""}`;
  };

  const stats = [
    { label: "Total", value: campaign.totalCount },
    { label: "Sent", value: counts.SENT ?? 0 },
    { label: "Failed", value: counts.FAILED ?? 0 },
    { label: "Skipped", value: counts.SKIPPED ?? 0 },
    { label: "Waiting", value: queued + (counts.SENDING ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/emails"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm font-semibold text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden /> All emails
      </Link>

      <AdminPageHeader
        title={campaign.name}
        icon={Send}
        description={`"${campaign.subject}" · ${audience}`}
        badge={<CampaignStatusBadge status={campaign.status} />}
        actions={<CampaignControls id={campaign.id} status={campaign.status} queued={queued} />}
      />

      <section className="space-y-4 rounded-lg border border-border bg-surface p-4 sm:p-5" aria-label="Progress">
        <ProgressBar value={processed} max={campaign.totalCount} />
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-md bg-surface-muted p-3">
              <dt className="text-xs font-semibold text-fg-muted">{s.label}</dt>
              <dd className="text-xl font-bold text-fg tabular-nums">{s.value.toLocaleString("en-IN")}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-fg-muted">
          Created {campaign.createdAt.toLocaleString("en-IN")}
          {creator?.username ? ` by @${creator.username}` : ""}
          {campaign.startedAt ? ` · started ${campaign.startedAt.toLocaleString("en-IN")}` : ""}
          {campaign.finishedAt ? ` · finished ${campaign.finishedAt.toLocaleString("en-IN")}` : ""}
          {campaign.cancelledAt ? ` · cancelled ${campaign.cancelledAt.toLocaleString("en-IN")}` : ""}
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="campaign-log-title">
        <h2 id="campaign-log-title" className="text-lg text-fg">
          Log
        </h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={href({ status: s })}
              aria-current={status === s ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-full px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11",
                status === s ? "bg-brand text-brand-fg" : "bg-surface-muted text-fg-muted hover:bg-surface-sunken hover:text-fg"
              )}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              {s !== "ALL" && counts[s] ? ` (${counts[s]})` : ""}
            </Link>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs font-semibold text-fg">
                <tr>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3 text-right">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 align-top">
                      <p className="font-medium text-fg">{r.email}</p>
                      {r.username && <p className="text-xs text-fg-muted">@{r.username}</p>}
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <CampaignStatusBadge status={r.status} />
                    </td>
                    <td className={cn("px-4 py-2.5 align-top text-xs", r.status === "FAILED" ? "text-danger" : "text-fg-muted")}>
                      {r.error ?? ""}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right align-top text-xs text-fg-muted">
                      {(r.sentAt ?? r.updatedAt).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-fg-muted">
                      Nothing here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border bg-surface-muted px-4 py-3">
              <span className="text-xs font-medium text-fg-muted">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1.5">
                <Link
                  href={href({ page: page - 1 })}
                  aria-disabled={page <= 1}
                  aria-label="Previous page"
                  className={cn(
                    "inline-flex size-11 items-center justify-center rounded-full border border-border",
                    page <= 1 ? "pointer-events-none opacity-40" : "text-fg hover:bg-surface"
                  )}
                >
                  <ChevronLeft className="size-4" />
                </Link>
                <Link
                  href={href({ page: page + 1 })}
                  aria-disabled={page >= totalPages}
                  aria-label="Next page"
                  className={cn(
                    "inline-flex size-11 items-center justify-center rounded-full border border-border",
                    page >= totalPages ? "pointer-events-none opacity-40" : "text-fg hover:bg-surface"
                  )}
                >
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
