import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getCategoryMeta } from "@/constants/articles";

export interface ArticleLinkItem {
  slug: string;
  title: string;
  excerpt?: string | null;
  subtitle?: string | null;
  category?: string | null;
  readingTimeMinutes?: number | null;
  publishedAt?: Date | string | null;
}

/** Plain, crawlable list of articles for hub pages (category and author pages). */
export function ArticleLinkList({ items, showCategory = true }: { items: ArticleLinkItem[]; showCategory?: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const date = item.publishedAt ? new Date(item.publishedAt) : null;
        const blurb = item.subtitle || item.excerpt;
        return (
          <li key={item.slug} className="py-4">
            <Link href={`/articles/${item.slug}`} className="group block space-y-1">
              <h3 className="text-lg text-fg group-hover:underline">{item.title}</h3>
              {blurb && <p className="line-clamp-2 text-sm text-fg-muted">{blurb}</p>}
              <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-fg-muted">
                {showCategory && <span>{getCategoryMeta(item.category).label}</span>}
                {showCategory && <span aria-hidden>·</span>}
                <span className="tabular-nums">{item.readingTimeMinutes || 3} min read</span>
                {date && !Number.isNaN(date.getTime()) && (
                  <>
                    <span aria-hidden>·</span>
                    <time dateTime={date.toISOString()}>
                      {date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </time>
                  </>
                )}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Previous / next links with real hrefs, so crawlers can walk every page. */
export function PageLinks({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const linkClass =
    "inline-flex h-11 items-center gap-1.5 rounded-full bg-surface-muted px-4 text-sm font-semibold text-fg transition-ui hover:bg-surface-sunken";
  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3 pt-4">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={linkClass}>
          <ChevronLeft className="size-4" aria-hidden />
          Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-fg-muted tabular-nums">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={linkClass}>
          Older
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
