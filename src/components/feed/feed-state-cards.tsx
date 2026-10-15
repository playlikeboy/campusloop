"use client";

import { AlertTriangle, CheckCircle2, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CuteCatEmpty } from "@/components/ui/cute-illustrations";

export function FeedEmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <CuteCatEmpty size={96} className="mb-4" />
      <h3 className="text-lg font-semibold text-foreground">Nothing here yet</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Start the conversation with a thought, a question or a poll for your campus.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button asChild className="rounded-full px-5">
          <Link href="/post/new">
            <Plus className="size-4" />
            Create post
          </Link>
        </Button>
        <Button asChild variant="ghost" className="rounded-full px-4">
          <Link href="/colleges">Explore campuses</Link>
        </Button>
      </div>
    </div>
  );
}

export function FeedCaughtUpCard() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 pt-10 pb-16 text-center">
      <CheckCircle2 className="size-6 text-primary" />
      <h4 className="text-[15px] font-semibold text-foreground">You&apos;re all caught up</h4>
      <p className="max-w-xs text-sm text-muted-foreground">
        Check back later, or explore other campuses for more.
      </p>
      <Button asChild variant="ghost" size="sm" className="mt-1 rounded-full">
        <Link href="/colleges">Explore campuses</Link>
      </Button>
    </div>
  );
}

export function FeedErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground">Couldn&apos;t load your feed</h3>
      <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Check your connection and try again.
      </p>
      <Button onClick={onRetry} size="sm" className="mt-4 rounded-full px-4">
        <RefreshCw className="size-3.5" />
        Retry
      </Button>
    </div>
  );
}
