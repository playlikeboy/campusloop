"use client";

import {
  Check,
  ChevronDown,
  Globe,
  Hash,
  Loader2,
  Lock,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCommunities, type Community } from "@/hooks/use-communities";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export interface CommunityFeedSelectorProps {
  selectedCommunityId: string;
  onSelectCommunity: (communityId: string, community?: Community | null) => void;
  lockedCommunityName?: string;
  className?: string;
  disabled?: boolean;
}

export function CommunityFeedSelector({
  selectedCommunityId,
  onSelectCommunity,
  lockedCommunityName,
  className,
  disabled = false,
}: CommunityFeedSelectorProps) {
  const searchInputId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [asyncResults, setAsyncResults] = useState<Community[] | null>(null);
  const [isSearchingAsync, setIsSearchingAsync] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const { communities, isLoading: isLoadingInitial } = useCommunities();

  // Combine initial communities with async search results without duplicates
  const allKnownCommunities = useMemo(() => {
    const map = new Map<string, Community>();
    for (const c of communities) {
      map.set(c.id, c);
    }
    if (asyncResults) {
      for (const c of asyncResults) {
        map.set(c.id, c);
      }
    }
    return Array.from(map.values());
  }, [communities, asyncResults]);

  // Selected community object (if any)
  const selectedCommunity = useMemo(() => {
    if (!selectedCommunityId || selectedCommunityId === "NONE") return null;
    return allKnownCommunities.find((c) => c.id === selectedCommunityId) || null;
  }, [selectedCommunityId, allKnownCommunities]);

  // Clean slug helper
  const getCommunitySlug = (c: Community): string => {
    if (c.slug && c.slug.trim().length > 0) return c.slug.trim();
    return c.name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
  };

  // Filtered options based on search query
  const filteredCommunities = useMemo(() => {
    const raw = searchQuery.trim().toLowerCase();
    if (!raw) return allKnownCommunities;

    // Support typing 'c/tech' or '#tech' or 'tech'
    const clean = raw.replace(/^c\//, "").replace(/^#/, "").trim();

    return allKnownCommunities.filter((c) => {
      const name = c.name.toLowerCase();
      const slug = getCommunitySlug(c).toLowerCase();
      const desc = (c.description || "").toLowerCase();
      const category = (c.category || "").toLowerCase();

      return (
        name.includes(clean) ||
        slug.includes(clean) ||
        desc.includes(clean) ||
        category.includes(clean)
      );
    });
  }, [allKnownCommunities, searchQuery]);

  // Debounced server search when query doesn't yield many results or for fresh backend data
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setAsyncResults(null);
      setIsSearchingAsync(false);
      return;
    }

    const clean = trimmed.replace(/^c\//, "").replace(/^#/, "").trim();
    if (!clean) return;

    const timer = setTimeout(async () => {
      setIsSearchingAsync(true);
      try {
        const res = await fetcher<Community[]>(
          `/api/communities?q=${encodeURIComponent(clean)}&limit=15`
        );
        if (Array.isArray(res)) {
          setAsyncResults(res);
        }
      } catch {
        // Fallback silently to client filter
      } finally {
        setIsSearchingAsync(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    } else {
      setSearchQuery("");
      setAsyncResults(null);
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  // Total selectable items: "Main Feed" (index 0) + filtered communities (index 1..N)
  const totalItems = 1 + filteredCommunities.length;

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex === 0) {
        handleSelectMainFeed();
      } else {
        const selected = filteredCommunities[activeIndex - 1];
        if (selected) {
          handleSelectCommunity(selected);
        }
      }
    }
  }

  function handleSelectMainFeed() {
    haptics.light();
    onSelectCommunity("NONE", null);
    setIsOpen(false);
  }

  function handleSelectCommunity(community: Community) {
    haptics.light();
    onSelectCommunity(community.id, community);
    setIsOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    haptics.light();
    onSelectCommunity("NONE", null);
  }

  // If community is locked (e.g. posting inside c/xyz community page modal)
  if (lockedCommunityName) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
        <Hash className="size-3.5" />
        <span>c/{lockedCommunityName}</span>
      </span>
    );
  }

  const isMainFeed = !selectedCommunity;
  const currentSlug = selectedCommunity ? getCommunitySlug(selectedCommunity) : null;

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      {/* ─── Pure Clean Trigger Pill ─── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
          disabled && "opacity-50 cursor-not-allowed",
          isMainFeed
            ? "border border-border/60 bg-muted/50 text-foreground hover:bg-muted hover:border-border"
            : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
        )}
      >
        {isMainFeed ? (
          <>
            <Globe className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="font-semibold">Main Feed</span>
            <span className="text-[10px] font-medium text-muted-foreground hidden sm:inline">
              (Public)
            </span>
            <ChevronDown
              className={cn(
                "size-3 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </>
        ) : (
          <>
            <Hash className="size-3.5 text-primary" />
            <span className="font-mono tracking-tight font-bold truncate max-w-[150px]">
              c/{currentSlug}
            </span>
            <button
              type="button"
              onClick={handleClear}
              title="Clear to Main Feed"
              aria-label="Clear to Main Feed"
              className="ml-0.5 rounded-full p-0.5 text-primary/70 hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
            >
              <X className="size-3" />
            </button>
            <ChevronDown
              className={cn(
                "size-3 text-primary/70 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {/* ─── Impeccable Searchable Dropdown Popover ─── */}
      {isOpen && (
        <div
          role="listbox"
          className={cn(
            "absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl overflow-hidden",
            "border border-border/50 bg-card/95 backdrop-blur-xl",
            "shadow-xl shadow-black/10 dark:shadow-black/40",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
        >
          {/* Popover Header & Search Bar */}
          <div className="p-2.5 pb-2 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Destination Feed
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {isSearchingAsync ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="size-2.5 animate-spin" /> Searching...
                  </span>
                ) : (
                  `${filteredCommunities.length} ${filteredCommunities.length === 1 ? "hub" : "hubs"}`
                )}
              </span>
            </div>

            {/* Instant Search Bar */}
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                id={searchInputId}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search feeds or c/{slug}..."
                className={cn(
                  "w-full h-8.5 rounded-xl pl-8.5 pr-8 text-xs font-medium",
                  "bg-background/80 border border-border/50 text-foreground",
                  "placeholder:text-muted-foreground/70",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/40",
                  "transition-all"
                )}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Feed List */}
          <div
            ref={listRef}
            className="max-h-72 overflow-y-auto p-1.5 space-y-1 no-scrollbar overscroll-contain"
          >
            {/* 1. Main Campus Feed Option */}
            <button
              type="button"
              role="option"
              aria-selected={isMainFeed}
              data-active={activeIndex === 0}
              onClick={handleSelectMainFeed}
              onMouseEnter={() => setActiveIndex(0)}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer",
                isMainFeed
                  ? "bg-primary/10 text-primary"
                  : activeIndex === 0
                    ? "bg-muted text-foreground"
                    : "hover:bg-muted/60 text-foreground"
              )}
            >
              <div
                className={cn(
                  "size-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  isMainFeed
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Globe className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold truncate">Main Campus Feed</span>
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 font-bold">
                    Global
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  Share across all campus students & timelines
                </p>
              </div>

              {isMainFeed && <Check className="size-4 text-primary shrink-0 ml-1" />}
            </button>

            {/* Separator / Communities Heading */}
            <div className="flex items-center gap-2 px-2.5 pt-2 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Campus Sub-Hubs (`c/...`)</span>
              <div className="h-px flex-1 bg-border/40" />
            </div>

            {/* 2. Filtered Communities List */}
            {filteredCommunities.length > 0 ? (
              filteredCommunities.map((comm, idx) => {
                const itemIndex = idx + 1;
                const isSelected = selectedCommunityId === comm.id;
                const isFocused = activeIndex === itemIndex;
                const slug = getCommunitySlug(comm);

                return (
                  <button
                    key={comm.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-active={isFocused}
                    onClick={() => handleSelectCommunity(comm)}
                    onMouseEnter={() => setActiveIndex(itemIndex)}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : isFocused
                          ? "bg-muted text-foreground"
                          : "hover:bg-muted/60 text-foreground"
                    )}
                  >
                    <Avatar className="size-8 rounded-xl border border-border/40 shrink-0">
                      {comm.avatarUrl && <AvatarImage src={comm.avatarUrl} alt={comm.name} />}
                      <AvatarFallback className="rounded-xl text-[11px] font-bold bg-muted text-muted-foreground">
                        {comm.name ? comm.name.slice(0, 2).toUpperCase() : "C"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground truncate">
                          {comm.name}
                        </span>
                        {comm.isPrivate && (
                          <Lock className="size-2.5 text-muted-foreground shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="font-mono font-semibold text-primary/80">c/{slug}</span>
                        <span>•</span>
                        <span>
                          {comm.memberCount || comm.membersCount || 0}{" "}
                          {(comm.memberCount || comm.membersCount) === 1 ? "student" : "students"}
                        </span>
                        {comm.category && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[80px]">{comm.category}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="size-4 text-primary shrink-0 ml-1" />}
                  </button>
                );
              })
            ) : (
              <div className="py-6 px-3 text-center">
                <div className="size-10 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-2">
                  <Hash className="size-5" />
                </div>
                <p className="text-xs font-bold text-foreground">
                  No community found for &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
                  You can post to the Main Feed or search another sub-hub keyword.
                </p>
                <button
                  type="button"
                  onClick={handleSelectMainFeed}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                >
                  <Globe className="size-3" />
                  Post to Main Feed
                </button>
              </div>
            )}
          </div>

          {/* Popover Footer Info */}
          <div className="px-3 py-2 border-t border-border/30 bg-muted/15 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="size-3 text-primary" />
              <span>Posts in c/ sub-hubs appear in community feeds</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
