import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { courses } from "@/db/schema";
import { CATALOG_PAGE_SIZE, parseCatalogParams } from "@/lib/courses/catalog-params";
import { listCourses, requireProfile } from "@/lib/courses/server";
import { validateCourse } from "@/lib/courses/validate";
import { courseColumns, newId, saveCurriculum, uniqueCourseSlug } from "@/lib/courses/write";

export const dynamic = "force-dynamic";

/**
 * Catalog search. Same params as the /courses URL (see catalog-params.ts):
 * ?q=&category=&level=&duration=&source=&sort=&page=&limit=
 * Only catalog-listed courses are returned.
 */
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const params = parseCatalogParams(sp);
    const limit = Math.min(Math.max(Number(sp.get("limit")) || CATALOG_PAGE_SIZE, 1), 40);
    const result = await listCourses({ ...params, limit });
    return NextResponse.json(
      { ...result, hasMore: result.page < result.pages },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } }
    );
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
    return NextResponse.json({ ok: true, slug, listed: false }, { status: 201 });
  } catch (error) {
    console.error("POST /api/courses error:", error);
    return NextResponse.json({ error: "Could not save the course" }, { status: 500 });
  }
}
