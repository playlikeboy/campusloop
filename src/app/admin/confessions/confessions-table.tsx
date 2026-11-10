"use client";

import { CheckCircle2, ExternalLink, Eye, EyeOff, Filter, Ghost, Search, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { type RevealedIdentity, revealAnonymousAuthor } from "../anonymity-actions";
import { deletePost, setPostStatus } from "../posts/actions";

export interface ConfessionItem {
  id: string;
  body: string;
  pseudonym: string | null;
  riskScore: number;
  status: "PUBLISHED" | "PENDING_REVIEW" | "HIDDEN" | "DELETED";
  createdAt: Date | string;
  institutionName: string | null;
}

export function ConfessionsTable({ initialConfessions }: { initialConfessions: ConfessionItem[] }) {
  const router = useRouter();
  const [confessions, setConfessions] = useState(initialConfessions);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, RevealedIdentity>>({});
  const [revealPostId, setRevealPostId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filtered = confessions.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inBody = c.body.toLowerCase().includes(q);
      const inPseudo = (c.pseudonym || "").toLowerCase().includes(q);
      const inCampus = (c.institutionName || "").toLowerCase().includes(q);
      return inBody || inPseudo || inCampus;
    }
    return true;
  });

  async function handleSetStatus(postId: string, status: "PUBLISHED" | "HIDDEN" | "DELETED") {
    setIsLoading(true);
    try {
      await setPostStatus(postId, status);
      setConfessions((prev) => prev.map((item) => (item.id === postId ? { ...item, status } : item)));
      toast.success(
        `Confession ${status === "PUBLISHED" ? "published" : status === "HIDDEN" ? "hidden" : "updated"}`
      );
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTargetId) return;
    setIsLoading(true);
    try {
      await deletePost(deleteTargetId);
      setConfessions((prev) => prev.filter((c) => c.id !== deleteTargetId));
      toast.success("Confession deleted");
      setDeleteTargetId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete confession");
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmReveal() {
    if (!revealPostId) return;
    const postId = revealPostId;
    setIsLoading(true);
    try {
      const identity = await revealAnonymousAuthor("POST", postId);
      setRevealed((prev) => ({ ...prev, [postId]: identity }));
      toast.success("Author revealed. This is saved in the audit log.");
      setRevealPostId(null);
    } catch (err: any) {
      toast.error(err.message || "Reveal authorization failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-border ">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-surface-muted border border-border rounded-lg px-2.5 py-1.5">
          <Search className="size-3.5 text-fg-muted shrink-0" />
          <input
            aria-label="Search confessions"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search text, college or nickname"
            className="w-full bg-transparent text-xs text-fg placeholder:text-fg-muted outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-fg-muted mr-1 flex items-center gap-1">
            <Filter className="size-3" /> Status:
          </span>
          {(["ALL", "PUBLISHED", "PENDING_REVIEW", "HIDDEN"] as const).map((s) => (
            <Chip size="sm" selected={statusFilter === s} key={s} onClick={() => setStatusFilter(s)}>
              {s === "ALL"
                ? "All"
                : s === "PENDING_REVIEW"
                  ? "Pending review"
                  : s === "PUBLISHED"
                    ? "Published"
                    : "Hidden"}
            </Chip>
          ))}
        </div>
      </div>

      {/* Confessions Stream */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-12 text-center space-y-2">
          <Ghost className="size-8 text-brand-text mx-auto opacity-70" />
          <h3 className="text-sm font-bold text-fg">No confessions match</h3>
          <p className="text-xs text-fg-muted max-w-sm mx-auto">Try another search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-surface p-4  flex flex-col justify-between gap-3 hover:border-border transition-colors"
            >
              <div className="space-y-2">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-subtle text-brand-text border border-brand-subtle-border">
                      <Ghost className="size-3" />
                      <span>{item.pseudonym || "Anonymous"}</span>
                    </span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded font-bold",
                        item.status === "PUBLISHED"
                          ? "bg-success-subtle text-success border border-success/20"
                          : item.status === "PENDING_REVIEW"
                            ? "bg-warning-subtle text-warning border border-warning/20"
                            : "bg-surface-muted text-fg-muted"
                      )}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>

                  <span className="text-fg-muted">
                    {item.institutionName?.split(",")[0]} · {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Confession Body */}
                <p className="text-xs text-fg leading-relaxed whitespace-pre-wrap line-clamp-5">
                  {item.body}
                </p>

                {/* Revealed Identity Notice if applicable */}
                {revealed[item.id] && (
                  <div className="p-2.5 rounded-lg bg-brand-subtle border border-brand/20 text-xs text-brand-text space-y-0.5">
                    <span className="font-bold flex items-center gap-1">
                      <Shield className="size-3" /> Identity Revealed (Audit Logged)
                    </span>
                    <p>
                      Author: {revealed[item.id].displayName} (@{revealed[item.id].username})
                    </p>
                    <p className="text-xs text-fg-muted">
                      Account status: {revealed[item.id].accountStatus}
                      {revealed[item.id].institutionName
                        ? ` · Campus: ${revealed[item.id].institutionName}`
                        : ""}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {item.status !== "PUBLISHED" && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSetStatus(item.id, "PUBLISHED")}
                      className={buttonVariants({ variant: "primary", size: "sm" })}
                    >
                      <CheckCircle2 className="size-3" />
                      <span>Publish</span>
                    </button>
                  )}
                  {item.status !== "HIDDEN" && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSetStatus(item.id, "HIDDEN")}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      <EyeOff className="size-3" />
                      <span>Hide</span>
                    </button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isLoading}
                    onClick={() => setDeleteTargetId(item.id)}
                    title="Delete"
                    aria-label="Delete"
                    className="hover:bg-danger-subtle hover:text-danger"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                  {!revealed[item.id] && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isLoading}
                      onClick={() => setRevealPostId(item.id)}
                      title="Reveal author (logged)"
                      aria-label="Reveal author (logged)"
                      className="hover:text-brand-text"
                    >
                      <Eye aria-hidden />
                    </Button>
                  )}
                </div>

                <Link
                  href={`/post/${item.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-text hover:underline ml-auto"
                >
                  <span>Live post</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmDialog
        isOpen={Boolean(revealPostId)}
        title="Reveal the author?"
        description="Only do this for safety or legal reasons. Students post here expecting to stay anonymous. Your name is saved in the audit log."
        confirmText="Reveal author"
        variant="warning"
        isLoading={isLoading}
        onClose={() => setRevealPostId(null)}
        onConfirm={confirmReveal}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete this confession?"
        description="It will be deleted for good."
        confirmText="Delete confession"
        variant="danger"
        isLoading={isLoading}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
