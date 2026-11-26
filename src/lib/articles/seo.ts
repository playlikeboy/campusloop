import type { Metadata } from "next";
import { articlePlainText } from "./text";

/**
 * Search-engine rules for articles, kept pure so they are unit tested.
 *
 * `seo_status` and `redirect_to_slug` are written by
 * `scripts/articles/audit-articles.ts --apply` after a human reviews the report.
 */

export type ArticleSeoFields = {
  slug: string;
  status: string;
  seoStatus?: string | null;
  redirectToSlug?: string | null;
};

/** Meta descriptions longer than this get cut on a word boundary. */
export const META_DESCRIPTION_MAX = 155;

/** Cuts `text` to at most `max` characters without breaking a word, adding "…" when cut. */
export function clampDescription(text: string, max = META_DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, " ").replace(/\.{3}$/, "").trim();
  if (clean.length <= max) return clean;
  const room = clean.slice(0, max - 1);
  const lastSpace = room.lastIndexOf(" ");
  const cut = (lastSpace > max * 0.6 ? room.slice(0, lastSpace) : room).replace(/[\s,;:.\-–—]+$/, "");
  return `${cut}…`;
}

/** Target slug for a 308, or null. Ignores self-redirects so a bad row cannot loop. */
export function articleRedirectTarget(article: ArticleSeoFields): string | null {
  const target = article.redirectToSlug?.trim();
  if (!target || target === article.slug) return null;
  return target;
}

/** True when the article belongs in sitemaps, IndexNow pings and hub listings for crawlers. */
export function isArticleIndexable(article: ArticleSeoFields): boolean {
  return (
    article.status === "PUBLISHED" &&
    (article.seoStatus ?? "index") !== "noindex" &&
    articleRedirectTarget(article) === null
  );
}

/**
 * Robots for a published article. Indexable articles allow large image
 * previews (Google Discover); noindex articles still pass link equity.
 */
export function articleRobots(seoStatus?: string | null): NonNullable<Metadata["robots"]> {
  if (seoStatus === "noindex") {
    return { index: false, follow: true, googleBot: { index: false, follow: true } };
  }
  return {
    index: true,
    follow: true,
    "max-image-preview": "large",
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  };
}

export function articleWordCount(content: string): number {
  return articlePlainText(content).split(/\s+/).filter(Boolean).length;
}

/**
 * Splits Markdown just before the third `## ` heading, so a box can sit at the
 * end of the second section. Returns null when there are fewer than three h2s.
 * Headings inside fenced blocks are ignored.
 */
export function splitAfterSecondSection(markdown: string): [string, string] | null {
  const lines = markdown.split("\n");
  let inFence = false;
  let h2 = 0;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^##\s+\S/.test(t)) {
      h2++;
      if (h2 === 3) {
        return [lines.slice(0, i).join("\n"), lines.slice(i).join("\n")];
      }
    }
  }
  return null;
}

export const ARTICLE_CATEGORY_PAGE_SIZE = 24;

/** Canonical path of a category hub page. Page 1 has no /page/1 suffix. */
export function categoryPagePath(categorySlug: string, page = 1): string {
  return page <= 1 ? `/articles/category/${categorySlug}` : `/articles/category/${categorySlug}/page/${page}`;
}

/** Canonical path of an author page. Page 1 has no /page/1 suffix. */
export function authorPagePath(username: string, page = 1): string {
  return page <= 1 ? `/authors/${username}` : `/authors/${username}/page/${page}`;
}

/** Parses a /page/[n] segment. Returns null for anything that is not an integer ≥ 2. */
export function parsePageParam(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 2 && n <= 10_000 ? n : null;
}
