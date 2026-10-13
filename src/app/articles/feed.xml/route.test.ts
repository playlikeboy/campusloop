import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("Articles RSS Feed Route (articles/feed.xml)", () => {
  it("returns a valid RSS 2.0 response with canonical campusloop.space links and no campsy.app", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("application/xml");

    const xml = await res.text();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<title>CampusLoop Articles</title>");
    expect(xml).toContain("<link>https://campusloop.space/articles</link>");

    // Invariant: Must NEVER leak campsy.app
    expect(xml).not.toContain("https://campsy.app");

    if (xml.includes("<item>")) {
      expect(xml).toContain("<link>https://campusloop.space/articles/");
    }
  });
});
