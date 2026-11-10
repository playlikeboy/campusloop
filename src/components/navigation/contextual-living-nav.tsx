"use client";

import { Building2, Car, LayoutGrid, Map as MapIcon, PackageSearch, Plus, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isPathActive, navPress } from "@/components/shells/nav-utils";
import { ROUTES } from "@/constants/navigation";
import { cn } from "@/lib/utils";

interface LivingNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  createHref?: string;
  createLabel?: string;
}

const LIVING_TABS: LivingNavItem[] = [
  { href: ROUTES.living, label: "All", icon: LayoutGrid },
  {
    href: ROUTES.buySell,
    label: "Buy and sell",
    icon: Tag,
    createHref: "/buy-and-sell/new",
    createLabel: "Sell something",
  },
  {
    href: ROUTES.housing,
    label: "Housing",
    icon: Building2,
    createHref: "/housing/new",
    createLabel: "List a room",
  },
  {
    href: ROUTES.lostFound,
    label: "Lost and found",
    icon: PackageSearch,
    createHref: "/lost-and-found/new",
    createLabel: "Report an item",
  },
  {
    href: ROUTES.rideshare,
    label: "Ride share",
    icon: Car,
    createHref: "/rideshare/new",
    createLabel: "Offer a ride",
  },
  { href: ROUTES.atlas, label: "Campus Atlas", icon: MapIcon },
];

/** Sub-navigation for the campus living utilities, with the matching "create" button. */
export function ContextualLivingNav() {
  const pathname = usePathname() || ROUTES.living;
  const currentTab = LIVING_TABS.find((tab) => isPathActive(pathname, tab.href));

  return (
    <div className="sticky top-14 z-20 border-b border-border bg-surface px-3 py-1.5 select-none sm:px-6 lg:top-16">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <nav aria-label="Campus living" className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
          {LIVING_TABS.map((tab) => {
            const active = isPathActive(pathname, tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={navPress}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-brand text-brand-fg" : "text-fg-muted hover:bg-surface-muted hover:text-fg"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {currentTab?.createHref && (
          <Link
            href={currentTab.createHref}
            onClick={navPress}
            className="hidden h-11 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-brand-fg transition-ui hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] sm:inline-flex"
          >
            <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
            <span>{currentTab.createLabel}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
