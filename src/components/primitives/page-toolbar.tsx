"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface PageToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  categories?: { id: string; label: string; count?: number }[];
  activeCategory?: string;
  onCategoryChange?: (id: string) => void;
  onFilterClick?: () => void;
  filterActiveCount?: number;
  sortElement?: React.ReactNode;
  className?: string;
}

/**
 * Standardized PageToolbar primitive for CampusLoop 2.0.
 * Combines full-width instant search, smooth horizontal category pills,
 * and optional sort/filter triggers.
 */
export function PageToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  categories,
  activeCategory,
  onCategoryChange,
  onFilterClick,
  filterActiveCount,
  sortElement,
  className,
}: PageToolbarProps) {
  return (
    <div className={cn("space-y-3 py-3", className)}>
      {/* Search Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-10.5 pl-10 pr-9 rounded-xl border border-border/50 bg-card/80 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/50 shadow-2xs"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {onFilterClick && (
          <button
            type="button"
            onClick={onFilterClick}
            className={cn(
              "flex h-10.5 items-center gap-1.5 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95",
              filterActiveCount && filterActiveCount > 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/60 hover:bg-muted/50 text-foreground"
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {Boolean(filterActiveCount && filterActiveCount > 0) && (
              <span className="size-4.5 rounded-full bg-primary-foreground text-primary text-[10px] font-black flex items-center justify-center ml-0.5">
                {filterActiveCount}
              </span>
            )}
          </button>
        )}

        {sortElement && <div className="shrink-0">{sortElement}</div>}
      </div>

      {/* Category Pills Strip */}
      {categories && categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange?.(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border select-none active:scale-95",
                  isActive
                    ? "bg-foreground text-background border-foreground font-bold shadow-2xs"
                    : "bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/40"
                )}
              >
                <span>{cat.label}</span>
                {typeof cat.count === "number" && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full",
                      isActive
                        ? "bg-background/20 text-background"
                        : "bg-background text-muted-foreground"
                    )}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
