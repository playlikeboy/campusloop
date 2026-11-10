"use client";

import { CheckCircle2, ChevronDown, FileText, Link2, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { CourseLecture, CourseSection } from "@/db/schema";
import { formatClock, formatDuration } from "@/lib/courses/format";
import { cn } from "@/lib/utils";

const ICON = { VIDEO: PlayCircle, ARTICLE: FileText, LINK: Link2 } as const;

/** Udemy-style curriculum accordion for the landing page. */
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
      <div className="mb-2 flex justify-end">
        <button type="button" onClick={() => setOpen(allOpen ? new Set() : new Set(sections.map((s) => s.id)))} className="text-sm font-semibold text-primary hover:underline cursor-pointer">
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl bg-card/60 shadow-2xs">
        {sections.map((s, si) => {
          const isOpen = open.has(s.id);
          const dur = s.lectures.reduce((a, l) => a + l.durationSec, 0);
          return (
            <div key={s.id} className={cn(si > 0 && "border-t border-border/50")}>
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-expanded={isOpen}
                className="flex min-h-13 w-full items-center gap-3 px-4 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary cursor-pointer"
              >
                <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
                <span className="flex-1 font-semibold text-foreground">{s.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{s.lectures.length} lectures · {formatDuration(dur)}</span>
              </button>
              {isOpen && (
                <ul className="pb-2">
                  {s.lectures.map((l) => {
                    const Icon = done.has(l.id) ? CheckCircle2 : ICON[l.kind as keyof typeof ICON] ?? PlayCircle;
                    const playable = enrolled || l.isPreview;
                    const inner = (
                      <>
                        <Icon className={cn("size-4 shrink-0", done.has(l.id) ? "text-primary" : "text-muted-foreground")} aria-hidden />
                        <span className={cn("flex-1 text-sm", playable ? "text-foreground" : "text-muted-foreground")}>{l.title}</span>
                        {l.isPreview && !enrolled && <span className="text-xs font-semibold text-primary">Preview</span>}
                        {!playable && <Lock className="size-3.5 text-muted-foreground" aria-label="Enrol to watch" />}
                        {l.durationSec > 0 && <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">{formatClock(l.durationSec)}</span>}
                      </>
                    );
                    return (
                      <li key={l.id}>
                        {playable ? (
                          <Link href={`/learn/${slug}/${l.id}`} className="flex min-h-11 items-center gap-3 px-4 pl-11 hover:bg-muted/40">
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
