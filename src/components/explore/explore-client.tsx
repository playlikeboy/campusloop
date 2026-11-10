"use client";

import { BookOpen, Building2, Calendar, GraduationCap, ShoppingBag, Users, WifiOff } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import useSWR from "swr";
import { CampusPulseSection } from "@/components/explore/campus-pulse-section";
import {
  AcademicPreviewCard,
  ArticlePreviewCard,
  CollegePreviewCard,
  CommunityPreviewCard,
  EventPreviewCard,
  PersonPreviewCard,
  StorePreviewCard,
} from "@/components/explore/entity-card";
import { ExploreHeader } from "@/components/explore/explore-header";
import { ExploreSection } from "@/components/explore/explore-section";
import { QuickExploreNav } from "@/components/explore/quick-explore-nav";
import { UnifiedSearchView } from "@/components/explore/unified-search-view";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import type { SearchApiResponse, SearchCategoryFilter, SearchScope } from "@/lib/search/types";

interface ExploreHomeData {
  scope: string;
  collegeName: string;
  pulse: {
    trends: any[];
    topDiscussions: any[];
  };
  communities: any[];
  events: any[];
  academics: any[];
  articles: any[];
  colleges: any[];
  people: any[];
  marketplace: any[];
}

interface ExploreClientProps {
  initialQuery?: string;
  initialScope?: SearchScope;
  initialType?: SearchCategoryFilter;
}

