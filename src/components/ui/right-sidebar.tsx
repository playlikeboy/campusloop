"use client";

import { ArrowUpRight, Clock, Globe, MoreHorizontal, Plus, RotateCw, School, ShieldCheck, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OTHER_PRODUCTS, productBadge } from "@/constants/products";
import { SOCIAL_LINKS } from "@/constants/socials";
import type { Institution, UserProfile } from "@/db/schema";
import { useScrollIsolation } from "@/hooks/use-scroll-isolation";
import { trackFollow } from "@/lib/analytics/ga4";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, initialOf } from "@/lib/utils";

/** Campus apps and betas first; the full list lives on /products. */
const SIDEBAR_PRODUCTS = OTHER_PRODUCTS.filter((p) => p.group === "campus").slice(0, 5);

type SuggestedPeer = UserProfile & { institution?: Institution | null };

interface TrendItem {
  category: string;
  topic: string;
  postCount: number;
  formattedCount: string;
  href: string;
}

interface TrendsResponse {
  trends: TrendItem[];
}

export function RightSidebar({ className }: { className?: string } = {}) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const isEventsPage = pathname.startsWith("/events");
  const isCommunitiesPage = pathname.startsWith("/communities");
  const [followedIds, setFollowedIds] = useState<Record<string, boolean>>({});
  const [trendsScope, setTrendsScope] = useState<"CAMPUS" | "GLOBAL">("CAMPUS");

  const [isRefreshingPeers, setIsRefreshingPeers] = useState(false);
  const scrollRef = useScrollIsolation<HTMLElement>();

  // Dynamic live trends from real database (supports Campus / Global toggle)
  const { data: trendsData } = useSWR<TrendsResponse>(
    `/api/trends?scope=${trendsScope}`,
    fetcher,
    {
      revalidateIfStale: true,
      dedupingInterval: 15000,
    }
  );

  // Suggested peers from real database (excludes already followed users)
  const { data: suggestedPeers, mutate: mutateSuggested } = useSWR<SuggestedPeer[]>(
    "/api/profile/suggested",
    fetcher,
    { revalidateIfStale: true, dedupingInterval: 10000 }
  );

  function handleSearchSubmit(query: string) {
    const q = query.trim();
    if (!q) return;

    if (q.startsWith("#")) {
      const cleanTag = q.replace(/^#+/, "").trim();
      if (cleanTag) {
        router.push(`/hashtag/${encodeURIComponent(cleanTag.toLowerCase())}`);
        return;
      }
    }

    router.push(`/explore?q=${encodeURIComponent(q)}`);
  }

  async function handleRefreshPeers() {
    setIsRefreshingPeers(true);
    try {
      await mutateSuggested();
    } finally {
      setIsRefreshingPeers(false);
    }
  }

  async function handleFollowToggle(peer: SuggestedPeer) {
    const isCurrentlyFollowed = Boolean(followedIds[peer.id]);
    const nextState = !isCurrentlyFollowed;

    setFollowedIds((prev) => ({ ...prev, [peer.id]: nextState }));

    try {
      if (nextState) {
        toast.success(`Following @${peer.username}`);
        await fetch(`/api/profile/${peer.username}/follow`, { method: "POST" });
        trackFollow(peer.username);
        // Optimistically remove followed peer from suggested list and refresh in background
        mutateSuggested((current) => current?.filter((p) => p.id !== peer.id), false);
      } else {
        toast.info(`Unfollowed @${peer.username}`);
        await fetch(`/api/profile/${peer.username}/follow`, { method: "DELETE" });
      }
      setTimeout(() => mutateSuggested(), 500);
    } catch {
      setFollowedIds((prev) => ({ ...prev, [peer.id]: isCurrentlyFollowed }));
      toast.error("Failed to update follow status");
    }
  }

  const trends = (trendsData?.trends || []).slice(0, 4);
  const peers = (suggestedPeers || []).slice(0, 4);

  // Dynamic Events data for Events page right sidebar
  const { data: eventsData } = useSWR<{ events: any[] }>(
    isEventsPage ? "/api/events?sort=trending" : null,
    fetcher
  );
  const topEvents = (eventsData?.events || []).slice(0, 3);
  const urgentDeadlines = (eventsData?.events || [])
    .filter((e) => e.registrationDeadline && new Date(e.registrationDeadline) > new Date())
    .slice(0, 2);

  return (
    <aside
      ref={scrollRef}
      className={cn(
        "sticky top-4 h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain no-scrollbar space-y-4 text-foreground w-full pr-1 pb-16 select-none",
        className
      )}
    >
      {/* ─── Search Bar with Live Autocomplete ─── */}
      <SearchAutocomplete
        placeholder={isEventsPage ? "Search hackathons & fests..." : "Search CampusLoop..."}
        onSubmit={handleSearchSubmit}
      />

      {/* ─── CONTEXT 1: EVENTS RIGHTBAR (When user is on /events) ─── */}
      {isEventsPage ? (
        <>
          {/* Host Event Action Card */}
          <div className="rounded-2xl border border-primary/30 bg-linear-to-br from-primary/15 via-background to-card p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <Zap className="size-4" />
              <span>Organising on Campus?</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              List your college fest, hackathon, workshop or club recruitment to students across India.
            </p>
            <Link
              href="/events/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-ui w-full justify-center"
            >
              <Plus className="size-3.5" />
              <span>Host Event (+25 LP)</span>
            </Link>
          </div>

          {/* Urgent Registration Deadlines */}
          {urgentDeadlines.length > 0 && (
            <section className="rounded-2xl border border-border/30 bg-card/60 p-3.5 space-y-2">
              <div className="px-1 flex items-center gap-1.5">
                <Clock className="size-4 text-danger" />
                <h3 className="text-sm font-bold tracking-tight text-foreground">Closing Soon</h3>
              </div>
              <div className="divide-y divide-border/20">
                {urgentDeadlines.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.slug || ev.id}`}
                    className="block px-2 py-2 hover:bg-muted/30 rounded-xl transition-colors group"
                  >
                    <p className="text-[11px] text-muted-foreground truncate">{ev.clubName}</p>
                    <p className="text-xs font-bold text-foreground group-hover:underline truncate">
                      {ev.title}
                    </p>
                    <p className="text-[10px] font-bold text-danger pt-0.5">
                      Deadline:{" "}
                      {new Date(ev.registrationDeadline).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Top Prize Hackathons & Competitions */}
          {topEvents.length > 0 && (
            <section className="rounded-2xl border border-border/30 bg-card/60 p-3.5 space-y-2">
              <div className="px-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Trophy className="size-4 text-reward-text" />
                  <h3 className="text-sm font-bold tracking-tight text-foreground">Top Campus Events</h3>
                </div>
              </div>
              <div className="divide-y divide-border/20">
                {topEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.slug || ev.id}`}
                    className="block px-2 py-2 hover:bg-muted/30 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">{ev.clubName}</span>
                      <span className="font-bold text-primary">{ev.mode}</span>
                    </div>
                    <p className="text-xs font-bold text-foreground group-hover:underline truncate">
                      {ev.title}
                    </p>
                    {ev.prizesDescription && (
                      <p className="text-[10px] font-bold text-reward-text truncate flex items-center gap-1">
                        <Trophy className="size-2.5 shrink-0" />
                        <span>{ev.prizesDescription}</span>
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          {/* ─── COMPONENT 1: What's happening (Trending on Campus & Global) ─── */}
          <section className="rounded-2xl border border-border/30 bg-card/60 p-3.5 space-y-1">
            <div className="px-1 pb-1 flex items-center justify-between">
              <h3 className="text-[17px] font-bold tracking-tight text-foreground">
                What&apos;s happening
              </h3>
              {/* College / Global Toggle Button (Icons only, no text as requested) */}
              <div className="flex items-center rounded-xl bg-muted/40 p-0.5 border border-border/30">
                <button
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setTrendsScope("CAMPUS");
                  }}
                  title="Campus Trends"
                  aria-label="Campus Trends"
                  className={cn(
                    "p-1.5 rounded-lg transition-ui cursor-pointer",
                    trendsScope === "CAMPUS"
                      ? "bg-card text-primary shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <School className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setTrendsScope("GLOBAL");
                  }}
                  title="Global Trends"
                  aria-label="Global Trends"
                  className={cn(
                    "p-1.5 rounded-lg transition-ui cursor-pointer",
                    trendsScope === "GLOBAL"
                      ? "bg-card text-primary shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Globe className="size-3.5" />
                </button>
              </div>
            </div>

            {trends.length > 0 ? (
              <div className="divide-y divide-border/20">
                {trends.map((trend) => (
                  <Link
                    key={trend.topic}
                    href={trend.href}
                    className="flex items-start justify-between px-2 py-2.5 hover:bg-muted/30 rounded-xl transition-colors group cursor-pointer"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-[11px] text-muted-foreground font-medium truncate">
                        {trend.category}
                      </p>
                      <p className="text-[14px] font-bold text-foreground group-hover:underline truncate">
                        {trend.topic}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{trend.formattedCount}</p>
                    </div>
                    <MoreHorizontal className="size-4 text-muted-foreground/50 group-hover:text-foreground shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No active trends for this scope yet.
              </div>
            )}

            <Link
              href="/explore"
              className="block px-2 pt-2 text-xs font-bold text-primary hover:underline transition-colors cursor-pointer"
            >
              Show more
            </Link>
          </section>

          {/* ─── COMPONENT 2: Who to follow (Classmates & Peers) ─── */}
          {peers.length > 0 && (
            <section className="rounded-2xl border border-border/30 bg-card/60 p-3.5 space-y-1">
              <div className="px-1 pb-1 flex items-center justify-between">
                <h3 className="text-[17px] font-bold tracking-tight text-foreground">Who to follow</h3>
                <button
                  type="button"
                  onClick={handleRefreshPeers}
                  disabled={isRefreshingPeers}
                  title="Shuffle suggestions"
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-ui cursor-pointer active:scale-95"
                >
                  <RotateCw
                    className={cn(
                      "size-3.5 transition-transform",
                      isRefreshingPeers && "animate-spin text-primary"
                    )}
                  />
                </button>
              </div>

              <div className="divide-y divide-border/20">
                {peers.map((peer) => {
                  const isFollowed = Boolean(followedIds[peer.id]);
                  return (
                    <div
                      key={peer.id}
                      className="flex items-center justify-between gap-3 px-2 py-2.5 hover:bg-muted/30 rounded-xl transition-colors"
                    >
                      <Link
                        href={`/@${peer.username}`}
                        className="flex items-center gap-2.5 min-w-0 flex-1 group cursor-pointer"
                      >
                        <Avatar className="size-10 shrink-0 border border-border/30">
                          <AvatarImage src={peer.avatarUrl || ""} />
                          <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                            {initialOf(peer.displayName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-foreground truncate group-hover:underline flex items-center gap-1">
                            <span>{peer.displayName}</span>
                            {peer.points >= 150 && <ShieldCheck className="size-3.5 text-brand shrink-0" />}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">@{peer.username}</p>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleFollowToggle(peer)}
                        className={cn(
                          "rounded-full px-4 py-1.5 text-xs font-bold transition-ui cursor-pointer shrink-0 active:scale-95",
                          isFollowed
                            ? "border border-border/60 bg-transparent text-foreground hover:border-destructive/40 hover:text-destructive"
                            : "bg-foreground text-background hover:opacity-90"
                        )}
                      >
                        {isFollowed ? "Following" : "Follow"}
                      </button>
                    </div>
                  );
                })}
              </div>

              <Link
                href="/explore"
                className="block px-2 pt-2 text-xs font-bold text-primary hover:underline transition-colors cursor-pointer"
              >
                Show more
              </Link>
            </section>
          )}
        </>
      )}

      {/* ─── CampusLoop Ecosystem Products (shared list in constants/products) ─── */}
      <section className="rounded-2xl border border-border/40 bg-card/60 p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-foreground">More apps from us</h2>
          <Link href="/products" className="text-xs font-semibold text-primary hover:underline">
            See all
          </Link>
        </div>

        <ul className="space-y-1.5">
          {SIDEBAR_PRODUCTS.map((app) => {
            const AppIcon = app.icon;
            const badge = productBadge(app);
            return (
              <li key={app.id}>
                <a
                  href={app.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 rounded-xl p-2 hover:bg-muted/40 transition-ui"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <AppIcon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {app.name}
                      </span>
                      {badge && (
                        <span className="shrink-0 rounded-full border border-border px-1.5 text-[10px] font-semibold text-muted-foreground">
                          {badge}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{app.tagline}</span>
                  </span>
                  <ArrowUpRight
                    className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
                    aria-hidden="true"
                  />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <hr className="border-border/30 my-3" />

      {/* ─── Twitter Minimal Footer ─── */}
      <footer className="px-3 pt-1 space-y-1.5 text-[11px] text-muted-foreground/60 leading-relaxed">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <span>·</span>
          <Link href="/safety" className="hover:underline">
            Safety
          </Link>
          <span>·</span>
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <span>·</span>
          <a
            href="https://dsaloop.campusloop.space"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-foreground"
          >
            DSALoop
          </a>
          <span>·</span>
          <a
            href="https://baby.campusloop.space"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-foreground"
          >
            baby
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
          <a
            href={SOCIAL_LINKS.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-text transition-colors"
            title="Instagram @campusloop.space"
          >
            Instagram
          </a>
          <span>·</span>
          <a
            href={SOCIAL_LINKS.linkedin.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-text transition-colors"
            title="LinkedIn @mycampusloop"
          >
            LinkedIn
          </a>
          <span>·</span>
          <a
            href={SOCIAL_LINKS.x.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
            title="X @mycampusloop"
          >
            X
          </a>
          <span>·</span>
          <span>© {new Date().getFullYear()} CampusLoop</span>
        </div>
      </footer>
    </aside>
  );
}
