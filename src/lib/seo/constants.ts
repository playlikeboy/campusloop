/** Site-wide SEO constants shared by metadata, JSON-LD, sitemaps and feeds. */

export const SITE_URL = "https://campusloop.space";
export const SITE_NAME = "CampusLoop";
export const TITLE_TEMPLATE = `%s · ${SITE_NAME}`;
export const SITE_DESCRIPTION =
  "CampusLoop is a social app for Indian college students. Sign up with your college email to post, chat, join clubs, find events and share notes with people on your campus.";
export const TWITTER_HANDLE = "@mycampusloop";
export const SITE_LOCALE = "en_IN";

/** Static fallback share image. Regenerate with scripts/brand-assets/render.mjs. */
export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
  height: 630,
  alt: "CampusLoop, the social app for college students",
} as const;

/** Turns "/safety", "safety" or a full URL into an absolute campusloop.space URL. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? SITE_URL : `${SITE_URL}${clean}`;
}
