"use client";

import { ChevronRight, Clock, FileSearch, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DocsFeatureIcon } from "@/components/docs/docs-feature-icon";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { DOCS_CATEGORIES, type DocsCategory, type DocsFeature } from "@/lib/docs-features";

const FILTERS: ("All" | DocsCategory)[] = ["All", ...DOCS_CATEGORIES];

/** Searchable list of the "how it works" write-ups. */
export function DocsHubClient({ features }: { features: DocsFeature[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return features.filter((f) => {
      if (filter !== "All" && f.category !== filter) return false;
      if (!q) return true;
      return (
        f.title.toLowerCase().includes(q) ||
        f.tagline.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [features, query, filter]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="docs-search" className="sr-only">
            Search the docs
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-fg-subtle"
          />
          <input
            id="docs-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search, e.g. confessions, polls, verification"
            className="h-11 w-full rounded-full border border-border bg-surface pr-4 pl-11 text-sm text-fg outline-none transition-ui placeholder:text-fg-subtle focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((c) => (
            <Chip key={c} size="sm" selected={filter === c} onClick={() => setFilter(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="Nothing matches that"
          description="Try a simpler word like feed, polls or match."
          bordered
        />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {results.map((f) => (
            <li key={f.slug}>
              <Link
                href={`/docs/${f.slug}`}
                className="group flex items-center gap-4 py-4 transition-ui hover:bg-surface-muted sm:px-2"
              >
                <DocsFeatureIcon
                  slug={f.slug}
                  className="shrink-0 text-fg-subtle group-hover:text-brand-text"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-fg group-hover:text-brand-text">
                    {f.title}
                  </span>
                  <span className="block text-sm text-fg-muted">{f.tagline}</span>
                </span>
                <span className="hidden shrink-0 items-center gap-1 text-xs text-fg-subtle sm:flex">
                  <Clock aria-hidden className="size-3.5" />
                  {f.readTime}
                </span>
                <ChevronRight aria-hidden className="size-4 shrink-0 text-fg-subtle" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
