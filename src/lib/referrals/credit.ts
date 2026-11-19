import { eq, sql } from "drizzle-orm";
import { LP_ACTION_REWARDS } from "@/constants/gamification";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { awardPoints } from "@/lib/gamification-server";
import { invalidateProfileCache } from "@/lib/server-cache";

/**
 * Credits an inviter for one verified student who joined through their link:
 * one more invite on their count and the referral Loop Points, plus the same
 * Loop Points for the invited student.
 * The caller decides eligibility (see `canCreditInvite`).
 */
export async function creditInviter(inviterProfileId: string, invitedProfileId?: string) {
  const db = getDb();
  const [inviter] = await db
    .update(userProfiles)
    .set({ referralCount: sql`${userProfiles.referralCount} + 1` })
    .where(eq(userProfiles.id, inviterProfileId))
    .returning({ userId: userProfiles.userId });

  // An invite is a rare, deliberate event: it is not subject to the per-action
  // cooldown or the daily caps that guard likes and comments.
  await awardPoints(inviterProfileId, LP_ACTION_REWARDS.REFERRAL_SIGNUP, "REFERRAL_SIGNUP", {
    actorId: invitedProfileId,
    referenceId: invitedProfileId,
    bypassCaps: true,
  });
  if (inviter?.userId) invalidateProfileCache(inviter.userId);

  // The friend who joined gets the same reward, so both sides of an invite win.
  if (invitedProfileId) {
    await awardPoints(invitedProfileId, LP_ACTION_REWARDS.REFERRAL_WELCOME, "REFERRAL_WELCOME", {
      referenceId: inviterProfileId,
      bypassCaps: true,
    });
  }
}
