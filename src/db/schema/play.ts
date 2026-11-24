import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./common";
import { institutions } from "./institutions";
import { userProfiles } from "./users";

/**
 * Play: campus games (DP Battle, Meme War, Trivia, This or That) and badges.
 * Every game is scoped to one campus and one IST week ("2026-W47").
 * Created by drizzle/manual/0015_play.sql.
 */

/**
 * DP Battle entries. A student opts in for one week with the profile photo they
 * have at that moment (snapshot in image_url). Only ACTIVE rows are ever shown.
 * status: ACTIVE | WITHDRAWN | HIDDEN (3 reports)
 */
export const playDpEntries = pgTable(
  "play_dp_entries",
  {
    id: id(),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    weekKey: text("week_key").notNull(),
    imageUrl: text("image_url").notNull(),
    rating: integer("rating").default(1200).notNull(),
    wins: integer("wins").default(0).notNull(),
    losses: integer("losses").default(0).notNull(),
    reportCount: integer("report_count").default(0).notNull(),
    status: text("status").default("ACTIVE").notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("play_dp_entries_profile_week_idx").on(t.profileId, t.weekKey),
    index("play_dp_entries_campus_week_idx").on(t.institutionId, t.weekKey, t.status, t.rating),
  ]
);

/**
 * One head-to-head vote. Voter identity is stored only to stop repeat votes on
 * the same pair; it is never returned by any API.
 */
