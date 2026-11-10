import { getDocsSlugs } from "@/lib/docs-features";
import { GUIDES } from "@/lib/guide";
import { buildUrlset, type SitemapEntry, xmlResponse } from "@/lib/seo/sitemap";

/** Hand-maintained public pages. Needs no database, so it never fails. */
const PAGES: SitemapEntry[] = [
  { path: "/", priority: 1.0, changefreq: "daily" },
  { path: "/colleges", priority: 0.9, changefreq: "daily" },
  { path: "/academics", priority: 0.9, changefreq: "daily" },
  { path: "/academics/study-material/sources", priority: 0.8, changefreq: "daily" },
  { path: "/courses", priority: 0.9, changefreq: "daily" },
  { path: "/articles", priority: 0.8, changefreq: "daily" },
  { path: "/events", priority: 0.8, changefreq: "daily" },
  { path: "/communities", priority: 0.8, changefreq: "daily" },
  { path: "/guide", priority: 0.8, changefreq: "weekly" },
  ...GUIDES.map((g): SitemapEntry => ({ path: `/guide/${g.slug}`, priority: 0.7, changefreq: "monthly" })),
  { path: "/docs", priority: 0.7, changefreq: "weekly" },
  ...getDocsSlugs().map(
    (slug): SitemapEntry => ({ path: `/docs/${slug}`, priority: 0.6, changefreq: "monthly" })
  ),
  { path: "/developers", priority: 0.6, changefreq: "weekly" },
  { path: "/developers/SKILL.md", priority: 0.4, changefreq: "monthly" },
  { path: "/about", priority: 0.7, changefreq: "monthly" },
  { path: "/safety", priority: 0.7, changefreq: "monthly" },
  { path: "/help", priority: 0.7, changefreq: "weekly" },
  { path: "/contact", priority: 0.5, changefreq: "monthly" },
  { path: "/investors", priority: 0.5, changefreq: "monthly" },
  { path: "/pitch", priority: 0.5, changefreq: "monthly" },
  { path: "/sitemap", priority: 0.4, changefreq: "weekly" },
  { path: "/privacy", priority: 0.3, changefreq: "yearly" },
  { path: "/terms", priority: 0.3, changefreq: "yearly" },
];

export function GET() {
  return xmlResponse(buildUrlset(PAGES), 86400, 604800);
}
