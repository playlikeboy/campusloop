"use client";

import { Bike, BookOpen, Compass, Laptop, MapPin, Tag, Wind } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { FeedSpotlightHeader } from "@/components/feed/feed-spotlight-header";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";

interface MarketplaceItem {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  category: string;
  condition: string;
  hostelLocation: string | null;
  imageUrl: string | null;
  institution?: { name: string } | null;
}

function getCategoryIcon(category: string) {
  const cat = String(category || "").toLowerCase();
  if (cat.includes("cycle") || cat.includes("bike")) return Bike;
  if (cat.includes("textbook") || cat.includes("book")) return BookOpen;
  if (cat.includes("cooler") || cat.includes("fan")) return Wind;
  if (cat.includes("electronic") || cat.includes("laptop")) return Laptop;
  if (cat.includes("coat") || cat.includes("drafter") || cat.includes("tool")) return Compass;
  return Tag;
}

export function FeedMarketplaceSpotlight({ className }: { className?: string }) {
  const { data } = useSWR<{ items: MarketplaceItem[] }>("/api/marketplace/spotlight", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <section className={cn("py-4", className)} aria-labelledby="feed-market-title">
      <FeedSpotlightHeader id="feed-market-title" title="For sale near you" href="/buy-and-sell" />

      <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4">
        {items.map((item) => {
          const Icon = getCategoryIcon(item.category);
          return (
            <Link
              key={item.id}
              href={`/buy-and-sell?q=${encodeURIComponent(item.title)}`}
              className="group flex w-[230px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-lg bg-surface border border-border transition-ui hover:border-border-strong"
            >
              {/* Image / Fallback Header */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-fg-subtle">
                    <Icon className="size-8" aria-hidden />
                  </div>
                )}
                <span className="absolute left-2.5 top-2.5 rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-fg">
                  {item.category}
                </span>
                {item.condition && (
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-fg-muted capitalize">
                    {item.condition.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col justify-between p-3">
                <div>
                  <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-fg group-hover:text-brand-text transition-ui">
                    {item.title}
                  </h4>
                  {item.hostelLocation && (
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" aria-hidden />
                      <span className="truncate">{item.hostelLocation}</span>
                    </p>
                  )}
                </div>

                <div className="mt-2.5 flex items-baseline justify-between border-t border-border pt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-fg tabular-nums">
                      ₹{item.price.toLocaleString("en-IN")}
                    </span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{item.originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
