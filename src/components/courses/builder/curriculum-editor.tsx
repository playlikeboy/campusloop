"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { fieldClassName as field } from "@/components/ui/input";
import type { SectionInput } from "@/lib/courses/validate";
import { cn } from "@/lib/utils";
import { type EditableLecture, iconBtn, LectureEditor } from "./lecture-editor";

export type { EditableLecture } from "./lecture-editor";
export type EditableSection = Omit<SectionInput, "lectures"> & { key: string; lectures: EditableLecture[] };

export const key = () => Math.random().toString(36).slice(2, 10);

function move<T>(arr: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

export function CurriculumEditor({
  sections,
  onChange,
}: {
  sections: EditableSection[];
  onChange: (s: EditableSection[]) => void;
}) {
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const setSection = (i: number, s: EditableSection) => onChange(sections.map((x, j) => (j === i ? s : x)));
  const deleteSection = (i: number) => onChange(sections.filter((_, j) => j !== i));
  return (
    <div className="space-y-4">
      {sections.map((s, si) => (
        <div key={s.key} className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <span className="sr-only">Section {si + 1}</span>
            <input
              value={s.title}
              onChange={(e) => setSection(si, { ...s, title: e.target.value })}
              aria-label={`Section ${si + 1} title`}
              placeholder="Section title, e.g. Getting started"
              className={cn(field, "h-11 min-w-0 flex-1 font-semibold")}
            />
            <button
              type="button"
              onClick={() => onChange(move(sections, si, -1))}
              disabled={si === 0}
              aria-label="Move section up"
              className={iconBtn}
            >
              <ArrowUp className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onChange(move(sections, si, 1))}
              disabled={si === sections.length - 1}
              aria-label="Move section down"
              className={iconBtn}
            >
              <ArrowDown className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => (s.lectures.length > 0 ? setPendingDelete(si) : deleteSection(si))}
              aria-label="Delete section"
              className={cn(iconBtn, "hover:text-danger")}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
          <ol className="mt-3 space-y-3">
            {s.lectures.map((l, li) => (
              <li key={l.key} className="rounded-md bg-surface-muted p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tabular-nums text-fg-muted">{li + 1}.</span>
                  <input
                    value={l.title}
                    onChange={(e) =>
                      setSection(si, {
                        ...s,
                        lectures: s.lectures.map((x, j) => (j === li ? { ...l, title: e.target.value } : x)),
                      })
                    }
                    aria-label={`Lecture ${li + 1} title`}
                    placeholder="Lecture title"
                    className={cn(field, "h-11 min-w-0 flex-1")}
                  />
                  <button
                    type="button"
                    onClick={() => setSection(si, { ...s, lectures: move(s.lectures, li, -1) })}
                    disabled={li === 0}
                    aria-label="Move lecture up"
                    className={iconBtn}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection(si, { ...s, lectures: move(s.lectures, li, 1) })}
                    disabled={li === s.lectures.length - 1}
                    aria-label="Move lecture down"
                    className={iconBtn}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection(si, { ...s, lectures: s.lectures.filter((_, j) => j !== li) })}
                    aria-label="Delete lecture"
                    className={cn(iconBtn, "hover:text-danger")}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                <LectureEditor
                  l={l}
                  onChange={(nl) =>
                    setSection(si, { ...s, lectures: s.lectures.map((x, j) => (j === li ? nl : x)) })
                  }
                />
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() =>
              setSection(si, {
                ...s,
                lectures: [
                  ...s.lectures,
                  { key: key(), title: "", kind: "VIDEO", videoUrl: "", durationMin: 0, attachments: [] },
                ],
              })
            }
            className="mt-3 inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full bg-surface-muted px-4 text-sm font-semibold text-fg transition-ui hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-4" aria-hidden /> Add lecture
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...sections, { key: key(), title: "", lectures: [] }])}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong text-sm font-semibold text-fg-muted transition-ui hover:border-brand hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="size-4" aria-hidden /> Add section
      </button>
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Delete this section?"
        description="Its lectures are removed too."
        confirmText="Delete section"
        onConfirm={() => {
          if (pendingDelete !== null) deleteSection(pendingDelete);
          setPendingDelete(null);
        }}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
