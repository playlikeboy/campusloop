"use client";

import {
  Clock,
  Compass,
  Flame,
  Globe,
  Hash,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import type { SearchScope, SearchSuggestionsResponse } from "@/lib/search/types";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const TRENDING_TOPICS = [
  "placements",
  "hackathons",
  "internships",
  "midsem notes",
  "coding club",
  "night canteen",
];

interface ExploreHeaderProps {
  searchQuery: string;
  scope: SearchScope;
  onSearchChange: (query: string) => void;
  onScopeChange: (scope: SearchScope) => void;
  onSearchSubmit: (query: string) => void;
}

export function ExploreHeader({
  searchQuery,
  scope,
  onSearchChange,
  onScopeChange,
  onSearchSubmit,
}: ExploreHeaderProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external prop with local input
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("campusloop_recent_searches");
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  // Save to recent searches
  function saveRecentSearch(term: string) {
    if (!term.trim()) return;
    try {
      const updated = [term.trim(), ...recentSearches.filter((s) => s.toLowerCase() !== term.trim().toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem("campusloop_recent_searches", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  function handleClearRecent(term?: string) {
    try {
      if (term) {
        const updated = recentSearches.filter((s) => s !== term);
        setRecentSearches(updated);
        localStorage.setItem("campusloop_recent_searches", JSON.stringify(updated));
      } else {
        setRecentSearches([]);
        localStorage.removeItem("campusloop_recent_searches");
      }
    } catch {
      // Ignore
    }
  }

  // Click outside listener to close suggestions popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced query for suggestions API
  const trimmed = inputValue.trim();
  const { data: suggestionsData, isLoading: suggestionsLoading } = useSWR<SearchSuggestionsResponse>(
    isFocused && trimmed.length >= 2 ? `/api/search/suggestions?q=${encodeURIComponent(trimmed)}` : null,
    fetcher,
    { dedupingInterval: 3000 }
  );

  const suggestions = suggestionsData?.suggestions || [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;
    sounds.tap();
    haptics.light();
    saveRecentSearch(query);
    setIsFocused(false);

    if (query.startsWith("#")) {
      const cleanTag = query.replace(/^#+/, "").trim();
      if (cleanTag) {
        router.push(`/hashtag/${encodeURIComponent(cleanTag.toLowerCase())}`);
        return;
      }
    }
    onSearchSubmit(query);
  }

  function handleSelectTerm(term: string) {
    sounds.tap();
    haptics.light();
    setInputValue(term);
    saveRecentSearch(term);
    setIsFocused(false);

    if (term.startsWith("#")) {
      const cleanTag = term.replace(/^#+/, "").trim();
      if (cleanTag) {
        router.push(`/hashtag/${encodeURIComponent(cleanTag.toLowerCase())}`);
        return;
      }
    }
    onSearchSubmit(term);
  }

  function handleClear() {
    sounds.tap();
    setInputValue("");
    onSearchChange("");
  }

  return (
    <div className="space-y-4">
      {/* Title & Scope Pill Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Compass className="size-6 text-primary" />
            <span>Explore</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Find people, campuses, communities, events & ideas.
          </p>
        </div>

        {/* Campus / India Scope Switcher */}
        <div className="inline-flex items-center p-1 rounded-full bg-muted/60 border border-border/40 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onScopeChange("CAMPUS")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              scope === "CAMPUS"
                ? "bg-background text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MapPin className="size-3 text-primary" />
            <span>My Campus</span>
          </button>

          <button
            type="button"
            onClick={() => onScopeChange("INDIA")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              scope === "INDIA" || scope === "GLOBAL"
                ? "bg-background text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Globe className="size-3 text-primary" />
            <span>India</span>
          </button>
        </div>
      </div>

      {/* ─── Search Bar with Integrated Typeahead Suggestions ─── */}
      <div ref={containerRef} className="relative">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              onSearchChange(e.target.value);
            }}
            onFocus={() => setIsFocused(true)}
            placeholder="Search CampusLoop by keyword, @person, or #topic..."
            className={cn(
              "w-full h-11 pl-10 pr-10 rounded-full bg-muted/30 border border-border/40 text-xs sm:text-sm font-normal text-foreground placeholder:text-muted-foreground transition-all",
              "focus:bg-background focus:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            )}
          />

          {inputValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            isFocused && suggestionsLoading && (
              <Loader2 className="absolute right-3 size-4 text-muted-foreground animate-spin" />
            )
          )}
        </form>

        {/* ─── Suggestions / Recent Searches Dropdown Popover ─── */}
        {isFocused && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-lg p-2.5 space-y-3">
            {/* Live Suggestions when typing */}
            {trimmed.length >= 2 && suggestions.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground px-2 uppercase tracking-wider">
                  Suggestions
                </span>
                <div className="divide-y divide-border/20">
                  {suggestions.map((item, i) => {
                    const isHashtag = item.type === "hashtag" || item.text.startsWith("#");
                    const cleanTag = item.text.replace(/^#+/, "").trim();
                    const href =
                      item.href ||
                      (isHashtag
                        ? `/hashtag/${encodeURIComponent(cleanTag.toLowerCase())}`
                        : `/explore?q=${encodeURIComponent(item.text)}`);

                    return (
                      <Link
                        key={item.text + i}
                        href={href}
                        onClick={() => {
                          sounds.tap();
                          haptics.light();
                          saveRecentSearch(item.text);
                          setIsFocused(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-2 py-2 text-left hover:bg-muted/50 rounded-lg transition-colors cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isHashtag ? (
                            <Hash className="size-3 text-primary shrink-0" />
                          ) : (
                            <Search className="size-3 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-medium text-foreground truncate">{item.title || item.text}</span>
                        </div>
                        {item.subtitle && (
                          <span className="text-[10px] text-muted-foreground truncate shrink-0">
                            {item.subtitle}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && !trimmed && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Clock className="size-3 text-muted-foreground" />
                    <span>Recent Searches</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleClearRecent()}
                    className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {recentSearches.map((term) => (
                    <span
                      key={term}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/40 bg-muted/40 text-xs text-foreground/90 hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectTerm(term)}
                    >
                      <span>{term}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearRecent(term);
                        }}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                      >
                        <X className="size-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            {!trimmed && (
              <div className="space-y-1.5 pt-1 border-t border-border/20">
                <span className="text-[11px] font-semibold text-muted-foreground px-2 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="size-3 text-primary" />
                  <span>Trending Searches</span>
                </span>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {TRENDING_TOPICS.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleSelectTerm(term)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/40 bg-muted/30 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
                    >
                      <Sparkles className="size-2.5 text-primary" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
