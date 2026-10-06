import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { getAuditPage } from "../_lib/queries";

export const metadata: Metadata = {
  title: "Audit Log Trail",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 50;

function actionTone(action: string) {
  if (action.includes("DELETE") || action.includes("BAN"))
    return "text-destructive bg-destructive/10 border-destructive/20";
  if (action.includes("REVEAL")) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
  if (action.includes("PUBLISH") || action.includes("APPROVE"))
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  return "text-muted-foreground bg-muted border-border/40";
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
        title="Moderation Audit Trail"
        category="Telemetry & Security"
        icon={ScrollText}
        description="Immutable record of administrative mutations, policy enforcements, and anonymous identity reveal events."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/40">
            {total} audit entries
          </span>
        }
      />

      <div className="rounded-xl border border-border/60 bg-card/70 overflow-hidden shadow-2xs">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[550px] text-left text-xs text-muted-foreground">
            <thead className="bg-muted/50 text-[10px] uppercase font-bold text-foreground border-b border-border/50">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Moderator</th>
                <th className="px-4 py-3">Target Resource</th>
                <th className="px-4 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${actionTone(row.action)}`}
                    >
                      {row.action.replaceAll("_", " ")}
                    </span>
                    {row.reason && (
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1 leading-normal">
                        {row.reason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground font-semibold align-top whitespace-nowrap">
                    {row.moderatorUsername ? `@${row.moderatorUsername}` : row.moderatorName || "System"}
                  </td>
                  <td className="px-4 py-3 text-xs align-top">
                    {row.targetType === "POST" ? (
                      <Link
                        href={`/post/${row.targetId}`}
                        target="_blank"
                        className="font-mono text-[11px] text-primary hover:underline"
                      >
                        {row.targetId.slice(0, 14)}…
                      </Link>
                    ) : (
                      <span className="font-mono text-[11px]">{row.targetId.slice(0, 14)}…</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap align-top text-right font-medium">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No audit records recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/20">
            <span className="text-xs text-muted-foreground font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <Link
                href={`/admin/audit?page=${page - 1}`}
                aria-disabled={page <= 1}
                className={`p-1.5 rounded-lg border border-border/60 ${page <= 1 ? "opacity-40 pointer-events-none" : "hover:bg-muted text-foreground"}`}
              >
                <ChevronLeft className="size-4" />
              </Link>
              <Link
                href={`/admin/audit?page=${page + 1}`}
                aria-disabled={page >= totalPages}
                className={`p-1.5 rounded-lg border border-border/60 ${page >= totalPages ? "opacity-40 pointer-events-none" : "hover:bg-muted text-foreground"}`}
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
