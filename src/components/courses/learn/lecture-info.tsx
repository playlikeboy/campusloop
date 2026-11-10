import { Download, ExternalLink, Scale } from "lucide-react";
import { MarkdownContent } from "@/components/common/markdown-content";
import { EmptyState } from "@/components/ui/empty-state";
import type { Course, CourseLecture } from "@/db/schema";
import type { CourseDetailResponse } from "@/hooks/use-courses";
import { attributionNote, formatDuration, LEVEL_LABEL } from "@/lib/courses/format";

/** Overview tab: lecture notes plus a short course summary. */
export function LectureOverview({
  data,
  lecture,
  index,
}: {
  data: CourseDetailResponse;
  lecture: CourseLecture;
  index: number;
}) {
  const c = data.course;
  const note = attributionNote(c);
  const facts = [
    ["Level", LEVEL_LABEL[c.level] ?? c.level],
    ["Lectures", String(c.lecturesCount)],
    ["Video", formatDuration(c.durationSec)],
    ["Language", c.language],
  ];
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl text-fg">{lecture.title}</h2>
        <p className="mt-1 text-sm tabular-nums text-fg-muted">
          Lecture {index + 1} of {data.lectures.length}
        </p>
        {lecture.kind !== "ARTICLE" && lecture.body && (
          <div className="mt-4">
            <MarkdownContent content={lecture.body} autoEmbed />
          </div>
        )}
      </div>

      <section aria-labelledby="about-course" className="space-y-3">
        <h3 id="about-course" className="text-lg text-fg">
          About this course
        </h3>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {facts.map(([k, v]) => (
            <div key={k} className="flex gap-1.5">
              <dt className="text-fg-muted">{k}</dt>
              <dd className="font-semibold tabular-nums text-fg">{v}</dd>
            </div>
          ))}
        </dl>
        {c.subtitle && <p className="max-w-prose text-fg-muted">{c.subtitle}</p>}
        {c.description && <MarkdownContent content={c.description} />}
        <p className="text-sm text-fg">
          Taught by <span className="font-semibold">{c.instructorName}</span>
        </p>
      </section>

      {note && (
        <p className="flex gap-2 rounded-md bg-surface-muted p-3 text-xs leading-relaxed text-fg-muted">
          <Scale className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {note}{" "}
            {c.sourceUrl && (
              <a
                href={c.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-text underline underline-offset-2"
              >
                See the original
              </a>
            )}
          </span>
        </p>
      )}
    </div>
  );
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Resources tab: lecture attachments, plus the course's own site when there is one. */
export function ResourcesList({ lecture, course }: { lecture: CourseLecture; course: Course }) {
  const items = [...(lecture.attachments ?? [])];
  if (course.sourceUrl && !items.some((a) => a.url === course.sourceUrl))
    items.push({ label: "Course website", url: course.sourceUrl });
  if (items.length === 0)
    return <EmptyState size="compact" icon={Download} title="No files for this lecture" />;
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {items.map((a) => {
        const file = /\.(pdf|zip|pptx?|docx?|xlsx?|py|c|js|ts|ipynb)$/i.test(a.url);
        const Icon = file ? Download : ExternalLink;
        return (
          <li key={a.url}>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center gap-3 px-4 text-sm font-medium text-fg transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <Icon className="size-4 shrink-0 text-brand-text" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{a.label || "Link"}</span>
              <span className="max-w-[40%] shrink-0 truncate text-xs text-fg-subtle">{hostname(a.url)}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
