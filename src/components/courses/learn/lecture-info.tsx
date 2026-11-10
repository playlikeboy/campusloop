import { Download, ExternalLink, Scale } from "lucide-react";
import { MarkdownContent } from "@/components/common/markdown-content";
import type { Course, CourseLecture } from "@/db/schema";
import type { CourseDetailResponse } from "@/hooks/use-courses";
import { attributionNote, formatDuration, LEVEL_LABEL } from "@/lib/courses/format";

/** Overview tab: lecture notes plus a compact course summary. */
export function LectureOverview({ data, lecture, index }: { data: CourseDetailResponse; lecture: CourseLecture; index: number }) {
  const c = data.course;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lecture {index + 1} of {data.lectures.length}</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">{lecture.title}</h2>
        {lecture.kind !== "ARTICLE" && lecture.body && <div className="mt-3"><MarkdownContent content={lecture.body} autoEmbed /></div>}
      </div>
      <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-card/60 p-4 text-sm shadow-2xs sm:grid-cols-4">
        <div><dt className="text-muted-foreground">Level</dt><dd className="font-semibold">{LEVEL_LABEL[c.level]}</dd></div>
        <div><dt className="text-muted-foreground">Lectures</dt><dd className="font-semibold">{c.lecturesCount}</dd></div>
        <div><dt className="text-muted-foreground">Video</dt><dd className="font-semibold">{formatDuration(c.durationSec)}</dd></div>
        <div><dt className="text-muted-foreground">Language</dt><dd className="font-semibold">{c.language}</dd></div>
      </dl>
      <div>
        <h3 className="font-bold text-foreground">About this course</h3>
        {c.subtitle && <p className="mt-1 text-muted-foreground">{c.subtitle}</p>}
        {c.description && <div className="mt-2"><MarkdownContent content={c.description} /></div>}
        <p className="mt-3 text-sm text-foreground">Instructor: <span className="font-semibold">{c.instructorName}</span></p>
      </div>
      {attributionNote(c) && (
        <p className="flex gap-2 rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
          <Scale className="mt-0.5 size-4 shrink-0" aria-hidden /> {attributionNote(c)}
          {c.sourceUrl && <> <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground underline">Original</a></>}
        </p>
      )}
    </div>
  );
}

/** Resources tab: lecture attachments, plus the course's own site when there is one. */
export function ResourcesList({ lecture, course }: { lecture: CourseLecture; course: Course }) {
  const items = [...(lecture.attachments ?? [])];
  if (course.sourceUrl && !items.some((a) => a.url === course.sourceUrl)) items.push({ label: "Course website", url: course.sourceUrl });
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No resources for this lecture.</p>;
  return (
    <ul className="space-y-2">
      {items.map((a) => {
        const file = /\.(pdf|zip|pptx?|docx?|xlsx?|py|c|js|ts|ipynb)$/i.test(a.url);
        const Icon = file ? Download : ExternalLink;
        return (
          <li key={a.url}>
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center gap-3 rounded-xl bg-card/60 px-4 text-sm font-medium text-foreground shadow-2xs hover:bg-muted/60">
              <Icon className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{a.label}</span>
              <span className="truncate text-xs text-muted-foreground">{new URL(a.url).hostname.replace(/^www\./, "")}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
