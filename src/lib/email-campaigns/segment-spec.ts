/**
 * The audience spec for Admin -> Emails, with no database imports so the
 * admin client can use it too. SQL lives in ./segments.ts.
 */
export interface SegmentSpec {
  verification: "all" | "verified" | "unverified";
  institutionIds: string[];
  years: number[];
  branches: string[];
  onboarding: "any" | "finished" | "not_finished";
  /** Not seen for at least N days. */
  inactiveDays: number | null;
  /** Signed up in the last N days. */
  joinedWithinDays: number | null;
  androidApp: "any" | "with" | "without";
  play: "any" | "players" | "non_players";
}

export const DEFAULT_SEGMENT: SegmentSpec = {
  verification: "all",
  institutionIds: [],
  years: [],
  branches: [],
  onboarding: "any",
  inactiveDays: null,
  joinedWithinDays: null,
  androidApp: "any",
  play: "any",
};

const MAX_LIST = 200;

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function days(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const whole = Math.floor(n);
  if (whole < 1) return null;
  return Math.min(whole, 3650);
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out = new Set<string>();
  for (const v of value) {
    if (typeof v === "string" && v.trim() && v.length <= 200) out.add(v.trim());
    if (out.size >= MAX_LIST) break;
  }
  return [...out];
}

/** Validates untrusted input (a server action argument) into a SegmentSpec. */
export function normalizeSegment(input: unknown): SegmentSpec {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const years = Array.isArray(raw.years)
    ? [...new Set(raw.years.map(Number).filter((y) => Number.isInteger(y) && y >= 1 && y <= 7))].sort()
    : [];
  return {
    verification: pick(raw.verification, ["all", "verified", "unverified"] as const, "all"),
    institutionIds: stringList(raw.institutionIds),
    years,
    branches: stringList(raw.branches),
    onboarding: pick(raw.onboarding, ["any", "finished", "not_finished"] as const, "any"),
    inactiveDays: days(raw.inactiveDays),
    joinedWithinDays: days(raw.joinedWithinDays),
    androidApp: pick(raw.androidApp, ["any", "with", "without"] as const, "any"),
    play: pick(raw.play, ["any", "players", "non_players"] as const, "any"),
  };
}

/** Plain-English summary of a segment for confirmations and the campaign log. */
export function describeSegment(spec: SegmentSpec, collegeNames: Record<string, string> = {}): string {
  const parts: string[] = [];
  if (spec.verification === "verified") parts.push("college-verified");
  if (spec.verification === "unverified") parts.push("not verified");
  if (spec.institutionIds.length > 0) {
    const names = spec.institutionIds.map((id) => collegeNames[id] ?? "a college");
    parts.push(names.length <= 3 ? `at ${names.join(", ")}` : `at ${names.length} colleges`);
  }
  if (spec.years.length > 0) parts.push(`year ${spec.years.join(", ")}`);
  if (spec.branches.length > 0) parts.push(`branch ${spec.branches.join(", ")}`);
  if (spec.onboarding === "finished") parts.push("finished onboarding");
  if (spec.onboarding === "not_finished") parts.push("onboarding not finished");
  if (spec.inactiveDays) parts.push(`inactive ${spec.inactiveDays}+ days`);
  if (spec.joinedWithinDays) parts.push(`joined in the last ${spec.joinedWithinDays} days`);
  if (spec.androidApp === "with") parts.push("has the Android app");
  if (spec.androidApp === "without") parts.push("no Android app");
  if (spec.play === "players") parts.push("played Play");
  if (spec.play === "non_players") parts.push("never played Play");
  return parts.length > 0 ? `Students ${parts.join(" · ")}` : "All students";
}
