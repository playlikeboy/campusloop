"use client";

import { Bookmark, Compass, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { FeedCard } from "@/components/ui/feed-card";
import { FeedSkeleton } from "@/components/ui/skeleton-card";
import type { FeedPost } from "@/hooks/use-feed";
import { useScrollIsolation } from "@/hooks/use-scroll-isolation";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "ALL", label: "All Saved" },
  { id: "HOSTEL", label: "Hostel & Food", keywords: ["hostel", "mess", "food", "room", "canteen"] },
  {
    id: "PLACEMENTS",
    label: "Placements",
    keywords: ["placement", "intern", "package", "ctc", "interview", "salary"],
  },
  {
    id: "ACADEMICS",
    label: "Academics",
    keywords: ["exam", "professor", "cgpa", "assignment", "attendance", "notes"],
  },
  { id: "CONFESSIONS", label: "Confessions", keywords: ["confession", "crush", "secret", "anonymous"] },
] as const;

interface SavedApiResponse {
  posts: FeedPost[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export function SavedClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useScrollIsolation<HTMLElement>();

  const { data, isLoading, mutate } = useSWR<SavedApiResponse>("/api/posts/saved", fetcher, {
    revalidateOnFocus: true,
  });

  const posts = data?.posts || [];

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          post.body.toLowerCase().includes(q) ||
          post.author?.displayName?.toLowerCase().includes(q) ||
          post.author?.username?.toLowerCase().includes(q) ||
          post.institution?.name?.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Category Tag Filter
      if (selectedCategory === "ALL") return true;
      const cat = CATEGORIES.find((c) => c.id === selectedCategory);
      if (!cat || !("keywords" in cat)) return true;

      const bodyLower = post.body.toLowerCase();
      return cat.keywords.some((kw) => bodyLower.includes(kw));
    });
  }, [posts, searchQuery, selectedCategory]);

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── Main Saved Vault Stream (8 cols on lg) ─── */}
        <main className="lg:col-span-8 flex flex-col min-h-screen pb-24 bg-card/30 rounded-2xl border border-border/25 overflow-hidden shadow-2xs">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-background/85 px-4 pt-3.5 pb-2 backdrop-blur-xl border-b border-border/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Bookmark className="size-4.5 fill-amber-500 stroke-amber-500" />
                </div>
                <h1 className="text-base font-black tracking-tight text-foreground flex items-center gap-2">
                  Saved Posts Vault
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-muted text-muted-foreground">
                    {posts.length} {posts.length === 1 ? "Save" : "Saves"}
                  </span>
                </h1>
              </div>
            </div>

            {/* Search & Category Filter Pills */}
            <div className="space-y-2 pt-1">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search your saved posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-full bg-muted/50 border border-transparent focus:border-border/60 focus:bg-background text-xs font-medium placeholder:text-muted-foreground/60 outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                        isActive
                          ? "bg-foreground text-background font-black shadow-xs"
                          : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          {/* Posts List */}
          <div className="space-y-4 pt-3 px-4">
            {isLoading ? (
              <FeedSkeleton />
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => <FeedCard key={post.id} post={{ ...post, isSaved: true }} />)
            ) : (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto">
                <div className="size-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
                  <Bookmark className="size-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-foreground">
                    {searchQuery || selectedCategory !== "ALL"
                      ? "No matching saves found"
                      : "Your Campus Vault is Empty"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {searchQuery || selectedCategory !== "ALL"
                      ? "Try searching for different keywords or clearing your category filter."
                      : "Tap the bookmark icon on any post across the campus feed to archive hostel guides, placement advice, and study materials for later."}
                  </p>
                </div>
                {!searchQuery && selectedCategory === "ALL" && (
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <Compass className="size-3.5" /> <span>Explore Campuses</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ─── Desktop Vault Sidebar (4 cols on lg, sticky) ─── */}
        <aside
          ref={scrollRef}
          className="hidden lg:flex flex-col gap-4 lg:col-span-4 sticky top-4 h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain no-scrollbar select-none pr-1 pb-16"
        >
          {/* Quick Categories Filter Card */}
          <div className="rounded-2xl border border-border/30 bg-card/60 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vault Folders</h3>
            <div className="flex flex-col gap-1.5">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                      isActive
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-500 shadow-2xs font-black"
                        : "border-border/30 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{cat.label}</span>
                    {cat.id === "ALL" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {posts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Vaults Shortcuts */}
          <div className="rounded-2xl border border-border/30 bg-card/60 p-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Dedicated Vaults</h3>
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/academics/saved"
                className="flex items-center justify-between p-2.5 rounded-xl border border-border/30 bg-muted/20 hover:bg-muted/50 text-xs font-bold text-foreground transition-all"
              >
                <span>Academic Notes & PYQs Vault</span>
                <span className="text-[10px] text-primary">Open →</span>
              </Link>
              <Link
                href="/articles"
                className="flex items-center justify-between p-2.5 rounded-xl border border-border/30 bg-muted/20 hover:bg-muted/50 text-xs font-bold text-foreground transition-all"
              >
                <span>Campus Articles & Essays</span>
                <span className="text-[10px] text-primary">Browse →</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
