"use client";

import { PenLine } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedCard } from "@/components/ui/feed-card";
import { Spinner } from "@/components/ui/spinner";
import type { FeedPost } from "@/hooks/use-feed";

interface PostsTabProps {
  posts: FeedPost[];
  currentUserId: string;
  isOwnProfile: boolean;
  username: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreError: boolean;
  setSentinel: (node: HTMLDivElement | null) => void;
  retry: () => void;
}

export function PostsTab({
  posts,
  currentUserId,
  isOwnProfile,
  username,
  hasMore,
  isLoadingMore,
  loadMoreError,
  setSentinel,
  retry,
}: PostsTabProps) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={PenLine}
        title="No posts yet"
        description={isOwnProfile ? "Your posts will show up here." : `@${username} hasn't posted yet.`}
        action={
          isOwnProfile ? (
            <Button asChild>
              <Link href="/post/new">Write a post</Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="divide-y divide-border">
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}

      {hasMore && (
        <div ref={setSentinel} className="flex justify-center py-6">
          {isLoadingMore && <Spinner size="md" label="Loading more posts" className="text-fg-muted" />}
          {loadMoreError && !isLoadingMore && (
            <div className="flex flex-col items-center gap-2 text-sm text-fg-muted">
              <p>Couldn't load more posts.</p>
              <Button variant="outline" size="sm" onClick={retry}>
                Try again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
