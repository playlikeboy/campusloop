import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-static";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "public", "sitemap.xsl");
    const content = readFileSync(filePath, "utf-8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/xsl; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch (err) {
    // Fallback if filesystem read is not available in certain edge environments
    const fallbackXsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>CampusLoop XML Sitemap</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; background: #fff; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; }
          th { background: #f8fafc; font-weight: 600; }
          a { color: #4f46e5; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>CampusLoop XML Sitemap</h1>
        <xsl:if test="sitemap:sitemapindex">
          <p>Total sitemaps: <xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/></p>
          <table>
            <thead><tr><th>Sitemap URL</th><th>Last Modified</th></tr></thead>
            <tbody>
              <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                <tr>
                  <td><a><xsl:attribute name="href"><xsl:value-of select="sitemap:loc"/></xsl:attribute><xsl:value-of select="sitemap:loc"/></a></td>
                  <td><xsl:value-of select="sitemap:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </xsl:if>
        <xsl:if test="sitemap:urlset">
          <p>Total URLs: <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></p>
          <table>
            <thead><tr><th>URL</th><th>Changefreq</th><th>Priority</th><th>Last Modified</th></tr></thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td><a><xsl:attribute name="href"><xsl:value-of select="sitemap:loc"/></xsl:attribute><xsl:value-of select="sitemap:loc"/></a></td>
                  <td><xsl:value-of select="sitemap:changefreq"/></td>
                  <td><xsl:value-of select="sitemap:priority"/></td>
                  <td><xsl:value-of select="sitemap:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </xsl:if>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;

    return new NextResponse(fallbackXsl, {
      headers: {
        "Content-Type": "text/xsl; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  }
}
