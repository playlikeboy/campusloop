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

export const LANDING_FAQS: ReadonlyArray<readonly [string, string]> = [
  [
    "Who can join CampusLoop?",
    "CampusLoop is for college students. Sign up with your institutional email or use the supported student-ID verification flow.",
  ],
  [
    "Can classmates or faculty see my anonymous posts?",
    ANONYMITY_STATEMENT,
  ],
  [
    "Is the Academic Vault free?",
    "Students can browse and access available peer-shared notes and previous-year question papers without a paywall.",
  ],
  [
    "Are the courses really free?",
    "Yes. Every course is free to watch, including Harvard CS50, MIT, Stanford and NPTEL courses and playlists from educators like CodeWithHarry and Gate Smashers. Sign in to save progress and earn a certificate.",
  ],
  [
    "Do I get a certificate?",
    "Yes. Finish every lecture of a course and you get a CampusLoop certificate with a public link you can add to LinkedIn. It is issued by CampusLoop, not by the university or creator.",
  ],
  [
    "What if my college isn't listed?",
    "Search the college directory, and if your campus isn't there yet, request a hub for your institution.",
  ],
];

/** Facts restated from /safety; change them there first. */
export const SAFETY_ROWS: ReadonlyArray<readonly [string, string]> = [
  ["Report in one tap", "Every post, story, confession and comment carries a report control."],
  ["Three reports quarantine", "Three independent reports pull content from the feed while a human reviews it, within 24 hours."],
  ["Filters catch personal details", "Phone numbers, room numbers with roll numbers and personal emails are flagged before they post."],
  ["Ragging ends the account", "Online or off, a substantiated case means a permanent ban and a report to your college's Anti-Ragging Committee."],
];
