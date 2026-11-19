/**
 * Landing page copy. Every claim here must be true of the product today;
 * live counts come from getPublicStats() and are never written as literals.
 */

import { SOCIAL_LINKS as OFFICIAL_SOCIAL_LINKS } from "./social";

export const SITE_URL = "https://campusloop.space";

/** URL-only view of the official channels. The source of truth is `@/constants/social`. */
export const SOCIAL_LINKS = {
  instagram: OFFICIAL_SOCIAL_LINKS.instagram.url,
  linkedin: OFFICIAL_SOCIAL_LINKS.linkedin.url,
  x: OFFICIAL_SOCIAL_LINKS.x.url,
} as const;

export const FOUNDER = { name: "Shaswat Raj", campus: "BIT Mesra" } as const;

/** Approved wording (FIX_PLAN Phase 1, item 3). Do not paraphrase. */
export const ANONYMITY_STATEMENT =
  "Anonymous posts never show your name or profile to anyone on CampusLoop, including classmates, seniors, faculty and college staff. Your identity is encrypted separately and can only be recovered by CampusLoop in response to a lawful order or a serious safety report, and every such access is logged.";

export const COMPLIANCE_LINE = "Built to follow India's DPDP Act, 2023.";

export const MATCH_AGE_LINE = "18+ verified students only";
