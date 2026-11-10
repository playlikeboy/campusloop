"use client";

import { MessageSquare, Star, WifiOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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

/** Rating summary, review list and, for learners who joined, a review form. */
export function CourseReviews({ slug, compact }: { slug: string; compact?: boolean }) {
  const { data, error, mutate } = useSWR<{ reviews: Review[]; ratingAvg: number; ratingCount: number }>(
    `/api/courses/${slug}/reviews`,
    fetcher
  );
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
      toast.error(e instanceof Error ? e.message : "Couldn't save your review. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {data && data.ratingCount > 0 && (
        <div className="flex items-center gap-3">
          <p className="font-display text-4xl font-extrabold tabular-nums text-fg">
            {data.ratingAvg.toFixed(1)}
          </p>
          <div>
            <RatingStars value={data.ratingAvg} size="md" />
            <p className="text-sm tabular-nums text-fg-muted">
              {data.ratingCount.toLocaleString("en-IN")} rating{data.ratingCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      )}

      {course?.viewer.enrolled && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <fieldset>
            <legend className="text-sm font-semibold text-fg">
              {mine ? "Change your review" : "How is this course so far?"}
            </legend>
            <div className="mt-1 flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <label
                  key={i}
                  className="flex size-11 cursor-pointer items-center justify-center rounded-full transition-ui hover:bg-surface-muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                >
                  <input
                    type="radio"
                    name="course-rating"
                    value={i}
                    checked={current === i}
                    onChange={() => setRating(i)}
                    className="sr-only"
                  />
                  <span className="sr-only">{`${i} star${i > 1 ? "s" : ""}`}</span>
                  <Star
                    className={cn("size-6", i <= current ? "fill-current text-brand" : "text-border-strong")}
                    aria-hidden
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-label="Your review"
            placeholder={mine?.body ?? "What did you like? What could be better? (optional)"}
            rows={compact ? 2 : 3}
            maxLength={2000}
            className="mt-2"
          />
          <Button onClick={submit} loading={busy} disabled={current === 0} className="mt-3">
            {mine ? "Update review" : "Post review"}
          </Button>
        </div>
      )}

      {error ? (
        <EmptyState
          size="compact"
          icon={WifiOff}
          title="Couldn't load reviews"
          description="Check your connection, then try again."
          action={
            <Button variant="secondary" onClick={() => mutate()}>
              Try again
            </Button>
          }
        />
      ) : !data ? (
        <div className="space-y-3">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      ) : data.reviews.length === 0 ? (
        <EmptyState
          size="compact"
          icon={MessageSquare}
          title="No reviews yet"
          description="People who join the course can leave one."
        />
      ) : (
        <ul className="space-y-5">
          {data.reviews.map((r) => (
            <li key={r.id} className="flex gap-3">
              <Avatar className="size-9">
                <AvatarImage src={r.author.avatarUrl ?? ""} alt="" />
                <AvatarFallback className="text-xs">{r.author.displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">{r.author.displayName}</p>
                <div className="flex items-center gap-2">
                  <RatingStars value={r.rating} />
                  <span className="text-xs text-fg-subtle">{formatTimeAgo(r.createdAt)}</span>
                </div>
                {r.body && <p className="mt-1 max-w-prose text-sm leading-relaxed text-fg">{r.body}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
