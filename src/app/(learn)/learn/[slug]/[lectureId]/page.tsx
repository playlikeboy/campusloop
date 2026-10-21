import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PlayerShell } from "@/components/courses/learn/player-shell";
import { canEditCourse, currentProfile, ensureEnrollment, getCourseDetail, getViewerState } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; lectureId: string }>; searchParams: Promise<{ t?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lectureId } = await params;
  const d = await getCourseDetail(slug);
  const l = d?.lectures.find((x) => x.id === lectureId);
  return { title: l && d ? `${l.title} · ${d.course.title}` : "Course player" };
}

export default async function LecturePage({ params, searchParams }: Props) {
  const { slug, lectureId } = await params;
  const { t } = await searchParams;
  const d = await getCourseDetail(slug);
  if (!d) notFound();
  const profile = await currentProfile();
  const editor = canEditCourse(d.course, profile);
  if (d.course.status !== "PUBLISHED" && !editor) notFound();
  const lecture = d.lectures.find((l) => l.id === lectureId);
  if (!lecture) notFound();

  // Free previews are open to everyone; everything else needs an account.
  if (!profile && !lecture.isPreview) redirect(`/sign-in?returnTo=${encodeURIComponent(`/learn/${slug}/${lectureId}`)}`);
  // Courses are free, so opening a lecture enrols you.
  if (profile && d.course.status === "PUBLISHED") await ensureEnrollment(d.course.id, profile.id);

  const viewer = await getViewerState(d.course.id, profile?.id);
  const startAt = Math.max(0, Number(t) || 0);
  return <PlayerShell data={{ ...d, viewer, canEdit: editor }} lectureId={lecture.id} startAt={startAt} />;
}
