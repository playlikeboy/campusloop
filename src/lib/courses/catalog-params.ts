import { COURSE_CATEGORIES } from "./format";

/**
 * Catalog state lives in the URL so every search, filter and page is linkable,
 * crawlable and survives refresh/back:
 *   /courses?q=python&level=beginner&duration=short&sort=rating&page=2
 *   /courses/category/web-development?source=cs50&page=3
 * Unknown or invalid values are dropped, never trusted.
 */

export const CATALOG_PAGE_SIZE = 20;

export const SORTS = {
  relevance: "Most relevant",
  popular: "Most popular",
  trending: "Trending",
  rating: "Highest rated",
  newest: "Newest",
  shortest: "Shortest",
} as const;
export type CatalogSort = keyof typeof SORTS;

export const LEVELS = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", all: "All levels" } as const;
export const DURATIONS = { short: "Under 3 hours", medium: "3 to 10 hours", long: "10+ hours" } as const;
export const SOURCES = { cs50: "Harvard CS50", community: "Community" } as const;

export type CatalogLevel = keyof typeof LEVELS;
export type CatalogDuration = keyof typeof DURATIONS;
export type CatalogSource = keyof typeof SOURCES;

export interface CatalogParams {
  q: string;
  category: string | null; // display name, e.g. "Web Development"
  level: CatalogLevel | null;
  duration: CatalogDuration | null;
  source: CatalogSource | null;
  sort: CatalogSort;
  page: number;
}

export function categorySlug(name: string): string {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function categoryFromSlug(slug: string): string | null {
  return COURSE_CATEGORIES.find((c) => categorySlug(c) === slug.toLowerCase()) ?? null;
}

type Raw = Record<string, string | string[] | undefined> | URLSearchParams;

function pick(raw: Raw, key: string): string {
  const v = raw instanceof URLSearchParams ? raw.get(key) : raw[key];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

function oneOf<T extends string>(value: string, options: Record<T, string>): T | null {
  const v = value.toLowerCase();
  return v in options ? (v as T) : null;
}

export function parseCatalogParams(raw: Raw, fixedCategory?: string | null): CatalogParams {
  const q = pick(raw, "q").slice(0, 100);
  const cat = pick(raw, "category");
  const category = fixedCategory ?? (cat ? (categoryFromSlug(cat) ?? COURSE_CATEGORIES.find((c) => c === cat) ?? null) : null);
  const sort = oneOf(pick(raw, "sort"), SORTS) ?? (q ? "relevance" : "popular");
  const page = Math.min(500, Math.max(1, Number.parseInt(pick(raw, "page"), 10) || 1));
  return {
    q,
    category,
    level: oneOf(pick(raw, "level"), LEVELS),
    duration: oneOf(pick(raw, "duration"), DURATIONS),
    source: oneOf(pick(raw, "source"), SOURCES),
    sort: sort === "relevance" && !q ? "popular" : sort,
    page,
  };
}

/** True when nothing narrows the catalog, so the browse home can render. */
export function isBrowseHome(p: CatalogParams): boolean {
  return !p.q && !p.category && !p.level && !p.duration && !p.source && p.sort === "popular" && p.page === 1;
}

/**
 * Builds a catalog URL from the current state plus overrides. Any change other
 * than `page` resets to page 1. Defaults are omitted to keep URLs canonical.
 */
export function catalogHref(p: CatalogParams, over: Partial<CatalogParams> = {}): string {
  const next = { ...p, ...over };
  if (!("page" in over)) next.page = 1;
  if (!next.q && next.sort === "relevance") next.sort = "popular";
  const base = next.category ? `/courses/category/${categorySlug(next.category)}` : "/courses";
  const qs = new URLSearchParams();
  if (next.q) qs.set("q", next.q);
  if (next.level) qs.set("level", next.level);
  if (next.duration) qs.set("duration", next.duration);
  if (next.source) qs.set("source", next.source);
  if (next.sort !== (next.q ? "relevance" : "popular")) qs.set("sort", next.sort);
  if (next.page > 1) qs.set("page", String(next.page));
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

/** Page numbers with gaps, e.g. [1, "gap", 4, 5, 6, "gap", 12]. */
export function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) out.push("gap");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < total - 1) out.push("gap");
  out.push(total);
  return out;
}
