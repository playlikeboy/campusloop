import { NextResponse } from "next/server";

// Only surfaces that are public, indexable and non-anonymous belong here.
// Profiles, comments and reels are deliberately absent: profiles are noindex,
// comments inherit their post's visibility, and /reels redirects to the feed.
const SITEMAPS = ["static", "colleges", "posts", "communities", "articles", "events", "academics"];

export async function GET() {
  const entries = SITEMAPS.map(
    (name) => `
  <sitemap>
    <loc>https://campusloop.space/sitemaps/${name}.xml</loc>
  </sitemap>`
  ).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=18000",
    },
  });
}
