"use client";

import { AlertCircle, BookOpen, Globe, Loader2, PenTool, RotateCw, School } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticlesHubFilters } from "@/components/articles/articles-hub-filters";
import { ArticlesRightSidebar } from "@/components/articles/articles-right-sidebar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import type { ArticleCategoryGroupKey, ArticleFeedTab } from "@/constants/articles";
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

  const emptyCopy =
    activeTab === "saved"
      ? { title: "No saved articles yet", description: "Tap the bookmark on any article to keep it here." }
      : activeTab === "following"
        ? {
            title: "Nothing from people you follow",
            description: "Follow writers you like and their new articles show up here.",
          }
        : debouncedQuery || activeTag || selectedCategory !== "ALL"
          ? { title: "No articles match", description: "Try another word or clear the filters." }
          : { title: "No articles yet", description: "Write the first one for your campus." };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl text-fg sm:text-4xl">Articles</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Placement stories, study guides and campus life, written by students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {initialProfile?.institutionId && (
            <SegmentedControl
              size="sm"
              value={scope}
              onChange={handleScopeChange}
              options={[
                { value: "GLOBAL", label: "All colleges", icon: <Globe className="size-3.5" /> },
                { value: "CAMPUS", label: "My college", icon: <School className="size-3.5" /> },
              ]}
            />
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            aria-label="Refresh articles"
            title="Refresh articles"
          >
            <RotateCw className={cn("size-4", isRefreshing && "animate-spin")} />
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/articles/new">
              <PenTool className="size-4" />
              Write
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 pt-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <ArticlesHubFilters
            signedIn={Boolean(initialProfile)}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTag={activeTag}
            onClearTag={handleClearTag}
            selectedGroup={selectedGroup}
            onGroupChange={(group) => {
              sounds.tap();
              haptics.light();
              setSelectedGroup(group);
            }}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />

          {error ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load articles"
              description="Check your connection and try again."
              action={<Button onClick={handleRefresh}>Try again</Button>}
              bordered
            />
          ) : isLoading && displayArticles.length === 0 ? (
            <div className="space-y-4 py-2" aria-busy="true" aria-label="Loading articles">
              <Skeleton className="h-40 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
            </div>
          ) : displayArticles.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={emptyCopy.title}
              description={emptyCopy.description}
              action={
                <Button asChild>
                  <Link href="/articles/new">
                    <PenTool className="size-4" />
                    Write an article
                  </Link>
                </Button>
              }
              bordered
            />
          ) : (
            <div className="space-y-4">
              {featuredArticle && <ArticleCard article={featuredArticle} featured={true} />}

              <div className="divide-y divide-border">
                {listArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} />
                ))}
              </div>

              <div ref={observerTargetRef} className="py-6 text-center">
                {isLoadingMore && (
                  <p className="flex items-center justify-center gap-2 text-sm text-fg-muted">
                    <Loader2 className="size-4 animate-spin text-brand-text" />
                    Loading more
                  </p>
                )}
                {!hasMore && displayArticles.length > 6 && (
                  <p className="text-sm text-fg-subtle">That's all for now.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4" aria-label="More from articles">
          <ArticlesRightSidebar />
        </aside>
      </div>
    </div>
  );
}
