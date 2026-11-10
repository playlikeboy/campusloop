"use client";

import { Clock, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { courseAction } from "@/hooks/use-courses";
import { fetcher } from "@/lib/api";
import { formatClock } from "@/lib/courses/format";

interface Note {
  id: string;
  lectureId: string;
  atSec: number;
  body: string;
}

/** Private timestamped notes. Clicking a timestamp seeks the video there. */
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
  const { data, mutate } = useSWR<{ notes: Note[] }>(`/api/courses/${slug}/notes`, fetcher);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<"lecture" | "all">("lecture");
  const notes = (data?.notes ?? []).filter((n) => scope === "all" || n.lectureId === lectureId);

  async function add() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await courseAction(`/api/courses/${slug}/notes`, { lectureId, atSec: Math.floor(currentTime()), body: text });
      setText("");
      await mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save note");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-muted/40 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add();
            e.stopPropagation();
          }}
          rows={2}
          maxLength={1000}
          placeholder="Write a note at the current time. Ctrl+Enter to save."
          className="w-full resize-none rounded-xl bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{text.length}/1000</span>
          <button type="button" onClick={add} disabled={busy || !text.trim()} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50 cursor-pointer">
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Save note
          </button>
        </div>
      </div>
      <div className="flex gap-1" role="tablist" aria-label="Which notes">
        {(["lecture", "all"] as const).map((s) => (
          <button key={s} type="button" role="tab" aria-selected={scope === s} onClick={() => setScope(s)} className={`h-8 rounded-full px-3 text-xs font-semibold cursor-pointer ${scope === s ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground"}`}>
            {s === "lecture" ? "This lecture" : "All lectures"}
          </button>
        ))}
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet. Notes are private to you.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="group rounded-xl bg-card/60 p-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => onSeek(n.lectureId, n.atSec)} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold tabular-nums text-primary hover:bg-primary/15 cursor-pointer">
                  <Clock className="size-3" aria-hidden /> {formatClock(n.atSec)}
                </button>
                {scope === "all" && <span className="truncate text-xs text-muted-foreground">{lectureTitles[n.lectureId]}</span>}
                <button
                  type="button"
                  onClick={async () => {
                    await courseAction(`/api/courses/${slug}/notes?id=${n.id}`, undefined, "DELETE").catch(() => {});
                    mutate();
                  }}
                  aria-label="Delete note"
                  className="ml-auto flex size-7 items-center justify-center rounded-full text-muted-foreground opacity-60 hover:bg-muted hover:text-destructive group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
