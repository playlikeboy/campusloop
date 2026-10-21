import { desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { courseAnswers, courseQuestions, userProfiles } from "@/db/schema";
import { findPublishedCourse, requireProfile } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

const author = { displayName: userProfiles.displayName, username: userProfiles.username, avatarUrl: userProfiles.avatarUrl };

/** Course Q&A: questions (optionally per lecture) with answers. */
export async function GET(req: Request, { params }: Ctx) {
  const course = await findPublishedCourse((await params).slug);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const lectureId = new URL(req.url).searchParams.get("lectureId");
  const db = getDb();
  const questions = await db
    .select({ id: courseQuestions.id, lectureId: courseQuestions.lectureId, title: courseQuestions.title, body: courseQuestions.body, createdAt: courseQuestions.createdAt, author })
    .from(courseQuestions)
    .innerJoin(userProfiles, eq(userProfiles.id, courseQuestions.profileId))
    .where(lectureId ? eq(courseQuestions.lectureId, lectureId) : eq(courseQuestions.courseId, course.id))
    .orderBy(desc(courseQuestions.createdAt))
    .limit(50);
  const answers = questions.length
    ? await db
        .select({ id: courseAnswers.id, questionId: courseAnswers.questionId, body: courseAnswers.body, createdAt: courseAnswers.createdAt, author })
        .from(courseAnswers)
        .innerJoin(userProfiles, eq(userProfiles.id, courseAnswers.profileId))
        .where(inArray(courseAnswers.questionId, questions.map((q) => q.id)))
    : [];
  return NextResponse.json({ questions: questions.map((q) => ({ ...q, answers: answers.filter((a) => a.questionId === q.id) })) });
}

/** Body: { title, body?, lectureId? } to ask, or { questionId, body } to answer. */
export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  const course = await findPublishedCourse((await params).slug);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const b = (await req.json().catch(() => null)) as { title?: string; body?: string; lectureId?: string; questionId?: string } | null;
  const db = getDb();
  if (b?.questionId) {
    const q = await db.query.courseQuestions.findFirst({ where: eq(courseQuestions.id, b.questionId) });
    const text = (b.body ?? "").trim().slice(0, 4000);
    if (!q || q.courseId !== course.id) return NextResponse.json({ error: "Question not found" }, { status: 404 });
    if (!text) return NextResponse.json({ error: "Write an answer first" }, { status: 400 });
    await db.insert(courseAnswers).values({ questionId: q.id, profileId: auth.profile.id, body: text });
    return NextResponse.json({ ok: true }, { status: 201 });
  }
  const title = (b?.title ?? "").trim().slice(0, 200);
  if (title.length < 5) return NextResponse.json({ error: "Write a clear question (5+ characters)" }, { status: 400 });
  await db.insert(courseQuestions).values({
    courseId: course.id,
    lectureId: b?.lectureId || null,
    profileId: auth.profile.id,
    title,
    body: (b?.body ?? "").trim().slice(0, 4000) || null,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
