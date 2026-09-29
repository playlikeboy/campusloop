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
    <div className="sticky top-14 z-30 border-b border-border/30 bg-background/98 backdrop-blur-xl shadow-2xs">
      {/* Consolidated Header: Location Scope + Sub-tabs + Filter Trigger */}
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0">
          {/* Location Scope Pill */}
          <div className="flex shrink-0 items-center rounded-full border border-border/40 bg-muted/40 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onScopeChange("CAMPUS")}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold transition-all cursor-pointer",
                scope === "CAMPUS" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={scope === "CAMPUS"}
            >
              <School className="size-3 shrink-0 text-primary" />
              <span className="max-w-[120px] truncate">
                {institutionSlug
                  ? institutionSlug.charAt(0).toUpperCase() + institutionSlug.slice(1)
                  : "Campus"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onScopeChange("GLOBAL")}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold transition-all cursor-pointer",
                scope === "GLOBAL" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={scope === "GLOBAL"}
            >
              <Globe className="size-3 shrink-0 text-emerald-500" />
              <span>Global</span>
            </button>
          </div>

          <div className="h-4 w-px bg-border/40 shrink-0" />

          {/* Sub-tabs: For you | Trending | Latest | Confessions */}
          <div className="flex items-center gap-1 shrink-0" role="tablist" aria-label="Feed mode">
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
                      "flex h-7 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-bold whitespace-nowrap transition-colors",
                      isCurrent
                        ? "bg-secondary text-secondary-foreground shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
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
                    "flex h-7 shrink-0 items-center rounded-full px-3 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer",
                    isCurrent
                      ? "bg-secondary text-secondary-foreground shadow-2xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
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
                className="flex h-7 shrink-0 items-center rounded-full px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                For you
              </button>
            )}
          </div>
        </div>

        {/* Filter Toggle Trigger Button */}
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
