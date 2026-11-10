"use client";

import { Archive, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { archivePost, deletePost } from "@/app/(app)/(main)/post/actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedCard } from "@/components/ui/feed-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeedPost } from "@/hooks/use-feed";

/** Your archived posts. Only you can see this tab. */
export function ArchiveTab({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setFailed(false);
    try {
      const res = await fetch("/api/posts/archived");
      if (!res.ok) throw new Error("load failed");
      setPosts((await res.json()) as FeedPost[]);
    } catch {
      setFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(postId: string) {
    try {
      await archivePost(postId);
      toast.success("Post is public again");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      router.refresh();
    } catch {
      toast.error("Couldn't restore the post. Try again.");
    }
  }

  async function remove(postId: string) {
    if (!window.confirm("Delete this post for good? This can't be undone.")) return;
    try {
      await deletePost(postId);
      toast.success("Post deleted");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      router.refresh();
    } catch {
      toast.error("Couldn't delete the post. Try again.");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4" aria-busy="true">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  if (failed) {
    return (
      <EmptyState
        icon={Archive}
        title="Couldn't load your archive"
        description="Check your connection and try again."
        action={<Button onClick={() => void load()}>Try again</Button>}
      />
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={Archive}
        title="Nothing archived"
        description="Archive a post from its menu to hide it from everyone but you."
      />
    );
  }

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-fg-muted">Only you can see these posts.</p>
      {posts.map((post) => (
        <article key={post.id} className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border px-3 py-2">
            <Button size="sm" variant="outline" onClick={() => restore(post.id)}>
              Make public
            </Button>
            <Button size="sm" variant="ghost" className="text-danger" onClick={() => remove(post.id)}>
              <Trash2 aria-hidden="true" />
              Delete
            </Button>
          </div>
          <FeedCard post={post} currentUserId={currentUserId} disableNavigation />
        </article>
      ))}
    </div>
  );
}
