"use client";

import { ArrowLeft, LayoutGrid, List, Loader2, Search, SlidersHorizontal, Upload, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { fieldClassName } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { DesktopSearchFilters, MobileSearchFilterSheet } from "./_components/search-filters";
import { SearchFocusTray } from "./_components/search-focus-tray";
import { RESOURCE_TYPES, type SearchSort } from "./_components/search-options";
import { SearchResults } from "./_components/search-results";

const RECENT_SEARCHES_STORAGE_KEY = "campusloop_academic_searches";

interface AcademicsSearchClientProps {
  profileId: string | null;
  initialQuery?: string;
  initialType?: string;
  initialBranch?: string;
  initialSemester?: string;
  initialSort?: string;
  initialScope?: "campus" | "global";
}

export function AcademicsSearchClient({
  profileId,
  initialQuery = "",
  initialType = "all",
  initialBranch = "All",
  initialSemester = "all",
  initialSort,
  initialScope = "global",
}: AcademicsSearchClientProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Search input state (immediate for typing)
  const [searchInput, setSearchInput] = useState(initialQuery);
  // Debounced search query for API calls
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Filter states
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [selectedBranch, setSelectedBranch] = useState<string>(initialBranch);
  const [selectedSemester, setSelectedSemester] = useState<string>(initialSemester);
  const [selectedScope, setSelectedScope] = useState<"campus" | "global">(initialScope);
  const [sortBy, setSortBy] = useState<SearchSort>(
    (initialSort as any) || (initialQuery ? "relevance" : "latest")
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loadMoreNode, setLoadMoreNode] = useState<HTMLDivElement | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 8));
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save a search to recent searches
  const saveRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        8
      );
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Clear single recent search
  const removeRecentSearch = (term: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== term);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Clear all recent searches
  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {}
  };

  // Debounce search input changes (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
      if (searchInput.trim()) {
        // If user typed a search term and sort was default latest, switch to relevance
        setSortBy((prev) => (prev === "latest" ? "relevance" : prev));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync URL query params without full page reload
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (selectedType !== "all") params.set("type", selectedType);
    if (selectedBranch !== "All") params.set("branch", selectedBranch);
    if (selectedSemester !== "all") params.set("semester", selectedSemester);
    if (selectedScope !== "global") params.set("scope", selectedScope);
    if (sortBy !== (debouncedQuery ? "relevance" : "latest")) params.set("sort", sortBy);

    const qs = params.toString();
    const newPath = qs ? `/academics/study-material/search?${qs}` : "/academics/study-material/search";
    window.history.replaceState(null, "", newPath);
  }, [debouncedQuery, selectedType, selectedBranch, selectedSemester, selectedScope, sortBy]);

  // Execute a selected search query immediately
  const handleSelectQuery = (term: string) => {
    sounds.tap();
    haptics.light();
    setSearchInput(term);
    setDebouncedQuery(term);
    saveRecentSearch(term);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  // Form submit (Enter key)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    setDebouncedQuery(trimmed);
    if (trimmed) {
      saveRecentSearch(trimmed);
    }
    setIsFocused(false);
    inputRef.current?.blur();
  };

  // Clear search input
  const handleClearInput = () => {
    sounds.tap();
    haptics.light();
    setSearchInput("");
    setDebouncedQuery("");
    inputRef.current?.focus();
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    sounds.tap();
    haptics.light();
    setSelectedType("all");
    setSelectedBranch("All");
    setSelectedSemester("all");
    setSelectedScope("global");
    setSortBy(debouncedQuery ? "relevance" : "latest");
  };

  const isPlaylistsTab = selectedType === "PLAYLISTS";

  // SWR Infinite key generator
  const getKey = (pageIndex: number, previousPageData: any) => {
    if (isPlaylistsTab) return null;
    if (previousPageData && (!previousPageData.items?.length || !previousPageData.hasMore)) {
      return null;
    }
    const params = new URLSearchParams();
    if (selectedType !== "all") params.set("resourceType", selectedType);
    if (selectedBranch !== "All") params.set("branch", selectedBranch);
    if (selectedSemester !== "all") params.set("semester", selectedSemester);
    if (debouncedQuery) params.set("q", debouncedQuery);
    params.set("scope", selectedScope);
    params.set("sort", sortBy);
    params.set("page", String(pageIndex + 1));
    params.set("limit", "24");
    return `/api/academics?${params.toString()}`;
  };

  const { data, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    totalPages: number;
  }>(getKey, fetcher, {
    revalidateFirstPage: false,
    dedupingInterval: 4000,
  });

  // Playlists API data
  const { data: playlistsData, isLoading: isPlaylistsLoading } = useSWR<{
    playlists: any[];
    pagination: { total: number };
  }>(
    isPlaylistsTab
      ? `/api/academics/playlists?branch=${selectedBranch}&semester=${selectedSemester}&q=${encodeURIComponent(
          debouncedQuery
        )}&scope=${selectedScope}`
      : null,
    fetcher
  );

  const items = useMemo(() => {
    return data ? data.flatMap((page) => page.items || []) : [];
  }, [data]);

  const totalCount = isPlaylistsTab
    ? (playlistsData?.pagination?.total ?? playlistsData?.playlists?.length ?? 0)
    : (data?.[0]?.total ?? 0);

  const isInitialLoading = isPlaylistsTab ? isPlaylistsLoading : isLoading && items.length === 0;
  const isEmpty = isPlaylistsTab
    ? !isPlaylistsLoading && (!playlistsData?.playlists || playlistsData.playlists.length === 0)
    : !isLoading && items.length === 0;
  const isReachingEnd = isPlaylistsTab || isEmpty || Boolean(data && !data[data.length - 1]?.hasMore);
  const isLoadingMore = Boolean(
    !isPlaylistsTab &&
      (isLoading || (isValidating && size > 1) || (size > 0 && data && typeof data[size - 1] === "undefined"))
  );

  // Infinite scroll intersection observer
  useEffect(() => {
    if (!loadMoreNode || isReachingEnd || isLoadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isLoadingMore) {
          setSize((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "400px" }
    );
    observer.observe(loadMoreNode);
    return () => observer.disconnect();
  }, [loadMoreNode, isReachingEnd, isLoadingMore, setSize]);

  // Re-trigger search mutate when filters change
  useEffect(() => {
    mutate();
  }, [debouncedQuery, selectedType, selectedBranch, selectedSemester, selectedScope, sortBy, mutate]);

  // Active filter count for badge
  const hasActiveFilters =
    selectedType !== "all" ||
    selectedBranch !== "All" ||
    selectedSemester !== "all" ||
    selectedScope !== "global" ||
    sortBy !== (debouncedQuery ? "relevance" : "latest");
  const activeFilterCount = [
    selectedBranch !== "All",
    selectedSemester !== "all",
    selectedScope !== "global",
    sortBy !== (debouncedQuery ? "relevance" : "latest"),
  ].filter(Boolean).length;

  const filters = { branch: selectedBranch, semester: selectedSemester, scope: selectedScope, sort: sortBy };
  const filterHandlers = {
    setBranch: setSelectedBranch,
    setSemester: setSelectedSemester,
    setScope: setSelectedScope,
    setSort: setSortBy,
    reset: handleResetFilters,
  };
  const typeLabel = RESOURCE_TYPES.find((t) => t.id === selectedType)?.label;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col bg-bg px-4 pb-28 sm:px-6 lg:px-8">
      <header
        className={cn(
          "sticky z-30 -mx-4 flex flex-col gap-3 border-b border-border bg-bg px-4 pt-3 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
          profileId ? "top-12 lg:top-0" : "top-14"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="-ml-2 shrink-0">
              <Link
                href="/academics/study-material"
                onClick={() => sounds.tap()}
                aria-label="Back to study material"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
              </Link>
            </Button>
            <h1 className="truncate text-xl text-fg sm:text-2xl">Search notes</h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <SegmentedControl
              aria-label="Layout"
              size="sm"
              className="hidden sm:inline-flex"
              value={viewMode}
              onChange={(v) => {
                sounds.tap();
                setViewMode(v);
              }}
              options={[
                {
                  value: "grid",
                  label: <span className="sr-only">Grid</span>,
                  icon: <LayoutGrid className="size-4" />,
                },
                {
                  value: "list",
                  label: <span className="sr-only">List</span>,
                  icon: <List className="size-4" />,
                },
              ]}
            />
            <Button asChild size="sm">
              <Link
                href="/academics/study-material/upload"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
              >
                <Upload className="size-4" aria-hidden="true" />
                Upload
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <form onSubmit={handleSubmit} className="relative w-full">
            <span className="pointer-events-none absolute top-1/2 left-3.5 flex -translate-y-1/2 text-fg-subtle">
              {isLoading && searchInput.trim() ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="size-4" aria-hidden="true" />
              )}
            </span>
            <input
              ref={inputRef}
              type="search"
              aria-label="Search notes, subjects or course codes"
              value={searchInput}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsFocused(false);
              }}
              placeholder="Notes, subjects, course codes"
              className={cn(fieldClassName, "h-12 pr-24 pl-10 [&::-webkit-search-cancel-button]:hidden")}
            />
            <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-1">
              {searchInput && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleClearInput}
                  aria-label="Clear search"
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              )}
              <Button type="submit" size="sm">
                Search
              </Button>
            </div>
          </form>

          {isFocused && (
            <SearchFocusTray
              recentSearches={recentSearches}
              onSelect={handleSelectQuery}
              onRemoveRecent={removeRecentSearch}
              onClearRecent={clearAllRecentSearches}
              onClose={() => setIsFocused(false)}
            />
          )}
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <div className="-mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
            {RESOURCE_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Chip
                  key={type.id}
                  size="sm"
                  selected={selectedType === type.id}
                  icon={<Icon aria-hidden="true" />}
                  onSelectedChange={() => {
                    sounds.tap();
                    haptics.light();
                    setSelectedType(type.id);
                  }}
                >
                  {type.label}
                </Chip>
              );
            })}
          </div>
          <Button
            variant={activeFilterCount > 0 ? "pill" : "secondary"}
            selected={activeFilterCount > 0}
            size="icon"
            className="relative shrink-0 sm:hidden"
            onClick={() => {
              sounds.tap();
              haptics.light();
              setIsFiltersOpen(true);
            }}
            aria-label={`Filters${activeFilterCount ? `, ${activeFilterCount} on` : ""}`}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal className="size-5" aria-hidden="true" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-fg tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        <DesktopSearchFilters
          filters={filters}
          on={filterHandlers}
          hasQuery={Boolean(debouncedQuery)}
          hasActive={hasActiveFilters}
        />
      </header>

      <MobileSearchFilterSheet
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        filters={filters}
        on={filterHandlers}
        hasQuery={Boolean(debouncedQuery)}
        activeCount={activeFilterCount}
      />

      <p className="py-3 text-sm text-fg-muted" aria-live="polite">
        {isInitialLoading ? (
          "Searching…"
        ) : debouncedQuery ? (
          <>
            <span className="font-semibold text-fg tabular-nums">{totalCount.toLocaleString()}</span> results
            for <span className="font-semibold text-fg">"{debouncedQuery}"</span>
            {selectedType !== "all" && typeLabel ? ` in ${typeLabel}` : ""}
          </>
        ) : (
          <>
            <span className="font-semibold text-fg tabular-nums">{totalCount.toLocaleString()}</span>{" "}
            {isPlaylistsTab ? "playlists" : "files"}
          </>
        )}
      </p>

      <SearchResults
        isPlaylistsTab={isPlaylistsTab}
        isInitialLoading={isInitialLoading}
        isLoadingMore={isLoadingMore}
        isReachingEnd={isReachingEnd}
        items={items}
        playlists={playlistsData?.playlists ?? []}
        viewMode={viewMode}
        profileId={profileId}
        query={debouncedQuery}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        setLoadMoreNode={setLoadMoreNode}
      />
    </div>
  );
}
