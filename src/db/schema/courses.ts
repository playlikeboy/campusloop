import { boolean, index, integer, jsonb, pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./common";
import { userProfiles } from "./users";

/**
 * Courses: Udemy-style video courses created by students or imported from
 * open courseware (CS50). See docs/COURSES_PLAN.md.
 */
export const courses = pgTable(
  "courses",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description").default("").notNull(), // Markdown
    category: text("category").default("General").notNull(),
    level: text("level").default("ALL").notNull(), // BEGINNER | INTERMEDIATE | ADVANCED | ALL
    language: text("language").default("English").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    instructorName: text("instructor_name").notNull(),
    instructorBio: text("instructor_bio"),
    creatorId: text("creator_id").references(() => userProfiles.id, { onDelete: "set null" }),
    source: text("source").default("COMMUNITY").notNull(), // COMMUNITY | CS50 | UNIVERSITY | CREATOR
    provider: text("provider"), // e.g. "MIT OpenCourseWare", "CodeWithHarry"; null for community courses
    // Ranking head start by source trust (promotion.ts SOURCE_BOOST). Never shown as a rating.
    rankBoost: real("rank_boost").default(0).notNull(),
    sourceUrl: text("source_url"),
    license: text("license"),
    outcomes: jsonb("outcomes").$type<string[]>().default([]).notNull(),
    requirements: jsonb("requirements").$type<string[]>().default([]).notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    status: text("status").default("DRAFT").notNull(), // DRAFT | PUBLISHED
    isFeatured: boolean("is_featured").default(false).notNull(),
    // Community courses start unlisted: shown in feeds, not the /courses catalog,
    // until engagement promotes them (src/lib/courses/promotion.ts).
    listed: boolean("listed").default(false).notNull(),
    listedAt: timestamp("listed_at", { withTimezone: true }),
    viewCount: integer("view_count").default(0).notNull(),
    wishlistCount: integer("wishlist_count").default(0).notNull(),
    completionCount: integer("completion_count").default(0).notNull(),
    trendScore: real("trend_score").default(0).notNull(),
    lecturesCount: integer("lectures_count").default(0).notNull(),
    durationSec: integer("duration_sec").default(0).notNull(),
    enrollCount: integer("enroll_count").default(0).notNull(),
    ratingAvg: real("rating_avg").default(0).notNull(),
    ratingCount: integer("rating_count").default(0).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("courses_status_idx").on(t.status, t.enrollCount),
    index("courses_creator_idx").on(t.creatorId),
    index("courses_listed_idx").on(t.status, t.listed, t.trendScore),
  ]
);

export const courseSections = pgTable(
  "course_sections",
  {
    id: id(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").default(0).notNull(),
    createdAt,
  },
  (t) => [index("course_sections_course_idx").on(t.courseId, t.position)]
);

export interface LectureAttachment {
  label: string;
  url: string;
}

export const courseLectures = pgTable(
  "course_lectures",
  {
    id: id(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    sectionId: text("section_id")
      .notNull()
      .references(() => courseSections.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").default(0).notNull(),
    kind: text("kind").default("VIDEO").notNull(), // VIDEO | ARTICLE | LINK
    videoProvider: text("video_provider"), // youtube | vimeo | file
    videoRef: text("video_ref"), // YouTube/Vimeo id or file URL
    durationSec: integer("duration_sec").default(0).notNull(),
    body: text("body"), // Markdown: article content or lecture description
    isPreview: boolean("is_preview").default(false).notNull(),
    attachments: jsonb("attachments").$type<LectureAttachment[]>().default([]).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [index("course_lectures_course_idx").on(t.courseId, t.position), index("course_lectures_section_idx").on(t.sectionId)]
);

export const courseEnrollments = pgTable(
  "course_enrollments",
  {
    id: id(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    lastLectureId: text("last_lecture_id"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex("course_enrollments_unique").on(t.courseId, t.profileId), index("course_enrollments_profile_idx").on(t.profileId)]
);

export const courseLectureProgress = pgTable(
  "course_lecture_progress",
  {
    id: id(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    lectureId: text("lecture_id")
      .notNull()
      .references(() => courseLectures.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    positionSec: integer("position_sec").default(0).notNull(),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt,
  },
  (t) => [uniqueIndex("course_progress_unique").on(t.profileId, t.lectureId), index("course_progress_course_idx").on(t.profileId, t.courseId)]
);

export const courseNotes = pgTable(
  "course_notes",
  {
    id: id(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    lectureId: text("lecture_id")
      .notNull()
      .references(() => courseLectures.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    atSec: integer("at_sec").default(0).notNull(),
    body: text("body").notNull(),
    createdAt,
  },
  (t) => [index("course_notes_owner_idx").on(t.profileId, t.courseId)]
);

export const courseReviews = pgTable(
  "course_reviews",
  {
    id: id(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    body: text("body"),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex("course_reviews_unique").on(t.courseId, t.profileId)]
);

export const courseQuestions = pgTable(
  "course_questions",
  {
    id: id(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    lectureId: text("lecture_id").references(() => courseLectures.id, { onDelete: "set null" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body"),
    createdAt,
  },
  (t) => [index("course_questions_course_idx").on(t.courseId, t.createdAt)]
);

export const courseAnswers = pgTable(
  "course_answers",
  {
    id: id(),
    questionId: text("question_id")
      .notNull()
      .references(() => courseQuestions.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt,
  },
  (t) => [index("course_answers_question_idx").on(t.questionId)]
);

export const courseCertificates = pgTable(
  "course_certificates",
  {
    id: id(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    recipientName: text("recipient_name").notNull(),
    courseTitle: text("course_title").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("course_certificates_unique").on(t.courseId, t.profileId)]
);

export const courseWishlist = pgTable(
  "course_wishlist",
  {
    id: id(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    createdAt,
  },
  (t) => [uniqueIndex("course_wishlist_unique").on(t.courseId, t.profileId)]
);

export type Course = typeof courses.$inferSelect;
export type CourseSection = typeof courseSections.$inferSelect;
export type CourseLecture = typeof courseLectures.$inferSelect;
