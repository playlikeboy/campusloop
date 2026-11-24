/**
 * Play section: games, badges and fallback content. Client-safe (no DB imports).
 */

export const PLAY_ROUTES = {
  hub: "/play",
  dp: "/play/dp-battle",
  memes: "/play/meme-war",
  trivia: "/play/trivia",
  tot: "/play/this-or-that",
  branches: "/play/branch-wars",
  achievements: "/play/achievements",
} as const;

export type PlayGameId = "dp" | "memes" | "trivia" | "tot" | "branches";

/** Weekly campus ranking thresholds so a badge always means something. */
export const PLAY_THRESHOLDS = {
  /** Qualified DP entries (5+ battles) needed before a top 10 badge is given. */
  DP_TOP10_MIN_FIELD: 10,
  /** Qualified DP entries needed before "DP of the week" is given. */
  DP_CHAMPION_MIN_FIELD: 5,
  /** Memes in the week and upvotes on the winner before "Meme War winner" is given. */
  MEME_WIN_MIN_FIELD: 3,
  MEME_WIN_MIN_UPVOTES: 3,
  /** Reports that hide a DP entry or meme. */
  AUTO_HIDE_REPORTS: 3,
} as const;

export type AchievementIcon =
  | "swords"
  | "trophy"
  | "crown"
  | "medal"
  | "laugh"
  | "image"
  | "brain"
  | "target"
  | "flame"
  | "split"
  | "users";

export interface AchievementDef {
  key: string;
  title: string;
  /** What you did, in one short line. */
  description: string;
  icon: AchievementIcon;
  /** Loop Points paid once per award. */
  lp: number;
  /** Weekly badges can be won again every week. */
  weekly?: boolean;
  game: PlayGameId;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "dp_enter", title: "In the arena", description: "Entered the DP Battle", icon: "swords", lp: 5, game: "dp" },
  { key: "dp_first_win", title: "First win", description: "Your DP won its first battle", icon: "medal", lp: 10, game: "dp" },
  { key: "dp_wins_25", title: "25 wins", description: "Your DP won 25 battles", icon: "trophy", lp: 25, game: "dp" },
  { key: "dp_top10", title: "Top 10 DP", description: "Finished a week in your campus top 10", icon: "trophy", lp: 30, weekly: true, game: "dp" },
  { key: "dp_champion", title: "DP of the week", description: "Finished a week at number 1 on campus", icon: "crown", lp: 75, weekly: true, game: "dp" },
  { key: "meme_first", title: "Meme maker", description: "Posted your first meme", icon: "image", lp: 5, game: "memes" },
  { key: "meme_winner", title: "Meme War winner", description: "Had the top meme on campus for a week", icon: "laugh", lp: 75, weekly: true, game: "memes" },
  { key: "trivia_first", title: "Quiz starter", description: "Finished your first daily quiz", icon: "brain", lp: 5, game: "trivia" },
  { key: "trivia_perfect", title: "Full marks", description: "Got every question right in a daily quiz", icon: "target", lp: 15, game: "trivia" },
  { key: "trivia_streak_5", title: "5-day quiz streak", description: "Played the daily quiz 5 days in a row", icon: "flame", lp: 25, game: "trivia" },
  { key: "trivia_streak_15", title: "15-day quiz streak", description: "Played the daily quiz 15 days in a row", icon: "flame", lp: 60, game: "trivia" },
  { key: "tot_25", title: "Picked a side", description: "Answered 25 This or That polls", icon: "split", lp: 10, game: "tot" },
  { key: "tot_100", title: "Opinion machine", description: "Answered 100 This or That polls", icon: "split", lp: 25, game: "tot" },
  { key: "branch_champs", title: "Branch champions", description: "Your branch won Branch Wars and you scored for it", icon: "users", lp: 30, weekly: true, game: "branches" },
];

export const ACHIEVEMENTS_BY_KEY: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.key, a])
);

/** Used when no theme row exists for the week. Picked by week number. */
export const MEME_THEME_FALLBACKS: Array<{ title: string; description: string }> = [
  { title: "When the professor says this won't come in the exam", description: "The meme every student feels when the syllabus quietly grows." },
  { title: "Hostel mess on a Sunday", description: "What really lands on your plate." },
  { title: "Me at attendance vs me in the lecture", description: "Present sir. Mentally absent." },
  { title: "The group project experience", description: "One person works, four people add their names." },
  { title: "The night before the exam", description: "Five units, one night, zero regrets." },
  { title: "Placement season be like", description: "Resume edits at 3 AM and LinkedIn humble brags." },
  { title: "When the hostel WiFi goes down", description: "The whole floor in the corridor holding phones up." },
  { title: "Canteen queue at 1 PM", description: "Everyone has a class in 10 minutes." },
  { title: "Seniors giving advice", description: "Bhai, first year is the best year." },
  { title: "Monday 8 AM lecture", description: "Attendance is the only reason anyone is here." },
];

export const PLAY_REPORT_REASONS = [
  { value: "NOT_THEIR_PHOTO", label: "Not their own photo" },
  { value: "INAPPROPRIATE", label: "Nudity or sexual content" },
  { value: "HATE_OR_BULLYING", label: "Hate, bullying or mocking someone" },
  { value: "SPAM", label: "Spam or ads" },
  { value: "OTHER", label: "Something else" },
] as const;

export type PlayReportReason = (typeof PLAY_REPORT_REASONS)[number]["value"];

export const TRIVIA_CATEGORY_LABELS: Record<string, string> = {
  TECH: "Tech",
  GK: "General knowledge",
  CAMPUS: "Campus life",
  PLACEMENTS: "Placements",
};
