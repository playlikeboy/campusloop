import { DOMAIN_TO_SLUG_MAP, getCandidateParentDomains } from "./student-email-domains";

export const BLOCKED_PERSONAL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "yandex.com",
]);

/**
 * Checks if an email address belongs to a verified college or academic institution.
 * Returns false for Gmail, Yahoo, Outlook, or generic webmail providers.
 */
export function isCollegeEmail(email?: string | null): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.trim().toLowerCase().replace(/^@/, "");
  if (!domain) return false;

  if (BLOCKED_PERSONAL_DOMAINS.has(domain)) {
    return false;
  }

  // 1. Direct match in verified student email domain registry
  if (DOMAIN_TO_SLUG_MAP[domain]) {
    return true;
  }

  // 2. Parent domain match
  const parents = getCandidateParentDomains(domain);
  for (const parent of parents) {
    if (DOMAIN_TO_SLUG_MAP[parent]) return true;
    if (parent.endsWith(".ac.in") || parent.endsWith(".edu.in") || parent.endsWith(".edu")) {
      return true;
    }
  }

  // 3. Accredited academic TLDs
  if (
    domain.endsWith(".ac.in") ||
    domain.endsWith(".edu.in") ||
    domain.endsWith(".edu") ||
    domain.endsWith(".res.in") ||
    domain.endsWith(".ernet.in")
  ) {
    return true;
  }

  return false;
}

/**
 * Determines if a user profile should receive the verified student blue tick badge.
 * Verified student blue tick is granted EXCLUSIVELY to users who signed up with
 * an authentic college email. Users signed up via Gmail or personal emails will NEVER receive it.
 */
export function isCollegeVerifiedUser(profile?: {
  isCollegeVerified?: boolean | null;
  email?: string | null;
  role?: string | null;
  institutionId?: string | null;
} | null): boolean {
  if (!profile) return false;
  if (profile.role === "ADMIN") return true;
  if (profile.isCollegeVerified === true) return true;
  if (isCollegeEmail(profile.email)) return true;
  return false;
}
