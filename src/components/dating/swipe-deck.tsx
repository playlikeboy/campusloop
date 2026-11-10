"use client";

import { Heart, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sounds } from "@/lib/sounds";
import { BackCard, type Candidate, TopCard } from "./swipe-card";

export type { Candidate } from "./swipe-card";

export function SwipeDeck({
  candidates,
  onSwipe,
}: {
  candidates: Candidate[];
  onSwipe: (direction: "like" | "pass") => void;
}) {
  const [top, second, third] = candidates;
  if (!top) return null;

  return (
    <div className="relative mx-auto h-full w-full max-w-sm">
      {third && <BackCard key={third.id} candidate={third} depth={2} />}
      {second && <BackCard key={second.id} candidate={second} depth={1} />}
      <TopCard key={top.id} candidate={top} onSwipe={onSwipe} />
    </div>
  );
}

function buzz(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
}

/** Undo, Pass and Like under the deck. */
export function SwipeActions({
  onPass,
  onLike,
  onUndo,
  canUndo,
}: {
  onPass: () => void;
  onLike: () => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-4 py-1">
      <Button
        variant="circleIcon"
        size="icon"
        onClick={() => {
          buzz(15);
          sounds.tap();
          onUndo();
        }}
        disabled={!canUndo}
        aria-label="Undo last swipe"
      >
        <RotateCcw />
      </Button>
      <Button
        variant="circleIcon"
        size="icon-lg"
        onClick={() => {
          buzz(15);
          sounds.tap();
          onPass();
        }}
        aria-label="Pass"
        className="shadow-sm"
      >
        <X className="size-6" />
      </Button>
      <Button
        variant="crush"
        size="icon-lg"
        onClick={() => {
          buzz([20, 35]);
          sounds.pop();
          onLike();
        }}
        aria-label="Like"
        className="shadow-sticker"
      >
        <Heart className="size-6 fill-current" />
      </Button>
    </div>
  );
}
