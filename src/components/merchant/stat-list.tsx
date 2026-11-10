import type * as React from "react";
import { cn } from "@/lib/utils";

export type MerchantStat = {
  label: string;
  value: React.ReactNode;
  /** Highlights a number that needs attention (e.g. orders waiting). */
  attention?: boolean;
};

/** A quiet row of real store numbers inside one hairline box. Not a hero. */
export function StatList({ items, className }: { items: MerchantStat[]; className?: string }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-surface sm:grid-cols-4",
        className
      )}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            "space-y-0.5 border-border px-4 py-3",
            i % 2 === 1 && "border-l",
            i > 0 && "sm:border-l",
            i >= 2 && "border-t sm:border-t-0"
          )}
        >
          <dt className="text-sm text-fg-muted">{item.label}</dt>
          <dd
            className={cn("text-lg font-semibold tabular-nums", item.attention ? "text-warning" : "text-fg")}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
