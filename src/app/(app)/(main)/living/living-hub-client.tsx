"use client";

import {
  ArrowRight,
  Bike,
  Car,
  CheckCircle2,
  Compass,
  Home,
  PackageSearch,
  Plus,
  RefreshCw,
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
    description: "Pass on textbooks, room essentials, cycles, and things another student can use.",
    href: "/buy-and-sell",
    createHref: "/buy-and-sell/new",
    actionLabel: "Sell an item",
    icon: ShoppingBag,
    iconSurface: "bg-[var(--cat-blue)]/55 text-primary",
    wash: "from-[var(--cat-blue)]/40 via-transparent to-transparent",
  },
  {
    id: "housing",
    title: "Housing & PGs",
    subtitle: "Rooms & flatmates",
    description: "Explore room listings, shared flats, and roommate options near campus.",
    href: "/housing",
    createHref: "/housing/new",
    actionLabel: "List a room",
    icon: Home,
    iconSurface: "bg-[var(--cat-yellow)]/65 text-foreground",
    wash: "from-[var(--cat-yellow)]/45 via-transparent to-transparent",
  },
  {
    id: "lost_found",
    title: "Lost & Found",
    subtitle: "Help something get home",
    description: "Post a lost item or help a classmate return something important.",
    href: "/lost-and-found",
    createHref: "/lost-and-found/new",
    actionLabel: "Report an item",
    icon: PackageSearch,
    iconSurface: "bg-[var(--cat-pink)]/55 text-foreground",
    wash: "from-[var(--cat-pink)]/40 via-transparent to-transparent",
  },
  {
    id: "rideshare",
    title: "Ride Share",
    subtitle: "Travel together",
    description: "Find or offer a shared ride for stations, airports, and campus trips.",
    href: "/rideshare",
    createHref: "/rideshare/new",
    actionLabel: "Offer a ride",
    icon: Car,
    iconSurface: "bg-[var(--success-soft)] text-[var(--success)]",
    wash: "from-[var(--success-soft)] via-transparent to-transparent",
  },
  {
    id: "atlas",
    title: "Campus Atlas",
    subtitle: "Find your way",
    description: "Explore places around campus, from buildings and departments to study spots.",
    href: "/atlas",
    createHref: "/atlas",
    actionLabel: "Explore Atlas",
    icon: Compass,
    iconSurface: "bg-primary/10 text-primary",
    wash: "from-primary/10 via-transparent to-transparent",
  },
] as const;

