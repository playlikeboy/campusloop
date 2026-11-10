import { SearchX, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Course } from "@/db/schema";
import {
  CATALOG_PAGE_SIZE,
  type CatalogParams,
  catalogHref,
  DURATIONS,
  LANGUAGES,
  LEVELS,
  SORTS,
  SOURCES,
} from "@/lib/courses/catalog-params";
import { CategoryNav } from "./category-nav";
import { CourseListItem } from "./course-list-item";
import { FilterPanel } from "./filter-panel";
import { FilterSheet } from "./filter-sheet";
import { CatalogPagination } from "./pagination";
import { CatalogSearchBar } from "./search-bar";
import { SortSelect } from "./sort-select";

interface Props {
  params: CatalogParams;
  result: { courses: Course[]; total: number; pages: number };
  categories: { category: string; count: number }[];
}

/** Search and category results: filter sidebar (sheet on phones), sort, list, pagination. */
export function CatalogResults({ params, result, categories }: Props) {
  const heading = params.q
    ? `Results for "${params.q}"`
    : params.category
      ? `${params.category} courses`
      : "All courses";
  const chips = [
    // On a category page the topic nav shows the category; only a search scoped to a topic needs a chip.
    params.q && params.category && { label: params.category, href: catalogHref(params, { category: null }) },
    params.level && { label: LEVELS[params.level], href: catalogHref(params, { level: null }) },
    params.duration && { label: DURATIONS[params.duration], href: catalogHref(params, { duration: null }) },
    params.source && { label: SOURCES[params.source], href: catalogHref(params, { source: null }) },
    params.lang && { label: LANGUAGES[params.lang], href: catalogHref(params, { lang: null }) },
  ].filter(Boolean) as { label: string; href: string }[];
  const sorts = (Object.keys(SORTS) as (keyof typeof SORTS)[])
    .filter((s) => s !== "relevance" || params.q)
    .map((s) => ({ value: s, label: SORTS[s], href: catalogHref(params, { sort: s }) }));
  const from = (params.page - 1) * CATALOG_PAGE_SIZE + 1;

  return (
    <div className="pb-20">
      <div className="space-y-4 px-4 pt-2 sm:px-0">
        <CatalogSearchBar initial={params.q} />
        <CategoryNav categories={categories} active={params.category} />
      </div>

      <div className="mt-6 px-4 sm:px-0">
        <h1 className="text-2xl text-fg sm:text-3xl">{heading}</h1>
        <p className="mt-1 text-sm tabular-nums text-fg-muted" aria-live="polite">
          {result.courses.length === 0
            ? "No courses found"
            : `${from}–${from + result.courses.length - 1} of ${result.total.toLocaleString("en-IN")} course${result.total === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2 px-4 py-2 sm:px-0">
        <FilterSheet active={chips.length + (params.category && !params.q ? 1 : 0)} total={result.total}>
          <FilterPanel params={params} categories={categories} />
        </FilterSheet>
        <SortSelect value={params.sort} options={sorts} />
        <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
          {chips.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              scroll={false}
              aria-label={`Remove filter: ${c.label}`}
              className="inline-flex h-11 shrink-0 items-center gap-1 rounded-full bg-brand pl-4 pr-3 text-sm font-medium text-brand-fg transition-ui hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {c.label} <X className="size-3.5" aria-hidden />
            </Link>
          ))}
          {chips.length > 1 && (
            <Link
              href={catalogHref(
                { ...params, level: null, duration: null, source: null, lang: null },
                { category: params.q ? null : params.category }
              )}
              scroll={false}
              className="inline-flex h-11 shrink-0 items-center rounded-full px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm font-semibold text-fg-muted hover:text-fg"
            >
              Clear all
            </Link>
          )}
        </div>
      </div>

      <div className="mt-2 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-16">
            <FilterPanel params={params} categories={categories} />
          </div>
        </aside>
        <div className="min-w-0 px-2 sm:px-0">
          {result.courses.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No courses match that"
              description="Try another word or remove a filter."
              action={
                <Button asChild variant="secondary">
                  <Link href="/courses">See all courses</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {result.courses.map((c) => (
                <li key={c.id} className="py-1">
                  <CourseListItem course={c} />
                </li>
              ))}
            </ul>
          )}
          <CatalogPagination params={params} pages={result.pages} />
        </div>
      </div>
    </div>
  );
}
