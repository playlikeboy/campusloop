"use client";

import { Search, X } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import {
  ARTICLE_CATEGORY_GROUPS,
  ARTICLE_CATEGORY_LIST,
  ARTICLE_FEED_TABS,
  type ArticleCategoryGroupKey,
  type ArticleFeedTab,
} from "@/constants/articles";
import { cn } from "@/lib/utils";

interface ArticlesHubFiltersProps {
  signedIn: boolean;
  activeTab: ArticleFeedTab;
  onTabChange: (tab: ArticleFeedTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTag: string;
  onClearTag: () => void;
  selectedGroup: ArticleCategoryGroupKey;
  onGroupChange: (group: ArticleCategoryGroupKey) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

/** Search, feed tabs and topic chips for the articles hub. */
export function ArticlesHubFilters({
  signedIn,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  activeTag,
  onClearTag,
  selectedGroup,
  onGroupChange,
  selectedCategory,
  onCategoryChange,
}: ArticlesHubFiltersProps) {
  const categories =
    selectedGroup === "ALL"
      ? ARTICLE_CATEGORY_LIST
      : ARTICLE_CATEGORY_LIST.filter((cat) => cat.group === selectedGroup);
  // A long strip of every topic is noise. Show topics once a group is picked,
  // or when a topic is already active (e.g. opened from a link).
  const showCategories = selectedGroup !== "ALL" || selectedCategory !== "ALL";

  return (
    <div className="space-y-4">
      <div className="relative">
        <label htmlFor="articles-search" className="sr-only">
          Search articles
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-fg-subtle"
        />
        <input
          id="articles-search"
          type="search"
          placeholder="Search articles, writers or topics"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-11 w-full rounded-full border border-border bg-surface pr-11 pl-11 text-sm text-fg outline-none transition-ui placeholder:text-fg-subtle focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {activeTag && (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <span>Tagged</span>
          <Chip size="sm" selected onRemove={onClearTag}>
            #{activeTag}
          </Chip>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Article feed"
        className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0"
      >
        {ARTICLE_FEED_TABS.map((tab) => {
          if (tab.authRequired && !signedIn) return null;
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "-mb-px flex h-11 shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 text-sm font-semibold whitespace-nowrap transition-ui",
                isActive ? "border-brand text-fg" : "border-transparent text-fg-muted hover:text-fg"
              )}
            >
              <Icon aria-hidden className={cn("size-4", isActive ? "text-brand-text" : "text-fg-subtle")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {ARTICLE_CATEGORY_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <Chip
              key={group.id}
              size="sm"
              selected={selectedGroup === group.id}
              icon={<Icon />}
              onClick={() => onGroupChange(group.id)}
            >
              {group.id === "ALL" ? "All topics" : group.label}
            </Chip>
          );
        })}
      </div>

      {showCategories && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Chip size="sm" selected={selectedCategory === "ALL"} onClick={() => onCategoryChange("ALL")}>
            Everything
          </Chip>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Chip
                key={cat.key}
                size="sm"
                selected={selectedCategory === cat.key}
                icon={<Icon />}
                onClick={() => onCategoryChange(cat.key)}
              >
                {cat.label}
              </Chip>
            );
          })}
        </div>
      )}
    </div>
  );
}
