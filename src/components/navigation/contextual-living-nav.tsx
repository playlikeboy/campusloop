"use client";

import {
  Building2,
  Car,
  Home,
  MapPin,
  PackageSearch,
  Plus,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface LivingNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  createHref?: string;
  createLabel?: string;
}

const LIVING_TABS: LivingNavItem[] = [
  {
    href: "/campus",
    label: "Overview",
    icon: Sparkles,
  },
  {
    href: "/buy-and-sell",
    label: "Buy & Sell",
    icon: ShoppingBag,
    createHref: "/buy-and-sell/new",
    createLabel: "+ Sell Item",
  },
  {
    href: "/housing",
    label: "Housing & Flats",
    icon: Building2,
    createHref: "/housing/new",
    createLabel: "+ List Room",
  },
  {
    href: "/lost-and-found",
    label: "Lost & Found",
    icon: PackageSearch,
    createHref: "/lost-and-found/new",
    createLabel: "+ Report Item",
  },
  {
    href: "/rideshare",
    label: "Ride Share",
    icon: Car,
    createHref: "/rideshare/new",
    createLabel: "+ Offer Ride",
  },
  {
    href: "/atlas",
    label: "Campus Atlas",
    icon: MapPin,
  },
];

export function ContextualLivingNav() {
  const pathname = usePathname() || "/campus";

  const currentTab = LIVING_TABS.find((tab) =>
    tab.href === "/campus"
      ? pathname === "/campus" || pathname === "/living" || pathname === "/utilities"
      : pathname === tab.href || pathname.startsWith(tab.href + "/")
  );

  return (
    <div className="sticky top-14 sm:top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:px-6 select-none">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        {/* Horizontal scrollable navigation pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {LIVING_TABS.map((tab) => {
            const isActive =
              tab.href === "/campus"
                ? pathname === "/campus" || pathname === "/living" || pathname === "/utilities"
                : pathname === tab.href || pathname.startsWith(tab.href + "/");

            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 border",
                  isActive
                    ? "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary-soft-border)] font-semibold shadow-2xs"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)] bg-[var(--surface)] border-[var(--border)]"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Dynamic Contextual Create CTA */}
        {currentTab?.createHref && (
          <Link
            href={currentTab.createHref}
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-xs active:scale-[0.98] shrink-0"
          >
            <Plus className="size-3.5" />
            <span>{currentTab.createLabel || "+ New"}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
