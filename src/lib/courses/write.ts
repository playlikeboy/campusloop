import { and, eq, notInArray } from "drizzle-orm";
import { getDb } from "@/db";
import { courseLectures, courseSections, courses } from "@/db/schema";
import { parseVideoUrl, slugifyCourse } from "./format";
import { refreshCourseStats } from "./server";
import type { CourseInput } from "./validate";

const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

/** Unique slug: "intro-to-dsa", then "intro-to-dsa-2", ... */
export async function uniqueCourseSlug(title: string, ignoreId?: string): Promise<string> {
  const db = getDb();
  const base = slugifyCourse(title);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const hit = await db.query.courses.findFirst({ where: eq(courses.slug, slug), columns: { id: true } });
    if (!hit || hit.id === ignoreId) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Replaces a course's curriculum with the builder's sections and lectures.
 * Existing ids are reused (so learner progress survives edits); anything not
 * sent is removed. Only ids that already belong to this course are reused.
 */
export async function saveCurriculum(courseId: string, input: CourseInput) {
  const db = getDb();
  const existing = await db
    .select({ id: courseLectures.id })
    .from(courseLectures)
    .where(eq(courseLectures.courseId, courseId));
  const existingSections = await db.select({ id: courseSections.id }).from(courseSections).where(eq(courseSections.courseId, courseId));
  const ownLecture = new Set(existing.map((e) => e.id));
  const ownSection = new Set(existingSections.map((e) => e.id));

  const keepSections: string[] = [];
  const keepLectures: string[] = [];
  let position = 0;

  for (const [si, s] of input.sections.entries()) {
    const sectionId = s.id && ownSection.has(s.id) ? s.id : newId("sec");
    keepSections.push(sectionId);
    await db
      .insert(courseSections)
      .values({ id: sectionId, courseId, title: s.title, position: si })
      .onConflictDoUpdate({ target: courseSections.id, set: { title: s.title, position: si } });

    for (const l of s.lectures) {
      const lectureId = l.id && ownLecture.has(l.id) ? l.id : newId("lec");
      keepLectures.push(lectureId);
      const video = l.kind === "VIDEO" ? parseVideoUrl(l.videoUrl ?? "") : null;
      const row = {
        courseId,
        sectionId,
        title: l.title,
        position: position++,
        kind: l.kind,
        videoProvider: video?.provider ?? (l.kind === "LINK" ? "link" : null),
        videoRef: video?.ref ?? (l.kind === "LINK" ? (l.videoUrl ?? null) : null),
        durationSec: Math.round((l.durationMin ?? 0) * 60),
        body: l.body || null,
        isPreview: Boolean(l.isPreview),
        attachments: l.attachments ?? [],
      };
      await db
        .insert(courseLectures)
        .values({ id: lectureId, ...row })
        .onConflictDoUpdate({ target: courseLectures.id, set: { ...row, updatedAt: new Date() } });
    }
  }

  await db
    .delete(courseLectures)
    .where(keepLectures.length ? and(eq(courseLectures.courseId, courseId), notInArray(courseLectures.id, keepLectures)) : eq(courseLectures.courseId, courseId));
  await db
    .delete(courseSections)
    .where(keepSections.length ? and(eq(courseSections.courseId, courseId), notInArray(courseSections.id, keepSections)) : eq(courseSections.courseId, courseId));
  await refreshCourseStats(courseId);
}

export function courseColumns(input: CourseInput) {
  return {
    title: input.title,
    subtitle: input.subtitle || null,
    description: input.description ?? "",
    category: input.category ?? "General",
    level: input.level ?? "ALL",
    thumbnailUrl: input.thumbnailUrl || null,
    instructorName: input.instructorName || "Course instructor",
    outcomes: input.outcomes ?? [],
    requirements: input.requirements ?? [],
    tags: input.tags ?? [],
    status: input.status ?? "DRAFT",
  };
}

export { newId };
