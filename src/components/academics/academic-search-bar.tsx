"use client";

import { Clock, Search, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface AcademicSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SEARCH_SUGGESTIONS = [
  { label: "CS302", category: "Course Code", query: "CS302" },
  { label: "Database Management Systems (DBMS)", category: "Subject", query: "DBMS" },
  { label: "Data Structures & Algorithms", category: "Subject", query: "DSA" },
  { label: "Normalization & BCNF Guide", category: "Topic", query: "Normalization" },
  { label: "Operating Systems Sem 5", category: "Semester", query: "Sem 5" },
  { label: "Computer Science PYQs", category: "Branch", query: "Computer Science" },
];

export function AcademicSearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search notes, subjects, PYQs…",
  className,
}: AcademicSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isMac, setIsMac] = useState(true);

  // Platform detection for ⌘ K vs Ctrl K
  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const isApple = /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || navigator.platform);
      setIsMac(isApple);
    }
  }, []);

  // Global shortcut listener: ⌘ K or Ctrl K focuses search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        sounds.tap();
        haptics.light();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(value.trim());
    }
    inputRef.current?.blur();
  }

  function handleSelectSuggestion(q: string) {
    sounds.tap();
    haptics.light();
    onChange(q);
    if (onSubmit) onSubmit(q);
    setIsFocused(false);
  }

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative w-full">
        {/* Search Icon */}
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />

        {/* Input Field */}
        <input
          ref={inputRef}
          type="search"
          role="searchbox"
          aria-label="Search study resources"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="w-full h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-card/80 border border-transparent pl-10 pr-10 sm:pr-24 text-sm text-foreground placeholder:text-muted-foreground/65 outline-none transition-colors focus:border-primary/50 backdrop-blur-md"
        />

        {/* Right actions: Clear button + Keyboard shortcut pill */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-auto">
          {value && (
            <button
              type="button"
              onClick={() => {
                sounds.tap();
                onChange("");
                inputRef.current?.focus();
              }}
              className="flex size-6 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Clear search"
              aria-label="Clear search input"
            >
              <X className="size-3.5" />
            </button>
          )}

          {/* ⌘ K Keyboard shortcut badge */}
          <kbd
            onClick={() => inputRef.current?.focus()}
            className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg border border-border/60 bg-muted/60 text-[10px] font-mono font-bold text-muted-foreground select-none cursor-pointer shadow-2xs hover:bg-muted"
            title={isMac ? "Press Command + K to search" : "Press Control + K to search"}
          >
            {isMac ? "⌘" : "Ctrl"} K
          </kbd>
        </div>
      </form>

      {/* Instant Search Suggestions Popover */}
      {isFocused && !value && (
        <div className="absolute top-full left-0 right-0 mt-2 z-40 rounded-2xl border border-border/50 bg-card/95 shadow-xl backdrop-blur-xl p-2.5 animate-in fade-in zoom-in-95 duration-150 space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="size-3 text-primary" />
              <span>Suggested searches</span>
            </span>
            <span className="text-[10px] font-mono opacity-70">Tap to search</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
            {SEARCH_SUGGESTIONS.map((item) => (
              <button
                key={item.query}
                type="button"
                onMouseDown={() => handleSelectSuggestion(item.query)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-muted/70 transition-colors text-xs cursor-pointer group"
              >
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {item.label}
                </span>
                <span className="text-[10px] text-muted-foreground/75 shrink-0 ml-2">
                  {item.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
