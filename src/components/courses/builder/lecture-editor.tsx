"use client";

import { CheckCircle2, FileText, Link2, PlayCircle, Plus, Trash2 } from "lucide-react";
import { fieldClassName as field } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { parseVideoUrl, videoThumbnail } from "@/lib/courses/format";
import type { LectureInput } from "@/lib/courses/validate";
import { cn } from "@/lib/utils";

export type EditableLecture = LectureInput & { key: string };

const KINDS = [
  { v: "VIDEO", l: "Video", icon: PlayCircle },
  { v: "ARTICLE", l: "Article", icon: FileText },
  { v: "LINK", l: "Link", icon: Link2 },
] as const;

export const iconBtn =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30";

const PROVIDER_LABEL: Record<string, string> = {
  file: "Video file",
  youtube: "YouTube video",
  dailymotion: "Dailymotion video",
  drive: "Google Drive video",
  archiveorg: "Archive.org video",
  vimeo: "Vimeo video",
};

/** One lecture's body: type, link or text, length, preview flag and files. */
export function LectureEditor({
  l,
  onChange,
}: {
  l: EditableLecture;
  onChange: (l: EditableLecture) => void;
}) {
  const video = l.kind === "VIDEO" ? parseVideoUrl(l.videoUrl ?? "") : null;
  const thumb = video ? videoThumbnail(video.provider, video.ref) : null;
  const attachments = l.attachments ?? [];
  return (
    <div className="space-y-3 pt-3">
      <SegmentedControl
        aria-label="Lecture type"
        size="sm"
        value={l.kind ?? "VIDEO"}
        onChange={(v) => onChange({ ...l, kind: v })}
        options={KINDS.map((k) => ({
          value: k.v,
          label: k.l,
          icon: <k.icon className="size-3.5" aria-hidden />,
        }))}
      />
      {l.kind !== "ARTICLE" && (
        <div className="flex gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <input
              value={l.videoUrl ?? ""}
              onChange={(e) => onChange({ ...l, videoUrl: e.target.value })}
              aria-label={l.kind === "VIDEO" ? "Video link" : "Link"}
              placeholder={l.kind === "VIDEO" ? "Paste a video link" : "https://..."}
              className={cn(field, "h-11")}
            />
            {l.kind === "VIDEO" && l.videoUrl && (
              <p
                className={cn(
                  "flex items-center gap-1 text-xs",
                  video ? "text-verified-text" : "text-danger"
                )}
              >
                {video ? (
                  <>
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    {PROVIDER_LABEL[video.provider] ?? "Video"} found
                  </>
                ) : (
                  "We can't play this link. Use YouTube, Dailymotion, Drive, Archive.org, Vimeo or an .mp4 link."
                )}
              </p>
            )}
          </div>
          {thumb && <img src={thumb} alt="" className="aspect-video w-28 shrink-0 rounded-sm object-cover" />}
        </div>
      )}
      <textarea
        value={l.body ?? ""}
        onChange={(e) => onChange({ ...l, body: e.target.value })}
        rows={l.kind === "ARTICLE" ? 8 : 2}
        aria-label={l.kind === "ARTICLE" ? "Lesson text" : "Lecture description"}
        placeholder={
          l.kind === "ARTICLE" ? "Write the lesson. Markdown works." : "Short description (optional)"
        }
        className={cn(field, "resize-y py-2.5")}
      />
      <div className="flex flex-wrap items-center gap-4">
        {l.kind === "VIDEO" && (
          <label className="flex items-center gap-2 text-sm text-fg">
            Length
            <input
              type="number"
              min={0}
              max={600}
              value={l.durationMin ?? 0}
              onChange={(e) => onChange({ ...l, durationMin: Number(e.target.value) })}
              className={cn(field, "h-11 w-20 tabular-nums")}
            />
            min
          </label>
        )}
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            checked={Boolean(l.isPreview)}
            onChange={(e) => onChange({ ...l, isPreview: e.target.checked })}
            className="size-4"
          />
          Free preview
        </label>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-fg-muted">Files (slides, code, PDFs)</p>
        {attachments.map((a, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={a.label}
              onChange={(e) =>
                onChange({
                  ...l,
                  attachments: attachments.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                })
              }
              aria-label="File name"
              placeholder="Name"
              className={cn(field, "h-11 w-32 sm:w-44")}
            />
            <input
              value={a.url}
              onChange={(e) =>
                onChange({
                  ...l,
                  attachments: attachments.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)),
                })
              }
              aria-label="File link"
              placeholder="https://..."
              className={cn(field, "h-11 min-w-0 flex-1")}
            />
            <button
              type="button"
              onClick={() => onChange({ ...l, attachments: attachments.filter((_, j) => j !== i) })}
              aria-label="Remove file"
              className={iconBtn}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ))}
        {attachments.length < 20 && (
          <button
            type="button"
            onClick={() => onChange({ ...l, attachments: [...attachments, { label: "", url: "" }] })}
            className="inline-flex h-11 cursor-pointer items-center gap-1 text-sm font-semibold text-brand-text hover:underline"
          >
            <Plus className="size-4" aria-hidden /> Add a file
          </button>
        )}
      </div>
    </div>
  );
}
