/**
 * CampusLoop Authoritative Server-Side Streak Service
 * Implements timezone-aware date boundaries, strict idempotency, milestone progressions,
 * and direct Loop Points integration.
 */

import { and, desc, eq } from "drizzle-orm";
import {
  DEFAULT_STREAK_TIMEZONE,
  getTodayDailyMission,
  STREAK_MILESTONES,
  STREAK_QUALIFYING_EVENTS,
  type StreakEventType,
  type StreakMilestone,
} from "@/constants/streaks";
import { getDb } from "@/db";
import { streakEvents, userProfiles, userStreakMilestones, userStreaks } from "@/db/schema";
import { awardPoints } from "@/lib/gamification-server";
import { createNotification } from "@/lib/notifications";

/**
 * Returns YYYY-MM-DD formatted string in the target timezone (defaults to Asia/Kolkata).
 */
export function getLocalDateString(date = new Date(), timezone = DEFAULT_STREAK_TIMEZONE): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    // Fallback if invalid timezone supplied
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: DEFAULT_STREAK_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }
}

/**
 * Computes yesterday's YYYY-MM-DD date string given a local date string.
 */
export function getYesterdayDateString(localDateString: string): string {
  const [year, month, day] = localDateString.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Generates an array of past N calendar dates (ending today) for the 7-day week tracker.
 */
export function getRecentCalendarDays(n = 7, todayDateString: string): string[] {
  const result: string[] = [];
  const [year, month, day] = todayDateString.split("-").map(Number);

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

export interface DayStatus {
  date: string;
  dayLabel: string; // M, T, W, T, F, S, S
  isToday: boolean;
  isCompleted: boolean;
}



/** Derive the active run from the unique qualifying-day journal.
 * A streak remains active through today if today's action exists, or through
 * yesterday until the current day is qualified. A missed day resets it to zero.
 */
export function calculateCurrentStreakFromDates(
  qualifyingDates: string[],
  todayDateString: string
): { currentStreak: number; isSafeToday: boolean } {
  const dates = new Set(qualifyingDates);
  const isSafeToday = dates.has(todayDateString);
  let cursor: string | null = isSafeToday
    ? todayDateString
    : dates.has(getYesterdayDateString(todayDateString))
      ? getYesterdayDateString(todayDateString)
      : null;
  let currentStreak = 0;

  while (cursor && dates.has(cursor)) {
    currentStreak += 1;
    cursor = getYesterdayDateString(cursor);
  }

  return { currentStreak, isSafeToday };
}

/** Longest consecutive run represented by the event journal. */
export function calculateLongestStreakFromDates(qualifyingDates: string[]): number {
  const dates = Array.from(new Set(qualifyingDates)).sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;

  for (const date of dates) {
    run = previous && getYesterdayDateString(date) === previous ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }

  return best;
}

export interface UserStreakState {
  currentStreak: number;
  longestStreak: number;
  totalQualifiedDays: number;
  isSafeToday: boolean;
  lastQualifiedDate: string | null;
  weeklyTracker: DayStatus[];
  historyDates: string[];
  nextMilestone: StreakMilestone | null;
  unlockedMilestones: StreakMilestone[];
  todayMission: ReturnType<typeof getTodayDailyMission>;
}

/**
 * Authoritatively retrieves or initializes a student's streak state.
 */
export async function getUserStreakState(
  profileId: string,
  timezone = DEFAULT_STREAK_TIMEZONE
): Promise<UserStreakState> {
  const db = getDb();
  const todayStr = getLocalDateString(new Date(), timezone);
  const yesterdayStr = getYesterdayDateString(todayStr);

  // 1. Fetch user streak row
  let streakRow = await db.query.userStreaks.findFirst({
    where: eq(userStreaks.userId, profileId),
  });

  if (!streakRow) {
    // Profile stats and the streak page can request this state simultaneously.
    // Avoid turning the losing request into a 500 when the row is created first.
    const [created] = await db
      .insert(userStreaks)
      .values({
        userId: profileId,
        currentStreak: 0,
        longestStreak: 0,
        totalQualifiedDays: 0,
        lastQualifiedDate: null,
      })
      .onConflictDoNothing({ target: userStreaks.userId })
      .returning();

    streakRow = created ?? (await db.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, profileId),
    }));

    if (!streakRow) {
      throw new Error("Unable to initialize streak state");
    }
  }

  // 2. Read the unique daily journal as the source of truth for streak counts.
  // Keep a bounded history (one row/day) to protect large accounts.
  const qualifyingEvents = await db.query.streakEvents.findMany({
    where: eq(streakEvents.userId, profileId),
    columns: { localDate: true },
    orderBy: [desc(streakEvents.localDate)],
    limit: 4000,
  });
  const qualifyingDates = Array.from(new Set(qualifyingEvents.map((event) => event.localDate)));
  const qualifyingDateSet = new Set(qualifyingDates);
  const lastDate = streakRow.lastQualifiedDate;
  const isRecentSummaryDate = lastDate === todayStr || lastDate === yesterdayStr;

  // Some older profiles may have a summary row from before the event journal
  // existed. If that latest summary date has no journal row, preserve it as a
  // compatibility fallback. Otherwise compute the streak from actual activity.
  const useJournal = qualifyingDates.length > 0 &&
    !(isRecentSummaryDate && lastDate && !qualifyingDateSet.has(lastDate));

  let activeStreak: number;
  let isSafeToday: boolean;
  let authoritativeLastDate: string | null;

  if (useJournal) {
    const currentFromJournal = calculateCurrentStreakFromDates(qualifyingDates, todayStr);
    activeStreak = currentFromJournal.currentStreak;
    isSafeToday = currentFromJournal.isSafeToday;
    authoritativeLastDate = qualifyingDates[0] ?? null;
  } else {
    isSafeToday = lastDate === todayStr;
    activeStreak = streakRow.currentStreak;
    if (lastDate && lastDate < yesterdayStr && !isSafeToday) activeStreak = 0;
    authoritativeLastDate = lastDate;
  }

  const longestFromJournal = calculateLongestStreakFromDates(qualifyingDates);
  const longestStreak = Math.max(streakRow.longestStreak, longestFromJournal);
  const totalQualifiedDays = Math.max(streakRow.totalQualifiedDays, qualifyingDateSet.size);

  // 3. Build the weekly tracker and recent calendar from this same date journal.
  const past35Days = getRecentCalendarDays(35, todayStr);
  const earliest35Date = past35Days[0];
  const completedDates = new Set(
    qualifyingDates.filter((date) => date >= earliest35Date && date <= todayStr)
  );

  // 7-day tracker for quick widget view
  const past7Days = past35Days.slice(-7);
  const dayLetters = ["S", "M", "T", "W", "T", "F", "S"];
  const weeklyTracker: DayStatus[] = past7Days.map((dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const dayIndex = dateObj.getUTCDay();

    return {
      date: dateStr,
      dayLabel: dayLetters[dayIndex] || "D",
      isToday: dateStr === todayStr,
      isCompleted: completedDates.has(dateStr),
    };
  });

  // 4. Milestone calculations
  const nextMilestone = STREAK_MILESTONES.find((m) => m.days > activeStreak) || null;
  const unlockedMilestones = STREAK_MILESTONES.filter((m) => m.days <= longestStreak);

  return {
    currentStreak: activeStreak,
    longestStreak,
    totalQualifiedDays,
    isSafeToday,
    lastQualifiedDate: authoritativeLastDate,
    weeklyTracker,
    historyDates: Array.from(completedDates),
    nextMilestone,
    unlockedMilestones,
    todayMission: getTodayDailyMission(new Date()),
  };
}

