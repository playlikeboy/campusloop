"use client";

import { ArrowRight, Search, SearchX, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import type { GuideCategory } from "@/lib/guide/types";

export interface GuideCardData {
  slug: string;
  title: string;
  summary: string;
  category: GuideCategory;
  keywords: string[];
}

/** Valid, space-free element id for a category heading. */
function categoryId(name: string) {
  return `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
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
      <div className="relative">
        <label htmlFor="guide-search" className="sr-only">
          Search the guide
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <Input
          id="guide-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search, like “notes”, “events” or “payments”"
          className="h-12 rounded-full pr-12 pl-11 text-base"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-1.5 -translate-y-1/2"
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </div>

      <fieldset className="-mx-[var(--gutter)] flex min-w-0 gap-2 overflow-x-auto px-[var(--gutter)] pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
        <legend className="sr-only">Topic</legend>
        {(["All", ...categories.map((c) => c.name)] as const).map((name) => (
          <Chip key={name} selected={active === name} onSelectedChange={() => setActive(name)}>
            {name}
          </Chip>
        ))}
      </fieldset>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          bordered
          title="No guides match that"
          description="Try a broader word like “notes” or “chat”."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery("");
                setActive("All");
              }}
            >
              Show all guides
            </Button>
          }
        />
      ) : (
        visibleCategories.map((cat) => (
          <section key={cat.name} aria-labelledby={categoryId(cat.name)} className="pt-4">
            <h3 id={categoryId(cat.name)} className="text-xl text-fg">
              {cat.name}
            </h3>
            <p className="text-sm text-fg-muted">{cat.blurb}</p>
            <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface">
              {filtered
                .filter((g) => g.category === cat.name)
                .map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={`/guide/${g.slug}`}
                      className="group flex items-start gap-3 px-4 py-3.5 transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-fg">{g.title}</span>
                        <span className="mt-0.5 block text-sm text-fg-muted">{g.summary}</span>
                      </span>
                      <ArrowRight
                        className="mt-1 size-4 shrink-0 text-fg-subtle group-hover:text-fg"
                        aria-hidden="true"
                      />
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
