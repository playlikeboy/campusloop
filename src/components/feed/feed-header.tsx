"use client";

import { Check, ChevronDown, Globe, School, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StreakBadge } from "@/components/streaks/streak-badge";
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

const PRIMARY_TABS = [
  { id: "for_you", label: "For you" },
  { id: "latest", label: "Latest" },
  { id: "trending", label: "Trending" },
];
const PRIMARY_SORTS = PRIMARY_TABS.map((tab) => tab.id);

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
  const [showScopeMenu, setShowScopeMenu] = useState(false);

  const campusLabel = institutionSlug
    ? institutionSlug.charAt(0).toUpperCase() + institutionSlug.slice(1)
    : "My campus";
  const hasSecondaryFilters = type !== "ALL" || visibility !== "all" || !PRIMARY_SORTS.includes(sort);

  function resetFilters() {
    onTypeChange("ALL");
    onSortChange("for_you");
    onVisibilityChange("all");
    setShowFilters(false);
  }

  return (
    <div className="sticky top-12 lg:top-0 z-30 border-b border-border/40 bg-background/85 backdrop-blur-xl supports-backdrop-filter:bg-background/70">
      <div className="flex items-stretch">
        <div className="flex flex-1 min-w-0" role="tablist" aria-label="Feed mode">
          {PRIMARY_TABS.map((tab) => {
            const active = sort === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSortChange(tab.id)}
                className={cn(
                  "relative flex h-12 flex-1 items-center justify-center px-2 text-[15px] transition-colors cursor-pointer select-none",
                  "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50",
                  active ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                )}
              >
                {tab.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.75 w-12 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 pl-1 pr-2 sm:pr-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowScopeMenu((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={showScopeMenu}
              className="flex h-9 items-center gap-1 rounded-full px-2.5 text-[13px] font-medium text-foreground hover:bg-muted/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {scope === "CAMPUS" ? (
                <School className="size-4 text-primary" />
              ) : (
                <Globe className="size-4 text-primary" />
              )}
              <span className="hidden max-w-27.5 truncate sm:inline">
                {scope === "CAMPUS" ? campusLabel : "All India"}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>

            {showScopeMenu && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setShowScopeMenu(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-11 z-50 w-60 rounded-2xl border border-border/60 bg-popover p-1.5 shadow-xl"
                >
                  {[
                    { id: "CAMPUS" as const, icon: School, label: campusLabel, desc: "Only your campus" },
                    { id: "GLOBAL" as const, icon: Globe, label: "All India", desc: "Every campus on CampusLoop" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={scope === option.id}
                      onClick={() => {
                        onScopeChange(option.id);
                        setShowScopeMenu(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted cursor-pointer"
                    >
                      <option.icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{option.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">{option.desc}</span>
                      </span>
                      {scope === option.id && <Check className="size-4 shrink-0 text-primary" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((open) => !open)}
            className={cn(
              "relative flex size-9 items-center justify-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              showFilters ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            aria-label="Feed filters"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="size-4" />
            {hasSecondaryFilters && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />}
          </button>

          <div className="hidden sm:block">
            <StreakBadge />
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="space-y-4 border-t border-border/40 px-4 py-4">
          <FilterGroup label="Show posts from">
            {VISIBILITY_OPTIONS.map((option) => (
              <FilterChip
                key={option.id}
                active={visibility === option.id}
                onClick={() => onVisibilityChange(option.id)}
              >
                {option.label}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup label="Category">
            {CATEGORY_OPTIONS.map((option) => (
              <FilterChip key={option.id} active={type === option.id} onClick={() => onTypeChange(option.id)}>
                {option.label}
              </FilterChip>
            ))}
            <Link
              href="/confessions"
              className="inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground"
            >
              Confessions page
            </Link>
          </FilterGroup>

          <FilterGroup label="More feeds">
            {SORT_TABS.filter((item) => !PRIMARY_SORTS.includes(item.id)).map((item) => (
              <FilterChip key={item.id} active={sort === item.id} onClick={() => onSortChange(item.id)}>
                {item.label}
              </FilterChip>
            ))}
          </FilterGroup>

          {hasSecondaryFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[13px] font-medium text-primary hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        active ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
