"use client";

import { FolderPlus } from "lucide-react";
import Link from "next/link";
import { AcademicPlaylistCard } from "@/components/academics/academic-playlist-card";
import { AcademicCard } from "@/components/communities/academic-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface NotesTabProps {
  playlists: any[];
  resources: any[];
  isLoading: boolean;
  isOwnProfile: boolean;
  username: string;
  currentUserId?: string;
}

export function NotesTab({
  playlists,
  resources,
  isLoading,
  isOwnProfile,
  username,
  currentUserId,
}: NotesTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4" aria-busy="true">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    );
  }

  const ownerActions = isOwnProfile ? (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm">
        <Link href="/academics">Upload notes</Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href="/academics/study-material/playlists/new">Make a playlist</Link>
      </Button>
    </div>
  ) : undefined;

  if (playlists.length === 0 && resources.length === 0) {
    return (
      <EmptyState
        icon={FolderPlus}
        title="No notes shared yet"
        description={
          isOwnProfile
            ? "Share notes or PYQs to help your batch."
            : `@${username} hasn't shared any notes yet.`
        }
        action={ownerActions}
      />
    );
  }

  return (
    <div className="space-y-6 p-4">
      {ownerActions}

      {playlists.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base text-fg">Playlists</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {playlists.map((pl) => (
              <AcademicPlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        </section>
      )}

      {resources.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base text-fg">Notes and PYQs</h2>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {resources.map((res) => (
              <AcademicCard key={res.id} item={res} currentUserId={currentUserId} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
