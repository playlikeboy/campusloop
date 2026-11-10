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
import { Button, buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-border ">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-surface-muted border border-border rounded-lg px-2.5 py-1.5">
          <Search className="size-3.5 text-fg-muted shrink-0" />
          <input
            aria-label="Search reports"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reason, post or author"
            className="w-full bg-transparent text-xs text-fg placeholder:text-fg-muted outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-fg-muted mr-1 flex items-center gap-1">
            <Filter className="size-3" /> Reason:
          </span>
          <Chip size="sm" selected={reasonFilter === "ALL"} onClick={() => setReasonFilter("ALL")}>
            All ({reports.length})
          </Chip>
          {reasons.map((r) => (
            <Chip size="sm" selected={reasonFilter === r} key={r} onClick={() => setReasonFilter(r)}>
              {r}
            </Chip>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-12 text-center space-y-2">
          <ShieldAlert className="size-8 text-success mx-auto" />
          <h3 className="text-sm font-bold text-fg">No open reports</h3>
          <p className="text-xs text-fg-muted max-w-sm mx-auto">
            {reports.length === 0
              ? "All reports have been triaged. No outstanding user complaints."
              : "No reports match the active filter query."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block rounded-lg border border-border bg-surface overflow-hidden ">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs text-fg-muted">
                <thead className="bg-surface-muted text-xs font-bold text-fg border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Post</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-surface-muted transition-colors">
                      {/* Reason Column */}
                      <td className="px-4 py-3.5 align-top max-w-[200px]">
                        <span className="font-bold text-fg text-xs px-1.5 py-0.5 rounded bg-danger-subtle text-danger border border-danger/30 inline-block">
                          {report.reason}
                        </span>
                        {report.details && (
                          <p className="text-xs text-fg-muted mt-1 line-clamp-2 leading-relaxed">
                            {report.details}
                          </p>
                        )}
                        <span className="text-xs text-fg-subtle block mt-1">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Content Column */}
                      <td className="px-4 py-3.5 align-top max-w-md">
                        <p className="text-xs text-fg font-normal leading-relaxed line-clamp-3 whitespace-pre-wrap">
                          {report.postBody}
                        </p>
                        <Link
                          href={`/post/${report.postId}`}
                          target="_blank"
                          className="text-xs font-semibold text-brand-text hover:underline mt-1 inline-block"
                        >
                          Open post
                        </Link>
                      </td>

                      {/* Author Column */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-fg text-xs flex items-center gap-1.5">
                            {report.authorDisplayName ?? revealed[report.postId]?.displayName ?? (
                              <span className="inline-flex items-center gap-1 text-fg-muted">
                                <VenetianMask className="size-3 text-brand-text" />
                                <span>Anonymous</span>
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-fg-muted">
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
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setRevealPostId(report.postId)}
                              disabled={isLoading}
                              title="Reveal author (logged)"
                              aria-label="Reveal author (logged)"
                              className="text-brand-text"
                            >
                              <Eye aria-hidden />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setKeepPostId(report.postId)}
                            disabled={isLoading}
                            title="Keep post and close report"
                            aria-label="Keep post and close report"
                            className="text-success hover:bg-success-subtle"
                          >
                            <CheckIcon aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleHide(report.postId)}
                            disabled={isLoading}
                            title="Hide post"
                            aria-label="Hide post"
                            className="text-warning hover:bg-warning-subtle"
                          >
                            <EyeOff aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeletePostId(report.postId)}
                            disabled={isLoading}
                            title="Delete post"
                            aria-label="Delete post"
                            className="text-danger hover:bg-danger-subtle"
                          >
                            <Trash2 aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDismiss(report.id)}
                            disabled={isLoading}
                            title="Close report only"
                            aria-label="Close report only"
                          >
                            <XCircle aria-hidden />
                          </Button>
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
              <div key={report.id} className="rounded-lg border border-border bg-surface p-4  space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-fg text-xs px-2 py-0.5 rounded bg-danger-subtle text-danger border border-danger/30">
                    {report.reason}
                  </span>
                  <span className="text-xs text-fg-muted">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-fg leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {report.postBody}
                </p>

                {report.details && (
                  <p className="text-xs text-fg-muted bg-surface-muted p-2 rounded-lg border border-border">
                    <span className="font-bold text-fg">Note:</span> {report.details}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                  <div className="text-xs text-fg-muted">
                    Author:{" "}
                    <span className="font-bold text-fg">
                      {report.authorDisplayName ?? (report.postPseudonym || "Anonymous")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setKeepPostId(report.postId)}
                      disabled={isLoading}
                      className={buttonVariants({ variant: "primary", size: "sm" })}
                    >
                      <CheckIcon className="size-3" />
                      <span>Keep</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHide(report.postId)}
                      disabled={isLoading}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      <EyeOff className="size-3" />
                      <span>Hide</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete"
                      onClick={() => setDeletePostId(report.postId)}
                      disabled={isLoading}
                      className="text-danger hover:bg-danger-subtle"
                    >
                      <Trash2 aria-hidden />
                    </Button>
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
        title="Reveal the author?"
        description="Only do this for safety or legal reasons. Your name is saved in the audit log."
        confirmText="Reveal author"
        variant="info"
        isLoading={isLoading}
        onClose={() => setRevealPostId(null)}
        onConfirm={confirmReveal}
      />

      <ConfirmDialog
        isOpen={Boolean(keepPostId)}
        title="Keep this post?"
        description="The post stays up and all its open reports are closed."
        confirmText="Keep post"
        variant="success"
        isLoading={isLoading}
        onClose={() => setKeepPostId(null)}
        onConfirm={confirmKeep}
      />

      <ConfirmDialog
        isOpen={Boolean(deletePostId)}
        title="Delete this post?"
        description="It will be deleted for good."
        confirmText="Delete post"
        variant="danger"
        isLoading={isLoading}
        onClose={() => setDeletePostId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
