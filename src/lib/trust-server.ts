import "server-only";

import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { platformSettings, posts } from "@/db/schema";
import { MEMBER_HOURLY_LIMITS } from "@/lib/rate-limits";
import { getRedis } from "@/lib/redis";
import {
  allowedCapabilities,
  type Capability,
  type ClientTrust,
  canUse,
  MEMBER_ACCESS_SETTING_KEY,
  type MemberAccessSettings,
  normalizeMemberAccess,
  parseMemberAccess,
  resolveTrustTier,
  type TrustSubject,
  verifyToUnlockBody,
} from "@/lib/trust";
import { getViewerInstitutionId } from "@/lib/viewer";

/**
 * Server half of src/lib/trust.ts: the admin-controlled member access settings
 * (cached for 60s per isolate so write APIs don't read the database on every
 * request) and the guards every write API and server action calls.
 */

const SETTINGS_TTL_MS = 60_000;

const globalForTrust = globalThis as typeof globalThis & {
  campusloopMemberAccess?: { value: MemberAccessSettings; expires: number };
};

export async function getMemberAccess(): Promise<MemberAccessSettings> {
  const hit = globalForTrust.campusloopMemberAccess;
  if (hit && hit.expires > Date.now()) return hit.value;

  let value: MemberAccessSettings;
  try {
    const row = await getDb().query.platformSettings.findFirst({
      where: eq(platformSettings.key, MEMBER_ACCESS_SETTING_KEY),
    });
    value = parseMemberAccess(row?.value);
  } catch (error) {
    // A database hiccup must not lock everyone out or open everything up:
    // keep the last known value if there is one, else the defaults.
    console.error("[trust] Failed to load member access settings:", error);
    value = hit?.value ?? parseMemberAccess(null);
  }
  globalForTrust.campusloopMemberAccess = { value, expires: Date.now() + SETTINGS_TTL_MS };
  return value;
}

export async function saveMemberAccess(input: unknown): Promise<MemberAccessSettings> {
  const value = normalizeMemberAccess(input);
  const json = JSON.stringify(value);
  await getDb()
    .insert(platformSettings)
    .values({ key: MEMBER_ACCESS_SETTING_KEY, value: json, updatedAt: new Date() })
    .onConflictDoUpdate({ target: platformSettings.key, set: { value: json, updatedAt: new Date() } });
  // This isolate sees the change at once; others within SETTINGS_TTL_MS.
  globalForTrust.campusloopMemberAccess = { value, expires: Date.now() + SETTINGS_TTL_MS };
  return value;
}

/** Test hook. */
export function clearMemberAccessCache() {
  globalForTrust.campusloopMemberAccess = undefined;
}

export interface CapabilityProfile extends TrustSubject {
  id: string;
}

export type CapabilityCheck =
  | { ok: true }
  | { ok: false; status: 403 | 429; error: string; code: string; capability: Capability };

// --- Per-member hourly budgets ---------------------------------------------

const memoryCounters = new Map<string, { n: number; expires: number }>();

async function consumeMemberBudget(profileId: string, capability: Capability): Promise<boolean> {
  const limit = MEMBER_HOURLY_LIMITS[capability];
  if (!limit) return true;
  const bucket = Math.floor(Date.now() / 3_600_000);
  const key = `member:rl:${capability}:${profileId}:${bucket}`;

  const redis = getRedis();
  if (redis) {
    try {
      const [n] = await redis.pipeline().incr(key).expire(key, 3600, "NX").exec<[number, number]>();
      return n <= limit;
    } catch {
      // Fall through to the per-isolate counter.
    }
  }

  const now = Date.now();
  if (memoryCounters.size > 5000) {
    for (const [k, v] of memoryCounters) if (v.expires < now) memoryCounters.delete(k);
  }
  const entry = memoryCounters.get(key);
  if (!entry || entry.expires < now) {
    memoryCounters.set(key, { n: 1, expires: now + 3_600_000 });
    return true;
  }
  entry.n += 1;
  return entry.n <= limit;
}

/**
 * The one guard for writes. Verified students always pass. Unverified members
 * pass when the admin allows the capability, within their hourly budget.
 */
export async function checkCapability(
  profile: CapabilityProfile | null | undefined,
  capability: Capability,
  options: { countUsage?: boolean } = {}
): Promise<CapabilityCheck> {
  if (!profile) {
    return { ok: false, status: 403, ...verifyToUnlockBody(capability) };
  }
  if (resolveTrustTier(profile) === "verified") return { ok: true };

  const settings = await getMemberAccess();
  if (!canUse(profile, capability, settings)) {
    return { ok: false, status: 403, ...verifyToUnlockBody(capability) };
  }

  if (settings.strictRateLimits && options.countUsage !== false) {
    const within = await consumeMemberBudget(profile.id, capability);
    if (!within) {
      return {
        ok: false,
        status: 429,
        error: `You've hit the hourly limit for unverified accounts. Verify your student status to lift it, or try again later.`,
        code: "MEMBER_RATE_LIMIT",
        capability,
      };
    }
  }
  return { ok: true };
}

/** API route form: returns a JSON error response, or null to carry on. */
export async function requireCapability(
  profile: CapabilityProfile | null | undefined,
  capability: Capability,
  options?: { countUsage?: boolean }
): Promise<NextResponse | null> {
  const check = await checkCapability(profile, capability, options);
  if (check.ok) return null;
  const { status, ...body } = check;
  return NextResponse.json(body, { status });
}

/** Server action form: throws an Error whose message the UI can show. */
export async function assertCapability(
  profile: CapabilityProfile | null | undefined,
  capability: Capability
): Promise<void> {
  const check = await checkCapability(profile, capability);
  if (!check.ok) throw new Error(check.error);
}

/**
 * Should this post wait in the admin review queue? A member's first
 * `reviewFirstPosts` named posts are held. Anonymous posts are not counted
 * because they carry no author id.
 */
export async function shouldHoldMemberPost(profile: CapabilityProfile): Promise<boolean> {
  if (resolveTrustTier(profile) === "verified") return false;
  const settings = await getMemberAccess();
  if (settings.reviewFirstPosts <= 0) return false;
  try {
    const [row] = await getDb()
      .select({ n: count() })
      .from(posts)
      .where(eq(posts.authorId, profile.id));
    return Number(row?.n ?? 0) < settings.reviewFirstPosts;
  } catch {
    return false;
  }
}

// --- Client shell -----------------------------------------------------------

export async function getClientTrust(
  profile: (CapabilityProfile & { institutionId: string | null; verificationMethod?: string | null }) | null | undefined
): Promise<ClientTrust | undefined> {
  if (!profile) return undefined;
  const settings = await getMemberAccess();
  let inViewerHub = false;
  try {
    inViewerHub = Boolean(profile.institutionId) && profile.institutionId === (await getViewerInstitutionId());
  } catch {
    inViewerHub = false;
  }
  const allowed = allowedCapabilities(profile, settings);
  return {
    tier: resolveTrustTier(profile),
    verificationMethod: profile.verificationMethod ?? null,
    inViewerHub,
    allowed,
  };
}
