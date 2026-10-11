"use client";

import {
  ArrowRight,
  BookOpen,
  FolderPlus,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useScrollIsolation } from "@/hooks/use-scroll-isolation";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { AcademicPlaylistData } from "@/components/academics/academic-playlist-card";

interface AcademicContextRailProps {
  onSelectTopic?: (topic: string) => void;
  collegeName?: string;
  userSemester?: number;
  userBranch?: string;
  playlists?: AcademicPlaylistData[];
  playlistsLoading?: boolean;
}

const POPULAR_THIS_WEEK = [
  {
    code: "CS302",
    name: "Database Management Systems",
    tag: "PYQ + Notes",
    views: "2.4k views",
  },
  {
    code: "CS201",
    name: "Data Structures & Algorithms",
    tag: "Exam Solved",
    views: "1.9k views",
  },
  {
    code: "CS303",
    name: "Operating Systems",
    tag: "Quantum Notes",
    views: "1.6k views",
  },
  {
    code: "MA101",
    name: "Engineering Mathematics I",
    tag: "Cheat Sheets",
    views: "1.2k views",
  },
];



export function AcademicContextRail({
  onSelectTopic,
  collegeName = "BIT Mesra",
  userSemester = 5,
  userBranch = "Computer Science",
  playlists = [],
  playlistsLoading = false,
}: AcademicContextRailProps) {
  const scrollRef = useScrollIsolation<HTMLElement>();

  return (
    <aside
      ref={scrollRef}
      className="hidden xl:flex flex-col gap-4.5 w-72 shrink-0 select-none sticky top-4 h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain no-scrollbar pr-1 pb-16"
    >
      {/* ─── 1. Personalized Context Pill ─── */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-4 space-y-2">
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
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="size-3.5 text-primary" />
            <span>Popular this week</span>
          </div>
        </div>

        <div className="space-y-1 divide-y divide-border/20 -mx-1">
          {POPULAR_THIS_WEEK.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                sounds.tap();
                if (onSelectTopic) onSelectTopic(item.code);
              }}
              className="w-full pt-2 first:pt-0 pb-1 px-1 flex items-start justify-between text-left hover:bg-muted/40 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                    {item.code}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">·</span>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {item.tag}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground truncate mt-0.5">
                  {item.name}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums">
                {item.views}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3. Curated Study Stacks / Playlists ─── */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <FolderPlus className="size-3.5 text-indigo-400" />
            <span>Study Playlists</span>
          </div>
          <Link
            href="/academics/playlists/new"
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
          ) : playlists.length > 0 ? (
            playlists.slice(0, 2).map((playlist) => (
              <Link
                key={playlist.id}
                href={`/academics/playlists/${playlist.slug || playlist.id}`}
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
                href="/academics/playlists/new"
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
