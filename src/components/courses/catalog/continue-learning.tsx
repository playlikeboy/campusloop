"use client";

import Link from "next/link";
import { useMyLearning } from "@/hooks/use-courses";
import { useProfile } from "@/hooks/use-profile";
import { CourseCard } from "../course-card";

/** "Continue learning" row for signed-in learners with unfinished courses. */
export function ContinueLearning() {
  const { profile } = useProfile();
  const { data } = useMyLearning(Boolean(profile?.id));
  const items = (data?.learning ?? []).filter((l) => !l.completedAt).slice(0, 8);
  if (items.length === 0) return null;
  return (
    <section className="mb-10" aria-label="Continue learning">
      <div className="mb-3 flex items-end justify-between px-4 sm:px-0">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Continue learning</h2>
        <Link href="/courses/my" className="text-sm font-semibold text-primary hover:underline">My learning</Link>
      </div>
      <ul className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:scroll-px-0 sm:px-0">
        {items.map((l) => {
          const pct = l.course.lecturesCount ? Math.round((l.completedLectures / l.course.lecturesCount) * 100) : 0;
          return (
            <li key={l.course.id} className="w-[72%] shrink-0 snap-start sm:w-60">
              <CourseCard course={l.course} progress={pct} href={`/learn/${l.course.slug}${l.lastLectureId ? `/${l.lastLectureId}` : ""}`} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
