import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("Sitemap XSL Stylesheet Route (/sitemap.xsl)", () => {
  it("returns a valid XSL stylesheet with text/xsl header and CampusLoop styling", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("text/xsl");

    const xsl = await res.text();
    expect(xsl).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xsl).toContain('<xsl:stylesheet');
    expect(xsl).toContain("CampusLoop");
    expect(xsl).toContain("sitemapindex");
    expect(xsl).toContain("urlset");
  });
});
