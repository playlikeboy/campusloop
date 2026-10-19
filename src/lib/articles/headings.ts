/**
 * Heading anchors shared by the article renderer (ids) and the table of
 * contents (links). Both walk the document in order with the same dedupe rule,
 * so links always match.
 */

export function slugifyHeading(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[*_`~[\]()]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "section"
  );
}

export class HeadingIds {
  private seen = new Map<string, number>();
  next(text: string): string {
    const base = slugifyHeading(text);
    const n = this.seen.get(base) ?? 0;
    this.seen.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  }
}

export interface ArticleHeading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

export function extractHeadings(markdown: string): ArticleHeading[] {
  const ids = new HeadingIds();
  const out: ArticleHeading[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    const t = line.trim();
    if (t.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = t.match(/^(#{1,3})\s+(.*)$/);
    if (m) {
      const text = m[2].replace(/[*_`~]/g, "").trim();
      out.push({ id: ids.next(m[2]), text, level: m[1].length as 1 | 2 | 3 });
    }
  }
  return out;
}
