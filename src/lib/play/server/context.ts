import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { blocks } from "@/db/schema";
import { type AuthProfile, requireProfile } from "@/lib/require-profile";
import type { Capability } from "@/lib/trust";
import { requireCapability } from "@/lib/trust-server";

export type Player = AuthProfile;

type PlayerResult = { ok: true; profile: Player } | { ok: false; response: NextResponse };

/**
 * Auth for every /api/play route: a signed-in student with a profile and an
 * active account. Writes also need the "play" capability (unverified members
 * only when /admin/access allows it); pass `capability: null` for writes every
 * student keeps, like reporting.
 */
export async function requirePlayer(
  opts: { write?: boolean; capability?: Capability | null } = {}
): Promise<PlayerResult> {
  const auth = await requireProfile();
  if (!auth.ok) return { ok: false, response: auth.response };
  const { profile } = auth;
  if (profile.status !== "ACTIVE") {
    return { ok: false, response: NextResponse.json({ error: "Your account can't play right now." }, { status: 403 }) };
  }
  const capability = opts.capability === undefined ? "play" : opts.capability;
  if (opts.write && capability) {
    const rejected = await requireCapability(profile, capability);
    if (rejected) return { ok: false, response: rejected };
  }
  return { ok: true, profile };
}

/** Everyone this student blocked or was blocked by. Their content is never paired or listed. */
export async function getBlockedIds(profileId: string): Promise<Set<string>> {
  const rows = await getDb()
    .select({ blockerId: blocks.blockerId, blockedUserId: blocks.blockedUserId })
    .from(blocks)
    .where(or(eq(blocks.blockerId, profileId), eq(blocks.blockedUserId, profileId)));
  const out = new Set<string>();
  for (const r of rows) out.add(r.blockerId === profileId ? r.blockedUserId : r.blockerId);
  return out;
}

export function badRequest(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function serverError(where: string, error: unknown) {
  console.error(`[play] ${where}:`, error);
  return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
}

/** Image URLs a student may submit: our ImgBB host or our own R2 file route. */
export function isAllowedImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 500) return false;
  return url.startsWith("https://i.ibb.co/") || /^\/api\/files\/r2\/[\w./-]+$/.test(url);
}
