"use client";

import { ArrowDown, ArrowUp, CheckCircle2, FileText, Link2, PlayCircle, Plus, Trash2 } from "lucide-react";
import { parseVideoUrl, videoThumbnail } from "@/lib/courses/format";
import type { LectureInput, SectionInput } from "@/lib/courses/validate";
import { cn } from "@/lib/utils";

export type EditableLecture = LectureInput & { key: string };
export type EditableSection = Omit<SectionInput, "lectures"> & { key: string; lectures: EditableLecture[] };

const KINDS = [
  { v: "VIDEO", l: "Video", icon: PlayCircle },
  { v: "ARTICLE", l: "Article", icon: FileText },
  { v: "LINK", l: "Link", icon: Link2 },
] as const;

const field = "w-full rounded-xl bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
export const key = () => Math.random().toString(36).slice(2, 10);

function move<T>(arr: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

function LectureEditor({ l, onChange }: { l: EditableLecture; onChange: (l: EditableLecture) => void }) {
  const video = l.kind === "VIDEO" ? parseVideoUrl(l.videoUrl ?? "") : null;
  const thumb = video ? videoThumbnail(video.provider, video.ref) : null;
  const attachments = l.attachments ?? [];
  return (
    <div className="space-y-3 pt-3">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Lecture type">
        {KINDS.map((k) => (
          <button key={k.v} type="button" role="radio" aria-checked={l.kind === k.v} onClick={() => onChange({ ...l, kind: k.v })} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold cursor-pointer", l.kind === k.v ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
            <k.icon className="size-3.5" aria-hidden /> {k.l}
          </button>
        ))}
      </div>
      {l.kind !== "ARTICLE" && (
        <div className="flex gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <input value={l.videoUrl ?? ""} onChange={(e) => onChange({ ...l, videoUrl: e.target.value })} placeholder={l.kind === "VIDEO" ? "YouTube, Dailymotion, Drive, Archive.org, Vimeo or .mp4 link" : "https:// link to the resource"} className={cn(field, "h-10")} />
            {l.kind === "VIDEO" && l.videoUrl && (
              <p className={cn("flex items-center gap-1 text-xs", video ? "text-primary" : "text-destructive")}>
                {video ? (
                  <>
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    {video.provider === "file"
                      ? "Video file"
                      : video.provider === "youtube"
                        ? "YouTube video"
                        : video.provider === "dailymotion"
                          ? "Dailymotion video"
                          : video.provider === "drive"
                            ? "Google Drive video"
                            : video.provider === "archiveorg"
                              ? "Archive.org video"
                              : "Vimeo video"}{" "}
                    detected
                  </>
                ) : (
                  "Not a supported video link yet"
                )}
              </p>
            )}
          </div>
          {thumb && <img src={thumb} alt="" className="aspect-video w-28 shrink-0 rounded-lg object-cover" />}
        </div>
      )}
      <textarea value={l.body ?? ""} onChange={(e) => onChange({ ...l, body: e.target.value })} rows={l.kind === "ARTICLE" ? 8 : 2} placeholder={l.kind === "ARTICLE" ? "Write the lesson in Markdown. Smart blocks and embeds work here." : "Lecture description (optional, Markdown)"} className={cn(field, "resize-y py-2")} />
      <div className="flex flex-wrap items-center gap-4">
        {l.kind === "VIDEO" && (
          <label className="flex items-center gap-2 text-sm text-foreground">
            Length
            <input type="number" min={0} max={600} value={l.durationMin ?? 0} onChange={(e) => onChange({ ...l, durationMin: Number(e.target.value) })} className={cn(field, "h-9 w-20")} />
            min
          </label>
        )}
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input type="checkbox" checked={Boolean(l.isPreview)} onChange={(e) => onChange({ ...l, isPreview: e.target.checked })} className="size-4 accent-[var(--primary)]" />
          Free preview
        </label>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Attachments (slides, code, PDFs)</p>
        {attachments.map((a, i) => (
          <div key={i} className="flex gap-2">
            <input value={a.label} onChange={(e) => onChange({ ...l, attachments: attachments.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="Label" className={cn(field, "h-9 w-32 sm:w-44")} />
            <input value={a.url} onChange={(e) => onChange({ ...l, attachments: attachments.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} placeholder="https://..." className={cn(field, "h-9 min-w-0 flex-1")} />
            <button type="button" onClick={() => onChange({ ...l, attachments: attachments.filter((_, j) => j !== i) })} aria-label="Remove attachment" className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted cursor-pointer"><Trash2 className="size-4" /></button>
          </div>
        ))}
        {attachments.length < 20 && (
          <button type="button" onClick={() => onChange({ ...l, attachments: [...attachments, { label: "", url: "" }] })} className="text-xs font-semibold text-primary hover:underline cursor-pointer">+ Add attachment</button>
        )}
      </div>
    </div>
  );
}

export function CurriculumEditor({ sections, onChange }: { sections: EditableSection[]; onChange: (s: EditableSection[]) => void }) {
  const setSection = (i: number, s: EditableSection) => onChange(sections.map((x, j) => (j === i ? s : x)));
  return (
    <div className="space-y-4">
      {sections.map((s, si) => (
        <div key={s.key} className="rounded-2xl bg-card/60 p-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Section {si + 1}</span>
            <input value={s.title} onChange={(e) => setSection(si, { ...s, title: e.target.value })} placeholder="Section title, e.g. Getting started" className={cn(field, "h-10 flex-1 font-semibold")} />
            <button type="button" onClick={() => onChange(move(sections, si, -1))} disabled={si === 0} aria-label="Move section up" className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"><ArrowUp className="size-4" /></button>
            <button type="button" onClick={() => onChange(move(sections, si, 1))} disabled={si === sections.length - 1} aria-label="Move section down" className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"><ArrowDown className="size-4" /></button>
            <button type="button" onClick={() => onChange(sections.filter((_, j) => j !== si))} aria-label="Delete section" className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-destructive cursor-pointer"><Trash2 className="size-4" /></button>
          </div>
          <ol className="mt-3 space-y-3">
            {s.lectures.map((l, li) => (
              <li key={l.key} className="rounded-xl bg-muted/40 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">{li + 1}.</span>
                  <input value={l.title} onChange={(e) => setSection(si, { ...s, lectures: s.lectures.map((x, j) => (j === li ? { ...l, title: e.target.value } : x)) })} placeholder="Lecture title" className={cn(field, "h-9 flex-1")} />
                  <button type="button" onClick={() => setSection(si, { ...s, lectures: move(s.lectures, li, -1) })} disabled={li === 0} aria-label="Move lecture up" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-background disabled:opacity-30 cursor-pointer"><ArrowUp className="size-4" /></button>
                  <button type="button" onClick={() => setSection(si, { ...s, lectures: move(s.lectures, li, 1) })} disabled={li === s.lectures.length - 1} aria-label="Move lecture down" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-background disabled:opacity-30 cursor-pointer"><ArrowDown className="size-4" /></button>
                  <button type="button" onClick={() => setSection(si, { ...s, lectures: s.lectures.filter((_, j) => j !== li) })} aria-label="Delete lecture" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-destructive cursor-pointer"><Trash2 className="size-4" /></button>
                </div>
                <LectureEditor l={l} onChange={(nl) => setSection(si, { ...s, lectures: s.lectures.map((x, j) => (j === li ? nl : x)) })} />
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => setSection(si, { ...s, lectures: [...s.lectures, { key: key(), title: "", kind: "VIDEO", videoUrl: "", durationMin: 0, attachments: [] }] })} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-muted/70 px-4 text-sm font-semibold text-foreground hover:bg-muted cursor-pointer">
            <Plus className="size-4" aria-hidden /> Add lecture
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...sections, { key: key(), title: "", lectures: [] }])} className="flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground cursor-pointer">
        <Plus className="size-4" aria-hidden /> Add section
      </button>
    </div>
  );
}
