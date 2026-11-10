"use client";

import { ArrowUpDown, MessageSquareText, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedCard } from "@/components/ui/feed-card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { FeedPost } from "@/hooks/use-feed";

type PostCategoryFilter = "ALL" | "CONFESSION" | "QUESTION" | "POLL" | "EVENT";
type PostSortOrder = "LATEST" | "TOP_VOTED" | "MOST_DISCUSSED";

const FILTERS: { id: PostCategoryFilter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "QUESTION", label: "Questions" },
  { id: "CONFESSION", label: "Confessions" },
  { id: "POLL", label: "Polls" },
  { id: "EVENT", label: "Events" },
];

const SORT_LABEL: Record<PostSortOrder, string> = {
  LATEST: "Newest",
  TOP_VOTED: "Top",
  MOST_DISCUSSED: "Most comments",
};
const NEXT_SORT: Record<PostSortOrder, PostSortOrder> = {
  LATEST: "TOP_VOTED",
  TOP_VOTED: "MOST_DISCUSSED",
  MOST_DISCUSSED: "LATEST",
};

interface CollegeFeedPanelProps {
  posts: FeedPost[];
  collegeSlug: string;
  shortName: string;
  trendingTags: string[];
  currentUserId?: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
}

export function CollegeFeedPanel({
  posts,
  collegeSlug,
  shortName,
  trendingTags,
  currentUserId,
  hasMore,
  isLoadingMore,
  sentinelRef,
}: CollegeFeedPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PostCategoryFilter>("ALL");
  const [sortOrder, setSortOrder] = useState<PostSortOrder>("LATEST");

  const filteredPosts = useMemo(() => {
    let result = [...posts];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (p) =>
          p.body.toLowerCase().includes(q) ||
          p.author?.displayName?.toLowerCase().includes(q) ||
          p.author?.username?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "ALL") result = result.filter((p) => p.type === categoryFilter);
    if (sortOrder === "TOP_VOTED") result.sort((a, b) => b.votesCount - a.votesCount);
    else if (sortOrder === "MOST_DISCUSSED") result.sort((a, b) => b.commentsCount - a.commentsCount);
    else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [posts, searchQuery, categoryFilter, sortOrder]);

  const newPostHref = `/post/new?college=${collegeSlug}`;

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareText}
        bordered
        title={`No posts from ${shortName} yet`}
        description="Start the first conversation for your college."
        action={
          <Button asChild>
            <Link href={newPostHref}>
              <Plus />
              Write a post
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label={`Search posts from ${shortName}`}
          placeholder={`Search posts from ${shortName}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-11 pl-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear search"
            onClick={() => setSearchQuery("")}
            className="absolute top-1/2 right-1 -translate-y-1/2"
          >
            <X />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <fieldset className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
          <legend className="sr-only">Post type</legend>
          {FILTERS.map((f) => (
            <Chip
              key={f.id}
              size="sm"
              selected={categoryFilter === f.id}
              onClick={() => setCategoryFilter(f.id)}
            >
              {f.label}
            </Chip>
          ))}
        </fieldset>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          aria-label={`Sort: ${SORT_LABEL[sortOrder]}. Tap to change.`}
          onClick={() => setSortOrder(NEXT_SORT[sortOrder])}
        >
          <ArrowUpDown />
          {SORT_LABEL[sortOrder]}
        </Button>
      </div>

      {trendingTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-fg-muted">Popular here:</span>
          {trendingTags.map((tag) => (
            <Link
              key={tag}
              href={`/hashtag/${tag}`}
              className="font-semibold text-brand-text underline-offset-4 hover:underline"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 pl-4">
        <p className="text-sm text-fg-muted">Something to share with {shortName}?</p>
        <Button asChild size="sm">
          <Link href={newPostHref}>
            <Plus />
            Post
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {filteredPosts.map((post) => (
          <FeedCard key={post.id} post={post} currentUserId={currentUserId} />
        ))}

        {filteredPosts.length === 0 && (
          <EmptyState
            size="compact"
            bordered
            icon={Search}
            title="No posts match that"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("ALL");
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}

        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-6">
            {isLoadingMore && (
              <span className="flex items-center gap-2 text-sm text-fg-muted">
                <Spinner size="sm" />
                Loading more posts
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
