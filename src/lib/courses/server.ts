import { and, asc, count, desc, eq, ilike, inArray, or, type SQL, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  type Course,
  type CourseLecture,
  type CourseSection,
  courseEnrollments,
  courseLectureProgress,
  courseLectures,
  courseReviews,
  courseSections,
  courses,
  courseWishlist,
  userProfiles,
} from "@/db/schema";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

/** Server-only course queries shared by pages and API routes. */

export type CourseSort = "popular" | "rating" | "newest" | "shortest";

export async function currentProfile() {
  const user = await getCachedAuthUser().catch(() => null);
  if (!user) return null;
  return (await getCachedUserProfile(user.id)) ?? null;
}

/** For API routes: the signed-in profile, or a 401 response. */
export async function requireProfile(): Promise<
  { profile: NonNullable<Awaited<ReturnType<typeof currentProfile>>>; error?: undefined } | { profile?: undefined; error: NextResponse }
> {
  const profile = await currentProfile();
  if (!profile) return { error: NextResponse.json({ error: "Sign in to continue" }, { status: 401 }) };
  return { profile };
}

export async function listCourses(opts: {
  q?: string;
  category?: string;
  level?: string;
  source?: string;
  sort?: CourseSort;
  limit?: number;
  offset?: number;
}) {
  const db = getDb();
  const where: SQL[] = [eq(courses.status, "PUBLISHED")];
  if (opts.q?.trim()) {
    const p = `%${opts.q.trim()}%`;
    const cond = or(ilike(courses.title, p), ilike(courses.subtitle, p), ilike(courses.description, p), ilike(courses.instructorName, p), sql`${courses.tags}::text ilike ${p}`);
    if (cond) where.push(cond);
  }
  if (opts.category && opts.category !== "All") where.push(eq(courses.category, opts.category));
  if (opts.level && opts.level !== "ALL_LEVELS") where.push(eq(courses.level, opts.level));
  if (opts.source && opts.source !== "ALL") where.push(eq(courses.source, opts.source));
  const order =
    opts.sort === "rating"
      ? [desc(courses.ratingAvg), desc(courses.ratingCount)]
      : opts.sort === "newest"
        ? [desc(courses.createdAt)]
        : opts.sort === "shortest"
          ? [asc(courses.durationSec)]
          : [desc(courses.isFeatured), desc(courses.enrollCount), desc(courses.ratingCount)];
  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(courses)
      .where(and(...where))
      .orderBy(...order)
      .limit(Math.min(opts.limit ?? 24, 60))
      .offset(opts.offset ?? 0),
    db.select({ total: count() }).from(courses).where(and(...where)),
  ]);
  return { courses: rows, total: Number(total) };
}

export interface CourseDetail {
  course: Course;
  sections: (CourseSection & { lectures: CourseLecture[] })[];
  lectures: CourseLecture[];
  creator: { username: string; displayName: string; avatarUrl: string | null } | null;
}

export async function getCourseDetail(slug: string): Promise<CourseDetail | null> {
  const db = getDb();
  const course = await db.query.courses.findFirst({ where: eq(courses.slug, slug) });
  if (!course) return null;
  const [sections, lectures, creator] = await Promise.all([
    db.select().from(courseSections).where(eq(courseSections.courseId, course.id)).orderBy(asc(courseSections.position)),
    db.select().from(courseLectures).where(eq(courseLectures.courseId, course.id)).orderBy(asc(courseLectures.position)),
    course.creatorId
      ? db
          .select({ username: userProfiles.username, displayName: userProfiles.displayName, avatarUrl: userProfiles.avatarUrl })
          .from(userProfiles)
          .where(eq(userProfiles.id, course.creatorId))
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);
  const bySection = sections.map((s) => ({ ...s, lectures: lectures.filter((l) => l.sectionId === s.id) }));
  // Curriculum order = section order, then lecture order within the section.
  return { course, sections: bySection, lectures: bySection.flatMap((s) => s.lectures), creator };
}

export interface ViewerCourseState {
  enrolled: boolean;
  lastLectureId: string | null;
  completedIds: string[];
  positions: Record<string, number>;
  wishlisted: boolean;
  myReview: { rating: number; body: string | null } | null;
}

export async function getViewerState(courseId: string, profileId: string | null | undefined): Promise<ViewerCourseState> {
  const empty: ViewerCourseState = { enrolled: false, lastLectureId: null, completedIds: [], positions: {}, wishlisted: false, myReview: null };
  if (!profileId) return empty;
  const db = getDb();
  const [enrollment, progress, wish, review] = await Promise.all([
    db.query.courseEnrollments.findFirst({ where: and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.profileId, profileId)) }),
    db
      .select({ lectureId: courseLectureProgress.lectureId, completed: courseLectureProgress.completed, positionSec: courseLectureProgress.positionSec })
      .from(courseLectureProgress)
      .where(and(eq(courseLectureProgress.courseId, courseId), eq(courseLectureProgress.profileId, profileId))),
    db.query.courseWishlist.findFirst({ where: and(eq(courseWishlist.courseId, courseId), eq(courseWishlist.profileId, profileId)) }),
    db.query.courseReviews.findFirst({ where: and(eq(courseReviews.courseId, courseId), eq(courseReviews.profileId, profileId)) }),
  ]);
  return {
    enrolled: Boolean(enrollment),
    lastLectureId: enrollment?.lastLectureId ?? null,
    completedIds: progress.filter((p) => p.completed).map((p) => p.lectureId),
    positions: Object.fromEntries(progress.map((p) => [p.lectureId, p.positionSec])),
    wishlisted: Boolean(wish),
    myReview: review ? { rating: review.rating, body: review.body } : null,
  };
}

