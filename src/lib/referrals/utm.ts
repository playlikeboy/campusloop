/** Campaign tags on inbound links, e.g. `/ig?utm_source=instagram&utm_campaign=reel-12`. */

export interface UtmTags {
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
}

const clean = (value: string | null | undefined) =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

/** Reads UTM tags from a query string. Null when there is no `utm_source`. */
export function parseUtm(params: { get(name: string): string | null }): UtmTags | null {
  const source = clean(params.get("utm_source"));
  if (!source) return null;
  const tags: UtmTags = { source };
  const medium = clean(params.get("utm_medium"));
  const campaign = clean(params.get("utm_campaign"));
  const content = clean(params.get("utm_content"));
  if (medium) tags.medium = medium;
  if (campaign) tags.campaign = campaign;
  if (content) tags.content = content;
  return tags;
}

/**
 * The value stored in `link_clicks.ref_code` for a campaign click:
 * `utm:<source>/<medium>/<campaign>/<content>`, with `-` for a missing part.
 * The `utm:` prefix keeps it apart from invite usernames and short-link slugs.
 */
export function utmRefCode(tags: UtmTags): string {
  const parts = [tags.source, tags.medium, tags.campaign, tags.content].map((part) => part || "-");
  while (parts.length > 1 && parts[parts.length - 1] === "-") parts.pop();
  return `utm:${parts.join("/")}`.slice(0, 128);
}

export const isUtmRefCode = (code: string) => code.startsWith("utm:");
