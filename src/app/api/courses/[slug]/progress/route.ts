import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { courseEnrollments, courseLectureProgress, courseLectures } from "@/db/schema";
import { ensureEnrollment, findPublishedCourse, getViewerState, requireProfile } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  const course = await findPublishedCourse((await params).slug);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  return NextResponse.json(await getViewerState(course.id, auth.profile.id));
}

/**
 * Save watch position and/or completion for one lecture.
 * Body: { lectureId, positionSec?, completed? }. Enrols automatically.
 */
export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  const course = await findPublishedCourse((await params).slug);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as { lectureId?: string; positionSec?: number; completed?: boolean } | null;
  const db = getDb();
  const lecture = body?.lectureId
    ? await db.query.courseLectures.findFirst({ where: and(eq(courseLectures.id, body.lectureId), eq(courseLectures.courseId, course.id)) })
    : null;
  if (!lecture) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

  await ensureEnrollment(course.id, auth.profile.id);
  const positionSec = Number.isFinite(body?.positionSec) ? Math.max(0, Math.round(Number(body?.positionSec))) : undefined;
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (positionSec !== undefined) set.positionSec = positionSec;
  if (typeof body?.completed === "boolean") {
    set.completed = body.completed;
    set.completedAt = body.completed ? new Date() : null;
  }
  await db
    .insert(courseLectureProgress)
    .values({
      courseId: course.id,
      lectureId: lecture.id,
      profileId: auth.profile.id,
      positionSec: positionSec ?? 0,
      completed: body?.completed === true,
      completedAt: body?.completed ? new Date() : null,
    })
    .onConflictDoUpdate({ target: [courseLectureProgress.profileId, courseLectureProgress.lectureId], set });

  await db
    .update(courseEnrollments)
    .set({ lastLectureId: lecture.id, updatedAt: new Date() })
    .where(and(eq(courseEnrollments.courseId, course.id), eq(courseEnrollments.profileId, auth.profile.id)));

  const state = await getViewerState(course.id, auth.profile.id);
  const complete = course.lecturesCount > 0 && state.completedIds.length >= course.lecturesCount;
  await db
    .update(courseEnrollments)
    .set({ completedAt: complete ? new Date() : null })
    .where(and(eq(courseEnrollments.courseId, course.id), eq(courseEnrollments.profileId, auth.profile.id)));
  return NextResponse.json({ ok: true, completedIds: state.completedIds, courseComplete: complete });
}
