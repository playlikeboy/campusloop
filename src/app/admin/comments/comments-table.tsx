"use client";

import { ChevronLeft, ChevronRight, Eye, SearchIcon, Trash2, VenetianMask } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { fieldClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type RevealedIdentity, revealAnonymousAuthor } from "../anonymity-actions";
import { deleteComment } from "./actions";

interface CommentRow {
  id: string;
  body: string;
  isAnonymous: boolean;
  pseudonym?: string | null;
  createdAt: string | Date;
  author?: { displayName: string; username: string } | null;
  post?: { body: string } | null;
}

interface CommentsTableProps {
  initialComments: CommentRow[];
  page: number;
  totalPages: number;
}

export function CommentsTable({ initialComments, page, totalPages }: CommentsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, RevealedIdentity>>({});
  const [revealCommentId, setRevealCommentId] = useState<string | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("q", search);
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`/admin/comments?${params.toString()}`);
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/comments?${params.toString()}`);
  }

  async function confirmDelete() {
    if (!deleteCommentId) return;
    const commentId = deleteCommentId;
    setActionLoading(commentId);
    try {
      await deleteComment(commentId);
      toast.success("Comment deleted");
      setDeleteCommentId(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete comment");
    } finally {
      setActionLoading(null);
    }
  }

  async function confirmReveal() {
    if (!revealCommentId) return;
    const commentId = revealCommentId;
    setActionLoading(commentId);
    try {
      const identity = await revealAnonymousAuthor("COMMENT", commentId);
      setRevealed((prev) => ({ ...prev, [commentId]: identity }));
      toast.success("Author revealed. This is saved in the audit log.");
      setRevealCommentId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reveal author");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-fg-muted" />
          <input
            aria-label="Search comments"
            type="text"
            placeholder="Search comments"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(fieldClassName, "w-full pl-9 pr-4 h-11")}
          />
        </div>
        <button type="submit" className={buttonVariants({ variant: "primary", size: "sm" })}>
          Search
        </button>
      </form>

      {/* Table */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm text-fg-muted">
            <thead className="bg-surface-muted text-xs text-fg">
              <tr>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Comment</th>
                <th className="px-6 py-4">Post Context</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialComments.map((c) => (
                <tr key={c.id} className="border-b border-border hover:bg-surface-muted">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-fg">
                        {c.isAnonymous
                          ? (revealed[c.id]?.displayName ?? (
                              <span className="inline-flex items-center gap-1">
                                <VenetianMask className="size-3 text-brand-text" />
                                <span>Anonymous</span>
                              </span>
                            ))
                          : c.author?.displayName}
                      </span>
                      <span className="text-xs text-fg-muted">
                        {c.isAnonymous
                          ? revealed[c.id]
                            ? `@${revealed[c.id].username} · ${revealed[c.id].accountStatus}`
                            : c.pseudonym || "anon"
                          : `@${c.author?.username}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-fg">{c.body}</td>
                  <td className="px-6 py-4 text-xs max-w-xs truncate">
                    {c.post?.body || "Original post deleted"}
                  </td>
                  <td className="px-6 py-4 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {c.isAnonymous && !revealed[c.id] && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={actionLoading === c.id}
                          onClick={() => setRevealCommentId(c.id)}
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
                        aria-label="Delete"
                        disabled={actionLoading === c.id}
                        onClick={() => setDeleteCommentId(c.id)}
                        className="text-danger hover:bg-danger-subtle"
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialComments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    No comments match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-muted">
            <span className="text-xs text-fg-muted">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                aria-label="Next page"
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reveal Author Modal */}
      <ConfirmDialog
        isOpen={Boolean(revealCommentId)}
        title="Reveal the author?"
        description="Only do this for safety or legal reasons. Your name is saved in the audit log."
        confirmText="Reveal author"
        variant="info"
        isLoading={Boolean(actionLoading && revealCommentId && actionLoading === revealCommentId)}
        onClose={() => setRevealCommentId(null)}
        onConfirm={confirmReveal}
      />

      {/* Delete Comment Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteCommentId)}
        title="Delete this comment?"
        description="It will be deleted for good."
        confirmText="Delete comment"
        variant="danger"
        isLoading={Boolean(actionLoading && deleteCommentId && actionLoading === deleteCommentId)}
        onClose={() => setDeleteCommentId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
