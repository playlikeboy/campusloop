"use client";

import { Compass, Globe, Lock, Plus, Search, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { JoinCommunityButton } from "@/app/app/(main)/communities/join-community-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommunityPostStream } from "@/components/communities/community-post-stream";
import { JoinedHubStrip } from "@/components/communities/joined-hub-strip";
import type { CommunityDirectoryItem } from "@/lib/communities/queries";
import { cn, getAvatarUrl } from "@/lib/utils";

const CATEGORIES = [
  "All",
  "Tech & Coding",
  "Cultural & Arts",
  "Gaming & Anime",
  "Academics & Placements",
  "Campus Services",
  "General",
] as const;

type View = "hubs" | "discover" | "feed";

interface CommunitiesIndexClientProps {
  initialCommunities: CommunityDirectoryItem[];
  initialJoinedCommunities: CommunityDirectoryItem[];
  profileId: string;
}

function relativeActivity(value: Date | null) {
  if (!value) return "No activity yet";
  const delta = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "Active now";
  if (minutes < 60) return "Active " + minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return "Active " + hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days < 7) return "Active " + days + "d ago";
  return "Recently active";
}

export function CommunitiesIndexClient({
  initialCommunities,
  initialJoinedCommunities,
  profileId,
}: CommunitiesIndexClientProps) {
  const [view, setView] = useState<View>("hubs");
  const [communities, setCommunities] = useState(initialCommunities);
  const [joined, setJoined] = useState(initialJoinedCommunities);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");

  const joinedIds = useMemo(() => new Set(joined.map((item) => item.id)), [joined]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return communities.filter((community) => {
      if (joinedIds.has(community.id)) return false;
      if (category !== "All" && community.category !== category) return false;
      if (!query) return true;
      return (
        community.name.toLowerCase().includes(query) ||
        (community.description || "").toLowerCase().includes(query)
      );
    });
  }, [communities, joinedIds, search, category]);

  const recommendations = useMemo(
    () =>
      communities
        .filter((community) => !joinedIds.has(community.id))
        .sort((a, b) => {
          const activityA = a.latestActivityAt ? new Date(a.latestActivityAt).getTime() : 0;
          const activityB = b.latestActivityAt ? new Date(b.latestActivityAt).getTime() : 0;
          return activityB - activityA || b.memberCount - a.memberCount;
        })
        .slice(0, 5),
    [communities, joinedIds]
  );

  function setViewAndReset(next: View) {
    setView(next);
    if (next !== "discover") {
      setSearch("");
      setCategory("All");
    }
  }

  function handleMembershipChange(communityId: string, isMember: boolean) {
    setCommunities((current) =>
      current.map((community) =>
        community.id === communityId ? { ...community, isMember } : community
      )
    );

    if (isMember) {
      const community = communities.find((item) => item.id === communityId);
      if (community) {
        setJoined((current) =>
          current.some((item) => item.id === communityId) ? current : [community, ...current]
        );
      }
    } else {
      setJoined((current) => current.filter((item) => item.id !== communityId));
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-[calc(6rem+env(safe-area-inset-bottom))] text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/20 bg-background/90 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">CampusLoop</p>
            <h1 className="truncate text-lg font-black tracking-tight">Communities</h1>
          </div>
          <Link
            href="/app/communities/new"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-black text-primary-foreground shadow-xs transition-transform active:scale-95"
            aria-label="Create a community"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Create</span>
          </Link>
        </div>

        <nav aria-label="Community views" className="grid grid-cols-3 px-2">
          {[
            { id: "hubs" as const, label: "Your hubs" },
            { id: "discover" as const, label: "Discover" },
            { id: "feed" as const, label: "Feed" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setViewAndReset(item.id)}
              className={cn(
                "relative min-h-11 px-3 text-xs font-bold transition-colors",
                view === item.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={view === item.id ? "page" : undefined}
            >
              {item.label}
              {item.id === "hubs" && joined.length > 0 ? (
                <span className="ml-1 text-[10px] text-muted-foreground">({joined.length})</span>
              ) : null}
              {view === item.id ? (
                <span className="absolute inset-x-7 bottom-0 h-0.5 rounded-full bg-primary" />
              ) : null}
            </button>
          ))}
        </nav>
      </header>

      {view === "hubs" ? (
        <div>
          <JoinedHubStrip communities={joined} onBrowse={() => setViewAndReset("discover")} />

          <section className="mt-5 px-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-black tracking-tight">Recent from your hubs</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Discussions are loaded only when you need them.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewAndReset("feed")}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                All activity
              </button>
            </div>
          </section>

          <CommunityPostStream
            profileId={profileId}
            tab="joined"
            emptyTitle="Your hubs are quiet"
            emptyDescription="Start a discussion inside one of your joined communities and it will show up here."
          />

          {recommendations.length > 0 ? (
            <section className="mt-2 border-t border-border/20 px-4 pt-5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <div>
                  <h2 className="text-base font-black">You may like</h2>
                  <p className="text-[11px] text-muted-foreground">Active circles worth exploring</p>
                </div>
              </div>

              <div className="mt-3 divide-y divide-border/15">
                {recommendations.map((community) => (
                  <CommunityRow
                    key={community.id}
                    community={community}
                    onMembershipChange={(next) => handleMembershipChange(community.id, next)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {view === "discover" ? (
        <div id="discover" className="px-4 pt-4">
          <div className="rounded-2xl bg-muted/35 p-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search clubs, batches, hobbies, academics..."
                className="h-11 w-full rounded-xl bg-background pl-10 pr-4 text-sm outline-none ring-1 ring-border/30 placeholder:text-muted-foreground/70 focus:ring-primary/40"
                aria-label="Search communities"
              />
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                    category === item
                      ? "bg-foreground text-background"
                      : "bg-background text-muted-foreground ring-1 ring-border/40 hover:text-foreground"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black">Explore communities</h2>
                <p className="text-[11px] text-muted-foreground">
                  Open the whole row to visit a hub; the action on the right is only for joining.
                </p>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">{filtered.length} shown</span>
            </div>

            <div className="divide-y divide-border/15">
              {filtered.map((community) => (
                <CommunityRow
                  key={community.id}
                  community={community}
                  onMembershipChange={(next) => handleMembershipChange(community.id, next)}
                />
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-muted/30 px-5 py-12 text-center">
                <Compass className="mx-auto size-6 text-primary" />
                <h3 className="mt-3 text-sm font-black">No matching communities</h3>
                <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Try another keyword or create the community your campus is missing.
                </p>
                <Link
                  href="/app/communities/new"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-black text-background"
                >
                  <Plus className="size-3.5" />
                  Create community
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {view === "feed" ? (
        <section>
          <div className="px-4 py-4">
            <div className="rounded-2xl bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <div>
                  <h2 className="text-sm font-black">All community discussions</h2>
                  <p className="text-[11px] text-muted-foreground">
                    One timeline, with pagination and no duplicated member payloads.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <CommunityPostStream
            profileId={profileId}
            tab="discussions"
            emptyTitle="No community discussions yet"
            emptyDescription="Explore a hub, join it, and start the first useful thread."
          />
        </section>
      ) : null}
    </main>
  );
}

function CommunityRow({
  community,
  onMembershipChange,
}: {
  community: CommunityDirectoryItem;
  onMembershipChange: (isMember: boolean) => void;
}) {
  const avatar = getAvatarUrl(community.avatarUrl, community.name);
  const isActive = community.latestActivityAt
    ? Date.now() - new Date(community.latestActivityAt).getTime() < 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="group flex items-center gap-3 py-3.5">
      <Link
        href={"/app/communities/" + (community.slug || community.id)}
        className="flex min-w-0 flex-1 items-center gap-3"
        aria-label={"Open c/" + community.name}
      >
        <span className="relative shrink-0">
          <Avatar className="size-11 rounded-full ring-1 ring-border/50">
            <AvatarImage src={avatar} alt="" className="object-cover" />
            <AvatarFallback className="bg-muted text-xs font-black">
              {community.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isActive ? (
            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-primary" />
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-black">c/{community.name}</span>
            {community.privacy === "PRIVATE" ? (
              <Lock className="size-3 shrink-0 text-amber-500" />
            ) : (
              <Globe className="size-3 shrink-0 text-muted-foreground" />
            )}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{community.category}</span>
            <span aria-hidden="true">·</span>
            <span>{community.memberCount} members</span>
            <span aria-hidden="true">·</span>
            <span>{relativeActivity(community.latestActivityAt)}</span>
          </span>
          {community.description ? (
            <span className="mt-1 block truncate text-[11px] leading-relaxed text-muted-foreground">
              {community.description}
            </span>
          ) : null}
        </span>
      </Link>

      <JoinCommunityButton
        communityId={community.id}
        initialIsMember={community.isMember}
        onMembershipChange={onMembershipChange}
        className="h-8 shrink-0 px-3.5 text-[11px]"
      />
    </div>
  );
}
