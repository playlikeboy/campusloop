/**
 * Pure rules for the re-engagement cron: when each reminder may go out, and
 * whether a student can get one more push today. No database imports, so the
 * rules are unit-tested directly.
 */
import { PUSH_DAILY_CAP, QUIET_HOURS_END, QUIET_HOURS_START } from "@/lib/growth/constants";

export type EngagementKind = "STREAK_AT_RISK" | "DAILY_DIGEST" | "WINBACK_3D" | "WINBACK_7D";

const IST_OFFSET_MIN = 5 * 60 + 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Minutes since IST midnight, 0 to 1439. */
export function istMinuteOfDay(now: Date): number {
  const minutes = Math.floor(now.getTime() / 60_000) + IST_OFFSET_MIN;
  return ((minutes % 1440) + 1440) % 1440;
}

/** YYYY-MM-DD of the IST day containing `now`. */
export function istDate(now: Date): string {
  return new Date(now.getTime() + IST_OFFSET_MIN * 60_000).toISOString().slice(0, 10);
}

/** The instant IST midnight started the day containing `now`. */
export function istDayStart(now: Date): Date {
  const shifted = now.getTime() + IST_OFFSET_MIN * 60_000;
  return new Date(Math.floor(shifted / DAY_MS) * DAY_MS - IST_OFFSET_MIN * 60_000);
}

export function isQuietHours(now: Date): boolean {
  const hour = Math.floor(istMinuteOfDay(now) / 60);
  return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
}

/** IST windows, as [startMinute, endMinute). The cron runs every 30 minutes, so each window spans several runs. */
export const KIND_WINDOWS: Record<EngagementKind, [number, number]> = {
  // 20:30 to 23:00: late enough that the day is nearly gone, before quiet hours.
  STREAK_AT_RISK: [20 * 60 + 30, 23 * 60],
  // 18:00 to 20:00: the evening campus digest.
  DAILY_DIGEST: [18 * 60, 20 * 60],
  // Win-backs go out in the late morning.
  WINBACK_3D: [11 * 60, 13 * 60],
  WINBACK_7D: [11 * 60, 13 * 60],
};

/** Kinds whose window is open right now, outside quiet hours. */
export function kindsDueAt(now: Date): EngagementKind[] {
  if (isQuietHours(now)) return [];
  const minute = istMinuteOfDay(now);
  return (Object.keys(KIND_WINDOWS) as EngagementKind[]).filter((kind) => {
    const [start, end] = KIND_WINDOWS[kind];
    return minute >= start && minute < end;
  });
}

/** True while the student may get one more push today. */
export function underDailyCap(pushesToday: number): boolean {
  return pushesToday < PUSH_DAILY_CAP;
}

/** Which win-back applies, from how long ago the student was last seen. */
export function winbackKind(lastSeenAt: Date | null, now: Date): EngagementKind | null {
  if (!lastSeenAt) return null;
  const days = (now.getTime() - lastSeenAt.getTime()) / DAY_MS;
  if (days >= 3 && days < 4) return "WINBACK_3D";
  if (days >= 7 && days < 8) return "WINBACK_7D";
  return null;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Push text. Every number is a real count passed in by the caller; a zero
 * count means there is nothing true to say, so the caller skips the send.
 */
export function engagementCopy(
  kind: EngagementKind,
  data: { streak?: number; campus?: string; count?: number }
): { title: string; body: string; url: string } | null {
  const campus = data.campus || "your college";
  switch (kind) {
    case "STREAK_AT_RISK":
      if (!data.streak || data.streak < 1) return null;
      return {
        title: `Your ${plural(data.streak, "day", "day")} streak ends at midnight`,
        body: "One post, vote or comment keeps it going.",
        url: "/streaks",
      };
    case "DAILY_DIGEST":
      if (!data.count || data.count < 1) return null;
      return {
        title: `${plural(data.count, "new confession", "new confessions")} at ${campus}`,
        body: "Posted today. Your name is never shown if you reply anonymously.",
        url: "/confessions?scope=CAMPUS",
      };
    case "WINBACK_3D":
    case "WINBACK_7D":
      if (!data.count || data.count < 1) return null;
      return {
        title: `${plural(data.count, "new post", "new posts")} at ${campus}`,
        body: "Posted since you were last here.",
        url: "/feeds?scope=CAMPUS",
      };
  }
}
