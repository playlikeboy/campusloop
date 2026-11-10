"use client";

import { CheckCircle2, RefreshCw, WifiOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Sticker } from "@/components/ui/stickers";

export function FeedEmptyState() {
  return (
    <EmptyState
      illustration={
        <Sticker tone="brand" pop className="sticker-caption px-4 py-2 text-lg">
          Be the first
        </Sticker>
      }
      title="No posts here yet"
      description="Ask a question or start a poll."
      action={
        <Button asChild>
          <Link href="/post/new">Write a post</Link>
        </Button>
      }
    />
  );
}

export function FeedCaughtUpCard() {
  return (
    <EmptyState
      size="compact"
      icon={CheckCircle2}
      title="You're all caught up"
      description="New posts will show up here."
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href="/explore">Explore more</Link>
        </Button>
      }
    />
  );
}

export function FeedErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      role="alert"
      icon={WifiOff}
      title="Couldn't load your feed"
      description="Check your internet, then try again."
      action={
        <Button onClick={onRetry} size="sm">
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </Button>
      }
    />
  );
}
