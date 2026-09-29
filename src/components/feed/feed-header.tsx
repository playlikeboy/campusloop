"use client";

import { ChevronDown, Flame, Globe, ListFilter, School } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  FEED_CATEGORY_OPTIONS as CATEGORY_OPTIONS,
  FEED_SORT_TABS as SORT_TABS,
  FEED_VISIBILITY_OPTIONS as VISIBILITY_OPTIONS,
} from "@/constants";
import { cn } from "@/lib/utils";

interface FeedHeaderProps {
  scope: "CAMPUS" | "GLOBAL";
  onScopeChange: (scope: "CAMPUS" | "GLOBAL") => void;
  sort: string;
  onSortChange: (sort: string) => void;
  type: string;
  onTypeChange: (type: string) => void;
  visibility: string;
  onVisibilityChange: (visibility: string) => void;
  institutionSlug?: string | null;
  // Kept for API compatibility; mobile refresh is handled by pull-to-refresh.
  onRefresh?: () => Promise<unknown> | undefined;
  isRefreshing?: boolean;
}

export function FeedHeader({
  scope,
  onScopeChange,
  sort,
  onSortChange,
  type,
  onTypeChange,
  visibility,
  onVisibilityChange,
  institutionSlug,
}: FeedHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount =
    (scope !== "GLOBAL" ? 1 : 0) +
    (type !== "ALL" ? 1 : 0) +
    (sort !== "for_you" ? 1 : 0) +
    (visibility !== "all" ? 1 : 0);

  const primarySorts = ["for_you", "trending", "latest"];
  const visibleSorts = SORT_TABS.filter((item) => primarySorts.includes(item.id) || item.id === sort);

  return (
    <div className="sticky top-14 z-30 border-b border-border/30 bg-background/95 backdrop-blur-xl">
      {/* Scope: where the feed comes from. Kept separate from feed sorting. */}
      <div className="flex items-center justify-between gap-3 px-4 pt-2.5 pb-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">Feed</span>
          <div className="flex min-w-0 items-center rounded-xl border border-border/40 bg-muted/35 p-0.5">
            <button
              type="button"
              onClick={() => onScopeChange("CAMPUS")}
              className={cn(
                "flex min-h-8 max-w-[132px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors",
                scope === "CAMPUS" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              )}
              aria-pressed={scope === "CAMPUS"}
            >
              <School className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">
                {institutionSlug
                  ? institutionSlug.charAt(0).toUpperCase() + institutionSlug.slice(1)
                  : "My campus"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onScopeChange("GLOBAL")}
              className={cn(
                "flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors",
                scope === "GLOBAL" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              )}
              aria-pressed={scope === "GLOBAL"}
            >
              <Globe className="size-3.5 shrink-0" />
              <span>Global</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
            showFilters || activeFiltersCount > 1
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
          )}
          aria-label="Open feed filters"
          aria-expanded={showFilters}
        >
          <ListFilter className="size-4" />
          {activeFiltersCount > 1 && <span className="absolute" />}
        </button>
      </div>

      {/* Feed mode: what the user wants to see. Horizontal scrolling is intentional. */}
      <div className="flex items-center gap-1 overflow-x-auto px-3 pb-1.5 no-scrollbar" role="tablist" aria-label="Feed mode">
        {visibleSorts.map((item) => {
          const isCurrent = sort === item.id;
          if (item.id === "confessions") {
            return (
              <Link
                key={item.id}
                href="/confessions"
                role="tab"
                aria-selected={isCurrent}
                className={cn(
                  "flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition-colors",
                  isCurrent ? "bg-secondary text-secondary-foreground font-bold" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <span>{item.label}</span>
                <Flame className="size-3 text-amber-500" />
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => onSortChange(item.id)}
              className={cn(
                "flex min-h-9 shrink-0 items-center rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition-colors",
                isCurrent ? "bg-secondary text-secondary-foreground font-bold" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          );
        })}

        {sort !== "for_you" && !visibleSorts.some((item) => item.id === sort) && (
          <button
            type="button"
            onClick={() => onSortChange("for_you")}
            className="min-h-9 shrink-0 rounded-lg px-3 text-xs font-semibold text-muted-foreground"
          >
            For you
          </button>
        )}

        <ChevronDown className="ml-auto mr-1 size-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
      </div>

      {/* Secondary filters stay out of the primary feed navigation. */}
      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity,padding] duration-200 ease-out",
          showFilters ? "max-h-64 border-t border-border/30 px-4 pb-3 pt-3 opacity-100" : "max-h-0 p-0 opacity-0"
        )}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Who can post</span>
            <div className="flex rounded-lg border border-border/40 bg-muted/50 p-0.5 text-[10px] font-bold">
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onVisibilityChange(option.id)}
                  className={cn(
                    "flex-1 rounded-md py-1.5 transition-colors",
                    visibility === option.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <div className="flex rounded-lg border border-border/40 bg-muted/50 p-0.5 text-[10px] font-bold">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onTypeChange(option.id)}
                  className={cn(
                    "flex-1 rounded-md py-1.5 transition-colors",
                    type === option.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 border-t border-border/20 pt-2.5">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">More feed modes</p>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {SORT_TABS.filter((item) => !primarySorts.includes(item.id)).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSortChange(item.id)}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold",
                  sort === item.id ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              onScopeChange("GLOBAL");
              onTypeChange("ALL");
              onSortChange("for_you");
              onVisibilityChange("all");
              setShowFilters(false);
            }}
            className="text-[10px] font-bold text-primary hover:underline"
          >
            Reset filters
          </button>
        </div>
      </div>
    </div>
  );
}
