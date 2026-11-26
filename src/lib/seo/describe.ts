/**
 * Helpers that keep page titles and meta descriptions inside the lengths
 * search engines show without cutting them off.
 *
 * - Titles: the layout template adds " · CampusLoop" (13 characters), so a
 *   bare title of 47 characters or less keeps the full title at 60 or less.
 * - Descriptions: 120 to 155 characters. Short source text is padded with
 *   real facts (dates, college, counts) passed by the page, never filler.
 */

export const TITLE_MAX = 47;
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 155;

function squash(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

/** Cuts text at a word boundary so it fits in `max` characters, adding "…" when it had to cut. */
export function clampText(text: string | null | undefined, max: number): string {
  const clean = squash(text);
  if (clean.length <= max) return clean;
  const room = clean.slice(0, max - 1);
  const lastSpace = room.lastIndexOf(" ");
  const endsOnWord = clean[max - 1] === " ";
  const cut = endsOnWord ? room : lastSpace > max * 0.6 ? room.slice(0, lastSpace) : room;
  return `${cut.replace(/[\s,;:.\-–—·|]+$/, "")}…`;
}

/** Bare page title that stays at 60 characters or less once " · CampusLoop" is added. */
export function fitTitle(title: string | null | undefined, max = TITLE_MAX): string {
  return clampText(title, max);
}

function endSentence(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

/**
 * Builds a meta description from the page's own text plus extra facts.
 *
 * `lead` is used first (cut to fit when long). While the result is shorter
 * than `min`, each fact in `facts` is added as its own sentence if it still
 * fits under `max`. Empty facts are skipped.
 */
export function fitDescription(
  lead: string | null | undefined,
  facts: Array<string | null | undefined | false> = [],
  { min = DESCRIPTION_MIN, max = DESCRIPTION_MAX }: { min?: number; max?: number } = {}
): string {
  let out = squash(lead);
  if (out.length > max) return clampText(out, max);

  for (const raw of facts) {
    if (out.length >= min) break;
    const fact = squash(raw || "");
    if (!fact) continue;
    const next = out ? `${endSentence(out)} ${endSentence(fact)}` : endSentence(fact);
    if (next.length <= max) out = next;
  }

  if (!out) return "";
  return out.length > max ? clampText(out, max) : endSentence(out).length <= max ? endSentence(out) : out;
}
