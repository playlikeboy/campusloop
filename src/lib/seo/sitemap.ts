import { absoluteUrl } from "./constants";

/**
 * Shared XML builders for /sitemap.xml and /sitemaps/*.xml.
 *
 * Every sitemap route wraps its DB query with `sitemapFromQuery()`: when the
 * database is down or unconfigured the route still answers 200 with valid XML
 * that lists the section's static pages, instead of a 500 or an empty file.
 */

export type SitemapEntry = {
  /** Site path ("/colleges") or absolute URL. */
  path: string;
  lastmod?: Date | string | null;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  images?: { loc: string; title?: string | null }[];
};

/** Escapes the five XML entities so a title or URL with `&` cannot break the file. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

const HEADER =
  '<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';

export function buildUrlset(entries: SitemapEntry[]): string {
  const hasImages = entries.some((e) => e.images?.length);
  const ns = hasImages
    ? 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'
    : 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';

  const body = entries
    .map((e) => {
      const lines = [`    <loc>${escapeXml(absoluteUrl(e.path))}</loc>`];
      const lastmod = isoDate(e.lastmod);
      if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
      if (e.changefreq) lines.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (e.priority !== undefined) lines.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
      for (const img of e.images ?? []) {
        lines.push(
          "    <image:image>",
          `      <image:loc>${escapeXml(absoluteUrl(img.loc))}</image:loc>`,
          ...(img.title ? [`      <image:title>${escapeXml(img.title)}</image:title>`] : []),
          "    </image:image>"
        );
      }
      return `  <url>\n${lines.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `${HEADER}\n<urlset ${ns}>\n${body}${body ? "\n" : ""}</urlset>`;
}

export function buildSitemapIndex(names: string[]): string {
  const body = names
    .map((name) => `  <sitemap>\n    <loc>${absoluteUrl(`/sitemaps/${name}.xml`)}</loc>\n  </sitemap>`)
    .join("\n");
  return `${HEADER}\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
}

export function xmlResponse(xml: string, maxAge = 3600, sMaxAge = maxAge * 4): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${sMaxAge}`,
    },
  });
}

/**
 * Runs `query` and renders `[...staticEntries, ...rows]`. On any error it logs
 * and serves only `staticEntries` with a short cache, so crawlers retry soon.
 */
export async function sitemapFromQuery(
  name: string,
  staticEntries: SitemapEntry[],
  query: () => Promise<SitemapEntry[]>,
  maxAge = 1800
): Promise<Response> {
  try {
    const rows = await query();
    return xmlResponse(buildUrlset([...staticEntries, ...rows]), maxAge);
  } catch (error) {
    console.error(`[sitemap] ${name} fell back to static entries:`, error);
    return xmlResponse(buildUrlset(staticEntries), 300, 600);
  }
}
