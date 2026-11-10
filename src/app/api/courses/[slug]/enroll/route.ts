import { NextResponse } from "next/server";
import { ensureEnrollment, findPublishedCourse, requireProfile, trackCourseInterest } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

/** Free enrolment. Idempotent. */
export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  const { slug } = await params;
  const course = await findPublishedCourse(slug);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  await ensureEnrollment(course.id, auth.profile.id);
  await trackCourseInterest(auth.profile.id, course, "COURSE_ENROLL");
  return NextResponse.json({ ok: true });
}
