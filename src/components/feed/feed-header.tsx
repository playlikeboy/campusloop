"use client";

import { Flame, Globe, ListFilter, RotateCw, School } from "lucide-react";
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
  onRefresh,
  isRefreshing,
}: FeedHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount =
    (scope !== "GLOBAL" ? 1 : 0) +
    (type !== "ALL" ? 1 : 0) +
    (sort !== "for_you" ? 1 : 0) +
    (visibility !== "all" ? 1 : 0);

  return (
    <div className="sticky top-14 z-30 bg-background/92 backdrop-blur-xl border-b border-border/30 px-3 py-2 sm:px-4">
      {/* Consolidated Pill Bar: Location Toggle + Feed Tabs + Quick Actions */}
      <div className="flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
          {/* Scope selection pill */}
          <div className="flex rounded-full bg-muted/60 p-0.5 text-[11px] font-bold shrink-0 border border-border/40">
            <button
              type="button"
              onClick={() => onScopeChange("CAMPUS")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer min-h-[30px]",
                scope === "CAMPUS"
                  ? "bg-card text-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Campus Feed"
            >
              <School className="size-3 text-primary shrink-0" />
              <span className="truncate max-w-[90px] sm:max-w-[130px]">
                {institutionSlug
                  ? `${institutionSlug.charAt(0).toUpperCase() + institutionSlug.slice(1)}`
                  : "Campus"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onScopeChange("GLOBAL")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer min-h-[30px]",
                scope === "GLOBAL"
                  ? "bg-card text-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Global Feed"
            >
              <Globe className="size-3 text-secondary shrink-0" />
              <span>Global</span>
            </button>
          </div>

          {/* Subtle separator */}
          <div className="h-4 w-px bg-border/40 shrink-0 mx-0.5" />

          {/* Segmented Sort Pills */}
          {SORT_TABS.map((s) => {
            const isCurrent = sort === s.id;
            if (s.id === "confessions") {
              return (
                <Link
                  key={s.id}
                  href="/confessions"
                  className={cn(
                    "min-h-[30px] px-3 py-1 font-bold transition-all cursor-pointer shrink-0 text-xs rounded-full flex items-center gap-1 group whitespace-nowrap",
                    isCurrent
                      ? "bg-secondary text-secondary-foreground shadow-xs font-black"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <span>{s.label}</span>
                  <Flame className="size-3 text-amber-500 fill-amber-500 shrink-0" />
                </Link>
              );
            }

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSortChange(s.id)}
                className={cn(
                  "min-h-[30px] px-3 py-1 font-bold transition-all cursor-pointer shrink-0 text-xs rounded-full whitespace-nowrap",
                  isCurrent
                    ? "bg-secondary text-secondary-foreground shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Action Icons: Refresh + Filter */}
        <div className="flex items-center gap-1 shrink-0">
          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh()}
              disabled={isRefreshing}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer active:scale-95"
              title="Refresh feed"
              aria-label="Refresh feed"
            >
              <RotateCw
                className={cn("size-3.5 transition-transform", isRefreshing && "animate-spin text-primary")}
              />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer",
              showFilters || activeFiltersCount > 1
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted/70 text-muted-foreground hover:text-foreground"
            )}
            aria-label="Filter feed"
            title="Filter feed"
          >
            <ListFilter className="size-4" />
          </button>
        </div>
      </div>

      {/* Advanced Filters Dropdown */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out border-t border-transparent bg-muted/20 rounded-2xl",
          showFilters ? "max-h-[160px] border-border/30 pb-3 pt-2.5 px-3 mt-2" : "max-h-0 pb-0 pt-0"
        )}
      >
        <div className="grid grid-cols-2 gap-3">
          {/* Identity filter */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Show Posts By
            </span>
            <div className="flex rounded-lg bg-muted/65 p-0.5 border border-border/40 text-[9px] font-bold">
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onVisibilityChange(option.id)}
                  className={cn(
                    "flex-1 py-1 rounded-md transition-all cursor-pointer",
                    visibility === option.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category selection */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Category
            </span>
            <div className="flex rounded-lg bg-muted/65 p-0.5 border border-border/40 text-[9px] font-bold">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onTypeChange(option.id)}
                  className={cn(
                    "flex-1 py-1 rounded-md transition-all cursor-pointer",
                    type === option.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-2 text-[10px] font-bold">
          <button
            onClick={() => {
              onScopeChange("GLOBAL");
              onTypeChange("ALL");
              onSortChange("for_you");
              onVisibilityChange("all");
            }}
            className="text-primary hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
