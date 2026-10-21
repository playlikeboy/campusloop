import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { courses } from "@/db/schema";
import { type CourseSort, listCourses, requireProfile } from "@/lib/courses/server";
import { validateCourse } from "@/lib/courses/validate";
import { courseColumns, newId, saveCurriculum, uniqueCourseSlug } from "@/lib/courses/write";

export const dynamic = "force-dynamic";

/** Catalog search: ?q=&category=&level=&source=&sort=popular|rating|newest|shortest&page= */
export async function GET(req: Request) {
  try {
    const p = new URL(req.url).searchParams;
    const page = Math.max(1, Number(p.get("page")) || 1);
    const limit = 24;
    const result = await listCourses({
      q: p.get("q") ?? undefined,
      category: p.get("category") ?? undefined,
      level: p.get("level") ?? undefined,
      source: p.get("source") ?? undefined,
      sort: (p.get("sort") as CourseSort) ?? "popular",
      limit,
      offset: (page - 1) * limit,
    });
    return NextResponse.json({ ...result, page, hasMore: page * limit < result.total });
  } catch (error) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json({ error: "Could not load courses" }, { status: 500 });
  }
}

/** Create a course (draft or published) with its full curriculum. */
export async function POST(req: Request) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => null)) as { status?: string } | null;
    const intent = body?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    const v = validateCourse(body, intent);
    if (!v.ok) return NextResponse.json({ error: v.errors[0], errors: v.errors }, { status: 400 });

    const id = newId("crs");
    const slug = await uniqueCourseSlug(v.value.title);
    await getDb()
      .insert(courses)
      .values({
        id,
        slug,
        ...courseColumns(v.value),
        instructorName: v.value.instructorName || auth.profile.displayName,
        creatorId: auth.profile.id,
        source: "COMMUNITY",
      });
    await saveCurriculum(id, v.value);
    return NextResponse.json({ ok: true, slug }, { status: 201 });
  } catch (error) {
    console.error("POST /api/courses error:", error);
    return NextResponse.json({ error: "Could not save the course" }, { status: 500 });
  }
}
