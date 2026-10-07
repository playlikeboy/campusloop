"use client";

import { ChevronDown, Flame, Globe, ListFilter, School } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  FEED_CATEGORY_OPTIONS as CATEGORY_OPTIONS,
  FEED_SORT_TABS as SORT_TABS,
  FEED_VISIBILITY_OPTIONS as VISIBILITY_OPTIONS,
} from "@/constants";
import { StreakBadge } from "@/components/streaks/streak-badge";
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

  const primaryTabs = [
    { id: "for_you", label: "For You" },
    { id: "latest", label: "Latest" },
    { id: "trending", label: "Trending" },
  ];
  const primarySorts = primaryTabs.map((t) => t.id);

  return (
    <div className="sticky top-12 lg:top-0 z-30 border-b border-border/20 bg-background/90 backdrop-blur-xl shadow-2xs">
      {/* Consolidated Header: Location Scope + Sub-tabs + Filter Trigger */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 sm:px-4 sm:py-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0">
          {/* Location Scope Pill */}
          <div className="flex shrink-0 items-center rounded-full border border-border/30 bg-muted/30 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onScopeChange("CAMPUS")}
              className={cn(
                "flex h-6.5 items-center gap-1 rounded-full px-2 text-[11px] font-semibold transition-all cursor-pointer",
                scope === "CAMPUS" ? "bg-background text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={scope === "CAMPUS"}
            >
              <School className="size-2.5 shrink-0 text-primary" />
              <span className="max-w-[100px] truncate">
                {institutionSlug
                  ? institutionSlug.charAt(0).toUpperCase() + institutionSlug.slice(1)
                  : "Campus"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onScopeChange("GLOBAL")}
              className={cn(
                "flex h-6.5 items-center gap-1 rounded-full px-2 text-[11px] font-semibold transition-all cursor-pointer",
                scope === "GLOBAL" ? "bg-background text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={scope === "GLOBAL"}
            >
              <Globe className="size-2.5 shrink-0 text-emerald-400" />
              <span>All India</span>
            </button>
          </div>

          <div className="h-3.5 w-px bg-border/30 shrink-0" />

          {/* Primary Discovery Tabs */}
          <div className="flex items-center gap-0.5 shrink-0" role="tablist" aria-label="Feed mode">
            {primaryTabs.map((item) => {
              const isCurrent = sort === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  onClick={() => onSortChange(item.id)}
                  className={cn(
                    "flex h-6.5 shrink-0 items-center rounded-full px-2.5 text-xs transition-colors cursor-pointer select-none",
                    isCurrent
                      ? "bg-primary/15 text-primary font-bold shadow-2xs border border-primary/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
                  )}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Confessions Quick Access */}
            <Link
              href="/confessions"
              role="tab"
              className="flex h-6.5 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors"
            >
              <span>Confessions</span>
              <Flame className="size-3 text-purple-400" />
            </Link>
          </div>
        </div>

        {/* Actions: Streak Badge & Filter Toggle Trigger */}
        <div className="flex items-center gap-1.5 shrink-0">
          <StreakBadge />
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={cn(
              "relative flex size-8 shrink-0 items-center justify-center rounded-full border border-border/40 transition-colors cursor-pointer",
              showFilters || activeFiltersCount > 1
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
            aria-label="Open feed filters"
            aria-expanded={showFilters}
          >
            <ListFilter className="size-3.5" />
            {activeFiltersCount > 1 && (
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
            )}
          </button>
        </div>
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
