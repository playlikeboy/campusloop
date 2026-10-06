"use client";

import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Ghost,
  Search,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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

export function ConfessionsTable({
  initialConfessions,
}: {
  initialConfessions: ConfessionItem[];
}) {
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

  async function handleSetStatus(
    postId: string,
    status: "PUBLISHED" | "HIDDEN" | "DELETED"
  ) {
    setIsLoading(true);
    try {
      await setPostStatus(postId, status);
      setConfessions((prev) =>
        prev.map((item) => (item.id === postId ? { ...item, status } : item))
      );
      toast.success(`Confession status updated to ${status}`);
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
      toast.success("Confession removed permanently");
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
      toast.success("Anonymous identity revealed and logged in compliance audit");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/60 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-muted/40 border border-border/50 rounded-lg px-2.5 py-1.5">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search confession text, campus, or pseudonym..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="size-3" /> Status:
          </span>
          {(["ALL", "PUBLISHED", "PENDING_REVIEW", "HIDDEN"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                statusFilter === s
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "ALL" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Confessions Stream */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/40 p-12 text-center space-y-2">
          <Ghost className="size-8 text-primary mx-auto opacity-70" />
          <h3 className="text-sm font-bold text-foreground">No Confessions Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No anonymous posts match the active query or filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border/60 bg-card/70 p-4 shadow-2xs flex flex-col justify-between gap-3 hover:border-border transition-colors"
            >
              <div className="space-y-2">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      <Ghost className="size-3" />
                      <span>{item.pseudonym || "Anonymous"}</span>
                    </span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded uppercase font-bold",
                        item.status === "PUBLISHED"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : item.status === "PENDING_REVIEW"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>

                  <span className="text-muted-foreground">
                    {item.institutionName?.split(",")[0]} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Confession Body */}
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap line-clamp-5">
                  {item.body}
                </p>

                {/* Revealed Identity Notice if applicable */}
                {revealed[item.id] && (
                  <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-400 space-y-0.5">
                    <span className="font-bold flex items-center gap-1">
                      <Shield className="size-3" /> Identity Revealed (Audit Logged)
                    </span>
                    <p>
                      Author: {revealed[item.id].displayName} (@{revealed[item.id].username})
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Account status: {revealed[item.id].accountStatus}
                      {revealed[item.id].institutionName ? ` · Campus: ${revealed[item.id].institutionName}` : ""}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {item.status !== "PUBLISHED" && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSetStatus(item.id, "PUBLISHED")}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
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
                      className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-bold flex items-center gap-1 cursor-pointer border border-border/40"
                    >
                      <EyeOff className="size-3" />
                      <span>Hide</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setDeleteTargetId(item.id)}
                    className="p-1 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive cursor-pointer"
                    title="Delete permanently"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  {!revealed[item.id] && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setRevealPostId(item.id)}
                      className="p-1 rounded-lg hover:bg-blue-500/15 text-muted-foreground hover:text-blue-500 cursor-pointer"
                      title="Reveal identity (Requires justification & logs audit trail)"
                    >
                      <Eye className="size-3.5" />
                    </button>
                  )}
                </div>

                <Link
                  href={`/post/${item.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline ml-auto"
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
        title="Reveal Anonymous Author Identity?"
        description="WARNING: CampusLoop guarantees anonymous identity sealing. Revealing an author's real identity is strictly reserved for legal compliance and critical safety investigations. This action produces an immutable audit log row with your admin account."
        confirmText="Confirm Reveal"
        variant="warning"
        isLoading={isLoading}
        onClose={() => setRevealPostId(null)}
        onConfirm={confirmReveal}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Permanently Delete Confession?"
        description="This action will delete the confession from the network permanently."
        confirmText="Delete Confession"
        variant="danger"
        isLoading={isLoading}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
