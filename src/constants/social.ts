/**
 * Official CampusLoop social channels, in display priority order.
 * Single source for every footer, the pitch page and JSON-LD `sameAs`.
 */
export const SOCIAL_LINKS = {
  instagram: {
    url: "https://www.instagram.com/campusloop.space/",
    handle: "@campusloop.space",
    label: "Instagram",
  },
  linkedin: {
    url: "https://www.linkedin.com/company/mycampusloop/",
    handle: "CampusLoop",
    label: "LinkedIn",
  },
  x: {
    url: "https://x.com/mycampusloop",
    handle: "@mycampusloop",
    label: "X",
  },
} as const;

export const SOCIAL_SAME_AS = Object.values(SOCIAL_LINKS).map((s) => s.url);
