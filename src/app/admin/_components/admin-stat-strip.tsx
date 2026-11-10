import Link from "next/link";
import { cn } from "@/lib/utils";

export interface AdminStat {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  href?: string;
}

/** One calm row of totals for admin pages. Real counts only, no icons or accent colours. */
export function AdminStatStrip({ items, className }: { items: AdminStat[]; className?: string }) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border",
        items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "sm:grid-cols-3" : "",
        className
      )}
    >
      {items.map((item) => {
        const body = (
          <>
            <span className="block text-sm text-fg-muted">{item.label}</span>
            <span className="mt-1 block font-sans text-xl font-semibold tabular-nums text-fg">
              {item.value}
            </span>
            {item.note && <span className="block text-xs text-fg-muted">{item.note}</span>}
          </>
        );
        return (
          <li key={item.label} className="bg-surface">
            {item.href ? (
              <Link
                href={item.href}
                className="block h-full p-4 transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                {body}
              </Link>
            ) : (
              <div className="p-4">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
