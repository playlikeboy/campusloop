import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { courseWishlist } from "@/db/schema";
import { findPublishedCourse, refreshCourseStats, requireProfile } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

/** Toggle wishlist. Returns the new state. */
export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  const course = await findPublishedCourse((await params).slug);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const db = getDb();
  const where = and(eq(courseWishlist.courseId, course.id), eq(courseWishlist.profileId, auth.profile.id));
  const existing = await db.query.courseWishlist.findFirst({ where });
  if (existing) {
    await db.delete(courseWishlist).where(where);
    await refreshCourseStats(course.id);
    return NextResponse.json({ wishlisted: false });
  }
  await db.insert(courseWishlist).values({ courseId: course.id, profileId: auth.profile.id }).onConflictDoNothing();
  await refreshCourseStats(course.id);
  return NextResponse.json({ wishlisted: true });
}
