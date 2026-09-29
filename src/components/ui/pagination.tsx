"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  pageParam?: string;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  pageParam = "page",
  className,
}: PaginationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const safeTotal = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotal);

  const items = useMemo<(number | "ellipsis")[]>(() => {
    if (safeTotal <= 7) {
      return Array.from({ length: safeTotal }, (_, index) => index + 1);
    }
    if (safePage <= 4) return [1, 2, 3, 4, 5, "ellipsis", safeTotal];
    if (safePage >= safeTotal - 3) {
      return [1, "ellipsis", safeTotal - 4, safeTotal - 3, safeTotal - 2, safeTotal - 1, safeTotal];
    }
    return [1, "ellipsis", safePage - 1, safePage, safePage + 1, "ellipsis", safeTotal];
  }, [safePage, safeTotal]);

  function goTo(nextPage: number) {
    const target = Math.min(Math.max(1, nextPage), safeTotal);
    if (target === safePage) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set(pageParam, String(target));
    const query = params.toString();
    router.replace(query ? pathname + "?" + query : pathname, { scroll: true });
  }

  if (safeTotal <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1.5 sm:gap-2", className)}>
      <button
        type="button"
        onClick={() => goTo(safePage - 1)}
        disabled={safePage === 1}
        aria-label="Go to previous page"
        className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-card/70 px-2 text-muted-foreground shadow-2xs transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
      >
        <ChevronLeft className="size-4" />
      </button>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={"ellipsis-" + index}
            aria-hidden="true"
            className="inline-flex h-9 w-8 items-center justify-center text-muted-foreground"
          >
            <MoreHorizontal className="size-4" />
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => goTo(item)}
            aria-current={item === safePage ? "page" : undefined}
            aria-label={"Go to page " + item}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-bold transition",
              item === safePage
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card/70 text-muted-foreground shadow-2xs hover:bg-muted hover:text-foreground"
            )}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => goTo(safePage + 1)}
        disabled={safePage === safeTotal}
        aria-label="Go to next page"
        className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-card/70 px-2 text-muted-foreground shadow-2xs transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
