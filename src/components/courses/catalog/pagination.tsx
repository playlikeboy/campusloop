import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { type CatalogParams, catalogHref, pageWindow } from "@/lib/courses/catalog-params";
import { cn } from "@/lib/utils";

/** Crawlable numbered pagination. Phones get Prev / "x of y" / Next. */
export function CatalogPagination({ params, pages }: { params: CatalogParams; pages: number }) {
  if (pages <= 1) return null;
  const { page } = params;
  const href = (n: number) => catalogHref(params, { page: n });
  const step = "flex h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold";
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={cn(step, "bg-muted/60 text-foreground hover:bg-muted")}><ChevronLeft className="size-4" aria-hidden />Prev</Link>
      ) : (
        <span className={cn(step, "text-muted-foreground/60")} aria-disabled><ChevronLeft className="size-4" aria-hidden />Prev</span>
      )}
      <ol className="hidden items-center gap-1 sm:flex">
        {pageWindow(page, pages).map((n, i) =>
          n === "gap" ? (
            <li key={`g${i}`} className="px-1 text-muted-foreground" aria-hidden>…</li>
          ) : (
            <li key={n}>
              <Link
                href={href(n)}
                aria-current={n === page ? "page" : undefined}
                className={cn("flex size-10 items-center justify-center rounded-full text-sm font-semibold tabular-nums", n === page ? "bg-foreground text-background" : "text-foreground hover:bg-muted")}
              >
                {n}
              </Link>
            </li>
          )
        )}
      </ol>
      <span className="px-2 text-sm tabular-nums text-muted-foreground sm:hidden">Page {page} of {pages}</span>
      {page < pages ? (
        <Link href={href(page + 1)} rel="next" className={cn(step, "bg-muted/60 text-foreground hover:bg-muted")}>Next<ChevronRight className="size-4" aria-hidden /></Link>
      ) : (
        <span className={cn(step, "text-muted-foreground/60")} aria-disabled>Next<ChevronRight className="size-4" aria-hidden /></span>
      )}
    </nav>
  );
}
