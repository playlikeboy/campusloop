import { Tag } from "lucide-react";
import Link from "next/link";

export interface Deal {
  id: string;
  title: string;
  code?: string | null;
  storeId: string;
  storeName: string;
  storeLogo?: string | null;
}

/** Offers from stores, in one scrollable row. */
export function DealsRow({ deals }: { deals: Deal[] }) {
  return (
    <section aria-labelledby="deals-title" className="space-y-2">
      <h2 id="deals-title" className="font-sans text-base font-semibold text-fg">
        Offers
      </h2>
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {deals.map((deal) => (
          <li key={`${deal.storeId}-${deal.id}`} className="shrink-0">
            <Link
              href={`/marketplace/store/${deal.storeId}`}
              className="flex w-64 items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-surface-muted">
                {deal.storeLogo ? (
                  <img src={deal.storeLogo} alt="" className="size-full object-cover" loading="lazy" />
                ) : (
                  <Tag className="size-4 text-fg-muted" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{deal.title}</p>
                <p className="truncate text-xs text-fg-muted">
                  {deal.storeName}
                  {deal.code ? ` · Code ${deal.code}` : ""}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
