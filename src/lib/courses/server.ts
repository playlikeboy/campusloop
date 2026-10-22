import { and, asc, count, desc, eq, gte, ilike, inArray, lt, or, type SQL, sql } from "drizzle-orm";
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
import { IsolateCache } from "@/lib/isolate-cache";
import { getRedis } from "@/lib/redis";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { trackUserBehavior } from "@/lib/user-behavior";
import { CATALOG_PAGE_SIZE, type CatalogDuration, type CatalogParams } from "./catalog-params";
import { fieldCategories } from "./recommend-signals";
import { shouldBeListed, trendScore } from "./promotion";

/** Server-only course queries shared by pages and API routes. */

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

const DURATION_RANGE: Record<CatalogDuration, [number, number]> = {
  short: [0, 3 * 3600],
  medium: [3 * 3600, 10 * 3600],
  long: [10 * 3600, Number.MAX_SAFE_INTEGER],
};

/**
 * Catalog search. Only catalog-listed courses by default: unlisted community
 * courses are discoverable through feeds until promoted (see promotion.ts).
 */
export async function listCourses(opts: Partial<CatalogParams> & { limit?: number; listedOnly?: boolean; sourceIn?: string[] }) {
  const db = getDb();
  const limit = Math.min(opts.limit ?? CATALOG_PAGE_SIZE, 60);
  const page = Math.max(1, opts.page ?? 1);
  const where: SQL[] = [eq(courses.status, "PUBLISHED")];
  if (opts.listedOnly !== false) where.push(eq(courses.listed, true));
  const q = opts.q?.trim();
  const matchedCategories = q ? fieldCategories(q) : [];
  if (q) {
    const p = `%${q}%`;
    const searchConds = [
      ilike(courses.title, p),
      ilike(courses.subtitle, p),
      ilike(courses.description, p),
      ilike(courses.instructorName, p),
      sql`${courses.tags}::text ilike ${p}`,
    ];
    if (matchedCategories.length) {
      searchConds.push(inArray(courses.category, matchedCategories));
    }
    const cond = or(...searchConds);
    if (cond) where.push(cond);
  }
  if (opts.category) where.push(eq(courses.category, opts.category));
  if (opts.level) where.push(eq(courses.level, opts.level.toUpperCase()));
  if (opts.source) where.push(eq(courses.source, opts.source.toUpperCase()));
  if (opts.sourceIn?.length) where.push(inArray(courses.source, opts.sourceIn));
  if (opts.lang) where.push(eq(courses.language, opts.lang === "hindi" ? "Hindi" : "English"));
  if (opts.duration) {
    const [lo, hi] = DURATION_RANGE[opts.duration];
    where.push(gte(courses.durationSec, lo), lt(courses.durationSec, hi));
  }
  // Source trust (rank_boost) gives curated courses a head start; real enrolments and engagement take over as they grow.
  const score = sql`${courses.rankBoost} * 4 + ln(1 + ${courses.enrollCount}) + ${courses.trendScore} * 0.5 + ln(1 + ${courses.ratingCount}) * 0.5`;
  const popular = [desc(courses.isFeatured), desc(score), desc(courses.lecturesCount)];
  const order =
    opts.sort === "relevance" && q
      ? [
          matchedCategories.length
            ? sql`case
                when ${courses.title} ilike ${`${q}%`} then 0
                when ${courses.title} ilike ${`%${q}%`} then 1
                when ${courses.tags}::text ilike ${`%${q}%`} then 2
                when ${courses.category} in (${sql.join(matchedCategories.map((c) => sql`${c}`), sql`, `)}) then 3
                else 4 end`
            : sql`case when ${courses.title} ilike ${`${q}%`} then 0 when ${courses.title} ilike ${`%${q}%`} then 1 when ${courses.tags}::text ilike ${`%${q}%`} then 2 else 3 end`,
          ...popular,
        ]
      : opts.sort === "rating"
        ? [desc(sql`(${courses.ratingAvg} * ${courses.ratingCount} + (3.5 + ${courses.rankBoost} * 1.2) * 5) / (${courses.ratingCount} + 5)`), desc(courses.ratingCount), desc(score)]
        : opts.sort === "newest"
          ? [desc(courses.createdAt)]
          : opts.sort === "shortest"
            ? [asc(courses.durationSec)]
            : opts.sort === "trending"
              ? [desc(sql`${courses.trendScore} + ${courses.rankBoost} * 0.5`), desc(courses.createdAt)]
              : popular;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(courses)
      .where(and(...where))
      .orderBy(...order, asc(courses.id))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(courses).where(and(...where)),
  ]);
  const n = Number(total);
  return { courses: rows, total: n, page, pages: Math.max(1, Math.ceil(n / limit)) };
}

/** Listed course counts per category, for the catalog's category nav. */
export async function listCategoryCounts() {
  const rows = await getDb()
    .select({ category: courses.category, n: count() })
    .from(courses)
    .where(and(eq(courses.status, "PUBLISHED"), eq(courses.listed, true)))
    .groupBy(courses.category)
    .orderBy(desc(count()));
  return rows.map((r) => ({ category: r.category, count: Number(r.n) }));
}

const browseCache = new IsolateCache<Awaited<ReturnType<typeof loadBrowseRows>>>(60_000, 4);

