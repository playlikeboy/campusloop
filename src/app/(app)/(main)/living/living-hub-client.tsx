"use client";

import {
  ArrowRight,
  Bike,
  Building2,
  Car,
  CheckCircle2,
  Compass,
  Home,
  Info,
  MapPin,
  PackageSearch,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
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
    subtitle: "Dorm Marketplace",
    badge: "ZERO COMMISSION",
    badgeStyle: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    description: "Pass on textbooks, room essentials, drafters, bicycles, and gadgets directly to another student.",
    href: "/buy-and-sell",
    createHref: "/buy-and-sell/new",
    actionLabel: "Sell an item",
    icon: ShoppingBag,
    iconSurface: "bg-[var(--cat-blue)]/55 text-primary",
    wash: "from-[var(--cat-blue)]/40 via-transparent to-transparent",
    stats: "Books, Cycles & Essentials",
  },
  {
    id: "housing",
    title: "Housing & PGs",
    subtitle: "Rooms & Flatmates",
    badge: "NO BROKERAGE",
    badgeStyle: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    description: "Explore verified room listings, shared apartments, and compatible roommate options near campus.",
    href: "/housing",
    createHref: "/housing/new",
    actionLabel: "List a room",
    icon: Home,
    iconSurface: "bg-[var(--cat-yellow)]/65 text-foreground",
    wash: "from-[var(--cat-yellow)]/45 via-transparent to-transparent",
    stats: "PGs, Flats & Roommates",
  },
  {
    id: "lost_found",
    title: "Lost & Found",
    subtitle: "Campus Recovery Hub",
    badge: "RECOVERY",
    badgeStyle: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    description: "Post a misplaced student ID, keys, or earbuds and help classmates safely recover important items.",
    href: "/lost-and-found",
    createHref: "/lost-and-found/new",
    actionLabel: "Report an item",
    icon: PackageSearch,
    iconSurface: "bg-[var(--cat-pink)]/55 text-foreground",
    wash: "from-[var(--cat-pink)]/40 via-transparent to-transparent",
    stats: "IDs, Keys, Bags & Tech",
  },
  {
    id: "rideshare",
    title: "Ride Share",
    subtitle: "Cab & Travel Pool",
    badge: "SPLIT FARES",
    badgeStyle: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    description: "Find or offer shared cab rides for railway stations, airports, weekend trips, and daily commutes.",
    href: "/rideshare",
    createHref: "/rideshare/new",
    actionLabel: "Offer a ride",
    icon: Car,
    iconSurface: "bg-[var(--success-soft)] text-[var(--success)]",
    wash: "from-[var(--success-soft)] via-transparent to-transparent",
    stats: "Airport & Station Cabs",
  },
  {
    id: "atlas",
    title: "Campus Atlas",
    subtitle: "Reasoning Directory",
    badge: "SANITY AGENT",
    badgeStyle: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    description: "Explore places around campus: departments, lecture halls, faculty offices, clubs, and quiet study spots.",
    href: "/atlas",
    createHref: "/atlas",
    actionLabel: "Explore Atlas",
    icon: Compass,
    iconSurface: "bg-primary/10 text-primary",
    wash: "from-primary/10 via-transparent to-transparent",
    stats: "Departments & Clubs",
  },
] as const;

const ACTIVITY_TABS: { id: TabType; label: string; icon: typeof ShoppingBag; createHref: string }[] = [
  { id: "marketplace", label: "Buy & Sell", icon: ShoppingBag, createHref: "/buy-and-sell/new" },
  { id: "housing", label: "Housing & Flats", icon: Home, createHref: "/housing/new" },
  { id: "lost_found", label: "Lost & Found", icon: PackageSearch, createHref: "/lost-and-found/new" },
  { id: "rideshare", label: "Ride Share", icon: Car, createHref: "/rideshare/new" },
];