const ACTIVITY_TABS: { id: TabType; label: string; icon: typeof ShoppingBag; createHref: string }[] = [
  { id: "marketplace", label: "Buy & Sell", icon: ShoppingBag, createHref: "/buy-and-sell/new" },
  { id: "housing", label: "Housing", icon: Home, createHref: "/housing/new" },
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
      <ContextualLivingNav />

      <main className="relative isolate mx-auto max-w-6xl space-y-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-sm sm:rounded-[32px]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-16 -top-20 size-64 rounded-full bg-[var(--cat-blue)]/45 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-[var(--cat-pink)]/35 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.18]" />
          </div>

          <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10 lg:p-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--success)]/20 bg-[var(--success-soft)] px-3 py-1.5 text-xs font-bold text-[var(--success)]">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Student-first campus services
              </div>
              <h1 className="mt-4 max-w-xl font-heading text-3xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-[2.8rem]">
                Campus life, made a little easier.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Find the useful stuff around you—from a room or a shared ride to a lost ID card or a second-hand textbook.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Button asChild className="min-h-11 rounded-full px-5 font-bold shadow-sm">
                  <Link href="#campus-services">
                    Explore services <ArrowRight className="ml-1.5 size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="min-h-11 rounded-full border-border/80 bg-card/80 px-5 font-bold">
                  <Link href="/buy-and-sell/new">
                    <Plus className="mr-1.5 size-4" aria-hidden="true" />
                    Create a listing
                  </Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[var(--success)]" aria-hidden="true" />
                  Clear next steps
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[var(--success)]" aria-hidden="true" />
                  Useful campus essentials
                </span>
              </div>
            </div>

            <div className="mx-auto w-full max-w-md">
              <div className="rounded-[24px] border border-border/60 bg-background/85 p-3 shadow-sm backdrop-blur-sm sm:p-4">
                <div className="flex items-center justify-between gap-3 px-1 pb-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Campus essentials</p>
                    <p className="mt-1 text-sm font-extrabold text-foreground">A helpful place to start</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="size-5" aria-hidden="true" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link href="/housing" className="group rounded-2xl border border-border/50 bg-card p-3 transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--cat-yellow)]/65 text-foreground">
                      <Home className="size-4" aria-hidden="true" />
                    </span>
                    <span className="mt-3 block text-xs font-extrabold text-foreground">Find a room</span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">Housing & flatmates</span>
                  </Link>
                  <Link href="/lost-and-found" className="group rounded-2xl border border-border/50 bg-card p-3 transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--cat-pink)]/55 text-foreground">
                      <PackageSearch className="size-4" aria-hidden="true" />
                    </span>
                    <span className="mt-3 block text-xs font-extrabold text-foreground">Find an item</span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">Lost & found</span>
                  </Link>
                  <Link href="/buy-and-sell" className="group col-span-2 flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-3 transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cat-blue)]/55 text-primary">
                      <ShoppingBag className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-extrabold text-foreground">Give useful things a second life</span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">Browse books, cycles, and everyday essentials</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </div>
              </div>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Explore a service first. Post when you are ready.
              </p>
            </div>
          </div>
        </section>

        <section id="campus-services" aria-labelledby="campus-services-heading" className="scroll-mt-24 space-y-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">Explore</p>
            <h2 id="campus-services-heading" className="mt-1 font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              Useful things, all in one place
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Pick what you need today. Each space has a clear way to browse or contribute.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id} className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border-border/60 bg-card p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-5 motion-reduce:transform-none motion-reduce:transition-none">
                  <div aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b opacity-70", category.wash)} />
                  <div className="relative flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border/30", category.iconSurface)}>
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <span className="pt-1 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        {category.subtitle}
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-heading text-base font-extrabold text-foreground transition-colors group-hover:text-primary">{category.title}</h3>
                      <p className="mt-1.5 min-h-10 text-xs leading-relaxed text-muted-foreground">{category.description}</p>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
                      <Button asChild variant="ghost" size="sm" className="min-h-9 gap-1 px-2 text-xs font-bold text-foreground group-hover:text-primary">
                        <Link href={category.href}>Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="min-h-9 rounded-full border-border/80 bg-card/80 px-3 text-[11px] font-bold">
                        <Link href={category.createHref}>{category.actionLabel}</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="recent-activity" aria-labelledby="recent-activity-heading" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col gap-4 border-b border-border/50 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--success)]">
                <span className="size-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" />
                Campus feed
              </div>
              <h2 id="recent-activity-heading" className="mt-1 font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">Recent campus activity</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">See listings and requests shared in each space.</p>
            </div>

            <div role="tablist" aria-label="Campus activity category" className="flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-border/50 bg-muted/60 p-1">
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
                      "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none",
                      selected ? "bg-card text-primary shadow-xs ring-1 ring-border/60" : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />{tab.label}
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
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><RefreshCw className="size-5" aria-hidden="true" /></div>
                <h3 className="mt-4 text-base font-extrabold text-foreground">Activity could not load</h3>
                <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">Your campus feed is temporarily unavailable. Try again in a moment.</p>
                <Button type="button" onClick={() => void mutate()} className="mt-4 min-h-10 rounded-full px-4 font-bold"><RefreshCw className="mr-2 size-4" aria-hidden="true" />Try again</Button>
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
                  <Button asChild variant="outline" className="min-h-10 rounded-full border-border/80 bg-card px-5 font-bold">
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
                <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">Nothing to show here just yet. You could be the first to share something useful with your campus.</p>
                <Button asChild className="mt-4 min-h-10 rounded-full px-4 font-bold">
                  <Link href={activeTabInfo.createHref}><Plus className="mr-1.5 size-4" aria-hidden="true" />Create the first listing</Link>
                </Button>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
