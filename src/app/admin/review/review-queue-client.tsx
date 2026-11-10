"use client";

import { CheckCircle2, ExternalLink, Filter, Ghost, Keyboard, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import type { PendingPost } from "../_lib/queries";
import { approvePendingPost, deletePost, rejectPendingPost } from "../posts/actions";

interface ReviewQueueClientProps {
  initialPosts: PendingPost[];
}

export function ReviewQueueClient({ initialPosts }: ReviewQueueClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [riskFilter, setRiskFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filter posts by risk score
  const filteredPosts = posts.filter((p) => {
    if (riskFilter === "HIGH") return p.riskScore >= 70;
    if (riskFilter === "MEDIUM") return p.riskScore >= 40 && p.riskScore < 70;
    if (riskFilter === "LOW") return p.riskScore < 40;
    return true;
  });

  const activePost = filteredPosts[selectedIndex] || null;

  async function handleApprove(postId: string) {
    setIsLoading(true);
    try {
      await approvePendingPost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post approved");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve post");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReject(postId: string) {
    setIsLoading(true);
    try {
      await rejectPendingPost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post hidden");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject post");
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTargetId) return;
    setIsLoading(true);
    try {
      await deletePost(deleteTargetId);
      setPosts((prev) => prev.filter((p) => p.id !== deleteTargetId));
      toast.success("Post deleted");
      setDeleteTargetId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete post");
    } finally {
      setIsLoading(false);
    }
  }

  // Keyboard navigation shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if typing in form inputs
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredPosts.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if ((e.key === "a" || e.key === "A") && activePost) {
        e.preventDefault();
        handleApprove(activePost.id);
      } else if ((e.key === "r" || e.key === "R") && activePost) {
        e.preventDefault();
        handleReject(activePost.id);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredPosts, selectedIndex, activePost]);

  function riskBadge(score: number) {
    if (score >= 70) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-danger-subtle text-danger border border-danger/30">
          High Risk · {score}
        </span>
      );
    }
    if (score >= 40) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-warning-subtle text-warning border border-warning/25">
          Medium Risk · {score}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-surface-muted text-fg-muted border border-border">
        Low Risk · {score}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter and Keyboard Help Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-border ">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-fg-muted mr-1 flex items-center gap-1">
            <Filter className="size-3" /> Filter:
          </span>
          {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((filter) => (
            <Chip
              size="sm"
              selected={riskFilter === filter}
              key={filter}
              onClick={() => {
                setRiskFilter(filter);
                setSelectedIndex(0);
              }}
            >
              {filter === "ALL" ? "All" : `${filter.charAt(0)}${filter.slice(1).toLowerCase()} risk`}
            </Chip>
          ))}
          <span className="text-xs font-semibold text-fg-muted ml-2">({filteredPosts.length} posts)</span>
        </div>

        {/* Keyboard shortcut tips */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-fg-muted font-mono">
          <Keyboard className="size-3 text-fg-muted" />
          <span>Shortcuts:</span>
          <span className="px-1.5 py-0.5 bg-surface-muted rounded border border-border text-xs">A</span>
          <span>Publish</span>
          <span className="px-1.5 py-0.5 bg-surface-muted rounded border border-border text-xs">R</span>
          <span>Hide</span>
          <span className="px-1.5 py-0.5 bg-surface-muted rounded border border-border text-xs">J/K</span>
          <span>Next/Prev</span>
        </div>
      </div>

      {/* Queue Stream */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-12 text-center space-y-2">
          <CheckCircle2 className="size-8 text-success mx-auto" />
          <h3 className="text-sm font-bold text-fg">Nothing to review</h3>
          <p className="text-xs text-fg-muted max-w-sm mx-auto">No held posts match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post, index) => {
            const isSelected = index === selectedIndex;
            return (
              <article
                key={post.id}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "rounded-lg border p-4 sm:p-5  transition-colors space-y-3 cursor-pointer",
                  isSelected
                    ? "bg-surface border-brand ring-1 ring-ring"
                    : "bg-surface border-border hover:border-border"
                )}
              >
                {/* Meta Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {riskBadge(post.riskScore)}
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-surface-muted text-fg border border-border">
                      {post.type}
                    </span>
                    {post.isAnonymous ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-fg-muted bg-surface-muted border border-border">
                        <Ghost className="size-3" />
                        <span>{post.pseudonym || "Anonymous"}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-fg-muted">Public Post</span>
                    )}
                  </div>

                  <span className="text-xs text-fg-muted font-medium">
                    {post.institutionName?.split(",")[0] || "Campus Hub"} ·{" "}
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Body Content */}
                <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{post.body}</p>

                {/* Actions Row */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(post.id);
                      }}
                      className={buttonVariants({ variant: "primary", size: "sm" })}
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Publish</span>
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(post.id);
                      }}
                      className={buttonVariants({ variant: "danger", size: "sm" })}
                    >
                      <XCircle className="size-3.5" />
                      <span>Hide</span>
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetId(post.id);
                      }}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                  <Link
                    href={`/post/${post.id}`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-text hover:underline ml-auto"
                  >
                    <span>View post</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        title="Delete this post?"
        description="It will be deleted for good."
        confirmText="Delete post"
        variant="danger"
        isLoading={isLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
