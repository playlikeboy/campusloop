"use client";

import { AlertCircle, Globe, Loader2, PenTool, RotateCw, School, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticlesRightSidebar } from "@/components/articles/articles-right-sidebar";
import {
  ARTICLE_CATEGORY_GROUPS,
  ARTICLE_CATEGORY_LIST,
  ARTICLE_FEED_TABS,
  type ArticleCategoryGroupKey,
  type ArticleFeedTab,
} from "@/constants/articles";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface ArticlesHubClientProps {
  initialArticles?: any[];
  initialProfile?: any | null;
}

export function ArticlesHubClient({ initialArticles = [], initialProfile = null }: ArticlesHubClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Search and filter params from URL
  const initialCategory = searchParams.get("category") || "ALL";
  const initialTag = searchParams.get("tag") || "";
  const initialQuery = searchParams.get("q") || "";
  const initialTab = (searchParams.get("tab") as ArticleFeedTab) || "latest";

  const [activeTab, setActiveTab] = useState<ArticleFeedTab>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedGroup, setSelectedGroup] = useState<ArticleCategoryGroupKey>("ALL");
  const [activeTag, setActiveTag] = useState<string>(initialTag);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Pagination & infinite loading state
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState<any[]>(initialArticles);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  const rawScope = searchParams.get("scope");
  const scope: "CAMPUS" | "GLOBAL" = rawScope === "CAMPUS" ? "CAMPUS" : "GLOBAL";

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync state to URL search params cleanly
  const updateUrlParams = useCallback(
    (updates: { tab?: string; category?: string; tag?: string; q?: string; scope?: string }) => {
      const p = new URLSearchParams(searchParams.toString());

      if (updates.tab !== undefined) {
        if (updates.tab && updates.tab !== "latest") p.set("tab", updates.tab);
        else p.delete("tab");
      }
      if (updates.category !== undefined) {
        if (updates.category && updates.category !== "ALL") p.set("category", updates.category);
        else p.delete("category");
      }
      if (updates.tag !== undefined) {
        if (updates.tag) p.set("tag", updates.tag);
        else p.delete("tag");
      }
      if (updates.q !== undefined) {
        if (updates.q) p.set("q", updates.q);
        else p.delete("q");
      }
      if (updates.scope !== undefined) {
        if (updates.scope === "CAMPUS") p.set("scope", "CAMPUS");
        else p.delete("scope");
      }

      const queryString = p.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  function handleTabChange(tab: ArticleFeedTab) {
    sounds.tap();
    haptics.light();
    setActiveTab(tab);
    setPage(1);
    updateUrlParams({ tab });
  }

  function handleCategoryChange(catKey: string) {
    sounds.tap();
    haptics.light();
    setSelectedCategory(catKey);
    setPage(1);
    updateUrlParams({ category: catKey });
  }

  function handleClearTag() {
    sounds.tap();
    setActiveTag("");
    setPage(1);
    updateUrlParams({ tag: "" });
  }

  function handleScopeChange(nextScope: "CAMPUS" | "GLOBAL") {
    sounds.tap();
    haptics.light();
    updateUrlParams({ scope: nextScope });
  }

  // Primary page 1 SWR query
  const queryParams = new URLSearchParams({
    page: "1",
    limit: "12",
    feed: activeTab,
    category: selectedCategory,
    scope,
    sort: activeTab === "trending" ? "trending" : activeTab === "for_you" ? "popular" : "latest",
  });
  if (activeTag) queryParams.set("tag", activeTag);
  if (debouncedQuery.trim()) queryParams.set("q", debouncedQuery.trim());

  const endpoint = `/api/articles?${queryParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{
    articles: any[];
    hasMore: boolean;
  }>(endpoint, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
    onSuccess: (newData) => {
      if (newData?.articles) {
        setArticles(newData.articles);
        setHasMore(Boolean(newData.hasMore));
        setPage(1);
      }
    },
  });

  // Infinite scroll next page
  const loadNextPage = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const nextParams = new URLSearchParams({
        page: String(nextPage),
        limit: "12",
        feed: activeTab,
        category: selectedCategory,
        scope,
        sort: activeTab === "trending" ? "trending" : activeTab === "for_you" ? "popular" : "latest",
      });
      if (activeTag) nextParams.set("tag", activeTag);
      if (debouncedQuery.trim()) nextParams.set("q", debouncedQuery.trim());

      const res = await fetch(`/api/articles?${nextParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load more articles");

      const payload = (await res.json()) as { articles: any[]; hasMore: boolean };
      const incoming = payload.articles || [];

      setArticles((prev) => {
        const merged = [...prev, ...incoming];
        const unique = Array.from(new Map(merged.map((a) => [a.id, a])).values());
        return unique;
      });

      setPage(nextPage);
      setHasMore(Boolean(payload.hasMore));
    } catch (err) {
      console.error("Infinite load error:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMore,
    isLoading,
    page,
    activeTab,
    selectedCategory,
    scope,
    activeTag,
    debouncedQuery,
  ]);

  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          void loadNextPage();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadNextPage, hasMore, isLoading, isLoadingMore]);

  async function handleRefresh() {
    setIsRefreshing(true);
    sounds.tap();
    haptics.medium();
    await mutate();
    setPage(1);
    setTimeout(() => setIsRefreshing(false), 500);
  }

  const displayArticles = articles.length > 0 ? articles : data?.articles || [];
  const featuredArticle =
    page === 1 && !debouncedQuery && !activeTag && selectedCategory === "ALL" && displayArticles.length > 0
      ? displayArticles[0]
      : null;
  const listArticles = featuredArticle ? displayArticles.slice(1) : displayArticles;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* ─── Top Editorial Title ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Campus Articles</h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">
            Ideas, guides &amp; placement roadmaps written by verified students
          </p>
        </div>

        <div className="flex items-center gap-2">
          {initialProfile?.institutionId && (
            <div className="flex items-center rounded-full bg-muted/60 p-1 border border-border/40">
              <button
                type="button"
                onClick={() => handleScopeChange("GLOBAL")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer",
                  scope === "GLOBAL"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="size-3" />
                <span>All India</span>
              </button>
              <button
                type="button"
                onClick={() => handleScopeChange("CAMPUS")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer",
                  scope === "CAMPUS"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <School className="size-3" />
                <span>My Campus</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh feed"
            className="flex size-9 items-center justify-center rounded-full border border-border/40 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Refresh feed"
          >
            <RotateCw className={cn("size-4", isRefreshing && "animate-spin text-primary")} />
          </button>
        </div>
      </div>

      {/* ─── Main 12-Column Responsive Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6">
        {/* Left Column (8 cols): Search, Tabs, Categories, Articles */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles, authors & topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-border/50 bg-muted/30 pl-10 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Active Tag Filter Indicator */}
          {activeTag && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Showing articles tagged:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                <span>#{activeTag}</span>
                <button
                  type="button"
                  onClick={handleClearTag}
                  aria-label="Remove tag filter"
                  className="hover:opacity-75 cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </span>
            </div>
          )}

          {/* Primary Discovery Tabs */}
          <div className="flex items-center gap-1 border-b border-border/30 overflow-x-auto no-scrollbar scroll-smooth">
            {ARTICLE_FEED_TABS.map((tab) => {
              if (tab.authRequired && !initialProfile) return null;
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer",
                    isActive
                      ? "border-primary text-foreground font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
 
          {/* Category Group Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {ARTICLE_CATEGORY_GROUPS.map((group) => {
              const Icon = group.icon;
              const isGroupActive = selectedGroup === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setSelectedGroup(group.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                    isGroupActive
                      ? "bg-foreground text-background border-foreground shadow-2xs font-bold"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/40"
                  )}
                >
                  <Icon className="size-3" />
                  <span>{group.label}</span>
                </button>
              );
            })}
          </div>

          {/* Categories Horizontal Scroll Strip */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => handleCategoryChange("ALL")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer",
                selectedCategory === "ALL"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50"
              )}
            >
              All Topics
            </button>

            {(selectedGroup === "ALL"
              ? ARTICLE_CATEGORY_LIST
              : ARTICLE_CATEGORY_LIST.filter((cat) => cat.group === selectedGroup)
            ).map((cat) => {
              const isSelected = selectedCategory === cat.key;
              const Icon = cat.icon;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategoryChange(cat.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50"
                  )}
                >
                  <Icon className="size-3" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Articles Stream */}
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3">
              <AlertCircle className="size-8 text-destructive mx-auto" />
              <p className="text-sm font-semibold text-foreground">Failed to load articles.</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : isLoading && displayArticles.length === 0 ? (
            <div className="space-y-4 py-4">
              <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
              <div className="h-28 rounded-xl bg-muted/40 animate-pulse" />
              <div className="h-28 rounded-xl bg-muted/40 animate-pulse" />
            </div>
          ) : displayArticles.length === 0 ? (
            <div className="rounded-2xl border border-border/40 bg-card/40 p-12 text-center space-y-3">
              <Sparkles className="size-8 text-muted-foreground/60 mx-auto" />
              <h3 className="text-base font-bold text-foreground">No articles found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {activeTab === "saved"
                  ? "You haven't saved any articles yet. Bookmark articles while reading to find them here."
                  : activeTab === "following"
                    ? "You aren't following any authors yet. Explore top campus authors and follow them!"
                    : "No student articles matched your query. Be the first to share your experience!"}
              </p>
              <div className="pt-2">
                <Link
                  href="/articles/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  <PenTool className="size-3.5" />
                  <span>Write First Article</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Featured Card (Top Trending/Latest on initial view) */}
              {featuredArticle && (
                <div className="pb-2">
                  <ArticleCard article={featuredArticle} featured={true} />
                </div>
              )}

              {/* Standard Article Items */}
              <div className="divide-y divide-border/25">
                {listArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} />
                ))}
              </div>

              {/* Infinite Scroll Trigger */}
              <div ref={observerTargetRef} className="py-6 text-center">
                {isLoadingMore && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Loading more reads...</span>
                  </div>
                )}
                {!hasMore && displayArticles.length > 6 && (
                  <p className="text-xs text-muted-foreground/70">
                    You&apos;ve reached the end of the publications stream.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Editorial Sidebar */}
        <div className="lg:col-span-4">
          <ArticlesRightSidebar />
        </div>
      </div>
    </div>
  );
}
