"use client";

import { ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { CourseLecture, CourseSection } from "@/db/schema";
import { formatClock, formatDuration } from "@/lib/courses/format";
import { cn } from "@/lib/utils";
import { lectureIcon } from "../lecture-kind";

interface Props {
  slug: string;
  sections: (CourseSection & { lectures: CourseLecture[] })[];
  currentId: string;
  completed: Set<string>;
  onToggleComplete: (lectureId: string, done: boolean) => void;
  onClose?: () => void;
}

/** Course content list: sections, lectures and a done checkbox per lecture. */
export function CurriculumSidebar({
  slug,
  sections,
  currentId,
  completed,
  onToggleComplete,
  onClose,
}: Props) {
  const currentSection = sections.find((s) => s.lectures.some((l) => l.id === currentId))?.id;
  const [open, setOpen] = useState<Set<string>>(new Set(currentSection ? [currentSection] : []));
  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (currentSection) setOpen((o) => new Set(o).add(currentSection));
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentSection, currentId]);

  const toggle = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <h2 className="text-base font-bold text-fg">Course content</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Hide course content">
            <X />
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {sections.map((s) => {
          const isOpen = open.has(s.id);
          const done = s.lectures.filter((l) => completed.has(l.id)).length;
          return (
            <div key={s.id} className="border-t border-border">
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-expanded={isOpen}
                className="flex min-h-14 w-full cursor-pointer items-center gap-2 bg-surface-muted px-4 py-3 text-left transition-ui hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-fg">{s.title}</span>
                  <span className="mt-0.5 block text-xs tabular-nums text-fg-muted">
                    {done} of {s.lectures.length} done ·{" "}
                    {formatDuration(s.lectures.reduce((a, l) => a + l.durationSec, 0))}
                  </span>
                </span>
                <ChevronDown
                  className={cn("size-4 shrink-0 text-fg-muted transition-ui", isOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
              {isOpen && (
                <ul>
                  {s.lectures.map((l, li) => {
                    const active = l.id === currentId;
                    const isDone = completed.has(l.id);
                    const Icon = lectureIcon(l.kind);
                    return (
                      <li
                        key={l.id}
                        ref={active ? activeRef : undefined}
                        className={cn(
                          "flex items-start gap-1 pr-4",
                          active ? "bg-brand-subtle" : "hover:bg-surface-muted"
                        )}
                      >
                        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
                          <Checkbox
                            checked={isDone}
                            onCheckedChange={(v) => onToggleComplete(l.id, Boolean(v))}
                            aria-label={
                              isDone ? `Mark "${l.title}" as not done` : `Mark "${l.title}" as done`
                            }
                          />
                        </label>
                        <Link
                          replace
                          href={`/learn/${slug}/${l.id}`}
                          aria-current={active ? "page" : undefined}
                          className="min-w-0 flex-1 rounded-sm py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span
                            className={cn(
                              "block text-sm leading-snug",
                              active ? "font-semibold text-brand-text" : "text-fg"
                            )}
                          >
                            {li + 1}. {l.title}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs tabular-nums text-fg-muted">
                            <Icon className="size-3.5" aria-hidden />
                            {l.durationSec > 0
                              ? formatClock(l.durationSec)
                              : l.kind === "ARTICLE"
                                ? "Reading"
                                : "Link"}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
