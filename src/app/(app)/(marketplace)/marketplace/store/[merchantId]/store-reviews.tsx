"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo, getAvatarUrl } from "@/lib/utils";

interface StoreReviewsProps {
  storeId: string;
  storeName: string;
  fallbackRating?: string | number | null;
  reviews: any[];
  averageRating?: string;
  totalCount?: number;
  hasOwnReview: boolean;
  onSaved: () => void;
}

function Stars({ value, size = "size-3.5" }: { value: number; size?: string }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          aria-hidden="true"
          className={cn(size, s <= value ? "fill-fg stroke-fg" : "fill-transparent stroke-fg-subtle")}
        />
      ))}
    </span>
  );
}

/** Rating summary, review list and the write-a-review dialog. */
export function StoreReviews({
  storeId,
  storeName,
  fallbackRating,
  reviews,
  averageRating,
  totalCount,
  hasOwnReview,
  onSaved,
}: StoreReviewsProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const avg = averageRating ?? (fallbackRating != null ? String(fallbackRating) : null);
  const count = totalCount ?? reviews.length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    sounds.send();
    haptics.success();
    try {
      const res = await fetch(`/api/marketplace/store/${storeId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Couldn't save your review. Try again.");
      toast.success("Thanks for your review.");
      onSaved();
      setOpen(false);
      setComment("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your review. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
        <div>
          {avg && count > 0 ? (
            <>
              <p className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold text-fg tabular-nums">{avg}</span>
                <span className="text-sm text-fg-muted">out of 5</span>
              </p>
              <p className="text-sm text-fg-muted">
                {count} {count === 1 ? "review" : "reviews"}
              </p>
            </>
          ) : (
            <p className="text-sm text-fg-muted">No reviews yet.</p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            sounds.tap();
            setOpen(true);
          }}
        >
          {hasOwnReview ? "Edit your review" : "Write a review"}
        </Button>
      </div>

      {reviews.length > 0 ? (
        <ul className="divide-y divide-border">
          {reviews.map((r) => {
            const name = r.student?.displayName || r.studentName || "Student";
            const handle = r.student?.username;
            return (
              <li key={r.id} className="space-y-1.5 py-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={getAvatarUrl(r.student?.avatarUrl, handle || "student")}
                    alt=""
                    className="size-8 rounded-full bg-surface-muted object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">
                      {name}
                      {handle && <span className="ml-1.5 font-normal text-fg-muted">@{handle}</span>}
                    </p>
                    <Stars value={r.rating} size="size-3" />
                  </div>
                  <span className="shrink-0 text-xs text-fg-subtle">{formatTimeAgo(r.createdAt)}</span>
                </div>
                {r.comment && <p className="pl-10.5 text-sm text-fg">{r.comment}</p>}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          size="compact"
          icon={Star}
          title="No reviews yet"
          description="Ordered here? Tell others how it was."
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{hasOwnReview ? "Edit your review" : `Review ${storeName}`}</DialogTitle>
            <DialogDescription>How was your order?</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={rating === s}
                  aria-label={`${s} ${s === 1 ? "star" : "stars"}`}
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setRating(s);
                  }}
                  className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Star
                    className={cn(
                      "size-7",
                      s <= rating ? "fill-fg stroke-fg" : "fill-transparent stroke-fg-subtle"
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review-comment">Your review (optional)</Label>
              <Textarea
                id="review-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tasty, but packing could be better"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {hasOwnReview ? "Save review" : "Post review"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
