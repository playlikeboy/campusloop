"use client";

import { AlertTriangle, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { CuteCatEmpty } from "@/components/ui/cute-illustrations";
import { Button } from "@/components/ui/button";

export function FeedEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 sm:py-16 text-center rounded-3xl bg-card border border-border/80 p-6 sm:p-8 my-4 mx-3 shadow-2xs">
      <CuteCatEmpty size={108} className="mb-3.5" />
      <h3 className="font-heading font-bold text-foreground text-base sm:text-lg">
        Be the first to break the ice in your campus feed!
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-sm px-2 leading-relaxed">
        Share a thought, confession, question, or campus poll. Your fellow students are here to connect and discuss!
      </p>
      <div className="flex items-center justify-center gap-2.5 mt-5 flex-wrap">
        <Link href="/post/new">
          <Button size="default" className="gap-2 shadow-xs cursor-pointer rounded-full px-5 font-bold">
            <Plus className="size-4" />
            <span>Create Post</span>
          </Button>
        </Link>
        <Link href="/colleges">
          <Button variant="secondary" size="default" className="cursor-pointer rounded-full px-4 font-semibold text-xs sm:text-sm">
            <span>Explore Other Campuses</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function FeedCaughtUpCard() {
  return (
    <div className="space-y-4 pt-4 pb-10 px-3">
      <div className="rounded-2xl border border-border/80 bg-card p-6 text-center space-y-3 shadow-2xs">
        <h4 className="font-heading text-sm font-bold text-foreground">You&apos;ve caught up on all posts</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Want more campus activity? Explore 1,350+ Indian colleges or swipe on student dating profiles.
        </p>
        <div className="flex items-center justify-center gap-2.5 pt-2">
          <Link href="/colleges">
            <Button variant="secondary" size="sm">
              Campus Directory
            </Button>
          </Link>
          <Link href="/dating">
            <Button variant="secondary" size="sm">
              Campus Match
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function FeedErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-destructive/30 bg-destructive/5 p-6 my-4 mx-3 shadow-2xs">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3 border border-destructive/20">
        <AlertTriangle className="size-5" />
      </div>
      <h3 className="font-heading font-bold text-foreground text-sm">Couldn&apos;t load your feed</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
        Something went wrong while fetching posts. Check your connection and try again.
      </p>
      <Button
        onClick={onRetry}
        size="sm"
        className="mt-4"
      >
        <RefreshCw className="size-3.5" />
        <span>Retry</span>
      </Button>
    </div>
  );
}
