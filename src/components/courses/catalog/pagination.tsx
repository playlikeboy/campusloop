import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { type CatalogParams, catalogHref, pageWindow } from "@/lib/courses/catalog-params";
import { cn } from "@/lib/utils";

/** Crawlable numbered pagination. Phones get Previous / "Page x of y" / Next. */
export function CatalogPagination({ params, pages }: { params: CatalogParams; pages: number }) {
  if (pages <= 1) return null;
  const { page } = params;
  const href = (n: number) => catalogHref(params, { page: n });
  const step = "flex h-11 items-center gap-1 rounded-full px-4 text-sm font-semibold";
  const live = cn(
    step,
    "bg-surface-muted text-fg transition-ui hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  );
  const dead = cn(step, "text-fg-subtle");
  return (
    <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={live}>
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </Link>
      ) : (
        <span className={dead} aria-disabled>
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </span>
      )}
      <ol className="hidden items-center gap-1 sm:flex">
        {pageWindow(page, pages).map((n, i) =>
          n === "gap" ? (
            <li key={`g${i}`} className="px-1 text-fg-subtle" aria-hidden>
              ...
            </li>
          ) : (
            <li key={n}>
              <Link
                href={href(n)}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Page ${n}`}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  n === page ? "bg-brand-subtle text-brand-text" : "text-fg hover:bg-surface-muted"
                )}
              >
                {n}
              </Link>
            </li>
          )
        )}
      </ol>
      <span className="px-2 text-sm tabular-nums text-fg-muted sm:hidden">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} rel="next" className={live}>
          Next
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={dead} aria-disabled>
          Next
          <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
