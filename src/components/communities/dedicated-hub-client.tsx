"use client";

import {
  ArrowLeft,
  BookOpen,
  Car,
  Compass,
  Gamepad2,
  Home,
  Loader2,
  PackageSearch,
  Plus,
  Search,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { AcademicCard } from "@/components/communities/academic-card";
import { GamingLobbyCard } from "@/components/communities/gaming-lobby-card";
import { GamingHubHero } from "@/components/communities/gaming-hub-hero";
import { GamingDiscoveryFilters } from "@/components/communities/gaming-discovery-filters";
import { HousingCard } from "@/components/communities/housing-card";
import { LostFoundCard } from "@/components/communities/lost-found-card";
import { MarketplaceCard } from "@/components/communities/marketplace-card";
import { RideshareCard } from "@/components/communities/rideshare-card";
import { Pagination } from "@/components/ui/pagination";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type DedicatedHubType =
  | "lost_found"
  | "marketplace"
  | "gaming"
  | "rideshare"
  | "housing"
  | "academics";

interface Props {
  hubType: DedicatedHubType;
  profileId: string;
}

interface FeedResponse {
  items: any[];
  page: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const HUB_META: Record<DedicatedHubType, {
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  actionLabel: string;
  createHref: string;
  badgeColor: string;
  gradient: string;
}> = {
  lost_found: {
    title: "Lost & Found Hub",
    subtitle: "Campus Lost & Reclaimed Items",
    description: "Report lost student IDs, keys, earphones, lab coats, and reclaim found items safely on campus.",
    icon: PackageSearch,
    actionLabel: "Report Item",
    createHref: "/lost-and-found/new",
    badgeColor: "bg-rose-500/15 text-rose-500",
    gradient: "from-rose-500/15 via-rose-500/5 to-transparent",
  },
  marketplace: {
    title: "Buy & Sell Hub",
    subtitle: "Verified Campus Marketplace",
    description: "Buy and sell second-hand bicycles, coolers, mattresses, textbooks, drafters, and calculators with batchmates.",
    icon: ShoppingBag,
    actionLabel: "Sell Item",
    createHref: "/buy-and-sell/new",
    badgeColor: "bg-emerald-500/15 text-emerald-500",
    gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
  },
  gaming: {
    title: "Gaming Arena",
    subtitle: "Campus Esports & Lobbies",
    description: "Find teammates, recruit for college tournaments, and play Valorant, BGMI, Chess, and EA FC scrimmage matches.",
    icon: Gamepad2,
    actionLabel: "Create Lobby",
    createHref: "/gaming/new",
    badgeColor: "bg-primary/10 text-primary",
    gradient: "from-primary/15 via-coral/5 to-transparent",
  },
  rideshare: {
    title: "Ride Share Hub",
    subtitle: "Station & Airport Cab Pool",
    description: "Split airport, railway station, and weekend city cab fares with verified students to save money.",
    icon: Car,
    actionLabel: "Offer / Request Ride",
    createHref: "/rideshare/new",
    badgeColor: "bg-sky-500/15 text-sky-500",
    gradient: "from-sky-500/15 via-sky-500/5 to-transparent",
  },
  housing: {
    title: "Housing & Flats Hub",
    subtitle: "PGs, Rooms & Flatmates",
    description: "Discover verified PGs, apartments, shared flats, and find student roommates near your college campus.",
    icon: Home,
    actionLabel: "List Room / PG",
    createHref: "/housing/new",
    badgeColor: "bg-amber-500/15 text-amber-500",
    gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
  },
  academics: {
    title: "Notes & PYQs Hub",
    subtitle: "Semester Papers & Cheat Sheets",
    description: "Previous year exam question papers, verified professor notes, formula cheat sheets, and placement resources.",
    icon: BookOpen,
    actionLabel: "Upload Resource",
    createHref: "/hub/new?type=academics",
    badgeColor: "bg-indigo-500/15 text-indigo-500",
    gradient: "from-indigo-500/15 via-indigo-500/5 to-transparent",
  },
};

export function DedicatedHubClient({ hubType, profileId }: Props) {
  const meta = HUB_META[hubType];
  const Icon = meta.icon;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("q") || "";
  const selectedMode = searchParams.get("mode") || "all";
  const selectedLobbyId = searchParams.get("id") || "";
  const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const [search, setSearch] = useState(urlSearch);

  useEffect(() => setSearch(urlSearch), [urlSearch]);

  const updateUrl = useCallback((mutator: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    const query = params.toString();
    router.replace(query ? pathname + "?" + query : pathname, { scroll: true });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const next = search.trim();
    if (next === urlSearch) return;

    const timer = window.setTimeout(() => {
      updateUrl((params) => {
        if (next) params.set("q", next);
        else params.delete("q");
        if (hubType === "gaming") params.delete("id");
        params.set("page", "1");
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [hubType, search, updateUrl, urlSearch]);

  const feedUrl = useMemo(() => {
    const params = new URLSearchParams({
      tab: hubType,
      page: String(page),
      limit: "12",
    });
    if (hubType === "gaming" && selectedLobbyId) {
      params.set("id", selectedLobbyId);
    } else {
      if (urlSearch) params.set("q", urlSearch);
      if (hubType === "gaming") {
        params.set("status", "OPEN");
        if (selectedMode !== "all") params.set("mode", selectedMode);
      }
    }
    return "/api/communities/feed?" + params.toString();
  }, [hubType, page, selectedLobbyId, selectedMode, urlSearch]);

  const { data, error, isLoading, mutate } = useSWR<FeedResponse>(feedUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const items = data?.items || [];

  useEffect(() => {
    if (hubType !== "gaming" || !selectedLobbyId || !items.length) return;
    const target = document.getElementById("gaming-lobby-" + selectedLobbyId);
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }, [hubType, items.length, selectedLobbyId]);

  function renderItem(item: any) {
    switch (item.itemType) {
      case "LOST_FOUND":
        return <LostFoundCard key={item.id} item={item.data} currentUserId={profileId} />;
      case "MARKETPLACE":
        return <MarketplaceCard key={item.id} item={item.data} currentUserId={profileId} />;
      case "GAMING":
        return (
          <GamingLobbyCard
            key={item.id}
            item={item.data}
            currentUserId={profileId}
            highlighted={hubType === "gaming" && selectedLobbyId === item.data.id}
          />
        );
      case "RIDESHARE":
        return <RideshareCard key={item.id} item={item.data} currentUserId={profileId} />;
      case "HOUSING":
        return <HousingCard key={item.id} item={item.data} currentUserId={profileId} />;
      case "ACADEMICS":
        return <AcademicCard key={item.id} item={item.data} currentUserId={profileId} />;
      default:
        return null;
    }
  }

  return (
    <main className={cn("mx-auto min-h-screen w-full bg-background pb-28 text-foreground", hubType === "gaming" ? "max-w-4xl" : "max-w-3xl")}>
      <header className="sticky top-14 z-30 bg-background/85 px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href="/communities"
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Back to communities"
            >
              <ArrowLeft className="size-4.5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-xl", meta.badgeColor)}>
                  <Icon className="size-3.5" />
                </span>
                <h1 className="truncate text-base font-black tracking-tight sm:text-lg">{meta.title}</h1>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta.subtitle}</p>
            </div>
          </div>

          <Link
            href={meta.createHref}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-extrabold text-primary-foreground shadow-sm transition active:scale-95 sm:px-4"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">{meta.actionLabel}</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </header>

      {hubType === "gaming" ? (
        <GamingHubHero search={search} onSearchChange={setSearch} />
      ) : (
        <section className="relative overflow-hidden px-3 pb-4 sm:px-5">
        <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-b", meta.gradient)} />
        <div className="relative space-y-3 rounded-[28px] bg-card/65 p-4 shadow-sm sm:p-5">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{meta.description}</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={"Search " + meta.title.toLowerCase() + "..."}
              className="h-11 w-full rounded-2xl bg-muted/45 pl-11 pr-4 text-sm font-medium outline-none ring-1 ring-foreground/5 transition focus:bg-background focus:ring-primary/30"
              aria-label={"Search " + meta.title}
            />
          </div>
        </div>
      </section>
      )}

      {hubType === "gaming" ? (
        <GamingDiscoveryFilters
          activeMode={selectedMode}
          onModeChange={(mode) =>
            updateUrl((params) => {
              if (mode === "all") params.delete("mode");
              else params.set("mode", mode);
              params.delete("id");
              params.set("page", "1");
            })
          }
        />
      ) : null}

      <section className="space-y-4 px-3 sm:px-5">
        {hubType === "gaming" ? (
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <h2 className="text-lg font-black tracking-tight text-foreground">
                {selectedLobbyId ? "Shared lobby" : "Open lobbies"}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {selectedLobbyId ? "This link opens the specific lobby shared with you." : "Jump into a match or start one of your own."}
              </p>
            </div>
            {data ? (
              <span className="shrink-0 rounded-full bg-muted/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                {data.total} {data.total === 1 ? "lobby" : "lobbies"}
              </span>
            ) : null}
          </div>
        ) : null}
        {isLoading && !data ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            Loading listings...
          </div>
        ) : error ? (
          <div className="rounded-[28px] bg-muted/25 px-6 py-16 text-center shadow-2xs" role="alert">
            <h2 className="text-base font-black">{hubType === "gaming" ? "Lobbies aren’t loading right now" : "Couldn’t load this hub"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
            <button
              type="button"
              onClick={() => void mutate()}
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Try again
            </button>
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="space-y-3">{items.map(renderItem)}</div>
            <div className="flex justify-center pt-2">
              <Pagination page={data?.page || page} totalPages={data?.totalPages || 1} />
            </div>
            {data && data.total > 0 ? (
              <p className="pb-2 text-center text-xs font-medium text-muted-foreground">
                Showing {items.length} of {data.total}
              </p>
            ) : null}
          </>
        ) : hubType === "gaming" ? (
          <div className="rounded-[28px] bg-[var(--surface)] px-5 py-12 text-center shadow-2xs ring-1 ring-border/60 sm:px-8">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Gamepad2 className="size-7" aria-hidden="true" />
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Your next match starts here</p>
            <h2 className="mt-2 text-lg font-black tracking-tight text-foreground">
              {urlSearch ? "No lobbies match that search yet" : "Be the first to open a lobby"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {urlSearch
                ? "Try another game or clear your search to see all open lobbies."
                : "Set the game, invite your campus, and get the next match going."}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Link
                href={meta.createHref}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-95"
              >
                <Plus className="size-3.5" />
                Create a lobby
              </Link>
              {urlSearch ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="inline-flex min-h-10 items-center rounded-full border border-border/70 bg-background px-4 text-xs font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  Clear search
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] bg-muted/25 px-6 py-16 text-center shadow-2xs">
            <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-card text-primary shadow-sm">
              <Compass className="size-7" />
            </div>
            <h2 className="mt-4 text-base font-black">No active listings found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {urlSearch
                ? 'Nothing matches "' + urlSearch + '". Try a broader search.'
                : "Be the first verified student to post in this hub."}
            </p>
            <Link
              href={meta.createHref}
              className="mt-5 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-extrabold text-primary-foreground shadow-sm active:scale-95"
            >
              <Plus className="size-3.5" />
              {meta.actionLabel}
            </Link>
          </div>
        )}

        {isLoading && data ? (
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            Updating...
          </div>
        ) : null}
      </section>
    </main>
  );
}
