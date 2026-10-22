"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

/** Phone-only bottom sheet that hosts the filter panel. Closes after any filter navigation. */
export function FilterSheet({ active, total, children }: { active: number; total: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => setOpen(false), [pathname, search]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-muted/70 px-4 text-sm font-semibold text-foreground hover:bg-muted lg:hidden cursor-pointer"
      >
        <SlidersHorizontal className="size-4" aria-hidden /> Filters
        {active > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{active}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filter courses">
          <button type="button" aria-label="Close filters" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in" />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl bg-background shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted" aria-hidden />
            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <p className="text-lg font-bold text-foreground">Filters</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="flex size-10 items-center justify-center rounded-full hover:bg-muted cursor-pointer">
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
            <div className="border-t border-border/50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => setOpen(false)} className="h-12 w-full rounded-2xl bg-foreground text-sm font-bold text-background cursor-pointer">
                Show {total.toLocaleString("en-IN")} result{total === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
