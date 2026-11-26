import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/seo/constants";

/**
 * Signed, login-free unsubscribe tokens for marketing email.
 *
 * Token: base64url(profileId) "." base64url(HMAC-SHA256(secret, "v1:" + profileId)).
 * No expiry on purpose: an unsubscribe link in an old email must keep working.
 * The secret is EMAIL_UNSUBSCRIBE_SECRET, falling back to CRON_SECRET (with a
 * domain-separation prefix so the two uses can never collide).
 */

const PREFIX = "campusloop:email-unsubscribe:v1:";

function secret(): string | null {
  const value = process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.CRON_SECRET;
  return value && value.length >= 16 ? value : null;
}

function mac(profileId: string, key: string): Buffer {
  return createHmac("sha256", key).update(`${PREFIX}${profileId}`).digest();
}

export function signUnsubscribeToken(profileId: string, key: string | null = secret()): string {
  if (!key) throw new Error("EMAIL_UNSUBSCRIBE_SECRET (or CRON_SECRET) is not configured");
  if (!profileId) throw new Error("profileId is required");
  return `${Buffer.from(profileId, "utf8").toString("base64url")}.${mac(profileId, key).toString("base64url")}`;
}

/** Returns the profile id for a valid token, otherwise null. Constant-time comparison. */
export function verifyUnsubscribeToken(token: string | null | undefined, key: string | null = secret()): string | null {
  if (!key || typeof token !== "string" || token.length > 512) return null;
  const [idPart, sigPart, extra] = token.split(".");
  if (!idPart || !sigPart || extra !== undefined) return null;
  let profileId: string;
  let given: Buffer;
  try {
    profileId = Buffer.from(idPart, "base64url").toString("utf8");
    given = Buffer.from(sigPart, "base64url");
  } catch {
    return null;
  }
  if (!profileId || profileId.length > 128 || !/^[\w-]+$/.test(profileId)) return null;
  const expected = mac(profileId, key);
  if (given.length !== expected.length) return null;
  return timingSafeEqual(given, expected) ? profileId : null;
}

export function unsubscribePageUrl(token: string): string {
  return `${SITE_URL}/unsubscribe?t=${encodeURIComponent(token)}`;
}

/** RFC 8058 one-click endpoint (POST). */
export function unsubscribeOneClickUrl(token: string): string {
  return `${SITE_URL}/api/email/unsubscribe?t=${encodeURIComponent(token)}`;
}

/** Headers Cloudflare Email Service allows for list management (HTTPS only). */
export function listUnsubscribeHeaders(token: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeOneClickUrl(token)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
