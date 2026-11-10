"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import type { AcademicPlaylistData } from "@/components/academics/academic-playlist-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollIsolation } from "@/hooks/use-scroll-isolation";
import { fetcher } from "@/lib/api";
import { sounds } from "@/lib/sounds";
import { getAvatarUrl, initialOf } from "@/lib/utils";

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

const TYPE_LABELS: Record<string, string> = {
  PYQ: "PYQ",
  NOTES: "Notes",
  CHEAT_SHEET: "Cheat sheet",
  LAB_MANUAL: "Lab manual",
};

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k views`;
  return `${n} ${n === 1 ? "view" : "views"}`;
}

function RailHeading({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 pb-2">
      <h2 className="text-base text-fg">{children}</h2>
      {action}
    </div>
  );
}

/** Desktop-only side column: popular files, top uploaders, playlists. */
export function AcademicContextRail({
  onSelectTopic,
  playlists = [],
  playlistsLoading = false,
  playlistsError,
}: AcademicContextRailProps) {
  const scrollRef = useScrollIsolation<HTMLElement>();
  const { data: trendingData, isLoading: trendingLoading } = useSWR<{ items: TrendingItem[] }>(
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
      aria-label="More study material"
      className="no-scrollbar sticky top-4 hidden h-[calc(100dvh-2rem)] w-72 shrink-0 flex-col divide-y divide-border overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface xl:flex"
    >
      <section className="p-4">
        <RailHeading>Popular this week</RailHeading>
        {trendingLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : trendingItems.length === 0 ? (
          <p className="text-sm text-fg-muted">Nothing popular yet this week.</p>
        ) : (
          <ul className="-mx-2">
            {trendingItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/academics/study-material/${item.id}`}
                  onClick={() => {
                    sounds.tap();
                    onSelectTopic?.(item.subjectCode);
                  }}
                  className="flex min-h-11 items-start justify-between gap-2 rounded-sm px-2 py-2 transition-ui hover:bg-surface-muted"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">{item.subjectName}</span>
                    <span className="block text-xs text-fg-muted">
                      {item.subjectCode} · {TYPE_LABELS[item.resourceType] ?? "Notes"}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-fg-subtle tabular-nums">
                    {formatViews(item.viewsCount)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="p-4">
        <RailHeading>Top uploaders</RailHeading>
        {topUploaders.length === 0 ? (
          <p className="text-sm text-fg-muted">No uploads yet. Yours could be first.</p>
        ) : (
          <ol className="-mx-2">
            {topUploaders.slice(0, 5).map((u, idx) => (
              <li key={u.id}>
                <Link
                  href={`/@${u.username}?tab=academics`}
                  onClick={() => sounds.tap()}
                  className="flex min-h-11 items-center gap-2.5 rounded-sm px-2 py-1.5 transition-ui hover:bg-surface-muted"
                >
                  <span className="w-4 shrink-0 text-center text-sm font-semibold text-fg-muted tabular-nums">
                    {idx + 1}
                  </span>
                  <Avatar size="sm">
                    <AvatarImage src={getAvatarUrl(u.avatarUrl, u.username)} alt="" />
                    <AvatarFallback>{initialOf(u.displayName || u.username)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">{u.displayName}</span>
                    <span className="block truncate text-xs text-fg-muted tabular-nums">
                      {u.uploadCount} {u.uploadCount === 1 ? "upload" : "uploads"} · {u.totalUpvotes} upvotes
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="p-4">
        <RailHeading
          action={
            <Link
              href="/academics/study-material/playlists/new"
              onClick={() => sounds.tap()}
              className="inline-flex min-h-9 items-center gap-1 rounded-full px-2 text-sm font-semibold text-brand-text transition-ui hover:bg-brand-subtle"
            >
              <Plus className="size-4" aria-hidden="true" />
              New
            </Link>
          }
        >
          Playlists
        </RailHeading>
        {playlistsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : playlistsError ? (
          <p className="text-sm text-fg-muted">Couldn't load playlists.</p>
        ) : playlists.length > 0 ? (
          <ul className="-mx-2">
            {playlists.slice(0, 3).map((playlist) => (
              <li key={playlist.id}>
                <Link
                  href={`/academics/study-material/playlists/${playlist.slug || playlist.id}`}
                  onClick={() => sounds.tap()}
                  className="block min-h-11 rounded-sm px-2 py-2 transition-ui hover:bg-surface-muted"
                >
                  <span className="line-clamp-2 text-sm font-medium text-fg">{playlist.title}</span>
                  <span className="block text-xs text-fg-muted tabular-nums">
                    {playlist.semester
                      ? `Sem ${playlist.semester}`
                      : playlist.branch === "All"
                        ? "All branches"
                        : playlist.branch}{" "}
                    · {playlist.itemsCount} {playlist.itemsCount === 1 ? "file" : "files"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-fg-muted">
            No playlists yet. Group notes for one subject into a playlist.
          </p>
        )}
      </section>
    </aside>
  );
}
