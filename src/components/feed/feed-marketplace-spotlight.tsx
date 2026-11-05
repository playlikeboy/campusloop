"use client";

import {
  ArrowRight,
  Bike,
  BookOpen,
  Compass,
  Laptop,
  MapPin,
  ShoppingBag,
  Tag,
  Wind,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
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
  const { data } = useSWR<{ items: MarketplaceItem[] }>(
    "/api/marketplace/spotlight",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <section className={cn("py-4", className)} aria-label="Campus Marketplace Highlights">
      <div className="mb-3 flex items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-success/10 text-success">
            <ShoppingBag className="size-3.5" aria-hidden />
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate text-sm font-bold text-foreground">Campus Buy &amp; Sell</h3>
            <span className="hidden sm:inline-block rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
              Verified Students
            </span>
          </div>
        </div>

        <Link
          href="/buy-and-sell"
          className="inline-flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
        >
          View all items <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4">
        {items.map((item) => {
          const Icon = getCategoryIcon(item.category);
          return (
            <Link
              key={item.id}
              href={`/buy-and-sell?q=${encodeURIComponent(item.title)}`}
              className="group flex w-[230px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl bg-card/75 border border-border/40 shadow-2xs transition-colors hover:border-primary/40 hover:shadow-md"
            >
              {/* Image / Fallback Header */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/60">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-success/10 text-success">
                    <Icon className="size-8" aria-hidden />
                  </div>
                )}
                <span className="absolute left-2.5 top-2.5 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-bold text-foreground backdrop-blur-xs">
                  {item.category}
                </span>
                {item.condition && (
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    {item.condition.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col justify-between p-3">
                <div>
                  <h4 className="line-clamp-2 text-xs font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  {item.hostelLocation && (
                    <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      <MapPin className="size-3 shrink-0" aria-hidden />
                      <span className="truncate">{item.hostelLocation}</span>
                    </p>
                  )}
                </div>

                <div className="mt-2.5 flex items-baseline justify-between border-t border-border/30 pt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-extrabold text-foreground">
                      ₹{item.price.toLocaleString("en-IN")}
                    </span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-[10px] text-muted-foreground line-through">
                        ₹{item.originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-primary group-hover:underline">
                    View →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
