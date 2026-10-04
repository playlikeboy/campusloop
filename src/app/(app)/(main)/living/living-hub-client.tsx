"use client";

import {
  ArrowRight,
  Bike,
  Car,
  Compass,
  Home,
  Loader2,
  PackageSearch,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { ContextualLivingNav } from "@/components/navigation/contextual-living-nav";
import { HousingCard } from "@/components/communities/housing-card";
import { LostFoundCard } from "@/components/communities/lost-found-card";
import { MarketplaceCard } from "@/components/communities/marketplace-card";
import { RideshareCard } from "@/components/communities/rideshare-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  profileId: string;
  userInstitution?: string | null;
}

type TabType = "marketplace" | "housing" | "lost_found" | "rideshare";

interface FeedResponse {
  items: any[];
  page: number;
  total: number;
  totalPages: number;
}

const CATEGORIES = [
  {
    id: "marketplace",
    title: "Buy & Sell",
    subtitle: "Campus marketplace",
    description: "Bicycles, coolers, drafters, mattresses & textbooks from verified peers.",
    href: "/buy-and-sell",
    createHref: "/buy-and-sell/new",
    actionLabel: "Sell Item",
    icon: ShoppingBag,
    color: "emerald",
    accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    gradient: "from-emerald-500/10 via-transparent to-transparent",
  },
  {
    id: "housing",
    title: "Housing & PGs",
    subtitle: "Rooms & Flatmates",
    description: "Verified student apartments, shared flats, and verified roommates near campus.",
    href: "/housing",
    createHref: "/housing/new",
    actionLabel: "List Room",
    icon: Home,
    color: "amber",
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    gradient: "from-amber-500/10 via-transparent to-transparent",
  },
  {
    id: "lost_found",
    title: "Lost & Found",
    subtitle: "Campus recovery",
    description: "Report lost student IDs, keys, earphones, and safely return found items.",
    href: "/lost-and-found",
    createHref: "/lost-and-found/new",
    actionLabel: "Report Item",
    icon: PackageSearch,
    color: "rose",
    accent: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    gradient: "from-rose-500/10 via-transparent to-transparent",
  },
  {
    id: "rideshare",
    title: "Ride Share",
    subtitle: "Station & Airport pool",
    description: "Split cab and auto fares to railway stations and airport with batchmates.",
    href: "/rideshare",
    createHref: "/rideshare/new",
    actionLabel: "Offer Ride",
    icon: Car,
    color: "sky",
    accent: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    gradient: "from-sky-500/10 via-transparent to-transparent",
  },
  {
    id: "atlas",
    title: "Campus Atlas",
    subtitle: "Campus intelligence",
    description: "Locate buildings, food spots, departments, open labs, and study zones.",
    href: "/atlas",
    createHref: "/atlas",
    actionLabel: "Explore Atlas",
    icon: Compass,
    color: "purple",
    accent: "bg-primary/10 text-primary border-primary/20",
    gradient: "from-primary/10 via-transparent to-transparent",
  },
] as const;

export function LivingHubClient({ profileId }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("marketplace");

  const { data, isLoading } = useSWR<FeedResponse>(
    `/api/communities/feed?tab=${activeTab}&limit=8&page=1`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const items = (data?.items || []).filter((item) => item.data);

  return (
    <div className="min-h-screen pb-24">
      <ContextualLivingNav />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8 space-y-8">
        {/* Hub Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              Verified Student Utilities
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl text-foreground">
              Living &amp; Utilities
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything you need around campus — marketplace, housing, recovery, and rides.
            </p>
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="gap-1.5 font-bold">
              <Link href="/buy-and-sell/new">
                <Plus className="size-4" />
                Sell Something
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5 font-bold">
              <Link href="/housing/new">
                <Plus className="size-4" />
                List Room
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5 font-bold">
              <Link href="/lost-and-found/new">
                <Plus className="size-4" />
                Report Lost
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5 font-bold">
              <Link href="/rideshare/new">
                <Plus className="size-4" />
                Offer Ride
              </Link>
            </Button>
          </div>
        </div>

        {/* Feature Category Grid */}
        <section aria-labelledby="utility-services">
          <h2 id="utility-services" className="sr-only">
            Utility Services
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Card
                  key={cat.id}
                  className="group relative flex flex-col justify-between overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-24 bg-gradient-to-b opacity-40 transition group-hover:opacity-70",
                      cat.gradient
                    )}
                  />
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "flex size-11 items-center justify-center rounded-xl border shadow-2xs",
                          cat.accent
                        )}
                      >
                        <Icon className="size-5.5" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {cat.subtitle}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {cat.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-5 flex items-center justify-between border-t border-border/40 pt-3">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="gap-1 px-2 text-xs font-bold text-foreground group-hover:text-primary"
                    >
                      <Link href={cat.href}>
                        Explore
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold">
                      <Link href={cat.createHref}>{cat.actionLabel}</Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Live Activity Stream */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Recent Campus Activity
              </h2>
              <p className="text-xs text-muted-foreground">
                Live listings and requests from verified students at your campus
              </p>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(
                [
                  { id: "marketplace", label: "Buy & Sell", icon: ShoppingBag },
                  { id: "housing", label: "Housing", icon: Home },
                  { id: "lost_found", label: "Lost & Found", icon: PackageSearch },
                  { id: "rideshare", label: "Ride Share", icon: Car },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition",
                      isSelected
                        ? "bg-foreground text-background shadow-xs"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Cards List */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  if (activeTab === "marketplace") {
                    return (
                      <Card key={item.data.id} className="overflow-hidden">
                        <MarketplaceCard item={item.data} currentUserId={profileId} />
                      </Card>
                    );
                  }
                  if (activeTab === "housing") {
                    return (
                      <Card key={item.data.id} className="overflow-hidden">
                        <HousingCard item={item.data} currentUserId={profileId} />
                      </Card>
                    );
                  }
                  if (activeTab === "lost_found") {
                    return (
                      <Card key={item.data.id} className="overflow-hidden">
                        <LostFoundCard item={item.data} currentUserId={profileId} />
                      </Card>
                    );
                  }
                  if (activeTab === "rideshare") {
                    return (
                      <Card key={item.data.id} className="overflow-hidden">
                        <RideshareCard item={item.data} currentUserId={profileId} />
                      </Card>
                    );
                  }
                  return null;
                })}
              </div>

              <div className="flex justify-center pt-4">
                <Button asChild variant="outline" className="font-bold">
                  <Link
                    href={
                      activeTab === "marketplace"
                        ? "/buy-and-sell"
                        : activeTab === "housing"
                        ? "/housing"
                        : activeTab === "lost_found"
                        ? "/lost-and-found"
                        : "/rideshare"
                    }
                  >
                    View All {activeTab.replace("_", " ")}
                    <ArrowRight className="ml-1.5 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
                <ShieldCheck className="size-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">
                No active {activeTab.replace("_", " ")} items yet
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Be the first verified student to post in this category!
              </p>
              <Button asChild size="sm" className="mt-4 font-bold">
                <Link
                  href={
                    activeTab === "marketplace"
                      ? "/buy-and-sell/new"
                      : activeTab === "housing"
                      ? "/housing/new"
                      : activeTab === "lost_found"
                      ? "/lost-and-found/new"
                      : "/rideshare/new"
                  }
                >
                  Create Listing
                </Link>
              </Button>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
