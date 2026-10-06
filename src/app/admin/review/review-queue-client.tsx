"use client";

import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Eye,
  Filter,
  Ghost,
  Keyboard,
  ShieldAlert,
  Trash2,
  VenetianMask,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
      toast.success("Post approved and published to campus feed");
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
      toast.success("Post rejected and quarantined (status set to HIDDEN)");
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
      toast.success("Post permanently removed from CampusLoop");
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
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
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
        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-destructive/15 text-destructive border border-destructive/25">
          High Risk · {score}
        </span>
      );
    }
    if (score >= 40) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/25">
          Medium Risk · {score}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-muted text-muted-foreground border border-border/40">
        Low Risk · {score}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter and Keyboard Help Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/60 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="size-3" /> Filter:
          </span>
          {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setRiskFilter(filter);
                setSelectedIndex(0);
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                riskFilter === filter
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {filter === "ALL" ? "All Items" : `${filter} Risk`}
            </button>
          ))}
          <span className="text-xs font-semibold text-muted-foreground ml-2">
            ({filteredPosts.length} posts)
          </span>
        </div>

        {/* Keyboard shortcut tips */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
          <Keyboard className="size-3 text-muted-foreground" />
          <span>Shortcuts:</span>
          <span className="px-1.5 py-0.5 bg-muted rounded border border-border/40 text-[10px]">A</span>
          <span>Publish</span>
          <span className="px-1.5 py-0.5 bg-muted rounded border border-border/40 text-[10px]">R</span>
          <span>Hide</span>
          <span className="px-1.5 py-0.5 bg-muted rounded border border-border/40 text-[10px]">J/K</span>
          <span>Next/Prev</span>
        </div>
      </div>

      {/* Queue Stream */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/40 p-12 text-center space-y-2">
          <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">Review Queue is Clear</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No posts match the current filter. All student posts have been verified or triaged.
          </p>
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
                  "rounded-xl border p-4 sm:p-5 shadow-2xs transition-all space-y-3 cursor-pointer",
                  isSelected
                    ? "bg-card border-primary/60 ring-1 ring-primary/30"
                    : "bg-card/70 border-border/60 hover:border-border"
                )}
              >
                {/* Meta Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {riskBadge(post.riskScore)}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-foreground border border-border/40">
                      {post.type}
                    </span>
                    {post.isAnonymous ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground bg-muted/40 border border-border/30">
                        <Ghost className="size-3" />
                        <span>{post.pseudonym || "Anonymous"}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">
                        Public Post
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-muted-foreground font-medium">
                    {post.institutionName?.split(",")[0] || "Campus Hub"} ·{" "}
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Body Content */}
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {post.body}
                </p>

                {/* Actions Row */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(post.id);
                      }}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
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
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
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
                      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-muted/50 hover:bg-destructive/15 text-muted-foreground hover:text-destructive border border-border/40 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                  <Link
                    href={`/post/${post.id}`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline ml-auto"
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
        title="Permanently remove post?"
        description="This action will permanently delete the post and cannot be undone. Are you sure you want to proceed?"
        confirmText="Delete Post"
        variant="danger"
        isLoading={isLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
