import { and, desc, eq, ilike, inArray, or, type SQL, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { academicResources, type Course, courseEnrollments, courses, savedAcademicResources } from "@/db/schema";
import { IsolateCache } from "@/lib/isolate-cache";
import { recentSearches } from "@/lib/search-history";
import { getRecentTargets, getUserAffinityInterests } from "@/lib/user-behavior";
import { buildSignals, domainOf, rankDiverse, type Signals, slotTitle } from "./recommend-signals";
import { listCourses, listFeedCourses } from "./server";

/**
 * Personalised course picks for the feed slot. Signals: profile branch and
 * degree, academics vault context (/academics saved resources and semester),
 * profile interests, Redis interest affinity, recent searches,
 * recently viewed courses and enrolments (see recommend-signals.ts).
 * Everything is best-effort: missing Redis or a cold profile falls back to
 * popular courses, and rising community courses are always mixed in so new
 * creators keep getting discovered.
 */

export interface CourseSlot {
  title: string;
  personalised: boolean;
  courses: Course[];
}

const popularScore = sql`${courses.rankBoost} * 4 + ln(1 + ${courses.enrollCount}) + ${courses.trendScore} * 0.5`;
const cache = new IsolateCache<CourseSlot>(3 * 60_000, 500);

/** Interleave rising community courses at positions 3 and 6, respecting domain isolation. */
function withRising(picks: Course[], rising: Course[], limit: number, targetDomain?: string): Course[] {
  const eligibleRising = targetDomain && targetDomain !== "general" && targetDomain !== "career"
    ? rising.filter((r) => domainOf(r.category) === targetDomain)
    : rising;
  const out = picks.filter((c) => !eligibleRising.some((r) => r.id === c.id)).slice(0, limit);
  eligibleRising.slice(0, 2).forEach((r, i) => out.splice(Math.min(out.length, 2 + i * 3), 0, r));
  return out.slice(0, limit);
}

async function candidates(s: Signals): Promise<Course[]> {
  const db = getDb();
  const base = and(eq(courses.status, "PUBLISHED"), eq(courses.listed, true));
  const cats = [...s.categories].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c);
  const kws = [...s.keywords].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k);
  const kwCond: SQL[] = kws.flatMap((k) => [ilike(courses.title, `%${k}%`), sql`${courses.tags}::text ilike ${`%${k}%`}`]);
  const [byCat, byKw] = await Promise.all([
    cats.length ? db.select().from(courses).where(and(base, inArray(courses.category, cats))).orderBy(desc(popularScore)).limit(60) : Promise.resolve([]),
    kwCond.length ? db.select().from(courses).where(and(base, or(...kwCond))).orderBy(desc(popularScore)).limit(60) : Promise.resolve([]),
  ]);
  const seen = new Map<string, Course>();
  for (const c of [...byKw, ...byCat]) seen.set(c.id, c);
  return [...seen.values()];
}

export async function courseSlotFor(
  profile: { id: string; branch?: string | null; course?: string | null; semester?: number | null; interests?: string[] | null } | null,
  limit = 8
): Promise<CourseSlot> {
  const rising = await listFeedCourses(3).catch(() => [] as Course[]);
  if (!profile) {
    const popular = await listCourses({ sort: "popular", limit });
    return { title: "Popular free courses", personalised: false, courses: withRising(popular.courses, rising, limit) };
  }
  const hit = cache.get(profile.id);
  if (hit) return hit;

  const db = getDb();
  const [searches, affinity, viewedIds, enrolledRows, savedResources] = await Promise.all([
    recentSearches(profile.id, 8),
    getUserAffinityInterests(profile.id),
    getRecentTargets(profile.id, "COURSE_VIEW", 10),
    db
      .select({ id: courses.id, category: courses.category, tags: courses.tags })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courses.id, courseEnrollments.courseId))
      .where(eq(courseEnrollments.profileId, profile.id))
      .limit(50),
    db
      .select({ subjectName: academicResources.subjectName })
      .from(savedAcademicResources)
      .innerJoin(academicResources, eq(academicResources.id, savedAcademicResources.resourceId))
      .where(eq(savedAcademicResources.profileId, profile.id))
      .limit(6)
      .catch(() => [] as { subjectName: string }[]),
  ]);
  const viewedRows = viewedIds.length
    ? await db.select({ id: courses.id, category: courses.category, tags: courses.tags }).from(courses).where(inArray(courses.id, viewedIds))
    : [];
  const viewed = viewedIds.map((id) => viewedRows.find((r) => r.id === id)).filter((r): r is NonNullable<typeof r> => Boolean(r));

  const academicSubjects = savedResources.map((r) => r.subjectName).filter(Boolean);

  const signals = buildSignals({
    branch: profile.branch,
    course: profile.course,
    semester: profile.semester,
    academicSubjects,
    interests: profile.interests ?? [],
    affinity,
    searches,
    enrolled: enrolledRows,
    viewed,
  });
  const pool = signals.categories.size || signals.keywords.size ? await candidates(signals) : [];
  let picks = rankDiverse(pool, signals, limit);
  let personalised = picks.length >= 3;
  if (!personalised) {
    // Cold start: popular courses the student is not already taking.
    const popular = await listCourses({ sort: "popular", limit: limit + signals.exclude.size });
    picks = popular.courses.filter((c) => !signals.exclude.has(c.id)).slice(0, limit);
    personalised = false;
  }
  const slot = {
    title: personalised ? slotTitle(signals) : "Popular free courses",
    personalised,
    courses: withRising(picks, rising, limit, signals.targetDomain),
  };
  cache.set(profile.id, slot);
  return slot;
}
