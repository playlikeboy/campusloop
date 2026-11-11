import { buildSitemapIndex, xmlResponse } from "@/lib/seo/sitemap";
import { withSitemapCache } from "@/app/sitemaps/cache-headers";

// Only surfaces that are public, indexable and non-anonymous belong here.
// Profiles, comments and reels are deliberately absent: profiles are noindex,
// comments inherit their post's visibility, and /reels redirects to the feed.
const SITEMAPS = ["static", "colleges", "posts", "communities", "articles", "events", "academics"];

export function GET() {
  return withSitemapCache(xmlResponse(buildSitemapIndex(SITEMAPS), 3600, 18000));
}
