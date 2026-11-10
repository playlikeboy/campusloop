"use client";

import { Check, Heart, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { splitStoryClasses } from "@/components/stories/story-format";
import { cn } from "@/lib/utils";

interface ArchivedStory {
  id: string;
  mediaUrl: string | null;
  text: string | null;
  backgroundColor: string | null;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  likesCount: number;
  isHighlighted: boolean;
}

const fetcher = async (url: string): Promise<ArchivedStory[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load archive");
  return res.json() as Promise<ArchivedStory[]>;
};

interface StoryArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHighlightCreated: () => void;
}

/** Your old stories. Pick some and give them a name to make a highlight. */
export function StoryArchiveModal({ isOpen, onClose, onHighlightCreated }: StoryArchiveModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [picking, setPicking] = useState(false);

  const {
    data: stories,
    isLoading,
    error,
    mutate,
  } = useSWR<ArchivedStory[]>(isOpen ? "/api/stories/archive" : null, fetcher);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function createHighlight(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || selected.length === 0 || isCreating) return;
    setIsCreating(true);
    try {
      const coverUrl = stories?.find((s) => selected.includes(s.id) && s.mediaUrl)?.mediaUrl || null;
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim().slice(0, 30), coverUrl, storyIds: selected }),
      });
      if (!res.ok) throw new Error("Failed to create highlight");
      toast.success(`Added "${title.trim()}" to your profile`);
      onHighlightCreated();
    } catch {
      toast.error("Couldn't make the highlight. Try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col">
        <DialogHeader>
          <DialogTitle>{picking ? "New highlight" : "Story archive"}</DialogTitle>
          <DialogDescription>
            {picking
              ? `Pick stories to add. ${selected.length} picked.`
              : "Only you can see your old stories."}
          </DialogDescription>
        </DialogHeader>

        {picking ? (
          <form onSubmit={createHighlight} className="mb-4 flex items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name it, e.g. Fest 2025"
              maxLength={30}
              aria-label="Highlight name"
              autoFocus
              className="flex-1"
            />
            <Button type="submit" loading={isCreating} disabled={!title.trim() || selected.length === 0}>
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPicking(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          stories &&
          stories.length > 0 && (
            <Button className="mb-4 self-start" onClick={() => setPicking(true)}>
              <Plus aria-hidden="true" />
              New highlight
            </Button>
          )
        )}

        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="aspect-9/16 rounded-md" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              size="compact"
              title="Couldn't load your stories"
              description="Check your connection and try again."
              action={<Button onClick={() => void mutate()}>Try again</Button>}
            />
          ) : stories && stories.length > 0 ? (
            <ul className="grid grid-cols-3 gap-2">
              {stories.map((story) => {
                const isSelected = selected.includes(story.id);
                const date = new Date(story.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                });
                return (
                  <li key={story.id}>
                    <button
                      type="button"
                      aria-pressed={picking ? isSelected : undefined}
                      aria-label={`Story from ${date}`}
                      onClick={() =>
                        picking ? toggle(story.id) : window.open(`/story/${story.id}`, "_blank")
                      }
                      className={cn(
                        "relative block aspect-9/16 w-full cursor-pointer overflow-hidden rounded-md bg-surface-muted outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected && "ring-2 ring-brand ring-offset-2 ring-offset-surface-raised"
                      )}
                    >
                      {story.mediaUrl ? (
                        <img src={story.mediaUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <span
                          className={cn(
                            "flex size-full items-center justify-center p-2 text-center text-xs font-semibold",
                            splitStoryClasses(story.backgroundColor).background,
                            "text-story-field-fg"
                          )}
                        >
                          <span className="line-clamp-4">{story.text}</span>
                        </span>
                      )}
                      <span className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1">
                        <span className="rounded-full bg-surface px-1.5 text-xs font-medium text-fg">
                          {date}
                        </span>
                        {!picking && story.likesCount > 0 && (
                          <span className="flex items-center gap-0.5 rounded-full bg-surface px-1.5 text-xs font-medium text-fg">
                            <Heart aria-hidden="true" className="size-3" />
                            {story.likesCount}
                          </span>
                        )}
                      </span>
                      {picking && (
                        <span
                          className={cn(
                            "absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-2",
                            isSelected
                              ? "border-brand bg-brand text-brand-fg"
                              : "border-surface bg-overlay text-transparent"
                          )}
                        >
                          <Check aria-hidden="true" className="size-3.5" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              size="compact"
              title="No old stories yet"
              description="Stories you post land here after 24 hours."
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
