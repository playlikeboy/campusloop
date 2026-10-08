"use client";

import {
  ChevronRight,
  Compass,
  Globe,
  Lock,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Users,
  Users2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { JoinCommunityButton } from "@/app/(app)/(main)/communities/join-community-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeedCard } from "@/components/ui/feed-card";
import { Pagination } from "@/components/ui/pagination";
import { Tag } from "@/components/ui/tag";
import type { FeedPost } from "@/hooks/use-feed";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, getAvatarUrl } from "@/lib/utils";

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
  members: { userId: string; status: string }[];
  creator: { id: string; username: string; displayName: string };
}

interface Props {
  initialCommunities: CommunityItem[];
  initialPosts?: FeedPost[];
  profileId: string;
  page: number;
  totalPages: number;
  totalCount: number;
  myCommunityCount: number;
}

const CATEGORIES = [
  "All",
  "Tech & Coding",
  "Cultural & Arts",
  "Gaming & Anime",
  "Academics & Placements",
  "Campus Services",
  "General",
] as const;

const TABS = [
  { id: "explore", label: "Explore" },
  { id: "feed", label: "Feed" },
  { id: "my_communities", label: "My Hubs" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function CommunitiesIndexClient({
  initialCommunities,
  initialPosts = [],
  profileId,
  page,
  totalPages,
  totalCount,
  myCommunityCount,
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
      if (tab !== "explore") params.delete("category");
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl bg-background px-3 pb-28 text-foreground sm:px-5 lg:px-8">
      <div className="-mx-3 sm:-mx-5 lg:-mx-8 px-3 sm:px-5 lg:px-8 pt-2 sm:pt-4 pb-2 border-b border-border/30 bg-background/50">
        <div className="flex items-center justify-between gap-3 py-2">
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              Student Network
            </p>
            <h1 className="truncate text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Campus Communities
            </h1>
            <p className="mt-0.5 hidden text-xs sm:text-sm text-muted-foreground sm:block">
              Discover student sub-hubs, tech clubs, societies, and campus discussion spaces.
            </p>
          </div>

          <Link
            href="/communities/new"
            className="inline-flex h-9 sm:h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 sm:px-4 text-xs font-bold text-primary-foreground shadow-xs transition hover:opacity-90 active:scale-95"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">New Community</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>

        <div className="flex pt-1 pb-1">
          <div className="inline-flex rounded-full bg-muted/50 p-0.5 border border-border/40">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "h-8 rounded-full px-3.5 sm:px-4 text-xs font-semibold transition-all cursor-pointer",
                    active
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {tab.id === "my_communities" && myCommunityCount > 0 ? ` (${myCommunityCount})` : ""}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeTab === "explore" && (
        <section className="space-y-5 pt-3 sm:pt-5">
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search communities, clubs, coding groups..."
                className="h-12 w-full rounded-2xl bg-muted/40 pl-11 pr-12 text-sm font-medium outline-none ring-1 ring-foreground/5 transition placeholder:text-muted-foreground/70 focus:bg-card focus:ring-primary/30"
                aria-label="Search communities"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((category) => {
                const selected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryChange(category)}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition active:scale-95",
                      selected
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-muted/35 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {initialCommunities.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {initialCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    profileId={profileId}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Showing {initialCommunities.length} of {totalCount} communities
                </p>
                <Pagination page={page} totalPages={totalPages} />
              </div>
            </>
          ) : (
            <EmptyCommunities search={search} category={selectedCategory} />
          )}
        </section>
      )}

      {activeTab === "feed" && (
        <section className="space-y-5 pt-3 sm:pt-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search community discussions..."
              className="h-12 w-full rounded-2xl bg-muted/40 pl-11 pr-4 text-sm font-medium outline-none ring-1 ring-foreground/5 transition placeholder:text-muted-foreground/70 focus:bg-card focus:ring-primary/30"
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
              <div className="flex justify-center pt-2">
                <Pagination page={page} totalPages={totalPages} />
              </div>
            </>
          ) : (
            <div className="rounded-[28px] bg-muted/25 px-6 py-16 text-center shadow-2xs">
              <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-card text-primary shadow-sm">
                <MessageSquare className="size-7" />
              </div>
              <h2 className="mt-4 text-base font-black">No community posts found</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {search
                  ? "Nothing matches this search yet. Try a broader phrase."
                  : "Be the first student to start a discussion, question, or poll inside a community."}
              </p>
              <button
                type="button"
                onClick={() => handleTabChange("explore")}
                className="mt-5 inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-xs font-extrabold text-primary-foreground shadow-sm active:scale-95"
              >
                Explore Communities
              </button>
            </div>
          )}
        </section>
      )}

      {activeTab === "my_communities" && (
        <section className="space-y-5 pt-3 sm:pt-5">
          {initialCommunities.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {initialCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    profileId={profileId}
                    joinedView
                  />
                ))}
              </div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Showing {initialCommunities.length} joined communities
                </p>
                <Pagination page={page} totalPages={totalPages} />
              </div>
            </>
          ) : (
            <div className="rounded-[28px] bg-muted/25 px-6 py-16 text-center shadow-2xs">
              <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-card text-primary shadow-sm">
                <Compass className="size-7" />
              </div>
              <h2 className="mt-4 text-base font-black">No joined communities yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Explore coding clubs, gaming squads, cultural groups, and batch communities to find your people.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange("explore")}
                className="mt-5 inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-xs font-extrabold text-primary-foreground shadow-sm active:scale-95"
              >
                Explore Communities
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function CommunityCard({
  community,
  profileId,
  joinedView = false,
}: {
  community: CommunityItem;
  profileId: string;
  joinedView?: boolean;
}) {
  const isMember = joinedView || community.members.some(
    (member) => member.userId === profileId && member.status === "ACTIVE"
  );
  const members = community.members.filter((member) => member.status === "ACTIVE").length;
  const avatar = getAvatarUrl(community.avatarUrl, community.name);

  return (
    <article className="group relative flex min-h-[260px] flex-col rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 transition-all hover:border-[var(--border-strong)] hover:shadow-2xs overflow-hidden">
      {/* Top Header: Avatar + Category on left, Join button on right */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <Link
          href={"/communities/" + (community.slug || community.id)}
          className="flex items-center gap-3 min-w-0 flex-1"
        >
          <Avatar className="size-11 shrink-0 rounded-[var(--r-md)] border border-[var(--border)]">
            <AvatarImage src={avatar} alt="" />
            <AvatarFallback className="bg-[var(--surface-sunken)] text-[var(--primary)] text-xs font-bold">
              {community.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Tag category="communities">{community.category}</Tag>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-1">
              {community.privacy === "PRIVATE" ? (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Lock className="size-3" /> Private
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Globe className="size-3 text-[var(--text-muted)]" /> Public
                </span>
              )}
              <span>·</span>
              <span>{members} {members === 1 ? "member" : "members"}</span>
            </div>
          </div>
        </Link>

        <JoinCommunityButton
          communityId={community.id}
          initialIsMember={isMember}
          className="h-8 shrink-0 text-xs px-3"
        />
      </div>

      {/* Community Title */}
      <Link
        href={"/communities/" + (community.slug || community.id)}
        className="relative z-10 mt-3.5 block group-hover:text-[var(--primary)] transition-colors"
      >
        <h2 className="line-clamp-1 font-heading text-base sm:text-lg font-bold tracking-tight text-[var(--text)]">
          c/{community.name}
        </h2>
      </Link>

      {/* Description */}
      <p className="relative z-10 mt-1.5 line-clamp-2 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)] flex-1">
        {community.description || "A student-led community for sharing ideas, questions, updates, and campus life."}
      </p>

      {/* Footer */}
      <div className="relative z-10 mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
          <Users className="size-3.5 text-[var(--primary)] shrink-0" />
          <span>{members} active students</span>
        </div>
      </div>
    </article>
  );
}

function EmptyCommunities({ search, category }: { search: string; category: string }) {
  const query = search
    ? "?name=" + encodeURIComponent(search)
    : "";

  return (
    <div className="rounded-[28px] bg-muted/25 px-6 py-16 text-center shadow-2xs">
      <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-card text-primary shadow-sm">
        <Users2 className="size-7" />
      </div>
      <h2 className="mt-4 text-base font-black">No communities found</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {search
          ? "No communities match \"" + search + "\". Try a broader search."
          : "There are no communities in " + category + " yet."}
      </p>
      <Link
        href={"/communities/new" + query}
        className="mt-5 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-extrabold text-primary-foreground shadow-sm active:scale-95"
      >
        <Plus className="size-3.5" />
        Create Community
      </Link>
    </div>
  );
}
