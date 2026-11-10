/**
 * Landing page copy. Every claim here must be true of the product today;
 * live counts come from getPublicStats() and are never written as literals.
 */

export const SITE_URL = "https://campusloop.space";

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/campusloop.space/",
  linkedin: "https://www.linkedin.com/company/mycampusloop/",
  x: "https://x.com/mycampusloop",
} as const;

export const FOUNDER = { name: "Shaswat Raj", campus: "BIT Mesra" } as const;

/** Approved wording (FIX_PLAN Phase 1, item 3). Do not paraphrase. */
export const ANONYMITY_STATEMENT =
  "Anonymous posts never show your name or profile to anyone on CampusLoop, including classmates, seniors, faculty and college staff. Your identity is encrypted separately and can only be recovered by CampusLoop in response to a lawful order or a serious safety report, and every such access is logged.";

export const COMPLIANCE_LINE = "Built to follow India's DPDP Act, 2023.";

export const MATCH_AGE_LINE = "18+ verified students only";
