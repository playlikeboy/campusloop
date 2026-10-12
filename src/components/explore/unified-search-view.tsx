"use client";

import {
  ArrowRight,
  ChevronDown,
  HelpCircle,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useState } from "react";
import { EntityResult } from "@/components/explore/entity-result";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  SearchApiResponse,
  SearchCategoryFilter,
  SearchResult,
} from "@/lib/search/types";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const PRIMARY_FILTERS: { id: SearchCategoryFilter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "PEOPLE", label: "People" },
  { id: "POSTS", label: "Posts" },
  { id: "COMMUNITIES", label: "Communities" },
  { id: "PLACES", label: "Places" },
];

const MORE_FILTERS: { id: SearchCategoryFilter; label: string }[] = [
  { id: "EVENTS", label: "Events" },
  { id: "ACADEMICS", label: "Academics" },
  { id: "ARTICLES", label: "Articles" },
  { id: "MARKETPLACE", label: "Marketplace" },
  { id: "COLLEGES", label: "Colleges" },
  { id: "HASHTAGS", label: "Hashtags" },
];

interface UnifiedSearchViewProps {
  query: string;
  data?: SearchApiResponse;
  isLoading: boolean;
  error?: any;
  activeFilter: SearchCategoryFilter;
  onFilterChange: (filter: SearchCategoryFilter) => void;
  onQueryChange: (query: string) => void;
}

