/**
 * Play weeks and days, always in India time (Asia/Kolkata). A week runs
 * Monday 00:00 to Sunday 23:59 IST and is keyed by its ISO week, e.g. "2026-W47".
 * The same key is produced in SQL by to_char(date, 'IYYY"-W"IW').
 * Pure: safe for client and server.
 */

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD for the IST calendar day containing `date`. */
export function istDateString(date: Date = new Date()): string {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function utcDayFromDateString(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** ISO week key ("2026-W05") of a YYYY-MM-DD calendar day. */
export function weekKeyOfDay(day: string): string {
  const d = utcDayFromDateString(day);
  const weekday = d.getUTCDay() || 7; // Monday = 1 ... Sunday = 7
  // The Thursday of this week decides the ISO year.
  d.setUTCDate(d.getUTCDate() + 4 - weekday);
  const isoYear = d.getUTCFullYear();
  const jan1 = Date.UTC(isoYear, 0, 1);
  const week = Math.ceil(((d.getTime() - jan1) / DAY_MS + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/** Week key of the IST week containing `date`. */
export function weekKey(date: Date = new Date()): string {
  return weekKeyOfDay(istDateString(date));
}

/** The Monday (YYYY-MM-DD) that starts the IST week containing `date`. */
export function weekStartDay(date: Date = new Date()): string {
  const d = utcDayFromDateString(istDateString(date));
  const weekday = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (weekday - 1));
  return d.toISOString().slice(0, 10);
}

/** Week key of the week before the one containing `date`. */
export function previousWeekKey(date: Date = new Date()): string {
  return weekKey(new Date(date.getTime() - 7 * DAY_MS));
}

/** Epoch ms of the next Monday 00:00 IST, when the current week closes. */
export function weekEndsAt(date: Date = new Date()): number {
  const monday = utcDayFromDateString(weekStartDay(date)).getTime();
  return monday + 7 * DAY_MS - IST_OFFSET_MS;
}

/** Epoch ms of the next midnight IST, when today's quiz closes. */
export function dayEndsAt(date: Date = new Date()): number {
  return utcDayFromDateString(istDateString(date)).getTime() + DAY_MS - IST_OFFSET_MS;
}

/** YYYY-MM-DD of the day before `day`. */
export function previousDay(day: string): string {
  const d = utcDayFromDateString(day);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
