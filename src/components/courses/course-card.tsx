import { Clock, GraduationCap, PlayCircle } from "lucide-react";
import Link from "next/link";
import type { Course } from "@/db/schema";
import { formatDuration, LEVEL_LABEL, sourceBadge } from "@/lib/courses/format";
import { lectureCount } from "./lecture-kind";
import { ProgressBar } from "./progress-bar";
import { RatingStars } from "./rating-stars";

/** Catalog card. Pass progress for "My learning". */
export function CourseCard({ course, progress, href }: { course: Course; progress?: number; href?: string }) {
  const source = sourceBadge(course);
  return (
    <Link
      href={href ?? `/courses/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-ui hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-surface-muted">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-fg-subtle">
            <GraduationCap className="size-10" aria-hidden />
          </div>
        )}
        {source && (
          <span className="absolute left-2 top-2 max-w-[85%] truncate rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-fg shadow-xs">
            {source}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-sans text-base font-bold leading-snug text-fg group-hover:text-brand-text">
          {course.title}
        </h3>
        <p className="line-clamp-1 text-xs text-fg-muted">{course.instructorName}</p>
        {course.ratingCount > 0 && <RatingStars value={course.ratingAvg} count={course.ratingCount} />}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs tabular-nums text-fg-muted">
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="size-3.5" aria-hidden />
            {lectureCount(course.lecturesCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {formatDuration(course.durationSec)}
          </span>
          <span>{LEVEL_LABEL[course.level] ?? course.level}</span>
        </div>
        {progress !== undefined && (
          <div className="pt-2">
            <ProgressBar value={progress} label={`${course.title} progress`} />
            <p className="mt-1 text-xs font-medium tabular-nums text-fg-muted">
              {progress === 100 ? "Finished" : `${progress}% done`}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
