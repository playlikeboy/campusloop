"use client";

import { ChevronDown, ListFilter, RotateCw, Search } from "lucide-react";
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
  const campusLabel = institutionSlug
    ? institutionSlug.charAt(0).toUpperCase() + institutionSlug.slice(1)
    : "Campus";

  const activeFiltersCount =
    (scope !== "CAMPUS" ? 1 : 0) +
    (type !== "ALL" ? 1 : 0) +
    (sort !== "for_you" ? 1 : 0) +
    (visibility !== "all" ? 1 : 0);

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/92 backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-4 sm:px-5">
        <div className="flex min-h-14 items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">News</h1>
            <button
              type="button"
              onClick={() => onScopeChange(scope === "CAMPUS" ? "GLOBAL" : "CAMPUS")}
              className="inline-flex max-w-full items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              aria-label={`Switch feed scope. Current: ${scope === "CAMPUS" ? campusLabel : "Global"}`}
            >
              <span className="truncate">{scope === "CAMPUS" ? campusLabel : "Global"}</span>
              <ChevronDown className="size-3.5 shrink-0" />
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {onRefresh && (
              <button
                type="button"
                onClick={() => onRefresh()}
                disabled={isRefreshing}
                className="flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Refresh feed"
              >
                <RotateCw className={cn("size-4", isRefreshing && "animate-spin")} />
              </button>
            )}
            <Link
              href="/app/search"
              className="flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Search campus discussions"
            >
              <Search className="size-5" />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2">
          {SORT_TABS.map((tab) => {
            const active = sort === tab.id;
            const isRoute = tab.id === "confessions" || tab.id === "reels";
            const href = tab.id === "confessions" ? "/app/confessions" : "/app/reels";

            const className = cn(
              "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            );

            return isRoute ? (
              <Link key={tab.id} href={href} className={className}>
                {tab.label}
              </Link>
            ) : (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSortChange(tab.id)}
                className={className}
                aria-current={active ? "page" : undefined}
              >
                {tab.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={cn(
              "ml-auto flex size-9 shrink-0 items-center justify-center rounded-lg",
              showFilters || activeFiltersCount > 0
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-label={`Feed filters${activeFiltersCount ? ` (${activeFiltersCount})` : ""}`}
            aria-expanded={showFilters}
          >
            <ListFilter className="size-4" />
          </button>
        </div>

        {showFilters && (
          <div className="border-t border-border/40 py-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Scope</span>
                <select
                  value={scope}
                  onChange={(e) => onScopeChange(e.target.value as "CAMPUS" | "GLOBAL")}
                  className="h-9 w-full rounded-lg bg-muted/50 px-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="CAMPUS">{campusLabel}</option>
                  <option value="GLOBAL">Global</option>
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Category</span>
                <select
                  value={type}
                  onChange={(e) => onTypeChange(e.target.value)}
                  className="h-9 w-full rounded-lg bg-muted/50 px-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Identity</span>
                <select
                  value={visibility}
                  onChange={(e) => onVisibilityChange(e.target.value)}
                  className="h-9 w-full rounded-lg bg-muted/50 px-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {VISIBILITY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground">
                {activeFiltersCount ? `${activeFiltersCount} filters active` : "Showing your default feed"}
              </span>
              <button
                type="button"
                onClick={() => {
                  onScopeChange("CAMPUS");
                  onTypeChange("ALL");
                  onSortChange("for_you");
                  onVisibilityChange("all");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
