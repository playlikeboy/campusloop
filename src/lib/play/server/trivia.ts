/**
 * Campus Trivia: one 5-question quiz a day (IST). Questions are served one at a
 * time and timed on the server from served_at, so reloading or a fast client
 * clock cannot change the score.
 */
import { and, desc, eq, gte, notInArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { playTriviaQuestions, playTriviaRuns, userProfiles } from "@/db/schema";
import {
  dailyStreak,
  TRIVIA_QUESTIONS_PER_DAY,
  TRIVIA_SECONDS_PER_QUESTION,
  triviaAnswerPoints,
} from "@/lib/play/scoring";
import { dayEndsAt, istDateString, weekKey } from "@/lib/play/week";
import type { Player } from "./context";

export interface ServedQuestion {
  runId: string;
  index: number;
  total: number;
  category: string;
  question: string;
  options: string[];
  /** Epoch ms (server clock) when this question stops counting. */
  deadline: number;
  /** Time left when the server answered; the client counts down from this to avoid clock skew. */
  remainingMs: number;
}

export async function triviaStreakFor(profileId: string) {
  const rows = await getDb()
    .select({ day: playTriviaRuns.localDate })
    .from(playTriviaRuns)
    .where(and(eq(playTriviaRuns.profileId, profileId), eq(playTriviaRuns.status, "DONE")))
    .orderBy(desc(playTriviaRuns.localDate))
    .limit(400);
  return dailyStreak(
    rows.map((r) => r.day),
    istDateString()
  );
}

async function todayRun(profileId: string) {
  const [run] = await getDb()
    .select()
    .from(playTriviaRuns)
    .where(and(eq(playTriviaRuns.profileId, profileId), eq(playTriviaRuns.localDate, istDateString())))
    .limit(1);
  return run ?? null;
}

export async function getTriviaState(profile: Player) {
  const db = getDb();
  const today = istDateString();
  const [run, streak, leaders] = await Promise.all([
    todayRun(profile.id),
    triviaStreakFor(profile.id),
    db
      .select({
        profileId: playTriviaRuns.profileId,
        score: playTriviaRuns.score,
        correct: playTriviaRuns.correctCount,
        displayName: userProfiles.displayName,
        username: userProfiles.username,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(playTriviaRuns)
      .innerJoin(userProfiles, eq(userProfiles.id, playTriviaRuns.profileId))
      .where(
        and(
          eq(playTriviaRuns.institutionId, profile.institutionId),
          eq(playTriviaRuns.localDate, today),
          eq(playTriviaRuns.status, "DONE"),
          eq(userProfiles.isSeeded, false),
          eq(userProfiles.status, "ACTIVE")
        )
      )
      .orderBy(desc(playTriviaRuns.score), playTriviaRuns.finishedAt)
      .limit(10),
  ]);

  return {
    today,
    endsAt: dayEndsAt(),
    questionsPerDay: TRIVIA_QUESTIONS_PER_DAY,
    secondsPerQuestion: TRIVIA_SECONDS_PER_QUESTION,
    streak,
    run: run
      ? {
          id: run.id,
          status: run.status as "IN_PROGRESS" | "DONE",
          index: run.currentIndex,
          score: run.score,
          correct: run.correctCount,
          total: run.questionIds.length,
        }
      : null,
    leaderboard: leaders.map((l, i) => ({
      rank: i + 1,
      displayName: l.displayName,
      username: l.username,
      avatarUrl: l.avatarUrl,
      score: l.score,
      correct: l.correct,
      isMe: l.profileId === profile.id,
    })),
  };
}

export type StartResult = { ok: true; runId: string } | { ok: false; error: string; status: number };

/** Creates today's run with 5 questions the student hasn't seen in their last 30 quizzes. */
export async function startTrivia(profile: Player): Promise<StartResult> {
  const db = getDb();
  const existing = await todayRun(profile.id);
  if (existing) return { ok: true, runId: existing.id };

  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const recent = await db
    .select({ ids: playTriviaRuns.questionIds })
    .from(playTriviaRuns)
    .where(and(eq(playTriviaRuns.profileId, profile.id), gte(playTriviaRuns.createdAt, since)))
    .orderBy(desc(playTriviaRuns.createdAt))
    .limit(30);
  const seen = [...new Set(recent.flatMap((r) => r.ids))];

  const pick = (exclude: string[]) =>
    db
      .select({ id: playTriviaQuestions.id })
      .from(playTriviaQuestions)
      .where(
        and(
          eq(playTriviaQuestions.isActive, true),
          exclude.length ? notInArray(playTriviaQuestions.id, exclude) : undefined
        )
      )
      .orderBy(sql`random()`)
      .limit(TRIVIA_QUESTIONS_PER_DAY);

  let chosen = (await pick(seen)).map((q) => q.id);
  if (chosen.length < TRIVIA_QUESTIONS_PER_DAY) {
    const extra = (await pick(chosen)).map((q) => q.id);
    chosen = [...chosen, ...extra].slice(0, TRIVIA_QUESTIONS_PER_DAY);
  }
  if (chosen.length < TRIVIA_QUESTIONS_PER_DAY) {
    return { ok: false, error: "Today's quiz isn't ready yet. Check back soon.", status: 503 };
  }

  await db
    .insert(playTriviaRuns)
    .values({
      profileId: profile.id,
      institutionId: profile.institutionId,
      localDate: istDateString(),
      weekKey: weekKey(),
      questionIds: chosen,
    })
    .onConflictDoNothing();
  const run = await todayRun(profile.id);
  if (!run) return { ok: false, error: "Couldn't start the quiz. Try again.", status: 500 };
  return { ok: true, runId: run.id };
}

export type ServeResult = { ok: true; question: ServedQuestion } | { ok: false; error: string; status: number };

/**
 * Shows the current question. The timer starts the first time a question is
 * served; serving it again (a reload) keeps the original start time.
 */
export async function serveQuestion(profile: Player, runId: string): Promise<ServeResult> {
  const db = getDb();
  const [run] = await db
    .select()
    .from(playTriviaRuns)
    .where(and(eq(playTriviaRuns.id, runId), eq(playTriviaRuns.profileId, profile.id)))
    .limit(1);
  if (!run || run.status !== "IN_PROGRESS") return { ok: false, error: "This quiz is finished.", status: 409 };

  let servedAt = run.servedAt;
  if (run.servedIndex !== run.currentIndex || !servedAt) {
    const [updated] = await db
      .update(playTriviaRuns)
      .set({ servedIndex: run.currentIndex, servedAt: new Date() })
      .where(
        and(
          eq(playTriviaRuns.id, run.id),
          eq(playTriviaRuns.currentIndex, run.currentIndex),
          sql`${playTriviaRuns.servedIndex} <> ${run.currentIndex}`
        )
      )
      .returning({ servedAt: playTriviaRuns.servedAt });
    if (updated?.servedAt) {
      servedAt = updated.servedAt;
    } else {
      // Another tab served it a moment ago: use that start time.
      const [fresh] = await db
        .select({ servedAt: playTriviaRuns.servedAt })
        .from(playTriviaRuns)
        .where(eq(playTriviaRuns.id, run.id))
        .limit(1);
      servedAt = fresh?.servedAt ?? new Date();
    }
  }

  const questionId = run.questionIds[run.currentIndex];
  const [q] = await db.select().from(playTriviaQuestions).where(eq(playTriviaQuestions.id, questionId)).limit(1);
  if (!q) return { ok: false, error: "Question missing. Try again tomorrow.", status: 500 };

  return {
    ok: true,
    question: {
      runId: run.id,
      index: run.currentIndex,
      total: run.questionIds.length,
      category: q.category,
      question: q.question,
      options: q.options,
      deadline: (servedAt as Date).getTime() + TRIVIA_SECONDS_PER_QUESTION * 1000,
      remainingMs: Math.max(0, (servedAt as Date).getTime() + TRIVIA_SECONDS_PER_QUESTION * 1000 - Date.now()),
    },
  };
}

export type AnswerResult =
  | {
      ok: true;
      correct: boolean;
      answerIndex: number;
      explanation: string | null;
      points: number;
      score: number;
      correctCount: number;
      done: boolean;
      late: boolean;
    }
  | { ok: false; error: string; status: number };

/** choice = -1 means time ran out. */
export async function answerQuestion(
  profile: Player,
  runId: string,
  index: number,
  choice: number
): Promise<AnswerResult> {
  const db = getDb();
  const [run] = await db
    .select()
    .from(playTriviaRuns)
    .where(and(eq(playTriviaRuns.id, runId), eq(playTriviaRuns.profileId, profile.id)))
    .limit(1);
  if (!run || run.status !== "IN_PROGRESS") return { ok: false, error: "This quiz is finished.", status: 409 };
  if (run.currentIndex !== index || run.servedIndex !== index || !run.servedAt) {
    return { ok: false, error: "That question was already answered.", status: 409 };
  }

  const [q] = await db
    .select()
    .from(playTriviaQuestions)
    .where(eq(playTriviaQuestions.id, run.questionIds[index]))
    .limit(1);
  if (!q) return { ok: false, error: "Question missing.", status: 500 };

  const elapsed = Date.now() - run.servedAt.getTime();
  const correct = choice === q.answerIndex;
  const points = triviaAnswerPoints(correct, elapsed);
  const late = points === 0 && correct;
  const countedCorrect = points > 0;
  const nextIndex = index + 1;
  const done = nextIndex >= run.questionIds.length;
  const answer = { choice, correct: countedCorrect, points, ms: elapsed };

  const [updated] = await db
    .update(playTriviaRuns)
    .set({
      answers: sql`${playTriviaRuns.answers} || ${JSON.stringify([answer])}::jsonb`,
      score: sql`${playTriviaRuns.score} + ${points}`,
      correctCount: sql`${playTriviaRuns.correctCount} + ${countedCorrect ? 1 : 0}`,
      currentIndex: nextIndex,
      status: done ? "DONE" : "IN_PROGRESS",
      finishedAt: done ? new Date() : null,
    })
    .where(and(eq(playTriviaRuns.id, run.id), eq(playTriviaRuns.currentIndex, index)))
    .returning({ score: playTriviaRuns.score, correctCount: playTriviaRuns.correctCount });
  if (!updated) return { ok: false, error: "That question was already answered.", status: 409 };

  return {
    ok: true,
    correct: countedCorrect,
    answerIndex: q.answerIndex,
    explanation: q.explanation,
    points,
    score: updated.score,
    correctCount: updated.correctCount,
    done,
    late,
  };
}

/** Finished-quiz stats used by badges. */
export async function triviaTotals(profileId: string) {
  const [row] = await getDb()
    .select({
      done: sql<number>`count(*)::int`,
      perfect: sql<number>`count(*) FILTER (WHERE ${playTriviaRuns.correctCount} >= ${TRIVIA_QUESTIONS_PER_DAY})::int`,
    })
    .from(playTriviaRuns)
    .where(and(eq(playTriviaRuns.profileId, profileId), eq(playTriviaRuns.status, "DONE")));
  return { done: Number(row?.done ?? 0), perfect: Number(row?.perfect ?? 0) };
}

