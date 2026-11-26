import { and, eq, gte, inArray, isNotNull, isNull, lt, or, type SQL, sql } from "drizzle-orm";
import type { getDb } from "@/db";
import {
  devicePushTokens,
  emailUnsubscribes,
  institutions,
  playDpEntries,
  playDpVotes,
  playMemes,
  playMemeVotes,
  playTotVotes,
  playTriviaRuns,
  userProfiles,
} from "@/db/schema";
import { DEMO_CREDENTIALS } from "@/lib/demo-credentials";
import { isCollegeVerifiedUser } from "@/lib/user-verification";
import { type CampaignVariables, firstNameFrom } from "./render";
import type { SegmentSpec } from "./segment-spec";

export {
  DEFAULT_SEGMENT,
  describeSegment,
  normalizeSegment,
  type SegmentSpec,
} from "./segment-spec";

/**
 * Audience builder for Admin -> Emails. Every filter is combined with AND.
 *
 * Always excluded, whatever the filters say: students who unsubscribed from
 * marketing email, suspended or banned accounts, seeded demo accounts, and
 * accounts without a deliverable email address.
 *
 * Most filters run in SQL. College verification runs in JS through
 * isCollegeVerifiedUser() from src/lib/user-verification.ts, so the email
 * audience always matches the verified tick students see in the app.
 */
const PLACEHOLDER_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "localhost",
  "campusloop.space",
  "mail.campusloop.space",
]);

/** A syntactically valid, real-looking address that is not a demo or placeholder account. */
export function isDeliverableEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const value = email.trim().toLowerCase();
  if (value.length > 254 || value.length < 6) return false;
  if (!/^[^\s@<>()[\]\\,;:"]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(value)) return false;
  if (value === DEMO_CREDENTIALS.email.toLowerCase()) return false;
  const [local, domain] = value.split("@");
  if (!local || !domain) return false;
  if (PLACEHOLDER_DOMAINS.has(domain)) return false;
  if (/\.(test|invalid|local|example|localhost)$/.test(domain)) return false;
  if (/^(no-?reply|do-?not-?reply|mailer-daemon|postmaster)$/.test(local)) return false;
  return true;
}

const DAY_MS = 86_400_000;

/** Exclusions every campaign gets, in SQL. */
export function baseExclusions(): SQL[] {
  return [
    eq(userProfiles.status, "ACTIVE"),
    eq(userProfiles.isSeeded, false),
    isNotNull(userProfiles.email),
    sql`${userProfiles.email} like '%_@_%._%'`,
    sql`lower(${userProfiles.email}) <> ${DEMO_CREDENTIALS.email.toLowerCase()}`,
    sql`not exists (select 1 from ${emailUnsubscribes} where ${emailUnsubscribes.profileId} = ${userProfiles.id} or ${emailUnsubscribes.email} = lower(${userProfiles.email}))`,
  ];
}

function playedSql(): SQL {
  return sql`(
    exists (select 1 from ${playTriviaRuns} where ${playTriviaRuns.profileId} = ${userProfiles.id})
    or exists (select 1 from ${playDpEntries} where ${playDpEntries.profileId} = ${userProfiles.id})
    or exists (select 1 from ${playDpVotes} where ${playDpVotes.voterId} = ${userProfiles.id})
    or exists (select 1 from ${playMemes} where ${playMemes.profileId} = ${userProfiles.id})
    or exists (select 1 from ${playMemeVotes} where ${playMemeVotes.voterId} = ${userProfiles.id})
    or exists (select 1 from ${playTotVotes} where ${playTotVotes.voterId} = ${userProfiles.id})
  )`;
}

/** SQL conditions for a segment (base exclusions included), ANDed by the caller. */
export function buildSegmentConditions(spec: SegmentSpec, now: Date = new Date()): SQL[] {
  const conds = baseExclusions();

  if (spec.institutionIds.length > 0) conds.push(inArray(userProfiles.institutionId, spec.institutionIds));
  if (spec.years.length > 0) conds.push(inArray(userProfiles.year, spec.years));
  if (spec.branches.length > 0) {
    conds.push(inArray(sql`lower(trim(${userProfiles.branch}))`, spec.branches.map((b) => b.toLowerCase())));
  }

  if (spec.onboarding === "finished") conds.push(eq(userProfiles.onboardingCompleted, true));
  if (spec.onboarding === "not_finished") conds.push(eq(userProfiles.onboardingCompleted, false));

  if (spec.inactiveDays) {
    const cutoff = new Date(now.getTime() - spec.inactiveDays * DAY_MS);
    // Never seen counts as inactive once the account itself is older than the cutoff.
    const inactive = or(
      lt(userProfiles.lastSeenAt, cutoff),
      and(isNull(userProfiles.lastSeenAt), lt(userProfiles.createdAt, cutoff))
    );
    if (inactive) conds.push(inactive);
  }

  if (spec.joinedWithinDays) {
    conds.push(gte(userProfiles.createdAt, new Date(now.getTime() - spec.joinedWithinDays * DAY_MS)));
  }

  const hasToken = sql`exists (select 1 from ${devicePushTokens} where ${devicePushTokens.profileId} = ${userProfiles.id})`;
  if (spec.androidApp === "with") conds.push(hasToken);
  if (spec.androidApp === "without") conds.push(sql`not ${hasToken}`);

  if (spec.play === "players") conds.push(playedSql());
  if (spec.play === "non_players") conds.push(sql`not ${playedSql()}`);

  return conds;
}

export interface SegmentRow {
  id: string;
  email: string | null;
  role: "STUDENT" | "MODERATOR" | "ADMIN";
  isCollegeVerified: boolean;
  institutionId: string;
  displayName: string;
  officialName: string | null;
  username: string;
  collegeName: string | null;
}

/** Filters that run in JS on rows already narrowed by SQL. */
export function filterSegmentRows<T extends SegmentRow>(rows: T[], spec: SegmentSpec): T[] {
  return rows.filter((row) => {
    if (!isDeliverableEmail(row.email)) return false;
    if (spec.verification === "all") return true;
    const verified = isCollegeVerifiedUser(row);
    return spec.verification === "verified" ? verified : !verified;
  });
}

export function variablesForRow(row: Pick<SegmentRow, "officialName" | "displayName" | "username" | "collegeName">): CampaignVariables {
  return {
    first_name: firstNameFrom(row.officialName, row.displayName),
    college: row.collegeName,
    username: row.username,
  };
}

/** Hard ceiling on one campaign's audience; a bigger list should be split by college. */
export const MAX_CAMPAIGN_RECIPIENTS = 50_000;

export type Db = ReturnType<typeof getDb>;

/** Runs the segment: SQL filters, then the JS filters. Returns every matching recipient. */
export async function resolveSegment(db: Db, spec: SegmentSpec, now: Date = new Date()): Promise<SegmentRow[]> {
  const rows: SegmentRow[] = await db
    .select({
      id: userProfiles.id,
      email: userProfiles.email,
      role: userProfiles.role,
      isCollegeVerified: userProfiles.isCollegeVerified,
      institutionId: userProfiles.institutionId,
      displayName: userProfiles.displayName,
      officialName: userProfiles.officialName,
      username: userProfiles.username,
      collegeName: institutions.name,
    })
    .from(userProfiles)
    .leftJoin(institutions, eq(userProfiles.institutionId, institutions.id))
    .where(and(...buildSegmentConditions(spec, now)))
    .orderBy(sql`${userProfiles.createdAt} asc`)
    .limit(MAX_CAMPAIGN_RECIPIENTS + 1);

  return filterSegmentRows(rows, spec);
}
