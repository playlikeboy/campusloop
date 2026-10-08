"use client";

import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  FolderPlus,
  GraduationCap,
  Loader2,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { AcademicActiveFilters } from "@/components/academics/academic-active-filters";
import { AcademicAuthBenefitsCard } from "@/components/academics/academic-auth-benefits-card";
import { AcademicAuthModal } from "@/components/academics/academic-auth-modal";
import { AcademicCourseModal } from "@/components/academics/academic-course-modal";
import { AcademicCardSkeleton } from "@/components/academics/academic-card-skeleton";
import { AcademicContextRail } from "@/components/academics/academic-context-rail";
import { AcademicEmptyState } from "@/components/academics/academic-empty-state";
import { AcademicFilterBar } from "@/components/academics/academic-filter-bar";
import { AcademicHeader } from "@/components/academics/academic-header";
import { AcademicNavTabs } from "@/components/academics/academic-nav-tabs";
import { AcademicPlaylistCard } from "@/components/academics/academic-playlist-card";
import { AcademicSearchBar } from "@/components/academics/academic-search-bar";
import { AcademicCard } from "@/components/communities/academic-card";
import { GUEST_DOWNLOAD_LIMIT, getGuestDownloadCount } from "@/lib/academic-download-limiter";
import { trackAcademicSearch } from "@/lib/analytics/ga4";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface AcademicsClientProps {
  profileId: string | null;
  collegeName?: string;
  userSemester?: number;
  userBranch?: string;
}

