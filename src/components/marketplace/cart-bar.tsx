"use client";

import { ChevronRight, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface MarketplaceCartBarProps {
  count: number;
  total: number;
  href?: string;
  label?: string;
}

/** Floating "View cart" bar. Sits above the app bottom nav on phones. */
export function MarketplaceCartBar({
  count,
  total,
  href = "/marketplace/cart",
  label = "View cart",
}: MarketplaceCartBarProps) {
  if (count <= 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--nav-mobile-h)+env(safe-area-inset-bottom,0px)+0.75rem)] z-[var(--z-sticky-nav)] px-4 lg:bottom-6">
      <Link
        href={href}
        onClick={() => {
          sounds.tap();
          haptics.light();
        }}
        className="sticker-pop pointer-events-auto mx-auto flex min-h-13 max-w-lg items-center justify-between gap-3 rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg shadow-sticker-lift transition-ui hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <span className="flex items-center gap-2 tabular-nums">
          <ShoppingCart className="size-4" aria-hidden="true" />
          {count} {count === 1 ? "item" : "items"} · ₹{total.toLocaleString("en-IN")}
        </span>
        <span className="flex items-center gap-1">
          {label}
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}
