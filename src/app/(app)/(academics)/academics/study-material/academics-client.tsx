"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { AcademicActiveFilters } from "@/components/academics/academic-active-filters";
import { AcademicAuthBenefitsCard } from "@/components/academics/academic-auth-benefits-card";
import { AcademicAuthModal } from "@/components/academics/academic-auth-modal";
import { AcademicCardSkeleton } from "@/components/academics/academic-card-skeleton";
import { AcademicContextRail } from "@/components/academics/academic-context-rail";
import { AcademicCourseModal } from "@/components/academics/academic-course-modal";
import { AcademicEmptyState } from "@/components/academics/academic-empty-state";
import { AcademicFilterBar } from "@/components/academics/academic-filter-bar";
import { AcademicHeader } from "@/components/academics/academic-header";
import { AcademicNavTabs } from "@/components/academics/academic-nav-tabs";
import { AcademicPlaylistCard } from "@/components/academics/academic-playlist-card";
import { AcademicPlaylistShelf } from "@/components/academics/academic-playlist-shelf";
import { AcademicSearchBar } from "@/components/academics/academic-search-bar";
import { AcademicCard } from "@/components/communities/academic-card";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { trackAcademicSearch } from "@/lib/analytics/ga4";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface AcademicsClientProps {
  profileId: string | null;
  collegeName?: string;
  userSemester?: number;
  userBranch?: string;
}