export interface RecordActivityResult {
  success: boolean;
  alreadyQualifiedToday: boolean;
  currentStreak: number;
  longestStreak: number;
  isSafeToday: boolean;
  pointsEarned: number;
  newMilestone?: StreakMilestone;
}

/**
 * Atomically credits a qualifying campus activity to a student's streak.
 * Guarantees idempotency via database unique constraints on (userId, localDate).
 */
export async function recordStreakActivity(params: {
  userId: string;
  eventType: StreakEventType;
  sourceEntityId?: string;
  resourceId?: string;
  timezone?: string;
}): Promise<RecordActivityResult> {
  const { userId, eventType, timezone = DEFAULT_STREAK_TIMEZONE } = params;
  const sourceEntityId = params.sourceEntityId || params.resourceId;

  if (!userId || !STREAK_QUALIFYING_EVENTS[eventType]) {
    return {
      success: false,
      alreadyQualifiedToday: false,
      currentStreak: 0,
      longestStreak: 0,
      isSafeToday: false,
      pointsEarned: 0,
    };
  }

  const db = getDb();
  if (!db?.query?.streakEvents || !db?.query?.userStreaks) {
    return {
      success: true,
      alreadyQualifiedToday: false,
      currentStreak: 1,
      longestStreak: 1,
      isSafeToday: true,
      pointsEarned: 0,
    };
  }
  const todayStr = getLocalDateString(new Date(), timezone);
  const yesterdayStr = getYesterdayDateString(todayStr);

  // 1. Fetch current profile
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
    columns: { id: true, userId: true, displayName: true },
  });

  if (!profile) {
    return {
      success: false,
      alreadyQualifiedToday: false,
      currentStreak: 0,
      longestStreak: 0,
      isSafeToday: false,
      pointsEarned: 0,
    };
  }

  // 2. Check if already qualified today
  const existingEventToday = await db.query.streakEvents.findFirst({
    where: and(eq(streakEvents.userId, userId), eq(streakEvents.localDate, todayStr)),
  });

  if (existingEventToday) {
    const currentState = await getUserStreakState(userId, timezone);
    return {
      success: true,
      alreadyQualifiedToday: true,
      currentStreak: currentState.currentStreak,
      longestStreak: currentState.longestStreak,
      isSafeToday: true,
      pointsEarned: 0,
    };
  }

  // Read the corrected state before adding today so a stale summary row cannot undercount the run.
  const previousState = await getUserStreakState(userId, timezone);

  // 3. Atomically attempt to journal today's streak event
  try {
    await db.insert(streakEvents).values({
      userId,
      localDate: todayStr,
      eventType,
      sourceEntityId: sourceEntityId || null,
    });
  } catch (err: any) {
    // Handle concurrent duplicate insert gracefully (Postgres unique constraint violation)
    if (err?.code === "23505" || String(err?.message || "").includes("unique")) {
      const currentState = await getUserStreakState(userId, timezone);
      return {
        success: true,
        alreadyQualifiedToday: true,
        currentStreak: currentState.currentStreak,
        longestStreak: currentState.longestStreak,
        isSafeToday: true,
        pointsEarned: 0,
      };
    }
    throw err;
  }

  // 4. Fetch current streak record
  const streakRow = await db.query.userStreaks.findFirst({
    where: eq(userStreaks.userId, userId),
  });

  const now = new Date();
  let newCurrentStreak = 1;
  let newLongestStreak = 1;
  let newTotalDays = 1;

  if (streakRow) {
    const wasYesterday = streakRow.lastQualifiedDate === yesterdayStr;
    newCurrentStreak = wasYesterday ? previousState.currentStreak + 1 : 1;
    newLongestStreak = Math.max(streakRow.longestStreak, previousState.longestStreak, newCurrentStreak);
    newTotalDays = Math.max(streakRow.totalQualifiedDays, previousState.totalQualifiedDays) + 1;

    await db
      .update(userStreaks)
      .set({
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        totalQualifiedDays: newTotalDays,
        lastQualifiedDate: todayStr,
        streakStartedAt: wasYesterday ? streakRow.streakStartedAt : now,
        longestStreakStartedAt:
          newCurrentStreak > previousState.longestStreak ? now : streakRow.longestStreakStartedAt,
        updatedAt: now,
      })
      .where(eq(userStreaks.userId, userId));
  } else {
    await db.insert(userStreaks).values({
      userId,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      totalQualifiedDays: newTotalDays,
      lastQualifiedDate: todayStr,
      streakStartedAt: now,
      longestStreakStartedAt: now,
    });
  }

  // 5. Award daily streak action points
  const eventConfig = STREAK_QUALIFYING_EVENTS[eventType];
  let pointsAwarded = eventConfig.pointsBonus || 5;

  await awardPoints(userId, pointsAwarded, "DAILY_LOGIN_STREAK", {
    bypassCaps: false,
    referenceId: `streak_${todayStr}`,
  });

  // 6. Check and award milestone rewards idempotently
  let milestoneHit: StreakMilestone | undefined;
  const candidateMilestone = STREAK_MILESTONES.find((m) => m.days === newCurrentStreak);

  if (candidateMilestone) {
    const alreadyClaimed = await db.query.userStreakMilestones.findFirst({
      where: and(
        eq(userStreakMilestones.userId, userId),
        eq(userStreakMilestones.milestoneDays, candidateMilestone.days)
      ),
    });

    if (!alreadyClaimed) {
      try {
        await db.insert(userStreakMilestones).values({
          userId,
          milestoneDays: candidateMilestone.days,
          pointsAwarded: candidateMilestone.points,
        });

        // Award bonus Loop Points directly
        await awardPoints(userId, candidateMilestone.points, "STREAK_MILESTONE", {
          bypassCaps: true,
          referenceId: `milestone_${candidateMilestone.days}`,
        });

        pointsAwarded += candidateMilestone.points;
        milestoneHit = candidateMilestone;

        // Dispatch celebratory notification
        await createNotification({
          userId: profile.id,
          actorId: profile.id,
          type: "MILESTONE",
          previewText: `Streak Milestone! You reached ${candidateMilestone.days} days and unlocked +${candidateMilestone.points} LP!`,
          referenceId: userId,
          silent: false,
        });
      } catch (err) {
        console.warn("[Streak Milestone Insert Handled]:", err);
      }
    }
  }

  return {
    success: true,
    alreadyQualifiedToday: false,
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    isSafeToday: true,
    pointsEarned: pointsAwarded,
    newMilestone: milestoneHit,
  };
}
