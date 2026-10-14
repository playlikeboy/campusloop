"use client";

import {
  ArrowRight,
  ArrowUpDown,
  ArrowUpRight,
  Building2,
  Code2,
  Coffee,
  Compass,
  Flame,
  Gamepad2,
  Globe,
  GraduationCap,
  Lock,
  MessageSquare,
  Music,
  Plus,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Users2,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { JoinCommunityButton } from "@/app/(app)/(main)/communities/join-community-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeedCard } from "@/components/ui/feed-card";
import { Pagination } from "@/components/ui/pagination";
import { CuteCatEmpty } from "@/components/ui/cute-illustrations";
import type { FeedPost } from "@/hooks/use-feed";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, getAvatarUrl } from "@/lib/utils";

export interface CommunityMemberWithUser {
  userId: string;
  status: string;
  user?: {
    id: string;
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface CommunityItem {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  privacy: "PUBLIC" | "PRIVATE" | "UNLISTED" | string;
  category: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  points?: number;
  creatorId: string;
  createdAt: Date;
  members: CommunityMemberWithUser[];
  creator?: {
    id: string;
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

interface Props {
  initialCommunities: CommunityItem[];
  featuredCommunities?: CommunityItem[];
  initialPosts?: FeedPost[];
  profileId: string;
  page: number;
  totalPages: number;
  totalCount: number;
  myCommunityCount: number;
  categoryCounts?: Record<string, number>;
  postCountsMap?: Record<string, number>;
  currentSort?: string;
}

const CATEGORY_DEFINITIONS = [
  { id: "All", label: "All Hubs", icon: Compass },
  { id: "Tech & Coding", label: "Tech & Coding", icon: Code2 },
  { id: "Academics & Placements", label: "Academics & Study", icon: GraduationCap },
  { id: "Campus Life", label: "Campus Life", icon: Coffee },
  { id: "Gaming & Anime", label: "Gaming & Anime", icon: Gamepad2 },
  { id: "Music & Arts", label: "Music & Arts", icon: Music },
  { id: "Career & Startups", label: "Career & Startups", icon: Rocket },
  { id: "Sports & Fitness", label: "Sports & Fitness", icon: Trophy },
  { id: "Campus Services", label: "Campus Services", icon: Building2 },
] as const;

const TABS = [
  { id: "explore", label: "Explore Hubs", icon: Compass },
  { id: "feed", label: "Live Discussions", icon: MessageSquare },
  { id: "my_communities", label: "My Hubs", icon: Users },
] as const;

const SORT_OPTIONS = [
  { id: "trending", label: "Trending Clout", icon: Flame },
  { id: "newest", label: "Recently Added", icon: Sparkles },
  { id: "name", label: "Alphabetical", icon: ArrowUpDown },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function CommunitiesIndexClient({
  initialCommunities,
  featuredCommunities = [],
  initialPosts = [],
  profileId,
  page,
  totalPages,
  totalCount,
  myCommunityCount,
  categoryCounts = {},
  postCountsMap = {},
  currentSort = "trending",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlTab = searchParams.get("tab");
  const activeTab: Tab =
    urlTab === "feed" || urlTab === "my_communities" ? urlTab : "explore";
  const selectedCategory = searchParams.get("category") || "All";
  const urlSearch = searchParams.get("q") || "";
  const [search, setSearch] = useState(urlSearch);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

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
        params.set("page", "1");
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, updateUrl, urlSearch]);

  function handleTabChange(tab: Tab) {
    sounds.tap();
    haptics.light();
    updateUrl((params) => {
      if (tab === "explore") params.delete("tab");
      else params.set("tab", tab);
      params.set("page", "1");
      if (tab !== "explore") {
        params.delete("category");
        params.delete("sort");
      }
      if (tab === "my_communities") params.delete("q");
    });
  }

  function handleCategoryChange(category: string) {
    sounds.tap();
    haptics.light();
    updateUrl((params) => {
      if (category === "All") params.delete("category");
      else params.set("category", category);
      params.set("page", "1");
    });
  }

  function handleSortChange(sort: string) {
    sounds.tap();
    haptics.light();
    updateUrl((params) => {
      if (sort === "trending") params.delete("sort");
      else params.set("sort", sort);
      params.set("page", "1");
    });
  }

  const showSpotlight =
    activeTab === "explore" &&
    page === 1 &&
    !urlSearch &&
    selectedCategory === "All" &&
    featuredCommunities.length > 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl bg-background px-4 pb-28 text-foreground sm:px-5 lg:px-8">
      {/* ─── Hero Section ─── */}
      <section className="pt-2 sm:pt-4 pb-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary">
                <Compass className="size-3" />
                Campus Chapters &amp; Squads
              </span>
              <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
                Verified Indian College Network
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Student Communities
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Discover official college societies, coding squads, gaming clans, placement study circles,
              and interest groups across 1,350+ campuses.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/communities/new"
              className="inline-flex h-11 sm:h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm sm:text-xs font-bold text-primary-foreground shadow-xs transition hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Plus className="size-3.5" />
              <span>Create Community</span>
            </Link>
          </div>
        </div>

        {/* ─── Segmented Tabs & Sort Row ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3">
          <div className="grid w-full grid-cols-3 rounded-full bg-muted/50 p-1 border border-border/40 sm:inline-flex sm:w-auto sm:grid-cols-none">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-label={tab.label}
                  aria-pressed={active}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex min-w-0 items-center justify-center gap-1.5 h-9 sm:h-8 rounded-full px-1.5 sm:px-4 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="sm:hidden">{tab.id === "explore" ? "Explore" : tab.id === "feed" ? "Discuss" : "My Hubs"}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.id === "my_communities" && myCommunityCount > 0 ? (
                    <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-primary/15 text-[10px] font-black text-primary">
                      {myCommunityCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {activeTab === "explore" && (
            <div className="flex w-full items-center justify-between gap-2 text-xs text-muted-foreground sm:w-auto sm:justify-end">
              <span className="text-[11px] font-medium hidden sm:inline">Sort:</span>
              <div className="grid w-full grid-cols-3 rounded-full bg-muted/40 p-0.5 border border-border/40 sm:inline-flex sm:w-auto sm:grid-cols-none">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-label={`Sort by ${opt.label}`}
                    aria-pressed={currentSort === opt.id}
                    onClick={() => handleSortChange(opt.id)}
                    className={cn(
                      "min-w-0 px-1.5 sm:px-2.5 py-1.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-medium transition cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                      currentSort === opt.id
                        ? "bg-background text-foreground font-bold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="sm:hidden">{opt.id === "trending" ? "Trending" : opt.id === "newest" ? "Recent" : "A–Z"}</span>
                    <span className="hidden sm:inline">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── TAB: EXPLORE HUBS ─── */}
      {activeTab === "explore" && (
        <div className="space-y-5 sm:space-y-6 pt-4 sm:pt-6">
          {/* Search Bar & Categories */}
          <section className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search communities, clubs, and interests..."
                className="h-12 w-full rounded-2xl bg-card pl-11 pr-12 text-sm font-medium outline-none border border-border/60 transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 shadow-2xs"
                aria-label="Search communities"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-xs text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            {/* Category Filter Chips */}
            <div className="relative -mx-1">
              <div role="group" aria-label="Filter communities by category" className="flex snap-x snap-mandatory items-center gap-2 overflow-x-auto pb-1 scrollbar-none px-1 pr-10">
                {CATEGORY_DEFINITIONS.map((def) => {
                  const selected = selectedCategory === def.id;
                  const Icon = def.icon;
                  const count = categoryCounts[def.id] || 0;
                  return (
                    <button
                      key={def.id}
                      type="button"
                      onClick={() => handleCategoryChange(def.id)}
                      aria-pressed={selected}
                      className={cn(
                        "flex h-10 snap-start items-center gap-1.5 shrink-0 rounded-full px-3 text-xs font-semibold transition active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        selected
                          ? "bg-foreground text-background shadow-xs font-bold"
                          : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                      )}
                    >
                      <Icon className="size-3.5" />
                      <span>{def.label}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                            selected
                              ? "bg-background/20 text-background"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-background via-background/90 to-transparent pl-7 pr-1 sm:hidden">
                <span className="flex size-7 items-center justify-center rounded-full border border-border/60 bg-card/90 text-muted-foreground shadow-sm">
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </div>
          </section>

          {/* ─── Spotlight: Trending Campus Squads ─── */}
          {showSpotlight && (
            <section className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Flame className="size-4 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
                      Trending Student Squads
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Top-ranked campus communities by activity and clout points.
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <Sparkles className="size-3.5" /> High Clout
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredCommunities.map((community, index) => (
                  <SpotlightCommunityCard
                    key={community.id}
                    community={community}
                    rank={index + 1}
                    profileId={profileId}
                    postCount={postCountsMap[community.id] || 0}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ─── Main Communities Grid ─── */}
          <section className="space-y-4">
            {initialCommunities.length > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <p className="font-medium">
                    Showing {initialCommunities.length} of {totalCount} student communities
                  </p>
                  {selectedCategory !== "All" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                      Filter: {selectedCategory}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {initialCommunities.map((community) => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      profileId={profileId}
                      postCount={postCountsMap[community.id] || 0}
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/40">
                  <p className="text-xs font-medium text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <Pagination page={page} totalPages={totalPages} />
                </div>
              </>
            ) : (
              <EmptyCommunities search={search} category={selectedCategory} />
            )}
          </section>

          {/* ─── Bottom Callout: Create Your Community Hub ─── */}
          <CreateCommunityCallout />
        </div>
      )}

      {/* ─── TAB: LIVE DISCUSSIONS (FEED) ─── */}
      {activeTab === "feed" && (
        <section className="space-y-5 pt-4 sm:pt-6 max-w-3xl mx-auto">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search community posts, questions, and polls..."
              className="h-11 sm:h-12 w-full rounded-2xl bg-card pl-11 pr-4 text-xs sm:text-sm font-medium outline-none border border-border/60 transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 shadow-2xs"
              aria-label="Search community discussions"
            />
          </div>

          {initialPosts.length > 0 ? (
            <>
              <div className="space-y-3">
                {initialPosts.map((post) => (
                  <FeedCard key={post.id} post={post} currentUserId={profileId} />
                ))}
              </div>
              <div className="flex justify-center pt-3">
                <Pagination page={page} totalPages={totalPages} />
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card px-6 py-16 text-center shadow-2xs">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquare className="size-6" />
              </div>
              <h2 className="mt-4 text-base font-bold text-foreground">No discussions found</h2>
              <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {search
                  ? `Nothing matches "${search}". Try searching for another topic or question.`
                  : "Be the first student to start a discussion, poll, or confession in a community."}
              </p>
              <button
                type="button"
                onClick={() => handleTabChange("explore")}
                className="mt-5 inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs active:scale-95 transition hover:opacity-90 cursor-pointer"
              >
                Browse Communities
              </button>
            </div>
          )}
        </section>
      )}

      {/* ─── TAB: MY JOINED HUBS ─── */}
      {activeTab === "my_communities" && (
        <section className="space-y-5 pt-4 sm:pt-6">
          {initialCommunities.length > 0 ? (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <p className="font-medium">
                  You are a member of {initialCommunities.length} {initialCommunities.length === 1 ? "hub" : "hubs"}
                </p>
                <Link
                  href="/communities/new"
                  className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                >
                  <Plus className="size-3.5" />
                  <span>Start another community</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {initialCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    profileId={profileId}
                    postCount={postCountsMap[community.id] || 0}
                    joinedView
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/40">
                <p className="text-xs font-medium text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <Pagination page={page} totalPages={totalPages} />
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card px-6 py-16 text-center shadow-2xs max-w-lg mx-auto">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users2 className="size-6" />
              </div>
              <h2 className="mt-4 text-base font-bold text-foreground">You haven&apos;t joined any hubs yet</h2>
              <p className="mx-auto mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Join campus technical clubs, gaming groups, batch circles, or societies to participate
                in exclusive channels and stay in the loop.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTabChange("explore")}
                  className="w-full sm:w-auto inline-flex h-9 items-center justify-center rounded-full bg-primary px-5 text-xs font-bold text-primary-foreground shadow-xs active:scale-95 transition hover:opacity-90 cursor-pointer"
                >
                  Explore Campus Hubs
                </button>
                <Link
                  href="/communities/new"
                  className="w-full sm:w-auto inline-flex h-9 items-center justify-center rounded-full bg-muted px-4 text-xs font-bold text-foreground hover:bg-muted/80 transition"
                >
                  Create a Hub
                </Link>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

{/* ─── SUBCOMPONENT: SPOTLIGHT COMMUNITY CARD ─── */}
function SpotlightCommunityCard({
  community,
  rank,
  profileId,
  postCount = 0,
}: {
  community: CommunityItem;
  rank: number;
  profileId: string;
  postCount?: number;
}) {
  const isMember = community.members.some(
    (m) => m.userId === profileId && m.status === "ACTIVE"
  );
  const memberCount = community.members.filter((m) => m.status === "ACTIVE").length;
  const avatar = getAvatarUrl(community.avatarUrl, community.name);
  const identifier = community.slug || community.id;

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm overflow-hidden">
      {/* Cover Header */}
      {community.bannerUrl ? (
        <div className="relative h-28 -mx-4 -mt-4 mb-3 overflow-hidden bg-muted">
          <img
            src={community.bannerUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-black/30" />
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/90 text-white shadow-xs backdrop-blur-xs">
              <Flame className="size-3 fill-current" />
              #{rank} Trending
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white/90 backdrop-blur-xs border border-white/10">
              {community.category}
            </span>
          </div>
          {community.points ? (
            <div className="absolute top-2.5 right-2.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-primary-foreground shadow-xs">
                <Zap className="size-2.5 fill-current" />
                {community.points.toLocaleString()} LP
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="relative h-24 -mx-4 -mt-4 mb-3 overflow-hidden bg-gradient-to-br from-primary/15 via-muted/30 to-secondary/15 p-2.5 flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/90 text-white shadow-xs">
              <Flame className="size-3 fill-current" />
              #{rank} Trending
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-background/80 text-foreground border border-border/40">
              {community.category}
            </span>
          </div>
          {community.points ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/90 text-primary-foreground shadow-xs">
              <Zap className="size-2.5 fill-current" />
              {community.points.toLocaleString()} LP
            </span>
          ) : null}
        </div>
      )}

      {/* Avatar + Title Row */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <Link href={`/communities/${identifier}`} className="flex items-center gap-2.5 min-w-0">
          <Avatar className="size-11 rounded-xl ring-2 ring-card bg-card shrink-0">
            <AvatarImage src={avatar} alt="" />
            <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">
              {community.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
              c/{community.name}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {memberCount} {memberCount === 1 ? "student" : "students"} · {postCount} {postCount === 1 ? "discussion" : "discussions"}
            </p>
          </div>
        </Link>
        <JoinCommunityButton
          communityId={community.id}
          initialIsMember={isMember}
          className="h-7 text-xs px-3 shrink-0"
        />
      </div>

      {/* Description */}
      <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {community.description || "Student-led discussion hub for campus life, collaboration, and questions."}
      </p>

      {/* Footer */}
      <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
        <MemberFacepile members={community.members} totalCount={memberCount} />
        <Link
          href={`/communities/${identifier}`}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
        >
          <span>Enter Hub</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </article>
  );
}

{/* ─── SUBCOMPONENT: MAIN COMMUNITY CARD ─── */}
function CommunityCard({
  community,
  profileId,
  postCount = 0,
  joinedView = false,
}: {
  community: CommunityItem;
  profileId: string;
  postCount?: number;
  joinedView?: boolean;
}) {
  const isMember = joinedView || community.members.some(
    (member) => member.userId === profileId && member.status === "ACTIVE"
  );
  const isCreator = community.creatorId === profileId;
  const memberCount = community.members.filter((member) => member.status === "ACTIVE").length;
  const avatar = getAvatarUrl(community.avatarUrl, community.name);
  const identifier = community.slug || community.id;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-xs">
      {/* Top Banner Cover Header */}
      <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-muted/40">
        {community.bannerUrl ? (
          <>
            <img
              src={community.bannerUrl}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/15 via-muted/30 to-secondary/15 flex items-center justify-center">
            <span className="text-2xl font-black text-muted-foreground/20 select-none uppercase tracking-wider">
              {community.name.slice(0, 3)}
            </span>
          </div>
        )}

        {/* Top Badges inside banner */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-background/90 text-foreground backdrop-blur-md shadow-2xs border border-border/40">
            {community.category}
          </span>
          <div className="flex items-center gap-1">
            {community.points && community.points > 0 ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-primary-foreground shadow-2xs backdrop-blur-xs">
                <Zap className="size-2.5 fill-current" />
                {community.points.toLocaleString()}
              </span>
            ) : null}
            {community.privacy === "PRIVATE" ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white backdrop-blur-xs">
                <Lock className="size-2.5" /> Private
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Card Content with Overlapping Avatar */}
      <div className="p-4 pt-0 relative flex-1 flex flex-col justify-between">
        <div>
          {/* Avatar and Join Action Row */}
          <div className="relative flex items-end justify-between -mt-6 mb-2">
            <Link href={`/communities/${identifier}`} className="shrink-0">
              <Avatar className="size-12 rounded-2xl ring-4 ring-card bg-card shadow-xs transition-transform group-hover:scale-105">
                <AvatarImage src={avatar} alt="" />
                <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">
                  {community.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex items-center gap-1.5">
              {isCreator && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  Creator
                </span>
              )}
              <JoinCommunityButton
                communityId={community.id}
                initialIsMember={isMember}
                className="h-7 text-xs px-3"
              />
            </div>
          </div>

          {/* Title */}
          <Link
            href={`/communities/${identifier}`}
            className="block group-hover:text-primary transition-colors"
          >
            <h3 className="line-clamp-1 font-bold text-sm sm:text-base text-foreground tracking-tight">
              c/{community.name}
            </h3>
          </Link>

          {/* Description */}
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {community.description || "A student-run community for sharing ideas, questions, updates, and campus life."}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-3.5 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
          <MemberFacepile members={community.members} totalCount={memberCount} />
          <Link
            href={`/communities/${identifier}`}
            className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {postCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-muted-foreground mr-1">
                <MessageSquare className="size-3" />
                {postCount}
              </span>
            )}
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

{/* ─── SUBCOMPONENT: MEMBER FACEPILE ─── */}
function MemberFacepile({
  members,
  totalCount,
}: {
  members: CommunityItem["members"];
  totalCount: number;
}) {
  const activeMembers = members.filter((m) => m.status === "ACTIVE" && m.user);
  const displayAvatars = activeMembers.slice(0, 3);

  if (totalCount === 0) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Users className="size-3.5 text-muted-foreground/70" />
        <span>No members yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {displayAvatars.length > 0 && (
        <div className="flex -space-x-1.5 overflow-hidden">
          {displayAvatars.map((member, i) => {
            const avatar = getAvatarUrl(
              member.user?.avatarUrl,
              member.user?.displayName || "Student"
            );
            return (
              <Avatar
                key={member.userId || i}
                className="size-5 rounded-full ring-2 ring-card bg-muted shrink-0"
              >
                <AvatarImage src={avatar} alt="" />
                <AvatarFallback className="text-[8px] font-bold bg-primary/10 text-primary">
                  {(member.user?.displayName || "U").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            );
          })}
        </div>
      )}
      <span className="text-[11px] font-medium text-muted-foreground">
        {totalCount} {totalCount === 1 ? "member" : "members"}
      </span>
    </div>
  );
}

{/* ─── SUBCOMPONENT: BOTTOM CREATION CALLOUT BANNER ─── */}
function CreateCommunityCallout() {
  return (
    <div className="relative mt-8 rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-6 sm:p-8 overflow-hidden shadow-2xs">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="size-3" />
            Lead Your Campus
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Run a college club, society, or batch community?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Create an official student hub on CampusLoop with custom invite codes, discussion boards,
            automated webhooks, and verified student discovery.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="size-3.5 text-emerald-500" /> Verified Leaders
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Zap className="size-3.5 text-amber-500" /> +100 LP Clout Bonus
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Globe className="size-3.5 text-sky-500" /> 1,350+ Campuses
            </span>
          </div>
        </div>

        <Link
          href="/communities/new"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-xs font-bold text-background shadow-xs transition hover:opacity-90 active:scale-95"
        >
          <Plus className="size-4" />
          <span>Launch Community Hub</span>
        </Link>
      </div>
    </div>
  );
}

{/* ─── SUBCOMPONENT: EMPTY COMMUNITIES STATE ─── */}
function EmptyCommunities({ search, category }: { search: string; category: string }) {
  const query = search ? "?name=" + encodeURIComponent(search) : "";

  return (
    <div className="rounded-3xl border border-border/80 bg-card px-6 py-16 text-center shadow-2xs">
      <div className="mx-auto flex justify-center mb-2">
        <CuteCatEmpty size={100} />
      </div>
      <h2 className="mt-2 text-base font-bold text-foreground">No communities found</h2>
      <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-muted-foreground">
        {search
          ? `No communities match "${search}". You can be the first to launch it for your college!`
          : `There are no communities in ${category} yet. Be the founder who starts the first hub!`}
      </p>
      <Link
        href={"/communities/new" + query}
        className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs active:scale-95 transition hover:opacity-90"
      >
        <Plus className="size-3.5" />
        <span>Create This Community</span>
      </Link>
    </div>
  );
}
