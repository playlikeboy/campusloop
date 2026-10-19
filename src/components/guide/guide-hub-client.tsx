"use client";

import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { GuideCategory } from "@/lib/guide/types";
import { cn } from "@/lib/utils";

export interface GuideCardData {
  slug: string;
  title: string;
  summary: string;
  category: GuideCategory;
  keywords: string[];
}

/** Searchable, filterable index of every guide. Data is passed in from the server page. */
export function GuideHubClient({
  guides,
  categories,
}: {
  guides: GuideCardData[];
  categories: { name: GuideCategory; blurb: string }[];
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<GuideCategory | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guides.filter((g) => {
      if (active !== "All" && g.category !== active) return false;
      if (!q) return true;
      return [g.title, g.summary, ...g.keywords].join(" ").toLowerCase().includes(q);
    });
  }, [guides, query, active]);

  const visibleCategories = categories.filter((c) => filtered.some((g) => g.category === c.name));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="relative block">
          <span className="sr-only">Search the guide</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search features, e.g. notes, payments, dating, events"
            className="h-12 w-full rounded-2xl bg-muted/60 pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Filter by category">
          {(["All", ...categories.map((c) => c.name)] as const).map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={active === name}
              onClick={() => setActive(name)}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer",
                active === name ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-card/60 p-10 text-center shadow-2xs">
          <p className="font-semibold text-foreground">No guides match "{query}"</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a broader word like "notes", "chat" or "orders".</p>
        </div>
      ) : (
        visibleCategories.map((cat) => (
          <section key={cat.name} aria-labelledby={`cat-${cat.name}`} className="space-y-3 pt-2">
            <div>
              <h2 id={`cat-${cat.name}`} className="text-lg font-bold text-foreground">{cat.name}</h2>
              <p className="text-sm text-muted-foreground">{cat.blurb}</p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {filtered
                .filter((g) => g.category === cat.name)
                .map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={`/guide/${g.slug}`}
                      className="group flex h-full items-start gap-3 rounded-2xl bg-card/60 p-4 shadow-2xs transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-foreground">{g.title}</span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{g.summary}</span>
                      </span>
                      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
