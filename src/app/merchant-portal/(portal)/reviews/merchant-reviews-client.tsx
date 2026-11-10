"use client";

import { Star } from "lucide-react";
import useSWR from "swr";
import { LoadError } from "@/components/merchant/load-error";
import { MerchantListSkeleton, MerchantPage } from "@/components/merchant/merchant-page";
import { EmptyState } from "@/components/ui/empty-state";
import { fetcher } from "@/lib/api";

interface DashboardMetrics {
  metrics?: { rating?: number | null; reviewCount?: number | null };
}

/** Shows the store's real rating. The written reviews list needs its own API (see open issues). */
export function MerchantReviewsClient() {
  const { data, error, isLoading, mutate } = useSWR<DashboardMetrics>("/api/merchant/dashboard", fetcher);
  const rating = Number(data?.metrics?.rating ?? 0);
  const count = Number(data?.metrics?.reviewCount ?? 0);

  return (
    <MerchantPage width="narrow" title="Reviews" description="What students rate your store.">
      {isLoading ? (
        <MerchantListSkeleton rows={1} />
      ) : error ? (
        <LoadError what="your rating" onRetry={mutate} />
      ) : count > 0 ? (
        <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
          <p className="font-display text-4xl font-extrabold tabular-nums text-fg">{rating.toFixed(1)}</p>
          <div className="space-y-1">
            <div
              className="flex gap-0.5 text-fg"
              role="img"
              aria-label={`${rating.toFixed(1)} out of 5 stars`}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={n <= Math.round(rating) ? "size-4 fill-current" : "size-4"} />
              ))}
            </div>
            <p className="text-sm text-fg-muted">
              From {count} review{count === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      ) : (
        <EmptyState
          bordered
          icon={Star}
          title="No reviews yet"
          description="Students can rate your store after an order."
        />
      )}
    </MerchantPage>
  );
}
