"use client";

import { ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";

/** Sort dropdown; each option maps to a precomputed catalog URL. */
export function SortSelect({ value, options }: { value: string; options: { value: string; label: string; href: string }[] }) {
  const router = useRouter();
  return (
    <label className="relative inline-flex h-10 items-center gap-2 rounded-full bg-muted/70 pl-4 pr-3 text-sm font-semibold text-foreground hover:bg-muted">
      <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden />
      <span className="sr-only">Sort by</span>
      <select
        value={value}
        onChange={(e) => {
          const next = options.find((o) => o.value === e.target.value);
          if (next) router.push(next.href, { scroll: false });
        }}
        className="appearance-none bg-transparent pr-1 focus-visible:outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
