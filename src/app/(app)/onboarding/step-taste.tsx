"use client";

import { ArrowUp, Heart, VenetianMask, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Sticker } from "@/components/ui/stickers";
import { TASTE_QUIZ_MIN } from "@/lib/growth/constants";
import type { TastePost } from "@/lib/growth/taste-quiz";
import { cn } from "@/lib/utils";
import { POPULAR_INTERESTS } from "./onboarding-options";

/** How far a card must be dragged before it counts as a like or a skip. */
const SWIPE_THRESHOLD = 90;

export interface TasteResult {
  likedPostIds: string[];
  skippedPostIds: string[];
  interests: string[];
}

/**
 * Screen 2: swipe real posts. Right (or the heart) is "more like this", left
 * is "not for me". The last swipe moves on by itself; after a few swipes the
 * student can also stop early.
 */
export function StepTaste({
  posts,
  saving,
  onDone,
}: {
  posts: TastePost[];
  saving: boolean;
  onDone: (result: TasteResult) => void;
}) {
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [dragX, setDragX] = useState(0);
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const start = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const current = posts[index];
  const swiped = liked.length + skipped.length;
  const canFinishEarly = swiped >= Math.min(TASTE_QUIZ_MIN, posts.length);

  function finish(nextLiked = liked, nextSkipped = skipped) {
    onDone({ likedPostIds: nextLiked, skippedPostIds: nextSkipped, interests });
  }

  function decide(like: boolean) {
    if (!current || leaving || saving) return;
    const nextLiked = like ? [...liked, current.id] : liked;
    const nextSkipped = like ? skipped : [...skipped, current.id];
    setLeaving(like ? "right" : "left");
    // Let the card leave before the next one appears.
    window.setTimeout(() => {
      setLiked(nextLiked);
      setSkipped(nextSkipped);
      setDragX(0);
      setLeaving(null);
      if (index + 1 >= posts.length) finish(nextLiked, nextSkipped);
      else setIndex(index + 1);
    }, 180);
  }

  const offset = leaving === "right" ? 480 : leaving === "left" ? -480 : dragX;

  return (
    <div className="space-y-6">
      {current ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 text-sm text-fg-muted">
            <span className="tabular-nums">
              {Math.min(index + 1, posts.length)} of {posts.length}
            </span>
            <span>Swipe right if you'd want more like it</span>
          </div>

          <div className="relative min-h-64 touch-pan-y select-none">
            <Sticker
              key={current.id}
              className={cn(
                "sticker-pop flex min-h-64 cursor-grab flex-col gap-4 p-5 active:cursor-grabbing",
                !dragging && "transition-ui"
              )}
              style={{ transform: `translateX(${offset}px) rotate(${offset / 30}deg)`, opacity: leaving ? 0 : 1 }}
              onPointerDown={(e) => {
                start.current = e.clientX;
                setDragging(true);
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (start.current !== null) setDragX(e.clientX - start.current);
              }}
              onPointerUp={() => {
                const moved = dragX;
                start.current = null;
                setDragging(false);
                if (moved > SWIPE_THRESHOLD) decide(true);
                else if (moved < -SWIPE_THRESHOLD) decide(false);
                else setDragX(0);
              }}
              onPointerCancel={() => {
                start.current = null;
                setDragging(false);
                setDragX(0);
              }}
              role="group"
              aria-roledescription="post to rate"
              aria-label={`Post ${index + 1} of ${posts.length}`}
            >
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                {current.authorName ? (
                  <span className="truncate font-semibold text-fg">{current.authorName}</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-fg">
                    <VenetianMask className="size-4" aria-hidden="true" />
                    Anonymous
                  </span>
                )}
                <span aria-hidden="true">·</span>
                <span className="truncate">{current.campusName}</span>
              </div>
              <p className="flex-1 text-lg leading-snug text-fg">{current.body}</p>
              {current.upvotes > 0 && (
                <p className="inline-flex items-center gap-1 text-sm text-fg-muted">
                  <ArrowUp className="size-4" aria-hidden="true" />
                  <span className="tabular-nums">{current.upvotes}</span>{" "}
                  {current.upvotes === 1 ? "upvote" : "upvotes"}
                </p>
              )}
            </Sticker>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => decide(false)}
              disabled={saving}
            >
              <X aria-hidden="true" />
              Not for me
            </Button>
            <Button type="button" size="lg" className="flex-1" onClick={() => decide(true)} disabled={saving}>
              <Heart aria-hidden="true" />
              More like this
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-base text-fg-muted">
          Your campus is just getting started, so there's nothing to swipe yet. Pick a few topics instead.
        </p>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-fg">
          Topics you're into <span className="font-normal text-fg-muted">Optional</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {POPULAR_INTERESTS.map((tag) => (
            <Chip
              key={tag}
              size="sm"
              selected={interests.includes(tag)}
              onSelectedChange={(on) =>
                setInterests((prev) => (on ? [...prev, tag] : prev.filter((t) => t !== tag)))
              }
            >
              {tag}
            </Chip>
          ))}
        </div>
      </fieldset>

      {(!current || canFinishEarly) && (
        <Button
          type="button"
          variant={current ? "ghost" : "primary"}
          size="lg"
          className="w-full"
          loading={saving}
          onClick={() => finish()}
        >
          {current ? "That's enough, continue" : "Continue"}
        </Button>
      )}
    </div>
  );
}
