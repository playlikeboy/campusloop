import { Clock, GraduationCap, PlayCircle, Signal } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/db/schema";
import { formatDuration, LEVEL_LABEL } from "@/lib/courses/format";
import { lectureCount } from "../lecture-kind";
import { RatingStars } from "../rating-stars";

const DAY = 86_400_000;

function badge(c: Course): string | null {
  if (c.source === "CS50") return "Harvard CS50";
  if (c.source === "UNIVERSITY") return c.provider ?? "University";
  if (c.isFeatured) return "Staff pick";
  if (c.enrollCount >= 100) return "Popular";
  if (Date.now() - new Date(c.listedAt ?? c.createdAt).getTime() < 14 * DAY) return "New";
  return null;
}

/** Search/category result row: thumbnail left, details right. */
export function CourseListItem({ course: c }: { course: Course }) {
  const tag = badge(c);
  return (
    <Link
      href={`/courses/${c.slug}`}
      className="group flex gap-3 rounded-lg p-2 transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-5 sm:p-3"
    >
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-surface-muted sm:w-60">
        {c.thumbnailUrl ? (
          <img src={c.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-fg-subtle">
            <GraduationCap className="size-8" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 font-sans text-base font-bold leading-snug text-fg group-hover:text-brand-text">
          {c.title}
        </h3>
        {c.subtitle && (
          <p className="mt-1 line-clamp-2 hidden text-sm text-fg-muted sm:block">{c.subtitle}</p>
        )}
        <p className="mt-1 truncate text-xs text-fg-muted">{c.instructorName}</p>
        {c.ratingCount > 0 && (
          <div className="mt-1">
            <RatingStars value={c.ratingAvg} count={c.ratingCount} />
          </div>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-fg-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {formatDuration(c.durationSec)}
          </span>
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="size-3.5" aria-hidden />
            {lectureCount(c.lecturesCount)}
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <Signal className="size-3.5" aria-hidden />
            {LEVEL_LABEL[c.level] ?? c.level}
          </span>
        </div>
        {tag && <Badge className="mt-2">{tag}</Badge>}
      </div>
    </Link>
  );
}