export function LivingHubClient({ profileId }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("marketplace");
  const { data, isLoading, error, mutate } = useSWR<FeedResponse>(
    `/api/communities/feed?tab=${activeTab}&limit=8&page=1`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const items = (data?.items || []).filter((item) => item.data);
  const activeTabInfo = ACTIVITY_TABS.find((tab) => tab.id === activeTab) || ACTIVITY_TABS[0];

  return (
    <div className="min-h-screen overflow-x-clip bg-background pb-24 text-foreground">
      {/* Contextual top sub-navigation bar */}
      <ContextualLivingNav />

      <main className="relative isolate mx-auto max-w-6xl space-y-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* ─── Modernized Hero Banner ─── */}
        <section className="relative overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-sm sm:rounded-[32px]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-16 -top-20 size-72 rounded-full bg-[var(--cat-blue)]/40 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-[var(--cat-pink)]/30 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.16]" />
          </div>

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10 lg:p-10">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--success)]/20 bg-[var(--success-soft)] px-3 py-1.5 text-xs font-bold text-[var(--success)] shadow-2xs">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                <span>Verified Campus Living &amp; Services</span>
              </div>

              <h1 className="font-heading text-3xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
                Campus life, made simpler and safer.
              </h1>

              <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Everything around college in one place: find student-verified housing without brokers, split cab fares to airports, pass on textbooks and cycles, or return lost belongings.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <Button asChild className="min-h-11 rounded-full px-5 font-bold shadow-sm">
                  <Link href="#campus-services">
                    Explore Services <ArrowRight className="ml-1.5 size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="min-h-11 rounded-full border-border/80 bg-card/80 px-5 font-bold">
                  <Link href="/buy-and-sell/new">
                    <Plus className="mr-1.5 size-4" aria-hidden="true" />
                    Create a Listing
                  </Link>
                </Button>
              </div>

              {/* Value Highlights */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[var(--success)]" aria-hidden="true" />
                  Zero broker commissions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[var(--success)]" aria-hidden="true" />
                  100% Verified students
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[var(--success)]" aria-hidden="true" />
                  Safe hand-to-hand campus handoffs
                </span>
              </div>
            </div>

            {/* Quick Service Jump Widget */}
            <div className="mx-auto w-full max-w-md">
              <div className="rounded-[24px] border border-border/60 bg-background/90 p-4 shadow-sm backdrop-blur-sm sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Quick Shortcuts</p>
                    <p className="text-sm font-extrabold text-foreground">Jump directly to a space</p>
                  </div>
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="size-4.5" aria-hidden="true" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/housing"
                    className="group rounded-2xl border border-border/50 bg-card p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-8.5 items-center justify-center rounded-xl bg-[var(--cat-yellow)]/65 text-foreground">
                      <Home className="size-4" aria-hidden="true" />
                    </span>
                    <span className="mt-2.5 block text-xs font-extrabold text-foreground">Find a Room</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">Housing &amp; PGs</span>
                  </Link>

                  <Link
                    href="/lost-and-found"
                    className="group rounded-2xl border border-border/50 bg-card p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-8.5 items-center justify-center rounded-xl bg-[var(--cat-pink)]/55 text-foreground">
                      <PackageSearch className="size-4" aria-hidden="true" />
                    </span>
                    <span className="mt-2.5 block text-xs font-extrabold text-foreground">Lost &amp; Found</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">Report or return items</span>
                  </Link>

                  <Link
                    href="/rideshare"
                    className="group rounded-2xl border border-border/50 bg-card p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-8.5 items-center justify-center rounded-xl bg-[var(--success-soft)] text-[var(--success)]">
                      <Car className="size-4" aria-hidden="true" />
                    </span>
                    <span className="mt-2.5 block text-xs font-extrabold text-foreground">Ride Share</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">Split station/airport cabs</span>
                  </Link>

                  <Link
                    href="/buy-and-sell"
                    className="group rounded-2xl border border-border/50 bg-card p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-8.5 items-center justify-center rounded-xl bg-[var(--cat-blue)]/55 text-primary">
                      <ShoppingBag className="size-4" aria-hidden="true" />
                    </span>
                    <span className="mt-2.5 block text-xs font-extrabold text-foreground">Buy &amp; Sell</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">Dorm essentials &amp; books</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 5 Core Campus Services ─── */}
        <section id="campus-services" aria-labelledby="campus-services-heading" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">Living Hubs</p>
              <h2 id="campus-services-heading" className="mt-1 font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Essential Campus Services
              </h2>
              <p className="mt-1 max-w-2xl text-xs sm:text-sm leading-6 text-muted-foreground">
                Verified spaces tailored for campus daily life. Choose what you need today to browse listings or contribute.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.id}
                  className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border-border/60 bg-card p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-5"
                >
                  <div aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b opacity-60", category.wash)} />
                  <div className="relative flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/30 shadow-2xs", category.iconSurface)}>
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0", category.badgeStyle)}>
                        {category.badge}
                      </span>
                    </div>

                    <div className="mt-3.5 space-y-1">
                      <h3 className="font-heading text-base font-extrabold text-foreground transition-colors group-hover:text-primary">
                        {category.title}
                      </h3>
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        {category.stats}
                      </p>
                      <p className="pt-1 text-xs leading-relaxed text-muted-foreground min-h-12">
                        {category.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
                      <Button asChild variant="ghost" size="sm" className="min-h-9 gap-1 px-2 text-xs font-bold text-foreground group-hover:text-primary cursor-pointer">
                        <Link href={category.href}>
                          Browse <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="min-h-9 rounded-full border-border/80 bg-card/80 px-3 text-[11px] font-bold cursor-pointer">
                        <Link href={category.createHref}>{category.actionLabel}</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ─── Recent Activity Feed ─── */}
        <section id="recent-activity" aria-labelledby="recent-activity-heading" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col gap-4 border-b border-border/50 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--success)]">
                <span className="size-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" />
                Live Campus Stream
              </div>
              <h2 id="recent-activity-heading" className="mt-1 font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Recent Campus Activity
              </h2>
              <p className="mt-1 text-xs sm:text-sm leading-6 text-muted-foreground">
                Fresh listings, roommate requests, and ride shares posted by students.
              </p>
            </div>

            <div role="tablist" aria-label="Campus activity category" className="flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-border/50 bg-muted/60 p-1 no-scrollbar">
              {ACTIVITY_TABS.map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`campus-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`campus-activity-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                      selected ? "bg-card text-primary shadow-xs ring-1 ring-border/60" : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div id={`campus-activity-${activeTab}`} role="tabpanel" aria-labelledby={`campus-tab-${activeTab}`} tabIndex={0} className="min-w-0 outline-none">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading campus activity" aria-busy="true">
                {[0, 1, 2, 3, 4, 5].map((index) => <Skeleton key={index} className="h-48 w-full rounded-2xl" />)}
              </div>
            ) : error ? (
              <Card className="flex flex-col items-center rounded-2xl border-border/60 bg-card p-8 text-center sm:p-12">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <RefreshCw className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-extrabold text-foreground">Activity could not load</h3>
                <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">Your campus feed is temporarily unavailable. Try again in a moment.</p>
                <Button type="button" onClick={() => void mutate()} className="mt-4 min-h-10 rounded-full px-4 font-bold cursor-pointer">
                  <RefreshCw className="mr-2 size-4" aria-hidden="true" />Try again
                </Button>
              </Card>
            ) : items.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                  {items.map((item) => {
                    if (activeTab === "marketplace") return <Card key={item.data.id} className="overflow-hidden rounded-2xl border-border/60 bg-card p-0 shadow-2xs"><MarketplaceCard item={item.data} currentUserId={profileId} /></Card>;
                    if (activeTab === "housing") return <Card key={item.data.id} className="overflow-hidden rounded-2xl border-border/60 bg-card p-0 shadow-2xs"><HousingCard item={item.data} currentUserId={profileId} /></Card>;
                    if (activeTab === "lost_found") return <Card key={item.data.id} className="overflow-hidden rounded-2xl border-border/60 bg-card p-0 shadow-2xs"><LostFoundCard item={item.data} currentUserId={profileId} /></Card>;
                    if (activeTab === "rideshare") return <Card key={item.data.id} className="overflow-hidden rounded-2xl border-border/60 bg-card p-0 shadow-2xs"><RideshareCard item={item.data} currentUserId={profileId} /></Card>;
                    return null;
                  })}
                </div>
                <div className="flex justify-center pt-5">
                  <Button asChild variant="outline" className="min-h-10 rounded-full border-border/80 bg-card px-5 font-bold cursor-pointer">
                    <Link href={activeTab === "marketplace" ? "/buy-and-sell" : activeTab === "housing" ? "/housing" : activeTab === "lost_found" ? "/lost-and-found" : "/rideshare"}>
                      View all {activeTabInfo.label.toLowerCase()} <ArrowRight className="ml-1.5 size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <Card className="flex flex-col items-center rounded-2xl border-dashed border-border/70 bg-card/70 px-5 py-10 text-center sm:py-14">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--cat-blue)]/55 text-primary">
                  {activeTab === "rideshare" ? <Bike className="size-6" aria-hidden="true" /> : activeTab === "housing" ? <Home className="size-6" aria-hidden="true" /> : activeTab === "lost_found" ? <PackageSearch className="size-6" aria-hidden="true" /> : <ShoppingBag className="size-6" aria-hidden="true" />}
                </div>
                <h3 className="mt-4 font-heading text-base font-extrabold text-foreground">A fresh start for {activeTabInfo.label.toLowerCase()}</h3>
                <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">Nothing active in this space yet. You could be the first to share something useful with your campus.</p>
                <Button asChild className="mt-4 min-h-10 rounded-full px-4 font-bold cursor-pointer">
                  <Link href={activeTabInfo.createHref}><Plus className="mr-1.5 size-4" aria-hidden="true" />Create the first listing</Link>
                </Button>
              </Card>
            )}
          </div>
        </section>

        {/* ─── Trust & Safety Standards Section ─── */}
        <section className="rounded-3xl border border-border/60 bg-card/60 p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-[var(--success)]" />
              <span>Campus Living Trust &amp; Safety Standards</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              How CampusLoop maintains a safe, spam-free student living ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5 rounded-2xl border border-border/40 bg-background/50 p-4">
              <p className="text-xs font-bold text-foreground">1. Verified College Profiles</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Only students with verified institutional accounts can create housing or marketplace listings. No outside commercial agents or random spam.
              </p>
            </div>
            <div className="space-y-1.5 rounded-2xl border border-border/40 bg-background/50 p-4">
              <p className="text-xs font-bold text-foreground">2. Zero Brokerage Guarantee</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                CampusLoop is 100% free and peer-to-peer. Never pay brokerage fees, platform surcharges, or upfront deposits to view student flats.
              </p>
            </div>
            <div className="space-y-1.5 rounded-2xl border border-border/40 bg-background/50 p-4">
              <p className="text-xs font-bold text-foreground">3. Landmark Campus Handoffs</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Always meet fellow students at well-lit campus landmarks (canteens, library foyer, hostel gates) to inspect items and exchange student IDs safely.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
