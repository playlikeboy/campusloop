"use client";

import { CheckCheck, Loader2, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { FeedCard } from "@/components/ui/feed-card";
import type { FeedPost } from "@/hooks/use-feed";
import { fetcher } from "@/lib/api";

interface FeedPageResponse {
  items: Array<{
    itemType: string;
    id: string;
    createdAt: string | Date;
    data: FeedPost;
  }>;
  nextCursor: string | null;
  hasMore: boolean;
}

interface CommunityPostStreamProps {
  profileId: string;
  tab: "joined" | "discussions";
  communityId?: string;
  emptyTitle: string;
  emptyDescription: string;
}

export function CommunityPostStream({
  profileId,
  tab,
  communityId,
  emptyTitle,
  emptyDescription,
}: CommunityPostStreamProps) {
  const getKey = (pageIndex: number, previousPageData: FeedPageResponse | null) => {
    if (previousPageData && !previousPageData.hasMore) return null;
    const cursor = pageIndex === 0 ? "" : previousPageData?.nextCursor || "";
    const params = new URLSearchParams({
      tab,
      cursor,
      limit: "12",
    });
    if (communityId) params.set("communityId", communityId);
    return "/api/communities/feed?" + params.toString();
  };

  const { data, setSize, isValidating } = useSWRInfinite<FeedPageResponse>(getKey, fetcher, {
    revalidateFirstPage: true,
    dedupingInterval: 8000,
    parallel: false,
  });

  const posts = useMemo(
    () =>
      (data || []).flatMap((page) =>
        (page?.items || [])
          .filter((item) => item.itemType === "POST")
          .map((item) => item.data)
      ),
    [data]
  );

  const hasMore = Boolean(data?.length && data[data.length - 1]?.hasMore);
  const loadingMore = isValidating && posts.length > 0;
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    busyRef.current = isValidating;
  }, [isValidating]);

  useEffect(() => {
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !busyRef.current) {
          setSize((size) => size + 1);
        }
      },
      { rootMargin: "500px 0px", threshold: 0.01 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, hasMore, setSize]);

  if (posts.length === 0 && isValidating) {
    return (
      <div className="space-y-px" aria-live="polite">
        {[0, 1, 2].map((item) => (
          <div key={item} className="animate-pulse px-4 py-5">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="mt-3 h-3 w-4/5 rounded bg-muted/70" />
            <div className="mt-2 h-3 w-2/3 rounded bg-muted/60" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
          <MessageSquare className="size-5" />
        </div>
        <h3 className="mt-4 text-sm font-black text-foreground">{emptyTitle}</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/20">
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} currentUserId={profileId} />
      ))}

      <div ref={setSentinel} className="flex min-h-20 items-center justify-center px-4 py-6">
        {loadingMore ? (
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            Loading more
          </div>
        ) : hasMore ? null : (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/80">
            <CheckCheck className="size-4 text-primary" />
            You're caught up
          </div>
        )}
      </div>
    </div>
  );
}