export function AcademicsClient({
  profileId,
  collegeName,
  userSemester = 5,
  userBranch = "Computer Science",
}: AcademicsClientProps) {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("id");

  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<string>("for_you");
  const [selectedBranch, setSelectedBranch] = useState<string>("All");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedResourceType, setSelectedResourceType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [scope, setScope] = useState<"campus" | "global">("campus");
  const [sortBy, setSortBy] = useState<"for_you" | "latest" | "popular" | "downloads" | "trending">(
    "for_you"
  );

  // Saved Materials State
  const [savedSubTab, setSavedSubTab] = useState<"notes" | "playlists">("notes");
  const [savedSemesterFilter, setSavedSemesterFilter] = useState<number | "all">("all");

  // Modals & Infinite Scroll
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [loadMoreNode, setLoadMoreNode] = useState<HTMLDivElement | null>(null);

  // Sync with URL Query Params
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchQuery(q);

    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);

    const branchParam = searchParams.get("branch");
    if (branchParam) setSelectedBranch(branchParam);

    const semParam = searchParams.get("semester");
    if (semParam) setSelectedSemester(semParam);
  }, [searchParams]);

  // Analytics Search Tracking
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(() => {
      trackAcademicSearch(
        searchQuery.trim(),
        selectedBranch !== "All" ? selectedBranch : undefined,
        selectedSemester !== "all" ? selectedSemester : undefined,
        activeTab !== "for_you" && activeTab !== "SAVED" ? activeTab : undefined
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedBranch, selectedSemester, activeTab]);

  // ─── Data Queries ──────────────────────────────────────────────────────────
  const isFeedTab = activeTab !== "PLAYLISTS" && activeTab !== "SAVED";

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (!isFeedTab) return null;
    if (previousPageData && (!previousPageData.items?.length || !previousPageData.hasMore)) {
      return null;
    }
    const params = new URLSearchParams();
    if (activeTab === "NOTES") {
      params.set("resourceType", "NOTES");
    } else if (activeTab === "PYQ") {
      params.set("resourceType", "PYQ");
    } else if (selectedResourceType !== "all") {
      params.set("resourceType", selectedResourceType);
    }
    if (selectedBranch !== "All") params.set("branch", selectedBranch);
    if (selectedSemester !== "all") params.set("semester", selectedSemester);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    params.set("scope", scope);
    params.set("sort", activeTab === "TRENDING" ? "trending" : sortBy);
    params.set("page", String(pageIndex + 1));
    params.set("limit", "15");
    return `/api/academics?${params.toString()}`;
  };

  const { data, size, setSize, isLoading, isValidating, error, mutate } = useSWRInfinite<{
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

  // Playlists are part of the For You feed as well as their dedicated tab.
  // The feed loads a small curated set; the dedicated playlist and saved views can load more.
  // The desktop companion rail uses playlists on every tab, while list views load a larger page.
  const playlistLimit =
    activeTab === "PLAYLISTS" || (activeTab === "SAVED" && savedSubTab === "playlists") ? "20" : "3";
  const playlistParams = new URLSearchParams({
    branch: selectedBranch,
    semester: selectedSemester,
    q: searchQuery.trim(),
    scope,
    sort: "popular",
    limit: playlistLimit,
  });
  const {
    data: playlistsData,
    isLoading: isPlaylistsLoading,
    error: playlistsError,
    mutate: mutatePlaylists,
  } = useSWR<{
    playlists: any[];
    pagination: { total: number; totalPages?: number };
  }>(`/api/academics/playlists?${playlistParams.toString()}`, fetcher);

  // Saved Resources Query
  const { data: savedData, isLoading: isSavedLoading } = useSWR<{
    items: any[];
    total: number;
    bySemester: Record<number, any[]>;
    availableSemesters: number[];
  }>(profileId && activeTab === "SAVED" ? "/api/academics/saved" : null, fetcher);

  const items = useMemo(() => {
    return data ? data.flatMap((page) => page.items || []) : [];
  }, [data]);

  const totalCount = data?.[0]?.total ?? 0;
  const isInitialLoading = isLoading && items.length === 0;
  const isEmpty = !isLoading && items.length === 0 && !error;
  const isReachingEnd = isEmpty || Boolean(data && !data[data.length - 1]?.hasMore);
  const isLoadingMore = Boolean(
    isLoading || (isValidating && size > 1) || (size > 0 && data && typeof data[size - 1] === "undefined")
  );

  // Filter saved items by semester
  const filteredSavedItems = useMemo(() => {
    const raw = savedData?.items || [];
    if (savedSemesterFilter === "all") return raw;
    return raw.filter((item) => (item.savedSemester || item.semester) === savedSemesterFilter);
  }, [savedData, savedSemesterFilter]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!loadMoreNode || isReachingEnd || isLoadingMore || !isFeedTab) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isLoadingMore) {
          setSize((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );

    observer.observe(loadMoreNode);
    return () => observer.disconnect();
  }, [loadMoreNode, isReachingEnd, isLoadingMore, setSize, isFeedTab]);

  // Scroll to highlight element
  useEffect(() => {
    if (highlightId && items.length > 0) {
      const el = document.getElementById(`academic-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightId, items]);

  function handleSearchSubmit(query: string) {
    sounds.tap();
    haptics.light();
    setSearchQuery(query);
  }

  function handleResetFilters() {
    sounds.tap();
    haptics.light();
    setSelectedBranch("All");
    setSelectedSemester("all");
    setSelectedResourceType("all");
    setSortBy("for_you");
    setScope("campus");
    setSearchQuery("");
  }

  const hasActiveFilters =
    selectedBranch !== "All" ||
    selectedSemester !== "all" ||
    selectedResourceType !== "all" ||
    sortBy !== "for_you" ||
    scope !== "campus" ||
    Boolean(searchQuery.trim());

  const playlistGrid = (list: any[]) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {list.map((playlist: any) => (
        <AcademicPlaylistCard key={playlist.id} playlist={playlist} />
      ))}
    </div>
  );

  const playlistSkeleton = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="status" aria-label="Loading playlists">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-36 rounded-lg" />
      ))}
    </div>
  );

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-20 lg:px-6">
      <AcademicHeader
        scope={scope}
        onScopeChange={setScope}
        campusName={collegeName}
        totalCount={totalCount}
      />

      <div className="space-y-3">
        <AcademicSearchBar value={searchQuery} onChange={setSearchQuery} onSubmit={handleSearchSubmit} />
        <AcademicNavTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          savedCount={savedData?.items?.length}
        />
      </div>

      {isFeedTab && (
        <div className="pt-2">
          <AcademicFilterBar
            branch={selectedBranch}
            semester={selectedSemester}
            resourceType={selectedResourceType}
            sortBy={sortBy}
            scope={scope}
            campusName={collegeName}
            onScopeChange={setScope}
            onBranchChange={setSelectedBranch}
            onSemesterChange={setSelectedSemester}
            onResourceTypeChange={setSelectedResourceType}
            onSortChange={setSortBy}
            onReset={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            activeTab={activeTab}
            onOpenCourseModal={() => setIsCourseModalOpen(true)}
          />
          <AcademicActiveFilters
            branch={selectedBranch}
            semester={selectedSemester}
            resourceType={selectedResourceType}
            sortBy={sortBy}
            onClearBranch={() => setSelectedBranch("All")}
            onClearSemester={() => setSelectedSemester("all")}
            onClearResourceType={() => setSelectedResourceType("all")}
            onClearSort={() => setSortBy("for_you")}
            onClearAll={handleResetFilters}
            className="hidden sm:flex"
          />
        </div>
      )}

      {!profileId && (
        <div className="pt-4">
          <AcademicAuthBenefitsCard returnTo="/academics/study-material" dismissible />
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-8 pt-5 xl:grid-cols-[1fr_288px]">
        <div className="w-full min-w-0 space-y-5">
          {activeTab === "for_you" && !hasActiveFilters && (
            <p className="text-sm text-fg-muted">
              Picked for Sem {userSemester}, {userBranch}
            </p>
          )}

          {activeTab === "for_you" && (
            <AcademicPlaylistShelf
              playlists={playlistsData?.playlists || []}
              isLoading={isPlaylistsLoading}
              error={playlistsError}
              onRetry={() => void mutatePlaylists()}
              onViewAll={() => setActiveTab("PLAYLISTS")}
            />
          )}

          {activeTab === "SAVED" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SegmentedControl
                  aria-label="Saved items"
                  size="sm"
                  value={savedSubTab}
                  onChange={(next) => {
                    sounds.tap();
                    setSavedSubTab(next);
                  }}
                  options={[
                    { value: "notes", label: `Notes (${savedData?.items?.length || 0})` },
                    { value: "playlists", label: `Playlists (${playlistsData?.playlists?.length || 0})` },
                  ]}
                />
                {savedSubTab === "notes" && (
                  <label className="flex items-center gap-2 text-sm text-fg-muted">
                    Semester
                    <select
                      value={String(savedSemesterFilter)}
                      onChange={(e) =>
                        setSavedSemesterFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                      }
                      className="h-10 cursor-pointer rounded-md border border-border-strong bg-surface px-3 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="all">All</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={String(s)}>
                          Sem {s}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {savedSubTab === "notes" ? (
                isSavedLoading ? (
                  <AcademicCardSkeleton count={3} />
                ) : filteredSavedItems.length > 0 ? (
                  <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
                    {filteredSavedItems.map((item) => (
                      <AcademicCard key={item.id} item={item} currentUserId={profileId || undefined} />
                    ))}
                  </div>
                ) : (
                  <AcademicEmptyState type="saved_empty" onResetFilters={() => setActiveTab("for_you")} />
                )
              ) : isPlaylistsLoading ? (
                playlistSkeleton
              ) : playlistsData?.playlists?.length ? (
                playlistGrid(playlistsData.playlists)
              ) : (
                <AcademicEmptyState
                  type="empty"
                  filterContext="Playlists"
                  onResetFilters={() => setActiveTab("for_you")}
                />
              )}
            </div>
          ) : activeTab === "PLAYLISTS" ? (
            <section aria-labelledby="playlists-heading" className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 id="playlists-heading" className="text-xl text-fg">
                    Playlists
                  </h2>
                  <p className="text-sm text-fg-muted">Notes and PYQs grouped by subject or exam.</p>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/academics/study-material/playlists/new" onClick={() => sounds.tap()}>
                    <Plus aria-hidden="true" />
                    New playlist
                  </Link>
                </Button>
              </div>

              {isPlaylistsLoading ? (
                playlistSkeleton
              ) : playlistsData?.playlists?.length ? (
                playlistGrid(playlistsData.playlists)
              ) : (
                <AcademicEmptyState
                  type="empty"
                  filterContext="Playlists"
                  onResetFilters={handleResetFilters}
                />
              )}
            </section>
          ) : (
            <div>
              {error ? (
                <AcademicEmptyState type="error" onRetry={() => mutate()} />
              ) : isInitialLoading ? (
                <AcademicCardSkeleton count={5} />
              ) : items.length > 0 ? (
                <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
                  {items.map((item) => (
                    <AcademicCard
                      key={item.id}
                      item={item}
                      currentUserId={profileId || undefined}
                      isHighlighted={highlightId === item.id}
                    />
                  ))}
                </div>
              ) : (
                <AcademicEmptyState
                  type="empty"
                  filterContext={searchQuery || (selectedBranch !== "All" ? selectedBranch : undefined)}
                  onResetFilters={handleResetFilters}
                />
              )}

              {items.length > 0 && (
                <div ref={setLoadMoreNode} className="flex min-h-16 items-center justify-center py-6">
                  {isLoadingMore ? (
                    <span className="flex items-center gap-2 text-sm text-fg-muted">
                      <Spinner size="sm" />
                      Loading more
                    </span>
                  ) : isReachingEnd ? (
                    <span className="text-sm text-fg-subtle">You've seen everything here.</span>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>

        <AcademicContextRail
          onSelectTopic={(topic) => {
            setSearchQuery(topic);
            sounds.tap();
          }}
          collegeName={collegeName}
          userSemester={userSemester}
          userBranch={userBranch}
          playlists={playlistsData?.playlists || []}
          playlistsLoading={isPlaylistsLoading}
          playlistsError={playlistsError}
        />
      </div>

      <AcademicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        actionReason="UPLOAD"
        returnTo="/academics/study-material"
      />

      <AcademicCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSaved={(updated) => {
          setSelectedBranch(updated.branch);
          setSelectedSemester(String(updated.semester));
          void mutate();
        }}
      />
    </div>
  );
}
