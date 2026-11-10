"use client";

import { ArrowDown, ArrowRight, ArrowUp, CornerDownLeft, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_SECTIONS } from "./admin-sidebar";

interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
}

/** Derived from the sidebar so search never lists pages that no longer exist. */
const SEARCH_ITEMS: SearchItem[] = ADMIN_NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({
    id: item.href,
    title: item.label,
    description: item.desc,
    category: section.title,
    href: item.href,
    icon: item.icon,
    keywords: item.keywords,
  }))
);

interface AdminGlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminGlobalSearch({ isOpen, onClose }: AdminGlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!query.trim()) return SEARCH_ITEMS;
    const q = query.toLowerCase().trim();
    return SEARCH_ITEMS.filter((item) => {
      const inTitle = item.title.toLowerCase().includes(q);
      const inDesc = item.description.toLowerCase().includes(q);
      const inKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return inTitle || inDesc || inKeywords;
    });
  }, [query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        const target = filteredItems[selectedIndex];
        router.push(target.href);
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-overlay p-3 sm:p-6 sm:pt-20"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search admin pages"
        className="flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-2">
          <Search className="size-4 shrink-0 text-fg-muted" aria-hidden />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search admin pages"
            aria-label="Search admin pages"
            className="h-11 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle sm:text-sm"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X aria-hidden />
            </Button>
          )}
          <kbd className="hidden rounded-sm border border-border px-1.5 py-0.5 font-mono text-xs text-fg-muted sm:inline-flex">
            Esc
          </kbd>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2" role="listbox" aria-label="Admin pages">
          {filteredItems.length === 0 ? (
            <p className="py-12 text-center text-sm text-fg-muted">
              No admin page matches &ldquo;{query}&rdquo;. Try another word.
            </p>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-fg transition-ui",
                    isSelected ? "bg-brand-subtle" : "hover:bg-surface-muted"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon
                      className={cn("size-4 shrink-0", isSelected ? "text-brand-text" : "text-fg-muted")}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {item.title} <span className="font-normal text-fg-subtle">· {item.category}</span>
                      </p>
                      <p className="truncate text-xs text-fg-muted">{item.description}</p>
                    </div>
                  </div>
                  <ArrowRight
                    aria-hidden
                    className={cn(
                      "size-4 shrink-0 text-brand-text",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                </button>
              );
            })
          )}
        </div>

        <div className="hidden items-center justify-between border-t border-border px-4 py-2 text-xs text-fg-muted sm:flex">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowUp className="size-3.5" aria-hidden />
              <ArrowDown className="size-3.5" aria-hidden />
              to move
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="size-3.5" aria-hidden />
              to open
            </span>
          </div>
          <span>{filteredItems.length} pages</span>
        </div>
      </div>
    </div>
  );
}