export function UnifiedSearchView({
  query,
  data,
  isLoading,
  error,
  activeFilter,
  onFilterChange,
  onQueryChange,
}: UnifiedSearchViewProps) {
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  const intent = data?.intent;
  const didYouMean = intent?.didYouMean;
  const results = data?.results || [];
  const grouped = data?.grouped || {};
  const isMoreFilterActive = MORE_FILTERS.some((f) => f.id === activeFilter);
  const activeMoreLabel = MORE_FILTERS.find((f) => f.id === activeFilter)?.label;

  const totalResults = results.length;

  return (
    <div className="space-y-4">
      {/* ─── Compact Facet Filter Tabs ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {PRIMARY_FILTERS.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                sounds.tap();
                onFilterChange(f.id);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          );
        })}

        {/* "More" Filter Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowMoreDropdown(!showMoreDropdown)}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              isMoreFilterActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <span>{isMoreFilterActive ? activeMoreLabel : "More"}</span>
            <ChevronDown className="size-3.5" />
          </button>

          {showMoreDropdown && (
            <div className="absolute top-full right-0 mt-1 z-30 min-w-36 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl p-1.5 shadow-lg space-y-0.5">
              {MORE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    onFilterChange(f.id);
                    setShowMoreDropdown(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                    activeFilter === f.id
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Search Intent Hint or Typo Suggestion ─── */}
      {didYouMean && didYouMean.toLowerCase() !== query.toLowerCase() && (
        <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
          <p className="text-foreground">
            Did you mean:{" "}
            <button
              type="button"
              onClick={() => onQueryChange(didYouMean)}
              className="font-bold text-primary underline underline-offset-2 hover:opacity-80 cursor-pointer"
            >
              {didYouMean}
            </button>
            ?
          </p>
        </div>
      )}

      {intent?.badge && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
            {intent.badge}
          </Badge>
          {intent.suggestedAction && <span>{intent.suggestedAction}</span>}
        </div>
      )}

      {/* ─── Loading State ─── */}
      {isLoading && (
        <div className="p-12 text-center space-y-2">
          <Loader2 className="size-6 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">Searching CampusLoop...</p>
        </div>
      )}

      {/* ─── Backend Error State ─── */}
      {error && !isLoading && (
        <div className="p-8 text-center rounded-2xl border border-destructive/20 bg-destructive/5 space-y-3">
          <HelpCircle className="size-8 text-destructive mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">Couldn&apos;t load search results</h3>
            <p className="text-xs text-muted-foreground">
              A temporary network or server error occurred. Please try again.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQueryChange(query)}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            <span>Try again</span>
          </Button>
        </div>
      )}

      {/* ─── Search Results: ALL Category (Grouped Sections) ─── */}
      {!isLoading && !error && activeFilter === "ALL" && totalResults > 0 && (
        <div className="space-y-6">
          {/* People Section */}
          {grouped.people && grouped.people.length > 0 && (
            <GroupedSection
              title="People"
              results={grouped.people}
              onSeeAll={() => onFilterChange("PEOPLE")}
            />
          )}

          {/* Communities Section */}
          {grouped.communities && grouped.communities.length > 0 && (
            <GroupedSection
              title="Communities"
              results={grouped.communities}
              onSeeAll={() => onFilterChange("COMMUNITIES")}
            />
          )}

          {/* Events Section */}
          {grouped.events && grouped.events.length > 0 && (
            <GroupedSection
              title="Events"
              results={grouped.events}
              onSeeAll={() => onFilterChange("EVENTS")}
            />
          )}

          {/* Articles Section */}
          {grouped.articles && grouped.articles.length > 0 && (
            <GroupedSection
              title="Articles"
              results={grouped.articles}
              onSeeAll={() => onFilterChange("ARTICLES")}
            />
          )}

          {/* Posts Section */}
          {grouped.posts && grouped.posts.length > 0 && (
            <GroupedSection
              title="Posts & Discussions"
              results={grouped.posts}
              onSeeAll={() => onFilterChange("POSTS")}
            />
          )}

          {/* Academics Section */}
          {grouped.academics && grouped.academics.length > 0 && (
            <GroupedSection
              title="Academic Vault"
              results={grouped.academics}
              onSeeAll={() => onFilterChange("ACADEMICS")}
            />
          )}

          {/* Colleges Section */}
          {grouped.colleges && grouped.colleges.length > 0 && (
            <GroupedSection
              title="Colleges"
              results={grouped.colleges}
              onSeeAll={() => onFilterChange("COLLEGES")}
            />
          )}

          {/* Stores Section */}
          {grouped.stores && grouped.stores.length > 0 && (
            <GroupedSection
              title="Marketplace & Stores"
              results={grouped.stores}
              onSeeAll={() => onFilterChange("MARKETPLACE")}
            />
          )}
        </div>
      )}

      {/* ─── Search Results: Specific Category List View ─── */}
      {!isLoading && !error && activeFilter !== "ALL" && totalResults > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs text-muted-foreground px-1">
            Found {totalResults} {totalResults === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map((item) => (
              <EntityResult key={item.id + item.type} result={item} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Zero Results State (Phase 24: No dead-end) ─── */}
      {!isLoading && !error && totalResults === 0 && (
        <div className="p-8 text-center rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xs space-y-4">
          <Search className="size-8 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              Nothing matched &ldquo;{query}&rdquo;
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              We couldn&apos;t find any students, clubs, posts, or notes matching your query.
            </p>
          </div>

          <div className="text-xs text-muted-foreground/80 space-y-1 bg-muted/30 p-3 rounded-xl max-w-sm mx-auto text-left">
            <p className="font-semibold text-foreground">Try searching for:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Broader keywords or acronyms</li>
              <li>A student&apos;s name or @handle</li>
              <li>A subject code (e.g. &ldquo;CS201&rdquo;)</li>
              <li>Switching between My Campus and India scope</li>
            </ul>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQueryChange("")}
              className="text-xs"
            >
              Back to Explore Home
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupedSection({
  title,
  results,
  onSeeAll,
}: {
  title: string;
  results: SearchResult[];
  onSeeAll: () => void;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {results.length > 1 && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer flex items-center gap-0.5"
          >
            <span>See all</span>
            <ArrowRight className="size-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.slice(0, 3).map((item) => (
          <EntityResult key={item.id + item.type} result={item} />
        ))}
      </div>
    </section>
  );
}
