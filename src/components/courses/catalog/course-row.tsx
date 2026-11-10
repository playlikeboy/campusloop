"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import type { Course } from "@/db/schema";
import { CourseCard } from "../course-card";

/** Horizontal, swipeable row of course cards (Udemy home style). */
export function CourseRow({ title, href, courses }: { title: string; href?: string; courses: Course[] }) {
  const track = useRef<HTMLUListElement>(null);
  if (courses.length === 0) return null;
  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.9, behavior: "smooth" });

  return (
    <section className="mt-10 first:mt-0" aria-label={title}>
      <div className="mb-3 flex items-end justify-between gap-3 px-4 sm:px-0">
        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
        <div className="flex items-center gap-1">
          {href && (
            <Link href={href} className="mr-1 rounded-full px-2 py-1 text-sm font-semibold text-primary hover:underline">
              See all
            </Link>
          )}
          <button type="button" onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`} className="hidden size-9 items-center justify-center rounded-full bg-muted/60 text-foreground hover:bg-muted sm:flex cursor-pointer">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label={`Scroll ${title} right`} className="hidden size-9 items-center justify-center rounded-full bg-muted/60 text-foreground hover:bg-muted sm:flex cursor-pointer">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <ul ref={track} className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:scroll-px-0 sm:px-0">
        {courses.map((c) => (
          <li key={c.id} className="w-[72%] shrink-0 snap-start sm:w-60">
            <CourseCard course={c} />
          </li>
        ))}
      </ul>
    </section>
  );
}
