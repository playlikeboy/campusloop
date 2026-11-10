"use client";

import { Clock, NotebookPen, Trash2, WifiOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { courseAction } from "@/hooks/use-courses";
import { fetcher } from "@/lib/api";
import { formatClock } from "@/lib/courses/format";

interface Note {
  id: string;
  lectureId: string;
  atSec: number;
  body: string;
}

/** Private timestamped notes. Tapping a timestamp jumps the video there. */
export function NotesPanel({
  slug,
  lectureId,
  lectureTitles,
  currentTime,
  onSeek,
}: {
  slug: string;
  lectureId: string;
  lectureTitles: Record<string, string>;
  currentTime: () => number;
  onSeek: (lectureId: string, sec: number) => void;
}) {
  const { data, error, mutate } = useSWR<{ notes: Note[] }>(`/api/courses/${slug}/notes`, fetcher);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<"lecture" | "all">("lecture");
  const notes = (data?.notes ?? []).filter((n) => scope === "all" || n.lectureId === lectureId);

  async function add() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await courseAction(`/api/courses/${slug}/notes`, {
        lectureId,
        atSec: Math.floor(currentTime()),
        body: text,
      });
      setText("");
      await mutate();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Couldn't save your note. Check your connection and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await courseAction(`/api/courses/${slug}/notes?id=${id}`, undefined, "DELETE");
    } catch {
      toast.error("Couldn't delete that note. Try again.");
    }
    mutate();
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="note-input" className="text-sm font-semibold text-fg">
          Add a note at this moment
        </label>
        <Textarea
          id="note-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add();
            e.stopPropagation();
          }}
          rows={2}
          maxLength={1000}
          placeholder="Only you can see your notes"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs tabular-nums text-fg-subtle">{text.length}/1000</span>
          <Button onClick={add} loading={busy} disabled={!text.trim()}>
            Save note
          </Button>
        </div>
      </div>

      <SegmentedControl
        aria-label="Which notes to show"
        size="sm"
        value={scope}
        onChange={setScope}
        options={[
          { value: "lecture", label: "This lecture" },
          { value: "all", label: "All lectures" },
        ]}
      />

      {error ? (
        <EmptyState
          size="compact"
          icon={WifiOff}
          title="Couldn't load your notes"
          description="Check your connection, then try again."
          action={
            <Button variant="secondary" onClick={() => mutate()}>
              Try again
            </Button>
          }
        />
      ) : !data ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          size="compact"
          icon={NotebookPen}
          title="No notes yet"
          description="Write one above. It's saved with the video time."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {notes.map((n) => (
            <li key={n.id} className="p-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="pill"
                  onClick={() => onSeek(n.lectureId, n.atSec)}
                  className="tabular-nums"
                  aria-label={`Jump to ${formatClock(n.atSec)}`}
                >
                  <Clock aria-hidden /> {formatClock(n.atSec)}
                </Button>
                {scope === "all" && (
                  <span className="min-w-0 truncate text-xs text-fg-muted">{lectureTitles[n.lectureId]}</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(n.id)}
                  aria-label="Delete note"
                  className="ml-auto text-fg-muted hover:text-danger"
                >
                  <Trash2 />
                </Button>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-fg">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
