"use client";

import { Library, Loader2, SearchX, Upload } from "lucide-react";
import Link from "next/link";
import { AcademicCard } from "@/components/communities/academic-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResultsProps {
  isPlaylistsTab: boolean;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  isReachingEnd: boolean;
  items: any[];
  playlists: any[];
  viewMode: "grid" | "list";
  profileId: string | null;
  query: string;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  setLoadMoreNode: (node: HTMLDivElement | null) => void;
}

function LoadingGrid({ list }: { list?: boolean }) {
  return (
    <div
      className={list ? "space-y-3" : "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"}
      role="status"
    >
      <span className="sr-only">Loading results</span>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className={list ? "h-32 w-full rounded-lg" : "h-56 w-full rounded-lg"} />
      ))}
    </div>
  );
}

export function SearchResults({
  isPlaylistsTab,
  isInitialLoading,
  isLoadingMore,
  isReachingEnd,
  items,
  playlists,
  viewMode,
  profileId,
  query,
  hasActiveFilters,
  onResetFilters,
  setLoadMoreNode,
}: SearchResultsProps) {
  const userId = profileId || undefined;

  if (isInitialLoading) return <LoadingGrid list={viewMode === "list" && !isPlaylistsTab} />;

  if (isPlaylistsTab) {
    if (playlists.length === 0) {
      return (
        <EmptyState
          bordered
          icon={Library}
          title="No playlists found"
          description={
            query ? `Nothing matches "${query}". Make one for your class.` : "Make one for your class."
          }
          action={
            <Button asChild>
              <Link href="/academics/study-material/playlists/new">Make a playlist</Link>
            </Button>
          }
        />
      );
    }
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {playlists.map((playlist) => (
          <AcademicCard key={playlist.id} item={playlist} currentUserId={userId} variant="grid" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        bordered
        icon={SearchX}
        title="No notes found"
        description={
          hasActiveFilters
            ? "Try clearing filters or searching a course code like CS201."
            : "Try a course code like CS201 or a broader topic."
        }
        action={
          hasActiveFilters ? (
            <Button variant="secondary" onClick={onResetFilters}>
              Clear filters
            </Button>
          ) : (
            <Button asChild>
              <Link href="/academics/study-material/upload">
                <Upload className="size-4" aria-hidden="true" />
                Upload notes
              </Link>
            </Button>
          )
        }
      />
    );
  }

  return (
    <>
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <AcademicCard key={item.id} item={item} currentUserId={userId} variant="grid" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {items.map((item) => (
            <AcademicCard key={item.id} item={item} currentUserId={userId} variant="row" />
          ))}
        </div>
      )}

      <div ref={setLoadMoreNode} className="flex min-h-16 flex-col items-center justify-center p-4">
        {isLoadingMore && (
          <p className="flex items-center gap-2 py-3 text-sm text-fg-muted" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading more
          </p>
        )}
        {isReachingEnd && (
          <p className="py-6 text-center text-sm text-fg-muted">
            That's everything.{" "}
            <Link
              href="/academics/study-material/upload"
              className="font-semibold text-brand-text hover:underline"
            >
              Upload what's missing
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
