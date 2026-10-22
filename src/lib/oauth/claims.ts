import { ISSUER } from "./config";
import { hmacSha256 } from "./crypto";

/**
 * Pairwise subject (OIDC Core 8.1): a different stable `sub` per app, so two
 * apps cannot correlate the same student. Ecosystem apps share the sector
 * "campusloop" and therefore see the same `sub`.
 */
export async function pairwiseSub(profileId: string, client: { id: string; sector: string | null }): Promise<string> {
  const salt = process.env.OIDC_PAIRWISE_SALT;
  if (!salt && process.env.NODE_ENV === "production") throw new Error("OIDC_PAIRWISE_SALT is not configured");
  return hmacSha256(salt ?? "dev-pairwise-salt", `${client.sector ?? client.id}:${profileId}`);
}

export interface ClaimProfile {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  branch: string | null;
  course: string | null;
  year: number | string | null;
  studentVerified: boolean;
  institution: { id: string; name: string; slug: string; state: string | null } | null;
}

/** Claims released for the granted scopes only. */
export function claimsFor(p: ClaimProfile, scopes: string[]): Record<string, unknown> {
  const c: Record<string, unknown> = {};
  if (scopes.includes("profile")) {
    c.name = p.displayName;
    c.preferred_username = p.username;
    if (p.avatarUrl) c.picture = p.avatarUrl;
    c.profile = `${ISSUER}/${p.username}`;
  }
  if (scopes.includes("student")) {
    c.student_verified = p.studentVerified;
    if (p.studentVerified) c.verification_method = "college_email";
  }
  if (scopes.includes("college") && p.institution) {
    c.college = { id: p.institution.id, name: p.institution.name, slug: p.institution.slug, state: p.institution.state };
  }
  if (scopes.includes("academic")) {
    if (p.branch) c.branch = p.branch;
    if (p.course) c.degree = p.course;
    if (p.year) c.year = Number(p.year) || p.year;
  }
  // email_verified is omitted on purpose: we do not record proof of ownership for every sign-in method.
  if (scopes.includes("email") && p.email) c.email = p.email;
  return c;
}
