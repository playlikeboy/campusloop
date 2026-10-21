"use client";

import { BookMarked, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWRInfinite from "swr/infinite";
import type { Course } from "@/db/schema";
import { fetcher } from "@/lib/api";
import { COURSE_CATEGORIES, LEVEL_LABEL } from "@/lib/courses/format";
import { cn } from "@/lib/utils";
import { CourseCard } from "./course-card";

type Page = { courses: Course[]; total: number; hasMore: boolean };

const SORTS = [
  { v: "popular", l: "Most popular" },
  { v: "rating", l: "Highest rated" },
  { v: "newest", l: "Newest" },
  { v: "shortest", l: "Shortest" },
];

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function CatalogClient({ initial, categories }: { initial: Page; categories: string[] }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("ALL_LEVELS");
  const [source, setSource] = useState("ALL");
  const [sort, setSort] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);
  const dq = useDebounced(q);
  const isDefault = !dq && category === "All" && level === "ALL_LEVELS" && source === "ALL" && sort === "popular";

  const { data, size, setSize, isLoading, error } = useSWRInfinite<Page>(
    (i, prev) => {
      if (prev && !prev.hasMore) return null;
      const p = new URLSearchParams({ q: dq, category, level, source, sort, page: String(i + 1) });
      return `/api/courses?${p}`;
    },
    fetcher,
    { fallbackData: isDefault ? [initial] : undefined, revalidateFirstPage: false }
  );
  const list = data?.flatMap((d) => d.courses) ?? [];
  const total = data?.[0]?.total ?? 0;
  const chips = ["All", ...COURSE_CATEGORIES.filter((c) => categories.includes(c))];

  return (
    <div className="px-4 pb-16 sm:px-0">
      <header className="mx-auto max-w-2xl pt-4 text-center">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Learn anything, at your own pace</h1>
        <p className="mt-2 text-muted-foreground">Free courses from Harvard's CS50 and from students like you. Track progress and earn a certificate.</p>
        <label className="relative mx-auto mt-6 block max-w-xl">
          <span className="sr-only">Search courses</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Python, web development, SQL, AI..."
            className="h-13 w-full rounded-2xl bg-card/80 pl-12 pr-11 text-[15px] text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted cursor-pointer">
              <X className="size-4" />
            </button>
          )}
        </label>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/courses/my" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-muted/70 px-4 text-sm font-semibold text-foreground hover:bg-muted">
            <BookMarked className="size-4" aria-hidden /> My learning
          </Link>
          <Link href="/courses/new" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="size-4" aria-hidden /> Create a course
          </Link>
        </div>
      </header>

      <div className="mt-8 flex items-center gap-2">
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Categories">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer",
                category === c ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-muted/60 px-3 text-sm font-medium text-foreground hover:bg-muted cursor-pointer"
        >
          <SlidersHorizontal className="size-4" aria-hidden /> <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {showFilters && (
        <div className="mt-3 grid gap-3 rounded-2xl bg-card/60 p-4 shadow-2xs sm:grid-cols-3">
          {[
            { label: "Level", value: level, set: setLevel, options: [["ALL_LEVELS", "Any level"], ...Object.entries(LEVEL_LABEL)] },
            { label: "Source", value: source, set: setSource, options: [["ALL", "All sources"], ["CS50", "Harvard CS50"], ["COMMUNITY", "Community"]] },
            { label: "Sort by", value: sort, set: setSort, options: SORTS.map((s) => [s.v, s.l]) },
          ].map((f) => (
            <label key={f.label} className="text-sm font-medium text-foreground">
              {f.label}
              <select
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {f.options.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {isLoading && !data ? "Loading courses..." : `${total} course${total === 1 ? "" : "s"}`}
      </p>

      {error ? (
        <div className="mt-6 rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">Could not load courses. Please try again.</div>
      ) : list.length === 0 && !isLoading ? (
        <div className="mt-6 rounded-2xl bg-card/60 p-10 text-center shadow-2xs">
          <p className="font-semibold text-foreground">No courses match that yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another word, or create the course you wish existed.</p>
        </div>
      ) : (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((c) => (
            <li key={c.id}><CourseCard course={c} /></li>
          ))}
          {isLoading && Array.from({ length: 4 }).map((_, i) => <li key={`s${i}`} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted/60" />)}
        </ul>
      )}

      {data?.[data.length - 1]?.hasMore && (
        <div className="mt-8 text-center">
          <button type="button" onClick={() => setSize(size + 1)} className="h-11 rounded-full bg-muted/70 px-6 text-sm font-semibold text-foreground hover:bg-muted cursor-pointer">
            Show more courses
          </button>
        </div>
      )}
    </div>
  );
}
