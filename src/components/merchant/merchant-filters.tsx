"use client";

import { Search } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { fieldClassName, Input } from "@/components/ui/input";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export type FilterTab<T extends string> = { id: T; label: string };

/** Scrollable row of filter chips with optional counts. */
export function FilterChips<T extends string>({
  tabs,
  value,
  onChange,
  counts,
  label,
}: {
  tabs: readonly FilterTab<T>[];
  value: T;
  onChange: (id: T) => void;
  counts?: Partial<Record<T, number>>;
  label: string;
}) {
  return (
    <fieldset className="no-scrollbar -mx-4 flex min-w-0 gap-2 overflow-x-auto border-0 px-4 sm:mx-0 sm:px-0">
      <legend className="sr-only">{label}</legend>
      {tabs.map((tab) => (
        <Chip
          key={tab.id}
          selected={value === tab.id}
          count={counts?.[tab.id]}
          onClick={() => {
            sounds.tap();
            haptics.light();
            onChange(tab.id);
          }}
        >
          {tab.label}
        </Chip>
      ))}
    </fieldset>
  );
}

/** Search input with a leading icon and a real label for screen readers. */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
      />
      <Input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );
}

/** Native select in the shared field style (best on low-end Android). */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(fieldClassName, "h-11 cursor-pointer pr-8", className)} {...props} />;
}
