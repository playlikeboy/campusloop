import { and, count, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  devicePushTokens,
  engagementPrefs,
  events,
  engagementSends,
  institutions,
  notifications,
  posts,
  pushSubscriptions,
  streakEvents,
  userProfiles,
} from "@/db/schema";
import {
  type EngagementKind,
  engagementCopy,
  isQuietHours,
  istDate,
  istDayStart,
  kindsDueAt,
  underDailyCap,
  winbackKind,
} from "@/lib/engagement/schedule";
import { notifyEventStartingSoon } from "@/lib/event-notifications";
import { type ExpoMessage, isExpoPushToken, sendExpoMessages } from "@/lib/expo-push";
import { campusShortName } from "@/lib/growth/campus-stats";
import { isMissingTable } from "@/lib/growth/engagement-prefs";
import { pushToUser } from "@/lib/push-dispatch";
import { calculateCurrentStreakFromDates, getYesterdayDateString } from "@/lib/streaks/streak-service";

/** Most students one run looks at, to stay inside a Worker request budget. */
const MAX_RECIPIENTS = 1000;
/** A digest is noise for someone who had the app open in the last two hours. */
const RECENTLY_ACTIVE_MS = 2 * 60 * 60 * 1000;

export interface PlannedSend {
  profileId: string;
  kind: EngagementKind;
  title: string;
  body: string;
  url: string;
}

export interface EngagementRunResult {
  ok: boolean;
  dryRun: boolean;
  istDate: string;
  kinds: EngagementKind[];
  considered: number;
  planned: PlannedSend[];
  sent: number;
  skipped: Record<string, number>;
  /** Events starting within the hour whose registered students were (or in a dry run, would be) reminded. */
  eventReminders: { eventId: string; notified: number }[];
  error?: string;
}

interface Candidate {
  id: string;
  institutionId: string;
  institutionName: string;
  lastSeenAt: Date | null;
}

function bump(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

/** Students who can actually receive a push: a web subscription or an app token. */
async function pushableProfileIds(): Promise<string[]> {
  const db = getDb();
  const ids = new Set<string>();
  const web = await db.selectDistinct({ id: pushSubscriptions.userId }).from(pushSubscriptions);
  for (const row of web) ids.add(row.id);
  try {
    const app = await db.selectDistinct({ id: devicePushTokens.profileId }).from(devicePushTokens);
    for (const row of app) ids.add(row.id);
  } catch {
    // device_push_tokens (0012) not applied yet: web push only.
  }
  return Array.from(ids);
}

async function sendPush(send: PlannedSend): Promise<void> {
  const db = getDb();
  // The service worker shows the newest unread notification, so the row carries the text.
  await db.insert(notifications).values({
    userId: send.profileId,
    actorId: send.profileId,
    type: "REMINDER",
    referenceId: send.url,
    previewText: `${send.title}. ${send.body}`.slice(0, 200),
  });
  await pushToUser(send.profileId);

  try {
    const tokens = await db
      .select({ token: devicePushTokens.expoToken })
      .from(devicePushTokens)
      .where(eq(devicePushTokens.profileId, send.profileId));
    const messages: ExpoMessage[] = tokens
      .filter((t) => isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        title: send.title,
        body: send.body,
        data: { url: send.url, type: "REMINDER", referenceId: send.url },
        sound: "default",
        priority: "default",
        channelId: "default",
      }));
    const dead = await sendExpoMessages(messages);
    if (dead.length > 0) await db.delete(devicePushTokens).where(inArray(devicePushTokens.expoToken, dead));
  } catch {
    // App tokens are optional; the web push above already went out.
  }
}

/**
 * One cron tick. Picks at most one reminder per student from the kinds whose
 * IST window is open, using only real counts, then records it in
 * engagement_sends before sending so a second run the same day skips it.
 */
