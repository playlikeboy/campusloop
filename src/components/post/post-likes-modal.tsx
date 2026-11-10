"use client";

import { BadgeCheck, Heart, Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useSWRInfinite from "swr/infinite";
import { FollowButton } from "@/components/profile/follow-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetcher } from "@/lib/api";
import { initialOf } from "@/lib/utils";

export interface LikedUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  points: number;
  branch: string | null;
  year: number | null;
  institutionName: string | null;
  isVerified: boolean;
  isFollowing?: boolean;
  isSelf?: boolean;
  likedAt: string | Date;
}

interface PostLikesResponse {
  likesCount: number;
  users: LikedUser[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface PostLikesModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export function PostLikesModal({ postId, isOpen, onClose, currentUserId }: PostLikesModalProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background body scroll
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getKey = (pageIndex: number, previousPageData: PostLikesResponse | null) => {
    if (!isOpen) return null;
    if (previousPageData && !previousPageData.hasMore) return null;
    const cursor = pageIndex === 0 ? "" : previousPageData?.nextCursor || "";
    const q = encodeURIComponent(debouncedQuery.trim());
    return `/api/posts/${postId}/likes?cursor=${encodeURIComponent(cursor)}&limit=15${q ? `&q=${q}` : ""}`;
  };

  const { data, size, setSize, isValidating, isLoading, error } = useSWRInfinite<PostLikesResponse>(
    getKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  // Reset pagination on search change
  useEffect(() => {
    setSize(1);
  }, [debouncedQuery, setSize]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  const users = useMemo(() => {
    const seen = new Set<string>();
    const merged: LikedUser[] = [];
    for (const page of data || []) {
      for (const user of page?.users || []) {
        if (seen.has(user.id)) continue;
        seen.add(user.id);
        merged.push(user);
      }
    }
    return merged;
  }, [data]);

  const totalCount = data?.[0]?.likesCount ?? users.length;
  const isReachingEnd = data ? data[data.length - 1]?.hasMore === false : false;
  const isLoadingInitial = isLoading && users.length === 0;
  const isLoadingMore = isValidating && data && typeof data[size - 1] === "undefined";

  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const isValidatingRef = useRef(isValidating);

  useEffect(() => {
    isValidatingRef.current = isValidating;
  }, [isValidating]);

  useEffect(() => {
    if (!sentinelNode || isReachingEnd || !isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isValidatingRef.current) {
          setSize((prev) => prev + 1);
        }
      },
      { rootMargin: "250px" }
    );

    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [sentinelNode, isReachingEnd, setSize, isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-(--z-modal) flex items-end justify-center bg-overlay p-3 animate-in fade-in duration-200 select-none sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-likes-title"
        className="w-full max-w-md bg-surface-raised border border-border rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[85vh] sticker-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-fg-muted" aria-hidden="true" />
            <h2 id="post-likes-title" className="font-display text-base font-bold text-fg">
              Liked by
            </h2>
            {totalCount > 0 && (
              <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border">
                {totalCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-10 rounded-full hover:bg-surface-muted text-fg-muted hover:text-fg flex items-center justify-center transition-ui cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2.5 border-b border-border bg-muted/20">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search names"
              aria-label="Search people who liked this"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-10 rounded-full border border-border bg-surface text-base sm:text-sm text-fg placeholder:text-fg-subtle outline-none focus-visible:ring-2 focus-visible:ring-ring transition-ui"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full text-fg-muted hover:text-fg cursor-pointer"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* User List Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/20 p-2 scroll-smooth">
          {isLoadingInitial ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-2xl animate-pulse">
                  <div className="size-10 rounded-full bg-muted/60 shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="h-3.5 w-28 bg-muted/60 rounded" />
                    <div className="h-2.5 w-40 bg-muted/40 rounded" />
                  </div>
                  <div className="h-7 w-16 bg-muted/40 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="text-center py-16 text-sm text-danger">
              Couldn't load likes. Check your connection, then close and reopen this.
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              {debouncedQuery ? (
                <>
                  <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
                    <Search className="size-6" />
                  </div>
                  <p className="text-sm font-bold text-fg">No one named &quot;{debouncedQuery}&quot;</p>
                </>
              ) : (
                <>
                  <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
                    <Heart className="size-6" />
                  </div>
                  <p className="text-sm font-bold text-fg">No likes yet</p>
                </>
              )}
            </div>
          ) : (
            <>
              {users.map((user) => {
                const isSelf = Boolean(user.isSelf || currentUserId === user.id);

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-muted/25 rounded-2xl transition-colors"
                  >
                    <Link
                      href={`/@${user.username}`}
                      onClick={onClose}
                      className="flex items-center gap-3 min-w-0 flex-1 group cursor-pointer"
                    >
                      <Avatar className="size-10 shrink-0 border border-border transition-transform shadow-2xs">
                        <AvatarImage src={user.avatarUrl || ""} />
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                          {initialOf(user.displayName, "S")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1">
                          <span>{user.displayName}</span>
                          {user.isVerified && (
                            <BadgeCheck
                              className="size-3.5 text-verified-text shrink-0"
                              aria-label="Verified"
                            />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate font-medium">
                          @{user.username}
                          {user.branch ? ` · ${user.branch.split("&")[0].trim()}` : ""}
                          {user.year ? ` '${user.year.toString().slice(-2)}` : ""}
                        </p>
                      </div>
                    </Link>

                    {!isSelf ? (
                      <FollowButton
                        username={user.username}
                        displayName={user.displayName}
                        initialIsFollowing={user.isFollowing || false}
                        size="sm"
                      />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
                        You
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Sentinel element for infinite scrolling */}
              {!isReachingEnd && <div ref={setSentinelNode} className="h-2" />}

              {/* Loading More Spinner */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span className="text-xs font-semibold">Loading more…</span>
                </div>
              )}

              {/* End of list indicator */}
              {isReachingEnd && users.length > 5 && (
                <p className="py-4 text-center text-xs font-semibold text-muted-foreground">
                  That's everyone
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
