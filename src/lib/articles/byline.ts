/**
 * Who an article is credited to, decided at render time from its category,
 * title and tags. No data is rewritten.
 *
 * Tech and engineering pieces keep their real author. Topics outside that,
 * and money, health or legal topics where a student byline looks out of place,
 * are credited to "CampusLoop Editorial" (an Organization in JSON-LD with its
 * own page at /authors/campusloop-editorial).
 */

export const EDITORIAL_USERNAME = "campusloop-editorial";
export const EDITORIAL_NAME = "CampusLoop Editorial";
export const EDITORIAL_PATH = `/authors/${EDITORIAL_USERNAME}`;
export const EDITORIAL_BIO =
  "The CampusLoop team writes and checks guides on student life, money, health, travel and careers outside tech. We read official sources, link them at the end of each article and update pieces when the facts change.";

/** Categories always shown under the editorial byline. */
export const EDITORIAL_CATEGORIES: ReadonlySet<string> = new Set([
  "HEALTH",
  "FINANCE",
  "SCHOLARSHIPS",
  "RELATIONSHIPS",
  "TRAVEL",
  "FOOD",
  "SPORTS_AND_FITNESS",
  "ENTERTAINMENT",
  "MUSIC_AND_ARTS",
  "BOOKS",
  "MEMES",
  "SUSTAINABILITY",
  "GAMING",
]);

/**
 * Words in a title or tag that mark a health, legal, money or non-tech career
 * topic. Matched as whole words, so "tax" does not match "taxonomy".
 */
const EDITORIAL_TOPIC_WORDS = [
  "nursing",
  "nurse",
  "medical",
  "medicine",
  "mbbs",
  "neet",
  "doctor",
  "pharmacy",
  "pharmacist",
  "dental",
  "physiotherapy",
  "mental health",
  "therapy",
  "diet",
  "nutrition",
  "law school",
  "law degree",
  "llb",
  "clat",
  "lawyer",
  "chartered accountant",
  "ca foundation",
  "upsc",
  "ias",
  "ssc",
  "bank po",
  "banking",
  "loan",
  "loans",
  "tax",
  "taxes",
  "itr",
  "mutual fund",
  "mutual funds",
  "stock market",
  "insurance",
  "investing",
  "investment",
  "hotel management",
  "fashion design",
  "aviation",
  "pilot",
  "b.ed",
];

/**
 * Whole-word pattern over EDITORIAL_TOPIC_WORDS. Written so it means the same in
 * JavaScript and in Postgres `~*`, which lets hub pages filter in SQL.
 */
export const EDITORIAL_TOPIC_PATTERN = `(^|[^a-z0-9])(${EDITORIAL_TOPIC_WORDS.map((w) =>
  w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
).join("|")})($|[^a-z0-9])`;

const TOPIC_RE = new RegExp(EDITORIAL_TOPIC_PATTERN, "i");

export type Byline =
  | { kind: "person"; name: string; username: string | null; path: string | null }
  | { kind: "organization"; name: string; username: string; path: string };

export function isEditorialTopic(input: { category?: string | null; title?: string | null; tags?: string[] | null }): boolean {
  if (input.category && EDITORIAL_CATEGORIES.has(input.category.toUpperCase())) return true;
  const text = [input.title ?? "", ...(input.tags ?? []).map((t) => t.replace(/^#/, "").replace(/-/g, " "))].join(" | ");
  return TOPIC_RE.test(text);
}

export function articleByline(input: {
  category?: string | null;
  title?: string | null;
  tags?: string[] | null;
  author?: { displayName?: string | null; username?: string | null } | null;
}): Byline {
  if (isEditorialTopic(input)) {
    return { kind: "organization", name: EDITORIAL_NAME, username: EDITORIAL_USERNAME, path: EDITORIAL_PATH };
  }
  const username = input.author?.username ?? null;
  return {
    kind: "person",
    name: input.author?.displayName || (username ? `@${username}` : "CampusLoop member"),
    username,
    path: username ? `/authors/${username}` : null,
  };
}
