"use client";

import { Check, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceTitle: string;
}

interface UserPlaylistSummary {
  id: string;
  slug: string;
  title: string;
  itemsCount: number;
}

export function AddToPlaylistModal({ isOpen, onClose, resourceId, resourceTitle }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<UserPlaylistSummary[]>([]);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Quick inline creation state
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/academics/playlists/me?resourceId=${encodeURIComponent(resourceId)}`)
      .then((res) => res.json())
      .then((data: any) => {
        if (!isMounted) return;
        if (data.playlists) {
          setPlaylists(data.playlists);
        }
        if (Array.isArray(data.containingPlaylistIds)) {
          setSelectedPlaylistIds(new Set(data.containingPlaylistIds));
        }
      })
      .catch((err) => {
        console.error("Failed to load user playlists:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, resourceId]);

  if (!isOpen) return null;

  async function handleToggle(playlist: UserPlaylistSummary) {
    if (isUpdating) return;
    sounds.tap();
    haptics.light();
    setIsUpdating(playlist.id);

    const isCurrentlyIn = selectedPlaylistIds.has(playlist.id);

    try {
      if (isCurrentlyIn) {
        // Remove from playlist
        const res = await fetch(
          `/api/academics/playlists/${playlist.id}/items?resourceId=${encodeURIComponent(resourceId)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Failed to remove");

        setSelectedPlaylistIds((prev) => {
          const next = new Set(prev);
          next.delete(playlist.id);
          return next;
        });
        toast.info(`Removed from "${playlist.title}"`);
      } else {
        // Add to playlist
        const res = await fetch(`/api/academics/playlists/${playlist.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId }),
        });
        if (!res.ok) throw new Error("Failed to add");

        setSelectedPlaylistIds((prev) => {
          const next = new Set(prev);
          next.add(playlist.id);
          return next;
        });
        sounds.pop();
        haptics.success();
        toast.success(`Added to "${playlist.title}"`);
      }
    } catch {
      toast.error("Couldn't update the playlist. Check your connection and try again.");
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleCreateNew(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || isCreating) return;

    sounds.tap();
    haptics.medium();
    setIsCreating(true);

    try {
      const res = await fetch("/api/academics/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          initialResourceIds: [resourceId],
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Sign in to make a playlist.");
        } else {
          toast.error("Couldn't create the playlist. Try again.");
        }
        return;
      }

      const data = (await res.json()) as any;
      if (data.playlist) {
        sounds.pop();
        haptics.success();
        toast.success(`Saved to new playlist "${data.playlist.title}"`);
        setPlaylists((prev) => [data.playlist, ...prev]);
        setSelectedPlaylistIds((prev) => new Set([...prev, data.playlist.id]));
        setNewTitle("");
        setIsCreatingNew(false);
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save to playlist</DialogTitle>
          <DialogDescription className="line-clamp-1">{resourceTitle}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-fg-muted" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading your playlists
          </div>
        ) : (
          <div className="space-y-3">
            {playlists.length > 0 ? (
              <ul className="max-h-64 space-y-1.5 overflow-y-auto">
                {playlists.map((pl) => {
                  const isChecked = selectedPlaylistIds.has(pl.id);
                  const isThisUpdating = isUpdating === pl.id;
                  return (
                    <li key={pl.id}>
                      <button
                        type="button"
                        aria-pressed={isChecked}
                        onClick={() => handleToggle(pl)}
                        disabled={isThisUpdating}
                        className={cn(
                          "flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-ui outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isChecked ? "border-brand bg-brand-subtle" : "border-border hover:bg-surface-muted"
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-fg">{pl.title}</span>
                          <span className="block text-xs text-fg-muted">
                            {pl.itemsCount} {pl.itemsCount === 1 ? "item" : "items"}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-sm border transition-ui",
                            isChecked ? "border-brand bg-brand text-brand-fg" : "border-border-strong"
                          )}
                          aria-hidden="true"
                        >
                          {isThisUpdating ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : isChecked ? (
                            <Check className="size-3.5" />
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              !isCreatingNew && (
                <p className="py-4 text-center text-sm text-fg-muted">No playlists yet. Make one below.</p>
              )
            )}

            {isCreatingNew ? (
              <form onSubmit={handleCreateNew} className="space-y-2">
                <label htmlFor="new-playlist-title" className="text-sm font-semibold text-fg">
                  Playlist name
                </label>
                <Input
                  id="new-playlist-title"
                  placeholder="e.g. Sem 4 endsem: OS, DBMS, CN"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  maxLength={120}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsCreatingNew(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!newTitle.trim()} loading={isCreating}>
                    Create and save
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setIsCreatingNew(true)}>
                <Plus className="size-4" aria-hidden="true" />
                New playlist
              </Button>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
