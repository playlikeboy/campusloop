/**
 * Scoring rules for Play games. Pure and shared by the API and tests.
 */
import { previousDay } from "./week";

/* ───────────── DP Battle: Elo rating ───────────── */

export const ELO_START = 1200;
export const ELO_K = 32;
/** Entries need this many battles before they get a leaderboard rank. */
export const DP_MIN_BATTLES_TO_RANK = 5;

/** Chance that a player rated `a` beats one rated `b`. */
export function eloExpected(a: number, b: number): number {
  return 1 / (1 + 10 ** ((b - a) / 400));
}

/**
 * Points the winner gains (and the loser drops) after one head-to-head.
 * Always at least 1 so every win counts.
 */
export function eloDelta(winnerRating: number, loserRating: number, k = ELO_K): number {
  return Math.max(1, Math.round(k * (1 - eloExpected(winnerRating, loserRating))));
}

/** Both ids sorted and joined: the same pair whichever side won. */
export function dpPairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/* ───────────── Campus Trivia ───────────── */

export const TRIVIA_QUESTIONS_PER_DAY = 5;
export const TRIVIA_SECONDS_PER_QUESTION = 20;
/** Network slack added to the limit before an answer counts as late. */
export const TRIVIA_GRACE_MS = 2500;
export const TRIVIA_BASE_POINTS = 100;
export const TRIVIA_MAX_SPEED_BONUS = 50;

/**
 * Points for one answer: 100 for a right answer plus up to 50 for speed,
 * nothing for a wrong or late one. `elapsedMs` is measured by the server.
 */
export function triviaAnswerPoints(correct: boolean, elapsedMs: number): number {
  const limitMs = TRIVIA_SECONDS_PER_QUESTION * 1000;
  if (!correct || elapsedMs > limitMs + TRIVIA_GRACE_MS) return 0;
  const clamped = Math.min(Math.max(elapsedMs, 0), limitMs);
  const bonus = Math.round(TRIVIA_MAX_SPEED_BONUS * (1 - clamped / limitMs));
  return TRIVIA_BASE_POINTS + bonus;
}

/**
 * Daily quiz streak from the IST days a student finished the quiz.
 * The current run stays alive until today ends, so finishing yesterday counts.
 */
export function dailyStreak(days: string[], today: string): { current: number; best: number } {
  const set = new Set(days);
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev !== null && previousDay(day) === prev ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }

  let cursor = set.has(today) ? today : previousDay(today);
  let current = 0;
  while (set.has(cursor)) {
    current += 1;
    cursor = previousDay(cursor);
  }
  return { current, best };
}

/* ───────────── Branch Wars ───────────── */

export const BRANCH_POINTS = {
  /** Per right trivia answer. */
  TRIVIA_CORRECT: 2,
  /** Per This or That pick, up to TOT_WEEKLY_CAP picks a week. */
  TOT_PICK: 1,
  TOT_WEEKLY_CAP: 30,
  MEME_POSTED: 5,
  MEME_UPVOTE: 1,
  DP_WIN: 1,
} as const;

export interface StudentWeekActivity {
  triviaCorrect: number;
  totPicks: number;
  memesPosted: number;
  memeUpvotes: number;
  dpWins: number;
}

/** One student's Branch Wars points for a week. */
export function branchPointsFor(a: StudentWeekActivity): number {
  return (
    a.triviaCorrect * BRANCH_POINTS.TRIVIA_CORRECT +
    Math.min(a.totPicks, BRANCH_POINTS.TOT_WEEKLY_CAP) * BRANCH_POINTS.TOT_PICK +
    a.memesPosted * BRANCH_POINTS.MEME_POSTED +
    a.memeUpvotes * BRANCH_POINTS.MEME_UPVOTE +
    a.dpWins * BRANCH_POINTS.DP_WIN
  );
}

/** Lower-case, single-spaced branch name used to group students. */
export function normalizeBranch(branch: string | null | undefined): string | null {
  const cleaned = (branch ?? "").trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.toLowerCase() : null;
}

export interface BranchRow {
  branch: string;
  points: number;
  players: number;
}

/**
 * Groups student points by branch and ranks them: most points first, then
 * more players, then name. Students with no branch or no points are skipped.
 */
export function rankBranches(
  students: Array<{ branch: string | null | undefined; points: number }>
): BranchRow[] {
  const map = new Map<string, BranchRow>();
  for (const s of students) {
    const key = normalizeBranch(s.branch);
    if (!key || s.points <= 0) continue;
    const row = map.get(key) ?? { branch: (s.branch ?? "").trim().replace(/\s+/g, " "), points: 0, players: 0 };
    row.points += s.points;
    row.players += 1;
    map.set(key, row);
  }
  return [...map.values()].sort(
    (a, b) => b.points - a.points || b.players - a.players || a.branch.localeCompare(b.branch)
  );
}
