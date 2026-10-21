"use client";

import { ChevronDown, FileText, Link2, PlayCircle, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CourseLecture, CourseSection } from "@/db/schema";
import { formatClock, formatDuration } from "@/lib/courses/format";
import { cn } from "@/lib/utils";

const ICON = { VIDEO: PlayCircle, ARTICLE: FileText, LINK: Link2 } as const;

interface Props {
  slug: string;
  sections: (CourseSection & { lectures: CourseLecture[] })[];
  currentId: string;
  completed: Set<string>;
  onToggleComplete: (lectureId: string, done: boolean) => void;
  onClose?: () => void;
}

/** Right-hand course content list: sections, lectures, completion checkboxes. */
export function CurriculumSidebar({ slug, sections, currentId, completed, onToggleComplete, onClose }: Props) {
  const currentSection = sections.find((s) => s.lectures.some((l) => l.id === currentId))?.id;
  const [open, setOpen] = useState<Set<string>>(new Set(currentSection ? [currentSection] : []));
  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (currentSection) setOpen((o) => new Set(o).add(currentSection));
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentSection, currentId]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <p className="font-bold text-foreground">Course content</p>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close course content" className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer">
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {sections.map((s, si) => {
          const isOpen = open.has(s.id);
          const done = s.lectures.filter((l) => completed.has(l.id)).length;
          return (
            <div key={s.id} className="border-t border-border/50">
              <button
                type="button"
                onClick={() =>
                  setOpen((o) => {
                    const n = new Set(o);
                    if (n.has(s.id)) n.delete(s.id);
                    else n.add(s.id);
                    return n;
                  })
                }
                aria-expanded={isOpen}
                className="flex w-full items-start gap-2 bg-muted/30 px-4 py-3 text-left hover:bg-muted/50 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">Section {si + 1}: {s.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {done}/{s.lectures.length} · {formatDuration(s.lectures.reduce((a, l) => a + l.durationSec, 0))}
                  </p>
                </div>
                <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
              </button>
              {isOpen && (
                <ul>
                  {s.lectures.map((l, li) => {
                    const active = l.id === currentId;
                    const Icon = ICON[l.kind as keyof typeof ICON] ?? PlayCircle;
                    return (
                      <li key={l.id} ref={active ? activeRef : undefined} className={cn("flex items-start gap-3 px-4 py-2.5", active ? "bg-primary/10" : "hover:bg-muted/40")}>
                        <input
                          type="checkbox"
                          checked={completed.has(l.id)}
                          onChange={(e) => onToggleComplete(l.id, e.target.checked)}
                          aria-label={`Mark "${l.title}" ${completed.has(l.id) ? "not complete" : "complete"}`}
                          className="mt-0.5 size-4 shrink-0 accent-[var(--primary)] cursor-pointer"
                        />
                        <Link href={`/learn/${slug}/${l.id}`} aria-current={active ? "page" : undefined} className="min-w-0 flex-1">
                          <p className={cn("text-sm leading-snug", active ? "font-semibold text-foreground" : "text-foreground/90")}>
                            {li + 1}. {l.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Icon className="size-3.5" aria-hidden />
                            {l.durationSec > 0 ? formatClock(l.durationSec) : l.kind === "ARTICLE" ? "Article" : "Resource"}
                          </p>
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