export function AcademicsClient({
  profileId,
  collegeName = "Campus Hub",
  userSemester = 5,
  userBranch = "Computer Science",
}: AcademicsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("id");

  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<string>("for_you");
  const [selectedBranch, setSelectedBranch] = useState<string>("All");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedResourceType, setSelectedResourceType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [scope, setScope] = useState<"campus" | "global">("campus");
  const [sortBy, setSortBy] = useState<"for_you" | "latest" | "popular" | "downloads">("for_you");

  // Saved Materials State
  const [savedSubTab, setSavedSubTab] = useState<"notes" | "playlists">("notes");
  const [savedSemesterFilter, setSavedSemesterFilter] = useState<number | "all">("all");

  // Modals & Infinite Scroll
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFilterAccordionOpen, setIsFilterAccordionOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [loadMoreNode, setLoadMoreNode] = useState<HTMLDivElement | null>(null);
  const [guestRemaining, setGuestRemaining] = useState<number>(GUEST_DOWNLOAD_LIMIT);

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

  // Guest download limit
  useEffect(() => {
    if (!profileId) {
      const used = getGuestDownloadCount();
      setGuestRemaining(Math.max(0, GUEST_DOWNLOAD_LIMIT - used));
    }
  }, [profileId]);

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
    params.set("sort", sortBy);
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

  // Playlists Query
  const { data: playlistsData, isLoading: isPlaylistsLoading } = useSWR<{
    playlists: any[];
    pagination: { total: number };
  }>(
    activeTab === "PLAYLISTS" || (activeTab === "SAVED" && savedSubTab === "playlists")
      ? `/api/academics/playlists?branch=${selectedBranch}&semester=${selectedSemester}&q=${encodeURIComponent(searchQuery)}&scope=${scope}`
      : null,
    fetcher
  );

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
    setSearchQuery("");
  }

  const hasActiveFilters =
    selectedBranch !== "All" ||
    selectedSemester !== "all" ||
    selectedResourceType !== "all" ||
    sortBy !== "for_you" ||
    Boolean(searchQuery.trim());

  return (
    <div className="min-h-screen w-full max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pb-20 select-none">
      {/* ─── 1. Primary Page Header (Academics Title + Subtitle + Upload CTA) ─── */}
      <AcademicHeader
        scope={scope}
        onScopeChange={setScope}
        campusName={collegeName}
        totalCount={totalCount}
      />

      {/* ─── 2. Search Experience with ⌘ K and Suggestions ─── */}
      <div className="py-2">
        <AcademicSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
        />
      </div>

      {/* ─── 3. Content Navigation Tabs: [For You] [Notes] [PYQs] [Playlists] [Saved] ─── */}
      <div className="pt-2">
        <AcademicNavTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          savedCount={savedData?.items?.length}
        />
      </div>

      {/* ─── 4. Streamlined Filter & Academic Focus Action Bar ─── */}
      {isFeedTab && (
        <div className="pt-2 pb-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Accordion Filter Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setIsFilterAccordionOpen(!isFilterAccordionOpen);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer active:scale-95 shadow-2xs",
                  isFilterAccordionOpen || selectedBranch !== "All" || selectedSemester !== "all" || selectedResourceType !== "all" || sortBy !== "for_you"
                    ? "bg-foreground text-background border-foreground shadow-xs font-black"
                    : "bg-card border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <SlidersHorizontal className="size-3.5" />
                <span>Filters</span>
                {(selectedBranch !== "All" || selectedSemester !== "all" || selectedResourceType !== "all" || sortBy !== "for_you") && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-black">
                    {(selectedBranch !== "All" ? 1 : 0) + (selectedSemester !== "all" ? 1 : 0) + (selectedResourceType !== "all" ? 1 : 0) + (sortBy !== "for_you" ? 1 : 0)}
                  </span>
                )}
                {isFilterAccordionOpen ? (
                  <ChevronUp className="size-3.5 opacity-70" />
                ) : (
                  <ChevronDown className="size-3.5 opacity-70" />
                )}
              </button>

              {/* My Academic Focus Customizer Button */}
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setIsCourseModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-primary/30 bg-primary/10 hover:bg-primary/15 text-primary transition-all cursor-pointer active:scale-95 shadow-2xs"
                title="Customize your enrolled courses (e.g. DBMS, DAA) and branch to prioritize notes"
              >
                <GraduationCap className="size-3.5" />
                <span>My Courses &amp; Focus</span>
              </button>
            </div>

            {/* Quick Reset Button (Visible when filters are active) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Reset filters</span>
              </button>
            )}
          </div>

          {/* Expandable Accordion Filter Panel */}
          {isFilterAccordionOpen && (
            <div className="p-3 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md space-y-2 animate-in fade-in-50 slide-in-from-top-1 duration-200">
              <AcademicFilterBar
                branch={selectedBranch}
                semester={selectedSemester}
                resourceType={selectedResourceType}
                sortBy={sortBy}
                onBranchChange={setSelectedBranch}
                onSemesterChange={setSelectedSemester}
                onResourceTypeChange={setSelectedResourceType}
                onSortChange={setSortBy}
                onReset={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
                activeTab={activeTab}
              />

              {/* Active Filter Chips: CSE ×, Sem 5 ×, Clear all */}
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
              />
            </div>
          )}
        </div>
      )}

      {/* Guest conversion banner if not signed in */}
      {!profileId && (
        <div className="pt-3">
          <AcademicAuthBenefitsCard returnTo="/academics" dismissible={true} />
        </div>
      )}

      {/* ─── Main Content Layout: Main Stream + Optional Companion Rail ─── */}
      <div className="pt-4 grid grid-cols-1 xl:grid-cols-[1fr_288px] gap-8 items-start">
        {/* ── Main Stream Feed ── */}
        <main className="min-w-0 w-full space-y-4">
          {/* Subtle Personalization Explanation on For You Tab */}
          {activeTab === "for_you" && !hasActiveFilters && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/60 border border-border/30 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary shrink-0" />
              <span>
                Recommended for you · Based on verified syllabus for{" "}
                <strong className="text-foreground">Sem {userSemester} · {userBranch}</strong>
              </span>
            </div>
          )}

          {/* ── Tab: SAVED MATERIALS ── */}
          {activeTab === "SAVED" ? (
            <div className="space-y-4">
              {/* Saved Sub-Tab Switcher: Notes vs Playlists */}
              <div className="flex items-center justify-between border-b border-border/30 pb-2">
                <div className="flex rounded-full bg-muted/40 p-0.5 border border-border/40 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      setSavedSubTab("notes");
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer",
                      savedSubTab === "notes"
                        ? "bg-card text-foreground shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Saved Notes ({savedData?.items?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      setSavedSubTab("playlists");
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer",
                      savedSubTab === "playlists"
                        ? "bg-card text-foreground shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Playlists ({playlistsData?.playlists?.length || 0})
                  </button>
                </div>

                {savedSubTab === "notes" && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[11px] text-muted-foreground">Semester:</span>
                    <select
                      value={String(savedSemesterFilter)}
                      onChange={(e) =>
                        setSavedSemesterFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                      }
                      className="h-7 rounded-lg bg-card border border-border/60 px-2 text-xs text-foreground outline-none cursor-pointer"
                    >
                      <option value="all">All Sems</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={String(s)}>
                          Sem {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Saved Notes Feed */}
              {savedSubTab === "notes" ? (
                isSavedLoading ? (
                  <AcademicCardSkeleton count={3} />
                ) : filteredSavedItems.length > 0 ? (
                  <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden divide-y divide-border/20">
                    {filteredSavedItems.map((item) => (
                      <AcademicCard
                        key={item.id}
                        item={item}
                        currentUserId={profileId || undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <AcademicEmptyState
                    type="saved_empty"
                    onResetFilters={() => setActiveTab("for_you")}
                  />
                )
              ) : isPlaylistsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-36 rounded-2xl bg-card/40 border border-border/30 animate-pulse" />
                  ))}
                </div>
              ) : playlistsData?.playlists && playlistsData.playlists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {playlistsData.playlists.map((playlist: any) => (
                    <AcademicPlaylistCard key={playlist.id} playlist={playlist} />
                  ))}
                </div>
              ) : (
                <AcademicEmptyState
                  type="empty"
                  filterContext="Playlists"
                  onResetFilters={() => setActiveTab("for_you")}
                />
              )}
            </div>
          ) : activeTab === "PLAYLISTS" ? (
            /* ── Tab: PLAYLISTS ── */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Study Playlists</h2>
                  <p className="text-xs text-muted-foreground">Curated notes, PYQs, and exam bundles</p>
                </div>
                <Link
                  href="/academics/playlists/new"
                  onClick={() => sounds.tap()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Create Playlist</span>
                </Link>
              </div>

              {isPlaylistsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-36 rounded-2xl bg-card/40 border border-border/30 animate-pulse" />
                  ))}
                </div>
              ) : playlistsData?.playlists && playlistsData.playlists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {playlistsData.playlists.map((playlist: any) => (
                    <AcademicPlaylistCard key={playlist.id} playlist={playlist} />
                  ))}
                </div>
              ) : (
                <AcademicEmptyState
                  type="empty"
                  filterContext="Playlists"
                  onResetFilters={() => handleResetFilters()}
                />
              )}
            </div>
          ) : (
            /* ── Tab: CORE FEED (FOR YOU, NOTES, PYQs) ── */
            <div>
              {error ? (
                <AcademicEmptyState type="error" onRetry={() => mutate()} />
              ) : isInitialLoading ? (
                <AcademicCardSkeleton count={5} />
              ) : items.length > 0 ? (
                <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden divide-y divide-border/20">
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

              {/* Infinite Scroll Sentinel */}
              {items.length > 0 && (
                <div ref={setLoadMoreNode} className="flex flex-col items-center justify-center py-6 min-h-16">
                  {isLoadingMore && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      <span>Loading more resources...</span>
                    </div>
                  )}
                  {isReachingEnd && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/40 border border-border/40 text-xs font-semibold text-muted-foreground">
                      <Sparkles className="size-3.5 text-primary" />
                      <span>All {totalCount.toLocaleString()} study resources loaded</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── Contextual Companion Rail (Desktop xl+) ── */}
        <AcademicContextRail
          onSelectTopic={(topic) => {
            setSearchQuery(topic);
            sounds.tap();
          }}
          collegeName={collegeName}
          userSemester={userSemester}
          userBranch={userBranch}
        />
      </div>

      {/* Guest Authentication Modal */}
      <AcademicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        actionReason="UPLOAD"
        returnTo="/academics"
      />

      {/* Student Academic Focus & Enrolled Courses Customizer Modal */}
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
