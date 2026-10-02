"use client";

import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "accent" | "outline";
  hint?: string;
  category?: string;
}

interface SearchableComboboxProps {
  options?: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  onSearchAsync?: (query: string) => Promise<ComboboxOption[]>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export function SearchableCombobox({
  options = [],
  value,
  onChange,
  onSearchAsync,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  className,
  id,
  disabled = false,
  clearable = true,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [asyncOptions, setAsyncOptions] = useState<ComboboxOption[]>([]);
  const [isLoadingAsync, setIsLoadingAsync] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const effectiveOptions = onSearchAsync ? asyncOptions : options;
  const selected = effectiveOptions.find((o) => o.value === value) || options.find((o) => o.value === value);

  // Local filtering for synchronous mode
  const filteredOptions = useMemo(() => {
    if (onSearchAsync) return asyncOptions;
    const q = query.trim().toLowerCase();
    if (!q) return options;

    const terms = q.split(/\s+/);
    return options.filter((o) => {
      const haystack = `${o.label} ${o.subtitle || ""} ${o.badge || ""} ${o.value}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [options, asyncOptions, query, onSearchAsync]);

  // Debounced async searching
  useEffect(() => {
    if (!onSearchAsync || !isOpen) return;

    let isMounted = true;
    setIsLoadingAsync(true);

    const timer = setTimeout(async () => {
      try {
        const results = await onSearchAsync(query);
        if (isMounted) {
          setAsyncOptions(results);
          setActiveIndex(0);
        }
      } catch (err) {
        console.error("Async combobox search failed:", err);
      } finally {
        if (isMounted) setIsLoadingAsync(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, isOpen, onSearchAsync]);

  // Close on outside click
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

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      searchRef.current?.focus();
    }
  }, [isOpen]);

  // Scroll active option into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeIndex]);

  function commit(option: ComboboxOption) {
    onChange(option.value);
    setIsOpen(false);
    setQuery("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filteredOptions.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option) commit(option);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5 text-left text-xs font-semibold text-foreground outline-none transition-all shadow-2xs hover:border-border hover:bg-card focus-visible:ring-2 focus-visible:ring-primary/30",
          isOpen && "border-primary ring-2 ring-primary/20",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
          <span className="truncate">
            {selected ? (
              <span className="text-foreground">{selected.label}</span>
            ) : (
              <span className="text-muted-foreground/70 font-normal">{placeholder}</span>
            )}
          </span>
          {selected?.badge && (
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              {selected.badge}
            </span>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
          {clearable && selected && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e as any)}
              className="p-0.5 rounded-full hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
              title="Clear selection"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn("size-3.5 transition-transform duration-200", isOpen && "rotate-180")}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="relative border-b border-border/40 p-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl bg-muted/40 py-1.5 pl-8 pr-3 text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/60 focus:bg-muted/70 transition-colors"
            />
          </div>

          <div ref={listRef} className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {isLoadingAsync ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground font-medium">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Searching colleges...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground font-medium">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isActive = idx === activeIndex;

                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    data-active={isActive}
                    onClick={() => commit(opt)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-colors",
                      isActive ? "bg-muted/70 text-foreground" : "text-muted-foreground hover:text-foreground",
                      isSelected && "font-bold text-primary bg-primary/10"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="min-w-0">
                        <p className={cn("truncate font-medium text-foreground", isSelected && "font-bold text-primary")}>
                          {opt.label}
                        </p>
                        {opt.subtitle && (
                          <p className="truncate text-[10px] text-muted-foreground">
                            {opt.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted/60 text-muted-foreground border border-border/40">
                          {opt.badge}
                        </span>
                      )}
                      {opt.hint && (
                        <span className="text-[10px] text-muted-foreground">{opt.hint}</span>
                      )}
                      {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