async function loadBrowseRows() {
  const cats = await listCategoryCounts();
  const [popular, universities, hindi, rated, fresh, trending, ...byCategory] = await Promise.all([
    listCourses({ sort: "popular", limit: 12 }),
    listCourses({ sort: "popular", limit: 12, sourceIn: ["CS50", "UNIVERSITY"] }),
    listCourses({ sort: "popular", limit: 12, lang: "hindi" }),
    listCourses({ sort: "rating", limit: 12 }),
    listCourses({ sort: "newest", limit: 12 }),
    listCourses({ sort: "trending", limit: 12 }),
    ...cats.slice(0, 4).map((c) => listCourses({ category: c.category, sort: "popular", limit: 12 })),
  ]);
  return {
    categories: cats,
    rows: [
      { key: "popular", title: "Most popular", courses: popular.courses },
      { key: "universities", title: "From top universities", courses: universities.courses },
      { key: "trending", title: "Trending this week", courses: trending.courses },
      { key: "hindi", title: "Learn in Hindi", courses: hindi.courses },
      { key: "rating", title: "Top rated", courses: rated.courses },
      { key: "newest", title: "New and noteworthy", courses: fresh.courses },
      ...cats.slice(0, 4).map((c, i) => ({ key: `cat:${c.category}`, title: c.category, category: c.category, courses: byCategory[i].courses })),
    ],
  };
}

/** Udemy-style rows for the /courses home. Cached per isolate for a minute. */
export async function getBrowseRows() {
  const hit = browseCache.get("rows");
  if (hit) return hit;
  const rows = await loadBrowseRows();
  browseCache.set("rows", rows);
  return rows;
}

/**
 * Unlisted community courses for feed discovery: the best by engagement plus a
 * few fresh ones so new creators get their first viewers.
 */
export async function listFeedCourses(limit = 6) {
  const db = getDb();
  const base = and(eq(courses.status, "PUBLISHED"), eq(courses.listed, false), eq(courses.source, "COMMUNITY"));
  const [top, fresh] = await Promise.all([
    db.select().from(courses).where(base).orderBy(desc(courses.trendScore)).limit(limit),
    db.select().from(courses).where(base).orderBy(desc(courses.createdAt)).limit(Math.ceil(limit / 2)),
  ]);
  const seen = new Set<string>();
  const mixed: Course[] = [];
  // Interleave: top, fresh, top, fresh... without duplicates.
  for (let i = 0; mixed.length < limit && (i < top.length || i < fresh.length); i++) {
    for (const c of [top[i], fresh[i]]) {
      if (c && !seen.has(c.id) && mixed.length < limit) {
        seen.add(c.id);
        mixed.push(c);
      }
    }
  }
  return mixed;
}

/** Applies the current promotion rule and trend score to one course row. */
async function applyPromotion(c: Course) {
  const listed = shouldBeListed(c);
  const score = trendScore(c);
  if (listed === c.listed && Math.abs(score - c.trendScore) < 0.01) return;
  await getDb()
    .update(courses)
    .set({ listed, trendScore: score, ...(listed && !c.listed ? { listedAt: new Date() } : {}) })
    .where(eq(courses.id, c.id));
}

/**
 * Counts one view per viewer per course per day (Redis dedupe when available),
 * then re-checks promotion. Never throws: views are best-effort analytics.
 */
export async function recordCourseView(courseId: string, viewerKey: string) {
  try {
    const r = getRedis();
    if (r) {
      const fresh = await r.set(`course:view:${courseId}:${viewerKey}`, 1, { nx: true, ex: 86_400 });
      if (!fresh) return;
    }
    const [row] = await getDb()
      .update(courses)
      .set({ viewCount: sql`${courses.viewCount} + 1` })
      .where(and(eq(courses.id, courseId), eq(courses.status, "PUBLISHED")))
      .returning();
    if (row) await applyPromotion(row);
  } catch (error) {
    console.warn("[courses] view not recorded", error);
  }
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

/** Recount denormalised totals after curriculum, enrolment or review changes, then re-check promotion. */
export async function refreshCourseStats(courseId: string) {
  const db = getDb();
  const [[lec], [enr], [rev], [wish]] = await Promise.all([
    db.select({ n: count(), d: sql<number>`coalesce(sum(${courseLectures.durationSec}), 0)::int` }).from(courseLectures).where(eq(courseLectures.courseId, courseId)),
    db
      .select({ n: count(), done: sql<number>`count(${courseEnrollments.completedAt})::int` })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.courseId, courseId)),
    db.select({ n: count(), avg: sql<number>`coalesce(avg(${courseReviews.rating}), 0)::real` }).from(courseReviews).where(eq(courseReviews.courseId, courseId)),
    db.select({ n: count() }).from(courseWishlist).where(eq(courseWishlist.courseId, courseId)),
  ]);
  const [row] = await db
    .update(courses)
    .set({
      lecturesCount: Number(lec.n),
      durationSec: Number(lec.d),
      enrollCount: Number(enr.n),
      completionCount: Number(enr.done),
      wishlistCount: Number(wish.n),
      ratingCount: Number(rev.n),
      ratingAvg: Number(rev.avg),
    })
    .where(eq(courses.id, courseId))
    .returning();
  if (row) await applyPromotion(row);
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

/** Feeds course interest into the student's personalisation signals (Redis affinity + behaviour log). Never throws. */
export async function trackCourseInterest(profileId: string, course: Course, kind: "COURSE_VIEW" | "COURSE_ENROLL") {
  await trackUserBehavior({
    userId: profileId,
    eventType: kind,
    targetType: "COURSE",
    targetId: course.id,
    metadata: { interests: [course.category, ...course.tags.slice(0, 3)] },
    weight: kind === "COURSE_ENROLL" ? 3 : 1,
  }).catch(() => {});
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
