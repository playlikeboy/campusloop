/**
 * Invite links: `/join?invite=<username>` (also `?ref=<username>`).
 *
 * Pure helpers shared by the `/join` route handler and onboarding. Kept free of
 * database imports so both the edge route and unit tests can use them.
 */

/** Set by `/join`. Holds the inviter's username for 7 days. */
export const INVITE_COOKIE = "cl_referred_by";
/** Set by `/s/[slug]` and the `?ref=` tracker. Used when no invite cookie exists. */
export const REF_COOKIE = "campusloop_ref";
export const INVITE_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
const PASS_THROUGH_PARAMS = ["college", "domain", "utm_source", "utm_medium", "utm_campaign", "utm_content"];

/** Normalises an invite code to a username, or null when it cannot be one. */
export function cleanInviteCode(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const code = raw.trim().toLowerCase().replace(/^@/, "");
  return USERNAME_PATTERN.test(code) ? code : null;
}

/** The inviter to credit: the explicit invite wins over a generic `?ref=` click. */
export function pickInviter(inviteCookie?: string | null, refCookie?: string | null): string | null {
  return cleanInviteCode(inviteCookie) ?? cleanInviteCode(refCookie);
}

/** Where `/join` sends the visitor, keeping the college hint, return path and UTM tags. */
export function buildJoinTarget(params: URLSearchParams): string {
  const base = params.get("mode") === "signin" ? "/sign-in" : "/sign-up";
  const out = new URLSearchParams();
  const returnTo = params.get("returnTo") || params.get("returnUrl");
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) out.set("returnTo", returnTo);
  for (const key of PASS_THROUGH_PARAMS) {
    const value = params.get(key);
    if (value) out.set(key, value.slice(0, 120));
  }
  const query = out.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * An invite is credited once, when the invited student first becomes a verified
 * student of a college, and never to the student's own account.
 */
export function canCreditInvite(input: {
  inviterUserId: string | null | undefined;
  invitedUserId: string;
  isVerifiedStudent: boolean;
  wasAlreadyOnboarded: boolean;
}): boolean {
  if (!input.inviterUserId) return false;
  if (input.inviterUserId === input.invitedUserId) return false;
  if (input.wasAlreadyOnboarded) return false;
  return input.isVerifiedStudent;
}

/** The public invite link for a username. */
export function inviteUrl(username: string, origin = "https://campusloop.space"): string {
  return `${origin}/join?invite=${encodeURIComponent(username.toLowerCase())}`;
}
