"use client";

import { Check, ChevronDown, Globe, School, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StreakBadge } from "@/components/streaks/streak-badge";
import { Chip } from "@/components/ui/chip";
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

  useEffect(() => {
    if (!showScopeMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowScopeMenu(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showScopeMenu]);

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
    <div className="sticky top-12 lg:top-0 z-30 border-b border-border bg-bg">
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
                  "relative flex h-12 flex-1 items-center justify-center px-2 text-[15px] transition-ui cursor-pointer select-none",
                  "hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  active ? "font-semibold text-fg" : "font-medium text-fg-muted"
                )}
              >
                {tab.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.75 w-12 -translate-x-1/2 rounded-full bg-brand" />
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
              aria-label={
                scope === "CAMPUS" ? `Showing ${campusLabel}. Change` : "Showing all colleges. Change"
              }
              className="flex h-11 items-center gap-1 rounded-full px-3 text-sm font-medium text-fg hover:bg-surface-muted cursor-pointer transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {scope === "CAMPUS" ? (
                <School className="size-4 text-brand-text" aria-hidden />
              ) : (
                <Globe className="size-4 text-brand-text" aria-hidden />
              )}
              <span className="hidden max-w-27.5 truncate sm:inline">
                {scope === "CAMPUS" ? campusLabel : "All colleges"}
              </span>
              <ChevronDown className="size-3.5 text-fg-subtle" aria-hidden />
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
                  className="absolute right-0 top-12 z-50 w-64 rounded-lg border border-border bg-surface-raised p-1.5 shadow-lg"
                >
                  {[
                    {
                      id: "CAMPUS" as const,
                      icon: School,
                      label: campusLabel,
                      desc: "Posts from your college",
                    },
                    {
                      id: "GLOBAL" as const,
                      icon: Globe,
                      label: "All colleges",
                      desc: "Posts from every college",
                    },
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
                      className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-surface-muted cursor-pointer transition-ui"
                    >
                      <option.icon className="size-4 shrink-0 text-fg-muted" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-fg">{option.label}</span>
                        <span className="block truncate text-xs text-fg-muted">{option.desc}</span>
                      </span>
                      {scope === option.id && (
                        <Check className="size-4 shrink-0 text-brand-text" aria-hidden />
                      )}
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
              "relative flex size-11 items-center justify-center rounded-full transition-ui cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              showFilters
                ? "bg-brand-subtle text-brand-text"
                : "text-fg-muted hover:bg-surface-muted hover:text-fg"
            )}
            aria-label="Filter posts"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            {hasSecondaryFilters && <span className="absolute top-2 right-2 size-2 rounded-full bg-brand" />}
          </button>

          <div className="hidden sm:block">
            <StreakBadge />
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="space-y-4 border-t border-border px-4 py-4">
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
              className="inline-flex h-8 items-center rounded-full px-3 text-xs font-medium text-brand-text underline-offset-4 hover:underline"
            >
              Open confessions
            </Link>
          </FilterGroup>

          <FilterGroup label="Sort by">
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
              className="min-h-11 text-sm font-medium text-brand-text underline-offset-4 hover:underline cursor-pointer"
            >
              Clear filters
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
      <p className="text-xs font-medium text-fg-muted">{label}</p>
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
    <Chip size="sm" selected={active} onClick={onClick}>
      {children}
    </Chip>
  );
}
