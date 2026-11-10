"use client";

import { CheckCircle2, ChevronDown, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { CourseLecture, CourseSection } from "@/db/schema";
import { formatClock, formatDuration } from "@/lib/courses/format";
import { cn } from "@/lib/utils";
import { lectureCount, lectureIcon } from "./lecture-kind";

/** Section-by-section lecture list for the course page. */
export function CourseCurriculum({
  slug,
  sections,
  completedIds = [],
  enrolled,
}: {
  slug: string;
  sections: (CourseSection & { lectures: CourseLecture[] })[];
  completedIds?: string[];
  enrolled: boolean;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set(sections.slice(0, 1).map((s) => s.id)));
  const done = new Set(completedIds);
  const toggle = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allOpen = open.size === sections.length;

  return (
    <div>
      <div className="mb-1 flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(sections.map((s) => s.id)))}
          className="h-11 cursor-pointer rounded-full px-3 text-sm font-semibold text-brand-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {sections.map((s, si) => {
          const isOpen = open.has(s.id);
          const dur = s.lectures.reduce((a, l) => a + l.durationSec, 0);
          return (
            <div key={s.id} className={cn(si > 0 && "border-t border-border")}>
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-expanded={isOpen}
                className="flex min-h-14 w-full cursor-pointer items-center gap-3 bg-surface-muted px-4 py-2 text-left transition-ui hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <ChevronDown
                  className={cn("size-4 shrink-0 text-fg-muted transition-ui", isOpen && "rotate-180")}
                  aria-hidden
                />
                <span className="flex-1 font-semibold text-fg">{s.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-fg-muted">
                  {lectureCount(s.lectures.length)} · {formatDuration(dur)}
                </span>
              </button>
              {isOpen && (
                <ul className="py-1">
                  {s.lectures.map((l) => {
                    const isDone = done.has(l.id);
                    const Icon = isDone ? CheckCircle2 : lectureIcon(l.kind);
                    const playable = enrolled || l.isPreview;
                    const inner = (
                      <>
                        <Icon
                          className={cn("size-4 shrink-0", isDone ? "text-verified-text" : "text-fg-muted")}
                          role={isDone ? "img" : undefined}
                          aria-label={isDone ? "Done" : undefined}
                          aria-hidden={!isDone}
                        />
                        <span className={cn("flex-1 text-sm", playable ? "text-fg" : "text-fg-muted")}>
                          {l.title}
                        </span>
                        {l.isPreview && !enrolled && (
                          <span className="text-xs font-semibold text-brand-text">Free preview</span>
                        )}
                        {!playable && (
                          <Lock
                            className="size-3.5 text-fg-subtle"
                            role="img"
                            aria-label="Join the course to watch"
                          />
                        )}
                        {l.durationSec > 0 && (
                          <span className="w-14 text-right text-xs tabular-nums text-fg-muted">
                            {formatClock(l.durationSec)}
                          </span>
                        )}
                      </>
                    );
                    return (
                      <li key={l.id}>
                        {playable ? (
                          <Link
                            href={`/learn/${slug}/${l.id}`}
                            className="flex min-h-11 items-center gap-3 px-4 pl-11 transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                          >
                            {inner}
                          </Link>
                        ) : (
                          <div className="flex min-h-11 items-center gap-3 px-4 pl-11">{inner}</div>
                        )}
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
