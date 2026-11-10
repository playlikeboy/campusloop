"use client";

import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { type FollowListItem, FollowListRow } from "@/components/profile/follow-list-row";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { fetcher } from "@/lib/api";
import type { FollowDirection } from "@/lib/follows";
import { cn } from "@/lib/utils";

export interface FollowListPageData {
  items: FollowListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface FollowListClientProps {
  username: string;
  displayName: string;
  direction: FollowDirection;
  initialPage: FollowListPageData;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  isSignedIn: boolean;
}

export function FollowListClient({
  username,
  displayName,
  direction,
  initialPage,
  followersCount,
  followingCount,
  friendsCount,
  isSignedIn,
}: FollowListClientProps) {
  const getKey = (pageIndex: number, previousPageData: FollowListPageData | null) => {
    if (previousPageData && !previousPageData.hasMore) return null;
    const cursor = pageIndex === 0 ? "" : previousPageData?.nextCursor || "";
    return `/api/profile/${encodeURIComponent(username)}/${direction}?cursor=${encodeURIComponent(
      cursor
    )}&limit=20`;
  };

  const { data, size, setSize, isValidating } = useSWRInfinite<FollowListPageData>(getKey, fetcher, {
    // The first page is rendered on the server, so don't refetch it on mount.
    fallbackData: [initialPage],
    revalidateFirstPage: false,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const users = useMemo(() => {
    const seen = new Set<string>();
    const merged: FollowListItem[] = [];
    for (const page of data || []) {
      for (const item of page?.items || []) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        merged.push(item);
      }
    }
    return merged;
  }, [data]);

  const isReachingEnd = data ? data[data.length - 1]?.hasMore === false : false;
  const isLoadingMore = isValidating && data && typeof data[size - 1] === "undefined";

  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const isValidatingRef = useRef(isValidating);
  useEffect(() => {
    isValidatingRef.current = isValidating;
  }, [isValidating]);

  useEffect(() => {
    if (!sentinelNode || isReachingEnd) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isValidatingRef.current) {
          setSize((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "250px" }
    );

    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [sentinelNode, isReachingEnd, setSize]);

  const tabs: { id: FollowDirection; label: string; count: number }[] = [
    { id: "followers", label: "Followers", count: followersCount },
    { id: "following", label: "Following", count: followingCount },
    { id: "friends", label: "Friends", count: friendsCount },
  ];

  const emptyTitle =
    direction === "followers"
      ? `No followers yet`
      : direction === "following"
        ? `@${username} isn't following anyone yet`
        : "No friends yet";
  const emptyLine = direction === "friends" ? "Friends are people who follow each other." : undefined;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-bg">
        <div className="flex items-center gap-2 px-2 py-2">
          <Button asChild variant="ghost" size="icon" aria-label="Back to profile">
            <Link href={`/@${username}`}>
              <ArrowLeft aria-hidden="true" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg text-fg">{displayName}</h1>
            <p className="text-sm text-fg-muted">@{username}</p>
          </div>
        </div>

        <nav className="grid grid-cols-3" aria-label="Lists">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/@${username}/${tab.id}`}
              aria-current={tab.id === direction ? "page" : undefined}
              className={cn(
                "-mb-px flex h-11 items-center justify-center gap-1 border-b-2 text-sm transition-ui",
                tab.id === direction
                  ? "border-brand font-semibold text-fg"
                  : "border-transparent font-medium text-fg-muted hover:text-fg"
              )}
            >
              <span className="tabular-nums">{tab.count}</span> {tab.label}
            </Link>
          ))}
        </nav>
      </header>

      {users.length === 0 && !isLoadingMore ? (
        <EmptyState icon={Users} title={emptyTitle} description={emptyLine} />
      ) : (
        <ul className="divide-y divide-border">
          {users.map((user) => (
            <FollowListRow key={user.id} user={user} showFollowButton={isSignedIn} />
          ))}
        </ul>
      )}

      {isLoadingMore && (
        <div className="flex justify-center py-6">
          <Spinner size="md" label="Loading more people" className="text-fg-muted" />
        </div>
      )}

      {!isReachingEnd && <div ref={setSentinelNode} className="h-1" />}

      {isReachingEnd && users.length > 0 && (
        <p className="py-6 text-center text-sm text-fg-subtle">That's everyone</p>
      )}
    </div>
  );
}