/** Recount denormalised totals after curriculum, enrolment or review changes. */
export async function refreshCourseStats(courseId: string) {
  const db = getDb();
  const [[lec], [enr], [rev]] = await Promise.all([
    db.select({ n: count(), d: sql<number>`coalesce(sum(${courseLectures.durationSec}), 0)::int` }).from(courseLectures).where(eq(courseLectures.courseId, courseId)),
    db.select({ n: count() }).from(courseEnrollments).where(eq(courseEnrollments.courseId, courseId)),
    db.select({ n: count(), avg: sql<number>`coalesce(avg(${courseReviews.rating}), 0)::real` }).from(courseReviews).where(eq(courseReviews.courseId, courseId)),
  ]);
  await db
    .update(courses)
    .set({ lecturesCount: Number(lec.n), durationSec: Number(lec.d), enrollCount: Number(enr.n), ratingCount: Number(rev.n), ratingAvg: Number(rev.avg) })
    .where(eq(courses.id, courseId));
}

export function canEditCourse(course: Pick<Course, "creatorId">, profile: { id: string; role?: string | null } | null): boolean {
  return Boolean(profile && (profile.role === "ADMIN" || (course.creatorId && course.creatorId === profile.id)));
}

/** "My learning": enrolled courses with completion counts. */
export async function listMyLearning(profileId: string) {
  const db = getDb();
  const enrollments = await db
    .select({ course: courses, enrolledAt: courseEnrollments.createdAt, completedAt: courseEnrollments.completedAt, lastLectureId: courseEnrollments.lastLectureId })
    .from(courseEnrollments)
    .innerJoin(courses, eq(courses.id, courseEnrollments.courseId))
    .where(eq(courseEnrollments.profileId, profileId))
    .orderBy(desc(courseEnrollments.updatedAt));
  const ids = enrollments.map((e) => e.course.id);
  const done = ids.length
    ? await db
        .select({ courseId: courseLectureProgress.courseId, n: count() })
        .from(courseLectureProgress)
        .where(and(eq(courseLectureProgress.profileId, profileId), eq(courseLectureProgress.completed, true), inArray(courseLectureProgress.courseId, ids)))
        .groupBy(courseLectureProgress.courseId)
    : [];
  const doneMap = new Map(done.map((d) => [d.courseId, Number(d.n)]));
  return enrollments.map((e) => ({ ...e, completedLectures: doneMap.get(e.course.id) ?? 0 }));
}

export async function findPublishedCourse(slug: string) {
  return getDb().query.courses.findFirst({ where: and(eq(courses.slug, slug), eq(courses.status, "PUBLISHED")) });
}

/** Enrol if not already (idempotent). Returns the enrolment row. */
export async function ensureEnrollment(courseId: string, profileId: string) {
  const db = getDb();
  const existing = await db.query.courseEnrollments.findFirst({
    where: and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.profileId, profileId)),
  });
  if (existing) return existing;
  const [row] = await db
    .insert(courseEnrollments)
    .values({ courseId, profileId })
    .onConflictDoNothing()
    .returning();
  await refreshCourseStats(courseId);
  return row ?? (await db.query.courseEnrollments.findFirst({ where: and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.profileId, profileId)) }));
}
