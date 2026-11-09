"use client";

import {
  ArrowRight,
  FolderPlus,
  Sparkles,
  Trophy,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { useScrollIsolation } from "@/hooks/use-scroll-isolation";
import { fetcher } from "@/lib/api";
import { sounds } from "@/lib/sounds";
import { getAvatarUrl } from "@/lib/utils";
import type { AcademicPlaylistData } from "@/components/academics/academic-playlist-card";

interface AcademicContextRailProps {
  onSelectTopic?: (topic: string) => void;
  collegeName?: string;
  userSemester?: number;
  userBranch?: string;
  playlists?: AcademicPlaylistData[];
  playlistsLoading?: boolean;
  playlistsError?: unknown;
}

interface TrendingItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  resourceType: string;
  viewsCount: number;
}

interface TopUploader {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  uploadCount: number;
  totalUpvotes: number;
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k views`;
  return `${n} ${n === 1 ? "view" : "views"}`;
}

function formatResourceType(type: string): string {
  if (type === "PYQ") return "PYQ";
  if (type === "CHEAT_SHEET") return "Cheat Sheet";
  return (type || "Notes").replace("_", " ");
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function AcademicContextRail({
  onSelectTopic,
  collegeName = "BIT Mesra",
  userSemester = 5,
  userBranch = "Computer Science",
  playlists = [],
  playlistsLoading = false,
  playlistsError,
}: AcademicContextRailProps) {
  const scrollRef = useScrollIsolation<HTMLElement>();
  const { data: trendingData } = useSWR<{ items: TrendingItem[] }>(
    "/api/academics/trending?scope=campus&limit=4",
    fetcher
  );
  const { data: uploadersData } = useSWR<{ uploaders: TopUploader[] }>(
    "/api/academics/top-uploaders",
    fetcher
  );
  const trendingItems = trendingData?.items || [];
  const topUploaders = uploadersData?.uploaders || [];

  return (
    <aside
      ref={scrollRef}
      className="hidden xl:flex flex-col gap-4.5 w-72 shrink-0 select-none sticky top-4 h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain no-scrollbar pr-1 pb-16"
    >
      {/* ─── 1. Personalized Context Pill ─── */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Sparkles className="size-3.5 text-primary" />
          <span>Recommended for You</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Curated based on{" "}
          <strong className="text-foreground">Sem {userSemester} · {userBranch}</strong> at {collegeName.split(",")[0]}.
        </p>
      </div>

      {/* ─── 2. Popular This Week ─── */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
            <TrendingUp className="size-3.5 text-primary" />
            <span>Popular this week</span>
          </div>
        </div>

        <div className="space-y-1 divide-y divide-border/20 -mx-1">
          {trendingItems.length === 0 ? (
            <p className="px-1 py-2 text-[11px] text-muted-foreground">
              Be the first to upload trending notes this week.
            </p>
          ) : (
            trendingItems.map((item) => (
              <Link
                key={item.id}
                href={`/academics/study-material/${item.id}`}
                onClick={() => {
                  sounds.tap();
                  if (onSelectTopic) onSelectTopic(item.subjectCode);
                }}
                className="w-full pt-2 first:pt-0 pb-1 px-1 flex items-start justify-between text-left hover:bg-muted/40 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                      {item.subjectCode}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">·</span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {formatResourceType(item.resourceType)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground truncate mt-0.5">{item.subjectName}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums">
                  {formatViews(item.viewsCount)}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* ─── 2b. Top Contributors (leaderboard / gamification) ─── */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
          <Trophy className="size-3.5 text-reward" />
          <span>Top Contributors</span>
        </div>

        {topUploaders.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Upload your first resource to top the leaderboard.
          </p>
        ) : (
          <div className="space-y-1.5">
            {topUploaders.slice(0, 5).map((u, idx) => (
              <Link
                key={u.id}
                href={`/@${u.username}?tab=academics`}
                onClick={() => sounds.tap()}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/40 transition-colors group"
              >
                <span className="w-5 text-center text-xs shrink-0">{MEDALS[idx] || idx + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getAvatarUrl(u.avatarUrl, u.username)}
                  alt=""
                  className="size-6.5 rounded-full border border-border/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {u.displayName}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {u.uploadCount} {u.uploadCount === 1 ? "upload" : "uploads"} · {u.totalUpvotes} helpful
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ─── 3. Curated Study Stacks / Playlists ─── */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
            <FolderPlus className="size-3.5 text-brand-text" />
            <span>Study Playlists</span>
          </div>
          <Link
            href="/academics/study-material/playlists/new"
            onClick={() => sounds.tap()}
            className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
          >
            + Create
          </Link>
        </div>

        <div className="space-y-2">
          {playlistsLoading ? (
            [0, 1].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-xl bg-muted/40" />
            ))
          ) : playlistsError ? (
            <p className="rounded-xl border border-border/30 bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
              Study playlists are temporarily unavailable.
            </p>
          ) : playlists.length > 0 ? (
            playlists.slice(0, 2).map((playlist) => (
              <Link
                key={playlist.id}
                href={`/academics/study-material/playlists/${playlist.slug || playlist.id}`}
                onClick={() => sounds.tap()}
                className="group block rounded-xl border border-border/30 bg-muted/20 p-2.5 transition-colors hover:border-primary/25 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="line-clamp-2 min-w-0 text-xs font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {playlist.title}
                  </h4>
                  <ArrowRight className="mt-0.5 size-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                  <span className="truncate">{playlist.semester ? `Sem ${playlist.semester}` : playlist.branch === "All" ? "All branches" : playlist.branch}</span>
                  <span className="shrink-0 font-mono tabular-nums">{playlist.itemsCount} {playlist.itemsCount === 1 ? "item" : "items"}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border/40 p-3">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                No public playlists yet. Bundle notes and PYQs into a study stack.
              </p>
              <Link
                href="/academics/study-material/playlists/new"
                onClick={() => sounds.tap()}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
              >
                Create a playlist <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
