"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { Course } from "@/db/schema";
import { CourseCard } from "../course-card";

/** Horizontal, swipeable row of course cards. */
export function CourseRow({ title, href, courses }: { title: string; href?: string; courses: Course[] }) {
  const track = useRef<HTMLUListElement>(null);
  const headingId = useId();
  if (courses.length === 0) return null;
  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section className="mt-10 first:mt-0" aria-labelledby={headingId}>
      <div className="mb-3 flex items-center justify-between gap-3 px-4 sm:px-0">
        <h2 id={headingId} className="text-xl text-fg">
          {title}
        </h2>
        <div className="flex items-center gap-1">
          {href && (
            <Link
              href={href}
              className="flex h-11 items-center px-2 text-sm font-semibold text-brand-text hover:underline"
              aria-label={`See all: ${title}`}
            >
              See all
            </Link>
          )}
          <Button
            variant="circleIcon"
            size="icon-sm"
            onClick={() => scroll(-1)}
            aria-label={`Scroll ${title} back`}
            className="hidden sm:inline-flex"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="circleIcon"
            size="icon-sm"
            onClick={() => scroll(1)}
            aria-label={`Scroll ${title} forward`}
            className="hidden sm:inline-flex"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <ul
        ref={track}
        className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:scroll-px-0 sm:px-0"
      >
        {courses.map((c) => (
          <li key={c.id} className="w-[72%] shrink-0 snap-start sm:w-60">
            <CourseCard course={c} />
          </li>
        ))}
      </ul>
    </section>
  );
}
