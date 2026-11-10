"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  /** Optional leading glyph, e.g. a branch emoji. */
  icon?: string;
  /** Small right-aligned grouping label. */
  hint?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Type-to-filter dropdown for long option lists.
 *
 * The branch catalog runs to ~70 entries, which is unusable as a native
 * `<select>` on mobile. Matching is substring-based across every word, so
 * "industrial", "prod" and "eng" all surface Production & Industrial
 * Engineering.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyText = "No matches",
  className,
  id,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;

    // Every whitespace-separated term must appear somewhere in the label, so
    // "prod ind" narrows rather than widening.
    const terms = q.split(/\s+/);
    return options.filter((o) => {
      const haystack = `${o.label} ${o.value}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [options, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, []);

  // Close on any outside click.
  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [isOpen]);

  function commit(option: SearchableOption) {
    onChange(option.value);
    setIsOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = filtered[activeIndex];
      if (option) commit(option);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border bg-surface px-3.5 text-left text-base text-fg outline-none transition-ui focus-visible:ring-3 focus-visible:ring-ring/25",
          isOpen ? "border-brand" : "border-border-strong",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon && <span aria-hidden>{selected.icon}</span>}
          <span className={cn("truncate", !selected && "text-fg-subtle")}>
            {selected?.label || placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-fg-muted transition-ui", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="relative border-b border-border">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="min-h-11 w-full bg-transparent py-2.5 pl-9 pr-12 text-base text-fg outline-none placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute top-1/2 right-0 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center text-fg-muted hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>

          <div ref={listRef} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map((option, i) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-active={i === activeIndex}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => commit(option)}
                    className={cn(
                      "flex min-h-11 w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm transition-ui",
                      i === activeIndex ? "bg-surface-muted" : "hover:bg-surface-muted"
                    )}
                  >
                    {option.icon && <span aria-hidden>{option.icon}</span>}
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate",
                        isSelected ? "font-semibold text-fg" : "text-fg"
                      )}
                    >
                      {option.label}
                    </span>
                    {option.hint && (
                      <span className="shrink-0 text-xs text-fg-muted">
                        {option.hint}
                      </span>
                    )}
                    {isSelected && <Check className="size-4 shrink-0 text-brand-text" aria-hidden />}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-4 text-sm text-fg-muted">{emptyText}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
