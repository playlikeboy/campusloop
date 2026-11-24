"use client";

import { ArrowBigUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequest } from "@/lib/api";
import type { MemeCard as MemeCardData } from "@/lib/play/server/memes";
import { cn } from "@/lib/utils";
import { PlayReportButton } from "../report-button";

/** One meme: image, caption, author and an upvote toggle. Vote counts only, never voters. */
export function MemeCard({ meme, onChange }: { meme: MemeCardData; onChange: () => void }) {
  const [voted, setVoted] = useState(meme.viewerVoted);
  const [upvotes, setUpvotes] = useState(meme.upvotes);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function toggle() {
    if (busy || meme.isOwn) return;
    setBusy(true);
    setVoted(!voted);
    setUpvotes((n) => n + (voted ? -1 : 1));
    try {
      const res = await apiRequest<{ voted: boolean; upvotes: number }>(`/api/play/memes/${meme.id}/vote`, "POST");
      setVoted(res.voted);
      setUpvotes(res.upvotes);
    } catch (e) {
      setVoted(meme.viewerVoted);
      setUpvotes(meme.upvotes);
      toast.error(e instanceof Error ? e.message : "Couldn't save your vote.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await apiRequest(`/api/play/memes/${meme.id}`, "DELETE");
      toast.success("Meme removed. You can post another this week.");
      setConfirmDelete(false);
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't remove it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Link href={`/profile/${meme.author.username}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-fg hover:underline">
          {meme.author.displayName}
          {meme.isOwn && <span className="font-normal text-brand-text"> (you)</span>}
        </Link>
        {meme.isOwn ? (
          <Button variant="ghost" size="icon" aria-label="Remove your meme" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden="true" />
          </Button>
        ) : (
          <PlayReportButton targetType="MEME" targetId={meme.id} label="Report this meme" onReported={onChange} />
        )}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- uploaded meme */}
      <img src={meme.imageUrl} alt={meme.caption ?? "Meme"} className="max-h-[70vh] w-full bg-surface-muted object-contain" loading="lazy" />
      <div className="flex items-start gap-3 px-4 py-3">
        <p className="min-w-0 flex-1 text-base break-words text-fg">{meme.caption}</p>
        <Button
          variant="outline"
          selected={voted}
          onClick={toggle}
          disabled={meme.isOwn}
          aria-pressed={voted}
          aria-label={`${voted ? "Remove upvote" : "Upvote"}, ${upvotes} ${upvotes === 1 ? "vote" : "votes"}`}
          className="shrink-0"
        >
          <ArrowBigUp aria-hidden="true" className={cn("size-5", voted && "fill-current")} />
          <span className="tabular-nums">{upvotes}</span>
        </Button>
      </div>
      <ConfirmDialog
        isOpen={confirmDelete}
        title="Remove your meme?"
        description="Its votes are lost. You can post a new one this week."
        confirmText="Remove"
        isLoading={busy}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </article>
  );
}
