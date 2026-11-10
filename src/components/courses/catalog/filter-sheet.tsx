"use client";

import { SlidersHorizontal } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Phone-only bottom sheet that holds the filter panel. Closes after any filter change. */
export function FilterSheet({
  active,
  total,
  children,
}: {
  active: number;
  total: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => setOpen(false), [pathname, search]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="lg:hidden">
          <SlidersHorizontal aria-hidden /> Filters
          {active > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-brand text-xs font-bold tabular-nums text-brand-fg">
              <span className="sr-only">, </span>
              {active}
              <span className="sr-only"> on</span>
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <SheetBody>{children}</SheetBody>
        <SheetFooter>
          <Button size="lg" className="w-full" onClick={() => setOpen(false)}>
            Show {total.toLocaleString("en-IN")} course{total === 1 ? "" : "s"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
