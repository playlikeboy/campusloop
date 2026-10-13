<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>CampusLoop XML Sitemap</title>
        <style>
          :root {
            --bg: #ffffff;
            --surface: #f8fafc;
            --surface-hover: #f1f5f9;
            --border: #e2e8f0;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --primary: #4f46e5;
            --primary-light: #eef2ff;
            --badge-bg: #f1f5f9;
            --badge-text: #475569;
            --accent: #0ea5e9;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #090d16;
              --surface: #111827;
              --surface-hover: #1f2937;
              --border: #1f2937;
              --text-main: #f8fafc;
              --text-muted: #94a3b8;
              --primary: #6366f1;
              --primary-light: #1e1b4b;
              --badge-bg: #1e293b;
              --badge-text: #cbd5e1;
              --accent: #38bdf8;
            }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            line-height: 1.5;
            padding: 2rem 1.5rem;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
          header {
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--border);
          }
          .brand-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 0.75rem;
          }
          .logo {
            font-size: 1.5rem;
            font-weight: 700;
            letter-spacing: -0.025em;
            color: var(--text-main);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }
          .logo-pill {
            background-color: var(--primary);
            color: #ffffff;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.2rem 0.6rem;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .badge {
            background-color: var(--badge-bg);
            color: var(--badge-text);
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.6rem;
            border-radius: 6px;
            display: inline-block;
          }
          .badge.primary {
            background-color: var(--primary-light);
            color: var(--primary);
          }
          h1 {
            font-size: 1.75rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: 0.5rem;
          }
          p.desc {
            color: var(--text-muted);
            font-size: 0.95rem;
          }
          p.desc a {
            color: var(--primary);
            text-decoration: none;
          }
          p.desc a:hover {
            text-decoration: underline;
          }
          .table-container {
            overflow-x: auto;
            border: 1px solid var(--border);
            border-radius: 12px;
            background-color: var(--surface);
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
            text-align: left;
          }
          th {
            background-color: var(--surface);
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            padding: 0.875rem 1rem;
            border-bottom: 1px solid var(--border);
          }
          td {
            padding: 0.875rem 1rem;
            border-bottom: 1px solid var(--border);
            vertical-align: middle;
          }
          tr:last-child td {
            border-bottom: none;
          }
          tr:hover td {
            background-color: var(--surface-hover);
          }
          a.url-link {
            color: var(--primary);
            text-decoration: none;
            word-break: break-all;
            font-weight: 500;
          }
          a.url-link:hover {
            text-decoration: underline;
          }
          .meta-cell {
            white-space: nowrap;
            color: var(--text-muted);
            font-size: 0.8125rem;
          }
          footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
            text-align: center;
            color: var(--text-muted);
            font-size: 0.8125rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <div class="brand-row">
              <a href="https://campusloop.space" class="logo">
                CampusLoop
                <span class="logo-pill">Sitemap</span>
              </a>
              <xsl:if test="sitemap:sitemapindex">
                <span class="badge primary">
                  <xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/> Sitemaps
                </span>
              </xsl:if>
              <xsl:if test="sitemap:urlset">
                <span class="badge primary">
                  <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> Indexed URLs
                </span>
              </xsl:if>
            </div>
            <xsl:choose>
              <xsl:when test="sitemap:sitemapindex">
                <h1>XML Sitemap Index</h1>
                <p class="desc">
                  This sitemap index coordinates all content sections for automated search engine ingestion (Google, Bing, IndexNow).
                  Visit <a href="https://campusloop.space">CampusLoop</a> for the live student platform.
                </p>
              </xsl:when>
              <xsl:otherwise>
                <h1>XML Sitemap</h1>
                <p class="desc">
                  This sitemap lists canonical URLs and indexing metadata for search engines.
                  Return to <a href="https://campusloop.space/sitemap.xml">Sitemap Index</a> or explore <a href="https://campusloop.space">CampusLoop</a>.
                </p>
              </xsl:otherwise>
            </xsl:choose>
          </header>

          <xsl:if test="sitemap:sitemapindex">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th style="width: 60px;">#</th>
                    <th>Sitemap Location</th>
                    <th style="width: 220px;">Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                    <tr>
                      <td class="meta-cell">
                        <xsl:value-of select="position()"/>
                      </td>
                      <td>
                        <a class="url-link">
                          <xsl:attribute name="href">
                            <xsl:value-of select="sitemap:loc"/>
                          </xsl:attribute>
                          <xsl:value-of select="sitemap:loc"/>
                        </a>
                      </td>
                      <td class="meta-cell">
                        <xsl:choose>
                          <xsl:when test="sitemap:lastmod">
                            <xsl:value-of select="sitemap:lastmod"/>
                          </xsl:when>
                          <xsl:otherwise>—</xsl:otherwise>
                        </xsl:choose>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </div>
          </xsl:if>

          <xsl:if test="sitemap:urlset">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px;">#</th>
                    <th>Page URL</th>
                    <th style="width: 90px;">Priority</th>
                    <th style="width: 120px;">Changefreq</th>
                    <th style="width: 80px;">Media</th>
                    <th style="width: 180px;">Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sitemap:urlset/sitemap:url">
                    <tr>
                      <td class="meta-cell">
                        <xsl:value-of select="position()"/>
                      </td>
                      <td>
                        <a class="url-link">
                          <xsl:attribute name="href">
                            <xsl:value-of select="sitemap:loc"/>
                          </xsl:attribute>
                          <xsl:value-of select="sitemap:loc"/>
                        </a>
                      </td>
                      <td>
                        <xsl:choose>
                          <xsl:when test="sitemap:priority">
                            <span class="badge">
                              <xsl:value-of select="sitemap:priority"/>
                            </span>
                          </xsl:when>
                          <xsl:otherwise>—</xsl:otherwise>
                        </xsl:choose>
                      </td>
                      <td>
                        <xsl:choose>
                          <xsl:when test="sitemap:changefreq">
                            <span class="badge">
                              <xsl:value-of select="sitemap:changefreq"/>
                            </span>
                          </xsl:when>
                          <xsl:otherwise>—</xsl:otherwise>
                        </xsl:choose>
                      </td>
                      <td>
                        <xsl:choose>
                          <xsl:when test="image:image">
                            <span class="badge primary">
                              <xsl:value-of select="count(image:image)"/> img
                            </span>
                          </xsl:when>
                          <xsl:otherwise>—</xsl:otherwise>
                        </xsl:choose>
                      </td>
                      <td class="meta-cell">
                        <xsl:choose>
                          <xsl:when test="sitemap:lastmod">
                            <xsl:value-of select="sitemap:lastmod"/>
                          </xsl:when>
                          <xsl:otherwise>—</xsl:otherwise>
                        </xsl:choose>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </div>
          </xsl:if>

          <footer>
            CampusLoop &copy; 2026 &middot; The Verified Student Platform Across 1,350+ Colleges in India
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
