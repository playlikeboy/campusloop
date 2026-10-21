import { Clock, GraduationCap, PlayCircle } from "lucide-react";
import Link from "next/link";
import type { Course } from "@/db/schema";
import { formatDuration, LEVEL_LABEL } from "@/lib/courses/format";
import { RatingStars } from "./rating-stars";

/** Catalog card. Optional progress for "My learning". */
export function CourseCard({ course, progress, href }: { course: Course; progress?: number; href?: string }) {
  return (
    <Link
      href={href ?? `/courses/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card/60 shadow-2xs transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
            <GraduationCap className="size-10" aria-hidden />
          </div>
        )}
        {course.source === "CS50" && (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">CS50 · Harvard</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-bold leading-snug text-foreground">{course.title}</h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{course.instructorName}</p>
        {course.ratingCount > 0 && <RatingStars value={course.ratingAvg} count={course.ratingCount} />}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><PlayCircle className="size-3.5" aria-hidden />{course.lecturesCount} lectures</span>
          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden />{formatDuration(course.durationSec)}</span>
          <span>{LEVEL_LABEL[course.level] ?? course.level}</span>
        </div>
        {progress !== undefined && (
          <div className="pt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{progress === 100 ? "Completed" : `${progress}% complete`}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