export async function runEngagement({
  now = new Date(),
  dryRun = false,
}: { now?: Date; dryRun?: boolean } = {}): Promise<EngagementRunResult> {
  const today = istDate(now);
  const dayStart = istDayStart(now);
  const kinds = kindsDueAt(now);
  const result: EngagementRunResult = {
    ok: true,
    dryRun,
    istDate: today,
    kinds,
    considered: 0,
    planned: [],
    sent: 0,
    skipped: {},
    eventReminders: [],
  };

  result.eventReminders = await remindUpcomingEvents(now, dryRun);
  if (kinds.length === 0) return result;

  const db = getDb();

  // Without the send log the run cannot be idempotent, so it refuses to send.
  try {
    await db.select({ id: engagementSends.id }).from(engagementSends).limit(1);
  } catch (error) {
    if (isMissingTable(error)) {
      return { ...result, ok: false, error: "engagement_sends is missing. Apply drizzle/manual/0014." };
    }
    throw error;
  }

  const pushable = await pushableProfileIds();
  if (pushable.length === 0) return result;

  const candidates: Candidate[] = [];
  for (let i = 0; i < pushable.length && candidates.length < MAX_RECIPIENTS; i += 500) {
    const rows = await db
      .select({
        id: userProfiles.id,
        institutionId: userProfiles.institutionId,
        institutionName: institutions.name,
        lastSeenAt: userProfiles.lastSeenAt,
      })
      .from(userProfiles)
      .innerJoin(institutions, eq(institutions.id, userProfiles.institutionId))
      .where(
        and(
          inArray(userProfiles.id, pushable.slice(i, i + 500)),
          eq(userProfiles.onboardingCompleted, true),
          eq(userProfiles.status, "ACTIVE"),
          eq(userProfiles.isSeeded, false)
        )
      );
    candidates.push(...rows);
  }
  const ids = candidates.slice(0, MAX_RECIPIENTS).map((c) => c.id);
  result.considered = ids.length;
  if (ids.length === 0) return result;

  // Opt-outs, reminders already sent today, and every notification today (each one buzzed the phone).
  const [optedOut, sentToday, notifiedToday] = await Promise.all([
    db
      .select({ id: engagementPrefs.profileId })
      .from(engagementPrefs)
      .where(and(inArray(engagementPrefs.profileId, ids), eq(engagementPrefs.remindersEnabled, false))),
    db
      .select({ id: engagementSends.profileId, kind: engagementSends.kind })
      .from(engagementSends)
      .where(and(inArray(engagementSends.profileId, ids), eq(engagementSends.localDate, today))),
    db
      .select({ id: notifications.userId, n: count() })
      .from(notifications)
      .where(and(inArray(notifications.userId, ids), gte(notifications.createdAt, dayStart)))
      .groupBy(notifications.userId),
  ]);

  const optOut = new Set(optedOut.map((r) => r.id));
  const alreadySent = new Set(sentToday.map((r) => `${r.id}:${r.kind}`));
  const pushesToday = new Map<string, number>();
  for (const row of notifiedToday) pushesToday.set(row.id, Number(row.n));

  // Streak at risk: active yesterday, nothing yet today. Length comes from the day journal.
  const streakLength = new Map<string, number>();
  if (kinds.includes("STREAK_AT_RISK")) {
    const since = getRecentCalendarStart(today, 400);
    const rows = await db
      .select({ id: streakEvents.userId, date: streakEvents.localDate })
      .from(streakEvents)
      .where(and(inArray(streakEvents.userId, ids), gte(streakEvents.localDate, since)));
    const byUser = new Map<string, string[]>();
    for (const row of rows) byUser.set(row.id, [...(byUser.get(row.id) ?? []), row.date]);
    const yesterday = getYesterdayDateString(today);
    for (const [id, dates] of byUser) {
      if (dates.includes(today) || !dates.includes(yesterday)) continue;
      streakLength.set(id, calculateCurrentStreakFromDates(dates, today).currentStreak);
    }
  }

  // Confessions posted today, per college.
  const confessionsToday = new Map<string, number>();
  if (kinds.includes("DAILY_DIGEST")) {
    const campusIds = Array.from(new Set(candidates.map((c) => c.institutionId)));
    const rows = await db
      .select({ id: posts.institutionId, n: count() })
      .from(posts)
      .where(
        and(
          inArray(posts.institutionId, campusIds),
          eq(posts.type, "CONFESSION"),
          eq(posts.status, "PUBLISHED"),
          eq(posts.isSeeded, false),
          gte(posts.createdAt, dayStart)
        )
      )
      .groupBy(posts.institutionId);
    for (const row of rows) confessionsToday.set(row.id, Number(row.n));
  }

  for (const c of candidates.slice(0, MAX_RECIPIENTS)) {
    if (optOut.has(c.id)) {
      bump(result.skipped, "opted_out");
      continue;
    }
    // Every reminder also writes a notification row, so this count covers both.
    if (!underDailyCap(pushesToday.get(c.id) ?? 0)) {
      bump(result.skipped, "daily_cap");
      continue;
    }

    const campus = campusShortName(c.institutionName);
    let plan: PlannedSend | null = null;
    for (const kind of kinds) {
      if (alreadySent.has(`${c.id}:${kind}`)) continue;
      let copy: ReturnType<typeof engagementCopy> = null;
      if (kind === "STREAK_AT_RISK") {
        copy = engagementCopy(kind, { streak: streakLength.get(c.id) });
      } else if (kind === "DAILY_DIGEST") {
        const recentlyActive = c.lastSeenAt && now.getTime() - c.lastSeenAt.getTime() < RECENTLY_ACTIVE_MS;
        if (!recentlyActive) copy = engagementCopy(kind, { count: confessionsToday.get(c.institutionId), campus });
      } else if (winbackKind(c.lastSeenAt, now) === kind && c.lastSeenAt) {
        const [row] = await db
          .select({ n: count() })
          .from(posts)
          .where(
            and(
              eq(posts.institutionId, c.institutionId),
              eq(posts.status, "PUBLISHED"),
              eq(posts.isSeeded, false),
              gte(posts.createdAt, c.lastSeenAt),
              lt(posts.createdAt, now),
              sql`${posts.authorId} IS DISTINCT FROM ${c.id}`
            )
          );
        copy = engagementCopy(kind, { count: Number(row?.n ?? 0), campus });
      }
      if (copy) {
        plan = { profileId: c.id, kind, ...copy };
        break;
      }
    }
    if (!plan) {
      bump(result.skipped, "nothing_to_say");
      continue;
    }

    result.planned.push(plan);
    if (dryRun) continue;

    // Claim the slot first: if another run already claimed it, nothing is sent.
    const claimed = await db
      .insert(engagementSends)
      .values({ profileId: plan.profileId, kind: plan.kind, localDate: today, body: `${plan.title}. ${plan.body}` })
      .onConflictDoNothing()
      .returning({ id: engagementSends.id });
    if (claimed.length === 0) {
      bump(result.skipped, "already_sent");
      continue;
    }
    try {
      await sendPush(plan);
      result.sent += 1;
    } catch (error) {
      console.error("[engagement] send failed:", error);
      bump(result.skipped, "send_failed");
    }
  }

  return result;
}

function getRecentCalendarStart(today: string, days: number): string {
  const [y, m, d] = today.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  start.setUTCDate(start.getUTCDate() - days);
  return start.toISOString().slice(0, 10);
}

/**
 * "Starts soon" for events beginning within the next hour, sent to students
 * registered for them. These skip the daily cap (the student asked to go), but
 * keep quiet hours unless the event starts within 30 minutes.
 * notifyEventStartingSoon is idempotent per event and student.
 */
async function remindUpcomingEvents(now: Date, dryRun: boolean): Promise<{ eventId: string; notified: number }[]> {
  try {
    const horizon = new Date(now.getTime() + (isQuietHours(now) ? 30 : 60) * 60_000);
    const upcoming = await getDb()
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.status, "PUBLISHED"), gte(events.startDate, now), lt(events.startDate, horizon)))
      .limit(50);
    const out: { eventId: string; notified: number }[] = [];
    for (const event of upcoming) {
      out.push({ eventId: event.id, notified: dryRun ? 0 : await notifyEventStartingSoon(event.id) });
    }
    return out;
  } catch (error) {
    console.error("[engagement] event reminders failed:", error);
    return [];
  }
}
