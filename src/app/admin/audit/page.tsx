import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { getAuditPage } from "../_lib/queries";

export const metadata: Metadata = privateMetadata("Audit log");

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 50;

function actionTone(action: string) {
  if (action.includes("DELETE") || action.includes("BAN"))
    return "text-danger bg-danger-subtle border-danger/30";
  if (action.includes("REVEAL")) return "text-brand-text bg-brand-subtle border-brand/20";
  if (action.includes("PUBLISH") || action.includes("APPROVE"))
    return "text-success bg-success-subtle border-success/20";
  return "text-fg-muted bg-surface-muted border-border";
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const { db } = await resolveAdminSession();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ rows, total }] = await Promise.all([getAuditPage(db, PAGE_SIZE, (page - 1) * PAGE_SIZE)]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit log"
        icon={ScrollText}
        description="Every admin action and identity reveal, newest first."
        badge={<Badge variant="neutral">{total} entries</Badge>}
      />

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[550px] text-left text-sm text-fg-muted">
            <thead className="border-b border-border bg-surface-muted text-xs font-semibold text-fg">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Moderator</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3 text-right">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-muted transition-colors">
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border inline-block ${actionTone(row.action)}`}
                    >
                      {row.action.replaceAll("_", " ")}
                    </span>
                    {row.reason && (
                      <p className="text-xs text-fg-muted mt-1 line-clamp-1 leading-normal">{row.reason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg font-semibold align-top whitespace-nowrap">
                    {row.moderatorUsername ? `@${row.moderatorUsername}` : row.moderatorName || "System"}
                  </td>
                  <td className="px-4 py-3 text-xs align-top">
                    {row.targetType === "POST" ? (
                      <Link
                        href={`/post/${row.targetId}`}
                        target="_blank"
                        className="font-mono text-xs text-brand-text hover:underline"
                      >
                        {row.targetId.slice(0, 14)}…
                      </Link>
                    ) : (
                      <span className="font-mono text-xs">{row.targetId.slice(0, 14)}…</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted whitespace-nowrap align-top text-right font-medium">
                    {new Date(row.createdAt).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-fg-muted">
                    No admin actions logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
            <span className="text-xs text-fg-muted font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <Link
                href={`/admin/audit?page=${page - 1}`}
                aria-disabled={page <= 1}
                aria-label="Previous page"
                className={`inline-flex size-11 items-center justify-center rounded-full border border-border ${page <= 1 ? "opacity-40 pointer-events-none" : "hover:bg-surface-muted text-fg"}`}
              >
                <ChevronLeft className="size-4" />
              </Link>
              <Link
                href={`/admin/audit?page=${page + 1}`}
                aria-disabled={page >= totalPages}
                aria-label="Next page"
                className={`inline-flex size-11 items-center justify-center rounded-full border border-border ${page >= totalPages ? "opacity-40 pointer-events-none" : "hover:bg-surface-muted text-fg"}`}
              >
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