export const playDpVotes = pgTable(
  "play_dp_votes",
  {
    id: id(),
    weekKey: text("week_key").notNull(),
    voterId: text("voter_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    winnerEntryId: text("winner_entry_id")
      .notNull()
      .references(() => playDpEntries.id, { onDelete: "cascade" }),
    loserEntryId: text("loser_entry_id")
      .notNull()
      .references(() => playDpEntries.id, { onDelete: "cascade" }),
    /** Both entry ids sorted and joined, so A-vs-B and B-vs-A are the same pair. */
    pairKey: text("pair_key").notNull(),
    createdAt,
  },
  (t) => [
    uniqueIndex("play_dp_votes_voter_pair_idx").on(t.voterId, t.pairKey),
    index("play_dp_votes_voter_week_idx").on(t.voterId, t.weekKey),
  ]
);

/** Weekly Meme War theme, shared by every campus. */
export const playMemeThemes = pgTable(
  "play_meme_themes",
  {
    id: id(),
    weekKey: text("week_key").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    createdAt,
  },
  (t) => [uniqueIndex("play_meme_themes_week_idx").on(t.weekKey)]
);

/** One meme per student per week. status: ACTIVE | DELETED | HIDDEN */
export const playMemes = pgTable(
  "play_memes",
  {
    id: id(),
    themeId: text("theme_id").references(() => playMemeThemes.id, { onDelete: "set null" }),
    weekKey: text("week_key").notNull(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    caption: text("caption"),
    upvotes: integer("upvotes").default(0).notNull(),
    reportCount: integer("report_count").default(0).notNull(),
    status: text("status").default("ACTIVE").notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("play_memes_profile_week_idx").on(t.profileId, t.weekKey),
    index("play_memes_campus_week_idx").on(t.institutionId, t.weekKey, t.status, t.upvotes),
  ]
);

export const playMemeVotes = pgTable(
  "play_meme_votes",
  {
    memeId: text("meme_id")
      .notNull()
      .references(() => playMemes.id, { onDelete: "cascade" }),
    voterId: text("voter_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    createdAt,
  },
  (t) => [primaryKey({ columns: [t.memeId, t.voterId] }), index("play_meme_votes_voter_idx").on(t.voterId)]
);

/** Trivia bank. category: TECH | GK | CAMPUS | PLACEMENTS */
export const playTriviaQuestions = pgTable(
  "play_trivia_questions",
  {
    id: id(),
    category: text("category").notNull(),
    question: text("question").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    answerIndex: integer("answer_index").notNull(),
    explanation: text("explanation"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt,
  },
  (t) => [
    uniqueIndex("play_trivia_questions_question_idx").on(t.question),
    index("play_trivia_questions_active_idx").on(t.isActive, t.category),
  ]
);

/**
 * One daily quiz per student (IST date). The server times every answer from
 * served_at, so the client clock never decides the score.
 * status: IN_PROGRESS | DONE
 */
export const playTriviaRuns = pgTable(
  "play_trivia_runs",
  {
    id: id(),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    localDate: text("local_date").notNull(),
    weekKey: text("week_key").notNull(),
    questionIds: jsonb("question_ids").$type<string[]>().notNull(),
    answers: jsonb("answers")
      .$type<Array<{ choice: number; correct: boolean; points: number; ms: number }>>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    currentIndex: integer("current_index").default(0).notNull(),
    servedIndex: integer("served_index").default(-1).notNull(),
    servedAt: timestamp("served_at", { withTimezone: true }),
    score: integer("score").default(0).notNull(),
    correctCount: integer("correct_count").default(0).notNull(),
    status: text("status").default("IN_PROGRESS").notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt,
  },
  (t) => [
    uniqueIndex("play_trivia_runs_profile_date_idx").on(t.profileId, t.localDate),
    index("play_trivia_runs_campus_date_idx").on(t.institutionId, t.localDate, t.status, t.score),
    index("play_trivia_runs_campus_week_idx").on(t.institutionId, t.weekKey, t.status),
  ]
);

/** This or That prompts. */
export const playTotPrompts = pgTable(
  "play_tot_prompts",
  {
    id: id(),
    optionA: text("option_a").notNull(),
    optionB: text("option_b").notNull(),
    category: text("category").default("CAMPUS").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt,
  },
  (t) => [uniqueIndex("play_tot_prompts_pair_idx").on(t.optionA, t.optionB)]
);

/** One pick per student per prompt. choice: A | B */
export const playTotVotes = pgTable(
  "play_tot_votes",
  {
    promptId: text("prompt_id")
      .notNull()
      .references(() => playTotPrompts.id, { onDelete: "cascade" }),
    voterId: text("voter_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    weekKey: text("week_key").notNull(),
    choice: text("choice").notNull(),
    createdAt,
  },
  (t) => [
    primaryKey({ columns: [t.promptId, t.voterId] }),
    index("play_tot_votes_prompt_campus_idx").on(t.promptId, t.institutionId, t.choice),
    index("play_tot_votes_campus_week_idx").on(t.institutionId, t.weekKey),
    index("play_tot_votes_voter_idx").on(t.voterId, t.createdAt),
  ]
);

/** Reports on DP entries and memes. target_type: DP_ENTRY | MEME */
export const playReports = pgTable(
  "play_reports",
  {
    id: id(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    createdAt,
  },
  (t) => [
    uniqueIndex("play_reports_target_reporter_idx").on(t.targetType, t.targetId, t.reporterId),
    index("play_reports_created_idx").on(t.createdAt),
  ]
);

/**
 * Badges. context is "" for one-time badges and the week key for weekly ones,
 * so the unique index makes every award (and its Loop Points) happen once.
 */
export const playAchievements = pgTable(
  "play_achievements",
  {
    id: id(),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    achievementKey: text("achievement_key").notNull(),
    context: text("context").default("").notNull(),
    pointsAwarded: integer("points_awarded").default(0).notNull(),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("play_achievements_unique_idx").on(t.profileId, t.achievementKey, t.context),
    index("play_achievements_profile_idx").on(t.profileId, t.awardedAt),
  ]
);

export type PlayDpEntry = typeof playDpEntries.$inferSelect;
export type PlayMeme = typeof playMemes.$inferSelect;
export type PlayTriviaQuestion = typeof playTriviaQuestions.$inferSelect;
export type PlayTriviaRun = typeof playTriviaRuns.$inferSelect;
export type PlayTotPrompt = typeof playTotPrompts.$inferSelect;
export type PlayAchievement = typeof playAchievements.$inferSelect;
