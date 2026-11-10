"use client";

import { ArrowRight, ChevronDown, HelpCircle, Loader2, RefreshCw, Search } from "lucide-react";
import { EntityResult } from "@/components/explore/entity-result";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import type { SearchApiResponse, SearchCategoryFilter, SearchResult } from "@/lib/search/types";
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
  { id: "ACADEMICS", label: "Study material" },
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
  const intent = data?.intent;
  const didYouMean = intent?.didYouMean;
  const results = data?.results || [];
  const grouped = data?.grouped || {};
  const isMoreFilterActive = MORE_FILTERS.some((f) => f.id === activeFilter);
  const activeMoreLabel = MORE_FILTERS.find((f) => f.id === activeFilter)?.label;

  const totalResults = results.length;

  return (
    <div className="space-y-4">
      <div className="-mx-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3 py-1 sm:mx-0 sm:px-0">
        {PRIMARY_FILTERS.map((f) => (
          <Chip key={f.id} size="sm" selected={activeFilter === f.id} onClick={() => onFilterChange(f.id)}>
            {f.label}
          </Chip>
        ))}

        {/* The menu renders in a portal so the scrolling chip row can't clip it. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 text-xs font-medium transition-ui",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isMoreFilterActive
                ? "bg-brand text-brand-fg"
                : "bg-surface-muted text-fg-muted hover:bg-surface-sunken hover:text-fg"
            )}
          >
            {isMoreFilterActive ? activeMoreLabel : "More"}
            <ChevronDown className="size-3.5" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {MORE_FILTERS.map((f) => (
              <DropdownMenuItem
                key={f.id}
                onClick={() => onFilterChange(f.id)}
                className={cn(activeFilter === f.id && "font-semibold text-brand-text")}
              >
                {f.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ─── Search Intent Hint or Typo Suggestion ─── */}
      {didYouMean && didYouMean.toLowerCase() !== query.toLowerCase() && (
        <div className="text-sm">
          <p className="text-fg">
            Did you mean{" "}
            <button
              type="button"
              onClick={() => onQueryChange(didYouMean)}
              className="font-semibold text-brand-text underline underline-offset-4 cursor-pointer"
            >
              {didYouMean}
            </button>
            ?
          </p>
        </div>
      )}

      {intent?.badge && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {intent.badge}
          </Badge>
          {intent.suggestedAction && <span>{intent.suggestedAction}</span>}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 p-12 text-sm text-fg-muted" role="status">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Searching…
        </div>
      )}

      {error && !isLoading && (
        <EmptyState
          role="alert"
          size="compact"
          bordered
          icon={HelpCircle}
          title="Couldn't load results"
          description="Check your internet, then try again."
          action={
            <Button variant="secondary" size="sm" onClick={() => onQueryChange(query)}>
              <RefreshCw className="size-4" aria-hidden />
              Try again
            </Button>
          }
        />
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
            <GroupedSection title="Posts" results={grouped.posts} onSeeAll={() => onFilterChange("POSTS")} />
          )}

          {/* Academics Section */}
          {grouped.academics && grouped.academics.length > 0 && (
            <GroupedSection
              title="Study material"
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
              title="Marketplace"
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

      {!isLoading && !error && totalResults === 0 && (
        <EmptyState
          size="compact"
          bordered
          icon={Search}
          title={`Nothing found for "${query}"`}
          description="Try a shorter word, a name, an @handle or a subject code."
          action={
            <Button variant="secondary" size="sm" onClick={() => onQueryChange("")}>
              Clear search
            </Button>
          }
        />
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
        <h3 className="text-base">{title}</h3>
        {results.length > 1 && (
          <button
            type="button"
            onClick={onSeeAll}
            className="min-h-11 px-2 text-sm font-semibold text-brand-text hover:underline underline-offset-4 transition-ui cursor-pointer flex items-center gap-1"
          >
            <span>See all</span>
            <ArrowRight className="size-4" aria-hidden />
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
