/**
 * Growth loop rules. Every number a student sees next to these comes from the
 * database; these constants only set the thresholds and prices.
 */

/** Campus confessions open once this many verified students from the college have joined. */
export const CAMPUS_UNLOCK_THRESHOLD = 25;

/** Secret Crush hints (year and branch of whoever added you) unlock with this many accepted invites... */
export const CRUSH_HINT_INVITES = 3;
/** ...or by spending this many Loop Points once. */
export const CRUSH_HINT_COST_LP = 200;

/** A streak freeze covers one missed day. */
export const STREAK_FREEZE_COST_LP = 100;
/** Most freezes a student can hold at once. */
export const STREAK_FREEZE_MAX = 2;

/** Reminder pushes per student per IST day, counting every push we sent them that day. */
export const PUSH_DAILY_CAP = 3;
/** No reminder pushes from 23:00 to 08:00 IST. */
export const QUIET_HOURS_START = 23;
export const QUIET_HOURS_END = 8;

/** Posts shown to a signed-out visitor before the sign-up card. */
export const PREVIEW_POST_COUNT = 5;

/** Posts in the onboarding taste swipe. */
export const TASTE_QUIZ_SIZE = 6;
/** After this many swipes the student may move on. */
export const TASTE_QUIZ_MIN = 4;
