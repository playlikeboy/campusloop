"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StoryProgress } from "@/components/ui/stickers";
import { cn } from "@/lib/utils";
import { STORY_MOMENTS, StoryMomentSticker } from "./landing-story-moments";

const SEGMENT_MS = 7000;
const FEST_OFFSET_MS = (3 * 24 + 5) * 60 * 60 * 1000;

const FIELD_CLASS = {
  ink: "story-frame-ink",
  deep: "story-frame-deep",
  paper: "story-frame-paper",
} as const;

const CONTROL =
  "bg-sticker text-sticker-fg shadow-sticker hover:bg-surface-muted focus-visible:ring-story-field-fg focus-visible:ring-offset-story-field";

/**
 * Phone-height story; each moment sets its own field (ink, deep violet or white). Cycles four labelled example moments,
 * each with a sticker you can actually use. Pauses while you interact with it.
 */
export function LandingStoryFrame() {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [festTarget] = useState(() => Date.now() + FEST_OFFSET_MS);

  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const count = STORY_MOMENTS.length;
  const go = (step: number) => setIndex((i) => (i + step + count) % count);
  const moment = STORY_MOMENTS[index];
  const paused = userPaused || engaged || hidden;

  return (
    <div className="mx-auto w-full max-w-[400px]">
      <section
        aria-roledescription="carousel"
        aria-label="Example campus stories"
        onPointerEnter={() => setEngaged(true)}
        onPointerLeave={() => setEngaged(false)}
        onFocus={() => setEngaged(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEngaged(false);
        }}
        className={cn(
          "story-field flex aspect-[9/15] flex-col overflow-hidden rounded-xl shadow-sticker-lift transition-colors duration-300 sm:aspect-[9/14]",
          FIELD_CLASS[moment.field]
        )}
      >
        <div className="px-3 pt-3">
          <StoryProgress
            count={count}
            current={index}
            duration={SEGMENT_MS}
            paused={paused}
            tone="onField"
            onComplete={() => go(1)}
          />
        </div>
        <header className="flex items-center gap-3 px-4 pt-3">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand font-display text-sm font-bold text-brand-fg"
          >
            {moment.who.charAt(0)}
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <strong className="block truncate font-semibold">{moment.who}</strong>
            <span className="text-story-field-muted">{moment.when} ago</span>
          </span>
          <Badge variant="example" className="border-story-field-muted bg-transparent text-story-field-fg">
            Example
          </Badge>
        </header>
        <div
          key={moment.id}
          aria-live={paused ? "polite" : "off"}
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${count}: ${moment.caption}`}
          className="flex min-h-0 flex-1 flex-col justify-start gap-5 overflow-y-auto px-4 pt-5 pb-5 sm:px-5"
        >
          <p className="sticker-caption text-balance text-4xl text-story-field-fg sm:text-6xl">
            {moment.caption}
          </p>
          <div className={cn("sticker-pop", index % 2 ? "[--pop-from:5deg]" : "[--pop-from:-6deg]")}>
            <StoryMomentSticker moment={moment} countdownTarget={festTarget} />
          </div>
        </div>
      </section>

      <div className="mt-4 flex items-center justify-center gap-3">
        <Button
          variant="circleIcon"
          size="icon"
          className={CONTROL}
          onClick={() => go(-1)}
          aria-label="Previous story"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Button>
        <Button
          variant="circleIcon"
          size="icon"
          className={CONTROL}
          onClick={() => setUserPaused((p) => !p)}
          aria-label={userPaused ? "Play stories" : "Pause stories"}
        >
          {userPaused ? (
            <Play className="size-5" aria-hidden="true" />
          ) : (
            <Pause className="size-5" aria-hidden="true" />
          )}
        </Button>
        <Button
          variant="circleIcon"
          size="icon"
          className={CONTROL}
          onClick={() => go(1)}
          aria-label="Next story"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
