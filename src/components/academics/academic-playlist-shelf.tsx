"use client";

import { ArrowRight } from "lucide-react";
import {
  AcademicPlaylistCard,
  type AcademicPlaylistData,
} from "@/components/academics/academic-playlist-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AcademicPlaylistShelfProps {
  playlists: AcademicPlaylistData[];
  isLoading: boolean;
  error?: unknown;
  onRetry: () => void;
  onViewAll: () => void;
}

/** Horizontal shelf of up to 3 playlists on the "For you" view. Hidden when there are none. */
export function AcademicPlaylistShelf({
  playlists,
  isLoading,
  error,
  onRetry,
  onViewAll,
}: AcademicPlaylistShelfProps) {
  if (!isLoading && !error && playlists.length === 0) return null;

  return (
    <section aria-labelledby="academic-playlists-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="academic-playlists-heading" className="text-lg text-fg">
          Playlists
        </h2>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          See all
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden" role="status" aria-label="Loading playlists">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-[min(80vw,260px)] shrink-0 rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-fg-muted">Couldn't load playlists.</p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
          {playlists.slice(0, 3).map((playlist) => (
            <AcademicPlaylistCard key={playlist.id} playlist={playlist} variant="compact" />
          ))}
        </div>
      )}
    </section>
  );
}
