"use client";

import {
  Bike,
  Droplet,
  Receipt,
  Scissors,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMarketplaceCart } from "@/hooks/use-marketplace-cart";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export const MARKETPLACE_SECTIONS = [
  { href: "/marketplace", label: "All", icon: Store, exact: true },
  { href: "/marketplace/food", label: "Food", icon: UtensilsCrossed },
  { href: "/marketplace/supermarket", label: "Mart", icon: ShoppingBag },
  { href: "/marketplace/rentals", label: "Bike rentals", icon: Bike },
  { href: "/marketplace/barber", label: "Barber", icon: Scissors },
  { href: "/marketplace/laundry", label: "Laundry", icon: Shirt },
  { href: "/marketplace/water", label: "Water", icon: Droplet },
] as const;

function press() {
  sounds.tap();
  haptics.light();
}

function isOrdersPath(p: string) {
  return p.startsWith("/marketplace/orders") || p.startsWith("/marketplace/order/");
}

/** Section tabs for the marketplace, shown under the app top bar. Cart and orders sit at the end. */
export function MarketplaceSubNav() {
  const pathname = usePathname() || "/marketplace";
  const { totalItemsCount } = useMarketplaceCart();
  const cartActive = pathname.startsWith("/marketplace/cart") || pathname.startsWith("/marketplace/checkout");
  const ordersActive = isOrdersPath(pathname);

  return (
    <div className="mb-4 border-b border-border">
      <div className="flex items-center gap-2">
        <nav
          aria-label="Marketplace sections"
          className="no-scrollbar -mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto"
        >
          {MARKETPLACE_SECTIONS.map((s) => {
            const Icon = s.icon;
            const active =
              "exact" in s ? pathname === s.href : pathname.startsWith(s.href) && !isOrdersPath(pathname);
            return (
              <Link
                key={s.href}
                href={s.href}
                onClick={press}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-brand text-brand-text" : "border-transparent text-fg-muted hover:text-fg"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{s.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-1 pb-1">
          <Link
            href="/marketplace/orders"
            onClick={press}
            aria-current={ordersActive ? "page" : undefined}
            aria-label="Orders"
            className={cn(
              "flex size-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:gap-1.5 sm:px-3",
              ordersActive
                ? "bg-brand-subtle text-brand-text"
                : "text-fg-muted hover:bg-surface-muted hover:text-fg"
            )}
          >
            <Receipt className="size-4" aria-hidden="true" />
            <span className="hidden text-sm font-medium sm:inline">Orders</span>
          </Link>
          <Link
            href="/marketplace/cart"
            onClick={press}
            aria-current={cartActive ? "page" : undefined}
            aria-label={totalItemsCount > 0 ? `Cart, ${totalItemsCount} items` : "Cart"}
            className={cn(
              "relative flex size-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              cartActive
                ? "bg-brand-subtle text-brand-text"
                : "text-fg-muted hover:bg-surface-muted hover:text-fg"
            )}
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
            {totalItemsCount > 0 && (
              <span className="absolute top-1 right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold tabular-nums text-brand-fg">
                {totalItemsCount > 99 ? "99+" : totalItemsCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
