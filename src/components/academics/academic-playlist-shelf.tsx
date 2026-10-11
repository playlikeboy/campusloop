"use client";

import { ArrowRight, BookOpenCheck, Layers3, RefreshCw, Sparkles } from "lucide-react";
import { AcademicPlaylistCard, type AcademicPlaylistData } from "@/components/academics/academic-playlist-card";

interface AcademicPlaylistShelfProps {
  playlists: AcademicPlaylistData[];
  isLoading: boolean;
  error?: unknown;
  onRetry: () => void;
  onViewAll: () => void;
}

export function AcademicPlaylistShelf({
  playlists,
  isLoading,
  error,
  onRetry,
  onViewAll,
}: AcademicPlaylistShelfProps) {
  if (!isLoading && !error && playlists.length === 0) return null;

  return (
    <section aria-labelledby="academic-playlists-heading" className="space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
            <BookOpenCheck className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="academic-playlists-heading" className="text-sm font-extrabold tracking-tight text-foreground sm:text-base">
                Study playlists
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Sparkles className="size-3" aria-hidden="true" />
                Curated study stacks
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Notes and PYQs, thoughtfully bundled by students.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-bold text-primary transition-colors hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span className="hidden sm:inline">View all</span>
          <span className="sm:hidden">All</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden pb-1" aria-label="Loading study playlists" aria-busy="true">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-44 w-[min(82vw,248px)] shrink-0 animate-pulse rounded-2xl border border-border/30 bg-card/60"
            >
              <div className="h-1.5 rounded-t-2xl bg-muted" />
              <div className="space-y-3 p-3.5">
                <div className="flex gap-3">
                  <div className="size-10 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-2 w-24 rounded bg-muted" />
                    <div className="h-2 w-16 rounded bg-muted" />
                  </div>
                </div>
                <div className="h-4 w-4/5 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/50 p-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Layers3 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">Study playlists couldn’t load just now.</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {playlists.slice(0, 3).map((playlist) => (
            <AcademicPlaylistCard key={playlist.id} playlist={playlist} variant="compact" />
          ))}
        </div>
      )}
    </section>
  );
}
