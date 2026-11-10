"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type Highlight = {
  id: string;
  title: string;
  coverUrl?: string | null;
  stories?: { id: string }[];
};

interface StoryHighlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  storyMediaUrl: string | null;
}

async function createHighlight(title: string, storyIds: string[], coverUrl: string | null) {
  const res = await fetch("/api/highlights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, coverUrl, storyIds }),
  });
  if (!res.ok) throw new Error();
}

/** Save the current story into a new or existing highlight on your profile. */
export function StoryHighlightDialog({
  open,
  onOpenChange,
  storyId,
  storyMediaUrl,
}: StoryHighlightDialogProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    fetch("/api/highlights")
      .then((res) => (res.ok ? (res.json() as Promise<Highlight[]>) : Promise.reject(new Error())))
      .then((data: Highlight[]) => {
        if (!cancelled) setHighlights(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function addToExisting(h: Highlight) {
    const existing = (h.stories ?? []).map((s) => s.id);
    if (existing.includes(storyId)) {
      toast.info(`Already in "${h.title}"`);
      return;
    }
    setSaving(true);
    try {
      // The API has no update yet: save a copy with this story added, then remove the old one.
      await createHighlight(h.title, [...existing, storyId], h.coverUrl ?? storyMediaUrl);
      await fetch(`/api/highlights/${h.id}`, { method: "DELETE" }).catch(() => {});
      toast.success(`Added to "${h.title}"`);
      onOpenChange(false);
    } catch {
      toast.error("Couldn't add to that highlight. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const clean = title.trim();
    if (!clean || saving) return;
    setSaving(true);
    try {
      await createHighlight(clean, [storyId], storyMediaUrl);
      toast.success(`Saved to "${clean}"`);
      setTitle("");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't create the highlight. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to highlight</DialogTitle>
          <DialogDescription>Highlights stay on your profile after the story ends.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        ) : loadFailed ? (
          <p className="text-sm text-danger">Couldn't load your highlights. You can still make a new one.</p>
        ) : highlights.length > 0 ? (
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {highlights.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => addToExisting(h)}
                  disabled={saving}
                  className="flex h-11 w-full cursor-pointer items-center justify-between rounded-md px-3 text-left text-sm font-medium transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <span className="truncate">{h.title}</span>
                  <Plus className="size-4 shrink-0 text-fg-muted" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-fg-muted">No highlights yet. Make your first one below.</p>
        )}

        <form onSubmit={handleCreate} className="mt-4 space-y-2 border-t border-border pt-4">
          <Label htmlFor="highlight-title">New highlight</Label>
          <Input
            id="highlight-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Fest week"
            maxLength={30}
          />
          <Button type="submit" className="w-full" loading={saving} disabled={!title.trim()}>
            Create and add
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
