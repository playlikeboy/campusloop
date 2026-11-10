"use client";

import { Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
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

/** Common searches shown when the field is empty and focused. */
const SEARCH_SUGGESTIONS = ["DBMS", "DSA", "Operating Systems", "Computer Networks", "Maths 1", "CS302"];

export function AcademicSearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search a subject, code or topic",
  className,
}: AcademicSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit?.(value.trim());
    inputRef.current?.blur();
  }

  function pickSuggestion(q: string) {
    sounds.tap();
    haptics.light();
    onChange(q);
    onSubmit?.(q);
    setIsFocused(false);
  }

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle" />
        <Input
          ref={inputRef}
          type="search"
          aria-label="Search study material"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder={placeholder}
          enterKeyHint="search"
          className="rounded-full pr-12 pl-10 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              sounds.tap();
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </form>

      {isFocused && !value && (
        <div className="absolute top-full right-0 left-0 z-40 mt-2 rounded-lg border border-border bg-surface-raised p-3 shadow-lg">
          <p className="px-1 pb-2 text-xs text-fg-muted">Try searching</p>
          <div className="flex flex-wrap gap-2">
            {SEARCH_SUGGESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickSuggestion(q);
                }}
                className="inline-flex h-9 cursor-pointer items-center rounded-full bg-surface-muted px-3 text-sm text-fg transition-ui hover:bg-surface-sunken"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
