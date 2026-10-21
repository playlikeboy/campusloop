import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { courseCertificates } from "@/db/schema";
import { findPublishedCourse, getViewerState, requireProfile } from "@/lib/courses/server";
import { newId } from "@/lib/courses/write";

export const dynamic = "force-dynamic";

/** Issue (or return) the certificate once every lecture is complete. */
export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  const course = await findPublishedCourse((await params).slug);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const db = getDb();
  const existing = await db.query.courseCertificates.findFirst({
    where: and(eq(courseCertificates.courseId, course.id), eq(courseCertificates.profileId, auth.profile.id)),
  });
  if (existing) return NextResponse.json({ id: existing.id });
  const state = await getViewerState(course.id, auth.profile.id);
  if (course.lecturesCount === 0 || state.completedIds.length < course.lecturesCount) {
    return NextResponse.json(
      { error: `Finish every lecture first (${state.completedIds.length}/${course.lecturesCount} done)` },
      { status: 400 }
    );
  }
  const id = newId("cert").replace("cert_", "CL-").toUpperCase();
  await db
    .insert(courseCertificates)
    .values({ id, courseId: course.id, profileId: auth.profile.id, recipientName: auth.profile.displayName, courseTitle: course.title })
    .onConflictDoNothing();
  const row = await db.query.courseCertificates.findFirst({
    where: and(eq(courseCertificates.courseId, course.id), eq(courseCertificates.profileId, auth.profile.id)),
  });
  return NextResponse.json({ id: row?.id ?? id }, { status: 201 });
}
