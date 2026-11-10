"use client";

import {
  ArrowRight,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-20 bg-background/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/60 bg-muted/20">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search admin operations, routes, tools, or shortcuts..."
            className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/70 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="size-3.5" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground bg-muted/60 border border-border/40 rounded">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No admin operational areas match &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                        isSelected
                          ? "bg-primary-foreground/15 border-primary-foreground/20 text-primary-foreground"
                          : "bg-muted/40 border-border/40 text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">{item.title}</span>
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border shrink-0",
                            isSelected
                              ? "bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground"
                              : "bg-muted/60 border-border/40 text-muted-foreground"
                          )}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-[11px] truncate",
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className={cn(
                      "size-3.5 shrink-0 transition-transform",
                      isSelected ? "translate-x-0.5 text-primary-foreground" : "opacity-0"
                    )}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 py-2 border-t border-border/60 bg-muted/15 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono">
              <span className="px-1 py-0.5 bg-muted rounded border border-border/40 text-[10px]">↑</span>
              <span className="px-1 py-0.5 bg-muted rounded border border-border/40 text-[10px]">↓</span>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <span className="px-1 py-0.5 bg-muted rounded border border-border/40 text-[10px]">↵</span>
              <span>to select</span>
            </span>
          </div>
          <span>{filteredItems.length} destinations</span>
        </div>
      </div>
    </div>
  );
}
