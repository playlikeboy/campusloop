"use client";

import { Bookmark, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedCard } from "@/components/ui/feed-card";
import { Input } from "@/components/ui/input";
import { FeedSkeleton } from "@/components/ui/skeleton-card";
import type { FeedPost } from "@/hooks/use-feed";
import { fetcher } from "@/lib/api";

const CATEGORIES: { id: string; label: string; keywords?: string[] }[] = [
  { id: "ALL", label: "All" },
  { id: "HOSTEL", label: "Hostel & food", keywords: ["hostel", "mess", "food", "room", "canteen"] },
  {
    id: "PLACEMENTS",
    label: "Placements",
    keywords: ["placement", "intern", "package", "ctc", "interview", "salary"],
  },
  {
    id: "ACADEMICS",
    label: "Studies",
    keywords: ["exam", "professor", "cgpa", "assignment", "attendance", "notes"],
  },
  { id: "CONFESSIONS", label: "Confessions", keywords: ["confession", "crush", "secret", "anonymous"] },
];

interface SavedApiResponse {
  posts: FeedPost[];
  page: number;
  limit: number;
  hasMore: boolean;
}

/** Posts you bookmarked. Search and a few quick filters, then the list. */
export function SavedClient() {
  const [category, setCategory] = useState("ALL");
  const [query, setQuery] = useState("");
  const { data, isLoading, mutate, error } = useSWR<SavedApiResponse>("/api/posts/saved", fetcher, {
    revalidateOnFocus: true,
  });
  const posts = useMemo(() => data?.posts ?? [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const keywords = CATEGORIES.find((c) => c.id === category)?.keywords;
    return posts.filter((post) => {
      const body = post.body.toLowerCase();
      if (
        q &&
        !(
          body.includes(q) ||
          post.author?.displayName?.toLowerCase().includes(q) ||
          post.author?.username?.toLowerCase().includes(q) ||
          post.institution?.name?.toLowerCase().includes(q)
        )
      )
        return false;
      return !keywords || keywords.some((kw) => body.includes(kw));
    });
  }, [posts, query, category]);

  const filtering = Boolean(query) || category !== "ALL";

  return (
    <div className="mx-auto w-full max-w-2xl pb-28">
      <header className="sticky top-14 z-20 space-y-3 border-b border-border bg-bg px-4 pt-3 pb-3 lg:top-0">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl text-fg">Saved</h1>
          {posts.length > 0 && (
            <span className="text-sm text-fg-muted tabular-nums">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </span>
          )}
        </div>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
          />
          <Input
            type="search"
            aria-label="Search saved posts"
            placeholder="Search saved posts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto" aria-label="Filter saved posts">
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              size="sm"
              className="shrink-0"
              selected={category === c.id}
              onSelectedChange={() => setCategory(c.id)}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </header>

      <div className="space-y-4 px-4 pt-4">
        {error ? (
          <EmptyState
            icon={Bookmark}
            title="Couldn't load saved posts"
            description="Your saves are safe. Check your connection and try again."
            action={<Button onClick={() => void mutate()}>Try again</Button>}
          />
        ) : isLoading ? (
          <FeedSkeleton />
        ) : filtered.length > 0 ? (
          filtered.map((post) => <FeedCard key={post.id} post={{ ...post, isSaved: true }} />)
        ) : filtering ? (
          <EmptyState
            icon={Search}
            title="Nothing matches"
            description="Try another word or filter."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setCategory("ALL");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Bookmark}
            title="No saved posts yet"
            description="Tap the bookmark on any post to keep it here."
            action={
              <Button asChild>
                <Link href="/feeds">Go to your feed</Link>
              </Button>
            }
          />
        )}

        {!isLoading && !error && (
          <p className="pt-2 text-center text-sm text-fg-muted">
            Looking for notes?{" "}
            <Link
              href="/academics/study-material/saved"
              className="font-semibold text-brand-text hover:underline"
            >
              See saved study material
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
