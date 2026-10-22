import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CourseBuilder } from "@/components/courses/builder/course-builder";
import type { CourseLecture } from "@/db/schema";
import { canEditCourse, currentProfile, getCourseDetail } from "@/lib/courses/server";
import type { CourseInput } from "@/lib/courses/validate";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit course", robots: { index: false } };

function lectureUrl(l: CourseLecture): string {
  if (l.videoProvider === "youtube" && l.videoRef) return `https://youtu.be/${l.videoRef}`;
  if (l.videoProvider === "vimeo" && l.videoRef) return `https://vimeo.com/${l.videoRef}`;
  if (l.videoProvider === "dailymotion" && l.videoRef) return `https://www.dailymotion.com/video/${l.videoRef}`;
  if (l.videoProvider === "drive" && l.videoRef) return `https://drive.google.com/file/d/${l.videoRef}/view`;
  return l.videoRef ?? "";
}

export default async function EditCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await currentProfile();
  if (!profile) redirect(`/sign-in?returnTo=/courses/${slug}/edit`);
  const d = await getCourseDetail(slug);
  if (!d) notFound();
  if (!canEditCourse(d.course, profile) || d.course.source !== "COMMUNITY") redirect(`/courses/${slug}`);
  const c = d.course;
  const initial: CourseInput = {
    title: c.title,
    subtitle: c.subtitle ?? "",
    description: c.description,
    category: c.category,
    level: c.level,
    thumbnailUrl: c.thumbnailUrl ?? "",
    instructorName: c.instructorName,
    outcomes: c.outcomes,
    requirements: c.requirements,
    tags: c.tags,
    status: c.status as "DRAFT" | "PUBLISHED",
    sections: d.sections.map((s) => ({
      id: s.id,
      title: s.title,
      lectures: s.lectures.map((l) => ({
        id: l.id,
        title: l.title,
        kind: l.kind as "VIDEO" | "ARTICLE" | "LINK",
        videoUrl: lectureUrl(l),
        durationMin: Math.round(l.durationSec / 60),
        body: l.body ?? "",
        isPreview: l.isPreview,
        attachments: l.attachments ?? [],
      })),
    })),
  };
  return <CourseBuilder initial={initial} slug={slug} />;
}