export function ExploreClient({
  initialQuery = "",
  initialScope = "CAMPUS",
  initialType = "ALL",
}: ExploreClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // URL state synchronization
  const queryParam = searchParams.get("q") || initialQuery;
  const scopeParam = (
    searchParams.get("scope") === "GLOBAL" || searchParams.get("scope") === "INDIA" ? "INDIA" : "CAMPUS"
  ) as SearchScope;
  const typeParam = (searchParams.get("type") || initialType).toUpperCase() as SearchCategoryFilter;

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [scope, setScope] = useState<SearchScope>(scopeParam);
  const [activeFilter, setActiveFilter] = useState<SearchCategoryFilter>(typeParam);

  // Sync state with URL params on back/forward navigation
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const s =
      searchParams.get("scope") === "GLOBAL" || searchParams.get("scope") === "INDIA" ? "INDIA" : "CAMPUS";
    const t = (searchParams.get("type") || "ALL").toUpperCase() as SearchCategoryFilter;

    setSearchQuery(q);
    setScope(s);
    setActiveFilter(t);
  }, [searchParams]);

  // URL updater helper
  const updateUrl = useCallback(
    (newQ: string, newScope: SearchScope, newType: SearchCategoryFilter) => {
      const params = new URLSearchParams();
      if (newQ.trim()) params.set("q", newQ.trim());
      if (newScope !== "CAMPUS") params.set("scope", newScope);
      if (newType !== "ALL" && newQ.trim()) params.set("type", newType.toLowerCase());

      const queryStr = params.toString();
      const newUrl = queryStr ? `${pathname}?${queryStr}` : pathname;

      startTransition(() => {
        router.replace(newUrl, { scroll: false });
      });
    },
    [pathname, router]
  );

  function handleSearchSubmit(q: string) {
    setSearchQuery(q);
    updateUrl(q, scope, activeFilter);
  }

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    if (!q.trim()) {
      updateUrl("", scope, "ALL");
    }
  }

  function handleScopeChange(newScope: SearchScope) {
    setScope(newScope);
    updateUrl(searchQuery, newScope, activeFilter);
  }

  function handleFilterChange(filter: SearchCategoryFilter) {
    setActiveFilter(filter);
    updateUrl(searchQuery, scope, filter);
  }

  // Live Unified Search Query (State B)
  const isSearchActive = Boolean(searchQuery.trim());
  const searchEndpoint = isSearchActive
    ? `/api/search?q=${encodeURIComponent(searchQuery.trim())}&scope=${scope}&type=${activeFilter}`
    : null;

  const {
    data: searchData,
    isLoading: searchLoading,
    error: searchError,
  } = useSWR<SearchApiResponse>(searchEndpoint, fetcher, {
    dedupingInterval: 4000,
    keepPreviousData: true,
  });

  // Explore Home Previews (State A)
  const homeEndpoint = !isSearchActive ? `/api/explore/home?scope=${scope}` : null;
  const {
    data: homeData,
    isLoading: homeLoading,
    error: homeError,
    mutate: retryHome,
  } = useSWR<ExploreHomeData>(homeEndpoint, fetcher, {
    dedupingInterval: 20000,
  });

  return (
    <div className="mx-auto w-full max-w-7xl min-h-screen px-3 sm:px-6 py-4 pb-28 space-y-7">
      {/* ─── Header & Search bar (shared across both states) ─── */}
      <ExploreHeader
        searchQuery={searchQuery}
        scope={scope}
        onSearchChange={handleSearchChange}
        onScopeChange={handleScopeChange}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* ─── STATE B: QUERY ACTIVE (Unified Search) ─── */}
      {isSearchActive ? (
        <UnifiedSearchView
          query={searchQuery}
          data={searchData}
          isLoading={searchLoading}
          error={searchError}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          onQueryChange={(q) => {
            setSearchQuery(q);
            updateUrl(q, scope, activeFilter);
          }}
        />
      ) : (
        /* ─── STATE A: NO QUERY (Explore Dashboard) ─── */
        <div className="space-y-8">
          {/* Quick Explore Category Chips */}
          <QuickExploreNav />

          {/* Loading Skeletons */}
          {homeError && !homeData && (
            <EmptyState
              role="alert"
              size="compact"
              bordered
              icon={WifiOff}
              title="Couldn't load Explore"
              description="Check your internet, then try again."
              action={
                <Button variant="secondary" size="sm" onClick={() => retryHome()}>
                  Try again
                </Button>
              }
            />
          )}

          {homeLoading && !homeData && (
            <div className="space-y-6">
              <Skeleton className="h-44 w-full rounded-lg" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
              </div>
            </div>
          )}

          {/* Trending tags and most-discussed posts */}
          {homeData?.pulse && (
            <CampusPulseSection
              trends={homeData.pulse.trends || []}
              topDiscussions={homeData.pulse.topDiscussions || []}
            />
          )}

          {/* Communities & Clubs Section */}
          {homeData?.communities && homeData.communities.length > 0 && (
            <ExploreSection
              id="explore-communities"
              title="Communities"
              subtitle="Clubs and groups run by students"
              icon={Users}
              viewAllHref="/communities"
              viewAllLabel="See all"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {homeData.communities.map((c: any) => (
                  <CommunityPreviewCard key={c.id} community={c} />
                ))}
              </div>
            </ExploreSection>
          )}

          {/* Upcoming Events Section */}
          {homeData?.events && homeData.events.length > 0 && (
            <ExploreSection
              id="explore-events"
              title="Upcoming events"
              subtitle="Fests, hackathons and workshops"
              icon={Calendar}
              viewAllHref="/events"
              viewAllLabel="See all"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {homeData.events.map((ev: any) => (
                  <EventPreviewCard key={ev.id} event={ev} />
                ))}
              </div>
            </ExploreSection>
          )}

          {/* Study material section */}
          {homeData?.academics && homeData.academics.length > 0 && (
            <ExploreSection
              id="explore-academics"
              title="Study material"
              subtitle="Notes, past papers and guides shared by students"
              icon={GraduationCap}
              viewAllHref="/academics"
              viewAllLabel="See all"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {homeData.academics.map((res: any) => (
                  <AcademicPreviewCard key={res.id} resource={res} />
                ))}
              </div>
            </ExploreSection>
          )}

          {/* Articles & Long Reads Section */}
          {homeData?.articles && homeData.articles.length > 0 && (
            <ExploreSection
              id="explore-articles"
              title="Articles"
              subtitle="Guides and stories written by students"
              icon={BookOpen}
              viewAllHref="/articles"
              viewAllLabel="See all"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {homeData.articles.map((art: any) => (
                  <ArticlePreviewCard key={art.id} article={art} />
                ))}
              </div>
            </ExploreSection>
          )}

          {/* Colleges Directory Section */}
          {homeData?.colleges && homeData.colleges.length > 0 && (
            <ExploreSection
              id="explore-colleges"
              title="Colleges"
              subtitle="Find your college and others near you"
              icon={Building2}
              viewAllHref="/colleges"
              viewAllLabel="See all"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {homeData.colleges.map((col: any) => (
                  <CollegePreviewCard key={col.id} college={col} />
                ))}
              </div>
            </ExploreSection>
          )}

          {/* People to Follow Section */}
          {homeData?.people && homeData.people.length > 0 && (
            <ExploreSection
              id="explore-people"
              title="People to follow"
              subtitle="Students who post a lot on CampusLoop"
              icon={Users}
              viewAllHref="/colleges"
              viewAllLabel="See more"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {homeData.people.map((p: any) => (
                  <PersonPreviewCard key={p.id} person={p} />
                ))}
              </div>
            </ExploreSection>
          )}

          {/* Marketplace / Campus Stores Section */}
          {homeData?.marketplace && homeData.marketplace.length > 0 && (
            <ExploreSection
              id="explore-marketplace"
              title="Marketplace"
              subtitle="Canteens and shops near campus"
              icon={ShoppingBag}
              viewAllHref="/marketplace"
              viewAllLabel="See all"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {homeData.marketplace.map((m: any) => (
                  <StorePreviewCard key={m.id} store={m} />
                ))}
              </div>
            </ExploreSection>
          )}
        </div>
      )}
    </div>
  );
}
