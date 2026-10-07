/**
 * CampusLoop Authoritative Server-Side Streak Service
 * Implements timezone-aware date boundaries, strict idempotency, milestone progressions,
 * and direct Loop Points integration.
 */

import { and, desc, eq, gte, sql } from "drizzle-orm";
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
    // Lazy-create initial row
    const [created] = await db
      .insert(userStreaks)
      .values({
        userId: profileId,
        currentStreak: 0,
        longestStreak: 0,
        totalQualifiedDays: 0,
        lastQualifiedDate: null,
      })
      .returning();
    streakRow = created;
  }

  // 2. Check streak freshness
  const lastDate = streakRow.lastQualifiedDate;
  const isSafeToday = lastDate === todayStr;
  let activeStreak = streakRow.currentStreak;

  // If student missed yesterday and hasn't qualified today, the active streak decays to 0
  if (lastDate && lastDate < yesterdayStr && !isSafeToday) {
    activeStreak = 0;
  }

  // 3. Fetch past 35 days events to construct weekly tracker and monthly calendar
  const past35Days = getRecentCalendarDays(35, todayStr);
  const earliest35Date = past35Days[0];

  const recentEvents = await db.query.streakEvents.findMany({
    where: and(eq(streakEvents.userId, profileId), gte(streakEvents.localDate, earliest35Date)),
    columns: { localDate: true },
  });

  const completedDates = new Set(recentEvents.map((e) => e.localDate));

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
  const unlockedMilestones = STREAK_MILESTONES.filter(
    (m) => m.days <= (streakRow?.longestStreak || 0)
  );

  return {
    currentStreak: activeStreak,
    longestStreak: streakRow.longestStreak,
    totalQualifiedDays: streakRow.totalQualifiedDays,
    isSafeToday,
    lastQualifiedDate: lastDate,
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
  let streakRow = await db.query.userStreaks.findFirst({
    where: eq(userStreaks.userId, userId),
  });

  const now = new Date();
  let newCurrentStreak = 1;
  let newLongestStreak = 1;
  let newTotalDays = 1;

  if (streakRow) {
    const wasYesterday = streakRow.lastQualifiedDate === yesterdayStr;
    newCurrentStreak = wasYesterday ? streakRow.currentStreak + 1 : 1;
    newLongestStreak = Math.max(streakRow.longestStreak, newCurrentStreak);
    newTotalDays = streakRow.totalQualifiedDays + 1;

    await db
      .update(userStreaks)
      .set({
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        totalQualifiedDays: newTotalDays,
        lastQualifiedDate: todayStr,
        streakStartedAt: wasYesterday ? streakRow.streakStartedAt : now,
        longestStreakStartedAt:
          newCurrentStreak > streakRow.longestStreak ? now : streakRow.longestStreakStartedAt,
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
          userId: profile.userId,
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
