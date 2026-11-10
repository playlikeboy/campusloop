"use client";

import { Check, Circle, GraduationCap, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEVEL_LABEL } from "@/lib/courses/format";
import { cn } from "@/lib/utils";
import { lectureCount } from "../lecture-kind";

interface Props {
  title: string;
  subtitle?: string;
  level?: string;
  lectures: number;
  preview: string | null;
  checklist: { label: string; done: boolean }[];
  nextStep?: string;
  canPublish: boolean;
  canSaveDraft: boolean;
  busy: "draft" | "publish" | "delete" | null;
  editing: boolean;
  onPublish: () => void;
  onSaveDraft: () => void;
  onDelete: () => void;
}

/** Builder side panel: live card preview, publish checklist and save actions. */
export function PublishPanel(p: Props) {
  return (
    <div className="sticky top-6 space-y-4">
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="aspect-video bg-surface-muted">
          {p.preview ? (
            <img src={p.preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-fg-subtle">
              <GraduationCap className="size-10" aria-hidden />
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="line-clamp-2 font-bold text-fg">{p.title || "Your course title"}</p>
          <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{p.subtitle || "Your one-line subtitle"}</p>
          <p className="mt-2 text-xs tabular-nums text-fg-muted">
            {lectureCount(p.lectures)} · {LEVEL_LABEL[p.level ?? "ALL"]}
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="font-sans text-sm font-bold text-fg">Before you publish</h2>
        <ul className="mt-2 space-y-1.5">
          {p.checklist.map((c) => (
            <li
              key={c.label}
              className={cn("flex items-center gap-2 text-sm", c.done ? "text-fg" : "text-fg-muted")}
            >
              {c.done ? (
                <Check className="size-4 shrink-0 text-verified-text" role="img" aria-label="Done" />
              ) : (
                <Circle className="size-4 shrink-0" role="img" aria-label="To do" />
              )}{" "}
              {c.label}
            </li>
          ))}
        </ul>
        {p.nextStep && <p className="mt-2 text-xs text-fg-muted">Next: {p.nextStep}</p>}
        <div className="mt-4 grid gap-2">
          <Button
            onClick={p.onPublish}
            loading={p.busy === "publish"}
            disabled={p.busy !== null || !p.canPublish}
          >
            {p.editing ? "Save and publish" : "Publish course"}
          </Button>
          <Button
            variant="secondary"
            onClick={p.onSaveDraft}
            loading={p.busy === "draft"}
            disabled={p.busy !== null || !p.canSaveDraft}
          >
            Save draft
          </Button>
          {p.editing && (
            <Button
              variant="ghost"
              onClick={p.onDelete}
              disabled={p.busy !== null}
              className="text-danger hover:bg-danger-subtle"
            >
              <Trash2 aria-hidden /> Delete course
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
