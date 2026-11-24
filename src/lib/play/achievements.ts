/**
 * Which badges a student has earned, from their game stats. Pure, so the rules
 * are unit tested; src/lib/play/server/achievements.ts gathers the stats and
 * stores new awards (idempotent on profile + key + context).
 */
import { PLAY_THRESHOLDS } from "@/constants/play";

export interface AchievementStats {
  dpEntries: number;
  dpWins: number;
  /** Finished weeks only: campus rank (1-based) and how many entries qualified. */
  dpWeekFinishes: Array<{ week: string; rank: number; field: number }>;
  memesPosted: number;
  /** Finished weeks where the student's meme was top on campus. */
  memeWins: Array<{ week: string; upvotes: number; field: number }>;
  triviaDone: number;
  triviaPerfect: number;
  triviaBestStreak: number;
  totPicks: number;
  /** Finished weeks where the student's branch won and the student scored. */
  branchWinWeeks: string[];
}

export interface EarnedAchievement {
  key: string;
  /** "" for one-time badges, the week key for weekly ones. */
  context: string;
}

export function evaluateAchievements(s: AchievementStats): EarnedAchievement[] {
  const out: EarnedAchievement[] = [];
  const once = (key: string, ok: boolean) => {
    if (ok) out.push({ key, context: "" });
  };

  once("dp_enter", s.dpEntries > 0);
  once("dp_first_win", s.dpWins >= 1);
  once("dp_wins_25", s.dpWins >= 25);
  for (const f of s.dpWeekFinishes) {
    if (f.rank === 1 && f.field >= PLAY_THRESHOLDS.DP_CHAMPION_MIN_FIELD) {
      out.push({ key: "dp_champion", context: f.week });
    }
    if (f.rank <= 10 && f.field >= PLAY_THRESHOLDS.DP_TOP10_MIN_FIELD) {
      out.push({ key: "dp_top10", context: f.week });
    }
  }

  once("meme_first", s.memesPosted > 0);
  for (const w of s.memeWins) {
    if (w.field >= PLAY_THRESHOLDS.MEME_WIN_MIN_FIELD && w.upvotes >= PLAY_THRESHOLDS.MEME_WIN_MIN_UPVOTES) {
      out.push({ key: "meme_winner", context: w.week });
    }
  }

  once("trivia_first", s.triviaDone > 0);
  once("trivia_perfect", s.triviaPerfect > 0);
  once("trivia_streak_5", s.triviaBestStreak >= 5);
  once("trivia_streak_15", s.triviaBestStreak >= 15);

  once("tot_25", s.totPicks >= 25);
  once("tot_100", s.totPicks >= 100);

  for (const week of s.branchWinWeeks) out.push({ key: "branch_champs", context: week });

  return out;
}
