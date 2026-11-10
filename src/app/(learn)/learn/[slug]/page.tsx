import { notFound, redirect } from "next/navigation";
import { currentProfile, getCourseDetail, getViewerState } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

/** /learn/[slug] resumes at the last lecture, else the first unfinished one. */
export default async function ResumePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await getCourseDetail(slug);
  if (!d || d.course.status !== "PUBLISHED" || d.lectures.length === 0) notFound();
  const profile = await currentProfile();
  const v = await getViewerState(d.course.id, profile?.id);
  const target = v.lastLectureId ?? d.lectures.find((l) => !v.completedIds.includes(l.id))?.id ?? d.lectures[0].id;
  redirect(`/learn/${slug}/${target}`);
}
