"use client";

import {
  CheckIcon,
  Eye,
  EyeOff,
  Filter,
  Search,
  ShieldAlert,
  Trash2,
  VenetianMask,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { type RevealedIdentity, revealAnonymousAuthor } from "../anonymity-actions";
import { deletePost, dismissReport, hidePost, keepPost } from "./actions";

export interface ReportRow {
  id: string;
  reason: string;
  details: string | null;
  createdAt: Date | string;
  postId: string;
  postBody: string;
  postPseudonym?: string | null;
  authorDisplayName: string | null;
  authorUsername: string | null;
}

export function ReportsTable({ initialReports }: { initialReports: ReportRow[] }) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [searchQuery, setSearchQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, RevealedIdentity>>({});
  const [revealPostId, setRevealPostId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [keepPostId, setKeepPostId] = useState<string | null>(null);

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (reasonFilter !== "ALL" && r.reason.toUpperCase() !== reasonFilter.toUpperCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inBody = r.postBody.toLowerCase().includes(q);
      const inReason = r.reason.toLowerCase().includes(q);
      const inAuthor = (r.authorUsername || r.authorDisplayName || "").toLowerCase().includes(q);
      return inBody || inReason || inAuthor;
    }
    return true;
  });

  async function runAction(fn: () => Promise<unknown>, successMsg = "Action completed") {
    setIsLoading(true);
    try {
      await fn();
      toast.success(successMsg);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmKeep() {
    if (!keepPostId) return;
    const target = keepPostId;
    await runAction(async () => {
      await keepPost(target);
      setReports((prev) => prev.filter((r) => r.postId !== target));
      setKeepPostId(null);
    }, "Post kept and associated reports dismissed");
  }

  async function confirmDelete() {
    if (!deletePostId) return;
    const target = deletePostId;
    await runAction(async () => {
      await deletePost(target);
      setReports((prev) => prev.filter((r) => r.postId !== target));
      setDeletePostId(null);
    }, "Post permanently removed");
  }

  async function handleHide(postId: string) {
    await runAction(async () => {
      await hidePost(postId);
      setReports((prev) => prev.filter((r) => r.postId !== postId));
    }, "Post hidden from campus feeds");
  }

  async function handleDismiss(reportId: string) {
    await runAction(async () => {
      await dismissReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }, "Report dismissed");
  }

  async function confirmReveal() {
    if (!revealPostId) return;
    const postId = revealPostId;
    await runAction(async () => {
      const identity = await revealAnonymousAuthor("POST", postId);
      setRevealed((prev) => ({ ...prev, [postId]: identity }));
      setRevealPostId(null);
    }, "Anonymous author revealed (Audit logged)");
  }

  const reasons = Array.from(new Set(reports.map((r) => r.reason.toUpperCase())));

  return (
    <div className="space-y-4">
      {/* Search & Reason Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/60 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-muted/40 border border-border/50 rounded-lg px-2.5 py-1.5">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report reason, content, or author..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="size-3" /> Reason:
          </span>
          <button
            type="button"
            onClick={() => setReasonFilter("ALL")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
              reasonFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            All ({reports.length})
          </button>
          {reasons.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReasonFilter(r)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                reasonFilter === r
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/40 p-12 text-center space-y-2">
          <ShieldAlert className="size-8 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No Reports Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {reports.length === 0
              ? "All reports have been triaged. No outstanding user complaints."
              : "No reports match the active filter query."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block rounded-xl border border-border/60 bg-card/70 overflow-hidden shadow-2xs">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs text-muted-foreground">
                <thead className="bg-muted/50 text-[10px] uppercase font-bold text-foreground border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3">Reason / Details</th>
                    <th className="px-4 py-3">Reported Content</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3 text-right">Triage Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-muted/20 transition-colors">
                      {/* Reason Column */}
                      <td className="px-4 py-3.5 align-top max-w-[200px]">
                        <span className="font-bold text-foreground uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 inline-block">
                          {report.reason}
                        </span>
                        {report.details && (
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {report.details}
                          </p>
                        )}
                        <span className="text-[10px] text-muted-foreground/60 block mt-1">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Content Column */}
                      <td className="px-4 py-3.5 align-top max-w-md">
                        <p className="text-xs text-foreground font-normal leading-relaxed line-clamp-3 whitespace-pre-wrap">
                          {report.postBody}
                        </p>
                        <Link
                          href={`/post/${report.postId}`}
                          target="_blank"
                          className="text-[10px] font-semibold text-primary hover:underline mt-1 inline-block"
                        >
                          View post thread →
                        </Link>
                      </td>

                      {/* Author Column */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                            {report.authorDisplayName ?? revealed[report.postId]?.displayName ?? (
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <VenetianMask className="size-3 text-primary" />
                                <span>Anonymous</span>
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {report.authorUsername
                              ? `@${report.authorUsername}`
                              : revealed[report.postId]
                                ? `@${revealed[report.postId].username}`
                                : report.postPseudonym || "anon"}
                          </span>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-4 py-3.5 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          {report.authorUsername === null && !revealed[report.postId] && (
                            <button
                              type="button"
                              onClick={() => setRevealPostId(report.postId)}
                              disabled={isLoading}
                              title="Reveal author (strictly audit logged)"
                              className="size-7 rounded-lg hover:bg-blue-500/15 text-blue-500 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Eye className="size-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setKeepPostId(report.postId)}
                            disabled={isLoading}
                            title="Keep post & dismiss report"
                            className="size-7 rounded-lg hover:bg-emerald-500/15 text-emerald-500 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <CheckIcon className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleHide(report.postId)}
                            disabled={isLoading}
                            title="Hide post"
                            className="size-7 rounded-lg hover:bg-amber-500/15 text-amber-500 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <EyeOff className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletePostId(report.postId)}
                            disabled={isLoading}
                            title="Delete post permanently"
                            className="size-7 rounded-lg hover:bg-destructive/15 text-destructive flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismiss(report.id)}
                            disabled={isLoading}
                            title="Dismiss report only"
                            className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <XCircle className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Card View (Clean 100% width on phone screens) */}
          <div className="space-y-3 md:hidden">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-border/60 bg-card p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                    {report.reason}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {report.postBody}
                </p>

                {report.details && (
                  <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/40">
                    <span className="font-bold text-foreground">Note:</span> {report.details}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <div className="text-[11px] text-muted-foreground">
                    Author:{" "}
                    <span className="font-bold text-foreground">
                      {report.authorDisplayName ?? (report.postPseudonym || "Anonymous")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setKeepPostId(report.postId)}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <CheckIcon className="size-3" />
                      <span>Keep</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHide(report.postId)}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <EyeOff className="size-3" />
                      <span>Hide</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletePostId(report.postId)}
                      disabled={isLoading}
                      className="p-1 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(revealPostId)}
        title="Reveal Anonymous Author?"
        description="Are you sure you want to reveal the author of this reported post? This action is permanently audit-logged with your admin ID."
        confirmText="Reveal Identity"
        variant="info"
        isLoading={isLoading}
        onClose={() => setRevealPostId(null)}
        onConfirm={confirmReveal}
      />

      <ConfirmDialog
        isOpen={Boolean(keepPostId)}
        title="Keep & Publish Post?"
        description="Keep this post published and dismiss all associated active user reports?"
        confirmText="Keep Post"
        variant="success"
        isLoading={isLoading}
        onClose={() => setKeepPostId(null)}
        onConfirm={confirmKeep}
      />

      <ConfirmDialog
        isOpen={Boolean(deletePostId)}
        title="Permanently Delete Post?"
        description="This action will permanently delete this post from CampusLoop. It cannot be recovered."
        confirmText="Delete Post"
        variant="danger"
        isLoading={isLoading}
        onClose={() => setDeletePostId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
