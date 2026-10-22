"use client";

import { ArrowRight, GraduationCap, PlayCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import type { Course } from "@/db/schema";
import { fetcher } from "@/lib/api";
import { formatDuration } from "@/lib/courses/format";
import { cn } from "@/lib/utils";

/**
 * "Rising courses" feed slot: new community courses that are not yet in the
 * /courses catalog. Views and enrolments from here are what promote them.
 */
export function FeedCourseSpotlight({ className }: { className?: string }) {
  const { data } = useSWR<{ courses: Course[] }>("/api/courses/feed", fetcher, { revalidateOnFocus: false, dedupingInterval: 120_000 });
  const courses = data?.courses ?? [];
  if (courses.length === 0) return null;

  return (
    <section className={cn("py-4", className)} aria-label="Rising courses from students">
      <div className="mb-3 flex items-center justify-between px-4">
        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <Sparkles className="size-4 text-primary" aria-hidden /> Rising courses by students
        </p>
        <Link href="/courses" className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline">
          All courses <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <ul className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4">
        {courses.map((c) => (
          <li key={c.id} className="w-60 shrink-0 snap-start">
            <Link href={`/courses/${c.slug}`} className="group block overflow-hidden rounded-2xl bg-card/60 shadow-2xs transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <div className="aspect-video overflow-hidden bg-muted">
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-primary/10 text-primary"><GraduationCap className="size-8" aria-hidden /></div>
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground">{c.title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{c.instructorName}</p>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <PlayCircle className="size-3.5" aria-hidden /> {c.lecturesCount} lectures · {formatDuration(c.durationSec)}
                  {c.enrollCount > 0 && <> · {c.enrollCount} learning</>}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
