/**
 * Date labels in India time that come out the same on the server and in the
 * browser. `toLocaleDateString("en-IN")` depends on the runtime's time zone
 * (UTC on Cloudflare Workers) and ICU version (comma placement differs), so a
 * server-rendered label can differ from the one the browser renders and break
 * hydration. These helpers pin the zone to Asia/Kolkata and assemble the
 * string themselves.
 */

const TZ = "Asia/Kolkata";

type Parts = Partial<Record<Intl.DateTimeFormatPartTypes, string>>;

function parts(date: Date, options: Intl.DateTimeFormatOptions): Parts {
  const out: Parts = {};
  for (const p of new Intl.DateTimeFormat("en-IN", { timeZone: TZ, ...options }).formatToParts(date)) {
    out[p.type] = p.value;
  }
  return out;
}

function valid(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Year in India time. */
export function istYear(value: Date | string | number): number {
  const d = valid(value);
  return d ? Number(parts(d, { year: "numeric" }).year) : Number.NaN;
}

/**
 * "Wed, 10 Feb", "Wednesday, 10 February 2027", "10 Feb 2027" ...
 * Returns null for a missing or invalid date.
 */
export function istDate(
  value: Date | string | number | null | undefined,
  {
    weekday,
    month = "short",
    year = false,
  }: { weekday?: "short" | "long"; month?: "short" | "long"; year?: boolean } = {}
): string | null {
  const d = valid(value);
  if (!d) return null;
  const p = parts(d, {
    weekday,
    day: "numeric",
    month,
    year: year ? "numeric" : undefined,
  });
  const core = `${p.day} ${p.month}${year ? ` ${p.year}` : ""}`;
  return weekday ? `${p.weekday}, ${core}` : core;
}

/** "4:30 pm" in India time. Returns null for a missing or invalid date. */
export function istTime(value: Date | string | number | null | undefined): string | null {
  const d = valid(value);
  if (!d) return null;
  const p = parts(d, { hour: "numeric", minute: "2-digit", hour12: true });
  return `${p.hour}:${p.minute} ${(p.dayPeriod ?? "").toLowerCase()}`.trim();
}
