import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { secretCrushes, userProfiles } from "@/db/schema";
import { CRUSH_HINT_COST_LP, CRUSH_HINT_INVITES } from "@/lib/growth/constants";
import {
  getGrowthPrefs,
  isMissingTable,
  markCrushHintsUnlocked,
  refundPoints,
  spendPoints,
} from "@/lib/growth/engagement-prefs";
import { formatBranchShort } from "@/lib/recommendations/recommended-users";
import { requireProfile } from "@/lib/require-profile";
import { requireCapability } from "@/lib/trust-server";

export const dynamic = "force-dynamic";

interface Hint {
  year: number | null;
  branch: string | null;
}

async function loadState(profileId: string) {
  const db = getDb();
  const [prefs, fresh, received] = await Promise.all([
    getGrowthPrefs(profileId),
    db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, profileId),
      columns: { points: true, referralCount: true },
    }),
    db
      .select({ year: userProfiles.year, branch: userProfiles.branch })
      .from(secretCrushes)
      .innerJoin(userProfiles, eq(userProfiles.id, secretCrushes.senderId))
      .where(and(eq(secretCrushes.targetId, profileId), eq(secretCrushes.isMutual, false))),
  ]);

  const invites = fresh?.referralCount ?? 0;
  const unlockedByInvites = invites >= CRUSH_HINT_INVITES;
  const unlocked = unlockedByInvites || prefs.crushHintsUnlocked;

  // Shuffled, so the order never says who added you first.
  const hints: Hint[] = received
    .map((r) => ({ year: r.year ?? null, branch: r.branch ? formatBranchShort(r.branch) : null, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map(({ year, branch }) => ({ year, branch }));

  return {
    received: received.length,
    unlocked,
    unlockedVia: unlockedByInvites ? "invites" : prefs.crushHintsUnlocked ? "points" : null,
    invites,
    invitesNeeded: CRUSH_HINT_INVITES,
    cost: CRUSH_HINT_COST_LP,
    points: fresh?.points ?? 0,
    hints: unlocked ? hints : [],
  };
}

/**
 * Secret Crush hints. The count of students who added you is always real and
 * always shown. Their year and branch (never a name) unlock with 3 accepted
 * invites, or once for 200 Loop Points.
 */
export async function GET() {
  const auth = await requireProfile();
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json(await loadState(auth.profile.id));
  } catch (error) {
    console.error("GET /api/dating/crush/hints failed:", error);
    return NextResponse.json({ error: "Couldn't load hints." }, { status: 500 });
  }
}

/** Unlock hints with Loop Points. */
export async function POST() {
  const auth = await requireProfile();
  if (!auth.ok) return auth.response;
  const capabilityBlocked = await requireCapability(auth.profile, "secret_crush");
  if (capabilityBlocked) return capabilityBlocked;
  const profileId = auth.profile.id;

  const state = await loadState(profileId);
  if (state.unlocked) return NextResponse.json(state);

  const spent = await spendPoints(profileId, CRUSH_HINT_COST_LP);
  if (!spent.ok) {
    return NextResponse.json(
      { error: `Hints cost ${CRUSH_HINT_COST_LP} Loop Points, or invite ${CRUSH_HINT_INVITES} friends.` },
      { status: 400 }
    );
  }
  try {
    await markCrushHintsUnlocked(profileId);
  } catch (error) {
    await refundPoints(profileId, CRUSH_HINT_COST_LP);
    if (isMissingTable(error)) {
      return NextResponse.json({ error: "Hints aren't available yet. Your points were not used." }, { status: 503 });
    }
    console.error("POST /api/dating/crush/hints failed:", error);
    return NextResponse.json({ error: "Couldn't unlock hints. Your points were not used." }, { status: 500 });
  }
  return NextResponse.json(await loadState(profileId));
}
