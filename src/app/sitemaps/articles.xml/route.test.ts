import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("Articles Sitemap Route (sitemaps/articles.xml)", () => {
  it("returns a valid XML response with correct canonical URLs and stylesheet", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("application/xml");

    const xml = await res.text();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain("</urlset>");

    // Invariant: Must NEVER leak campsy.app
    expect(xml).not.toContain("https://campsy.app");

    // Must use canonical https://campusloop.space/articles/
    if (xml.includes("<loc>")) {
      expect(xml).toContain("<loc>https://campusloop.space/articles/");
    }
  });
});
