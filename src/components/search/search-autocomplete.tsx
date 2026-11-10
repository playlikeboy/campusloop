"use client";

import {
  ArrowUpLeft,
  BookOpen,
  Clock,
  CornerDownLeft,
  Hash,
  Loader2,
  School,
  Search,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import type { SearchSuggestionItem, SearchSuggestionsResponse } from "@/lib/search/types";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const SEARCH_IDEAS = ["placements", "hackathons", "hostel", "exam notes", "coding club", "night canteen"];

const RECENT_SEARCHES_KEY = "campusloop_recent_searches";

interface SearchAutocompleteProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  size?: "sm" | "md" | "lg";
  autoFocus?: boolean;
  showRecent?: boolean;
  showTrending?: boolean;
  onChange?: (val: string) => void;
  onSubmit?: (val: string) => void;
  onSelectSuggestion?: (item: SearchSuggestionItem) => void;
}

export function SearchAutocomplete({
  value: controlledValue,
  defaultValue = "",
  placeholder = "Search people, posts, colleges or #tags",
  className,
  inputClassName,
  size = "md",
  autoFocus = false,
  showRecent = true,
  showTrending = true,
  onChange,
  onSubmit,
  onSelectSuggestion,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const inputValue = isControlled ? controlledValue : uncontrolledValue;

  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  function saveRecentSearch(term: string) {
    const clean = term.trim();
    if (!clean) return;
    try {
      const next = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(
        0,
        6
      );
      setRecentSearches(next);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // Ignore
    }
  }

  function removeRecentSearch(term: string) {
    try {
      const next = recentSearches.filter((s) => s !== term);
      setRecentSearches(next);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // Ignore
    }
  }

  function clearAllRecent() {
    try {
      setRecentSearches([]);
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore
    }
  }

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmed = inputValue.trim();
  const shouldFetch = isOpen && trimmed.length >= 2;

  const { data: suggestionsData, isLoading } = useSWR<SearchSuggestionsResponse>(
    shouldFetch ? `/api/search/suggestions?q=${encodeURIComponent(trimmed)}` : null,
    fetcher,
    { keepPreviousData: true, dedupingInterval: 250 }
  );

  const suggestions = suggestionsData?.suggestions || [];

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestionsData?.suggestions]);

  // Compute ghost autocomplete text (typeahead completion)
  const ghostCompletion = (() => {
    if (!trimmed || trimmed.length < 2 || suggestions.length === 0) return "";
    // Check if the first suggestion starts with what the user typed
    const top = suggestions[0];
    if (!top || !top.text) return "";
    const topText = top.text.trim();
    if (topText.toLowerCase().startsWith(trimmed.toLowerCase())) {
      // Return the remainder matching the user's case prefix
      return topText.slice(trimmed.length);
    }
    return "";
  })();

  function updateQuery(next: string) {
    if (!isControlled) {
      setUncontrolledValue(next);
    }
    onChange?.(next);
  }

  function handleSelect(item: SearchSuggestionItem) {
    sounds.tap();
    haptics.light();
    saveRecentSearch(item.text);
    setIsOpen(false);
    setSelectedIndex(-1);

    if (onSelectSuggestion) {
      onSelectSuggestion(item);
      return;
    }

    if (item.href) {
      router.push(item.href);
      return;
    }

    if (item.type === "hashtag") {
      const cleanTag = item.text.replace(/^#+/, "").trim();
      router.push(`/hashtag/${encodeURIComponent(cleanTag.toLowerCase())}`);
      return;
    }

    router.push(`/explore?q=${encodeURIComponent(item.text)}`);
  }

  function handleInsertText(text: string) {
    sounds.tap();
    haptics.light();
    updateQuery(text);
    inputRef.current?.focus();
  }

  function handleFormSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelect(suggestions[selectedIndex]);
      return;
    }

    const query = inputValue.trim();
    if (!query) return;

    sounds.tap();
    saveRecentSearch(query);
    setIsOpen(false);

    if (onSubmit) {
      onSubmit(query);
      return;
    }

    if (query.startsWith("#")) {
      const cleanTag = query.replace(/^#+/, "").trim();
      if (cleanTag) {
        router.push(`/hashtag/${encodeURIComponent(cleanTag.toLowerCase())}`);
        return;
      }
    }

    router.push(`/explore?q=${encodeURIComponent(query)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Arrow Down
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      return;
    }

    // Arrow Up
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      return;
    }

    // Tab or ArrowRight at the end of input -> Complete ghost text
    if ((e.key === "Tab" || e.key === "ArrowRight") && ghostCompletion) {
      const cursorAtEnd =
        inputRef.current && inputRef.current.selectionStart === inputRef.current.value.length;

      if (e.key === "Tab" || cursorAtEnd) {
        e.preventDefault();
        const completed = inputValue + ghostCompletion;
        updateQuery(completed);
        return;
      }
    }

    // Escape
    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
      return;
    }
  }

  const heightClass =
    size === "sm" ? "h-9 text-xs" : size === "lg" ? "h-12 text-sm" : "h-10 text-xs sm:text-sm";

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleFormSubmit} className="relative flex items-center w-full">
        {/* Search Icon */}
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none shrink-0 z-10" />

        {/* Ghost Autocomplete Overlay Behind Input */}
        {ghostCompletion && isOpen && (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center pl-10 pr-10 font-normal select-none overflow-hidden",
              heightClass
            )}
            aria-hidden="true"
          >
            <span className="opacity-0 whitespace-pre">{inputValue}</span>
            <span className="text-muted-foreground/45 whitespace-pre">{ghostCompletion}</span>
          </div>
        )}

        {/* Search Input */}
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          value={inputValue}
          onChange={(e) => updateQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-9 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground",
            "focus:border-primary/70 focus:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
            heightClass,
            inputClassName
          )}
        />

        {/* Right Action Icons: Spinner or Clear */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="size-3.5 text-muted-foreground animate-spin" />}

          {inputValue ? (
            <button
              type="button"
              onClick={() => {
                updateQuery("");
                inputRef.current?.focus();
              }}
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : ghostCompletion ? (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono text-muted-foreground bg-muted/60 border border-border select-none">
              Tab
            </span>
          ) : null}
        </div>
      </form>

      {/* ─── Autocomplete Dropdown Popover ─── */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-lg bg-surface-raised shadow-lg overflow-hidden p-2 space-y-2.5 animate-in fade-in zoom-in-98 duration-150 max-h-[85vh] sm:max-h-[440px] overflow-y-auto no-scrollbar">
          {/* Live Autocomplete Results */}
          {trimmed.length >= 2 && suggestions.length > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <span>Suggestions</span>
                </span>
                <span className="text-xs text-fg-subtle hidden sm:inline">
                  Arrow keys to move, Enter to open
                </span>
              </div>

              <div className="space-y-0.5">
                {suggestions.map((item, idx) => {
                  const isSelected = selectedIndex === idx;

                  // Render appropriate entity badge/icon
                  const entityIcon = (() => {
                    switch (item.type) {
                      case "person":
                        return (
                          <Avatar className="size-7 rounded-full border border-border shrink-0">
                            <AvatarImage src={item.imageUrl || ""} />
                            <AvatarFallback className="text-xs font-bold bg-brand/15 text-brand-text">
                              {item.title?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        );
                      case "college":
                        return (
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success border border-success/30">
                            <School className="size-3.5" />
                          </div>
                        );
                      case "community":
                        return (
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand-text border border-brand-subtle-border/30">
                            <Users className="size-3.5" />
                          </div>
                        );
                      case "hashtag":
                        return (
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/30">
                            <Hash className="size-3.5" />
                          </div>
                        );
                      case "academic":
                        return (
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning border border-warning/30">
                            <BookOpen className="size-3.5" />
                          </div>
                        );
                      default:
                        return (
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Search className="size-3.5" />
                          </div>
                        );
                    }
                  })();

                  return (
                    <div
                      key={item.text + idx}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl transition-colors cursor-pointer select-none",
                        isSelected
                          ? "bg-primary/12 text-primary font-semibold ring-1 ring-ring"
                          : "hover:bg-muted/60 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {entityIcon}

                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate">{item.title || item.text}</span>
                          {item.subtitle && (
                            <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Insert Text Arrow Button (Does not immediately submit, fills into input) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInsertText(item.text);
                          }}
                          className="sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                          title="Fill in the search box"
                          aria-label="Fill in the search box"
                        >
                          <ArrowUpLeft className="size-3.5" />
                        </button>

                        <div className="flex size-5 items-center justify-center text-muted-foreground/50">
                          <CornerDownLeft className="size-3" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : trimmed.length >= 2 && !isLoading ? (
            /* No Direct Results: Query Search Fallback */
            <div className="p-3 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                No instant matches for <strong className="text-foreground">&quot;{trimmed}&quot;</strong>
              </p>
              <button
                type="button"
                onClick={() => handleFormSubmit()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/15 text-primary hover:bg-primary/25 text-xs font-bold transition-colors cursor-pointer"
              >
                <Search className="size-3" />
                <span>Search all posts &amp; topics for &quot;{trimmed}&quot;</span>
              </button>
            </div>
          ) : null}

          {/* ─── Recent Searches (Shown when empty or short query) ─── */}
          {showRecent && recentSearches.length > 0 && trimmed.length < 2 && (
            <div className="space-y-1.5 px-1">
              <div className="flex items-center justify-between px-1.5">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  <span>Recent</span>
                </span>
                <button
                  type="button"
                  onClick={clearAllRecent}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer font-medium"
                >
                  Clear all
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((term) => (
                  <span
                    key={term}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted text-xs text-foreground/90 transition-colors cursor-pointer"
                    onClick={() => {
                      updateQuery(term);
                      inputRef.current?.focus();
                    }}
                  >
                    <span>{term}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentSearch(term);
                      }}
                      className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                      aria-label={`Remove ${term}`}
                    >
                      <X className="size-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ─── Search ideas (shown when empty or short query) ─── */}
          {showTrending && trimmed.length < 2 && (
            <div className="space-y-1.5 px-1 pt-1 border-t border-border">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 px-1.5">
                <span>Try searching</span>
              </span>

              <div className="flex flex-wrap gap-1.5">
                {SEARCH_IDEAS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      updateQuery(topic);
                      inputRef.current?.focus();
                    }}
                    className="inline-flex min-h-8 items-center gap-1 px-3 py-1 rounded-full border border-border bg-surface text-xs text-fg-muted hover:text-fg hover:bg-surface-muted transition-ui cursor-pointer"
                  >
                    <span>{topic}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
