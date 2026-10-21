import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { courses } from "@/db/schema";
import { canEditCourse, currentProfile, getCourseDetail, getViewerState, requireProfile } from "@/lib/courses/server";
import { validateCourse } from "@/lib/courses/validate";
import { courseColumns, saveCurriculum } from "@/lib/courses/write";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const detail = await getCourseDetail(slug);
  const profile = await currentProfile();
  if (!detail || (detail.course.status !== "PUBLISHED" && !canEditCourse(detail.course, profile))) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const viewer = await getViewerState(detail.course.id, profile?.id);
  return NextResponse.json({ ...detail, viewer, canEdit: canEditCourse(detail.course, profile) });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  const { slug } = await params;
  const db = getDb();
  const course = await db.query.courses.findFirst({ where: eq(courses.slug, slug) });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  if (!canEditCourse(course, auth.profile)) return NextResponse.json({ error: "Only the creator can edit this course" }, { status: 403 });
  if (course.source !== "COMMUNITY") return NextResponse.json({ error: "Imported courses are managed by their sync script" }, { status: 403 });
  try {
    const body = (await req.json().catch(() => null)) as { status?: string } | null;
    const v = validateCourse(body, body?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT");
    if (!v.ok) return NextResponse.json({ error: v.errors[0], errors: v.errors }, { status: 400 });
    await db
      .update(courses)
      .set({ ...courseColumns(v.value), instructorName: v.value.instructorName || course.instructorName, updatedAt: new Date() })
      .where(eq(courses.id, course.id));
    await saveCurriculum(course.id, v.value);
    return NextResponse.json({ ok: true, slug: course.slug });
  } catch (error) {
    console.error("PATCH /api/courses/[slug] error:", error);
    return NextResponse.json({ error: "Could not save the course" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  const { slug } = await params;
  const db = getDb();
  const course = await db.query.courses.findFirst({ where: eq(courses.slug, slug) });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  if (!canEditCourse(course, auth.profile) || course.source !== "COMMUNITY") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  await db.delete(courses).where(eq(courses.id, course.id));
  return NextResponse.json({ ok: true });
}
