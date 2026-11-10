"use client";

import {
  ArrowRight,
  Building2,
  Car,
  ChevronRight,
  Map as MapIcon,
  PackageSearch,
  Plus,
  ShieldCheck,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { HousingCard } from "@/components/communities/housing-card";
import { LostFoundCard } from "@/components/communities/lost-found-card";
import { MarketplaceCard } from "@/components/communities/marketplace-card";
import { RideshareCard } from "@/components/communities/rideshare-card";
import { ContextualLivingNav } from "@/components/navigation/contextual-living-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ROUTES } from "@/constants/navigation";
import { fetcher } from "@/lib/api";
import { ChipRow } from "./_components/hub-layout";
import { HubResults } from "./_components/hub-results";

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

const SERVICES = [
  { href: ROUTES.buySell, title: "Buy and sell", desc: "Books, cycles and hostel stuff", icon: Tag },
  { href: ROUTES.housing, title: "Housing", desc: "Rooms, PGs and flatmates near campus", icon: Building2 },
  {
    href: ROUTES.lostFound,
    title: "Lost and found",
    desc: "Lost your ID card? Post it here",
    icon: PackageSearch,
  },
  { href: ROUTES.rideshare, title: "Ride share", desc: "Split a cab to the station or airport", icon: Car },
  {
    href: ROUTES.atlas,
    title: "Campus Atlas",
    desc: "Ask about clubs, places and timings",
    icon: MapIcon,
    beta: true,
  },
] as const;

const TABS: {
  id: TabType;
  label: string;
  href: string;
  createHref: string;
  createLabel: string;
  icon: typeof Tag;
}[] = [
  {
    id: "marketplace",
    label: "For sale",
    href: ROUTES.buySell,
    createHref: "/buy-and-sell/new",
    createLabel: "Sell something",
    icon: Tag,
  },
  {
    id: "housing",
    label: "Rooms",
    href: ROUTES.housing,
    createHref: "/housing/new",
    createLabel: "List a room",
    icon: Building2,
  },
  {
    id: "lost_found",
    label: "Lost and found",
    href: ROUTES.lostFound,
    createHref: "/lost-and-found/new",
    createLabel: "Report an item",
    icon: PackageSearch,
  },
  {
    id: "rideshare",
    label: "Rides",
    href: ROUTES.rideshare,
    createHref: "/rideshare/new",
    createLabel: "Offer a ride",
    icon: Car,
  },
];

export function LivingHubClient({ profileId }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("marketplace");
  const { data, isLoading, error, mutate } = useSWR<FeedResponse>(
    `/api/communities/feed?tab=${activeTab}&limit=6&page=1`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const items = (data?.items || []).filter((item) => item.data);
  const tab = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className="min-h-dvh pb-24">
      <ContextualLivingNav />

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-6 sm:px-6">
        <header className="space-y-1">
          <h1 className="text-3xl text-fg">Campus living</h1>
          <p className="text-pretty text-sm text-fg-muted">
            Sell your old stuff, find a room, split a cab or get back something you lost.
          </p>
        </header>

        <nav aria-label="Campus living services">
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className="group flex min-h-16 items-center gap-3 px-4 py-3 transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-surface-muted text-fg">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-base font-semibold text-fg">
                        {service.title}
                        {"beta" in service && service.beta && <Badge variant="neutral">Beta</Badge>}
                      </span>
                      <span className="block truncate text-sm text-fg-muted">{service.desc}</span>
                    </span>
                    <ChevronRight
                      className="size-4 shrink-0 text-fg-subtle transition-ui group-hover:text-fg"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <section aria-labelledby="recent-heading" className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 id="recent-heading" className="text-2xl text-fg">
              Recently posted
            </h2>
            {items.length > 0 && (
              <Link
                href={tab.href}
                className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-text underline-offset-4 hover:underline"
              >
                See all
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
          </div>

          <ChipRow label="Show">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <Chip
                  key={t.id}
                  size="sm"
                  selected={activeTab === t.id}
                  icon={<Icon aria-hidden="true" />}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </Chip>
              );
            })}
          </ChipRow>

          <HubResults
            isLoading={isLoading}
            error={error}
            onRetry={() => void mutate()}
            noun="recent posts"
            count={items.length}
            empty={{
              icon: tab.icon,
              title: "Nothing posted yet",
              description: "Be the first from your college.",
              action: (
                <Button asChild>
                  <Link href={tab.createHref}>
                    <Plus className="size-4" aria-hidden="true" />
                    {tab.createLabel}
                  </Link>
                </Button>
              ),
            }}
          >
            {items.map((item) => {
              if (activeTab === "marketplace")
                return <MarketplaceCard key={item.data.id} item={item.data} currentUserId={profileId} />;
              if (activeTab === "housing")
                return <HousingCard key={item.data.id} item={item.data} currentUserId={profileId} />;
              if (activeTab === "lost_found")
                return <LostFoundCard key={item.data.id} item={item.data} currentUserId={profileId} />;
              return <RideshareCard key={item.data.id} item={item.data} currentUserId={profileId} />;
            })}
          </HubResults>
        </section>

        <p className="flex items-start gap-2 text-sm text-fg-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-fg" aria-hidden="true" />
          <span>
            Meet in a busy place on campus and check the item before you pay.{" "}
            <Link href={ROUTES.safety} className="font-semibold text-brand-text underline underline-offset-4">
              Safety tips
            </Link>
          </span>
        </p>
      </main>
    </div>
  );
}
