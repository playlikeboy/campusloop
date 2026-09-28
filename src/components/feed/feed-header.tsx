"use client";

import { Film, Flame, Globe, GraduationCap, ListFilter, Menu, RotateCw, School } from "lucide-react";
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
    <header className="sticky top-0 z-40 bg-background/92 backdrop-blur-xl border-b border-border/35 px-3.5 py-3 sm:px-4">
      {/* Top Bar Header (Matching Mockup: News Feed + Search + Scope) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("campusloop_open_mobile_drawer"));
              }
            }}
            className="md:hidden flex size-9 shrink-0 items-center justify-center rounded-xl bg-card/80 hover:bg-muted text-foreground border border-border/50 active:scale-95 transition-all shadow-2xs cursor-pointer"
            aria-label="Open sidebar navigation"
            title="Open Menu"
          >
            <Menu className="size-4.5" />
          </button>
          <h1 className="text-xl font-black tracking-tight text-foreground whitespace-nowrap">
            News Feed
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh()}
              disabled={isRefreshing}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer active:scale-95"
              title="Refresh feed"
              aria-label="Refresh feed"
            >
              <RotateCw
                className={cn("size-3.5 transition-transform", isRefreshing && "animate-spin text-primary")}
              />
            </button>
          )}

          {/* Scope selection pill */}
          <div className="flex rounded-full bg-muted/70 p-1 text-[11px] font-bold">
            <button
              onClick={() => onScopeChange("CAMPUS")}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full transition-all cursor-pointer",
                scope === "CAMPUS"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <School className="h-3 w-3 text-primary" />
              <span className="truncate max-w-[120px]">
                {institutionSlug
                  ? `${institutionSlug.charAt(0).toUpperCase() + institutionSlug.slice(1)}`
                  : "Campus"}
              </span>
            </button>
            <button
              onClick={() => onScopeChange("GLOBAL")}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full transition-all cursor-pointer",
                scope === "GLOBAL"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Globe className="h-3 w-3 text-secondary" />
              Global
            </button>
          </div>

          {/* Academics shortcut */}
          <Link
            href="/app/academics"
            className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-primary/15 bg-primary/10 px-2.5 text-primary transition-all hover:bg-primary/15 active:scale-95 cursor-pointer"
            aria-label="Open Academics"
            title="Academics"
          >
            <GraduationCap className="size-4" />
            <span className="hidden sm:inline text-xs font-black">Academics</span>
          </Link>
        </div>
      </div>

      {/* Segmented Sort Pills */}
      <div className="flex items-center justify-between border-t border-border/20 pt-2 mt-2 -mx-1 px-1">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-1">
          {SORT_TABS.map((s) => {
            const isCurrent = sort === s.id;
            if (s.id === "confessions") {
              return (
                <Link
                  key={s.id}
                  href="/app/confessions"
                  className={cn(
                    "min-h-9 px-3 py-1.5 font-bold transition-all cursor-pointer shrink-0 text-[11px] sm:text-xs rounded-full flex items-center gap-1.5 group",
                    isCurrent
                      ? "bg-secondary text-secondary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <span>{s.label}</span>
                  <Flame className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
                </Link>
              );
            }

            if (s.id === "reels") {
              return (
                <Link
                  key={s.id}
                  href="/app/reels"
                  className={cn(
                    "min-h-9 px-3 py-1.5 font-bold transition-all cursor-pointer shrink-0 text-[11px] sm:text-xs rounded-full flex items-center gap-1.5 group",
                    isCurrent
                      ? "bg-secondary text-secondary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <span>{s.label}</span>
                  <span className="flex items-center justify-center size-3.5 rounded-full bg-rose-500/15 text-rose-500 text-[9px] font-black">
                    <Film className="size-2.5" />
                  </span>
                </Link>
              );
            }

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSortChange(s.id)}
                className={cn(
                  "min-h-9 px-3 py-1.5 font-bold transition-all cursor-pointer shrink-0 text-[11px] sm:text-xs rounded-full",
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

        {/* Filter button */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ml-1",
            showFilters || activeFiltersCount > 1
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
          aria-label="Filter feed"
          title="Filter feed"
        >
          <ListFilter className="size-4" />
        </button>
      </div>

      {/* Advanced Filters Dropdown */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out border-t border-transparent bg-muted/10 rounded-2xl",
          showFilters ? "max-h-[160px] border-border/30 pb-3.5 pt-3 px-3.5 mt-2" : "max-h-0 pb-0 pt-0"
        )}
      >
        <div className="grid grid-cols-2 gap-4">
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
        <div className="flex justify-end pt-3 text-[10px] font-bold">
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
    </header>
  );
}
