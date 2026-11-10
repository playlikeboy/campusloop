import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { courseEnrollments, courseReviews, userProfiles } from "@/db/schema";
import { findPublishedCourse, refreshCourseStats, requireProfile } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const course = await findPublishedCourse((await params).slug);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const reviews = await getDb()
    .select({
      id: courseReviews.id,
      rating: courseReviews.rating,
      body: courseReviews.body,
      createdAt: courseReviews.createdAt,
      author: { displayName: userProfiles.displayName, username: userProfiles.username, avatarUrl: userProfiles.avatarUrl },
    })
    .from(courseReviews)
    .innerJoin(userProfiles, eq(userProfiles.id, courseReviews.profileId))
    .where(eq(courseReviews.courseId, course.id))
    .orderBy(desc(courseReviews.createdAt))
    .limit(50);
  return NextResponse.json({ reviews, ratingAvg: course.ratingAvg, ratingCount: course.ratingCount });
}

/** One review per enrolled learner; posting again updates it. */
export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  const course = await findPublishedCourse((await params).slug);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const db = getDb();
  const enrolled = await db.query.courseEnrollments.findFirst({
    where: and(eq(courseEnrollments.courseId, course.id), eq(courseEnrollments.profileId, auth.profile.id)),
  });
  if (!enrolled) return NextResponse.json({ error: "Enrol in the course to review it" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as { rating?: number; body?: string } | null;
  const rating = Math.round(Number(b?.rating));
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "Pick 1 to 5 stars" }, { status: 400 });
  const body = (b?.body ?? "").trim().slice(0, 2000) || null;
  await db
    .insert(courseReviews)
    .values({ courseId: course.id, profileId: auth.profile.id, rating, body })
    .onConflictDoUpdate({ target: [courseReviews.courseId, courseReviews.profileId], set: { rating, body, updatedAt: new Date() } });
  await refreshCourseStats(course.id);
  return NextResponse.json({ ok: true });
}
