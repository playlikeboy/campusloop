import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { courseLectures, courseNotes } from "@/db/schema";
import { findPublishedCourse, requireProfile } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/** Private, timestamped notes for the signed-in learner. */
export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  const course = await findPublishedCourse((await params).slug);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const notes = await getDb()
    .select()
    .from(courseNotes)
    .where(and(eq(courseNotes.courseId, course.id), eq(courseNotes.profileId, auth.profile.id)))
    .orderBy(asc(courseNotes.createdAt));
  return NextResponse.json({ notes });
}

export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  const course = await findPublishedCourse((await params).slug);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const b = (await req.json().catch(() => null)) as { lectureId?: string; atSec?: number; body?: string } | null;
  const text = (b?.body ?? "").trim().slice(0, 1000);
  if (!text) return NextResponse.json({ error: "Write something first" }, { status: 400 });
  const db = getDb();
  const lecture = b?.lectureId
    ? await db.query.courseLectures.findFirst({ where: and(eq(courseLectures.id, b.lectureId), eq(courseLectures.courseId, course.id)) })
    : null;
  if (!lecture) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  const [note] = await db
    .insert(courseNotes)
    .values({ courseId: course.id, lectureId: lecture.id, profileId: auth.profile.id, atSec: Math.max(0, Math.round(Number(b?.atSec) || 0)), body: text })
    .returning();
  return NextResponse.json({ note }, { status: 201 });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  await params;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  await getDb().delete(courseNotes).where(and(eq(courseNotes.id, id), eq(courseNotes.profileId, auth.profile.id)));
  return NextResponse.json({ ok: true });
}
