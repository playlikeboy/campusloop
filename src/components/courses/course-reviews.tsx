"use client";

import { Loader2, Star } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { courseAction, useCourse } from "@/hooks/use-courses";
import { fetcher } from "@/lib/api";
import { cn, formatTimeAgo } from "@/lib/utils";
import { RatingStars } from "./rating-stars";

interface Review {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  author: { displayName: string; username: string; avatarUrl: string | null };
}

/** Rating summary, list, and (for enrolled learners) a review form. */
export function CourseReviews({ slug, compact }: { slug: string; compact?: boolean }) {
  const { data, mutate } = useSWR<{ reviews: Review[]; ratingAvg: number; ratingCount: number }>(`/api/courses/${slug}/reviews`, fetcher);
  const { data: course, mutate: refreshCourse } = useCourse(slug);
  const mine = course?.viewer.myReview;
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const current = rating || mine?.rating || 0;

  async function submit() {
    setBusy(true);
    try {
      await courseAction(`/api/courses/${slug}/reviews`, { rating: current, body: body || mine?.body || "" });
      toast.success("Thanks for your review");
      setRating(0);
      setBody("");
      await Promise.all([mutate(), refreshCourse()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save review");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {data && data.ratingCount > 0 && (
        <div className="flex items-center gap-4">
          <p className="text-4xl font-black tabular-nums text-foreground">{data.ratingAvg.toFixed(1)}</p>
          <div>
            <RatingStars value={data.ratingAvg} size="md" />
            <p className="text-sm text-muted-foreground">{data.ratingCount} ratings</p>
          </div>
        </div>
      )}

      {course?.viewer.enrolled && (
        <div className="rounded-2xl bg-muted/40 p-4">
          <p className="text-sm font-semibold text-foreground">{mine ? "Update your review" : "How is this course so far?"}</p>
          <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" role="radio" aria-checked={current === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setRating(i)} className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
                <Star className={cn("size-6", i <= current ? "fill-reward text-reward" : "text-fg-muted")} />
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={mine?.body ?? "What did you like? What could be better? (optional)"}
            rows={compact ? 2 : 3}
            maxLength={2000}
            className="mt-2 w-full resize-none rounded-xl bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button type="button" onClick={submit} disabled={busy || current === 0} className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer">
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} {mine ? "Update review" : "Post review"}
          </button>
        </div>
      )}

      {!data ? (
        <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />
      ) : data.reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet. Learners can review after enrolling.</p>
      ) : (
        <ul className="space-y-4">
          {data.reviews.map((r) => (
            <li key={r.id} className="flex gap-3">
              <Avatar className="size-9">
                <AvatarImage src={r.author.avatarUrl ?? ""} alt="" />
                <AvatarFallback className="text-xs">{r.author.displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{r.author.displayName}</p>
                <div className="flex items-center gap-2"><RatingStars value={r.rating} /><span className="text-xs text-muted-foreground">{formatTimeAgo(r.createdAt)}</span></div>
                {r.body && <p className="mt-1 text-sm leading-relaxed text-foreground">{r.body}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
